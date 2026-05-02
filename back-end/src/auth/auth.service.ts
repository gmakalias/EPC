import { 
  Injectable, 
  UnauthorizedException, 
  NotFoundException, 
  ConflictException 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private audit: AuditService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.email,
        fullName: dto.fullName,
        passwordHash,
        isActive: true,
        // FIX: Ensuring a default role is created/connected
        userRoles: {
          create: {
            role: {
              connect: { name: 'User' } // Assumes a role named 'User' exists
            }
          }
        }
      },
      include: { 
        userRoles: { include: { role: true } } // FIX: Changed from 'roles' to 'userRoles'
      }
    });

    await this.audit.log({
      userId: user.id,
      userEmail: user.email,
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { 
        userRoles: { // FIX: Changed from 'roles' to 'userRoles'
          include: { 
            role: true 
          } 
        } 
      }
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    return this.generateTokens(user);
  }

  async refreshToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          userRoles: { // FIX: Changed from 'roles' to 'userRoles'
            include: {
              role: true
            }
          }
        }
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch (e) {
      throw new UnauthorizedException('Refresh token expired or invalid');
    }
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
        // FIX: Changed from 'roles' to 'userRoles'
        userRoles: {
          select: {
            role: { select: { name: true } }
          }
        }
      },
    });

    if (!user) throw new NotFoundException('User not found');
    
    return {
      ...user,
      roles: user.userRoles.map(ur => ur.role.name) // FIX: Mapping from userRoles
    };
  }

  async changePassword(userId: string, currentPass: string, newPass: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(currentPass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPass, salt);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { success: true };
  }

  private async generateTokens(user: any) {
    // FIX: Using userRoles mapping to extract names safely
    const roles = user.userRoles?.map((ur: any) => ur.role.name) || [];
    
    const payload = { 
      sub: user.id, 
      email: user.email,
      roles: roles
    };

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles: roles,
      },
      accessToken: await this.jwtService.signAsync(payload, {
        expiresIn: '1h',
        secret: this.configService.get<string>('JWT_SECRET'),
      }),
      refreshToken: await this.jwtService.signAsync(payload, {
        expiresIn: '7d',
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      }),
    };
  }
}