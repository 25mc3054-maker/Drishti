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

export function StorefrontPage({ data, onNavigate }: StorefrontPageProps) {
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
    { label: 'Unavailable Items', value: String(unavailable), icon: AlertTriangle, helper: 'Restock or hide these before sharing the catalog' },
  ];
  const catalogRows = data.items.map((item: any) => ({
    name: item.name || 'Unnamed product',
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
      row.description,
      row.image,
      `${row.readiness}%`,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `drishti-owner-catalog-${Date.now()}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setStatus('Owner catalog CSV downloaded.');
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
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-[0.15em] text-[#6B7280]">Storefront Control</div>
          <h2 className="text-[32px] font-semibold tracking-normal text-white">Shop-owner catalog readiness and merchandising control.</h2>
          <p className="max-w-3xl text-[15px] leading-6 text-[#9CA3AF]">Prepare product listings for staff, promotions, and operations without customer-side ordering.</p>
        </div>
        <div className="rounded-[8px] border border-[#1A1A1A] bg-[#0A0A0A] px-4 py-3 text-[13px] text-[#D1D5DB]">
          Catalog value: <span className="text-white">₹{formatMoney(data.items.reduce((sum: number, item: any) => sum + Number(item.price || 0) * Number(item.qty || 0), 0))}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-[8px] border border-[#1A1A1A] bg-[#0A0A0A] p-3">
        <OwnerAction icon={Pencil} label="Manage Inventory" onClick={goToInventory} />
        <OwnerAction icon={Download} label="Export Catalog CSV" onClick={downloadCatalogCsv} />
        <OwnerAction icon={Copy} label="Copy Catalog Summary" onClick={() => { void copyCatalogSummary(); }} />
        <OwnerAction icon={Printer} label="Print Owner Plan" onClick={printOwnerPlan} />
        {status ? <div className="flex min-h-10 items-center px-2 text-[13px] text-emerald-200">{status}</div> : null}
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
              className="rounded-[8px] border border-[#1A1A1A] bg-[#0A0A0A] p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] uppercase tracking-[0.15em] text-[#6B7280]">{card.label}</div>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div className="mt-3 text-[30px] font-bold tracking-normal text-white">{card.value}</div>
              <p className="mt-2 text-[12px] leading-5 text-[#6B7280]">{card.helper}</p>
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
                whileHover={{ y: -3, scale: 1.005, boxShadow: '0 0 0 1px #6366F1' }}
                className="overflow-hidden rounded-[8px] border border-[#1A1A1A] bg-[#0A0A0A] p-4"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-[8px] border border-[#1A1A1A] bg-[#111111]">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-center text-[11px] uppercase tracking-[0.22em] text-[#6B7280]">Image needed</div>
                  )}
                  <div className="absolute inset-x-0 top-0 h-px bg-[#6366F1] opacity-40" />
                </div>
                <div className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[15px] font-medium text-white">{product.name || 'Unnamed product'}</div>
                      <div className="mt-1 text-[16px] font-semibold text-white">₹{formatMoney(Number(product.price || 0))}</div>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-[12px] font-semibold ${Number(product.qty || 0) > 0 ? 'bg-emerald-400/10 text-emerald-200' : 'bg-red-400/10 text-red-200'}`}>
                      Qty {product.qty || 0}
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-[#6366F1]" style={{ width: `${score}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[12px] text-[#6B7280]">
                    <span>Readiness</span>
                    <span>{score}%</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.12em] text-[#9CA3AF]">
                    <button type="button" onClick={goToInventory} className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 transition hover:border-white/25 hover:bg-white/10"><Layers3 className="h-3.5 w-3.5" /> Catalog</button>
                    {!product.description ? <button type="button" onClick={() => openEditModal(product, 'description')} className="inline-flex items-center gap-1 rounded-full border border-amber-300/20 bg-amber-400/10 px-2.5 py-1 text-amber-100 transition hover:bg-amber-400/16"><Pencil className="h-3.5 w-3.5" /> Add copy</button> : null}
                    {!product.image ? <button type="button" onClick={() => openEditModal(product, 'image')} className="inline-flex items-center gap-1 rounded-full border border-sky-300/20 bg-sky-400/10 px-2.5 py-1 text-sky-100 transition hover:bg-sky-400/16"><ImageIcon className="h-3.5 w-3.5" /> Add image</button> : null}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        <aside className="rounded-[8px] border border-[#1A1A1A] bg-[#0A0A0A] p-5">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-[#6B7280]">
            <SlidersHorizontal className="h-4 w-4 text-white" />
            Owner checklist
          </div>
          <div className="mt-5 space-y-3">
            <ChecklistItem done={missingImages === 0} text={missingImages === 0 ? 'Every product has an image.' : `${missingImages} product images need attention.`} />
            <ChecklistItem done={missingDescriptions === 0} text={missingDescriptions === 0 ? 'Every product has useful copy.' : `${missingDescriptions} product descriptions need writing.`} />
            <ChecklistItem done={unavailable === 0} text={unavailable === 0 ? 'No unavailable items in the catalog.' : `${unavailable} unavailable items should be restocked or hidden.`} />
            <ChecklistItem done={readiness >= 80} text={readiness >= 80 ? 'Catalog is ready to share.' : 'Improve readiness before sharing the catalog.'} />
          </div>
          <div className="mt-6 rounded-[8px] border border-white/10 bg-white/[0.035] p-4">
            <div className="text-[13px] font-semibold text-white">Useful next move</div>
            <p className="mt-2 text-[13px] leading-6 text-[#9CA3AF]">Prioritize products with stock, price, photo, and description first. That creates a clean catalog for staff, social promotion, and supplier planning.</p>
          </div>
        </aside>
      </div>

      {editingProduct && editingMode && (
        <EditProductModal
          product={editingProduct}
          mode={editingMode}
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

function ChecklistItem({ done, text }: { done: boolean; text: string }) {
  return (
    <div className="flex gap-3 rounded-[8px] border border-white/10 bg-white/[0.035] p-3 text-[13px] leading-5 text-[#D1D5DB]">
      {done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />}
      <span>{text}</span>
    </div>
  );
}

function OwnerAction({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/12 bg-black/45 px-4 text-[13px] font-semibold text-white transition hover:border-white/28 hover:bg-white/10"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
