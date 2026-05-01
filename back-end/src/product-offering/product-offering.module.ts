// backend/src/product-offering/product-offering.module.ts
import { Module } from '@nestjs/common';
import { ProductOfferingService } from './product-offering.service';
import { ProductOfferingController } from './product-offering.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ProductOfferingService],
  controllers: [ProductOfferingController],
  exports: [ProductOfferingService],
})
export class ProductOfferingModule {}