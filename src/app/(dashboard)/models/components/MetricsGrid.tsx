/**
 * @file MetricsGrid.tsx
 * @description Grid layout for metric cards
 * @module components/MetricsGrid
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Displays 4 metric cards (ROC-AUC, Precision, Recall, F1)
 * in a responsive grid layout.
 */

'use client';

import MetricCard from './MetricCard';
import type { ModelMetrics, HealthStatus } from '../types/models.types';
import { getHealthStatus } from '../utils/colorUtils';

interface MetricsGridProps {
  currentMetrics: ModelMetrics;
  baselineMetrics: ModelMetrics;
  className?: string;
}

/**
 * Grid of metric cards for dashboard
 * 
 * @example
 * <MetricsGrid 
 *   currentMetrics={metrics}
 *   baselineMetrics={baseline}
 * />
 */
export default function MetricsGrid({
  currentMetrics,
  baselineMetrics,
  className = '',
}: MetricsGridProps) {
  // Determine health status based on ROC-AUC degradation
  const rocAucStatus = getHealthStatus(currentMetrics.rocAuc, baselineMetrics.rocAuc, {
    critical: 5, // 5% degradation = critical
    warning: 2.5, // 2.5% degradation = warning
  }) as HealthStatus;

  const precisionStatus = getHealthStatus(
    currentMetrics.precision,
    baselineMetrics.precision,
    {
      critical: 5,
      warning: 2,
    }
  ) as HealthStatus;

  const recallStatus = getHealthStatus(currentMetrics.recall, baselineMetrics.recall, {
    critical: 5,
    warning: 2,
  }) as HealthStatus;

  const f1Status = getHealthStatus(currentMetrics.f1Score, baselineMetrics.f1Score, {
    critical: 5,
    warning: 2,
  }) as HealthStatus;

  const metrics = [
    {
      label: 'ROC-AUC',
      value: currentMetrics.rocAuc,
      baseline: baselineMetrics.rocAuc,
      icon: '📊',
      status: rocAucStatus,
      desc: 'Receiver Operating Characteristic - Area Under Curve',
    },
    {
      label: 'Precision',
      value: currentMetrics.precision,
      baseline: baselineMetrics.precision,
      icon: '🎯',
      status: precisionStatus,
      desc: 'True Positives / (True Positives + False Positives)',
    },
    {
      label: 'Recall',
      value: currentMetrics.recall,
      baseline: baselineMetrics.recall,
      icon: '🔍',
      status: recallStatus,
      desc: 'True Positives / (True Positives + False Negatives)',
    },
    {
      label: 'F1 Score',
      value: currentMetrics.f1Score,
      baseline: baselineMetrics.f1Score,
      icon: '⚖️',
      status: f1Status,
      desc: 'Harmonic mean of Precision and Recall',
    },
  ];

  return (
    <div className={`${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <div key={metric.label} title={metric.desc}>
            <MetricCard
              label={metric.label}
              value={metric.value}
              baseline={metric.baseline}
              icon={metric.icon}
              status={metric.status}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
