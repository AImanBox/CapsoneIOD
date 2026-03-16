/**
 * @file RetrainingSection.tsx
 * @description Retraining management section with history and controls
 * @module components/RetrainingSection
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Complete retraining section combining history table, start button,
 * configuration modal, and job details view.
 */

'use client';

import { useState } from 'react';
import RetrainingHistoryTable from './RetrainingHistoryTable';
import RetrainingJobDetails from './RetrainingJobDetails';
import RetrainingConfigurationModal from './RetrainingConfigurationModal';
import StartRetrainingButton from './StartRetrainingButton';
import type { RetrainingJob, RetrainingConfiguration } from '../types/models.types';

interface RetrainingSection Props {
  jobs: RetrainingJob[];
  isLoading?: boolean;
  onSubmitJob?: (config: RetrainingConfiguration) => Promise<void>;
  onRetryJob?: (jobId: string) => Promise<void>;
  onCancelJob?: (jobId: string) => Promise<void>;
}

/**
 * Retraining section component
 * 
 * @example
 * <RetrainingSection
 *   jobs={retrainingJobs}
 *   onSubmitJob={handleJobSubmit}
 * />
 */
export default function RetrainingSection({
  jobs,
  isLoading = false,
  onSubmitJob,
  onRetryJob,
  onCancelJob,
}: RetrainingSection Props) {
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<RetrainingJob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobError, setJobError] = useState<string>();

  const handleSubmitJob = async (config: RetrainingConfiguration) => {
    setIsSubmitting(true);
    setJobError(undefined);

    try {
      if (onSubmitJob) {
        await onSubmitJob(config);
      }
      setShowModal(false);
    } catch (err) {
      setJobError(err instanceof Error ? err.message : 'Failed to submit job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = async (jobId: string) => {
    try {
      if (onRetryJob) {
        await onRetryJob(jobId);
      }
    } catch (err) {
      setJobError(err instanceof Error ? err.message : 'Failed to retry job');
    }
  };

  const handleCancel = async (jobId: string) => {
    if (confirm('Are you sure you want to cancel this retraining job?')) {
      try {
        if (onCancelJob) {
          await onCancelJob(jobId);
        }
      } catch (err) {
        setJobError(err instanceof Error ? err.message : 'Failed to cancel job');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Model Retraining</h2>
          <p className="text-gray-600 mt-1">Manage and monitor model retraining jobs</p>
        </div>

        <StartRetrainingButton
          onClick={() => setShowModal(true)}
          disabled={isSubmitting}
          size="lg"
        />
      </div>

      {/* Error Alert */}
      {jobError && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-red-800 font-medium">✗ {jobError}</p>
          <button
            onClick={() => setJobError(undefined)}
            className="text-xs text-red-700 mt-1 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Configuration Modal */}
      <RetrainingConfigurationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmitJob}
        isLoading={isSubmitting}
      />

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* History Table */}
        <div className="lg:col-span-2">
          <RetrainingHistoryTable
            jobs={jobs}
            isLoading={isLoading}
            onViewDetails={setSelectedJob}
            onRetry={handleRetry}
            onCancel={handleCancel}
          />
        </div>

        {/* Job Details Sidebar */}
        <div>
          {selectedJob ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Selected Job</h3>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ✕
                </button>
              </div>

              <RetrainingJobDetails
                job={selectedJob}
                isExpanded={false}
              />
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
              <p className="text-gray-600 font-medium">Select a job to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
