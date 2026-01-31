// ReviewsService - Kitap yorumları ve puanlama

import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  // Kitaba yorum ekle
  async createReview(
    firebaseUid: string,
    bookId: string,
    schoolId: string,
    data: { rating: number; comment?: string },
  ) {
    // Kullanıcıyı bul
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Kitabı kontrol et
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book || book.schoolId !== schoolId) {
      throw new NotFoundException('Kitap bulunamadı');
    }

    // Rating kontrolü
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('Puan 1-5 arasında olmalı');
    }

    // Kullanıcı bu kitabı ödünç almış mı? (sadece okuyanlar yorum yapabilir)
    const hasLoan = await this.prisma.loan.findFirst({
      where: {
        userId: user.id,
        bookId,
      },
    });

    if (!hasLoan) {
      throw new BadRequestException('Sadece ödünç aldığınız kitaplara yorum yapabilirsiniz');
    }

    // Zaten yorum yapmış mı?
    const existingReview = await this.prisma.review.findUnique({
      where: {
        userId_bookId: {
          userId: user.id,
          bookId,
        },
      },
    });

    if (existingReview) {
      // Güncelle
      return this.prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating: data.rating,
          comment: data.comment,
        },
        include: {
          user: { select: { id: true, name: true } },
        },
      });
    }

    // Yeni yorum oluştur
    return this.prisma.review.create({
      data: {
        rating: data.rating,
        comment: data.comment,
        userId: user.id,
        bookId,
        schoolId,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }

  // Kitabın yorumlarını getir
  async getBookReviews(bookId: string, schoolId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { bookId, schoolId },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Ortalama puanı hesapla
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    return {
      reviews,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
    };
  }

  // Kullanıcının bu kitaba yaptığı yorumu getir
  async getUserReview(firebaseUid: string, bookId: string) {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (!user) {
      return null;
    }

    return this.prisma.review.findUnique({
      where: {
        userId_bookId: {
          userId: user.id,
          bookId,
        },
      },
    });
  }

  // Yorumu sil
  async deleteReview(firebaseUid: string, reviewId: string) {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Yorum bulunamadı');
    }

    // Sadece kendi yorumunu silebilir (veya admin)
    if (review.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'DEVELOPER') {
      throw new ForbiddenException('Bu yorumu silme yetkiniz yok');
    }

    return this.prisma.review.delete({
      where: { id: reviewId },
    });
  }
}
