// User DTOs - Kullanıcı işlemleri için validation
import {
  IsString,
  IsEmail,
  IsOptional,
  IsUUID,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

// HTML ve script tag'lerini temizle
const sanitizeString = (value: string) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .trim();
};

export class RegisterUserDto {
  @IsString({ message: 'İsim metin olmalıdır' })
  @MinLength(2, { message: 'İsim en az 2 karakter olmalıdır' })
  @MaxLength(100, { message: 'İsim en fazla 100 karakter olabilir' })
  @Transform(({ value }) => sanitizeString(value))
  name!: string;

  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
  @MaxLength(100, { message: 'E-posta en fazla 100 karakter olabilir' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @IsString({ message: 'Okul seçimi zorunludur' })
  @MinLength(1, { message: 'Okul seçimi zorunludur' })
  @MaxLength(50, { message: 'Okul slug en fazla 50 karakter olabilir' })
  schoolSlug!: string;

  // Öğrenci bilgileri (zorunlu)
  @IsString({ message: 'Sınıf metin olmalıdır' })
  @MinLength(1, { message: 'Sınıf boş olamaz' })
  @MaxLength(10, { message: 'Sınıf en fazla 10 karakter olabilir' })
  @Transform(({ value }) => sanitizeString(value))
  className!: string;

  @IsString({ message: 'Şube metin olmalıdır' })
  @MinLength(1, { message: 'Şube boş olamaz' })
  @MaxLength(10, { message: 'Şube en fazla 10 karakter olabilir' })
  @Transform(({ value }) => sanitizeString(value)?.toUpperCase())
  section!: string;

  @IsString({ message: 'Okul numarası metin olmalıdır' })
  @MinLength(1, { message: 'Okul numarası boş olamaz' })
  @MaxLength(20, { message: 'Okul numarası en fazla 20 karakter olabilir' })
  @Matches(/^[0-9]+$/, { message: 'Okul numarası sadece rakam içermelidir' })
  studentNumber!: string;
}

export class SelectSchoolDto {
  @IsUUID('4', { message: 'Geçersiz okul ID formatı' })
  schoolId!: string;

  // Öğrenci bilgileri
  @IsString({ message: 'Sınıf metin olmalıdır' })
  @MinLength(1, { message: 'Sınıf boş olamaz' })
  @MaxLength(10, { message: 'Sınıf en fazla 10 karakter olabilir' })
  @Transform(({ value }) => sanitizeString(value))
  className!: string;

  @IsString({ message: 'Şube metin olmalıdır' })
  @MinLength(1, { message: 'Şube boş olamaz' })
  @MaxLength(10, { message: 'Şube en fazla 10 karakter olabilir' })
  @Transform(({ value }) => sanitizeString(value)?.toUpperCase())
  section!: string;

  @IsString({ message: 'Okul numarası metin olmalıdır' })
  @MinLength(1, { message: 'Okul numarası boş olamaz' })
  @MaxLength(20, { message: 'Okul numarası en fazla 20 karakter olabilir' })
  @Matches(/^[0-9]+$/, { message: 'Okul numarası sadece rakam içermelidir' })
  studentNumber!: string;
}

// Admin tarafından kullanıcı onay/red
export class UpdateUserStatusDto {
  @IsEnum(['APPROVED', 'REJECTED'], { message: 'Geçersiz durum' })
  status!: 'APPROVED' | 'REJECTED';
}
