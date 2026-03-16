/**
 * @file loading.tsx
 * @description Loading skeleton for Model Performance Monitoring page
 * @module (dashboard)/models/loading
 */

/**
 * Loading skeleton UI for model monitoring dashboard
 * Shown while data is being fetched from the server
 */
export default function ModelMonitoringLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
          <div className="mt-4 h-4 bg-gray-200 rounded w-96 animate-pulse" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Metric Cards Skeleton */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse mb-4" />
              <div className="h-8 bg-gray-200 rounded w-24 animate-pulse mb-3" />
              <div className="h-3 bg-gray-100 rounded w-16 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <div className="h-6 bg-gray-200 rounded w-40 animate-pulse mb-6" />
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
