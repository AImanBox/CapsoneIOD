/**
 * @file HealthStatusBadge.tsx
 * @description Status indicator badge component
 * @module components/HealthStatusBadge
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Visual indicator showing model health status (healthy/warning/critical)
 * with emoji badge and descriptive text.
 */

'use client';

import type { HealthStatus } from '../types/models.types';
import { getStatusColors, getStatusIndicator } from '../utils/colorUtils';

interface HealthStatusBadgeProps {
  status: HealthStatus;
  message?: string;
  className?: string;
}

/**
 * Health status badge component
 * 
 * Displays current health as 🟢/🟡/🔴 with optional message
 */
export default function HealthStatusBadge({
  status,
  message,
  className = '',
}: HealthStatusBadgeProps) {
  const colors = getStatusColors(status);
  const indicator = getStatusIndicator(status);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xl">{indicator}</span>
      <div>
        <p className={`font-semibold text-sm ${colors.text}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </p>
        {message && <p className="text-xs text-gray-600">{message}</p>}
      </div>
    </div>
  );
}
