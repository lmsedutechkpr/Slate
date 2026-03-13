'use client';

import Image from 'next/image';
import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';

type Avatar = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

function splitWords(text: string) {
  return text.split(' ');
}

export default function HeroSection({
  studentCount,
  avatars
}: {
  studentCount: number;
  avatars: Avatar[];
}) {
  const t = useTranslations('landing.hero');
  const headline1 = splitWords(t('headline1'));
  const headline2 = splitWords(t('headline2'));

  return (
    <section className="relative overflow-hidden bg-[var(--bg)]">
      {/* Grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
          backgroundSize: '64px 64px'
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-3xl pb-28 pt-40 text-center">
          {/* Mac notification badge */}
          <motion.div
            initial={{opacity: 0, y: 8}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94]}}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.1)] bg-[var(--surface-raised)] px-4 py-1.5"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--traffic-red)]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--traffic-yellow)]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--traffic-green)]" />
            <span className="text-[12px] font-medium text-[var(--text-secondary)]">
              {t('studentsAlreadyLearning', {count: studentCount.toLocaleString()})}
            </span>
          </motion.div>

          <h1 className="text-[clamp(44px,6.5vw,80px)] font-extrabold leading-[1.05] tracking-tight text-[var(--text)]">
            <span className="block">
              {headline1.map((word, index) => (
                <motion.span
                  key={word + index}
                  initial={{opacity: 0, y: 14}}
                  animate={{opacity: 1, y: 0}}
                  transition={{delay: index * 0.03, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94]}}
                  className="mr-3 inline-block"
                >
                  {word}
                </motion.span>
              ))}
            </span>
            <span className="block">
              {headline2.map((word, index) => (
                <motion.span
                  key={word + index}
                  initial={{opacity: 0, y: 14}}
                  animate={{opacity: 1, y: 0}}
                  transition={{delay: 0.06 + index * 0.03, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94]}}
                  className="mr-3 inline-block"
                >
                  {word}
                </motion.span>
              ))}
            </span>
          </h1>

          <motion.p
            initial={{opacity: 0, y: 8}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.2, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94]}}
            className="mx-auto mt-6 max-w-lg text-[18px] leading-[1.65] text-[var(--text-secondary)]"
          >
            {t('subheadline')}
          </motion.p>

          <motion.div
            initial={{opacity: 0, y: 6}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.32, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94]}}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/signup?role=student"
              className="flex h-[50px] w-full items-center justify-center rounded-full bg-[var(--white-surface)] px-8 text-[15px] font-semibold text-[var(--white-text)] shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
            >
              {t('startLearningFree')}
            </Link>
            <Link
              href="/courses"
              className="flex h-[50px] w-full items-center justify-center rounded-full border border-[var(--border-hover)] bg-[var(--surface-raised)] px-8 text-[15px] font-medium text-[var(--text)] transition-all hover:bg-[var(--surface)] hover:shadow-sm sm:w-auto"
            >
              {t('exploreCourses')}
            </Link>
          </motion.div>

          {/* Social proof */}
          <div className="mt-10 flex items-center justify-center gap-3">
            <div className="flex items-center">
              {avatars.map((avatar, index) => (
                <div
                  key={avatar.id}
                  className={index === 0 ? 'relative' : 'relative -ml-2'}
                  aria-hidden="true"
                >
                  {avatar.avatar_url ? (
                    <Image
                      src={avatar.avatar_url}
                      alt={avatar.full_name ?? 'Student'}
                      width={30}
                      height={30}
                      loading="lazy"
                      className="h-[30px] w-[30px] rounded-full border-2 border-[#0A0A0A] object-cover"
                    />
                  ) : (
                    <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-[#0A0A0A] bg-[var(--surface-raised)] text-[11px] text-[var(--text-secondary)]">
                      {(avatar.full_name ?? 'S').slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[13px] font-medium text-[var(--text-secondary)]">
              {t('joinLearners', {count: studentCount.toLocaleString()})}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
