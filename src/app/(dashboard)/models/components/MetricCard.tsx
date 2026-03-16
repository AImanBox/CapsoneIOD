/**
 * @file MetricCard.tsx
 * @description Individual metric display card component
 * @module components/MetricCard
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Displays a single metric (ROC-AUC, Precision, Recall, F1)
 * with current value, baseline comparison, and trend indicator.
 */

'use client';

import { formatRocAuc, formatMetricChange } from '../utils/formatters';
import {
  getStatusColors,
  getTrendArrow,
  getMetricGradient,
} from '../utils/colorUtils';
import type { HealthStatus } from '../types/models.types';

interface MetricCardProps {
  label: string;
  value: number;
  baseline: number;
  unit?: string;
  icon?: React.ReactNode;
  status?: HealthStatus;
  className?: string;
}

/**
 * Metric card component
 * 
 * @example
 * <MetricCard
 *   label="ROC-AUC"
 *   value={0.85}
 *   baseline={0.87}
 *   status="warning"
 * />
 */
export default function MetricCard({
  label,
  value,
  baseline,
  unit,
  icon,
  status = 'healthy',
  className = '',
}: MetricCardProps) {
  const difference = value - baseline;
  const differencePercent = (difference / baseline) * 100;
  const trend = getTrendArrow(difference);
  const statusColors = getStatusColors(status);
  const gradient = getMetricGradient(value);

  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200 p-6
        hover:shadow-md transition-shadow
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon && <span className="text-2xl">{icon}</span>}
          <h3 className="font-semibold text-gray-900">{label}</h3>
        </div>
        <span
          className={`
            inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
            ${statusColors.badge} ${statusColors.text}
          `}
        >
          {trend.arrow}
        </span>
      </div>

      {/* Current Value */}
      <div className="mb-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-gray-900">
            {formatRocAuc(value, 3)}
          </span>
          {unit && <span className="text-lg text-gray-600">{unit}</span>}
        </div>
      </div>

      {/* Comparison vs Baseline */}
      <div className="pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-600 mb-2">
          vs Baseline: <span className="font-semibold">{formatRocAuc(baseline, 3)}</span>
        </p>

        <div className="flex items-center justify-between">
          <span
            className={`
              inline-block px-2 py-1 rounded text-sm font-medium
              ${trend.badge} ${trend.color === '#10b981' ? 'text-emerald-700' : ''}
              ${trend.color === '#ef4444' ? 'text-red-700' : ''}
              ${trend.color === '#6366f1' ? 'text-indigo-700' : ''}
            `}
          >
            {trend.arrow} {formatMetricChange(difference)}
          </span>

          <span className="text-xs text-gray-500">
            ({differencePercent > 0 ? '+' : ''}{differencePercent.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: statusColors.icon }}
          />
          <span className="text-gray-600">
            {status === 'healthy' && 'Model performing well'}
            {status === 'warning' && 'Performance degrading'}
            {status === 'critical' && 'Immediate action needed'}
          </span>
        </div>
      </div>
    </div>
  );
}
