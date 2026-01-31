// ReservationsController - Rezervasyon endpoint'leri

import { Controller, Post, Get, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('reservations')
export class ReservationsController {
  constructor(private reservationsService: ReservationsService) {}

  // POST /api/reservations/:bookId - Kitap rezerve et
  @Post(':bookId')
  @UseGuards(AuthGuard)
  async createReservation(@Param('bookId') bookId: string, @Req() req: any) {
    return this.reservationsService.createReservation(
      req.user.id,
      bookId,
      req.user.schoolId,
    );
  }

  // GET /api/reservations - Kullanıcının rezervasyonları
  @Get()
  @UseGuards(AuthGuard)
  async getMyReservations(@Req() req: any) {
    return this.reservationsService.getUserReservations(
      req.user.id,
      req.user.schoolId,
    );
  }

  // GET /api/reservations/all - Admin: Tüm rezervasyonlar
  @Get('all')
  @UseGuards(AdminGuard)
  async getAllReservations(@Req() req: any) {
    return this.reservationsService.getAllReservations(req.user.schoolId);
  }

  // GET /api/reservations/book/:bookId/waiting - Kitap için bekleyen sayısı
  @Get('book/:bookId/waiting')
  @UseGuards(AuthGuard)
  async getWaitingCount(@Param('bookId') bookId: string) {
    return { count: await this.reservationsService.getWaitingCount(bookId) };
  }

  // DELETE /api/reservations/:id - Rezervasyonu iptal et
  @Delete(':id')
  @UseGuards(AuthGuard)
  async cancelReservation(@Param('id') id: string, @Req() req: any) {
    return this.reservationsService.cancelReservation(
      id,
      req.user.id,
      req.user.schoolId,
    );
  }
}
