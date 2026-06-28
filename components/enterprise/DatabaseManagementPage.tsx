"use client"

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  Code2,
  Database,
  KeyRound,
  LockKeyhole,
  PackageSearch,
  Plus,
  ReceiptText,
  Search,
  Server,
  ShieldCheck,
  Store,
  Table2,
  Users,
  X,
} from 'lucide-react';
import type { DashboardData } from './types';

type Provider = {
  id: string;
  name: string;
  type: string;
  description: string;
  accent: string;
  fields: Array<{ key: string; label: string; type?: string; placeholder?: string }>;
};

type DatabaseManagementPageProps = {
  data: DashboardData;
};

const providers: Provider[] = [
  {
    id: 'mysql',
    name: 'MySQL',
    type: 'Relational',
    description: 'Connect a MySQL catalog from a secure server-side adapter.',
    accent: '#5FB4FF',
    fields: [
      { key: 'host', label: 'Host', placeholder: 'db.company.com' },
      { key: 'port', label: 'Port', placeholder: '3306' },
      { key: 'username', label: 'Username' },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'database', label: 'Database Name' },
    ],
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    type: 'Relational',
    description: 'Connect a PostgreSQL product or inventory database.',
    accent: '#81D4FA',
    fields: [
      { key: 'host', label: 'Host', placeholder: 'pg.company.com' },
      { key: 'port', label: 'Port', placeholder: '5432' },
      { key: 'username', label: 'Username' },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'database', label: 'Database Name' },
    ],
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    type: 'Document',
    description: 'Connect a MongoDB product collection.',
    accent: '#5EE1A2',
    fields: [{ key: 'uri', label: 'Connection URI', type: 'password', placeholder: 'mongodb+srv://...' }],
  },
  {
    id: 'supabase',
    name: 'Supabase',
    type: 'Platform',
    description: 'Connect a Supabase project through a server-side key.',
    accent: '#66F2BC',
    fields: [
      { key: 'projectUrl', label: 'Project URL', placeholder: 'https://project.supabase.co' },
      { key: 'apiKey', label: 'Service API Key', type: 'password' },
    ],
  },
  {
    id: 'rest-api',
    name: 'REST API',
    type: 'API',
    description: 'Connect a product endpoint from an existing business API.',
    accent: '#FF9C2A',
    fields: [
      { key: 'baseUrl', label: 'Base URL', placeholder: 'https://api.company.com' },
      { key: 'authType', label: 'Authentication Type', placeholder: 'Bearer token' },
      { key: 'apiKey', label: 'API Key / Bearer Token', type: 'password' },
      { key: 'productEndpoint', label: 'Product Endpoint', placeholder: '/products' },
    ],
  },
  {
    id: 'graphql-api',
    name: 'GraphQL API',
    type: 'API',
    description: 'Connect a GraphQL product query through a secure adapter.',
    accent: '#F472B6',
    fields: [
      { key: 'endpoint', label: 'GraphQL Endpoint' },
      { key: 'token', label: 'Access Token', type: 'password' },
      { key: 'productQuery', label: 'Product Query' },
    ],
  },
];

export function DatabaseManagementPage({ data }: DatabaseManagementPageProps) {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState(providers[0].id);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const selectedProvider = providers.find((provider) => provider.id === selectedProviderId) || providers[0];
  const filteredProviders = providers.filter((provider) => `${provider.name} ${provider.type}`.toLowerCase().includes(searchTerm.toLowerCase()));

  const inventoryStats = useMemo(() => {
    const items = data.items || [];
    const totalStock = items.reduce((sum, item: any) => sum + Number(item.qty || 0), 0);
    const stockValue = items.reduce((sum, item: any) => sum + Number(item.qty || 0) * Number(item.price || 0), 0);
    const outOfStock = items.filter((item: any) => Number(item.qty || 0) <= 0).length;
    const categories = new Set(items.map((item: any) => String(item.category || '').trim()).filter(Boolean)).size;

    return { categories, outOfStock, stockValue, totalProducts: items.length, totalStock };
  }, [data.items]);

  const recentProducts = useMemo(() => {
    return [...(data.items || [])]
      .sort((a: any, b: any) => Date.parse(b.updatedAt || b.createdAt || '') - Date.parse(a.updatedAt || a.createdAt || ''))
      .slice(0, 8);
  }, [data.items]);

  const totalRevenue = useMemo(() => {
    return (data.invoices || []).reduce((sum, invoice: any) => sum + Number(invoice.total || 0), 0);
  }, [data.invoices]);

  const formatMoney = (value: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);

  const requestConnection = () => {
    setStatusMessage('A secure connector API is not configured yet, so this connection was not tested or saved.');
  };

  return (
    <section className="relative -mx-4 overflow-hidden px-4 pb-12 pt-3 md:-mx-8 md:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(95,180,255,0.14),transparent_24%),radial-gradient(circle_at_86%_12%,rgba(255,156,42,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_30%)]" />
      <div className="relative space-y-6">
        <header className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.55fr)] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.055] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-normal text-white/56">
              <Database className="h-3.5 w-3.5 text-[#81D4FA]" />
              Database Management
            </div>
            <h1 className="mt-4 max-w-4xl text-[42px] font-semibold leading-[1.04] tracking-normal text-white md:text-[58px]">
              Product data sources
            </h1>
            <p className="mt-4 max-w-3xl text-[15px] leading-7 text-white/58">
              This page shows only data available in this SaaS workspace. External database metrics appear after a real connector is saved.
            </p>
          </div>

          <div className="rounded-[8px] border border-white/10 bg-[#05070A] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <PanelTitle icon={ShieldCheck} title="Connection Safety" meta="No credentials stored" />
              <span className="rounded-full border border-amber-300/25 bg-amber-400/10 px-3 py-1 text-[12px] font-semibold text-amber-100">Not connected</span>
            </div>
            <div className="mt-4 grid gap-2 text-[13px] text-white/58">
              <SecurityLine icon={LockKeyhole} text="No external database credentials are saved." />
              <SecurityLine icon={KeyRound} text="Connection testing requires a server-side connector endpoint." />
            </div>
          </div>
        </header>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Database} label="Connected Databases" value="0" helper="No external source connected" />
          <MetricCard icon={PackageSearch} label="SaaS Products" value={String(inventoryStats.totalProducts)} helper={`${inventoryStats.totalStock} units in stock`} />
          <MetricCard icon={Users} label="Customers" value={String((data.customers || []).length)} helper="Current tenant data" />
          <MetricCard icon={ReceiptText} label="Invoices" value={String((data.invoices || []).length)} helper={`₹${formatMoney(totalRevenue)} total billed`} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.55fr)]">
          <div className="rounded-[8px] border border-white/10 bg-[#05070A] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <PanelTitle icon={Server} title="External Database Connections" meta="Real saved connectors only" />
              <button
                type="button"
                onClick={() => {
                  setStatusMessage('');
                  setIsWizardOpen(true);
                }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-4 text-[13px] font-semibold text-black transition hover:scale-[1.01]"
              >
                <Plus className="h-4 w-4" />
                Connect Database
              </button>
            </div>

            <EmptyState
              icon={Database}
              title="No external database is connected"
              text="Products currently come from the SaaS inventory module. Once a real connector is implemented and saved, connected databases, health, sync times, schema, imports, and logs will appear here."
            />
          </div>

          <div className="rounded-[8px] border border-white/10 bg-[#05070A] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <PanelTitle icon={Store} title="Current SaaS Inventory" meta="Actual workspace totals" />
            <div className="mt-4 grid gap-3">
              <SoftStat label="Inventory Value" value={`₹${formatMoney(inventoryStats.stockValue)}`} />
              <SoftStat label="Categories" value={String(inventoryStats.categories)} />
              <SoftStat label="Out of Stock" value={String(inventoryStats.outOfStock)} />
              <SoftStat label="Suppliers" value={String((data.suppliers || []).length)} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.55fr)]">
          <div className="rounded-[8px] border border-white/10 bg-[#05070A] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <PanelTitle icon={Table2} title="Products Available To Billing" meta="Actual SaaS product records" />
            {recentProducts.length > 0 ? (
              <div className="mt-4 overflow-hidden rounded-[8px] border border-white/10">
                <div className="grid grid-cols-[1.5fr_0.7fr_0.7fr_0.8fr] bg-white/[0.06] px-3 py-2 text-[11px] font-semibold uppercase tracking-normal text-white/42">
                  <span>Name</span>
                  <span>Qty</span>
                  <span>Price</span>
                  <span>Category</span>
                </div>
                {recentProducts.map((item: any) => (
                  <div key={item.id || item.name} className="grid grid-cols-[1.5fr_0.7fr_0.7fr_0.8fr] border-t border-white/10 px-3 py-3 text-[12px] text-white/60">
                    <span className="truncate font-semibold text-white">{item.name || 'Unnamed product'}</span>
                    <span>{Number(item.qty || 0)}</span>
                    <span>₹{formatMoney(Number(item.price || 0))}</span>
                    <span className="truncate">{item.category || 'Not set'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={PackageSearch} title="No products found" text="Add products in the Business Suite stock module to see them here." compact />
            )}
          </div>

          <div className="rounded-[8px] border border-white/10 bg-[#05070A] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <PanelTitle icon={AlertTriangle} title="Sync Status" meta="No fake logs" />
            <EmptyState
              icon={AlertTriangle}
              title="No sync activity yet"
              text="Sync logs, schema discovery, field mappings, and import history will stay empty until a real external connector writes real sync results."
              compact
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isWizardOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] grid place-items-center bg-black/72 p-4 backdrop-blur-xl"
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.985 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[8px] border border-white/12 bg-[#05070A] shadow-[0_40px_120px_rgba(0,0,0,0.65)]"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <PanelTitle icon={Database} title="Connect Database" meta="Configuration only" />
                <button type="button" onClick={() => setIsWizardOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.055] text-white/58 transition hover:text-white" aria-label="Close database wizard">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[72vh] overflow-y-auto p-5">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-[22px] font-semibold text-white">Choose Provider</h3>
                        <p className="mt-1 text-[13px] text-white/52">These are connector options, not connected databases.</p>
                      </div>
                      <label className="flex h-10 min-w-[220px] items-center gap-2 rounded-full border border-white/12 bg-black/45 px-3 text-white/54">
                        <Search className="h-4 w-4" />
                        <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search providers" className="w-full bg-transparent text-[13px] text-white outline-none placeholder:text-white/34" />
                      </label>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {filteredProviders.map((provider) => (
                        <button
                          key={provider.id}
                          type="button"
                          onClick={() => setSelectedProviderId(provider.id)}
                          className={`min-h-[142px] rounded-[8px] border p-4 text-left transition ${selectedProviderId === provider.id ? 'border-white/35 bg-white/[0.075]' : 'border-white/10 bg-white/[0.04] hover:border-white/24'}`}
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/12" style={{ backgroundColor: `${provider.accent}18` }}>
                              {provider.type === 'API' ? <Code2 className="h-5 w-5" style={{ color: provider.accent }} /> : <Database className="h-5 w-5" style={{ color: provider.accent }} />}
                            </span>
                            {selectedProviderId === provider.id ? <Check className="h-4 w-4 text-emerald-200" /> : null}
                          </span>
                          <span className="mt-4 block text-[15px] font-semibold text-white">{provider.name}</span>
                          <span className="mt-1 block text-[12px] text-white/42">{provider.type}</span>
                          <span className="mt-3 block text-[12px] leading-5 text-white/52">{provider.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[8px] border border-white/10 bg-white/[0.035] p-4">
                    <PanelTitle icon={Server} title={`${selectedProvider.name} Details`} meta="Not saved in browser" />
                    <div className="mt-4 grid gap-3">
                      {selectedProvider.fields.map((field) => (
                        <label key={field.key}>
                          <span className="mb-2 block text-[12px] font-semibold text-white/54">{field.label}</span>
                          <input
                            type={field.type || 'text'}
                            placeholder={field.placeholder || field.label}
                            className="h-11 w-full rounded-[8px] border border-white/12 bg-black/45 px-3 text-[13px] text-white outline-none placeholder:text-white/30 transition focus:border-[#81D4FA]/70"
                          />
                        </label>
                      ))}
                    </div>

                    <div className="mt-4 rounded-[8px] border border-amber-300/20 bg-amber-400/10 p-3 text-[13px] leading-6 text-amber-100">
                      This form does not test or save credentials yet. A real server-side connector API must be added before database data can be shown.
                    </div>

                    {statusMessage ? (
                      <div className="mt-3 rounded-[8px] border border-sky-300/20 bg-sky-400/10 p-3 text-[13px] leading-6 text-sky-100">
                        {statusMessage}
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={requestConnection}
                      className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white px-4 text-[13px] font-semibold text-black"
                    >
                      Request Connector Setup
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function PanelTitle({ icon: Icon, meta, title }: { icon: any; meta: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.07] text-white">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <div className="text-[15px] font-semibold text-white">{title}</div>
        <div className="mt-0.5 text-[11px] uppercase tracking-normal text-white/38">{meta}</div>
      </div>
    </div>
  );
}

function MetricCard({ helper, icon: Icon, label, value }: { helper: string; icon: any; label: string; value: string }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="rounded-[8px] border border-white/10 bg-[#05070A] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.07]">
        <Icon className="h-4 w-4 text-[#81D4FA]" />
      </div>
      <div className="mt-5 text-[12px] uppercase tracking-normal text-white/40">{label}</div>
      <div className="mt-2 text-[30px] font-semibold text-white">{value}</div>
      <div className="mt-1 text-[13px] text-white/48">{helper}</div>
    </motion.article>
  );
}

function SoftStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-black/28 p-3">
      <div className="text-[11px] uppercase tracking-normal text-white/38">{label}</div>
      <div className="mt-1 text-[18px] font-semibold text-white">{value}</div>
    </div>
  );
}

function EmptyState({ compact = false, icon: Icon, text, title }: { compact?: boolean; icon: any; text: string; title: string }) {
  return (
    <div className={`mt-4 grid place-items-center rounded-[8px] border border-dashed border-white/14 bg-white/[0.035] p-6 text-center ${compact ? 'min-h-[180px]' : 'min-h-[300px]'}`}>
      <div>
        <Icon className="mx-auto h-8 w-8 text-[#81D4FA]" />
        <div className="mt-3 text-[16px] font-semibold text-white">{title}</div>
        <p className="mt-2 max-w-xl text-[13px] leading-6 text-white/52">{text}</p>
      </div>
    </div>
  );
}

function SecurityLine({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-[#81D4FA]" />
      <span>{text}</span>
    </div>
  );
}
