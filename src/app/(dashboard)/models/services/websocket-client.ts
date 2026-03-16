/**
 * @file websocket-client.ts
 * @description WebSocket client for real-time model metrics updates
 * @module services/websocket
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Manages WebSocket connection for real-time metrics, drift alerts, and retraining
 * status updates. Includes auto-reconnect, heartbeat, and event handling.
 */

import type {
  WebSocketEvent,
  MetricsUpdateEvent,
  DriftAlertEvent,
  RetrainingStatusEvent,
} from '../types/models.types';

// ============================================
// TYPE DEFINITIONS
// ============================================

type EventHandler<T extends WebSocketEvent> = (event: T) => void;

interface WebSocketConfig {
  url: string;
  reconnectInterval: number; // milliseconds
  maxReconnectAttempts: number;
  heartbeatInterval: number; // milliseconds
  debug: boolean;
}

interface WebSocketHandlers {
  onMetricsUpdate?: EventHandler<MetricsUpdateEvent>;
  onDriftAlert?: EventHandler<DriftAlertEvent>;
  onRetrainingStatus?: EventHandler<RetrainingStatusEvent>;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

// ============================================
// WEBSOCKET CLIENT CLASS
// ============================================

/**
 * WebSocket client for real-time model monitoring updates
 * 
 * @class ModelMetricsWebSocketClient
 * @example
 * const client = new ModelMetricsWebSocketClient({ url: 'wss://api.example.com/ws' });
 * client.on('metricsUpdate', (event) => console.log(event));
 * client.connect();
 */
export class ModelMetricsWebSocketClient {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private handlers: WebSocketHandlers = {};
  private reconnectCount: number = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isIntentionallyClosed: boolean = false;

  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = {
      url: config.url || this.buildWebSocketUrl(),
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
      debug: config.debug ?? false,
    };
  }

  /**
   * Build WebSocket URL from environment or default
   */
  private buildWebSocketUrl(): string {
    if (typeof window === 'undefined') return '';

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_WS_URL || window.location.host;
    return `${protocol}//${host}/api/ws/metrics`;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.isIntentionallyClosed = false;
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          this.log('WebSocket connected');
          this.reconnectCount = 0;
          this.startHeartbeat();
          this.handlers.onConnect?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (event) => {
          const error = new Error('WebSocket error');
          this.log('WebSocket error:', error);
          this.handlers.onError?.(error);
          reject(error);
        };

        this.ws.onclose = () => {
          this.log('WebSocket disconnected');
          this.stopHeartbeat();
          this.handlers.onDisconnect?.();

          if (!this.isIntentionallyClosed && this.reconnectCount < this.config.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error('WebSocket connection failed');
        this.log('WebSocket connection error:', err);
        reject(err);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();
    if (this.relocateTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.log('WebSocket disconnected intentionally');
  }

  /**
   * Subscribe to event updates
   * 
   * @param event - Event type
   * @param handler - Handler function
   */
  on<T extends WebSocketEvent['type']>(
    event: T,
    handler: EventHandler<Extract<WebSocketEvent, { type: T }>>
  ): void {
    if (event === 'metrics_updated') {
      this.handlers.onMetricsUpdate = handler as EventHandler<MetricsUpdateEvent>;
    } else if (event === 'drift_detected') {
      this.handlers.onDriftAlert = handler as EventHandler<DriftAlertEvent>;
    } else if (event === 'retraining_status') {
      this.handlers.onRetrainingStatus = handler as EventHandler<RetrainingStatusEvent>;
    }
  }

  /**
   * Set connection event handlers
   */
  setHandlers(handlers: WebSocketHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * Send message to server
   */
  send(message: Record<string, any>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.log('WebSocket not connected, cannot send message');
    }
  }

  /**
   * Subscribe to model metrics updates
   */
  subscribeToModel(modelId: string): void {
    this.send({
      type: 'subscribe',
      channel: 'model_metrics',
      modelId,
    });
  }

  /**
   * Unsubscribe from model metrics
   */
  unsubscribeFromModel(modelId: string): void {
    this.send({
      type: 'unsubscribe',
      channel: 'model_metrics',
      modelId,
    });
  }

  /**
   * Subscribe to retraining job updates
   */
  subscribeToJob(jobId: string): void {
    this.send({
      type: 'subscribe',
      channel: 'retraining_jobs',
      jobId,
    });
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(data: string): void {
    try {
      const event = JSON.parse(data) as WebSocketEvent;

      if (event.type === 'metrics_updated') {
        this.handlers.onMetricsUpdate?.(event as MetricsUpdateEvent);
      } else if (event.type === 'drift_detected') {
        this.handlers.onDriftAlert?.(event as DriftAlertEvent);
      } else if (event.type === 'retraining_status') {
        this.handlers.onRetrainingStatus?.(event as RetrainingStatusEvent);
      }
    } catch (error) {
      this.log('Error parsing WebSocket message:', error);
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    this.reconnectCount++;
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectCount - 1),
      30000 // Max 30 seconds
    );

    this.log(
      `Scheduling reconnect attempt ${this.reconnectCount}/${this.config.maxReconnectAttempts} in ${delay}ms`
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        this.log('Reconnect attempt failed:', error);
      });
    }, delay);
  }

  /**
   * Debug logging
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[WebSocket]', ...args);
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let wsInstance: ModelMetricsWebSocketClient | null = null;

/**
 * Get or create WebSocket client instance
 */
export function getWebSocketClient(config?: Partial<WebSocketConfig>): ModelMetricsWebSocketClient {
  if (!wsInstance) {
    wsInstance = new ModelMetricsWebSocketClient(config);
  }
  return wsInstance;
}

/**
 * Export default instance
 */
export const webSocketClient = getWebSocketClient({
  debug: process.env.NODE_ENV === 'development',
});
