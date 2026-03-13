"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { intervalToDuration, isPast } from "date-fns";
import TrafficLights from "@/components/auth/TrafficLights";
import { createClient } from "@/lib/supabase/client";

interface LiveClass {
  id: string;
  title: string;
  scheduled_at: string;
  status: "scheduled" | "live" | "completed" | "cancelled";
  meeting_url: string;
  actual_attendees: number;
  courses: {
    title: string;
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

  if (!liveClasses || liveClasses.length === 0) {
    return null;
  }

  const getCountdownText = (dateString: string) => {
    const scheduledDate = new Date(dateString);
    if (isPast(scheduledDate)) return null;

    const duration = intervalToDuration({ start: now, end: scheduledDate });

    if (duration.days && duration.days > 0) {
      return <span className="text-gray-500">In {duration.days} days</span>;
    }

    if (duration.hours && duration.hours > 0) {
      return (
        <span className="text-[#FEBC2E]">
          In {duration.hours}h {duration.minutes || 0}m
        </span>
      );
    }

    return (
      <span className="animate-pulse text-[#FF5F57]">
        Starting in {duration.minutes || 0} min
      </span>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-sans text-[18px] font-semibold text-gray-900">
          Upcoming Live Classes
        </h2>
        <a
          href="/student/live"
          className="text-[13px] text-gray-500 transition-colors hover:text-gray-900"
        >
          View all →
        </a>
      </div>

      <div className="flex flex-col gap-3">
        {liveClasses.map((lc) => {
          const isLive = lc.status === "live";

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
                    alt={lc.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-sans text-xl font-bold text-[rgba(255,255,255,0.05)]">
                    {lc.courses.title.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col">
                <span className="line-clamp-1 font-sans text-[14px] font-semibold text-gray-900">
                  {lc.title}
                </span>
                <span className="line-clamp-1 mt-0.5 text-[12px] text-gray-500">
                  {lc.profiles.full_name} &bull; {lc.courses.title}
                </span>

                <div className="mt-1 flex items-center gap-1.5 font-sans text-[12px] font-semibold">
                  {isLive ? (
                    <>
                      <span className="h-[6px] w-[6px] animate-pulse rounded-full bg-[#FF5F57]" />
                      <span className="text-[#FF5F57]">Live now</span>
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
                    Join Now
                  </a>
                ) : (
                  <span className="flex shrink-0 items-center justify-center rounded-full bg-[rgba(40,200,64,0.1)] px-3 py-1 text-[11px] font-semibold text-[#28C840]">
                    Registered
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
