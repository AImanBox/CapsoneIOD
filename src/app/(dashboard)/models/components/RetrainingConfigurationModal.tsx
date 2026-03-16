/**
 * @file RetrainingConfigurationModal.tsx
 * @description Modal for configuring and submitting retraining jobs
 * @module components/RetrainingConfigurationModal
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Form modal for selecting algorithm, hyperparameters, and validation criteria
 * for starting a new retraining job.
 */

'use client';

import { useState } from 'react';
import type { RetrainingConfiguration } from '../types/models.types';

interface RetrainingConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: RetrainingConfiguration) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Retraining configuration modal component
 * 
 * @example
 * <RetrainingConfigurationModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onSubmit={handleSubmitRetraining}
 * />
 */
export default function RetrainingConfigurationModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: RetrainingConfigurationModalProps) {
  const [algorithm, setAlgorithm] = useState<'random_forest' | 'gradient_boosting' | 'neural_network'>('gradient_boosting');
  const [trainingPercent, setTrainingPercent] = useState(80);
  const [validationThreshold, setValidationThreshold] = useState(0.001);
  const [minROCDifference, setMinROCDifference] = useState(0.005);
  const [maxTrainingHours, setMaxTrainingHours] = useState(24);
  const [includeNewData, setIncludeNewData] = useState(true);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);

    try {
      const config: RetrainingConfiguration = {
        algorithm,
        trainingDataPercent: trainingPercent,
        validationStrategy: 'cross_validation',
        validationCriteria: {
          rocAucThreshold: validationThreshold,
          performanceImprovement: minROCDifference,
          maxDriftIncrease: 0.02,
          maxDataDrift: 0.1,
        },
        resourceConstraints: {
          maxTrainingHours,
          gpuRequired: algorithm === 'neural_network',
          parallelDataLoading: true,
        },
        dataSelection: {
          includeNewData,
          timeWindowDays: 30,
          stratifyByOutcome: true,
          balanceSamplingIfNeeded: true,
        },
        postTrainingSteps: {
          runValidation: true,
          generateReport: true,
          notifyOnCompletion: true,
        },
      };

      await onSubmit(config);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit retraining job');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Start Retraining Job</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {success && (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <p className="text-emerald-800 font-medium">✓ Retraining job submitted successfully!</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-red-800 font-medium">✗ {error}</p>
            </div>
          )}

          {/* Algorithm Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Training Algorithm
            </label>
            <div className="space-y-2">
              {(['random_forest', 'gradient_boosting', 'neural_network'] as const).map((algo) => (
                <label key={algo} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="algorithm"
                    value={algo}
                    checked={algorithm === algo}
                    onChange={(e) => setAlgorithm(e.target.value as typeof algo)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3 flex-1">
                    <span className="font-medium text-gray-900">
                      {algo === 'random_forest' && 'Random Forest'}
                      {algo === 'gradient_boosting' && 'Gradient Boosting'}
                      {algo === 'neural_network' && 'Neural Network'}
                    </span>
                    <span className="ml-2 text-xs text-gray-600">
                      {algo === 'random_forest' && '(Fast, interpretable)'}
                      {algo === 'gradient_boosting' && '(Recommended, balanced)'}
                      {algo === 'neural_network' && '(GPU required, high accuracy)'}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Data Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Training/Validation Split
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="60"
                  max="90"
                  step="5"
                  value={trainingPercent}
                  onChange={(e) => setTrainingPercent(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-semibold text-gray-900 min-w-[50px]">
                  {trainingPercent}% / {100 - trainingPercent}%
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Higher training % = more training data, less validation data
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Max Training Hours
              </label>
              <input
                type="number"
                min="1"
                max="72"
                value={maxTrainingHours}
                onChange={(e) => setMaxTrainingHours(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-600 mt-1">
                Training will stop after this duration
              </p>
            </div>
          </div>

          {/* Validation Criteria */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Validation Criteria</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ROC-AUC Threshold: {validationThreshold.toFixed(4)}
                </label>
                <input
                  type="range"
                  min="0.0001"
                  max="0.01"
                  step="0.0001"
                  value={validationThreshold}
                  onChange={(e) => setValidationThreshold(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Model must exceed this threshold to be considered valid
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min. ROC Improvement: {(minROCDifference * 100).toFixed(2)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="0.05"
                  step="0.001"
                  value={minROCDifference}
                  onChange={(e) => setMinROCDifference(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-600 mt-1">
                  New model must improve by this amount over current model
                </p>
              </div>
            </div>
          </div>

          {/* Data Selection */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Data Selection</h3>
            <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={includeNewData}
                onChange={(e) => setIncludeNewData(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="ml-3 text-sm">
                <span className="font-medium text-gray-900">Include new unlabeled data</span>
                <p className="text-gray-600">Use recent data points for training</p>
              </span>
            </label>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin">⌛</div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Submit Job</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
