'use client';

import { Plus, Package, ShoppingBag, Star, ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

const actions = [
  { icon: Plus, label: 'Add New Product', href: '/seller/products/new' },
  { icon: Package, label: 'Manage Products', href: '/seller/products' },
  { icon: ShoppingBag, label: 'View Orders', href: '/seller/orders' },
];

export default function QuickActionsCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
      <div className="flex h-11 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
          <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
          <div className="h-2 w-2 rounded-full bg-[#28C840]" />
        </div>
        <span className="ml-3 font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">Quick Actions</span>
      </div>
      <div className="p-4 space-y-2">
        {actions.map(action => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-[#F5F5F7] transition-colors"
          >
            <action.icon className="w-[15px] h-[15px] text-[#1D1D1F]" />
            <span className="font-[DM_Sans] text-[13px] font-medium text-[#1D1D1F]">{action.label}</span>
            <ChevronRight className="w-3.5 h-3.5 ml-auto text-[#AEAEB2]" />
          </Link>
        ))}
        <button
          onClick={() => {
            const el = document.getElementById('store-reviews');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-[#F5F5F7] transition-colors w-full text-left"
        >
          <Star className="w-[15px] h-[15px] text-[#1D1D1F]" />
          <span className="font-[DM_Sans] text-[13px] font-medium text-[#1D1D1F]">See Reviews</span>
          <ChevronRight className="w-3.5 h-3.5 ml-auto text-[#AEAEB2]" />
        </button>
      </div>
    </div>
  );
}
