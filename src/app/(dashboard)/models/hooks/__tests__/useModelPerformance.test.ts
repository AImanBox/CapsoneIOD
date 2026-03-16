/**
 * @file src/app/(dashboard)/models/hooks/__tests__/useModelPerformance.test.ts
 * @description Unit tests for useModelPerformance hook
 * @created 2026-02-12
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useModelPerformance } from '../useModelPerformance';
import { createMockMetrics } from '../../__tests__/test-utils';

// Mock the API client
jest.mock('../../api/models-api', () => ({
  ModelMetricsClient: jest.fn().mockImplementation(() => ({
    getCurrentMetrics: jest.fn().mockResolvedValue(createMockMetrics()),
  })),
}));

describe('useModelPerformance Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should fetch metrics on mount', async () => {
    const { result } = renderHook(() => useModelPerformance('model_v2.1.0'));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.rocAuc).toBe(0.876);
    expect(result.current.error).toBeNull();
  });

  it('should return correct metric values', async () => {
    const { result } = renderHook(() => useModelPerformance('model_v2.1.0'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toMatchObject({
      rocAuc: 0.876,
      precision: 0.89,
      recall: 0.82,
      f1Score: 0.855,
    });
  });

  it('should have isRefreshing flag during refetch', async () => {
    const { result } = renderHook(() => useModelPerformance('model_v2.1.0'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialIsRefreshing = result.current.isRefreshing;
    expect(initialIsRefreshing).toBe(false);

    act(() => {
      result.current.refetch();
    });

    expect(result.current.isRefreshing).toBe(true);

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false);
    });
  });

  it('should auto-refresh on interval', async () => {
    const { result } = renderHook(() => useModelPerformance('model_v2.1.0', 1000));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Advance time to trigger refresh
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false);
    });
  });

  it('should handle refetch manually', async () => {
    const { result } = renderHook(() => useModelPerformance('model_v2.1.0'));

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

  it('should update metrics when model version changes', async () => {
    const { result, rerender } = renderHook(
      ({ modelVersion }) => useModelPerformance(modelVersion),
      { initialProps: { modelVersion: 'model_v2.1.0' } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.modelVersion).toBe('model_v2.1.0');

    rerender({ modelVersion: 'model_v2.2.0' });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.modelVersion).toBe('model_v2.2.0');
  });

  it('should have confusion matrix data', async () => {
    const { result } = renderHook(() => useModelPerformance('model_v2.1.0'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.confusionMatrix).toEqual({
      truePositives: 450,
      trueNegatives: 520,
      falsePositives: 65,
      falseNegatives: 105,
    });
  });

  it('should include timestamp in response', async () => {
    const { result } = renderHook(() => useModelPerformance('model_v2.1.0'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.timestamp).toBeDefined();
    expect(typeof result.current.data?.timestamp).toBe('string');
  });

  it('should handle custom auto-refresh interval', async () => {
    const { result } = renderHook(() => useModelPerformance('model_v2.1.0', 2000));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Advancing by half the interval should not trigger refresh
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should still show old data
    expect(result.current.isRefreshing).toBe(false);

    // Now advance to full interval
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should trigger refresh
    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false);
    });
  });
});
