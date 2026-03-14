export default function InstructorLoading() {
  return (
    <div className="w-full animate-pulse font-[DM_Sans] space-y-6">
      {/* Page title row */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-[rgba(0,0,0,0.07)] rounded-xl" />
          <div className="h-4 w-64 bg-[rgba(0,0,0,0.04)] rounded-lg" />
        </div>
        <div className="h-9 w-32 bg-[rgba(0,0,0,0.07)] rounded-full" />
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] overflow-hidden">
            <div className="h-[44px] bg-[#F5F5F7] border-b border-[rgba(0,0,0,0.06)]" />
            <div className="p-5 space-y-3">
              <div className="h-4 w-16 bg-[rgba(0,0,0,0.06)] rounded" />
              <div className="h-8 w-24 bg-[rgba(0,0,0,0.08)] rounded-lg" />
              <div className="h-3 w-20 bg-[rgba(0,0,0,0.04)] rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] overflow-hidden">
          <div className="h-[44px] bg-[#F5F5F7] border-b border-[rgba(0,0,0,0.06)]" />
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[rgba(0,0,0,0.06)] flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-[rgba(0,0,0,0.07)] rounded" />
                  <div className="h-3 w-1/2 bg-[rgba(0,0,0,0.04)] rounded" />
                </div>
                <div className="h-6 w-16 bg-[rgba(0,0,0,0.05)] rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Side card */}
        <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] overflow-hidden">
          <div className="h-[44px] bg-[#F5F5F7] border-b border-[rgba(0,0,0,0.06)]" />
          <div className="p-6 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 bg-[rgba(0,0,0,0.05)] rounded" />
                <div className="h-10 w-full bg-[rgba(0,0,0,0.06)] rounded-xl" />
              </div>
            ))}
            <div className="h-32 w-full bg-[rgba(0,0,0,0.04)] rounded-xl mt-4" />
          </div>
        </div>
      </div>

      {/* Bottom card */}
      <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] overflow-hidden">
        <div className="h-[44px] bg-[#F5F5F7] border-b border-[rgba(0,0,0,0.06)]" />
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="aspect-video bg-[rgba(0,0,0,0.06)] rounded-xl" />
                <div className="h-4 w-3/4 bg-[rgba(0,0,0,0.07)] rounded" />
                <div className="h-3 w-1/2 bg-[rgba(0,0,0,0.04)] rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
