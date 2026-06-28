"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, X } from 'lucide-react';

interface AddCustomerModalProps {
  onClose: () => void;
  onCustomerAdded: () => void;
}

export function AddCustomerModal({ onClose, onCustomerAdded }: AddCustomerModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name || !phone) {
      setError('Name and phone are required.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/saas/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, address }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to add customer.');
      }
      onCustomerAdded();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0A0C0F] p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-3 text-xl font-semibold text-white">
            <UserPlus className="h-5 w-5 text-[#7EA7FF]" />
            Add New Customer
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-white/70">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full h-11 rounded-full border border-white/12 bg-black/45 px-4 text-[13px] text-white outline-none placeholder:text-white/34 transition focus:border-[#78B7FF]"
              placeholder="e.g. Rohan Sharma"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-white/70">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="mt-1 block w-full h-11 rounded-full border border-white/12 bg-black/45 px-4 text-[13px] text-white outline-none placeholder:text-white/34 transition focus:border-[#78B7FF]"
              placeholder="e.g. 9876543210"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/70">
              Email Address (Optional)
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full h-11 rounded-full border border-white/12 bg-black/45 px-4 text-[13px] text-white outline-none placeholder:text-white/34 transition focus:border-[#78B7FF]"
              placeholder="e.g. rohan@example.com"
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-white/70">
              Address (Optional)
            </label>
            <textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-2xl border border-white/12 bg-black/45 px-4 py-2 text-[13px] text-white outline-none placeholder:text-white/34 transition focus:border-[#78B7FF]"
              placeholder="e.g. 123, Main Street, Bengaluru"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-full bg-white/5 px-6 text-sm font-semibold text-white/80 transition hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-11 rounded-full bg-white px-6 text-sm font-semibold text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] transition hover:scale-[1.02] disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Customer'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
