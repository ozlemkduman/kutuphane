// SchoolsController - Okul yönetimi endpoint'leri
// Sadece DEVELOPER rolü erişebilir (public endpoint'ler hariç)

import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { DeveloperGuard } from '../auth/developer.guard';
import { AdminGuard } from '../auth/admin.guard';
import { AuditService, AuditAction } from '../audit/audit.service';
import { CreateSchoolDto, UpdateSchoolDto } from './dto/create-school.dto';
import { AssignAdminDto } from './dto/assign-admin.dto';

@Controller('schools')
export class SchoolsController {
  constructor(
    private schoolsService: SchoolsService,
    private auditService: AuditService,
  ) {}

  // GET /api/schools/public - Aktif okulları listele (auth gerektirmez)
  // Onboarding için kullanılır
  @Get('public')
  async getPublicSchools() {
    return this.schoolsService.findActiveSchools();
  }

  // GET /api/schools - Tüm okulları listele
  @Get()
  @UseGuards(DeveloperGuard)
  findAll() {
    return this.schoolsService.findAll();
  }

  // GET /api/schools/stats - Tüm okulların özet istatistikleri
  @Get('stats')
  @UseGuards(DeveloperGuard)
  getAllSchoolsStats() {
    return this.schoolsService.getAllSchoolsStats();
  }

  // GET /api/schools/:id - Okul detayı
  @Get(':id')
  @UseGuards(DeveloperGuard)
  findOne(@Param('id') id: string) {
    return this.schoolsService.findOne(id);
  }

  // POST /api/schools - Yeni okul oluştur
  @Post()
  @UseGuards(DeveloperGuard)
  async create(@Body() data: CreateSchoolDto, @Req() req: any) {
    const school = await this.schoolsService.create(data);

    // Audit log
    await this.auditService.logSuccess(AuditAction.SCHOOL_CREATE, {
      userId: req.user?.id,
      userEmail: req.user?.email,
      schoolId: school.id,
      resourceType: 'School',
      resourceId: school.id,
      details: { schoolName: data.name, slug: data.slug },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return school;
  }

  // PUT /api/schools/:id - Okul güncelle
  @Put(':id')
  @UseGuards(DeveloperGuard)
  async update(@Param('id') id: string, @Body() data: UpdateSchoolDto, @Req() req: any) {
    const school = await this.schoolsService.update(id, data);

    // Audit log
    await this.auditService.logSuccess(AuditAction.SCHOOL_UPDATE, {
      userId: req.user?.id,
      userEmail: req.user?.email,
      schoolId: id,
      resourceType: 'School',
      resourceId: id,
      details: { updatedFields: Object.keys(data) },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return school;
  }

  // DELETE /api/schools/:id - Okul sil
  @Delete(':id')
  @UseGuards(DeveloperGuard)
  async remove(@Param('id') id: string, @Req() req: any) {
    // Önce okul bilgisini al (log için)
    const school = await this.schoolsService.findOne(id);
    const result = await this.schoolsService.remove(id);

    // Audit log
    await this.auditService.logSuccess(AuditAction.SCHOOL_DELETE, {
      userId: req.user?.id,
      userEmail: req.user?.email,
      schoolId: id,
      resourceType: 'School',
      resourceId: id,
      details: { schoolName: school?.name, slug: school?.slug },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return result;
  }

  // POST /api/schools/:id/assign-admin - Ana admin ata
  @Post(':id/assign-admin')
  @UseGuards(DeveloperGuard)
  async assignAdmin(@Param('id') id: string, @Body() data: AssignAdminDto, @Req() req: any) {
    const result = await this.schoolsService.assignAdmin(id, data);

    // Audit log
    await this.auditService.logSuccess(AuditAction.ADMIN_ASSIGN, {
      userId: req.user?.id,
      userEmail: req.user?.email,
      schoolId: id,
      resourceType: 'User',
      details: { assignedEmail: data.email, isMainAdmin: data.isMainAdmin },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return result;
  }

  // GET /api/schools/:id/admins - Okulun adminlerini listele
  @Get(':id/admins')
  @UseGuards(DeveloperGuard)
  getSchoolAdmins(@Param('id') id: string) {
    return this.schoolsService.getSchoolAdmins(id);
  }

  // GET /api/schools/:id/stats - Okul istatistikleri
  @Get(':id/stats')
  @UseGuards(DeveloperGuard)
  getSchoolStats(@Param('id') id: string) {
    return this.schoolsService.getSchoolStats(id);
  }

  // GET /api/schools/my/settings - Kendi okulum ayarları (Admin)
  @Get('my/settings')
  @UseGuards(AdminGuard)
  async getMySchoolSettings(@Req() req: any) {
    return this.schoolsService.getSchoolSettings(req.user.schoolId);
  }

  // PUT /api/schools/my/settings - Kendi okulum ayarlarını güncelle (Admin)
  @Put('my/settings')
  @UseGuards(AdminGuard)
  async updateMySchoolSettings(
    @Req() req: any,
    @Body() data: {
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
    },
  ) {
    const settings = await this.schoolsService.updateSchoolSettings(req.user.schoolId, data);

    // Audit log
    await this.auditService.logSuccess(AuditAction.SCHOOL_UPDATE, {
      userId: req.user?.id,
      userEmail: req.user?.email,
      schoolId: req.user.schoolId,
      resourceType: 'SchoolSettings',
      details: { updatedFields: Object.keys(data) },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return settings;
  }
}
