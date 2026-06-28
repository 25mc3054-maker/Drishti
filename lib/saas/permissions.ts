import type { TenantContext, TenantPermission, TenantRole } from './types';

export const rolePermissions: Record<TenantRole, TenantPermission[]> = {
  admin: [
    'items:read',
    'items:write',
    'customers:read',
    'customers:write',
    'suppliers:read',
    'suppliers:write',
    'invoices:read',
    'invoices:write',
    'staff:read',
    'staff:write',
    'settings:read',
    'settings:write',
    'onboarding:import',
  ],
  cashier: [
    'items:read',
    'customers:read',
    'customers:write',
    'invoices:read',
    'invoices:write',
    'settings:read',
  ],
};

export function normalizePermissions(role: TenantRole, permissions?: TenantPermission[]) {
  const allowed = new Set(rolePermissions[role]);
  const requested = permissions?.length ? permissions : rolePermissions[role];
  return requested.filter((permission) => allowed.has(permission));
}

export function requirePermission(ctx: TenantContext, permission: TenantPermission) {
  if (!ctx.permissions.includes(permission)) {
    throw new Error(`Missing permission: ${permission}`);
  }
}
