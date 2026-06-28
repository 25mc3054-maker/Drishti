# Multi-Tenant SaaS Extension Plan

This project is currently a Next.js retail billing app with AWS-backed shop entities. The SaaS transition should be an additive security layer around existing routes and storage, not a rewrite of billing, inventory, invoice, or frontend workflows.

## Current Stack

- Next.js App Router and API routes
- React client components
- Tailwind CSS
- AWS DynamoDB via `lib/dynamodb-shop.ts`
- Entity types such as `item`, `invoice`, `customer`, `supplier`, `task`, and singleton storefront/settings records

## Tenant Model

Use one immutable tenant identifier for every shop:

```ts
type TenantId = string; // UUIDv4

type TenantContext = {
  tenantId: TenantId;
  userId: string;
  role: 'owner' | 'manager' | 'cashier' | 'viewer';
};
```

For compatibility with the existing codebase, keep the old `shopId` fields but add `tenant_id` as the canonical SaaS isolation key. During the transition, write both:

```ts
{
  shopId: tenantId,
  tenant_id: tenantId
}
```

## DynamoDB Extension

Do not remove existing keys. Add these fields to each tenant-owned item:

```ts
{
  tenant_id: 'uuid-v4-shop-id',
  shopId: 'uuid-v4-shop-id',
  entityType: 'item' | 'invoice' | 'customer',
  id: 'entity-id'
}
```

Recommended future table/index shape:

```txt
PK: TENANT#{tenant_id}
SK: {entityType}#{id}
GSI1PK: TENANT#{tenant_id}#{entityType}
GSI1SK: updatedAt
```

This allows all reads to be naturally tenant-scoped.

## Backfill Migration

For existing single-shop data, create one tenant UUID and backfill old records.

```ts
// scripts/backfill-tenant-id.ts
import { randomUUID } from 'crypto';
import { listShopEntities, putShopEntity } from '@/lib/dynamodb-shop';

const tenantId = process.env.DEFAULT_TENANT_ID || randomUUID();
const entityTypes = ['item', 'invoice', 'customer', 'supplier', 'task', 'expense'];

async function main() {
  for (const entityType of entityTypes) {
    const rows = await listShopEntities<any>(entityType);
    for (const row of rows) {
      await putShopEntity(entityType, row.id, {
        ...row,
        tenant_id: row.tenant_id || tenantId,
        shopId: row.shopId || tenantId,
      });
    }
  }
  console.log(`Backfilled tenant_id=${tenantId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

## Tenant Context Wrapper

Add a request-scoped resolver. This can sit beside the current app until authentication is finalized.

```ts
// lib/tenant-context.ts
import { NextRequest } from 'next/server';

export type TenantRole = 'owner' | 'manager' | 'cashier' | 'viewer';

export type TenantContext = {
  tenantId: string;
  userId: string;
  role: TenantRole;
};

export function tenantFromRequest(req: NextRequest): TenantContext {
  const tenantId =
    req.headers.get('x-tenant-id') ||
    req.cookies.get('tenant_id')?.value ||
    '';

  const userId =
    req.headers.get('x-user-id') ||
    req.cookies.get('user_id')?.value ||
    '';

  const role = (req.headers.get('x-role') || req.cookies.get('role')?.value || 'owner') as TenantRole;

  if (!tenantId || !userId) {
    throw new Error('Authenticated tenant context is required.');
  }

  return { tenantId, userId, role };
}
```

In production, replace the header/cookie fallback with your actual auth provider claims, for example Cognito, Clerk, Auth.js, or a signed JWT.

## Tenant-Scoped Storage Wrapper

Keep existing APIs intact and introduce scoped helpers for new SaaS routes.

```ts
// lib/tenant-scoped-shop.ts
import { listShopEntities, putShopEntity, getShopEntityById } from '@/lib/dynamodb-shop';
import type { TenantContext } from './tenant-context';

export async function listTenantEntities<T = any>(ctx: TenantContext, entityType: string): Promise<T[]> {
  const rows = await listShopEntities<any>(entityType);
  return rows.filter((row) => row.tenant_id === ctx.tenantId || row.shopId === ctx.tenantId) as T[];
}

export async function getTenantEntity<T = any>(ctx: TenantContext, entityType: string, id: string): Promise<T | null> {
  const row = await getShopEntityById<any>(id);
  if (!row) return null;
  if (row.entityType !== entityType) return null;
  if (row.tenant_id !== ctx.tenantId && row.shopId !== ctx.tenantId) return null;
  return row as T;
}

export async function putTenantEntity(ctx: TenantContext, entityType: string, id: string, payload: Record<string, any>) {
  if (payload.tenant_id && payload.tenant_id !== ctx.tenantId) {
    throw new Error('Cross-tenant write blocked.');
  }

  return putShopEntity(entityType, id, {
    ...payload,
    tenant_id: ctx.tenantId,
    shopId: ctx.tenantId,
  });
}
```

## API Wrapper Pattern

Wrap each SaaS route without rewriting the core implementation.

```ts
// lib/tenant-api.ts
import { NextRequest, NextResponse } from 'next/server';
import { tenantFromRequest, type TenantContext } from './tenant-context';

export function withTenant(
  handler: (req: NextRequest, ctx: TenantContext) => Promise<Response>
) {
  return async function tenantHandler(req: NextRequest) {
    try {
      const ctx = tenantFromRequest(req);
      return await handler(req, ctx);
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'Tenant isolation failed.' },
        { status: 401 }
      );
    }
  };
}
```

Example tenant-scoped products route:

```ts
// app/api/saas/items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { newEntityId } from '@/lib/dynamodb-shop';
import { withTenant } from '@/lib/tenant-api';
import { listTenantEntities, putTenantEntity } from '@/lib/tenant-scoped-shop';

export const GET = withTenant(async (_req, ctx) => {
  const items = await listTenantEntities(ctx, 'item');
  return NextResponse.json({ success: true, items });
});

export const POST = withTenant(async (req: NextRequest, ctx) => {
  const body = await req.json();
  const id = body.id || newEntityId();
  const item = await putTenantEntity(ctx, 'item', id, {
    ...body,
    id,
  });
  return NextResponse.json({ success: true, item });
});
```

## Role And Staff Extension

Create staff as tenant-owned users. Staff cannot escape their tenant because every staff row is tenant-scoped.

```ts
type StaffUser = {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  role: 'owner' | 'manager' | 'cashier' | 'viewer';
  permissions: Array<'items:read' | 'items:write' | 'billing:write' | 'customers:read' | 'settings:write'>;
  invitedAt: string;
  disabledAt?: string;
};
```

Permission guard:

```ts
export function requirePermission(ctx: TenantContext, permission: StaffUser['permissions'][number]) {
  const roleDefaults = {
    owner: ['items:read', 'items:write', 'billing:write', 'customers:read', 'settings:write'],
    manager: ['items:read', 'items:write', 'billing:write', 'customers:read'],
    cashier: ['items:read', 'billing:write', 'customers:read'],
    viewer: ['items:read', 'customers:read'],
  } as const;

  if (!(roleDefaults[ctx.role] as readonly string[]).includes(permission)) {
    throw new Error(`Missing permission: ${permission}`);
  }
}
```

## Isolated Settings

Store tenant settings as a singleton per tenant.

```ts
type TenantSettings = {
  tenant_id: string;
  receiptHeader: string;
  logoUrl?: string;
  taxPercent: number;
  currency: 'INR';
  invoicePrefix: string;
  whatsappReminderEnabled: boolean;
  creditReminderDay: 1 | 2 | 3 | 4 | 5 | 6 | 7;
};
```

Suggested route:

```ts
// app/api/saas/settings/route.ts
export const GET = withTenant(async (_req, ctx) => {
  const settings = await getTenantEntity(ctx, 'settings', `settings#${ctx.tenantId}`);
  return NextResponse.json({ success: true, settings });
});

export const PUT = withTenant(async (req, ctx) => {
  requirePermission(ctx, 'settings:write');
  const body = await req.json();
  const settings = await putTenantEntity(ctx, 'settings', `settings#${ctx.tenantId}`, body);
  return NextResponse.json({ success: true, settings });
});
```

## Optional PostgreSQL RLS Variant

If you migrate to PostgreSQL later:

```sql
alter table products add column if not exists tenant_id uuid;
alter table invoices add column if not exists tenant_id uuid;
alter table customers add column if not exists tenant_id uuid;

create index if not exists idx_products_tenant_id on products(tenant_id);
create index if not exists idx_invoices_tenant_id on invoices(tenant_id);
create index if not exists idx_customers_tenant_id on customers(tenant_id);

alter table products enable row level security;
alter table invoices enable row level security;
alter table customers enable row level security;

create policy tenant_products_isolation on products
  using (tenant_id::text = current_setting('app.tenant_id', true))
  with check (tenant_id::text = current_setting('app.tenant_id', true));

create policy tenant_invoices_isolation on invoices
  using (tenant_id::text = current_setting('app.tenant_id', true))
  with check (tenant_id::text = current_setting('app.tenant_id', true));

create policy tenant_customers_isolation on customers
  using (tenant_id::text = current_setting('app.tenant_id', true))
  with check (tenant_id::text = current_setting('app.tenant_id', true));
```

Set the tenant before every transaction:

```ts
await db.transaction(async (tx) => {
  await tx.execute(sql`select set_config('app.tenant_id', ${ctx.tenantId}, true)`);
  return tx.select().from(products);
});
```

## Rollout Strategy

1. Backfill all current records with one default tenant UUID.
2. Add auth and issue each shopkeeper a tenant claim.
3. Create new `/api/saas/*` endpoints using `withTenant`.
4. Move one low-risk feature at a time to scoped endpoints.
5. Add integration tests that assert Tenant A cannot read or write Tenant B records.
6. After confidence, switch existing routes to the tenant-scoped helpers internally.

## Isolation Tests

Minimum tests:

```ts
it('blocks cross-tenant reads', async () => {
  const a = { tenantId: 'tenant-a', userId: 'u-a', role: 'owner' as const };
  const b = { tenantId: 'tenant-b', userId: 'u-b', role: 'owner' as const };

  const created = await putTenantEntity(a, 'item', 'item-1', { name: 'Sugar' });
  expect(created.tenant_id).toBe('tenant-a');

  const leaked = await getTenantEntity(b, 'item', 'item-1');
  expect(leaked).toBeNull();
});
```

The key architectural rule is simple: no API route should trust `tenant_id` from the request body. It must always come from the authenticated session context.
