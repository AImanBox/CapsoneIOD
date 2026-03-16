/**
 * @file useModelHistory.ts
 * @description Custom hook for fetching historical model performance data
 * @module hooks/useModelHistory
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Fetches historical time-series metrics for a model over a specified date range.
 * Supports custom date ranges and automatic caching.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ModelMetricsClient } from '../api/models-api';
import type { EvaluationMetrics, TimeRange } from '../types/models.types';

interface UseModelHistoryState {
  data: EvaluationMetrics[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isRefreshing: boolean;
}

const apiClient = new ModelMetricsClient();

/**
 * Hook for fetching model historical metrics
 * 
 * @param modelVersion - Model version identifier
 * @param timeRange - Time range for historical data
 * @returns Historical metrics state
 * 
 * @example
 * const { data: history, loading } = useModelHistory('model_v2.1.0', {
 *   type: '30d',
 *   startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
 *   endDate: new Date()
 * });
 */
export function useModelHistory(
  modelVersion: string,
  timeRange: TimeRange
): UseModelHistoryState {
  const [data, setData] = useState<EvaluationMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      setError(null);
      setIsRefreshing(true);

      const startDate = timeRange.startDate.toISOString();
      const endDate = timeRange.endDate.toISOString();

      const result = await apiClient.getHistoricalMetrics(
        modelVersion,
        startDate,
        endDate
      );

      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch history');
      setError(error);
      console.error('useModelHistory error:', error);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, [modelVersion, timeRange]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchHistory();
  }, [modelVersion, timeRange.type, timeRange.startDate, timeRange.endDate, fetchHistory]);

  return {
    data,
    loading,
    error,
    refetch: fetchHistory,
    isRefreshing,
  };
}
