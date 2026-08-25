"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, UploadCloud, Check } from 'lucide-react';
import { toast } from 'sonner';

export type EditProductItem = {
  id: string;
  name: string;
  brand?: string;
  description?: string;
  price: number;
  qty: number;
  unit?: string;
  category?: string;
  image?: string;
  imageUrl?: string;
  supplierId?: string;
  supplierName?: string;
};

interface EditProductModalProps {
  product: EditProductItem;
  mode?: 'full' | 'image' | 'description';
  suppliers?: any[];
  onClose: () => void;
  onUpdate: () => void;
  theme?: 'dark' | 'light';
  isLight?: boolean;
}

export function EditProductModal({
  product,
  mode = 'full',
  suppliers = [],
  onClose,
  onUpdate,
  theme,
  isLight: isLightProp,
}: EditProductModalProps) {
  const isLight = isLightProp ?? (
    theme === 'light' ||
    (typeof document !== 'undefined' && document.documentElement.classList.contains('light'))
  );

  const nameInputRef = useRef<HTMLInputElement>(null);
  const brandInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const categorySelectRef = useRef<HTMLSelectElement>(null);
  const newCategoryInputRef = useRef<HTMLInputElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  const [name, setName] = useState(product.name || '');
  const [brand, setBrand] = useState(product.brand || '');
  const [description, setDescription] = useState(product.description || '');
  const [price, setPrice] = useState(String(product.price ?? ''));
  const [qty, setQty] = useState(String(product.qty ?? ''));
  const [unit, setUnit] = useState(product.unit || 'pcs');
  const [category, setCategory] = useState(product.category || '');
  const [newCategory, setNewCategory] = useState('');
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [supplierId, setSupplierId] = useState(product.supplierId || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product.imageUrl || product.image || null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

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
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
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
  };

  const handleCategoryEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyNewCategory();
    }
  };

  const handleKeyDownNext = (e: React.KeyboardEvent, nextRef: React.RefObject<any>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextRef.current?.focus();
    }
  };

  const handleUpdate = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();

    if (mode === 'full' && (!name.trim() || !price || !qty)) {
      setError('Product Name, Price and Quantity are required.');
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      let finalImageUrl = product.imageUrl || product.image || '';

      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadResult = await uploadResponse.json();
        if (uploadResult.url) {
          finalImageUrl = uploadResult.url;
        } else if (uploadResult.error) {
          throw new Error(uploadResult.error || 'Failed to upload image');
        }
      }

      let finalCategory = category;
      if (isAddingNewCat && newCategory.trim()) {
        finalCategory = newCategory.trim();
      }

      const selectedSupplier = suppliers.find((s) => String(s.id) === supplierId);

      const updatePayload: any = {
        id: product.id,
        name: mode === 'description' ? product.name : name,
        brand: mode === 'full' ? brand : product.brand,
        description: mode === 'image' ? product.description : description,
        price: mode === 'full' ? Number(price) : product.price,
        qty: mode === 'full' ? Number(qty) : product.qty,
        unit: mode === 'full' ? (unit || 'pcs') : (product.unit || 'pcs'),
        category: mode === 'full' ? (finalCategory || 'General') : product.category,
        imageUrl: finalImageUrl,
        image: finalImageUrl,
        supplierId: selectedSupplier?.id ? String(selectedSupplier.id) : (product.supplierId || undefined),
        supplierName: selectedSupplier?.name || (product.supplierName || undefined),
      };

      // Primary endpoint for SaaS CRUD
      let response = await fetch('/api/saas/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      let result = await response.json().catch(() => ({}));

      // Fallback endpoint if saas endpoint isn't handling it
      if (!response.ok || !result.success) {
        response = await fetch(`/api/items?id=${product.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        });
        result = await response.json().catch(() => ({}));
      }

      if (response.ok && (result.success || result.item)) {
        toast.success(`Updated "${name || product.name}" successfully`);
        onUpdate();
        onClose();
      } else {
        throw new Error(result.error || 'Failed to update product details.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating the product.');
      toast.error(err.message || 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-sm overflow-y-auto ${
        isLight ? 'bg-black/40' : 'bg-black/75'
      }`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        className={`relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-none border p-6 shadow-2xl transition-colors ${
          isLight ? 'border-zinc-200 bg-white text-black' : 'border-zinc-800 bg-[#000000] text-white'
        }`}
      >
        <div className={`flex items-center justify-between border-b pb-4 ${
          isLight ? 'border-zinc-200' : 'border-zinc-800'
        }`}>
          <h2 className={`text-lg font-bold uppercase tracking-wider ${
            isLight ? '!text-black' : '!text-white'
          }`} style={{ color: isLight ? '#000000' : '#ffffff' }}>
            Edit Product
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-none p-1.5 transition border ${
              isLight
                ? 'border-transparent text-zinc-500 hover:bg-zinc-100 hover:text-black hover:border-zinc-300'
                : 'border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white hover:border-zinc-700'
            }`}
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleUpdate} className="mt-5 space-y-5">
          {mode === 'image' ? (
            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
                isLight ? 'text-zinc-600' : 'text-zinc-400'
              }`}>
                Product Image
              </label>
              <div className="flex items-center gap-3">
                <div className={`w-20 h-20 rounded-none border border-dashed flex items-center justify-center shrink-0 overflow-hidden ${
                  isLight ? 'border-zinc-300 bg-zinc-50' : 'border-zinc-700 bg-zinc-950'
                }`}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-none"/>
                  ) : (
                    <UploadCloud className={`h-6 w-6 ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`} />
                  )}
                </div>
                <div>
                  <input
                    id="edit-product-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="edit-product-image-upload"
                    className={`cursor-pointer inline-flex items-center gap-1.5 rounded-none border px-3.5 py-2 text-xs font-semibold transition ${
                      isLight
                        ? 'border-zinc-300 bg-zinc-100 text-black hover:bg-zinc-200'
                        : 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    {imageFile ? 'Change Selected File' : 'Upload New Image'}
                  </label>
                </div>
              </div>
            </div>
          ) : mode === 'description' ? (
            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
                isLight ? 'text-zinc-600' : 'text-zinc-400'
              }`}>
                Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full rounded-none border p-3 text-sm outline-none transition font-medium ${
                  isLight
                    ? 'border-zinc-300 bg-zinc-50 text-black focus:border-black focus:bg-white'
                    : 'border-zinc-800 bg-zinc-950 text-white focus:border-zinc-500'
                }`}
                placeholder="Enter product description..."
              />
            </div>
          ) : (
            <>
              {/* Top Row: Image Upload (Left) + Product Name * (Right) */}
              <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
                    isLight ? 'text-zinc-600' : 'text-zinc-400'
                  }`}>
                    Product Image
                  </label>
                  <div className="flex items-center gap-3">
                    <div className={`w-16 h-16 rounded-none border border-dashed flex items-center justify-center shrink-0 overflow-hidden ${
                      isLight ? 'border-zinc-300 bg-zinc-50' : 'border-zinc-700 bg-zinc-950'
                    }`}>
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-none"/>
                      ) : (
                        <UploadCloud className={`h-5 w-5 ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`} />
                      )}
                    </div>
                    <div>
                      <input
                        id="edit-stock-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="edit-stock-image-upload"
                        className={`cursor-pointer inline-flex items-center gap-1.5 rounded-none border px-3 py-1.5 text-xs font-semibold transition ${
                          isLight
                            ? 'border-zinc-300 bg-zinc-100 text-black hover:bg-zinc-200'
                            : 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white'
                        }`}
                      >
                        {imageFile ? 'Change Image' : 'Upload Image'}
                      </label>
                      <p className="text-[10.5px] text-zinc-500 mt-1">PNG, JPG up to 5MB.</p>
                    </div>
                  </div>
                </div>

                {/* 1. Product Name beside Image */}
                <div>
                  <label htmlFor="edit-product-name" className={`block text-[11px] font-bold uppercase tracking-wider ${
                    isLight ? 'text-zinc-600' : 'text-zinc-400'
                  }`}>
                    Product Name *
                  </label>
                  <input
                    ref={nameInputRef}
                    id="edit-product-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => handleKeyDownNext(e, brandInputRef)}
                    required
                    className={`mt-1.5 block w-full h-10 rounded-none border px-3.5 text-sm outline-none transition font-medium ${
                      isLight
                        ? 'border-zinc-300 bg-zinc-50 text-black placeholder:text-zinc-400 focus:border-black focus:bg-white'
                        : 'border-zinc-800 bg-zinc-950 text-white placeholder:text-zinc-600 focus:border-zinc-500'
                    }`}
                    placeholder="e.g. Organic Honey or Cow Milk"
                  />
                </div>
              </div>

              {/* 2. Brand Name (Optional) */}
              <div>
                <label htmlFor="edit-product-brand" className={`block text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'text-zinc-600' : 'text-zinc-400'
                }`}>
                  Brand Name (Optional)
                </label>
                <input
                  ref={brandInputRef}
                  id="edit-product-brand"
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  onKeyDown={(e) => handleKeyDownNext(e, descriptionInputRef)}
                  className={`mt-1.5 block w-full h-10 rounded-none border px-3.5 text-sm outline-none transition font-medium ${
                    isLight
                      ? 'border-zinc-300 bg-zinc-50 text-black placeholder:text-zinc-400 focus:border-black focus:bg-white'
                      : 'border-zinc-800 bg-zinc-950 text-white placeholder:text-zinc-600 focus:border-zinc-500'
                  }`}
                  placeholder="e.g. Dabur, Amul, Nestlé, Nike, Tata (Optional)"
                />
              </div>

              {/* 3. Description (Optional) */}
              <div>
                <label htmlFor="edit-product-description" className={`block text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'text-zinc-600' : 'text-zinc-400'
                }`}>
                  Description (Optional)
                </label>
                <textarea
                  ref={descriptionInputRef}
                  id="edit-product-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={(e) => handleKeyDownNext(e, priceInputRef)}
                  rows={2}
                  className={`mt-1.5 block w-full rounded-none border px-3.5 py-2.5 text-sm outline-none transition font-medium ${
                    isLight
                      ? 'border-zinc-300 bg-zinc-50 text-black placeholder:text-zinc-400 focus:border-black focus:bg-white'
                      : 'border-zinc-800 bg-zinc-950 text-white placeholder:text-zinc-600 focus:border-zinc-500'
                  }`}
                  placeholder="Product description..."
                />
              </div>

              {/* 4. Price, Quantity + Unit, Category */}
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Price */}
                <div>
                  <label htmlFor="edit-product-price" className={`block text-[11px] font-bold uppercase tracking-wider ${
                    isLight ? 'text-zinc-600' : 'text-zinc-400'
                  }`}>
                    Price (₹) *
                  </label>
                  <input
                    ref={priceInputRef}
                    id="edit-product-price"
                    type="number"
                    step="any"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    onKeyDown={(e) => handleKeyDownNext(e, qtyInputRef)}
                    required
                    className={`mt-1.5 block w-full h-10 rounded-none border px-3.5 text-sm outline-none transition font-semibold ${
                      isLight
                        ? 'border-zinc-300 bg-zinc-50 text-black placeholder:text-zinc-400 focus:border-black focus:bg-white'
                        : 'border-zinc-800 bg-zinc-950 text-white placeholder:text-zinc-600 focus:border-zinc-500'
                    }`}
                    placeholder="e.g. 250"
                  />
                </div>

                {/* Quantity & Unit */}
                <div>
                  <label htmlFor="edit-product-qty" className={`block text-[11px] font-bold uppercase tracking-wider ${
                    isLight ? 'text-zinc-600' : 'text-zinc-400'
                  }`}>
                    Quantity & Unit *
                  </label>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <input
                      ref={qtyInputRef}
                      id="edit-product-qty"
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
                      className={`block w-full flex-1 h-10 rounded-none border px-3 text-sm outline-none transition font-semibold ${
                        isLight
                          ? 'border-zinc-300 bg-zinc-50 text-black placeholder:text-zinc-400 focus:border-black focus:bg-white'
                          : 'border-zinc-800 bg-zinc-950 text-white placeholder:text-zinc-600 focus:border-zinc-500'
                      }`}
                      placeholder="e.g. 50"
                    />
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className={`h-10 rounded-none border px-2 text-xs font-semibold outline-none transition ${
                        isLight
                          ? 'border-zinc-300 bg-zinc-100 text-black focus:border-black'
                          : 'border-zinc-800 bg-zinc-900 text-white focus:border-zinc-500'
                      }`}
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

                {/* Category */}
                <div>
                  <label htmlFor="edit-product-category" className={`block text-[11px] font-bold uppercase tracking-wider ${
                    isLight ? 'text-zinc-600' : 'text-zinc-400'
                  }`}>
                    Category (Optional)
                  </label>
                  {!isAddingNewCat ? (
                    <select
                      ref={categorySelectRef}
                      id="edit-product-category"
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
                      className={`mt-1.5 h-10 w-full rounded-none border px-3 text-xs font-medium outline-none transition ${
                        isLight
                          ? 'border-zinc-300 bg-zinc-50 text-black focus:border-black'
                          : 'border-zinc-800 bg-zinc-950 text-white focus:border-zinc-500'
                      }`}
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
                        className={`h-10 flex-1 rounded-none border px-3 text-xs outline-none font-medium ${
                          isLight
                            ? 'border-zinc-400 bg-white text-black placeholder:text-zinc-400'
                            : 'border-zinc-700 bg-zinc-950 text-white placeholder:text-zinc-600'
                        }`}
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

              {/* Supplier Link */}
              {suppliers && suppliers.length > 0 && (
                <div className={`rounded-none border p-4 ${
                  isLight ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-800 bg-zinc-950/40'
                }`}>
                  <label htmlFor="edit-product-supplier" className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${
                    isLight ? 'text-zinc-600' : 'text-zinc-400'
                  }`}>
                    Supplier Link (Optional)
                  </label>
                  <select
                    id="edit-product-supplier"
                    value={supplierId}
                    onChange={(event) => setSupplierId(event.target.value)}
                    className={`h-10 w-full rounded-none border px-3.5 text-xs font-medium outline-none transition ${
                      isLight
                        ? 'border-zinc-300 bg-white text-black focus:border-black'
                        : 'border-zinc-800 bg-zinc-950 text-white focus:border-zinc-500'
                    }`}
                  >
                    <option value="">Select supplier (Optional)</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name} {supplier.phone ? `- ${supplier.phone}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {error && (
            <p className={`text-xs font-semibold border p-3 rounded-none ${
              isLight
                ? 'text-red-600 bg-red-50 border-red-200'
                : 'text-red-400 bg-red-950/40 border-red-800/60'
            }`}>
              {error}
            </p>
          )}

          <div className={`flex justify-end gap-3 pt-3 border-t ${
            isLight ? 'border-zinc-200' : 'border-zinc-800/80'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`h-10 rounded-none px-5 text-xs font-semibold transition border ${
                isLight
                  ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border-zinc-300'
                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white border-zinc-800'
              }`}
            >
              Cancel
            </button>
            <button
              ref={submitBtnRef}
              type="submit"
              disabled={isUpdating}
              className={`h-10 rounded-none px-6 text-xs font-bold transition border-0 disabled:opacity-50 ${
                isLight
                  ? 'bg-black text-white hover:bg-zinc-800'
                  : 'bg-white text-black hover:bg-zinc-200 active:bg-zinc-300'
              }`}
            >
              {isUpdating ? 'Saving Changes...' : 'Save Product'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
