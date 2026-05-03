// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller'; // <--- 1. Import the new controller
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductSpecificationModule } from './product-specification/product-specification.module';
import { ProductOfferingModule } from './product-offering/product-offering.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { PricingModule } from './pricing/pricing.module';
import { CategoryModule } from './category/category.module';
import { RulesModule } from './rules/rules.module';
import { LifecycleModule } from './lifecycle/lifecycle.module';
import { ServiceModule } from './service/service.module';
import { ResourceModule } from './resource/resource.module';
import { AuditModule } from './audit/audit.module';
import { CacheModule } from './cache/cache.module';
import { EventsModule } from './events/events.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000, 
      limit: 10,
    }]),

    // Core modules
    PrismaModule,
    CacheModule,
    EventsModule,
    AuditModule,
    HealthModule,

    // Feature modules
    AuthModule,
    UsersModule,
    ProductSpecificationModule,
    ProductOfferingModule,
    SubscriptionModule,
    PricingModule,
    CategoryModule,
    RulesModule,
    LifecycleModule,
    ServiceModule,
    ResourceModule,
  ],
  controllers: [AppController], // <--- 2. Register the AppController here
})
export class AppModule {}