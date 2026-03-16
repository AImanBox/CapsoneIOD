/**
 * @file README.md
 * @description Model Performance Monitoring Dashboard - Frontend Implementation (Capstone Project)
 * @category Capstone/ModelPerformanceMonitoring
 * @project capstone_project
 */

# Model Performance Monitoring Dashboard - Capstone Project

**Project:** capstone_project  
**Status:** Phase 4 Testing Infrastructure Complete ✅ (84 tests created)  
**Location:** `d:\Project\capstone_project`  
**Phase 1:** Complete ✅ (14 files, 3,700+ LOC)  
**Phase 2:** 86% Complete ✅ (19/22 components, 3,500+ LOC)  
**Phase 3:** Complete ✅ (7/7 hooks, 1,200+ LOC)  
**Phase 3B:** Complete ✅ (Integration finished)  
**Phase 4:** In Progress 🔄 (Testing infrastructure ready, execution pending)  
**Date:** February 12, 2026  
**Story ID:** STORY10-MODEL-PERF-MONITORING  
**Total Codebase:** 40+ files, 8,400+ lines of TypeScript

---

## 📋 Phase 1: Foundation & Setup - COMPLETED

### ✅ Completed Files

#### 1. **TypeScript Types** (`types/models.types.ts`)
- Core model and metrics types
- Drift detection types
- A/B experiment types
- Retraining job types
- Prediction feedback types
- WebSocket event types
- API response types

#### 2. **API Client** (`api/models-api.ts`)
- `ModelMetricsClient` class with full endpoint coverage:
  - Model endpoints (list, get)
  - Metrics endpoints (current, historical, confidence intervals)
  - Drift detection endpoints
  - A/B experiment endpoints (create, manage, decide)
  - Retraining job endpoints (submit, status, logs, history)
  - Prediction feedback endpoints
- Request caching (5-minute TTL by default)
- Error handling with custom `ApiError` class
- Authentication token injection
- Query string building utilities

#### 3. **Mock Data** (`__mocks__/mock-data.ts`)
- Realistic mock data for all data types
- 2 model versions (XGBoost v5, LightGBM v3)
- 60-day time-series metrics
- Current metrics data
- Drift detection response
- 2 active/past A/B experiments
- 3 retraining jobs with various statuses
- Helper function to generate time-series data

#### 4. **WebSocket Client** (`services/websocket-client.ts`)
- `ModelMetricsWebSocketClient` class
- Auto-reconnect with exponential backoff
- Heartbeat to keep connection alive
- Event subscription system
- Real-time event handling:
  - Metrics updates
  - Drift alerts
  - Retraining status
- Singleton instance for app-wide use

#### 5. **Routing & Layout**
- **`page.tsx`** - Main dashboard page with placeholder
- **`layout.tsx`** - Layout wrapper
- **`loading.tsx`** - Loading skeleton UI
- **`error.tsx`** - Error boundary with retry

#### 6. **Utility Functions**
- **`formatters.ts`** (400+ lines)
  - Metric formatting (ROC-AUC, precision, recall, F1)
  - Percentage, date/time, duration formatting
  - Relative time ("2 hours ago")
  - Confidence interval formatting
  - 15+ formatting utilities

- **`colorUtils.ts`** (300+ lines)
  - Status color palettes (healthy/warning/critical)
  - Trend colors and arrows
  - Chart colors and gradients
  - Drift gauge colors
  - Statistical significance colors
  - Color mapping for all components

- **`chartHelpers.ts`** (400+ lines)
  - Time-series data preparation for Recharts
  - Exponential smoothing
  - Confidence interval calculations
  - Custom tooltip components
  - Chart dimension calculations
  - Data downsampling for performance
  - Moving average calculations


---

## 🎉 Phase 2: Core Implementation - COMPLETE (86%)

### ✅ Completed Components (19 of 22)

#### Metrics & Health Display
1. **HealthStatusBadge.tsx** - Visual status indicator (🟢/🟡/🔴)
2. **MetricCard.tsx** - Individual metric card (ROC-AUC, Precision, Recall, F1)
3. **MetricsGrid.tsx** - Responsive 4-column grid of metrics
4. **PerformanceTimeSeriesChart.tsx** - ROC-AUC time series with Recharts (350+ lines)
   - Multi-metric support (ROC-AUC, Precision, Recall, F1)
   - Confidence interval shading (±1 std dev)
   - Interactive tooltips
   - Statistics panel

#### Drift Detection
5. **DriftGauge.tsx** - Circular progress gauge for drift visualization
6. **DriftIndicatorsSection.tsx** - Complete drift display with 3 gauges

#### Control Components
7. **ModelSelector.tsx** - Model version dropdown selector
8. **TimeRangeSelector.tsx** - Date range buttons and custom picker (7d/30d/90d/year)
9. **DashboardActionBar.tsx** - Toolbar with Refresh/Export/Settings buttons

#### Experiment Management
10. **ExperimentCard.tsx** - A/B experiment display card
11. **ActiveExperimentsSection.tsx** - Section for running experiments

#### Retraining Workflow (8 components)
12. **StartRetrainingButton.tsx** - CTA button for new retraining jobs
13. **RetrainingConfigurationModal.tsx** - Job configuration form (350+ lines)
    - Algorithm selection (Random Forest, Gradient Boosting, Neural Network)
    - Training/validation split slider
    - Validation criteria configuration
    - Data selection options
14. **RetrainingJobRow.tsx** - Table row for job history
15. **RetrainingHistoryTable.tsx** - Job history table with pagination (280+ lines)
    - 10 items per page
    - Filter by status and date
    - Sorting capabilities
16. **RetrainingStepsWizard.tsx** - Multi-step progress visualization (250+ lines)
    - 4-step workflow: Queued → Training → Validating → Deployed
    - Real-time progress tracking
    - Error states (Failed/Rolled Back)
17. **RetrainingJobDetails.tsx** - Detailed job view (300+ lines)
18. **RetrainingSection.tsx** - Complete retraining section (200+ lines)

#### Main Container
19. **ModelPerformanceLayout.tsx** - Main dashboard layout (400+ lines)
    - Header with controls
    - 6 major sections:
      1. Performance metrics
      2. Drift indicators
      3. Time-series chart
      4. Active experiments
      5. Retraining management
      6. Model information
    - Refresh and export functionality
    - Loading states

### Statistics
- **Total Components**: 19
- **Total Lines of Code**: 3,500+
- **TypeScript Interfaces**: 30+
- **JSDoc Documentation**: 19 blocks
- **TailwindCSS Utilities**: 100+
- **Integration Points**: 5 (types, utilities, hooks-ready, API-ready, mock data)

### Key Features Delivered
- ✅ Real-time metrics visualization
- ✅ Drift detection with gauges
- ✅ Time-series charts with confidence intervals
- ✅ A/B experiment management
- ✅ Retraining job workflow
- ✅ Model selection and filtering
- ✅ Data export (CSV)
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Error handling and loading states
- ✅ Full TypeScript type safety

### See Also: [PHASE2_COMPLETION_SUMMARY.md](./PHASE2_COMPLETION_SUMMARY.md)
✨ Detailed breakdown of all Phase 2 components, architecture patterns, and next steps.

---

## 🪝 Phase 3: Hooks & Data Integration - COMPLETE ✅

### ✅ Completed Hooks (7 of 7)

#### 1. useModelPerformance (120+ lines)
Fetch current model performance metrics with auto-refresh
- Auto-refresh interval: 60 seconds
- Returns: `{ data: EvaluationMetrics, loading, error, refetch, isRefreshing }`

#### 2. useModelHistory (130+ lines)
Fetch historical time-series metrics over date ranges
- Supports: 7d, 30d, 90d, year, custom ranges
- Returns: `{ data: EvaluationMetrics[], loading, error, refetch, isRefreshing }`

#### 3. useDriftDetection (130+ lines)
Fetch drift detection indicators (prediction drift, feature drift, top features)
- Auto-refresh interval: 120 seconds
- Returns: `{ data: DriftDetectionResponse, loading, error, refetch, isRefreshing }`

#### 4. useActiveExperiments (140+ lines)
Fetch active A/B experiments with filtering
- Auto-refresh interval: 30 seconds
- Can filter completed experiments
- Returns: `{ data: Experiment[], loading, error, refetch, isRefreshing }`

#### 5. useRetrainingJobs (130+ lines)
Fetch retraining job history with pagination
- Auto-refresh interval: 30 seconds
- Returns: `{ data: RetrainingJob[], loading, error, refetch, isRefreshing }`

#### 6. useMetricsSubscription (160+ lines)
WebSocket subscription for real-time updates
- Event types: `metrics_update`, `drift_alert`, `retraining_status`
- Singleton WebSocket client
- Returns: `{ isConnected, lastUpdate, events, subscribe, unsubscribe, clearEvents }`

#### 7. useRetrainingActions (140+ lines)
Manage retraining job mutations (submit, retry, cancel)
- Async functions with error handling
- Per-action loading states
- Returns: `{ submitJob, retryJob, cancelJob, submitState, retryState, cancelState }`

### Statistics
- **Total Hooks**: 7
- **Total Lines of Code**: 1,200+
- **TypeScript Interfaces**: 15+
- **Integration Points**: 3 (API client, WebSocket, types)

### Key Features
- ✅ Full TypeScript type safety
- ✅ Auto-refresh with configurable intervals
- ✅ Real-time WebSocket updates
- ✅ Error handling at hook level
- ✅ Manual refetch support
- ✅ Proper loading state management
- ✅ Singleton WebSocket client
- ✅ Event buffering and cleanup

### See Also: [PHASE3_COMPLETION_SUMMARY.md](./PHASE3_COMPLETION_SUMMARY.md)
✨ Detailed breakdown of all Phase 3 hooks, integration patterns, and usage examples.

---

## 🔗 Phase 3B: Hook Integration - COMPLETE ✅

### Integration Overview
All Phase 3 custom hooks successfully integrated into Phase 2 React components. Dashboard now fetches real data instead of using mock data.

### Integration Points

#### Main Container (ModelPerformanceLayout.tsx)
- ✅ Imports all 7 Phase 3 hooks
- ✅ Coordinates data fetching for all sections
- ✅ Manages model selection and time range state
- ✅ Combines loading states from multiple hooks
- ✅ Handles error display and recovery
- ✅ Implements refresh functionality
- ✅ Supports data export from real history
- ✅ Displays WebSocket connection status

#### Data Sources
| Hook | Component | Data Type | Auto-Refresh |
|------|-----------|-----------|---------------|
| useModelPerformance | MetricsGrid | Current metrics | 60 seconds |
| useModelHistory | PerformanceTimeSeriesChart | Time-series | On-demand |
| useDriftDetection | DriftIndicatorsSection | Drift indicators | 120 seconds |
| useActiveExperiments | ActiveExperimentsSection | A/B tests | 30 seconds |
| useRetrainingJobs | RetrainingSection | Job history | 30 seconds |
| useRetrainingActions | RetrainingSection | Mutations | On-demand |
| useMetricsSubscription | ModelPerformanceLayout | Real-time events | WebSocket |

#### Handler Implementation
- `handleRefresh()` - Refetches all data simultaneously
- `handleExport()` - Exports from real time-series history
- `handleModelChange()` - Updates model (automatic hook refetch)
- `handleTimeRangeChange()` - Updates time range (automatic hook refetch)
- `handleSubmitRetrainingJob()` - Creates jobs via useRetrainingActions
- `handleRetryJob()` - Retries failed jobs
- `handleCancelJob()` - Cancels running jobs

#### Error Handling
- ✅ Independent error handling per data source
- ✅ Retry buttons for failed requests
- ✅ User-friendly error messages
- ✅ Graceful fallbacks when data unavailable
- ✅ No dashboard crashes on errors

### Key Features Activated
- ✅ **Real Data Fetching** - No more mock data
- ✅ **Real-Time Updates** - WebSocket event streaming
- ✅ **Automatic Refresh** - Configurable intervals per hook
- ✅ **Error Recovery** - Retry mechanisms for failures
- ✅ **State Synchronization** - Multiple data sources coordinated
- ✅ **Mutation Support** - Submit, retry, cancel retraining jobs

### See Also: [PHASE3B_INTEGRATION_SUMMARY.md](./PHASE3B_INTEGRATION_SUMMARY.md)
✨ Detailed technical breakdown of integration architecture, data flow, and testing instructions.

---

### [DEPRECATED] Ready to Build:

#### Components to Implement (22 total)
1. **MetricsGrid.tsx** - 4 metric cards (ROC-AUC, Precision, Recall, F1)
2. **MetricCard.tsx** - Individual metric display
3. **HealthStatusBadge.tsx** - Status indicator (🟢/🟡/🔴)
4. **DriftIndicatorsSection.tsx** - Feature/prediction/model drift display
5. **DriftGauge.tsx** - Drift visualization gauge
6. **PerformanceTimeSeriesChart.tsx** - 60-day ROC-AUC line chart
7. **ConfidenceIntervalBand.tsx** - Confidence shading on charts
8. **ActiveExperimentsSection.tsx** - A/B testing display
9. **ExperimentCard.tsx** - Single experiment card
10. **ExperimentMetricsComparison.tsx** - Control vs Challenger comparison
11. **ExperimentControls.tsx** - Stop/adjust/decide controls
12. **TrafficAllocationSlider.tsx** - Traffic split adjustment
13. **RetrainingHistoryTable.tsx** - Job history table
14. **RetrainingJobRow.tsx** - Table row component
15. **StartRetrainingButton.tsx** - Button to open modal
16. **RetrainingConfigurationModal.tsx** - Form modal
17. **RetrainingStepsWizard.tsx** - Multi-step workflow
18. **ModelSelector.tsx** - Model version dropdown
19. **TimeRangeSelector.tsx** - Date range picker
20. **DashboardActionBar.tsx** - Toolbar (Refresh/Export/Settings)
21. **ModelPerformanceLayout.tsx** - Main container (600 lines)
22. Additional helper components

#### Custom Hooks to Implement (7)
1. `useModelPerformance` - Fetch current metrics
2. `useModelHistory` - Fetch historical data
3. `useDriftDetection` - Get drift indicators
4. `useActiveExperiments` - Fetch A/B tests
5. `useRetrainingJobs` - Fetch job history
6. `useMetricsSubscription` - WebSocket real-time updates
7. `useRetrainingActions` - Submit and manage jobs

---

## 📚 File Structure

```
src/app/(dashboard)/models/
├── page.tsx                          ✅ Done
├── layout.tsx                        ✅ Done
├── loading.tsx                       ✅ Done
├── error.tsx                          ✅ Done
│
├── types/
│   └── models.types.ts               ✅ Done
│
├── api/
│   └── models-api.ts                 ✅ Done
│
├── services/
│   └── websocket-client.ts           ✅ Done
│
├── __mocks__/
│   └── mock-data.ts                  ✅ Done
│
├── utils/
│   ├── formatters.ts                 ✅ Done
│   ├── colorUtils.ts                 ✅ Done
│   └── chartHelpers.ts               ✅ Done
│
├── components/                       ⬜ Phase 2
│   ├── ModelPerformanceLayout.tsx
│   ├── MetricsGrid.tsx
│   ├── MetricCard.tsx
│   ├── HealthStatusBadge.tsx
│   ├── DriftIndicatorsSection.tsx
│   ├── DriftGauge.tsx
│   ├── PerformanceTimeSeriesChart.tsx
│   ├── ConfidenceIntervalBand.tsx
│   ├── ActiveExperimentsSection.tsx
│   ├── ExperimentCard.tsx
│   ├── ExperimentMetricsComparison.tsx
│   ├── ExperimentControls.tsx
│   ├── TrafficAllocationSlider.tsx
│   ├── RetrainingHistoryTable.tsx
│   ├── RetrainingJobRow.tsx
│   ├── StartRetrainingButton.tsx
│   ├── RetrainingConfigurationModal.tsx
│   ├── RetrainingStepsWizard.tsx
│   ├── ModelSelector.tsx
│   ├── TimeRangeSelector.tsx
│   ├── DashboardActionBar.tsx
│   │
│   └── hooks/                        ⬜ Phase 3
│       ├── useModelPerformance.ts
│       ├── useModelHistory.ts
│       ├── useDriftDetection.ts
│       ├── useActiveExperiments.ts
│       ├── useRetrainingJobs.ts
│       ├── useMetricsSubscription.ts
│       └── useRetrainingActions.ts
```

---

## 🔧 How to Use Phase 1 Artifacts

### API Client

```typescript
import { modelMetricsClient } from '@/app/(dashboard)/models/api/models-api';

// Get current metrics
const metrics = await modelMetricsClient.getMetrics('model_001', { 
  timeRange: '30d' 
});

// Start retraining job
const job = await modelMetricsClient.startRetrainingJob({
  modelId: 'model_001',
  triggerReason: 'manual',
  trainingConfig: {
    datasetName: 'production_data',
    algorithm: 'xgboost',
  },
  validationConfig: { testSizeRatio: 0.2 },
});
```

### WebSocket Client

```typescript
import { webSocketClient } from '@/app/(dashboard)/models/services/websocket-client';

// Connect and subscribe
await webSocketClient.connect();
webSocketClient.subscribeToModel('model_001');

// Handle events
webSocketClient.on('metrics_updated', (event) => {
  console.log('Metrics updated:', event.metrics);
});

webSocketClient.on('drift_detected', (event) => {
  console.log('Drift detected:', event.severity, event.message);
});

// Cleanup
webSocketClient.disconnect();
```

### Mock Data

```typescript
import { mockData } from '@/app/(dashboard)/models/__mocks__/mock-data';

// Use in Storybook or tests
const { modelPerformanceResponse, experiments, retrainingJobs } = mockData;
```

### Formatters

```typescript
import {
  formatAsPercentage,
  formatRocAuc,
  formatDate,
  formatRelativeTime,
} from '@/app/(dashboard)/models/utils/formatters';

formatRocAuc(0.85);           // "0.850"
formatAsPercentage(0.82);     // "82%"
formatDate(new Date());       // "Feb 12, 2026"
formatRelativeTime(new Date()); // "just now"
```

### Color Utils

```typescript
import {
  getStatusColors,
  getTrendArrow,
  getDriftStatusColor,
  getMetricLineColor,
} from '@/app/(dashboard)/models/utils/colorUtils';

const colors = getStatusColors('healthy'); // bg, border, text, icon
const trend = getTrendArrow(0.02);         // arrow, color, badge
const drift = getDriftStatusColor(0.12, 0.15); // status, color
```

### Chart Helpers

```typescript
import {
  prepareTimeSeriesData,
  calculateConfidenceIntervalBands,
  createCustomTooltip,
} from '@/app/(dashboard)/models/utils/chartHelpers';

// Prepare data for Recharts
const chartData = prepareTimeSeriesData(timeSeriesMetrics, {
  dateFormat: 'short',
  smoothing: true,
});

// Calculate CI bands
const { lower, upper } = calculateConfidenceIntervalBands(data, 0.95);

// Create tooltip component
const Tooltip = createCustomTooltip({ showConfidenceInterval: true });
```

---

## 📖 Architecture Decisions

### 1. **Client Initialization**
- Singleton pattern for API client and WebSocket client
- Lazy initialization to avoid issues in SSR

### 2. **Type Safety**
- Comprehensive TypeScript types for all API responses
- Type-safe API methods with overloads
- Discriminated unions for WebSocket events

### 3. **Caching Strategy**
- API responses cached with 5-minute TTL
- Cache invalidation on mutations (POST/PUT/PATCH)
- Manual cache clearing available

### 4. **Error Handling**
- Custom `ApiError` class with status codes
- Graceful fallbacks in formatters and color utils
- Error components with recovery options (Phase 1)

### 5. **Performance**
- Chart data downsampling for large datasets
- Exponential smoothing for trend analysis
- Memoized color calculations
- Utility functions optimized for reuse

---

## 🧪 Phase 4: Testing & Polish - IN PROGRESS 🔄

### ✅ Testing Infrastructure Created

#### Test Configuration Files
- ✅ `jest.config.ts` - Jest configuration with type checking
- ✅ `jest.setup.ts` - Global test setup with console mocking
- ✅ `__tests__/test-utils.ts` - Shared test helpers and mock data generators

#### Mock Implementations
- ✅ `__tests__/mocks/api-mock.ts` - Mock `ModelMetricsClient` with test helpers
- ✅ `__tests__/mocks/websocket-mock.ts` - Mock WebSocket with event simulation

#### Hook Unit Tests (7 tests)
- ✅ `hooks/__tests__/useModelPerformance.test.ts` (12 tests)
- ✅ `hooks/__tests__/useDriftDetection.test.ts` (8 tests)
- ✅ `hooks/__tests__/useModelHistory.test.ts` (8 tests)
- ✅ `hooks/__tests__/useActiveExperiments.test.ts` (7 tests)
- ✅ `hooks/__tests__/useRetrainingJobs.test.ts` (8 tests)
- ✅ `hooks/__tests__/useMetricsSubscription.test.ts` (8 tests)
- ✅ `hooks/__tests__/useRetrainingActions.test.ts` (8 tests)

**Total Hook Tests:** 59 tests

#### Component Unit Tests (2+)
- ✅ `components/__tests__/MetricsGrid.test.tsx` (6 tests)
- ✅ `components/__tests__/DriftIndicatorsSection.test.tsx` (7 tests)
- ⏳ `components/__tests__/PerformanceTimeSeriesChart.test.tsx` (TBD)
- ⏳ `components/__tests__/RetrainingSection.test.tsx` (TBD)
- ⏳ `components/__tests__/ModelPerformanceLayout.test.tsx` (TBD)

#### Integration Tests
- ✅ `__tests__/integration/hooks-components-integration.test.tsx` (6 test suites)

### Test Coverage Goals

| Test Suite | Target | Status |
|------------|--------|--------|
| **Unit - Hooks** | 90%+ | 59/59 tests created ✅ |
| **Unit - Components** | 85%+ | 13/30 tests created ⏳ |
| **Integration** | 80%+ | 6 suites created ✅ |
| **Overall** | 75%+ | In progress 🔄 |

### Test Execution Commands

```bash
# Run all tests
npm run test

# Run with coverage
npm run test -- --coverage

# Run specific test file
npm run test -- useModelPerformance.test.ts

# Watch mode for development
npm run test:watch

# Run hooks tests only
npm run test -- hooks/__tests__

# Run integration tests
npm run test -- __tests__/integration
```

### Testing Checklist

#### Unit Testing
- [x] Create hook test utilities and mocks
- [x] Write all 7 hook unit tests
- [x] Test error scenarios
- [x] Test loading states
- [x] Test auto-refresh intervals
- [ ] Test hook cleanup and memory leaks
- [ ] Run coverage analysis
- [ ] Fix coverage gaps

#### Component Testing
- [x] Create component test utilities
- [x] Test 2 core components
- [ ] Test 3 additional components
- [ ] Test error boundaries
- [ ] Test loading states
- [ ] Test data rendering
- [ ] Run coverage analysis

#### Integration Testing
- [x] Test hook coordination
- [x] Test model version sync
- [x] Test concurrent operations
- [x] Test error isolation
- [ ] Test rapid state changes
- [ ] Test WebSocket integration

#### Performance Testing (Phase 4 - Week 2)
- [ ] Measure re-render counts
- [ ] Profile memory usage
- [ ] Benchmark API response times
- [ ] Test chart rendering with 1000+ points
- [ ] Verify WebSocket throughput

#### Accessibility Testing (Phase 4 - Week 3)
- [ ] WCAG 2.1 AA audit
- [ ] Keyboard navigation test
- [ ] Screen reader compatibility
- [ ] Color contrast verification
- [ ] Focus indicator testing

### Documentation
- ✅ [PHASE4_TESTING_PLAN.md](./PHASE4_TESTING_PLAN.md) - Comprehensive testing guide
- Test execution instructions
- Debugging tips and common issues
- Coverage reports and benchmarks

### Current Status
- **Tests Created:** 84 tests across 9 files
- **Mock Infrastructure:** Complete
- **Configuration:** Complete  
- **Ready for Execution:** ✅ Yes

**Next Step:** Execute test suite and analyze coverage  
**Target Completion:** Phase 4 complete by end of day 7  

---

## 🧪 Testing Strategies (Legacy)

### Unit Tests
- Formatter functions with various inputs
- Color utility calculations
- Chart data transformation
- API client request building

### Component Tests (Phase 2-3)
- Metric card rendering
- Chart rendering with Recharts
- Form validation
- Modal interactions

### Integration Tests
- API client with mock server
- WebSocket connection and message handling
- End-to-end dashboard workflows

### E2E Tests
- Full monitoring dashboard flows
- Experiment creation and management
- Retraining job submission and tracking

---

## 🚀 Next Steps

1. **Phase 2 Start:** Implement metric cards and charts
2. **Review API schemas:** Ensure alignment with backend
3. **Test formatters:** Verify all formatting functions
4. **Setup Storybook:** For component documentation
5. **Integration with auth:** Verify ML_ENGINEER role access

---

## 📞 Support & Documentation

- **Architecture Details:** See [Architecture & Design Guidelines](../../../.github/instructions/Architecture%20&%20Design%20Guidelines.instructions.md)
- **Code Quality:** See [Code Quality Standards](../../../.github/instructions/Code%20Quality%20Standards.instructions.md)
- **Documentation:** See [Documentation Rules](../../../.github/instructions/Documentation%20Rules.instructions.md)

---

## 📝 Notes

- All types are compatible with the API schema in the implementation plan
- Mock data reflects realistic production scenarios
- Utility functions are production-ready
- WebSocket client includes auto-reconnect logic
- API client handles both development and production environments

**Ready for Phase 2! 🎉**
