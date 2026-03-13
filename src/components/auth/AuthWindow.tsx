'use client';

import {ReactNode} from 'react';
import {motion} from 'framer-motion';
import {Link} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import TrafficLights from '@/components/auth/TrafficLights';
import {cn} from '@/lib/utils';

interface AuthWindowProps {
  title: string;
  width?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export default function AuthWindow({title, width = 'sm', children}: AuthWindowProps) {
  const t = useTranslations('auth');

  const widthMap = {
    sm: 'max-w-[400px]',
    md: 'max-w-[480px]',
    lg: 'max-w-[600px]'
  };

  return (
    <div className="mx-auto flex w-full flex-col items-center">
      <motion.div
        initial={{opacity: 0, scale: 0.97, y: 12}}
        animate={{opacity: 1, scale: 1, y: 0}}
        transition={{duration: 0.3, ease: 'easeOut'}}
        className={cn(
          'w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-[0_32px_80px_rgba(0,0,0,0.15)]',
          widthMap[width]
        )}
      >
        {/* Titlebar */}
        <div className="relative flex h-11 items-center border-b border-[var(--border)] bg-[var(--surface)] px-4">
          <div className="absolute left-4">
            <TrafficLights size="md" />
          </div>
          <div className="w-full text-center">
            <span className="font-sans text-[12px] font-medium text-[var(--text-secondary)]">{title}</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-8">{children}</div>
      </motion.div>

      <motion.div
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        transition={{delay: 0.2, duration: 0.3}}
        className="mt-5"
      >
        <Link
          href="/"
          className="block text-center text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
        >
          {t('backToHome')}
        </Link>
      </motion.div>
    </div>
  );
}
