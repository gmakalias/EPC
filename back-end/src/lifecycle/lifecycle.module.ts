import { Module } from '@nestjs/common';
import { LifecycleService } from './lifecycle.service';
import { LifecycleController } from './lifecycle.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [LifecycleController],
  providers: [LifecycleService],
  exports: [LifecycleService],
})
export class LifecycleModule {}