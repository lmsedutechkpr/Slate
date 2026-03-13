'use client';

import { useRef, useState } from 'react';
import { X, Download, Link, Share2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import CertificateTemplate from './CertificateTemplate';

interface CertificateModalProps {
  open: boolean;
  onClose: () => void;
  certificate: any;
  studentName: string;
}

export default function CertificateModal({ open, onClose, certificate, studentName }: CertificateModalProps) {
  const [downloading, setDownloading] = useState(false);

  if (!open || !certificate) return null;

  const course = certificate.courses;
  const instructors = course?.course_instructors ?? [];
  const instructorName = instructors[0]?.profiles?.full_name ?? 'Instructor';
  const certId = `certificate-template-${certificate.id}`;

  const downloadPDF = async () => {
    if (certificate.pdf_url) {
      window.open(certificate.pdf_url, '_blank');
      toast.success('Certificate downloading...');
      return;
    }
    setDownloading(true);
    try {
      const [{ toPng }, { default: jsPDF }] = await Promise.all([
        import('html-to-image'),
        import('jspdf'),
      ]);

      await document.fonts.ready;

      const element = document.getElementById(certId);
      if (!element) { toast.error('Certificate not found'); setDownloading(false); return; }

      // Get explicitly forced dimensions
      const rect = element.getBoundingClientRect();
      const w = Math.round(rect.width) || 720;
      const h = Math.round(rect.height) || 509;

      // Force inline style dimensions temporarily for capture
      const oldW = element.style.width;
      const oldH = element.style.height;
      element.style.width = w + 'px';
      element.style.height = h + 'px';
      
      const imgData = await toPng(element, {
        width: w,
        height: h,
        pixelRatio: 2,
        backgroundColor: '#0A0A0A',
        style: { margin: '0' },
      });

      // Restore inline styles
      element.style.width = oldW;
      element.style.height = oldH;

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [w, h],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, w, h);
      pdf.save(`Slate-Certificate-${certificate.certificate_number}.pdf`);
      toast.success('Certificate downloaded!');
    } catch (err: any) {
      console.error('PDF download error:', err);
      toast.error('Download failed: ' + (err?.message ?? 'Unknown error'));
    } finally {
      setDownloading(false);
    }
  };

  const copyLink = () => {
    const url = certificate.pdf_url ?? window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied!');
  };

  const share = () => {
    const url = certificate.pdf_url ?? window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `My Certificate — ${course?.title}`,
        text: `I completed ${course?.title} on Slate!`,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Certificate link copied!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-3xl overflow-hidden my-4">
        {/* Titlebar */}
        <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          </div>
          <p className="text-[12px] text-gray-400 flex-1 text-center">Certificate of Completion</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Certificate */}
        <div className="p-6">
          <CertificateTemplate
            id={certId}
            studentName={studentName}
            courseTitle={course?.title ?? ''}
            instructorName={instructorName}
            certificateNumber={certificate.certificate_number}
            issuedAt={certificate.issued_at}
            durationMins={course?.total_duration_mins}
          />
        </div>

        {/* Actions */}
        <div className="px-6 pb-4 flex gap-3">
          <button
            onClick={downloadPDF}
            disabled={downloading}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white font-semibold text-[13px] rounded-xl py-2.5 hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Generating...' : 'Download PDF'}
          </button>
          <button
            onClick={copyLink}
            className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-medium text-[13px] rounded-xl py-2.5 hover:bg-gray-50 transition-colors"
          >
            <Link className="w-4 h-4" />
            Copy Link
          </button>
          <button
            onClick={share}
            className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-medium text-[13px] rounded-xl py-2.5 hover:bg-gray-50 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>

        {/* Verification row */}
        <div className="mx-6 mb-5 bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-[#28C840] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-gray-900">Verified Certificate</p>
            <p className="font-mono text-[11px] text-gray-400 truncate mt-0.5">
              SL-{certificate.certificate_number}
            </p>
          </div>
          <span className="text-[11px] font-medium text-[#28C840]">Authentic ✓</span>
        </div>
      </div>
    </div>
  );
}
