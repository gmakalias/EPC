// backend/src/subscription/dto/update-subscription.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString, IsObject } from 'class-validator';
import { SubscriptionStatus } from './create-subscription.dto';

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({
    description: 'Subscription status',
    enum: SubscriptionStatus,
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
    description: 'Activation date',
    example: '2026-05-01T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  activationDate?: Date;

  @ApiPropertyOptional({
    description: 'Termination date',
    example: '2027-05-01T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  terminationDate?: Date;

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  @IsObject()
  @IsOptional()
  metadata?: any;
}