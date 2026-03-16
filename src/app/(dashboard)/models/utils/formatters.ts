/**
 * @file formatters.ts
 * @description Utility functions for formatting metric values and dates
 * @module models/utils/formatters
 * @category Story10/ModelPerformanceMonitoring
 */

/**
 * Format a decimal value as percentage (0.85 → "85%")
 */
export function formatAsPercentage(value: number, decimals: number = 0): string {
  if (typeof value !== 'number' || isNaN(value)) return 'N/A';
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format ROC-AUC value (0.85 → "0.85")
 */
export function formatRocAuc(value: number, decimals: number = 3): string {
  if (typeof value !== 'number' || isNaN(value)) return 'N/A';
  return value.toFixed(decimals);
}

/**
 * Format precision/recall value (0.82 → "0.82")
 */
export function formatPrecision(value: number, decimals: number = 3): string {
  if (typeof value !== 'number' || isNaN(value)) return 'N/A';
  return value.toFixed(decimals);
}

/**
 * Format F1 score (0.85 → "0.85")
 */
export function formatF1Score(value: number, decimals: number = 3): string {
  if (typeof value !== 'number' || isNaN(value)) return 'N/A';
  return value.toFixed(decimals);
}

/**
 * Format drift score (0.12 → "12%")
 */
export function formatDriftScore(value: number, decimals: number = 1): string {
  if (typeof value !== 'number' || isNaN(value)) return 'N/A';
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format p-value for statistical tests (0.03 → "0.03")
 */
export function formatPValue(value: number, decimals: number = 4): string {
  if (typeof value !== 'number' || isNaN(value)) return 'N/A';
  if (value < 0.001) return '< 0.001';
  return value.toFixed(decimals);
}

/**
 * Format metric change with sign (0.02 → "+2%", -0.02 → "-2%")
 */
export function formatMetricChange(value: number, decimals: number = 1): string {
  if (typeof value !== 'number' || isNaN(value)) return 'N/A';
  const symbol = value > 0 ? '+' : '';
  return `${symbol}${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format large numbers with commas (1234567 → "1,234,567")
 */
export function formatNumber(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) return 'N/A';
  return value.toLocaleString('en-US');
}

/**
 * Format date to readable string (Date → "Feb 12, 2026")
 */
export function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'N/A';

    if (format === 'short') {
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'N/A';
  }
}

/**
 * Format date and time (Date → "Feb 12, 2026 2:30 PM")
 */
export function formatDateTime(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'N/A';

    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'N/A';
  }
}

/**
 * Format relative time (2 hours ago, 3 days ago, etc.)
 */
export function formatRelativeTime(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'N/A';

    const now = new Date();
    const seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return formatDate(dateObj);
  } catch {
    return 'N/A';
  }
}

/**
 * Format duration in seconds to readable string (3661 → "1h 1m")
 */
export function formatDuration(seconds: number): string {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) return 'N/A';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Format bytes to human readable (1024 → "1 KB")
 */
export function formatBytes(bytes: number): string {
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes < 0) return 'N/A';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Format confidence interval (0.83, 0.87 → "[0.83, 0.87]")
 */
export function formatConfidenceInterval(lower: number, upper: number, decimals: number = 3): string {
  if (typeof lower !== 'number' || typeof upper !== 'number' || isNaN(lower) || isNaN(upper)) {
    return 'N/A';
  }
  return `[${lower.toFixed(decimals)}, ${upper.toFixed(decimals)}]`;
}

/**
 * Format model version name with metadata
 */
export function formatModelVersion(name: string, version: string): string {
  return `${name} (v${version})`;
}

/**
 * Format experiment duration progress ("5 of 14 days")
 */
export function formatExperimentProgress(daysElapsed: number, totalDays: number): string {
  return `${daysElapsed} of ${totalDays} days`;
}

/**
 * Format confidence level as percentage (0.95 → "95%")
 */
export function formatConfidenceLevel(confidence: number): string {
  return formatAsPercentage(confidence, 0);
}

/**
 * Format statistical power as percentage (0.85 → "85%")
 */
export function formatStatisticalPower(power: number): string {
  return formatAsPercentage(power, 0);
}
