/**
 * @file DriftIndicatorsSection.tsx
 * @description Section displaying all drift indicators
 * @module components/DriftIndicatorsSection
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Main section showing feature drift, prediction drift, and model drift
 * with visual gauges and status information.
 */

'use client';

import DriftGauge from './DriftGauge';
import HealthStatusBadge from './HealthStatusBadge';
import type { DriftDetectionResponse, HealthStatus } from '../types/models.types';

interface DriftIndicatorsSectionProps {
  driftData: DriftDetectionResponse;
  className?: string;
}

/**
 * Drift indicators section component
 * 
 * @example
 * <DriftIndicatorsSection driftData={driftResponse} />
 */
export default function DriftIndicatorsSection({
  driftData,
  className = '',
}: DriftIndicatorsSectionProps) {
  const statusMap: Record<string, HealthStatus> = {
    normal: 'healthy',
    warning: 'warning',
    alert: 'critical',
  };

  const overallStatus = statusMap[driftData.aggregatedStatus] as HealthStatus;

  // Get top drifting features
  const topDrifts = driftData.featureDrift.detected
    .sort((a, b) => b.driftScore - a.driftScore)
    .slice(0, 3);

  return (
    <div className={`${className}`}>
      {/* Header with overall status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Drift Indicators</h2>
          <HealthStatusBadge
            status={overallStatus}
            message={
              overallStatus === 'critical'
                ? 'Action required'
                : overallStatus === 'warning'
                  ? 'Monitor closely'
                  : 'All normal'
            }
          />
        </div>

        {driftData.summaryAlert && (
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-sm text-amber-900">{driftData.summaryAlert}</p>
          </div>
        )}

        {/* Recommendation */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Recommendation:</span>{' '}
            {driftData.modelDrift.recommendation === 'retrain_urgent'
              ? 'Retrain model immediately'
              : driftData.modelDrift.recommendation === 'retrain_soon'
                ? 'Schedule retraining within 7 days'
                : 'Continue monitoring'}
          </p>
        </div>
      </div>

      {/* Three Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <DriftGauge
          score={driftData.featureDrift.overall}
          threshold={driftData.featureDrift.threshold}
          label="Feature Drift"
          status={driftData.featureDrift.status}
        />
        <DriftGauge
          score={driftData.predictionDrift.jsDivergence}
          threshold={driftData.predictionDrift.threshold}
          label="Prediction Drift"
          status={driftData.predictionDrift.status}
        />
        <DriftGauge
          score={driftData.modelDrift.status === 'degrading' ? 0.7 : 0.2}
          threshold={0.5}
          label="Model Drift"
          status={driftData.modelDrift.status === 'degrading' ? 'alert' : 'normal'}
        />
      </div>

      {/* Top Drifting Features */}
      {topDrifts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Top Drifting Features</h3>

          <div className="space-y-3">
            {topDrifts.map((drift) => (
              <div
                key={drift.featureName}
                className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{drift.featureName}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {drift.statisticalTest} • p-value: {drift.pValue.toFixed(4)}
                  </p>
                </div>

                <div className="text-right">
                  <div className="inline-block px-2 py-1 rounded bg-amber-100 text-amber-700 text-sm font-medium">
                    {(drift.driftScore * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {drift.magnitude} drift
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
