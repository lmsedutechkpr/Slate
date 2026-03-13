'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/store/useUIStore';
import { useCartStore } from '@/store/useCartStore';
import { ShoppingCart, X, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { toast } from 'sonner';

interface CartProduct {
  id: string; name: string; price: number;
  discounted_price?: number; images?: string[]; stock_qty: number;
}
interface CartRow {
  id: string; quantity: number; product_id: string;
  products: CartProduct | null;
}

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN'); }

export default function GlobalCartDrawer({ userId }: { userId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const { cartDrawerOpen, setCartDrawerOpen } = useUIStore();
  const { setCount } = useCartStore();

  const [cartItems, setCartItems] = useState<CartRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch cart whenever drawer opens
  useEffect(() => {
    if (!cartDrawerOpen) return;
    setLoading(true);
    supabase
      .from('cart_items')
      .select('id, quantity, product_id, products(id, name, price, discounted_price, images, stock_qty)')
      .eq('user_id', userId)
      .then(({ data }) => {
        const rows = (data || []).map((ci: any) => ({
          ...ci, products: Array.isArray(ci.products) ? ci.products[0] : ci.products,
        }));
        setCartItems(rows);
        setCount(rows.reduce((s, r) => s + r.quantity, 0));
        setLoading(false);
      });
  }, [cartDrawerOpen, userId, supabase, setCount]);

  const updateQty = useCallback(async (rowId: string, productId: string, newQty: number) => {
    if (newQty <= 0) {
      const updated = cartItems.filter(ci => ci.id !== rowId);
      setCartItems(updated);
      setCount(updated.reduce((s, r) => s + r.quantity, 0));
      toast.success('Removed from cart');
      await supabase.from('cart_items').delete().eq('id', rowId);
    } else {
      setCartItems(prev => prev.map(ci => ci.id === rowId ? { ...ci, quantity: newQty } : ci));
      await supabase.from('cart_items').update({ quantity: newQty }).eq('id', rowId);
    }
  }, [supabase, setCount]);

  const subtotal = cartItems.reduce((s, ci) => {
    if (!ci.products) return s;
    return s + (ci.products.discounted_price ?? ci.products.price) * ci.quantity;
  }, 0);
  const totalSavings = cartItems.reduce((s, ci) => {
    if (!ci.products?.discounted_price) return s;
    return s + (ci.products.price - ci.products.discounted_price) * ci.quantity;
  }, 0);

  return (
    <Sheet open={cartDrawerOpen} onOpenChange={o => !o && setCartDrawerOpen(false)}>
      <SheetContent side="right" className="w-[400px] max-w-[400px] p-0 !bg-white flex flex-col h-full !border-l !border-gray-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 relative">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
            <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
            <div className="h-2 w-2 rounded-full bg-[#28C840]" />
          </div>
          <p className="text-[16px] font-bold text-gray-900 mt-3">Your Cart</p>
          <p className="text-[12px] text-gray-400">
            {loading ? 'Loading...' : `${cartItems.reduce((s, ci) => s + ci.quantity, 0)} item${cartItems.reduce((s, ci) => s + ci.quantity, 0) !== 1 ? 's' : ''}`}
          </p>
          <button
            onClick={() => setCartDrawerOpen(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="flex flex-col items-center pt-12 text-center">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin mb-3" />
              <p className="text-[13px] text-gray-400">Loading your cart...</p>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="flex flex-col items-center pt-12 text-center">
              <ShoppingCart className="w-9 h-9 text-gray-300 mb-4" />
              <p className="text-[16px] font-semibold text-gray-700">Your cart is empty</p>
              <p className="text-[13px] text-gray-400 mt-2">Browse the shop to add items</p>
              <button
                onClick={() => { setCartDrawerOpen(false); router.push('/student/shop'); }}
                className="mt-5 text-[13px] font-medium text-gray-700 border border-gray-200 rounded-full px-5 py-2 hover:bg-gray-50 transition-colors"
              >Go to Shop</button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map(item => {
                const p = item.products;
                if (!p) return null;
                const price = p.discounted_price ?? p.price;
                const img = p.images?.[0];
                return (
                  <div key={item.id} className="flex gap-3 items-start">
                    {/* Image */}
                    <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {img
                        ? <img src={img} alt={p.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-gray-300" /></div>}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 line-clamp-2 leading-snug">{p.name}</p>
                      <p className="text-[13px] font-bold text-gray-900 mt-1">{fmt(price)}</p>
                      {p.discounted_price && <p className="text-[11px] text-gray-400 line-through">{fmt(p.price)}</p>}
                    </div>
                    {/* Qty controls */}
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                        <button
                          onClick={() => updateQty(item.id, item.product_id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 font-bold transition-colors text-sm"
                        >−</button>
                        <span className="font-semibold text-[13px] text-gray-900 w-7 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.id, item.product_id, item.quantity + 1)}
                          disabled={item.quantity >= p.stock_qty}
                          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 font-bold transition-colors disabled:opacity-30 text-sm"
                        >+</button>
                      </div>
                      <button onClick={() => updateQty(item.id, item.product_id, 0)} className="text-[11px] text-gray-400 hover:text-red-500 transition-colors">Remove</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && cartItems.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] text-gray-500">Subtotal</span>
              <span className="text-[18px] font-bold text-gray-900">{fmt(subtotal)}</span>
            </div>
            {totalSavings > 0 && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-[12px] text-gray-400">You save</span>
                <span className="text-[12px] font-semibold text-green-600">{fmt(totalSavings)}</span>
              </div>
            )}
            <button
              onClick={() => { setCartDrawerOpen(false); router.push('/student/checkout'); }}
              className="w-full bg-gray-900 text-white font-bold text-[14px] rounded-full py-3 hover:bg-gray-800 transition-colors mb-2"
            >Proceed to Checkout →</button>
            <button
              onClick={() => setCartDrawerOpen(false)}
              className="w-full text-[12px] text-gray-400 hover:text-gray-700 text-center mt-1 transition-colors"
            >Continue Shopping</button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
