"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Pencil } from "lucide-react";
import TrafficLights from "@/components/auth/TrafficLights";
import { createClient } from "@/lib/supabase/client";

interface DailyGoalProps {
  dailyGoalMinutes: number;
  todayWatchedMinutes: number;
  userId: string;
}

export default function DailyGoal({
  dailyGoalMinutes,
  todayWatchedMinutes,
  userId,
}: DailyGoalProps) {
  const [goal, setGoal] = useState(dailyGoalMinutes || 30);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(goal.toString());
  const [watchedMins, setWatchedMins] = useState(todayWatchedMinutes);

  useEffect(() => {
    const supabase = createClient();
    
    const fetchTodayMins = async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from('lecture_progress')
        .select('progress_secs')
        .eq('student_id', userId)
        .gte('updated_at', todayStart.toISOString());
        
      const mins = Math.floor((data?.reduce((sum, lp) => sum + (lp.progress_secs || 0), 0) ?? 0) / 60);
      setWatchedMins(mins);
    };

    const channel = supabase
      .channel('daily_goal_realtime')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'lecture_progress', filter: `student_id=eq.${userId}` }, 
        () => fetchTodayMins()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const progress = Math.min((watchedMins / goal) * 100, 100);
  const isAchieved = watchedMins >= goal;

  let progressColor = "#E5E7EB";
  if (progress >= 100) progressColor = "#28C840";
  else if (progress >= 50) progressColor = "#FEBC2E";

  const handleSave = async () => {
    setIsEditing(false);
    const newGoal = parseInt(inputValue, 10);

    if (!isNaN(newGoal) && newGoal > 0 && newGoal !== goal) {
      setGoal(newGoal);
      const supabase = createClient();
      await supabase
        .from("user_preferences")
        .update({ daily_goal_minutes: newGoal })
        .eq("user_id", userId);
    } else {
      setInputValue(goal.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setIsEditing(false);
      setInputValue(goal.toString());
    }
  };

  return (
    <div className="relative flex h-full min-h-[160px] flex-col rounded-2xl border border-gray-200 bg-white p-5 lg:min-h-0 lg:p-6">
      <TrafficLights size="sm" />

      <div className="mt-4 flex flex-1 flex-col justify-center">
        <span className="text-[10px] font-semibold tracking-[0.15em] text-gray-400 uppercase">
          Daily Goal
        </span>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="font-sans text-[16px] font-bold text-gray-900">
              {watchedMins}
            </span>
            <span className="text-[13px] text-gray-500">
              /{" "}
              {isEditing ? (
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onBlur={handleSave}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="w-10 border-b border-gray-900 bg-transparent text-center text-gray-900 outline-none"
                  min="1"
                />
              ) : (
                goal
              )}{" "}
              min today
            </span>
          </div>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-400 transition-colors hover:text-gray-900"
            >
              <Pencil className="h-[13px] w-[13px]" />
            </button>
          )}
        </div>

        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ backgroundColor: progressColor }}
            />
          </div>
        </div>

        {isAchieved && (
          <p className="mt-3 text-[12px] font-medium text-[#28C840]">
            🎯 Goal reached! Great work.
          </p>
        )}
      </div>
    </div>
  );
}
