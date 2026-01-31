// CreateSchoolDto - Yeni okul oluşturma için DTO
import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

// HTML ve script tag'lerini temizle
const sanitizeString = (value: string) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/<[^>]*>/g, '') // HTML tag'lerini kaldır
    .replace(/[<>]/g, '')    // < ve > karakterlerini kaldır
    .trim();
};

export class CreateSchoolDto {
  @IsString({ message: 'Okul adı metin olmalıdır' })
  @MinLength(2, { message: 'Okul adı en az 2 karakter olmalıdır' })
  @MaxLength(100, { message: 'Okul adı en fazla 100 karakter olabilir' })
  @Transform(({ value }) => sanitizeString(value))
  name!: string;

  @IsString({ message: 'Slug metin olmalıdır' })
  @MinLength(2, { message: 'Slug en az 2 karakter olmalıdır' })
  @MaxLength(50, { message: 'Slug en fazla 50 karakter olabilir' })
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug sadece küçük harf, rakam ve tire içerebilir' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Logo URL en fazla 500 karakter olabilir' })
  logo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Adres en fazla 200 karakter olabilir' })
  @Transform(({ value }) => sanitizeString(value))
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Telefon en fazla 20 karakter olabilir' })
  @Matches(/^[0-9+\-\s()]*$/, { message: 'Geçersiz telefon formatı' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
  @MaxLength(100, { message: 'E-posta en fazla 100 karakter olabilir' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;
}

export class UpdateSchoolDto {
  @IsOptional()
  @IsString({ message: 'Okul adı metin olmalıdır' })
  @MinLength(2, { message: 'Okul adı en az 2 karakter olmalıdır' })
  @MaxLength(100, { message: 'Okul adı en fazla 100 karakter olabilir' })
  @Transform(({ value }) => sanitizeString(value))
  name?: string;

  @IsOptional()
  @IsString({ message: 'Slug metin olmalıdır' })
  @MinLength(2, { message: 'Slug en az 2 karakter olmalıdır' })
  @MaxLength(50, { message: 'Slug en fazla 50 karakter olabilir' })
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug sadece küçük harf, rakam ve tire içerebilir' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Logo URL en fazla 500 karakter olabilir' })
  logo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Adres en fazla 200 karakter olabilir' })
  @Transform(({ value }) => sanitizeString(value))
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Telefon en fazla 20 karakter olabilir' })
  @Matches(/^[0-9+\-\s()]*$/, { message: 'Geçersiz telefon formatı' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
  @MaxLength(100, { message: 'E-posta en fazla 100 karakter olabilir' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @IsOptional()
  @IsBoolean({ message: 'isActive boolean olmalıdır' })
  isActive?: boolean;
}
