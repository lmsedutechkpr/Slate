"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { isToday, isYesterday, parseISO } from "date-fns";
import TrafficLights from "@/components/auth/TrafficLights";

interface StreakWidgetProps {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}

export default function StreakWidget({
  currentStreak,
  longestStreak,
  lastActivityDate,
}: StreakWidgetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getStatus = () => {
    if (!lastActivityDate)
      return {
        text: "Start today!",
        color: "#FF5F57",
        bg: "rgba(255,95,87,0.08)",
      };

    const date = parseISO(lastActivityDate);
    if (isToday(date))
      return {
        text: "Active today",
        color: "#28C840",
        bg: "rgba(40,200,64,0.08)",
      };
    if (isYesterday(date))
      return {
        text: "Keep it going!",
        color: "#FEBC2E",
        bg: "rgba(254,188,46,0.08)",
      };

    return {
      text: "Start today!",
      color: "#FF5F57",
      bg: "rgba(255,95,87,0.08)",
    };
  };

  const status = getStatus();

  // Calculate SVG ring
  const circleRadius = 40;
  const circumference = 2 * Math.PI * circleRadius;
  const nextMilestone = currentStreak >= 30 ? 100 : 30;
  const progressPct =
    currentStreak >= 30
      ? (currentStreak % 100) / 100
      : currentStreak / nextMilestone;
  const strokeDashoffset = circumference - progressPct * circumference;

  let centerColor = "#48484A";
  if (currentStreak >= 30) centerColor = "#FF5F57";
  else if (currentStreak >= 7) centerColor = "#FEBC2E";

  return (
    <div className="relative flex h-full flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6">
      <TrafficLights size="sm" />

      <div className="mt-4 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold tracking-[0.15em] text-gray-400 uppercase">
            Learning Streak
          </span>

          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-sans text-[48px] font-extrabold text-gray-900 leading-none">
              {currentStreak}
            </span>
            <span className="font-sans text-[18px] text-gray-500">days</span>
          </div>

          <span className="mt-1 text-[12px] text-gray-400">
            Longest: {longestStreak} days
          </span>

          <div
            className="mt-3 w-fit rounded-full flex items-center gap-1.5 px-3 py-1"
            style={{ backgroundColor: status.bg }}
          >
            <span
              className="h-[6px] w-[6px] shrink-0 rounded-full"
              style={{ backgroundColor: status.color }}
            />
            <span
              className="whitespace-nowrap text-[12px] font-medium"
              style={{ color: status.color }}
            >
              {status.text}
            </span>
          </div>
        </div>

        <div className="relative flex h-[100px] w-[100px] shrink-0 items-center justify-center">
          <svg
            className="absolute inset-0 h-full w-full -rotate-90 transform"
            viewBox="0 0 100 100"
          >
            <circle
              className="stroke-gray-200"
              strokeWidth="6"
              fill="transparent"
              r={circleRadius}
              cx="50"
              cy="50"
            />
            {mounted && (
              <motion.circle
                className="stroke-gray-900"
                strokeWidth="6"
                strokeLinecap="round"
                fill="transparent"
                r={circleRadius}
                cx="50"
                cy="50"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            )}
          </svg>
          <Flame className="h-[22px] w-[22px]" style={{ color: centerColor }} />
        </div>
      </div>
    </div>
  );
}
