import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getCourseQAAction, postQuestionAction } from '@/app/actions/qa';
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
  onClose
}: QAPanelProps) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadQA() {
      setIsLoading(true);
      const res = await getCourseQAAction(courseId, lectureId);
      if (res.success && res.data) {
        setQuestions(res.data);
      }
      setIsLoading(false);
    }
    loadQA();
  }, [courseId, lectureId]);

  const handlePost = async () => {
    if (!newQuestion.trim()) return;
    setIsSubmitting(true);
    const res = await postQuestionAction({
      course_id: courseId,
      lecture_id: lectureId,
      author_id: userId,
      body: newQuestion
    });

    if (res.success && res.data) {
      toast.success("Question posted!");
      setNewQuestion("");
      // Optimistically add to top
      const optimisticQ = {
        ...res.data,
        author_name: 'You',
        author_avatar: null,
      };
      setQuestions([optimisticQ, ...questions]);
    } else {
      toast.error(res.error || "Failed to post question");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="w-full h-full flex flex-col pt-4">
      <div className="px-4 pb-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex gap-1.5 items-center">
           <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
           <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
           <div className="h-2 w-2 rounded-full bg-[#28C840]" />
        </div>
        <span className="text-[12px] text-gray-500 font-medium">Q&A</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
          <X className="w-[14px] h-[14px]" />
        </button>
      </div>

      <div className="p-5 flex flex-col flex-1 h-full overflow-y-auto">
        <p className="text-[11px] text-gray-500 font-medium truncate mb-4">
          {lectureTitle}
        </p>

        {/* ASK BOX */}
        <div className="bg-white border text-gray-900 border-gray-200 rounded-xl p-3 shadow-sm shadow-black/5 shrink-0">
          <textarea
            rows={3}
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Ask a question about this lecture..."
            className="w-full bg-transparent text-[13px] resize-none outline-none placeholder:text-gray-400"
          />
          <div className="flex justify-end mt-2">
            <button 
              onClick={handlePost}
              disabled={isSubmitting || !newQuestion.trim()}
              className="bg-gray-900 text-white text-[12px] px-4 py-1.5 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Posting...' : 'Post Question'}
            </button>
          </div>
        </div>

        {/* QUESTIONS LIST */}
        <div className="flex-1 mt-6 flex flex-col gap-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-8 text-gray-400">Loading...</div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 mt-10 opacity-70">
               <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                 <span className="text-xl">💬</span>
               </div>
               <p className="text-[14px] text-gray-600 font-medium">No questions yet</p>
               <p className="text-[12px] text-gray-400 mt-1 text-center max-w-[200px]">
                 Be the first to ask a question about this lecture.
               </p>
            </div>
          ) : (
             questions.map((q, idx) => (
               <div key={q.id || idx} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                 <div className="flex items-center gap-2 mb-2">
                   {q.author_avatar ? (
                     <img src={q.author_avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                   ) : (
                     <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                       {q.author_name?.charAt(0) || 'U'}
                     </div>
                   )}
                   <span className="text-[12px] font-medium text-gray-900">{q.author_name}</span>
                   <span className="text-[10px] text-gray-400 ml-auto">
                     {formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}
                   </span>
                 </div>
                 <p className="text-[13px] text-gray-700 whitespace-pre-wrap">{q.body}</p>
                 <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
                   <button className="text-[11px] text-gray-500 font-medium hover:text-gray-900 transition-colors flex items-center gap-1">
                     <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                     {q.upvote_count || 0}
                   </button>
                   <button className="text-[11px] text-gray-500 font-medium hover:text-gray-900 transition-colors">
                     Reply
                   </button>
                 </div>
               </div>
             ))
          )}
        </div>

      </div>
    </div>
  );
}
