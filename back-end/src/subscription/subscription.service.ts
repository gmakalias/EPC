// backend/src/subscription/subscription.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { EventsService } from '../events/events.service';
import { AuditService } from '../audit/audit.service';
import { EventTypes } from '../events/event-types';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto';

@Injectable()
export class SubscriptionService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
    private events: EventsService,
    private audit: AuditService,
  ) {}

  async findAll(query: any) {
    const {
      page = 1,
      limit = 20,
      status,
      customerId,
      networkProfile,
      search,
    } = query;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (networkProfile) where.networkProfile = networkProfile;

    if (search) {
      where.OR = [
        { subscriptionNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          offering: {
            select: {
              id: true,
              name: true,
              version: true,
            },
          },
          subscriptionCharacteristics: true,
        },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return {
      data: data.map(this.toTMF638Format),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        offering: true,
        subscriptionCharacteristics: true,
        subscriptionServices: {
          include: {
            cfsService: true,
            rfsService: true,
            resource: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    return this.toTMF638Format(subscription);
  }

  async create(createDto: CreateSubscriptionDto, userId: string) {
    // Validate offering exists
    if (createDto.offeringId) {
      const offering = await this.prisma.productOffering.findUnique({
        where: { id: createDto.offeringId },
      });

      if (!offering) {
        throw new BadRequestException(`Product offering with ID ${createDto.offeringId} not found`);
      }

      if (!offering.isSellable) {
        throw new BadRequestException('This product offering is not currently sellable');
      }
    }

    // Generate subscription number
    const subscriptionNumber = await this.generateSubscriptionNumber();

    const subscription = await this.prisma.subscription.create({
      data: {
        subscriptionNumber,
        offeringId: createDto.offeringId,
        customerId: createDto.customerId,
        status: createDto.status || 'pending',
        networkProfile: createDto.networkProfile,
        operator: createDto.operator,
        tmCode: createDto.tmCode,
        activationDate: createDto.activationDate,
        metadata: createDto.metadata,
        subscriptionCharacteristics: {
          create: createDto.characteristics?.map(c => ({
            characteristicName: c.name,
            characteristicValue: c.value,
          })) || [],
        },
      },
      include: {
        offering: true,
        subscriptionCharacteristics: true,
      },
    });

    // Invalidate cache
    await this.cache.del('subscriptions:list:*');

    // Publish event
    await this.events.publish(EventTypes.SUBSCRIPTION_CREATED, {
      subscriptionId: subscription.id,
      subscriptionNumber: subscription.subscriptionNumber,
      customerId: subscription.customerId,
      offeringId: subscription.offeringId,
    });

    // Audit log
    await this.audit.log({
      userId,
      action: 'CREATE',
      entityType: 'subscription',
      entityId: subscription.id,
      entityName: subscription.subscriptionNumber,
      changes: subscription,
    });

    // If status is 'active', trigger provisioning
    if (subscription.status === 'active') {
      await this.provisionServices(subscription.id);
    }

    return this.toTMF638Format(subscription);
  }

  async update(id: string, updateDto: UpdateSubscriptionDto, userId?: string) {
    const existing = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    const subscription = await this.prisma.subscription.update({
      where: { id },
      data: {
        status: updateDto.status,
        networkProfile: updateDto.networkProfile,
        activationDate: updateDto.activationDate,
        terminationDate: updateDto.terminationDate,
        metadata: updateDto.metadata,
      },
      include: {
        offering: true,
        subscriptionCharacteristics: true,
      },
    });

    // Invalidate cache
    await this.cache.del(`subscription:${id}`);
    await this.cache.del('subscriptions:list:*');

    // Publish event based on status change
    if (existing.status !== subscription.status) {
      let eventType = EventTypes.SUBSCRIPTION_UPDATED;
      
      if (subscription.status === 'active') {
        eventType = EventTypes.SUBSCRIPTION_ACTIVATED;
        await this.provisionServices(id);
      } else if (subscription.status === 'suspended') {
        eventType = EventTypes.SUBSCRIPTION_SUSPENDED;
      } else if (subscription.status === 'terminated') {
        eventType = EventTypes.SUBSCRIPTION_TERMINATED;
        await this.deprovisionServices(id);
      }

      await this.events.publish(eventType, {
        subscriptionId: subscription.id,
        oldStatus: existing.status,
        newStatus: subscription.status,
      });
    }

    // Audit log
    await this.audit.log({
      userId,
      action: 'UPDATE',
      entityType: 'subscription',
      entityId: subscription.id,
      entityName: subscription.subscriptionNumber,
      changes: {
        before: existing,
        after: subscription,
      },
    });

    return this.toTMF638Format(subscription);
  }

  async getServices(id: string) {
    const services = await this.prisma.subscriptionService.findMany({
      where: { subscriptionId: id },
      include: {
        cfsService: true,
        rfsService: true,
        resource: true,
      },
    });

    return services.map(s => ({
      id: s.id,
      cfs: s.cfsService,
      rfs: s.rfsService,
      resource: s.resource,
      status: s.status,
    }));
  }

  /**
   * Provision CFS/RFS services for subscription
   */
  private async provisionServices(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { offering: true },
    });

    if (!subscription) return;

    // Get all CFS services (simplified - in production, this would be based on offering)
    const cfsServices = await this.prisma.cfsService.findMany({
      where: { status: 'active' },
      include: {
        rfsServices: {
          include: {
            rfsResourceMappings: {
              include: {
                resource: true,
              },
            },
          },
        },
      },
    });

    // Provision each CFS with its RFS and resources
    for (const cfs of cfsServices) {
      for (const rfs of cfs.rfsServices) {
        for (const mapping of rfs.rfsResourceMappings) {
          await this.prisma.subscriptionService.create({
            data: {
              subscriptionId,
              cfsServiceId: cfs.id,
              rfsServiceId: rfs.id,
              resourceId: mapping.resource.id,
              status: 'active',
            },
          });
        }
      }
    }

    // Publish provisioning event
    await this.events.publish(EventTypes.SERVICE_PROVISIONED, {
      subscriptionId,
      servicesCount: cfsServices.length,
    });
  }

  /**
   * Deprovision services when subscription is terminated
   */
  private async deprovisionServices(subscriptionId: string) {
    await this.prisma.subscriptionService.updateMany({
      where: { subscriptionId },
      data: { status: 'deprovisioned' },
    });

    await this.events.publish(EventTypes.SERVICE_DEPROVISIONED, {
      subscriptionId,
    });
  }

  /**
   * Generate unique subscription number
   */
  private async generateSubscriptionNumber(): Promise<string> {
    const prefix = 'SUB';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Convert to TMF638 format
   */
  private toTMF638Format(subscription: any) {
    return {
      id: subscription.id,
      href: `/api/v1/subscriptions/${subscription.id}`,
      subscriptionNumber: subscription.subscriptionNumber,
      state: subscription.status,
      customerId: subscription.customerId,
      productOffering: subscription.offering ? {
        id: subscription.offering.id,
        href: `/api/v1/productOffering/${subscription.offering.id}`,
        name: subscription.offering.name,
      } : undefined,
      characteristic: subscription.subscriptionCharacteristics?.map((c: any) => ({
        name: c.characteristicName,
        value: c.characteristicValue,
      })),
      networkProfile: subscription.networkProfile,
      operator: subscription.operator,
      tmCode: subscription.tmCode,
      activationDate: subscription.activationDate,
      terminationDate: subscription.terminationDate,
      '@baseType': 'Service',
      '@type': 'SubscriptionService',
      '@schemaLocation': 'https://tmforum.org/schemas/Service',
    };
  }
}

// backend/src/subscription/subscription.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  @RequirePermissions('subscription.read')
  @ApiOperation({ summary: 'List subscriptions (TMF638)' })
  async findAll(@Query() query: any) {
    return this.subscriptionService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('subscription.read')
  @ApiOperation({ summary: 'Get subscription by ID (TMF638)' })
  async findOne(@Param('id') id: string) {
    return this.subscriptionService.findOne(id);
  }

  @Post()
  @RequirePermissions('subscription.create')
  @ApiOperation({ summary: 'Create subscription (TMF638)' })
  async create(
    @Body() createDto: CreateSubscriptionDto,
    @CurrentUser() user: any,
  ) {
    return this.subscriptionService.create(createDto, user.id);
  }

  @Patch(':id')
  @RequirePermissions('subscription.update')
  @ApiOperation({ summary: 'Update subscription (TMF638)' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSubscriptionDto,
    @CurrentUser() user: any,
  ) {
    return this.subscriptionService.update(id, updateDto, user.id);
  }

  @Get(':id/services')
  @RequirePermissions('subscription.read')
  @ApiOperation({ summary: 'Get subscription services' })
  async getServices(@Param('id') id: string) {
    return this.subscriptionService.getServices(id);
  }
}

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
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  value: string;
}

export class CreateSubscriptionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  offeringId?: string;

  @ApiProperty()
  @IsString()
  customerId: string;

  @ApiPropertyOptional({ enum: SubscriptionStatus })
  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  networkProfile?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  operator?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tmCode?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  activationDate?: Date;

  @ApiPropertyOptional({ type: [CharacteristicDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CharacteristicDto)
  @IsOptional()
  characteristics?: CharacteristicDto[];

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: any;
}