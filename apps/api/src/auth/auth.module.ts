// AuthModule - Kimlik doğrulama modülü

import { Module, Global } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { AuthGuard } from './auth.guard';
import { AdminGuard } from './admin.guard';
import { DeveloperGuard } from './developer.guard';
import { RegisterGuard } from './register.guard';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [FirebaseService, AuthGuard, AdminGuard, DeveloperGuard, RegisterGuard],
  exports: [FirebaseService, AuthGuard, AdminGuard, DeveloperGuard, RegisterGuard],
})
export class AuthModule {}
