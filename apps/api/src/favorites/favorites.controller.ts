// FavoritesController - Favori endpoint'leri

import { Controller, Get, Post, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('favorites')
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  // GET /api/favorites - Kullanıcının favorileri
  @Get()
  @UseGuards(AuthGuard)
  getFavorites(@Request() req: any) {
    return this.favoritesService.getFavorites(req.user.firebaseUid);
  }

  // GET /api/favorites/check/:bookId - Kitap favoride mi?
  @Get('check/:bookId')
  @UseGuards(AuthGuard)
  checkFavorite(@Param('bookId') bookId: string, @Request() req: any) {
    return this.favoritesService.checkFavorite(req.user.firebaseUid, bookId);
  }

  // POST /api/favorites/toggle/:bookId - Favori ekle/kaldır
  @Post('toggle/:bookId')
  @UseGuards(AuthGuard)
  toggleFavorite(@Param('bookId') bookId: string, @Request() req: any) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    return this.favoritesService.toggleFavorite(req.user.firebaseUid, bookId, schoolId);
  }
}
