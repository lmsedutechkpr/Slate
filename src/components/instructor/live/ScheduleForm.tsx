'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { scheduleLiveClassAction, updateLiveClassAction } from '@/app/actions/live';
import TrafficLights from '@/components/auth/TrafficLights';
import { toast } from 'sonner';

interface Props {
  instructorCourses: any[];
  userId: string;
  editClass?: any; // If editing an existing class
}

export function ScheduleForm({ instructorCourses, userId, editClass }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  // Pre-fill form state if editClass is provided
  const d = editClass?.scheduled_at ? new Date(editClass.scheduled_at) : null;
  const initDateStr = d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : '';
  const initTimeStr = d ? `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` : '';

  const [selectedCourse, setSelectedCourse] = useState(editClass?.course_id || '');
  const [title, setTitle] = useState(editClass?.title || '');
  const [titleTa, setTitleTa] = useState(editClass?.title_ta || '');
  const [description, setDescription] = useState(editClass?.description || '');
  const [date, setDate] = useState(initDateStr);
  const [time, setTime] = useState(initTimeStr);
  const [duration, setDuration] = useState(editClass?.duration_mins?.toString() || '60');
  const [maxAttendees, setMaxAttendees] = useState(editClass?.max_attendees?.toString() || '100');
  
  const [meetingUrl, setMeetingUrl] = useState(editClass?.meeting_url || '');
  const [meetingId, setMeetingId] = useState(editClass?.meeting_id || '');
  const [meetingPassword, setMeetingPassword] = useState(editClass?.meeting_password || '');
  
  const [notifyStudents, setNotifyStudents] = useState(!editClass); // true on new, false on edit usually

  const scheduleClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !title || !date || !time || !meetingUrl) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      new URL(meetingUrl);
    } catch {
      toast.error('Please enter a valid URL for the meeting link');
      return;
    }

    const scheduledDateObj = new Date(`${date}T${time}:00`);
    if (scheduledDateObj <= new Date()) {
      toast.error('Scheduled date and time must be in the future');
      return;
    }

    setLoading(true);

    const classData = {
      course_id: selectedCourse,
      instructor_id: userId,
      title,
      title_ta: titleTa || null,
      description: description || null,
      scheduled_at: scheduledDateObj.toISOString(),
      duration_mins: Number(duration),
      max_attendees: Number(maxAttendees),
      meeting_url: meetingUrl,
      meeting_id: meetingId || null,
      meeting_password: meetingPassword || null,
      status: 'scheduled' as const,
    };

    try {
      if (editClass) {
        // Edit
        const res = await updateLiveClassAction(editClass.id, classData);
        if (!res.success) throw new Error(res.error);
        toast.success('Live class updated successfully!');
      } else {
        // Insert
        const res = await scheduleLiveClassAction(classData, notifyStudents);
        if (!res.success) throw new Error(res.error);
        toast.success('Class scheduled successfully!');
      }

      router.push('/instructor/live');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule class. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
      <div className="flex h-[44px] items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
        <TrafficLights size="sm" />
        <span className="ml-[calc(50%-55px)] font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
          {editClass ? 'Edit Live Class' : 'New Live Class'}
        </span>
      </div>

      <form onSubmit={scheduleClass} className="p-6 space-y-5">
        {/* Course Selection */}
        <div>
          <label className="mb-2 block font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
            Course *
          </label>
          <select 
            className="w-full rounded-xl border border-[rgba(0,0,0,0.1)] bg-white px-4 py-2.5 text-[14px] text-[#1D1D1F] outline-none focus:border-[#1D1D1F] focus:ring-1 focus:ring-[#1D1D1F]"
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            required
          >
            <option value="" disabled>Select a course</option>
            {instructorCourses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="mb-2 block font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
            Title *
          </label>
          <input 
            type="text"
            className="w-full rounded-xl border border-[rgba(0,0,0,0.1)] px-4 py-2.5 text-[14px] text-[#1D1D1F] placeholder:text-[#AEAEB2] outline-none focus:border-[#1D1D1F] focus:ring-1 focus:ring-[#1D1D1F]"
            placeholder="e.g. Live Q&A — Module 3"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
              Date *
            </label>
             <input 
              type="date"
              className="w-full rounded-xl border border-[rgba(0,0,0,0.1)] px-4 py-2.5 text-[14px] text-[#1D1D1F] outline-none focus:border-[#1D1D1F] focus:ring-1 focus:ring-[#1D1D1F]"
              min={new Date().toISOString().split('T')[0]}
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-2 block font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
              Time *
            </label>
             <input 
              type="time"
              className="w-full rounded-xl border border-[rgba(0,0,0,0.1)] px-4 py-2.5 text-[14px] text-[#1D1D1F] outline-none focus:border-[#1D1D1F] focus:ring-1 focus:ring-[#1D1D1F]"
              step="900"
              value={time}
              onChange={e => setTime(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
              Duration *
            </label>
            <select 
              className="w-full rounded-xl border border-[rgba(0,0,0,0.1)] bg-white px-4 py-2.5 text-[14px] text-[#1D1D1F] outline-none focus:border-[#1D1D1F] focus:ring-1 focus:ring-[#1D1D1F]"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              required
            >
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
              <option value="120">120 minutes</option>
              <option value="180">180 minutes</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
              Max Attendees *
            </label>
            <input 
              type="number"
              min="1" max="1000"
              className="w-full rounded-xl border border-[rgba(0,0,0,0.1)] px-4 py-2.5 text-[14px] text-[#1D1D1F] outline-none focus:border-[#1D1D1F] focus:ring-1 focus:ring-[#1D1D1F]"
              value={maxAttendees}
              onChange={e => setMaxAttendees(e.target.value)}
              required
            />
            <p className="mt-1 text-[11px] text-[#AEAEB2]">Leave at 100 for most sessions</p>
          </div>
        </div>

        {/* MEETING DETAILS */}
        <div className="pt-2">
          <h4 className="mb-3 font-[DM_Sans] text-[14px] font-semibold text-[#1D1D1F]">Meeting Details</h4>
          
          <div className="mb-4">
            <label className="mb-1 block font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
              Meeting URL *
            </label>
            <input 
              type="url"
              className="w-full rounded-xl border border-[rgba(0,0,0,0.1)] px-4 py-2.5 text-[14px] text-[#1D1D1F] placeholder:text-[#AEAEB2] outline-none focus:border-[#1D1D1F] focus:ring-1 focus:ring-[#1D1D1F]"
              placeholder="https://meet.google.com/..."
              value={meetingUrl}
              onChange={e => setMeetingUrl(e.target.value)}
              required
            />
            <p className="mt-1 text-[11px] text-[#AEAEB2]">Create a Google Meet, Zoom or any video call link</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
                Meeting ID
              </label>
              <input 
                type="text"
                className="w-full rounded-xl border border-[rgba(0,0,0,0.1)] px-4 py-2.5 text-[14px] text-[#1D1D1F] placeholder:text-[#AEAEB2] outline-none focus:border-[#1D1D1F] focus:ring-1 focus:ring-[#1D1D1F]"
                placeholder="abc-defg-hij"
                value={meetingId}
                onChange={e => setMeetingId(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
                Meeting Password
              </label>
              <input 
                type="text"
                className="w-full rounded-xl border border-[rgba(0,0,0,0.1)] px-4 py-2.5 text-[14px] text-[#1D1D1F] placeholder:text-[#AEAEB2] outline-none focus:border-[#1D1D1F] focus:ring-1 focus:ring-[#1D1D1F]"
                placeholder="optional password"
                value={meetingPassword}
                onChange={e => setMeetingPassword(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* NOTIFY STUDENTS */}
        {!editClass && (
          <div className="mb-2 mt-4 flex border border-[rgba(0,0,0,0.06)] items-center justify-between rounded-xl bg-[#F5F5F7] p-4 pt-3">
            <div className="flex flex-col gap-1 w-full">
               <TrafficLights size="sm" />
               <div className="flex items-center justify-between mt-2">
                 <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[#1D1D1F]" />
                  <div>
                    <div className="font-[DM_Sans] text-[13px] font-medium text-[#1D1D1F]">Notify enrolled students</div>
                    <div className="text-[12px] text-[#6E6E73]">Send notification to all students enrolled in the selected course</div>
                  </div>
                 </div>
                 
                <label className="relative inline-flex cursor-pointer items-center">
                  <input 
                    type="checkbox" 
                    className="peer sr-only" 
                    checked={notifyStudents}
                    onChange={(e) => setNotifyStudents(e.target.checked)}
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#28C840] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                </label>
               </div>
            </div>
          </div>
        )}

        {/* SUBMIT */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            className="rounded-full px-6 py-3 font-[DM_Sans] text-[14px] font-medium text-[#6E6E73] hover:text-[#1D1D1F]"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-[#1D1D1F] px-6 py-3 font-[DM_Sans] text-[14px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Please wait...' : (editClass ? 'Update Class' : 'Schedule Class')}
          </button>
        </div>

      </form>
    </div>
  );
}
