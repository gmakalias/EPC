import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  private readonly logger = new Logger(CacheService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    
    this.redis = new Redis(redisUrl, {
      retryStrategy: (times) => {
        // Exponential backoff with a cap at 2 seconds
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.redis.on('error', (err) => {
      this.logger.error('Redis connection error:', err);
    });

    this.redis.on('connect', () => {
      this.logger.log('✅ Redis connected successfully');
    });
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      return JSON.parse(value);
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete key(s). Supports wildcards (though use sparingly in prod)
   */
  async del(pattern: string): Promise<number> {
    try {
      if (pattern.includes('*')) {
        const keys = await this.redis.keys(pattern);
        if (keys.length === 0) return 0;
        return await this.redis.del(...keys);
      }
      return await this.redis.del(pattern);
    } catch (error) {
      this.logger.error(`Cache delete error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      return false;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.redis.expire(key, seconds);
  }

  async incr(key: string): Promise<number> {
    return await this.redis.incr(key);
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];
    try {
      const values = await this.redis.mget(...keys);
      return values.map(v => v ? JSON.parse(v) : null);
    } catch (error) {
      this.logger.error(`Cache mget error:`, error);
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs: Record<string, any>): Promise<void> {
    try {
      const pairs: string[] = [];
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        pairs.push(key, JSON.stringify(value));
      });
      if (pairs.length > 0) {
        await this.redis.mset(...pairs);
      }
    } catch (error) {
      this.logger.error(`Cache mset error:`, error);
    }
  }

  async flushDb(): Promise<void> {
    await this.redis.flushdb();
  }

  async getStats() {
    try {
      const info = await this.redis.info('stats');
      const dbSize = await this.redis.dbsize();
      return {
        dbSize,
        info: this.parseRedisInfo(info),
      };
    } catch (error) {
      return null;
    }
  }

  private parseRedisInfo(info: string): Record<string, string> {
    const lines = info.split('\r\n');
    const result: Record<string, string> = {};
    lines.forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) result[key] = value;
      }
    });
    return result;
  }
}