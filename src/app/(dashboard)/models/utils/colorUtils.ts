/**
 * @file colorUtils.ts
 * @description Utility functions for color mapping and theming
 * @module models/utils/colorUtils
 * @category Story10/ModelPerformanceMonitoring
 */

import type { HealthStatus } from '../types/models.types';

// ============================================
// COLOR CONSTANTS
// ============================================

export const STATUS_COLORS = {
  healthy: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100',
    text: 'text-emerald-700',
    icon: '#10b981', // emerald-500
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100',
    text: 'text-amber-700',
    icon: '#f59e0b', // amber-500
  },
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100',
    text: 'text-red-700',
    icon: '#ef4444', // red-500
  },
} as const;

export const TREND_COLORS = {
  improved: {
    badge: 'bg-emerald-100',
    text: 'text-emerald-700',
    icon: '#10b981', // emerald-500
    arrow: '↑',
  },
  degraded: {
    badge: 'bg-red-100',
    text: 'text-red-700',
    icon: '#ef4444', // red-500
    arrow: '↓',
  },
  stable: {
    badge: 'bg-indigo-100',
    text: 'text-indigo-700',
    icon: '#6366f1', // indigo-500
    arrow: '→',
  },
} as const;

export const CHART_COLORS = {
  primary: '#0ea5e9', // cyan-500 - Current model line
  baseline: '#94a3b8', // slate-400 - Baseline/reference line
  secondary: '#a78bfa', // violet-400
  success: '#10b981', // emerald-500
  danger: '#ef4444', // red-500
  warning: '#f59e0b', // amber-500
  confidenceBand: 'rgba(14, 165, 233, 0.1)', // cyan with transparency
} as const;

export const DRIFT_COLORS = {
  normal: '#10b981', // emerald-500
  warning: '#f59e0b', // amber-500
  alert: '#ef4444', // red-500
} as const;

// ============================================
// COLOR MAPPING FUNCTIONS
// ============================================

/**
 * Get status color palette based on health status
 */
export function getStatusColors(status: HealthStatus) {
  return STATUS_COLORS[status];
}

/**
 * Get status badge element (circle indicator)
 */
export function getStatusIndicator(status: HealthStatus): string {
  const indicators = {
    healthy: '🟢',
    warning: '🟡',
    critical: '🔴',
  };
  return indicators[status];
}

/**
 * Determine health status based on metric value and baseline
 */
export function getHealthStatus(
  currentValue: number,
  baselineValue: number,
  thresholds?: { critical?: number; warning?: number }
): HealthStatus {
  const degradationPercent = ((baselineValue - currentValue) / baselineValue) * 100;

  if (
    thresholds?.critical &&
    degradationPercent >= thresholds.critical
  ) {
    return 'critical';
  }

  if (
    thresholds?.warning &&
    degradationPercent >= thresholds.warning
  ) {
    return 'warning';
  }

  return 'healthy';
}

/**
 * Get color for metric change direction
 */
export function getTrendColor(difference: number) {
  if (difference > 0.005) return TREND_COLORS.improved;
  if (difference < -0.005) return TREND_COLORS.degraded;
  return TREND_COLORS.stable;
}

/**
 * Get trend arrow and color
 */
export function getTrendArrow(
  difference: number
): { arrow: string; color: string; badge: string } {
  const trend = getTrendColor(difference);
  return {
    arrow: trend.arrow,
    color: trend.icon,
    badge: trend.badge,
  };
}

/**
 * Get drift status color
 */
export function getDriftStatusColor(
  driftScore: number,
  threshold: number
): { status: 'normal' | 'warning' | 'alert'; color: string } {
  if (driftScore > threshold) {
    return { status: 'alert', color: DRIFT_COLORS.alert };
  }
  if (driftScore > threshold * 0.75) {
    return { status: 'warning', color: DRIFT_COLORS.warning };
  }
  return { status: 'normal', color: DRIFT_COLORS.normal };
}

/**
 * Get drift gauge color based on score (0-1)
 */
export function getDriftGaugeColor(score: number): string {
  if (score < 0.1) return DRIFT_COLORS.normal;
  if (score < 0.15) return '#f59e0b'; // amber - approaching threshold
  return DRIFT_COLORS.alert;
}

/**
 * Get color for statistical significance
 */
export function getSignificanceColor(pValue: number, threshold: number = 0.05): {
  color: string;
  isSignificant: boolean;
} {
  return {
    color: pValue < threshold ? DRIFT_COLORS.normal : '#94a3b8',
    isSignificant: pValue < threshold,
  };
}

/**
 * Get chart line color for metric type
 */
export function getMetricLineColor(metric: string): string {
  const colors: Record<string, string> = {
    rocAuc: CHART_COLORS.primary,
    rocAuc_baseline: CHART_COLORS.baseline,
    precision: CHART_COLORS.secondary,
    recall: CHART_COLORS.success,
    f1Score: CHART_COLORS.warning,
    accuracy: CHART_COLORS.primary,
  };
  return colors[metric] || CHART_COLORS.primary;
}

/**
 * Get gradient for metric cards (based on value 0-1)
 */
export function getMetricGradient(
  value: number,
  lowValue: number = 0.7,
  highValue: number = 0.9
): string {
  const percent = ((value - lowValue) / (highValue - lowValue)) * 100;

  if (percent < 0) return 'from-red-50 to-red-100';
  if (percent < 33) return 'from-amber-50 to-amber-100';
  if (percent < 66) return 'from-blue-50 to-blue-100';
  return 'from-emerald-50 to-emerald-100';
}

/**
 * Get background color for experiment status
 */
export function getExperimentStatusColor(
  status: 'running' | 'completed' | 'failed' | 'stopped'
): string {
  const colors = {
    running: 'bg-blue-50 border-blue-200',
    completed: 'bg-emerald-50 border-emerald-200',
    failed: 'bg-red-50 border-red-200',
    stopped: 'bg-gray-50 border-gray-200',
  };
  return colors[status];
}

/**
 * Get badge color for retraining job status
 */
export function getRetrainingStatusColor(
  status: 'queued' | 'training' | 'validating' | 'deployed' | 'failed' | 'rolled_back'
): { badge: string; text: string; icon: string } {
  const colors = {
    queued: { badge: 'bg-gray-100', text: 'text-gray-700', icon: '⏳' },
    training: { badge: 'bg-blue-100', text: 'text-blue-700', icon: '⚙️' },
    validating: { badge: 'bg-purple-100', text: 'text-purple-700', icon: '🔍' },
    deployed: { badge: 'bg-emerald-100', text: 'text-emerald-700', icon: '✅' },
    failed: { badge: 'bg-red-100', text: 'text-red-700', icon: '❌' },
    rolled_back: { badge: 'bg-amber-100', text: 'text-amber-700', icon: '⏮️' },
  };
  return colors[status];
}

/**
 * Get light variant of status color (for hover states)
 */
export function getStatusColorLight(status: HealthStatus): string {
  const lightColors = {
    healthy: 'hover:bg-emerald-100',
    warning: 'hover:bg-amber-100',
    critical: 'hover:bg-red-100',
  };
  return lightColors[status];
}

/**
 * Get border color based on status
 */
export function getStatusBorderColor(status: HealthStatus): string {
  const borderColors = {
    healthy: 'border-emerald-300',
    warning: 'border-amber-300',
    critical: 'border-red-300',
  };
  return borderColors[status];
}

/**
 * Determine color for p-value visualization
 */
export function getPValueVisualizationColor(pValue: number): string {
  if (pValue < 0.001) return '#10b981'; // Highly significant - emerald
  if (pValue < 0.01) return '#0ea5e9'; // Significant - cyan
  if (pValue < 0.05) return '#f59e0b'; // Moderately significant - amber
  return '#ef4444'; // Not significant - red
}

/**
 * Get color palette for confidence interval visualization
 */
export function getConfidenceIntervalPalette(): {
  ci95: string;
  ci90: string;
  ci80: string;
} {
  return {
    ci95: 'rgba(14, 165, 233, 0.15)',
    ci90: 'rgba(14, 165, 233, 0.10)',
    ci80: 'rgba(14, 165, 233, 0.05)',
  };
}
