/**
 * @file ModelSelector.tsx
 * @description Dropdown selector for model versions
 * @module components/ModelSelector
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Dropdown to select between available model versions.
 * Shows version, training date, and current ROC-AUC.
 */

'use client';

import { useState } from 'react';
import type { ModelVersion } from '../types/models.types';
import { formatDate } from '../utils/formatters';

interface ModelSelectorProps {
  models: ModelVersion[];
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

/**
 * Model selector dropdown component
 * 
 * @example
 * <ModelSelector 
 *   models={models}
 *   selectedModelId="model_001"
 *   onModelChange={(id) => setSelectedModel(id)}
 * />
 */
export default function ModelSelector({
  models,
  selectedModelId,
  onModelChange,
  disabled = false,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedModel = models.find((m) => m.id === selectedModelId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-2 rounded-lg border border-gray-300
          bg-white text-left text-gray-900 font-medium
          flex items-center justify-between gap-2
          hover:bg-gray-50 transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className="flex-1">
          <p className="font-semibold">{selectedModel?.name}</p>
          <p className="text-xs text-gray-600">v{selectedModel?.version}</p>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg border border-gray-300 shadow-lg z-10">
          <div className="max-h-96 overflow-y-auto">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onModelChange(model.id);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-4 py-3 text-left border-b border-gray-100 last:border-0
                  hover:bg-gray-50 transition-colors
                  ${model.id === selectedModelId ? 'bg-blue-50' : ''}
                `}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{model.name}</p>
                    <p className="text-sm text-gray-600">
                      v{model.version} • {model.algorithm.toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Trained: {formatDate(model.trainingDate)}
                    </p>
                  </div>

                  <div className={`
                    px-2 py-1 rounded text-xs font-medium
                    ${model.status === 'production' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-gray-100 text-gray-700'}
                  `}>
                    {model.status}
                  </div>
                </div>

                <div className="mt-2 text-sm text-gray-700">
                  ROC-AUC: <span className="font-semibold">{model.baselineMetrics.rocAuc.toFixed(3)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
