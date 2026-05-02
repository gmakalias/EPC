import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LifecycleService } from './lifecycle.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Lifecycle')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lifecycle')
export class LifecycleController {
  constructor(private readonly lifecycleService: LifecycleService) {}

  @Post(':type/:id/transition')
  @ApiOperation({ summary: 'Transition the lifecycle state of an entity' })
  async transition(
    @Param('type') type: 'offering' | 'specification',
    @Param('id') id: string,
    @Body('state') state: string,
    @CurrentUser() user: any,
  ) {
    return this.lifecycleService.transitionState(type, id, state, user.id);
  }
}