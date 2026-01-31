// UsersController - Kullanıcı endpoint'leri

import { Controller, Post, Get, Put, Body, UseGuards, Req, Param, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { RegisterGuard } from '../auth/register.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService, AuditAction } from '../audit/audit.service';
import { FirebaseService } from '../auth/firebase.service';
import { RegisterUserDto, SelectSchoolDto, UpdateUserStatusDto } from './dto/user.dto';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
    private auditService: AuditService,
    private firebaseService: FirebaseService,
  ) {}

  // GET /api/users/me - Mevcut kullanıcı bilgisi
  @Get('me')
  @UseGuards(AuthGuard)
  async me(@Req() req: any) {
    const { firebaseUid } = req.user;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı. Lütfen önce kayıt olun.');
    }
    return user;
  }

  // PUT /api/users/me - Profil güncelleme
  @Put('me')
  @UseGuards(AuthGuard)
  async updateProfile(
    @Req() req: any,
    @Body() data: { name?: string; className?: string; section?: string },
  ) {
    const { firebaseUid } = req.user;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Sadece izin verilen alanları güncelle
    const updateData: any = {};
    if (data.name && data.name.trim()) {
      updateData.name = data.name.trim();
    }
    if (data.className !== undefined) {
      updateData.className = data.className?.trim() || null;
    }
    if (data.section !== undefined) {
      updateData.section = data.section?.trim() || null;
    }

    // Eğer güncellenecek bir şey yoksa mevcut kullanıcıyı döndür
    if (Object.keys(updateData).length === 0) {
      return user;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: updateData,
      include: { school: true },
    });

    // Audit log
    await this.auditService.logSuccess(AuditAction.USER_UPDATE, {
      userId: user.id,
      userEmail: user.email,
      schoolId: user.schoolId || undefined,
      resourceType: 'User',
      resourceId: user.id,
      details: { updatedFields: Object.keys(updateData) },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return updatedUser;
  }

  // POST /api/users/register - Yeni kullanıcı kaydı
  @Post('register')
  @UseGuards(RegisterGuard)
  async register(
    @Req() req: any,
    @Body() data: RegisterUserDto,
  ) {
    // RegisterGuard token'ı doğruladı, firebaseUid req.user'da
    const { firebaseUid } = req.user;

    // Kullanıcı zaten var mı kontrol et
    const existing = await this.usersService.findByFirebaseUid(firebaseUid);
    if (existing) {
      return existing;  // Varsa mevcut kullanıcıyı döndür
    }

    // Okul slug'ı ile okul bul
    const school = await this.prisma.school.findUnique({
      where: { slug: data.schoolSlug },
    });
    if (!school) {
      throw new BadRequestException('Okul bulunamadı');
    }
    if (!school.isActive) {
      throw new BadRequestException('Bu okul aktif değil');
    }

    // Aynı okulda aynı öğrenci numarası var mı kontrol et (REJECTED hariç)
    const existingStudent = await this.prisma.user.findFirst({
      where: {
        schoolId: school.id,
        studentNumber: data.studentNumber,
        status: { not: 'REJECTED' },
      },
    });
    if (existingStudent) {
      throw new BadRequestException('Bu okul numarası zaten kayıtlı');
    }

    // Yeni kullanıcı oluştur (status: PENDING)
    const newUser = await this.usersService.create({
      firebaseUid,
      email: data.email,
      name: data.name,
      schoolId: school.id,
      className: data.className,
      section: data.section,
      studentNumber: data.studentNumber,
    });

    // Audit log
    await this.auditService.logSuccess(AuditAction.USER_REGISTER, {
      userId: newUser.id,
      userEmail: data.email,
      schoolId: school.id,
      details: {
        name: data.name,
        schoolName: school.name,
        className: data.className,
        section: data.section,
        studentNumber: data.studentNumber,
      },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return newUser;
  }

  // POST /api/users/select-school - Okul seçimi (onboarding için)
  @Post('select-school')
  @UseGuards(AuthGuard)
  async selectSchool(
    @Req() req: any,
    @Body() data: SelectSchoolDto,
  ) {
    const { firebaseUid } = req.user;

    // Kullanıcıyı bul
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Zaten okulu varsa hata döndür
    if (user.schoolId) {
      throw new BadRequestException('Zaten bir okula kayıtlısınız');
    }

    // Sadece MEMBER'lar okul seçebilir
    if (user.role !== 'MEMBER') {
      throw new BadRequestException('Okul seçimi sadece üyeler için geçerlidir');
    }

    // Okulu kontrol et
    const school = await this.prisma.school.findUnique({
      where: { id: data.schoolId },
    });

    if (!school) {
      throw new NotFoundException('Okul bulunamadı');
    }

    if (!school.isActive) {
      throw new BadRequestException('Bu okul aktif değil');
    }

    // Aynı okulda aynı öğrenci numarası var mı kontrol et (REJECTED hariç)
    const existingStudent = await this.prisma.user.findFirst({
      where: {
        schoolId: data.schoolId,
        studentNumber: data.studentNumber,
        status: { not: 'REJECTED' },
      },
    });
    if (existingStudent) {
      throw new BadRequestException('Bu okul numarası zaten kayıtlı');
    }

    // Kullanıcıyı okula ata ve öğrenci bilgilerini kaydet
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        schoolId: data.schoolId,
        className: data.className,
        section: data.section,
        studentNumber: data.studentNumber,
        status: 'PENDING', // Onay bekliyor
      },
      include: { school: true },
    });

    // Audit log
    await this.auditService.logSuccess(AuditAction.SCHOOL_SELECT, {
      userId: user.id,
      userEmail: user.email,
      schoolId: data.schoolId,
      details: {
        schoolName: school.name,
        className: data.className,
        section: data.section,
        studentNumber: data.studentNumber,
      },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return updatedUser;
  }

  // GET /api/users/pending - Onay bekleyen kullanıcıları listele (Admin)
  @Get('pending')
  @UseGuards(AdminGuard)
  async getPendingUsers(@Req() req: any) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }

    return this.prisma.user.findMany({
      where: {
        schoolId,
        status: 'PENDING',
        role: 'MEMBER',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        className: true,
        section: true,
        studentNumber: true,
        createdAt: true,
      },
    });
  }

  // POST /api/users/:id/approve - Kullanıcıyı onayla (Admin)
  @Post(':id/approve')
  @UseGuards(AdminGuard)
  async approveUser(@Param('id') id: string, @Req() req: any) {
    const schoolId = req.user.schoolId;

    // Kullanıcıyı bul
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Aynı okula ait mi kontrol et
    if (user.schoolId !== schoolId) {
      throw new ForbiddenException('Bu kullanıcıyı onaylama yetkiniz yok');
    }

    // Zaten onaylı mı kontrol et
    if (user.status === 'APPROVED') {
      throw new BadRequestException('Bu kullanıcı zaten onaylı');
    }

    // Onayla
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    // Audit log
    await this.auditService.logSuccess(AuditAction.USER_UPDATE, {
      userId: req.user.id,
      userEmail: req.user.email,
      schoolId,
      resourceType: 'User',
      resourceId: id,
      details: { action: 'approve', targetUser: user.email },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return updatedUser;
  }

  // POST /api/users/:id/reject - Kullanıcıyı reddet ve sil (Admin)
  @Post(':id/reject')
  @UseGuards(AdminGuard)
  async rejectUser(@Param('id') id: string, @Req() req: any) {
    const schoolId = req.user.schoolId;

    // Kullanıcıyı bul
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Aynı okula ait mi kontrol et
    if (user.schoolId !== schoolId) {
      throw new ForbiddenException('Bu kullanıcıyı reddetme yetkiniz yok');
    }

    // Sadece PENDING durumundaki kullanıcılar reddedilebilir
    if (user.status !== 'PENDING') {
      throw new BadRequestException('Sadece onay bekleyen kullanıcılar reddedilebilir');
    }

    // Firebase'den kullanıcıyı sil (tekrar kayıt olabilmesi için)
    if (user.firebaseUid) {
      await this.firebaseService.deleteUser(user.firebaseUid);
    }

    // Kullanıcıyı veritabanından sil
    await this.prisma.user.delete({
      where: { id },
    });

    // Audit log
    await this.auditService.logSuccess(AuditAction.USER_UPDATE, {
      userId: req.user.id,
      userEmail: req.user.email,
      schoolId,
      resourceType: 'User',
      resourceId: id,
      details: { action: 'reject_and_delete', targetUser: user.email, targetName: user.name },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return { message: 'Kullanıcı reddedildi ve kayıt silindi' };
  }

  // POST /api/users/bulk-approve - Toplu kullanıcı onaylama (Admin)
  @Post('bulk-approve')
  @UseGuards(AdminGuard)
  async bulkApprove(@Req() req: any, @Body() data: { userIds: string[] }) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }

    if (!data.userIds || data.userIds.length === 0) {
      throw new BadRequestException('Onaylanacak kullanıcı ID\'leri gerekli');
    }

    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const userId of data.userIds) {
      try {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user || user.schoolId !== schoolId) {
          results.failed++;
          results.errors.push(`Kullanıcı bulunamadı: ${userId}`);
          continue;
        }

        if (user.status === 'APPROVED') {
          results.failed++;
          results.errors.push(`Zaten onaylı: ${user.name}`);
          continue;
        }

        await this.prisma.user.update({
          where: { id: userId },
          data: { status: 'APPROVED' },
        });
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Hata: ${error.message}`);
      }
    }

    // Audit log
    await this.auditService.logSuccess(AuditAction.USER_UPDATE, {
      userId: req.user.id,
      userEmail: req.user.email,
      schoolId,
      resourceType: 'User',
      details: {
        action: 'bulk_approve',
        totalUsers: data.userIds.length,
        success: results.success,
        failed: results.failed,
      },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return results;
  }

  // GET /api/users/:id/detail - Üye detayları ve ödünç geçmişi (Admin)
  @Get(':id/detail')
  @UseGuards(AdminGuard)
  async getUserDetail(@Param('id') id: string, @Req() req: any) {
    const schoolId = req.user.schoolId;

    // Kullanıcıyı bul
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { school: true },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Aynı okula ait mi kontrol et
    if (user.schoolId !== schoolId) {
      throw new ForbiddenException('Bu kullanıcının bilgilerini görme yetkiniz yok');
    }

    // Aktif ödünçler
    const activeLoans = await this.prisma.loan.findMany({
      where: { userId: id, status: 'ACTIVE' },
      include: {
        book: { select: { id: true, title: true, author: true, coverImage: true } },
      },
      orderBy: { borrowedAt: 'desc' },
    });

    // Tüm ödünç geçmişi (son 50)
    const loanHistory = await this.prisma.loan.findMany({
      where: { userId: id },
      include: {
        book: { select: { id: true, title: true, author: true, coverImage: true } },
      },
      orderBy: { borrowedAt: 'desc' },
      take: 50,
    });

    // Rezervasyonlar
    const reservations = await this.prisma.reservation.findMany({
      where: { userId: id, status: { in: ['WAITING', 'READY'] } },
      include: {
        book: { select: { id: true, title: true, author: true, coverImage: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Favoriler
    const favorites = await this.prisma.favorite.findMany({
      where: { userId: id },
      include: {
        book: { select: { id: true, title: true, author: true, coverImage: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // İstatistikler
    const stats = {
      totalLoans: await this.prisma.loan.count({ where: { userId: id } }),
      activeLoans: activeLoans.length,
      overdueLoans: activeLoans.filter(l => new Date(l.dueDate) < new Date()).length,
      returnedLoans: await this.prisma.loan.count({ where: { userId: id, status: 'RETURNED' } }),
      totalFines: await this.prisma.loan.aggregate({
        where: { userId: id },
        _sum: { fineAmount: true },
      }),
      unpaidFines: await this.prisma.loan.aggregate({
        where: { userId: id, finePaid: false, fineAmount: { gt: 0 } },
        _sum: { fineAmount: true },
      }),
    };

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        className: user.className,
        section: user.section,
        studentNumber: user.studentNumber,
        createdAt: user.createdAt,
        school: user.school,
      },
      stats: {
        ...stats,
        totalFines: stats.totalFines._sum.fineAmount || 0,
        unpaidFines: stats.unpaidFines._sum.fineAmount || 0,
      },
      activeLoans,
      loanHistory,
      reservations,
      favorites,
    };
  }

  // POST /api/users/bulk-reject - Toplu kullanıcı reddetme (Admin)
  @Post('bulk-reject')
  @UseGuards(AdminGuard)
  async bulkReject(@Req() req: any, @Body() data: { userIds: string[] }) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }

    if (!data.userIds || data.userIds.length === 0) {
      throw new BadRequestException('Reddedilecek kullanıcı ID\'leri gerekli');
    }

    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const userId of data.userIds) {
      try {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user || user.schoolId !== schoolId) {
          results.failed++;
          results.errors.push(`Kullanıcı bulunamadı: ${userId}`);
          continue;
        }

        if (user.status !== 'PENDING') {
          results.failed++;
          results.errors.push(`Sadece bekleyenler reddedilebilir: ${user.name}`);
          continue;
        }

        // Firebase'den sil
        if (user.firebaseUid) {
          await this.firebaseService.deleteUser(user.firebaseUid);
        }

        // Veritabanından sil
        await this.prisma.user.delete({ where: { id: userId } });
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Hata: ${error.message}`);
      }
    }

    // Audit log
    await this.auditService.logSuccess(AuditAction.USER_UPDATE, {
      userId: req.user.id,
      userEmail: req.user.email,
      schoolId,
      resourceType: 'User',
      details: {
        action: 'bulk_reject',
        totalUsers: data.userIds.length,
        success: results.success,
        failed: results.failed,
      },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return results;
  }
}
