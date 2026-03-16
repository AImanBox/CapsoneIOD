/**
 * @file useModelPerformance.ts
 * @description Custom hook for fetching current model performance metrics
 * @module hooks/useModelPerformance
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Fetches and caches current model performance metrics (ROC-AUC, Precision, Recall, F1).
 * Automatically refreshes on interval and supports manual refetch.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ModelMetricsClient } from '../api/models-api';
import type { EvaluationMetrics } from '../types/models.types';

interface UseModelPerformanceState {
  data: EvaluationMetrics | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isRefreshing: boolean;
}

const apiClient = new ModelMetricsClient();

/**
 * Hook for fetching model performance metrics
 * 
 * @param modelVersion - Model version identifier
 * @param autoRefreshInterval - Interval in milliseconds (default: 60000 = 1 minute)
 * @returns Performance metrics state
 * 
 * @example
 * const { data: metrics, loading, error, refetch } = useModelPerformance('model_v2.1.0');
 */
export function useModelPerformance(
  modelVersion: string,
  autoRefreshInterval: number = 60000
): UseModelPerformanceState {
  const [data, setData] = useState<EvaluationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMetrics = useCallback(async () => {
    try {
      setError(null);
      setIsRefreshing(true);
      const result = await apiClient.getCurrentMetrics(modelVersion);
      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch metrics');
      setError(error);
      console.error('useModelPerformance error:', error);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, [modelVersion]);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, [modelVersion, fetchMetrics]);

  // Auto-refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMetrics();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, fetchMetrics]);

  return {
    data,
    loading,
    error,
    refetch: fetchMetrics,
    isRefreshing,
  };
}
