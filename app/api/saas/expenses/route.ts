import { createTenantCrudHandlers } from '@/lib/saas/crud-route';

export const dynamic = 'force-dynamic';

const handlers = createTenantCrudHandlers({
  entityType: 'expense',
  readPermission: 'expenses:read',
  writePermission: 'expenses:write',
  collectionKey: 'expenses',
  itemKey: 'expense',
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
