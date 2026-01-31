// ReservationsService - Rezervasyon işlemleri

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReservationsService {
  constructor(private prisma: PrismaService) {}

  // Kitap için rezervasyon oluştur
  async createReservation(userId: string, bookId: string, schoolId: string) {
    // Kitabı kontrol et
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, schoolId },
    });

    if (!book) {
      throw new NotFoundException('Kitap bulunamadı');
    }

    // Kitap müsaitse rezervasyona gerek yok
    if (book.available > 0) {
      throw new BadRequestException('Kitap müsait durumda, direkt ödünç alabilirsiniz');
    }

    // Kullanıcının aktif rezervasyon sayısını kontrol et
    const settings = await this.getSchoolSettings(schoolId);
    const activeReservations = await this.prisma.reservation.count({
      where: {
        userId,
        schoolId,
        status: { in: ['WAITING', 'READY'] },
      },
    });

    if (activeReservations >= settings.maxReservations) {
      throw new BadRequestException(`En fazla ${settings.maxReservations} aktif rezervasyonunuz olabilir`);
    }

    // Kullanıcı bu kitabı zaten rezerve etmiş mi?
    const existing = await this.prisma.reservation.findFirst({
      where: {
        userId,
        bookId,
        status: { in: ['WAITING', 'READY'] },
      },
    });

    if (existing) {
      throw new BadRequestException('Bu kitap için zaten aktif bir rezervasyonunuz var');
    }

    // Rezervasyon oluştur
    return this.prisma.reservation.create({
      data: {
        userId,
        bookId,
        schoolId,
        status: 'WAITING',
      },
      include: {
        book: { select: { title: true, author: true } },
      },
    });
  }

  // Kullanıcının rezervasyonlarını listele
  async getUserReservations(userId: string, schoolId: string) {
    return this.prisma.reservation.findMany({
      where: { userId, schoolId },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            coverImage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Rezervasyonu iptal et
  async cancelReservation(reservationId: string, userId: string, schoolId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: {
        id: reservationId,
        userId,
        schoolId,
        status: { in: ['WAITING', 'READY'] },
      },
    });

    if (!reservation) {
      throw new NotFoundException('Rezervasyon bulunamadı veya iptal edilemez');
    }

    return this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'CANCELLED' },
    });
  }

  // Kitap iade edildiğinde rezervasyonları kontrol et
  async processBookReturn(bookId: string, schoolId: string) {
    // En eski bekleyen rezervasyonu bul
    const nextReservation = await this.prisma.reservation.findFirst({
      where: {
        bookId,
        schoolId,
        status: 'WAITING',
      },
      orderBy: { createdAt: 'asc' },
      include: { user: true, book: true },
    });

    if (nextReservation) {
      const settings = await this.getSchoolSettings(schoolId);
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
          message: `"${nextReservation.book.title}" artık müsait. ${settings.reservationDays} gün içinde alabilirsiniz.`,
        },
      });

      return nextReservation;
    }

    return null;
  }

  // Kitap için sırada bekleyen sayısı
  async getWaitingCount(bookId: string) {
    return this.prisma.reservation.count({
      where: {
        bookId,
        status: 'WAITING',
      },
    });
  }

  // Admin: Tüm rezervasyonları listele
  async getAllReservations(schoolId: string) {
    return this.prisma.reservation.findMany({
      where: { schoolId },
      include: {
        user: { select: { id: true, name: true, email: true, className: true, section: true } },
        book: { select: { id: true, title: true, author: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Süresi dolan rezervasyonları iptal et (cron job için)
  async expireOldReservations() {
    const now = new Date();

    const expired = await this.prisma.reservation.updateMany({
      where: {
        status: 'READY',
        expiresAt: { lt: now },
      },
      data: { status: 'EXPIRED' },
    });

    return expired.count;
  }

  // Okul ayarlarını getir
  private async getSchoolSettings(schoolId: string) {
    let settings = await this.prisma.schoolSettings.findUnique({
      where: { schoolId },
    });

    if (!settings) {
      // Varsayılan ayarları oluştur
      settings = await this.prisma.schoolSettings.create({
        data: { schoolId },
      });
    }

    return settings;
  }
}
