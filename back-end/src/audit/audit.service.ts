// backend/src/audit/audit.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogInput, AuditFilters } from './interfaces/audit-log.interface';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(input: AuditLogInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          user: { connect: { id: input.userId } },
          userEmail: input.userEmail,
          action: input.action,
          
          // Mapping fields to satisfy Prisma Schema requirements
          entity: input.entityType,
          entityType: input.entityType,
          entityId: input.entityId,
          entityName: input.entityName,
          
          // Handling JSON/String conversion for changes
          details: input.changes ? JSON.stringify(input.changes) : "{}",
          changes: input.changes ? JSON.stringify(input.changes) : null,
          
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          sessionId: input.sessionId,
        },
      });
    } catch (error) {
      console.error('Audit log failure:', error);
    }
  }

  async getLogs(filters: AuditFilters) {
    const { userId, entityType, entityId, action, startDate, endDate, page = 1, limit = 50 } = filters;
    const where: any = {};

    if (userId) where.userId = userId;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: (page - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, fullName: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async getEntityHistory(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
      },
    });
  }

  async getStatistics(startDate: Date, endDate: Date) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Using a more robust reducer to avoid "Element implicitly has an 'any' type"
    const byAction = logs.reduce((acc: Record<string, number>, log) => {
      const actionName = String(log.action);
      acc[actionName] = (acc[actionName] || 0) + 1;
      return acc;
    }, {});

    return {
      totalLogs: logs.length,
      byAction,
    };
  }
}