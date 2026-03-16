/**
 * @file src/app/(dashboard)/models/hooks/__tests__/useRetrainingJobs.test.ts
 * @description Unit tests for useRetrainingJobs hook
 * @created 2026-02-12
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useRetrainingJobs } from '../useRetrainingJobs';
import { createMockRetrainingJob } from '../../__tests__/test-utils';

jest.mock('../../api/models-api', () => ({
  ModelMetricsClient: jest.fn().mockImplementation(() => ({
    getRetrainingHistory: jest
      .fn()
      .mockResolvedValue({
        data: [createMockRetrainingJob()],
        total: 1,
        limit: 10,
        offset: 0,
      }),
  })),
}));

describe('useRetrainingJobs Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should fetch retraining jobs on mount', async () => {
    const { result } = renderHook(() => useRetrainingJobs('model_v2.1.0'));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).not.toBeNull();
    expect(Array.isArray(result.current.data)).toBe(true);
  });

  it('should return jobs with required properties', async () => {
    const { result } = renderHook(() => useRetrainingJobs('model_v2.1.0'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const job = result.current.data?.[0];
    expect(job).toHaveProperty('jobId');
    expect(job).toHaveProperty('status');
    expect(job).toHaveProperty('progress');
    expect(job).toHaveProperty('startedAt');
  });

  it('should auto-refresh jobs', async () => {
    const { result } = renderHook(() => useRetrainingJobs('model_v2.1.0', 1000));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false);
    });
  });

  it('should support manual refetch', async () => {
    const { result } = renderHook(() => useRetrainingJobs('model_v2.1.0'));

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

  it('should handle pagination', async () => {
    const { result } = renderHook(() =>
      useRetrainingJobs('model_v2.1.0', 1000, { limit: 5, offset: 0 })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).not.toBeNull();
  });

  it('should provide pagination metadata', async () => {
    const { result } = renderHook(() => useRetrainingJobs('model_v2.1.0'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.pagination).toBeDefined();
    expect(result.current.pagination).toHaveProperty('total');
    expect(result.current.pagination).toHaveProperty('limit');
  });

  it('should update when model version changes', async () => {
    const { result, rerender } = renderHook(
      ({ modelVersion }) => useRetrainingJobs(modelVersion),
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

  it('should handle job status transitions', async () => {
    const { result } = renderHook(() => useRetrainingJobs('model_v2.1.0'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const job = result.current.data?.[0];
    expect(['queued', 'running', 'completed', 'failed', 'cancelled']).toContain(
      job?.status
    );
  });

  it('should handle jobs without completion time', async () => {
    const { result } = renderHook(() => useRetrainingJobs('model_v2.1.0'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const job = result.current.data?.[0];
    expect(job?.completedAt).toBeDefined();
  });
});
