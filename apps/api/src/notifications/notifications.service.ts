// NotificationsService - Bildirim işlemleri

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // Kullanıcının bildirimlerini getir
  async getUserNotifications(userId: string, schoolId: string) {
    return this.prisma.notification.findMany({
      where: { userId, schoolId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // Okunmamış bildirim sayısı
  async getUnreadCount(userId: string, schoolId: string) {
    return this.prisma.notification.count({
      where: { userId, schoolId, isRead: false },
    });
  }

  // Bildirimi okundu işaretle
  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  // Tüm bildirimleri okundu işaretle
  async markAllAsRead(userId: string, schoolId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, schoolId, isRead: false },
      data: { isRead: true },
    });
  }

  // Gecikme uyarıları gönder (cron job için)
  async sendOverdueReminders() {
    const now = new Date();
    const results = { warnings: 0, reminders: 0, emails: 0 };

    // 1. Yarın vadesi dolacak kitaplar için uyarı
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const dueTomorrow = await this.prisma.loan.findMany({
      where: {
        status: 'ACTIVE',
        dueDate: {
          gte: now,
          lte: tomorrow,
        },
      },
      include: {
        user: true,
        book: true,
      },
    });

    for (const loan of dueTomorrow) {
      // Daha önce bu ödünç için uyarı gönderilmiş mi?
      const existing = await this.prisma.notification.findFirst({
        where: {
          userId: loan.userId,
          type: 'LOAN_DUE_SOON',
          createdAt: { gte: new Date(now.setHours(0, 0, 0, 0)) },
          message: { contains: loan.book.title },
        },
      });

      if (!existing) {
        const notification = await this.prisma.notification.create({
          data: {
            userId: loan.userId,
            schoolId: loan.schoolId,
            type: 'LOAN_DUE_SOON',
            title: 'Teslim Tarihi Yaklaşıyor',
            message: `"${loan.book.title}" kitabının teslim tarihi yarın. Lütfen iade etmeyi veya yenilemeyi unutmayın.`,
          },
        });
        results.warnings++;

        // E-posta gönder (ayarlar aktifse)
        const settings = await this.prisma.schoolSettings.findUnique({
          where: { schoolId: loan.schoolId },
        });
        if (settings?.emailEnabled) {
          const daysLeft = Math.ceil((loan.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const sent = await this.emailService.sendDueSoonReminder(
            loan.schoolId,
            loan.user.email,
            loan.user.name,
            loan.book.title,
            loan.dueDate,
            daysLeft,
          );
          if (sent) {
            await this.prisma.notification.update({
              where: { id: notification.id },
              data: { sentAt: new Date() },
            });
            results.emails++;
          }
        }
      }
    }

    // 2. Gecikmiş kitaplar için hatırlatma
    const overdue = await this.prisma.loan.findMany({
      where: {
        status: 'ACTIVE',
        dueDate: { lt: now },
      },
      include: {
        user: true,
        book: true,
      },
    });

    for (const loan of overdue) {
      const daysOverdue = Math.ceil((now.getTime() - loan.dueDate.getTime()) / (1000 * 60 * 60 * 24));

      // Her 3 günde bir hatırlatma gönder
      if (daysOverdue % 3 === 1) {
        const existing = await this.prisma.notification.findFirst({
          where: {
            userId: loan.userId,
            type: 'OVERDUE_REMINDER',
            createdAt: { gte: new Date(now.setHours(0, 0, 0, 0)) },
            message: { contains: loan.book.title },
          },
        });

        if (!existing) {
          // Ceza hesapla
          const settings = await this.prisma.schoolSettings.findUnique({
            where: { schoolId: loan.schoolId },
          });
          const finePerDay = settings?.finePerDay || 1;
          const estimatedFine = daysOverdue * finePerDay;

          const notification = await this.prisma.notification.create({
            data: {
              userId: loan.userId,
              schoolId: loan.schoolId,
              type: 'OVERDUE_REMINDER',
              title: 'Gecikmiş Kitap Hatırlatması',
              message: `"${loan.book.title}" kitabı ${daysOverdue} gündür gecikmiş. Tahmini ceza: ${estimatedFine.toFixed(2)} TL. Lütfen en kısa sürede iade edin.`,
            },
          });
          results.reminders++;

          // E-posta gönder (ayarlar aktifse)
          if (settings?.emailEnabled) {
            const sent = await this.emailService.sendOverdueReminder(
              loan.schoolId,
              loan.user.email,
              loan.user.name,
              loan.book.title,
              loan.dueDate,
              daysOverdue,
            );
            if (sent) {
              await this.prisma.notification.update({
                where: { id: notification.id },
                data: { sentAt: new Date() },
              });
              results.emails++;
            }
          }
        }
      }
    }

    return results;
  }

  // Ceza bildirimi gönder
  async sendFineNotification(userId: string, schoolId: string, bookTitle: string, fineAmount: number) {
    return this.prisma.notification.create({
      data: {
        userId,
        schoolId,
        type: 'FINE_NOTICE',
        title: 'Gecikme Cezası',
        message: `"${bookTitle}" kitabı için ${fineAmount.toFixed(2)} TL gecikme cezası oluştu.`,
      },
    });
  }

  // Genel bildirim gönder (Admin)
  async sendGeneralNotification(schoolId: string, title: string, message: string, userIds?: string[]) {
    // Belirli kullanıcılara veya tüm okul üyelerine
    if (userIds && userIds.length > 0) {
      const notifications = userIds.map((userId) => ({
        userId,
        schoolId,
        type: 'GENERAL' as const,
        title,
        message,
      }));

      return this.prisma.notification.createMany({
        data: notifications,
      });
    } else {
      // Tüm okul üyelerine
      const users = await this.prisma.user.findMany({
        where: { schoolId, status: 'APPROVED' },
        select: { id: true },
      });

      const notifications = users.map((user) => ({
        userId: user.id,
        schoolId,
        type: 'GENERAL' as const,
        title,
        message,
      }));

      return this.prisma.notification.createMany({
        data: notifications,
      });
    }
  }
}
