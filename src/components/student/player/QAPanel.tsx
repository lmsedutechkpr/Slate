'use client';

import { useState, useEffect } from 'react';
import { X, ThumbsUp, MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { postQuestionAction, getCourseQAAction, upvoteQuestionAction, getQuestionRepliesAction } from '@/app/actions/qa';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface QAPanelProps {
  lectureId: string;
  lectureTitle: string;
  userId: string;
  courseId: string;
  onClose: () => void;
}

export default function QAPanel({
  lectureId,
  lectureTitle,
  userId,
  courseId,
  onClose,
}: QAPanelProps) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  // ── Fetch via Server Action (bypasses RLS) ──────────────────────────
  async function loadQA() {
    setIsLoading(true);
    try {
      console.log('Fetching QA for', courseId, lectureId);
      const res = await getCourseQAAction(courseId, lectureId);
      console.log('Result QA:', res);
      if (res.success && res.data) {
        setQuestions(res.data);
      } else {
        console.error('QA fetch error:', res.error);
      }
    } catch (e: any) {
      console.error('QA Exception:', e);
    } finally {
      setIsLoading(false);
    }
  }

  // Initial load
  useEffect(() => { loadQA(); }, [courseId, lectureId]);

  // ── Realtime — new questions and replies appear live ─────────────────
  useEffect(() => {
    const channel = supabase.channel(`qa-lecture-${lectureId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'course_qa',
        filter: `lecture_id=eq.${lectureId}`,
      }, async (payload: any) => {
        const row = payload.new;
        if (row.parent_id || row.is_deleted) return;
        // Fetch with profile join for author name
        const { data } = await supabase
          .from('course_qa')
          .select(`id, body, created_at, upvotes, reply_count, profiles!author_id(full_name, avatar_url)`)
          .eq('id', row.id)
          .single();
        if (data) {
          const prof = Array.isArray((data as any).profiles) ? (data as any).profiles[0] : (data as any).profiles;
          const q = { ...data, author_name: prof?.full_name ?? 'Student', author_avatar: prof?.avatar_url ?? null };
          setQuestions(prev => prev.some(x => x.id === q.id) ? prev : [q, ...prev]);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'course_qa',
        filter: `lecture_id=eq.${lectureId}`,
      }, (payload: any) => {
        // Update reply_count, upvotes, is_answered etc. live
        setQuestions(prev => prev.map(q => q.id === payload.new.id ? { ...q, ...payload.new } : q));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [lectureId]);

  // ── Upvote question ───────────────────────────────────────────────────
  const handleUpvote = async (questionId: string) => {
    // Check local storage to prevent multiple likes
    const likedStr = localStorage.getItem('liked_questions') || '[]';
    const liked = JSON.parse(likedStr);
    if (liked.includes(questionId)) {
      toast.info('You already liked this question');
      return;
    }

    // Optimistic UI update
    setQuestions(prev => prev.map(q => 
      q.id === questionId 
        ? { ...q, upvotes: (q.upvotes ?? 0) + 1 } 
        : q
    ));

    liked.push(questionId);
    localStorage.setItem('liked_questions', JSON.stringify(liked));

    const res = await upvoteQuestionAction(questionId);

    if (!res.success) {
      toast.error('Failed to upvote');
      // Revert optimistic update
      setQuestions(prev => prev.map(q => 
        q.id === questionId 
          ? { ...q, upvotes: Math.max(0, (q.upvotes ?? 1) - 1) } 
          : q
      ));
      const revertedLiked = liked.filter((id: string) => id !== questionId);
      localStorage.setItem('liked_questions', JSON.stringify(revertedLiked));
    }
  };

  // ── Post question ────────────────────────────────────────────────────
  const handlePost = async () => {
    if (!newQuestion.trim()) return;
    setIsSubmitting(true);

    const res = await postQuestionAction({
      course_id: courseId,
      lecture_id: lectureId,
      author_id: userId,
      body: newQuestion.trim(),
    });

    if (res.success && res.data) {
      toast.success('Question posted!');
      setNewQuestion('');
      // Optimistic: use real DB row
      const prof = Array.isArray((res.data as any).profiles) ? (res.data as any).profiles[0] : (res.data as any).profiles;
      setQuestions(prev => [{ ...(res.data as any), author_name: prof?.full_name ?? 'You', author_avatar: prof?.avatar_url ?? null }, ...prev]);
    } else {
      toast.error(res.error ?? 'Failed to post question');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="w-full h-full flex flex-col pt-4">
      {/* Header */}
      <div className="px-4 pb-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex gap-1.5 items-center">
          <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
          <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
          <div className="h-2 w-2 rounded-full bg-[#28C840]" />
        </div>
        <span className="text-[12px] text-gray-500 font-medium">Q&amp;A</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
          <X className="w-[14px] h-[14px]" />
        </button>
      </div>

      <div className="p-5 flex flex-col flex-1 h-full overflow-y-auto">
        <p className="text-[11px] text-gray-500 font-medium truncate mb-4">{lectureTitle}</p>

        {/* Ask box */}
        <div className="bg-white border text-gray-900 border-gray-200 rounded-xl p-3 shadow-sm shadow-black/5 shrink-0">
          <textarea
            rows={3}
            value={newQuestion}
            onChange={e => setNewQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost(); }}
            placeholder="Ask a question about this lecture..."
            className="w-full bg-transparent text-[13px] resize-none outline-none placeholder:text-gray-400"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handlePost}
              disabled={isSubmitting || !newQuestion.trim()}
              className="bg-gray-900 text-white text-[12px] px-4 py-1.5 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Posting…' : 'Post Question'}
            </button>
          </div>
        </div>

        {/* Questions list */}
        <div className="flex-1 mt-6 flex flex-col gap-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 mt-10 opacity-70">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <MessageSquare className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-[14px] text-gray-600 font-medium">No questions yet</p>
              <p className="text-[12px] text-gray-400 mt-1 text-center max-w-[200px]">
                Be the first to ask a question about this lecture.
              </p>
            </div>
          ) : (
            questions.map((q, idx) => (
              <StudentQuestionItem key={q.id || idx} q={q} handleUpvote={handleUpvote} supabase={supabase} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StudentQuestionItem({ q, handleUpvote, supabase }: { q: any, handleUpvote: any, supabase: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [replies, setReplies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const toggleReplies = async () => {
    if (!isExpanded && !hasLoaded) {
      setIsLoading(true);
      const res = await getQuestionRepliesAction(q.id);
      if (res.success && res.data) {
        setReplies(res.data);
      }
      setHasLoaded(true);
      setIsLoading(false);
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        {q.author_avatar ? (
          <img src={q.author_avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
            {q.author_name?.charAt(0) || 'S'}
          </div>
        )}
        <span className="text-[12px] font-medium text-gray-900">{q.author_name}</span>
        <span className="text-[10px] text-gray-400 ml-auto">
          {formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}
        </span>
      </div>
      <p className="text-[13px] text-gray-700 whitespace-pre-wrap">{q.body}</p>
      
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
        <button 
          onClick={() => handleUpvote(q.id)}
          className="text-[11px] text-gray-500 font-medium hover:text-[#1D1D1F] transition-colors flex items-center gap-1 active:scale-95"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          {q.upvotes ?? 0}
        </button>
        {(q.reply_count ?? 0) > 0 && (
          <button 
            onClick={toggleReplies}
            className="text-[11px] text-gray-500 font-medium hover:text-[#1D1D1F] transition-colors flex items-center gap-1"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {q.reply_count} {q.reply_count === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-50 flex flex-col gap-3">
          {isLoading ? (
            <p className="text-[11px] text-gray-400">Loading replies...</p>
          ) : replies.length === 0 ? (
            <p className="text-[11px] text-gray-400 italic">No replies yet.</p>
          ) : (
            replies.map(reply => {
              const ra = Array.isArray(reply.profiles) ? reply.profiles[0] : (reply.profiles ?? {});
              const isInstructor = ra.role === 'instructor' || ra.role === 'admin';
              return (
                <div key={reply.id} className="flex gap-2">
                  {ra.avatar_url ? (
                    <img src={ra.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {(ra.full_name || 'U').charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 bg-gray-50 rounded-lg p-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-semibold text-gray-900">{ra.full_name || 'User'}</span>
                      {isInstructor && (
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                          Instructor
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400 ml-auto">
                        {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-700 leading-relaxed">{reply.body}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
