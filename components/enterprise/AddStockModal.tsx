"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, UploadCloud, Check } from 'lucide-react';

interface AddStockModalProps {
  onClose: () => void;
  onStockAdded: () => void;
  suppliers: any[];
}

export function AddStockModal({ onClose, onStockAdded, suppliers }: AddStockModalProps) {
  // Input Refs for sequential Enter Key Navigation
  const nameInputRef = useRef<HTMLInputElement>(null);
  const brandInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const categorySelectRef = useRef<HTMLSelectElement>(null);
  const newCategoryInputRef = useRef<HTMLInputElement>(null);
  const newSupplierNameRef = useRef<HTMLInputElement>(null);
  const newSupplierPhoneRef = useRef<HTMLInputElement>(null);
  const newSupplierLeadTimeRef = useRef<HTMLInputElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('pcs');
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
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/saas/items');
        if (response.ok) {
          const result = await response.json();
          const itemsList = Array.isArray(result?.items) ? result.items : (Array.isArray(result?.data) ? result.data : []);
          const uniqueCategories = Array.from(new Set(itemsList.map((item: any) => item?.category).filter(Boolean)));
          setCategories(uniqueCategories as string[]);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
    // Auto-focus first input field on load
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 100);
  }, []);

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
      setError('Product Name, Price and Quantity/Measurement are required.');
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
      let imageUrl = '';
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

      const response = await fetch('/api/saas/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          brand,
          description: description || '',
          category: finalCategory,
          price: Number(price),
          qty: Number(qty),
          unit: unit || 'pcs',
          supplierId: selectedSupplier?.id || '',
          supplierName: selectedSupplier?.name || '',
          supplierPhone: selectedSupplier?.phone || '',
          supplierLeadTimeDays: Number(selectedSupplier?.leadTimeDays || 0),
          imageUrl,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to add stock.');
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-none border border-zinc-800 bg-[#000000] p-6 shadow-2xl text-white"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <h2 className="text-lg font-bold uppercase tracking-wider text-white" style={{ color: '#ffffff' }}>
            Add New Stock
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-none p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white border border-transparent hover:border-zinc-700"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Top Row: Image Upload (Left) + Product Name * (Right) */}
          <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Product Image (Optional)
              </label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-none border border-dashed border-zinc-700 flex items-center justify-center bg-zinc-950 shrink-0 overflow-hidden">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-none"/>
                  ) : (
                    <UploadCloud className="h-5 w-5 text-zinc-500" />
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
                  <label htmlFor="stock-image-upload" className="cursor-pointer inline-flex items-center gap-1.5 rounded-none border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800 hover:text-white">
                    {image ? 'Change Image' : 'Upload Image'}
                  </label>
                  <p className="text-[10.5px] text-zinc-500 mt-1">PNG, JPG up to 5MB.</p>
                </div>
              </div>
            </div>

            {/* 1. Product Name beside Image */}
            <div>
              <label htmlFor="stock-name" className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Product Name *
              </label>
              <input
                ref={nameInputRef}
                id="stock-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => handleKeyDownNext(e, brandInputRef)}
                required
                className="mt-1.5 block w-full h-10 rounded-none border border-zinc-800 bg-zinc-950 px-3.5 text-sm text-white outline-none placeholder:text-zinc-600 transition focus:border-zinc-500 font-medium"
                placeholder="e.g. Organic Honey or Cow Milk"
              />
            </div>
          </div>

          {/* 2. Second Row: Brand Name (Optional) */}
          <div>
            <label htmlFor="stock-brand" className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Brand Name (Optional)
            </label>
            <input
              ref={brandInputRef}
              id="stock-brand"
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              onKeyDown={(e) => handleKeyDownNext(e, descriptionInputRef)}
              className="mt-1.5 block w-full h-10 rounded-none border border-zinc-800 bg-zinc-950 px-3.5 text-sm text-white outline-none placeholder:text-zinc-600 transition focus:border-zinc-500 font-medium"
              placeholder="e.g. Dabur, Amul, Nestlé, Nike, Tata (Optional)"
            />
          </div>

          {/* 3. Description (Optional) */}
          <div>
            <label htmlFor="stock-description" className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Description (Optional)
            </label>
            <textarea
              ref={descriptionInputRef}
              id="stock-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => handleKeyDownNext(e, priceInputRef)}
              rows={2}
              className="mt-1.5 block w-full rounded-none border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 transition focus:border-zinc-500 font-medium"
              placeholder="e.g. Raw organic forest honey, 100% natural, glass jar packaging"
            />
          </div>

          {/* 4. Price, Quantity + Unit, Category */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Price */}
            <div>
              <label htmlFor="stock-price" className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
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
                className="mt-1.5 block w-full h-10 rounded-none border border-zinc-800 bg-zinc-950 px-3.5 text-sm text-white outline-none placeholder:text-zinc-600 transition focus:border-zinc-500 font-semibold"
                placeholder="e.g. 250"
              />
            </div>

            {/* 5. Quantity & Unit */}
            <div>
              <label htmlFor="stock-qty" className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Quantity & Unit *
              </label>
              <div className="mt-1.5 flex items-center gap-1.5">
                <input
                  ref={qtyInputRef}
                  id="stock-qty"
                  type="number"
                  step="any"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
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
                  required
                  className="block w-full flex-1 h-10 rounded-none border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none placeholder:text-zinc-600 transition focus:border-zinc-500 font-semibold"
                  placeholder="e.g. 50"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="h-10 rounded-none border border-zinc-800 bg-zinc-900 px-2 text-xs font-semibold text-white outline-none transition focus:border-zinc-500"
                  title="Unit of Measurement"
                >
                  <option value="pcs">pcs (units)</option>
                  <option value="kg">kg (kilograms)</option>
                  <option value="g">g (grams)</option>
                  <option value="L">L (litres)</option>
                  <option value="mL">mL (millilitres)</option>
                  <option value="pack">pack (bundles)</option>
                  <option value="box">box (cartons)</option>
                  <option value="m">m (metres)</option>
                </select>
              </div>
            </div>

            {/* 6. Category (Optional) */}
            <div>
              <label htmlFor="stock-category" className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
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
                  className="mt-1.5 h-10 w-full rounded-none border border-zinc-800 bg-zinc-950 px-3 text-xs font-medium text-white outline-none transition focus:border-zinc-500"
                >
                  <option value="">General (Default)</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="new-category">+ Add New Category</option>
                </select>
              ) : (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <input
                    ref={newCategoryInputRef}
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={handleCategoryEnter}
                    autoFocus
                    className="h-10 flex-1 rounded-none border border-zinc-700 bg-zinc-950 px-3 text-xs text-white outline-none placeholder:text-zinc-600 font-medium"
                    placeholder="Type category & press Enter..."
                  />
                  <button
                    type="button"
                    onClick={applyNewCategory}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none border border-emerald-600 bg-emerald-950/50 text-emerald-400 hover:bg-emerald-900/60"
                    title="Apply category"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 7. Supplier Link (Optional) */}
          <div className="rounded-none border border-zinc-800 bg-zinc-950/40 p-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Supplier Link (Optional)
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setSupplierMode('existing')}
                className={`h-9 rounded-none border px-4 text-xs font-semibold transition ${
                  supplierMode === 'existing'
                    ? 'border-zinc-500 bg-zinc-200 text-black'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                Existing Supplier
              </button>
              <button
                type="button"
                onClick={() => setSupplierMode('new')}
                className={`h-9 rounded-none border px-4 text-xs font-semibold transition ${
                  supplierMode === 'new'
                    ? 'border-zinc-500 bg-zinc-200 text-black'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
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
                className="mt-3 h-10 w-full rounded-none border border-zinc-800 bg-zinc-950 px-3.5 text-xs font-medium text-white outline-none transition focus:border-zinc-500"
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
                  className="h-10 rounded-none border border-zinc-800 bg-zinc-950 px-3 text-xs text-white outline-none placeholder:text-zinc-600 transition focus:border-zinc-500 font-medium"
                  placeholder="New Supplier Name"
                />
                <input
                  ref={newSupplierPhoneRef}
                  value={newSupplierPhone}
                  onChange={(event) => setNewSupplierPhone(event.target.value)}
                  onKeyDown={(e) => handleKeyDownNext(e, newSupplierLeadTimeRef)}
                  className="h-10 rounded-none border border-zinc-800 bg-zinc-950 px-3 text-xs text-white outline-none placeholder:text-zinc-600 transition focus:border-zinc-500 font-medium"
                  placeholder="Phone"
                />
                <input
                  ref={newSupplierLeadTimeRef}
                  type="number"
                  value={newSupplierLeadTime}
                  onChange={(event) => setNewSupplierLeadTime(event.target.value)}
                  onKeyDown={(e) => handleKeyDownNext(e, submitBtnRef)}
                  className="h-10 rounded-none border border-zinc-800 bg-zinc-950 px-3 text-xs text-white outline-none placeholder:text-zinc-600 transition focus:border-zinc-500 font-medium"
                  placeholder="Lead days"
                />
              </div>
            )}
          </div>

          {error && <p className="text-xs font-semibold text-red-400 bg-red-950/40 border border-red-800/60 p-3 rounded-none">{error}</p>}

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-none bg-zinc-900 px-5 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800 hover:text-white border border-zinc-800"
            >
              Cancel
            </button>
            <button
              ref={submitBtnRef}
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded-none bg-white px-6 text-xs font-bold text-black transition hover:bg-zinc-200 active:bg-zinc-300 disabled:opacity-50 border-0"
            >
              {isSubmitting ? 'Adding Stock...' : 'Add Stock'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
