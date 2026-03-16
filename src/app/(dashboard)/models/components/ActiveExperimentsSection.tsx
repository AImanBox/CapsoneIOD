/**
 * @file ActiveExperimentsSection.tsx
 * @description Section displaying active A/B experiments
 * @module components/ActiveExperimentsSection
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Main section showing all running and recent A/B experiments
 * with controls for managing experiments.
 */

'use client';

import ExperimentCard from './ExperimentCard';
import type { Experiment } from '../types/models.types';

interface ActiveExperimentsSectionProps {
  experiments: Experiment[];
  onStartExperiment?: () => void;
  onExperimentAction?: (experimentId: string, action: string) => void;
  className?: string;
}

/**
 * Active experiments section component
 * 
 * @example
 * <ActiveExperimentsSection 
 *   experiments={experiments}
 *   onStartExperiment={() => openModal()}
 * />
 */
export default function ActiveExperimentsSection({
  experiments,
  onStartExperiment,
  onExperimentAction,
  className = '',
}: ActiveExperimentsSectionProps) {
  const runningExperiments = experiments.filter((e) => e.status === 'running');
  const completedExperiments = experiments.filter((e) => e.status === 'completed');

  return (
    <div className={`${className}`}>
      {/* Header with Button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">A/B Testing</h2>

        {onStartExperiment && (
          <button
            onClick={onStartExperiment}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            + Start Experiment
          </button>
        )}
      </div>

      {/* Running Experiments */}
      {runningExperiments.length > 0 ? (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Running</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {runningExperiments.map((experiment) => (
              <ExperimentCard
                key={experiment.experimentId}
                experiment={experiment}
                onAdjustTraffic={() =>
                  onExperimentAction?.(experiment.experimentId, 'adjust_traffic')
                }
                onStop={() =>
                  onExperimentAction?.(experiment.experimentId, 'stop')
                }
                onDecide={() =>
                  onExperimentAction?.(experiment.experimentId, 'decide')
                }
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-8 text-center">
          <p className="text-blue-900 font-medium">No active experiments</p>
          <p className="text-blue-700 text-sm mt-1">
            {onStartExperiment ? 'Start one to compare model versions' : ''}
          </p>
        </div>
      )}

      {/* Completed Experiments */}
      {completedExperiments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Completed</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {completedExperiments.slice(0, 2).map((experiment) => (
              <ExperimentCard
                key={experiment.experimentId}
                experiment={experiment}
              />
            ))}
          </div>

          {completedExperiments.length > 2 && (
            <button className="mt-4 px-4 py-2 rounded-lg bg-gray-200 text-gray-900 font-medium hover:bg-gray-300">
              View More ({completedExperiments.length - 2} more)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
