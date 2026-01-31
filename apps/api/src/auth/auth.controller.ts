// AuthController - Kimlik doğrulama endpoint'leri

import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { IsEmail } from 'class-validator';
import { FirebaseService } from './firebase.service';
import { PrismaService } from '../prisma/prisma.service';

class CleanupOrphanedDto {
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi gerekli' })
  email!: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private firebaseService: FirebaseService,
    private prisma: PrismaService,
  ) {}

  /**
   * POST /api/auth/cleanup-orphaned
   * Yetim (orphaned) Firebase hesaplarını temizler.
   * Firebase'de var ama veritabanımızda olmayan hesapları siler.
   * Bu, reddedilmiş kullanıcıların tekrar kayıt olabilmesi için gereklidir.
   */
  @Post('cleanup-orphaned')
  async cleanupOrphanedAccount(@Body() data: CleanupOrphanedDto) {
    const { email } = data;

    if (!email || !email.includes('@')) {
      throw new BadRequestException('Geçerli bir e-posta adresi gerekli');
    }

    // Firebase'de kullanıcı var mı kontrol et
    const firebaseUser = await this.firebaseService.getUserByEmail(email);
    if (!firebaseUser) {
      // Firebase'de yok - zaten temiz
      return { cleaned: false, reason: 'firebase_not_found' };
    }

    // Veritabanımızda bu Firebase UID'ye sahip kullanıcı var mı kontrol et
    const dbUser = await this.prisma.user.findUnique({
      where: { firebaseUid: firebaseUser.uid },
    });

    if (dbUser) {
      // Kullanıcı veritabanında var
      // Eğer REJECTED statüsündeyse, hem DB'den hem Firebase'den sil
      if (dbUser.status === 'REJECTED') {
        // Önce DB'den sil
        await this.prisma.user.delete({
          where: { id: dbUser.id },
        });
        // Sonra Firebase'den sil
        await this.firebaseService.deleteUser(firebaseUser.uid);
        console.log(`Reddedilmiş kullanıcı temizlendi: ${email}`);
        return { cleaned: true, reason: 'rejected_user_cleaned' };
      }
      // Aktif kullanıcı - silmiyoruz
      return { cleaned: false, reason: 'user_exists_in_db' };
    }

    // Yetim hesap: Firebase'de var ama veritabanında yok
    // Bu genellikle reddedilmiş kullanıcıdır
    const deleted = await this.firebaseService.deleteUser(firebaseUser.uid);

    if (deleted) {
      console.log(`Yetim Firebase hesabı temizlendi: ${email}`);
      return { cleaned: true, reason: 'orphaned_account_deleted' };
    } else {
      return { cleaned: false, reason: 'deletion_failed' };
    }
  }
}
