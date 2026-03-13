/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from 'next/image';
import Link from 'next/link';
import { Users, Globe, RefreshCw, Award, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface DetailHeroProps {
  course: any;
  instructors: any[];
  isStudentView?: boolean;
}

export default function CourseDetailHero({ course, instructors, isStudentView = false }: DetailHeroProps) {
  const publishedAt = course.published_at ? new Date(course.published_at) : new Date();

  return (
    <div className={`w-full py-10 px-6 ${isStudentView ? 'bg-white border-b border-gray-100' : 'bg-[#111111] border-b border-[rgba(255,255,255,0.07)]'}`}>
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-10">
        
        {/* Left Column - Text Content */}
        <div className="flex-1 pr-0 lg:pr-8">
          
          {/* Breadcrumb */}
          <div className={`flex items-center gap-2 text-[13px] font-medium ${isStudentView ? 'text-gray-500' : 'text-[#8E8E93]'}`}>
            {isStudentView ? (
               <Link href="/student/courses/browse" className={`transition-colors ${isStudentView ? 'hover:text-gray-900' : 'hover:text-white'}`}>Courses</Link>
            ) : (
               <Link href="/courses" className={`transition-colors ${isStudentView ? 'hover:text-gray-900' : 'hover:text-white'}`}>Courses</Link>
            )}
            <span>/</span>
            {course.category_slug ? (
               <>
                 <Link href={isStudentView ? `/student/courses/browse?category=${course.category_slug}` : `/courses?category=${course.category_slug}`} className={`text-[13px] transition-colors ${isStudentView ? 'hover:text-gray-900' : 'hover:text-white'}`}>
                   {course.category_name}
                 </Link>
                 <span>/</span>
               </>
            ) : (
               <span className={isStudentView ? 'text-gray-500' : 'text-[#8E8E93]'}>Detail</span>
            )}
            <span className="truncate max-w-[200px]" title={course.title}>
              {course.title}
            </span>
          </div>

          {/* Category Badge */}
          {course.category_name && (
            <div className={`mt-6 inline-flex items-center gap-2 border rounded-full px-3 py-1 text-[12px] ${isStudentView ? 'bg-gray-50 border-gray-200 text-gray-500' : 'bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.06)] text-[#8E8E93]'}`}>
              {course.category_color && (
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: course.category_color }} />
              )}
              {course.language === 'ta' && course.category_name_ta ? course.category_name_ta : course.category_name}
            </div>
          )}

          {/* Title */}
          <h1 className={`font-sans font-bold text-[24px] lg:text-[32px] mt-3 leading-tight ${isStudentView ? 'text-gray-900' : 'text-white'}`}>
            {course.language === 'ta' && course.title_ta ? course.title_ta : course.title}
          </h1>

          {/* Subtitle */}
          {course.subtitle && (
            <p className={`text-[16px] mt-2 max-w-2xl leading-relaxed ${isStudentView ? 'text-gray-600' : 'text-[#8E8E93]'}`}>
              {course.subtitle}
            </p>
          )}

          {/* Stats Row */}
          <div className="mt-5 flex items-center gap-5 flex-wrap">
            {/* Rating */}
            <div className="flex items-center gap-2">
              <span className="text-[#FEBC2E] text-[14px]">★</span>
              <span className="font-bold text-[#FEBC2E] text-[14px]">
                {Number(course.avg_rating || 0).toFixed(1)}
              </span>
              <span className={`text-[13px] ${isStudentView ? 'text-gray-500' : 'text-[#8E8E93]'}`}>
                ({course.total_reviews} ratings)
              </span>
            </div>

            {/* Students */}
            <div className="flex items-center gap-1.5">
              <Users className={`h-[13px] w-[13px] ${isStudentView ? 'text-gray-400' : 'text-[#48484A]'}`} />
              <span className={`text-[13px] ${isStudentView ? 'text-gray-500' : 'text-[#8E8E93]'}`}>{course.total_enrolled} students</span>
            </div>

            {/* Language */}
            <div className="flex items-center gap-1.5">
              <Globe className={`h-[13px] w-[13px] ${isStudentView ? 'text-gray-400' : 'text-[#48484A]'}`} />
              <span className={`text-[13px] ${isStudentView ? 'text-gray-500' : 'text-[#8E8E93]'}`}>
                {course.language === 'ta' ? 'Tamil' : 'English'}
              </span>
            </div>

            {/* Last Updated */}
            <div className="flex items-center gap-1.5">
              <RefreshCw className={`h-[13px] w-[13px] ${isStudentView ? 'text-gray-400' : 'text-[#48484A]'}`} />
              <span className={`text-[13px] ${isStudentView ? 'text-gray-500' : 'text-[#8E8E93]'}`}>
                Updated {formatDistanceToNow(publishedAt)} ago
              </span>
            </div>
          </div>

          {/* Instructor Row */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className={`text-[12px] mr-1 ${isStudentView ? 'text-gray-500' : 'text-[#48484A]'}`}>Created by</span>
            {instructors.map((inst) => (
              <div key={inst.id} className="flex items-center gap-2 mr-3 group cursor-pointer" title={inst.full_name}>
                <div className={`relative h-[26px] w-[26px] rounded-full overflow-hidden ${isStudentView ? 'bg-gray-200' : 'bg-[#1C1C1E]'}`}>
                  {inst.avatar_url ? (
                    <Image src={inst.avatar_url} alt={inst.full_name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-white text-[10px]">
                      {inst.full_name?.charAt(0)}
                    </div>
                  )}
                </div>
                <span className={`text-[13px] group-hover:underline underline-offset-2 ${isStudentView ? 'text-gray-900 text-medium' : 'text-white'}`}>
                  {inst.full_name}
                </span>
              </div>
            ))}
          </div>

          {/* Badges Row */}
          <div className="mt-6 flex flex-wrap gap-2">
            {course.certificate_enabled && (
              <div className="bg-[rgba(254,188,46,0.08)] border border-[#FEBC2E]/15 rounded-full px-3 py-1 flex items-center gap-1.5">
                <Award className="h-[12px] w-[12px] text-[#FEBC2E]" />
                <span className="text-[11px] text-[#FEBC2E] font-medium">Certificate included</span>
              </div>
            )}
            <div className={`border rounded-full px-3 py-1 text-[11px] uppercase tracking-wide font-medium ${isStudentView ? 'bg-gray-50 border-gray-200 text-gray-500' : 'bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.05)] text-[#8E8E93]'}`}>
              {course.difficulty}
            </div>
          </div>

        </div>

        {/* Right Column - Thumbnail (Hidden on mobile as it moves to sidebar wrapper) */}
        <div className="hidden lg:block w-[300px] xl:w-[360px] flex-shrink-0">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#1C1C1E] border border-[rgba(255,255,255,0.08)] shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
            {course.thumbnail_url ? (
              <Image src={course.thumbnail_url} alt="Cover" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-[#48484A] text-4xl opacity-20">
                {course.title.charAt(0)}
              </div>
            )}
            
            {/* Mac Window Overlay */}
            <div className="absolute top-3 left-3 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm rounded-full px-2 py-1 flex gap-1.5 items-center z-10">
              <div className="h-[8px] w-[8px] rounded-full bg-[#FF5F57]" />
              <div className="h-[8px] w-[8px] rounded-full bg-[#FEBC2E]" />
              <div className="h-[8px] w-[8px] rounded-full bg-[#28C840]" />
            </div>

            {/* Play Button */}
            {course.preview_video_url && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <button className="w-14 h-14 rounded-full bg-[rgba(0,0,0,0.7)] backdrop-blur-md border border-[rgba(255,255,255,0.2)] flex items-center justify-center hover:scale-105 transition-transform group">
                  <Play className="h-6 w-6 text-white ml-1 fill-white group-hover:text-[#FEBC2E] group-hover:fill-[#FEBC2E] transition-colors" />
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
