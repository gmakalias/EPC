// backend/src/auth/decorators/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to specify required permissions for a route
 * 
 * Usage:
 * ```typescript
 * @Get()
 * @UseGuards(JwtAuthGuard, PermissionsGuard)
 * @RequirePermissions('product.read')
 * async getProducts() {
 *   // Only users with 'product.read' permission can access this
 * }
 * ```
 * 
 * Multiple permissions (user must have ALL):
 * ```typescript
 * @Post()
 * @UseGuards(JwtAuthGuard, PermissionsGuard)
 * @RequirePermissions('product.create', 'pricing.read')
 * async createProduct() {
 *   // User must have BOTH permissions
 * }
 * ```
 * 
 * Note: Admin role always passes permission checks
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);

/**
 * Decorator to mark a route as public (no authentication required)
 * 
 * Usage:
 * ```typescript
 * @Get('public-info')
 * @Public()
 * async getPublicInfo() {
 *   // No authentication needed
 * }
 * ```
 */
export const Public = () => SetMetadata('isPublic', true);

/**
 * Common permission examples:
 * 
 * Products:
 * - product.create
 * - product.read
 * - product.update
 * - product.delete
 * - product.approve
 * 
 * Offerings:
 * - offering.create
 * - offering.read
 * - offering.update
 * - offering.delete
 * 
 * Subscriptions:
 * - subscription.create
 * - subscription.read
 * - subscription.update
 * 
 * Pricing:
 * - pricing.create
 * - pricing.read
 * - pricing.update
 * - pricing.delete
 * 
 * Admin:
 * - user.manage
 * - audit.read
 * - lifecycle.approve
 * - lifecycle.reject
 */