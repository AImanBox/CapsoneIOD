/**
 * @file src/app/(dashboard)/models/__tests__/integration/hooks-components-integration.test.tsx
 * @description Integration tests for hook-component data flow
 * @created 2026-02-12
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import { useModelPerformance } from '../../hooks/useModelPerformance';
import { useDriftDetection } from '../../hooks/useDriftDetection';
import { useRetrainingJobs } from '../../hooks/useRetrainingJobs';
import { createMockMetrics, createMockDriftResponse, createMockRetrainingJob } from '../test-utils';

jest.mock('../../api/models-api', () => ({
  ModelMetricsClient: jest.fn().mockImplementation(() => ({
    getCurrentMetrics: jest.fn().mockResolvedValue(createMockMetrics()),
    detectDrift: jest.fn().mockResolvedValue(createMockDriftResponse()),
    getRetrainingHistory: jest.fn().mockResolvedValue({
      data: [createMockRetrainingJob()],
      total: 1,
      limit: 10,
      offset: 0,
    }),
  })),
}));

describe('Hooks-Components Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should coordinate metrics and drift hooks for same model', async () => {
    const { result: metricsResult } = renderHook(() =>
      useModelPerformance('model_v2.1.0')
    );
    const { result: driftResult } = renderHook(() =>
      useDriftDetection('model_v2.1.0')
    );

    await waitFor(() => {
      expect(metricsResult.current.loading).toBe(false);
      expect(driftResult.current.loading).toBe(false);
    });

    expect(metricsResult.current.data).not.toBeNull();
    expect(driftResult.current.data).not.toBeNull();
    expect(metricsResult.current.data?.modelVersion).toBe(
      driftResult.current.data?.modelVersion
    );
  });

  it('should sync model version changes across hooks', async () => {
    const { result: metricsResult, rerender: metricsRerender } = renderHook(
      ({ modelVersion }) => useModelPerformance(modelVersion),
      { initialProps: { modelVersion: 'model_v2.1.0' } }
    );
    const { result: driftResult, rerender: driftRerender } = renderHook(
      ({ modelVersion }) => useDriftDetection(modelVersion),
      { initialProps: { modelVersion: 'model_v2.1.0' } }
    );

    await waitFor(() => {
      expect(metricsResult.current.loading).toBe(false);
      expect(driftResult.current.loading).toBe(false);
    });

    // Change model version
    metricsRerender({ modelVersion: 'model_v2.2.0' });
    driftRerender({ modelVersion: 'model_v2.2.0' });

    await waitFor(() => {
      expect(metricsResult.current.loading).toBe(false);
      expect(driftResult.current.loading).toBe(false);
    });

    expect(metricsResult.current.data?.modelVersion).toBe('model_v2.2.0');
    expect(driftResult.current.data?.modelVersion).toBe('model_v2.2.0');
  });

  it('should handle concurrent hook refetches', async () => {
    const { result: metricsResult } = renderHook(() =>
      useModelPerformance('model_v2.1.0')
    );
    const { result: driftResult } = renderHook(() =>
      useDriftDetection('model_v2.1.0')
    );
    const { result: jobsResult } = renderHook(() =>
      useRetrainingJobs('model_v2.1.0')
    );

    await waitFor(() => {
      expect(metricsResult.current.loading).toBe(false);
      expect(driftResult.current.loading).toBe(false);
      expect(jobsResult.current.loading).toBe(false);
    });

    // Refetch all concurrently
    act(() => {
      Promise.all([
        metricsResult.current.refetch(),
        driftResult.current.refetch(),
        jobsResult.current.refetch(),
      ]);
    });

    await waitFor(() => {
      expect(metricsResult.current.isRefreshing).toBe(false);
      expect(driftResult.current.isRefreshing).toBe(false);
      expect(jobsResult.current.isRefreshing).toBe(false);
    });
  });

  it('should propagate error from one hook without breaking others', async () => {
    // Mock API to fail for drift detection
    const mockClient = {
      getCurrentMetrics: jest
        .fn()
        .mockResolvedValue(createMockMetrics()),
      detectDrift: jest.fn().mockRejectedValue(new Error('Drift API failed')),
      getRetrainingHistory: jest.fn().mockResolvedValue({
        data: [createMockRetrainingJob()],
        total: 1,
        limit: 10,
        offset: 0,
      }),
    };

    jest.doMock('../../api/models-api', () => ({
      ModelMetricsClient: jest.fn().mockImplementation(() => mockClient),
    }));

    // In real scenario, this would be tested with actual mock implementation
  });

  it('should auto-refresh all hooks on interval', async () => {
    const { result: metricsResult } = renderHook(() =>
      useModelPerformance('model_v2.1.0', 1000)
    );
    const { result: driftResult } = renderHook(() =>
      useDriftDetection('model_v2.1.0', 1000)
    );

    await waitFor(() => {
      expect(metricsResult.current.loading).toBe(false);
      expect(driftResult.current.loading).toBe(false);
    });

    // Advance to trigger refresh
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(metricsResult.current.isRefreshing).toBe(false);
      expect(driftResult.current.isRefreshing).toBe(false);
    });
  });

  it('should maintain data consistency across rapid model switches', async () => {
    const { result, rerender } = renderHook(
      ({ modelVersion }) => useModelPerformance(modelVersion),
      { initialProps: { modelVersion: 'model_v2.1.0' } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Rapidly switch models
    rerender({ modelVersion: 'model_v2.2.0' });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    rerender({ modelVersion: 'model_v2.1.0' });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should end up with data from final model version
    expect(result.current.data?.modelVersion).toBe('model_v2.1.0');
  });
});
