import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [ConfigModule], // Crucial for ConfigService
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}