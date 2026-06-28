"use client";

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { X, ImageIcon, Pilcrow, Plus } from 'lucide-react';

type Product = { id: string; name: string; description?: string; image?: string; price: number; qty: number; category?: string };

interface AddProductModalProps {
  existingCategories: string[];
  onClose: () => void;
  onProductAdded: () => void;
}

export function AddProductModal({ existingCategories, onClose, onProductAdded }: AddProductModalProps) {
  const [productForm, setProductForm] = useState({ name: '', price: '', qty: '', image: '', description: '', category: '' });
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const categories = useMemo(() => {
    return [...new Set(['', ...existingCategories])];
  }, [existingCategories]);

  async function addProduct(event: React.FormEvent) {
    event.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.qty) {
      toast.error('Name, price and quantity are required');
      return;
    }
    setIsUpdating(true);

    let imageUrl = '';
    if (productImageFile) {
      const formData = new FormData();
      formData.append('file', productImageFile);
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadResponse.json();
      if (!uploadData.success) {
        toast.error(uploadData.error || 'Image upload failed');
        setIsUpdating(false);
        return;
      }
      imageUrl = uploadData.url;
    }
    
    const category = productForm.category === 'new' ? newCategory : productForm.category;

    const response = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...productForm, image: imageUrl, category, price: Number(productForm.price), qty: Number(productForm.qty) }),
    });

    const data = await response.json();
    setIsUpdating(false);

    if (data.success) {
      toast.success('Product added');
      onProductAdded();
      onClose();
    } else {
      toast.error(data.error || 'Failed to add product');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative premium-card neon-panel p-6 rounded-2xl max-w-lg w-full">
        <button onClick={onClose} className="absolute top-4 right-4 premium-button-ghost p-2">
          <X className="h-4 w-4" />
        </button>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-gemini-blue-300" />
          Add New Product
        </h2>

        <form onSubmit={addProduct} className="grid md:grid-cols-2 gap-3">
          <input className="premium-input md:col-span-2" placeholder="Product name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
          <input className="premium-input" type="number" min="0" placeholder="Price" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} />
          <input className="premium-input" type="number" min="0" placeholder="Stock qty" value={productForm.qty} onChange={(e) => setProductForm({ ...productForm, qty: e.target.value })} />
          <div className="premium-input md:col-span-2">
            <label htmlFor="product-image-upload" className="flex items-center justify-between">
              <span>{productImageFile ? productImageFile.name : 'Upload Image (Optional)'}</span>
              <span className="premium-button-ghost text-xs">Select File</span>
            </label>
            <input id="product-image-upload" className="hidden" type="file" accept="image/*" onChange={(e) => setProductImageFile(e.target.files ? e.target.files[0] : null)} />
          </div>
          <select className="premium-input" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat || 'Select Category'}</option>
            ))}
            <option value="new">-- Add New Category --</option>
          </select>
          {productForm.category === 'new' && (
            <input className="premium-input" placeholder="New Category Name" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
          )}
          <textarea className="premium-input md:col-span-2 min-h-20" placeholder="Description" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
          <button className="premium-button-primary float-on-hover md:col-span-2" type="submit" disabled={isUpdating}><Plus className="h-4 w-4 mr-2" />{isUpdating ? "Adding..." : "Add Product"}</button>
        </form>
      </div>
    </div>
  );
}
