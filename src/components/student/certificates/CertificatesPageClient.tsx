'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Award, Clock } from 'lucide-react';
import CertificateCard from './CertificateCard';
import InProgressCard from './InProgressCard';
import CertificateModal from './CertificateModal';

interface CertificatesPageClientProps {
  certificates: any[];
  inProgressEnrollments: any[];
  profile: any;
  userId: string;
}

export default function CertificatesPageClient({
  certificates,
  inProgressEnrollments,
  profile,
  userId,
}: CertificatesPageClientProps) {
  const router = useRouter();
  const [selectedCert, setSelectedCert] = useState<any | null>(null);

  const studentName = profile?.display_name ?? profile?.full_name ?? 'Student';
  const hasAnything = certificates.length > 0 || inProgressEnrollments.length > 0;

  // ── Empty state ──────────────────────────────────────────────
  if (!hasAnything) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden py-20 px-10 max-w-md w-full text-center">
          <div className="flex items-center justify-center gap-1.5 mb-6">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          </div>
          <Award className="w-12 h-12 text-gray-300 mx-auto mb-5" />
          <h2 className="text-[22px] font-bold text-gray-900">No certificates yet</h2>
          <p className="text-[14px] text-gray-400 mt-3 leading-relaxed max-w-xs mx-auto">
            Complete a course with certificate enabled to earn your first one.
          </p>
          <button
            onClick={() => router.push('/student/courses/browse')}
            className="mt-8 bg-gray-900 text-white font-semibold text-[14px] rounded-xl px-6 py-2.5 hover:bg-gray-800 transition-colors"
          >
            Browse Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-gray-900">My Certificates</h1>
          <p className="text-[14px] text-gray-500 mt-1">
            {certificates.length} certificate{certificates.length !== 1 ? 's' : ''} earned
          </p>
        </div>

        {certificates.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
              <Award className="w-3.5 h-3.5 text-[#FEBC2E]" />
              <span className="text-[13px] font-medium text-gray-900">{certificates.length} Earned</span>
            </div>
            {inProgressEnrollments.length > 0 && (
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[13px] text-gray-500">{inProgressEnrollments.length} In Progress</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Earned certificates */}
      {certificates.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <Award className="w-5 h-5 text-[#FEBC2E]" />
            <h2 className="text-[18px] font-semibold text-gray-900">Earned Certificates</h2>
            <span className="bg-gray-100 text-gray-600 text-[11px] font-semibold rounded-full px-2.5 py-0.5">
              {certificates.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {certificates.map(cert => (
              <CertificateCard
                key={cert.id}
                certificate={cert}
                studentName={studentName}
                onView={setSelectedCert}
              />
            ))}
          </div>
        </section>
      )}

      {/* No certs but has in-progress: show message */}
      {certificates.length === 0 && inProgressEnrollments.length > 0 && (
        <p className="text-[14px] text-gray-500 mb-8">
          Complete a course to earn your first certificate.
        </p>
      )}

      {/* In-progress section */}
      {inProgressEnrollments.length > 0 && (
        <section className={certificates.length > 0 ? 'mt-12' : ''}>
          <div className="flex items-center gap-3 mb-5">
            <Clock className="w-5 h-5 text-[#FEBC2E]" />
            <h2 className="text-[18px] font-semibold text-gray-900">In Progress — Earn These Next</h2>
            <span className="bg-gray-100 text-gray-600 text-[11px] font-semibold rounded-full px-2.5 py-0.5">
              {inProgressEnrollments.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {inProgressEnrollments.map(enrollment => (
              <InProgressCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        </section>
      )}

      {/* Certificate modal */}
      {selectedCert && (
        <CertificateModal
          open={!!selectedCert}
          onClose={() => setSelectedCert(null)}
          certificate={selectedCert}
          studentName={studentName}
        />
      )}
    </div>
  );
}
