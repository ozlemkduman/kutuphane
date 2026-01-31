// UploadController - Dosya yükleme endpoint'i
// Güvenlik: Magic bytes doğrulama, boyut limiti, izin verilen türler

import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AdminGuard } from '../auth/admin.guard';
import { readFileSync, unlinkSync } from 'fs';

// Desteklenen resim formatları ve magic bytes
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]], // GIF87a, GIF89a
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF (WebP container)
};

// Magic bytes kontrolü
function validateMagicBytes(filePath: string, mimetype: string): boolean {
  try {
    const buffer = readFileSync(filePath);
    const signatures = MAGIC_BYTES[mimetype];

    if (!signatures) return false;

    for (const signature of signatures) {
      let matches = true;
      for (let i = 0; i < signature.length; i++) {
        if (buffer[i] !== signature[i]) {
          matches = false;
          break;
        }
      }
      if (matches) return true;
    }

    return false;
  } catch {
    return false;
  }
}

@Controller('upload')
export class UploadController {
  // POST /api/upload → Sadece admin
  @Post()
  @UseGuards(AdminGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          // Benzersiz dosya adı oluştur (sadece güvenli karakterler)
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname).toLowerCase();
          // Sadece izin verilen uzantılar
          const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
          const safeExt = allowedExts.includes(ext) ? ext : '.jpg';
          callback(null, `${uniqueSuffix}${safeExt}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        // MIME type kontrolü
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return callback(
            new BadRequestException('Sadece resim dosyaları yüklenebilir (jpg, png, gif, webp)'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Dosya yüklenemedi');
    }

    // Magic bytes doğrulaması - dosya içeriğinin gerçekten resim olduğunu kontrol et
    const isValidImage = validateMagicBytes(file.path, file.mimetype);

    if (!isValidImage) {
      // Geçersiz dosyayı sil
      try {
        unlinkSync(file.path);
      } catch {
        // Silme başarısız olsa bile devam et
      }
      throw new BadRequestException('Dosya içeriği geçerli bir resim değil');
    }

    // Dosya URL'sini döndür
    return {
      url: `/uploads/${file.filename}`,
      filename: file.filename,
    };
  }
}
