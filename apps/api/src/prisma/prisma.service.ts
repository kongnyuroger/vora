import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Connects lazily (on first query) rather than in onModuleInit, so routes
 * that don't touch the database — like /health — work before DATABASE_URL
 * points at a running Postgres instance.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
