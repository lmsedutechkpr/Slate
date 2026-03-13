'use client';

import { BookOpen, Play, Award, Clock } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  tab: string;
}

export default function EmptyState({ tab }: EmptyStateProps) {
  
  const content = (() => {
    switch (tab) {
      case 'in_progress':
        return {
          icon: <Play className="w-9 h-9 text-gray-400 mx-auto" />,
          title: "No courses in progress",
          desc: "All caught up! Or start a new course."
        };
      case 'completed':
        return {
          icon: <Award className="w-9 h-9 text-gray-400 mx-auto" />,
          title: "No completed courses yet",
          desc: "Keep going — you're getting closer!"
        };
      case 'not_started':
        return {
          icon: <Clock className="w-9 h-9 text-gray-400 mx-auto" />,
          title: "All courses started!",
          desc: "Great momentum — keep it up."
        };
      case 'all':
      default:
        return {
          icon: <BookOpen className="w-9 h-9 text-gray-400 mx-auto" />,
          title: "You haven't enrolled in any courses yet",
          desc: "Find something you love and start learning today.",
          showButton: true
        };
    }
  })();

  return (
    <div className="col-span-full mt-6 bg-white border border-gray-200 rounded-3xl p-12 text-center shadow-sm relative overflow-hidden">
      
      {/* Mac Window Dots */}
      <div className="absolute top-4 left-4 flex items-center gap-1.5 opacity-60">
        <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]"></div>
      </div>

      <div className="mt-6 mb-2">
        {content.icon}
      </div>
      
      <h3 className="text-[18px] font-bold text-gray-900 mt-4 tracking-tight">
        {content.title}
      </h3>
      
      <p className="text-[14px] text-gray-500 mt-2 font-medium">
        {content.desc}
      </p>

      {content.showButton && (
        <div className="mt-8">
          <Link 
            href="/student/courses/browse"
            className="inline-flex items-center justify-center bg-gray-900 border border-gray-900 text-white font-medium text-[14px] px-5 py-2.5 rounded-full hover:bg-black transition-colors shadow-md shadow-gray-200"
          >
            Browse Courses
          </Link>
        </div>
      )}
    </div>
  );
}
