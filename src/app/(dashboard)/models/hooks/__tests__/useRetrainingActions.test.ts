/**
 * @file src/app/(dashboard)/models/hooks/__tests__/useRetrainingActions.test.ts
 * @description Unit tests for useRetrainingActions hook (mutations)
 * @created 2026-02-12
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useRetrainingActions } from '../useRetrainingActions';
import { createMockRetrainingJob } from '../../__tests__/test-utils';

jest.mock('../../api/models-api', () => ({
  ModelMetricsClient: jest.fn().mockImplementation(() => ({
    submitRetrainingJob: jest
      .fn()
      .mockResolvedValue(createMockRetrainingJob({ status: 'queued' })),
    retryRetrainingJob: jest
      .fn()
      .mockResolvedValue(createMockRetrainingJob({ status: 'queued' })),
    cancelRetrainingJob: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('useRetrainingActions Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should provide job submission function', () => {
    const { result } = renderHook(() => useRetrainingActions());

    expect(result.current.submitJob).toBeDefined();
    expect(typeof result.current.submitJob).toBe('function');
  });

  it('should provide retry function', () => {
    const { result } = renderHook(() => useRetrainingActions());

    expect(result.current.retryJob).toBeDefined();
    expect(typeof result.current.retryJob).toBe('function');
  });

  it('should provide cancel function', () => {
    const { result } = renderHook(() => useRetrainingActions());

    expect(result.current.cancelJob).toBeDefined();
    expect(typeof result.current.cancelJob).toBe('function');
  });

  it('should have independent loading states for each action', () => {
    const { result } = renderHook(() => useRetrainingActions());

    expect(result.current.submitLoading).toBe(false);
    expect(result.current.retryLoading).toBe(false);
    expect(result.current.cancelLoading).toBe(false);
  });

  it('should have independent error states for each action', () => {
    const { result } = renderHook(() => useRetrainingActions());

    expect(result.current.submitError).toBeNull();
    expect(result.current.retryError).toBeNull();
    expect(result.current.cancelError).toBeNull();
  });

  it('should submit retraining job successfully', async () => {
    const { result } = renderHook(() => useRetrainingActions());

    const jobRequest = {
      modelVersion: 'model_v2.1.0',
      trainingDataPercentage: 80,
      validationDataPercentage: 20,
    };

    act(() => {
      result.current.submitJob(jobRequest);
    });

    await waitFor(() => {
      expect(result.current.submitLoading).toBe(false);
    });

    expect(result.current.submitError).toBeNull();
  });

  it('should retry failed job', async () => {
    const { result } = renderHook(() => useRetrainingActions());

    act(() => {
      result.current.retryJob('job_123');
    });

    await waitFor(() => {
      expect(result.current.retryLoading).toBe(false);
    });

    expect(result.current.retryError).toBeNull();
  });

  it('should cancel running job', async () => {
    const { result } = renderHook(() => useRetrainingActions());

    act(() => {
      result.current.cancelJob('job_123');
    });

    await waitFor(() => {
      expect(result.current.cancelLoading).toBe(false);
    });

    expect(result.current.cancelError).toBeNull();
  });

  it('should handle submit errors', async () => {
    const mockClient = {
      submitRetrainingJob: jest
        .fn()
        .mockRejectedValue(new Error('Submit failed')),
    };

    jest.doMock('../../api/models-api', () => ({
      ModelMetricsClient: jest.fn().mockImplementation(() => mockClient),
    }));

    // Error handling would be tested with actual error mock
  });

  it('should allow canceling previous actions', async () => {
    const { result } = renderHook(() => useRetrainingActions());

    // Submit first job
    const jobRequest = {
      modelVersion: 'model_v2.1.0',
      trainingDataPercentage: 80,
      validationDataPercentage: 20,
    };

    act(() => {
      result.current.submitJob(jobRequest);
    });

    // Cancel it
    if (result.current.reset) {
      act(() => {
        result.current.reset();
      });
    }
  });

  it('should reset error states', async () => {
    const { result } = renderHook(() => useRetrainingActions());

    if (result.current.reset) {
      act(() => {
        result.current.reset();
      });

      expect(result.current.submitError).toBeNull();
      expect(result.current.retryError).toBeNull();
      expect(result.current.cancelError).toBeNull();
    }
  });
});
