"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { intervalToDuration, isPast } from "date-fns";
import TrafficLights from "@/components/auth/TrafficLights";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";

interface LiveClass {
  id: string;
  title: string;
  title_ta: string | null;
  scheduled_at: string;
  duration_mins: number;
  status: "scheduled" | "live" | "completed" | "cancelled";
  meeting_url: string;
  actual_attendees: number;
  courses: {
    title: string;
    title_ta: string | null;
    thumbnail_url: string | null;
  };
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface UpcomingLiveProps {
  initialLiveClasses: LiveClass[];
}

export default function UpcomingLive({
  initialLiveClasses,
}: UpcomingLiveProps) {
  const [liveClasses, setLiveClasses] =
    useState<LiveClass[]>(initialLiveClasses);
  const [now, setNow] = useState(new Date());
  const t = useTranslations("student");

  // Update timer strictly for UI countdowns
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000); // refresh every minute
    return () => clearInterval(timer);
  }, []);

  // Supabase Real-time connection for status updates
  useEffect(() => {
    if (!initialLiveClasses || initialLiveClasses.length === 0) return;
    const supabase = createClient();

    const channel = supabase
      .channel("live-dashboard")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_classes",
        },
        (payload) => {
          setLiveClasses((prev) =>
            prev.map((lc) =>
              lc.id === payload.new.id
                ? { ...lc, status: payload.new.status }
                : lc,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialLiveClasses]);

  const activeClasses = liveClasses.filter((lc) => {
    const startObj = new Date(lc.scheduled_at);
    const endObj = new Date(startObj.getTime() + (lc.duration_mins || 60) * 60000);
    return now <= endObj && lc.status !== "cancelled" && lc.status !== "completed";
  });

  if (!activeClasses || activeClasses.length === 0) {
    return null;
  }

  const getCountdownText = (dateString: string) => {
    const scheduledDate = new Date(dateString);
    if (isPast(scheduledDate)) return null;

    const duration = intervalToDuration({ start: now, end: scheduledDate });

    if (duration.days && duration.days > 0) {
      return <span className="text-gray-500">{t("inDays", { count: duration.days })}</span>;
    }

    if (duration.hours && duration.hours > 0) {
      return (
        <span className="text-[#FEBC2E]">
          {t("inHoursMins", { hours: duration.hours, mins: duration.minutes || 0 })}
        </span>
      );
    }

    return (
      <span className="animate-pulse text-[#FF5F57]">
        {t("startingIn", { count: duration.minutes || 0 })}
      </span>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-sans text-[18px] font-semibold text-gray-900">
          {t("upcomingLive")}
        </h2>
        <a
          href="/student/live"
          className="text-[13px] text-gray-500 transition-colors hover:text-gray-900"
        >
          {t("viewAll")}
        </a>
      </div>

      <div className="flex flex-col gap-3">
        {activeClasses.map((lc) => {
          const startObj = new Date(lc.scheduled_at);
          const endObj = new Date(startObj.getTime() + (lc.duration_mins || 60) * 60000);
          const isTimeLive = now >= startObj && now <= endObj;
          const isLive = lc.status === "live" || isTimeLive;
          
          const localLang = t("dashboard") === "டாஷ்போர்டு" ? "ta" : "en";
          const displayCourseTitle = localLang === "ta" && lc.courses.title_ta ? lc.courses.title_ta : lc.courses.title;
          const displayLiveTitle = localLang === "ta" && lc.title_ta ? lc.title_ta : lc.title;

          return (
            <div
              key={lc.id}
              className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
            >
              <div className="mr-2">
                <TrafficLights size="sm" />
              </div>

              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                {lc.courses.thumbnail_url ? (
                  <Image
                    src={lc.courses.thumbnail_url}
                    alt={displayCourseTitle}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-sans text-xl font-bold text-[rgba(255,255,255,0.05)]">
                    {displayCourseTitle.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col">
                <span className="line-clamp-1 font-sans text-[14px] font-semibold text-gray-900">
                  {displayLiveTitle}
                </span>
                <span className="line-clamp-1 mt-0.5 text-[12px] text-gray-500">
                  {lc.profiles.full_name} &bull; {displayCourseTitle}
                </span>

                <div className="mt-1 flex items-center gap-1.5 font-sans text-[12px] font-semibold">
                  {isLive ? (
                    <>
                      <span className="h-[6px] w-[6px] animate-pulse rounded-full bg-[#FF5F57]" />
                      <span className="text-[#FF5F57]">{t("liveNow")}</span>
                    </>
                  ) : (
                    getCountdownText(lc.scheduled_at)
                  )}
                </div>
              </div>

              <div className="shrink-0">
                {isLive ? (
                  <a
                    href={lc.meeting_url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex shrink-0 items-center justify-center rounded-full bg-[#FF5F57] px-4 py-1.5 text-[12px] font-semibold text-gray-900 transition-colors hover:bg-[#E5483D]"
                  >
                    {t("joinNowBtn")}
                  </a>
                ) : (
                  <span className="flex shrink-0 items-center justify-center rounded-full bg-[rgba(40,200,64,0.1)] px-3 py-1 text-[11px] font-semibold text-[#28C840]">
                    {t("registered")}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
