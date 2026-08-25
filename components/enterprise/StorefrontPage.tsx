"use client"

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Copy, Download, ImageIcon, Layers3, Package2, Pencil, Printer, SlidersHorizontal } from 'lucide-react';
import type { DashboardData, TabKey } from './types';
import { formatMoney } from './utils';
import { EditProductModal } from './EditProductModal';

interface StorefrontPageProps {
  data: DashboardData;
  onNavigate?: (tab: TabKey) => void;
  theme?: 'dark' | 'light';
}

function readinessFor(product: any) {
  const checks = [
    Boolean(product.name),
    Number(product.price || 0) > 0,
    Number(product.qty || 0) > 0,
    Boolean(product.image),
    Boolean(product.description),
  ];
  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}

export function StorefrontPage({ data, onNavigate, theme = 'dark' }: StorefrontPageProps) {
  const isLight = theme === 'light';
  const [status, setStatus] = useState('');
  const products = data.items.slice(0, 12);
  const readiness = useMemo(() => {
    if (!data.items.length) return 0;
    return Math.round(data.items.reduce((sum: number, product: any) => sum + readinessFor(product), 0) / data.items.length);
  }, [data.items]);
  const missingImages = data.items.filter((product: any) => !product.image).length;
  const missingDescriptions = data.items.filter((product: any) => !product.description).length;
  const unavailable = data.items.filter((product: any) => Number(product.qty || 0) <= 0).length;
  const visibleProducts = data.items.filter((product: any) => Number(product.qty || 0) > 0).length;

  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editingMode, setEditingMode] = useState<'image' | 'description' | null>(null);

  function openEditModal(product: any, mode: 'image' | 'description') {
    setEditingProduct(product);
    setEditingMode(mode);
  }

  function closeEditModal() {
    setEditingProduct(null);
    setEditingMode(null);
  }

  const operatorCards = [
    { label: 'Catalog Readiness', value: `${readiness}%`, icon: CheckCircle2, helper: 'Name, price, stock, image, and description quality' },
    { label: 'Visible Products', value: String(visibleProducts), icon: Package2, helper: 'Items ready to show in a business catalog' },
    { label: 'Missing Images', value: String(missingImages), icon: ImageIcon, helper: 'Add images to improve merchandising quality' },
    { label: 'Missing Descriptions', value: String(missingDescriptions), icon: Layers3, helper: 'Add details for clearer staff references' },
  ];

  const catalogRows = data.items.map((item: any) => ({
    id: String(item.id),
    name: item.name || 'Unnamed item',
    price: Number(item.price || 0),
    qty: Number(item.qty || 0),
    description: item.description || '',
    image: item.image || '',
    readiness: readinessFor(item),
  }));

  const goToInventory = () => {
    onNavigate?.('business-suite');
  };

  const downloadCatalogCsv = () => {
    const header = ['Name', 'Price', 'Qty', 'Description', 'Image', 'Readiness'];
    const rows = catalogRows.map((row) => [
      row.name,
      String(row.price),
      String(row.qty),
      `"${row.description.replace(/"/g, '""')}"`,
      row.image,
      `${row.readiness}%`,
    ]);
    const content = [header.join(','), ...rows.map((line) => line.join(','))].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `catalog-readiness-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus('CSV downloaded.');
  };

  const copyCatalogSummary = async () => {
    const summary = [
      'Owner catalog readiness summary',
      `Catalog readiness: ${readiness}%`,
      `Visible products: ${visibleProducts}`,
      `Missing images: ${missingImages}`,
      `Missing descriptions: ${missingDescriptions}`,
      `Unavailable items: ${unavailable}`,
      '',
      ...catalogRows.slice(0, 20).map((row) => `${row.name} | Qty ${row.qty} | ₹${formatMoney(row.price)} | Readiness ${row.readiness}%`),
    ].join('\n');

    try {
      await navigator.clipboard.writeText(summary);
      setStatus('Catalog summary copied.');
    } catch {
      setStatus('Unable to copy catalog summary.');
    }
  };

  const printOwnerPlan = () => {
    window.print();
    setStatus('Print dialog opened.');
  };

  return (
    <section className={`space-y-6 rounded-2xl p-6 transition-colors border-0 ${
      isLight ? 'bg-white text-black shadow-sm' : 'bg-black text-white'
    }`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <div className={`text-[12px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Storefront Control</div>
          <h1 className={`text-[28px] font-extrabold tracking-tight ${isLight ? 'text-black' : 'text-white'}`}>
            Shop-owner catalog readiness and merchandising control
          </h1>
          <p className={`max-w-3xl text-[14.5px] font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
            Prepare product listings for staff, promotions, and operations without customer-side ordering.
          </p>
        </div>
        <div className={`rounded-xl border-0 px-4 py-3 text-[13px] font-bold ${
          isLight ? 'bg-zinc-100 text-black' : 'bg-zinc-900 text-white'
        }`}>
          Catalog value: <span className={`font-black ${isLight ? 'text-black' : 'text-white'}`}>₹{formatMoney(data.items.reduce((sum: number, item: any) => sum + Number(item.price || 0) * Number(item.qty || 0), 0))}</span>
        </div>
      </div>

      <div className={`flex flex-wrap gap-2 rounded-xl border-0 p-3 ${
        isLight ? 'bg-zinc-100 text-black' : 'bg-zinc-900 text-white'
      }`}>
        <OwnerAction isLight={isLight} icon={Pencil} label="Manage Inventory" onClick={goToInventory} />
        <OwnerAction isLight={isLight} icon={Download} label="Export Catalog CSV" onClick={downloadCatalogCsv} />
        <OwnerAction isLight={isLight} icon={Copy} label="Copy Catalog Summary" onClick={() => { void copyCatalogSummary(); }} />
        <OwnerAction isLight={isLight} icon={Printer} label="Print Owner Plan" onClick={printOwnerPlan} />
        {status ? <div className={`flex min-h-10 items-center px-2 text-[13px] font-bold ${isLight ? 'text-black' : 'text-white'}`}>{status}</div> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {operatorCards.map((card, index) => {
          const Icon = card.icon;

          return (
            <motion.article
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.24, delay: index * 0.04, ease: 'easeOut' }}
              className={`rounded-xl border-0 p-5 shadow-sm transition-all ${
                isLight ? 'bg-zinc-50 text-black' : 'bg-black text-white'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>{card.label}</div>
                <Icon className={`h-4 w-4 ${isLight ? 'text-black' : 'text-white'}`} />
              </div>
              <div className={`mt-3 text-[28px] font-extrabold ${isLight ? 'text-black' : 'text-white'}`}>{card.value}</div>
              <p className={`mt-2 text-[12.5px] font-medium leading-5 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>{card.helper}</p>
            </motion.article>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product: any, index: number) => {
            const score = readinessFor(product);

            return (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.22, delay: index * 0.025, ease: 'easeOut' }}
                whileHover={{ y: -3 }}
                className={`overflow-hidden rounded-xl border-0 p-4 shadow-sm transition-all ${
                  isLight ? 'bg-zinc-50 text-black' : 'bg-black text-white'
                }`}
              >
                <div className={`relative aspect-[4/3] overflow-hidden rounded-lg border-0 ${
                  isLight ? 'bg-zinc-200' : 'bg-zinc-900'
                }`}>
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className={`flex h-full items-center justify-center text-center text-[11px] font-bold uppercase tracking-wider ${
                      isLight ? 'text-zinc-400' : 'text-zinc-500'
                    }`}>Image needed</div>
                  )}
                </div>
                <div className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className={`text-[15px] font-bold ${isLight ? 'text-black' : 'text-white'}`}>{product.name || 'Unnamed product'}</div>
                      <div className={`mt-0.5 text-[16px] font-extrabold ${isLight ? 'text-black' : 'text-white'}`}>₹{formatMoney(Number(product.price || 0))}</div>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-[12px] font-bold ${
                      Number(product.qty || 0) > 0 ? (isLight ? 'bg-zinc-200 text-black' : 'bg-zinc-800 text-white') : 'bg-red-950 text-red-200'
                    }`}>
                      Qty {product.qty || 0}
                    </div>
                  </div>
                  <div className={`mt-4 h-2 overflow-hidden rounded-full ${isLight ? 'bg-zinc-200' : 'bg-zinc-900'}`}>
                    <div className={`h-full rounded-full ${isLight ? 'bg-black' : 'bg-white'}`} style={{ width: `${score}%` }} />
                  </div>
                  <div className={`mt-2 flex items-center justify-between text-[12px] font-semibold ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    <span>Readiness</span>
                    <span>{score}%</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wider">
                    <button type="button" onClick={goToInventory} className={`inline-flex items-center gap-1 rounded-full px-3 py-2 transition border-0 touch-manipulation min-h-[38px] ${
                      isLight ? 'bg-zinc-200 text-black hover:bg-zinc-300' : 'bg-zinc-800 text-white hover:bg-zinc-700'
                    }`}><Layers3 className="h-4 w-4" /> Catalog</button>
                    {!product.description ? <button type="button" onClick={() => openEditModal(product, 'description')} className={`inline-flex items-center gap-1 rounded-full px-3 py-2 border-0 touch-manipulation min-h-[38px] ${isLight ? 'bg-zinc-200 text-black' : 'bg-zinc-800 text-white'}`}><Pencil className="h-4 w-4" /> Add copy</button> : null}
                    {!product.image ? <button type="button" onClick={() => openEditModal(product, 'image')} className={`inline-flex items-center gap-1 rounded-full px-3 py-2 border-0 touch-manipulation min-h-[38px] ${isLight ? 'bg-zinc-200 text-black' : 'bg-zinc-800 text-white'}`}><ImageIcon className="h-4 w-4" /> Add image</button> : null}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        <aside className={`rounded-xl border-0 p-5 shadow-sm ${
          isLight ? 'bg-zinc-50 text-black' : 'bg-black text-white'
        }`}>
          <div className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
            <SlidersHorizontal className="h-4 w-4 text-current" />
            Owner checklist
          </div>
          <div className="mt-4 space-y-3">
            <ChecklistItem isLight={isLight} done={missingImages === 0} text={missingImages === 0 ? 'Every product has an image.' : `${missingImages} product images need attention.`} />
            <ChecklistItem isLight={isLight} done={missingDescriptions === 0} text={missingDescriptions === 0 ? 'Every product has useful copy.' : `${missingDescriptions} product descriptions need writing.`} />
            <ChecklistItem isLight={isLight} done={unavailable === 0} text={unavailable === 0 ? 'No unavailable items in the catalog.' : `${unavailable} unavailable items should be restocked or hidden.`} />
            <ChecklistItem isLight={isLight} done={readiness >= 80} text={readiness >= 80 ? 'Catalog is ready to share.' : 'Improve readiness before sharing the catalog.'} />
          </div>
          <div className={`mt-6 rounded-xl border p-4 ${
            isLight ? 'border-slate-200 bg-white text-slate-800' : 'border-white/10 bg-white/[0.035] text-white'
          }`}>
            <div className="text-[13px] font-bold">Useful next move</div>
            <p className={`mt-2 text-[13px] font-medium leading-6 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>Prioritize products with stock, price, photo, and description first. That creates a clean catalog for staff, social promotion, and supplier planning.</p>
          </div>
        </aside>
      </div>

      {editingProduct && editingMode && (
        <EditProductModal
          product={editingProduct}
          mode={editingMode}
          theme={theme}
          isLight={isLight}
          onClose={closeEditModal}
          onUpdate={() => {
            closeEditModal();
            window.location.reload();
          }}
        />
      )}
    </section>
  );
}

function ChecklistItem({ done, isLight, text }: { done: boolean; isLight?: boolean; text: string }) {
  return (
    <div className={`flex gap-3 rounded-xl border p-3 text-[13px] font-medium leading-5 ${
      isLight ? 'border-slate-200 bg-white text-slate-800' : 'border-white/10 bg-white/[0.035] text-white/80'
    }`}>
      {done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}
      <span>{text}</span>
    </div>
  );
}

function OwnerAction({ icon: Icon, isLight, label, onClick }: { icon: any; isLight?: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-full border-0 px-4 text-[13px] font-bold transition ${
        isLight
          ? 'bg-zinc-200 text-black hover:bg-zinc-300'
          : 'bg-zinc-800 text-white hover:bg-zinc-700'
      }`}
    >
      <Icon className="h-4 w-4 text-current" />
      {label}
    </button>
  );
}
