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

    const cacheKey = `product-specs:list:${JSON.stringify(query)}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const [data, total] = await Promise.all([
      this.prisma.productSpecification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: {
            select: { id: true, name: true, path: true },
          },
          characteristics: true,
          createdBy: {
            select: { id: true, email: true, fullName: true },
          },
        },
      }),
      this.prisma.productSpecification.count({ where }),
    ]);

    const result = {
      data: data.map((spec) => this.toTMF620Format(spec)),
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
    const cacheKey = `product-spec:${id}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const spec = await this.prisma.productSpecification.findUnique({
      where: { id },
      include: {
        category: true,
        characteristics: true,
        createdBy: { select: { id: true, email: true, fullName: true } },
        offerings: {
          select: { id: true, name: true, status: true },
        },
      },
    });

    if (!spec) {
      throw new NotFoundException(`Product specification with ID ${id} not found`);
    }

    const result = this.toTMF620Format(spec);
    await this.cache.set(cacheKey, result, 600);
    return result;
  }

  async create(createDto: CreateProductSpecDto, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (createDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: createDto.categoryId },
      });
      if (!category) throw new BadRequestException(`Category not found`);
    }

    const spec = await this.prisma.productSpecification.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        version: createDto.version || '1.0',
        status: createDto.status || 'active',
        lifecycleStatus: createDto.lifecycleStatus || 'DRAFT',
        validForStart: createDto.validForStart || new Date(),
        // Note: validEnd removed - not in ProductSpecification schema
        categoryId: createDto.categoryId,
        productNumber: createDto.productNumber,
        createdById: userId,
        characteristics: createDto.characteristics
          ? {
              create: createDto.characteristics.map((char) => ({
                name: char.name,
                description: char.description,
                valueType: char.valueType,
                unitOfMeasure: char.unitOfMeasure,
                isRequired: char.isRequired ?? false,
                defaultValue: char.defaultValue,
                allowedValues: char.allowedValues as any,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        characteristics: true,
        createdBy: { select: { id: true, email: true, fullName: true } },
      },
    });

    await this.cache.del('product-specs:list:*');
    await this.events.publish(EventTypes.PRODUCT_CREATED, {
      specId: spec.id,
      name: spec.name,
      createdBy: userId,
    });

	await this.audit.log({
	  userId,
	  userEmail: user?.email || 'system',
	  action: 'CREATE',
	  entityType: 'ProductSpecification',
	  entityId: spec.id,
	  entityName: spec.name,
	  changes: spec, // 'changes' exists in your interface, so this is fine
	});

    return this.toTMF620Format(spec);
  }

 async update(id: string, updateDto: UpdateProductSpecDto, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const existing = await this.prisma.productSpecification.findUnique({
      where: { id },
      include: { characteristics: true },
    });

    if (!existing) throw new NotFoundException(`Spec not found`);

    const spec = await this.prisma.productSpecification.update({
      where: { id },
      data: {
        name: updateDto.name,
        description: updateDto.description,
        version: updateDto.version,
        status: updateDto.status,
        lifecycleStatus: updateDto.lifecycleStatus,
        validForStart: updateDto.validForStart,
        categoryId: updateDto.categoryId,
        productNumber: updateDto.productNumber,
      },
    });

	await this.audit.log({
	  userId,
	  userEmail: user?.email || 'system',
	  action: 'UPDATE',
	  entityType: 'ProductSpecification',
	  entityId: spec.id,
	  entityName: spec.name,
	  oldValue: existing, // Supported by your interface
	  newValue: spec,     // Supported by your interface
	});

    return this.toTMF620Format(spec);
  }

  async addCharacteristic(specId: string, characteristic: any) {
    const newChar = await this.prisma.characteristic.create({
      data: {
        specId: specId, 
        name: characteristic.name,
        description: characteristic.description,
        valueType: characteristic.valueType,
        unitOfMeasure: characteristic.unitOfMeasure,
        isRequired: characteristic.isRequired ?? false,
        defaultValue: characteristic.defaultValue,
        allowedValues: characteristic.allowedValues || [],
      },
    });

    await this.cache.del(`product-spec:${specId}`);
    return newChar;
  }
  
  // FIX: Added missing updateCharacteristic method
  async updateCharacteristic(charId: string, data: any) {
    const existing = await this.prisma.characteristic.findUnique({ where: { id: charId } });
    if (!existing) throw new NotFoundException('Characteristic not found');

    return this.prisma.characteristic.update({
      where: { id: charId },
      data: {
        name: data.name,
        description: data.description,
        valueType: data.valueType,
        unitOfMeasure: data.unitOfMeasure,
        isRequired: data.isRequired,
        defaultValue: data.defaultValue,
        allowedValues: data.allowedValues,
      },
    });
  }
  
  // FIX: Added missing remove method
  async remove(id: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const spec = await this.prisma.productSpecification.findUnique({ where: { id } });

    if (!spec) throw new NotFoundException('Specification not found');

    await this.prisma.productSpecification.delete({ where: { id } });

	await this.audit.log({
	  userId,
	  userEmail: user?.email || 'system',
	  action: 'DELETE',
	  entityType: 'ProductSpecification',
	  entityId: id,
	  entityName: spec.name,
	});
  }
  
  async removeCharacteristic(charId: string) {
    const char = await this.prisma.characteristic.findUnique({ where: { id: charId } });
    if (!char) throw new NotFoundException('Characteristic not found');

    await this.prisma.characteristic.delete({ where: { id: charId } });
    await this.cache.del(`product-spec:${char.specId}`);
  }

  private toTMF620Format(spec: any) {
    return {
      id: spec.id,
      href: `/api/v1/productSpecification/${spec.id}`,
      name: spec.name,
      description: spec.description,
      version: spec.version,
      lifecycleStatus: spec.lifecycleStatus,
      validFor: {
        startDateTime: spec.validForStart,
      },
      productNumber: spec.productNumber,
      category: spec.category ? [{
        id: spec.category.id,
        href: `/api/v1/category/${spec.category.id}`,
        name: spec.category.name,
      }] : [],
      productSpecCharacteristic: spec.characteristics?.map((char: any) => ({
        id: char.id,
        name: char.name,
        description: char.description,
        valueType: char.valueType,
        productSpecCharacteristicValue: [{
          isDefault: true,
          value: char.defaultValue,
          unitOfMeasure: char.unitOfMeasure,
        }],
      })),
      relatedParty: [
        ...(spec.createdBy ? [{ id: spec.createdBy.id, name: spec.createdBy.fullName || spec.createdBy.email, role: 'Creator' }] : []),
      ],
    };
  }
}