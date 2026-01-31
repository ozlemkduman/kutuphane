// BaseGuard - Ortak token doğrulama mantığını içerir
// Tüm guard'lar bu base'i extend eder

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role, School, User } from '@prisma/client';

// Request'e eklenen kullanıcı bilgisi tipi
export interface RequestUser {
  id: string | undefined;
  firebaseUid: string;
  email: string | undefined;
  name: string | undefined;
  role: Role | undefined;
  schoolId: string | null;
  school: School | null;
  isMainAdmin: boolean | undefined;
}

// Extend edilmiş User tipi
export type UserWithSchool = User & { school: School | null };

@Injectable()
export abstract class BaseGuard implements CanActivate {
  constructor(
    protected readonly firebaseService: FirebaseService,
    protected readonly prisma: PrismaService,
  ) {}

  // Alt sınıflar tarafından override edilecek
  protected abstract checkPermissions(
    user: UserWithSchool | null,
    request: any,
  ): Promise<boolean>;

  // Ana canActivate metodu
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Token'ı al ve doğrula
    const { token, decodedToken } = await this.extractAndVerifyToken(request);

    // Kullanıcıyı veritabanından bul
    const user = await this.findUser(decodedToken.uid);

    // Alt sınıfın permission kontrolünü çağır
    const hasPermission = await this.checkPermissions(user, request);

    if (!hasPermission) {
      return false;
    }

    // Okul bilgisini hesapla (DEVELOPER için header'dan alınabilir)
    const { schoolId, school } = await this.resolveSchool(user, request);

    // Request'e kullanıcı bilgisini ekle
    request.user = this.buildRequestUser(user, decodedToken, schoolId, school);

    return true;
  }

  // Token çıkarma ve doğrulama
  protected async extractAndVerifyToken(request: any): Promise<{
    token: string;
    decodedToken: { uid: string; email?: string };
  }> {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Giriş yapmalısınız');
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      throw new UnauthorizedException('Geçersiz token formatı');
    }

    const decodedToken = await this.firebaseService.verifyToken(token);

    if (!decodedToken) {
      throw new UnauthorizedException('Geçersiz token');
    }

    return { token, decodedToken };
  }

  // Kullanıcıyı veritabanından bul
  protected async findUser(firebaseUid: string): Promise<UserWithSchool | null> {
    return this.prisma.user.findUnique({
      where: { firebaseUid },
      include: { school: true },
    });
  }

  // Okul bilgisini hesapla
  protected async resolveSchool(
    user: UserWithSchool | null,
    request: any,
  ): Promise<{ schoolId: string | null; school: School | null }> {
    if (!user) {
      return { schoolId: null, school: null };
    }

    let schoolId = user.schoolId;
    let school = user.school;

    // DEVELOPER için X-School-Id header'ından okul seçimi
    if (user.role === 'DEVELOPER') {
      const headerSchoolId = request.headers['x-school-id'];
      if (headerSchoolId) {
        const selectedSchool = await this.prisma.school.findUnique({
          where: { id: headerSchoolId },
        });
        if (selectedSchool) {
          schoolId = headerSchoolId;
          school = selectedSchool;
        } else {
          throw new BadRequestException('Geçersiz okul ID');
        }
      }
    }

    return { schoolId, school };
  }

  // RequestUser nesnesini oluştur
  protected buildRequestUser(
    user: UserWithSchool | null,
    decodedToken: { uid: string; email?: string },
    schoolId: string | null,
    school: School | null,
  ): RequestUser {
    return {
      id: user?.id,
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
      name: user?.name,
      role: user?.role,
      schoolId,
      school,
      isMainAdmin: user?.isMainAdmin,
    };
  }
}
