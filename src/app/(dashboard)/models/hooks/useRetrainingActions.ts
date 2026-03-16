/**
 * @file useRetrainingActions.ts
 * @description Custom hook for retraining job mutations (create, retry, cancel)
 * @module hooks/useRetrainingActions
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Provides mutation functions for managing retraining jobs:
 * submit new job, retry failed job, cancel running job.
 */

'use client';

import { useState, useCallback } from 'react';
import { ModelMetricsClient } from '../api/models-api';
import type { RetrainingConfiguration, RetrainingJob } from '../types/models.types';

interface MutationState {
  loading: boolean;
  error: Error | null;
}

interface UseRetrainingActionsState {
  submitJob: (modelVersion: string, config: RetrainingConfiguration) => Promise<RetrainingJob>;
  retryJob: (jobId: string) => Promise<RetrainingJob>;
  cancelJob: (jobId: string) => Promise<void>;
  submitState: MutationState;
  retryState: MutationState;
  cancelState: MutationState;
}

const apiClient = new ModelMetricsClient();

/**
 * Hook for retraining job mutations
 * 
 * @returns Mutation functions and states
 * 
 * @example
 * const { submitJob, submitState } = useRetrainingActions();
 * 
 * const handleSubmit = async (config) => {
 *   try {
 *     const job = await submitJob('model_v2.1.0', config);
 *     console.log('Job created:', job.jobId);
 *   } catch (err) {
 *     console.error('Failed to submit:', err);
 *   }
 * };
 */
export function useRetrainingActions(): UseRetrainingActionsState {
  const [submitState, setSubmitState] = useState<MutationState>({
    loading: false,
    error: null,
  });

  const [retryState, setRetryState] = useState<MutationState>({
    loading: false,
    error: null,
  });

  const [cancelState, setCancelState] = useState<MutationState>({
    loading: false,
    error: null,
  });

  const submitJob = useCallback(
    async (modelVersion: string, config: RetrainingConfiguration): Promise<RetrainingJob> => {
      setSubmitState({ loading: true, error: null });

      try {
        const result = await apiClient.submitRetrainingJob(modelVersion, config);
        setSubmitState({ loading: false, error: null });
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to submit retraining job');
        setSubmitState({ loading: false, error });
        throw error;
      }
    },
    []
  );

  const retryJob = useCallback(async (jobId: string): Promise<RetrainingJob> => {
    setRetryState({ loading: true, error: null });

    try {
      const result = await apiClient.retryRetrainingJob(jobId);
      setRetryState({ loading: false, error: null });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to retry retraining job');
      setRetryState({ loading: false, error });
      throw error;
    }
  }, []);

  const cancelJob = useCallback(async (jobId: string): Promise<void> => {
    setCancelState({ loading: true, error: null });

    try {
      await apiClient.cancelRetrainingJob(jobId);
      setCancelState({ loading: false, error: null });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to cancel retraining job');
      setCancelState({ loading: false, error });
      throw error;
    }
  }, []);

  return {
    submitJob,
    retryJob,
    cancelJob,
    submitState,
    retryState,
    cancelState,
  };
}
