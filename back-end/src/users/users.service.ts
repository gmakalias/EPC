// backend/src/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }) {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      isActive,
    } = query || {};

    const skip = (page - 1) * limit;
    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Active/inactive filter
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Role filter
    if (role) {
      where.userRoles = {
        some: {
          role: {
            name: role,
          },
        },
      };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          isActive: true,
          isVerified: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          userRoles: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Format response
    const formattedUsers = users.map((user) => ({
      ...user,
      roles: user.userRoles.map((ur) => ur.role),
      userRoles: undefined,
    }));

    return {
      data: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        isActive: true,
        isVerified: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
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

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Extract roles and permissions
    const roles = user.userRoles.map((ur) => ur.role);
    const permissions = user.userRoles.flatMap((ur) =>
      ur.role.permissions.map((rp) => rp.permission),
    );

    return {
      ...user,
      roles,
      permissions: [...new Map(permissions.map(p => [p.id, p])).values()], // Remove duplicates
      userRoles: undefined,
    };
  }

  async create(createUserDto: CreateUserDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: createUserDto.email },
          ...(createUserDto.username ? [{ username: createUserDto.username }] : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === createUserDto.email) {
        throw new ConflictException('User with this email already exists');
      }
      if (existingUser.username === createUserDto.username) {
        throw new ConflictException('User with this username already exists');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(createUserDto.password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        username: createUserDto.username,
        fullName: createUserDto.fullName,
        passwordHash,
        isActive: createUserDto.isActive ?? true,
        isVerified: createUserDto.isVerified ?? false,
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
      },
    });

    // Assign roles if provided
    if (createUserDto.roleIds && createUserDto.roleIds.length > 0) {
      await this.assignRoles(user.id, createUserDto.roleIds);
    }

    return this.findOne(user.id);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Verify user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check for email/username conflicts
    if (updateUserDto.email || updateUserDto.username) {
      const conflicts = await this.prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(updateUserDto.email ? [{ email: updateUserDto.email }] : []),
                ...(updateUserDto.username ? [{ username: updateUserDto.username }] : []),
              ],
            },
          ],
        },
      });

      if (conflicts) {
        if (conflicts.email === updateUserDto.email) {
          throw new ConflictException('User with this email already exists');
        }
        if (conflicts.username === updateUserDto.username) {
          throw new ConflictException('User with this username already exists');
        }
      }
    }

    // Prepare update data
    const updateData: any = {
      email: updateUserDto.email,
      username: updateUserDto.username,
      fullName: updateUserDto.fullName,
      isActive: updateUserDto.isActive,
      isVerified: updateUserDto.isVerified,
    };

    // Update password if provided
    if (updateUserDto.password) {
      updateData.passwordHash = await bcrypt.hash(updateUserDto.password, 12);
    }

    // Update user
    await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Update roles if provided
    if (updateUserDto.roleIds !== undefined) {
      await this.assignRoles(id, updateUserDto.roleIds);
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Don't allow deletion of the last admin
    const isAdmin = await this.prisma.userRole.findFirst({
      where: {
        userId: id,
        role: { name: 'admin' },
      },
    });

    if (isAdmin) {
      const adminCount = await this.prisma.userRole.count({
        where: {
          role: { name: 'admin' },
        },
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot delete the last admin user');
      }
    }

    await this.prisma.user.delete({
      where: { id },
    });
  }

  async assignRoles(userId: string, roleIds: string[]) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Verify all roles exist
    const roles = await this.prisma.role.findMany({
      where: {
        id: { in: roleIds },
      },
    });

    if (roles.length !== roleIds.length) {
      throw new BadRequestException('One or more role IDs are invalid');
    }

    // Remove existing roles
    await this.prisma.userRole.deleteMany({
      where: { userId },
    });

    // Assign new roles
    if (roleIds.length > 0) {
      await this.prisma.userRole.createMany({
        data: roleIds.map((roleId) => ({
          userId,
          roleId,
        })),
      });
    }

    return this.findOne(userId);
  }

  async removeRole(userId: string, roleId: string) {
    // Check if user-role assignment exists
    const userRole = await this.prisma.userRole.findUnique({
	where: {
		userId_roleId: {
			userId: userId,
			roleId: roleId,
			},
		},
		include: {
		role: true, // This makes "userRole.role.name" accessible
		},
	});

    if (!userRole) {
      throw new NotFoundException('User does not have this role');
    }

    // Don't allow removing admin role from the last admin
    if (userRole.role.name === 'admin') {
      const adminCount = await this.prisma.userRole.count({
        where: {
          role: { name: 'admin' },
        },
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot remove admin role from the last admin user');
      }
    }

    await this.prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    return this.findOne(userId);
  }

  async activateUser(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    return this.findOne(id);
  }

  async deactivateUser(id: string) {
    // Don't allow deactivating the last admin
    const isAdmin = await this.prisma.userRole.findFirst({
      where: {
        userId: id,
        role: { name: 'admin' },
      },
    });

    if (isAdmin) {
      const activeAdminCount = await this.prisma.user.count({
        where: {
          isActive: true,
          userRoles: {
            some: {
              role: { name: 'admin' },
            },
          },
        },
      });

      if (activeAdminCount <= 1) {
        throw new BadRequestException('Cannot deactivate the last active admin user');
      }
    }

    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return this.findOne(id);
  }

  async getStatistics() {
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      usersByRole,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { isVerified: true } }),
      this.prisma.userRole.groupBy({
        by: ['roleId'],
        _count: true,
      }),
    ]);

    // Get role names for the counts
    const roleIds = usersByRole.map((ur) => ur.roleId);
    const roles = await this.prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: { id: true, name: true },
    });

    const roleCountsMap = usersByRole.reduce((acc, ur) => {
      const role = roles.find((r) => r.id === ur.roleId);
      if (role) {
        acc[role.name] = ur._count;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      verifiedUsers,
      unverifiedUsers: totalUsers - verifiedUsers,
      usersByRole: roleCountsMap,
    };
  }
}