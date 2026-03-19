'use client';

import { BookOpen, ShoppingBag, UserPlus, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import TrafficLights from '@/components/auth/TrafficLights';

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  amount?: number;
  role?: string;
  user?: any;
}

interface RecentActivityFeedProps {
  activities: Activity[];
}

export default function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'enrollment':
        return {
          icon: BookOpen,
          bg: 'bg-[#EFF6FF]',
          color: 'text-[#3B82F6]',
        };
      case 'order':
        return {
          icon: ShoppingBag,
          bg: 'bg-[#EDFAF0]',
          color: 'text-[#28C840]',
        };
      case 'signup':
        return {
          icon: UserPlus,
          bg: 'bg-[#F5F5F7]',
          color: 'text-[#1D1D1F]',
        };
      case 'review':
        return {
          icon: Star,
          bg: 'bg-[#FFF8EC]',
          color: 'text-[#FEBC2E]',
        };
      default:
        return {
          icon: UserPlus,
          bg: 'bg-[#F5F5F7]',
          color: 'text-[#6E6E73]',
        };
    }
  };

  const getRoleBadge = (role?: string) => {
    if (!role) return null;

    const badges: { [key: string]: { bg: string; text: string } } = {
      instructor: { bg: 'bg-[#EFF6FF]', text: 'text-[#3B82F6]' },
      seller: { bg: 'bg-[#F0FDF4]', text: 'text-[#28C840]' },
      student: { bg: 'bg-[#F5F5F7]', text: 'text-[#6E6E73]' },
    };

    const badge = badges[role] || badges.student;

    return (
      <span
        className={`inline-flex rounded-full px-2 py-0.5 font-[DM_Sans] text-[10px] font-semibold uppercase ${badge.bg} ${badge.text}`}
      >
        {role}
      </span>
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
      {/* Titlebar */}
      <div className="flex h-[44px] items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
        <div className="flex items-center gap-3">
          <TrafficLights size="xs" />
          <span className="font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
            Recent Platform Activity
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="divide-y divide-[rgba(0,0,0,0.05)]">
        {activities.length === 0 ? (
          <div className="py-8 text-center">
            <p className="font-[DM_Sans] text-[13px] text-[#AEAEB2]">No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => {
            const iconConfig = getActivityIcon(activity.type);
            const Icon = iconConfig.icon;

            return (
              <div key={activity.id} className="flex items-start gap-3 p-4">
                {/* Icon */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconConfig.bg}`}
                >
                  <Icon className={`h-4 w-4 ${iconConfig.color}`} />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="font-[DM_Sans] text-[13px] text-[#1D1D1F]">
                    {activity.description}
                  </p>

                  {/* Metadata Pills */}
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {activity.role && getRoleBadge(activity.role)}
                    {activity.amount && (
                      <span className="inline-flex rounded-full bg-[#EDFAF0] px-2 py-0.5 font-[DM_Sans] text-[10px] font-semibold text-[#28C840]">
                        ₹{activity.amount.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Timestamp */}
                <span className="shrink-0 font-[DM_Sans] text-[11px] text-[#AEAEB2]">
                  {formatDistanceToNow(new Date(activity.timestamp), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
