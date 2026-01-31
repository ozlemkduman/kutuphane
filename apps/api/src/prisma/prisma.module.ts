// PrismaModule - Prisma servisini uygulamaya tanıtır

import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()  // Tüm modüllerden erişilebilir
@Module({
  providers: [PrismaService],
  exports: [PrismaService],  // Dışa aktar, diğer modüller kullanabilsin
})
export class PrismaModule {}
