// backend/src/subscription/dto/create-subscription.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export enum SubscriptionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
  TERMINATED = 'terminated',
}

export class CharacteristicDto {
  @ApiProperty({
    description: 'Characteristic name',
    example: 'IMSI',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Characteristic value',
    example: '202010123456789',
  })
  @IsString()
  value: string;
}

export class CreateSubscriptionDto {
  @ApiPropertyOptional({
    description: 'Product offering ID',
    example: 'offering-uuid',
  })
  @IsString()
  @IsOptional()
  offeringId?: string;

  @ApiProperty({
    description: 'Customer ID',
    example: 'customer-12345',
  })
  @IsString()
  customerId: string;

  @ApiPropertyOptional({
    description: 'Subscription status',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
  })
  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @ApiPropertyOptional({
    description: 'Network profile',
    example: 'Hybrid',
  })
  @IsString()
  @IsOptional()
  networkProfile?: string;

  @ApiPropertyOptional({
    description: 'Operator name',
    example: 'COSMOTE',
  })
  @IsString()
  @IsOptional()
  operator?: string;

  @ApiPropertyOptional({
    description: 'TM Code',
    example: '550',
  })
  @IsString()
  @IsOptional()
  tmCode?: string;

  @ApiPropertyOptional({
    description: 'Activation date',
    example: '2026-05-01T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  activationDate?: Date;

  @ApiPropertyOptional({
    description: 'Subscription characteristics',
    type: [CharacteristicDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CharacteristicDto)
  @IsOptional()
  characteristics?: CharacteristicDto[];

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  @IsObject()
  @IsOptional()
  metadata?: any;
}