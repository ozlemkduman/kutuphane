// CategoriesService - Kategorilerle ilgili iş mantığı

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  // Tüm kategorileri getir - schoolId ile filtreleme
  async findAll(schoolId: string) {
    return this.prisma.category.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
    });
  }

  // Tek bir kategori getir - schoolId kontrolü
  async findOne(id: string, schoolId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { books: { where: { schoolId } } },
    });

    if (!category || category.schoolId !== schoolId) {
      throw new NotFoundException('Kategori bulunamadı');
    }

    return category;
  }

  // Slug ile kategori getir - schoolId kontrolü
  async findBySlug(slug: string, schoolId: string) {
    const category = await this.prisma.category.findFirst({
      where: { slug, schoolId },
      include: { books: { where: { schoolId } } },
    });

    if (!category) {
      throw new NotFoundException('Kategori bulunamadı');
    }

    return category;
  }

  // Yeni kategori ekle - schoolId ile
  async create(schoolId: string, data: { slug: string; name: string; icon: string; color: string }) {
    // Aynı slug bu okulda var mı kontrol et
    const existing = await this.prisma.category.findFirst({
      where: { schoolId, slug: data.slug },
    });

    if (existing) {
      throw new BadRequestException('Bu slug zaten kullanılıyor');
    }

    return this.prisma.category.create({
      data: {
        ...data,
        schoolId,
      },
    });
  }

  // Kategori güncelle - schoolId kontrolü
  async update(id: string, schoolId: string, data: { name?: string; icon?: string; color?: string }) {
    const category = await this.prisma.category.findUnique({ where: { id } });

    if (!category || category.schoolId !== schoolId) {
      throw new NotFoundException('Kategori bulunamadı');
    }

    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  // Kategori sil - schoolId kontrolü
  async remove(id: string, schoolId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { books: true } } },
    });

    if (!category || category.schoolId !== schoolId) {
      throw new NotFoundException('Kategori bulunamadı');
    }

    if (category._count.books > 0) {
      throw new BadRequestException('Bu kategoride kitaplar var, silinemez');
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }

  // Birden fazla kategori ekle (seed için) - schoolId ile
  async createMany(schoolId: string, data: { slug: string; name: string; icon: string; color: string }[]) {
    const dataWithSchool = data.map(item => ({ ...item, schoolId }));
    return this.prisma.category.createMany({
      data: dataWithSchool,
      skipDuplicates: true,
    });
  }
}
