'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Download,
  Globe2,
  Check,
  Cpu,
  GraduationCap,
  Headphones,
  Menu,
  PlayCircle,
  Sparkle,
  ShoppingBag,
  Zap,
  X,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import TrafficLights from '@/components/auth/TrafficLights';

const NAV_ITEMS = [
  { href: '#home', label: 'Home' },
  { href: '#features', label: 'Features' },
  { href: '#roles', label: 'Roles' },
  { href: '#flow', label: 'Flow' },
  { href: '#benefits', label: 'Benefits' },
  { href: '#cta', label: 'Start' },
];

const ROLE_TABS = ['student', 'instructor', 'seller'] as const;
type RoleTab = (typeof ROLE_TABS)[number];

const STORIES = [
  {
    id: 'features',
    eyebrow: 'Learning + Commerce',
    title: 'Learn and buy, without switching apps.',
    body: 'Watch a lesson. Get recommended tools. Purchase instantly without leaving your flow.',
    icon: Sparkle,
    mockLabel: 'Course + Tool Context',
    mockMain: 'iPad Notes Masterclass',
    mockSub: 'Recommended: Apple Pencil grip + Type-C charger',
    reverse: false,
  },
  {
    id: 'recommendations',
    eyebrow: 'Smart Recommendations',
    title: 'Slate understands how you learn.',
    body: 'Courses, tools, and accessories are recommended based on behavior, progress, and learning patterns.',
    icon: Cpu,
    mockLabel: 'Recommendation Engine',
    mockMain: 'Because you watched 3 design lessons',
    mockSub: 'Suggested: UI Motion Systems + Stylus Precision Kit',
    reverse: true,
  },
  {
    id: 'offline',
    eyebrow: 'Offline First',
    title: 'No internet? No problem.',
    body: 'Download lessons, place orders offline, and sync when you are back online without losing continuity.',
    icon: Download,
    mockLabel: 'Offline Queue',
    mockMain: '7 lessons downloaded · 2 orders queued',
    mockSub: 'Syncing automatically when connection restores',
    reverse: false,
  },
  {
    id: 'multilingual',
    eyebrow: 'Multilingual',
    title: 'Built for India.',
    body: 'Switch seamlessly between English and Tamil. Learn in your language, without friction.',
    icon: Globe2,
    mockLabel: 'Language Switch',
    mockMain: 'EN <-> TA synchronized content',
    mockSub: 'Interface, lessons, and captions aligned',
    reverse: true,
  },
];

const ROLE_VIEWS: Record<
  RoleTab,
  {
    title: string;
    subtitle: string;
    bullets: string[];
    statA: string;
    statB: string;
  }
> = {
  student: {
    title: 'Student Workspace',
    subtitle: 'Track progress, attend live classes, and buy recommended tools in one guided flow.',
    bullets: ['Video courses + quizzes', 'Smart recommendations', 'Offline lesson downloads'],
    statA: '92% lesson completion',
    statB: '3 contextual product picks',
  },
  instructor: {
    title: 'Instructor Workspace',
    subtitle: 'Publish courses, run live sessions, and monitor outcomes with practical analytics.',
    bullets: ['Course builder + curriculum', 'Live session scheduling', 'Student progress insights'],
    statA: '12 live classes this month',
    statB: '4.9 average rating',
  },
  seller: {
    title: 'Seller Workspace',
    subtitle: 'Manage catalog, orders, and returns while staying connected to learner demand.',
    bullets: ['Product listing pipeline', 'Order + return operations', 'Payout tracking dashboard'],
    statA: '127 orders fulfilled',
    statB: '2.4% return rate',
  },
};

const FLOW_STEPS = [
  'Choose your role',
  'Explore courses',
  'Get smart recommendations',
  'Learn + purchase seamlessly',
];

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
};

function smoothAnchor(href: string, onDone: () => void) {
  if (!href.startsWith('#')) {
    onDone();
    return;
  }
  const target = document.querySelector(href);
  if (!target) {
    onDone();
    return;
  }
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  onDone();
}

export default function RedesignLandingPage() {
  const [activeRole, setActiveRole] = useState<RoleTab>('student');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const previous = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = previous;
    };
  }, []);

  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="min-h-screen bg-[radial-gradient(1300px_700px_at_80%_-10%,rgba(115,162,255,0.17),transparent_50%),radial-gradient(900px_540px_at_-10%_10%,rgba(255,188,46,0.15),transparent_50%),#F6F5F2] text-[#111317]">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '5px 5px' }} />
      </div>

      <header className="fixed left-1/2 top-4 z-50 w-[calc(100%-1rem)] max-w-6xl -translate-x-1/2 sm:w-[calc(100%-2rem)]">
          <div className="rounded-2xl border border-[rgba(20,20,20,0.09)] bg-[rgba(250,250,250,0.72)] shadow-[0_24px_70px_rgba(18,18,18,0.12)] backdrop-blur-2xl">
          <div className="flex h-14 items-center justify-between px-4 sm:px-5">
            <a href="#home" className="flex items-center gap-2.5">
              <TrafficLights size="sm" />
                <span className="font-[var(--font-dm-sans)] text-[21px] font-black tracking-tight text-[#1A1B1F]">Slate</span>
            </a>

            <nav className="hidden items-center gap-6 lg:flex">
              {NAV_ITEMS.map((nav) => (
                <a
                  key={nav.href}
                  href={nav.href}
                    className="text-[13px] font-semibold text-[#555A62] transition-colors hover:text-[#17181C]"
                >
                  {nav.label}
                </a>
              ))}
            </nav>

            <div className="hidden items-center gap-2 lg:flex">
                <Link href="/login" className="rounded-full border border-[rgba(24,24,24,0.12)] bg-white px-4 py-2 text-[12px] font-semibold text-[#16171B]">
                Log In
              </Link>
              <Link
                href="/signup"
                  className="inline-flex items-center gap-1 rounded-full bg-[#121317] px-4 py-2 text-[12px] font-semibold text-white"
              >
                Start Free
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <button
              type="button"
                className="grid h-9 w-9 place-items-center rounded-lg border border-[rgba(20,20,20,0.12)] bg-white text-[#17181C] lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>

          <AnimatePresence>
            {mobileOpen ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-[rgba(20,20,20,0.1)] px-4 pb-4 lg:hidden"
              >
                <div className="flex flex-col gap-2 pt-3">
                  {NAV_ITEMS.map((nav) => (
                    <button
                      key={nav.href}
                      type="button"
                      onClick={() => smoothAnchor(nav.href, () => setMobileOpen(false))}
                        className="rounded-xl border border-[rgba(20,20,20,0.1)] bg-white px-3 py-2 text-left text-[13px] font-semibold text-[#16171B]"
                    >
                      {nav.label}
                    </button>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl border border-[rgba(20,20,20,0.1)] bg-white px-3 py-2 text-center text-[12px] font-semibold text-[#16171B]"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl bg-[#121317] px-3 py-2 text-center text-[12px] font-semibold text-white"
                  >
                    Start Free
                  </Link>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </header>

        <main className="pt-24">
          <section
            id="home"
            className="scroll-mt-28 px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pb-20 lg:pt-18"
            onMouseMove={(event) => {
              const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
              const x = ((event.clientX - rect.left) / rect.width - 0.5) * 18;
              const y = ((event.clientY - rect.top) / rect.height - 0.5) * 18;
              setParallax({ x, y });
            }}
            onMouseLeave={() => setParallax({ x: 0, y: 0 })}
          >
          <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.02fr_0.98fr]">
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="space-y-6"
            >
              <motion.h1
                variants={item}
                className="font-[var(--font-dm-sans)] text-[38px] font-black leading-[1.03] tracking-tight text-[#121317] sm:text-[56px] lg:text-[72px]"
              >
                Learn. Build. Buy. All in one place.
              </motion.h1>

                <motion.p variants={item} className="max-w-2xl text-[17px] leading-relaxed text-[#4D525B]">
                  Slate is the operating system for modern learning where courses, tools, and commerce work together.
              </motion.p>

              <motion.div variants={item} className="flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-[#131417] px-5 text-[13px] font-semibold text-white transition-transform active:scale-[0.98]"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#flow"
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-[rgba(20,20,20,0.14)] bg-[rgba(255,255,255,0.72)] px-5 text-[13px] font-semibold text-[#16171B] backdrop-blur transition-transform active:scale-[0.98]"
                >
                  <PlayCircle className="h-4 w-4 text-[#2AA85E]" />
                  See How It Works
                </a>
              </motion.div>

                <motion.div variants={item} className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-[#555B64]">
                <p className="inline-flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-[#2AA85E]" />
                    video courses + live classes
                </p>
                <p className="inline-flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-[#2AA85E]" />
                    contextual commerce integration
                </p>
                <p className="inline-flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-[#2AA85E]" />
                    bilingual + offline support
                </p>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45 }}
                style={{ transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0)` }}
                className="relative"
            >
                <div className="absolute -right-8 -top-7 h-28 w-28 rounded-full bg-[rgba(53,130,255,0.18)] blur-3xl" />
                <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-[rgba(255,188,46,0.2)] blur-3xl" />
                <div className="relative overflow-hidden rounded-[18px] border border-[rgba(24,24,24,0.1)] bg-[rgba(255,255,255,0.54)] p-4 shadow-[0_36px_90px_rgba(20,20,20,0.18)] backdrop-blur-xl sm:p-5">
                  <div className="mb-4 flex h-10 items-center rounded-[12px] border border-[rgba(24,24,24,0.08)] bg-[rgba(245,245,247,0.9)] px-3">
                    <TrafficLights size="sm" />
                    <span className="mx-auto text-[12px] font-medium text-[#5A5F67]">Slate Live Workspace</span>
                    <span className="text-[11px] font-semibold text-[#6B7079]">EN | TA</span>
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-[14px] border border-[rgba(20,20,20,0.08)] bg-[rgba(255,255,255,0.82)] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6F78]">Now Learning</p>
                      <p className="mt-1 text-[24px] font-black text-[#131417]">UX Motion Fundamentals</p>
                      <p className="text-[13px] text-[#555A63]">Recommended tool: Wireless stylus + noise-canceling headphones</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-[14px] border border-[rgba(20,20,20,0.08)] bg-[rgba(53,130,255,0.12)] p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#405E9B]">Progress</p>
                        <p className="mt-1 text-[20px] font-black text-[#131417]">78%</p>
                      </div>
                      <div className="rounded-[14px] border border-[rgba(20,20,20,0.08)] bg-[rgba(40,200,64,0.12)] p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#2D7B53]">Offline Ready</p>
                        <p className="mt-1 text-[20px] font-black text-[#131417]">7 lessons</p>
                      </div>
                    </div>

                    <div className="rounded-[14px] border border-[rgba(20,20,20,0.08)] bg-[rgba(255,188,46,0.16)] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#755722]">Seamless Commerce</p>
                      <p className="mt-1 text-[14px] font-semibold text-[#131417]">Buy accessories while learning, without breaking your flow.</p>
                    </div>
                  </div>
              </div>
            </motion.div>
          </div>
        </section>

          {STORIES.map((story, index) => {
            const Icon = story.icon;
            return (
              <section
                key={story.id}
                id={index === 0 ? 'features' : story.id}
                className="scroll-mt-28 px-4 py-14 sm:px-6 lg:px-8 lg:py-18"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  className={`mx-auto grid w-full max-w-6xl items-center gap-8 ${story.reverse ? 'lg:grid-cols-[1.04fr_0.96fr]' : 'lg:grid-cols-[0.96fr_1.04fr]'}`}
                >
                  <div className={story.reverse ? 'lg:order-2' : 'lg:order-1'}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6A7079]">{story.eyebrow}</p>
                    <h2 className="mt-2 font-[var(--font-dm-sans)] text-[31px] font-black leading-[1.1] tracking-tight text-[#121317] sm:text-[44px]">
                      {story.title}
                    </h2>
                    <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-[#4F545E]">{story.body}</p>
                    <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[rgba(20,20,20,0.12)] bg-[rgba(255,255,255,0.7)] px-3 py-1.5 text-[12px] font-semibold text-[#2C3037] backdrop-blur">
                      <Icon className="h-4 w-4" />
                      slate intelligence layer
                    </div>
                  </div>

                  <div className={story.reverse ? 'lg:order-1' : 'lg:order-2'}>
                    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.25 }} className="relative overflow-hidden rounded-[18px] border border-[rgba(20,20,20,0.1)] bg-[rgba(255,255,255,0.62)] p-5 shadow-[0_24px_60px_rgba(16,16,16,0.14)] backdrop-blur-xl">
                      <div className="mb-4 flex items-center justify-between rounded-xl border border-[rgba(20,20,20,0.08)] bg-[rgba(243,244,247,0.82)] px-3 py-2">
                        <TrafficLights size="xs" />
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#646B74]">{story.mockLabel}</span>
                        <span className="text-[11px] font-semibold text-[#6D737C]">live</span>
                      </div>
                      <p className="text-[22px] font-black leading-tight text-[#121317]">{story.mockMain}</p>
                      <p className="mt-2 text-[14px] text-[#555C66]">{story.mockSub}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-[rgba(53,130,255,0.14)] px-3 py-1 text-[11px] font-semibold text-[#3E5D96]">Course layer</span>
                        <span className="rounded-full bg-[rgba(40,200,64,0.14)] px-3 py-1 text-[11px] font-semibold text-[#2E7A52]">Commerce layer</span>
                        <span className="rounded-full bg-[rgba(255,188,46,0.18)] px-3 py-1 text-[11px] font-semibold text-[#7B5E26]">Recommendation layer</span>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </section>
            );
          })}

          <section id="roles" className="scroll-mt-28 border-y border-[rgba(20,20,20,0.08)] bg-[rgba(255,255,255,0.58)] px-4 py-14 backdrop-blur-sm sm:px-6 lg:px-8 lg:py-18">
            <div className="mx-auto w-full max-w-6xl">
              <div className="mb-7 max-w-3xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6A7079]">Interactive Roles</p>
                <h2 className="mt-2 font-[var(--font-dm-sans)] text-[32px] font-black tracking-tight text-[#121317] sm:text-[44px]">
                  One product. Three tailored experiences.
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {ROLE_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveRole(tab)}
                    className={`rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-wide transition-all ${
                      activeRole === tab
                        ? 'bg-[#121317] text-white shadow-[0_8px_25px_rgba(18,19,23,0.25)]'
                        : 'border border-[rgba(20,20,20,0.11)] bg-white text-[#3A4049] hover:-translate-y-0.5'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="mt-5 overflow-hidden rounded-[18px] border border-[rgba(20,20,20,0.1)] bg-[rgba(255,255,255,0.7)] p-5 shadow-[0_24px_60px_rgba(16,16,16,0.12)] backdrop-blur-xl">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeRole}
                    initial={{ opacity: 0, y: 8, x: 20 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, y: -8, x: -20 }}
                    transition={{ duration: 0.28 }}
                    className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]"
                  >
                    <div>
                      <div className="mb-3 flex items-center justify-between rounded-xl border border-[rgba(20,20,20,0.08)] bg-[rgba(243,244,247,0.84)] px-3 py-2">
                        <TrafficLights size="xs" />
                        <span className="text-[11px] font-semibold text-[#686F78]">{ROLE_VIEWS[activeRole].title}</span>
                        <span className="text-[11px] font-semibold text-[#6E747D]">preview</span>
                      </div>

                      <h3 className="text-[29px] font-black leading-tight text-[#131417]">{ROLE_VIEWS[activeRole].title}</h3>
                      <p className="mt-2 text-[15px] leading-relaxed text-[#505660]">{ROLE_VIEWS[activeRole].subtitle}</p>
                      <ul className="mt-4 space-y-2 text-[13px] text-[#49505A]">
                        {ROLE_VIEWS[activeRole].bullets.map((bullet) => (
                          <li key={bullet} className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-[#2AA85E]" />
                            {bullet}
                          </li>
                        ))}
                      </ul>

                      <Link
                        href={`/signup?role=${activeRole}`}
                        className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#121317] px-4 py-2 text-[12px] font-semibold text-white transition-transform active:scale-[0.98]"
                      >
                        Continue as {activeRole}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>

                    <div className="grid gap-3">
                      <div className="rounded-[14px] border border-[rgba(20,20,20,0.08)] bg-[rgba(53,130,255,0.13)] p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#3E5D96]">Signal A</p>
                        <p className="mt-1 text-[20px] font-black text-[#131417]">{ROLE_VIEWS[activeRole].statA}</p>
                      </div>
                      <div className="rounded-[14px] border border-[rgba(20,20,20,0.08)] bg-[rgba(255,188,46,0.18)] p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7A5C26]">Signal B</p>
                        <p className="mt-1 text-[20px] font-black text-[#131417]">{ROLE_VIEWS[activeRole].statB}</p>
                      </div>
                      <div className="rounded-[14px] border border-[rgba(20,20,20,0.08)] bg-[rgba(255,255,255,0.8)] p-4">
                        <p className="text-[13px] font-semibold text-[#2F343B]">Contextual recommendation sample</p>
                        <p className="mt-1 text-[12px] text-[#5A6069]">Headphones for long sessions + charger add-on suggested from usage behavior.</p>
                        <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-[rgba(20,20,20,0.1)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#4A515A]">
                          <Headphones className="h-3 w-3" />
                          accessory recommendation
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </section>

          <section id="flow" className="scroll-mt-28 px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
            <div className="mx-auto w-full max-w-6xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6A7079]">How It Works</p>
              <h2 className="mt-2 font-[var(--font-dm-sans)] text-[32px] font-black tracking-tight text-[#121317] sm:text-[44px]">
                A connected flow, not disconnected tools.
              </h2>

              <div className="mt-7 overflow-x-auto pb-2">
                <div className="flex min-w-[860px] items-center">
                  {FLOW_STEPS.map((step, index) => (
                    <div key={step} className="flex items-center">
                      <div className="min-w-[180px] rounded-[14px] border border-[rgba(20,20,20,0.1)] bg-[rgba(255,255,255,0.76)] px-4 py-3 shadow-[0_12px_30px_rgba(20,20,20,0.1)] backdrop-blur">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A7079]">Step {index + 1}</p>
                        <p className="mt-1 text-[14px] font-bold text-[#131417]">{step}</p>
                      </div>
                      {index < FLOW_STEPS.length - 1 ? (
                        <div className="mx-3 h-[2px] w-16 rounded-full bg-gradient-to-r from-[rgba(20,20,20,0.3)] to-[rgba(20,20,20,0.08)]" />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="benefits" className="scroll-mt-28 border-y border-[rgba(20,20,20,0.08)] bg-[rgba(255,255,255,0.58)] px-4 py-14 backdrop-blur-sm sm:px-6 lg:px-8 lg:py-18">
          <div className="mx-auto grid w-full max-w-6xl gap-7 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6A7079]">Benefits</p>
                <h2 className="mt-2 font-[var(--font-dm-sans)] text-[32px] font-black tracking-tight text-[#121317] sm:text-[44px]">
                  Built to feel effortless.
              </h2>
            </div>

              <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="space-y-3">
                <motion.p variants={item} className="text-[30px] font-black leading-tight tracking-tight text-[#16181C] sm:text-[40px]">Everything you need. Nothing you do not.</motion.p>
                <motion.p variants={item} className="text-[30px] font-black leading-tight tracking-tight text-[#16181C] sm:text-[40px]">One platform. Zero friction.</motion.p>
                <motion.p variants={item} className="text-[20px] font-semibold leading-snug text-[#2D333C] sm:text-[26px]">Courses, commerce, recommendations, multilingual UX, and offline continuity in a single product system.</motion.p>
              </motion.div>
          </div>
        </section>

          <section id="cta" className="scroll-mt-28 px-4 pb-10 pt-12 sm:px-6 lg:px-8 lg:pt-16">
            <div className="mx-auto max-w-6xl rounded-[22px] border border-[rgba(20,20,20,0.1)] bg-[rgba(255,255,255,0.72)] p-6 shadow-[0_30px_90px_rgba(20,20,20,0.16)] backdrop-blur-xl sm:p-9">
              <div className="mb-4 flex items-center justify-between rounded-xl border border-[rgba(20,20,20,0.08)] bg-[rgba(243,244,247,0.84)] px-4 py-2">
              <TrafficLights size="sm" />
                <span className="text-[12px] font-medium text-[#626972]">Slate Platform</span>
                <span className="text-[12px] font-medium text-[#6A717A]">premium mode</span>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                  <h3 className="font-[var(--font-dm-sans)] text-[30px] font-black tracking-tight text-[#121317] sm:text-[42px]">
                    Start building your learning ecosystem today.
                </h3>
                  <p className="mt-2 text-[15px] text-[#505660]">
                    Launch with confidence using one system for learning, commerce, and operational excellence.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/signup"
                    className="inline-flex h-11 items-center gap-1 rounded-full bg-[#121317] px-5 text-[13px] font-semibold text-white transition-transform active:scale-[0.98]"
                >
                    Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                    href="/student/courses/browse"
                    className="inline-flex h-11 items-center gap-1 rounded-full border border-[rgba(20,20,20,0.14)] bg-white px-5 text-[13px] font-semibold text-[#1B1C20] transition-transform active:scale-[0.98]"
                >
                    Explore Demo
                    <Zap className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[rgba(20,20,20,0.08)] bg-[rgba(255,255,255,0.56)] px-4 py-6 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 text-[12px] text-[#545A63] sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright {year} Slate. Crafted for modern learning and commerce.</p>
          <div className="flex items-center gap-4">
            <a href="#features" className="font-semibold text-[#1B1C20]">Features</a>
            <a href="#roles" className="font-semibold text-[#1B1C20]">Roles</a>
            <Link href="/signup" className="font-semibold text-[#1B1C20]">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
