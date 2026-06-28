import { createTenantCrudHandlers } from '@/lib/saas/crud-route';

export const dynamic = 'force-dynamic';

const handlers = createTenantCrudHandlers({
  entityType: 'supplier',
  readPermission: 'suppliers:read',
  writePermission: 'suppliers:write',
  collectionKey: 'suppliers',
  itemKey: 'supplier',
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
