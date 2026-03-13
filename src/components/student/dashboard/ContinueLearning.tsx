"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import TrafficLights from "@/components/auth/TrafficLights";
import { createClient } from "@/lib/supabase/client";

interface CourseInstructor {
  profiles: {
    full_name: string;
  };
}

interface Course {
  id: string;
  title: string;
  title_ta: string | null;
  slug: string;
  thumbnail_url: string | null;
  total_lectures: number;
  course_instructors: CourseInstructor[];
}

interface Enrollment {
  id: string;
  progress_pct: number;
  last_accessed_at: string;
  courses: Course;
}

interface ContinueLearningProps {
  initialEnrollments: Enrollment[];
  userId: string;
}

export default function ContinueLearning({
  initialEnrollments,
  userId,
}: ContinueLearningProps) {
  const router = useRouter();
  const [enrollments, setEnrollments] =
    useState<Enrollment[]>(initialEnrollments);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`enrollments-dashboard-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "enrollments",
          filter: `student_id=eq.${userId}`,
        },
        (payload) => {
          setEnrollments((prev) =>
            prev.map((e) =>
              e.id === payload.new.id
                ? { ...e, progress_pct: payload.new.progress_pct }
                : e,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (!enrollments || enrollments.length === 0) {
    return (
      <div className="mt-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-sans text-[18px] font-semibold text-gray-900">
            Continue Learning
          </h2>
        </div>
        <div className="relative rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <div className="absolute left-6 top-6">
            <TrafficLights size="sm" />
          </div>

          <BookOpen className="mx-auto mt-4 h-[28px] w-[28px] text-gray-400" />
          <p className="mt-3 text-[14px] text-gray-500">
            No courses in progress
          </p>
          <button
            onClick={() => router.push("/courses")}
            className="mx-auto mt-4 w-fit rounded-full border border-gray-200 px-5 py-1.5 text-[13px] font-medium text-gray-900 hover:bg-gray-50 transition-colors"
          >
            Browse courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-sans text-[18px] font-semibold text-gray-900">
          Continue Learning
        </h2>
        <button
            onClick={() => router.push("/student/courses/browse")}
            className="bg-white text-black hover:bg-gray-100 font-medium text-[14px] px-6 py-2.5 rounded-full transition-colors inline-block"
        >
          View all →
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {enrollments.map((enrollment) => {
          const course = enrollment.courses;
          const instructorName =
            course.course_instructors?.[0]?.profiles?.full_name || "Instructor";
          const totalLectures = course.total_lectures || 0;
          const lecturesLeft = Math.max(
            0,
            Math.ceil(
              totalLectures - totalLectures * (enrollment.progress_pct / 100),
            ),
          );

          let lastAccessText = "Recently";
          if (enrollment.last_accessed_at) {
            try {
              lastAccessText = formatDistanceToNow(
                new Date(enrollment.last_accessed_at),
                { addSuffix: true },
              );
            } catch {
              // ignore invalid dates
            }
          }

          return (
            <div
              key={enrollment.id}
              onClick={() => router.push(`/student/courses/${course.id}`)}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-[2px] hover:border-gray-300"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
                <div className="absolute left-3 top-3 z-10 rounded-full bg-[rgba(0,0,0,0.5)] px-2 py-1 backdrop-blur-sm">
                  <TrafficLights size="sm" />
                </div>
                {course.thumbnail_url ? (
                  <Image
                    src={course.thumbnail_url}
                    alt={course.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-sans text-4xl font-bold text-[rgba(255,255,255,0.05)]">
                    {course.title.charAt(0)}
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="line-clamp-1 font-sans text-[14px] font-semibold text-gray-900">
                  {course.title}
                </h3>
                <p className="mt-0.5 text-[12px] text-gray-500">
                  {instructorName}
                </p>

                <div className="mt-3">
                  <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100">
                    <motion.div
                      className="h-full rounded-full bg-gray-900"
                      initial={{ width: 0 }}
                      animate={{ width: `${enrollment.progress_pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">
                      {Math.round(enrollment.progress_pct)}% complete
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {lecturesLeft > 0
                        ? `${lecturesLeft} lectures left`
                        : "Completed"}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-[13px] font-medium text-gray-900">
                    Continue →
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {lastAccessText}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
