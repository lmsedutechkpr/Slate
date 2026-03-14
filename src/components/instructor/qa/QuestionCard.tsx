'use client';

import { useState } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Pin,
  Trash2,
  Loader2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getQuestionRepliesAction } from '@/app/actions/qa';
import { AnswerEditor } from './AnswerEditor';
import TrafficLights from '@/components/auth/TrafficLights';

interface Props {
  question: any;
  onAnswer: (questionId: string, body: string) => void;
  onPin: (questionId: string) => void;
  onMarkAnswered: (questionId: string) => void;
  onDelete: (questionId: string) => void;
  instructorId: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

function Avatar({ name, url, size = 32 }: { name?: string; url?: string | null; size?: number }) {
  const initials = (name ?? '?').charAt(0).toUpperCase();
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-[#F5F5F7] font-semibold text-[#6E6E73]"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}

export function QuestionCard({ question, onAnswer, onPin, onMarkAnswered, onDelete, instructorId }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [bodyExpanded, setBodyExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [replies, setReplies] = useState<any[]>([]);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const supabase = createClient();

  // Load replies on-demand when expanding
  const toggleReplies = async () => {
    const next = !isExpanded;
    setIsExpanded(next);
    if (next && !repliesLoaded) {
      setRepliesLoading(true);
      const res = await getQuestionRepliesAction(question.id);
      if (res.success && res.data) {
        setReplies(res.data);
      }
      setRepliesLoaded(true);
      setRepliesLoading(false);
    }
  };


  const body: string = question.body ?? '';
  const isLong = body.length > 200;
  const shownBody = isLong && !bodyExpanded ? body.slice(0, 200) + '…' : body;

  const author = question.profiles ?? {};
  const course = question.courses ?? {};
  const lecture = question.lectures;

  // Border color based on state
  const borderLeft = question.is_answered
    ? 'border-l-4 border-l-[#28C840]'
    : 'border-l-4 border-l-[#FF5F57]';

  const cardBg = question.is_pinned ? 'bg-[#FFFDF5] border-[#FEBC2E]/40' : 'bg-white border-[rgba(0,0,0,0.08)]';

  return (
    <div
      className={`overflow-hidden rounded-2xl border shadow-sm transition-all duration-200 ${cardBg} ${borderLeft}`}
    >
      {/* Mac Titlebar */}
      <div className="flex h-9 items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4">
        <div className="flex items-center gap-2">
          <TrafficLights size="sm" />
          {question.is_pinned && (
            <>
              <Pin className="ml-1 h-3 w-3 text-[#FEBC2E]" />
              <span className="text-[10px] font-semibold text-[#FEBC2E]">Pinned</span>
            </>
          )}
        </div>
        {/* Status badge */}
        <div
          className={`flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
            question.is_answered
              ? 'bg-[#EDFAF0] text-[#28C840]'
              : 'bg-[#FFF0EF] text-[#FF5F57]'
          }`}
        >
          {question.is_answered ? (
            <CheckCircle2 className="mr-1 h-2.5 w-2.5" />
          ) : (
            <AlertCircle className="mr-1 h-2.5 w-2.5" />
          )}
          {question.is_answered ? 'Answered' : 'Needs Answer'}
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Student info row */}
        <div className="mb-3 flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Avatar name={author.full_name} url={author.avatar_url} size={32} />
              <span className="text-[13px] font-semibold text-[#1D1D1F]">{author.full_name ?? 'Student'}</span>
              <span className="text-[#AEAEB2]">·</span>
              <span className="text-[12px] text-[#AEAEB2]">{timeAgo(question.created_at)}</span>
            </div>
            {/* Course + lecture context */}
            <div className="mt-1 flex items-center gap-1.5 pl-10">
              <BookOpen className="h-3 w-3 text-[#AEAEB2]" />
              <span className="text-[11px] text-[#6E6E73]">{course.title ?? 'Unknown Course'}</span>
              {lecture && (
                <>
                  <span className="text-[11px] text-[#AEAEB2]">›</span>
                  <span className="text-[11px] text-[#6E6E73]">{lecture.title}</span>
                </>
              )}
            </div>
          </div>

          {/* Upvotes */}
          <div className="flex items-center gap-1 shrink-0">
            <ThumbsUp className="h-3.5 w-3.5 text-[#AEAEB2]" />
            <span className="text-[12px] text-[#6E6E73]">{question.upvotes ?? 0}</span>
          </div>
        </div>

        {/* Question text */}
        <p className="text-[14px] leading-relaxed text-[#1D1D1F]">{shownBody}</p>
        {isLong && (
          <button
            onClick={() => setBodyExpanded(!bodyExpanded)}
            className="mt-1 text-[12px] font-medium text-[#6E6E73] hover:text-[#1D1D1F] transition-colors"
          >
            {bodyExpanded ? 'Read less' : 'Read more'}
          </button>
        )}

        {/* Replies toggle */}
        {(question.reply_count ?? 0) > 0 && (
          <button
            onClick={toggleReplies}
            className="mt-4 flex items-center gap-1.5 text-[12px] text-[#6E6E73] hover:text-[#1D1D1F] transition-colors"
          >
            {repliesLoading
              ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#AEAEB2]" />
              : <MessageSquare className="h-3.5 w-3.5 text-[#AEAEB2]" />}
            {question.reply_count} {question.reply_count === 1 ? 'reply' : 'replies'}
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-[#AEAEB2]" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-[#AEAEB2]" />
            )}
          </button>
        )}

        {/* Action row */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {/* Answer / Add Reply */}
          <button
            onClick={() => setIsAnswering(!isAnswering)}
            className={`flex items-center rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all ${
              !question.is_answered
                ? 'bg-[#1D1D1F] text-white hover:bg-[#333]'
                : 'border border-[rgba(0,0,0,0.1)] text-[#6E6E73] hover:border-[rgba(0,0,0,0.2)]'
            }`}
          >
            <MessageSquare className="mr-1.5 h-3 w-3" />
            {question.is_answered ? 'Add Reply' : 'Answer'}
          </button>

          {/* Pin / Unpin */}
          <button
            onClick={() => onPin(question.id)}
            className={`flex items-center gap-1.5 rounded-full border border-[rgba(0,0,0,0.08)] px-3 py-1.5 text-[12px] transition-colors hover:border-[rgba(0,0,0,0.16)] ${
              question.is_pinned ? 'text-[#FEBC2E]' : 'text-[#AEAEB2]'
            }`}
          >
            <Pin className="h-3.5 w-3.5" />
            {question.is_pinned ? 'Unpin' : 'Pin'}
          </button>

          {/* Mark Answered */}
          {!question.is_answered && (
            <button
              onClick={() => onMarkAnswered(question.id)}
              className="flex items-center gap-1.5 rounded-full border border-[#28C840]/20 px-3 py-1.5 text-[12px] text-[#28C840] transition-colors hover:bg-[#EDFAF0]"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Mark Answered
            </button>
          )}

          {/* Delete */}
          <div className="ml-auto">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-lg bg-[#F5F5F7] p-1.5 text-[#AEAEB2] transition-colors hover:text-[#FF5F57]"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-3 py-1.5">
                <span className="text-[11px] text-[#6E6E73]">Delete?</span>
                <button
                  onClick={() => { onDelete(question.id); setShowDeleteConfirm(false); }}
                  className="text-[11px] font-semibold text-[#FF5F57]"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-[11px] text-[#AEAEB2]"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Replies Section */}
      {isExpanded && (
        <div className="border-t border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5 py-4">
          {repliesLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-[#AEAEB2]" />
            </div>
          ) : replies.length === 0 ? (
            <p className="text-[12px] text-[#AEAEB2] italic">No replies yet.</p>
          ) : (
            replies.map((reply: any, i: number) => {
            const ra = Array.isArray(reply.profiles) ? reply.profiles[0] : (reply.profiles ?? {});
            const isInstructor = ra.role === 'instructor' || ra.role === 'admin';
            return (
              <div key={reply.id} className={`flex items-start gap-3 ${i < replies.length - 1 ? 'mb-4' : ''}`}>
                <Avatar name={ra.full_name} url={ra.avatar_url} size={28} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold text-[#1D1D1F]">{ra.full_name ?? 'User'}</span>
                    {isInstructor && (
                      <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-semibold text-[#3B82F6]">
                        Instructor
                      </span>
                    )}
                    <span className="text-[11px] text-[#AEAEB2]">{timeAgo(reply.created_at)}</span>
                  </div>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-[#1D1D1F]">{reply.body}</p>
                </div>
              </div>
            );
          })
          )}
        </div>
      )}

      {/* Answer Editor */}
      {isAnswering && (
        <div className="border-t border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5 py-4">
          <AnswerEditor
            questionId={question.id}
            courseId={question.course_id}
            lectureId={question.lecture_id}
            instructorId={instructorId}
            authorId={author.id}
            question={question}
            onSubmit={(body) => {
              const newReply = {
                id: `temp-${Date.now()}`,
                body,
                created_at: new Date().toISOString(),
                profiles: {
                  id: instructorId,
                  full_name: 'You',
                  role: 'instructor'
                }
              };
              setReplies(prev => [...prev, newReply]);
              onAnswer(question.id, body);
              setIsAnswering(false);
              setIsExpanded(true);
            }}
            onCancel={() => setIsAnswering(false)}
          />
        </div>
      )}
    </div>
  );
}
