// CategoriesController - HTTP isteklerini karşılar

import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { AdminGuard } from '../auth/admin.guard';
import { AuthGuard } from '../auth/auth.guard';

@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  // GET /api/categories → Giriş yapmış kullanıcılar (kendi okullarının kategorileri)
  @Get()
  @UseGuards(AuthGuard)
  findAll(@Request() req: any) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    return this.categoriesService.findAll(schoolId);
  }

  // GET /api/categories/slug/:slug → Giriş yapmış kullanıcılar
  @Get('slug/:slug')
  @UseGuards(AuthGuard)
  findBySlug(@Param('slug') slug: string, @Request() req: any) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    return this.categoriesService.findBySlug(slug, schoolId);
  }

  // GET /api/categories/:id → Giriş yapmış kullanıcılar
  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string, @Request() req: any) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    return this.categoriesService.findOne(id, schoolId);
  }

  // POST /api/categories → Sadece admin
  @Post()
  @UseGuards(AdminGuard)
  create(@Request() req: any, @Body() data: { slug: string; name: string; icon: string; color: string }) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    return this.categoriesService.create(schoolId, data);
  }

  // PUT /api/categories/:id → Sadece admin
  @Put(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Request() req: any, @Body() data: { name?: string; icon?: string; color?: string }) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    return this.categoriesService.update(id, schoolId, data);
  }

  // DELETE /api/categories/:id → Sadece admin
  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string, @Request() req: any) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Okul bilgisi bulunamadı');
    }
    return this.categoriesService.remove(id, schoolId);
  }
}
