import { IsLatitude, IsLongitude } from 'class-validator';

export class QuoteFareDto {
  @IsLatitude()
  pickupLat: number;

  @IsLongitude()
  pickupLng: number;

  @IsLatitude()
  dropoffLat: number;

  @IsLongitude()
  dropoffLng: number;
}
