// StatsService - İstatistik ve raporlar

import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  // Dashboard istatistikleri - schoolId ile filtreleme
  async getDashboardStats(schoolId: string) {
    const [
      totalBooks,
      totalMembers,
      activeLoans,
      overdueLoans,
      totalLoansThisMonth,
      totalLoansThisWeek,
    ] = await Promise.all([
      this.prisma.book.count({ where: { schoolId } }),
      this.prisma.user.count({ where: { schoolId, role: 'MEMBER', status: 'APPROVED' } }),
      this.prisma.loan.count({ where: { schoolId, status: 'ACTIVE' } }),
      this.prisma.loan.count({
        where: {
          schoolId,
          status: 'ACTIVE',
          dueDate: { lt: new Date() },
        },
      }),
      this.prisma.loan.count({
        where: {
          schoolId,
          borrowedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      this.prisma.loan.count({
        where: {
          schoolId,
          borrowedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Toplam kitap adedi
    const bookQuantity = await this.prisma.book.aggregate({
      where: { schoolId },
      _sum: { quantity: true },
    });

    return {
      totalBooks,
      totalBookQuantity: bookQuantity._sum.quantity || 0,
      totalMembers,
      activeLoans,
      overdueLoans,
      totalLoansThisMonth,
      totalLoansThisWeek,
    };
  }

  // Gecikmiş ödünçler - schoolId ile filtreleme
  async getOverdueLoans(schoolId: string) {
    const overdueLoans = await this.prisma.loan.findMany({
      where: {
        schoolId,
        status: 'ACTIVE',
        dueDate: { lt: new Date() },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        book: {
          select: { id: true, title: true, author: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Gecikme gün sayısını hesapla
    return overdueLoans.map((loan) => ({
      ...loan,
      daysOverdue: Math.floor(
        (Date.now() - new Date(loan.dueDate).getTime()) / (1000 * 60 * 60 * 24),
      ),
    }));
  }

  // Son aktiviteler - schoolId ile filtreleme
  async getRecentActivities(schoolId: string, limit = 20) {
    return this.prisma.loan.findMany({
      where: { schoolId },
      take: limit,
      orderBy: { borrowedAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        book: {
          select: { id: true, title: true, author: true },
        },
      },
    });
  }

  // En çok ödünç alınan kitaplar - schoolId ile filtreleme
  async getPopularBooks(schoolId: string, limit = 10) {
    const bookLoans = await this.prisma.loan.groupBy({
      by: ['bookId'],
      where: { schoolId },
      _count: { bookId: true },
      orderBy: { _count: { bookId: 'desc' } },
      take: limit,
    });

    const bookIds = bookLoans.map((b) => b.bookId);
    const books = await this.prisma.book.findMany({
      where: { id: { in: bookIds }, schoolId },
      include: { category: true },
    });

    return bookLoans
      .map((bl) => {
        const book = books.find((b) => b.id === bl.bookId);
        if (!book) return null;
        return {
          ...book,
          loanCount: bl._count.bookId,
        };
      })
      .filter((book) => book !== null);
  }

  // Hiç ödünç alınmamış kitaplar - schoolId ile filtreleme
  async getNeverBorrowedBooks(schoolId: string) {
    return this.prisma.book.findMany({
      where: {
        schoolId,
        loans: { none: {} },
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Stokta az kalan kitaplar - schoolId ile filtreleme
  async getLowStockBooks(schoolId: string) {
    return this.prisma.book.findMany({
      where: {
        schoolId,
        available: { lte: 1 },
      },
      include: { category: true },
      orderBy: { available: 'asc' },
    });
  }

  // Hiç kitap ödünç almamış üyeler - schoolId ile filtreleme (sadece APPROVED)
  async getNeverBorrowedMembers(schoolId: string) {
    return this.prisma.user.findMany({
      where: {
        schoolId,
        status: 'APPROVED',
        loans: { none: {} },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Tüm üyeler - schoolId ile filtreleme (sadece APPROVED olanlar)
  async getAllMembers(schoolId: string) {
    const members = await this.prisma.user.findMany({
      where: { schoolId, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      include: {
        loans: {
          select: { id: true, status: true, dueDate: true },
        },
      },
    });

    return members.map((member) => {
      const activeLoans = member.loans.filter((l) => l.status === 'ACTIVE');
      const overdueLoans = activeLoans.filter(
        (l) => new Date(l.dueDate) < new Date(),
      );
      return {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        isMainAdmin: member.isMainAdmin,
        createdAt: member.createdAt,
        totalLoans: member.loans.length,
        activeLoans: activeLoans.length,
        overdueLoans: overdueLoans.length,
      };
    });
  }

  // Üye detayı ve ödünç geçmişi - schoolId kontrolü
  async getMemberDetail(userId: string, schoolId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        loans: {
          include: {
            book: {
              select: { id: true, title: true, author: true },
            },
          },
          orderBy: { borrowedAt: 'desc' },
        },
      },
    });

    if (!user || user.schoolId !== schoolId) {
      throw new NotFoundException('Üye bulunamadı');
    }

    return user;
  }

  // Üye rolünü değiştir - schoolId kontrolü ve isMainAdmin kontrolü
  async updateMemberRole(
    userId: string,
    schoolId: string,
    role: 'ADMIN' | 'MEMBER',
    currentUserIsMainAdmin: boolean,
    currentUserRole: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.schoolId !== schoolId) {
      throw new NotFoundException('Üye bulunamadı');
    }

    // isMainAdmin olan birinin rolünü sadece DEVELOPER değiştirebilir
    if (user.isMainAdmin && currentUserRole !== 'DEVELOPER') {
      throw new ForbiddenException('Ana admin rolü değiştirilemez');
    }

    // ADMIN yapabilmek için ya DEVELOPER olmalı ya da isMainAdmin olmalı
    if (role === 'ADMIN' && currentUserRole !== 'DEVELOPER' && !currentUserIsMainAdmin) {
      throw new ForbiddenException('Admin atama yetkiniz yok');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  // ==================== EXPORT FONKSİYONLARI ====================

  // Kitap listesi CSV export
  async exportBooks(schoolId: string): Promise<string> {
    const books = await this.prisma.book.findMany({
      where: { schoolId },
      include: { category: true },
      orderBy: { title: 'asc' },
    });

    const headers = ['Başlık', 'Yazar', 'ISBN', 'Kategori', 'Toplam Adet', 'Mevcut', 'Açıklama'];
    const rows = books.map(book => [
      this.escapeCSV(book.title),
      this.escapeCSV(book.author),
      book.isbn || '',
      book.category?.name || '',
      book.quantity.toString(),
      book.available.toString(),
      this.escapeCSV(book.description || ''),
    ]);

    return this.generateCSV(headers, rows);
  }

  // Üye listesi CSV export
  async exportMembers(schoolId: string): Promise<string> {
    const members = await this.prisma.user.findMany({
      where: { schoolId, status: 'APPROVED' },
      include: {
        _count: { select: { loans: true } },
      },
      orderBy: { name: 'asc' },
    });

    const headers = ['Ad Soyad', 'E-posta', 'Öğrenci No', 'Sınıf', 'Şube', 'Rol', 'Toplam Ödünç', 'Kayıt Tarihi'];
    const rows = members.map(member => [
      this.escapeCSV(member.name),
      member.email,
      member.studentNumber || '',
      member.className || '',
      member.section || '',
      member.role === 'ADMIN' ? 'Yönetici' : 'Üye',
      member._count.loans.toString(),
      member.createdAt.toLocaleDateString('tr-TR'),
    ]);

    return this.generateCSV(headers, rows);
  }

  // Ödünç işlemleri CSV export
  async exportLoans(schoolId: string, status?: string): Promise<string> {
    const where: any = { schoolId };
    if (status) {
      where.status = status;
    }

    const loans = await this.prisma.loan.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, studentNumber: true } },
        book: { select: { title: true, author: true } },
      },
      orderBy: { borrowedAt: 'desc' },
    });

    const headers = ['Üye', 'E-posta', 'Öğrenci No', 'Kitap', 'Yazar', 'Ödünç Tarihi', 'Teslim Tarihi', 'İade Tarihi', 'Durum', 'Yenileme', 'Ceza (TL)'];
    const rows = loans.map(loan => {
      const dueDate = new Date(loan.dueDate);
      const isOverdue = loan.status === 'ACTIVE' && dueDate < new Date();
      const status = loan.status === 'RETURNED' ? 'İade Edildi' : (isOverdue ? 'Gecikmiş' : 'Aktif');

      return [
        this.escapeCSV(loan.user.name),
        loan.user.email,
        loan.user.studentNumber || '',
        this.escapeCSV(loan.book.title),
        this.escapeCSV(loan.book.author),
        loan.borrowedAt.toLocaleDateString('tr-TR'),
        dueDate.toLocaleDateString('tr-TR'),
        loan.returnedAt ? loan.returnedAt.toLocaleDateString('tr-TR') : '-',
        status,
        loan.renewCount.toString(),
        loan.fineAmount.toFixed(2),
      ];
    });

    return this.generateCSV(headers, rows);
  }

  // Gecikmiş ödünçler CSV export
  async exportOverdueLoans(schoolId: string): Promise<string> {
    const loans = await this.prisma.loan.findMany({
      where: {
        schoolId,
        status: 'ACTIVE',
        dueDate: { lt: new Date() },
      },
      include: {
        user: { select: { name: true, email: true, studentNumber: true, className: true, section: true } },
        book: { select: { title: true, author: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const headers = ['Üye', 'E-posta', 'Öğrenci No', 'Sınıf', 'Kitap', 'Ödünç Tarihi', 'Teslim Tarihi', 'Gecikme (Gün)', 'Tahmini Ceza (TL)'];
    const rows = loans.map(loan => {
      const dueDate = new Date(loan.dueDate);
      const daysOverdue = Math.ceil((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      return [
        this.escapeCSV(loan.user.name),
        loan.user.email,
        loan.user.studentNumber || '',
        `${loan.user.className || ''}${loan.user.section ? '-' + loan.user.section : ''}`,
        this.escapeCSV(loan.book.title),
        loan.borrowedAt.toLocaleDateString('tr-TR'),
        dueDate.toLocaleDateString('tr-TR'),
        daysOverdue.toString(),
        (daysOverdue * 1).toFixed(2), // Varsayılan günlük ceza 1 TL
      ];
    });

    return this.generateCSV(headers, rows);
  }

  // CSV oluştur
  private generateCSV(headers: string[], rows: string[][]): string {
    const csvRows = [headers.join(',')];
    for (const row of rows) {
      csvRows.push(row.join(','));
    }
    return csvRows.join('\n');
  }

  // CSV için string'i escape et
  private escapeCSV(value: string): string {
    if (!value) return '';
    // Eğer virgül, tırnak veya yeni satır içeriyorsa tırnak içine al
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  // Dashboard grafikler için veri
  async getDashboardCharts(schoolId: string) {
    // Son 12 ay için aylık istatistikler
    const now = new Date();
    const monthlyStats: { month: string; loans: number; returns: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const [loanCount, returnCount] = await Promise.all([
        this.prisma.loan.count({
          where: {
            schoolId,
            borrowedAt: { gte: startDate, lte: endDate },
          },
        }),
        this.prisma.loan.count({
          where: {
            schoolId,
            returnedAt: { gte: startDate, lte: endDate },
          },
        }),
      ]);

      monthlyStats.push({
        month: startDate.toLocaleDateString('tr-TR', { month: 'short' }),
        loans: loanCount,
        returns: returnCount,
      });
    }

    // Kategori dağılımı
    const categoryStats = await this.prisma.loan.groupBy({
      by: ['bookId'],
      where: { schoolId },
      _count: { bookId: true },
    });

    const bookIds = categoryStats.map((s) => s.bookId);
    const books = await this.prisma.book.findMany({
      where: { id: { in: bookIds } },
      include: { category: true },
    });

    const categoryMap: Record<string, { name: string; count: number; color: string }> = {};
    categoryStats.forEach((stat) => {
      const book = books.find((b) => b.id === stat.bookId);
      if (book?.category) {
        const cat = book.category;
        if (!categoryMap[cat.id]) {
          categoryMap[cat.id] = { name: cat.name, count: 0, color: cat.color };
        }
        categoryMap[cat.id].count += stat._count.bookId;
      }
    });

    const categoryDistribution = Object.values(categoryMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Haftalık aktivite (son 4 hafta)
    const weeklyStats: { week: string; count: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const startDate = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

      const count = await this.prisma.loan.count({
        where: {
          schoolId,
          borrowedAt: { gte: startDate, lt: endDate },
        },
      });

      weeklyStats.push({
        week: `Hafta ${4 - i}`,
        count,
      });
    }

    return {
      monthlyStats,
      categoryDistribution,
      weeklyStats,
    };
  }

  // Üye aktivite raporu
  async getMemberActivityReport(schoolId: string, memberId?: string) {
    const where: any = {
      schoolId,
      role: 'MEMBER',
      status: 'APPROVED',
    };
    if (memberId) {
      where.id = memberId;
    }

    const members = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        studentNumber: true,
        className: true,
        section: true,
        createdAt: true,
        loans: {
          select: {
            id: true,
            borrowedAt: true,
            dueDate: true,
            returnedAt: true,
            status: true,
            renewCount: true,
            fineAmount: true,
            book: {
              select: { title: true, author: true, category: { select: { name: true } } },
            },
          },
          orderBy: { borrowedAt: 'desc' },
        },
        favorites: {
          select: {
            book: { select: { title: true, author: true } },
            createdAt: true,
          },
        },
        reviews: {
          select: {
            rating: true,
            book: { select: { title: true } },
            createdAt: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Her üye için istatistikleri hesapla
    return members.map((member) => {
      const totalLoans = member.loans.length;
      const activeLoans = member.loans.filter((l) => l.status === 'ACTIVE').length;
      const returnedLoans = member.loans.filter((l) => l.status === 'RETURNED').length;
      const overdueLoans = member.loans.filter(
        (l) => l.status === 'ACTIVE' && new Date(l.dueDate) < new Date(),
      ).length;
      const totalFines = member.loans.reduce((sum, l) => sum + (l.fineAmount || 0), 0);
      const averageRating = member.reviews.length > 0
        ? member.reviews.reduce((sum, r) => sum + r.rating, 0) / member.reviews.length
        : 0;

      // Favori kategoriler
      const categoryCount: Record<string, number> = {};
      member.loans.forEach((loan) => {
        const cat = loan.book.category?.name || 'Diğer';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });
      const favoriteCategories = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }));

      // Son aktiviteler
      const recentLoans = member.loans.slice(0, 5).map((l) => ({
        title: l.book.title,
        author: l.book.author,
        borrowedAt: l.borrowedAt,
        returnedAt: l.returnedAt,
        status: l.status,
        isOverdue: l.status === 'ACTIVE' && new Date(l.dueDate) < new Date(),
      }));

      return {
        id: member.id,
        name: member.name,
        email: member.email,
        studentNumber: member.studentNumber,
        className: member.className,
        section: member.section,
        memberSince: member.createdAt,
        stats: {
          totalLoans,
          activeLoans,
          returnedLoans,
          overdueLoans,
          totalFines,
          favoriteCount: member.favorites.length,
          reviewCount: member.reviews.length,
          averageRating: Math.round(averageRating * 10) / 10,
        },
        favoriteCategories,
        recentLoans,
      };
    });
  }

  // Üye aktivite raporu CSV export
  async exportMemberActivityReport(schoolId: string): Promise<string> {
    const members = await this.getMemberActivityReport(schoolId);

    const headers = [
      'Ad Soyad', 'E-posta', 'Öğrenci No', 'Sınıf', 'Şube',
      'Üyelik Tarihi', 'Toplam Ödünç', 'Aktif Ödünç', 'Gecikmiş',
      'Toplam Ceza (TL)', 'Favori Sayısı', 'Yorum Sayısı', 'Ortalama Puan',
      'En Çok Okunan Kategori',
    ];

    const rows = members.map((member) => [
      this.escapeCSV(member.name),
      member.email,
      member.studentNumber || '',
      member.className || '',
      member.section || '',
      new Date(member.memberSince).toLocaleDateString('tr-TR'),
      member.stats.totalLoans.toString(),
      member.stats.activeLoans.toString(),
      member.stats.overdueLoans.toString(),
      member.stats.totalFines.toFixed(2),
      member.stats.favoriteCount.toString(),
      member.stats.reviewCount.toString(),
      member.stats.averageRating.toString(),
      member.favoriteCategories[0]?.name || '-',
    ]);

    return this.generateCSV(headers, rows);
  }
}
