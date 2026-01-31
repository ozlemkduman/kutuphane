// StatsController - İstatistik ve rapor endpoint'leri

import { Controller, Get, Param, Put, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { StatsService } from './stats.service';
import { AdminGuard } from '../auth/admin.guard';

@Controller('stats')
@UseGuards(AdminGuard)
export class StatsController {
  constructor(private statsService: StatsService) {}

  // GET /api/stats/dashboard - Dashboard istatistikleri
  @Get('dashboard')
  getDashboardStats(@Request() req: any) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    return this.statsService.getDashboardStats(schoolId);
  }

  // GET /api/stats/charts - Dashboard grafik verileri
  @Get('charts')
  getDashboardCharts(@Request() req: any) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    return this.statsService.getDashboardCharts(schoolId);
  }

  // GET /api/stats/overdue - Gecikmiş ödünçler
  @Get('overdue')
  getOverdueLoans(@Request() req: any) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    return this.statsService.getOverdueLoans(schoolId);
  }

  // GET /api/stats/activities - Son aktiviteler
  @Get('activities')
  getRecentActivities(@Request() req: any) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    return this.statsService.getRecentActivities(schoolId);
  }

  // GET /api/stats/popular-books - En çok ödünç alınan kitaplar
  @Get('popular-books')
  getPopularBooks(@Request() req: any) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    return this.statsService.getPopularBooks(schoolId);
  }

  // GET /api/stats/never-borrowed - Hiç ödünç alınmamış kitaplar
  @Get('never-borrowed')
  getNeverBorrowedBooks(@Request() req: any) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    return this.statsService.getNeverBorrowedBooks(schoolId);
  }

  // GET /api/stats/low-stock - Stokta az kalan kitaplar
  @Get('low-stock')
  getLowStockBooks(@Request() req: any) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    return this.statsService.getLowStockBooks(schoolId);
  }

  // GET /api/stats/never-borrowed-members - Hiç kitap ödünç almamış üyeler
  @Get('never-borrowed-members')
  getNeverBorrowedMembers(@Request() req: any) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    return this.statsService.getNeverBorrowedMembers(schoolId);
  }

  // GET /api/stats/members - Tüm üyeler
  @Get('members')
  getAllMembers(@Request() req: any) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    return this.statsService.getAllMembers(schoolId);
  }

  // GET /api/stats/members/:id - Üye detayı
  @Get('members/:id')
  getMemberDetail(@Param('id') id: string, @Request() req: any) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    return this.statsService.getMemberDetail(id, schoolId);
  }

  // PUT /api/stats/members/:id/role - Üye rolünü değiştir
  @Put('members/:id/role')
  updateMemberRole(
    @Param('id') id: string,
    @Request() req: any,
    @Body() data: { role: 'ADMIN' | 'MEMBER' },
  ) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    return this.statsService.updateMemberRole(
      id,
      schoolId,
      data.role,
      req.user.isMainAdmin,
      req.user.role,
    );
  }

  // ==================== EXPORT ENDPOİNTLERİ ====================

  // GET /api/stats/export/books - Kitap listesi CSV
  @Get('export/books')
  async exportBooks(@Request() req: any) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    const csv = await this.statsService.exportBooks(schoolId);
    return { data: csv, filename: 'kitaplar.csv' };
  }

  // GET /api/stats/export/members - Üye listesi CSV
  @Get('export/members')
  async exportMembers(@Request() req: any) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    const csv = await this.statsService.exportMembers(schoolId);
    return { data: csv, filename: 'uyeler.csv' };
  }

  // GET /api/stats/export/loans - Ödünç işlemleri CSV
  @Get('export/loans')
  async exportLoans(@Request() req: any) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    const csv = await this.statsService.exportLoans(schoolId);
    return { data: csv, filename: 'odunc_islemleri.csv' };
  }

  // GET /api/stats/export/overdue - Gecikmiş ödünçler CSV
  @Get('export/overdue')
  async exportOverdue(@Request() req: any) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    const csv = await this.statsService.exportOverdueLoans(schoolId);
    return { data: csv, filename: 'gecikmis_oduncler.csv' };
  }

  // ==================== ÜYE AKTİVİTE RAPORLARI ====================

  // GET /api/stats/member-activity - Tüm üye aktivite raporu
  @Get('member-activity')
  getMemberActivityReport(@Request() req: any) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    return this.statsService.getMemberActivityReport(schoolId);
  }

  // GET /api/stats/member-activity/:id - Tek üye aktivite raporu
  @Get('member-activity/:id')
  getSingleMemberActivity(@Param('id') id: string, @Request() req: any) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    return this.statsService.getMemberActivityReport(schoolId, id);
  }

  // GET /api/stats/export/member-activity - Üye aktivite raporu CSV
  @Get('export/member-activity')
  async exportMemberActivity(@Request() req: any) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    const csv = await this.statsService.exportMemberActivityReport(schoolId);
    return { data: csv, filename: 'uye_aktivite_raporu.csv' };
  }
}
