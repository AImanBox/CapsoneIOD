/**
 * @file DashboardActionBar.tsx
 * @description Action toolbar for dashboard controls
 * @module components/DashboardActionBar
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Toolbar with Refresh, Export, and Settings buttons.
 */

'use client';

import { useState } from 'react';

interface DashboardActionBarProps {
  onRefresh: () => void;
  onExport?: () => void;
  onSettings?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: Date;
  className?: string;
}

/**
 * Dashboard action bar with control buttons
 * 
 * @example
 * <DashboardActionBar 
 *   onRefresh={() => refetchMetrics()}
 *   onExport={() => downloadCSV()}
 * />
 */
export default function DashboardActionBar({
  onRefresh,
  onExport,
  onSettings,
  isRefreshing = false,
  lastUpdated,
  className = '',
}: DashboardActionBarProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {/* Left: Last Updated */}
      <div className="text-sm text-gray-600">
        {lastUpdated && (
          <p>
            Last updated:{' '}
            <span className="font-medium">
              {lastUpdated.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </p>
        )}
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh metrics"
          className={`
            px-4 py-2 rounded-lg font-medium text-sm transition-all
            flex items-center gap-2
            ${
              isRefreshing
                ? 'bg-blue-100 text-blue-700 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          <svg
            className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>

        {/* Export Button */}
        {onExport && (
          <button
            onClick={onExport}
            title="Export metrics"
            className={`
              px-4 py-2 rounded-lg font-medium text-sm transition-all
              flex items-center gap-2
              bg-gray-200 text-gray-900 hover:bg-gray-300
            `}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2m0 0v-8m0 8l-4-2m4 2l4-2"
              />
            </svg>
            Export
          </button>
        )}

        {/* Settings Button */}
        {onSettings && (
          <button
            onClick={onSettings}
            title="Settings"
            className={`
              px-4 py-2 rounded-lg font-medium text-sm transition-all
              flex items-center gap-2
              bg-gray-200 text-gray-900 hover:bg-gray-300
            `}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Settings
          </button>
        )}

        {/* Info Tooltip */}
        <div
          className="relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {showTooltip && (
            <div className="absolute right-0 mt-2 w-64 bg-gray-900 text-white text-sm rounded-lg shadow-lg p-3 z-20">
              <p>• Metrics auto-refresh every 5 minutes</p>
              <p>• Click Refresh for immediate update</p>
              <p>• Export includes current view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
