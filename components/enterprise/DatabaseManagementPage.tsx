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
import { RecentSearchInput } from './RecentSearchInput';
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
  theme?: 'dark' | 'light';
};

const providers: Provider[] = [
  {
    id: 'mysql',
    name: 'MySQL Database',
    type: 'SQL',
    description: 'Sync products and inventory directly from your MySQL table.',
    accent: '#4A90E2',
    fields: [
      { key: 'host', label: 'Host / Endpoint', placeholder: 'db.example.com' },
      { key: 'port', label: 'Port', placeholder: '3306' },
      { key: 'database', label: 'Database Name', placeholder: 'inventory_db' },
      { key: 'user', label: 'Database User', placeholder: 'readonly_user' },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'table', label: 'Product Table Name', placeholder: 'products' },
    ],
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL Database',
    type: 'SQL',
    description: 'Connect a PostgreSQL or CockroachDB product repository.',
    accent: '#3178C6',
    fields: [
      { key: 'connectionString', label: 'Connection String', placeholder: 'postgres://user:pass@host:5432/dbname', type: 'password' },
      { key: 'table', label: 'Product Table Name', placeholder: 'public.items' },
    ],
  },
  {
    id: 'supabase',
    name: 'Supabase',
    type: 'Cloud Database',
    description: 'Import products from a Supabase project instance.',
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

export function DatabaseManagementPage({ data, theme = 'dark' }: DatabaseManagementPageProps) {
  const isLight = theme === 'light';
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
    <section className={`relative rounded-2xl p-6 transition-colors border-0 ${
      isLight ? 'bg-white text-black shadow-sm' : 'bg-black text-white'
    }`}>
      <div className="relative space-y-6">
        <header className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.55fr)] lg:items-end">
          <div>
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${
              isLight ? 'bg-zinc-100 text-black' : 'bg-zinc-900 text-white'
            }`}>
              <Database className="h-3.5 w-3.5 text-blue-500" />
              Database Management
            </div>
            <h1 className={`mt-3 max-w-4xl text-[36px] font-extrabold tracking-tight md:text-[48px] ${
              isLight ? 'text-black' : 'text-white'
            }`}>
              Product data sources
            </h1>
            <p className={`mt-2 text-[15px] font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
              Connect external databases and APIs to sync items directly into your workspace catalog.
            </p>
          </div>

          <div className={`rounded-xl p-4 shadow-sm border-0 ${
            isLight ? 'bg-zinc-50 text-black' : 'bg-black text-white'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <PanelTitle isLight={isLight} icon={ShieldCheck} title="Connection Safety" meta="No credentials stored" />
              <span className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${
                isLight ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-amber-300/25 bg-amber-400/10 text-amber-100'
              }`}>Not connected</span>
            </div>
            <div className="mt-4 grid gap-2 text-[13px]">
              <SecurityLine isLight={isLight} icon={LockKeyhole} text="No external database credentials are saved." />
              <SecurityLine isLight={isLight} icon={KeyRound} text="Connection testing requires a server-side connector endpoint." />
            </div>
          </div>
        </header>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard isLight={isLight} icon={Database} label="Connected Databases" value="0" helper="No external source connected" />
          <MetricCard isLight={isLight} icon={PackageSearch} label="SaaS Products" value={String(inventoryStats.totalProducts)} helper={`${inventoryStats.totalStock} units in stock`} />
          <MetricCard isLight={isLight} icon={Users} label="Customers" value={String((data.customers || []).length)} helper="Current tenant data" />
          <MetricCard isLight={isLight} icon={ReceiptText} label="Invoices" value={String((data.invoices || []).length)} helper={`₹${formatMoney(totalRevenue)} total billed`} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.55fr)]">
          <div className={`rounded-xl border p-4 shadow-sm ${
            isLight ? 'border-slate-200 bg-slate-50 text-slate-900' : 'border-white/10 bg-[#05070A] text-white'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <PanelTitle isLight={isLight} icon={Server} title="External Database Connections" meta="Real saved connectors only" />
              <button
                type="button"
                onClick={() => {
                  setStatusMessage('');
                  setIsWizardOpen(true);
                }}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-[13px] font-bold transition shadow-sm ${
                  isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-black hover:bg-slate-200'
                }`}
              >
                <Plus className="h-4 w-4" />
                Connect Database
              </button>
            </div>

            <EmptyState
              isLight={isLight}
              icon={Database}
              title="No external database is connected"
              text="Products currently come from the SaaS inventory module. Once a real connector is implemented and saved, connected databases, health, sync times, schema, imports, and logs will appear here."
            />
          </div>

          <div className={`rounded-xl border p-4 shadow-sm ${
            isLight ? 'border-slate-200 bg-slate-50 text-slate-900' : 'border-white/10 bg-[#05070A] text-white'
          }`}>
            <PanelTitle isLight={isLight} icon={Store} title="Current SaaS Inventory" meta="Actual workspace totals" />
            <div className="mt-4 grid gap-3">
              <SoftStat isLight={isLight} label="Inventory Value" value={`₹${formatMoney(inventoryStats.stockValue)}`} />
              <SoftStat isLight={isLight} label="Categories" value={String(inventoryStats.categories)} />
              <SoftStat isLight={isLight} label="Out of Stock" value={String(inventoryStats.outOfStock)} />
              <SoftStat isLight={isLight} label="Suppliers" value={String((data.suppliers || []).length)} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.55fr)]">
          <div className={`rounded-xl border p-4 shadow-sm ${
            isLight ? 'border-slate-200 bg-slate-50 text-slate-900' : 'border-white/10 bg-[#05070A] text-white'
          }`}>
            <PanelTitle isLight={isLight} icon={Table2} title="Products Available To Billing" meta="Actual SaaS product records" />
            {recentProducts.length > 0 ? (
              <div className={`mt-4 overflow-hidden rounded-xl border ${
                isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-black/40'
              }`}>
                <div className={`grid grid-cols-[1.5fr_0.7fr_0.7fr_0.8fr] px-3 py-2 text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/[0.06] text-white/50'
                }`}>
                  <span>Name</span>
                  <span>Qty</span>
                  <span>Price</span>
                  <span>Category</span>
                </div>
                {recentProducts.map((item: any) => (
                  <div key={item.id || item.name} className={`grid grid-cols-[1.5fr_0.7fr_0.7fr_0.8fr] border-t px-3 py-3 text-[12.5px] font-medium ${
                    isLight ? 'border-slate-200 text-slate-800' : 'border-white/10 text-white/80'
                  }`}>
                    <span className="truncate font-bold">{item.name || 'Unnamed product'}</span>
                    <span>{Number(item.qty || 0)}</span>
                    <span>₹{formatMoney(Number(item.price || 0))}</span>
                    <span className="truncate">{item.category || 'Not set'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState isLight={isLight} icon={PackageSearch} title="No products found" text="Add products in the Business Suite stock module to see them here." compact />
            )}
          </div>

          <div className={`rounded-xl border p-4 shadow-sm ${
            isLight ? 'border-slate-200 bg-slate-50 text-slate-900' : 'border-white/10 bg-[#05070A] text-white'
          }`}>
            <PanelTitle isLight={isLight} icon={AlertTriangle} title="Sync Status" meta="No fake logs" />
            <EmptyState
              isLight={isLight}
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
            className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.985 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className={`max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl border p-6 shadow-2xl ${
                isLight ? 'border-slate-200 bg-white text-slate-900' : 'border-white/15 bg-[#080b12] text-white'
              }`}
            >
              <div className={`flex items-center justify-between border-b pb-4 ${
                isLight ? 'border-slate-200' : 'border-white/10'
              }`}>
                <PanelTitle isLight={isLight} icon={Database} title="Connect Database" meta="Configuration only" />
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(false)}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
                    isLight ? 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200' : 'border-white/12 bg-white/[0.055] text-white/80 hover:bg-white/15'
                  }`}
                  aria-label="Close database wizard"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[72vh] overflow-y-auto pt-4">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className={`text-[20px] font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Choose Provider</h3>
                        <p className={`mt-0.5 text-[13px] font-medium ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Select a connector provider to configure credentials.</p>
                      </div>
                      <RecentSearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search providers"
                        storageKey="db_providers"
                        isLight={isLight}
                        className="min-w-[220px]"
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {filteredProviders.map((provider) => (
                        <button
                          key={provider.id}
                          type="button"
                          onClick={() => setSelectedProviderId(provider.id)}
                          className={`min-h-[135px] rounded-xl border p-4 text-left transition touch-manipulation ${
                            selectedProviderId === provider.id
                              ? isLight
                                ? 'border-blue-500 bg-blue-50/70 text-slate-900 ring-2 ring-blue-500/20'
                                : 'border-blue-400 bg-blue-500/15 text-white ring-2 ring-blue-400/30'
                              : isLight
                                ? 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-800'
                                : 'border-white/10 bg-white/[0.04] hover:bg-white/10 text-white'
                          }`}
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl border" style={{ backgroundColor: `${provider.accent}20`, borderColor: `${provider.accent}40` }}>
                              {provider.type === 'API' ? <Code2 className="h-5 w-5" style={{ color: provider.accent }} /> : <Database className="h-5 w-5" style={{ color: provider.accent }} />}
                            </span>
                            {selectedProviderId === provider.id ? <Check className="h-4 w-4 text-blue-500" /> : null}
                          </span>
                          <span className="mt-3 block text-[15px] font-bold">{provider.name}</span>
                          <span className="mt-0.5 block text-[12px] font-semibold opacity-70">{provider.type}</span>
                          <span className="mt-2 block text-[12px] leading-5 opacity-80">{provider.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={`rounded-xl border p-4 ${
                    isLight ? 'border-slate-200 bg-slate-50 text-slate-900' : 'border-white/10 bg-white/[0.035] text-white'
                  }`}>
                    <PanelTitle isLight={isLight} icon={Server} title={`${selectedProvider.name} Details`} meta="Connector fields" />
                    <div className="mt-4 grid gap-3">
                      {selectedProvider.fields.map((field) => (
                        <label key={field.key}>
                          <span className={`mb-1.5 block text-[12px] font-bold ${isLight ? 'text-slate-700' : 'text-white/70'}`}>{field.label}</span>
                          <input
                            type={field.type || 'text'}
                            placeholder={field.placeholder || field.label}
                            className={`h-11 w-full rounded-lg border px-3 text-base md:text-sm outline-none transition focus:ring-2 focus:ring-blue-500/30 ${
                              isLight ? 'border-slate-300 bg-white text-slate-900' : 'border-white/12 bg-black/40 text-white'
                            }`}
                          />
                        </label>
                      ))}
                    </div>

                    <div className="mt-4 rounded-xl border border-amber-300/30 bg-amber-500/10 p-3 text-[12.5px] font-medium leading-6 text-amber-700 dark:text-amber-200">
                      This form configures connection details. Connectors require a server endpoint.
                    </div>

                    {statusMessage ? (
                      <div className="mt-3 rounded-xl border border-blue-300/30 bg-blue-500/10 p-3 text-[12.5px] font-medium leading-6 text-blue-700 dark:text-blue-200">
                        {statusMessage}
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={requestConnection}
                      className={`mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-bold shadow-md transition ${
                        isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-black hover:bg-slate-200'
                      }`}
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

function PanelTitle({ icon: Icon, isLight, meta, title }: { icon: any; isLight?: boolean; meta: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl border-0 ${
        isLight ? 'bg-zinc-100 text-black' : 'bg-zinc-900 text-white'
      }`}>
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <div className={`text-[15px] font-bold ${isLight ? 'text-black' : 'text-white'}`}>{title}</div>
        <div className={`mt-0.5 text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>{meta}</div>
      </div>
    </div>
  );
}

function MetricCard({ helper, icon: Icon, isLight, label, value }: { helper: string; icon: any; isLight?: boolean; label: string; value: string }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`rounded-xl border-0 p-5 shadow-sm transition-all ${
        isLight ? 'bg-zinc-50 text-black' : 'bg-black text-white'
      }`}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl border-0 ${
        isLight ? 'bg-zinc-100 text-black' : 'bg-zinc-900 text-white'
      }`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className={`mt-4 text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>{label}</div>
      <div className={`mt-1.5 text-[28px] font-extrabold ${isLight ? 'text-black' : 'text-white'}`}>{value}</div>
      <div className={`mt-1 text-[12.5px] font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>{helper}</div>
    </motion.article>
  );
}

function SoftStat({ isLight, label, value }: { isLight?: boolean; label: string; value: string }) {
  return (
    <div className={`rounded-xl border-0 p-3.5 transition-all ${
      isLight ? 'bg-zinc-100 text-black' : 'bg-zinc-900 text-white'
    }`}>
      <div className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>{label}</div>
      <div className={`mt-1 text-[18px] font-extrabold ${isLight ? 'text-black' : 'text-white'}`}>{value}</div>
    </div>
  );
}

function EmptyState({ compact = false, icon: Icon, isLight, text, title }: { compact?: boolean; icon: any; isLight?: boolean; text: string; title: string }) {
  return (
    <div className={`mt-4 grid place-items-center rounded-xl border-2 border-dashed p-6 text-center ${
      isLight ? 'border-zinc-200 bg-zinc-50 text-black' : 'border-zinc-800 bg-zinc-900 text-white'
    } ${compact ? 'min-h-[170px]' : 'min-h-[260px]'}`}>
      <div>
        <Icon className={`mx-auto h-8 w-8 ${isLight ? 'text-black' : 'text-white'}`} />
        <div className={`mt-3 text-[16px] font-extrabold ${isLight ? 'text-black' : 'text-white'}`}>{title}</div>
        <p className={`mt-2 max-w-xl text-[13px] font-medium leading-6 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>{text}</p>
      </div>
    </div>
  );
}

function SecurityLine({ icon: Icon, isLight, text }: { icon: any; isLight?: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 font-medium ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
      <Icon className={`h-4 w-4 ${isLight ? 'text-black' : 'text-white'}`} />
      <span>{text}</span>
    </div>
  );
}
