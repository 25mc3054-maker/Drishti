"use client";

import { useState } from 'react';
import { toast } from 'sonner';
import { X, ImageIcon, Pilcrow } from 'lucide-react';

type Product = { id: string; name: string; description?: string; image?: string; price: number; qty: number };

interface EditProductModalProps {
  product: Product;
  mode: 'image' | 'description';
  onClose: () => void;
  onUpdate: () => void;
  theme?: 'dark' | 'light';
  isLight?: boolean;
}

export function EditProductModal({
  product,
  mode,
  onClose,
  onUpdate,
  theme,
  isLight: isLightProp,
}: EditProductModalProps) {
  const isLight = isLightProp ?? (
    theme === 'light' ||
    (typeof document !== 'undefined' && document.documentElement.classList.contains('light'))
  );

  const [description, setDescription] = useState(product.description || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleUpdate() {
    setIsUpdating(true);
    let imageUrl = product.image;

    if (mode === 'image' && imageFile) {
      const formData = new FormData();
      formData.append('file', imageFile);
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

    const response = await fetch(`/api/items?id=${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: mode === 'description' ? description : product.description,
        image: mode === 'image' ? imageUrl : product.image,
      }),
    });

    const data = await response.json();
    setIsUpdating(false);

    if (data.success) {
      toast.success('Product updated');
      onUpdate();
      onClose();
    } else {
      toast.error(data.error || 'Failed to update product');
    }
  }

  return (
    <div
      className={`fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto ${
        isLight ? 'bg-black/40' : 'bg-black/60'
      }`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`relative p-5 sm:p-6 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border shadow-2xl transition-colors ${
        isLight ? 'border-zinc-200 bg-white text-black' : 'border-zinc-800 bg-[#0A0C0F] text-white'
      }`}>
        <button
          onClick={onClose}
          type="button"
          className={`absolute top-4 right-4 p-2 rounded-lg transition ${
            isLight ? 'text-zinc-400 hover:bg-zinc-100 hover:text-black' : 'text-white/50 hover:bg-white/10 hover:text-white'
          }`}
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${
          isLight ? '!text-black' : '!text-white'
        }`} style={{ color: isLight ? '#000000' : '#ffffff' }}>
          {mode === 'image' ? <ImageIcon className="w-5 h-5 text-current" /> : <Pilcrow className="w-5 h-5 text-current" />}
          Update {product.name}
        </h2>

        {mode === 'description' && (
          <textarea
            className={`w-full min-h-32 rounded-xl border p-4 text-sm font-medium outline-none transition ${
              isLight
                ? 'border-zinc-300 bg-zinc-50 text-black placeholder:text-zinc-400 focus:border-black focus:bg-white'
                : 'border-zinc-800 bg-black text-white placeholder:text-white/34 focus:border-zinc-500'
            }`}
            placeholder="Enter product description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        )}

        {mode === 'image' && (
          <div className={`rounded-xl border p-4 transition ${
            isLight ? 'border-zinc-300 bg-zinc-50 text-black' : 'border-zinc-800 bg-black text-white'
          }`}>
            <label htmlFor="product-image-upload" className="flex items-center justify-between cursor-pointer">
              <span className={`text-sm font-semibold truncate ${imageFile ? (isLight ? 'text-black' : 'text-white') : (isLight ? 'text-zinc-500' : 'text-zinc-400')}`}>
                {imageFile ? imageFile.name : 'Upload Image (PNG, JPG)'}
              </span>
              <span className={`rounded-lg px-3 py-1.5 text-xs font-bold transition border ${
                isLight ? 'bg-zinc-200 text-black border-zinc-300 hover:bg-zinc-300' : 'bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700'
              }`}>Select File</span>
            </label>
            <input id="product-image-upload" className="hidden" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} />
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            type="button"
            className={`h-10 rounded-xl px-5 text-xs font-bold transition border ${
              isLight ? 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200 hover:text-black' : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            type="button"
            className={`h-10 rounded-xl px-5 text-xs font-extrabold shadow-md transition disabled:opacity-50 border-0 ${
              isLight ? 'bg-black text-white hover:bg-zinc-800' : 'bg-white text-black hover:bg-zinc-200'
            }`}
            disabled={isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Update Product'}
          </button>
        </div>
      </div>
    </div>
  );
}
