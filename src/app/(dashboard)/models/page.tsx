/**
 * @file page.tsx
 * @description Model Performance Monitoring dashboard page
 * @module (dashboard)/models/page
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Main page for the Model Performance Monitoring dashboard.
 * This is a server component that renders the dashboard layout
 * and handles authentication/authorization checks.
 */

'use client';

import Link from 'next/link';
import ModelPerformanceLayout from './components/ModelPerformanceLayout';
import type { Metadata } from 'next';

/**
 * Model Performance Monitoring page
 * 
 * Renders the main dashboard with:
 * - Current model metrics
 * - Drift indicators
 * - Time-series performance charts
 * - Active A/B experiments
 * - Retraining job history
 * - Configuration modals
 * 
 * Server-side considerations:
 * - TODO: Add authentication check (Phase 3)
 * - TODO: Add authorization check for ML_ENGINEER role (Phase 3)
 * - TODO: Add access logging (Phase 3)
 */
export default function ModelPerformancePage() {
  // TODO: Phase 3 - Add authentication and authorization
  // const session = await auth();
  // if (!session?.user || session.user.role !== 'ML_ENGINEER') {
  //   redirect('/unauthorized');
  // }

  return (
    <>
      {/* Navigation Bar */}
      <div className="bg-bg-card border-b border-bg-secondary p-4 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Models Dashboard</h1>
          <p className="text-sm text-text-secondary">Real-time model performance monitoring</p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/models"
            className="px-4 py-2 rounded-lg bg-primary-teal text-text-light font-semibold hover:opacity-90 transition"
          >
            Overview
          </Link>
          <Link
            href="/models/comparison"
            className="px-4 py-2 rounded-lg bg-primary-cerulean text-text-light font-semibold hover:opacity-90 transition"
          >
            Model Comparison
          </Link>
        </div>
      </div>

      <ModelPerformanceLayout />
    </>
  );
}
