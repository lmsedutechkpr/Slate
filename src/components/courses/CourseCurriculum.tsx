'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Play, FileText, CheckSquare, Paperclip, Radio } from 'lucide-react';

export interface CurriculumLecture {
  id: string;
  title: string;
  title_ta?: string | null;
  type: string;
  duration_mins: number;
  is_free_preview: boolean;
  sort_order: number;
}

export interface CurriculumSection {
  id: string;
  title: string;
  title_ta?: string | null;
  sort_order: number;
  lectures: CurriculumLecture[];
}

export default function CourseCurriculum({ 
  sections, 
  totalLectures, 
  totalDurationMins,
  isStudentView = false
}: { 
  sections: CurriculumSection[];
  totalLectures: number;
  totalDurationMins: number;
  isStudentView?: boolean;
}) {
  // First two sections expanded by default
  const defaultExpanded = sections.slice(0, 2).map(s => s.id);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(defaultExpanded));

  const toggleSection = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedIds(next);
  };

  const expandAll = () => setExpandedIds(new Set(sections.map(s => s.id)));
  const collapseAll = () => setExpandedIds(new Set());

  const t = isStudentView ? {
    textMain: 'text-gray-900',
    textSec: 'text-gray-500',
    textMuted: 'text-gray-400',
    iconDefault: 'text-gray-400',
    iconLive: 'text-red-500',
    bgSection: 'bg-white',
    borderSection: 'border-gray-200',
    hoverSection: 'hover:bg-gray-50',
    borderInner: 'border-gray-100',
    hoverLecture: 'hover:bg-gray-50',
    lecTitleHover: 'group-hover/lec:text-gray-900',
    previewBg: 'bg-green-50 hover:bg-green-100',
    previewText: 'text-green-600',
  } : {
    textMain: 'text-white',
    textSec: 'text-[#8E8E93]',
    textMuted: 'text-[#48484A]',
    iconDefault: 'text-[#48484A]',
    iconLive: 'text-[#FF5F57]',
    bgSection: 'bg-[#111111]',
    borderSection: 'border-[rgba(255,255,255,0.08)]',
    hoverSection: 'hover:bg-[rgba(255,255,255,0.03)]',
    borderInner: 'border-[rgba(255,255,255,0.04)]',
    hoverLecture: 'hover:bg-[rgba(255,255,255,0.02)]',
    lecTitleHover: 'group-hover/lec:text-white',
    previewBg: 'bg-[rgba(40,200,64,0.08)] hover:bg-[rgba(40,200,64,0.15)]',
    previewText: 'text-[#28C840]'
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'video': return <Play className={`w-[14px] h-[14px] ${t.iconDefault}`} />;
      case 'article': return <FileText className={`w-[14px] h-[14px] ${t.iconDefault}`} />;
      case 'quiz': return <CheckSquare className={`w-[14px] h-[14px] ${t.iconDefault}`} />;
      case 'assignment': return <Paperclip className={`w-[14px] h-[14px] ${t.iconDefault}`} />;
      case 'live': return <Radio className={`w-[14px] h-[14px] ${t.iconLive}`} />;
      default: return <FileText className={`w-[14px] h-[14px] ${t.iconDefault}`} />;
    }
  };

  return (
    <div className="mt-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className={`font-sans font-bold text-[22px] ${t.textMain}`}>Course Curriculum</h2>
          <p className={`text-[14px] ${t.textSec} mt-1`}>
            {totalLectures} lectures · {Math.floor(totalDurationMins / 60)}h {totalDurationMins % 60}m total length
          </p>
        </div>
        <div className={`flex items-center gap-4 text-[13px] ${t.textSec}`}>
          <button onClick={expandAll} className={`hover:${t.textMain} transition-colors`}>Expand All</button>
          <span>·</span>
          <button onClick={collapseAll} className={`hover:${t.textMain} transition-colors`}>Collapse All</button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {sections.length === 0 ? (
          <div className={`p-8 text-center border rounded-2xl ${t.borderSection} ${t.bgSection} ${t.textSec} text-[14px]`}>
            Detailed curriculum content is not available for this course yet.
          </div>
        ) : (
          sections.map((section) => {
            const isOpen = expandedIds.has(section.id);
            const sectionLectures = section.lectures || [];
          const sectionDuration = sectionLectures.reduce((acc, curr) => acc + (curr.duration_mins || 0), 0);
          
          return (
            <div key={section.id} className={`${t.bgSection} rounded-2xl overflow-hidden border ${t.borderSection}`}>
              {/* Header trigger */}
              <button 
                onClick={() => toggleSection(section.id)}
                className={`w-full flex items-center justify-between p-4 ${t.hoverSection} transition-colors group text-left`}
              >
                <div className="flex items-center gap-3">
                  {/* Traffic Lights mini */}
                  <div className="flex gap-1">
                     <div className="h-[6px] w-[6px] rounded-full bg-[#FF5F57] opacity-60 group-hover:opacity-100 transition-opacity" />
                     <div className="h-[6px] w-[6px] rounded-full bg-[#FEBC2E] opacity-60 group-hover:opacity-100 transition-opacity" />
                     <div className="h-[6px] w-[6px] rounded-full bg-[#28C840] opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <motion.div
                    animate={{ rotate: isOpen ? -180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className={`h-[14px] w-[14px] ${t.iconDefault}`} />
                  </motion.div>

                  <h3 className={`font-sans font-semibold text-[14px] ${t.textMain}`}>
                    {section.title}
                  </h3>
                </div>

                <div className={`flex items-center gap-3 text-[12px] ${t.textMuted} ml-4 min-w-max hidden sm:flex`}>
                  <span>{sectionLectures.length} lectures</span>
                  <span>{Math.floor(sectionDuration / 60)}h {sectionDuration % 60}m</span>
                </div>
              </button>

              {/* Body */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col">
                      {sectionLectures.map((lecture) => (
                        <div 
                          key={lecture.id} 
                          className={`px-4 py-2.5 border-t ${t.borderInner} flex items-center gap-3 ${t.hoverLecture} transition-colors group/lec`}
                        >
                          {getIcon(lecture.type)}
                          <span className={`text-[13px] ${t.textSec} flex-1 line-clamp-1 ${t.lecTitleHover} transition-colors`}>
                            {lecture.title}
                          </span>
                          
                          <div className="flex items-center gap-2 ml-auto min-w-max">
                             {lecture.is_free_preview && (
                               <button className={`${t.previewBg} ${t.previewText} text-[10px] font-semibold rounded-full px-2 py-0.5 transition-colors mr-2`}>
                                 Preview
                               </button>
                             )}
                             <span className={`text-[11px] ${t.textMuted}`}>
                               {lecture.duration_mins} min
                             </span>
                          </div>
                        </div>
                      ))}
                      {sectionLectures.length === 0 && (
                        <div className={`px-4 py-3 border-t ${t.borderInner} text-[12px] ${t.textMuted} italic`}>
                          No lectures available in this section yet.
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        }))}
      </div>
    </div>
  );
}
