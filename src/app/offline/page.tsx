'use client';

import { WifiOff } from 'lucide-react';
import TrafficLights from '@/components/auth/TrafficLights';
import Link from 'next/link';

export const dynamic = 'force-static';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFFFFF] px-4">
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
        <div className="flex items-center bg-[#F5F5F7] px-5 py-4">
          <TrafficLights size="md" />
        </div>

        <div className="p-10 text-center">
          <WifiOff className="mx-auto h-12 w-12 text-[#AEAEB2]" />
          <h1 className="mt-5 text-[28px] font-extrabold text-[#1D1D1F]">You're offline</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-[#6E6E73]">
            Check your internet connection and try again.
          </p>

          <div className="mt-6 flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
            <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
            <span className="h-2 w-2 rounded-full bg-[#28C840]" />
          </div>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-8 rounded-full bg-[#1D1D1F] px-8 py-3 text-[14px] font-bold text-white"
          >
            Try Again
          </button>

          <div className="mt-4">
            <Link href="/student/courses" className="text-[13px] font-medium text-[#6E6E73]">
              View Downloaded Courses
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
