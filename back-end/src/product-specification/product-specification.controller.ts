// backend/src/product-specification/product-specification.controller.ts
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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductSpecificationService } from './product-specification.service';
import { CreateProductSpecDto } from './dto/create-product-spec.dto';
import { UpdateProductSpecDto } from './dto/update-product-spec.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Product Specifications')
@Controller('productSpecification')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ProductSpecificationController {
  constructor(
    private readonly productSpecificationService: ProductSpecificationService,
  ) {}

  @Get()
  @RequirePermissions('product.read')
  @ApiOperation({ summary: 'List product specifications (TMF620)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Product specifications retrieved successfully' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.productSpecificationService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      categoryId,
      search,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  @RequirePermissions('product.read')
  @ApiOperation({ summary: 'Get product specification by ID (TMF620)' })
  @ApiResponse({ status: 200, description: 'Product specification found' })
  @ApiResponse({ status: 404, description: 'Product specification not found' })
  async findOne(@Param('id') id: string) {
    return this.productSpecificationService.findOne(id);
  }

  @Post()
  @RequirePermissions('product.create')
  @ApiOperation({ summary: 'Create product specification (TMF620)' })
  @ApiResponse({ status: 201, description: 'Product specification created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(
    @Body() createDto: CreateProductSpecDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.productSpecificationService.create(createDto, userId);
  }

  @Patch(':id')
  @RequirePermissions('product.update')
  @ApiOperation({ summary: 'Update product specification (TMF620)' })
  @ApiResponse({ status: 200, description: 'Product specification updated successfully' })
  @ApiResponse({ status: 404, description: 'Product specification not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProductSpecDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.productSpecificationService.update(id, updateDto, userId);
  }

  @Delete(':id')
  @RequirePermissions('product.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete product specification (TMF620)' })
  @ApiResponse({ status: 204, description: 'Product specification deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product specification not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete spec used by offerings' })
  async remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    await this.productSpecificationService.remove(id, userId);
  }

  @Post(':id/characteristics')
  @RequirePermissions('product.update')
  @ApiOperation({ summary: 'Add characteristic to product specification' })
  @ApiResponse({ status: 201, description: 'Characteristic added successfully' })
  @ApiResponse({ status: 404, description: 'Product specification not found' })
  async addCharacteristic(
    @Param('id') id: string,
    @Body() characteristic: any,
  ) {
    return this.productSpecificationService.addCharacteristic(id, characteristic);
  }

  @Patch('characteristics/:charId')
  @RequirePermissions('product.update')
  @ApiOperation({ summary: 'Update product characteristic' })
  @ApiResponse({ status: 200, description: 'Characteristic updated successfully' })
  @ApiResponse({ status: 404, description: 'Characteristic not found' })
  async updateCharacteristic(
    @Param('charId') charId: string,
    @Body() data: any,
  ) {
    return this.productSpecificationService.updateCharacteristic(charId, data);
  }

  @Delete('characteristics/:charId')
  @RequirePermissions('product.update')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove characteristic from product specification' })
  @ApiResponse({ status: 204, description: 'Characteristic removed successfully' })
  @ApiResponse({ status: 404, description: 'Characteristic not found' })
  async removeCharacteristic(@Param('charId') charId: string) {
    await this.productSpecificationService.removeCharacteristic(charId);
  }
}