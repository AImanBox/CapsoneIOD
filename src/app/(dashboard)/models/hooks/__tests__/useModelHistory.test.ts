/**
 * @file src/app/(dashboard)/models/hooks/__tests__/useModelHistory.test.ts
 * @description Unit tests for useModelHistory hook
 * @created 2026-02-12
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useModelHistory } from '../useModelHistory';
import { createMockHistoricalMetrics } from '../../__tests__/test-utils';

jest.mock('../../api/models-api', () => ({
  ModelMetricsClient: jest.fn().mockImplementation(() => ({
    getHistoricalMetrics: jest.fn().mockResolvedValue(createMockHistoricalMetrics()),
  })),
}));

describe('useModelHistory Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should fetch historical metrics on mount', async () => {
    const { result } = renderHook(() =>
      useModelHistory('model_v2.1.0', { type: '30d' })
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).not.toBeNull();
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data?.length).toBeGreaterThan(0);
  });

  it('should return array of historical metrics', async () => {
    const { result } = renderHook(() =>
      useModelHistory('model_v2.1.0', { type: '30d' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.every(m => m.timestamp)).toBe(true);
    expect(result.current.data?.every(m => m.rocAuc !== undefined)).toBe(true);
  });

  it('should handle different time ranges', async () => {
    const { result, rerender } = renderHook(
      ({ timeRange }) => useModelHistory('model_v2.1.0', timeRange),
      { initialProps: { timeRange: { type: '7d' } } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const data7d = result.current.data;

    rerender({ timeRange: { type: '90d' } });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const data90d = result.current.data;

    // Both should have data
    expect(data7d?.length).toBeGreaterThan(0);
    expect(data90d?.length).toBeGreaterThan(0);
  });

  it('should handle custom date ranges', async () => {
    const startDate = new Date('2026-01-01').toISOString();
    const endDate = new Date('2026-02-01').toISOString();

    const { result } = renderHook(() =>
      useModelHistory('model_v2.1.0', {
        type: 'custom',
        startDate,
        endDate,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).not.toBeNull();
  });

  it('should support manual refetch', async () => {
    const { result } = renderHook(() =>
      useModelHistory('model_v2.1.0', { type: '30d' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false);
    });

    expect(result.current.error).toBeNull();
  });

  it('should update when model version changes', async () => {
    const { result, rerender } = renderHook(
      ({ modelVersion }) => useModelHistory(modelVersion, { type: '30d' }),
      { initialProps: { modelVersion: 'model_v2.1.0' } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    rerender({ modelVersion: 'model_v2.2.0' });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should have metrics with expected properties', async () => {
    const { result } = renderHook(() =>
      useModelHistory('model_v2.1.0', { type: '30d' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const firstMetric = result.current.data?.[0];
    expect(firstMetric).toHaveProperty('timestamp');
    expect(firstMetric).toHaveProperty('rocAuc');
    expect(firstMetric).toHaveProperty('precision');
    expect(firstMetric).toHaveProperty('recall');
    expect(firstMetric).toHaveProperty('f1Score');
  });
});
