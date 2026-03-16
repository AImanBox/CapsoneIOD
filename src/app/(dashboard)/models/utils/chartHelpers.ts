/**
 * @file chartHelpers.ts
 * @description Utility functions for preparing data for Recharts visualizations
 * @module models/utils/chartHelpers
 * @category Story10/ModelPerformanceMonitoring
 */

import type { TimeSeriesMetrics } from '../types/models.types';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ChartDataPoint {
  date: string;
  timestamp: number;
  rocAuc?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  ciLower?: number;
  ciUpper?: number;
}

export interface ChartConfig {
  showConfidenceInterval?: boolean;
  dateFormat?: 'short' | 'long' | 'timestamp';
  smoothing?: boolean;
  smoothingFactor?: number;
}

// ============================================
// DATA TRANSFORMATION FUNCTIONS
// ============================================

/**
 * Prepare time-series data for use with Recharts
 * 
 * @param metrics - Raw time-series metrics from API
 * @param config - Chart configuration options
 * @returns Formatted data ready for Recharts LineChart
 */
export function prepareTimeSeriesData(
  metrics: TimeSeriesMetrics[],
  config: ChartConfig = {}
): ChartDataPoint[] {
  const {
    dateFormat = 'short',
    smoothing = false,
    smoothingFactor = 0.3,
  } = config;

  let chartData = metrics.map((metric) => ({
    date: formatChartDate(metric.date, dateFormat),
    timestamp: metric.date.getTime(),
    rocAuc: metric.rocAuc,
    precision: metric.precision,
    recall: metric.recall,
    f1Score: metric.f1Score,
    ciLower: metric.confidenceIntervalLower,
    ciUpper: metric.confidenceIntervalUpper,
  }));

  if (smoothing) {
    chartData = applyExponentialSmoothing(chartData, smoothingFactor);
  }

  return chartData;
}

/**
 * Apply exponential smoothing to time-series data
 */
function applyExponentialSmoothing(
  data: ChartDataPoint[],
  factor: number
): ChartDataPoint[] {
  if (data.length === 0) return [];
  if (data.length === 1) return data;

  const smoothed: ChartDataPoint[] = [data[0]];

  for (let i = 1; i < data.length; i++) {
    const prev = smoothed[i - 1];
    const curr = data[i];

    const rocAuc =
      (curr.rocAuc ?? 0) * factor + (prev.rocAuc ?? 0) * (1 - factor);
    const precision =
      (curr.precision ?? 0) * factor + (prev.precision ?? 0) * (1 - factor);
    const recall =
      (curr.recall ?? 0) * factor + (prev.recall ?? 0) * (1 - factor);
    const f1Score =
      (curr.f1Score ?? 0) * factor + (prev.f1Score ?? 0) * (1 - factor);

    smoothed.push({
      ...curr,
      rocAuc,
      precision,
      recall,
      f1Score,
    });
  }

  return smoothed;
}

/**
 * Format date for chart display
 */
function formatChartDate(date: Date, format: 'short' | 'long' | 'timestamp'): string {
  if (format === 'timestamp') {
    return date.getTime().toString();
  }

  if (format === 'short') {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: '2-digit',
  });
}

// ============================================
// CONFIDENCE INTERVAL FUNCTIONS
// ============================================

/**
 * Calculate confidence interval bands for chart shading
 * 
 * @param data - Raw metric values
 * @param confidence - Confidence level (0.95 = 95%)
 * @returns Lower and upper bounds
 */
export function calculateConfidenceIntervalBands(
  data: number[],
  confidence: number = 0.95
): { lower: number[]; upper: number[] } {
  const n = data.length;
  if (n === 0) return { lower: [], upper: [] };

  // For simplicity, use a rolling window standard error approach
  const windowSize = Math.max(1, Math.floor(n * 0.1)); // 10% window
  const zScore = getZScore(confidence); // t-value approximation

  const lower: number[] = [];
  const upper: number[] = [];

  for (let i = 0; i < n; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(n, i + Math.ceil(windowSize / 2));
    const window = data.slice(start, end);

    const mean = window.reduce((a, b) => a + b, 0) / window.length;
    const std = Math.sqrt(
      window.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / window.length
    );
    const se = std / Math.sqrt(window.length);
    const margin = zScore * se;

    lower.push(Math.max(0, mean - margin));
    upper.push(Math.min(1, mean + margin));
  }

  return { lower, upper };
}

/**
 * Get z-score for confidence level
 */
function getZScore(confidence: number): number {
  const zScores: Record<number, number> = {
    0.8: 1.282,
    0.85: 1.44,
    0.9: 1.645,
    0.95: 1.96,
    0.99: 2.576,
  };
  return zScores[confidence] || 1.96;
}

/**
 * Prepare confidence interval band data for Recharts AreaChart
 */
export function prepareConfidenceIntervalBands(
  chartData: ChartDataPoint[]
): Array<{ date: string; ciLower: number; ciUpper: number }> {
  return chartData.map((point) => ({
    date: point.date,
    ciLower: point.ciLower ?? 0,
    ciUpper: point.ciUpper ?? 1,
  }));
}

// ============================================
// TOOLTIP & LABEL FUNCTIONS
// ============================================

/**
 * Format chart tooltip content
 */
export function formatChartTooltip(
  payload: any[],
  label: string
): string {
  if (!payload || payload.length === 0) return '';

  let content = `<div class="bg-white p-2 rounded shadow-lg border border-gray-200">`;
  content += `<p class="font-semibold text-gray-900">${label}</p>`;

  payload.forEach((entry: any) => {
    const color = entry.color || '#000';
    const value = typeof entry.value === 'number' ? entry.value.toFixed(3) : entry.value;
    content += `<p style="color: ${color}" class="text-sm">
      <span class="font-medium">${entry.name}:</span> ${value}
    </p>`;
  });

  content += `</div>`;
  return content;
}

/**
 * Create custom tooltip component for Recharts
 */
export function createCustomTooltip(config: {
  showConfidenceInterval?: boolean;
  dateFormat?: 'short' | 'long';
} = {}) {
  return ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    const data = payload[0]?.payload || {};
    const date = typeof label === 'string' ? label : new Date(label).toLocaleDateString();

    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 z-10">
        <p className="font-semibold text-gray-900 text-sm">{date}</p>

        {data.rocAuc && (
          <p className="text-sm text-cyan-600">
            <span className="font-medium">ROC-AUC:</span> {data.rocAuc.toFixed(3)}
          </p>
        )}

        {data.precision && (
          <p className="text-sm text-violet-600">
            <span className="font-medium">Precision:</span> {data.precision.toFixed(3)}
          </p>
        )}

        {data.recall && (
          <p className="text-sm text-emerald-600">
            <span className="font-medium">Recall:</span> {data.recall.toFixed(3)}
          </p>
        )}

        {config.showConfidenceInterval && data.ciLower && data.ciUpper && (
          <p className="text-sm text-gray-600 mt-1">
            <span className="font-medium">95% CI:</span> [{data.ciLower.toFixed(3)}, {data.ciUpper.toFixed(3)}]
          </p>
        )}
      </div>
    );
  };
}

/**
 * Format Y-axis label (converts 0.85 → "0.85")
 */
export function formatYAxisLabel(value: number): string {
  if (typeof value !== 'number') return '';
  if (value >= 0.95) return '1.0';
  if (value <= 0.6) return '0.6';
  return value.toFixed(2);
}

/**
 * Format X-axis label
 */
export function formatXAxisLabel(value: string | number): string {
  if (typeof value === 'number') {
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
  return String(value);
}

// ============================================
// DATA FILTERING & AGGREGATION
// ============================================

/**
 * Filter chart data by date range
 */
export function filterChartDataByDateRange(
  data: ChartDataPoint[],
  startDate: Date,
  endDate: Date
): ChartDataPoint[] {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();

  return data.filter((point) => point.timestamp >= startTime && point.timestamp <= endTime);
}

/**
 * Downsample data for performance (keep every Nth point)
 */
export function downsampleChartData(
  data: ChartDataPoint[],
  maxPoints: number = 100
): ChartDataPoint[] {
  if (data.length <= maxPoints) return data;

  const step = Math.ceil(data.length / maxPoints);
  const downsampled: ChartDataPoint[] = [];

  for (let i = 0; i < data.length; i += step) {
    downsampled.push(data[i]);
  }

  // Ensure last point is included
  if (downsampled[downsampled.length - 1] !== data[data.length - 1]) {
    downsampled.push(data[data.length - 1]);
  }

  return downsampled;
}

/**
 * Get chart dimensions based on container
 */
export function getChartDimensions(
  containerHeight: number = 400,
  containerWidth: number = 800
): { width: number; height: number } {
  return {
    width: Math.max(300, containerWidth),
    height: Math.max(200, containerHeight),
  };
}

// ============================================
// COMPARISON CHART HELPERS
// ============================================

/**
 * Prepare data for side-by-side metric comparison (A/B testing)
 */
export function prepareComparisonChartData(
  controlData: ChartDataPoint[],
  challengerData: ChartDataPoint[]
) {
  const merged = [];

  for (let i = 0; i < Math.max(controlData.length, challengerData.length); i++) {
    const point: any = {
      date: controlData[i]?.date || challengerData[i]?.date,
    };

    if (controlData[i]) {
      point.controlRocAuc = controlData[i].rocAuc;
      point.controlPrecision = controlData[i].precision;
    }

    if (challengerData[i]) {
      point.challengerRocAuc = challengerData[i].rocAuc;
      point.challengerPrecision = challengerData[i].precision;
    }

    merged.push(point);
  }

  return merged;
}

/**
 * Calculate moving average for trend analysis
 */
export function calculateMovingAverage(
  data: ChartDataPoint[],
  windowSize: number = 5
): ChartDataPoint[] {
  if (data.length < windowSize) return data;

  return data.map((point, index) => {
    const start = Math.max(0, index - Math.floor(windowSize / 2));
    const end = Math.min(data.length, index + Math.ceil(windowSize / 2));
    const window = data.slice(start, end);

    const avgRocAuc =
      window.reduce((sum, p) => sum + (p.rocAuc ?? 0), 0) / window.length;

    return {
      ...point,
      rocAuc: avgRocAuc,
    };
  });
}
