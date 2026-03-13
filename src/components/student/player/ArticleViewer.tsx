import { CheckCircle2, FileText, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ArticleViewerProps {
  lecture: any;
  isCompleted: boolean;
  onComplete: () => void;
  language?: string;
}

export default function ArticleViewer({
  lecture,
  isCompleted,
  onComplete,
  language = 'en'
}: ArticleViewerProps) {

  const title = (language === 'ta' && lecture.title_ta) ? lecture.title_ta : lecture.title;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      
      {/* TITLEBAR */}
      <div className="h-11 bg-gray-50 border-b border-gray-200 flex items-center px-4 relative">
        <div className="flex gap-1.5 items-center absolute left-4">
           <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
           <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
           <div className="h-2 w-2 rounded-full bg-[#28C840]" />
        </div>
        <div className="w-full text-center text-[12px] font-medium text-gray-400 truncate px-16">
          {title}
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-8">
        <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 rounded-full px-3 py-1 mb-6">
          <FileText className="w-[12px] h-[12px]" />
          <span className="text-[11px] font-medium tracking-wide uppercase">Article</span>
        </div>

        <h1 className="font-sans font-bold text-2xl text-gray-900 mb-6">{title}</h1>

        <div className="w-full h-px bg-gray-100 mb-6" />

        {/* MARKDOWN RENDERER */}
        <div className="prose prose-sm md:prose-base prose-slate max-w-none text-gray-600
          prose-headings:text-gray-900 prose-headings:font-semibold
          prose-a:text-blue-600 hover:prose-a:text-blue-700
          prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl
        ">
          {lecture.article_content ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {lecture.article_content}
            </ReactMarkdown>
          ) : (
            <p className="text-gray-400 italic">Article content will appear here.</p>
          )}
        </div>

        {/* RESOURCES SECTION */}
        {lecture.resources && lecture.resources.length > 0 && (
          <div className="mt-10 pt-6 border-t border-gray-100">
            <h4 className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Resources
            </h4>
            <div className="flex flex-col gap-2">
              {lecture.resources.map((res: any, idx: number) => (
                <a 
                  key={idx}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[13px] text-gray-600 hover:text-blue-600 transition-colors w-fit group"
                >
                  <Download className="w-[14px] h-[14px] text-gray-400 group-hover:text-blue-600 transition-colors" />
                  {res.title || 'Attached Document'}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* COMPLETION ACTION */}
        <div className="mt-12">
          {!isCompleted ? (
            <button 
              onClick={onComplete}
              className="w-full bg-gray-900 text-white font-medium py-3 rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
            >
              Mark as Complete
            </button>
          ) : (
            <div className="w-full flex items-center justify-center gap-2 border-2 border-green-500/20 bg-green-50/50 rounded-xl py-3 text-green-600 font-medium">
              <CheckCircle2 className="w-5 h-5" />
              Completed
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
