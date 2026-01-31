// Ana modül - Uygulamanın kalbi

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { BooksModule } from './books/books.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LoansModule } from './loans/loans.module';
import { CategoriesModule } from './categories/categories.module';
import { UploadModule } from './upload/upload.module';
import { StatsModule } from './stats/stats.module';
import { SchoolsModule } from './schools/schools.module';
import { AuditModule } from './audit/audit.module';
import { ReservationsModule } from './reservations/reservations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EmailModule } from './email/email.module';
import { ReviewsModule } from './reviews/reviews.module';
import { FavoritesModule } from './favorites/favorites.module';

@Module({
  imports: [
    // Cron Jobs - Zamanlanmış görevler
    ScheduleModule.forRoot(),
    // Rate Limiting - Brute force saldırılarına karşı koruma
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,   // 1 saniye
        limit: 30,   // 30 istek
      },
      {
        name: 'medium',
        ttl: 10000,  // 10 saniye
        limit: 100,  // 100 istek
      },
      {
        name: 'long',
        ttl: 60000,  // 1 dakika
        limit: 500,  // 500 istek
      },
    ]),
    PrismaModule,        // Veritabanı
    AuditModule,         // Audit logging
    AuthModule,          // Kimlik doğrulama
    SchoolsModule,       // Okul yönetimi (multi-tenancy)
    CategoriesModule,    // Kategoriler
    BooksModule,         // Kitaplar
    UsersModule,         // Kullanıcılar
    LoansModule,         // Ödünç işlemleri
    UploadModule,        // Dosya yükleme
    StatsModule,         // İstatistikler ve raporlar
    ReservationsModule,  // Rezervasyonlar
    NotificationsModule, // Bildirimler
    EmailModule,         // E-posta servisi
    ReviewsModule,       // Kitap yorumları
    FavoritesModule,     // Favoriler
  ],
  controllers: [],
  providers: [
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
