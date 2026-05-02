import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResourceService {
  constructor(private prisma: PrismaService) {}

  async findAll(status?: string) {
    return this.prisma.resourceInventory.findMany({
      where: status ? { resourceStatus: status } : {},
      include: { characteristics: true },
    });
  }

  /**
   * Reserves a resource (e.g., an IP or MSISDN) during the checkout process
   */
  async reserveResource(resourceId: string) {
    const resource = await this.prisma.resourceInventory.findUnique({
      where: { id: resourceId },
    });

    if (!resource || resource.resourceStatus !== 'available') {
      throw new BadRequestException('Resource is not available for reservation');
    }

    return this.prisma.resourceInventory.update({
      where: { id: resourceId },
      data: { resourceStatus: 'reserved' },
    });
  }

  async allocateToService(resourceId: string, serviceId: string) {
    return this.prisma.resourceInventory.update({
      where: { id: resourceId },
      data: { 
        resourceStatus: 'allocated',
        serviceId: serviceId 
      },
    });
  }
}