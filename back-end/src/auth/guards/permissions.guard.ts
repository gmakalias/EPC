import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.sub) {
      throw new ForbiddenException('User not authenticated');
    }

    // FIX: Using 'userRoles' as defined in schema.prisma
    const userWithPermissions = await this.prisma.user.findUnique({
      where: { id: user.sub },
      include: {
        userRoles: { 
          include: {
            role: {
              include: {
                permissions: { 
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!userWithPermissions) {
      throw new ForbiddenException('User not found');
    }

    if (!userWithPermissions.isActive) {
      throw new ForbiddenException('User account is disabled');
    }

    const userPermissions = new Set<string>();
    
    // FIX: Updated to 'userRoles'
    userWithPermissions.userRoles.forEach((ur) => {
      ur.role.permissions.forEach((rp) => {
        userPermissions.add(rp.permission.name);
      });
    });

    // FIX: Updated to 'userRoles'
    const isAdmin = userWithPermissions.userRoles.some(
      (ur) => ur.role.name === 'admin' || ur.role.name === 'superuser',
    );

    if (isAdmin) {
      return true;
    }

    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.has(permission),
    );

    if (!hasAllPermissions) {
      const missingPermissions = requiredPermissions.filter(
        (p) => !userPermissions.has(p),
      );
      
      throw new ForbiddenException(
        `Missing required permissions: ${missingPermissions.join(', ')}`,
      );
    }

    return true;
  }
}