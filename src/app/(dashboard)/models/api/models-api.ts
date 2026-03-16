/**
 * @file models-api.ts
 * @description API client for Model Performance Monitoring endpoints
 * @module api/models
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Provides type-safe API client for all model monitoring endpoints.
 * Includes error handling, request deduplication, and caching.
 */

import type {
  ModelVersion,
  ModelPerformanceResponse,
  DriftDetectionResponse,
  Experiment,
  RetrainingJob,
  RetrainingJobRequest,
  PredictionFeedback,
  ApiResponse,
  PaginatedResponse,
} from '../types/models.types';

// ============================================
// API ENDPOINTS CONSTANTS
// ============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const MODELS_ENDPOINT = `${API_BASE_URL}/models`;
const METRICS_ENDPOINT = `${API_BASE_URL}/metrics`;
const EXPERIMENTS_ENDPOINT = `${API_BASE_URL}/experiments`;
const RETRAINING_ENDPOINT = `${API_BASE_URL}/retraining`;
const PREDICTIONS_ENDPOINT = `${API_BASE_URL}/predictions`;

// ============================================
// TYPE DEFINITIONS
// ============================================

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Record<string, any>;
  headers?: Record<string, string>;
  cache?: 'no-cache' | 'force-cache';
  revalidate?: number; // seconds
}

interface MetricsQueryParams {
  timeRange?: '7d' | '30d' | '90d' | 'custom';
  startDate?: string;
  endDate?: string;
}

interface DriftQueryParams {
  windowDays?: number;
}

interface ExperimentsQueryParams {
  includePast?: boolean;
}

interface RetrainingJobsQueryParams {
  modelId: string;
  limit?: number;
  offset?: number;
}

// ============================================
// API CLIENT CLASS
// ============================================

/**
 * Client for Model Performance Monitoring API endpoints
 * 
 * @class ModelMetricsClient
 * @example
 * const client = new ModelMetricsClient();
 * const metrics = await client.getMetrics('model_123');
 */
export class ModelMetricsClient {
  private baseUrl: string;
  private requestCache: Map<string, { data: any; timestamp: number }>;
  private cacheTTL: number; // milliseconds

  constructor(baseUrl: string = API_BASE_URL, cacheTTLSeconds: number = 300) {
    this.baseUrl = baseUrl;
    this.requestCache = new Map();
    this.cacheTTL = cacheTTLSeconds * 1000;
  }

  /**
   * Make authenticated API request
   * 
   * @param url - Full URL or endpoint path
   * @param options - Request options
   * @returns Response data or throws error
   */
  private async request<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    const cacheKey = `${options.method || 'GET'}:${fullUrl}`;

    // Check cache for GET requests
    if (
      (options.method === 'GET' || !options.method) &&
      !options.cache?.includes('no-cache')
    ) {
      const cached = this.requestCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.data;
      }
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token if available
    const token = this.getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const fetchOptions: RequestInit = {
      method: options.method || 'GET',
      headers,
    };

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(fullUrl, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error?.message || `HTTP ${response.status}`,
        response.status,
        errorData.error?.code
      );
    }

    const data = await response.json();

    // Cache successful GET responses
    if (options.method === 'GET' || !options.method) {
      this.requestCache.set(cacheKey, { data, timestamp: Date.now() });
    }

    return data;
  }

  /**
   * Get authentication token from localStorage or cookies
   */
  private getAuthToken(): string | null {
    // This will be replaced with actual auth service in production
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.requestCache.clear();
  }

  /**
   * Clear single cache entry
   */
  clearCacheEntry(key: string): void {
    this.requestCache.delete(key);
  }

  // ========================================
  // MODEL ENDPOINTS
  // ========================================

  /**
   * Get list of available model versions
   * 
   * @returns List of model versions
   */
  async listModels(): Promise<ApiResponse<ModelVersion[]>> {
    return this.request(`${MODELS_ENDPOINT}`, {
      method: 'GET',
      cache: 'force-cache',
    });
  }

  /**
   * Get specific model details
   */
  async getModel(modelId: string): Promise<ApiResponse<ModelVersion>> {
    return this.request(`${MODELS_ENDPOINT}/${modelId}`, {
      method: 'GET',
      cache: 'force-cache',
    });
  }

  // ========================================
  // METRICS ENDPOINTS
  // ========================================

  /**
   * Get current model performance metrics
   * 
   * @param modelId - Model ID
   * @param params - Query parameters (timeRange, startDate, endDate)
   * @returns Current and historical metrics
   * 
   * @example
   * const metrics = await client.getMetrics('model_123', { timeRange: '30d' });
   */
  async getMetrics(
    modelId: string,
    params?: MetricsQueryParams
  ): Promise<ApiResponse<ModelPerformanceResponse>> {
    const queryString = this.buildQueryString(params);
    return this.request(
      `${METRICS_ENDPOINT}/accuracy?modelId=${modelId}${queryString}`,
      {
        method: 'GET',
        cache: 'no-cache',
      }
    );
  }

  /**
   * Get drift detection results
   * 
   * @param modelId - Model ID
   * @param params - Query parameters
   * @returns Drift detection results
   */
  async getDrift(
    modelId: string,
    params?: DriftQueryParams
  ): Promise<ApiResponse<DriftDetectionResponse>> {
    const queryString = this.buildQueryString({ modelId, ...params });
    return this.request(`${METRICS_ENDPOINT}/drift${queryString}`, {
      method: 'GET',
      cache: 'no-cache',
    });
  }

  /**
   * Get confidence intervals for metrics
   */
  async getConfidenceIntervals(
    modelId: string,
    params?: MetricsQueryParams
  ): Promise<ApiResponse<any>> {
    const queryString = this.buildQueryString({ modelId, ...params });
    return this.request(
      `${METRICS_ENDPOINT}/confidence-intervals${queryString}`,
      {
        method: 'GET',
        cache: 'no-cache',
      }
    );
  }

  /**
   * Get historical metrics data
   */
  async getHistoricalMetrics(
    modelId: string,
    params?: MetricsQueryParams
  ): Promise<ApiResponse<any>> {
    const queryString = this.buildQueryString({ modelId, ...params });
    return this.request(
      `${METRICS_ENDPOINT}/historical${queryString}`,
      {
        method: 'GET',
        cache: 'no-cache',
      }
    );
  }

  // ========================================
  // EXPERIMENTS (A/B TESTING) ENDPOINTS
  // ========================================

  /**
   * Get all active and past experiments
   * 
   * @param params - Query parameters
   * @returns List of experiments
   */
  async getExperiments(
    params?: ExperimentsQueryParams
  ): Promise<ApiResponse<Experiment[]>> {
    const queryString = this.buildQueryString(params);
    return this.request(`${EXPERIMENTS_ENDPOINT}${queryString}`, {
      method: 'GET',
      cache: 'no-cache',
    });
  }

  /**
   * Get specific experiment details
   */
  async getExperiment(experimentId: string): Promise<ApiResponse<Experiment>> {
    return this.request(`${EXPERIMENTS_ENDPOINT}/${experimentId}`, {
      method: 'GET',
      cache: 'no-cache',
    });
  }

  /**
   * Start a new A/B test experiment
   * 
   * @param request - Experiment configuration
   * @returns Created experiment
   */
  async startExperiment(
    request: Omit<Experiment, 'experimentId' | 'startDate' | 'daysElapsed'>
  ): Promise<ApiResponse<Experiment>> {
    return this.request(`${EXPERIMENTS_ENDPOINT}/start`, {
      method: 'POST',
      body: request,
    });
  }

  /**
   * Make decision on running experiment (promote/keep/stop)
   */
  async decideExperiment(
    experimentId: string,
    decision: {
      decision: 'promote_challenger' | 'keep_control' | 'inconclusive';
      reason: string;
      deployImmediately: boolean;
    }
  ): Promise<ApiResponse<any>> {
    return this.request(`${EXPERIMENTS_ENDPOINT}/${experimentId}/decide`, {
      method: 'PUT',
      body: decision,
    });
  }

  /**
   * Adjust traffic allocation in running experiment
   */
  async adjustTrafficAllocation(
    experimentId: string,
    allocation: { control: number; challenger: number }
  ): Promise<ApiResponse<any>> {
    return this.request(
      `${EXPERIMENTS_ENDPOINT}/${experimentId}/traffic-split`,
      {
        method: 'PATCH',
        body: allocation,
      }
    );
  }

  /**
   * Stop running experiment
   */
  async stopExperiment(experimentId: string): Promise<ApiResponse<any>> {
    return this.request(`${EXPERIMENTS_ENDPOINT}/${experimentId}/stop`, {
      method: 'POST',
    });
  }

  // ========================================
  // RETRAINING ENDPOINTS
  // ========================================

  /**
   * Submit new retraining job
   * 
   * @param request - Retraining configuration
   * @returns Created retraining job
   */
  async startRetrainingJob(
    request: RetrainingJobRequest
  ): Promise<ApiResponse<RetrainingJob>> {
    return this.request(`${RETRAINING_ENDPOINT}/jobs`, {
      method: 'POST',
      body: request,
    });
  }

  /**
   * Get retraining job status
   * 
   * @param jobId - Job ID
   * @param includeLogs - Whether to include training logs
   * @returns Job status and details
   */
  async getRetrainingJobStatus(
    jobId: string,
    includeLogs: boolean = false
  ): Promise<ApiResponse<RetrainingJob>> {
    const query = includeLogs ? '?includeLogs=true' : '';
    return this.request(`${RETRAINING_ENDPOINT}/jobs/${jobId}${query}`, {
      method: 'GET',
      cache: 'no-cache',
    });
  }

  /**
   * Stream training logs (initial fetch of last N lines)
   */
  async getRetrainingLogs(
    jobId: string,
    lineCount: number = 100
  ): Promise<ApiResponse<{ logs: string }>> {
    return this.request(
      `${RETRAINING_ENDPOINT}/jobs/${jobId}/logs?lines=${lineCount}`,
      {
        method: 'GET',
        cache: 'no-cache',
      }
    );
  }

  /**
   * Get retraining job history
   * 
   * @param params - Query parameters
   * @returns Paginated list of retraining jobs
   */
  async getRetrainingHistory(
    params: RetrainingJobsQueryParams
  ): Promise<PaginatedResponse<RetrainingJob>> {
    const queryString = this.buildQueryString(params);
    return this.request(`${RETRAINING_ENDPOINT}/jobs${queryString}`, {
      method: 'GET',
      cache: 'no-cache',
    });
  }

  /**
   * Validate retraining job configuration
   */
  async validateRetrainingConfig(
    request: RetrainingJobRequest
  ): Promise<ApiResponse<{ valid: boolean; errors: string[] }>> {
    return this.request(`${RETRAINING_ENDPOINT}/validate`, {
      method: 'POST',
      body: request,
    });
  }

  /**
   * Cancel running retraining job
   */
  async cancelRetrainingJob(jobId: string): Promise<ApiResponse<any>> {
    return this.request(`${RETRAINING_ENDPOINT}/jobs/${jobId}/cancel`, {
      method: 'POST',
    });
  }

  /**
   * Deploy job to canary (if in validating state)
   */
  async deployToCanary(jobId: string): Promise<ApiResponse<any>> {
    return this.request(`${RETRAINING_ENDPOINT}/jobs/${jobId}/deploy-canary`, {
      method: 'POST',
    });
  }

  /**
   * Promote canary to full deployment
   */
  async promoteCanary(jobId: string): Promise<ApiResponse<any>> {
    return this.request(`${RETRAINING_ENDPOINT}/jobs/${jobId}/promote-canary`, {
      method: 'POST',
    });
  }

  /**
   * Rollback deployment
   */
  async rollbackDeployment(jobId: string, reason: string): Promise<ApiResponse<any>> {
    return this.request(`${RETRAINING_ENDPOINT}/jobs/${jobId}/rollback`, {
      method: 'POST',
      body: { reason },
    });
  }

  // ========================================
  // PREDICTION FEEDBACK ENDPOINTS
  // ========================================

  /**
   * Log prediction feedback (ground truth)
   * 
   * @param feedback - Prediction feedback data
   * @returns Confirmation
   */
  async logPredictionFeedback(
    feedback: PredictionFeedback
  ): Promise<ApiResponse<any>> {
    return this.request(
      `${PREDICTIONS_ENDPOINT}/${feedback.predictionId}/feedback`,
      {
        method: 'POST',
        body: feedback,
      }
    );
  }

  /**
   * Update existing prediction with ground truth
   */
  async updatePredictionFeedback(
    predictionId: string,
    feedback: Partial<PredictionFeedback>
  ): Promise<ApiResponse<any>> {
    return this.request(`${PREDICTIONS_ENDPOINT}/${predictionId}`, {
      method: 'PATCH',
      body: feedback,
    });
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Build query string from params object
   */
  private buildQueryString(params?: Record<string, any>): string {
    if (!params) return '';

    const filtered = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);

    return filtered.length > 0 ? `?${filtered.join('&')}` : '';
  }
}

// ============================================
// CUSTOM ERROR CLASS
// ============================================

/**
 * Custom error for API failures
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

/**
 * Singleton instance of ModelMetricsClient
 */
let clientInstance: ModelMetricsClient | null = null;

/**
 * Get or create client instance
 */
export function getModelMetricsClient(): ModelMetricsClient {
  if (!clientInstance) {
    clientInstance = new ModelMetricsClient();
  }
  return clientInstance;
}

/**
 * Export default instance
 */
export const modelMetricsClient = getModelMetricsClient();
