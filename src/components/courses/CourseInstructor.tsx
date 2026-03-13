/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Users, BookOpen, Award, Globe, Linkedin, Star, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export default function CourseInstructor({ instructors, isStudentView = false }: { instructors: any[], isStudentView?: boolean }) {
  if (!instructors || instructors.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className={`font-sans font-bold text-[22px] ${isStudentView ? 'text-gray-900' : 'text-white'}`}>Your Instructor{instructors.length > 1 ? 's' : ''}</h2>
      
      <div className="mt-5 flex flex-col gap-5">
        {instructors.map((instRow) => {
          const inst = instRow.profiles;
          const stats = instRow.instructor_profiles;
          if (!inst) return null;

          return (
            <InstructorCard key={inst.id} inst={inst} stats={stats} isStudentView={isStudentView} />
          );
        })}
      </div>
    </div>
  );
}

function InstructorCard({ inst, stats, isStudentView = false }: { inst: any, stats?: any, isStudentView?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  // We need basic stats fallback if instructor_profiles missing
  const rs = stats || {
    headline: 'Instructor',
    expertise_tags: [],
    avg_rating: 0,
    total_students: 0,
    total_courses: 0,
    total_completions: 0
  };

  const t = isStudentView ? {
    bgCard: 'bg-white',
    borderCard: 'border-gray-200 shadow-sm',
    bgAvatarFrame: 'bg-gray-100',
    borderAvatar: 'border-gray-200',
    avatarEmptyColor: 'text-gray-400',
    textMain: 'text-gray-900',
    textSec: 'text-gray-500',
    textMuted: 'text-gray-400',
    iconColor: 'text-gray-400',
    linkHover: 'hover:text-gray-900',
    tagBg: 'bg-gray-100',
    tagBorder: 'border-gray-200',
  } : {
    bgCard: 'bg-[#111111]',
    borderCard: 'border-[rgba(255,255,255,0.08)]',
    bgAvatarFrame: 'bg-[#1C1C1E]',
    borderAvatar: 'border-[rgba(255,255,255,0.1)]',
    avatarEmptyColor: 'text-[#48484A]',
    textMain: 'text-white',
    textSec: 'text-[#8E8E93]',
    textMuted: 'text-[#48484A]',
    iconColor: 'text-[#48484A]',
    linkHover: 'hover:text-white',
    tagBg: 'bg-[#1C1C1E]',
    tagBorder: 'border-[rgba(255,255,255,0.06)]',
  };

  return (
    <div className={`${t.bgCard} rounded-2xl p-6 border ${t.borderCard} relative`}>
      {/* Traffic Lights */}
      <div className="absolute top-4 left-4 flex gap-1.5 items-center">
        <div className="h-[8px] w-[8px] rounded-full bg-[#FF5F57]" />
        <div className="h-[8px] w-[8px] rounded-full bg-[#FEBC2E]" />
        <div className="h-[8px] w-[8px] rounded-full bg-[#28C840]" />
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-5">
        {/* Avatar */}
        <div className={`relative h-[72px] w-[72px] shrink-0 rounded-full overflow-hidden border ${t.borderAvatar} ${t.bgAvatarFrame}`}>
          {inst.avatar_url ? (
            <Image src={inst.avatar_url} alt={inst.full_name} fill className="object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center font-bold overflow-hidden ${t.avatarEmptyColor} text-[24px]`}>
              {inst.full_name?.charAt(0)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <Link href={`#`} className="inline-block hover:underline underline-offset-4">
            <h3 className={`font-sans font-bold text-[18px] ${t.textMain}`}>{inst.full_name}</h3>
          </Link>
          <p className={`text-[13px] ${t.textSec} mt-0.5`}>{rs.headline}</p>

          <div className="flex flex-wrap items-center gap-4 mt-3">
             <div className="flex items-center gap-1.5">
               <Star className="w-[14px] h-[14px] text-[#FEBC2E] fill-[#FEBC2E]" />
               <span className={`text-[13px] font-semibold ${t.textMain}`}>{Number(rs.avg_rating || 0).toFixed(1)}</span>
             </div>
             <div className="flex items-center gap-1.5">
               <Users className={`w-[14px] h-[14px] ${t.iconColor}`} />
               <span className={`text-[13px] ${t.textSec}`}>{rs.total_students} students</span>
             </div>
             <div className="flex items-center gap-1.5">
               <BookOpen className={`w-[14px] h-[14px] ${t.iconColor}`} />
               <span className={`text-[13px] ${t.textSec}`}>{rs.total_courses} courses</span>
             </div>
             <div className="flex items-center gap-1.5">
               <Award className={`w-[14px] h-[14px] ${t.iconColor}`} />
               <span className={`text-[13px] ${t.textSec}`}>{rs.total_completions} completions</span>
             </div>
          </div>
        </div>
      </div>

      {inst.bio && (
        <div className="mt-5">
          <div className={`text-[14px] ${t.textSec} leading-relaxed relative ${expanded ? '' : 'line-clamp-3'}`}>
            {inst.bio}
          </div>
          <button 
            onClick={() => setExpanded(!expanded)}
            className={`text-[13px] font-medium ${t.textMain} ${t.linkHover} mt-2 flex items-center gap-1 transition-colors`}
          >
            {expanded ? 'Show less' : 'Show more'}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}

      {(rs.expertise_tags || inst.website_url || inst.linkedin_url) && (
        <div className={`mt-5 pt-5 border-t ${t.borderAvatar} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
          <div className="flex flex-wrap gap-2">
            {rs.expertise_tags?.slice(0, 4).map((tag: string) => (
               <div key={tag} className={`${t.tagBg} border ${t.tagBorder} rounded-full px-3 py-1 text-[12px] ${t.textSec}`}>
                 {tag}
               </div>
            ))}
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {inst.website_url && (
              <a href={inst.website_url} target="_blank" rel="noreferrer" className={`${t.iconColor} ${t.linkHover} transition-colors`}>
                <Globe className="w-[18px] h-[18px]" />
              </a>
            )}
            {inst.linkedin_url && (
              <a href={inst.linkedin_url} target="_blank" rel="noreferrer" className={`${t.iconColor} ${t.linkHover} transition-colors`}>
                <Linkedin className="w-[18px] h-[18px]" />
              </a>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
