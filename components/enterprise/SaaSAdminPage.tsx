"use client"

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Settings, ShieldCheck, Upload, UserPlus, Users } from 'lucide-react';

type SaaSAdminPageProps = {
  onDataRefresh?: () => Promise<void>;
};

export function SaaSAdminPage({ onDataRefresh }: SaaSAdminPageProps) {
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
    setSettingsForm({
      receiptHeader: settingsRes.settings?.receiptHeader || '',
      taxPercent: String(settingsRes.settings?.taxPercent || 0),
      invoicePrefix: settingsRes.settings?.invoicePrefix || 'INV',
    });
  };

  useEffect(() => {
    void load();
  }, []);

  const setSuccess = (message: string) => setStatus({ type: 'success', message });
  const setError = (message: string) => setStatus({ type: 'error', message });

  const addStaff = async () => {
    const response = await fetch('/api/saas/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staffForm),
    });
    const result = await response.json();
    if (!response.ok || !result.success) return setError(result.error || 'Unable to add staff.');
    setStaffForm({ name: '', email: '', role: 'cashier' });
    await load();
    setSuccess('Staff account added.');
  };

  const saveSettings = async () => {
    const response = await fetch('/api/saas/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...settingsForm, taxPercent: Number(settingsForm.taxPercent || 0) }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) return setError(result.error || 'Unable to save settings.');
    await load();
    setSuccess('Tenant settings saved.');
  };

  const importData = async () => {
    try {
      const payload = JSON.parse(importJson);
      const response = await fetch('/api/saas/onboarding/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) return setError(result.error || 'Import failed.');
      await onDataRefresh?.();
      setSuccess(`Imported items: ${result.summary?.items || 0}, customers: ${result.summary?.customers || 0}, suppliers: ${result.summary?.suppliers || 0}, invoices: ${result.summary?.invoices || 0}.`);
    } catch (error: any) {
      setError(error.message || 'Invalid JSON.');
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
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-[0.15em] text-[#6B7280]">SaaS Admin</div>
        <h2 className="text-[32px] font-semibold tracking-normal text-white">Tenant controls for staff, settings, and onboarding.</h2>
        <p className="max-w-3xl text-[15px] leading-6 text-[#9CA3AF]">These controls are scoped to the logged-in shopkeeper tenant only.</p>
      </div>

      {status.message ? (
        <div className={`rounded-[8px] border px-3 py-2 text-[13px] ${status.type === 'error' ? 'border-red-400/35 bg-red-500/10 text-red-100' : 'border-emerald-400/35 bg-emerald-500/10 text-emerald-100'}`}>
          {status.message}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminPanel icon={Users} title="Staff Access" meta={`${staff.length} staff users`}>
          <div className="grid gap-2 sm:grid-cols-3">
            <AdminInput value={staffForm.name} onChange={(value) => setStaffForm({ ...staffForm, name: value })} placeholder="Name" />
            <AdminInput value={staffForm.email} onChange={(value) => setStaffForm({ ...staffForm, email: value })} placeholder="Email" />
            <select value={staffForm.role} onChange={(event) => setStaffForm({ ...staffForm, role: event.target.value })} className="h-11 rounded-full border border-white/12 bg-black/45 px-4 text-[13px] text-white outline-none">
              <option value="cashier">Cashier</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="button" onClick={() => { void addStaff(); }} className="mt-3 action-button"><UserPlus className="h-4 w-4" />Add Staff</button>
          <div className="mt-4 space-y-2">
            {staff.map((member) => (
              <div key={member.id} className="rounded-[8px] border border-white/10 bg-white/[0.035] p-3 text-[13px] text-white/70">
                <span className="font-semibold text-white">{member.name}</span> • {member.email} • {member.role}
              </div>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel icon={Settings} title="Store Settings" meta={settings?.tenant_id ? 'Tenant isolated' : 'Default'}>
          <div className="space-y-2">
            <AdminInput value={settingsForm.receiptHeader} onChange={(value) => setSettingsForm({ ...settingsForm, receiptHeader: value })} placeholder="Receipt header" />
            <AdminInput value={settingsForm.taxPercent} onChange={(value) => setSettingsForm({ ...settingsForm, taxPercent: value })} placeholder="Tax percent" />
            <AdminInput value={settingsForm.invoicePrefix} onChange={(value) => setSettingsForm({ ...settingsForm, invoicePrefix: value })} placeholder="Invoice prefix" />
          </div>
          <button type="button" onClick={() => { void saveSettings(); }} className="mt-3 action-button"><ShieldCheck className="h-4 w-4" />Save Settings</button>
        </AdminPanel>
      </div>

      <AdminPanel icon={Upload} title="Bulk Add / Import" meta="Add them all">
        <textarea
          value={importJson}
          onChange={(event) => setImportJson(event.target.value)}
          className="min-h-[260px] w-full rounded-[8px] border border-white/12 bg-black/45 p-4 font-mono text-[13px] leading-6 text-white outline-none"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={exportTemplate} className="action-button"><Download className="h-4 w-4" />Load Template</button>
          <button type="button" onClick={() => { void importData(); }} className="action-button bg-white text-black hover:bg-white"><Upload className="h-4 w-4" />Import Data</button>
        </div>
      </AdminPanel>
    </section>
  );
}

function AdminPanel({ children, icon: Icon, meta, title }: { children: React.ReactNode; icon: any; meta: string; title: string }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      className="rounded-[8px] border border-white/12 bg-[#05070A]/88 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[15px] font-semibold text-white"><Icon className="h-4 w-4" />{title}</div>
        <div className="text-[11px] uppercase tracking-[0.15em] text-white/38">{meta}</div>
      </div>
      {children}
    </motion.article>
  );
}

function AdminInput({ onChange, placeholder, value }: { onChange: (value: string) => void; placeholder: string; value: string }) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-11 rounded-full border border-white/12 bg-black/45 px-4 text-[13px] text-white outline-none placeholder:text-white/34"
    />
  );
}
