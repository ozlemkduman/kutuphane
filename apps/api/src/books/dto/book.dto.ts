// Book DTOs - Kitap işlemleri için validation
import {
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// HTML ve script tag'lerini temizle
const sanitizeString = (value: string) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .trim();
};

export class CreateBookDto {
  @IsString({ message: 'Başlık metin olmalıdır' })
  @MinLength(1, { message: 'Başlık boş olamaz' })
  @MaxLength(200, { message: 'Başlık en fazla 200 karakter olabilir' })
  @Transform(({ value }) => sanitizeString(value))
  title!: string;

  @IsString({ message: 'Yazar metin olmalıdır' })
  @MinLength(1, { message: 'Yazar boş olamaz' })
  @MaxLength(100, { message: 'Yazar en fazla 100 karakter olabilir' })
  @Transform(({ value }) => sanitizeString(value))
  author!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'ISBN en fazla 20 karakter olabilir' })
  @Matches(/^[0-9X-]*$/, { message: 'Geçersiz ISBN formatı' })
  isbn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Açıklama en fazla 2000 karakter olabilir' })
  @Transform(({ value }) => sanitizeString(value))
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Miktar tam sayı olmalıdır' })
  @Min(1, { message: 'Miktar en az 1 olmalıdır' })
  @Max(9999, { message: 'Miktar en fazla 9999 olabilir' })
  quantity?: number;

  @IsOptional()
  @IsUUID('4', { message: 'Geçersiz kategori ID formatı' })
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Kapak URL en fazla 500 karakter olabilir' })
  coverImage?: string;
}

export class UpdateBookDto {
  @IsOptional()
  @IsString({ message: 'Başlık metin olmalıdır' })
  @MinLength(1, { message: 'Başlık boş olamaz' })
  @MaxLength(200, { message: 'Başlık en fazla 200 karakter olabilir' })
  @Transform(({ value }) => sanitizeString(value))
  title?: string;

  @IsOptional()
  @IsString({ message: 'Yazar metin olmalıdır' })
  @MinLength(1, { message: 'Yazar boş olamaz' })
  @MaxLength(100, { message: 'Yazar en fazla 100 karakter olabilir' })
  @Transform(({ value }) => sanitizeString(value))
  author?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'ISBN en fazla 20 karakter olabilir' })
  @Matches(/^[0-9X-]*$/, { message: 'Geçersiz ISBN formatı' })
  isbn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Açıklama en fazla 2000 karakter olabilir' })
  @Transform(({ value }) => sanitizeString(value))
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Miktar tam sayı olmalıdır' })
  @Min(1, { message: 'Miktar en az 1 olmalıdır' })
  @Max(9999, { message: 'Miktar en fazla 9999 olabilir' })
  quantity?: number;

  @IsOptional()
  @IsUUID('4', { message: 'Geçersiz kategori ID formatı' })
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Kapak URL en fazla 500 karakter olabilir' })
  coverImage?: string;
}
