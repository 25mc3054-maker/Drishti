"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Box, X, UploadCloud, Check, PackageCheck } from 'lucide-react';

interface AddStockModalProps {
  onClose: () => void;
  onStockAdded: () => void;
  suppliers: any[];
  items?: any[];
  theme?: 'dark' | 'light';
  isLight?: boolean;
}

export function AddStockModal({
  onClose,
  onStockAdded,
  suppliers,
  items = [],
  theme,
  isLight: isLightProp,
}: AddStockModalProps) {
  // Determine if light mode is active
  const isLight = isLightProp ?? (
    theme === 'light' ||
    (typeof document !== 'undefined' && document.documentElement.classList.contains('light'))
  );

  // Input Refs for sequential Enter Key Navigation
  const nameInputRef = useRef<HTMLInputElement>(null);
  const brandDescInputRef = useRef<HTMLInputElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const unitValueInputRef = useRef<HTMLInputElement>(null);
  const unitSelectRef = useRef<HTMLSelectElement>(null);
  const categorySelectRef = useRef<HTMLSelectElement>(null);
  const newCategoryInputRef = useRef<HTMLInputElement>(null);
  const newSupplierNameRef = useRef<HTMLInputElement>(null);
  const newSupplierPhoneRef = useRef<HTMLInputElement>(null);
  const newSupplierLeadTimeRef = useRef<HTMLInputElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  const [name, setName] = useState('');
  const [brandAndDescription, setBrandAndDescription] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');
  const [unitValue, setUnitValue] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [stockMergeMode, setStockMergeMode] = useState<'add' | 'replace'>('add');
  const [allItems, setAllItems] = useState<any[]>(items || []);

  const [supplierMode, setSupplierMode] = useState<'existing' | 'new'>('existing');
  const [supplierId, setSupplierId] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierLeadTime, setNewSupplierLeadTime] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const response = await fetch('/api/saas/items');
        if (response.ok) {
          const result = await response.json();
          const itemsList = Array.isArray(result?.items) ? result.items : (Array.isArray(result?.data) ? result.data : []);
          setAllItems(itemsList);
          const uniqueCategories = Array.from(new Set(itemsList.map((item: any) => item?.category).filter(Boolean)));
          setCategories(uniqueCategories as string[]);
        }
      } catch (error) {
        console.error('Failed to fetch items:', error);
      }
    };
    fetchCatalog();
    // Auto-focus first input field on load
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 100);
  }, []);

  const existingItem = name.trim()
    ? allItems.find((i: any) => i?.name?.trim().toLowerCase() === name.trim().toLowerCase())
    : null;

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const applyNewCategory = () => {
    const trimmed = newCategory.trim();
    if (trimmed) {
      if (!categories.includes(trimmed)) {
        setCategories((prev) => [...prev, trimmed]);
      }
      setCategory(trimmed);
      setNewCategory('');
      setIsAddingNewCat(false);
    }
    setSupplierMode('new');
    setTimeout(() => {
      newSupplierNameRef.current?.focus();
    }, 50);
  };

  const handleCategoryEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyNewCategory();
    }
  };

  const handleKeyDownNext = (e: React.KeyboardEvent, nextRef: React.RefObject<any>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      nextRef.current?.focus();
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name || !price || !qty) {
      setError('Product Name, Price and No. of Products are required.');
      return;
    }

    let finalCategory = category;
    if (isAddingNewCat && newCategory.trim()) {
      finalCategory = newCategory.trim();
    }
    if (!finalCategory || finalCategory === 'new-category') {
      finalCategory = 'General';
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let imageUrl = existingItem?.imageUrl || '';
      if (image) {
        const formData = new FormData();
        formData.append('file', image);
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok || !uploadResult.url) {
          throw new Error(uploadResult.error || 'Failed to upload image.');
        }
        imageUrl = uploadResult.url;
      }
      
      let selectedSupplier = suppliers.find((supplier) => String(supplier.id) === supplierId);

      if (supplierMode === 'new' && newSupplierName.trim()) {
        const supplierResponse = await fetch('/api/saas/suppliers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newSupplierName,
            phone: newSupplierPhone || '',
            products: name,
            leadTimeDays: Number(newSupplierLeadTime || 0),
          }),
        });
        const supplierResult = await supplierResponse.json();
        if (supplierResponse.ok && supplierResult.success) {
          selectedSupplier = supplierResult.supplier;
        }
      }

      const trimmedUnitVal = unitValue.trim();
      const finalUnit = trimmedUnitVal ? `${trimmedUnitVal}${unit}` : (unit || 'pcs');

      const incomingQty = Number(qty);
      const isExisting = !!existingItem;
      const finalQty = (isExisting && stockMergeMode === 'add')
        ? Number(existingItem.qty || 0) + incomingQty
        : incomingQty;

      const endpoint = '/api/saas/items';
      const method = isExisting ? 'PUT' : 'POST';

      const payload: any = {
        ...(isExisting ? existingItem : {}),
        name,
        brand: brandAndDescription || existingItem?.brand || '',
        description: brandAndDescription || existingItem?.description || '',
        category: finalCategory || existingItem?.category || 'General',
        price: Number(price),
        qty: finalQty,
        unitValue: trimmedUnitVal || existingItem?.unitValue || '',
        unitType: unit || existingItem?.unitType || 'pcs',
        unit: finalUnit,
        supplierId: selectedSupplier?.id || existingItem?.supplierId || '',
        supplierName: selectedSupplier?.name || existingItem?.supplierName || '',
        supplierPhone: selectedSupplier?.phone || existingItem?.supplierPhone || '',
        supplierLeadTimeDays: Number(selectedSupplier?.leadTimeDays || existingItem?.supplierLeadTimeDays || 0),
        imageUrl,
      };

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save stock.');
      }
      onStockAdded();
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
        isLight ? 'bg-black/40' : 'bg-black/70'
      }`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border p-5 sm:p-6 shadow-2xl transition-colors ${
          isLight
            ? 'border-zinc-200 bg-white text-black'
            : 'border-zinc-800 bg-[#0A0C0F] text-white'
        }`}
      >
        <div className={`flex items-center justify-between border-b pb-3 ${
          isLight ? 'border-zinc-200' : 'border-zinc-800'
        }`}>
          <h2 className={`flex items-center gap-3 text-xl font-bold ${
            isLight ? 'text-black' : 'text-white'
          }`}>
            <Box className={`h-5 w-5 ${isLight ? 'text-black' : 'text-white'}`} />
            Add New Stock
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
          {/* Top Row: Image Upload (Left) + Product Name * (Right) */}
          <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                isLight ? 'text-zinc-700' : 'text-white/60'
              }`}>
                Product Image (Optional)
              </label>
              <div className="flex items-center gap-3">
                <div className={`w-16 h-16 rounded-xl border border-dashed flex items-center justify-center shrink-0 overflow-hidden ${
                  isLight
                    ? 'border-zinc-300 bg-zinc-50'
                    : 'border-zinc-700 bg-black/40'
                }`}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-xl"/>
                  ) : (
                    <UploadCloud className={`h-6 w-6 ${isLight ? 'text-zinc-400' : 'text-white/40'}`} />
                  )}
                </div>
                <div>
                  <input
                    id="stock-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="stock-image-upload"
                    className={`cursor-pointer inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition shadow-xs ${
                      isLight
                        ? 'border-zinc-300 bg-zinc-100 text-zinc-900 hover:bg-zinc-200'
                        : 'border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800'
                    }`}
                  >
                    {image ? 'Change Image' : 'Upload Image'}
                  </label>
                  <p className={`text-[10.5px] mt-1 ${isLight ? 'text-zinc-500' : 'text-white/40'}`}>PNG, JPG up to 5MB.</p>
                </div>
              </div>
            </div>

            {/* 1. Product Name beside Image */}
            <div>
              <label htmlFor="stock-name" className={`block text-xs font-bold uppercase tracking-wider ${
                isLight ? 'text-zinc-700' : 'text-white/70'
              }`}>
                Product Name *
              </label>
              <input
                ref={nameInputRef}
                id="stock-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => handleKeyDownNext(e, brandDescInputRef)}
                required
                className={`mt-1 block w-full h-11 rounded-xl border px-4 text-base md:text-sm outline-none transition font-semibold shadow-xs ${
                  isLight
                    ? 'border-zinc-300 bg-zinc-50 text-black placeholder:text-zinc-400 focus:border-black focus:bg-white'
                    : 'border-zinc-800 bg-black text-white placeholder:text-white/34 focus:border-zinc-500'
                }`}
                placeholder="e.g. Organic Honey or Sugar"
              />
            </div>
          </div>

          {/* Existing Product Stock Merge Banner */}
          {existingItem && (
            <div className={`rounded-xl border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs ${
              isLight
                ? 'border-zinc-300 bg-zinc-100 text-black'
                : 'border-zinc-700 bg-zinc-900/90 text-white'
            }`}>
              <div>
                <p className={`font-bold flex items-center gap-1.5 text-[12.5px] ${isLight ? 'text-black' : 'text-white'}`}>
                  <PackageCheck className={`h-4 w-4 shrink-0 ${isLight ? 'text-black' : 'text-white'}`} />
                  Existing Stock Found: "{existingItem.name}" ({existingItem.qty || 0} in stock)
                </p>
                <p className={`text-[11px] mt-0.5 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  How should we handle incoming stock?
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setStockMergeMode('add')}
                  className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition border ${
                    stockMergeMode === 'add'
                      ? (isLight ? 'bg-black text-white border-black shadow-sm' : 'bg-white text-black border-white shadow-md')
                      : (isLight ? 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-200 hover:text-black' : 'bg-black/60 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white')
                  }`}
                >
                  ➕ Add (+{qty || 0} = {Number(existingItem.qty || 0) + Number(qty || 0)})
                </button>
                <button
                  type="button"
                  onClick={() => setStockMergeMode('replace')}
                  className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition border ${
                    stockMergeMode === 'replace'
                      ? (isLight ? 'bg-black text-white border-black shadow-sm' : 'bg-white text-black border-white shadow-md')
                      : (isLight ? 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-200 hover:text-black' : 'bg-black/60 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white')
                  }`}
                >
                  🔄 Set Total ({qty || 0})
                </button>
              </div>
            </div>
          )}

          {/* 2. Combined Single Space: Brand Name and Description */}
          <div>
            <label htmlFor="stock-brand-desc" className={`block text-xs font-bold uppercase tracking-wider ${
              isLight ? 'text-zinc-700' : 'text-white/70'
            }`}>
              Brand Name and Description (Optional)
            </label>
            <input
              ref={brandDescInputRef}
              id="stock-brand-desc"
              type="text"
              value={brandAndDescription}
              onChange={(e) => setBrandAndDescription(e.target.value)}
              onKeyDown={(e) => handleKeyDownNext(e, priceInputRef)}
              className={`mt-1 block w-full h-11 rounded-xl border px-4 text-base md:text-sm outline-none transition font-medium shadow-xs ${
                isLight
                  ? 'border-zinc-300 bg-zinc-50 text-black placeholder:text-zinc-400 focus:border-black focus:bg-white'
                  : 'border-zinc-800 bg-black text-white placeholder:text-white/34 focus:border-zinc-500'
              }`}
              placeholder="e.g. Dabur - Raw organic forest honey, 100% natural, glass jar packaging"
            />
          </div>

          {/* 3. Row: Price, No. of Products, Category */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Price */}
            <div>
              <label htmlFor="stock-price" className={`block text-xs font-bold uppercase tracking-wider ${
                isLight ? 'text-zinc-700' : 'text-white/70'
              }`}>
                Price (₹) *
              </label>
              <input
                ref={priceInputRef}
                id="stock-price"
                type="number"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onKeyDown={(e) => handleKeyDownNext(e, qtyInputRef)}
                required
                className={`mt-1 block w-full h-11 rounded-xl border px-4 text-base md:text-sm outline-none transition font-bold shadow-xs ${
                  isLight
                    ? 'border-zinc-300 bg-zinc-50 text-black placeholder:text-zinc-400 focus:border-black focus:bg-white'
                    : 'border-zinc-800 bg-black text-white placeholder:text-white/34 focus:border-zinc-500'
                }`}
                placeholder="e.g. 250"
              />
            </div>

            {/* No. of Products */}
            <div>
              <label htmlFor="stock-qty" className={`block text-xs font-bold uppercase tracking-wider ${
                isLight ? 'text-zinc-700' : 'text-white/70'
              }`}>
                No. of Products *
              </label>
              <input
                ref={qtyInputRef}
                id="stock-qty"
                type="number"
                step="any"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                onKeyDown={(e) => handleKeyDownNext(e, unitValueInputRef)}
                required
                className={`mt-1 block w-full h-11 rounded-xl border px-4 text-base md:text-sm outline-none transition font-bold shadow-xs ${
                  isLight
                    ? 'border-zinc-300 bg-zinc-50 text-black placeholder:text-zinc-400 focus:border-black focus:bg-white'
                    : 'border-zinc-800 bg-black text-white placeholder:text-white/34 focus:border-zinc-500'
                }`}
                placeholder="e.g. 10 or 50"
              />
            </div>

            {/* Category (Optional) */}
            <div>
              <label htmlFor="stock-category" className={`block text-xs font-bold uppercase tracking-wider ${
                isLight ? 'text-zinc-700' : 'text-white/70'
              }`}>
                Category (Optional)
              </label>
              {!isAddingNewCat ? (
                <select
                  ref={categorySelectRef}
                  id="stock-category"
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === 'new-category') {
                      setIsAddingNewCat(true);
                      setTimeout(() => newCategoryInputRef.current?.focus(), 50);
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  onKeyDown={handleCategoryEnter}
                  className={`mt-1 h-11 w-full rounded-xl border px-3.5 text-[12.5px] font-semibold outline-none transition shadow-xs ${
                    isLight
                      ? 'border-zinc-300 bg-zinc-50 text-black focus:border-black focus:bg-white'
                      : 'border-zinc-800 bg-black text-white focus:border-zinc-500'
                  }`}
                >
                  <option value="">General (Default)</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="new-category">+ Add New Category</option>
                </select>
              ) : (
                <div className="mt-1 flex items-center gap-2">
                  <input
                    ref={newCategoryInputRef}
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={handleCategoryEnter}
                    autoFocus
                    className={`h-11 flex-1 rounded-xl border px-3.5 text-[12.5px] outline-none font-semibold shadow-xs ${
                      isLight
                        ? 'border-zinc-300 bg-zinc-50 text-black placeholder:text-zinc-400 focus:border-black focus:bg-white'
                        : 'border-zinc-700 bg-black text-white placeholder:text-white/34'
                    }`}
                    placeholder="Type category & press Enter..."
                  />
                  <button
                    type="button"
                    onClick={applyNewCategory}
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition shadow-xs ${
                      isLight
                        ? 'border-zinc-300 bg-zinc-200 text-black hover:bg-zinc-300'
                        : 'border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700'
                    }`}
                    title="Apply category and proceed to new supplier"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 4. Row: Unit Value & Unit Options */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="stock-unit-value" className={`block text-xs font-bold uppercase tracking-wider ${
                isLight ? 'text-zinc-700' : 'text-white/70'
              }`}>
                Quantity per Unit (Optional)
              </label>
              <input
                ref={unitValueInputRef}
                id="stock-unit-value"
                type="text"
                value={unitValue}
                onChange={(e) => setUnitValue(e.target.value)}
                onKeyDown={(e) => handleKeyDownNext(e, unitSelectRef)}
                className={`mt-1 block w-full h-11 rounded-xl border px-4 text-base md:text-sm outline-none transition font-semibold shadow-xs ${
                  isLight
                    ? 'border-zinc-300 bg-zinc-50 text-black placeholder:text-zinc-400 focus:border-black focus:bg-white'
                    : 'border-zinc-800 bg-black text-white placeholder:text-white/34 focus:border-zinc-500'
                }`}
                placeholder="e.g. 400, 250, 6.5"
              />
            </div>

            <div>
              <label htmlFor="stock-unit" className={`block text-xs font-bold uppercase tracking-wider ${
                isLight ? 'text-zinc-700' : 'text-white/70'
              }`}>
                Unit *
              </label>
              <select
                ref={unitSelectRef}
                id="stock-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (isAddingNewCat) {
                      newCategoryInputRef.current?.focus();
                    } else {
                      categorySelectRef.current?.focus();
                    }
                  }
                }}
                className={`mt-1 block w-full h-11 rounded-xl border px-3.5 text-[12.5px] font-bold outline-none transition shadow-xs ${
                  isLight
                    ? 'border-zinc-300 bg-zinc-50 text-black focus:border-black focus:bg-white'
                    : 'border-zinc-800 bg-zinc-900 text-white focus:border-zinc-500'
                }`}
              >
                <option value="pcs">pcs (units)</option>
                <option value="g">g (grams)</option>
                <option value="kg">kg (kilograms)</option>
                <option value="mL">mL (millilitres)</option>
                <option value="L">L (litres)</option>
                <option value="m">m (metres)</option>
                <option value="pack">pack (bundles)</option>
                <option value="box">box (cartons)</option>
              </select>
            </div>
          </div>

          {/* Live Measurement Badge */}
          {(qty || unitValue) && (
            <div className={`rounded-xl border p-3 px-4 flex items-center justify-between text-xs shadow-xs ${
              isLight
                ? 'border-zinc-200 bg-zinc-100 text-zinc-700'
                : 'border-zinc-800 bg-zinc-900/40 text-zinc-300'
            }`}>
              <span className={`font-medium ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Measurement Summary:</span>
              <span className={`font-bold ${isLight ? 'text-black' : 'text-white'}`}>
                {qty ? `${qty} products` : '0 products'}{' '}
                {unitValue ? `(${unitValue}${unit} each)` : `(${unit})`}
              </span>
            </div>
          )}

          {/* 5. Supplier Link (Optional) */}
          <div className={`rounded-2xl border p-4 shadow-xs ${
            isLight
              ? 'border-zinc-200 bg-zinc-50/80'
              : 'border-zinc-800 bg-zinc-950/60'
          }`}>
            <div className={`mb-2.5 text-xs font-bold uppercase tracking-wider ${
              isLight ? 'text-zinc-700' : 'text-white/80'
            }`}>
              Supplier Link (Optional)
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setSupplierMode('existing')}
                className={`h-10 rounded-xl border px-4 text-xs font-bold transition shadow-xs ${
                  supplierMode === 'existing'
                    ? (isLight ? 'border-black bg-black text-white' : 'border-zinc-600 bg-white text-black')
                    : (isLight ? 'border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-100 hover:text-black' : 'border-zinc-800 bg-black/50 text-zinc-400 hover:bg-zinc-900 hover:text-white')
                }`}
              >
                Existing Supplier
              </button>
              <button
                type="button"
                onClick={() => setSupplierMode('new')}
                className={`h-10 rounded-xl border px-4 text-xs font-bold transition shadow-xs ${
                  supplierMode === 'new'
                    ? (isLight ? 'border-black bg-black text-white' : 'border-zinc-600 bg-white text-black')
                    : (isLight ? 'border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-100 hover:text-black' : 'border-zinc-800 bg-black/50 text-zinc-400 hover:bg-zinc-900 hover:text-white')
                }`}
              >
                New Supplier
              </button>
            </div>

            {supplierMode === 'existing' ? (
              <select
                value={supplierId}
                onChange={(event) => setSupplierId(event.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setSupplierMode('new');
                    setTimeout(() => newSupplierNameRef.current?.focus(), 50);
                  }
                }}
                className={`mt-3 h-11 w-full rounded-xl border px-4 text-[12.5px] font-semibold outline-none transition shadow-xs ${
                  isLight
                    ? 'border-zinc-300 bg-white text-black focus:border-black'
                    : 'border-zinc-800 bg-black text-white focus:border-zinc-500'
                }`}
              >
                <option value="">Select supplier (Optional)</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name} {supplier.phone ? `- ${supplier.phone}` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
                <input
                  ref={newSupplierNameRef}
                  value={newSupplierName}
                  onChange={(event) => setNewSupplierName(event.target.value)}
                  onKeyDown={(e) => handleKeyDownNext(e, newSupplierPhoneRef)}
                  className={`h-11 rounded-xl border px-3.5 text-[12.5px] outline-none transition font-semibold shadow-xs ${
                    isLight
                      ? 'border-zinc-300 bg-white text-black placeholder:text-zinc-400 focus:border-black'
                      : 'border-zinc-800 bg-black text-white placeholder:text-white/34 focus:border-zinc-500'
                  }`}
                  placeholder="New Supplier Name (Optional)"
                />
                <input
                  ref={newSupplierPhoneRef}
                  value={newSupplierPhone}
                  onChange={(event) => setNewSupplierPhone(event.target.value)}
                  onKeyDown={(e) => handleKeyDownNext(e, newSupplierLeadTimeRef)}
                  className={`h-11 rounded-xl border px-3.5 text-[12.5px] outline-none transition font-semibold shadow-xs ${
                    isLight
                      ? 'border-zinc-300 bg-white text-black placeholder:text-zinc-400 focus:border-black'
                      : 'border-zinc-800 bg-black text-white placeholder:text-white/34 focus:border-zinc-500'
                  }`}
                  placeholder="Phone"
                />
                <input
                  ref={newSupplierLeadTimeRef}
                  type="number"
                  value={newSupplierLeadTime}
                  onChange={(event) => setNewSupplierLeadTime(event.target.value)}
                  onKeyDown={(e) => handleKeyDownNext(e, submitBtnRef)}
                  className={`h-11 rounded-xl border px-3.5 text-[12.5px] outline-none transition font-semibold shadow-xs ${
                    isLight
                      ? 'border-zinc-300 bg-white text-black placeholder:text-zinc-400 focus:border-black'
                      : 'border-zinc-800 bg-black text-white placeholder:text-white/34 focus:border-zinc-500'
                  }`}
                  placeholder="Lead days"
                />
              </div>
            )}
          </div>

          {error && (
            <p className={`text-xs font-bold p-3 rounded-xl border ${
              isLight
                ? 'text-red-700 bg-red-50 border-red-200'
                : 'text-red-400 bg-red-500/10 border-red-500/20'
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
              ref={submitBtnRef}
              type="submit"
              disabled={isSubmitting}
              className={`h-11 rounded-xl px-7 text-xs font-extrabold shadow-md transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 border-0 ${
                isLight
                  ? 'bg-black text-white hover:bg-zinc-800'
                  : 'bg-white text-black hover:bg-zinc-200'
              }`}
            >
              {isSubmitting ? 'Saving Stock...' : 'Add Stock'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
