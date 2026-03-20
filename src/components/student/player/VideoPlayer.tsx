import { useState, useRef, useEffect } from 'react';
import { PlayCircle, SkipBack, SkipForward, Maximize } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { markLectureCompleteAction } from '@/app/actions/progress';
import { getOfflineVideoSource, hasOfflineAccess } from '@/lib/offlineVideo';

interface VideoPlayerProps {
  lecture: any;
  enrollmentId: string;
  userId: string;
  savedProgress: number;
  autoplay: boolean;
  playbackSpeed: number;
  onComplete: () => void;
  onProgressChange: (secs: number) => void;
}

export default function VideoPlayer({
  lecture,
  enrollmentId,
  userId,
  savedProgress,
  autoplay,
  playbackSpeed,
  onComplete,
  onProgressChange
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [currentSecs, setCurrentSecs] = useState(savedProgress || 0);
  const [speed, setSpeed] = useState(playbackSpeed || 1);
  const totalSecs = lecture.video_duration_secs || 300; // Mock 5 min if not provided
  
  const videoPlayerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [offlineBlocked, setOfflineBlocked] = useState(false);
  const [offlineSource, setOfflineSource] = useState<string | null>(null);

  useEffect(() => {
    const handleStatus = async () => {
      const offlineNow = !navigator.onLine;
      setIsOffline(offlineNow);
      if (!offlineNow) {
        setOfflineBlocked(false);
        setOfflineSource(null);
        return;
      }

      const allowed = hasOfflineAccess(userId, String(lecture.id));
      setOfflineBlocked(!allowed);
      if (!allowed) {
        setOfflineSource(null);
        return;
      }

      const source = await getOfflineVideoSource(userId, String(lecture.id));
      setOfflineSource(source);
    };

    handleStatus();
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, [userId, lecture.id]);

  // Sync Video Speed to Database Prefs
  const handleSpeedChange = async () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(speed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setSpeed(nextSpeed);

    // Save to prefs silently
    await supabase.from('user_preferences').update({ playback_speed: nextSpeed }).eq('user_id', userId);
  };

  const handleFullscreen = () => {
    if (videoPlayerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoPlayerRef.current.requestFullscreen();
      }
    }
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // MOCK VIDEO LOGIC (Since we don't have real `.mp4` URLs seeded, we simulate playback)
  useEffect(() => {
    if (isPlaying && currentSecs < totalSecs) {
      progressInterval.current = setInterval(() => {
        setCurrentSecs(prev => {
          const next = prev + 1;
          if (next >= totalSecs) {
            return totalSecs;
          }
          return next;
        });
      }, 1000);
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current);
    }

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPlaying, currentSecs, totalSecs]);

  // Handle completion external to the raw state updater loop to avoid React render conflicts
  useEffect(() => {
    if (currentSecs >= totalSecs && isPlaying) {
      setIsPlaying(false);
      onComplete();
    }
  }, [currentSecs, totalSecs, isPlaying, onComplete]);

  // DB Sync logic: Every 10 Seconds, UPSERT progress
  useEffect(() => {
    if (currentSecs > 0 && currentSecs % 10 === 0 && currentSecs < totalSecs) {
      onProgressChange(currentSecs); // Update local visual state in parent
      
      markLectureCompleteAction({
        enrollment_id: enrollmentId,
        lecture_id: lecture.id,
        student_id: userId,
        progress_secs: currentSecs,
        is_completed: false
      }).then();
    }
  }, [currentSecs, enrollmentId, lecture.id, userId, onProgressChange, totalSecs]);

  const progressPercent = Math.min((currentSecs / totalSecs) * 100, 100);

  const offlineOnlyMode = isOffline && !offlineBlocked;

  return (
    <div ref={videoPlayerRef} className="w-full flex flex-col bg-black rounded-2xl overflow-hidden shadow-2xl relative group pb-[56.25%] sm:pb-0 sm:aspect-video">
      
      {/* MOCK VIDEO RENDERER */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111111]">
        <div className="absolute top-4 left-4 flex gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
          <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
          <div className="h-2 w-2 rounded-full bg-[#28C840]" />
        </div>

        {!offlineBlocked ? (
          <button onClick={togglePlay} className="transform hover:scale-105 transition-transform outline-none focus:outline-none focus:ring-4 ring-white/10 rounded-full">
            <PlayCircle className="w-16 h-16 text-white mb-4" />
          </button>
        ) : null}
        <h2 className="text-white font-sans font-semibold text-lg max-w-[80%] text-center">
          {lecture.title}
        </h2>
        {offlineBlocked ? (
          <p className="text-red-300 text-sm mt-2 text-center max-w-[80%]">
            Offline access denied for this lecture on the current account. Download it while logged in to this account first.
          </p>
        ) : offlineOnlyMode ? (
          <p className="text-gray-300 text-sm mt-2 text-center max-w-[80%]">
            Offline mode active. {offlineSource ? 'Playing from local device storage.' : 'Lecture access is saved, but no local video file was cached.'}
          </p>
        ) : (
          <p className="text-gray-500 text-sm mt-2">
            {lecture.video_url ? 'Loading Video Asset...' : 'Video content coming soon'}
          </p>
        )}
      </div>

      {/* CUSTOM CONTROLS OVERLAY (Always visible during mock mode, fades out on real video) */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent pt-12 pb-4 px-5 opacity-100 transition-opacity flex flex-col justify-end">
        
        {/* Scrubber */}
        <div 
          className="w-full h-1 bg-white/20 rounded-full mb-3 cursor-pointer relative group/scrubber hover:h-1.5 transition-all"
          onClick={(e) => {
             if (offlineBlocked) return;
             const rect = e.currentTarget.getBoundingClientRect();
             const pos = (e.clientX - rect.left) / rect.width;
             setCurrentSecs(Math.floor(pos * totalSecs));
          }}
        >
          <div 
            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full z-10" 
            style={{ width: `${progressPercent}%` }} 
          />
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow z-20 opacity-0 group-hover/scrubber:opacity-100 transition-opacity"
            style={{ left: `calc(${progressPercent}% - 6px)` }}
          />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} disabled={offlineBlocked} className="text-white hover:text-blue-400 transition-colors disabled:cursor-not-allowed disabled:opacity-40">
              {isPlaying ? (
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            <button 
              disabled={offlineBlocked}
              onClick={() => setCurrentSecs(Math.max(0, currentSecs - 10))}
              className="text-gray-300 hover:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button 
               disabled={offlineBlocked}
               onClick={() => setCurrentSecs(Math.min(totalSecs, currentSecs + 10))}
               className="text-gray-300 hover:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <span className="text-[12px] text-gray-300 font-mono tracking-wide ml-2">
              {formatTime(currentSecs)} / {formatTime(totalSecs)}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={handleSpeedChange} className="text-[12px] font-medium text-gray-300 hover:text-white transition-colors">
              {speed}x
            </button>
            <button onClick={handleFullscreen} className="text-gray-300 hover:text-white transition-colors">
              <Maximize className="w-[15px] h-[15px]" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
