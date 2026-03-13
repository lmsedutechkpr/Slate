import type {Metadata} from 'next';
import {DM_Sans, Geist } from 'next/font/google';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, getLocale} from 'next-intl/server';
import './globals.css';
import ToastProvider from '@/components/ui/toast-provider';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-dm-sans'
});

export const metadata: Metadata = {
  title: 'Slate',
  description: 'Unified learning and commerce platform'
};

export default async function RootLayout({
  children
}: Readonly<{children: React.ReactNode}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className={`${dmSans.variable} bg-[#0A0A0A] text-[#FAFAFA] antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <ToastProvider />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
