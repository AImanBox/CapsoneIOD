/**
 * @file src/app/(dashboard)/models/hooks/__tests__/useActiveExperiments.test.ts
 * @description Unit tests for useActiveExperiments hook
 * @created 2026-02-12
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useActiveExperiments } from '../useActiveExperiments';
import { createMockExperiment } from '../../__tests__/test-utils';

jest.mock('../../api/models-api', () => ({
  ModelMetricsClient: jest.fn().mockImplementation(() => ({
    listActiveExperiments: jest.fn().mockResolvedValue([
      createMockExperiment(),
    ]),
  })),
}));

describe('useActiveExperiments Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should fetch active experiments on mount', async () => {
    const { result } = renderHook(() => useActiveExperiments('model_v2.1.0'));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).not.toBeNull();
    expect(Array.isArray(result.current.data)).toBe(true);
  });

  it('should return experiments with required properties', async () => {
    const { result } = renderHook(() => useActiveExperiments('model_v2.1.0'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const experiment = result.current.data?.[0];
    expect(experiment).toHaveProperty('experimentId');
    expect(experiment).toHaveProperty('name');
    expect(experiment).toHaveProperty('status');
    expect(experiment).toHaveProperty('baseline');
    expect(experiment).toHaveProperty('current');
  });

  it('should auto-refresh experiments', async () => {
    const { result } = renderHook(() => useActiveExperiments('model_v2.1.0', 1000));

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
    const { result } = renderHook(() => useActiveExperiments('model_v2.1.0'));

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

  it('should handle includePast filter', async () => {
    const { result: resultCurrent } = renderHook(() =>
      useActiveExperiments('model_v2.1.0', 1000, false)
    );

    await waitFor(() => {
      expect(resultCurrent.current.loading).toBe(false);
    });

    expect(resultCurrent.current.data).not.toBeNull();

    const { result: resultAll } = renderHook(() =>
      useActiveExperiments('model_v2.1.0', 1000, true)
    );

    await waitFor(() => {
      expect(resultAll.current.loading).toBe(false);
    });

    expect(resultAll.current.data).not.toBeNull();
  });

  it('should update when model version changes', async () => {
    const { result, rerender } = renderHook(
      ({ modelVersion }) => useActiveExperiments(modelVersion),
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

  it('should have experiment improvement percent', async () => {
    const { result } = renderHook(() => useActiveExperiments('model_v2.1.0'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const experiment = result.current.data?.[0];
    expect(experiment?.improvementPercent).toBeDefined();
    expect(typeof experiment?.improvementPercent).toBe('number');
  });
});
