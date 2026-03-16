/**
 * @file src/app/(dashboard)/models/__tests__/mocks/api-mock.ts
 * @description Mock implementation of ModelMetricsClient for testing
 * @created 2026-02-12
 */

import { jest } from '@jest/globals';
import type {
  ModelVersion,
  EvaluationMetrics,
  DriftDetectionResponse,
  Experiment,
  RetrainingJob,
  RetrainingJobRequest,
  HistoricalMetrics,
  PaginatedResponse,
  ApiResponse,
} from '../../types/models.types';

export class MockModelMetricsClient {
  private data = {
    metrics: {
      rocAuc: 0.876,
      precision: 0.89,
      recall: 0.82,
      f1Score: 0.855,
    },
    drift: {
      driftDetected: false,
      driftScore: 0.23,
    },
    experiments: [] as Experiment[],
    jobs: [] as RetrainingJob[],
  };

  async getCurrentMetrics(modelVersion: string): Promise<EvaluationMetrics> {
    return Promise.resolve({
      modelVersion,
      rocAuc: this.data.metrics.rocAuc,
      precision: this.data.metrics.precision,
      recall: this.data.metrics.recall,
      f1Score: this.data.metrics.f1Score,
      confusionMatrix: {
        truePositives: 450,
        trueNegatives: 520,
        falsePositives: 65,
        falseNegatives: 105,
      },
      timestamp: new Date().toISOString(),
      dataSize: 1140,
    });
  }

  async getHistoricalMetrics(
    modelVersion: string,
    params: { startDate?: string; endDate?: string; timeRange?: string }
  ): Promise<HistoricalMetrics[]> {
    return Promise.resolve(
      Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        rocAuc: 0.85 + Math.random() * 0.03,
        precision: 0.88 + Math.random() * 0.02,
        recall: 0.81 + Math.random() * 0.02,
        f1Score: 0.845 + Math.random() * 0.025,
      })).reverse()
    );
  }

  async detectDrift(modelVersion: string): Promise<DriftDetectionResponse> {
    return Promise.resolve({
      modelVersion,
      driftDetected: this.data.drift.driftDetected,
      driftScore: this.data.drift.driftScore,
      driftThreshold: 0.5,
      indicators: [
        {
          name: 'Input Distribution Shift',
          status: 'normal',
          score: 0.15,
        },
        {
          name: 'Prediction Distribution Shift',
          status: 'normal',
          score: 0.31,
        },
      ],
      timestamp: new Date().toISOString(),
    });
  }

  async listActiveExperiments(
    modelVersion: string,
    includePast?: boolean
  ): Promise<Experiment[]> {
    return Promise.resolve(this.data.experiments);
  }

  async getRetrainingHistory(
    modelVersion: string,
    params: { limit?: number; offset?: number }
  ): Promise<PaginatedResponse<RetrainingJob>> {
    return Promise.resolve({
      data: this.data.jobs,
      total: this.data.jobs.length,
      limit: params.limit || 10,
      offset: params.offset || 0,
    });
  }

  async submitRetrainingJob(request: RetrainingJobRequest): Promise<RetrainingJob> {
    const job: RetrainingJob = {
      jobId: `job_${Date.now()}`,
      modelVersion: request.modelVersion,
      status: 'queued',
      progress: 0,
      startedAt: new Date().toISOString(),
      completedAt: null,
      metrics: null,
      steps: [],
    };
    this.data.jobs.unshift(job);
    return Promise.resolve(job);
  }

  async retryRetrainingJob(jobId: string): Promise<RetrainingJob> {
    const job = this.data.jobs.find(j => j.jobId === jobId);
    if (!job) throw new Error('Job not found');
    job.status = 'queued';
    job.progress = 0;
    return Promise.resolve(job);
  }

  async cancelRetrainingJob(jobId: string): Promise<void> {
    const job = this.data.jobs.find(j => j.jobId === jobId);
    if (!job) throw new Error('Job not found');
    job.status = 'cancelled';
    return Promise.resolve();
  }

  // Test helpers
  setMockMetrics(metrics: Partial<typeof this.data.metrics>) {
    this.data.metrics = { ...this.data.metrics, ...metrics };
  }

  setMockDrift(drift: Partial<typeof this.data.drift>) {
    this.data.drift = { ...this.data.drift, ...drift };
  }

  addMockExperiment(experiment: Experiment) {
    this.data.experiments.push(experiment);
  }

  getMockData() {
    return this.data;
  }
}

export function createMockApiClient() {
  return new MockModelMetricsClient();
}
