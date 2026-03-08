'use client';

import { useMemo, useState } from 'react';
import { Package, Plus, Minus, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';

type StockItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

interface StockManagementProps {
  items: StockItem[];
  onAddToBill: (item: StockItem) => void;
  onRefresh: () => Promise<void>;
}

export default function StockManagement({ items, onAddToBill, onRefresh }: StockManagementProps) {
  const [draftQty, setDraftQty] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const totalUnits = useMemo(() => items.reduce((sum, item) => sum + Number(item.qty || 0), 0), [items]);
  const lowStock = useMemo(() => items.filter((item) => Number(item.qty || 0) <= 5).length, [items]);
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const value = searchQuery.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(value));
  }, [items, searchQuery]);

  async function updateStock(item: StockItem) {
    const nextQty = Number(draftQty[item.id]);
    if (!Number.isFinite(nextQty) || nextQty < 0) {
      toast.error('Enter a valid stock quantity');
      return;
    }

    setIsSaving((previous) => ({ ...previous, [item.id]: true }));
    try {
      const response = await fetch('/api/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, qty: nextQty }),
      });
      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || 'Failed to update stock');
        return;
      }

      toast.success(`${item.name} stock updated to ${nextQty}`);
      await onRefresh();
      setDraftQty((previous) => {
        const copy = { ...previous };
        delete copy[item.id];
        return copy;
      });
    } finally {
      setIsSaving((previous) => ({ ...previous, [item.id]: false }));
    }
  }

  return (
    <div className="premium-card neon-panel p-5">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-gemini-blue-300" />
          Stock Management
        </h2>
        <button type="button" onClick={() => void onRefresh()} className="premium-button-ghost float-on-hover text-xs">
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div className="rounded-xl border border-gemini-blue-500/30 bg-black/35 p-3">
          <p className="text-gemini-blue-300">Products</p>
          <p className="text-white font-bold">{items.length}</p>
        </div>
        <div className="rounded-xl border border-gemini-blue-500/30 bg-black/35 p-3">
          <p className="text-gemini-blue-300">Total Units</p>
          <p className="text-white font-bold">{totalUnits}</p>
        </div>
        <div className="rounded-xl border border-gemini-blue-500/30 bg-black/35 p-3 col-span-2">
          <p className="text-gemini-blue-300">Low Stock (≤ 5 units)</p>
          <p className="text-white font-bold">{lowStock}</p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="w-4 h-4 text-gemini-blue-300 absolute left-3 top-3.5" />
        <input
          className="premium-input pl-9"
          placeholder="Search stock by product name"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>

      <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
        {filteredItems.map((item) => {
          const value = draftQty[item.id] ?? item.qty;
          return (
            <div key={item.id} className="border border-gemini-blue-500/25 rounded-xl p-3 bg-black/40">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <p className="text-white font-medium">{item.name}</p>
                  <p className="text-xs text-gemini-blue-300">₹{item.price} • Current stock: {item.qty}</p>
                </div>
                <button type="button" className="premium-button-ghost float-on-hover text-xs" onClick={() => onAddToBill(item)}>
                  Add to Bill
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="premium-button-ghost p-2"
                  onClick={() => setDraftQty((prev) => ({ ...prev, [item.id]: Math.max(0, value - 1) }))}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  min="0"
                  value={value}
                  onChange={(event) => setDraftQty((prev) => ({ ...prev, [item.id]: Number(event.target.value) }))}
                  className="premium-input py-2"
                />
                <button
                  type="button"
                  className="premium-button-ghost p-2"
                  onClick={() => setDraftQty((prev) => ({ ...prev, [item.id]: value + 1 }))}
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void updateStock(item)}
                  disabled={Boolean(isSaving[item.id])}
                  className="premium-button-primary float-on-hover text-xs whitespace-nowrap"
                >
                  {isSaving[item.id] ? 'Updating...' : 'Update Stock'}
                </button>
              </div>
            </div>
          );
        })}
        {filteredItems.length === 0 && <p className="text-sm text-gemini-blue-300">No products found. Try another search or add products first.</p>}
      </div>
    </div>
  );
}
