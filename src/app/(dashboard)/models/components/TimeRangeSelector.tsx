/**
 * @file TimeRangeSelector.tsx
 * @description Time range selector component
 * @module components/TimeRangeSelector
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Buttons and date picker for selecting metrics time range
 * (7d, 30d, 90d, year, custom).
 */

'use client';

import { useState } from 'react';
import type { TimeRange, DateRange } from '../types/models.types';

interface TimeRangeSelectorProps {
  selectedRange: TimeRange;
  dateRange?: DateRange;
  onRangeChange: (range: TimeRange, dateRange?: DateRange) => void;
  disabled?: boolean;
}

/**
 * Time range selector component with preset buttons
 * 
 * @example
 * <TimeRangeSelector 
 *   selectedRange="30d"
 *   onRangeChange={(range) => setTimeRange(range)}
 * />
 */
export default function TimeRangeSelector({
  selectedRange,
  dateRange,
  onRangeChange,
  disabled = false,
}: TimeRangeSelectorProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState(
    dateRange?.startDate.toISOString().split('T')[0] || ''
  );
  const [customEnd, setCustomEnd] = useState(
    dateRange?.endDate.toISOString().split('T')[0] || ''
  );

  const presets: Array<{ label: string; value: TimeRange }> = [
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '90D', value: '90d' },
    { label: '1Y', value: 'year' },
    { label: 'Custom', value: 'custom' },
  ];

  const handlePresetClick = (range: TimeRange) => {
    if (range === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      onRangeChange(range);
    }
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onRangeChange('custom', {
        startDate: new Date(customStart),
        endDate: new Date(customEnd),
      });
      setShowCustom(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePresetClick(preset.value)}
            disabled={disabled}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm transition-colors
              ${
                selectedRange === preset.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom Date Range Picker */}
      {showCustom && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <p className="font-semibold text-gray-900 mb-3">Select Date Range</p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full px-3 py-2 rounded border border-gray-300 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full px-3 py-2 rounded border border-gray-300 text-gray-900"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCustomApply}
              disabled={!customStart || !customEnd}
              className="flex-1 px-3 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Apply
            </button>

            <button
              onClick={() => setShowCustom(false)}
              className="flex-1 px-3 py-2 rounded bg-gray-200 text-gray-900 font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
