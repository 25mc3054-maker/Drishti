-- Optional PostgreSQL migration for a future SQL-backed SaaS version.
-- Safe shape: nullable tenant_id first, then backfill, then enforce NOT NULL after validation.

alter table if exists products add column if not exists tenant_id uuid;
alter table if exists customers add column if not exists tenant_id uuid;
alter table if exists stock add column if not exists tenant_id uuid;
alter table if exists suppliers add column if not exists tenant_id uuid;
alter table if exists invoices add column if not exists tenant_id uuid;

create index if not exists idx_products_tenant_id on products(tenant_id);
create index if not exists idx_customers_tenant_id on customers(tenant_id);
create index if not exists idx_stock_tenant_id on stock(tenant_id);
create index if not exists idx_suppliers_tenant_id on suppliers(tenant_id);
create index if not exists idx_invoices_tenant_id on invoices(tenant_id);

alter table if exists products enable row level security;
alter table if exists customers enable row level security;
alter table if exists stock enable row level security;
alter table if exists suppliers enable row level security;
alter table if exists invoices enable row level security;

drop policy if exists tenant_products_isolation on products;
create policy tenant_products_isolation on products
  using (tenant_id::text = current_setting('app.tenant_id', true))
  with check (tenant_id::text = current_setting('app.tenant_id', true));

drop policy if exists tenant_customers_isolation on customers;
create policy tenant_customers_isolation on customers
  using (tenant_id::text = current_setting('app.tenant_id', true))
  with check (tenant_id::text = current_setting('app.tenant_id', true));

drop policy if exists tenant_stock_isolation on stock;
create policy tenant_stock_isolation on stock
  using (tenant_id::text = current_setting('app.tenant_id', true))
  with check (tenant_id::text = current_setting('app.tenant_id', true));

drop policy if exists tenant_suppliers_isolation on suppliers;
create policy tenant_suppliers_isolation on suppliers
  using (tenant_id::text = current_setting('app.tenant_id', true))
  with check (tenant_id::text = current_setting('app.tenant_id', true));

drop policy if exists tenant_invoices_isolation on invoices;
create policy tenant_invoices_isolation on invoices
  using (tenant_id::text = current_setting('app.tenant_id', true))
  with check (tenant_id::text = current_setting('app.tenant_id', true));
