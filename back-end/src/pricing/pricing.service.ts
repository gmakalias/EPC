import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { EventsService } from '../events/events.service';
import { EventTypes } from '../events/event-types';
import { PriceCalculationRequest, PriceBreakdown } from './interfaces/pricing.interface';

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
        offering: { select: { id: true, name: true } },
        priceComponents: true,
        pricingTiers: { orderBy: { tierLevel: 'asc' } },
      },
    });
  }

  async getPlanById(id: string) {
    const plan = await this.prisma.pricingPlan.findUnique({
      where: { id },
      include: {
        offering: true,
        priceComponents: true,
        pricingTiers: { orderBy: { tierLevel: 'asc' } },
      },
    });
    if (!plan) throw new NotFoundException(`Pricing plan with ID ${id} not found`);
    return plan;
  }

  async createPlan(data: any) {
    const offering = await this.prisma.productOffering.findUnique({
      where: { id: data.offeringId },
    });
    if (!offering) throw new BadRequestException(`Offering ${data.offeringId} not found`);

    const plan = await this.prisma.pricingPlan.create({
      data: {
        offering: {
          connect: { id: data.offeringId }
        },
        name: data.name,
        
        // FIX: The compiler specifically asked for 'type' and 'period'.
        // We map your DTO fields to the required Schema fields.
        type: data.pricingType || 'RECURRING', 
        period: data.recurrencePeriod || 'MONTHLY',
        
        // Keeping these if they also exist in your schema, 
        // but 'type' and 'period' are the ones blocking your build.
        pricingType: data.pricingType, 
        currency: data.currency || 'EUR',
        isActive: data.isActive ?? true,
        
        priceComponents: {
          create: data.components?.map((c: any) => ({
            componentType: c.type,
            name: c.name,
            amount: c.amount,
            currency: c.currency || 'EUR',
            recurrencePeriod: c.recurrencePeriod || 'monthly',
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
      include: { priceComponents: true, pricingTiers: true },
    });

    await this.events.publish(EventTypes.PRICING_PLAN_CREATED, { planId: plan.id });
    return plan;
  }

  async calculatePrice(request: PriceCalculationRequest): Promise<PriceBreakdown> {
    const { offeringId, quantity = 1 } = request;
    const plans = await this.prisma.pricingPlan.findMany({
      where: { offeringId, isActive: true },
      include: { priceComponents: true, pricingTiers: { orderBy: { tierLevel: 'asc' } } },
    });

    if (plans.length === 0) throw new BadRequestException('No active pricing plan found');
    const plan = plans[0];
    
    const breakdown: PriceBreakdown = {
      basePrice: 0,
      discounts: { product: 0, bundle: 0, customer: 0, promotional: 0 },
      subtotal: 0,
      taxes: 0,
      total: 0,
      currency: plan.currency,
      breakdown: [],
    };

    // Use plan.type or plan.pricingType depending on which one you kept in schema
    const pType = (plan as any).type || plan.pricingType;

    switch (pType?.toLowerCase()) {
      case 'recurring': breakdown.basePrice = this.calculateRecurringPrice(plan, quantity); break;
      case 'one-time': breakdown.basePrice = this.calculateOneTimePrice(plan, quantity); break;
      case 'tiered': breakdown.basePrice = this.calculateTieredPrice(plan, quantity); break;
      case 'usage': breakdown.basePrice = this.calculateUsagePrice(plan, quantity); break;
      case 'volume': breakdown.basePrice = this.calculateVolumePrice(plan, quantity); break;
      default: throw new BadRequestException(`Unsupported pricing type: ${pType}`);
    }

    const totalDiscounts = Object.values(breakdown.discounts).reduce((sum, d) => sum + d, 0);
    breakdown.subtotal = breakdown.basePrice - totalDiscounts;
    breakdown.taxes = breakdown.subtotal * 0.21;
    breakdown.total = breakdown.subtotal + breakdown.taxes;

    return breakdown;
  }
  
  private calculateRecurringPrice(plan: any, qty: number) { 
    const base = plan.priceComponents
      .filter((pc: any) => pc.componentType === 'recurring')
      .reduce((sum: number, pc: any) => sum + Number(pc.amount), 0);
    return base * qty; 
  }

  private calculateOneTimePrice(plan: any, qty: number) { 
    const base = plan.priceComponents
      .filter((pc: any) => pc.componentType === 'one-time')
      .reduce((sum: number, pc: any) => sum + Number(pc.amount), 0);
    return base * qty; 
  }

  private calculateTieredPrice(plan: any, qty: number) {
    let total = 0;
    const tiers = plan.pricingTiers;
    for (const tier of tiers) {
      if (qty > tier.fromQuantity) {
        const applicableQty = tier.toQuantity ? Math.min(qty, tier.toQuantity) - tier.fromQuantity : qty - tier.fromQuantity;
        total += applicableQty * Number(tier.pricePerUnit);
      }
    }
    return total;
  }

  private calculateUsagePrice(plan: any, qty: number) { return 0; }
  private calculateVolumePrice(plan: any, qty: number) { return 0; }
}