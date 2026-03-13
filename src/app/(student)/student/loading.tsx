export default function StudentGlobalLoading() {
  return (
    <div className="w-full flex-1 animate-pulse p-4">
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-32 bg-gray-200 rounded mb-6"></div>
      
      {/* Header skeleton */}
      <div className="h-8 w-64 bg-gray-200 rounded mb-8"></div>
      
      {/* Top metrics skeleton row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="h-32 bg-gray-100 rounded-2xl border border-gray-100"></div>
        <div className="h-32 bg-gray-100 rounded-2xl border border-gray-100"></div>
        <div className="h-32 bg-gray-100 rounded-2xl border border-gray-100"></div>
      </div>
      
      {/* Main content grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-64 bg-gray-100 rounded-2xl border border-gray-100"></div>
          <div className="h-48 bg-gray-100 rounded-2xl border border-gray-100"></div>
        </div>
        <div className="space-y-6">
          <div className="h-96 bg-gray-100 rounded-2xl border border-gray-100"></div>
        </div>
      </div>
    </div>
  );
}
