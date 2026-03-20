import Link from 'next/link';

export default function PublicFooter() {
  return (
    <footer className="border-t border-[rgba(0,0,0,0.08)] bg-white px-8 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <p className="text-[12px] text-[#6E6E73]">Copyright {new Date().getFullYear()} Slate. Built for modern learning.</p>
        <div className="flex items-center gap-4 text-[13px] font-medium text-[#6E6E73]">
          <Link href="/courses" className="hover:text-[#1D1D1F]">Courses</Link>
          <Link href="/search" className="hover:text-[#1D1D1F]">Search</Link>
          <Link href="/support" className="hover:text-[#1D1D1F]">Support</Link>
          <Link href="/signup" className="hover:text-[#1D1D1F]">Get Started</Link>
        </div>
      </div>
    </footer>
  );
}
