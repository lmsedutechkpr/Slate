'use client';

import {useRef} from 'react';
import {motion, useInView} from 'framer-motion';
import {ArrowRight, BookOpen, Play, ShoppingBag} from 'lucide-react';
import {useTranslations} from 'next-intl';

const icons = [BookOpen, Play, ShoppingBag];

export default function HowItWorksClient() {
  const t = useTranslations('landing.howItWorks');
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, {once: true, margin: '-60px'});

  const steps = [
    {title: t('step1Title'), body: t('step1Body')},
    {title: t('step2Title'), body: t('step2Body')},
    {title: t('step3Title'), body: t('step3Body')}
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-24 md:px-6">
      {/* Mac window card */}
      <div className="mx-auto max-w-4xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
        {/* Window title bar */}
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--traffic-red)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--traffic-yellow)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--traffic-green)]" />
        </div>
        <p className="mt-2 text-center text-[11px] font-medium text-[var(--text-muted)]">
          Slate.app — Getting Started
        </p>

        {/* Separator */}
        <div className="my-6 border-t border-[var(--border)]" />

        {/* 3 steps */}
        <div
          ref={ref}
          className="grid gap-6 md:grid-cols-[1fr,auto,1fr,auto,1fr]"
        >
          {steps.map((step, index) => {
            const Icon = icons[index];
            return (
              <div key={step.title} className="contents">
                <motion.div
                  initial={{opacity: 0, y: 16}}
                  animate={inView ? {opacity: 1, y: 0} : {}}
                  transition={{
                    delay: index * 0.1,
                    duration: 0.35,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                  className="relative flex flex-col"
                >
                  {/* Ghost number */}
                  <span className="absolute right-0 top-0 select-none text-[48px] font-extrabold leading-none text-[rgba(255,255,255,0.04)]">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>

                  {/* Icon circle */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-raised)]">
                    <Icon className="h-5 w-5 text-[var(--text)]" />
                  </div>

                  <h3 className="mt-4 text-[16px] font-semibold text-[var(--text)]">{step.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-secondary)]">{step.body}</p>
                </motion.div>

                {index < 2 ? (
                  <div className="hidden items-center justify-center md:flex">
                    <ArrowRight className="h-4 w-4 text-[var(--text-muted)]" />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
