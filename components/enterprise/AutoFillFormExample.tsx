"use client";

import { useState, useEffect } from 'react';
import { User, Mail, Phone, Store, CheckCircle, Sparkles } from 'lucide-react';

interface AutoFillFormProps {
  currentUser?: {
    name?: string;
    email?: string;
    mobile?: string;
    shopName?: string;
  } | null;
}

export function AutoFillFormExample({ currentUser }: AutoFillFormProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    shopName: '',
  });

  const [isAutoFilled, setIsAutoFilled] = useState(false);

  // Auto-fill form inputs from authenticated user state whenever user state updates
  useEffect(() => {
    if (currentUser) {
      setFormData({
        fullName: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.mobile || '',
        shopName: currentUser.shopName || '',
      });
      setIsAutoFilled(true);
    }
  }, [currentUser]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-black/80 p-6 backdrop-blur-xl text-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5 mb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Quick Checkout & Profile Auto-Fill
          </h3>
          <p className="text-xs text-zinc-400">
            Form inputs are automatically pre-filled from your authenticated OAuth profile.
          </p>
        </div>
        {isAutoFilled && (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
            <CheckCircle className="h-3 w-3 text-emerald-400" /> Auto-Filled
          </span>
        )}
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
            Full Name
          </label>
          <div className="flex h-11 items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-zinc-400 focus-within:border-zinc-500 focus-within:text-white">
            <User className="h-4 w-4 shrink-0 text-current" />
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="Full Name"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500 font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
            Email Address
          </label>
          <div className="flex h-11 items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-zinc-400 focus-within:border-zinc-500 focus-within:text-white">
            <Mail className="h-4 w-4 shrink-0 text-current" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Email Address"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500 font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
            Phone Number
          </label>
          <div className="flex h-11 items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-zinc-400 focus-within:border-zinc-500 focus-within:text-white">
            <Phone className="h-4 w-4 shrink-0 text-current" />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="Phone Number"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500 font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
            Shop Name / Business
          </label>
          <div className="flex h-11 items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-zinc-400 focus-within:border-zinc-500 focus-within:text-white">
            <Store className="h-4 w-4 shrink-0 text-current" />
            <input
              type="text"
              value={formData.shopName}
              onChange={(e) => handleChange('shopName', e.target.value)}
              placeholder="Shop Name"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500 font-medium"
            />
          </div>
        </div>

        <button
          type="button"
          className="mt-2 h-11 w-full rounded-xl bg-white font-extrabold text-black transition hover:scale-[1.01] active:scale-[0.99]"
        >
          Confirm Details & Proceed
        </button>
      </form>
    </div>
  );
}
