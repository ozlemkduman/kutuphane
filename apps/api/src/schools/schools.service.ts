// SchoolsService - Okul yönetimi iş mantığı

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSchoolDto, UpdateSchoolDto } from './dto/create-school.dto';
import { AssignAdminDto } from './dto/assign-admin.dto';
import { encrypt, decrypt } from '../utils/crypto.util';

@Injectable()
export class SchoolsService {
  constructor(private prisma: PrismaService) {}

  // Aktif okulları listele (public endpoint için)
  async findActiveSchools() {
    return this.prisma.school.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        address: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  // Tüm okulları listele
  async findAll() {
    return this.prisma.school.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            users: true,
            books: true,
            loans: true,
          },
        },
      },
    });
  }

  // Tek bir okul getir
  async findOne(id: string) {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            books: true,
            categories: true,
            loans: true,
          },
        },
      },
    });

    if (!school) {
      throw new NotFoundException('Okul bulunamadı');
    }

    return school;
  }

  // Yeni okul oluştur
  async create(data: CreateSchoolDto) {
    // Slug kontrolü
    const existing = await this.prisma.school.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new BadRequestException('Bu slug zaten kullanılıyor');
    }

    return this.prisma.school.create({
      data: {
        name: data.name,
        slug: data.slug,
        logo: data.logo,
        address: data.address,
        phone: data.phone,
        email: data.email,
      },
    });
  }

  // Okul güncelle
  async update(id: string, data: UpdateSchoolDto) {
    const school = await this.prisma.school.findUnique({ where: { id } });

    if (!school) {
      throw new NotFoundException('Okul bulunamadı');
    }

    // Slug değişiyorsa kontrol et
    if (data.slug && data.slug !== school.slug) {
      const existing = await this.prisma.school.findUnique({
        where: { slug: data.slug },
      });
      if (existing) {
        throw new BadRequestException('Bu slug zaten kullanılıyor');
      }
    }

    return this.prisma.school.update({
      where: { id },
      data,
    });
  }

  // Okul sil
  async remove(id: string) {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, books: true, loans: true },
        },
      },
    });

    if (!school) {
      throw new NotFoundException('Okul bulunamadı');
    }

    // Veri varsa silmeyi engelle
    if (school._count.users > 0 || school._count.books > 0 || school._count.loans > 0) {
      throw new BadRequestException('Bu okulda veriler var, silinemez');
    }

    return this.prisma.school.delete({ where: { id } });
  }

  // Okula admin ata (email ile)
  async assignAdmin(schoolId: string, data: AssignAdminDto) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      throw new NotFoundException('Okul bulunamadı');
    }

    const user = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new NotFoundException('Bu email adresine sahip kullanıcı bulunamadı');
    }

    // Eğer isMainAdmin true ise, önce mevcut mainAdmin'i kaldır
    if (data.isMainAdmin) {
      await this.prisma.user.updateMany({
        where: { schoolId, isMainAdmin: true },
        data: { isMainAdmin: false },
      });
    }

    return this.prisma.user.update({
      where: { email: data.email },
      data: {
        schoolId,
        role: 'ADMIN',
        isMainAdmin: data.isMainAdmin || false,
      },
    });
  }

  // Okulun adminlerini listele
  async getSchoolAdmins(schoolId: string) {
    return this.prisma.user.findMany({
      where: {
        schoolId,
        role: 'ADMIN',
      },
      select: {
        id: true,
        name: true,
        email: true,
        isMainAdmin: true,
        createdAt: true,
      },
      orderBy: { isMainAdmin: 'desc' },
    });
  }

  // Okul istatistikleri
  async getSchoolStats(schoolId: string) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      throw new NotFoundException('Okul bulunamadı');
    }

    const [
      totalBooks,
      totalMembers,
      totalAdmins,
      activeLoans,
      overdueLoans,
      totalCategories,
    ] = await Promise.all([
      this.prisma.book.count({ where: { schoolId } }),
      this.prisma.user.count({ where: { schoolId, role: 'MEMBER' } }),
      this.prisma.user.count({ where: { schoolId, role: 'ADMIN' } }),
      this.prisma.loan.count({ where: { schoolId, status: 'ACTIVE' } }),
      this.prisma.loan.count({
        where: {
          schoolId,
          status: 'ACTIVE',
          dueDate: { lt: new Date() },
        },
      }),
      this.prisma.category.count({ where: { schoolId } }),
    ]);

    // Toplam kitap adedi
    const bookQuantity = await this.prisma.book.aggregate({
      where: { schoolId },
      _sum: { quantity: true },
    });

    return {
      school,
      stats: {
        totalBooks,
        totalBookQuantity: bookQuantity._sum.quantity || 0,
        totalMembers,
        totalAdmins,
        activeLoans,
        overdueLoans,
        totalCategories,
      },
    };
  }

  // Tüm okulların özet istatistikleri
  async getAllSchoolsStats() {
    const schools = await this.prisma.school.findMany({
      include: {
        _count: {
          select: {
            users: true,
            books: true,
            loans: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return schools;
  }

  // Okul ayarlarını getir (yoksa varsayılan oluştur)
  async getSchoolSettings(schoolId: string) {
    let settings = await this.prisma.schoolSettings.findUnique({
      where: { schoolId },
    });

    if (!settings) {
      settings = await this.prisma.schoolSettings.create({
        data: { schoolId },
      });
    }

    // SMTP şifresini çöz (frontend'e gönderirken maskelenmiş göster)
    if (settings.smtpPass) {
      const decrypted = decrypt(settings.smtpPass);
      // Güvenlik için sadece şifre olduğunu belirt, değeri gönderme
      return {
        ...settings,
        smtpPass: decrypted ? '••••••••' : null,
        _hasSmtpPassword: !!decrypted,
      };
    }

    return {
      ...settings,
      _hasSmtpPassword: false,
    };
  }

  // Okul ayarlarını güncelle
  async updateSchoolSettings(schoolId: string, data: {
    loanDays?: number;
    maxLoans?: number;
    maxRenewals?: number;
    finePerDay?: number;
    maxFine?: number;
    reservationDays?: number;
    maxReservations?: number;
    // E-posta ayarları
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    fromEmail?: string;
    fromName?: string;
    emailEnabled?: boolean;
  }) {
    // SMTP şifresini şifrele (eğer yeni şifre geldiyse)
    const processedData = { ...data };
    if (data.smtpPass && data.smtpPass !== '••••••••') {
      processedData.smtpPass = encrypt(data.smtpPass);
    } else if (data.smtpPass === '••••••••') {
      // Maskelenmiş değer geldiyse güncelleme yapma
      delete processedData.smtpPass;
    }

    // Önce mevcut ayarları kontrol et
    let settings = await this.prisma.schoolSettings.findUnique({
      where: { schoolId },
    });

    if (!settings) {
      // Yoksa oluştur
      settings = await this.prisma.schoolSettings.create({
        data: {
          schoolId,
          ...processedData,
        },
      });
    } else {
      // Varsa güncelle
      settings = await this.prisma.schoolSettings.update({
        where: { schoolId },
        data: processedData,
      });
    }

    // Dönerken şifreyi maskele
    return {
      ...settings,
      smtpPass: settings.smtpPass ? '••••••••' : null,
      _hasSmtpPassword: !!settings.smtpPass,
    };
  }

  // Email gönderimi için şifresi çözülmüş ayarları getir (internal use)
  async getDecryptedEmailSettings(schoolId: string) {
    const settings = await this.prisma.schoolSettings.findUnique({
      where: { schoolId },
    });

    if (!settings || !settings.emailEnabled) {
      return null;
    }

    return {
      smtpHost: settings.smtpHost,
      smtpPort: settings.smtpPort,
      smtpUser: settings.smtpUser,
      smtpPass: settings.smtpPass ? decrypt(settings.smtpPass) : null,
      fromEmail: settings.fromEmail,
      fromName: settings.fromName,
    };
  }
}
