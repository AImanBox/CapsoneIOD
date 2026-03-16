/**
 * @file RetrainingStepsWizard.tsx
 * @description Multi-step wizard for retraining job workflow
 * @module components/RetrainingStepsWizard
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Step-by-step wizard showing the progression of a retraining job:
 * Queued → Training → Validating → Deployed (or Failed/Rolled Back)
 */

'use client';

import { useMemo } from 'react';
import type { RetrainingJob, RetrainingJobStatus } from '../types/models.types';

interface Step {
  key: RetrainingJobStatus;
  label: string;
  description: string;
  icon: string;
  estimatedDuration: string;
}

interface RetrainingStepsWizardProps {
  job: RetrainingJob;
  onStepClick?: (step: RetrainingJobStatus) => void;
}

/**
 * Retraining steps wizard component
 * 
 * @example
 * <RetrainingStepsWizard 
 *   job={retrainingJob}
 * />
 */
export default function RetrainingStepsWizard({
  job,
  onStepClick,
}: RetrainingStepsWizardProps) {
  const steps: Step[] = [
    {
      key: 'queued',
      label: 'Queued',
      description: 'Waiting to start',
      icon: '⏳',
      estimatedDuration: '< 1 min',
    },
    {
      key: 'training',
      label: 'Training',
      description: 'Model learning from data',
      icon: '🔄',
      estimatedDuration: '1-24 hours',
    },
    {
      key: 'validating',
      label: 'Validating',
      description: 'Evaluating model performance',
      icon: '✓',
      estimatedDuration: '10-30 min',
    },
    {
      key: 'deployed',
      label: 'Deployed',
      description: 'Model in production',
      icon: '🚀',
      estimatedDuration: '< 5 min',
    },
  ];

  // Determine current step index
  const currentStepIdx = useMemo(() => {
    if (job.status === 'deployed') return 3;
    if (job.status === 'validating') return 2;
    if (job.status === 'training') return 1;
    return 0;
  }, [job.status]);

  // Determine status for display
  const displayStatus =
    job.status === 'rolled_back' ? 'failed' : job.status === 'failed' ? 'failed' : job.status;

  const getStatusIcon = (stepKey: RetrainingJobStatus, stepIdx: number) => {
    if (displayStatus === 'failed') {
      if (stepIdx <= currentStepIdx) {
        return stepIdx === currentStepIdx ? '✗' : '✓';
      }
      return '○';
    }

    if (stepIdx < currentStepIdx) return '✓';
    if (stepIdx === currentStepIdx) return '●';
    return '○';
  };

  const getStatusColor = (stepIdx: number) => {
    if (displayStatus === 'failed') {
      if (stepIdx < currentStepIdx) return 'bg-emerald-600';
      if (stepIdx === currentStepIdx) return 'bg-red-600';
      return 'bg-gray-300';
    }

    if (stepIdx < currentStepIdx) return 'bg-emerald-600';
    if (stepIdx === currentStepIdx) return 'bg-blue-600';
    return 'bg-gray-300';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Retraining Progress</h3>
        <p className="text-sm text-gray-600">Job ID: {job.jobId}</p>
      </div>

      {/* Status Summary */}
      <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-600 uppercase">Current Status</span>
          <span
            className={`
              inline-block px-3 py-1 rounded-full text-sm font-bold
              ${displayStatus === 'deployed' && 'bg-emerald-100 text-emerald-700'}
              ${displayStatus === 'training' && 'bg-blue-100 text-blue-700'}
              ${displayStatus === 'validating' && 'bg-amber-100 text-amber-700'}
              ${displayStatus === 'queued' && 'bg-gray-100 text-gray-700'}
              ${displayStatus === 'failed' && 'bg-red-100 text-red-700'}
            `}
          >
            {displayStatus === 'deployed' && '✓ Deployed'}
            {displayStatus === 'training' && '🔄 Training'}
            {displayStatus === 'validating' && '⏳ Validating'}
            {displayStatus === 'queued' && '⌛ Queued'}
            {displayStatus === 'failed' && '✗ Failed'}
            {displayStatus === 'rolled_back' && '⏮ Rolled Back'}
          </span>
        </div>

        {job.status === 'training' && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${job.progress.percentComplete}%` }}
            ></div>
          </div>
        )}

        {job.status === 'failed' && job.validation?.failureReason && (
          <p className="text-sm text-red-700 mt-2">
            <span className="font-semibold">Failure Reason:</span> {job.validation.failureReason}
          </p>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, idx) => {
          const isActive = idx === currentStepIdx;
          const isCompleted = idx < currentStepIdx;
          const isFailed = displayStatus === 'failed' && idx === currentStepIdx;

          return (
            <div key={step.key} className="flex items-start gap-4">
              {/* Step Indicator */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => onStepClick?.(step.key)}
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center font-bold
                    text-white transition-all duration-200
                    ${getStatusColor(idx)}
                    ${isActive ? 'ring-4 ring-offset-2 ring-blue-400 animate-pulse' : ''}
                    ${onStepClick ? 'cursor-pointer hover:shadow-lg' : ''}
                  `}
                >
                  {getStatusIcon(step.key, idx)}
                </button>

                {idx < steps.length - 1 && (
                  <div
                    className={`
                      w-1 h-12 my-0
                      ${idx < currentStepIdx
                        ? displayStatus === 'failed'
                          ? 'bg-emerald-600'
                          : 'bg-emerald-600'
                        : 'bg-gray-300'}
                    `}
                  ></div>
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 pt-1.5">
                <h4
                  className={`
                    font-bold text-base mb-1
                    ${isActive ? 'text-blue-600' : isCompleted ? 'text-emerald-600' : 'text-gray-900'}
                    ${isFailed ? 'text-red-600' : ''}
                  `}
                >
                  {step.icon} {step.label}
                </h4>

                <p className="text-sm text-gray-600 mb-2">{step.description}</p>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="font-medium">Est. duration: {step.estimatedDuration}</span>

                  {isActive && job.status === 'training' && (
                    <span className="font-semibold text-blue-600">
                      {job.progress.percentComplete}% complete
                    </span>
                  )}

                  {isCompleted && (
                    <span className="text-emerald-600 font-medium">✓ Completed</span>
                  )}

                  {isFailed && (
                    <span className="text-red-600 font-medium">✗ Error occurred</span>
                  )}
                </div>

                {/* Additional Info */}
                {isActive && job.status === 'training' && job.training && (
                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    <p>🔢 Samples processed: {(job.progress.samplesProcessed || 0).toLocaleString()}</p>
                    <p>⏱ Elapsed: {formatElapsedTime(job.training.startedAt)}</p>
                  </div>
                )}

                {isCompleted && step.key === 'validating' && job.validation && (
                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    <p>✓ ROC-AUC: {job.validation.rocAuc.toFixed(4)}</p>
                    {job.validation.improvementOverCurrent > 0 && (
                      <p className="text-emerald-600 font-medium">
                        Improvement: +{(job.validation.improvementOverCurrent * 100).toFixed(2)}%
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline Summary */}
      {job.training && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-bold text-gray-900 mb-3">Timeline</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Started:</span>
              <span className="font-semibold text-gray-900">
                {new Date(job.training.startedAt).toLocaleString()}
              </span>
            </div>

            {job.training.completedAt && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Completed:</span>
                <span className="font-semibold text-gray-900">
                  {new Date(job.training.completedAt).toLocaleString()}
                </span>
              </div>
            )}

            {job.training.durationSeconds && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-semibold text-gray-900">
                  {formatDuration(job.training.durationSeconds)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function formatElapsedTime(startTime: string): string {
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const secondsElapsed = Math.floor((now - start) / 1000);

  if (secondsElapsed < 60) return `${secondsElapsed}s`;
  if (secondsElapsed < 3600) return `${Math.floor(secondsElapsed / 60)}m`;
  return `${Math.floor(secondsElapsed / 3600)}h`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}
