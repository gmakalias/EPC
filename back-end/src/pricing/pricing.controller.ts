import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PriceCalculationRequest } from './interfaces/pricing.interface';

@ApiTags('Pricing')
@Controller('pricing')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('plans')
  @RequirePermissions('pricing.read')
  async getPlans(@Query('offeringId') offeringId?: string) {
    return this.pricingService.getPlans(offeringId);
  }

  @Post('calculate')
  @RequirePermissions('pricing.read')
  @ApiOperation({ summary: 'Calculate price with TMF620 logic' })
  async calculatePrice(@Body() request: PriceCalculationRequest) {
    return this.pricingService.calculatePrice(request);
  }
}