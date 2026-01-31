// AuthGuard - Korumalı endpoint'lere erişimi kontrol eder
// Veritabanında kayıtlı kullanıcılara izin verir

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { BaseGuard, UserWithSchool } from './base.guard';
import { FirebaseService } from './firebase.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthGuard extends BaseGuard {
  constructor(
    firebaseService: FirebaseService,
    prisma: PrismaService,
  ) {
    super(firebaseService, prisma);
  }

  // Veritabanında kayıtlı kullanıcılara izin ver
  protected async checkPermissions(
    user: UserWithSchool | null,
    request: any,
  ): Promise<boolean> {
    // Kullanıcı veritabanında kayıtlı olmalı
    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı. Lütfen önce kayıt olun.');
    }

    return true;
  }
}
