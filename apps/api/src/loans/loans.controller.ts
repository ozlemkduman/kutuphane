import { Controller, Post, Get, Param, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { LoansService } from './loans.service';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { TeacherOrAdminGuard } from '../auth/teacher-or-admin.guard';

@Controller('loans')
export class LoansController {
  constructor(private loansService: LoansService) {}

  // ==================== STATIC ROUTES FIRST ====================

  // GET /api/loans/reading-history - Benim okuma geçmişim ve istatistiklerim
  @Get('reading-history')
  @UseGuards(AuthGuard)
  async getMyReadingHistory(@Request() req: any) {
    return this.loansService.getMyReadingHistory(req.user.firebaseUid);
  }

  // GET /api/loans/my/fines - Benim cezalarım
  @Get('my/fines')
  @UseGuards(AuthGuard)
  async getMyFines(@Request() req: any) {
    return this.loansService.getUnpaidFines(req.user.firebaseUid);
  }

  // GET /api/loans/my - Benim ödünç aldıklarım
  @Get('my')
  @UseGuards(AuthGuard)
  async getMyLoans(@Request() req: any) {
    return this.loansService.getMyLoans(req.user.firebaseUid);
  }

  // ==================== ON-BEHALF ROUTES (BEFORE :id) ====================

  // POST /api/loans/on-behalf/:bookId - Öğrenci adına kitap ödünç ver
  @Post('on-behalf/:bookId')
  @UseGuards(TeacherOrAdminGuard)
  async borrowBookOnBehalf(
    @Param('bookId') bookId: string,
    @Body() data: { userId: string },
    @Request() req: any,
  ) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    if (!data.userId) {
      throw new BadRequestException('Öğrenci ID gerekli');
    }
    return this.loansService.borrowBookOnBehalf(req.user.firebaseUid, data.userId, bookId, schoolId);
  }

  // POST /api/loans/on-behalf/:loanId/return - Öğrenci adına kitap iade et
  @Post('on-behalf/:loanId/return')
  @UseGuards(TeacherOrAdminGuard)
  async returnBookOnBehalf(
    @Param('loanId') loanId: string,
    @Request() req: any,
  ) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    return this.loansService.returnBookOnBehalf(req.user.firebaseUid, loanId, schoolId);
  }

  // ==================== DYNAMIC ROUTES LAST ====================

  // POST /api/loans/:bookId - Kitap ödünç al
  @Post(':bookId')
  @UseGuards(AuthGuard)
  async borrowBook(@Param('bookId') bookId: string, @Request() req: any) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    return this.loansService.borrowBook(req.user.firebaseUid, bookId, schoolId);
  }

  // POST /api/loans/:loanId/return - Kitap iade et
  @Post(':loanId/return')
  @UseGuards(AuthGuard)
  async returnBook(@Param('loanId') loanId: string, @Request() req: any) {
    return this.loansService.returnBook(req.user.firebaseUid, loanId);
  }

  // POST /api/loans/:loanId/renew - Süre uzat
  @Post(':loanId/renew')
  @UseGuards(AuthGuard)
  async renewLoan(@Param('loanId') loanId: string, @Request() req: any) {
    return this.loansService.renewLoan(req.user.firebaseUid, loanId);
  }

  // POST /api/loans/:loanId/pay-fine - Cezayı ödendi işaretle (Admin)
  @Post(':loanId/pay-fine')
  @UseGuards(AdminGuard)
  async markFinePaid(@Param('loanId') loanId: string, @Request() req: any) {
    return this.loansService.markFinePaid(loanId, req.user.schoolId);
  }
}
