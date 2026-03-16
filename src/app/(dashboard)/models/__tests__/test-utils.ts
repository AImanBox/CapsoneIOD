/**
 * @file src/app/(dashboard)/models/__tests__/test-utils.ts
 * @description Testing utilities and helper functions
 * @created 2026-02-12
 */

import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ReactNode } from 'react';

/**
 * Custom render function that wraps components with common providers
 */
function AllProvidersWrapper({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: AllProvidersWrapper, ...options });
}

/**
 * Wait for async operations to complete
 */
export async function waitForLoadingToFinish() {
  const { waitFor } = await import('@testing-library/react');
  await waitFor(() => {
    expect(document.querySelector('[role="progressbar"]')).not.toBeInTheDocument();
  }, { timeout: 3000 }).catch(() => {
    // It's okay if loading indicator doesn't exist
  });
}

/**
 * Helper to create mock evaluation metrics
 */
export function createMockMetrics(overrides = {}) {
  return {
    modelVersion: 'model_v2.1.0',
    rocAuc: 0.876,
    precision: 0.89,
    recall: 0.82,
    f1Score: 0.855,
    confusionMatrix: {
      truePositives: 450,
      trueNegatives: 520,
      falsePositives: 65,
      falseNegatives: 105,
    },
    timestamp: new Date().toISOString(),
    dataSize: 1140,
    ...overrides,
  };
}

/**
 * Helper to create mock drift detection response
 */
export function createMockDriftResponse(overrides = {}) {
  return {
    modelVersion: 'model_v2.1.0',
    driftDetected: false,
    driftScore: 0.23,
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
      {
        name: 'Feature Correlation Drift',
        status: 'normal',
        score: 0.19,
      },
    ],
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Helper to create mock retraining job
 */
export function createMockRetrainingJob(overrides = {}) {
  return {
    jobId: `job_${Date.now()}`,
    modelVersion: 'model_v2.1.0',
    status: 'completed',
    progress: 100,
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    completedAt: new Date().toISOString(),
    metrics: {
      rocAuc: 0.892,
      precision: 0.91,
      recall: 0.84,
      f1Score: 0.873,
    },
    steps: [
      { stepName: 'Data Preparation', status: 'completed', duration: 120 },
      { stepName: 'Feature Engineering', status: 'completed', duration: 180 },
      { stepName: 'Model Training', status: 'completed', duration: 420 },
      { stepName: 'Validation', status: 'completed', duration: 60 },
    ],
    ...overrides,
  };
}

/**
 * Helper to create mock experiment
 */
export function createMockExperiment(overrides = {}) {
  return {
    experimentId: `exp_${Date.now()}`,
    name: 'Test Experiment',
    description: 'Testing new feature engineering approach',
    status: 'running',
    startedAt: new Date(Date.now() - 7200000).toISOString(),
    baseline: {
      modelVersion: 'model_v2.0.0',
      rocAuc: 0.856,
    },
    current: {
      modelVersion: 'model_v2.1.0',
      rocAuc: 0.876,
    },
    improvementPercent: 2.34,
    ...overrides,
  };
}

/**
 * Helper to create mock historical metrics
 */
export function createMockHistoricalMetrics(count = 10) {
  return Array.from({ length: count }, (_, i) => {
    const timestamp = new Date(Date.now() - i * 3600000);
    return {
      timestamp: timestamp.toISOString(),
      rocAuc: 0.85 + Math.random() * 0.03,
      precision: 0.88 + Math.random() * 0.02,
      recall: 0.81 + Math.random() * 0.02,
      f1Score: 0.845 + Math.random() * 0.025,
    };
  }).reverse();
}

/**
 * Mock delay function for simulating network latency
 */
export function mockDelay(ms: number = 100) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
