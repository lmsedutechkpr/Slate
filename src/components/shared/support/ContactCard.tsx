import { Mail, MessageCircle, Clock3 } from 'lucide-react';

export default function ContactCard() {
  return (
    <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-5 shadow-[0_6px_16px_rgba(0,0,0,0.06)]">
      <h3 className="text-[15px] font-bold text-[#1D1D1F]">Need direct help?</h3>
      <div className="mt-4 space-y-3 text-[13px] text-[#6E6E73]">
        <p className="inline-flex items-center gap-2"><Mail className="h-4 w-4" />support@slate.local</p>
        <p className="inline-flex items-center gap-2"><MessageCircle className="h-4 w-4" />Live chat in dashboard (students/sellers)</p>
        <p className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" />Average first response: 4-8 hours</p>
      </div>
    </div>
  );
}
