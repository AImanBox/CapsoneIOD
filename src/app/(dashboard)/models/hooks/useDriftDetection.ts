/**
 * @file useDriftDetection.ts
 * @description Custom hook for fetching drift detection data
 * @module hooks/useDriftDetection
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Fetches drift detection indicators including prediction drift, feature drift,
 * and top drifted features. Supports auto-refresh.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ModelMetricsClient } from '../api/models-api';
import type { DriftDetectionResponse } from '../types/models.types';

interface UseDriftDetectionState {
  data: DriftDetectionResponse | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isRefreshing: boolean;
}

const apiClient = new ModelMetricsClient();

/**
 * Hook for fetching drift detection data
 * 
 * @param modelVersion - Model version identifier
 * @param autoRefreshInterval - Interval in milliseconds (default: 120000 = 2 minutes)
 * @returns Drift detection data state
 * 
 * @example
 * const { data: drift, loading, error } = useDriftDetection('model_v2.1.0');
 */
export function useDriftDetection(
  modelVersion: string,
  autoRefreshInterval: number = 120000
): UseDriftDetectionState {
  const [data, setData] = useState<DriftDetectionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDriftData = useCallback(async () => {
    try {
      setError(null);
      setIsRefreshing(true);
      const result = await apiClient.detectDrift(modelVersion);
      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch drift data');
      setError(error);
      console.error('useDriftDetection error:', error);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, [modelVersion]);

  // Initial fetch
  useEffect(() => {
    fetchDriftData();
  }, [modelVersion, fetchDriftData]);

  // Auto-refresh interval (less frequent than metrics)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDriftData();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, fetchDriftData]);

  return {
    data,
    loading,
    error,
    refetch: fetchDriftData,
    isRefreshing,
  };
}
