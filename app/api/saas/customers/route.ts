import { createTenantCrudHandlers } from '@/lib/saas/crud-route';

export const dynamic = 'force-dynamic';

const handlers = createTenantCrudHandlers({
  entityType: 'customer',
  readPermission: 'customers:read',
  writePermission: 'customers:write',
  collectionKey: 'customers',
  itemKey: 'customer',
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
