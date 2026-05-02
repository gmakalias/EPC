import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ResourceService } from './resource.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Resource Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('resources')
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Get()
  @ApiOperation({ summary: 'List resources with optional status filter' })
  async findAll(@Query('status') status: string) {
    return this.resourceService.findAll(status);
  }

  @Post(':id/reserve')
  @ApiOperation({ summary: 'Mark a resource as reserved' })
  async reserve(@Param('id') id: string) {
    return this.resourceService.reserveResource(id);
  }
}