import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;
  private memoryStore: Map<string, string> = new Map();
  private isConnected = false;

  async onModuleInit() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // don't hang if offline
        lazyConnect: true,
      });

      await this.client.connect().catch((e) => {
        this.isConnected = false;
        console.warn('Notice: Redis server offline. Falling back to internal in-memory cache.');
      });

      if (this.client.status === 'ready') {
        this.isConnected = true;
        console.log('✓ Connected to Redis');
      }
    } catch (e) {
      this.isConnected = false;
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch (e) {
        return this.memoryStore.get(key) || null;
      }
    }
    return this.memoryStore.get(key) || null;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch (e) {
        // Fallback to memory
      }
    }
    this.memoryStore.set(key, value);
    if (ttlSeconds) {
      setTimeout(() => this.memoryStore.delete(key), ttlSeconds * 1000);
    }
  }

  async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
      } catch (e) { }
    }
    this.memoryStore.delete(key);
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => { });
    }
  }
}

