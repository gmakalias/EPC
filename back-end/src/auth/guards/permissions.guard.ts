// backend/src/auth/guards/permissions.guard.ts
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
    // Get required permissions from decorator
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );

    // If no permissions are required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Get user from request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.sub) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get user with roles and permissions
    const userWithPermissions = await this.prisma.user.findUnique({
      where: { id: user.sub },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
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

    // Check if user is active
    if (!userWithPermissions.isActive) {
      throw new ForbiddenException('User account is disabled');
    }

    // Extract user permissions
    const userPermissions = new Set<string>();
    
    userWithPermissions.userRoles.forEach((userRole) => {
      // Admin role has all permissions
      if (userRole.role.name === 'admin') {
        return true;
      }

      userRole.role.rolePermissions.forEach((rolePermission) => {
        userPermissions.add(rolePermission.permission.name);
      });
    });

    // Check if user is admin (has all permissions)
    const isAdmin = userWithPermissions.userRoles.some(
      (ur) => ur.role.name === 'admin',
    );

    if (isAdmin) {
      return true;
    }

    // Check if user has all required permissions
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