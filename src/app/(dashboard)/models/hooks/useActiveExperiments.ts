/**
 * @file useActiveExperiments.ts
 * @description Custom hook for fetching active A/B experiments
 * @module hooks/useActiveExperiments
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Fetches active and past A/B experiments for a model.
 * Supports filtering and auto-refresh.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ModelMetricsClient } from '../api/models-api';
import type { Experiment } from '../types/models.types';

interface UseActiveExperimentsState {
  data: Experiment[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isRefreshing: boolean;
}

const apiClient = new ModelMetricsClient();

/**
 * Hook for fetching active experiments
 * 
 * @param modelVersion - Model version identifier
 * @param includeCompleted - Include completed experiments (default: true)
 * @param autoRefreshInterval - Interval in milliseconds (default: 30000 = 30 seconds)
 * @returns Active experiments state
 * 
 * @example
 * const { data: experiments, loading } = useActiveExperiments('model_v2.1.0');
 */
export function useActiveExperiments(
  modelVersion: string,
  includeCompleted: boolean = true,
  autoRefreshInterval: number = 30000
): UseActiveExperimentsState {
  const [data, setData] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchExperiments = useCallback(async () => {
    try {
      setError(null);
      setIsRefreshing(true);
      const result = await apiClient.listActiveExperiments(modelVersion);
      
      const filtered = includeCompleted 
        ? result 
        : result.filter(e => e.status === 'running');
      
      setData(filtered);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch experiments');
      setError(error);
      console.error('useActiveExperiments error:', error);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, [modelVersion, includeCompleted]);

  // Initial fetch
  useEffect(() => {
    fetchExperiments();
  }, [modelVersion, includeCompleted, fetchExperiments]);

  // Auto-refresh interval (fast, for real-time updates)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchExperiments();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, fetchExperiments]);

  return {
    data,
    loading,
    error,
    refetch: fetchExperiments,
    isRefreshing,
  };
}
