// NotificationsSchedulerService - Bildirim zamanlayıcı (Cron Jobs)

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsSchedulerService {
  private readonly logger = new Logger(NotificationsSchedulerService.name);

  constructor(
    private notificationsService: NotificationsService,
    private prisma: PrismaService,
  ) {}

  // Her gün saat 09:00'da çalış - Gecikme uyarıları
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleDailyReminders() {
    this.logger.log('Günlük hatırlatma görevleri başlatılıyor...');

    try {
      const results = await this.notificationsService.sendOverdueReminders();
      this.logger.log(
        `Hatırlatmalar gönderildi: ${results.warnings} uyarı, ${results.reminders} hatırlatma, ${results.emails} e-posta`,
      );
    } catch (error) {
      this.logger.error('Hatırlatma görevi başarısız:', error);
    }
  }

  // Her gün saat 10:00'da - Rezervasyon süresi dolmuşları temizle
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async handleExpiredReservations() {
    this.logger.log('Süresi dolmuş rezervasyonlar temizleniyor...');

    try {
      const now = new Date();

      // Süresi dolmuş rezervasyonları bul
      const expired = await this.prisma.reservation.findMany({
        where: {
          status: 'WAITING',
          expiresAt: { lt: now },
        },
        include: {
          user: true,
          book: true,
        },
      });

      for (const reservation of expired) {
        // Rezervasyonu iptal et
        await this.prisma.reservation.update({
          where: { id: reservation.id },
          data: { status: 'EXPIRED' },
        });

        // Kitap müsaitliğini artır
        await this.prisma.book.update({
          where: { id: reservation.bookId },
          data: { available: { increment: 1 } },
        });

        // Kullanıcıya bildirim gönder
        await this.prisma.notification.create({
          data: {
            userId: reservation.userId,
            schoolId: reservation.schoolId,
            type: 'RESERVATION_EXPIRED',
            title: 'Rezervasyon Süresi Doldu',
            message: `"${reservation.book.title}" kitabı için rezervasyonunuz süresi dolduğu için iptal edildi.`,
          },
        });
      }

      this.logger.log(`${expired.length} süresi dolmuş rezervasyon temizlendi`);
    } catch (error) {
      this.logger.error('Rezervasyon temizleme görevi başarısız:', error);
    }
  }

  // Her Pazartesi 08:00 - Haftalık özet (opsiyonel)
  @Cron('0 8 * * 1')
  async handleWeeklySummary() {
    this.logger.log('Haftalık özet bildirimleri gönderiliyor...');

    try {
      // Aktif okulları al
      const schools = await this.prisma.school.findMany({
        where: { isActive: true },
        include: { settings: true },
      });

      for (const school of schools) {
        if (!school.settings?.emailEnabled) continue;

        // Adminlere haftalık özet gönder
        const admins = await this.prisma.user.findMany({
          where: { schoolId: school.id, role: 'ADMIN', status: 'APPROVED' },
        });

        // Haftalık istatistikler
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const stats = {
          newLoans: await this.prisma.loan.count({
            where: { schoolId: school.id, borrowedAt: { gte: weekAgo } },
          }),
          returns: await this.prisma.loan.count({
            where: { schoolId: school.id, returnedAt: { gte: weekAgo } },
          }),
          newMembers: await this.prisma.user.count({
            where: { schoolId: school.id, createdAt: { gte: weekAgo } },
          }),
          overdueBooks: await this.prisma.loan.count({
            where: { schoolId: school.id, status: 'ACTIVE', dueDate: { lt: new Date() } },
          }),
        };

        for (const admin of admins) {
          await this.prisma.notification.create({
            data: {
              userId: admin.id,
              schoolId: school.id,
              type: 'WEEKLY_SUMMARY',
              title: 'Haftalık Kütüphane Özeti',
              message: `Bu hafta: ${stats.newLoans} yeni ödünç, ${stats.returns} iade, ${stats.newMembers} yeni üye. Gecikmiş kitap: ${stats.overdueBooks}`,
            },
          });
        }
      }

      this.logger.log('Haftalık özet bildirimleri gönderildi');
    } catch (error) {
      this.logger.error('Haftalık özet görevi başarısız:', error);
    }
  }

  // Her saat başı - Eski bildirimleri temizle (30 günden eski)
  @Cron(CronExpression.EVERY_HOUR)
  async cleanOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.prisma.notification.deleteMany({
        where: {
          isRead: true,
          createdAt: { lt: thirtyDaysAgo },
        },
      });

      if (result.count > 0) {
        this.logger.log(`${result.count} eski bildirim temizlendi`);
      }
    } catch (error) {
      this.logger.error('Bildirim temizleme görevi başarısız:', error);
    }
  }
}
