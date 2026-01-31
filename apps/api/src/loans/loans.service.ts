import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LoansService {
  constructor(private prisma: PrismaService) {}

  // Okul ayarlarını getir (yoksa varsayılan oluştur)
  private async getSchoolSettings(schoolId: string) {
    let settings = await this.prisma.schoolSettings.findUnique({
      where: { schoolId },
    });

    if (!settings) {
      settings = await this.prisma.schoolSettings.create({
        data: { schoolId },
      });
    }

    return settings;
  }

  // Gecikme cezası hesapla
  private calculateFine(dueDate: Date, finePerDay: number, maxFine: number): number {
    const now = new Date();
    if (now <= dueDate) return 0;

    const diffTime = now.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const fine = diffDays * finePerDay;

    return Math.min(fine, maxFine);
  }

  // Kitap ödünç al - schoolId ile
  async borrowBook(userId: string, bookId: string, schoolId: string) {
    // 1. Kullanıcıyı bul
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid: userId },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Kullanıcının bu okula ait olduğunu kontrol et
    if (user.schoolId !== schoolId) {
      throw new BadRequestException('Bu okula ait değilsiniz');
    }

    // Okul ayarlarını al
    const settings = await this.getSchoolSettings(schoolId);

    // 2. Kullanıcının aktif ödünç sayısını kontrol et
    const activeLoans = await this.prisma.loan.count({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
    });

    if (activeLoans >= settings.maxLoans) {
      throw new BadRequestException(`En fazla ${settings.maxLoans} kitap ödünç alabilirsiniz`);
    }

    // 3. Kitabı bul ve stok kontrolü yap
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book || book.schoolId !== schoolId) {
      throw new NotFoundException('Kitap bulunamadı');
    }

    if (book.available <= 0) {
      throw new BadRequestException('Bu kitap şu anda mevcut değil');
    }

    // 4. Aynı kitabı zaten ödünç almış mı kontrol et
    const existingLoan = await this.prisma.loan.findFirst({
      where: {
        userId: user.id,
        bookId: bookId,
        status: 'ACTIVE',
      },
    });

    if (existingLoan) {
      throw new BadRequestException('Bu kitabı zaten ödünç aldınız');
    }

    // 5. İade tarihi hesapla (ayarlara göre)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + settings.loanDays);

    // 6. Transaction ile ödünç kaydı oluştur ve stok güncelle
    const loan = await this.prisma.$transaction(async (tx) => {
      // Kitap stokunu azalt
      await tx.book.update({
        where: { id: bookId },
        data: { available: { decrement: 1 } },
      });

      // Ödünç kaydı oluştur
      return tx.loan.create({
        data: {
          userId: user.id,
          bookId: bookId,
          dueDate: dueDate,
          status: 'ACTIVE',
          schoolId: schoolId,
        },
        include: {
          book: true,
        },
      });
    });

    return loan;
  }

  // Kullanıcının ödünç aldığı kitapları getir
  async getMyLoans(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid: userId },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    return this.prisma.loan.findMany({
      where: { userId: user.id },
      include: { book: true },
      orderBy: { borrowedAt: 'desc' },
    });
  }

  // Kitap iade et
  async returnBook(userId: string, loanId: string) {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid: userId },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    const loan = await this.prisma.loan.findFirst({
      where: {
        id: loanId,
        userId: user.id,
        status: 'ACTIVE',
      },
      include: { book: true },
    });

    if (!loan) {
      throw new NotFoundException('Ödünç kaydı bulunamadı');
    }

    // Ceza hesapla
    const settings = await this.getSchoolSettings(loan.schoolId);
    const fineAmount = this.calculateFine(loan.dueDate, settings.finePerDay, settings.maxFine);

    // Transaction ile iade işlemi
    const updatedLoan = await this.prisma.$transaction(async (tx) => {
      // Kitap stokunu artır
      await tx.book.update({
        where: { id: loan.bookId },
        data: { available: { increment: 1 } },
      });

      // Ödünç kaydını güncelle
      return tx.loan.update({
        where: { id: loanId },
        data: {
          status: 'RETURNED',
          returnedAt: new Date(),
          fineAmount: fineAmount,
        },
        include: { book: true },
      });
    });

    // Rezervasyon varsa işle (bu kitabı bekleyenler için)
    await this.processReservations(loan.bookId, loan.schoolId);

    return updatedLoan;
  }

  // Kitap iade edildiğinde rezervasyonları işle
  private async processReservations(bookId: string, schoolId: string) {
    const settings = await this.getSchoolSettings(schoolId);

    // En eski bekleyen rezervasyonu bul
    const nextReservation = await this.prisma.reservation.findFirst({
      where: {
        bookId,
        schoolId,
        status: 'WAITING',
      },
      orderBy: { createdAt: 'asc' },
      include: { book: true },
    });

    if (nextReservation) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + settings.reservationDays);

      // Rezervasyonu READY yap
      await this.prisma.reservation.update({
        where: { id: nextReservation.id },
        data: {
          status: 'READY',
          expiresAt,
        },
      });

      // Bildirim oluştur
      await this.prisma.notification.create({
        data: {
          userId: nextReservation.userId,
          schoolId,
          type: 'RESERVATION_READY',
          title: 'Rezervasyonunuz Hazır!',
          message: `"${nextReservation.book?.title}" artık müsait. ${settings.reservationDays} gün içinde alabilirsiniz.`,
        },
      });
    }
  }

  // Kitap süresini uzat (yenileme)
  async renewLoan(userId: string, loanId: string) {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid: userId },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    const loan = await this.prisma.loan.findFirst({
      where: {
        id: loanId,
        userId: user.id,
        status: 'ACTIVE',
      },
      include: { book: true },
    });

    if (!loan) {
      throw new NotFoundException('Ödünç kaydı bulunamadı');
    }

    const settings = await this.getSchoolSettings(loan.schoolId);

    // Yenileme limitini kontrol et
    if (loan.renewCount >= settings.maxRenewals) {
      throw new BadRequestException(`En fazla ${settings.maxRenewals} kez yenileyebilirsiniz`);
    }

    // Bu kitap için bekleyen rezervasyon var mı?
    const waitingReservations = await this.prisma.reservation.count({
      where: {
        bookId: loan.bookId,
        status: 'WAITING',
      },
    });

    if (waitingReservations > 0) {
      throw new BadRequestException('Bu kitap için bekleyen rezervasyonlar var, yenileme yapılamaz');
    }

    // Gecikmiş ise yenileme yapılamaz
    if (new Date() > loan.dueDate) {
      throw new BadRequestException('Gecikmiş kitaplar yenilenemez. Lütfen önce iade edin.');
    }

    // Yeni iade tarihi
    const newDueDate = new Date(loan.dueDate);
    newDueDate.setDate(newDueDate.getDate() + settings.loanDays);

    return this.prisma.loan.update({
      where: { id: loanId },
      data: {
        dueDate: newDueDate,
        renewCount: { increment: 1 },
      },
      include: { book: true },
    });
  }

  // Kullanıcının ödenmemiş cezalarını getir
  async getUnpaidFines(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid: userId },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    const loans = await this.prisma.loan.findMany({
      where: {
        userId: user.id,
        fineAmount: { gt: 0 },
        finePaid: false,
      },
      include: { book: true },
    });

    const totalFine = loans.reduce((sum, loan) => sum + loan.fineAmount, 0);

    return {
      loans,
      totalFine,
    };
  }

  // Admin: Cezayı ödendi olarak işaretle
  async markFinePaid(loanId: string, schoolId: string) {
    const loan = await this.prisma.loan.findFirst({
      where: {
        id: loanId,
        schoolId,
        fineAmount: { gt: 0 },
      },
    });

    if (!loan) {
      throw new NotFoundException('Cezalı ödünç kaydı bulunamadı');
    }

    return this.prisma.loan.update({
      where: { id: loanId },
      data: { finePaid: true },
      include: { book: true, user: true },
    });
  }

  // Kullanıcının okuma geçmişi ve istatistikleri
  async getMyReadingHistory(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid: userId },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Tüm ödünçler
    const allLoans = await this.prisma.loan.findMany({
      where: { userId: user.id },
      include: {
        book: {
          include: { category: true },
        },
      },
      orderBy: { borrowedAt: 'desc' },
    });

    // İstatistikler
    const totalLoans = allLoans.length;
    const completedLoans = allLoans.filter((l) => l.status === 'RETURNED').length;
    const activeLoans = allLoans.filter((l) => l.status === 'ACTIVE');
    const overdueCount = activeLoans.filter((l) => new Date(l.dueDate) < new Date()).length;
    const totalFines = allLoans.reduce((sum, l) => sum + l.fineAmount, 0);
    const unpaidFines = allLoans.filter((l) => l.fineAmount > 0 && !l.finePaid).reduce((sum, l) => sum + l.fineAmount, 0);

    // En çok okunan kategoriler
    const categoryStats: Record<string, { name: string; count: number; color: string }> = {};
    allLoans.forEach((loan) => {
      if (loan.book.category) {
        const cat = loan.book.category;
        if (!categoryStats[cat.id]) {
          categoryStats[cat.id] = { name: cat.name, count: 0, color: cat.color };
        }
        categoryStats[cat.id].count++;
      }
    });

    const topCategories = Object.values(categoryStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Aylık okuma sayıları (son 12 ay)
    const monthlyStats: { month: string; count: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLoans = allLoans.filter((l) => {
        const loanDate = new Date(l.borrowedAt);
        return loanDate.getMonth() === date.getMonth() && loanDate.getFullYear() === date.getFullYear();
      }).length;
      monthlyStats.push({
        month: date.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' }),
        count: monthLoans,
      });
    }

    return {
      stats: {
        totalLoans,
        completedLoans,
        activeLoans: activeLoans.length,
        overdueCount,
        totalFines,
        unpaidFines,
      },
      topCategories,
      monthlyStats,
      loans: allLoans,
    };
  }
}
