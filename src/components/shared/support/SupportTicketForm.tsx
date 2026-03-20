'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export default function SupportTicketForm({
  userId,
  defaultEmail,
}: {
  userId: string | null;
  defaultEmail: string;
}) {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [email, setEmail] = useState(defaultEmail);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject and message are required.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('support_tickets').insert({
        user_id: userId,
        subject: subject.trim(),
        body: JSON.stringify({
          message: message.trim(),
          email: email.trim() || null,
          source: 'public_support_page',
        }),
        status: 'open',
        category,
      });

      if (error) throw error;

      toast.success('Ticket submitted. Our support team will reach out soon.');
      setSubject('');
      setMessage('');
      router.refresh();
    } catch {
      toast.error('Unable to submit support ticket right now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-[0_6px_16px_rgba(0,0,0,0.06)]">
      <h3 className="text-[16px] font-bold text-[#1D1D1F]">Submit a support ticket</h3>

      <div className="mt-4 space-y-3">
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="w-full rounded-xl border border-[rgba(0,0,0,0.08)] px-3 py-2 text-[14px] outline-none focus:border-[#0071E3]"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-xl border border-[rgba(0,0,0,0.08)] px-3 py-2 text-[14px] outline-none focus:border-[#0071E3]"
        >
          <option value="general">General</option>
          <option value="billing">Billing</option>
          <option value="courses">Courses</option>
          <option value="returns">Returns</option>
          <option value="technical">Technical</option>
        </select>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Contact email"
          className="w-full rounded-xl border border-[rgba(0,0,0,0.08)] px-3 py-2 text-[14px] outline-none focus:border-[#0071E3]"
        />

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          placeholder="Tell us what happened"
          className="w-full rounded-xl border border-[rgba(0,0,0,0.08)] px-3 py-2 text-[14px] outline-none focus:border-[#0071E3]"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-full bg-[#1D1D1F] px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit ticket'}
      </button>
    </form>
  );
}
