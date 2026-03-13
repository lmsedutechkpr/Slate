'use client';

import { ShoppingCart, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import CartItem, { type CartItemType } from './CartItem';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  cartItems: CartItemType[];
  onUpdateQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
}

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

export default function CartDrawer({ open, onClose, cartItems, onUpdateQty, onRemove }: CartDrawerProps) {
  const router = useRouter();

  const subtotal = cartItems.reduce((sum, ci) => {
    const p = ci.products;
    if (!p) return sum;
    return sum + (p.discounted_price ?? p.price) * ci.quantity;
  }, 0);

  const totalSavings = cartItems.reduce((sum, ci) => {
    const p = ci.products;
    if (!p || !p.discounted_price) return sum;
    return sum + (p.price - p.discounted_price) * ci.quantity;
  }, 0);

  const totalItems = cartItems.reduce((sum, ci) => sum + ci.quantity, 0);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-[400px] max-w-[400px] p-0 !bg-white flex flex-col h-full !border-l !border-gray-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 relative">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
            <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
            <div className="h-2 w-2 rounded-full bg-[#28C840]" />
          </div>
          <p className="text-[16px] font-bold text-gray-900 mt-3">Your Cart</p>
          <p className="text-[12px] text-gray-400">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center pt-12 text-center">
              <ShoppingCart className="w-9 h-9 text-gray-300 mb-4" />
              <p className="text-[16px] font-semibold text-gray-700">Your cart is empty</p>
              <p className="text-[13px] text-gray-400 mt-2">Browse the shop to add items</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQty={onUpdateQty}
                onRemove={onRemove}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
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
              onClick={() => { onClose(); router.push('/student/checkout'); }}
              className="w-full bg-gray-900 text-white font-bold text-[14px] rounded-full py-3 hover:bg-gray-800 transition-colors"
            >
              Proceed to Checkout →
            </button>
            <button
              onClick={onClose}
              className="w-full text-[12px] text-gray-400 hover:text-gray-700 text-center mt-3 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
