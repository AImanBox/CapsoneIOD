/**
 * @file models.types.ts
 * @description TypeScript type definitions for Model Performance Monitoring feature
 * @module types/models
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @dependencies
 * - None (core types only)
 */

// ============================================
// CORE MODEL & METRICS TYPES
// ============================================

/**
 * Represents a trained ML model version
 */
export interface ModelVersion {
  id: string;
  name: string;
  algorithm: 'xgboost' | 'lightgbm';
  version: string;
  trainingDate: Date;
  deploymentDate: Date;
  status: 'training' | 'validating' | 'production' | 'archived' | 'deprecated';
  isCurrentProduction: boolean;
  baselineMetrics: ModelMetrics;
  modelPath: string;
  featureCount: number;
}

/**
 * Current model performance metrics
 */
export interface ModelMetrics {
  rocAuc: number;
  precision: number;
  recall: number;
  f1Score: number;
  accuracy: number;
  
  confidenceInterval: {
    rocAuc: { lower: number; upper: number; method: 'bootstrap' };
    precision: { lower: number; upper: number; method: 'wilson' };
    recall: { lower: number; upper: number; method: 'wilson' };
  };
  
  confusionMatrix: {
    truePositives: number;
    falsePositives: number;
    falseNegatives: number;
    trueNegatives: number;
  };
  
  sampleSize: number;
  predictionsFeedback: number;
  generatedAt: Date;
}

/**
 * Comparison metrics against baseline
 */
export interface MetricsComparison {
  rocAucChange: number;
  rocAucChangePercent: number;
  precisionChange: number;
  recallChange: number;
  direction: 'improvement' | 'degradation' | 'stable';
  daysSinceDegradation?: number;
}

/**
 * Time-series data point for historical metrics
 */
export interface TimeSeriesMetrics {
  date: Date;
  rocAuc: number;
  precision: number;
  recall: number;
  f1Score: number;
  sampleSize: number;
  confidenceIntervalLower: number;
  confidenceIntervalUpper: number;
}

/**
 * Complete performance response with metrics and time series
 */
export interface ModelPerformanceResponse {
  modelId: string;
  modelVersion: string;
  currentMetrics: ModelMetrics;
  baselineMetrics: ModelMetrics;
  comparison: MetricsComparison;
  timeSeriesData: TimeSeriesMetrics[];
  status: 'healthy' | 'warning' | 'critical';
}

// ============================================
// DRIFT DETECTION TYPES
// ============================================

/**
 * Feature drift information
 */
export interface FeatureDrift {
  featureName: string;
  driftScore: number; // 0-1, >0.15 is significant
  statisticalTest: 'KolmogorovSmirnov' | 'ChiSquare';
  pValue: number;
  trainingBaseline: { mean: number; std: number };
  productionCurrent: { mean: number; std: number };
  magnitude: 'low' | 'medium' | 'high';
}

/**
 * Feature drift detection results
 */
export interface FeatureDriftResult {
  overall: number;
  detected: FeatureDrift[];
  threshold: number;
  status: 'normal' | 'warning' | 'alert';
}

/**
 * Prediction drift detection results
 */
export interface PredictionDriftResult {
  jsDivergence: number;
  kolmogorovSmirnovStatistic: number;
  predictionDistribution: {
    trainingMean: number;
    productionMean: number;
    trainingStd: number;
    productionStd: number;
    histogramBins: Array<{
      range: string;
      trainingCount: number;
      productionCount: number;
    }>;
  };
  threshold: number;
  status: 'normal' | 'warning' | 'alert';
}

/**
 * Model drift detection results
 */
export interface ModelDriftResult {
  accuracyTrend: Array<{ date: Date; accuracy: number }>;
  rocAucTrend: Array<{ date: Date; rocAuc: number }>;
  status: 'stable' | 'improving' | 'degrading';
  daysUntilAlertIfDegrading: number;
  recommendation: 'monitor' | 'retrain_soon' | 'retrain_urgent';
}

/**
 * Complete drift detection response
 */
export interface DriftDetectionResponse {
  featureDrift: FeatureDriftResult;
  predictionDrift: PredictionDriftResult;
  modelDrift: ModelDriftResult;
  aggregatedStatus: 'healthy' | 'warning' | 'critical';
  summaryAlert?: string;
  generatedAt: Date;
}

// ============================================
// A/B TESTING / EXPERIMENTS TYPES
// ============================================

/**
 * A/B experiment control/baseline model
 */
export interface ExperimentModel {
  modelId: string;
  modelName: string;
  trafficPercentage: number;
  metrics: {
    rocAuc: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  sampleSize: number;
}

/**
 * A/B experiment challenger model with improvement metrics
 */
export interface ExperimentChallenger extends ExperimentModel {
  improvement: {
    rocAuc: number;
    precision: number;
    recall: number;
  };
}

/**
 * Statistical test results for experiment
 */
export interface StatisticalTest {
  testName: string;
  pValue: number;
  isSignificant: boolean;
  powerAnalysis: {
    power: number;
    sampleSizeRequired: number;
  };
  confidence: number; // 0.95 = 95% confidence
}

/**
 * A/B testing experiment
 */
export interface Experiment {
  experimentId: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  startDate: Date;
  endDate?: Date;
  
  controlModel: ExperimentModel;
  challengerModel: ExperimentChallenger;
  
  statisticalTest: StatisticalTest;
  
  recommendation: 'promote' | 'continue' | 'stop' | 'inconclusive';
  recommendationReason?: string;
  
  expectedDurationDays: number;
  daysElapsed: number;
}

// ============================================
// RETRAINING TYPES
// ============================================

/**
 * Retraining job configuration
 */
export interface RetrainingConfig {
  datasetName: string;
  algorithm: 'xgboost' | 'lightgbm';
  hyperparameters: {
    maxDepth?: number;
    learningRate?: number;
    numEstimators?: number;
    scalePosWeight?: number;
  };
  trainingDurationLimit?: number; // minutes
  useFeatureSelection?: boolean;
}

/**
 * Retraining validation configuration
 */
export interface ValidationConfig {
  testSizeRatio: number;
  crossValidationFolds?: number;
  performanceMustImproveBy?: number;
}

/**
 * Retraining deployment configuration
 */
export interface DeploymentConfig {
  deploymentType: 'canary' | 'shadow';
  canaryTrafficPercentage?: number;
  canaryDurationHours?: number;
  autoPromoteIfBetter?: boolean;
}

/**
 * Retraining job with detailed status
 */
export interface RetrainingJob {
  jobId: string;
  modelId: string;
  status: 'queued' | 'training' | 'validating' | 'deployed' | 'failed' | 'rolled_back';
  
  triggeredBy: {
    reason: 'drift_detected' | 'manual_request' | 'scheduled' | 'accuracy_degradation';
    triggeredAt: Date;
    triggeredBy: string; // user email
  };
  
  config: {
    training: RetrainingConfig;
    validation: ValidationConfig;
    deployment?: DeploymentConfig;
  };
  
  progress: {
    currentStep: string;
    percentComplete: number;
    estimatedTimeRemaining: number; // seconds
  };
  
  training?: {
    startedAt: Date;
    completedAt?: Date;
    datasetSize: number;
    durationSeconds: number;
    featureCount: number;
  };
  
  validation?: {
    rocAuc: number;
    precision: number;
    recall: number;
    f1Score: number;
    improvementOverCurrent: number;
    validationPassed: boolean;
    failureReason?: string;
  };
  
  deployment?: {
    canaryLiveAt?: Date;
    canaryMetrics?: { rocAuc: number; precision: number };
    canaryPassedValidation?: boolean;
    fullyDeployedAt?: Date;
    rollbackAt?: Date;
    rollbackReason?: string;
  };
  
  logs?: string; // Last N lines of training output
  
  artifacts?: {
    modelPath: string;
    metricsFilePath: string;
    featureImportancePath: string;
  };
}

/**
 * Retraining job request payload
 */
export interface RetrainingJobRequest {
  modelId: string;
  triggerReason: 'manual' | 'drift_detected' | 'scheduled' | 'accuracy_degradation';
  trainingConfig: RetrainingConfig;
  validationConfig: ValidationConfig;
  deploymentConfig?: DeploymentConfig;
}

// ============================================
// PREDICTION FEEDBACK TYPES
// ============================================

/**
 * Failure mode classifications
 */
export type FailureMode = 'TWF' | 'HDF' | 'PWF' | 'OSF' | 'RNF' | 'OVERALL';

/**
 * Prediction feedback / ground truth
 */
export interface PredictionFeedback {
  predictionId: string;
  actualFailure: 0 | 1;
  failureMode?: FailureMode;
  feedbackTimestamp: Date;
  notes?: string;
}

// ============================================
// UI STATE & DASHBOARD TYPES
// ============================================

/**
 * Time range options for metrics
 */
export type TimeRange = '7d' | '30d' | '90d' | 'year' | 'custom';

/**
 * Custom date range
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Health status indicator
 */
export type HealthStatus = 'healthy' | 'warning' | 'critical';

/**
 * Dashboard state
 */
export interface DashboardState {
  selectedModelId: string;
  selectedTimeRange: TimeRange;
  dateRange?: DateRange;
  showRetrainingModal: boolean;
  selectedExperimentId?: string;
  isRefreshing: boolean;
}

// ============================================
// API RESPONSE TYPES
// ============================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data?: {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasNextPage: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}

// ============================================
// WEBSOCKET EVENT TYPES
// ============================================

/**
 * Real-time metrics update event
 */
export interface MetricsUpdateEvent {
  type: 'metrics_updated';
  modelId: string;
  metrics: ModelMetrics;
  timestamp: Date;
}

/**
 * Drift alert event
 */
export interface DriftAlertEvent {
  type: 'drift_detected';
  modelId: string;
  driftType: 'feature' | 'prediction' | 'model';
  severity: 'warning' | 'critical';
  message: string;
  timestamp: Date;
}

/**
 * Retraining status update event
 */
export interface RetrainingStatusEvent {
  type: 'retraining_status';
  jobId: string;
  status: RetrainingJob['status'];
  progress: number;
  message: string;
  timestamp: Date;
}

export type WebSocketEvent = MetricsUpdateEvent | DriftAlertEvent | RetrainingStatusEvent;

// ============================================
// VALIDATION RESULT TYPES
// ============================================

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}
