import { NextRequest, NextResponse } from 'next/server';
import { normalizePermissions, requirePermission } from '@/lib/saas/permissions';
import { withTenant } from '@/lib/saas/tenant-context';
import { deleteTenantEntity, listTenantEntities, newTenantEntityId, putTenantEntity } from '@/lib/saas/tenant-store';
import type { TenantRole } from '@/lib/saas/types';

export const dynamic = 'force-dynamic';

export const GET = withTenant(async (_req, ctx) => {
  requirePermission(ctx, 'staff:read');
  const staff = await listTenantEntities(ctx, 'staff');
  return NextResponse.json({ success: true, staff });
});

export const POST = withTenant(async (req: NextRequest, ctx) => {
  requirePermission(ctx, 'staff:write');
  const body = await req.json();

  if (!body.email || !body.name) {
    return NextResponse.json({ success: false, error: 'name and email are required' }, { status: 400 });
  }

  const role = (body.role || 'cashier') as TenantRole;
  const id = body.id ? String(body.id) : newTenantEntityId();
  const staffUser = await putTenantEntity(ctx, 'staff', id, {
    id,
    email: String(body.email).trim().toLowerCase(),
    name: String(body.name).trim(),
    role,
    permissions: normalizePermissions(role, body.permissions),
    invitedAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, staffUser });
});

export const PUT = withTenant(async (req: NextRequest, ctx) => {
  requirePermission(ctx, 'staff:write');
  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
  }

  const role = (body.role || 'cashier') as TenantRole;
  const staffUser = await putTenantEntity(ctx, 'staff', String(body.id), {
    ...body,
    role,
    permissions: normalizePermissions(role, body.permissions),
  });

  return NextResponse.json({ success: true, staffUser });
});

export const DELETE = withTenant(async (req: NextRequest, ctx) => {
  requirePermission(ctx, 'staff:write');
  const id = new URL(req.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
  }

  const deleted = await deleteTenantEntity(ctx, 'staff', id);
  return NextResponse.json({ success: true, deleted });
});
