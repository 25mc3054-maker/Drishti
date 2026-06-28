"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Truck, X } from 'lucide-react';

interface AddSupplierModalProps {
  onClose: () => void;
  onSupplierAdded: () => void;
}

export function AddSupplierModal({ onClose, onSupplierAdded }: AddSupplierModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [products, setProducts] = useState('');
  const [leadTimeDays, setLeadTimeDays] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name || !phone) {
      setError('Supplier name and phone are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/saas/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          products,
          leadTimeDays: Number(leadTimeDays || 0),
          notes,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to add supplier.');
      }
      onSupplierAdded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add supplier.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg rounded-[8px] border border-white/10 bg-[#0A0C0F] p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-3 text-xl font-semibold text-white">
            <Truck className="h-5 w-5 text-[#7EA7FF]" />
            Add Supplier
          </h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-white/50 transition hover:bg-white/10 hover:text-white" aria-label="Close supplier form">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Supplier Name" value={name} onChange={setName} placeholder="e.g. ITC Distributor" required />
            <Field label="Phone" value={phone} onChange={setPhone} placeholder="10-digit phone" required />
          </div>
          <Field label="Products Supplied" value={products} onChange={setProducts} placeholder="Biscuits, staples, beverages" />
          <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
            <Field label="Lead Time" value={leadTimeDays} onChange={setLeadTimeDays} placeholder="Days" type="number" />
            <Field label="Notes" value={notes} onChange={setNotes} placeholder="Preferred order timing or terms" />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="h-11 rounded-full bg-white/5 px-6 text-sm font-semibold text-white/80 transition hover:bg-white/10">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="h-11 rounded-full bg-white px-6 text-sm font-semibold text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] transition hover:scale-[1.02] disabled:opacity-50">
              {isSubmitting ? 'Adding...' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function Field({ label, onChange, placeholder, required, type = 'text', value }: { label: string; onChange: (value: string) => void; placeholder: string; required?: boolean; type?: string; value: string }) {
  return (
    <label className="block text-sm font-medium text-white/70">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="mt-1 block h-11 w-full rounded-full border border-white/12 bg-black/45 px-4 text-[13px] text-white outline-none placeholder:text-white/34 transition focus:border-[#78B7FF]"
        placeholder={placeholder}
      />
    </label>
  );
}
