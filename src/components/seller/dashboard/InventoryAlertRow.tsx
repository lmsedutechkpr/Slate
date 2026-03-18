'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface InventoryAlertRowProps {
  product: any;
  onStockUpdated: (productId: string, newQty: number) => void;
}

export default function InventoryAlertRow({ product, onStockUpdated }: InventoryAlertRowProps) {
  const [updating, setUpdating] = useState(false);
  const [newStock, setNewStock] = useState(product.stock_qty.toString());

  const isOutOfStock = product.stock_qty <= 0;
  const imgUrl = product.images?.[0] || 'https://via.placeholder.com/150';

  const handleUpdate = async () => {
    const qty = parseInt(newStock, 10);
    if (isNaN(qty) || qty < 0) {
      toast.error('Please enter a valid stock quantity');
      return;
    }

    setUpdating(true);
    const supabase = createClient();
    
    // Optimistic update
    onStockUpdated(product.id, qty);

    const { error } = await supabase
      .from('products')
      .update({ stock_qty: qty })
      .eq('id', product.id);

    setUpdating(false);

    if (error) {
      toast.error('Failed to update stock: ' + error.message);
      // Revert in a real app if failed, but for simplicity we rely on realtime or refresh
    } else {
      toast.success('Stock updated!');
    }
  };

  return (
    <div className="flex items-center gap-3 border-b border-[rgba(255,95,87,0.1)] py-3 last:border-0">
      <img src={imgUrl} alt={product.name} className="h-10 w-10 flex-shrink-0 rounded-xl object-cover" />

      <div className="min-w-0 flex-1">
        <p className="font-[DM_Sans] text-[13px] font-medium text-[#1D1D1F] line-clamp-1">
          {product.name}
        </p>
        {isOutOfStock ? (
          <p className="font-[DM_Sans] text-[12px] font-bold text-[#FF5F57]">Out of stock</p>
        ) : (
          <p className="font-[DM_Sans] text-[12px] font-bold text-[#FEBC2E]">
            Only {product.stock_qty} left
          </p>
        )}
      </div>

      <div className="flex flex-shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center">
        <input
          type="number"
          min="0"
          value={newStock}
          onChange={(e) => setNewStock(e.target.value)}
          placeholder="New qty"
          className="w-16 rounded-md border border-[rgba(0,0,0,0.08)] bg-white px-2 py-1 text-[11px] text-[#1D1D1F] focus:border-[#1D1D1F] focus:outline-none"
        />
        <button
          onClick={handleUpdate}
          disabled={updating || newStock === product.stock_qty.toString()}
          className="rounded-md bg-[#1D1D1F] px-3 py-1 font-[DM_Sans] text-[11px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {updating ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
