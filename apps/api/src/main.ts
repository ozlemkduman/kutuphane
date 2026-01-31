// API'nin başlangıç noktası

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security Headers - Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // CORS - Environment'tan oku veya localhost kullan
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000'];

  app.enableCors({
    origin: (origin, callback) => {
      // Tarayıcı dışı istekler (Postman, server-to-server) için origin undefined olabilir
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy violation'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-School-Id'],
  });

  // Global Validation Pipe - Tüm input'ları doğrula
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO'da olmayan alanları kaldır
      forbidNonWhitelisted: true, // Beklenmeyen alanlar için hata fırlat
      transform: true, // Otomatik tip dönüşümü
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: process.env.NODE_ENV === 'production', // Production'da detaylı hata mesajlarını gizle
    }),
  );

  // Request body boyut limiti (varsayılan 100kb yerine 1mb)
  app.useBodyParser('json', { limit: '1mb' });

  // Statik dosyalar için uploads klasörünü sun
  // Not: __dirname dist/src'yi gösterir, uploads ise api kökünde
  app.useStaticAssets(join(__dirname, '..', '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // /api prefix'i
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);

  if (process.env.NODE_ENV !== 'production') {
    console.log(`API çalışıyor: http://localhost:${port}`);
    console.log('Loans endpoint: GET /api/loans/reading-history');
  }
}

bootstrap();
