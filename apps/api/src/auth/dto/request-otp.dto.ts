import { IsEnum, IsOptional, IsPhoneNumber } from 'class-validator';
import { Role } from '@prisma/client';

export class RequestOtpDto {
  /** E.164 format, e.g. "+237670000000". */
  @IsPhoneNumber(undefined)
  phone: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
