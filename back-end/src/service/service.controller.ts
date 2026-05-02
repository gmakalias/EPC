import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ServiceService } from './service.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Service Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get()
  @ApiOperation({ summary: 'List all active services in inventory' })
  async findAll() {
    return this.serviceService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific service instance' })
  async findOne(@Param('id') id: string) {
    return this.serviceService.findOne(id);
  }

  @Patch(':id/state')
  @ApiOperation({ summary: 'Update service state (e.g., suspend/resume)' })
  async updateState(@Param('id') id: string, @Body('state') state: string) {
    return this.serviceService.updateState(id, state);
  }
}