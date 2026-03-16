/**
 * @file layout.tsx
 * @description Layout for Model Performance Monitoring dashboard
 * @module (dashboard)/models/layout
 * @category Story10/ModelPerformanceMonitoring
 */

import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Model Performance Monitoring layout wrapper
 */
export default function ModelMonitoringLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
