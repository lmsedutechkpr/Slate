import { Radio, Users, Calendar, TrendingUp } from 'lucide-react';

interface StatsRowProps {
  totalSessions: number;
  totalAttendees: number;
  upcomingSessions: number;
  avgAttendees: number;
}

export function LiveStatsRow(stats: StatsRowProps) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {/* Total Sessions */}
      <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
        <div className="flex h-8 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
            <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
            <div className="h-2 w-2 rounded-full bg-[#28C840]" />
          </div>
        </div>
        <div className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <Radio className="h-4 w-4 text-[#AEAEB2]" />
            <span className="text-[12px] font-semibold text-[#6E6E73] uppercase tracking-wider">Total Sessions</span>
          </div>
          <p className="text-[28px] font-bold text-[#1D1D1F] leading-none mb-1">{stats.totalSessions}</p>
        </div>
      </div>

      {/* Total Attendees */}
      <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
        <div className="flex h-8 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
            <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
            <div className="h-2 w-2 rounded-full bg-[#28C840]" />
          </div>
        </div>
        <div className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-[#AEAEB2]" />
            <span className="text-[12px] font-semibold text-[#6E6E73] uppercase tracking-wider">Total Attendees</span>
          </div>
          <p className="text-[28px] font-bold text-[#1D1D1F] leading-none mb-1">{stats.totalAttendees}</p>
        </div>
      </div>

      {/* Upcoming */}
      <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
        <div className="flex h-8 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
            <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
            <div className="h-2 w-2 rounded-full bg-[#28C840]" />
          </div>
        </div>
        <div className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#AEAEB2]" />
            <span className="text-[12px] font-semibold text-[#6E6E73] uppercase tracking-wider">Upcoming</span>
          </div>
          <p className={`text-[28px] font-bold leading-none mb-1 ${stats.upcomingSessions > 0 ? 'text-[#FEBC2E]' : 'text-[#1D1D1F]'}`}>
            {stats.upcomingSessions}
          </p>
        </div>
      </div>

      {/* Avg Attendees */}
      <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
        <div className="flex h-8 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
            <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
            <div className="h-2 w-2 rounded-full bg-[#28C840]" />
          </div>
        </div>
        <div className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#AEAEB2]" />
            <span className="text-[12px] font-semibold text-[#6E6E73] uppercase tracking-wider">Avg Attendees</span>
          </div>
          <p className="text-[28px] font-bold text-[#1D1D1F] leading-none mb-1">{stats.avgAttendees}</p>
        </div>
      </div>
    </div>
  );
}
