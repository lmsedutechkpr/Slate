'use client';

type GeoRow = { name: string; count: number; state?: string };

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

function List({ rows, showState = false }: { rows: GeoRow[]; showState?: boolean }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const pct = (row.count / max) * 100;
        return (
          <div key={`${row.name}-${row.state || ''}`} className="text-[12px]">
            <div className="mb-1 flex items-center gap-3">
              <div className="flex-1">
                <p className="font-medium text-[#1D1D1F]">{row.name}</p>
                {showState && row.state ? <p className="text-[10px] text-[#AEAEB2]">{row.state}</p> : null}
              </div>
              <p className="font-semibold text-[#1D1D1F]">{row.count.toLocaleString('en-IN')}</p>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#F5F5F7]">
              <div className="h-1.5 rounded-full bg-[#1D1D1F]" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function GeographyInsights({
  states,
  cities,
}: {
  states: GeoRow[];
  cities: GeoRow[];
}) {
  return (
    <WindowCard title="Geographic Distribution">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-[13px] font-semibold text-[#1D1D1F]">Top States</p>
          <List rows={states.slice(0, 10)} />
        </div>
        <div>
          <p className="mb-3 text-[13px] font-semibold text-[#1D1D1F]">Top Cities</p>
          <List rows={cities.slice(0, 10)} showState />
        </div>
      </div>
    </WindowCard>
  );
}
