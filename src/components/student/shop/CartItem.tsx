'use client';

import { Trash2, Package } from 'lucide-react';

interface CartItemProduct {
  id: string;
  name: string;
  price: number;
  discounted_price?: number;
  images?: string[];
  stock_qty: number;
}

export interface CartItemType {
  id: string;
  quantity: number;
  product_id: string;
  products?: CartItemProduct;
}

interface CartItemProps {
  item: CartItemType;
  onUpdateQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
}

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

export default function CartItem({ item, onUpdateQty, onRemove }: CartItemProps) {
  const p = item.products;
  if (!p) return null;

  const price = p.discounted_price ?? p.price;
  const img = p.images?.[0];

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100">
      {/* Image */}
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
        {img ? (
          <img src={img} alt={p.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-6 h-6 text-gray-300" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-gray-900 line-clamp-2 leading-snug">{p.name}</p>
        <p className="text-[14px] font-bold text-gray-900 mt-1">{fmt(price)}</p>

        {/* Qty controls */}
        <div className="flex items-center gap-2 mt-2 bg-gray-100 rounded-lg px-2 py-1 w-fit">
          <button
            onClick={() => item.quantity <= 1 ? onRemove(p.id) : onUpdateQty(p.id, item.quantity - 1)}
            className="text-gray-600 font-bold text-base leading-none hover:text-gray-900 w-5 text-center"
          >−</button>
          <span className="font-semibold text-[13px] text-gray-900 w-6 text-center">{item.quantity}</span>
          <button
            onClick={() => onUpdateQty(p.id, item.quantity + 1)}
            disabled={item.quantity >= p.stock_qty}
            className="text-gray-600 font-bold text-base leading-none hover:text-gray-900 disabled:opacity-40 w-5 text-center"
          >+</button>
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(p.id)}
        className="text-gray-300 hover:text-[#FF5F57] transition-colors flex-shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
