// ReviewsController - Yorum endpoint'leri

import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  // GET /api/reviews/book/:bookId - Kitabın yorumlarını getir
  @Get('book/:bookId')
  @UseGuards(AuthGuard)
  getBookReviews(@Param('bookId') bookId: string, @Request() req: any) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    return this.reviewsService.getBookReviews(bookId, schoolId);
  }

  // GET /api/reviews/book/:bookId/my - Kullanıcının bu kitaba yaptığı yorum
  @Get('book/:bookId/my')
  @UseGuards(AuthGuard)
  getUserReview(@Param('bookId') bookId: string, @Request() req: any) {
    return this.reviewsService.getUserReview(req.user.firebaseUid, bookId);
  }

  // POST /api/reviews/book/:bookId - Yorum ekle/güncelle
  @Post('book/:bookId')
  @UseGuards(AuthGuard)
  createReview(
    @Param('bookId') bookId: string,
    @Request() req: any,
    @Body() data: { rating: number; comment?: string },
  ) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    return this.reviewsService.createReview(req.user.firebaseUid, bookId, schoolId, data);
  }

  // DELETE /api/reviews/:id - Yorumu sil
  @Delete(':id')
  @UseGuards(AuthGuard)
  deleteReview(@Param('id') id: string, @Request() req: any) {
    return this.reviewsService.deleteReview(req.user.firebaseUid, id);
  }
}
