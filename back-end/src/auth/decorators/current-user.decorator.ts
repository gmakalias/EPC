// backend/src/auth/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract the current authenticated user from the request
 * 
 * Usage:
 * ```typescript
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * async getProfile(@CurrentUser() user: any) {
 *   return user;
 * }
 * ```
 * 
 * You can also extract specific properties:
 * ```typescript
 * @Post('something')
 * @UseGuards(JwtAuthGuard)
 * async doSomething(@CurrentUser('sub') userId: string) {
 *   // userId contains the user.sub value
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // If a specific property is requested, return only that
    if (data) {
      return user?.[data];
    }

    // Otherwise return the entire user object
    return user;
  },
);

/**
 * Example user object structure:
 * {
 *   sub: 'user-uuid',
 *   email: 'user@example.com',
 *   fullName: 'John Doe',
 *   roles: ['product_manager'],
 *   permissions: ['product.read', 'product.create', ...]
 * }
 */