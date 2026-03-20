import { createAdminClient, createClient } from '@/lib/supabase/server';
import SupportPageClient from '@/components/shared/support/SupportPageClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Support - Slate',
  description: 'FAQ and support ticket center for Slate users and guests.',
};

const fallbackFaqs = [
  {
    id: 'faq-1',
    category: 'general',
    question: 'How do I start learning on Slate?',
    answer: 'Create an account, browse courses, and enroll. Free and paid options are both available.',
  },
  {
    id: 'faq-2',
    category: 'billing',
    question: 'How do refunds work?',
    answer: 'Eligible orders can be raised from orders page. Returns are reviewed by our support team.',
  },
  {
    id: 'faq-3',
    category: 'courses',
    question: 'Can I access courses offline?',
    answer: 'Core pages support offline fallback. Video lessons still require internet for streaming.',
  },
  {
    id: 'faq-4',
    category: 'technical',
    question: 'The page is not loading. What should I do?',
    answer: 'Check your connection first. Then refresh. If issue persists, submit a support ticket.',
  },
];

export default async function SupportPage() {
  const [supabase, admin] = await Promise.all([createClient(), Promise.resolve(createAdminClient())]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userEmail = user?.email || '';

  let faqs = fallbackFaqs;

  try {
    const { data } = await admin
      .from('faqs')
      .select('id, category, question, answer')
      .eq('is_active', true)
      .order('sort_order');

    if (data?.length) {
      faqs = data;
    }
  } catch {
    // Fallback is intentional when the optional FAQs table is unavailable.
  }

  return <SupportPageClient faqs={faqs} user={{ id: user?.id || null, email: userEmail }} />;
}
