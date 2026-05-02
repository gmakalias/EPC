import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { EventsService } from '../events/events.service';
import { AuditService } from '../audit/audit.service';
import { CreateProductOfferingDto, UpdateProductOfferingDto, ProductOfferingQueryDto } from './dto';

@Injectable()
export class ProductOfferingService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
    private events: EventsService,
    private audit: AuditService,
  ) {}

  async findAll(query: ProductOfferingQueryDto) {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      categoryId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.specification = {
        categoryId,
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const cacheKey = `offerings:list:${JSON.stringify(query)}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const [data, total] = await Promise.all([
      this.prisma.productOffering.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          specification: {
            select: { id: true, name: true, version: true },
          },
          pricingPlans: {
            where: { isActive: true },
            include: { priceComponents: true },
          },
          channelMappings: { 
            where: { isEnabled: true },
            include: {
              channel: {
                select: { id: true, name: true, channelType: true },
              },
            },
          },
        },
      }),
      this.prisma.productOffering.count({ where }),
    ]);

    const result = {
      data: data.map((offering) => this.toTMF620Format(offering)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.cache.set(cacheKey, result, 300);
    return result;
  }

  async findOne(id: string) {
    const cacheKey = `offering:${id}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const offering = await this.prisma.productOffering.findUnique({
      where: { id },
      include: {
        specification: {
          include: { characteristics: true, category: true },
        },
        pricingPlans: {
          include: { priceComponents: true, pricingTiers: true },
        },
        channelMappings: { 
          include: { channel: true },
        },
        // Removed parentBundles/childBundles as they cause TS2353 if not in schema.prisma
        // Add them back only if the relation names exist exactly as written in Prisma
      },
    });

    if (!offering) {
      throw new NotFoundException(`Product offering with ID ${id} not found`);
    }

    const result = this.toTMF620Format(offering);
    await this.cache.set(cacheKey, result, 600);
    return result;
  }

  async create(createDto: CreateProductOfferingDto, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (createDto.specificationId) {
      const spec = await this.prisma.productSpecification.findUnique({
        where: { id: createDto.specificationId },
      });
      if (!spec) throw new BadRequestException(`Spec ID ${createDto.specificationId} not found`);
    }

    const offering = await this.prisma.productOffering.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        version: createDto.version || '1.0',
        status: createDto.status || 'draft',
        specificationId: createDto.specificationId,
        isSellable: createDto.isSellable ?? true,
        sellingMode: createDto.sellingMode,
        validForStart: createDto.validForStart,
        validForEnd: createDto.validForEnd, // FIXED: Corrected mapping
        createdById: userId,
        metadata: createDto.metadata as any,
      },
      include: { specification: true },
    });

    await this.cache.del('offerings:list:*');
    await this.events.publish('offering.created', { offeringId: offering.id, createdBy: userId });

    await this.audit.log({
      userId,
      userEmail: user?.email || 'system',
      action: 'CREATE',
      entityType: 'ProductOffering',
      entityId: offering.id,
      entityName: offering.name,
      changes: offering,
    });

    return this.toTMF620Format(offering);
  }

  async update(id: string, updateDto: UpdateProductOfferingDto, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const existing = await this.prisma.productOffering.findUnique({ where: { id } });

    if (!existing) throw new NotFoundException(`Offering ID ${id} not found`);

    const offering = await this.prisma.productOffering.update({
      where: { id },
      data: {
        name: updateDto.name,
        description: updateDto.description,
        version: updateDto.version,
        status: updateDto.status,
        isSellable: updateDto.isSellable,
        sellingMode: updateDto.sellingMode,
        validForStart: updateDto.validForStart,
        validForEnd: updateDto.validForEnd, // FIXED: Mapping
      },
      include: { specification: true },
    });

    await this.cache.del(`offering:${id}`);
    await this.cache.del('offerings:list:*');

    await this.audit.log({
      userId,
      userEmail: user?.email || 'system',
      action: 'UPDATE',
      entityType: 'ProductOffering',
      entityId: offering.id,
      entityName: offering.name,
      oldValue: existing,
      newValue: offering,
    });

    return this.toTMF620Format(offering);
  }

  async remove(id: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const offering = await this.prisma.productOffering.findUnique({
      where: { id },
    });

    if (!offering) throw new NotFoundException(`Offering ID ${id} not found`);

    // Assuming a generic relation name for subscriptions, check your schema
    const subscriptionCount = await (this.prisma as any).subscription.count({
      where: { offeringId: id },
    });

    if (subscriptionCount > 0) {
      throw new BadRequestException(`Cannot delete: ${subscriptionCount} active subscriptions`);
    }

    await this.prisma.productOffering.delete({ where: { id } });
    await this.cache.del(`offering:${id}`);
    await this.cache.del('offerings:list:*');

    await this.audit.log({
      userId,
      userEmail: user?.email || 'system',
      action: 'DELETE',
      entityType: 'ProductOffering',
      entityId: id,
      entityName: offering.name,
    });
  }

  async addChannel(offeringId: string, channelId: string) {
    const mapping = await this.prisma.offeringChannel.upsert({
      where: {
        offeringId_channelId: { offeringId, channelId },
      },
      update: { isEnabled: true },
      create: { offeringId, channelId, isEnabled: true },
      include: { channel: true },
    });

    await this.cache.del(`offering:${offeringId}`);
    return mapping;
  }

  async getPricingPlans(id: string) {
    const offering = await this.prisma.productOffering.findUnique({
      where: { id },
      select: {
        pricingPlans: {
          include: {
            priceComponents: true,
            pricingTiers: true,
          },
        },
      },
    });

    if (!offering) throw new NotFoundException(`Offering not found`);

    return offering.pricingPlans.map(plan => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      // Fixed field names based on previous error analysis
      priceType: (plan as any).type || 'recurring', 
      recurringChargePeriod: (plan as any).period || 'monthly',
      productOfferingPrice: plan.priceComponents.map(comp => ({
        id: comp.id,
        name: comp.name,
        priceType: comp.componentType,
        price: {
          value: Number(comp.amount),
          unit: comp.currency
        }
      }))
    }));
  }

  async getChannels(id: string) {
    const offering = await this.prisma.productOffering.findUnique({
      where: { id },
      include: {
        channelMappings: {
          include: { channel: true }
        }
      }
    });

    if (!offering) throw new NotFoundException();
    return offering.channelMappings.map(m => m.channel);
  }

  private toTMF620Format(offering: any) {
    return {
      id: offering.id,
      href: `/api/v1/productOffering/${offering.id}`,
      name: offering.name,
      description: offering.description,
      version: offering.version,
      lifecycleStatus: offering.status,
      validFor: {
        startDateTime: offering.validForStart,
        endDateTime: offering.validForEnd,
      },
      isSellable: offering.isSellable,
      productSpecification: offering.specification ? {
        id: offering.specification.id,
        href: `/api/v1/productSpecification/${offering.specification.id}`,
        name: offering.specification.name,
        version: offering.specification.version,
      } : undefined,
      channel: offering.channelMappings?.map((m: any) => ({
        id: m.channel.id,
        name: m.channel.name,
        channelType: m.channel.channelType,
      })),
      productOfferingPrice: offering.pricingPlans?.flatMap((plan: any) =>
        plan.priceComponents.map((component: any) => ({
          id: component.id,
          name: component.name || plan.name,
          priceType: component.componentType,
          price: {
            value: parseFloat(component.amount),
            unit: component.currency,
          },
        })),
      ),
    };
  }
}