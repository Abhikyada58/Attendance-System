'use client';

export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-2">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200 rounded-lg" />
          <div className="h-4 w-32 bg-gray-100 rounded" />
        </div>
        <div className="h-9 w-28 bg-gray-200 rounded-lg" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 space-y-3 shadow-sm">
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="h-8 w-14 bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-3">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="space-y-2 mt-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-4 w-4 bg-gray-200 rounded-full" />
                <div className="h-3 flex-1 bg-gray-100 rounded" style={{ width: `${70 + i * 5}%` }} />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-3">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="space-y-3 mt-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-1">
                <div className="h-3 w-28 bg-gray-200 rounded" />
                <div className="h-2 w-16 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
