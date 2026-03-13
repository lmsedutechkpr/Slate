'use client';

import { useState } from 'react';
import { User, Settings, Shield, AlertTriangle } from 'lucide-react';
import AvatarUpload from './AvatarUpload';
import ProfileForm from './ProfileForm';
import PreferencesForm from './PreferencesForm';
import SecurityForm from './SecurityForm';
import DangerZone from './DangerZone';

interface ProfilePageClientProps {
  profile: any;
  preferences: any;
  stats: any;
  userEmail: string;
  userId: string;
}

type TabId = 'personal' | 'preferences' | 'security' | 'danger';

export default function ProfilePageClient({
  profile,
  preferences,
  stats,
  userEmail,
  userId,
}: ProfilePageClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>('personal');

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '';

  type Tab = { id: TabId; label: string; icon: any; isDanger?: boolean };

  const TABS: Tab[] = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, isDanger: true },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6">

      {/* LEFT COLUMN: Summary & Nav */}
      <div className="w-full lg:w-[280px] flex-shrink-0 space-y-4">
        
        {/* Profile Summary Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
            </div>
            <span className="flex-1 text-center font-semibold text-[13px] text-gray-900 pr-5">My Profile</span>
          </div>

          <div className="p-6 text-center">
            <AvatarUpload
              userId={userId}
              currentUrl={profile?.avatar_url}
              fullName={profile?.full_name ?? 'Student'}
            />

            <h2 className="font-bold text-[18px] text-gray-900 mt-4">{profile?.full_name || 'Student Name'}</h2>
            {profile?.display_name && (
              <p className="text-[13px] text-gray-500 mt-0.5">@{profile.display_name}</p>
            )}
            <p className="text-[13px] text-gray-400 mt-1">{userEmail}</p>

            <div className="mt-3 inline-block bg-gray-100 border border-gray-200 rounded-full px-3 py-1 text-[11px] text-gray-600 uppercase tracking-wide font-semibold">
              Student
            </div>

            <div className="my-5 h-px bg-gray-100" />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                <p className="font-bold text-[20px] text-gray-900">{stats.totalEnrolled}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Courses</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                <p className="font-bold text-[20px] text-gray-900">{stats.completed}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Completed</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                <p className="font-bold text-[20px] text-gray-900">{stats.certificates}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Certificates</p>
              </div>
              <div className="bg-orange-50/50 rounded-xl p-3 text-center border border-orange-100">
                <p className="font-bold text-[20px] text-orange-600">{stats.currentStreak} <span className="text-[16px]">🔥</span></p>
                <p className="text-[11px] text-gray-600 mt-0.5">Day Streak</p>
              </div>
            </div>

            {joinedDate && (
              <p className="text-[11px] text-gray-400 mt-4">Member since {joinedDate}</p>
            )}
          </div>
        </div>

        {/* Nav Tabs */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-2 flex flex-row lg:flex-col overflow-x-auto">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap text-[13px] font-medium ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : tab.isDanger
                      ? 'text-[#FF5F57] hover:bg-red-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${tab.isDanger && !isActive ? 'text-[#FF5F57]' : ''}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: Tab Content */}
      <div className="flex-1 min-w-0">
        {activeTab === 'personal' && (
          <ProfileForm profile={profile} userEmail={userEmail} userId={userId} />
        )}
        {activeTab === 'preferences' && (
          <PreferencesForm preferences={preferences} profile={profile} userId={userId} />
        )}
        {activeTab === 'security' && (
          <SecurityForm userId={userId} />
        )}
        {activeTab === 'danger' && (
          <DangerZone userId={userId} />
        )}
      </div>

    </div>
  );
}
