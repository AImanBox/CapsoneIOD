/**
 * @file useMetricsSubscription.ts
 * @description Custom hook for WebSocket subscription to real-time metrics
 * @module hooks/useMetricsSubscription
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Subscribes to WebSocket events for real-time model metrics, drift alerts,
 * and retraining status updates. Handles connection management automatically.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ModelMetricsWebSocketClient } from '../services/websocket-client';
import type { WebSocketEvent } from '../types/models.types';

interface UseMetricsSubscriptionState {
  isConnected: boolean;
  lastUpdate: Date | null;
  events: WebSocketEvent[];
  error: Error | null;
  subscribe: (eventType: string) => void;
  unsubscribe: (eventType: string) => void;
  clearEvents: () => void;
}

// Singleton WebSocket client instance
let wsClient: ModelMetricsWebSocketClient | null = null;

function getWebSocketClient(): ModelMetricsWebSocketClient {
  if (!wsClient) {
    wsClient = new ModelMetricsWebSocketClient();
  }
  return wsClient;
}

/**
 * Hook for real-time metrics subscription via WebSocket
 * 
 * @param modelVersion - Model version identifier
 * @param eventTypes - Initial event types to subscribe to
 * @param maxEvents - Maximum events to store (default: 100)
 * @returns WebSocket subscription state
 * 
 * @example
 * const { isConnected, events } = useMetricsSubscription('model_v2.1.0', [
 *   'metrics_update',
 *   'drift_alert'
 * ]);
 */
export function useMetricsSubscription(
  modelVersion: string,
  eventTypes: string[] = ['metrics_update', 'drift_alert', 'retraining_status'],
  maxEvents: number = 100
): UseMetricsSubscriptionState {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<WebSocketEvent[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const wsClient = getWebSocketClient();

  const handleEvent = useCallback(
    (event: WebSocketEvent) => {
      setEvents((prevEvents) => {
        const updated = [event, ...prevEvents].slice(0, maxEvents);
        return updated;
      });
      setLastUpdate(new Date());
    },
    [maxEvents]
  );

  const subscribe = useCallback(
    (eventType: string) => {
      try {
        wsClient.subscribe(eventType, handleEvent);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to subscribe');
        setError(error);
        console.error('WebSocket subscribe error:', error);
      }
    },
    [wsClient, handleEvent]
  );

  const unsubscribe = useCallback(
    (eventType: string) => {
      try {
        wsClient.unsubscribe(eventType);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to unsubscribe');
        setError(error);
        console.error('WebSocket unsubscribe error:', error);
      }
    },
    [wsClient]
  );

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Connect WebSocket and subscribe to events
  useEffect(() => {
    try {
      if (!isConnected) {
        wsClient.connect(`wss://api.example.com/ws/models/${modelVersion}`);
        setIsConnected(true);
      }

      // Subscribe to all requested event types
      eventTypes.forEach((type) => {
        subscribe(type);
      });

      return () => {
        // Cleanup: unsubscribe from event types on unmount
        eventTypes.forEach((type) => {
          unsubscribe(type);
        });
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('WebSocket connection failed');
      setError(error);
      console.error('useMetricsSubscription error:', error);
    }
  }, [modelVersion, eventTypes, isConnected, wsClient, subscribe, unsubscribe]);

  // Listen for connection changes
  useEffect(() => {
    const handleConnectionChange = (connected: boolean) => {
      setIsConnected(connected);
    };

    // In a real implementation, WebSocketClient would emit connection events
    // This is a placeholder for the pattern
    return () => {
      // Cleanup
    };
  }, [wsClient]);

  return {
    isConnected,
    lastUpdate,
    events,
    error,
    subscribe,
    unsubscribe,
    clearEvents,
  };
}
