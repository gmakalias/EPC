// backend/src/product-specification/dto/create-product-spec.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsUUID,
  MaxLength,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ProductSpecStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  RETIRED = 'retired',
  OBSOLETE = 'obsolete',
}

export enum CharacteristicValueType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  ENUM = 'enum',
  OBJECT = 'object',
  ARRAY = 'array',
}

export class CharacteristicDto {
  @ApiProperty({
    description: 'Characteristic name',
    example: 'Bandwidth',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Characteristic description',
    example: 'Maximum bandwidth speed',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Value type of the characteristic',
    enum: CharacteristicValueType,
    example: CharacteristicValueType.NUMBER,
  })
  @IsEnum(CharacteristicValueType)
  valueType: CharacteristicValueType;

  @ApiPropertyOptional({
    description: 'Unit of measure',
    example: 'Mbps',
  })
  @IsString()
  @IsOptional()
  unitOfMeasure?: string;

  @ApiPropertyOptional({
    description: 'Is this characteristic required?',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Is this characteristic configurable by customer?',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isConfigurable?: boolean;

  @ApiPropertyOptional({
    description: 'Default value',
    example: '1000',
  })
  @IsString()
  @IsOptional()
  defaultValue?: string;

  @ApiPropertyOptional({
    description: 'Minimum value (for numeric types)',
    example: 100,
  })
  @IsNumber()
  @IsOptional()
  minValue?: number;

  @ApiPropertyOptional({
    description: 'Maximum value (for numeric types)',
    example: 10000,
  })
  @IsNumber()
  @IsOptional()
  maxValue?: number;

  @ApiPropertyOptional({
  description: 'Allowed values (for enum types)',
  type: 'object',
  additionalProperties: true, // This fixes the TS2345 error
  })
  
  @ApiPropertyOptional({ 
  description: 'Allowed values (for enum types)' 
  })
  allowedValues?: any;

  @ApiPropertyOptional({
    description: 'Display order',
    example: 1,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  displayOrder?: number;
}

export class CreateProductSpecDto {
  @ApiProperty({
    description: 'Product specification name',
    example: 'Fiber 1000 Specification',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Detailed description',
    example: 'High-speed fiber internet specification with 1Gbps download speed',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Version number',
    example: '1.0',
    default: '1.0',
  })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiPropertyOptional({
    description: 'Product status',
    enum: ProductSpecStatus,
    example: ProductSpecStatus.DRAFT,
    default: ProductSpecStatus.DRAFT,
  })
  @IsEnum(ProductSpecStatus)
  @IsOptional()
  status?: ProductSpecStatus;

  @ApiPropertyOptional({
    description: 'Lifecycle status',
    example: 'In Design',
  })
  @IsString()
  @IsOptional()
  lifecycleStatus?: string;

  @ApiPropertyOptional({
    description: 'Valid from date',
    example: '2026-01-01T00:00:00Z',
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
    example: 'COSMOTE',
  })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({
    description: 'Category ID',
    example: 'cat-internet',
  })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Is this a bundle specification?',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isBundle?: boolean;

  @ApiPropertyOptional({
    description: 'Unique product number',
    example: 'SPEC-FIB-1000',
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  productNumber?: string;

  @ApiPropertyOptional({
    description: 'Product characteristics',
    type: [CharacteristicDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CharacteristicDto)
  @IsOptional()
  characteristics?: CharacteristicDto[];

  @ApiPropertyOptional({
    description: 'Additional metadata as JSON',
    example: { category: 'premium', region: 'EU' },
  })
  @IsObject()
  @IsOptional()
  metadata?: any;
}