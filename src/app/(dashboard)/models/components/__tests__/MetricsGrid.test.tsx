/**
 * @file src/app/(dashboard)/models/components/__tests__/MetricsGrid.test.tsx
 * @description Unit tests for MetricsGrid component
 * @created 2026-02-12
 */

import { render, screen } from '@testing-library/react';
import { MetricsGrid } from '../MetricsGrid';
import { createMockMetrics } from '../../__tests__/test-utils';

describe('MetricsGrid Component', () => {
  it('should render metric cards for ROC-AUC, Precision, Recall, F1', () => {
    const metrics = createMockMetrics();
    render(<MetricsGrid metrics={metrics} loading={false} />);

    expect(screen.getByText(/ROC-AUC/i)).toBeInTheDocument();
    expect(screen.getByText(/Precision/i)).toBeInTheDocument();
    expect(screen.getByText(/Recall/i)).toBeInTheDocument();
    expect(screen.getByText(/F1 Score/i)).toBeInTheDocument();
  });

  it('should display correct metric values', () => {
    const metrics = createMockMetrics({
      rocAuc: 0.876,
      precision: 0.89,
      recall: 0.82,
      f1Score: 0.855,
    });
    render(<MetricsGrid metrics={metrics} loading={false} />);

    expect(screen.getByText('0.876')).toBeInTheDocument();
    expect(screen.getByText('0.89')).toBeInTheDocument();
    expect(screen.getByText('0.82')).toBeInTheDocument();
    expect(screen.getByText('0.855')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    const metrics = createMockMetrics();
    const { container } = render(<MetricsGrid metrics={metrics} loading={true} />);

    // Should have loading indicator or skeleton
    expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument();
  });

  it('should render null when metrics is null', () => {
    const { container } = render(<MetricsGrid metrics={null} loading={false} />);

    expect(container.textContent).toBe('');
  });

  it('should display metric cards with proper styling', () => {
    const metrics = createMockMetrics();
    const { container } = render(<MetricsGrid metrics={metrics} loading={false} />);

    const cards = container.querySelectorAll('[class*="card"]');
    expect(cards.length).toBeGreaterThanOrEqual(4);
  });

  it('should show optional className prop', () => {
    const metrics = createMockMetrics();
    const { container } = render(
      <MetricsGrid metrics={metrics} loading={false} className="test-class" />
    );

    expect(container.querySelector('.test-class')).toBeInTheDocument();
  });
});
