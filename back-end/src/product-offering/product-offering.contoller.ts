// backend/src/product-offering/product-offering.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductOfferingService } from './product-offering.service';
import { CreateProductOfferingDto, UpdateProductOfferingDto, ProductOfferingQueryDto } from '.';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Product Offerings')
@Controller('productOffering')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ProductOfferingController {
  constructor(private readonly productOfferingService: ProductOfferingService) {}

  @Get()
  @RequirePermissions('offering.read')
  @ApiOperation({ summary: 'List product offerings (TMF620)' })
  @ApiResponse({ status: 200, description: 'Product offerings retrieved successfully' })
  async findAll(@Query() query: ProductOfferingQueryDto) {
    return this.productOfferingService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('offering.read')
  @ApiOperation({ summary: 'Get product offering by ID (TMF620)' })
  @ApiResponse({ status: 200, description: 'Product offering found' })
  @ApiResponse({ status: 404, description: 'Product offering not found' })
  async findOne(@Param('id') id: string) {
    return this.productOfferingService.findOne(id);
  }

  @Post()
  @RequirePermissions('offering.create')
  @ApiOperation({ summary: 'Create product offering (TMF620)' })
  @ApiResponse({ status: 201, description: 'Product offering created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(
    @Body() createDto: CreateProductOfferingDto,
    @CurrentUser() user: any,
  ) {
    return this.productOfferingService.create(createDto, user.id);
  }

  @Patch(':id')
  @RequirePermissions('offering.update')
  @ApiOperation({ summary: 'Update product offering (TMF620)' })
  @ApiResponse({ status: 200, description: 'Product offering updated successfully' })
  @ApiResponse({ status: 404, description: 'Product offering not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProductOfferingDto,
  ) {
    return this.productOfferingService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermissions('offering.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete product offering (TMF620)' })
  @ApiResponse({ status: 204, description: 'Product offering deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product offering not found' })
  async remove(@Param('id') id: string) {
    await this.productOfferingService.remove(id);
  }

  @Get(':id/pricing')
  @RequirePermissions('offering.read', 'pricing.read')
  @ApiOperation({ summary: 'Get pricing plans for offering' })
  async getPricing(@Param('id') id: string) {
    return this.productOfferingService.getPricingPlans(id);
  }

  @Get(':id/channels')
  @RequirePermissions('offering.read')
  @ApiOperation({ summary: 'Get distribution channels for offering' })
  async getChannels(@Param('id') id: string) {
    return this.productOfferingService.getChannels(id);
  }

  @Post(':id/channels')
  @RequirePermissions('offering.update')
  @ApiOperation({ summary: 'Add distribution channel to offering' })
  async addChannel(
    @Param('id') id: string,
    @Body() body: { channelId: string },
  ) {
    return this.productOfferingService.addChannel(id, body.channelId);
  }
}