"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Box, X, UploadCloud } from 'lucide-react';

interface AddStockModalProps {
  onClose: () => void;
  onStockAdded: () => void;
  suppliers: any[];
}

export function AddStockModal({ onClose, onStockAdded, suppliers }: AddStockModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');
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
    // Fetch existing categories
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/saas/items');
        if (response.ok) {
          const { data } = await response.json();
          const uniqueCategories = Array.from(new Set(data.map((item: any) => item.category).filter(Boolean)));
          setCategories(uniqueCategories as string[]);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name || !price || !qty) {
      setError('Name, price and quantity are required.');
      return;
    }
    if (supplierMode === 'existing' && !supplierId) {
      setError('Select an existing supplier or create a new supplier.');
      return;
    }
    if (supplierMode === 'new' && (!newSupplierName || !newSupplierPhone)) {
      setError('New supplier name and phone are required.');
      return;
    }
    const finalCategory = category === 'new-category' ? newCategory : category;
    if (!finalCategory) {
        setError('Category is required.');
        return;
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

      if (supplierMode === 'new') {
        const supplierResponse = await fetch('/api/saas/suppliers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newSupplierName,
            phone: newSupplierPhone,
            products: name,
            leadTimeDays: Number(newSupplierLeadTime || 0),
          }),
        });
        const supplierResult = await supplierResponse.json();
        if (!supplierResponse.ok || !supplierResult.success) {
          throw new Error(supplierResult.error || 'Failed to add supplier.');
        }
        selectedSupplier = supplierResult.supplier;
      }

      const response = await fetch('/api/saas/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          category: finalCategory,
          price: Number(price),
          qty: Number(qty),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[8px] border border-white/10 bg-[#0A0C0F] p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-3 text-xl font-semibold text-white">
            <Box className="h-5 w-5 text-[#7EA7FF]" />
            Add New Stock
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
              <label className="block text-sm font-medium text-white/70 mb-2">
                Product Image (Optional)
              </label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-lg border border-dashed border-white/20 flex items-center justify-center bg-black/30">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg"/>
                  ) : (
                    <UploadCloud className="h-8 w-8 text-white/40" />
                  )}
                </div>
                <div className="flex-1">
                    <input
                    id="stock-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    />
                    <label htmlFor="stock-image-upload" className="cursor-pointer rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20">
                    {image ? 'Change Image' : 'Upload Image'}
                    </label>
                    <p className="text-xs text-white/50 mt-2">PNG, JPG, GIF up to 5MB.</p>
                </div>
              </div>
            </div>
          <div>
            <label htmlFor="stock-name" className="block text-sm font-medium text-white/70">
              Product Name
            </label>
            <input
              id="stock-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full h-11 rounded-full border border-white/12 bg-black/45 px-4 text-[13px] text-white outline-none placeholder:text-white/34 transition focus:border-[#78B7FF]"
              placeholder="e.g. Organic Honey"
            />
          </div>
          <div>
            <label htmlFor="stock-description" className="block text-sm font-medium text-white/70">
              Description (Optional)
            </label>
            <textarea
              id="stock-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-2xl border border-white/12 bg-black/45 px-4 py-2 text-[13px] text-white outline-none placeholder:text-white/34 transition focus:border-[#78B7FF]"
              placeholder="e.g. 500g jar of wild forest honey"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="stock-price" className="block text-sm font-medium text-white/70">
                Price (₹)
              </label>
              <input
                id="stock-price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="mt-1 block w-full h-11 rounded-full border border-white/12 bg-black/45 px-4 text-[13px] text-white outline-none placeholder:text-white/34 transition focus:border-[#78B7FF]"
                placeholder="e.g. 250"
              />
            </div>
            <div>
              <label htmlFor="stock-qty" className="block text-sm font-medium text-white/70">
                Quantity
              </label>
              <input
                id="stock-qty"
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                required
                className="mt-1 block w-full h-11 rounded-full border border-white/12 bg-black/45 px-4 text-[13px] text-white outline-none placeholder:text-white/34 transition focus:border-[#78B7FF]"
                placeholder="e.g. 50"
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
                <label htmlFor="stock-category" className="block text-sm font-medium text-white/70">
                Category
                </label>
                <select
                id="stock-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="h-11 rounded-full border border-white/12 bg-black/45 px-4 text-[13px] text-white outline-none transition focus:border-[#78B7FF]"
                >
                <option value="" disabled>Select category</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                <option value="new-category">-- Add New Category --</option>
                </select>
                {category === 'new-category' && (
                <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="h-11 rounded-full border border-white/12 bg-black/45 px-4 text-[13px] text-white outline-none placeholder:text-white/34 transition focus:border-[#78B7FF]"
                    placeholder="New category name"
                />
                )}
            </div>
          </div>

          <div className="rounded-[8px] border border-white/10 bg-white/[0.035] p-4">
            <div className="mb-3 text-sm font-semibold text-white">Supplier Link</div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setSupplierMode('existing')}
                className={`h-10 rounded-full border px-4 text-sm font-semibold transition ${supplierMode === 'existing' ? 'border-white/30 bg-white text-black' : 'border-white/12 bg-black/35 text-white/70 hover:bg-white/10'}`}
              >
                Existing Supplier
              </button>
              <button
                type="button"
                onClick={() => setSupplierMode('new')}
                className={`h-10 rounded-full border px-4 text-sm font-semibold transition ${supplierMode === 'new' ? 'border-white/30 bg-white text-black' : 'border-white/12 bg-black/35 text-white/70 hover:bg-white/10'}`}
              >
                New Supplier
              </button>
            </div>

            {supplierMode === 'existing' ? (
              <select
                value={supplierId}
                onChange={(event) => setSupplierId(event.target.value)}
                className="mt-3 h-11 w-full rounded-full border border-white/12 bg-black/45 px-4 text-[13px] text-white outline-none transition focus:border-[#78B7FF]"
              >
                <option value="">Select supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name} {supplier.phone ? `- ${supplier.phone}` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <input
                  value={newSupplierName}
                  onChange={(event) => setNewSupplierName(event.target.value)}
                  className="h-11 rounded-full border border-white/12 bg-black/45 px-4 text-[13px] text-white outline-none placeholder:text-white/34 transition focus:border-[#78B7FF]"
                  placeholder="Supplier name"
                />
                <input
                  value={newSupplierPhone}
                  onChange={(event) => setNewSupplierPhone(event.target.value)}
                  className="h-11 rounded-full border border-white/12 bg-black/45 px-4 text-[13px] text-white outline-none placeholder:text-white/34 transition focus:border-[#78B7FF]"
                  placeholder="Phone"
                />
                <input
                  type="number"
                  value={newSupplierLeadTime}
                  onChange={(event) => setNewSupplierLeadTime(event.target.value)}
                  className="h-11 rounded-full border border-white/12 bg-black/45 px-4 text-[13px] text-white outline-none placeholder:text-white/34 transition focus:border-[#78B7FF]"
                  placeholder="Lead days"
                />
              </div>
            )}
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
              {isSubmitting ? 'Adding...' : 'Add Stock'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
