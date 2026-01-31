// AssignAdminDto - Okula admin atama için DTO
import { IsEmail, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class AssignAdminDto {
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
  @MaxLength(100, { message: 'E-posta en fazla 100 karakter olabilir' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @IsOptional()
  @IsBoolean({ message: 'isMainAdmin boolean olmalıdır' })
  isMainAdmin?: boolean;
}
