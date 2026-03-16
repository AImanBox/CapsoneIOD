/**
 * @file ModelPerformanceLayout.tsx
 * @description Main dashboard layout combining all model performance components
 * @module components/ModelPerformanceLayout
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Complete dashboard layout for model performance monitoring including:
 * - Model selector and time range controls
 * - Health metrics and drift detection
 * - Active experiments
 * - Performance time series
 * - Retraining management
 */

'use client';

import { useState, useEffect } from 'react';
import DashboardActionBar from './DashboardActionBar';
import ModelSelector from './ModelSelector';
import TimeRangeSelector from './TimeRangeSelector';
import HealthStatusBadge from './HealthStatusBadge';
import MetricsGrid from './MetricsGrid';
import DriftIndicatorsSection from './DriftIndicatorsSection';
import ActiveExperimentsSection from './ActiveExperimentsSection';
import PerformanceTimeSeriesChart from './PerformanceTimeSeriesChart';
import RetrainingSection from './RetrainingSection';
import {
  useModelPerformance,
  useModelHistory,
  useDriftDetection,
  useActiveExperiments,
  useRetrainingJobs,
  useMetricsSubscription,
  useRetrainingActions,
} from '../hooks';
import type { TimeRange } from '../types/models.types';

/**
 * Model performance layout component
 * 
 * @example
 * <ModelPerformanceLayout />
 */
export default function ModelPerformanceLayout() {
  // State
  const [selectedModelId, setSelectedModelId] = useState('model_v2.1.0');
  const [timeRange, setTimeRange] = useState<TimeRange>({
    type: '30d',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Hooks for data fetching
  const metricsState = useModelPerformance(selectedModelId);
  const historyState = useModelHistory(selectedModelId, timeRange);
  const driftState = useDriftDetection(selectedModelId);
  const experimentsState = useActiveExperiments(selectedModelId);
  const jobsState = useRetrainingJobs(selectedModelId);
  const { isConnected: wsConnected, events: wsEvents } = useMetricsSubscription(selectedModelId);
  const retrainingActions = useRetrainingActions();

  // Combine loading states
  const isAnyLoading =
    metricsState.loading ||
    historyState.loading ||
    driftState.loading ||
    experimentsState.loading ||
    jobsState.loading;

  // Get overall health from current metrics
  const latestMetrics = metricsState.data;
  const overallHealth =
    latestMetrics && latestMetrics.rocAuc >= 0.92
      ? 'healthy'
      : latestMetrics && latestMetrics.rocAuc >= 0.85
      ? 'warning'
      : 'critical';

  // Handlers
  const handleRefresh = async () => {
    try {
      // Refetch all data when refresh is clicked
      await Promise.all([
        metricsState.refetch(),
        historyState.refetch(),
        driftState.refetch(),
        experimentsState.refetch(),
        jobsState.refetch(),
      ]);

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  const handleExport = () => {
    // Export time-series metrics as CSV
    if (!historyState.data || historyState.data.length === 0) {
      alert('No data to export');
      return;
    }

    const csv = [
      ['Timestamp', 'ROC-AUC', 'Precision', 'Recall', 'F1'],
      ...historyState.data.map((m) => [
        new Date(m.timestamp).toISOString(),
        m.rocAuc.toFixed(4),
        m.precision.toFixed(4),
        m.recall.toFixed(4),
        m.f1.toFixed(4),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `model-metrics-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
    // Hooks will automatically refetch with new modelId due to dependency change
  };

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    // Hooks will automatically refetch with new timeRange due to dependency change
  };

  const handleSubmitRetrainingJob = async (config: any) => {
    try {
      await retrainingActions.submitJob(selectedModelId, config);
      // Refetch jobs after submission
      await jobsState.refetch();
    } catch (error) {
      console.error('Failed to submit retraining job:', error);
      throw error;
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      await retrainingActions.retryJob(jobId);
      // Refetch jobs after retry
      await jobsState.refetch();
    } catch (error) {
      console.error('Failed to retry job:', error);
      throw error;
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await retrainingActions.cancelJob(jobId);
      // Refetch jobs after cancellation
      await jobsState.refetch();
    } catch (error) {
      console.error('Failed to cancel job:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Title */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Model Performance Monitoring</h1>
            <p className="text-gray-600 mt-1">
              Real-time monitoring and analysis of your machine learning models
            </p>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <ModelSelector selectedId={selectedModelId} onChange={handleModelChange} isLoading={isLoading} />
            <TimeRangeSelector activeRange={timeRange.type} onChange={handleTimeRangeChange} />
            <DashboardActionBar
              onRefresh={handleRefresh}
              onExport={handleExport}
              isRefreshing={isLoading}
              lastRefresh={lastRefresh}
            />
          </div>

          {/* Overall Health */}
          <div className="flex items-center gap-3">
            <HealthStatusBadge status={overallHealth} message={`Model is ${overallHealth}`} />
            <span className="text-sm text-gray-600">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAnyLoading && (
          <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-40">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="animate-spin">
                  <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
                <span className="font-medium text-gray-900">Loading data...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error States */}
        {metricsState.error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-red-800 font-medium">✗ Failed to load metrics: {metricsState.error.message}</p>
            <button
              onClick={() => metricsState.refetch()}
              className="text-xs text-red-700 mt-1 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {historyState.error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-red-800 font-medium">✗ Failed to load history: {historyState.error.message}</p>
            <button
              onClick={() => historyState.refetch()}
              className="text-xs text-red-700 mt-1 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {driftState.error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-red-800 font-medium">✗ Failed to load drift data: {driftState.error.message}</p>
            <button
              onClick={() => driftState.refetch()}
              className="text-xs text-red-700 mt-1 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Metrics Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Performance Metrics</h2>
          {latestMetrics ? (
            <MetricsGrid metrics={latestMetrics} />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-600">No metrics available</p>
            </div>
          )}
        </section>

        {/* Drift Detection Section */}
        <section className="mb-8">
          {driftState.data ? (
            <DriftIndicatorsSection driftData={driftState.data} />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-600">No drift data available</p>
            </div>
          )}
        </section>

        {/* Performance Chart Section */}
        <section className="mb-8">
          {historyState.data && historyState.data.length > 0 ? (
            <PerformanceTimeSeriesChart
              data={historyState.data}
              title="ROC-AUC Performance Over Time"
              selectedMetrics={['rocAuc', 'f1']}
              height={400}
              showConfidenceInterval={true}
            />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-600">No performance history available</p>
            </div>
          )}
        </section>

        {/* Active Experiments Section */}
        {experimentsState.data && experimentsState.data.length > 0 && (
          <section className="mb-8">
            <ActiveExperimentsSection experiments={experimentsState.data} />
          </section>
        )}

        {/* Retraining Section */}
        <section className="mb-8">
          <RetrainingSection
            jobs={jobsState.data}
            isLoading={jobsState.loading}
            onSubmitJob={handleSubmitRetrainingJob}
            onRetryJob={handleRetryJob}
            onCancelJob={handleCancelJob}
          />
        </section>

        {/* Model Info Section */}
        <section className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Model Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Model Version</p>
              <p className="text-lg font-bold text-gray-900">{selectedModelId}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Deployed Date</p>
              <p className="text-lg font-bold text-gray-900">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">WebSocket Status</p>
              <p className="flex items-center gap-2 text-lg font-bold">
                <span className={wsConnected ? 'text-emerald-600' : 'text-red-600'}>
                  {wsConnected ? '●' : '○'}
                </span>
                <span className="text-gray-900">{wsConnected ? 'Connected' : 'Disconnected'}</span>
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Active Experiments</p>
              <p className="text-lg font-bold text-gray-900">
                {experimentsState.data?.filter((e) => e.status === 'running').length || 0}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
