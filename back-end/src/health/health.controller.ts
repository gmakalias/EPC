import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service'; // Added import
import { CacheService } from '../cache/cache.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
    private prisma: PrismaService, // Inject PrismaService to pass to pingCheck
    private cacheService: CacheService, 
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    // FIX: The second argument must be the PrismaClient instance
    // The third argument is where the options (like timeout) go
    const healthCheck = await this.health.check([
      () => this.db.pingCheck('database', this.prisma, { timeout: 3000 }),
    ]);

    const stats = await this.cacheService.getStats();

    return {
      ...healthCheck,
      cache: stats,
      timestamp: new Date().toISOString(),
    };
  }
}