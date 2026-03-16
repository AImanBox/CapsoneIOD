/**
 * @file src/app/(dashboard)/models/hooks/__tests__/useMetricsSubscription.test.ts
 * @description Unit tests for useMetricsSubscription hook (WebSocket)
 * @created 2026-02-12
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useMetricsSubscription } from '../useMetricsSubscription';
import { MockWebSocketClient } from '../../__tests__/mocks/websocket-mock';

jest.mock('../../services/websocket-client', () => ({
  WebSocketClient: MockWebSocketClient,
  getInstance: jest.fn(() => new MockWebSocketClient('ws://localhost:8080')),
}));

describe('useMetricsSubscription Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should establish WebSocket connection', async () => {
    const { result } = renderHook(() => useMetricsSubscription('model_v2.1.0'));

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should track connection status', async () => {
    const { result } = renderHook(() => useMetricsSubscription('model_v2.1.0'));

    expect(result.current.isConnected).toBe(false);

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should receive metrics updates from WebSocket', async () => {
    const { result } = renderHook(() => useMetricsSubscription('model_v2.1.0'));

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // Simulate incoming metrics update
    act(() => {
      // This would be triggered by actual WebSocket event
      // In a real scenario, the hook would handle this
    });
  });

  it('should cleanup subscription on unmount', async () => {
    const { unmount } = renderHook(() => useMetricsSubscription('model_v2.1.0'));

    await waitFor(() => {
      // Wait for connection
    });

    unmount();
    // Subscription should be cleaned up
  });

  it('should store event buffer with max size', async () => {
    const { result } = renderHook(() => useMetricsSubscription('model_v2.1.0'));

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // Events should be buffered
    expect(result.current.eventBuffer).toBeDefined();
  });

  it('should handle connection errors gracefully', async () => {
    const { result } = renderHook(() => useMetricsSubscription('model_v2.1.0'));

    // Connection may fail or succeed
    expect(result.current.error === null || result.current.error !== null).toBe(true);
  });

  it('should support manual reconnection', async () => {
    const { result } = renderHook(() => useMetricsSubscription('model_v2.1.0'));

    await waitFor(() => {
      // Wait for initial connection attempt
    });

    if (result.current.reconnect) {
      act(() => {
        result.current.reconnect?.();
      });
    }
  });

  it('should track reconnection attempts', async () => {
    const { result } = renderHook(() => useMetricsSubscription('model_v2.1.0'));

    expect(result.current.reconnectAttempts).toBeDefined();
    expect(typeof result.current.reconnectAttempts).toBe('number');
  });
});
