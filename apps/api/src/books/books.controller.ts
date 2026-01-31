// BooksController - HTTP isteklerini karşılar

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { BooksService } from './books.service';
import { AdminGuard } from '../auth/admin.guard';
import { AuthGuard } from '../auth/auth.guard';
import { AuditService, AuditAction } from '../audit/audit.service';
import { CreateBookDto, UpdateBookDto } from './dto/book.dto';

@Controller('books')
export class BooksController {
  constructor(
    private booksService: BooksService,
    private auditService: AuditService,
  ) {}

  // GET /api/books/public → Herkes için (varsayılan okul kitapları - ana sayfa için)
  @Get('public')
  async findPublic() {
    return this.booksService.findPublic();
  }

  // GET /api/books → Giriş yapmış kullanıcılar (kendi okullarının kitapları)
  @Get()
  @UseGuards(AuthGuard)
  findAll(@Request() req: any, @Query('categoryId') categoryId?: string) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    return this.booksService.findAll(schoolId, categoryId);
  }

  // GET /api/books/search → Gelişmiş arama ve filtreleme
  @Get('search')
  @UseGuards(AuthGuard)
  async search(
    @Request() req: any,
    @Query('q') query?: string,
    @Query('categoryId') categoryId?: string,
    @Query('available') available?: string,
    @Query('sortBy') sortBy?: 'title' | 'author' | 'createdAt' | 'popular',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }

    return this.booksService.search(schoolId, {
      query,
      categoryId,
      available: available === 'true' ? true : available === 'false' ? false : undefined,
      sortBy,
      sortOrder,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  // GET /api/books/:id → Giriş yapmış kullanıcılar
  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string, @Request() req: any) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    return this.booksService.findOne(id, schoolId);
  }

  // POST /api/books → Sadece admin
  @Post()
  @UseGuards(AdminGuard)
  async create(@Request() req: any, @Body() data: CreateBookDto) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }

    const book = await this.booksService.create(schoolId, data);

    // Audit log
    await this.auditService.logSuccess(AuditAction.BOOK_CREATE, {
      userId: req.user?.id,
      userEmail: req.user?.email,
      schoolId,
      resourceType: 'Book',
      resourceId: book.id,
      details: { title: data.title, author: data.author },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return book;
  }

  // PUT /api/books/:id → Sadece admin
  @Put(':id')
  @UseGuards(AdminGuard)
  async update(@Param('id') id: string, @Request() req: any, @Body() data: UpdateBookDto) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }

    const book = await this.booksService.update(id, schoolId, data);

    // Audit log
    await this.auditService.logSuccess(AuditAction.BOOK_UPDATE, {
      userId: req.user?.id,
      userEmail: req.user?.email,
      schoolId,
      resourceType: 'Book',
      resourceId: id,
      details: { updatedFields: Object.keys(data) },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return book;
  }

  // DELETE /api/books/:id → Sadece admin
  @Delete(':id')
  @UseGuards(AdminGuard)
  async remove(@Param('id') id: string, @Request() req: any) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }

    // Önce kitap bilgisini al (log için)
    const book = await this.booksService.findOne(id, schoolId);
    const result = await this.booksService.remove(id, schoolId);

    // Audit log
    await this.auditService.logSuccess(AuditAction.BOOK_DELETE, {
      userId: req.user?.id,
      userEmail: req.user?.email,
      schoolId,
      resourceType: 'Book',
      resourceId: id,
      details: { title: book?.title, author: book?.author },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return result;
  }

  // POST /api/books/bulk-delete → Toplu kitap sil (Admin)
  @Post('bulk-delete')
  @UseGuards(AdminGuard)
  async bulkDelete(@Request() req: any, @Body() data: { bookIds: string[] }) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }

    if (!data.bookIds || data.bookIds.length === 0) {
      throw new BadRequestException('Silinecek kitap ID\'leri gerekli');
    }

    const results = await this.booksService.bulkDelete(schoolId, data.bookIds);

    // Audit log
    await this.auditService.logSuccess(AuditAction.BOOK_DELETE, {
      userId: req.user?.id,
      userEmail: req.user?.email,
      schoolId,
      resourceType: 'Book',
      details: {
        action: 'bulk_delete',
        totalBooks: data.bookIds.length,
        success: results.success,
        failed: results.failed,
      },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return results;
  }

  // POST /api/books/import-csv → CSV ile toplu kitap ekle (Admin)
  @Post('import-csv')
  @UseGuards(AdminGuard)
  async importCSV(@Request() req: any, @Body() data: { csvContent: string }) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }

    if (!data.csvContent) {
      throw new BadRequestException('CSV içeriği gerekli');
    }

    // CSV'yi parse et
    const books = this.booksService.parseCSV(data.csvContent);

    if (books.length === 0) {
      throw new BadRequestException('CSV dosyasında geçerli kitap bulunamadı');
    }

    // Toplu ekle
    const results = await this.booksService.bulkCreate(schoolId, books);

    // Audit log
    await this.auditService.logSuccess(AuditAction.BOOK_CREATE, {
      userId: req.user?.id,
      userEmail: req.user?.email,
      schoolId,
      resourceType: 'Book',
      details: {
        action: 'bulk_import',
        totalBooks: books.length,
        success: results.success,
        failed: results.failed,
      },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return results;
  }

  // GET /api/books/import-template → CSV şablonu indir
  @Get('import-template')
  @UseGuards(AdminGuard)
  getImportTemplate() {
    const template = `title,author,isbn,description,quantity,category
"Sefiller","Victor Hugo","9789750719387","Victor Hugo'nun ünlü eseri",3,roman
"1984","George Orwell","9789750718533","Distopik roman",2,roman
"Kürk Mantolu Madonna","Sabahattin Ali","","Türk edebiyatının klasiği",5,roman`;

    return {
      template,
      instructions: {
        required: ['title (başlık)', 'author (yazar)'],
        optional: ['isbn', 'description (açıklama)', 'quantity (adet, varsayılan: 1)', 'category (kategori slug)'],
        notes: [
          'İlk satır başlık satırıdır',
          'Virgül içeren değerleri tırnak içine alın',
          'Kategori, sistemde tanımlı kategori slug\'ı olmalıdır',
        ],
      },
    };
  }
}
