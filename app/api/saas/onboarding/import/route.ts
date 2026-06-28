import { NextRequest, NextResponse } from 'next/server';
import { importEntityType, normalizeImportPayload } from '@/lib/saas/import-utils';
import { requirePermission } from '@/lib/saas/permissions';
import { withTenant } from '@/lib/saas/tenant-context';
import { newTenantEntityId, putTenantEntity } from '@/lib/saas/tenant-store';
import type { TenantEntityType } from '@/lib/saas/types';

export const dynamic = 'force-dynamic';

function stripTenantFields(row: Record<string, any>) {
  const {
    tenant_id: _tenantId,
    shopId: _shopId,
    entityType: _entityType,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...safeRow
  } = row;

  return safeRow;
}

export const POST = withTenant(async (req: NextRequest, ctx) => {
  requirePermission(ctx, 'onboarding:import');
  const body = await req.json();
  const normalized = normalizeImportPayload(body);
  const summary: Record<string, number> = {};
  const maxRows = Number(process.env.SAAS_IMPORT_MAX_ROWS || 500);
  let totalRows = 0;

  for (const rows of Object.values(normalized)) {
    totalRows += rows.length;
  }

  if (totalRows > maxRows) {
    return NextResponse.json({ success: false, error: `Import limit is ${maxRows} rows per request.` }, { status: 400 });
  }

  for (const [bucket, rows] of Object.entries(normalized)) {
    const entityType = importEntityType(bucket as keyof typeof normalized) as TenantEntityType;
    summary[bucket] = 0;

    for (const row of rows) {
      const safeRow = stripTenantFields(row);
      const id = safeRow.id ? String(safeRow.id) : newTenantEntityId();
      await putTenantEntity(ctx, entityType, id, { ...safeRow, id });
      summary[bucket] += 1;
    }
  }

  await putTenantEntity(ctx, 'tenant_import', newTenantEntityId(), {
    importedAt: new Date().toISOString(),
    summary,
    source: body.source || 'manual',
  });

  return NextResponse.json({ success: true, summary });
});
