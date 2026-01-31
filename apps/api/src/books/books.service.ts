// BooksService - Kitaplarla ilgili iş mantığı

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// CSV Import Limitleri
const CSV_MAX_ROWS = 1000;
const CSV_MAX_SIZE = 1024 * 1024; // 1MB
const MAX_FIELD_LENGTH = 1000;

@Injectable()
export class BooksService {
  constructor(private prisma: PrismaService) {}

  // XSS koruması için HTML karakterlerini escape et
  private sanitizeString(str: string | undefined): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .slice(0, MAX_FIELD_LENGTH) // Maksimum uzunluk limiti
      .trim();
  }

  // ISBN formatını doğrula
  private validateISBN(isbn: string | undefined): string | undefined {
    if (!isbn) return undefined;
    // Sadece rakam, tire ve X karakterlerine izin ver
    const cleaned = isbn.replace(/[^0-9Xx-]/g, '').slice(0, 20);
    return cleaned || undefined;
  }

  // Public kitaplar - ana sayfa için (tüm aktif okullardan örnek kitaplar)
  async findPublic() {
    return this.prisma.book.findMany({
      where: {
        school: { isActive: true },
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  // Tüm kitapları getir (kategori bilgisiyle) - schoolId ile filtreleme
  async findAll(schoolId: string, categoryId?: string) {
    return this.prisma.book.findMany({
      where: {
        schoolId,
        ...(categoryId && { categoryId }),
      },
      include: { category: true },
      orderBy: { title: 'asc' },
    });
  }

  // Gelişmiş arama ve filtreleme (optimize edilmiş)
  async search(schoolId: string, params: {
    query?: string;
    categoryId?: string;
    available?: boolean;
    sortBy?: 'title' | 'author' | 'createdAt' | 'popular';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const { query, categoryId, available, sortBy = 'title', sortOrder = 'asc', page = 1, limit = 20 } = params;

    // Limit kontrolü (max 100)
    const safeLimit = Math.min(Math.max(1, limit), 100);

    // Where koşulları
    const where: any = { schoolId };

    // Metin araması - optimize edilmiş
    if (query && query.trim()) {
      const searchTerm = query.trim();

      // Kısa sorgular için sadece başlık ve yazar ara (daha hızlı)
      if (searchTerm.length <= 3) {
        where.OR = [
          { title: { startsWith: searchTerm, mode: 'insensitive' } },
          { author: { startsWith: searchTerm, mode: 'insensitive' } },
        ];
      } else {
        // Uzun sorgular için tam arama
        where.OR = [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { author: { contains: searchTerm, mode: 'insensitive' } },
          { isbn: { contains: searchTerm, mode: 'insensitive' } },
        ];

        // Açıklama araması sadece 5+ karakterlik sorgularda (performans için)
        if (searchTerm.length >= 5) {
          where.OR.push({ description: { contains: searchTerm, mode: 'insensitive' } });
        }
      }
    }

    // Kategori filtresi
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Müsaitlik filtresi
    if (available === true) {
      where.available = { gt: 0 };
    } else if (available === false) {
      where.available = 0;
    }

    // Sıralama
    let orderBy: any;
    if (sortBy === 'popular') {
      // Popülerlik için loan sayısına göre sırala
      orderBy = { loans: { _count: sortOrder } };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    // Pagination
    const skip = (page - 1) * safeLimit;

    // Toplam sayı ve kitapları paralel çek
    const [total, books] = await Promise.all([
      this.prisma.book.count({ where }),
      this.prisma.book.findMany({
        where,
        include: {
          category: true,
          _count: { select: { loans: true } }
        },
        orderBy,
        skip,
        take: safeLimit,
      }),
    ]);

    return {
      books,
      pagination: {
        page,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  // Tek bir kitap getir (kategori bilgisiyle) - schoolId kontrolü
  async findOne(id: string, schoolId: string) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!book || book.schoolId !== schoolId) {
      throw new NotFoundException('Kitap bulunamadı');
    }

    return book;
  }

  // Yeni kitap ekle - schoolId ile (sanitized)
  async create(schoolId: string, data: { title: string; author: string; isbn?: string; description?: string; quantity?: number; categoryId?: string; coverImage?: string }) {
    const quantity = Math.min(Math.max(1, data.quantity || 1), 9999);
    return this.prisma.book.create({
      data: {
        title: this.sanitizeString(data.title),
        author: this.sanitizeString(data.author),
        isbn: this.validateISBN(data.isbn),
        description: this.sanitizeString(data.description),
        quantity: quantity,
        available: quantity,
        categoryId: data.categoryId,
        coverImage: data.coverImage,
        schoolId: schoolId,
      },
      include: { category: true },
    });
  }

  // Kitap güncelle - schoolId kontrolü
  async update(id: string, schoolId: string, data: { title?: string; author?: string; isbn?: string; description?: string; quantity?: number; categoryId?: string; coverImage?: string }) {
    const book = await this.prisma.book.findUnique({ where: { id } });

    if (!book || book.schoolId !== schoolId) {
      throw new NotFoundException('Kitap bulunamadı');
    }

    // Eğer quantity değişiyorsa, available'ı da güncelle
    let updateData: any = { ...data };
    if (data.quantity !== undefined) {
      const diff = data.quantity - book.quantity;
      updateData.available = Math.max(0, book.available + diff);
    }

    return this.prisma.book.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });
  }

  // Kitap sil - schoolId kontrolü
  async remove(id: string, schoolId: string) {
    const book = await this.prisma.book.findUnique({ where: { id } });

    if (!book || book.schoolId !== schoolId) {
      throw new NotFoundException('Kitap bulunamadı');
    }

    // Önce aktif ödünç var mı kontrol et
    const activeLoans = await this.prisma.loan.count({
      where: {
        bookId: id,
        status: 'ACTIVE',
      },
    });

    if (activeLoans > 0) {
      throw new BadRequestException('Bu kitabın aktif ödünçleri var, silinemez');
    }

    return this.prisma.book.delete({
      where: { id },
    });
  }

  // Toplu kitap ekle (CSV import) - Transaction ile
  async bulkCreate(schoolId: string, books: Array<{
    title: string;
    author: string;
    isbn?: string;
    description?: string;
    quantity?: number;
    categorySlug?: string;
  }>) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Kategorileri önceden yükle (slug -> id mapping)
    const categories = await this.prisma.category.findMany({
      where: { schoolId },
      select: { id: true, slug: true },
    });
    const categoryMap = new Map(categories.map(c => [c.slug, c.id]));

    // Geçerli kitapları filtrele ve hazırla
    const validBooks: Array<{
      title: string;
      author: string;
      isbn: string | null;
      description?: string;
      quantity: number;
      available: number;
      categoryId?: string;
      schoolId: string;
    }> = [];

    // Mevcut ISBN'leri kontrol et
    const isbns = books.filter(b => b.isbn).map(b => b.isbn!.trim());
    const existingBooks = await this.prisma.book.findMany({
      where: { isbn: { in: isbns } },
      select: { isbn: true },
    });
    const existingIsbns = new Set(existingBooks.map(b => b.isbn));

    for (const bookData of books) {
      // Validasyon
      if (!bookData.title || !bookData.author) {
        results.failed++;
        results.errors.push(`Başlık veya yazar eksik: ${bookData.title || 'Bilinmeyen'}`);
        continue;
      }

      // ISBN kontrolü
      if (bookData.isbn && existingIsbns.has(bookData.isbn.trim())) {
        results.failed++;
        results.errors.push(`ISBN zaten mevcut: ${bookData.isbn}`);
        continue;
      }

      // Kategori ID'sini bul
      let categoryId: string | undefined;
      if (bookData.categorySlug) {
        categoryId = categoryMap.get(bookData.categorySlug);
        if (!categoryId) {
          results.errors.push(`Kategori bulunamadı: ${bookData.categorySlug} (kitap kategorisiz eklendi)`);
        }
      }

      const quantity = bookData.quantity || 1;

      validBooks.push({
        title: bookData.title.trim(),
        author: bookData.author.trim(),
        isbn: bookData.isbn?.trim() || null,
        description: bookData.description?.trim(),
        quantity,
        available: quantity,
        categoryId,
        schoolId,
      });
    }

    // Transaction ile toplu ekleme
    if (validBooks.length > 0) {
      try {
        await this.prisma.$transaction(async (tx) => {
          for (const book of validBooks) {
            await tx.book.create({ data: book });
            results.success++;
          }
        }, {
          timeout: 30000, // 30 saniye timeout
        });
      } catch (error: any) {
        // Transaction başarısız - tüm validBooks başarısız sayılır
        results.success = 0;
        results.failed += validBooks.length;
        results.errors.push(`Transaction hatası: ${error.message}`);
      }
    }

    return results;
  }

  // CSV parse et (güvenlik kontrolleri ile)
  parseCSV(csvContent: string): Array<{
    title: string;
    author: string;
    isbn?: string;
    description?: string;
    quantity?: number;
    categorySlug?: string;
  }> {
    // Boyut kontrolü (DoS koruması)
    if (csvContent.length > CSV_MAX_SIZE) {
      throw new BadRequestException(`CSV dosyası çok büyük. Maksimum ${CSV_MAX_SIZE / 1024}KB`);
    }

    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new BadRequestException('CSV dosyası en az bir başlık satırı ve bir veri satırı içermelidir');
    }

    // Satır sayısı kontrolü
    if (lines.length > CSV_MAX_ROWS + 1) {
      throw new BadRequestException(`CSV dosyası çok fazla satır içeriyor. Maksimum ${CSV_MAX_ROWS} kitap`);
    }

    // Başlık satırını parse et
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const titleIndex = headers.findIndex(h => h === 'title' || h === 'başlık' || h === 'kitap adı');
    const authorIndex = headers.findIndex(h => h === 'author' || h === 'yazar');
    const isbnIndex = headers.findIndex(h => h === 'isbn');
    const descriptionIndex = headers.findIndex(h => h === 'description' || h === 'açıklama');
    const quantityIndex = headers.findIndex(h => h === 'quantity' || h === 'adet' || h === 'miktar');
    const categoryIndex = headers.findIndex(h => h === 'category' || h === 'kategori');

    if (titleIndex === -1 || authorIndex === -1) {
      throw new BadRequestException('CSV dosyasında "title/başlık" ve "author/yazar" sütunları zorunludur');
    }

    const books = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      // XSS koruması ile sanitize edilmiş değerler
      const quantity = quantityIndex !== -1 ? parseInt(values[quantityIndex]) || 1 : 1;

      books.push({
        title: this.sanitizeString(values[titleIndex]),
        author: this.sanitizeString(values[authorIndex]),
        isbn: this.validateISBN(values[isbnIndex]),
        description: this.sanitizeString(values[descriptionIndex]),
        quantity: Math.min(Math.max(1, quantity), 9999), // 1-9999 arası
        categorySlug: this.sanitizeString(values[categoryIndex])?.toLowerCase(),
      });
    }

    return books;
  }

  // CSV satırını parse et (tırnak içindeki virgülleri koruyarak)
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  // Toplu kitap sil - Transaction ile
  async bulkDelete(schoolId: string, bookIds: string[]) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Önce silinebilecek kitapları kontrol et
    const booksToDelete: string[] = [];

    for (const bookId of bookIds) {
      const book = await this.prisma.book.findUnique({ where: { id: bookId } });

      if (!book || book.schoolId !== schoolId) {
        results.failed++;
        results.errors.push(`Kitap bulunamadı: ${bookId}`);
        continue;
      }

      // Aktif ödünç kontrolü
      const activeLoans = await this.prisma.loan.count({
        where: { bookId, status: 'ACTIVE' },
      });

      if (activeLoans > 0) {
        results.failed++;
        results.errors.push(`Aktif ödünçleri var: ${book.title}`);
        continue;
      }

      booksToDelete.push(bookId);
    }

    // Transaction ile toplu silme
    if (booksToDelete.length > 0) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // Önce ilişkili kayıtları sil
          await tx.favorite.deleteMany({ where: { bookId: { in: booksToDelete } } });
          await tx.review.deleteMany({ where: { bookId: { in: booksToDelete } } });
          await tx.reservation.deleteMany({ where: { bookId: { in: booksToDelete } } });

          // Sonra kitapları sil
          await tx.book.deleteMany({ where: { id: { in: booksToDelete } } });

          results.success = booksToDelete.length;
        }, {
          timeout: 30000, // 30 saniye timeout
        });
      } catch (error: any) {
        results.success = 0;
        results.failed += booksToDelete.length;
        results.errors.push(`Transaction hatası: ${error.message}`);
      }
    }

    return results;
  }
}
