'use client';

import { useMemo, useState } from 'react';
import PublicNavbar from '@/components/shared/PublicNavbar';
import PublicFooter from '@/components/shared/PublicFooter';
import FAQAccordion, { type FAQItem } from '@/components/shared/support/FAQAccordion';
import SupportTicketForm from '@/components/shared/support/SupportTicketForm';
import ContactCard from '@/components/shared/support/ContactCard';

export default function SupportPageClient({
  faqs,
  user,
}: {
  faqs: FAQItem[];
  user: { id: string | null; email: string };
}) {
  const [tab, setTab] = useState('all');

  const categories = useMemo(() => {
    const set = new Set<string>(faqs.map((f) => f.category));
    return ['all', ...Array.from(set)];
  }, [faqs]);

  const filteredFaqs = useMemo(() => {
    if (tab === 'all') return faqs;
    return faqs.filter((faq) => faq.category === tab);
  }, [faqs, tab]);

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <PublicNavbar />

      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-24">
        <section className="rounded-[24px] border border-[rgba(0,0,0,0.08)] bg-white p-7 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
          <h1 className="text-[32px] font-extrabold tracking-[-0.02em] text-[#1D1D1F]">Support Center</h1>
          <p className="mt-2 max-w-3xl text-[14px] text-[#6E6E73]">
            Find answers quickly or create a support request. We support guests and logged-in users.
          </p>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setTab(category)}
                  className={`rounded-full border px-4 py-1.5 text-[12px] font-semibold ${
                    tab === category
                      ? 'border-[#1D1D1F] bg-[#1D1D1F] text-white'
                      : 'border-[rgba(0,0,0,0.1)] bg-white text-[#6E6E73]'
                  }`}
                >
                  {category === 'all' ? 'All' : category}
                </button>
              ))}
            </div>

            <FAQAccordion items={filteredFaqs} />
          </div>

          <div className="space-y-5">
            <SupportTicketForm userId={user.id} defaultEmail={user.email} />
            <ContactCard />
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
