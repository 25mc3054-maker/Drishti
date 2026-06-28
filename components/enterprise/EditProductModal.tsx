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
}

export function EditProductModal({ product, mode, onClose, onUpdate }: EditProductModalProps) {
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative premium-card neon-panel p-6 rounded-2xl max-w-lg w-full">
        <button onClick={onClose} className="absolute top-4 right-4 premium-button-ghost p-2">
          <X className="h-4 w-4" />
        </button>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          {mode === 'image' ? <ImageIcon className="w-5 h-5 text-gemini-blue-300" /> : <Pilcrow className="w-5 h-5 text-gemini-blue-300" />}
          Update {product.name}
        </h2>

        {mode === 'description' && (
          <textarea
            className="premium-input w-full min-h-32"
            placeholder="Enter product description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        )}

        {mode === 'image' && (
          <div className="premium-input">
            <label htmlFor="product-image-upload" className="flex items-center justify-between">
              <span>{imageFile ? imageFile.name : 'Upload Image'}</span>
              <span className="premium-button-ghost text-xs">Select File</span>
            </label>
            <input id="product-image-upload" className="hidden" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} />
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} type="button" className="premium-button-ghost">Cancel</button>
          <button onClick={handleUpdate} type="button" className="premium-button-primary" disabled={isUpdating}>
            {isUpdating ? 'Updating...' : 'Update Product'}
          </button>
        </div>
      </div>
    </div>
  );
}
