// backend/src/product-offering/product-offering.service.ts
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

    // Check cache first
    const cacheKey = `offerings:list:${JSON.stringify(query)}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const [data, total] = await Promise.all([
      this.prisma.productOffering.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          specification: {
            select: {
              id: true,
              name: true,
              version: true,
            },
          },
          pricingPlans: {
            where: { isActive: true },
            include: {
              priceComponents: true,
            },
          },
          channelMappings: {
            where: { isEnabled: true },
            include: {
              channel: {
                select: {
                  id: true,
                  name: true,
                  channelType: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.productOffering.count({ where }),
    ]);

    const result = {
      data: data.map(this.toTMF620Format),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache for 5 minutes
    await this.cache.set(cacheKey, result, 300);

    return result;
  }

  async findOne(id: string) {
    // Check cache first
    const cacheKey = `offering:${id}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const offering = await this.prisma.productOffering.findUnique({
      where: { id },
      include: {
        specification: {
          include: {
            characteristics: true,
            category: true,
          },
        },
        pricingPlans: {
          include: {
            priceComponents: true,
            pricingTiers: true,
          },
        },
        channelMappings: {
          include: {
            channel: true,
          },
        },
        parentBundles: {
          include: {
            childOffering: true,
          },
        },
        childBundles: {
          include: {
            parentOffering: true,
          },
        },
      },
    });

    if (!offering) {
      throw new NotFoundException(`Product offering with ID ${id} not found`);
    }

    const result = this.toTMF620Format(offering);

    // Cache for 10 minutes
    await this.cache.set(cacheKey, result, 600);

    return result;
  }

  async create(createDto: CreateProductOfferingDto, userId: string) {
    // Validate specification exists if provided
    if (createDto.specificationId) {
      const spec = await this.prisma.productSpecification.findUnique({
        where: { id: createDto.specificationId },
      });

      if (!spec) {
        throw new BadRequestException(
          `Product specification with ID ${createDto.specificationId} not found`,
        );
      }
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
        validForEnd: createDto.validForEnd,
        createdById: userId,
        metadata: createDto.metadata,
      },
      include: {
        specification: true,
      },
    });

    // Invalidate cache
    await this.cache.del('offerings:list:*');

    // Publish event
    await this.events.publish('offering.created', {
      offeringId: offering.id,
      name: offering.name,
      createdBy: userId,
    });

    // Audit log
    await this.audit.log({
      userId,
      action: 'CREATE',
      entityType: 'product_offering',
      entityId: offering.id,
      entityName: offering.name,
      changes: offering,
    });

    return this.toTMF620Format(offering);
  }

  async update(id: string, updateDto: UpdateProductOfferingDto) {
    const existing = await this.prisma.productOffering.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Product offering with ID ${id} not found`);
    }

    const offering = await this.prisma.productOffering.update({
      where: { id },
      data: {
        ...updateDto,
      },
      include: {
        specification: true,
      },
    });

    // Invalidate cache
    await this.cache.del(`offering:${id}`);
    await this.cache.del('offerings:list:*');

    // Publish event
    await this.events.publish('offering.updated', {
      offeringId: offering.id,
      changes: updateDto,
    });

    // Audit log
    await this.audit.log({
      action: 'UPDATE',
      entityType: 'product_offering',
      entityId: offering.id,
      entityName: offering.name,
      changes: {
        before: existing,
        after: offering,
      },
    });

    return this.toTMF620Format(offering);
  }

  async remove(id: string) {
    const offering = await this.prisma.productOffering.findUnique({
      where: { id },
    });

    if (!offering) {
      throw new NotFoundException(`Product offering with ID ${id} not found`);
    }

    // Check if offering is in use
    const subscriptionCount = await this.prisma.subscription.count({
      where: { offeringId: id },
    });

    if (subscriptionCount > 0) {
      throw new BadRequestException(
        `Cannot delete offering with ${subscriptionCount} active subscriptions`,
      );
    }

    await this.prisma.productOffering.delete({
      where: { id },
    });

    // Invalidate cache
    await this.cache.del(`offering:${id}`);
    await this.cache.del('offerings:list:*');

    // Publish event
    await this.events.publish('offering.deleted', {
      offeringId: id,
      name: offering.name,
    });

    // Audit log
    await this.audit.log({
      action: 'DELETE',
      entityType: 'product_offering',
      entityId: id,
      entityName: offering.name,
    });
  }

  async getPricingPlans(id: string) {
    const plans = await this.prisma.pricingPlan.findMany({
      where: { offeringId: id, isActive: true },
      include: {
        priceComponents: true,
        pricingTiers: true,
      },
    });

    return plans;
  }

  async getChannels(id: string) {
    const mappings = await this.prisma.offeringChannelMapping.findMany({
      where: { offeringId: id, isEnabled: true },
      include: {
        channel: true,
      },
    });

    return mappings.map((m) => m.channel);
  }

  async addChannel(offeringId: string, channelId: string) {
    // Verify offering exists
    const offering = await this.prisma.productOffering.findUnique({
      where: { id: offeringId },
    });

    if (!offering) {
      throw new NotFoundException(`Product offering with ID ${offeringId} not found`);
    }

    // Verify channel exists
    const channel = await this.prisma.distributionChannel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException(`Channel with ID ${channelId} not found`);
    }

    const mapping = await this.prisma.offeringChannelMapping.upsert({
      where: {
        offeringId_channelId: {
          offeringId,
          channelId,
        },
      },
      update: {
        isEnabled: true,
      },
      create: {
        offeringId,
        channelId,
        isEnabled: true,
      },
      include: {
        channel: true,
      },
    });

    // Invalidate cache
    await this.cache.del(`offering:${offeringId}`);

    return mapping;
  }

  /**
   * Convert internal model to TMF620 format
   */
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
      productSpecification: offering.specification
        ? {
            id: offering.specification.id,
            href: `/api/v1/productSpecification/${offering.specification.id}`,
            name: offering.specification.name,
            version: offering.specification.version,
          }
        : undefined,
      category: offering.specification?.category
        ? [
            {
              id: offering.specification.category.id,
              href: `/api/v1/category/${offering.specification.category.id}`,
              name: offering.specification.category.name,
            },
          ]
        : [],
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
          recurringChargePeriod: component.recurrencePeriod,
          unitOfMeasure: component.unitOfMeasure,
        })),
      ),
      bundledProductOffering: offering.childBundles?.map((bundle: any) => ({
        id: bundle.childOffering.id,
        href: `/api/v1/productOffering/${bundle.childOffering.id}`,
        name: bundle.childOffering.name,
        bundleType: bundle.bundleType,
        quantity: bundle.defaultQuantity,
      })),
      '@baseType': 'ProductOffering',
      '@type': 'ProductOffering',
      '@schemaLocation': 'https://tmforum.org/schemas/ProductOffering',
    };
  }
}