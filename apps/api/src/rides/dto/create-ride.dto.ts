import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { PaymentMethod, RideType } from '@vora/shared';

export class CreateRideDto {
  @IsEnum(RideType)
  rideType: RideType;

  @IsLatitude()
  pickupLat: number;

  @IsLongitude()
  pickupLng: number;

  @IsString()
  @MinLength(1)
  pickupLabel: string;

  @IsLatitude()
  dropoffLat: number;

  @IsLongitude()
  dropoffLng: number;

  @IsString()
  @MinLength(1)
  dropoffLabel: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}
