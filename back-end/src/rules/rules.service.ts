import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RulesService {
  constructor(private prisma: PrismaService) {}

  async validateCompatibility(offeringId: string, associatedIds: string[]) {
    const rules = await this.prisma.businessRule.findMany({
      where: {
        offeringId: offeringId,
        ruleType: 'COMPATIBILITY',
        isActive: true,
      },
    });

    for (const rule of rules) {
      const condition = rule.condition as any; // { type: 'REQUIRES', targetId: '...' }
      
      if (condition.type === 'REQUIRES' && !associatedIds.includes(condition.targetId)) {
        throw new BadRequestException(`Rule Violation: ${rule.name}. Missing required component.`);
      }

      if (condition.type === 'EXCLUDES' && associatedIds.includes(condition.targetId)) {
        throw new BadRequestException(`Rule Violation: ${rule.name}. Incompatible components selected.`);
      }
    }

    return { valid: true };
  }

  async getRulesByOffering(offeringId: string) {
    return this.prisma.businessRule.findMany({
      where: { offeringId },
    });
  }
}