import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'VORA API — safety-first mobility for Cameroonian streets.';
  }
}
