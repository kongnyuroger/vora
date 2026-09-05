import { Controller, Get, Query } from '@nestjs/common';
import { SearchLandmarksDto } from './dto/search-landmarks.dto';
import { LandmarksService } from './landmarks.service';

@Controller('landmarks')
export class LandmarksController {
  constructor(private readonly landmarksService: LandmarksService) {}

  @Get('search')
  search(@Query() { q, lat, lng }: SearchLandmarksDto) {
    const proximity =
      lat !== undefined && lng !== undefined ? { lat, lng } : undefined;
    return this.landmarksService.search(q, proximity);
  }
}
