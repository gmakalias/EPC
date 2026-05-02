// backend/src/product-offering/dto/index.ts
export * from '.';
export * from './dto/create-product-offering.dto';
export * from './dto/update-product-offering.dto';
export * from './dto/product-offering-query.dto';

// backend/src/product-offering/dto/create-product-offering.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsUUID,
  IsObject,
  MaxLength,
} from 'class-validator';

export enum OfferingStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  RETIRED = 'retired',
}

export class CreateProductOfferingDto {
  @ApiProperty({ description: 'Product offering name', example: 'COSMOTE Hybrid 550' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Detailed description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Version number', example: '1.0', default: '1.0' })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiPropertyOptional({
    description: 'Lifecycle status',
    enum: OfferingStatus,
    default: OfferingStatus.DRAFT,
  })
  @IsEnum(OfferingStatus)
  @IsOptional()
  status?: OfferingStatus;

  @ApiPropertyOptional({ description: 'Reference to product specification UUID' })
  @IsUUID()
  @IsOptional()
  specificationId?: string;

  @ApiPropertyOptional({ description: 'Is this offering sellable?', default: true })
  @IsBoolean()
  @IsOptional()
  isSellable?: boolean;

  @ApiPropertyOptional({
    description: 'Selling mode',
    example: 'online',
    enum: ['online', 'retail', 'partner', 'sales_agent'],
  })
  @IsString()
  @IsOptional()
  sellingMode?: string;

  @ApiPropertyOptional({ description: 'Valid from date', example: '2026-01-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  validForStart?: Date;

  @ApiPropertyOptional({ description: 'Valid until date' })
  @IsDateString()
  @IsOptional()
  validForEnd?: Date;

  @ApiPropertyOptional({ description: 'Additional metadata as JSON object' })
  @IsObject()
  @IsOptional()
  metadata?: any;
}