"use client"

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Settings, ShieldCheck, Upload, UserPlus, Users } from 'lucide-react';

type SaaSAdminPageProps = {
  onDataRefresh?: () => Promise<void>;
  theme?: 'dark' | 'light';
};

export function SaaSAdminPage({ onDataRefresh, theme = 'dark' }: SaaSAdminPageProps) {
  const isLight = theme === 'light';
  const [staff, setStaff] = useState<any[]>([]);
  const [settings, setSettings] = useState<any | null>(null);
  const [staffForm, setStaffForm] = useState({ name: '', email: '', role: 'cashier' });
  const [settingsForm, setSettingsForm] = useState({ receiptHeader: '', taxPercent: '0', invoicePrefix: 'INV' });
  const [importJson, setImportJson] = useState('{\n  "items": [],\n  "customers": [],\n  "suppliers": [],\n  "invoices": []\n}');
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

  const load = async () => {
    const [staffRes, settingsRes] = await Promise.all([
      fetch('/api/saas/staff').then((response) => response.json()),
      fetch('/api/saas/settings').then((response) => response.json()),
    ]);
    setStaff(staffRes.staff || []);
    setSettings(settingsRes.settings || null);
    if (settingsRes.settings) {
      setSettingsForm({
        receiptHeader: settingsRes.settings.receiptHeader || '',
        taxPercent: String(settingsRes.settings.taxPercent || 0),
        invoicePrefix: settingsRes.settings.invoicePrefix || 'INV',
      });
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const setSuccess = (message: string) => setStatus({ type: 'success', message });
  const setError = (message: string) => setStatus({ type: 'error', message });

  const addStaff = async () => {
    if (!staffForm.name || !staffForm.email) {
      setError('Name and email are required to add staff.');
      return;
    }

    try {
      const response = await fetch('/api/saas/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffForm),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed to create staff account.');
      setStaffForm({ name: '', email: '', role: 'cashier' });
      setSuccess('Staff member saved successfully.');
      await load();
    } catch (err: any) {
      setError(err.message || 'Unable to save staff account.');
    }
  };

  const saveSettings = async () => {
    try {
      const response = await fetch('/api/saas/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptHeader: settingsForm.receiptHeader,
          taxPercent: Number(settingsForm.taxPercent || 0),
          invoicePrefix: settingsForm.invoicePrefix,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed to save settings.');
      setSuccess('Shop settings saved.');
      await load();
    } catch (err: any) {
      setError(err.message || 'Unable to save settings.');
    }
  };

  const runImport = async () => {
    try {
      const parsed = JSON.parse(importJson);
      const response = await fetch('/api/saas/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Import failed.');
      setSuccess(`Import complete: ${result.imported.items} items, ${result.imported.customers} customers, ${result.imported.suppliers} suppliers.`);
      await onDataRefresh?.();
    } catch (err: any) {
      setError(err.message || 'Invalid JSON format or import failed.');
    }
  };

  const exportTemplate = () => {
    const template = {
      items: [{ name: 'Sample Product', price: 100, qty: 10, description: 'Optional' }],
      customers: [{ name: 'Sample Customer', phone: '9999999999' }],
      suppliers: [{ name: 'Sample Supplier', phone: '9999999999', products: 'Sample Product' }],
      invoices: [],
    };
    setImportJson(JSON.stringify(template, null, 2));
    setSuccess('Import template loaded.');
  };

  return (
    <section className={`space-y-6 rounded-2xl p-6 transition-colors border-0 ${
      isLight ? 'bg-white text-black shadow-sm' : 'bg-black text-white'
    }`}>
      <div className="space-y-1">
        <div className={`text-[12px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>SaaS Admin</div>
        <h1 className={`text-[28px] font-extrabold tracking-tight ${isLight ? 'text-black' : 'text-white'}`}>
          Tenant controls for staff, settings, and onboarding
        </h1>
        <p className={`max-w-3xl text-[14.5px] font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
          These controls are scoped to the logged-in shopkeeper tenant only.
        </p>
      </div>

      {status.message ? (
        <div className={`rounded-xl border-0 px-4 py-2.5 text-[13px] font-bold ${
          status.type === 'error' ? 'bg-red-950 text-red-200' : 'bg-zinc-900 text-white'
        }`}>
          {status.message}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminPanel isLight={isLight} icon={Users} title="Staff Access" meta={`${staff.length} staff users`}>
          <div className="grid gap-2 sm:grid-cols-3">
            <AdminInput isLight={isLight} value={staffForm.name} onChange={(value) => setStaffForm({ ...staffForm, name: value })} placeholder="Name" />
            <AdminInput isLight={isLight} value={staffForm.email} onChange={(value) => setStaffForm({ ...staffForm, email: value })} placeholder="Email" />
            <select
              value={staffForm.role}
              onChange={(event) => setStaffForm({ ...staffForm, role: event.target.value })}
              className={`h-10 rounded-xl border-0 px-3 text-[13px] font-semibold outline-none ${
                isLight ? 'bg-zinc-100 text-black' : 'bg-zinc-900 text-white'
              }`}
            >
              <option value="cashier">Cashier</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => { void addStaff(); }}
            className={`mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-xl border-0 px-4 text-[13px] font-bold transition ${
              isLight ? 'bg-black text-white hover:bg-zinc-800' : 'bg-white text-black hover:bg-zinc-200'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            Add Staff
          </button>
          <div className="mt-4 space-y-2">
            {staff.map((member) => (
              <div key={member.id} className={`rounded-xl border-0 p-3 text-[13px] font-medium ${
                isLight ? 'bg-zinc-100 text-black' : 'bg-zinc-900 text-white'
              }`}>
                <span className={`font-bold ${isLight ? 'text-black' : 'text-white'}`}>{member.name}</span> • {member.email} • <span className={`uppercase font-bold ${isLight ? 'text-black' : 'text-white'}`}>{member.role}</span>
              </div>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel isLight={isLight} icon={Settings} title="Store Settings" meta={settings?.tenant_id ? 'Tenant isolated' : 'Default'}>
          <div className="space-y-2">
            <AdminInput isLight={isLight} value={settingsForm.receiptHeader} onChange={(value) => setSettingsForm({ ...settingsForm, receiptHeader: value })} placeholder="Receipt header" />
            <AdminInput isLight={isLight} value={settingsForm.taxPercent} onChange={(value) => setSettingsForm({ ...settingsForm, taxPercent: value })} placeholder="Tax percent" />
            <AdminInput isLight={isLight} value={settingsForm.invoicePrefix} onChange={(value) => setSettingsForm({ ...settingsForm, invoicePrefix: value })} placeholder="Invoice prefix" />
          </div>
          <button
            type="button"
            onClick={() => { void saveSettings(); }}
            className={`mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-xl border-0 px-4 text-[13px] font-bold transition ${
              isLight ? 'bg-black text-white hover:bg-zinc-800' : 'bg-white text-black hover:bg-zinc-200'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Save Settings
          </button>
        </AdminPanel>
      </div>

      <AdminPanel isLight={isLight} icon={Upload} title="Bulk Add / Import" meta="Add them all">
        <textarea
          value={importJson}
          onChange={(event) => setImportJson(event.target.value)}
          className={`min-h-[220px] w-full rounded-xl border-0 p-4 font-mono text-[13px] leading-6 outline-none transition focus:ring-1 focus:ring-black dark:focus:ring-white ${
            isLight ? 'bg-zinc-100 text-black' : 'bg-zinc-900 text-white'
          }`}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportTemplate}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border-0 px-4 text-[13px] font-bold transition ${
              isLight ? 'bg-zinc-100 text-black hover:bg-zinc-200' : 'bg-zinc-900 text-white hover:bg-zinc-800'
            }`}
          >
            <Download className="h-4 w-4 text-current" />
            Load Template
          </button>
          <button
            type="button"
            onClick={() => { void runImport(); }}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border-0 px-4 text-[13px] font-bold transition ${
              isLight ? 'bg-black text-white hover:bg-zinc-800' : 'bg-white text-black hover:bg-zinc-200'
            }`}
          >
            <Upload className="h-4 w-4" />
            Import Data
          </button>
        </div>
      </AdminPanel>
    </section>
  );
}

function AdminPanel({ children, icon: Icon, isLight, meta, title }: { children: React.ReactNode; icon: any; isLight?: boolean; meta: string; title: string }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      className={`rounded-xl border-0 p-5 shadow-sm transition-all ${
        isLight ? 'bg-zinc-50 text-black' : 'bg-black text-white'
      }`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className={`flex items-center gap-2 text-[15px] font-bold ${isLight ? 'text-black' : 'text-white'}`}>
          <Icon className="h-4 w-4 text-current" />
          {title}
        </div>
        <div className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>{meta}</div>
      </div>
      {children}
    </motion.article>
  );
}

function AdminInput({ isLight, onChange, placeholder, value }: { isLight?: boolean; onChange: (val: string) => void; placeholder: string; value: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={`h-11 w-full rounded-xl border-0 px-3.5 text-base md:text-sm outline-none transition focus:ring-1 focus:ring-black dark:focus:ring-white ${
        isLight ? 'bg-zinc-100 text-black placeholder:text-zinc-400' : 'bg-zinc-900 text-white placeholder:text-zinc-500'
      }`}
    />
  );
}
