'use client';

import { Link2, Copy, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  storeSlug: string;
}

export default function StoreURLCard({ storeSlug }: Props) {
  const storeUrl = `slate.dev/store/${storeSlug || 'your-slug'}`;
  const fullUrl = `https://${storeUrl}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(fullUrl);
    toast.success('Store URL copied!');
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
      <div className="flex h-11 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
          <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
          <div className="h-2 w-2 rounded-full bg-[#28C840]" />
        </div>
        <span className="ml-3 font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">Store URL</span>
      </div>
      <div className="p-5">
        {/* Traffic lights decorative */}
        <div className="flex items-center gap-1 mb-3">
          <div className="h-1.5 w-1.5 rounded-full bg-[#FF5F57]" />
          <div className="h-1.5 w-1.5 rounded-full bg-[#FEBC2E]" />
          <div className="h-1.5 w-1.5 rounded-full bg-[#28C840]" />
        </div>

        {/* URL display */}
        <div className="bg-[#F5F5F7] rounded-xl px-4 py-3 flex items-center gap-2">
          <Link2 className="w-[13px] h-[13px] text-[#AEAEB2] flex-shrink-0" />
          <span className="font-mono text-[12px] text-[#1D1D1F] flex-1 truncate">{storeUrl}</span>
          <button onClick={copyUrl} className="text-[#AEAEB2] hover:text-[#1D1D1F] transition-colors flex-shrink-0">
            <Copy className="w-[13px] h-[13px]" />
          </button>
        </div>

        {/* Share buttons */}
        <div className="mt-3 flex gap-2">
          {/* WhatsApp */}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Check out my store: ${fullUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#F5F5F7] rounded-xl p-2 hover:bg-[rgba(0,0,0,0.06)] transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-[#1D1D1F]" />
          </a>
          {/* Twitter/X */}
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out my store on Slate! ${fullUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#F5F5F7] rounded-xl p-2 hover:bg-[rgba(0,0,0,0.06)] transition-colors"
          >
            <svg className="w-4 h-4 text-[#1D1D1F]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          {/* LinkedIn */}
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#F5F5F7] rounded-xl p-2 hover:bg-[rgba(0,0,0,0.06)] transition-colors"
          >
            <svg className="w-4 h-4 text-[#1D1D1F]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
