import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class LifecycleService {
  private readonly allowedTransitions = {
    DRAFT: ['IN_STUDY', 'ACTIVE', 'REJECTED'],
    IN_STUDY: ['DRAFT', 'ACTIVE', 'REJECTED'],
    ACTIVE: ['OBSOLETE', 'RETIRED'],
    OBSOLETE: ['RETIRED'],
    RETIRED: [],
    REJECTED: ['DRAFT'],
  };

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async transitionState(entityType: 'offering' | 'specification', id: string, newState: string, userId: string) {
    const table = entityType === 'offering' ? 'productOffering' : 'productSpecification';
    
    // 1. Fetch current state and the user's email for the audit log
    const [entity, user] = await Promise.all([
      (this.prisma[table] as any).findUnique({ where: { id } }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
    ]);

    if (!entity) throw new NotFoundException(`${entityType} not found`);
    if (!user) throw new NotFoundException(`User performing the transition not found`);

    const currentState = entity.lifecycleStatus || 'DRAFT';

    // 2. Validate transition
    if (!this.allowedTransitions[currentState]?.includes(newState)) {
      throw new BadRequestException(`Transition from ${currentState} to ${newState} is not allowed.`);
    }

    // 3. Perform update
    const updated = await (this.prisma[table] as any).update({
      where: { id },
      data: { lifecycleStatus: newState },
    });

    // 4. Audit the change
    // FIX: Included mandatory 'userEmail' and mapped 'entityType' to string to match interface
    await this.audit.log({
      action: 'LIFECYCLE_TRANSITION',
      userEmail: user.email, // FIXED: Now provided
      entityType: entityType === 'offering' ? 'ProductOffering' : 'ProductSpecification',
      entityId: id,
      userId,
      oldValue: currentState,
      newValue: newState,
    });

    return updated;
  }
}