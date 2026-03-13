"use client";

import { Flame, Award, Brain, Lock } from "lucide-react";
import Image from "next/image";
import { useUIStore } from "@/store/useUIStore";

interface Badge {
  id: string;
  name: string;
  name_ta: string | null;
  icon_url: string | null;
  criteria: {
    type?: string;
    description?: string;
    [key: string]: unknown;
  };
}

interface UserBadge {
  earned_at: string;
  badges: Badge;
}

interface BadgesRowProps {
  earnedBadges: UserBadge[];
  allBadges: Badge[];
}

export default function BadgesRow({ earnedBadges, allBadges }: BadgesRowProps) {
  const { language } = useUIStore();
  const earnedCount = earnedBadges?.length || 0;

  if (!allBadges || allBadges.length === 0) return null;

  const earnedMap = new Map(
    earnedBadges?.map((ub) => [ub.badges.id, ub.earned_at]) || [],
  );

  const getBadgeIcon = (type: string, isEarned: boolean) => {
    switch (type) {
      case "streak":
        return (
          <Flame
            className={`mx-auto mt-3 h-[28px] w-[28px] ${isEarned ? "text-[#FEBC2E]" : "text-gray-400"}`}
          />
        );
      case "course_complete":
        return (
          <Award
            className={`mx-auto mt-3 h-[28px] w-[28px] ${isEarned ? "text-[#28C840]" : "text-gray-400"}`}
          />
        );
      case "quiz_pass":
        return (
          <Brain
            className={`mx-auto mt-3 h-[28px] w-[28px] ${isEarned ? "text-[#FEBC2E]" : "text-gray-400"}`}
          />
        );
      default:
        return (
          <Award
            className={`mx-auto mt-3 h-[28px] w-[28px] ${isEarned ? "text-gray-900" : "text-gray-400"}`}
          />
        );
    }
  };

  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-sans text-[18px] font-semibold text-gray-900">
          Achievements
        </h2>
        <span className="text-[13px] text-gray-400">{earnedCount} earned</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {allBadges.map((badge) => {
          const earnedAt = earnedMap.get(badge.id);
          const isEarned = !!earnedAt;
          const name =
            language === "ta" && badge.name_ta ? badge.name_ta : badge.name;
          const criteriaType = badge.criteria?.type || "default";

          return (
            <div
              key={badge.id}
              className={`group relative min-w-[130px] shrink-0 rounded-2xl border p-4 transition-all duration-200 ${
                isEarned
                  ? "border-gray-200 bg-gray-50 hover:-translate-y-1 hover:border-gray-300"
                  : "border-gray-100 opacity-50 hover:opacity-100 cursor-help"
              }`}
            >
              <div className="flex items-center gap-1">
                <span className="h-[5px] w-[5px] rounded-full bg-[#FF5F57]" />
                <span className="h-[5px] w-[5px] rounded-full bg-[#FEBC2E]" />
                <span className="h-[5px] w-[5px] rounded-full bg-[#28C840]" />
              </div>

              {badge.icon_url ? (
                <div className="relative mx-auto mt-3 h-[28px] w-[28px]">
                  <Image
                    src={badge.icon_url}
                    alt={name}
                    fill
                    className={`object-contain ${!isEarned && "grayscale filter"}`}
                  />
                </div>
              ) : (
                getBadgeIcon(criteriaType, isEarned)
              )}

              <h3
                className={`mt-2 text-center font-sans text-[11px] ${isEarned ? "font-semibold text-gray-900" : "text-gray-400"}`}
              >
                {name}
              </h3>

              <div className="mt-1 text-center">
                {isEarned ? (
                  <span className="text-[10px] text-gray-400">
                    {new Date(earnedAt).toLocaleDateString(undefined, {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                ) : (
                  <Lock className="mx-auto h-[12px] w-[12px] text-gray-400" />
                )}
              </div>

              {/* Tooltip on hover for unearned */}
              {!isEarned && (
                <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-100 px-2 py-1 text-[10px] text-gray-500 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-10">
                  {badge.criteria?.description || `Requires ${criteriaType}`}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
