'use client';

import { Eye, Download, Share2, ShieldCheck, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface CertificateCardProps {
  certificate: any;
  studentName: string;
  onView: (cert: any) => void;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const DIFF_COLORS: Record<string, string> = {
  beginner: 'bg-green-50 text-green-700 border-green-200',
  intermediate: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  advanced: 'bg-red-50 text-red-700 border-red-200',
};

export default function CertificateCard({ certificate, studentName, onView }: CertificateCardProps) {
  const course = certificate.courses;
  if (!course) return null;

  const instructors = course.course_instructors ?? [];
  const instructorName = instructors[0]?.profiles?.full_name ?? 'Instructor';
  const certNum = `SL-${certificate.certificate_number}`;

  const downloadCertificate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (certificate.pdf_url) {
      window.open(certificate.pdf_url, '_blank');
      toast.success('Certificate downloading...');
      return;
    }
    // Trigger modal download via event
    onView(certificate);
    toast.info('Opening certificate to download...');
  };

  const shareCertificate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = certificate.pdf_url ?? window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `My Certificate — ${course.title}`,
        text: `I just completed ${course.title} on Slate!`,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Certificate link copied!');
    }
  };

  return (
    <div
      onClick={() => onView(certificate)}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:-translate-y-1 hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer group"
    >
      {/* Titlebar */}
      <div className="bg-gray-50 border-b border-gray-100 px-4 h-9 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#FF5F57]" />
          <div className="w-2 h-2 rounded-full bg-[#FEBC2E]" />
          <div className="w-2 h-2 rounded-full bg-[#28C840]" />
        </div>
        <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">Certificate</span>
        <div className="w-14" /> {/* spacer */}
      </div>

      {/* Mini certificate preview */}
      <div className="relative h-[150px] bg-[#0A0A0A] overflow-hidden">
        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '18px 18px' }}
        />
        {/* Inner border */}
        <div className="absolute inset-3 rounded-lg border border-white/15 pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 gap-1">
          <p className="text-[8px] tracking-[0.3em] text-gray-500 uppercase">Certificate of Completion</p>
          <p className="text-[13px] font-bold text-white text-center leading-snug line-clamp-2 mt-1">
            {course.title}
          </p>
          <div className="w-12 h-px bg-white/20 my-1" />
          <p className="text-[10px] text-gray-400 font-medium text-center">{studentName}</p>
          <p className="font-mono text-[9px] text-gray-600 mt-0.5">{certNum}</p>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Eye className="w-6 h-6 text-white" />
          <p className="text-[12px] text-white font-medium mt-1.5">View Certificate</p>
        </div>
      </div>

      {/* Card content */}
      <div className="p-4">
        <p className="text-[14px] font-semibold text-gray-900 line-clamp-1">{course.title}</p>
        <p className="text-[12px] text-gray-400 mt-0.5">by {instructorName}</p>

        {/* Meta */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span className="text-[11px] text-gray-500">Issued {fmtDate(certificate.issued_at)}</span>
          </div>
          {course.difficulty && (
            <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 border capitalize ${DIFF_COLORS[course.difficulty] ?? DIFF_COLORS.beginner}`}>
              {course.difficulty}
            </span>
          )}
        </div>

        {/* Certificate number */}
        <div className="mt-3 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
          <ShieldCheck className="w-3 h-3 text-[#28C840] flex-shrink-0" />
          <span className="font-mono text-[11px] text-gray-500 truncate">{certNum}</span>
        </div>

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={downloadCertificate}
            className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-700 text-[12px] font-medium rounded-xl py-2 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-3 h-3" />
            Download
          </button>
          <button
            onClick={shareCertificate}
            className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-700 text-[12px] font-medium rounded-xl py-2 hover:bg-gray-50 transition-colors"
          >
            <Share2 className="w-3 h-3" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
