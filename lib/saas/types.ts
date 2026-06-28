export type TenantRole = 'admin' | 'cashier';

export type TenantPermission =
  | 'items:read'
  | 'items:write'
  | 'customers:read'
  | 'customers:write'
  | 'suppliers:read'
  | 'suppliers:write'
  | 'invoices:read'
  | 'invoices:write'
  | 'staff:read'
  | 'staff:write'
  | 'settings:read'
  | 'settings:write'
  | 'onboarding:import';

export type TenantContext = {
  tenantId: string;
  userId: string;
  role: TenantRole;
  permissions: TenantPermission[];
  name?: string;
  shopName?: string;
  mobile?: string;
  email?: string;
};

export type TenantEntityType =
  | 'item'
  | 'customer'
  | 'supplier'
  | 'invoice'
  | 'staff'
  | 'tenant_user'
  | 'tenant_settings'
  | 'tenant_import';

export type TenantOwnedEntity = {
  id: string;
  tenant_id: string;
  shopId: string;
  entityType: TenantEntityType;
  createdAt: string;
  updatedAt: string;
};

export type StaffUser = TenantOwnedEntity & {
  entityType: 'staff';
  email: string;
  name: string;
  role: TenantRole;
  permissions: TenantPermission[];
  invitedAt: string;
  disabledAt?: string;
};

export type TenantSettings = TenantOwnedEntity & {
  entityType: 'tenant_settings';
  receiptHeader: string;
  logoUrl?: string;
  taxPercent: number;
  currency: 'INR';
  invoicePrefix: string;
  whatsappReminderEnabled: boolean;
  creditReminderDay: 1 | 2 | 3 | 4 | 5 | 6 | 7;
};
