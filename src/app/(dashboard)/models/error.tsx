/**
 * @file error.tsx
 * @description Error boundary for Model Performance Monitoring page
 * @module (dashboard)/models/error
 */

'use client';

import type { ReactNode } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary component for model monitoring dashboard
 * Displays error message with retry option
 */
export default function ModelMonitoringError({ error, reset }: ErrorProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">Model Performance Monitoring</h1>
        </div>
      </div>

      {/* Error Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-red-900 mb-4">Error Loading Dashboard</h2>

          <div className="bg-red-100 rounded p-4 mb-6 font-mono text-sm text-red-800 overflow-auto">
            {error.message}
            {error.digest && (
              <>
                <br />
                Error ID: {error.digest}
              </>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-red-800">
              An error occurred while loading the Model Performance Monitoring dashboard.
            </p>

            <div className="flex gap-4">
              <button
                onClick={reset}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>

              <a
                href="/dashboard"
                className="px-6 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back to Dashboard
              </a>
            </div>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-8 pt-8 border-t border-red-200">
              <summary className="cursor-pointer font-semibold text-red-900">
                Error Details (Development Only)
              </summary>
              <pre className="mt-4 bg-red-900 text-red-100 p-4 rounded text-xs overflow-auto">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
