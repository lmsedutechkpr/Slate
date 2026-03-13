'use client';

import { useState, useEffect } from 'react';
import { Enrollment } from './CourseList';
import { Search } from 'lucide-react';

interface CourseFiltersProps {
  enrollments: Enrollment[];
  onFilterChange: (filtered: Enrollment[]) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function CourseFilters({ enrollments, onFilterChange, activeTab, onTabChange }: CourseFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all_categories');
  const [sortBy, setSortBy] = useState('last_accessed');

  // Compute exact counts matching tabs
  const allCount = enrollments.length;
  const inProgressCount = enrollments.filter(e => e.progress_pct > 0 && e.completed_at === null).length;
  const completedCount = enrollments.filter(e => e.completed_at !== null).length;
  const notStartedCount = enrollments.filter(e => e.progress_pct === 0 && e.completed_at === null).length;

  const categories = Array.from(new Set(enrollments.map(e => e.category_name).filter(Boolean)));

  useEffect(() => {
    let result = [...enrollments];

    // Filter by Tab
    if (activeTab === 'in_progress') {
      result = result.filter(e => e.progress_pct > 0 && e.completed_at === null);
    } else if (activeTab === 'completed') {
      result = result.filter(e => e.completed_at !== null);
    } else if (activeTab === 'not_started') {
      result = result.filter(e => e.progress_pct === 0 && e.completed_at === null);
    }

    // Filter by Category
    if (selectedCategory !== 'all_categories') {
      result = result.filter(e => e.category_name === selectedCategory);
    }

    // Filter by Search Match
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => e.title.toLowerCase().includes(q));
    }

    // Sort Result
    result.sort((a, b) => {
      if (sortBy === 'last_accessed') {
        const da = new Date(a.last_accessed_at || a.enrolled_at).getTime();
        const db = new Date(b.last_accessed_at || b.enrolled_at).getTime();
        return db - da;
      }
      if (sortBy === 'recently_enrolled') {
        return new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime();
      }
      if (sortBy === 'progress_high') {
        return b.progress_pct - a.progress_pct;
      }
      if (sortBy === 'progress_low') {
        return a.progress_pct - b.progress_pct;
      }
      if (sortBy === 'title_az') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    onFilterChange(result);
  }, [enrollments, activeTab, selectedCategory, searchQuery, sortBy]);

  const tabs = [
    { id: 'all', label: 'All', count: allCount },
    { id: 'in_progress', label: 'In Progress', count: inProgressCount },
    { id: 'completed', label: 'Completed', count: completedCount },
    { id: 'not_started', label: 'Not Started', count: notStartedCount }
  ];

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="mt-8 overflow-x-auto pb-2 scrollbar-hide">
        <div className="inline-flex items-center gap-1.5 p-1.5 bg-gray-50/80 border border-gray-200 rounded-2xl">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                {tab.label}
                <span className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                  isActive ? 'bg-gray-100 text-gray-700' : 'bg-gray-200/50 text-gray-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-[15px] w-[15px] text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your courses..."
            className="w-full bg-white border border-gray-200 text-gray-900 text-[13.5px] rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all placeholder:text-gray-400"
          />
        </div>

        {/* Categories & Sort */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto bg-white border border-gray-200 text-gray-700 text-[13px] font-medium rounded-xl px-4 py-2.5 outline-none appearance-none focus:ring-2 focus:ring-gray-100 cursor-pointer pr-10 hover:border-gray-300 transition-colors"
            style={{ backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '10px' }}
          >
            <option value="all_categories">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full sm:w-auto bg-white border border-gray-200 text-gray-700 text-[13px] font-medium rounded-xl px-4 py-2.5 outline-none appearance-none focus:ring-2 focus:ring-gray-100 cursor-pointer pr-10 hover:border-gray-300 transition-colors"
            style={{ backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '10px' }}
          >
            <option value="last_accessed">Last Accessed</option>
            <option value="recently_enrolled">Recently Enrolled</option>
            <option value="progress_high">Progress: High to Low</option>
            <option value="progress_low">Progress: Low to High</option>
            <option value="title_az">Title: A-Z</option>
          </select>
        </div>
      </div>
    </div>
  );
}
