'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export type FAQItem = {
  id: string;
  category: string;
  question: string;
  answer: string;
};

export default function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id || null);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const open = openId === item.id;
        return (
          <div key={item.id} className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white">
            <button
              onClick={() => setOpenId(open ? null : item.id)}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <p className="text-[14px] font-semibold text-[#1D1D1F]">{item.question}</p>
              <ChevronDown className={`h-4 w-4 text-[#6E6E73] transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open ? <p className="border-t border-[rgba(0,0,0,0.06)] px-5 py-4 text-[13px] leading-relaxed text-[#6E6E73]">{item.answer}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
