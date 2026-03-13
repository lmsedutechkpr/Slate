'use client';

interface CertificateTemplateProps {
  id: string;
  studentName: string;
  courseTitle: string;
  instructorName: string;
  certificateNumber: string;
  issuedAt: string;
  durationMins?: number;
}

export default function CertificateTemplate({
  id,
  studentName,
  courseTitle,
  instructorName,
  certificateNumber,
  issuedAt,
  durationMins,
}: CertificateTemplateProps) {
  const hours = durationMins ? Math.round(durationMins / 60) : null;
  const dateStr = new Date(issuedAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  // All colors as explicit rgba/hex — NO Tailwind opacity modifiers (oklch incompatible with html2canvas)
  const s = {
    wrapper: {
      position: 'relative' as const,
      width: '100%',
      paddingBottom: '70.7%',
    },
    cert: {
      fontFamily: "'DM Sans', sans-serif",
      position: 'absolute' as const,
      top: 0, left: 0, right: 0, bottom: 0,
      overflow: 'hidden',
      backgroundColor: '#0A0A0A',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.15)',
    },
    dotGrid: {
      position: 'absolute' as const,
      inset: 0,
      opacity: 0.04,
      backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      zIndex: 0,
    },
    cornerTL: { position: 'absolute' as const, top: 20, left: 20, width: 28, height: 28, borderTop: '2px solid rgba(255,255,255,0.3)', borderLeft: '2px solid rgba(255,255,255,0.3)' },
    cornerTR: { position: 'absolute' as const, top: 20, right: 20, width: 28, height: 28, borderTop: '2px solid rgba(255,255,255,0.3)', borderRight: '2px solid rgba(255,255,255,0.3)' },
    cornerBL: { position: 'absolute' as const, bottom: 20, left: 20, width: 28, height: 28, borderBottom: '2px solid rgba(255,255,255,0.3)', borderLeft: '2px solid rgba(255,255,255,0.3)' },
    cornerBR: { position: 'absolute' as const, bottom: 20, right: 20, width: 28, height: 28, borderBottom: '2px solid rgba(255,255,255,0.3)', borderRight: '2px solid rgba(255,255,255,0.3)' },
    innerBorder: { position: 'absolute' as const, inset: 14, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', pointerEvents: 'none' as const },
    content: { position: 'relative' as const, zIndex: 10, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'space-between', height: '100%', padding: '32px 48px' },
    dividerSm: { width: 64, height: 1, backgroundColor: 'rgba(255,255,255,0.25)', margin: '12px auto' },
    dividerMd: { width: 96, height: 1, backgroundColor: 'rgba(255,255,255,0.15)', margin: '20px auto 0' },
    signLine: { width: 112, height: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginBottom: 8 },
    signLineRight: { width: 112, height: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginBottom: 8, marginLeft: 'auto' },
  };

  return (
    <div style={s.wrapper}>
      <div id={id} style={s.cert}>
        {/* Dot grid */}
        <div style={s.dotGrid} />

        {/* Corner accents */}
        <div style={s.cornerTL} />
        <div style={s.cornerTR} />
        <div style={s.cornerBL} />
        <div style={s.cornerBR} />

        {/* Inner border */}
        <div style={s.innerBorder} />

        {/* Content */}
        <div style={s.content}>

          {/* Top: Logo */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ letterSpacing: '0.3em', fontSize: '20px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              SLATE
            </p>
            <div style={s.dividerSm} />
            <p style={{ fontSize: '10px', letterSpacing: '0.4em', color: '#8E8E93', textTransform: 'uppercase', margin: 0 }}>
              Certificate of Completion
            </p>
          </div>

          {/* Middle: Student + course */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: '#48484A', margin: 0 }}>This certifies that</p>
            <p style={{ fontSize: '28px', fontWeight: 700, color: '#FFFFFF', marginTop: 6, lineHeight: 1.1, margin: '6px 0 0' }}>
              {studentName}
            </p>
            <p style={{ fontSize: '12px', color: '#48484A', marginTop: 10 }}>has successfully completed</p>
            <p style={{ fontSize: '17px', fontWeight: 700, color: '#FFFFFF', marginTop: 6, maxWidth: 460, lineHeight: 1.3, textAlign: 'center' }}>
              {courseTitle}
            </p>
            <div style={s.dividerMd} />
          </div>

          {/* Bottom: 3-column */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', width: '100%' }}>
            {/* Instructor */}
            <div>
              <div style={s.signLine} />
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>{instructorName}</p>
              <p style={{ fontSize: '10px', color: '#48484A', margin: 0 }}>Course Instructor</p>
            </div>

            {/* Center */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'monospace', fontSize: '10px', color: '#48484A', margin: 0 }}>SL-{certificateNumber}</p>
              <p style={{ fontSize: '10px', color: '#48484A', margin: '2px 0 0' }}>{dateStr}</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#FF5F57' }} />
                <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#FEBC2E' }} />
                <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#28C840' }} />
              </div>
            </div>

            {/* Duration */}
            <div style={{ textAlign: 'right' }}>
              <div style={s.signLineRight} />
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>
                {hours != null ? `${hours} hours` : 'Self-paced'}
              </p>
              <p style={{ fontSize: '10px', color: '#48484A', margin: 0 }}>Certificate Duration</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
