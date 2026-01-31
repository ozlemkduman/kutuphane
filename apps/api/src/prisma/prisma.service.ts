// PrismaService - Veritabanı bağlantısını yöneten servis
// Tüm modüller bu servisi kullanarak veritabanına erişir

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {

  // Uygulama başladığında veritabanına bağlan
  async onModuleInit() {
    await this.$connect();
    console.log('Veritabanına bağlandı');
  }

  // Uygulama kapandığında bağlantıyı kapat
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('Veritabanı bağlantısı kapatıldı');
  }
}
