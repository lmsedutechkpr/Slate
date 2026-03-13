'use client';

import {useTransition} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {usePathname, useRouter} from '@/i18n/navigation';
import {useUIStore} from '@/store/useUIStore';
import {createClient} from '@/lib/supabase/client';
import {cn} from '@/lib/utils';

type Props = {
  compact?: boolean;
};

export default function LanguageToggle({compact = false}: Props) {
  const t = useTranslations('landing.navbar');
  const locale = useLocale() as 'en' | 'ta';
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {language, setLanguage} = useUIStore();
  const activeLang = language || locale;

  const changeLanguage = (nextLang: 'en' | 'ta') => {
    if (nextLang === activeLang || isPending) return;
    setLanguage(nextLang);

    startTransition(async () => {
      try {
        const supabase = createClient();
        const {
          data: {user}
        } = await supabase.auth.getUser();

        if (user) {
          await supabase
            .from('user_preferences')
            .update({language: nextLang})
            .eq('user_id', user.id);
        }
      } catch (error) {
        console.error('Language preference update failed', error);
      }

      router.replace(pathname, {locale: nextLang});
    });
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full bg-[var(--surface-raised)] p-0.5',
        compact && 'scale-95'
      )}
    >
      {(['en', 'ta'] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => changeLanguage(lang)}
          className={cn(
            'rounded-full px-3 py-1 text-[12px] font-semibold transition-colors',
            activeLang === lang
              ? 'bg-[var(--white-surface)] text-[var(--white-text)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
          )}
          aria-label={lang === 'en' ? t('switchToEnglish') : t('switchToTamil')}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
