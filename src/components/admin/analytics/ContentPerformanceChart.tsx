'use client';

function WindowCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
      <div className="flex h-10 items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4">
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
          <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
          <span className="h-2 w-2 rounded-full bg-[#28C840]" />
        </div>
        <p className="text-[12px] font-semibold text-[#6E6E73]">{title}</p>
        <div className="w-8" />
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function ContentPerformanceChart({
  categories,
}: {
  categories: Array<{ category: string; courses: number; enrollments: number }>;
}) {
  const top = categories.slice(0, 8);
  const max = Math.max(1, ...top.map((c) => c.enrollments));

  return (
    <WindowCard title="Top Categories">
      <div className="space-y-3">
        {top.map((row) => {
          const pct = (row.enrollments / max) * 100;
          return (
            <div key={row.category}>
              <div className="mb-1 flex items-center gap-3">
                <p className="flex-1 text-[13px] font-semibold text-[#1D1D1F]">{row.category}</p>
                <p className="text-[11px] text-[#AEAEB2]">{row.courses} courses</p>
                <p className="text-[12px] font-bold text-[#1D1D1F]">{row.enrollments.toLocaleString('en-IN')} enrolled</p>
              </div>
              <div className="h-2 w-full rounded-full bg-[#F5F5F7]">
                <div className="h-2 rounded-full bg-[#1D1D1F]" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
        {!top.length ? <p className="text-[12px] text-[#AEAEB2]">No category data found.</p> : null}
      </div>
    </WindowCard>
  );
}
