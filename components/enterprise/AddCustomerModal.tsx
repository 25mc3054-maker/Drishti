"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, X } from 'lucide-react';

interface AddCustomerModalProps {
  onClose: () => void;
  onCustomerAdded: (customer?: any) => void;
  theme?: 'dark' | 'light';
  isLight?: boolean;
}

export function AddCustomerModal({
  onClose,
  onCustomerAdded,
  theme,
  isLight: isLightProp,
}: AddCustomerModalProps) {
  const isLight = isLightProp ?? (
    theme === 'light' ||
    (typeof document !== 'undefined' && document.documentElement.classList.contains('light'))
  );

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const finalPhone = phone.trim();
    let finalName = name.trim();

    if (!finalPhone && !finalName) {
      setError('Please enter a phone number or customer name.');
      return;
    }

    if (!finalName) {
      finalName = `Customer ${finalPhone}`;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/saas/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: finalName, phone: finalPhone, email, address }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to add customer.');
      }
      onCustomerAdded(result.customer);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-sm overflow-y-auto ${
        isLight ? 'bg-black/40' : 'bg-black/60'
      }`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border p-5 sm:p-6 shadow-2xl transition-colors ${
          isLight ? 'border-zinc-200 bg-white text-black' : 'border-zinc-800 bg-[#0A0C0F] text-white'
        }`}
      >
        <div className={`flex items-center justify-between border-b pb-3 ${
          isLight ? 'border-zinc-200' : 'border-zinc-800'
        }`}>
          <h2 className={`flex items-center gap-3 text-xl font-bold ${
            isLight ? 'text-black' : 'text-white'
          }`}>
            <UserPlus className={`h-5 w-5 ${isLight ? 'text-black' : 'text-white'}`} />
            Add New Customer
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full p-2 transition ${
              isLight
                ? 'text-zinc-400 hover:bg-zinc-100 hover:text-black'
                : 'text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="name" className={`block text-xs font-bold uppercase tracking-wider ${
              isLight ? 'text-zinc-700' : 'text-white/70'
            }`}>
              Full Name (Optional)
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`mt-1 block w-full h-11 rounded-xl border px-4 text-base md:text-sm outline-none transition font-semibold shadow-xs ${
                isLight
                  ? 'border-zinc-300 bg-zinc-50 text-black placeholder:text-zinc-400 focus:border-black focus:bg-white'
                  : 'border-zinc-800 bg-black text-white placeholder:text-white/34 focus:border-zinc-500'
              }`}
              placeholder="e.g. Rohan Sharma (Optional)"
            />
          </div>
          <div>
            <label htmlFor="phone" className={`block text-xs font-bold uppercase tracking-wider ${
              isLight ? 'text-zinc-700' : 'text-white/70'
            }`}>
              Phone Number *
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className={`mt-1 block w-full h-11 rounded-xl border px-4 text-base md:text-sm outline-none transition font-bold shadow-xs ${
                isLight
                  ? 'border-zinc-300 bg-zinc-50 text-black placeholder:text-zinc-400 focus:border-black focus:bg-white'
                  : 'border-zinc-800 bg-black text-white placeholder:text-white/34 focus:border-zinc-500'
              }`}
              placeholder="e.g. 9876543210"
            />
          </div>
          <div>
            <label htmlFor="email" className={`block text-xs font-bold uppercase tracking-wider ${
              isLight ? 'text-zinc-700' : 'text-white/70'
            }`}>
              Email Address (Optional)
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-1 block w-full h-11 rounded-xl border px-4 text-base md:text-sm outline-none transition font-medium shadow-xs ${
                isLight
                  ? 'border-zinc-300 bg-zinc-50 text-black placeholder:text-zinc-400 focus:border-black focus:bg-white'
                  : 'border-zinc-800 bg-black text-white placeholder:text-white/34 focus:border-zinc-500'
              }`}
              placeholder="e.g. rohan@example.com"
            />
          </div>
          <div>
            <label htmlFor="address" className={`block text-xs font-bold uppercase tracking-wider ${
              isLight ? 'text-zinc-700' : 'text-white/70'
            }`}>
              Address (Optional)
            </label>
            <textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className={`mt-1 block w-full rounded-xl border px-4 py-2.5 text-[13px] outline-none transition font-medium shadow-xs ${
                isLight
                  ? 'border-zinc-300 bg-zinc-50 text-black placeholder:text-zinc-400 focus:border-black focus:bg-white'
                  : 'border-zinc-800 bg-black text-white placeholder:text-white/34 focus:border-zinc-500'
              }`}
              placeholder="e.g. 123, Main Street, Bengaluru"
            />
          </div>

          {error && (
            <p className={`text-xs font-bold p-3 rounded-xl border ${
              isLight ? 'text-red-700 bg-red-50 border-red-200' : 'text-red-400 bg-red-500/10 border-red-500/20'
            }`}>
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className={`h-11 rounded-xl px-6 text-xs font-bold transition border ${
                isLight
                  ? 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200 hover:text-black'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`h-11 rounded-xl px-7 text-xs font-extrabold shadow-md transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 border-0 ${
                isLight
                  ? 'bg-black text-white hover:bg-zinc-800'
                  : 'bg-white text-black hover:bg-zinc-200'
              }`}
            >
              {isSubmitting ? 'Adding...' : 'Add Customer'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
