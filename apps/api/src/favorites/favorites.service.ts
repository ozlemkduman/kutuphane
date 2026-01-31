// FavoritesService - Favori kitaplar

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  // Favori ekle/kaldır (toggle)
  async toggleFavorite(firebaseUid: string, bookId: string, schoolId: string) {
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

    // Zaten favorilerde mi?
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_bookId: {
          userId: user.id,
          bookId,
        },
      },
    });

    if (existing) {
      // Kaldır
      await this.prisma.favorite.delete({
        where: { id: existing.id },
      });
      return { isFavorite: false };
    }

    // Ekle
    await this.prisma.favorite.create({
      data: {
        userId: user.id,
        bookId,
        schoolId,
      },
    });
    return { isFavorite: true };
  }

  // Favorileri getir
  async getFavorites(firebaseUid: string) {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    return this.prisma.favorite.findMany({
      where: { userId: user.id },
      include: {
        book: {
          include: { category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Kitap favoride mi kontrol et
  async checkFavorite(firebaseUid: string, bookId: string) {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (!user) {
      return { isFavorite: false };
    }

    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_bookId: {
          userId: user.id,
          bookId,
        },
      },
    });

    return { isFavorite: !!favorite };
  }
}
