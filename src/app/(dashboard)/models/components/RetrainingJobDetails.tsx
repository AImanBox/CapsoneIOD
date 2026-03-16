/**
 * @file RetrainingJobDetails.tsx
 * @description Detailed view of a single retraining job
 * @module components/RetrainingJobDetails
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Full details panel showing job configuration, progress, validation results,
 * and timeline for a specific retraining job.
 */

'use client';

import { formatRocAuc, formatDate, formatDuration } from '../utils/formatters';
import RetrainingStepsWizard from './RetrainingStepsWizard';
import type { RetrainingJob } from '../types/models.types';

interface RetrainingJobDetailsProps {
  job: RetrainingJob;
  onClose?: () => void;
  isExpanded?: boolean;
}

/**
 * Retraining job details component
 * 
 * @example
 * <RetrainingJobDetails
 *   job={selectedJob}
 *   onClose={() => setSelectedJob(null)}
 * />
 */
export default function RetrainingJobDetails({
  job,
  onClose,
  isExpanded = true,
}: RetrainingJobDetailsProps) {
  const algorithmLabel = {
    random_forest: 'Random Forest',
    gradient_boosting: 'Gradient Boosting',
    neural_network: 'Neural Network',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {isExpanded && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Job Details</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Steps Wizard */}
      <RetrainingStepsWizard job={job} />

      {/* Job Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Algorithm</p>
            <p className="text-base font-semibold text-gray-900">
              {algorithmLabel[job.configuration.algorithm]}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Training/Validation Split</p>
            <p className="text-base font-semibold text-gray-900">
              {job.configuration.trainingDataPercent}% / {100 - job.configuration.trainingDataPercent}%
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
              Validation Strategy
            </p>
            <p className="text-base font-semibold text-gray-900 capitalize">
              {job.configuration.validationStrategy.replace('_', ' ')}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Max Training Hours</p>
            <p className="text-base font-semibold text-gray-900">
              {job.configuration.resourceConstraints.maxTrainingHours}h
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase mb-1">GPU Required</p>
            <p className="text-base font-semibold text-gray-900">
              {job.configuration.resourceConstraints.gpuRequired ? '✓ Yes' : '○ No'}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Include New Data</p>
            <p className="text-base font-semibold text-gray-900">
              {job.configuration.dataSelection.includeNewData ? '✓ Yes' : '○ No'}
            </p>
          </div>
        </div>

        {/* Validation Criteria */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm font-bold text-gray-900 mb-3">Validation Criteria</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">ROC-AUC Threshold:</span>
              <span className="font-semibold text-gray-900">
                {formatRocAuc(job.configuration.validationCriteria.rocAucThreshold, 4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Performance Improvement:</span>
              <span className="font-semibold text-gray-900">
                +{formatRocAuc(job.configuration.validationCriteria.performanceImprovement, 4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Max Drift Increase:</span>
              <span className="font-semibold text-gray-900">
                {(job.configuration.validationCriteria.maxDriftIncrease * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Results */}
      {job.validation && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Validation Results</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-xs font-semibold text-blue-600 uppercase mb-1">ROC-AUC</p>
              <p className="text-3xl font-bold text-blue-900">{formatRocAuc(job.validation.rocAuc)}</p>
            </div>

            <div
              className={`
                p-4 rounded-lg border
                ${
                  job.validation.improvementOverCurrent > 0
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-red-50 border-red-200'
                }
              `}
            >
              <p
                className={`
                  text-xs font-semibold uppercase mb-1
                  ${job.validation.improvementOverCurrent > 0 ? 'text-emerald-600' : 'text-red-600'}
                `}
              >
                Improvement vs Current
              </p>
              <p
                className={`
                  text-3xl font-bold
                  ${job.validation.improvementOverCurrent > 0 ? 'text-emerald-900' : 'text-red-900'}
                `}
              >
                {job.validation.improvementOverCurrent > 0 ? '+' : ''}
                {formatRocAuc(job.validation.improvementOverCurrent)}
              </p>
            </div>

            {job.validation.precision !== undefined && (
              <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                <p className="text-xs font-semibold text-purple-600 uppercase mb-1">Precision</p>
                <p className="text-3xl font-bold text-purple-900">
                  {formatRocAuc(job.validation.precision)}
                </p>
              </div>
            )}

            {job.validation.recall !== undefined && (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-xs font-semibold text-amber-600 uppercase mb-1">Recall</p>
                <p className="text-3xl font-bold text-amber-900">
                  {formatRocAuc(job.validation.recall)}
                </p>
              </div>
            )}
          </div>

          {job.validation.failureReason && (
            <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm font-semibold text-red-600 mb-1">Failure Reason</p>
              <p className="text-red-700">{job.validation.failureReason}</p>
            </div>
          )}
        </div>
      )}

      {/* Job Metadata */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Metadata</h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Job ID</span>
            <span className="font-mono font-semibold text-gray-900">{job.jobId}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Parent Model</span>
            <span className="font-semibold text-gray-900">{job.parentModelVersion}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Triggered By</span>
            <span className="font-semibold text-gray-900 capitalize">
              {job.triggeredBy.reason.replace('_', ' ')}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Created</span>
            <span className="font-semibold text-gray-900">
              {formatDate(job.triggeredBy.triggeredAt)}
            </span>
          </div>

          {job.training?.completedAt && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration</span>
                <span className="font-semibold text-gray-900">
                  {formatDuration(job.training.durationSeconds ?? 0)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Completed</span>
                <span className="font-semibold text-gray-900">
                  {formatDate(job.training.completedAt)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
