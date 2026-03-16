/**
 * @file DriftGauge.tsx
 * @description Visual gauge for drift score display
 * @module components/DriftGauge
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Circular gauge showing drift score (0-1) with color coding
 * and status label.
 */

'use client';

import { getDriftGaugeColor, DRIFT_COLORS } from '../utils/colorUtils';
import { formatDriftScore } from '../utils/formatters';

interface DriftGaugeProps {
  score: number; // 0-1
  threshold: number;
  label: string;
  status: 'normal' | 'warning' | 'alert';
  className?: string;
}

/**
 * Drift gauge component showing visual representation of drift score
 * 
 * @example
 * <DriftGauge 
 *   score={0.12}
 *   threshold={0.15}
 *   label="Feature Drift"
 *   status="normal"
 * />
 */
export default function DriftGauge({
  score,
  threshold,
  label,
  status,
  className = '',
}: DriftGaugeProps) {
  const color = getDriftGaugeColor(score);
  const circumference = 2 * Math.PI * 45; // r=45
  const offset = circumference * (1 - Math.min(score, 1));

  const statusConfig = {
    normal: { label: '✓ Normal', color: DRIFT_COLORS.normal },
    warning: { label: '⚠ Warning', color: DRIFT_COLORS.warning },
    alert: { label: '⚠ Alert', color: DRIFT_COLORS.alert },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`
        flex flex-col items-center gap-4 p-6
        bg-white rounded-lg border border-gray-200
        ${className}
      `}
    >
      {/* Label */}
      <h3 className="font-semibold text-gray-900 text-sm">{label}</h3>

      {/* Gauge SVG */}
      <div className="relative w-32 h-32">
        <svg
          className="w-full h-full transform -rotate-90"
          viewBox="0 0 120 120"
        >
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />

          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>

        {/* Center text */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          <span className="text-2xl font-bold" style={{ color }}>
            {formatDriftScore(score)}
          </span>
          <span className="text-xs text-gray-500">of {(threshold * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Status */}
      <div
        className="flex items-center gap-2 text-sm font-medium"
        style={{ color: config.color }}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: config.color }}
        />
        {config.label}
      </div>

      {/* Info */}
      <p className="text-xs text-gray-600 text-center">
        {score > threshold
          ? 'Exceeds threshold - monitor closely'
          : 'Within acceptable range'}
      </p>
    </div>
  );
}
