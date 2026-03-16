/**
 * @file useRetrainingJobs.ts
 * @description Custom hook for fetching retraining job history
 * @module hooks/useRetrainingJobs
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Fetches retraining job history for a model with pagination and filtering.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ModelMetricsClient } from '../api/models-api';
import type { RetrainingJob } from '../types/models.types';

interface UseRetrainingJobsState {
  data: RetrainingJob[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isRefreshing: boolean;
}

const apiClient = new ModelMetricsClient();

/**
 * Hook for fetching retraining jobs
 * 
 * @param modelVersion - Model version identifier
 * @param limit - Maximum number of jobs to fetch (default: 50)
 * @param autoRefreshInterval - Interval in milliseconds (default: 30000 = 30 seconds)
 * @returns Retraining jobs state
 * 
 * @example
 * const { data: jobs, loading, refetch } = useRetrainingJobs('model_v2.1.0');
 */
export function useRetrainingJobs(
  modelVersion: string,
  limit: number = 50,
  autoRefreshInterval: number = 30000
): UseRetrainingJobsState {
  const [data, setData] = useState<RetrainingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      setError(null);
      setIsRefreshing(true);
      const result = await apiClient.getRetrainingHistory(modelVersion, limit);
      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch retraining jobs');
      setError(error);
      console.error('useRetrainingJobs error:', error);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, [modelVersion, limit]);

  // Initial fetch
  useEffect(() => {
    fetchJobs();
  }, [modelVersion, limit, fetchJobs]);

  // Auto-refresh interval (fast, for real-time updates)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchJobs();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, fetchJobs]);

  return {
    data,
    loading,
    error,
    refetch: fetchJobs,
    isRefreshing,
  };
}
