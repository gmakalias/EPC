// backend/src/product-specification/dto/update-product-spec.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsUUID,
  MaxLength,
  IsObject,
} from 'class-validator';
import { ProductSpecStatus } from './create-product-spec.dto';

export class UpdateProductSpecDto {
  @ApiPropertyOptional({
    description: 'Product specification name',
    example: 'Fiber 1000 Specification',
  })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Detailed description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Version number',
    example: '1.1',
  })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiPropertyOptional({
    description: 'Product status',
    enum: ProductSpecStatus,
    example: ProductSpecStatus.ACTIVE,
  })
  @IsEnum(ProductSpecStatus)
  @IsOptional()
  status?: ProductSpecStatus;

  @ApiPropertyOptional({
    description: 'Lifecycle status',
    example: 'Active',
  })
  @IsString()
  @IsOptional()
  lifecycleStatus?: string;

  @ApiPropertyOptional({
    description: 'Valid from date',
  })
  @IsDateString()
  @IsOptional()
  validForStart?: Date;

  @ApiPropertyOptional({
    description: 'Valid until date',
  })
  @IsDateString()
  @IsOptional()
  validForEnd?: Date;

  @ApiPropertyOptional({
    description: 'Brand name',
  })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({
    description: 'Category ID',
  })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Is this a bundle specification?',
  })
  @IsBoolean()
  @IsOptional()
  isBundle?: boolean;

  @ApiPropertyOptional({
    description: 'Unique product number',
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  productNumber?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata as JSON',
  })
  @IsObject()
  @IsOptional()
  metadata?: any;
}