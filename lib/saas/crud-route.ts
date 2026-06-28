import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from './permissions';
import { deleteTenantEntity, listTenantEntities, newTenantEntityId, putTenantEntity } from './tenant-store';
import { withTenant } from './tenant-context';
import type { TenantEntityType, TenantPermission } from './types';

type CrudConfig = {
  entityType: TenantEntityType;
  readPermission: TenantPermission;
  writePermission: TenantPermission;
  collectionKey: string;
  itemKey: string;
};

function cleanPayload(payload: Record<string, any>) {
  const {
    tenant_id: _tenantId,
    shopId: _shopId,
    entityType: _entityType,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...safePayload
  } = payload;

  return safePayload;
}

export function createTenantCrudHandlers(config: CrudConfig) {
  return {
    GET: withTenant(async (_req, ctx) => {
      requirePermission(ctx, config.readPermission);
      const rows = await listTenantEntities(ctx, config.entityType);
      return NextResponse.json({ success: true, [config.collectionKey]: rows });
    }),

    POST: withTenant(async (req: NextRequest, ctx) => {
      requirePermission(ctx, config.writePermission);
      const body = cleanPayload(await req.json());
      const id = body.id ? String(body.id) : newTenantEntityId();
      const row = await putTenantEntity(ctx, config.entityType, id, { ...body, id });
      return NextResponse.json({ success: true, [config.itemKey]: row });
    }),

    PUT: withTenant(async (req: NextRequest, ctx) => {
      requirePermission(ctx, config.writePermission);
      const body = cleanPayload(await req.json());
      if (!body.id) {
        return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
      }
      const row = await putTenantEntity(ctx, config.entityType, String(body.id), body);
      return NextResponse.json({ success: true, [config.itemKey]: row });
    }),

    DELETE: withTenant(async (req: NextRequest, ctx) => {
      requirePermission(ctx, config.writePermission);
      const id = new URL(req.url).searchParams.get('id');
      if (!id) {
        return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
      }
      const deleted = await deleteTenantEntity(ctx, config.entityType, id);
      return NextResponse.json({ success: true, deleted });
    }),
  };
}
