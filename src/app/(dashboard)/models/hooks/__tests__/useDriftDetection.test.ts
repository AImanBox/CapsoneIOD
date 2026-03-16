/**
 * @file src/app/(dashboard)/models/hooks/__tests__/useDriftDetection.test.ts
 * @description Unit tests for useDriftDetection hook
 * @created 2026-02-12
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useDriftDetection } from '../useDriftDetection';
import { createMockDriftResponse } from '../../__tests__/test-utils';

jest.mock('../../api/models-api', () => ({
  ModelMetricsClient: jest.fn().mockImplementation(() => ({
    detectDrift: jest.fn().mockResolvedValue(createMockDriftResponse()),
  })),
}));

describe('useDriftDetection Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should fetch drift data on mount', async () => {
    const { result } = renderHook(() => useDriftDetection('model_v2.1.0'));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.driftDetected).toBe(false);
    expect(result.current.data?.driftScore).toBe(0.23);
  });

  it('should return drift indicators', async () => {
    const { result } = renderHook(() => useDriftDetection('model_v2.1.0'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.indicators).toBeDefined();
    expect(result.current.data?.indicators?.length).toBeGreaterThan(0);
    expect(result.current.data?.indicators?.[0]).toHaveProperty('name');
    expect(result.current.data?.indicators?.[0]).toHaveProperty('status');
    expect(result.current.data?.indicators?.[0]).toHaveProperty('score');
  });

  it('should have drift threshold', async () => {
    const { result } = renderHook(() => useDriftDetection('model_v2.1.0'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.driftThreshold).toBe(0.5);
  });

  it('should auto-refresh drift checks', async () => {
    const { result } = renderHook(() => useDriftDetection('model_v2.1.0', 1000));

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

  it('should handle manual refetch of drift data', async () => {
    const { result } = renderHook(() => useDriftDetection('model_v2.1.0'));

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
      ({ modelVersion }) => useDriftDetection(modelVersion),
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

  it('should include timestamp in drift response', async () => {
    const { result } = renderHook(() => useDriftDetection('model_v2.1.0'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.timestamp).toBeDefined();
    expect(typeof result.current.data?.timestamp).toBe('string');
  });
});
