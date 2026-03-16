/**
 * @file RetrainingJobRow.tsx
 * @description Table row for a single retraining job
 * @module components/RetrainingJobRow
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Single row in retraining history table showing job status,
 * metrics, and actions.
 */

'use client';

import { formatDate, formatRocAuc, formatDuration } from '../utils/formatters';
import { getRetrainingStatusColor } from '../utils/colorUtils';
import type { RetrainingJob } from '../types/models.types';

interface RetrainingJobRowProps {
  job: RetrainingJob;
  onViewDetails?: (job: RetrainingJob) => void;
  onRetry?: (jobId: string) => void;
  onCancel?: (jobId: string) => void;
}

/**
 * Retraining job table row component
 * 
 * @example
 * <RetrainingJobRow 
 *   job={job}
 *   onViewDetails={(job) => setSelectedJob(job)}
 * />
 */
export default function RetrainingJobRow({
  job,
  onViewDetails,
  onRetry,
  onCancel,
}: RetrainingJobRowProps) {
  const statusColor = getRetrainingStatusColor(job.status);
  const progressPercent = job.progress.percentComplete;

  const statusLabel = {
    queued: 'Queued',
    training: 'Training',
    validating: 'Validating',
    deployed: 'Deployed',
    failed: 'Failed',
    rolled_back: 'Rolled Back',
  };

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
      {/* Job ID */}
      <td className="px-6 py-4">
        <p className="font-mono text-sm font-semibold text-gray-900">{job.jobId}</p>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className={statusColor.icon}></span>
          <span
            className={`
              inline-block px-2 py-1 rounded text-xs font-semibold
              ${statusColor.badge} ${statusColor.text}
            `}
          >
            {statusLabel[job.status]}
          </span>

          {job.status === 'training' && (
            <span className="text-xs text-gray-600">({progressPercent}%)</span>
          )}
        </div>
      </td>

      {/* Model Metrics */}
      <td className="px-6 py-4">
        {job.validation ? (
          <div>
            <p className="font-semibold text-gray-900">
              {formatRocAuc(job.validation.rocAuc, 3)}
            </p>
            {job.validation.improvementOverCurrent > 0 && (
              <p className="text-xs text-emerald-600 font-medium">
                +{formatRocAuc(job.validation.improvementOverCurrent, 3)}
              </p>
            )}
            {job.validation.improvementOverCurrent < 0 && (
              <p className="text-xs text-red-600 font-medium">
                {formatRocAuc(job.validation.improvementOverCurrent, 3)}
              </p>
            )}
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>

      {/* Triggered By */}
      <td className="px-6 py-4">
        <div>
          <p className="text-sm text-gray-900 capitalize">
            {job.triggeredBy.reason.replace('_', ' ')}
          </p>
          <p className="text-xs text-gray-600">{formatDate(job.triggeredBy.triggeredAt)}</p>
        </div>
      </td>

      {/* Duration */}
      <td className="px-6 py-4">
        {job.training?.durationSeconds ? (
          <span className="text-sm text-gray-900">
            {formatDuration(job.training.durationSeconds)}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>

      {/* Result */}
      <td className="px-6 py-4">
        {job.status === 'deployed' && (
          <span className="inline-block px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-semibold">
            ✓ Deployed
          </span>
        )}
        {job.status === 'failed' && (
          <div>
            <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-semibold">
              ✗ Failed
            </span>
            {job.validation?.failureReason && (
              <p className="text-xs text-gray-600 mt-1">{job.validation.failureReason}</p>
            )}
          </div>
        )}
        {job.status === 'rolled_back' && (
          <span className="inline-block px-2 py-1 rounded bg-amber-100 text-amber-700 text-xs font-semibold">
            ⏮ Rolled Back
          </span>
        )}
        {!['deployed', 'failed', 'rolled_back'].includes(job.status) && (
          <span className="text-gray-400">—</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(job)}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Details
            </button>
          )}

          {job.status === 'failed' && onRetry && (
            <button
              onClick={() => onRetry(job.jobId)}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Retry
            </button>
          )}

          {['queued', 'training', 'validating'].includes(job.status) && onCancel && (
            <button
              onClick={() => onCancel(job.jobId)}
              className="text-red-600 hover:text-red-700 font-medium text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
