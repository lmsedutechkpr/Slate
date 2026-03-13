import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

export default function PublicLayout({children}: {children: React.ReactNode}) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navbar />
      <div className="pt-[52px]">{children}</div>
      <Footer />
    </div>
  );
}
