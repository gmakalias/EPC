import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RulesService } from './rules.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rules')
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Get('offering/:id')
  @ApiOperation({ summary: 'Get business rules for a specific offering' })
  async getRules(@Param('id') id: string) {
    return this.rulesService.getRulesByOffering(id);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate product combination against rules' })
  async validate(@Body() body: { offeringId: string; associatedIds: string[] }) {
    return this.rulesService.validateCompatibility(body.offeringId, body.associatedIds);
  }
}