// DeveloperGuard - Sadece DEVELOPER rolüne izin verir
// Okul yönetimi endpoint'leri için kullanılır

import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { BaseGuard, UserWithSchool } from './base.guard';
import { FirebaseService } from './firebase.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeveloperGuard extends BaseGuard {
  constructor(
    firebaseService: FirebaseService,
    prisma: PrismaService,
  ) {
    super(firebaseService, prisma);
  }

  // Sadece Developer rolüne sahip kullanıcılara izin ver
  protected async checkPermissions(
    user: UserWithSchool | null,
    request: any,
  ): Promise<boolean> {
    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }

    if (user.role !== 'DEVELOPER') {
      throw new ForbiddenException('Bu işlem için developer yetkisi gerekli');
    }

    return true;
  }
}
