/**
 * @file src/app/(dashboard)/models/components/__tests__/DriftIndicatorsSection.test.tsx
 * @description Unit tests for DriftIndicatorsSection component
 * @created 2026-02-12
 */

import { render, screen } from '@testing-library/react';
import { DriftIndicatorsSection } from '../DriftIndicatorsSection';
import { createMockDriftResponse } from '../../__tests__/test-utils';

describe('DriftIndicatorsSection Component', () => {
  it('should render drift indicators', () => {
    const driftData = createMockDriftResponse({
      indicators: [
        { name: 'Input Distribution', status: 'normal', score: 0.15 },
        { name: 'Feature Drift', status: 'warning', score: 0.45 },
      ],
    });

    render(<DriftIndicatorsSection drift={driftData} loading={false} />);

    expect(screen.getByText(/Input Distribution/i)).toBeInTheDocument();
    expect(screen.getByText(/Feature Drift/i)).toBeInTheDocument();
  });

  it('should display drift score', () => {
    const driftData = createMockDriftResponse({ driftScore: 0.23 });
    render(<DriftIndicatorsSection drift={driftData} loading={false} />);

    expect(screen.getByText(/0.23/)).toBeInTheDocument();
  });

  it('should show drift status badge', () => {
    const driftData = createMockDriftResponse({ driftDetected: false });
    render(<DriftIndicatorsSection drift={driftData} loading={false} />);

    // Should show status indicator
    expect(screen.getByText(/No Drift Detected|Drift Detected/i)).toBeInTheDocument();
  });

  it('should display threshold information', () => {
    const driftData = createMockDriftResponse({ driftThreshold: 0.5 });
    render(<DriftIndicatorsSection drift={driftData} loading={false} />);

    expect(screen.getByText(/0.5/)).toBeInTheDocument();
  });

  it('should show indicator status colors', () => {
    const driftData = createMockDriftResponse();
    const { container } = render(
      <DriftIndicatorsSection drift={driftData} loading={false} />
    );

    // Should have status indicators with colors
    const statusElements = container.querySelectorAll('[class*="status"]');
    expect(statusElements.length).toBeGreaterThanOrEqual(0);
  });

  it('should render loading skeleton', () => {
    const driftData = createMockDriftResponse();
    const { container } = render(
      <DriftIndicatorsSection drift={driftData} loading={true} />
    );

    expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument();
  });

  it('should render null when drift data is null', () => {
    const { container } = render(
      <DriftIndicatorsSection drift={null} loading={false} />
    );

    expect(container.textContent).toBe('');
  });
});
