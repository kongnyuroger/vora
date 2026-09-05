import { Body, Controller, Post } from '@nestjs/common';
import { QuoteFareDto } from './dto/quote-fare.dto';
import { FaresService } from './fares.service';

@Controller('fares')
export class FaresController {
  constructor(private readonly faresService: FaresService) {}

  @Post('quote')
  quote(
    @Body()
    { pickupLat, pickupLng, dropoffLat, dropoffLng }: QuoteFareDto,
  ) {
    return this.faresService.quote(
      { lat: pickupLat, lng: pickupLng },
      { lat: dropoffLat, lng: dropoffLng },
    );
  }
}
