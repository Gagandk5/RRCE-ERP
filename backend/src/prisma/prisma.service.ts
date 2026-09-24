import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✓ Connected to PostgreSQL via Prisma');
    } catch (err) {
      console.warn('Notice: Prisma could not connect to PostgreSQL immediately. Ensure PostgreSQL is running via docker-compose.');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

