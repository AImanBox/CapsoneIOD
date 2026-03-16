/**
 * @file index.ts
 * @description Central export file for all models types, utilities, and clients
 * @module models
 */

// ============================================
// TYPE EXPORTS
// ============================================

export type {
  ModelVersion,
  ModelMetrics,
  MetricsComparison,
  TimeSeriesMetrics,
  ModelPerformanceResponse,
  FeatureDrift,
  FeatureDriftResult,
  PredictionDriftResult,
  ModelDriftResult,
  DriftDetectionResponse,
  ExperimentModel,
  ExperimentChallenger,
  StatisticalTest,
  Experiment,
  RetrainingConfig,
  ValidationConfig,
  DeploymentConfig,
  RetrainingJob,
  RetrainingJobRequest,
  PredictionFeedback,
  FailureMode,
  TimeRange,
  DateRange,
  HealthStatus,
  DashboardState,
  ApiResponse,
  PaginatedResponse,
  MetricsUpdateEvent,
  DriftAlertEvent,
  RetrainingStatusEvent,
  WebSocketEvent,
  ValidationResult,
} from './types/models.types';

// ============================================
// API CLIENT EXPORTS
// ============================================

export {
  ModelMetricsClient,
  ApiError,
  getModelMetricsClient,
  modelMetricsClient,
} from './api/models-api';

// ============================================
// WEBSOCKET CLIENT EXPORTS
// ============================================

export {
  ModelMetricsWebSocketClient,
  getWebSocketClient,
  webSocketClient,
} from './services/websocket-client';

// ============================================
// MOCK DATA EXPORTS
// ============================================

export { mockData } from './__mocks__/mock-data';

// ============================================
// FORMATTER EXPORTS
// ============================================

export {
  formatAsPercentage,
  formatRocAuc,
  formatPrecision,
  formatF1Score,
  formatDriftScore,
  formatPValue,
  formatMetricChange,
  formatNumber,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatDuration,
  formatBytes,
  formatConfidenceInterval,
  formatModelVersion,
  formatExperimentProgress,
  formatConfidenceLevel,
  formatStatisticalPower,
} from './utils/formatters';

// ============================================
// COLOR UTILS EXPORTS
// ============================================

export {
  STATUS_COLORS,
  TREND_COLORS,
  CHART_COLORS,
  DRIFT_COLORS,
  getStatusColors,
  getStatusIndicator,
  getHealthStatus,
  getTrendColor,
  getTrendArrow,
  getDriftStatusColor,
  getDriftGaugeColor,
  getSignificanceColor,
  getMetricLineColor,
  getMetricGradient,
  getExperimentStatusColor,
  getRetrainingStatusColor,
  getStatusColorLight,
  getStatusBorderColor,
  getPValueVisualizationColor,
  getConfidenceIntervalPalette,
} from './utils/colorUtils';

// ============================================
// CHART HELPERS EXPORTS
// ============================================

export {
  prepareTimeSeriesData,
  calculateConfidenceIntervalBands,
  prepareConfidenceIntervalBands,
  formatChartTooltip,
  createCustomTooltip,
  formatYAxisLabel,
  formatXAxisLabel,
  filterChartDataByDateRange,
  downsampleChartData,
  getChartDimensions,
  prepareComparisonChartData,
  calculateMovingAverage,
} from './utils/chartHelpers';

export type { ChartDataPoint, ChartConfig } from './utils/chartHelpers';
