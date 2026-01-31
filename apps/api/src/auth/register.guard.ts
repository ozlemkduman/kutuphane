// RegisterGuard - Sadece kayıt işlemleri için
// Firebase token'ı doğrular ama veritabanında kullanıcı aramaz
// Bu, yeni kullanıcıların kayıt olabilmesini sağlar

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseService } from './firebase.service';

@Injectable()
export class RegisterGuard implements CanActivate {
  constructor(private readonly firebaseService: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Token'ı al
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Giriş yapmalısınız');
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      throw new UnauthorizedException('Geçersiz token formatı');
    }

    // Token'ı doğrula
    const decodedToken = await this.firebaseService.verifyToken(token);

    if (!decodedToken) {
      throw new UnauthorizedException('Geçersiz token');
    }

    // Request'e sadece Firebase bilgisini ekle
    request.user = {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
    };

    return true;
  }
}
