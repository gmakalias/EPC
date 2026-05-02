import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get('logs')
  @RequirePermissions('audit.read')
  @ApiOperation({ summary: 'Get audit logs' })
  async getLogs(
    @Query('userId') userId?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('action') action?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.getLogs({
      userId,
      entityType,
      entityId,
      action,
      page,
      limit,
    });
  }

  @Get('entity-history')
  @RequirePermissions('audit.read')
  @ApiOperation({ summary: 'Get audit trail for specific entity' })
  async getEntityHistory(
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
  ) {
    return this.auditService.getEntityHistory(entityType, entityId);
  }

  @Get('statistics')
  @RequirePermissions('audit.read')
  @ApiOperation({ summary: 'Get audit statistics' })
  async getStatistics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.auditService.getStatistics(
      new Date(startDate),
      new Date(endDate),
    );
  }
}