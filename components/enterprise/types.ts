export interface DashboardData {
  items: any[];
  customers: any[];
  orders: any[];
  invoices: any[];
  expenses: any[];
  suppliers: any[];
  tasks: any[];
  storefront: any | null;
}

export type TabKey = 'overview' | 'ai-workspace' | 'business-suite' | 'database-management' | 'storefront' | 'insights' | 'saas-admin';

export type BusinessSectionKey =
  | 'billing'
  | 'customers'
  | 'stock'
  | 'invoices'
  | 'marketing'
  | 'expenses'
  | 'suppliers';
