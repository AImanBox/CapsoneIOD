/**
 * @file ExperimentCard.tsx
 * @description Individual A/B experiment card component
 * @module components/ExperimentCard
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Displays a single A/B test experiment with control vs challenger
 * metrics comparison and status.
 */

'use client';

import { formatRocAuc, formatMetricChange } from '../utils/formatters';
import { getExperimentStatusColor } from '../utils/colorUtils';
import type { Experiment } from '../types/models.types';

interface ExperimentCardProps {
  experiment: Experiment;
  onAdjustTraffic?: () => void;
  onStop?: () => void;
  onDecide?: () => void;
  className?: string;
}

/**
 * Experiment card component showing A/B test details
 * 
 * @example
 * <ExperimentCard 
 *   experiment={experiment}
 *   onDecide={() => handleDecision()}
 * />
 */
export default function ExperimentCard({
  experiment,
  onAdjustTraffic,
  onStop,
  onDecide,
  className = '',
}: ExperimentCardProps) {
  const progressPercent = (experiment.daysElapsed / experiment.expectedDurationDays) * 100;
  const isSignificant = experiment.statisticalTest.isSignificant;

  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200 overflow-hidden
        hover:shadow-md transition-shadow
        ${className}
      `}
    >
      {/* Header */}
      <div className={`px-6 py-4 border-b border-gray-200 ${getExperimentStatusColor(experiment.status)}`}>
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-gray-900">{experiment.name}</h3>
          <span
            className={`
              inline-block px-2 py-1 rounded text-xs font-semibold
              ${
                experiment.status === 'running'
                  ? 'bg-blue-100 text-blue-700'
                  : experiment.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
              }
            `}
          >
            {experiment.status.toUpperCase()}
          </span>
        </div>

        {/* Progress Bar */}
        {experiment.status === 'running' && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{experiment.daysElapsed} / {experiment.expectedDurationDays} days</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Control Model */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-900">
            Control: {experiment.controlModel.modelName}
          </p>
          <span className="text-sm font-bold text-gray-700">
            {experiment.controlModel.trafficPercentage}% traffic
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {['rocAuc', 'precision', 'recall'].map((metric) => (
            <div key={metric}>
              <p className="text-xs text-gray-600 mb-1">
                {metric === 'rocAuc' ? 'ROC-AUC' : metric.charAt(0).toUpperCase() + metric.slice(1)}
              </p>
              <p className="font-bold text-gray-900">
                {formatRocAuc(
                  experiment.controlModel.metrics[metric as keyof typeof experiment.controlModel.metrics] || 0,
                  3
                )}
              </p>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 mt-2">
          n={experiment.controlModel.sampleSize.toLocaleString()}
        </p>
      </div>

      {/* Challenger Model */}
      <div className="px-6 py-4 bg-blue-50 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-900">
            Challenger: {experiment.challengerModel.modelName}
          </p>
          <span className="text-sm font-bold text-gray-700">
            {experiment.challengerModel.trafficPercentage}% traffic
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {['rocAuc', 'precision', 'recall'].map((metric) => {
            const value =
              experiment.challengerModel.metrics[metric as keyof typeof experiment.challengerModel.metrics] || 0;
            const improvement =
              experiment.challengerModel.improvement[metric as keyof typeof experiment.challengerModel.improvement] || 0;

            return (
              <div key={metric}>
                <p className="text-xs text-gray-600 mb-1">
                  {metric === 'rocAuc' ? 'ROC-AUC' : metric.charAt(0).toUpperCase() + metric.slice(1)}
                </p>
                <div>
                  <p className="font-bold text-gray-900">{formatRocAuc(value, 3)}</p>
                  <p
                    className={`text-xs font-medium ${
                      improvement > 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {formatMetricChange(improvement)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-500 mt-2">
          n={experiment.challengerModel.sampleSize.toLocaleString()}
        </p>
      </div>

      {/* Statistical Test */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Statistical Significance</p>
            <p className="text-xs text-gray-600 mt-1">
              {experiment.statisticalTest.testName} • p-value: {experiment.statisticalTest.pValue.toFixed(4)}
            </p>
          </div>

          <span
            className={`
              inline-block px-2 py-1 rounded text-xs font-semibold
              ${
                isSignificant
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }
            `}
          >
            {isSignificant ? '✓ Significant' : '⚠ Not Significant (yet)'}
          </span>
        </div>

        <p className="text-xs text-gray-600 mt-2">
          Statistical Power: {(experiment.statisticalTest.powerAnalysis.power * 100).toFixed(0)}%
        </p>
      </div>

      {/* Recommendation & Actions */}
      <div className="px-6 py-4">
        <div className="mb-3">
          <p className="text-sm font-semibold text-gray-900 mb-1">Recommendation</p>
          <p className="text-sm text-gray-700">
            {experiment.recommendation === 'promote'
              ? '✅ Promote challenger'
              : experiment.recommendation === 'continue'
                ? '⚠ Continue monitoring'
                : experiment.recommendation === 'inconclusive'
                  ? '❓ Results inconclusive'
                  : '🛑 Stop experiment'}
          </p>
        </div>

        {experiment.recommendationReason && (
          <p className="text-xs text-gray-600 mb-4 italic">
            {experiment.recommendationReason}
          </p>
        )}

        {experiment.status === 'running' && (
          <div className="flex gap-2">
            {onAdjustTraffic && (
              <button
                onClick={onAdjustTraffic}
                className="flex-1 px-3 py-2 rounded bg-gray-200 text-gray-900 text-sm font-medium hover:bg-gray-300"
              >
                Adjust Traffic
              </button>
            )}

            {onStop && (
              <button
                onClick={onStop}
                className="flex-1 px-3 py-2 rounded bg-gray-200 text-gray-900 text-sm font-medium hover:bg-gray-300"
              >
                Stop
              </button>
            )}

            {onDecide && (
              <button
                onClick={onDecide}
                className="flex-1 px-3 py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
              >
                Decide
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
