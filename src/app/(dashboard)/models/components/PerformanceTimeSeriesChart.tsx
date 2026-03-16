/**
 * @file PerformanceTimeSeriesChart.tsx
 * @description Time series chart for model performance metrics
 * @module components/PerformanceTimeSeriesChart
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Line chart showing model performance over time with confidence intervals.
 * Supports multiple metrics, interactive tooltips, and custom date ranges.
 */

'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import { formatDate, formatRocAuc } from '../utils/formatters';
import { getStatusColors } from '../utils/colorUtils';
import type { EvaluationMetrics } from '../types/models.types';

interface ChartDataPoint {
  timestamp: number;
  date: string;
  rocAuc: number;
  rocAucUpper?: number;
  rocAucLower?: number;
  precision: number;
  recall: number;
  f1: number;
}

interface PerformanceTimeSeriesChartProps {
  data: EvaluationMetrics[];
  title?: string;
  height?: number;
  showConfidenceInterval?: boolean;
  selectedMetrics?: ('rocAuc' | 'precision' | 'recall' | 'f1')[];
  onMetricClick?: (metric: string) => void;
}

/**
 * Format time series data for chart
 */
function formatChartData(metrics: EvaluationMetrics[]): ChartDataPoint[] {
  return metrics.map((m, idx) => {
    const date = new Date(m.timestamp);
    const rocAucUpper = Math.min(1.0, m.rocAuc + m.rocAucStdDev);
    const rocAucLower = Math.max(0.0, m.rocAuc - m.rocAucStdDev);

    return {
      timestamp: date.getTime(),
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rocAuc: parseFloat(m.rocAuc.toFixed(4)),
      rocAucUpper: parseFloat(rocAucUpper.toFixed(4)),
      rocAucLower: parseFloat(rocAucLower.toFixed(4)),
      precision: parseFloat(m.precision.toFixed(4)),
      recall: parseFloat(m.recall.toFixed(4)),
      f1: parseFloat(m.f1.toFixed(4)),
    };
  });
}

/**
 * Custom tooltip for chart
 */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;

  return (
    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-lg">
      <p className="text-sm font-semibold text-gray-900 mb-2">{payload[0]?.payload?.date}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} style={{ color: entry.color }} className="text-sm">
          <span className="font-medium">{entry.name}</span>:{' '}
          {typeof entry.value === 'number' ? entry.value.toFixed(3) : entry.value}
        </p>
      ))}
    </div>
  );
}

/**
 * Performance time series chart component
 * 
 * @example
 * <PerformanceTimeSeriesChart 
 *   data={metrics}
 *   selectedMetrics={['rocAuc', 'f1']}
 *   showConfidenceInterval={true}
 * />
 */
export default function PerformanceTimeSeriesChart({
  data,
  title = 'Model Performance Over Time',
  height = 400,
  showConfidenceInterval = true,
  selectedMetrics = ['rocAuc'],
  onMetricClick,
}: PerformanceTimeSeriesChartProps) {
  const chartData = useMemo(() => formatChartData(data), [data]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;

    const rocAucValues = chartData.map(d => d.rocAuc);
    const currentRocAuc = rocAucValues[rocAucValues.length - 1];
    const avgRocAuc = rocAucValues.reduce((a, b) => a + b, 0) / rocAucValues.length;
    const minRocAuc = Math.min(...rocAucValues);
    const maxRocAuc = Math.max(...rocAucValues);
    const trend = currentRocAuc - (rocAucValues[0] ?? currentRocAuc);

    return {
      current: currentRocAuc,
      average: avgRocAuc,
      min: minRocAuc,
      max: maxRocAuc,
      trend,
    };
  }, [chartData]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Current</p>
              <p className="text-lg font-bold text-gray-900">{formatRocAuc(stats.current)}</p>
            </div>

            <div>
              <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Average</p>
              <p className="text-lg font-bold text-gray-900">{formatRocAuc(stats.average)}</p>
            </div>

            <div>
              <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Min</p>
              <p className="text-lg font-bold text-gray-900">{formatRocAuc(stats.min)}</p>
            </div>

            <div>
              <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Max</p>
              <p className="text-lg font-bold text-gray-900">{formatRocAuc(stats.max)}</p>
            </div>

            <div>
              <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Trend</p>
              <p
                className={`text-lg font-bold ${
                  stats.trend > 0
                    ? 'text-emerald-600'
                    : stats.trend < 0
                    ? 'text-red-600'
                    : 'text-gray-900'
                }`}
              >
                {stats.trend > 0 ? '↑' : stats.trend < 0 ? '↓' : '→'}{' '}
                {formatRocAuc(Math.abs(stats.trend))}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
          <p className="text-gray-400">No data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <defs>
              {selectedMetrics.includes('rocAuc') && (
                <>
                  <linearGradient id="rocAucGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#007B7A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#007B7A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="rocAucUpperGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00B3C6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#00B3C6" stopOpacity={0} />
                  </linearGradient>
                </>
              )}
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E5E7EB"
              verticalPoints={chartData.map((_, i) => i)}
            />

            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6B7280' }}
            />

            <YAxis
              stroke="#9CA3AF"
              domain={[0, 1]}
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6B7280' }}
              label={{ value: 'Score', angle: -90, position: 'insideLeft' }}
            />

            <Tooltip content={<CustomTooltip />} />

            {selectedMetrics.includes('rocAuc') && showConfidenceInterval && (
              <>
                <Area
                  type="monotone"
                  dataKey="rocAucUpper"
                  fill="none"
                  stroke="none"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="rocAucLower"
                  fill="#00B3C6"
                  stroke="none"
                  fillOpacity={0.1}
                  isAnimationActive={false}
                />
              </>
            )}

            {selectedMetrics.includes('rocAuc') && (
              <Area
                type="monotone"
                dataKey="rocAuc"
                stroke="#007B7A"
                fill="url(#rocAucGradient)"
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
                name="ROC-AUC"
                onClick={() => onMetricClick?.('rocAuc')}
              />
            )}

            {selectedMetrics.includes('precision') && (
              <Line
                type="monotone"
                dataKey="precision"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                name="Precision"
                onClick={() => onMetricClick?.('precision')}
              />
            )}

            {selectedMetrics.includes('recall') && (
              <Line
                type="monotone"
                dataKey="recall"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                name="Recall"
                onClick={() => onMetricClick?.('recall')}
              />
            )}

            {selectedMetrics.includes('f1') && (
              <Line
                type="monotone"
                dataKey="f1"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                name="F1 Score"
                onClick={() => onMetricClick?.('f1')}
              />
            )}

            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
              height={30}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        {selectedMetrics.includes('rocAuc') && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-teal-600"></div>
            <span className="text-gray-700">ROC-AUC</span>
          </div>
        )}

        {selectedMetrics.includes('precision') && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-gray-700">Precision</span>
          </div>
        )}

        {selectedMetrics.includes('recall') && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-gray-700">Recall</span>
          </div>
        )}

        {selectedMetrics.includes('f1') && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
            <span className="text-gray-700">F1 Score</span>
          </div>
        )}
      </div>

      {showConfidenceInterval && selectedMetrics.includes('rocAuc') && (
        <div className="mt-2 text-xs text-gray-500">
          <p>📊 Shaded area shows ±1 standard deviation confidence interval</p>
        </div>
      )}
    </div>
  );
}
