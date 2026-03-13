'use client';

import { useState, useCallback } from 'react';
import { AlertCircle, Trash2, Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface CartProduct {
  id: string;
  name: string;
  name_ta?: string;
  price: number;
  discounted_price?: number;
  images?: string[];
  stock_qty: number;
  seller_id?: string;
}

interface CartItem {
  id: string;
  quantity: number;
  products: CartProduct;
}

interface CartReviewProps {
  items: CartItem[];
  userId: string;
  onNext: () => void;
  onItemsChange: (items: CartItem[]) => void;
}

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

function TrafficLights({ size = 8 }: { size?: number }) {
  const s = `${size}px`;
  return (
    <div className="flex items-center gap-1.5">
      <div style={{ width: s, height: s }} className="rounded-full bg-[#FF5F57]" />
      <div style={{ width: s, height: s }} className="rounded-full bg-[#FEBC2E]" />
      <div style={{ width: s, height: s }} className="rounded-full bg-[#28C840]" />
    </div>
  );
}

export default function CartReview({ items, userId, onNext, onItemsChange }: CartReviewProps) {
  const supabase = createClient();
  const [cartItems, setCartItems] = useState<CartItem[]>(items);
  const [updating, setUpdating] = useState<string | null>(null);

  const updateQty = useCallback(async (itemId: string, productId: string, newQty: number) => {
    if (newQty <= 0) {
      // Remove item
      setUpdating(itemId);
      const updated = cartItems.filter(ci => ci.id !== itemId);
      setCartItems(updated);
      onItemsChange(updated);
      await supabase.from('cart_items').delete().eq('id', itemId);
      setUpdating(null);
      toast.success('Item removed');
      if (updated.length === 0) toast('Your cart is now empty');
    } else {
      setCartItems(prev => prev.map(ci => ci.id === itemId ? { ...ci, quantity: newQty } : ci));
      onItemsChange(cartItems.map(ci => ci.id === itemId ? { ...ci, quantity: newQty } : ci));
      await supabase.from('cart_items').update({ quantity: newQty }).eq('id', itemId);
    }
  }, [cartItems, supabase, onItemsChange]);

  if (cartItems.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center gap-1.5">
          <TrafficLights size={8} />
          <span className="ml-3 text-[13px] font-medium text-gray-500">Cart Empty</span>
        </div>
        <div className="p-12 text-center">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-[16px] font-semibold text-gray-700">Your cart is empty</p>
          <p className="text-[13px] text-gray-400 mt-1">Add some items from the shop first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Titlebar */}
      <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center gap-3">
        <TrafficLights size={8} />
        <span className="text-[13px] font-semibold text-gray-900 ml-1">
          Review Items ({cartItems.reduce((s, ci) => s + ci.quantity, 0)})
        </span>
      </div>

      {/* Items */}
      <div className="divide-y divide-gray-100">
        {cartItems.map((item) => {
          const p = item.products;
          const img = p.images?.[0];
          const price = p.discounted_price ?? p.price;
          const isLowStock = p.stock_qty > 0 && p.stock_qty <= 3;
          const isLoading = updating === item.id;

          return (
            <div
              key={item.id}
              className={`px-5 py-4 flex items-center gap-4 transition-opacity ${isLoading ? 'opacity-50' : ''}`}
            >
              {/* Image */}
              <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                {img ? (
                  <img src={img} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-7 h-7 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-gray-900 leading-snug line-clamp-2">{p.name}</p>

                {/* Price */}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[15px] font-bold text-gray-900">{fmt(price)}</span>
                  {p.discounted_price && (
                    <span className="text-[12px] text-gray-400 line-through">{fmt(p.price)}</span>
                  )}
                </div>

                {/* Low stock warning */}
                {isLowStock && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 text-[#FEBC2E]" />
                    <span className="text-[11px] text-[#FEBC2E] font-medium">Only {p.stock_qty} left</span>
                  </div>
                )}
              </div>

              {/* Right: qty + total */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                {/* Qty controls */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 border border-gray-200">
                  <button
                    onClick={() => updateQty(item.id, p.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:bg-white hover:shadow-sm transition-all"
                    title={item.quantity === 1 ? 'Remove' : 'Decrease'}
                  >
                    {item.quantity === 1 ? (
                      <Trash2 className="w-3.5 h-3.5 text-[#FF5F57]" />
                    ) : (
                      <span className="text-[16px] font-bold leading-none">−</span>
                    )}
                  </button>
                  <span className="w-8 text-center text-[14px] font-semibold text-gray-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQty(item.id, p.id, item.quantity + 1)}
                    disabled={item.quantity >= p.stock_qty}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:bg-white hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span className="text-[16px] font-bold leading-none">+</span>
                  </button>
                </div>

                {/* Item total */}
                <span className="text-[13px] font-bold text-gray-900">{fmt(price * item.quantity)}</span>

                {/* Remove */}
                <button
                  onClick={() => updateQty(item.id, p.id, 0)}
                  className="text-[11px] text-gray-400 hover:text-[#FF5F57] transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 pb-8 border-t border-gray-100 bg-gray-50/50">
        <button
          onClick={onNext}
          disabled={cartItems.length === 0}
          className="w-full bg-gray-900 text-white font-semibold text-[14px] rounded-xl py-3 hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Continue to Address →
        </button>
      </div>
    </div>
  );
}
