import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service'; // Ensure this import is here
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
  async create(@Body() createDto: CreateSubscriptionDto, @CurrentUser() user: any) {
    return this.subscriptionService.create(createDto, user.id);
  }

  @Patch(':id')
  @RequirePermissions('subscription.update')
  @ApiOperation({ summary: 'Update subscription (TMF638)' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateSubscriptionDto, @CurrentUser() user: any) {
    return this.subscriptionService.update(id, updateDto, user.id);
  }

  @Get(':id/services')
  @RequirePermissions('subscription.read')
  @ApiOperation({ summary: 'Get subscription services' })
  async getServices(@Param('id') id: string) {
    return this.subscriptionService.getServices(id);
  }
}