// backend/src/product-specification/product-specification.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { EventsService } from '../events/events.service';
import { AuditService } from '../audit/audit.service';
import { EventTypes } from '../events/event-types';
import { CreateProductSpecDto } from './dto/create-product-spec.dto';
import { UpdateProductSpecDto } from './dto/update-product-spec.dto';

@Injectable()
export class ProductSpecificationService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
    private events: EventsService,
    private audit: AuditService,
  ) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    status?: string;
    categoryId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      page = 1,
      limit = 20,
      status,
      categoryId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { productNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Check cache
    const cacheKey = `product-specs:list:${JSON.stringify(query)}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const [data, total] = await Promise.all([
      this.prisma.productSpecification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              path: true,
            },
          },
          characteristics: {
            orderBy: { displayOrder: 'asc' },
          },
          createdBy: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
      }),
      this.prisma.productSpecification.count({ where }),
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
    // Check cache
    const cacheKey = `product-spec:${id}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const spec = await this.prisma.productSpecification.findUnique({
      where: { id },
      include: {
        category: true,
        characteristics: {
          orderBy: { displayOrder: 'asc' },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        offerings: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!spec) {
      throw new NotFoundException(`Product specification with ID ${id} not found`);
    }

    const result = this.toTMF620Format(spec);

    // Cache for 10 minutes
    await this.cache.set(cacheKey, result, 600);

    return result;
  }

  async create(createDto: CreateProductSpecDto, userId: string) {
    // Validate category if provided
    if (createDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: createDto.categoryId },
      });

      if (!category) {
        throw new BadRequestException(
          `Category with ID ${createDto.categoryId} not found`,
        );
      }
    }

    // Check if product number already exists
    if (createDto.productNumber) {
      const existing = await this.prisma.productSpecification.findUnique({
        where: { productNumber: createDto.productNumber },
      });

      if (existing) {
        throw new BadRequestException(
          `Product specification with number ${createDto.productNumber} already exists`,
        );
      }
    }

    const spec = await this.prisma.productSpecification.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        version: createDto.version || '1.0',
        status: createDto.status || 'draft',
        lifecycleStatus: createDto.lifecycleStatus,
        validForStart: createDto.validForStart,
        validForEnd: createDto.validForEnd,
        brand: createDto.brand,
        categoryId: createDto.categoryId,
        isBundle: createDto.isBundle || false,
        productNumber: createDto.productNumber,
        createdById: userId,
        metadata: createDto.metadata,
        characteristics: createDto.characteristics
          ? {
              create: createDto.characteristics.map((char, index) => ({
                name: char.name,
                description: char.description,
                valueType: char.valueType,
                unitOfMeasure: char.unitOfMeasure,
                isRequired: char.isRequired ?? false,
                isConfigurable: char.isConfigurable ?? true,
                defaultValue: char.defaultValue,
                minValue: char.minValue,
                maxValue: char.maxValue,
                allowedValues: char.allowedValues,
                displayOrder: char.displayOrder ?? index + 1,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        characteristics: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    // Invalidate cache
    await this.cache.del('product-specs:list:*');

    // Publish event
    await this.events.publish(EventTypes.PRODUCT_CREATED, {
      specId: spec.id,
      name: spec.name,
      createdBy: userId,
    });

    // Audit log
    await this.audit.log({
      userId,
      action: 'CREATE',
      entityType: 'product_specification',
      entityId: spec.id,
      entityName: spec.name,
      changes: spec,
    });

    return this.toTMF620Format(spec);
  }

  async update(id: string, updateDto: UpdateProductSpecDto, userId?: string) {
    const existing = await this.prisma.productSpecification.findUnique({
      where: { id },
      include: { characteristics: true },
    });

    if (!existing) {
      throw new NotFoundException(`Product specification with ID ${id} not found`);
    }

    // Validate category if changing
    if (updateDto.categoryId && updateDto.categoryId !== existing.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateDto.categoryId },
      });

      if (!category) {
        throw new BadRequestException(
          `Category with ID ${updateDto.categoryId} not found`,
        );
      }
    }

    // Check product number uniqueness if changing
    if (updateDto.productNumber && updateDto.productNumber !== existing.productNumber) {
      const duplicate = await this.prisma.productSpecification.findUnique({
        where: { productNumber: updateDto.productNumber },
      });

      if (duplicate) {
        throw new BadRequestException(
          `Product specification with number ${updateDto.productNumber} already exists`,
        );
      }
    }

    const spec = await this.prisma.productSpecification.update({
      where: { id },
      data: {
        name: updateDto.name,
        description: updateDto.description,
        version: updateDto.version,
        status: updateDto.status,
        lifecycleStatus: updateDto.lifecycleStatus,
        validForStart: updateDto.validForStart,
        validForEnd: updateDto.validForEnd,
        brand: updateDto.brand,
        categoryId: updateDto.categoryId,
        isBundle: updateDto.isBundle,
        productNumber: updateDto.productNumber,
        updatedById: userId,
        metadata: updateDto.metadata,
      },
      include: {
        category: true,
        characteristics: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    // Invalidate cache
    await this.cache.del(`product-spec:${id}`);
    await this.cache.del('product-specs:list:*');

    // Publish event
    await this.events.publish(EventTypes.PRODUCT_UPDATED, {
      specId: spec.id,
      changes: updateDto,
    });

    // Audit log
    await this.audit.log({
      userId,
      action: 'UPDATE',
      entityType: 'product_specification',
      entityId: spec.id,
      entityName: spec.name,
      changes: {
        before: existing,
        after: spec,
      },
    });

    return this.toTMF620Format(spec);
  }

  async remove(id: string, userId?: string) {
    const spec = await this.prisma.productSpecification.findUnique({
      where: { id },
      include: {
        offerings: true,
      },
    });

    if (!spec) {
      throw new NotFoundException(`Product specification with ID ${id} not found`);
    }

    // Check if spec is used by any offerings
    if (spec.offerings && spec.offerings.length > 0) {
      throw new BadRequestException(
        `Cannot delete product specification that is used by ${spec.offerings.length} offering(s)`,
      );
    }

    await this.prisma.productSpecification.delete({
      where: { id },
    });

    // Invalidate cache
    await this.cache.del(`product-spec:${id}`);
    await this.cache.del('product-specs:list:*');

    // Publish event
    await this.events.publish(EventTypes.PRODUCT_DELETED, {
      specId: id,
      name: spec.name,
    });

    // Audit log
    await this.audit.log({
      userId,
      action: 'DELETE',
      entityType: 'product_specification',
      entityId: id,
      entityName: spec.name,
    });
  }

  async addCharacteristic(specId: string, characteristic: any) {
    const spec = await this.prisma.productSpecification.findUnique({
      where: { id: specId },
    });

    if (!spec) {
      throw new NotFoundException(`Product specification with ID ${specId} not found`);
    }

    const newChar = await this.prisma.productCharacteristic.create({
      data: {
        productSpecId: specId,
        name: characteristic.name,
        description: characteristic.description,
        valueType: characteristic.valueType,
        unitOfMeasure: characteristic.unitOfMeasure,
        isRequired: characteristic.isRequired ?? false,
        isConfigurable: characteristic.isConfigurable ?? true,
        defaultValue: characteristic.defaultValue,
        minValue: characteristic.minValue,
        maxValue: characteristic.maxValue,
        allowedValues: characteristic.allowedValues,
        displayOrder: characteristic.displayOrder,
      },
    });

    // Invalidate cache
    await this.cache.del(`product-spec:${specId}`);

    return newChar;
  }

  async updateCharacteristic(charId: string, data: any) {
    const characteristic = await this.prisma.productCharacteristic.update({
      where: { id: charId },
      data,
    });

    // Invalidate cache
    await this.cache.del(`product-spec:${characteristic.productSpecId}`);

    return characteristic;
  }

  async removeCharacteristic(charId: string) {
    const characteristic = await this.prisma.productCharacteristic.findUnique({
      where: { id: charId },
    });

    if (!characteristic) {
      throw new NotFoundException(`Characteristic with ID ${charId} not found`);
    }

    await this.prisma.productCharacteristic.delete({
      where: { id: charId },
    });

    // Invalidate cache
    await this.cache.del(`product-spec:${characteristic.productSpecId}`);
  }

  /**
   * Convert internal model to TMF620 format
   */
  private toTMF620Format(spec: any) {
    return {
      id: spec.id,
      href: `/api/v1/productSpecification/${spec.id}`,
      name: spec.name,
      description: spec.description,
      version: spec.version,
      lifecycleStatus: spec.status,
      validFor: {
        startDateTime: spec.validForStart,
        endDateTime: spec.validForEnd,
      },
      brand: spec.brand,
      isBundle: spec.isBundle,
      productNumber: spec.productNumber,
      category: spec.category
        ? [
            {
              id: spec.category.id,
              href: `/api/v1/category/${spec.category.id}`,
              name: spec.category.name,
            },
          ]
        : [],
      productSpecCharacteristic: spec.characteristics?.map((char: any) => ({
        id: char.id,
        name: char.name,
        description: char.description,
        valueType: char.valueType,
        configurable: char.isConfigurable,
        productSpecCharacteristicValue: [
          {
            isDefault: true,
            value: char.defaultValue,
            unitOfMeasure: char.unitOfMeasure,
            valueFrom: char.minValue,
            valueTo: char.maxValue,
          },
        ],
        validFor: {
          startDateTime: spec.validForStart,
          endDateTime: spec.validForEnd,
        },
      })),
      relatedParty: [
        ...(spec.createdBy
          ? [
              {
                id: spec.createdBy.id,
                name: spec.createdBy.fullName || spec.createdBy.email,
                role: 'Creator',
              },
            ]
          : []),
        ...(spec.updatedBy
          ? [
              {
                id: spec.updatedBy.id,
                name: spec.updatedBy.fullName || spec.updatedBy.email,
                role: 'LastModifier',
              },
            ]
          : []),
      ],
      '@baseType': 'ProductSpecification',
      '@type': 'ProductSpecification',
      '@schemaLocation': 'https://tmforum.org/schemas/ProductSpecification',
    };
  }
}