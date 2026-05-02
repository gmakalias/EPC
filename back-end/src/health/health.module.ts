import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TerminusModule,
    HttpModule,
    PrismaModule,
    EventsModule,
  ],
  controllers: [HealthController],
})
export class HealthModule {}