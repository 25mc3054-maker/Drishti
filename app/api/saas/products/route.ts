import { createTenantCrudHandlers } from '@/lib/saas/crud-route';

export const dynamic = 'force-dynamic';

const handlers = createTenantCrudHandlers({
  entityType: 'item',
  readPermission: 'items:read',
  writePermission: 'items:write',
  collectionKey: 'products',
  itemKey: 'product',
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
