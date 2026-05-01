// backend/src/product-offering/dto/update-product-offering.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
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
import { OfferingStatus } from './create-product-offering.dto';

export class UpdateProductOfferingDto {
  @ApiPropertyOptional({ description: 'Product offering name' })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Detailed description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Version number' })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiPropertyOptional({
    description: 'Lifecycle status',
    enum: OfferingStatus,
  })
  @IsEnum(OfferingStatus)
  @IsOptional()
  status?: OfferingStatus;

  @ApiPropertyOptional({ description: 'Reference to product specification UUID' })
  @IsUUID()
  @IsOptional()
  specificationId?: string;

  @ApiPropertyOptional({ description: 'Is this offering sellable?' })
  @IsBoolean()
  @IsOptional()
  isSellable?: boolean;

  @ApiPropertyOptional({
    description: 'Selling mode',
    enum: ['online', 'retail', 'partner', 'sales_agent'],
  })
  @IsString()
  @IsOptional()
  sellingMode?: string;

  @ApiPropertyOptional({ description: 'Valid from date' })
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