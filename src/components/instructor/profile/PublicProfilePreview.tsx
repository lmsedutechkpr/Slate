'use client';

import { Star, X, Globe, Linkedin, Youtube, Github, Instagram, Twitter } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  instructorProfile: any;
  stats: any;
}

const SOCIAL_ICONS: Record<string, any> = { website: Globe, linkedin: Linkedin, youtube: Youtube, twitter: Twitter, github: Github, instagram: Instagram };

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= Math.round(rating) ? 'text-[#FEBC2E] fill-[#FEBC2E]' : 'text-[#AEAEB2]'}`}
        />
      ))}
    </div>
  );
}

export default function PublicProfilePreview({ isOpen, onClose, profile, instructorProfile: ip, stats }: Props) {
  if (!isOpen) return null;

  const sl = ip?.social_links || {};
  const socialLinks = Object.entries(sl).filter(([, v]) => v);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* TITLEBAR */}
        <div className="h-[44px] flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
              <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
              <div className="h-2 w-2 rounded-full bg-[#28C840]" />
            </div>
            <span className="font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F]">Public Profile Preview</span>
            <span className="text-[12px] text-[#AEAEB2] ml-1">— This is how students see you</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[rgba(0,0,0,0.06)] text-[#6E6E73] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SCROLL CONTENT */}
        <div className="overflow-y-auto flex-1">
          <div className="p-6">

            {/* HERO */}
            <div className="flex items-start gap-6 pb-6 border-b border-[rgba(0,0,0,0.08)] flex-wrap">
              <div className="w-20 h-20 rounded-full bg-[#F5F5F7] overflow-hidden border-2 border-[rgba(0,0,0,0.08)] flex-shrink-0 flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-[28px] text-[#AEAEB2]">
                    {(profile?.full_name || 'I').slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-[DM_Sans] font-bold text-[24px] text-[#1D1D1F] leading-tight">
                  {profile?.full_name || 'Instructor'}
                </h2>
                {ip?.headline && (
                  <p className="text-[15px] text-[#6E6E73] mt-1">{ip.headline}</p>
                )}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <StarRow rating={stats.avgRating} />
                    <span className="font-bold text-[13px] text-[#1D1D1F]">{stats.avgRating.toFixed(1)}</span>
                    <span className="text-[12px] text-[#AEAEB2]">({stats.totalReviews} reviews)</span>
                  </div>
                  <span className="text-[#AEAEB2]">·</span>
                  <span className="text-[12px] text-[#6E6E73]">{stats.totalStudents.toLocaleString('en-IN')} students</span>
                </div>
                {/* Teaching languages */}
                {ip?.teaching_languages?.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {ip.teaching_languages.map((l: string) => (
                      <span key={l} className="bg-[#F5F5F7] rounded-full px-3 py-1 text-[11px] text-[#6E6E73] font-medium">
                        {l === 'en' ? 'English' : l === 'ta' ? 'தமிழ்' : l}
                      </span>
                    ))}
                  </div>
                )}
                {/* Social icons */}
                {socialLinks.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {socialLinks.map(([key, url]) => {
                      const Icon = SOCIAL_ICONS[key] || Globe;
                      return (
                        <a key={key} href={String(url)} target="_blank" rel="noopener noreferrer"
                          className="w-8 h-8 rounded-xl bg-[#F5F5F7] flex items-center justify-center hover:bg-[rgba(0,0,0,0.07)] transition-colors">
                          <Icon className="w-4 h-4 text-[#6E6E73]" />
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* BIO */}
            {(profile?.bio || ip?.bio) && (
              <div className="mt-6">
                <h3 className="font-[DM_Sans] font-bold text-[16px] text-[#1D1D1F] mb-3">About</h3>
                <p className="text-[14px] text-[#6E6E73] leading-relaxed">{profile?.bio || ip?.bio}</p>
              </div>
            )}

            {/* EXPERTISE */}
            {ip?.expertise_tags?.length > 0 && (
              <div className="mt-6">
                <h3 className="font-[DM_Sans] font-bold text-[16px] text-[#1D1D1F] mb-3">Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {ip.expertise_tags.map((tag: string) => (
                    <span key={tag} className="bg-[#F5F5F7] rounded-full px-3 py-1 text-[12px] text-[#6E6E73]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* STATS */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              {[
                { label: 'Courses', value: stats.totalCourses },
                { label: 'Students', value: stats.totalStudents.toLocaleString('en-IN') },
                { label: 'Reviews', value: stats.totalReviews },
              ].map(s => (
                <div key={s.label} className="bg-[#F5F5F7] rounded-xl p-4 text-center">
                  <div className="font-[DM_Sans] font-bold text-[20px] text-[#1D1D1F]">{s.value}</div>
                  <div className="text-[12px] text-[#AEAEB2] mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
