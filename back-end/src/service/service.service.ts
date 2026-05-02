import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServiceService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.serviceInventory.findMany({
      include: {
        characteristics: true,
      },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.serviceInventory.findUnique({
      where: { id },
      include: { characteristics: true },
    });
    if (!service) throw new NotFoundException(`Service ${id} not found`);
    return service;
  }

  async create(data: any) {
    return this.prisma.serviceInventory.create({
      data: {
        name: data.name,
        serviceType: data.serviceType, // e.g., 'CFS' or 'RFS'
        serviceState: 'active',
        subscriptionId: data.subscriptionId,
        characteristics: {
          create: data.characteristics || [],
        },
      },
    });
  }

  async updateState(id: string, state: string) {
    return this.prisma.serviceInventory.update({
      where: { id },
      data: { serviceState: state },
    });
  }
}