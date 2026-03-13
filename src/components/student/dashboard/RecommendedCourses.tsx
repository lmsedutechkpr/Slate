"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import TrafficLights from "@/components/auth/TrafficLights";

interface RecommendedCourse {
  id: string;
  title: string;
  title_ta: string | null;
  slug: string;
  thumbnail_url: string | null;
  price: number;
  is_free: boolean;
  avg_rating: number;
  difficulty: string;
  categories: {
    name: string;
    color: string | null;
  };
  course_instructors: Array<{
    profiles: {
      full_name: string;
    };
  }>;
}

interface RecommendedCoursesProps {
  courses: RecommendedCourse[];
}

export default function RecommendedCourses({
  courses,
}: RecommendedCoursesProps) {
  const router = useRouter();

  if (!courses || courses.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-sans text-[18px] font-semibold text-gray-900">
          Recommended for You
        </h2>
        <button
          onClick={() => router.push("/student/courses/browse")}
          className="text-[13px] font-medium text-[#8E8E93] hover:text-[#FAFAFA] transition-colors"
        >
          Browse all →
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
        {courses.map((course) => {
          const instructorName =
            course.course_instructors?.[0]?.profiles?.full_name || "Instructor";
          const ratingText = course.avg_rating
            ? Number(course.avg_rating).toFixed(1)
            : "New";

          return (
            <div
              key={course.id}
              onClick={() => router.push(`/student/courses/browse/${course.id}`)}
              className="group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-200 h-[280px] w-[260px] min-w-[260px] cursor-pointer"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
                <div className="absolute left-2.5 top-2.5 z-10 rounded-full bg-[rgba(0,0,0,0.5)] px-2 py-1 backdrop-blur-sm">
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
                  <div className="flex h-full w-full items-center justify-center font-sans text-xl font-bold text-[rgba(255,255,255,0.05)]">
                    {course.title.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Star className="h-[10px] w-[10px] fill-[#FEBC2E] text-[#FEBC2E]" />
                  <span className="font-sans text-[11px] font-bold text-gray-900">
                    {ratingText}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    &bull; {course.difficulty || "All Levels"}
                  </span>
                </div>

                <h3 className="line-clamp-2 font-sans text-[13px] font-semibold text-gray-900 leading-snug">
                  {course.title}
                </h3>

                <p className="mt-1 line-clamp-1 text-[11px] text-gray-500">
                  {instructorName}
                </p>

                <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-100">
                  <span className="font-sans text-[14px] font-bold text-gray-900">
                    {course.is_free ? "Free" : `$${course.price}`}
                  </span>
                  <span className="text-[12px] font-medium text-gray-900 opacity-0 transition-opacity group-hover:opacity-100">
                    Enroll →
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
