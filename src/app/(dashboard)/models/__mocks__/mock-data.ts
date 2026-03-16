/**
 * @file mock-data.ts
 * @description Mock data fixtures for Model Performance Monitoring development and testing
 * @module __mocks__/models
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Provides realistic mock data that matches API schemas for component development,
 * E2E tests, and Storybook demonstrations.
 */

import type {
  ModelVersion,
  ModelMetrics,
  ModelPerformanceResponse,
  DriftDetectionResponse,
  Experiment,
  RetrainingJob,
  TimeSeriesMetrics,
} from '../types/models.types';

// ============================================
// MOCK MODEL VERSIONS
// ============================================

export const mockModelVersions: ModelVersion[] = [
  {
    id: 'model_001',
    name: 'XGBoost v5',
    algorithm: 'xgboost',
    version: '5.0.0',
    trainingDate: new Date('2026-01-08'),
    deploymentDate: new Date('2026-01-10'),
    status: 'production',
    isCurrentProduction: true,
    baselineMetrics: {
      rocAuc: 0.87,
      precision: 0.80,
      recall: 0.90,
      f1Score: 0.85,
      accuracy: 0.98,
      confidenceInterval: {
        rocAuc: { lower: 0.85, upper: 0.89, method: 'bootstrap' },
        precision: { lower: 0.78, upper: 0.82, method: 'wilson' },
        recall: { lower: 0.88, upper: 0.92, method: 'wilson' },
      },
      confusionMatrix: {
        truePositives: 180,
        falsePositives: 45,
        falseNegatives: 20,
        trueNegatives: 1755,
      },
      sampleSize: 2000,
      predictionsFeedback: 1850,
      generatedAt: new Date('2026-01-10'),
    },
    modelPath: 's3://models/xgboost_v5_20260108.pkl',
    featureCount: 23,
  },
  {
    id: 'model_002',
    name: 'LightGBM v3',
    algorithm: 'lightgbm',
    version: '3.0.0',
    trainingDate: new Date('2026-01-01'),
    deploymentDate: new Date('2026-01-03'),
    status: 'archived',
    isCurrentProduction: false,
    baselineMetrics: {
      rocAuc: 0.84,
      precision: 0.78,
      recall: 0.87,
      f1Score: 0.82,
      accuracy: 0.97,
      confidenceInterval: {
        rocAuc: { lower: 0.82, upper: 0.86, method: 'bootstrap' },
        precision: { lower: 0.76, upper: 0.80, method: 'wilson' },
        recall: { lower: 0.85, upper: 0.89, method: 'wilson' },
      },
      confusionMatrix: {
        truePositives: 174,
        falsePositives: 50,
        falseNegatives: 26,
        trueNegatives: 1750,
      },
      sampleSize: 2000,
      predictionsFeedback: 1820,
      generatedAt: new Date('2026-01-03'),
    },
    modelPath: 's3://models/lightgbm_v3_20260101.pkl',
    featureCount: 23,
  },
];

// ============================================
// MOCK TIME-SERIES METRICS
// ============================================

export const generateTimeSeriesMetrics = (days: number = 60): TimeSeriesMetrics[] => {
  const data: TimeSeriesMetrics[] = [];
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Generate realistic trend: starts at 0.87, slight degradation, recovers
    const trend = Math.sin((i / days) * Math.PI) * 0.02;
    const noise = (Math.random() - 0.5) * 0.02;
    const rocAuc = 0.87 - (i / days) * 0.03 + trend + noise;

    data.push({
      date,
      rocAuc: Math.max(0.8, Math.min(1.0, rocAuc)),
      precision: rocAuc - 0.05,
      recall: rocAuc + 0.03,
      f1Score: (2 * (rocAuc - 0.05) * (rocAuc + 0.03)) / (rocAuc - 0.05 + rocAuc + 0.03),
      sampleSize: 500 + Math.floor(Math.random() * 200),
      confidenceIntervalLower: rocAuc - 0.03,
      confidenceIntervalUpper: rocAuc + 0.03,
    });
  }

  return data;
};

export const mockTimeSeriesMetrics = generateTimeSeriesMetrics(60);

// ============================================
// MOCK CURRENT METRICS
// ============================================

export const mockCurrentMetrics: ModelMetrics = {
  rocAuc: 0.85,
  precision: 0.82,
  recall: 0.88,
  f1Score: 0.85,
  accuracy: 0.98,
  confidenceInterval: {
    rocAuc: { lower: 0.83, upper: 0.87, method: 'bootstrap' },
    precision: { lower: 0.80, upper: 0.84, method: 'wilson' },
    recall: { lower: 0.86, upper: 0.90, method: 'wilson' },
  },
  confusionMatrix: {
    truePositives: 176,
    falsePositives: 38,
    falseNegatives: 24,
    trueNegatives: 1762,
  },
  sampleSize: 2000,
  predictionsFeedback: 1750,
  generatedAt: new Date(),
};

// ============================================
// MOCK MODEL PERFORMANCE RESPONSE
// ============================================

export const mockModelPerformanceResponse: ModelPerformanceResponse = {
  modelId: 'model_001',
  modelVersion: '5.0.0',
  currentMetrics: mockCurrentMetrics,
  baselineMetrics: mockModelVersions[0].baselineMetrics,
  comparison: {
    rocAucChange: -0.02,
    rocAucChangePercent: -2.3,
    precisionChange: 0.02,
    recallChange: -0.02,
    direction: 'degradation',
  },
  timeSeriesData: mockTimeSeriesMetrics,
  status: 'warning',
};

// ============================================
// MOCK DRIFT DETECTION RESPONSE
// ============================================

export const mockDriftDetectionResponse: DriftDetectionResponse = {
  featureDrift: {
    overall: 0.12,
    detected: [
      {
        featureName: 'Torque [Nm]',
        driftScore: 0.16,
        statisticalTest: 'KolmogorovSmirnov',
        pValue: 0.03,
        trainingBaseline: { mean: 65.2, std: 15.3 },
        productionCurrent: { mean: 68.5, std: 17.1 },
        magnitude: 'medium',
      },
      {
        featureName: 'Tool Wear [min]',
        driftScore: 0.08,
        statisticalTest: 'KolmogorovSmirnov',
        pValue: 0.15,
        trainingBaseline: { mean: 62.1, std: 34.5 },
        productionCurrent: { mean: 65.3, std: 36.2 },
        magnitude: 'low',
      },
    ],
    threshold: 0.15,
    status: 'warning',
  },
  predictionDrift: {
    jsDivergence: 0.22,
    kolmogorovSmirnovStatistic: 0.18,
    predictionDistribution: {
      trainingMean: 0.42,
      productionMean: 0.45,
      trainingStd: 0.15,
      productionStd: 0.17,
      histogramBins: [
        { range: '[0.0-0.1)' , trainingCount: 120, productionCount: 95 },
        { range: '[0.1-0.2)', trainingCount: 180, productionCount: 140 },
        { range: '[0.2-0.3)', trainingCount: 220, productionCount: 190 },
        { range: '[0.3-0.4)', trainingCount: 250, productionCount: 240 },
        { range: '[0.4-0.5)', trainingCount: 280, productionCount: 320 },
        { range: '[0.5-0.6)', trainingCount: 240, productionCount: 280 },
        { range: '[0.6-0.7)', trainingCount: 180, productionCount: 210 },
        { range: '[0.7-0.8)', trainingCount: 140, productionCount: 165 },
        { range: '[0.8-0.9)', trainingCount: 110, productionCount: 95 },
        { range: '[0.9-1.0]', trainingCount: 100, productionCount: 65 },
      ],
    },
    threshold: 0.20,
    status: 'warning',
  },
  modelDrift: {
    accuracyTrend: [
      { date: new Date('2026-01-01'), accuracy: 0.98 },
      { date: new Date('2026-01-08'), accuracy: 0.975 },
      { date: new Date('2026-02-01'), accuracy: 0.97 },
      { date: new Date('2026-02-08'), accuracy: 0.972 },
    ],
    rocAucTrend: [
      { date: new Date('2026-01-01'), rocAuc: 0.87 },
      { date: new Date('2026-01-08'), rocAuc: 0.86 },
      { date: new Date('2026-02-01'), rocAuc: 0.85 },
      { date: new Date('2026-02-08'), rocAuc: 0.85 },
    ],
    status: 'degrading',
    daysUntilAlertIfDegrading: 7,
    recommendation: 'retrain_soon',
  },
  aggregatedStatus: 'warning',
  summaryAlert:
    'Model showing signs of feature and prediction drift. Recommend retraining within 7 days.',
  generatedAt: new Date(),
};

// ============================================
// MOCK EXPERIMENTS
// ============================================

export const mockExperiments: Experiment[] = [
  {
    experimentId: 'exp_001',
    name: 'XGBoost v5 vs LightGBM Candidate',
    status: 'running',
    startDate: new Date('2026-02-06'),
    expectedDurationDays: 14,
    daysElapsed: 5,
    controlModel: {
      modelId: 'model_001',
      modelName: 'XGBoost v5',
      trafficPercentage: 90,
      metrics: {
        rocAuc: 0.850,
        precision: 0.823,
        recall: 0.88,
        f1Score: 0.85,
      },
      sampleSize: 1024,
    },
    challengerModel: {
      modelId: 'model_003',
      modelName: 'LightGBM Candidate',
      trafficPercentage: 10,
      metrics: {
        rocAuc: 0.867,
        precision: 0.841,
        recall: 0.89,
        f1Score: 0.865,
      },
      sampleSize: 128,
      improvement: {
        rocAuc: 0.017,
        precision: 0.018,
        recall: 0.01,
      },
    },
    statisticalTest: {
      testName: 'Chi-squared test',
      pValue: 0.08,
      isSignificant: false,
      powerAnalysis: {
        power: 0.72,
        sampleSizeRequired: 2500,
      },
      confidence: 0.95,
    },
    recommendation: 'continue',
    recommendationReason:
      'Promising performance improvement, but not yet statistically significant. Continue collecting data.',
  },
  {
    experimentId: 'exp_002',
    name: 'Feature Selection Experiment',
    status: 'completed',
    startDate: new Date('2026-01-20'),
    endDate: new Date('2026-02-03'),
    expectedDurationDays: 14,
    daysElapsed: 14,
    controlModel: {
      modelId: 'model_001',
      modelName: 'All Features (23)',
      trafficPercentage: 100,
      metrics: {
        rocAuc: 0.87,
        precision: 0.80,
        recall: 0.90,
        f1Score: 0.85,
      },
      sampleSize: 8500,
    },
    challengerModel: {
      modelId: 'model_004',
      modelName: 'Selected Features (18)',
      trafficPercentage: 0,
      metrics: {
        rocAuc: 0.865,
        precision: 0.798,
        recall: 0.898,
        f1Score: 0.847,
      },
      sampleSize: 8500,
      improvement: {
        rocAuc: -0.005,
        precision: -0.002,
        recall: -0.002,
      },
    },
    statisticalTest: {
      testName: 'Chi-squared test',
      pValue: 0.42,
      isSignificant: false,
      powerAnalysis: {
        power: 0.85,
        sampleSizeRequired: 5000,
      },
      confidence: 0.95,
    },
    recommendation: 'keep_control',
    recommendationReason:
      'Feature reduction provided no benefit. Keeping full feature set improves model slightly.',
  },
];

// ============================================
// MOCK RETRAINING JOBS
// ============================================

export const mockRetrainingJobs: RetrainingJob[] = [
  {
    jobId: 'rtrain_247',
    modelId: 'model_001',
    status: 'deployed',
    triggeredBy: {
      reason: 'drift_detected',
      triggeredAt: new Date('2026-02-10'),
      triggeredBy: 'system@predictive-maintenance.dev',
    },
    config: {
      training: {
        datasetName: 'production_20260101-20260208',
        algorithm: 'xgboost',
        hyperparameters: {
          maxDepth: 8,
          learningRate: 0.1,
          numEstimators: 200,
          scalePosWeight: 49,
        },
        trainingDurationLimit: 60,
        useFeatureSelection: false,
      },
      validation: {
        testSizeRatio: 0.2,
        crossValidationFolds: 5,
        performanceMustImproveBy: 0.005,
      },
      deployment: {
        deploymentType: 'canary',
        canaryTrafficPercentage: 10,
        canaryDurationHours: 24,
        autoPromoteIfBetter: true,
      },
    },
    progress: {
      currentStep: 'deployed',
      percentComplete: 100,
      estimatedTimeRemaining: 0,
    },
    training: {
      startedAt: new Date('2026-02-10T14:30:00Z'),
      completedAt: new Date('2026-02-10T15:45:00Z'),
      datasetSize: 125432,
      durationSeconds: 4500,
      featureCount: 23,
    },
    validation: {
      rocAuc: 0.862,
      precision: 0.818,
      recall: 0.889,
      f1Score: 0.852,
      improvementOverCurrent: 0.012,
      validationPassed: true,
    },
    deployment: {
      canaryLiveAt: new Date('2026-02-10T16:00:00Z'),
      canaryMetrics: { rocAuc: 0.861, precision: 0.819 },
      canaryPassedValidation: true,
      fullyDeployedAt: new Date('2026-02-11T14:00:00Z'),
    },
  },
  {
    jobId: 'rtrain_246',
    modelId: 'model_001',
    status: 'failed',
    triggeredBy: {
      reason: 'manual_request',
      triggeredAt: new Date('2026-02-05'),
      triggeredBy: 'ml-engineer@company.com',
    },
    config: {
      training: {
        datasetName: 'production_20260101-20260201',
        algorithm: 'lightgbm',
        hyperparameters: {
          maxDepth: 10,
          learningRate: 0.05,
          numEstimators: 300,
          scalePosWeight: 49,
        },
      },
      validation: {
        testSizeRatio: 0.2,
        crossValidationFolds: 5,
      },
    },
    progress: {
      currentStep: 'validation_failed',
      percentComplete: 95,
      estimatedTimeRemaining: 0,
    },
    training: {
      startedAt: new Date('2026-02-05T10:00:00Z'),
      completedAt: new Date('2026-02-05T12:30:00Z'),
      datasetSize: 115000,
      durationSeconds: 9000,
      featureCount: 23,
    },
    validation: {
      rocAuc: 0.834,
      precision: 0.795,
      recall: 0.875,
      f1Score: 0.833,
      improvementOverCurrent: -0.016,
      validationPassed: false,
      failureReason: 'Performance degraded by 1.6%. Minimum improvement of 0.5% required.',
    },
  },
  {
    jobId: 'rtrain_245',
    modelId: 'model_001',
    status: 'deployed',
    triggeredBy: {
      reason: 'scheduled',
      triggeredAt: new Date('2026-01-28'),
      triggeredBy: 'scheduler@system',
    },
    config: {
      training: {
        datasetName: 'production_20251215-20260127',
        algorithm: 'xgboost',
        hyperparameters: {
          maxDepth: 8,
          learningRate: 0.1,
          numEstimators: 200,
          scalePosWeight: 49,
        },
      },
      validation: {
        testSizeRatio: 0.2,
        crossValidationFolds: 5,
      },
    },
    progress: {
      currentStep: 'deployed',
      percentComplete: 100,
      estimatedTimeRemaining: 0,
    },
    training: {
      startedAt: new Date('2026-01-28T08:00:00Z'),
      completedAt: new Date('2026-01-28T10:00:00Z'),
      datasetSize: 145000,
      durationSeconds: 7200,
      featureCount: 23,
    },
    validation: {
      rocAuc: 0.847,
      precision: 0.805,
      recall: 0.875,
      f1Score: 0.839,
      improvementOverCurrent: 0.008,
      validationPassed: true,
    },
    deployment: {
      canaryLiveAt: new Date('2026-01-28T10:30:00Z'),
      canaryMetrics: { rocAuc: 0.846, precision: 0.804 },
      canaryPassedValidation: true,
      fullyDeployedAt: new Date('2026-01-29T10:00:00Z'),
    },
  },
];

// ============================================
// EXPORT ALL MOCK DATA
// ============================================

export const mockData = {
  modelVersions: mockModelVersions,
  timeSeriesMetrics: mockTimeSeriesMetrics,
  currentMetrics: mockCurrentMetrics,
  modelPerformanceResponse: mockModelPerformanceResponse,
  driftDetectionResponse: mockDriftDetectionResponse,
  experiments: mockExperiments,
  retrainingJobs: mockRetrainingJobs,
};

export default mockData;
