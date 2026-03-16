# Story 10: Quick Start Developer Guide

**Story 10:** Model Performance Monitoring - Implementation Ready  
**Created:** February 8, 2026  
**Status:** ✅ Ready for Development

---

## Before You Start

### Background: What Data Are We Monitoring?

This story builds monitoring for an ML model trained on the [Binary Classification of Machine Failures](https://github.com/JMViJi/Binary-Classification-of-Machine-Failures) dataset. The model predicts machine failures based on sensor data (temperature, rotational speed, torque, tool wear). Your monitoring system tracks how well this model performs in production.

**Key Context:**
- Failures are rare (~2% of data) → focus on precision, recall, F1 (not just accuracy)
- Multiple failure modes (TWF, HDF, PWF, OSF, RNF) → track failure categories separately
- Real-time data stream (1000+ readings/hour) → need performant drift detection

### Read These First (In Order)

1. **Acceptance Criteria** (5 min read)
   - File: `docs/implementation-plans/STORY10-Model-Performance-Monitoring.md`
   - Section: "Acceptance Criteria"
   - Why: Understand what "done" means

2. **User Story Definition** (3 min read)
   - File: `docs/stories/predictive-maintenance.stories.md`
   - Story: "Story 10: Model Performance Monitoring"
   - Why: Understand user value proposition

3. **Quick Architecture Overview** (10 min read)
   - File: `docs/implementation-plans/STORY10-Model-Performance-Monitoring.md`
   - Section: "Technical Architecture"
   - Why: Understand system design

4. **Component Architecture** (15 min read)
   - File: `docs/implementation-plans/STORY10-Model-Performance-Monitoring.md`
   - Section: "Technical Architecture" → "Component Structure"
   - Why: Know what components to build

5. **Full Implementation Plan** (60 min detailed read)
   - File: `docs/implementation-plans/STORY10-Model-Performance-Monitoring.md`
   - Why: Reference guide during implementation

---

## Implementation at a Glance

### Timeline
```
Week 1-2: Foundation (Phase 1)
├── TypeScript types & interfaces
├── Project structure
├── API client setup
└── Component scaffolding

Week 2-4: Core Features (Phase 2 + Phase 3)
├── Dashboard UI components
├── Time-series charts
├── Drift indicators
├── Retraining forms
├── Custom hooks
└── API integration

Week 4-5: Polish & Deploy (Phase 4)
├── Error handling
├── Accessibility (WCAG 2.1 AA)
├── Responsive design
├── Testing (unit/integration/E2E)
└── Deployment staging/canary/production
```

### What You'll Build

**22 React Components:**
- Metric cards (ROC-AUC, Precision, Recall, F1)
- Drift indicators (visualizations)
- Time-series charts (Recharts)
- A/B testing UI
- Retraining configuration form
- Experiment cards
- History tables
- Selectors & filters

**7 Custom Hooks:**
- `useModelPerformance` - Current metrics
- `useModelHistory` - Historical data
- `useDriftDetection` - Drift alerts
- `useActiveExperiments` - A/B tests
- `useRetrainingJobs` - Job history
- `useMetricsSubscription` - WebSocket real-time
- `useRetrainingActions` - Job submission

**8 API Endpoints:**
- GET `/api/models/{id}/metrics`
- GET `/api/models/{id}/drift`
- GET `/api/experiments`
- POST `/api/experiments/start`
- PUT `/api/experiments/{id}/decide`
- POST `/api/retraining/jobs`
- GET `/api/retraining/jobs/{id}`
- POST `/api/predictions/{id}/feedback`

---

## Phase-by-Phase Breakdown

### Phase 1: Foundation & Setup (Week 1-2)

**Deliverables:**
- [ ] TypeScript types file (models.types.ts)
- [ ] API client wrapper (models-api.ts)
- [ ] Route pages (page.tsx, layout.tsx, loading.tsx, error.tsx)
- [ ] Component scaffolding (empty tsx files)
- [ ] Mock data fixtures (for development)

**Files to Create:**
```
src/app/(dashboard)/models/
├── page.tsx
├── layout.tsx
├── loading.tsx
├── error.tsx
├── components/
│   ├── ModelPerformanceLayout.tsx
│   ├── MetricsGrid.tsx
│   ├── DriftIndicatorsSection.tsx
│   ├── PerformanceTimeSeriesChart.tsx
│   ├── ActiveExperimentsSection.tsx
│   ├── RetrainingHistoryTable.tsx
│   └── ... (20+ more)
├── types/
│   └── models.types.ts
└── api/
    └── models-api.ts
```

**Dependencies Install:**
```bash
npm install recharts ws swr lucide-react
npm install --save-dev @types/ws
```

**Key Setup:**
```typescript
// types/models.types.ts - Define all interfaces
// api/models-api.ts - API client
// components/hooks/ - Hook files
// __tests__/ - Test fixtures
```

---

### Phase 2: Core Implementation (Week 2-4)

**Build Components:**
- [ ] MetricsGrid (4 metric display cards)
- [ ] DriftIndicatorsSection (3 gauges)
- [ ] PerformanceTimeSeriesChart (Recharts)
- [ ] ExperimentCard (A/B test display)
- [ ] RetrainingConfigurationModal (form)

**Pass Props/State:**
```typescript
// Example: MetricCard component
interface MetricCardProps {
  label: string;  // "ROC-AUC"
  value: number;  // 0.8523
  baseline: number;  // 0.8726
  unit: string;  // "%"
  status: 'healthy' | 'warning' | 'critical';
}
```

**Test with Mock Data:**
```typescript
const mockMetrics: ModelMetrics = {
  rocAuc: 0.8523,
  precision: 0.8234,
  recall: 0.8812,
  baseline: { rocAuc: 0.8726 },
  sampleSize: 2847,
};
```

---

### Phase 3: Hooks & Data Fetching (Week 3-4)

**Implement Hooks:**
```typescript
// useModelPerformance.ts
const { metrics, baseline, status, isLoading, refetch } = 
  useModelPerformance(modelId);

// useDriftDetection.ts
const { featureDrift, predictionDrift, modelDrift } = 
  useDriftDetection(modelId);

// useRetrainingActions.ts
const { submitJob, jobStatus, pollStatus } = 
  useRetrainingActions();
```

**Connect to APIs:**
```typescript
// Call API when component mounts
useEffect(() => {
  fetchMetrics(selectedModelId);
}, [selectedModelId]);

// WebSocket real-time updates
useEffect(() => {
  const unsubscribe = useMetricsSubscription(
    modelId, 
    (updatedMetrics) => setMetrics(updatedMetrics)
  );
  return unsubscribe;
}, [modelId]);
```

---

### Phase 4: Polish & Testing (Week 4-5)

**Error Handling:**
```typescript
// Wrap components in error boundary
<ErrorBoundary fallback={<ErrorUI />}>
  <ModelPerformanceLayout />
</ErrorBoundary>

// Handle API errors
const { data, error, isLoading } = useModelPerformance(modelId);

if (error) return <ErrorMessage error={error} onRetry={refetch} />;
```

**Accessibility (WCAG 2.1 AA):**
```typescript
// Add ARIA labels
<div aria-label="Model accuracy metrics">
  <MetricCard label="ROC-AUC" value={0.85} />
</div>

// Keyboard navigation
<button 
  onClick={handleRefresh}
  aria-pressed={isRefreshing}
  disabled={isLoading}
>
  Refresh Metrics
</button>
```

**Testing:**
```typescript
// Unit test example
describe('MetricCard', () => {
  it('should display metric value correctly', () => {
    render(<MetricCard value={0.85} label="ROC-AUC" />);
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('should show trending indicator', () => {
    render(<MetricCard value={0.85} baseline={0.87} />);
    expect(screen.getByText('↓')).toBeInTheDocument();
  });
});

// E2E test example
test('should complete retraining workflow', async ({ page }) => {
  await page.click('button:has-text("Start Retraining")');
  await page.fill('#algorithm', 'lightgbm');
  await page.click('button:has-text("Submit")');
  await expect(page.locator('text=Job submitted')).toBeVisible();
});
```

**Performance:**
```typescript
// Code splitting
const PerformanceChart = lazy(() => 
  import('./PerformanceTimeSeriesChart')
);

// Memoization
const MetricsGrid = memo(function MetricsGrid({ metrics }) {
  return <div>{/* render */}</div>;
});

// Debouncing
const handleTimeRangeChange = debounce((range) => {
  fetchMetrics(range);
}, 300);
```

---

## Common Patterns

### Fetching Data with Real-Time Updates

```typescript
function ModelPerformanceLayout() {
  const [modelId, setModelId] = useState('model-v1');
  const { metrics, refetch } = useModelPerformance(modelId);
  
  // WebSocket real-time updates
  useMetricsSubscription(
    modelId,
    (updatedMetrics) => {
      // Update UI with new metrics
      setMetrics(updatedMetrics);
    }
  );

  return (
    <div>
      <button onClick={refetch}>Refresh</button>
      <MetricsGrid metrics={metrics} />
    </div>
  );
}
```

### Handling API Errors

```typescript
const { data, error, isLoading } = useModelPerformance(modelId);

if (isLoading) return <LoadingSkeletons />;

if (error) {
  return (
    <ErrorAlert>
      <p>{error.message}</p>
      <button onClick={refetch}>Try Again</button>
    </ErrorAlert>
  );
}

return <MetricsGrid metrics={data} />;
```

### Form Submission with Validation

```typescript
function RetrainingForm() {
  const [form, setForm] = useState({ algorithm: 'xgboost' });
  const [errors, setErrors] = useState({});
  const { submitJob, isSubmitting } = useRetrainingActions();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    const newErrors = validateForm(form);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit
    try {
      await submitJob(form);
      // Success toast
    } catch (err) {
      setErrors({ submit: err.message });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

---

## Debugging

### Enable Debug Logging

```typescript
// In development
if (process.env.NODE_ENV === 'development') {
  console.log('Metrics fetched:', metrics);
  console.log('Drift detected:', drift);
}

// Use React DevTools
// - Check component props
// - Inspect hooks state
// - Profile performance
```

### WebSocket Connection Issues

```typescript
// Check connection status
const { isConnected, lastUpdate } = useMetricsSubscription(modelId);

if (!isConnected) {
  console.warn('WebSocket disconnected, falling back to polling');
}
```

### API Response Inspection

```bash
# Open browser DevTools → Network tab
# Filter by XHR/Fetch
# Click on API call → Response/Preview
```

---

## Deployment Checklist

### Before Staging
- [ ] All components build without errors
- [ ] TypeScript strict mode passes
- [ ] Unit tests pass (>80% coverage)
- [ ] No console errors/warnings
- [ ] Bundle size < 150KB (gzipped)

### Staging Deployment
- [ ] Run integration tests
- [ ] Run E2E tests
- [ ] Performance audit (Lighthouse)
- [ ] Manual QA testing
- [ ] Accessibility audit (axe DevTools)

### Production Rollout
- [ ] Canary release to 5% of users
- [ ] Monitor error rates & performance
- [ ] Staged rollout: 25% → 50% → 100%
- [ ] Set up monitoring & alerts
- [ ] Document any issues

---

## Key Files Reference

| File | Purpose | Location |
|------|---------|----------|
| Full Plan | Complete spec | `docs/implementation-plans/STORY10-Model-Performance-Monitoring.md` |
| Component Guide | UI component usage | Plan section: "Design Specifications" |
| Hook Specs | Hook signatures | Plan section: "Implementation Requirements" |
| API Schemas | Endpoint definitions | Plan section: "API Integration Schema" |
| Test Strategy | Testing approach | Plan section: "Testing Strategy" |
| Deployment | Release process | Plan section: "Deployment Plan" |

---

## Need Help?

### Common Questions

**Q: How do I connect to the ML model service?**  
A: See `API Integration Schema` section. Use the `useModelPerformance` hook.

**Q: How do I handle real-time updates?**  
A: Use `useMetricsSubscription` hook which handles WebSocket connections automatically.

**Q: How do I run tests?**  
A: See `Testing Strategy` section. Use Jest for unit tests, React Testing Library for integration tests, Playwright for E2E.

**Q: What's the deployment process?**  
A: See `Deployment Plan` section. Canary → Staged rollout → Production.

### Key Contacts

- **Architecture Questions:** See `.github/instructions/` files
- **Design Questions:** See `Design Specifications` section
- **API Questions:** See `API Integration Schema` section
- **Testing Questions:** See `Testing Strategy` section

---

## Success Criteria

When Story 10 is complete:

✅ All metrics visible and updateable in real-time  
✅ Drift alerts triggered correctly  
✅ A/B experiments trackable and comparable  
✅ Retraining jobs submittable and monitorable  
✅ Dashboard loads < 2 seconds  
✅ All tests passing (unit/integration/E2E)  
✅ Accessibility compliant (WCAG 2.1 AA)  
✅ Performance targets met  
✅ Deployed to production with monitoring  

---

## Next Steps

1. **Read the full plan** (1 hour)
   - `docs/implementation-plans/STORY10-Model-Performance-Monitoring.md`

2. **Assign team members** (30 min)
   - 2-3 full-stack developers
   - 1 ML engineer

3. **Set up environment** (1-2 hours)
   - Clone repository
   - Install dependencies
   - Follow Phase 1 setup

4. **Start Phase 1** (Week 1-2)
   - Create types and interfaces
   - Set up API client
   - Build component scaffolds

5. **Review progress** (Weekly)
   - Check against phase checklist
   - Adjust if needed
   - Plan next phase

---

**Good luck! Remember: You have a comprehensive guide. Refer back to it often.** 🚀

**Questions?** Check the full implementation plan or architecture guidelines.

**Last Updated:** February 8, 2026  
**Status:** Ready for Development ✅
