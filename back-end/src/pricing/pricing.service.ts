// backend/src/pricing/pricing.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { EventsService } from '../events/events.service';
import { EventTypes } from '../events/event-types';

export interface PriceCalculationRequest {
  offeringId: string;
  quantity?: number;
  customerId?: string;
  characteristics?: Record<string, any>;
  discountCodes?: string[];
}

export interface PriceBreakdown {
  basePrice: number;
  discounts: {
    product: number;
    bundle: number;
    customer: number;
    promotional: number;
  };
  subtotal: number;
  taxes: number;
  total: number;
  currency: string;
  breakdown: Array<{
    name: string;
    amount: number;
    type: string;
  }>;
}

@Injectable()
export class PricingService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
    private events: EventsService,
  ) {}

  async getPlans(offeringId?: string) {
    const where: any = { isActive: true };
    if (offeringId) where.offeringId = offeringId;

    return this.prisma.pricingPlan.findMany({
      where,
      include: {
        offering: {
          select: {
            id: true,
            name: true,
          },
        },
        priceComponents: true,
        pricingTiers: {
          orderBy: { tierLevel: 'asc' },
        },
      },
    });
  }

  async getPlanById(id: string) {
    const plan = await this.prisma.pricingPlan.findUnique({
      where: { id },
      include: {
        offering: true,
        priceComponents: true,
        pricingTiers: {
          orderBy: { tierLevel: 'asc' },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Pricing plan with ID ${id} not found`);
    }

    return plan;
  }

  async createPlan(data: any) {
    const offering = await this.prisma.productOffering.findUnique({
      where: { id: data.offeringId },
    });

    if (!offering) {
      throw new BadRequestException(`Product offering with ID ${data.offeringId} not found`);
    }

    const plan = await this.prisma.pricingPlan.create({
      data: {
        offeringId: data.offeringId,
        name: data.name,
        description: data.description,
        pricingType: data.pricingType,
        currency: data.currency || 'EUR',
        validForStart: data.validForStart,
        validForEnd: data.validForEnd,
        isActive: data.isActive ?? true,
        metadata: data.metadata,
        priceComponents: {
          create: data.components?.map((c: any) => ({
            componentType: c.type,
            name: c.name,
            amount: c.amount,
            currency: c.currency || 'EUR',
            recurrencePeriod: c.recurrencePeriod,
            unitOfMeasure: c.unitOfMeasure,
          })) || [],
        },
        pricingTiers: data.tiers ? {
          create: data.tiers.map((t: any, index: number) => ({
            tierLevel: index + 1,
            fromQuantity: t.from,
            toQuantity: t.to,
            pricePerUnit: t.price,
          })),
        } : undefined,
      },
      include: {
        priceComponents: true,
        pricingTiers: true,
      },
    });

    await this.events.publish(EventTypes.PRICING_PLAN_CREATED, {
      planId: plan.id,
      offeringId: plan.offeringId,
    });

    return plan;
  }

  async updatePlan(id: string, data: any) {
    const existing = await this.prisma.pricingPlan.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Pricing plan with ID ${id} not found`);
    }

    const plan = await this.prisma.pricingPlan.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        validForStart: data.validForStart,
        validForEnd: data.validForEnd,
        metadata: data.metadata,
      },
      include: {
        priceComponents: true,
        pricingTiers: true,
      },
    });

    await this.events.publish(EventTypes.PRICING_PLAN_UPDATED, {
      planId: plan.id,
      changes: data,
    });

    return plan;
  }

  /**
   * Calculate price for an offering with all applicable discounts
   */
  async calculatePrice(request: PriceCalculationRequest): Promise<PriceBreakdown> {
    const { offeringId, quantity = 1, customerId } = request;

    // Get pricing plans for offering
    const plans = await this.prisma.pricingPlan.findMany({
      where: {
        offeringId,
        isActive: true,
      },
      include: {
        priceComponents: true,
        pricingTiers: {
          orderBy: { tierLevel: 'asc' },
        },
      },
    });

    if (plans.length === 0) {
      throw new BadRequestException('No active pricing plan found for this offering');
    }

    const plan = plans[0]; // Use first active plan
    const breakdown: PriceBreakdown = {
      basePrice: 0,
      discounts: {
        product: 0,
        bundle: 0,
        customer: 0,
        promotional: 0,
      },
      subtotal: 0,
      taxes: 0,
      total: 0,
      currency: plan.currency,
      breakdown: [],
    };

    // Calculate base price based on pricing type
    switch (plan.pricingType) {
      case 'recurring':
        breakdown.basePrice = this.calculateRecurringPrice(plan, quantity);
        break;
      
      case 'one-time':
        breakdown.basePrice = this.calculateOneTimePrice(plan, quantity);
        break;
      
      case 'tiered':
        breakdown.basePrice = this.calculateTieredPrice(plan, quantity);
        break;
      
      case 'usage':
        breakdown.basePrice = this.calculateUsagePrice(plan, quantity);
        break;
      
      case 'volume':
        breakdown.basePrice = this.calculateVolumePrice(plan, quantity);
        break;
      
      default:
        throw new BadRequestException(`Unsupported pricing type: ${plan.pricingType}`);
    }

    // Add components to breakdown
    plan.priceComponents.forEach(component => {
      breakdown.breakdown.push({
        name: component.name || component.componentType,
        amount: parseFloat(component.amount.toString()),
        type: component.componentType,
      });
    });

    // Apply discounts
    if (customerId) {
      breakdown.discounts.customer = await this.calculateCustomerDiscount(customerId, breakdown.basePrice);
    }

    // TODO: Calculate bundle discount if part of bundle
    // TODO: Apply promotional campaigns
    
    const totalDiscounts = Object.values(breakdown.discounts).reduce((sum, d) => sum + d, 0);
    breakdown.subtotal = breakdown.basePrice - totalDiscounts;

    // Calculate taxes (21% VAT for Greece)
    breakdown.taxes = breakdown.subtotal * 0.21;
    breakdown.total = breakdown.subtotal + breakdown.taxes;

    // Publish calculation event
    await this.events.publish(EventTypes.PRICING_CALCULATED, {
      offeringId,
      total: breakdown.total,
      customerId,
    });

    return breakdown;
  }

  /**
   * Calculate recurring price (monthly/yearly subscription)
   */
  private calculateRecurringPrice(plan: any, quantity: number): number {
    const recurringComponents = plan.priceComponents.filter(
      (c: any) => c.componentType === 'recurring'
    );

    return recurringComponents.reduce(
      (sum: number, c: any) => sum + parseFloat(c.amount.toString()) * quantity,
      0
    );
  }

  /**
   * Calculate one-time price
   */
  private calculateOneTimePrice(plan: any, quantity: number): number {
    const oneTimeComponents = plan.priceComponents.filter(
      (c: any) => c.componentType === 'one-time'
    );

    return oneTimeComponents.reduce(
      (sum: number, c: any) => sum + parseFloat(c.amount.toString()) * quantity,
      0
    );
  }

  /**
   * Calculate tiered price (different rates per tier)
   */
  private calculateTieredPrice(plan: any, quantity: number): number {
    if (!plan.pricingTiers || plan.pricingTiers.length === 0) {
      throw new BadRequestException('No pricing tiers defined');
    }

    let totalPrice = 0;
    let remainingQuantity = quantity;

    for (const tier of plan.pricingTiers) {
      const tierStart = parseFloat(tier.fromQuantity.toString());
      const tierEnd = tier.toQuantity 
        ? parseFloat(tier.toQuantity.toString()) 
        : Infinity;
      const pricePerUnit = parseFloat(tier.pricePerUnit.toString());

      if (remainingQuantity <= 0) break;

      const tierCapacity = tierEnd - tierStart + 1;
      const quantityInTier = Math.min(remainingQuantity, tierCapacity);

      totalPrice += quantityInTier * pricePerUnit;
      remainingQuantity -= quantityInTier;
    }

    return totalPrice;
  }

  /**
   * Calculate usage-based price
   */
  private calculateUsagePrice(plan: any, usage: number): number {
    const usageComponents = plan.priceComponents.filter(
      (c: any) => c.componentType === 'usage'
    );

    return usageComponents.reduce(
      (sum: number, c: any) => sum + parseFloat(c.amount.toString()) * usage,
      0
    );
  }

  /**
   * Calculate volume price (bulk discount)
   */
  private calculateVolumePrice(plan: any, quantity: number): number {
    if (!plan.pricingTiers || plan.pricingTiers.length === 0) {
      throw new BadRequestException('No pricing tiers defined');
    }

    // Find applicable tier based on total quantity
    const applicableTier = plan.pricingTiers
      .slice()
      .reverse()
      .find((tier: any) => {
        const tierStart = parseFloat(tier.fromQuantity.toString());
        return quantity >= tierStart;
      });

    if (!applicableTier) {
      throw new BadRequestException('No applicable pricing tier found');
    }

    const pricePerUnit = parseFloat(applicableTier.pricePerUnit.toString());
    return quantity * pricePerUnit;
  }

  /**
   * Calculate customer-specific discount
   */
  private async calculateCustomerDiscount(customerId: string, basePrice: number): Promise<number> {
    // TODO: Implement customer segment-based discounts
    // For now, return 0
    return 0;
  }
}

// backend/src/pricing/pricing.controller.ts
import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Pricing')
@Controller('pricing')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('plans')
  @RequirePermissions('pricing.read')
  @ApiOperation({ summary: 'Get pricing plans' })
  async getPlans(@Query('offeringId') offeringId?: string) {
    return this.pricingService.getPlans(offeringId);
  }

  @Get('plans/:id')
  @RequirePermissions('pricing.read')
  @ApiOperation({ summary: 'Get pricing plan by ID' })
  async getPlanById(@Param('id') id: string) {
    return this.pricingService.getPlanById(id);
  }

  @Post('plans')
  @RequirePermissions('pricing.create')
  @ApiOperation({ summary: 'Create pricing plan' })
  async createPlan(@Body() data: any) {
    return this.pricingService.createPlan(data);
  }

  @Patch('plans/:id')
  @RequirePermissions('pricing.update')
  @ApiOperation({ summary: 'Update pricing plan' })
  async updatePlan(@Param('id') id: string, @Body() data: any) {
    return this.pricingService.updatePlan(id, data);
  }

  @Post('calculate')
  @RequirePermissions('pricing.read')
  @ApiOperation({ summary: 'Calculate price with discounts' })
  async calculatePrice(@Body() request: any) {
    return this.pricingService.calculatePrice(request);
  }
}