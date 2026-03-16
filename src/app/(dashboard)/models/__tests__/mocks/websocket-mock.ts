/**
 * @file src/app/(dashboard)/models/__tests__/mocks/websocket-mock.ts
 * @description Mock implementation of WebSocketClient for testing
 * @created 2026-02-12
 */

import { jest } from '@jest/globals';
import type { WebSocketEvent } from '../../types/models.types';

export class MockWebSocketClient {
  private isConnected = false;
  private listeners: Map<string, ((event: any) => void)[]> = new Map();
  private reconnectDelay = 100;
  private shouldReconnectOnClose = true;

  constructor(url: string) {
    // Mock constructor - doesn't actually create WebSocket
  }

  connect(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        this.isConnected = true;
        this.emit('connected', { type: 'connected' });
        resolve();
      }, 50);
    });
  }

  disconnect(): void {
    this.isConnected = false;
    this.emit('disconnected', { type: 'disconnected' });
  }

  subscribe(eventType: string, callback: (event: WebSocketEvent) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  unsubscribe(eventType: string, callback: (event: WebSocketEvent) => void): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Test helper methods
  emit(eventType: string, event: any): void {
    const callbacks = this.listeners.get(eventType) || [];
    callbacks.forEach(callback => callback(event));
  }

  simulateMetricsUpdate(metrics: any): void {
    this.emit('metrics:update', {
      type: 'metrics:update',
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  }

  simulateJobProgress(jobId: string, progress: number): void {
    this.emit('job:progress', {
      type: 'job:progress',
      data: { jobId, progress },
      timestamp: new Date().toISOString(),
    });
  }

  simulateConnectionError(): void {
    this.isConnected = false;
    this.emit('error', {
      type: 'error',
      message: 'Connection failed',
    });
  }

  getListenerCount(eventType: string): number {
    return (this.listeners.get(eventType) || []).length;
  }

  clearAllListeners(): void {
    this.listeners.clear();
  }
}

export function createMockWebSocketClient() {
  return new MockWebSocketClient('ws://localhost:8080');
}
