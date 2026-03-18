'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import TrafficLights from '@/components/auth/TrafficLights';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface StockUpdateModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newQty: number, newThreshold: number) => void;
}

export default function StockUpdateModal({ product, isOpen, onClose, onSuccess }: StockUpdateModalProps) {
  const [qty, setQty] = useState(product?.stock_qty?.toString() || '0');
  const [threshold, setThreshold] = useState(product?.low_stock_threshold?.toString() || '5');
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  if (!product) return null;

  const handleSave = async () => {
    const numQty = parseInt(qty, 10);
    const numThreshold = parseInt(threshold, 10);

    if (isNaN(numQty) || numQty < 0) return toast.error('Invalid quantity');
    if (isNaN(numThreshold) || numThreshold < 0) return toast.error('Invalid threshold');

    setLoading(true);
    const { error } = await supabase
      .from('products')
      .update({
        stock_qty: numQty,
        low_stock_threshold: numThreshold,
      })
      .eq('id', product.id);
    
    setLoading(false);

    if (error) {
      toast.error('Failed to update stock: ' + error.message);
    } else {
      toast.success('Stock updated!');
      onSuccess(numQty, numThreshold);
      onClose();
    }
  };

  const addAmount = (amount: number) => {
    setQty((prev: string) => (parseInt(prev || '0', 10) + amount).toString());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-3xl p-6 sm:rounded-3xl border border-[rgba(0,0,0,0.08)] bg-white shadow-xl">
        <div className="mb-4">
          <TrafficLights size="sm" />
        </div>

        <div className="mb-5 flex items-center gap-3">
          <img src={product.images?.[0] || 'https://via.placeholder.com/150'} alt="" className="h-12 w-12 rounded-xl object-cover bg-[#F5F5F7]" />
          <div>
            <p className="font-[DM_Sans] text-[15px] font-bold text-[#1D1D1F] line-clamp-1">{product.name}</p>
            <p className="text-[12px] text-[#6E6E73]">Current Stock: {product.stock_qty} units</p>
          </div>
        </div>

        <div className="w-full">
          <input
            type="number"
            min="0"
            value={qty}
            onChange={e => setQty(e.target.value)}
            className="w-full rounded-2xl bg-[#F5F5F7] py-4 text-center font-[DM_Sans] text-[32px] font-extrabold text-[#1D1D1F] focus:outline-none"
          />
          
          <div className="mt-3 flex justify-center gap-2">
            {[10, 25, 50, 100].map(amt => (
              <button
                key={amt}
                onClick={() => addAmount(amt)}
                className="rounded-full bg-[#F5F5F7] px-3 py-1.5 text-[12px] font-medium text-[#6E6E73] transition-colors hover:bg-[rgba(0,0,0,0.08)] hover:text-[#1D1D1F]"
              >
                +{amt}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-[rgba(0,0,0,0.04)] pt-4">
          <label className="text-[12px] font-medium text-[#AEAEB2]">Alert when below:</label>
          <input
            type="number"
            min="0"
            value={threshold}
            onChange={e => setThreshold(e.target.value)}
            className="w-20 rounded-xl bg-[#F5F5F7] px-3 py-1.5 text-center text-[13px] font-medium text-[#1D1D1F] focus:outline-none focus:ring-1 focus:ring-[rgba(0,0,0,0.1)]"
          />
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl px-4 py-3 font-[DM_Sans] text-[13px] font-bold text-[#6E6E73] hover:bg-[#F5F5F7] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 rounded-xl bg-[#1D1D1F] px-4 py-3 font-[DM_Sans] text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Update Stock'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
