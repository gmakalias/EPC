// backend/src/product-specification/product-specification.module.ts
import { Module } from '@nestjs/common';
import { ProductSpecificationService } from './product-specification.service';
import { ProductSpecificationController } from './product-specification.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ProductSpecificationService],
  controllers: [ProductSpecificationController],
  exports: [ProductSpecificationService],
})
export class ProductSpecificationModule {}