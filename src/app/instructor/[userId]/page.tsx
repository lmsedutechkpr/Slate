import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import {
  Star, Users, BookOpen, Globe, Linkedin, Youtube, Github, Instagram, Twitter,
} from 'lucide-react';

const SOCIAL_ICONS: Record<string, any> = {
  website: Globe, linkedin: Linkedin, youtube: Youtube,
  twitter: Twitter, github: Github, instagram: Instagram,
};

function adminDb() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const db = adminDb();
  const { data: p } = await db.from('profiles').select('full_name').eq('id', userId).single();
  return {
    title: p?.full_name ? `${p.full_name} – Slate Instructor` : 'Instructor Profile',
  };
}

export default async function PublicInstructorProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const db = adminDb();

  // ── Parallel fetch ──
  const [profileRes, ipRes, coursesRes] = await Promise.all([
    db.from('profiles').select('id, full_name, display_name, avatar_url, bio, city').eq('id', userId).single(),
    db.from('instructor_profiles').select('*').eq('user_id', userId).single(),
    db.from('course_instructors')
      .select('courses(id, title, thumbnail_url, discounted_price, price, status)')
      .eq('instructor_id', userId),
  ]);

  if (!profileRes.data || profileRes.error) notFound();

  const profile = profileRes.data;
  const ip = ipRes.data;

  // Published courses only
  const allCourses = (coursesRes.data || [])
    .map((r: any) => r.courses)
    .filter((c: any) => c && c.status === 'published');

  const totalReviews = ip?.total_students ?? 0; // approx

  const sl = ip?.social_links || {};
  const socialEntries = [
    ['website', ip?.website_url || sl.website],
    ['linkedin', ip?.linkedin_url || sl.linkedin],
    ['youtube', sl.youtube],
    ['twitter', sl.twitter],
    ['github', sl.github],
    ['instagram', sl.instagram],
  ].filter(([, url]) => url) as [string, string][];

  const bio = ip?.bio || profile.bio || '';
  const avgRating = ip?.avg_rating ?? 0;

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-[DM_Sans]">
      {/* NAV */}
      <div className="bg-white border-b border-[rgba(0,0,0,0.08)] px-6 py-4 flex items-center gap-3">
        <a href="/" className="font-bold text-[18px] text-[#1D1D1F] tracking-tight">Slate</a>
        <span className="text-[#AEAEB2]">/</span>
        <span className="text-[13px] text-[#6E6E73]">Instructor</span>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">

        {/* HERO CARD */}
        <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm overflow-hidden">
          {/* Mac titlebar */}
          <div className="h-[44px] flex items-center gap-1.5 px-5 bg-[#F5F5F7] border-b border-[rgba(0,0,0,0.06)]">
            <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
            <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
            <div className="h-2 w-2 rounded-full bg-[#28C840]" />
          </div>

          <div className="p-8 flex items-start gap-6 flex-wrap">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-[#F5F5F7] overflow-hidden border-2 border-[rgba(0,0,0,0.08)] flex-shrink-0 flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-[36px] text-[#AEAEB2]">
                  {(profile.full_name || 'I').slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-bold text-[26px] text-[#1D1D1F]">{profile.full_name}</h1>
                {ip?.is_verified && (
                  <span className="bg-[#EDFAF0] text-[#28C840] text-[11px] font-semibold rounded-full px-2.5 py-0.5 flex items-center gap-1">
                    ✓ Verified
                  </span>
                )}
              </div>
              {ip?.headline && (
                <p className="text-[16px] text-[#6E6E73] mt-1">{ip.headline}</p>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-4 mt-3 flex-wrap text-[13px] text-[#6E6E73]">
                {avgRating > 0 && (
                  <div className="flex items-center gap-1.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(avgRating) ? 'text-[#FEBC2E] fill-[#FEBC2E]' : 'text-[#AEAEB2]'}`} />
                    ))}
                    <span className="font-bold text-[#1D1D1F] ml-1">{avgRating.toFixed(1)}</span>
                    <span className="text-[#AEAEB2] text-[12px]">rating</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {(ip?.total_students || 0).toLocaleString('en-IN')} students
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {allCourses.length} course{allCourses.length !== 1 ? 's' : ''}
                </div>
                {profile.city && (
                  <span>{profile.city}</span>
                )}
              </div>

              {/* Languages */}
              {ip?.teaching_languages?.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {ip.teaching_languages.map((l: string) => (
                    <span key={l} className="bg-[#F5F5F7] rounded-full px-3 py-1 text-[11px] text-[#6E6E73] font-medium border border-[rgba(0,0,0,0.06)]">
                      {l === 'en' ? '🇬🇧 English' : l === 'ta' ? '🇮🇳 தமிழ்' : l}
                    </span>
                  ))}
                </div>
              )}

              {/* Social links */}
              {socialEntries.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {socialEntries.map(([key, url]) => {
                    const Icon = SOCIAL_ICONS[key] || Globe;
                    return (
                      <a
                        key={key}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-xl bg-[#F5F5F7] flex items-center justify-center hover:bg-[rgba(0,0,0,0.07)] transition-colors border border-[rgba(0,0,0,0.06)]"
                      >
                        <Icon className="w-4 h-4 text-[#6E6E73]" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BIO */}
        {bio && (
          <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm overflow-hidden">
            <div className="h-[44px] flex items-center gap-3 px-5 bg-[#F5F5F7] border-b border-[rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
                <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
                <div className="h-2 w-2 rounded-full bg-[#28C840]" />
              </div>
              <span className="font-semibold text-[13px] text-[#1D1D1F]">About</span>
            </div>
            <div className="p-6">
              <p className="text-[14px] text-[#6E6E73] leading-relaxed whitespace-pre-line">{bio}</p>
            </div>
          </div>
        )}

        {/* EXPERTISE */}
        {ip?.expertise_tags?.length > 0 && (
          <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm overflow-hidden">
            <div className="h-[44px] flex items-center gap-3 px-5 bg-[#F5F5F7] border-b border-[rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
                <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
                <div className="h-2 w-2 rounded-full bg-[#28C840]" />
              </div>
              <span className="font-semibold text-[13px] text-[#1D1D1F]">Expertise</span>
            </div>
            <div className="p-6 flex flex-wrap gap-2">
              {ip.expertise_tags.map((tag: string) => (
                <span key={tag} className="bg-[#F5F5F7] rounded-full px-3 py-1.5 text-[12px] text-[#6E6E73] border border-[rgba(0,0,0,0.06)]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* COURSES */}
        {allCourses.length > 0 && (
          <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm overflow-hidden">
            <div className="h-[44px] flex items-center gap-3 px-5 bg-[#F5F5F7] border-b border-[rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
                <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
                <div className="h-2 w-2 rounded-full bg-[#28C840]" />
              </div>
              <span className="font-semibold text-[13px] text-[#1D1D1F]">
                Courses by {profile.full_name?.split(' ')[0]}
              </span>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allCourses.slice(0, 6).map((c: any) => (
                <a
                  key={c.id}
                  href={`/courses/${c.id}`}
                  className="group rounded-xl border border-[rgba(0,0,0,0.08)] overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-video bg-[#F5F5F7] overflow-hidden">
                    {c.thumbnail_url ? (
                      <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-[#AEAEB2]" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-[13px] text-[#1D1D1F] line-clamp-2">{c.title}</p>
                    <p className="text-[12px] text-[#28C840] font-bold mt-1">
                      {c.discounted_price != null ? `₹${c.discounted_price}` : c.price ? `₹${c.price}` : 'Free'}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
