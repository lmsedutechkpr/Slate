import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CheckSquare, CheckCircle2, XCircle } from 'lucide-react';

interface QuizPlayerProps {
  lecture: any;
  enrollmentId: string;
  userId: string;
  onComplete: () => void;
  language?: string;
  prefetchedQuiz?: any; // Pre-fetched server-side to bypass RLS
}

type QuizState = 'loading' | 'intro' | 'taking' | 'submitted' | 'reviewing';

export default function QuizPlayer({
  lecture,
  enrollmentId,
  userId,
  onComplete,
  language = 'en',
  prefetchedQuiz,
}: QuizPlayerProps) {
  
  const [state, setState] = useState<QuizState>('loading');
  const [quizData, setQuizData] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState<number | null>(null);
  const [results, setResults] = useState<any[]>([]);
  
  const supabase = createClient();

  // Helper: normalise options so they're always {label, value}
  const normaliseOptions = (opts: any[]): { label: string; value: string }[] => {
    if (!Array.isArray(opts) || opts.length === 0) return [];
    if (typeof opts[0] === 'string') {
      return opts.map((o, i) => ({ label: o as string, value: String(i + 1) }));
    }
    return opts as { label: string; value: string }[];
  };

  // Memoize fetchQuiz to strictly include lecture.id and supabase instances
  const fetchQuiz = useCallback(async () => {
    setState('loading');

    // If pre-fetched server-side (bypasses RLS), use that directly
    if (prefetchedQuiz) {
      setQuizData(prefetchedQuiz);
      setQuestions(
        (prefetchedQuiz.questions ?? []).map((q: any) => ({
          ...q,
          options: normaliseOptions(q.options ?? []),
        }))
      );
      setState('intro');
      return;
    }
    
    // Fallback: client-side fetch (works if RLS allows)
    const { data: qData, error: qErr } = await supabase
      .from('quizzes')
      .select('*')
      .eq('lecture_id', lecture.id)
      .eq('is_published', true)
      .single();

    if (qErr || !qData) {
      setQuizData(null);
      setState('intro');
      return;
    }

    setQuizData(qData);

    const { data: qqData } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', qData.id)
      .order('sort_order', { ascending: true });

    if (qqData) {
      setQuestions(qqData.map((q: any) => ({ ...q, options: normaliseOptions(q.options ?? []) })));
    }
    
    setState('intro');

  }, [lecture.id, prefetchedQuiz, supabase]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  const handleSubmit = async () => {
    setState('loading');
    
    let correctCount = 0;
    const computedResults = questions.map(q => {
      // answers[q.id] = opt.value (e.g. '2') | q.correct_answer = '2' (canonical string comparison)
      const isCorrect = String(answers[q.id] ?? '') === String(q.correct_answer ?? '');
      if (isCorrect) correctCount++;
      return { question_id: q.id, is_correct: isCorrect, selected: answers[q.id], correct: q.correct_answer };
    });

    const finalScorePct = questions.length > 0
      ? Math.round((correctCount / questions.length) * 100)
      : 0;
    
    // Save Attempt
    const { data: attempt } = await supabase.from('quiz_attempts').insert({
      quiz_id: quizData.id,
      student_id: userId,
      enrollment_id: enrollmentId,
      started_at: new Date().toISOString()
    }).select('id').single();

    if (attempt) {
      const answersToInsert = computedResults.map(res => ({
        attempt_id: attempt.id,
        question_id: res.question_id,
        selected_options: res.selected ? [res.selected] : [],
        is_correct: res.is_correct
      }));
      await supabase.from('quiz_attempt_answers').insert(answersToInsert);
    }

    setScore(finalScorePct);
    setResults(computedResults);
    setState('submitted');

    // Auto-mark lecture as completed if student passes
    const passPct = quizData?.pass_percentage ?? 60;
    if (finalScorePct >= passPct) {
      onComplete();
    }
  };



  // -------------- RENDER ROUTER --------------

  const title = (language === 'ta' && quizData?.title_ta) ? quizData.title_ta : (quizData?.title || lecture.title);

  if (state === 'loading') {
    return <div className="p-8 text-center text-gray-400">Loading Quiz Engine...</div>;
  }

  // FALLBACK if no quiz attached yet
  if (state === 'intro' && !quizData) {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mt-8">
         <div className="h-11 bg-gray-50 border-b border-gray-200 flex items-center px-4 relative">
            <div className="flex gap-1.5 items-center absolute left-4">
               <div className="h-[6px] w-[6px] rounded-full bg-[#FF5F57]" />
               <div className="h-[6px] w-[6px] rounded-full bg-[#FEBC2E]" />
               <div className="h-[6px] w-[6px] rounded-full bg-[#28C840]" />
            </div>
         </div>
         <div className="p-10 flex flex-col items-center justify-center">
            <CheckSquare className="w-12 h-12 text-gray-300 mb-4" />
            <h2 className="text-gray-900 font-bold text-lg">Quiz content coming soon</h2>
            <p className="text-gray-500 text-[13px] mt-2 text-center max-w-sm">
              The instructor hasn't published the questions for this quiz yet. You can skip this for now.
            </p>
            <button 
              onClick={onComplete}
              className="mt-8 bg-gray-900 text-white font-medium py-2.5 px-6 rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
            >
              Mark as Complete
            </button>
         </div>
      </div>
    );
  }

  // 1. INTRO
  if (state === 'intro') {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mt-8">
         <div className="h-11 bg-gray-50 border-b border-gray-200 flex items-center px-4">
            <div className="flex gap-1.5 items-center">
               <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
               <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
               <div className="h-2 w-2 rounded-full bg-[#28C840]" />
            </div>
         </div>
         <div className="p-10 flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 rounded-full px-3 py-1 mb-6">
              <CheckSquare className="w-[12px] h-[12px]" />
              <span className="text-[11px] font-medium tracking-wide uppercase">Quiz</span>
            </div>
            
            <h1 className="font-sans font-bold text-2xl text-gray-900 mb-3 text-center">{title}</h1>
            
            <p className="text-[14px] text-gray-500 mb-8">
              {questions.length} questions &middot; {quizData.pass_percentage}% to pass
            </p>

            <button 
              onClick={() => {
                setAnswers({});
                setState('taking');
              }}
              className="w-full max-w-md bg-gray-900 text-white font-medium py-3 rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
            >
              Start Quiz
            </button>
         </div>
      </div>
    );
  }

  // 2. TAKING
  if (state === 'taking') {
    return (
      <div className="w-full max-w-3xl mx-auto pb-24 mt-8">
        
        {/* Progress header */}
        <div className="flex items-center justify-between mb-6 px-2">
          <span className="text-sm font-semibold text-gray-900">
             Questions
          </span>
          <span className="text-sm text-gray-500 font-medium">
             {Object.keys(answers).length} of {questions.length} answered
          </span>
        </div>

        {questions.map((q, idx) => {
          const qText = (language === 'ta' && q.question_text_ta) ? q.question_text_ta : q.question_text;
          const options = q.options as {label: string, value: string}[];

          return (
            <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-6 mb-4 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-20" />
               
               <div className="inline-flex items-center justify-center bg-gray-100 rounded px-2.5 py-1 mb-4">
                 <span className="text-[11px] font-bold text-gray-500 tracking-wider">Q{idx + 1}</span>
               </div>

               <h3 className="font-sans font-semibold text-gray-900 text-[16px] mb-5">
                 {qText}
               </h3>

               <div className="flex flex-col gap-3">
                 {options.map((opt, oIdx) => {
                   const isSelected = answers[q.id] === opt.value;
                   return (
                     <div 
                       key={oIdx}
                       onClick={() => setAnswers({ ...answers, [q.id]: opt.value })}
                       className={`flex items-center gap-3 border rounded-xl px-4 py-3.5 cursor-pointer transition-all duration-200 ${
                         isSelected 
                           ? 'border-blue-600 bg-blue-50/50 shadow-sm' 
                           : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                       }`}
                     >
                       <div className={`w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center transition-colors ${
                         isSelected ? 'border-blue-600' : 'border-gray-300'
                       }`}>
                         {isSelected && <div className="w-[10px] h-[10px] rounded-full bg-blue-600" />}
                       </div>
                       <span className={`text-[14px] ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                         {opt.label}
                       </span>
                     </div>
                   );
                 })}
               </div>
            </div>
          );
        })}

        <div className="mt-8 flex justify-end">
          <button 
             onClick={handleSubmit}
             disabled={Object.keys(answers).length < questions.length}
             className={`px-8 py-3 rounded-xl font-medium shadow-sm transition-all ${
               Object.keys(answers).length === questions.length
                 ? 'bg-blue-600 text-white hover:bg-blue-700'
                 : 'bg-gray-100 text-gray-400 cursor-not-allowed'
             }`}
          >
            Submit Quiz
          </button>
        </div>

      </div>
    );
  }

  // 3. SUBMITTED
  if (state === 'submitted') {
    const passed = score! >= quizData.pass_percentage;
    const isPerfect = score === 100;

    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mt-8">
         <div className="h-11 bg-gray-50 border-b border-gray-200 flex items-center px-4">
            <div className="flex gap-1.5 items-center">
               <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
               <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
               <div className="h-2 w-2 rounded-full bg-[#28C840]" />
            </div>
         </div>

         <div className="p-10 flex flex-col items-center">
            {passed ? (
               isPerfect ? (
                 <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <span className="text-4xl text-yellow-600">🏆</span>
                 </div>
               ) : (
                 <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                 </div>
               )
            ) : (
               <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <XCircle className="w-10 h-10 text-red-500" />
               </div>
            )}

            <h1 className="font-sans font-bold text-2xl text-gray-900 mb-2 mt-2">
              {passed ? (isPerfect ? "Perfect Score! 🎉" : "Quiz Passed! 🎉") : "Not quite — Try again"}
            </h1>

            <div className={`text-5xl font-extrabold font-sans mt-4 tracking-tighter ${
              passed ? 'text-green-500' : 'text-red-500'
            }`}>
              {score}%
            </div>

            <p className="text-[14px] text-gray-500 mt-4 mb-8">
              {passed 
                ? `You successfully scored above the ${quizData.pass_percentage}% requirement.` 
                : `You need an ${quizData.pass_percentage}% to pass this quiz.`
              }
            </p>

            <div className="flex gap-4 w-full px-8">
              <button 
                onClick={() => setState('reviewing')}
                className="flex-1 py-3 rounded-xl font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Review Answers
              </button>
              
              {passed ? (
                <button 
                  onClick={onComplete}
                  className="flex-1 py-3 rounded-xl font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors shadow-sm"
                >
                  Continue Course
                </button>
              ) : (
                <button 
                  onClick={() => {
                    setAnswers({});
                    setState('taking');
                  }}
                  className="flex-1 py-3 rounded-xl font-medium bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
         </div>
      </div>
    );
  }

  // 4. REVIEWING
  if (state === 'reviewing') {
    return (
      <div className="w-full max-w-3xl mx-auto pb-24 mt-8">
        
        {/* Results header */}
        <div className="flex items-center justify-between mb-6 px-2">
          <span className="text-xl font-bold text-gray-900">
             Review Answers
          </span>
          <button 
             onClick={() => setState('submitted')}
             className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
             Back to Results
          </button>
        </div>

        {questions.map((q, idx) => {
          const qText = (language === 'ta' && q.question_text_ta) ? q.question_text_ta : q.question_text;
          const options = q.options as {label: string, value: string}[];
          const result = results.find(r => r.question_id === q.id);

          return (
            <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-6 mb-4 shadow-sm relative overflow-hidden">
               
               <div className="inline-flex items-center gap-3 mb-4">
                 <div className="inline-flex items-center justify-center bg-gray-100 rounded px-2.5 py-1">
                   <span className="text-[11px] font-bold text-gray-500 tracking-wider">Q{idx + 1}</span>
                 </div>
                 {result?.is_correct ? (
                   <span className="text-sm font-semibold text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Correct</span>
                 ) : (
                   <span className="text-sm font-semibold text-red-500 flex items-center gap-1"><XCircle className="w-4 h-4" /> Incorrect</span>
                 )}
               </div>

               <h3 className="font-sans font-semibold text-gray-900 text-[16px] mb-5">
                 {qText}
               </h3>

               <div className="flex flex-col gap-3">
                 {options.map((opt, oIdx) => {
                   const isSelected = result?.selected === opt.value;
                   const isCorrectOption = q.correct_answer === opt.value;

                   let optClass = "border-gray-200 bg-gray-50 opacity-60"; // default unselected
                   if (isCorrectOption) {
                     optClass = "border-green-500 bg-green-50 text-green-800 shadow-sm opacity-100 ring-1 ring-green-500/20";
                   } else if (isSelected && !isCorrectOption) {
                     optClass = "border-red-400 bg-red-50 text-red-800 shadow-sm opacity-100";
                   }

                   return (
                     <div 
                       key={oIdx}
                       className={`flex items-center justify-between border rounded-xl px-4 py-3.5 transition-all duration-200 ${optClass}`}
                     >
                       <div className="flex items-center gap-3">
                         <div className={`w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center ${
                           isCorrectOption ? 'border-green-600' : isSelected && !isCorrectOption ? 'border-red-500' : 'border-gray-300'
                         }`}>
                           {isSelected && <div className={`w-[10px] h-[10px] rounded-full ${isCorrectOption ? 'bg-green-600' : 'bg-red-500'}`} />}
                         </div>
                         <span className="text-[14px] font-medium">
                           {opt.label}
                         </span>
                       </div>
                       
                       {/* Label the user's choice vs correct specifically */}
                       <div>
                         {isSelected && !isCorrectOption && <span className="text-[11px] font-bold tracking-wider uppercase text-red-500 bg-red-100 px-2 py-0.5 rounded mr-2">Your Answer</span>}
                         {isCorrectOption && <span className="text-[11px] font-bold tracking-wider uppercase text-green-600 bg-green-100 px-2 py-0.5 rounded">Correct Answer</span>}
                       </div>

                     </div>
                   );
                 })}

                {/* Explanation */}
                {q.explanation && q.explanation.trim() && (
                  <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-blue-500 mb-1">Explanation</p>
                    <p className="text-[13px] text-gray-700 leading-relaxed">{q.explanation}</p>
                  </div>
                )}
               </div>
            </div>
          );
        })}

        <div className="mt-8 flex justify-center">
          <button 
             onClick={() => onComplete()}
             className="px-8 py-3 rounded-xl font-medium shadow-sm transition-all bg-gray-900 text-white hover:bg-gray-800"
          >
            Continue to Next Lesson
          </button>
        </div>

      </div>
    );
  }

  return null;
}
