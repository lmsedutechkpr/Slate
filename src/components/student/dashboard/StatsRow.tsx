"use client";

import { useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { BookOpen, CheckCircle2, Clock, Flame } from "lucide-react";

interface StatsRowProps {
  enrolled: number;
  completed: number;
  totalHours: number;
  streakDays: number;
}

function StatCard({
  value,
  label,
  icon: Icon,
  iconColor = "#48484A",
}: {
  value: number;
  label: string;
  icon: React.ElementType;
  iconColor?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      const duration = 1200; // 1.2s
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // easeOutQuart
        const easeObj = 1 - Math.pow(1 - progress, 4);

        setDisplayValue(Math.floor(easeObj * value));

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayValue(value);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isInView, value]);

  return (
    <div
      ref={ref}
      className="relative rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:border-gray-300"
    >
      <div className="flex items-center gap-1">
        <span className="h-[6px] w-[6px] rounded-full bg-[#FF5F57]" />
        <span className="h-[6px] w-[6px] rounded-full bg-[#FEBC2E]" />
        <span className="h-[6px] w-[6px] rounded-full bg-[#28C840]" />
      </div>

      <div className="mt-4">
        <div className="font-sans text-[32px] font-extrabold text-gray-900">
          {displayValue}
        </div>
        <div className="mt-1 text-[12px] font-semibold uppercase tracking-[0.1em] text-gray-400">
          {label}
        </div>
      </div>

      <Icon
        className="absolute right-5 top-5 h-[18px] w-[18px]"
        style={{ color: iconColor }}
      />
    </div>
  );
}

import { useTranslations } from "next-intl";

export default function StatsRow({
  enrolled,
  completed,
  totalHours,
  streakDays,
}: StatsRowProps) {
  const t = useTranslations("student");
  let streakColor = "#48484A";
  if (streakDays >= 30) streakColor = "#FF5F57";
  else if (streakDays >= 7) streakColor = "#FEBC2E";

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard value={enrolled} label={t("enrolledCourses")} icon={BookOpen} />
      <StatCard value={completed} label={t("completed")} icon={CheckCircle2} />
      <StatCard value={totalHours} label={t("hoursWatched")} icon={Clock} />
      <StatCard
        value={streakDays}
        label={t("dayStreak")}
        icon={Flame}
        iconColor={streakColor}
      />
    </div>
  );
}
