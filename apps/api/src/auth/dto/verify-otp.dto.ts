import { IsPhoneNumber, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsPhoneNumber(undefined)
  phone: string;

  @Length(6, 6)
  otp: string;
}
