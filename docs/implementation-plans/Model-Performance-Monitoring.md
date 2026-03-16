# STORY10: Model Performance Monitoring - Implementation Plan

**Document Version:** 1.0  
**Date Created:** February 8, 2026  
**Status:** Ready for Implementation  
**Priority:** High (Critical)

---

## Project Context

**Technical Stack:**
- **Frontend:** Next.js 15 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui
- **Backend:** Python FastAPI (ML service), NestJS (orchestration), PostgreSQL, TimescaleDB, Redis
- **ML Infrastructure:** XGBoost/LightGBM models, SHAP explainability, MLflow model registry
- **Real-time:** WebSocket server, Server-Sent Events (SSE)
- **Infrastructure:** Vercel (FE), Cloud Run/Fly.io (Backend), GitHub Actions CI/CD
- **Monitoring:** Prometheus, Grafana, Sentry
- **ML Monitoring:** Evidently AI (drift detection), custom metrics pipeline

---

## User Story

**As a** ML Engineer  
**I want to** monitor model performance in production and retrain when accuracy degrades  
**So that** predictions remain reliable and accurate

### Story ID
`STORY10-MODEL-PERF-MONITORING`

### Story Points
13 (Complex - involves ML ops infrastructure)

---

## ML Dataset Reference

**Dataset Source:** [Binary Classification of Machine Failures](https://github.com/JMViJi/Binary-Classification-of-Machine-Failures)  
**Competition:** Kaggle Playground Series S3E17

### Dataset Features

The predictive maintenance system trains on machine sensor data with the following attributes:

- **ID:** Unique identifier for each record
- **Product ID:** Machine identifier (Type + number)
- **Type:** Category of machine (important for model segmentation)
- **Air Temperature [K]:** Ambient temperature around machine
- **Process Temperature [K]:** Temperature of machine's operational process
- **Rotational Speed [rpm]:** Operating speed (higher = more stress)
- **Torque [Nm]:** Rotational force applied to machine
- **Tool Wear [min]:** Accumulated wear and tear indicator

### Failure Modes (Multi-Label Classification)

The system tracks these specific failure types:

- **TWF:** Tool Wear Failure - caused by accumulated tool wear
- **HDF:** Heat Dissipation Failure - inability to dissipate operational heat
- **PWF:** Power Failure - electrical/power supply issues
- **OSF:** Overstrain Failure - machine operating beyond safe parameters
- **RNF:** Random Failure - unspecified/unplanned failures
- **Overall:** Binary indicator (0 = no failure, 1 = any failure occurred)

### Class Imbalance Challenge

- **Failure Rate:** ~2% of observations are failures (class imbalance)
- **Impact:** Model Performance Monitoring must account for skewed predictions
- **Solution:** Track precision, recall, F1, ROC-AUC; not just accuracy

---

## Pre-conditions

### System State
- ✅ Predictive maintenance platform deployed and operational
- ✅ XGBoost/LightGBM models trained and versioned in MLflow registry
- ✅ Historical prediction data being collected (predictions + actuals)
- ✅ Real-time inference pipeline active (predictions being generated)
- ✅ Feature engineering pipeline operational
- ✅ PostgreSQL + TimescaleDB schema with predictions table populated

### User State
- ML Engineer has authenticated via Supabase Auth
- User has 'ML_ENGINEER' or 'ADMIN' role
- User has permissions to access model management endpoints

### Data Requirements
- **Predictions Table:** Contains `prediction_id`, `machine_id`, `predicted_failure_prob`, `predicted_at`, `features_used`
- **Feedback Table:** Stores actual failure outcomes with `actual_failure` (0/1), `recorded_at`, `failure_mode` (TWF/HDF/PWF/OSF/RNF)
- **Model Registry:** Model versions, training metadata, deployment dates, baseline metrics
- **Historical Metrics:** Previous training ROC-AUC, precision, recall scores for comparison
- **Feature Statistics:** Training set feature distributions (mean, std) for drift detection

### System Dependencies
- ML serving infrastructure: XGBoost/LightGBM models available via API
- Data pipelines: Predictions and feedback data flowing to database
- Core dashboard infrastructure: Layout and navigation components
- Monitoring infrastructure: Prometheus, Grafana, Sentry operational

---

## ML Training Infrastructure

### Overview

The platform includes a complete Python-based ML training pipeline located in the `ml/` directory. This infrastructure is responsible for training and evaluating gradient boosting models on the production dataset.

**Key Components:**

1. **`ml/data_loader.py`** - Data loading and preprocessing
   - Loads train.csv (136,429 samples) and test.csv (90,954 samples)
   - Handles categorical encoding (Type: L, M, H)
   - Validates data integrity and class distribution
   - Manages train/test split with stratification

2. **`ml/feature_engineering.py`** - Feature engineering pipeline
   - Creates domain-specific features:
     - **Power** = Torque × Rotational Speed
     - **Temperature Difference** = Process Temp - Air Temp
     - **Wear Rate** = Tool Wear / (Torque + 1)
     - **Total Failure Count** = Sum of failure mode indicators
   - Interaction features for non-linear relationships
   - Advanced polynomial and ratio features

3. **`ml/scripts/train_models.py`** - Main training script
   - Trains both XGBoost and LightGBM models
   - Handles class imbalance (98% negative, 2% positive) with `scale_pos_weight`
   - Evaluates on ROC-AUC, Precision, Recall, F1, Accuracy
   - Saves trained models and metrics with timestamps

### Dataset Details

**Training Data (train.csv):**
- **Size:** 6.85 MB
- **Rows:** 136,429 samples
- **Columns:** 14 (features + target + failure modes)
- **Target Variable:** Machine failure (0/1)
- **Class Distribution:** ~2% failures, ~98% no failures

**Test Data (test.csv):**
- **Size:** 4.46 MB
- **Rows:** 90,954 samples
- **Purpose:** Final evaluation without target variable

### Training Pipeline Usage

#### Step 1: Install Dependencies

```bash
cd ml
pip install -r requirements.txt
```

**Dependencies:**
- pandas, numpy - Data manipulation
- scikit-learn - Preprocessing and metrics
- xgboost, lightgbm - Model training
- matplotlib - Visualization
- mlflow - Model registry
- shap - Feature importance

#### Step 2: Run Training

```bash
cd ml/scripts
python train_models.py
```

**Output:**
```
ml/models/
├── xgboost_model_20260208_153000.pkl      # Trained model
├── lightgbm_model_20260208_153000.pkl     # Trained model
├── training_metrics_20260208_153000.json  # Performance metrics
└── feature_columns_20260208_153000.json   # Feature column names
```

#### Step 3: Model Metrics

Each training run generates metrics JSON with:

```json
{
  "timestamp": "20260208_153000",
  "xgboost": {
    "roc_auc": 0.85,
    "precision": 0.82,
    "recall": 0.88,
    "f1": 0.85,
    "accuracy": 0.98
  },
  "lightgbm": {
    "roc_auc": 0.84,
    "precision": 0.81,
    "recall": 0.87,
    "f1": 0.84,
    "accuracy": 0.98
  },
  "feature_count": 23,
  "dataset_info": {
    "source": "Binary Classification of Machine Failures (Kaggle)",
    "repository": "https://github.com/JMViJi/Binary-Classification-of-Machine-Failures"
  }
}
```

### Model Training Parameters

**XGBoost:**
```python
xgb_params = {
    'max_depth': 8,
    'learning_rate': 0.1,
    'n_estimators': 200,
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'scale_pos_weight': 49,  # For class imbalance
    'eval_metric': 'logloss'
}
```

**LightGBM:**
```python
lgb_params = {
    'max_depth': 8,
    'learning_rate': 0.1,
    'n_estimators': 200,
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'scale_pos_weight': 49,  # For class imbalance
    'metric': 'auc'
}
```

### Class Imbalance Handling

With ~2% failure rate, the pipeline implements:

1. **Scale Pos Weight:** `scale_pos_weight = 49` (98/2 ratio)
2. **Stratified Split:** Maintains class distribution in train/test
3. **Appropriate Metrics:** Uses ROC-AUC, F1, precision, recall (not accuracy)
4. **Optional SMOTE:** Can be enabled for more aggressive rebalancing

### Integration with Story 10 Dashboard

The trained models are loaded and served via the Model Performance Monitoring dashboard:

1. **Model Registry:** Latest trained models stored in `ml/models/`
2. **Feature Columns:** Loaded from `feature_columns_*.json`
3. **Metrics:** Displayed in dashboard from `training_metrics_*.json`
4. **Retraining:** Triggered by dashboard "Start Retraining" button
5. **MLflow Integration:** Models versioned and registered for tracking

### Next Steps

1. ✅ ML training infrastructure created (Python scripts + feature engineering)
2. ⬜ Run training pipeline: `python ml/scripts/train_models.py`
3. ⬜ Integrate trained models into FastAPI backend
4. ⬜ Create model serving endpoints for predictions
5. ⬜ Set up MLflow model registry
6. ⬜ Configure automated retraining schedule (weekly/on-drift)

### Documentation

See `ml/README.md` for:
- Detailed feature engineering explanations
- Usage examples and code samples
- Troubleshooting guide
- Hyperparameter tuning approach
- SHAP explainability setup
- MLflow integration guide

---

## Business Requirements

### Primary Requirements

1. **Production Model Accuracy Tracking**
   - **Requirement:** System must track prediction accuracy (ROC-AUC, precision, recall, F1) against actual failures in real-time
   - **Success Metrics:** 
     - Accuracy metrics updated within 24 hours of failure ground truth
     - Dashboard shows current model performance vs. baseline (training accuracy)
     - Regression detection if accuracy drops >5% from baseline

2. **Model Drift Detection**
   - **Requirement:** System must detect when model performance degrades due to data/concept drift
   - **Success Metrics:**
     - Drift alerts triggered when ROC-AUC drops below configured threshold (default: 80%, configurable)
     - Feature drift detected if feature distributions change >10% from training
     - Prediction drift flagged if prediction distribution significantly differs from training

3. **Automated Retraining Recommendations**
   - **Requirement:** System recommends retraining when drift threshold exceeded or new failure patterns emerge
   - **Success Metrics:**
     - Retraining recommendation issued within 1 hour of drift detection
     - Recommendation includes: reason, impact estimate, suggested timing
     - Retraining can be triggered manually or scheduled

4. **A/B Testing Framework**
   - **Requirement:** Support running multiple models in parallel to safely evaluate improvements
   - **Success Metrics:**
     - Canary deployments: new model tested on 10% of traffic
     - Side-by-side metrics: compare old vs. new model performance
     - Automatic rollback if new model underperforms (ROC-AUC drops >2%)
     - Decision reports on challenger model eligibility

5. **Stakeholder Alerts & Notifications**
   - **Requirement:** Notify relevant stakeholders when performance degrades or retraining needed
   - **Success Metrics:**
     - Email alerts sent to ML engineers within 15 minutes of drift detection
     - In-app notifications visible in maintenance manager dashboard (critical performance warnings)
     - Configurable alert thresholds per metric

---

## Technical Specifications

### Integration Points

#### Backend APIs (NestJS / FastAPI)
1. **Model Management Service**
   - `GET /api/models` - List all models with versions and status
   - `GET /api/models/{id}/metrics` - Get performance metrics for specific model
   - `POST /api/models/{id}/retrain` - Trigger retraining job
   - `PUT /api/models/{id}/promote` - Promote model to production

2. **Performance Metrics API**
   - `GET /api/metrics/accuracy` - Current accuracy metrics (ROC-AUC, precision, recall, F1)
   - `GET /api/metrics/drift` - Current drift indicators (feature drift, prediction drift)
   - `GET /api/metrics/confidence-intervals` - Confidence bands for metrics (95% CI)
   - `GET /api/metrics/historical` - Time-series performance data (supports date range filters)

3. **A/B Testing API**
   - `POST /api/experiments/start` - Launch new A/B test
   - `GET /api/experiments/{id}` - Get experiment status and results
   - `PUT /api/experiments/{id}/decide` - Promote winner or rollback
   - `PATCH /api/experiments/{id}/traffic-split` - Adjust traffic allocation (10%/90% → 50%/50%)

4. **Retraining Pipeline API**
   - `POST /api/retraining/jobs` - Submit new retraining job
   - `GET /api/retraining/jobs/{jobId}` - Get job status
   - `GET /api/retraining/jobs/{jobId}/logs` - Stream logs from training
   - `POST /api/retraining/jobs/{jobId}/validate` - Run validation on trained model
   - `POST /api/retraining/jobs/{jobId}/deploy` - Deploy to canary (10% traffic)

5. **Prediction Feedback API**
   - `POST /api/predictions/{predictionId}/feedback` - Log actual failure outcome
   - `PATCH /api/predictions/{predictionId}` - Update with ground truth (late-arriving feedback)

#### External Integrations
- **MLflow:** Model registry, versioning, metrics logging
- **Evidently AI:** Drift detection (data drift, model drift, target drift)
- **Prometheus:** Metrics collection and time-series storage
- **Grafana:** Monitoring dashboards and alerting rules
- **Sentry:** Error tracking for ML pipeline failures

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Production Environment                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Predictions (Real-time)                                        │
│  ├─ prediction_id, machine_id, failure_prob, predicted_at      │
│  └─ features_used (for drift tracking)                         │
│         ↓                                                        │
│  [TimescaleDB - Predictions Table]                             │
│  └─ Stores: 10k+ predictions/day                               │
│         ↓                                                        │
│  ┌───────────────────────────────────────────────────────┐     │
│  │ Daily Batch: Feedback Collection & Reconciliation     │     │
│  │ (Scheduled: 2 AM UTC / 24-48hr delay for ground truth)│     │
│  │ ├─ actual_failure (1/0)                               │     │
│  │ ├─ failure_mode (TWF/HDF/PWF/OSF/RNF)                 │     │
│  │ └─ feedback_timestamp                                 │     │
│  └───────────────────────────────────────────────────────┘     │
│         ↓                                                        │
│  ┌───────────────────────────────────────────────────────┐     │
│  │ Metrics Calculation Engine                            │     │
│  │ ├─ ROC-AUC (sliding window: last 1000 predictions)   │     │
│  │ ├─ Precision, Recall, F1, Accuracy                   │     │
│  │ ├─ Confidence Intervals (95% via bootstrap)          │     │
│  │ └─ Confusion Matrix (TP/FP/TN/FN)                    │     │
│  └───────────────────────────────────────────────────────┘     │
│         ↓                                                        │
│  ┌───────────────────────────────────────────────────────┐     │
│  │ Drift Detection (Evidently AI)                        │     │
│  │ ├─ Feature Drift (Kolmogorov-Smirnov test)            │     │
│  │ ├─ Prediction Drift (JS divergence)                   │     │
│  │ └─ Model Drift (Target drift via accuracy regression)│     │
│  └───────────────────────────────────────────────────────┘     │
│         ↓                                                        │
│  ┌───────────────────────────────────────────────────────┐     │
│  │ Trigger Logic                                         │     │
│  │ ├─ IF drift detected → ALERT & RECOMMEND_RETRAIN     │     │
│  │ ├─ IF accuracy < 80% → CRITICAL_ALERT                │     │
│  │ ├─ IF 30 days since retrain → SUGGEST_REFRESH        │     │
│  │ └─ IF A/B experiment running → COMPARE_METRICS       │     │
│  └───────────────────────────────────────────────────────┘     │
│         ↓                                                        │
│  ┌───────────────────────────────────────────────────────┐     │
│  │ Frontend Dashboard & Notifications                    │     │
│  │ ├─ Real-time metrics via WebSocket                    │     │
│  │ ├─ Email alerts to ML engineers                       │     │
│  │ └─ In-app notifications (maintenance managers)        │     │
│  └───────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌───────────────────────────────────────────────────────┐     │
│  │ Manual Retraining Trigger                             │     │
│  │ └─→ BigQuery/S3 (training data export)                │     │
│  │    → Python FastAPI (training service)                │     │
│  │    → MLflow (model registry)                          │     │
│  │    → Canary deployment (10% traffic)                  │     │
│  │    → Validation & approval workflow                   │     │
│  │    → Full deployment or rollback                      │     │
│  └───────────────────────────────────────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Security Requirements

- **Model Access Control:**
  - Only `ML_ENGINEER` and `ADMIN` roles can access model performance metrics
  - Model retraining restricted to `ML_ENGINEER` role
  - Audit log all model deployments and retraining jobs

- **Data Protection:**
  - Prediction features cached in Redis with 24-hour TTL (PII not exposed)
  - API endpoints require JWT auth (short-lived tokens)
  - Model artifacts encrypted at rest in MLflow

- **API Security:**
  - Rate limiting: 100 requests/minute per user on monitoring endpoints
  - Webhook verification for external monitoring system integrations
  - CORS policy restricted to internal services

---

## Design Specifications

### User Interface - Model Performance Dashboard

#### Layout Structure
```
┌──────────────────────────────────────────────────────────────┐
│  Header: "Model Performance Monitoring"                       │
│  [Model Selector] [Time Range] [Refresh] [Export]            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─ PRIMARY METRICS (Top Section) ─────────────────────┐   │
│  │                                                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │ ROC-AUC  │  │Precision │  │  Recall  │          │   │
│  │  │  0.85    │  │  0.82    │  │  0.88    │          │   │
│  │  │  ━━━━━   │  │  ━━━━━   │  │  ━━━━━   │          │   │
│  │  │ ▄▄▄▄▄    │  │ ▄▄▄▄▄    │  │ ▄▄▄▄▄    │          │   │
│  │  │ vs 0.87  │  │ vs 0.80  │  │ vs 0.90  │          │   │
│  │  │ (↓0.02)  │  │ (↑0.02)  │  │ (↓0.02)  │          │   │
│  │  └──────────┘  └──────────┘  └──────────┘          │   │
│  │                                                      │   │
│  │  Status: 🟢 HEALTHY                                 │   │
│  │  Last Updated: 2hr ago | Next Update: in 22hr      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─ DRIFT INDICATORS (Top-Right Section) ──────────────┐   │
│  │                                                     │   │
│  │  Feature Drift:      🟢 NORMAL                      │   │
│  │  Max drift score: 0.12 (Torque - KS stat: 0.15)    │   │
│  │                                                     │   │
│  │  Prediction Drift:   🟡 WARNING                     │   │
│  │  JS divergence: 0.22 (was 0.08 last week)         │   │
│  │                                                     │   │
│  │  Model Drift:        🟢 NORMAL                      │   │
│  │  Performance stable ✓                              │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─ PERFORMANCE TIME-SERIES ───────────────────────────┐   │
│  │                                                     │   │
│  │  ROC-AUC Over Time (Last 60 Days)                   │   │
│  │  0.90 ┤     ╱╲                    🟢 Current Model   │   │
│  │  0.85 ┤────╱  ╲──────────────     🔵 Baseline (0.87)│   │
│  │  0.80 ┤       ╱ ╲                                    │   │
│  │  0.75 ┤      ╱   ╲________                          │   │
│  │       └─────────────────────────────────            │   │
│  │       Day 1      Day 30      Day 60                  │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─ ACTIVE EXPERIMENTS (A/B Tests) ────────────────────┐   │
│  │                                                     │   │
│  │  Experiment: "XGBoost v2 vs LightGBM Candidate"    │   │
│  │  Status: RUNNING (Day 5 of 14)                     │   │
│  │                                                     │   │
│  │  Model A (Control):   XGBoost v5                    │   │
│  │  ├─ Traffic: 90%                                    │   │
│  │  ├─ ROC-AUC: 0.850 (1024 predictions feedback)      │   │
│  │  └─ Precision: 0.823                                │   │
│  │                                                     │   │
│  │  Model B (Challenger): LightGBM v3                  │   │
│  │  ├─ Traffic: 10%                                    │   │
│  │  ├─ ROC-AUC: 0.867 (+0.017) ← Promising            │   │
│  │  └─ Precision: 0.841 (+0.018)                       │   │
│  │  ⓘ Statistically significant? (p-value: 0.08)       │   │
│  │                                                     │   │
│  │  [Stop Experiment] [Increase Traffic to 50%]       │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─ RETRAINING HISTORY ────────────────────────────────┐   │
│  │                                                     │   │
│  │  Job ID | Status  | ROC-AUC | Triggered | Result   │   │
│  │  ──────┼─────────┼─────────┼───────────┼─────────  │   │
│  │  R-247 │ ✓ Done  │  0.862  │ 2 days    │ Deployed │   │
│  │  R-246 │ ✗ Failed│  N/A    │ 5 days    │ Rollback │   │
│  │  R-245 │ ✓ Done  │  0.847  │ 14 days   │ Deployed │   │
│  │                                                     │   │
│  │                          [Start New Retraining]    │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

#### Component Hierarchy

```
<ModelPerformanceLayout>
  <PageHeader>
    <ModelSelector />          # Dropdown to switch between models
    <TimeRangeSelector />      # Date range picker (7d/30d/90d/custom)
    <ActionButtons>
      <RefreshButton />        # Manual metrics refresh
      <ExportButton />         # Export metrics to CSV
      <SettingsButton />       # Configure thresholds
    </ActionButtons>
  </PageHeader>
  
  <MetricsGrid>
    <MetricCard model="baseline" />        # ROC-AUC
    <MetricCard model="precision" />       # Precision
    <MetricCard model="recall" />          # Recall
    <HealthStatusBadge />                  # 🟢/🟡/🔴
  </MetricsGrid>
  
  <DriftIndicatorsSection>
    <DriftGauge type="feature" />          # Feature distribution drift
    <DriftGauge type="prediction" />       # Prediction distribution drift
    <DriftGauge type="model" />            # Model performance drift
  </DriftIndicatorsSection>
  
  <PerformanceTimeSeriesChart>
    <LineChart metric="roc_auc" timeRange="60d" />
  </PerformanceTimeSeriesChart>
  
  <ActiveExperimentsSection>
    <ExperimentCard experiment={id} />     # For each running A/B test
    <ExperimentStats />
    <ExperimentControls />                 # Stop/adjust traffic/decide
  </ActiveExperimentsSection>
  
  <RetrainingHistoryTable>
    <Table 
      columns={['Job ID', 'Status', 'ROC-AUC', 'Triggered', 'Result']}
      data={retrainingJobs}
      pagination={true}
    />
    <StartRetrainingButton />
  </RetrainingHistoryTable>
  
  <RetrainingConfigurationModal>
    <Select name="trainingDataset" options={datasets} />
    <Select name="modelAlgorithm" options={['XGBoost', 'LightGBM']} />
    <Input name="testSplitRatio" value="0.2" />
    <Input name="maxIterations" value="1000" />
    <Checkbox name="useAutoMLTuning" />
    <Checkbox name="autoPromoteIfImprove" />
    <Button label="Start Retraining" />
  </RetrainingConfigurationModal>
</ModelPerformanceLayout>
```

### Design System Compliance

**Color Palette for Metrics:**
```css
/* Health Status Colors */
--healthy: #10b981;          /* bg-emerald-500 - 🟢 Model is healthy */
--warning: #f59e0b;          /* bg-amber-500 - 🟡 Drift detected, review recommended */
--critical: #ef4444;         /* bg-red-500 - 🔴 Performance degraded, action required */

/* Metric Trend Colors */
--improved: #10b981;         /* Green for improvements */
--degraded: #ef4444;         /* Red for decline */
--stable: #6366f1;           /* Indigo for stable */

/* Chart Colors */
--metric-primary: #0ea5e9;   /* Current model line */
--metric-baseline: #94a3b8;  /* Baseline/reference line */
--metric-confidence-band: rgba(14, 165, 233, 0.1); /* 95% CI shading */
```

**Typography:**
```css
--text-heading: 'Merriweather', serif;     /* "Model Performance Monitoring" */
--text-body: 'Inter', sans-serif;          /* Metric descriptions */
--text-mono: 'JetBrains Mono', monospace;  /* ROC-AUC scores, job IDs */
```

### Responsive Behavior

**Desktop (1024px+):**
- 4-column metric card layout
- Full time-series chart visible
- Side-by-side drift indicators
- Experiments section below charts

**Tablet (768px - 1023px):**
- 2-column metric card layout
- Stacked drift indicators
- Full-width time-series
- Experiments collapsed/accordion

**Mobile (< 768px):**
- 1-column layout (stacked)
- Simplified metric cards (only current value)
- Charts in horizontal scroll containers
- Experiments as expandable sections

---

## Technical Architecture

### Component Structure

```typescript
src/app/(dashboard)/models/
├── page.tsx                                # Performance monitoring entry point
├── layout.tsx                              # Model dashboard layout
├── loading.tsx                             # Loading skeleton UI
├── error.tsx                               # Error boundary & recovery
│
├── components/
│   ├── ModelPerformanceLayout.tsx          # Main container
│   ├── MetricsGrid.tsx                     # Metric cards (ROC-AUC, precision, recall)
│   ├── MetricCard.tsx                      # Individual metric display card
│   ├── HealthStatusBadge.tsx               # 🟢/🟡/🔴 status indicator
│   │
│   ├── DriftIndicatorsSection.tsx          # Feature/prediction/model drift section
│   ├── DriftGauge.tsx                      # Drift visualization gauge
│   │
│   ├── PerformanceTimeSeriesChart.tsx      # ROC-AUC line chart (Recharts)
│   ├── ConfidenceIntervalBand.tsx          # 95% CI shading on charts
│   │
│   ├── ActiveExperimentsSection.tsx        # A/B testing experiments display
│   ├── ExperimentCard.tsx                  # Single experiment card
│   ├── ExperimentMetricsComparison.tsx     # Control vs Challenger comparison
│   ├── ExperimentControls.tsx              # Stop/adjust/decide controls
│   ├── TrafficAllocationSlider.tsx         # 10%/90% ↔ 50%/50% adjustment
│   │
│   ├── RetrainingHistoryTable.tsx          # Retraining job history
│   ├── RetrainingJobRow.tsx                # Single job row
│   ├── StartRetrainingButton.tsx           # Trigger modal
│   ├── RetrainingConfigurationModal.tsx    # Form to start retraining
│   ├── RetrainingStepsWizard.tsx           # Multi-step retraining workflow
│   │
│   ├── ModelSelector.tsx                   # Dropdown to pick model version
│   ├── TimeRangeSelector.tsx               # Date range picker
│   ├── DashboardActionBar.tsx              # Refresh/Export/Settings
│   │
│   ├── hooks/
│   │   ├── useModelPerformance.ts          # Fetch current metrics
│   │   ├── useModelHistory.ts              # Fetch historical performance
│   │   ├── useDriftDetection.ts            # Get drift indicators
│   │   ├── useActiveExperiments.ts         # Fetch A/B tests
│   │   ├── useRetrainingJobs.ts            # Fetch job history
│   │   ├── useMetricsSubscription.ts       # WebSocket real-time updates
│   │   └── useRetrainingActions.ts         # Submit retraining jobs
│   │
│   └── utils/
│       ├── formatters.ts                   # Format 0.85 → "85%", ROC-AUC labels
│       ├── colorUtils.ts                   # Map metric value → color
│       └── chartHelpers.ts                 # Prepare data for Recharts
│
├── types/
│   └── models.types.ts
│
└── api/
    └── models-api.ts                       # API client for models endpoints
```

### Custom React Hooks

#### `useModelPerformance.ts`
```typescript
interface UseModelPerformanceReturn {
  metrics: {
    rocAuc: number;
    precision: number;
    recall: number;
    f1Score: number;
    accuracy: number;
    confidenceInterval: { lower: number; upper: number };
    confusionMatrix: {
      truePositives: number;
      falsePositives: number;
      trueNegatives: number;
      falseNegatives: number;
    };
  };
  baseline: { rocAuc: number; lastUpdated: Date };
  comparison: { rocAuc: number; precision: number; recall: number }; // vs baseline
  status: 'healthy' | 'warning' | 'critical';
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

function useModelPerformance(
  modelId: string,
  modelVersion?: string
): UseModelPerformanceReturn
```

#### `useDriftDetection.ts`
```typescript
interface DriftMetrics {
  featureDrift: {
    enabled: boolean;
    detectedDrifts: Array<{
      featureName: string;
      driftScore: number;      // 0-1, >0.15 is significant
      statisticalTest: 'KolmogorovSmirnov' | 'ChiSquare';
      pValue: number;
      threshold: number;
    }>;
    overallStatus: 'normal' | 'warning' | 'alert';
  };
  predictionDrift: {
    enabled: boolean;
    jsDivergence: number;      // JS divergence vs training distribution
    predictionDistribution: { bins: Array<{ range: string; count: number }> };
    threshold: number;
    status: 'normal' | 'warning' | 'alert';
  };
  modelDrift: {
    rocAucTrend: 'stable' | 'improving' | 'degrading';
    accuracyChange: number;    // percentage points
    daysUntilRetraining: number;
    status: 'normal' | 'warning' | 'alert';
  };
}

function useDriftDetection(
  modelId: string,
  windowDays?: number
): DriftMetrics & { isLoading: boolean; error?: Error }
```

#### `useActiveExperiments.ts`
```typescript
interface Experiment {
  experimentId: string;
  name: string;
  status: 'running' | 'completed' | 'failed';
  startDate: Date;
  endDate?: Date;
  
  controlModel: {
    modelId: string;
    modelName: string;
    trafficPercentage: number;
    metrics: { rocAuc: number; precision: number; recall: number };
    sampleSize: number;
  };
  
  challengerModel: {
    modelId: string;
    modelName: string;
    trafficPercentage: number;
    metrics: { rocAuc: number; precision: number; recall: number };
    sampleSize: number;
    improvement: { rocAuc: number; precision: number; recall: number };
  };
  
  statisticalTest: {
    testName: string;
    pValue: number;
    isSignificant: boolean;
    powerAnalysis: { power: number; sampleSizeRequired: number };
  };
  
  recommendation: 'promote' | 'continue' | 'stop' | 'inconclusive';
}

function useActiveExperiments(
  includePast?: boolean
): { experiments: Experiment[]; isLoading: boolean; error?: Error }
```

#### `useRetrainingJobs.ts`
```typescript
interface RetrainingJob {
  jobId: string;
  status: 'queued' | 'training' | 'validating' | 'deployed' | 'failed' | 'rolled_back';
  
  triggeredBy: {
    reason: 'drift_detected' | 'manual_request' | 'scheduled' | 'accuracy_degradation';
    triggeredAt: Date;
    triggeredBy: string; // user email
  };
  
  training: {
    datasetSize: number;
    trainingDuration: number;      // milliseconds
    validationMetrics: {
      rocAuc: number;
      precision: number;
      recall: number;
      improvementOverCurrent: number;
    };
  };
  
  deployment?: {
    canaryTrafficPercentage: number;
    canaryDuration: number;        // hours
    canaryMetrics?: { rocAuc: number };
    fullDeploymentDate?: Date;
  };
  
  logs: string;                    // Training logs (last 1000 lines)
}

function useRetrainingJobs(
  modelId: string,
  limit?: number
): { jobs: RetrainingJob[]; isLoading: boolean; error?: Error }
```

#### `useMetricsSubscription.ts`
```typescript
// WebSocket-based real-time metrics updates
function useMetricsSubscription(
  modelId: string,
  onMetricsUpdate: (metrics: ModelMetrics) => void
): { isConnected: boolean; lastUpdate: Date }
```

### State Management

**Global App State (Zustand/Context):**
```typescript
interface ModelPerformanceStore {
  // Selected Model Context
  selectedModelId: string;
  selectedTimeRange: 'week' | 'month' | 'quarter' | 'year' | 'custom';
  
  // Cached Data
  metricsCache: Map<string, ModelMetrics>;
  driftCache: Map<string, DriftMetrics>;
  experimentsCache: Experiment[];
  
  // UI State
  isLoadingMetrics: boolean;
  showRetrainingModal: boolean;
  selectedExperimentId?: string;
  
  // Actions
  setSelectedModel: (modelId: string) => void;
  setTimeRange: (range: TimeRange) => void;
  fetchMetricsIfNeeded: (modelId: string) => Promise<void>;
  openRetrainingModal: () => void;
  closeRetrainingModal: () => void;
}
```

**Component-Level State:**
```typescript
// Local state for charts, forms, modals
const [metricsData, setMetricsData] = useState<ModelMetrics | null>(null);
const [driftAlerts, setDriftAlerts] = useState<DriftMetrics | null>(null);
const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(null);
const [formState, setFormState] = useState<RetrainingFormData>({
  algorithm: 'xgboost',
  trainingDatasetSize: 100000,
  testSplitRatio: 0.2,
  useAutoML: true,
});
```

---

## API Integration Schema

### Request/Response Schemas

#### Get Current Model Performance Metrics

**Request:**
```typescript
GET /api/models/{modelId}/metrics?timeRange=30d

interface MetricsQuery {
  modelId: string;        // Required
  timeRange?: '7d' | '30d' | '90d' | 'custom';
  startDate?: Date;       // Required if timeRange='custom'
  endDate?: Date;         // Required if timeRange='custom'
}
```

**Response:**
```typescript
interface MetricsResponse {
  success: boolean;
  data?: {
    modelId: string;
    modelVersion: string;
    generatedAt: Date;
    
    currentMetrics: {
      rocAuc: number;
      precision: number;
      recall: number;
      f1Score: number;
      accuracy: number;
      
      confidenceIntervals: {
        rocAuc: { lower: number; upper: number; method: 'bootstrap' };
        precision: { lower: number; upper: number; method: 'wilson' };
      };
      
      confusionMatrix: {
        truePositives: number;
        falsePositives: number;
        falseNegatives: number;
        trueNegatives: number;
      };
      
      sampleSize: number;
      predictionsFeedback: number;  // How many predictions got ground truth
    };
    
    baselineMetrics: {
      rocAuc: number;
      precision: number;
      recall: number;
      recordedAt: Date;  // Training date
    };
    
    comparison: {
      rocAucChange: number;           // e.g., -0.02 (degraded by 2%)
      rocAucChangePercent: number;    // e.g., -2.3%
      direction: 'improvement' | 'degradation' | 'stable';
      daysSinceDegradation?: number;  // If degrading
    };
    
    timeSeriesData: Array<{
      date: Date;
      rocAuc: number;
      precision: number;
      recall: number;
      sampleSize: number;
    }>;
  };
  error?: {
    code: string;
    message: string;
  };
}
```

#### Get Drift Indicators

**Request:**
```typescript
GET /api/models/{modelId}/drift

interface DriftQuery {
  modelId: string;
  windowDays?: number;  // Default: 30
}
```

**Response:**
```typescript
interface DriftResponse {
  success: boolean;
  data?: {
    featureDrift: {
      overall: number;                      // 0-1 score
      detected: Array<{
        featureName: string;
        driftScore: number;
        statisticalTest: 'KolmogorovSmirnov' | 'ChiSquare';
        pValue: number;
        trainingBaseline: { mean: number; std: number };
        productionCurrent: { mean: number; std: number };
        magnitude: 'low' | 'medium' | 'high';
      }>;
      threshold: number;                    // Alert if > this
      status: 'normal' | 'warning' | 'alert';
    };
    
    predictionDrift: {
      jsDivergence: number;
      kolmogorovSmirnovStatistic: number;
      predictionDistribution: {
        trainingMean: number;
        productionMean: number;
        trainingStd: number;
        productionStd: number;
        histogramBins: Array<{
          range: string;
          trainingCount: number;
          productionCount: number;
        }>;
      };
      threshold: number;
      status: 'normal' | 'warning' | 'alert';
    };
    
    modelDrift: {
      accuracyTrend: Array<{ date: Date; accuracy: number }>;
      rocAucTrend: Array<{ date: Date; rocAuc: number }>;
      status: 'stable' | 'improving' | 'degrading';
      daysUntilAlertIfDegrading: number;
      recommendation: 'monitor' | 'retrain_soon' | 'retrain_urgent';
    };
    
    aggregatedStatus: 'healthy' | 'warning' | 'critical';
    summaryAlert?: string;
  };
  error?: { code: string; message: string };
}
```

#### Start A/B Experiment

**Request:**
```typescript
POST /api/experiments/start

interface StartExperimentRequest {
  name: string;
  controlModelId: string;
  challengerModelId: string;
  trafficSplitControl: number;        // 0-100, e.g., 90
  trafficSplitChallenger: number;     // 0-100, e.g., 10
  expectedDurationDays: number;       // e.g., 14
  successCriteria: {
    minImprovement: number;           // e.g., 0.02 (2% ROC-AUC improvement)
    requiredSignificance: number;      // p-value threshold, e.g., 0.05
    minSampleSize: number;            // e.g., 1000
  };
}
```

**Response:**
```typescript
interface ExperimentResponse {
  success: boolean;
  data?: {
    experimentId: string;
    status: 'running';
    startedAt: Date;
    estimatedEndDate: Date;
    trafficAllocation: {
      control: number;
      challenger: number;
    };
  };
  error?: { code: string; message: string };
}
```

#### Decide on Experiment

**Request:**
```typescript
PUT /api/experiments/{experimentId}/decide

interface DecideExperimentRequest {
  decision: 'promote_challenger' | 'keep_control' | 'inconclusive';
  reason: string;
  deployImmediately: boolean;
}
```

**Response:**
```typescript
interface DecideResponse {
  success: boolean;
  data?: {
    experimentId: string;
    decision: string;
    promotedModelId?: string;
    deploymentStartedAt?: Date;
  };
  error?: { code: string; message: string };
}
```

#### Submit Retraining Job

**Request:**
```typescript
POST /api/retraining/jobs

interface RetrainingJobRequest {
  modelId: string;
  triggerReason: 'manual' | 'drift_detected' | 'scheduled' | 'accuracy_degradation';
  trainingConfig: {
    datasetName: string;              // e.g., "production_20260101-20260208"
    algorithm: 'xgboost' | 'lightgbm';
    hyperparameters: {
      maxDepth?: number;
      learningRate?: number;
      numEstimators?: number;
      scalePosWeight?: number;        // For class imbalance
    };
    trainingDurationLimit?: number;   // minutes
    useFeatureSelection?: boolean;
  };
  validationConfig: {
    testSizeRatio: number;            // 0.2 default
    crossValidationFolds?: number;    // 5 default
    performanceMustImproveBy?: number;  // e.g., 0.01 for 1% improvement
  };
  deploymentConfig: {
    deploymentType: 'canary' | 'shadow';
    canaryTrafficPercentage?: number;  // 10 default
    canaryDurationHours?: number;      // 24 default
    autoPromoteIfBetter?: boolean;     // false default
  };
}
```

**Response:**
```typescript
interface RetrainingJobResponse {
  success: boolean;
  data?: {
    jobId: string;
    status: 'queued';
    queuePosition: number;
    estimatedStartTime: Date;
    estimatedDuration: number;          // minutes
  };
  error?: { code: string; message: string };
}
```

#### Get Retraining Job Status

**Request:**
```typescript
GET /api/retraining/jobs/{jobId}?includeLogs=true

interface JobStatusQuery {
  jobId: string;
  includeLogs?: boolean;
  logLines?: number;  // Default: 100
}
```

**Response:**
```typescript
interface JobStatusResponse {
  success: boolean;
  data?: {
    jobId: string;
    status: 'queued' | 'training' | 'validating' | 'deployed' | 'failed' | 'rolled_back';
    progress: {
      currentStep: string;
      percentComplete: number;
      estimatedTimeRemaining: number;  // seconds
    };
    
    training?: {
      startedAt: Date;
      completedAt?: Date;
      datasetSize: number;
      durationSeconds: number;
      featureCount: number;
      hyperparametersUsed: Record<string, any>;
    };
    
    validation?: {
      rocAuc: number;
      precision: number;
      recall: number;
      f1Score: number;
      improvementOverCurrent: number;  // e.g., 0.018 = 1.8% better
      validationPassed: boolean;
      failureReason?: string;
    };
    
    deployment?: {
      canaryLiveAt?: Date;
      canaryMetrics?: { rocAuc: number; precision: number };
      canaryPassedValidation?: boolean;
      fullyDeployedAt?: Date;
      rollbackAt?: Date;
      rollbackReason?: string;
    };
    
    logs?: string;  // Last N lines of training output
    
    artifacts: {
      modelPath: string;
      metricsFilePath: string;
      featureImportancePath: string;
    };
  };
  error?: { code: string; message: string };
}
```

#### Log Prediction Feedback

**Request:**
```typescript
POST /api/predictions/{predictionId}/feedback

interface FeedbackRequest {
  predictionId: string;
  actualFailure: 0 | 1;                    // Ground truth
  failureMode?: 'TWF' | 'HDF' | 'PWF' | 'OSF' | 'RNF';
  feedbackTimestamp: Date;
  notes?: string;
}
```

**Response:**
```typescript
interface FeedbackResponse {
  success: boolean;
  data?: {
    predictionId: string;
    feedbackRecorded: Date;
    metricsUpdated: boolean;
  };
  error?: { code: string; message: string };
}
```

---

## Implementation Requirements

### Core Components to Build

1. **ModelPerformanceLayout.tsx** (600 lines)
   - Main container managing page state
   - Integrates all sub-components
   - Handles metric refreshes and WebSocket subscriptions

2. **MetricsGrid.tsx** (300 lines)
   - 4 metric cards (ROC-AUC, Precision, Recall, F1)
   - Displays current vs. baseline values
   - Shows trending arrow (↑/↓/→) and percentage change

3. **DriftIndicatorsSection.tsx** (250 lines)
   - Feature drift gauge (visual % circle)
   - Prediction drift gauge
   - Model drift indicator
   - Links to detailed drift analysis

4. **PerformanceTimeSeriesChart.tsx** (400 lines)
   - Recharts line chart (60+ days history)
   - Multiple metrics selectable (ROC-AUC, precision, recall)
   - Confidence interval shading (95% CI)
   - Date range picker integration

5. **ActiveExperimentsSection.tsx** (350 lines)
   - List of running A/B tests
   - Control vs. Challenger metrics comparison
   - Traffic allocation visualization
   - Decision controls (Stop/Increase Traffic/Decide)

6. **ExperimentCard.tsx** (250 lines)
   - Single experiment display
   - Statistical significance indicator
   - Progress bar (days elapsed / total duration)
   - Inline controls

7. **RetrainingHistoryTable.tsx** (300 lines)
   - Data table of past retraining jobs
   - Columns: Job ID, Status, ROC-AUC, Triggered, Result
   - Pagination (20 jobs per page)
   - Job detail view (modal)

8. **RetrainingConfigurationModal.tsx** (400 lines)
   - Form to configure retraining job
   - Algorithm selection (XGBoost/LightGBM)
   - Hyperparameter inputs
   - Validation criteria checkboxes
   - Submit & cancel buttons

9. **ModelSelector.tsx** (150 lines)
   - Dropdown to select model version
   - Displays version, training date, ROC-AUC
   - Filters out deprecated models

10. **TimeRangeSelector.tsx** (200 lines)
    - Preset buttons (7d/30d/90d)
    - Custom date range picker
    - Applies to all charts/metrics

### Custom Hooks to Implement

1. **useModelPerformance.ts** (200 lines)
   - Fetches current metrics via API
   - Caches results (5-min TTL)
   - Formats numbers (0.85 → "85%")

2. **useModelHistory.ts** (200 lines)
   - Fetches time-series performance data
   - Caches historical data
   - Handles date range filtering

3. **useDriftDetection.ts** (250 lines)
   - Fetches drift indicators
   - Evaluates status (healthy/warning/critical)
   - Determine alert messaging

4. **useActiveExperiments.ts** (200 lines)
   - Fetches running A/B tests
   - Calculates statistical significance
   - Determines recommendation (promote/continue/stop)

5. **useRetrainingJobs.ts** (200 lines)
   - Fetches retraining job history
   - Polls job status (for running jobs)
   - Handles pagination

6. **useMetricsSubscription.ts** (250 lines)
   - WebSocket connection to real-time metrics
   - Auto-reconnect on disconnect
   - Calls callback with updated metrics

7. **useRetrainingActions.ts** (300 lines)
   - Submit retraining job
   - Poll job status
   - Handle deployment stages (canary → full)
   - Trigger rollback if needed

### Utility Functions

1. **formatters.ts** (150 lines)
   ```typescript
   formatRocAuc(value: number): string;
   formatPrecision(value: number): string;
   formatDriftScore(value: number): string;
   formatDate(date: Date, format: string): string;
   ```

2. **colorUtils.ts** (100 lines)
   ```typescript
   getMetricStatusColor(value: number, baseline: number): string;
   getDriftStatusColor(status: string): string;
   getChartLineColor(metric: string): string;
   ```

3. **chartHelpers.ts** (200 lines)
   ```typescript
   prepareTimeSeriesData(metrics: ModelMetrics[]): ChartData;
   calculateConfidenceIntervals(data: number[]): { lower: number; upper: number };
   formatChartTooltip(payload: any): string;
   ```

4. **validators.ts** (150 lines)
   ```typescript
   validateRetrainingConfig(config: RetrainingJobRequest): ValidationResult;
   validateExperimentConfig(config: StartExperimentRequest): ValidationResult;
   ```

5. **errorHandlers.ts** (150 lines)
   ```typescript
   handleMetricsError(error: Error): UserMessage;
   handleRetrainingError(error: Error): UserMessage;
   ```

### API Client

**models-api.ts** (400 lines)
```typescript
class ModelMetricsClient {
  getMetrics(modelId: string, timeRange?: string): Promise<MetricsResponse>;
  getDrift(modelId: string): Promise<DriftResponse>;
  getExperiments(includePast?: boolean): Promise<ExperimentResponse>;
  startExperiment(request: StartExperimentRequest): Promise<ExperimentResponse>;
  decideExperiment(experimentId: string, decision: DecideExperimentRequest): Promise<void>;
  startRetrainingJob(request: RetrainingJobRequest): Promise<RetrainingJobResponse>;
  getRetrainingJobStatus(jobId: string, includeLogs?: boolean): Promise<JobStatusResponse>;
  logPredictionFeedback(feedback: FeedbackRequest): Promise<void>;
}
```

---

## Acceptance Criteria

### Functional Requirements

#### 1. Current Model Performance Display
- ✅ Display ROC-AUC, Precision, Recall, F1 Score for active model
- ✅ Show current metrics vs. baseline (training metrics)
- ✅ Display trending indicator (↑/↓/→) with % change
- ✅ Update metrics automatically when feedback arrives (within 24 hours)
- ✅ Confidence intervals shown for each metric (95% CI)

#### 2. Drift Detection & Alerts
- ✅ Feature drift detected (KS test, threshold: 0.15)
- ✅ Prediction drift flagged (JS divergence > 0.20)
- ✅ Model drift identified (accuracy regression)
- ✅ Visual status indicator (🟢/🟡/🔴)
- ✅ Detailed drift report with affected features
- ✅ Email alerts sent within 15 minutes of critical drift
- ✅ In-app notifications for maintenance managers

#### 3. Retraining Functionality
- ✅ UI form to configure retraining (algorithm, hyperparameters, data range)
- ✅ Submit retraining job with validation
- ✅ Display job status in real-time (queued → training → validating → deployed)
- ✅ Stream training logs to frontend (last 100 lines, auto-refresh)
- ✅ Show validation metrics upon completion
- ✅ Canary deployment (10% traffic) before full rollout
- ✅ Automatic or manual decision to promote/rollback

#### 4. A/B Testing Framework
- ✅ Create new experiment (control vs. challenger model)
- ✅ Allocate traffic split (90/10 or custom)
- ✅ Monitor experiment progress (days elapsed, sample size)
- ✅ Compare metrics side-by-side (ROC-AUC, precision, recall)
- ✅ Statistical significance test (p-value, power analysis)
- ✅ Recommendation engine (promote/continue/stop)
- ✅ Adjust traffic allocation mid-experiment
- ✅ Decide on winner or inconclusive result

#### 5. Retraining History & Audit
- ✅ Display all past retraining jobs (status, date, ROC-AUC achieved)
- ✅ Click to view detailed logs and artifacts
- ✅ Track who triggered retraining and why
- ✅ Export retraining history to CSV

#### 6. User Experience
- ✅ All pages load < 2 seconds (with cached data)
- ✅ Metric refresh with single click
- ✅ Real-time updates via WebSocket (no page refresh needed)
- ✅ Responsive design (desktop, tablet, mobile)
- ✅ Keyboard navigation support (WCAG 2.1 AA)
- ✅ Error states with helpful messages and retry buttons
- ✅ Loading skeletons during data fetches

### Non-Functional Requirements

#### Performance
- Initial page load: < 2 seconds (with cached metrics)
- Metric refresh: < 500ms
- Chart rendering: < 1 second for 60-day time series
- WebSocket update latency: < 1 second
- Bundle size contribution: < 150KB (gzipped)

#### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation on all UI elements
- Screen reader support (ARIA labels)
- Color contrast > 4.5:1 on all text
- No auto-playing animations/videos

#### Security
- JWT authentication required for all endpoints
- Rate limiting: 100 requests/minute per user
- Role-based access control (ML_ENGINEER, ADMIN)
- Audit logging for model deployments
- No sensitive model data exposed to frontend

#### Reliability
- Error boundaries catch component errors gracefully
- Failed metric fetches show error message + retry button
- WebSocket auto-reconnects on disconnect
- Retraining job status polled every 5 seconds
- Job history persists even if frontend crashes

---

## Modified Files

### New Files to Create

```
src/app/(dashboard)/models/
├── page.tsx ⬜
├── layout.tsx ⬜
├── loading.tsx ⬜
├── error.tsx ⬜
│
├── components/
│   ├── ModelPerformanceLayout.tsx ⬜
│   ├── MetricsGrid.tsx ⬜
│   ├── MetricCard.tsx ⬜
│   ├── HealthStatusBadge.tsx ⬜
│   ├── DriftIndicatorsSection.tsx ⬜
│   ├── DriftGauge.tsx ⬜
│   ├── PerformanceTimeSeriesChart.tsx ⬜
│   ├── ConfidenceIntervalBand.tsx ⬜
│   ├── ActiveExperimentsSection.tsx ⬜
│   ├── ExperimentCard.tsx ⬜
│   ├── ExperimentMetricsComparison.tsx ⬜
│   ├── ExperimentControls.tsx ⬜
│   ├── TrafficAllocationSlider.tsx ⬜
│   ├── RetrainingHistoryTable.tsx ⬜
│   ├── RetrainingJobRow.tsx ⬜
│   ├── StartRetrainingButton.tsx ⬜
│   ├── RetrainingConfigurationModal.tsx ⬜
│   ├── RetrainingStepsWizard.tsx ⬜
│   ├── ModelSelector.tsx ⬜
│   ├── TimeRangeSelector.tsx ⬜
│   ├── DashboardActionBar.tsx ⬜
│   │
│   ├── hooks/
│   │   ├── useModelPerformance.ts ⬜
│   │   ├── useModelHistory.ts ⬜
│   │   ├── useDriftDetection.ts ⬜
│   │   ├── useActiveExperiments.ts ⬜
│   │   ├── useRetrainingJobs.ts ⬜
│   │   ├── useMetricsSubscription.ts ⬜
│   │   └── useRetrainingActions.ts ⬜
│   │
│   └── utils/
│       ├── formatters.ts ⬜
│       ├── colorUtils.ts ⬜
│       └── chartHelpers.ts ⬜
│
├── types/
│   └── models.types.ts ⬜
│
└── api/
    └── models-api.ts ⬜
```

### Existing Files to Modify

```
src/
├── app/
│   └── layout.tsx (+ navigation link to /models route)
│
├── types/
│   └── index.ts (+ export new model types)
│
├── lib/
│   ├── api/
│   │   └── client.ts (+ model metrics endpoints)
│   │
│   └── auth/
│       └── rbac.ts (+ ML_ENGINEER role check)
│
├── hooks/
│   └── useAuth.ts (verify ML_ENGINEER role access)
│
├── services/
│   └── api-service.ts (+ model metrics service methods)
│
├── constants/
│   └── api-endpoints.ts (+ model metrics endpoints)
│
└── styles/
    └── globals.css (+ custom CSS for drift gauges)
```

---

## Implementation Status

### OVERALL STATUS: ⬜ NOT STARTED

### Phase 1: Foundation & Setup (Week 1-2)
- ⬜ Define TypeScript interfaces (story10.types.ts)
- ⬜ Create API client wrapper (models-api.ts)
- ⬜ Set up routing and layout pages
- ⬜ Configure WebSocket connection for real-time updates
- ⬜ Create mock data for development (fixtures)

### Phase 2: Core Implementation (Week 2-4)
- ⬜ Build metric cards (MetricCard.tsx, MetricsGrid.tsx)
- ⬜ Implement drift indicators (DriftGauge.tsx, DriftIndicatorsSection.tsx)
- ⬜ Create time-series chart (PerformanceTimeSeriesChart.tsx)
- ⬜ Build retraining job submission form
- ⬜ Implement experiment UI (ActiveExperimentsSection.tsx)
- ⬜ Create retraining history table

### Phase 3: Hooks & Data Fetching (Week 3-4)
- ⬜ Implement useModelPerformance hook
- ⬜ Implement useDriftDetection hook
- ⬜ Implement useActiveExperiments hook
- ⬜ Implement useRetrainingJobs hook
- ⬜ Implement useMetricsSubscription hook (WebSocket)
- ⬜ Implement useRetrainingActions hook

### Phase 4: Polish & Testing (Week 4-5)
- ⬜ Add error boundaries and error states
- ⬜ Implement responsive design (mobile/tablet)
- ⬜ Accessibility review (WCAG 2.1 AA)
- ⬜ Performance optimization (code splitting, memoization)
- ⬜ Unit tests (40+ test cases)
- ⬜ Integration tests (E2E job submission flow)
- ⬜ Documentation (Storybook stories)

---

## Dependencies

### Internal Dependencies (Must Be Complete First)
1. ✅ Database: Predictions table with schema (prediction_id, machine_id, predicted_at, predicted_failure_prob, features_used)
2. ✅ Database: Feedback table with ground truth labels (actual_failure, failure_mode, recorded_at)
3. ✅ Authentication: Supabase Auth configured with ML_ENGINEER role
4. ✅ Dashboard infrastructure: Layout components and navigation
5. ✅ API service layer: Base client for backend communication

### External Dependencies
1. **MLflow:** Model registry and metrics logging
   - Dependency: `mlflow` (Python backend)
   - API endpoint: `/api/models` (NestJS wrapper)
   - Version: >= 2.0

2. **Evidently AI:** Drift detection library
   - Dependency: `evidently` (Python FastAPI service)
   - API endpoint: `/api/models/{id}/drift`
   - Version: >= 0.3.0

3. **Prometheus:** Metrics collection
   - Deployment: Cloud monitoring infrastructure
   - Exposed metrics: Model accuracy, precision, recall, drift scores

4. **Grafana:** Monitoring dashboards
   - Setup: Alerting rules for model degradation
   - Webhook: Send alerts to backend notification service

5. **Python FastAPI:** Retraining service
   - Endpoint: `POST /retrain` (accepts job config)
   - Output: Trained model artifacts to MLflow
   - Integration: GitHub Actions workflow triggers job

6. **NPM Dependencies:**
   ```json
   {
     "recharts": "^2.10.0",           // Charts
     "lucide-react": "^0.263.0",      // Icons
     "zustand": "^4.4.0",             // State management (optional)
     "swr": "^2.2.0",                 // Data fetching
     "ws": "^8.14.0"                  // WebSocket client
   }
   ```

---

## Risk Assessment

### Technical Risks

#### 1. Model Inference Latency Impact
- **Risk:** Collecting predictions data + feedback reconciliation adds latency
- **Impact:** High - Affects real-time prediction freshness
- **Probability:** Medium
- **Mitigation:**
  - Batch feedback collection (daily, not real-time)
  - Cache predictions in Redis
  - Asynchronous metrics calculation
- **Contingency:** Use synthetic data for metrics demo if collection delayed

#### 2. Drift Detection False Positives
- **Risk:** High false alarm rate causes alert fatigue
- **Impact:** Medium - Reduces trust in ML system
- **Probability:** Medium
- **Mitigation:**
  - Tune threshold parameters for production data
  - Implement statistical significance testing (p-value)
  - Combine multiple drift indicators before alerting
- **Contingency:** Add manual drift dismissal/snooze feature

#### 3. Retraining Pipeline Failures
- **Risk:** Training job crashes, incomplete validation, deployment failure
- **Impact:** High - Incorrect models deployed = bad predictions
- **Probability:** Low (well-tested ML pipeline assumed)
- **Mitigation:**
  - Comprehensive validation before deployment (hold-out test set)
  - Canary deployment (10% traffic) allows rollback
  - Model regression detection (ROC-AUC < baseline)
- **Contingency:** Automated rollback to previous version

#### 4. A/B Testing Statistical Errors
- **Risk:** Insufficient sample size, underpowered test, wrong metric
- **Impact:** Medium - Incorrect model promotion
- **Probability:** Low
- **Mitigation:**
  - Power analysis recommends minimum sample size
  - p-value threshold set to 0.05 (5% false positive rate)
  - Multi-metric evaluation (ROC-AUC AND precision AND recall)
- **Contingency:** Manual review before final promotion decision

#### 5. WebSocket Connection Issues
- **Risk:** Real-time data not updating, stale metrics displayed
- **Impact:** Low (metrics cache available)
- **Probability:** Low
- **Mitigation:**
  - Auto-reconnect with exponential backoff
  - Fallback to polling if WebSocket fails
  - Display "Last Updated" timestamp so user knows freshness
- **Contingency:** Manual refresh button

### Business Risks

#### 1. Lack of ML Expertise on Team
- **Risk:** Misinterpret drift alerts, make poor retraining decisions
- **Impact:** Medium - Poor model quality
- **Probability:** Medium
- **Mitigation:**
  - Provide ML Ops runbook with decision guidance
  - Automated recommendations (promote/retrain/monitor)
  - Integration with external ML consultant for validation
- **Contingency:** Delay critical decisions until expert review

#### 2. Delayed Ground Truth Feedback
- **Risk:** Actual failure data arrives weeks later, metrics lag
- **Impact:** Medium - Model performance assessment delayed
- **Probability:** High (normal in maintenance scenarios)
- **Mitigation:**
  - Accept 24-48 hour feedback delay as baseline
  - Use early indicators (maintenance records) if available
  - Show confidence bands reflecting feedback recency
- **Contingency:** Use surrogate metrics (maintenance completion, technician notes)

#### 3. Model Performance Plateau
- **Risk:** Retraining doesn't improve metrics (data quality issue, diminishing returns)
- **Impact:** Medium - Resources wasted on retraining
- **Probability:** Medium
- **Mitigation:**
  - Investigate feature engineering opportunities
  - Check for data quality issues (label noise, missing values)
  - Consider ensemble methods
- **Contingency:** Stop retraining, focus on data collection improvements

---

## Testing Strategy

### Unit Tests (Jest)

**Components:**
```typescript
// MetricCard.test.tsx (50 lines)
describe('MetricCard', () => {
  it('should display metric value with correct precision', () => {});
  it('should show trending arrow (↑/↓/→) correctly', () => {});
  it('should highlight critical metrics in red', () => {});
  it('should render confidence interval', () => {});
});

// PerformanceTimeSeriesChart.test.tsx (50 lines)
describe('PerformanceTimeSeriesChart', () => {
  it('should render line chart with time-series data', () => {});
  it('should display confidence interval band', () => {});
  it('should handle empty data gracefully', () => {});
  it('should update on prop change', () => {});
});

// DriftGauge.test.tsx (40 lines)
describe('DriftGauge', () => {
  it('should render gauge with correct alert level', () => {});
  it('should update color based on drift score', () => {});
  it('should show tooltip on hover', () => {});
});
```

**Hooks:**
```typescript
// useModelPerformance.test.ts (60 lines)
describe('useModelPerformance', () => {
  it('should fetch and return metrics', async () => {});
  it('should cache results for 5 minutes', async () => {});
  it('should return error on API failure', async () => {});
  it('should refetch on demand', async () => {});
});

// useDriftDetection.test.ts (60 lines)
describe('useDriftDetection', () => {
  it('should calculate feature drift correctly', () => {});
  it('should detect model drift from accuracy trend', () => {});
  it('should return correct alert status', () => {});
});

// useRetrainingActions.test.ts (60 lines)
describe('useRetrainingActions', () => {
  it('should submit retraining job with config', async () => {});
  it('should poll job status every 5 seconds', async () => {});
  it('should handle job failure gracefully', async () => {});
});
```

**Utilities:**
```typescript
// formatters.test.ts (40 lines)
describe('formatters', () => {
  it('should format ROC-AUC as percentage', () => {
    expect(formatRocAuc(0.8523)).toBe('85.23%');
  });
  it('should round precision to 2 decimals', () => {
    expect(formatPrecision(0.8234)).toBe('82.34%');
  });
});

// colorUtils.test.ts (30 lines)
describe('colorUtils', () => {
  it('should return red for degraded metrics', () => {});
  it('should return green for improved metrics', () => {});
});
```

### Integration Tests (React Testing Library)

```typescript
// ModelPerformanceLayout.integration.test.tsx (120 lines)
describe('Model Performance Dashboard - Integration', () => {
  it('should load and display all metrics sections', async () => {
    render(<ModelPerformanceLayout />);
    // Wait for metrics to load
    await waitFor(() => {
      expect(screen.getByText(/ROC-AUC/)).toBeInTheDocument();
    });
  });

  it('should refresh metrics on button click', async () => {
    render(<ModelPerformanceLayout />);
    const refreshBtn = screen.getByRole('button', { name: /Refresh/i });
    fireEvent.click(refreshBtn);
    await waitFor(() => {
      expect(screen.getByText(/Updating/)).toBeInTheDocument();
    });
  });

  it('should submit retraining job from form', async () => {
    render(<ModelPerformanceLayout />);
    const startBtn = screen.getByRole('button', { name: /Start Retraining/i });
    fireEvent.click(startBtn);
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/algorithm/i), { 
      target: { value: 'lightgbm' } 
    });
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Job submitted/)).toBeInTheDocument();
    });
  });

  it('should update experiment status in real-time', async () => {
    render(<ModelPerformanceLayout />);
    // Simulate WebSocket update
    const experiment = screen.getByText(/XGBoost v2 vs LightGBM/);
    expect(experiment).toHaveTextContent('Day 5 of 14');
  });

  it('should display error and allow retry on API failure', async () => {
    // Mock API to fail
    mockModelMetricsAPI.reject();
    
    render(<ModelPerformanceLayout />);
    await waitFor(() => {
      expect(screen.getByText(/Failed to load metrics/)).toBeInTheDocument();
    });
    
    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    fireEvent.click(retryBtn);
    
    // API succeeds second time
    mockModelMetricsAPI.resolve(validMetrics);
    await waitFor(() => {
      expect(screen.getByText(/ROC-AUC/)).toBeInTheDocument();
    });
  });
});
```

### E2E Tests (Cypress / Playwright)

```typescript
// model-performance.e2e.ts (150 lines)
describe('Model Performance Monitoring - E2E', () => {
  beforeEach(() => {
    cy.login('ml-engineer@company.com');
    cy.visit('/dashboard/models');
  });

  it('should complete full retraining workflow', () => {
    // 1. View current metrics
    cy.contains('ROC-AUC').should('exist');
    cy.contains('0.85').should('be.visible');

    // 2. Open retraining modal
    cy.contains('Start Retraining').click();
    cy.get('[role="dialog"]').should('be.visible');

    // 3. Configure and submit
    cy.get('#algorithm').select('lightgbm');
    cy.get('#trainingDays').select('30');
    cy.get('#useAutoML').check();
    cy.contains('button', 'Submit').click();

    // 4. Verify job submitted
    cy.contains('Job R-248 submitted').should('be.visible');

    // 5. Poll job status
    cy.get('[data-testid="job-status"]', { timeout: 60000 })
      .should('contain', 'Training');
    
    // Wait for completion (or timeout)
    cy.get('[data-testid="job-status"]', { timeout: 300000 })
      .should('contain', 'Validating')
      .then(() => 'Deployed');
  });

  it('should promote challenger model in A/B test', () => {
    // 1. View running experiment
    cy.contains('XGBoost v5 vs LightGBM v3').should('be.visible');
    cy.contains('LightGBM v3').contains('↑0.017').should('be.visible');

    // 2. Increase traffic to 50%
    cy.contains('Increase Traffic to 50%').click();
    cy.get('[value="50"]').should('be.visible');

    // 3. After sufficient data, promote
    cy.contains('Promote LightGBM v3').click();
    cy.contains('Deployment started').should('be.visible');

    // 4. Verify deployment
    cy.get('[data-testid="active-model"]').should('contain', 'LightGBM v3');
  });

  it('should detect and alert on drift', () => {
    // 1. System detects drift overnight
    cy.reload();
    
    // 2. Alert badge appears
    cy.get('[data-testid="drift-status"]')
      .should('have.class', 'alert')
      .and('contain', 'Prediction Drift Detected');

    // 3. Drift details visible
    cy.contains('JS Divergence: 0.22').should('be.visible');
    cy.contains('Torque - KS Stat: 0.24').should('be.visible');

    // 4. Retraining recommended
    cy.contains('Retrain Recommended').should('be.visible');
  });
});
```

### Test Data & Fixtures

```typescript
// fixtures/model-metrics.json
{
  "rocAuc": 0.8523,
  "precision": 0.8234,
  "recall": 0.8812,
  "f1Score": 0.8517,
  "confidenceInterval": { "lower": 0.8401, "upper": 0.8645 },
  "baseline": { "rocAuc": 0.8726 },
  "sampleSize": 2847,
  "predictionsFeedback": 1234
}

// fixtures/drift-metrics.json
{
  "featureDrift": {
    "overall": 0.12,
    "detected": [
      {
        "featureName": "Torque",
        "driftScore": 0.24,
        "magnitude": "low"
      }
    ]
  },
  "modelDrift": {
    "rocAucTrend": "stable",
    "accuracyChange": -0.01
  }
}
```

---

## Performance Considerations

### Bundle Optimization
- **Code Splitting:**
  - Lazy load chart component (Recharts is heavy)
  - Separate retraining modal into code-split chunk
  - Load experiments section only if user has experiments

- **Tree Shaking:**
  - Import only needed Recharts components (not full library)
  - Remove unused utility functions
  - Prune unused CSS from TailwindCSS

- **Asset Optimization:**
  - Compress metric SVG icons
  - Use WebP images where supported
  - Minimize JSON fixtures

### Runtime Performance
- **Memoization:**
  - `useMemo` on time-series chart data transformation
  - `useCallback` on event handlers (stop/decide/refresh)
  - `React.memo` on metric cards (expensive if re-rendered)

- **Virtualization:**
  - Virtualize retraining history table (only render visible rows)
  - Limit chart to last 90 days by default (can load more on demand)

- **Debouncing:**
  - Debounce time range picker (500ms before refetch)
  - Debounce model selector (300ms before refetch)

### Caching Strategy
- **API Response Cache:**
  - Cache metrics for 5 minutes (or manual refresh)
  - Cache retraining jobs for 10 minutes
  - Cache drift metrics for 5 minutes

- **Client-Side Persistence:**
  - Store selected model in localStorage
  - Store time range preference
  - Store column sort order in table

- **CDN Caching:**
  - Cache static assets (fonts, icons) for 1 year
  - Cache API responses with max-age=300 (5min)

---

## Deployment Plan

### Development Phase (Week 1-2)

#### Local Development
```bash
# Start dev server with mock APIs
npm run dev

# Run tests
npm run test

# Check accessibility
npm run audit:a11y
```

#### Feature Branch
- Branch: `feature/story10-model-monitoring`
- Commits follow conventional commit format
- PR requires 2 approvals + passing CI

### Staging Phase (Week 3)

#### Staging Deployment
```bash
# Deploy to staging environment
git push origin staging-story10

# Run integration tests
npm run test:integration

# Run E2E tests on staging
npm run test:e2e -- --env=staging

# Performance testing
npm run lighthouse

# Security audit
npm audit
```

#### User Acceptance Testing
- ML Engineer user tests metric display
- Maintenance Manager validates alert notifications
- Test retraining workflow end-to-end
- Validate A/B testing framework

### Production Phase (Week 4)

#### Gradual Rollout
1. **Canary Release:** Deploy to 5% of users
   - Monitor error rates, performance
   - Collect feedback on UX
   - Duration: 24 hours

2. **Staged Rollout:**
   - 25% → Monitor for 24 hours
   - 50% → Monitor for 24 hours
   - 100% → Full deployment

#### Rollback Procedure
- If error rate > 1%: automatic rollback
- If performance degraded (>500ms fetch): manual rollback
- Keep previous version running for 7 days post-deployment

#### Deployment Artifacts
```
docs/
├── DEPLOYMENT.md              # Step-by-step deployment guide
├── ROLLBACK.md               # Rollback procedures
└── MONITORING.md             # Post-deployment monitoring
```

---

## Monitoring & Analytics

### Performance Metrics
- **Core Web Vitals:**
  - LCP (Largest Contentful Paint): Target < 2.5s
  - FID (First Input Delay): Target < 100ms
  - CLS (Cumulative Layout Shift): Target < 0.1

- **Custom Metrics:**
  - Model metrics load time: Target < 500ms
  - Chart render time: Target < 1s
  - Retraining job submission latency: Target < 200ms

### Business Metrics
- **Model Performance:**
  - Retraining success rate (should be > 95%)
  - Time from drift detection to human review
  - Number of models promoted in A/B tests

- **User Engagement:**
  - Daily active users (ML engineers)
  - Feature adoption rate (% who use retraining)
  - Time spent on model performance page

### Technical Metrics
- **API Performance:**
  - `/api/models/{id}/metrics` latency: p95 < 500ms
  - `/api/retraining/jobs` latency: p95 < 300ms
  - WebSocket message latency: p95 < 1s

- **Error Rates:**
  - API error rate: Target < 0.1%
  - Chart rendering errors: Target < 0.01%
  - WebSocket disconnections: Target < 1 per hour

### Alerting Rules
- 🚨 Model accuracy drops > 5% from baseline → Page ML engineer
- 🚨 Drift detected + confidence > 95% → Email alert
- 🚨 Retraining job failed → Slack notification
- ⚠️ API latency p95 > 1s → Log warning
- ⚠️ WebSocket disconnect → Log event

---

## Documentation Requirements

### Technical Documentation
1. **API Integration Guide** (`docs/api/model-metrics.md`)
   - Request/response examples
   - Error handling patterns
   - Rate limiting info

2. **Component Usage** (`docs/components/MODEL_PERFORMANCE.md`)
   - Component props and types
   - Usage examples
   - Customization options

3. **Hooks Guide** (`docs/hooks/MODEL_PERFORMANCE_HOOKS.md`)
   - Hook purposes and return types
   - Example implementations
   - Caching behavior

4. **Architecture Decision Records** (`docs/adr/`)
   - `ADR-0001: Why Evidently AI for drift detection` 
   - `ADR-0002: WebSocket for real-time metrics`
   - `ADR-0003: A/B testing statistical approach`

5. **Troubleshooting Guide** (`docs/TROUBLESHOOTING.md`)
   - Common issues and solutions
   - Debug mode instructions
   - Contact ML team procedure

### User Documentation
1. **Feature Guide** (`docs/user-guides/MODEL_PERFORMANCE_GUIDE.md`)
   - Step-by-step instructions
   - Screenshots with annotations
   - FAQ section

2. **Runbook for ML Engineers** (`docs/runbook/ML_OPS.md`)
   - When to retrain (drift/degradation signals)
   - How to interpret drift alerts
   - A/B testing decision guide
   - Escalation procedure

3. **Storybook Component Library**
   ```bash
   npm run storybook
   # Browse: http://localhost:6006
   ```
   - Interactive component demo
   - Prop variations
   - Accessibility checker

---

## Post-Launch Review

### Success Criteria
- ✅ All acceptance criteria met
- ✅ Performance targets achieved (< 2s page load)
- ✅ Error rates < 0.1%
- ✅ User adoption: > 80% of ML engineers use feature within 2 weeks
- ✅ No critical bugs reported after 7 days

### Retrospective Items
1. Was Evidently AI effective for drift detection?
2. Did A/B testing framework provide actionable insights?
3. Were retraining job logs clear enough for debugging?
4. Should we add model explainability (SHAP) to this dashboard?
5. How could we better educate users on drift interpretation?

### Technical Debt Identified
- [ ] Consider async retraining notifications (Celery tasks)
- [ ] Implement model versioning in UI (show all versions)
- [ ] Add export/API for metrics (BI integration)
- [ ] Performance optimization: virtualize chart (if >180 days)

### Future Enhancements
1. **Phase 2:** Automated retraining (drift > threshold → auto-trigger)
2. **Phase 3:** Multi-model ensemble management
3. **Phase 4:** Integration with Feature Store (Great Expectations)
4. **Phase 5:** Cost analysis (model improvement vs. infrastructure spend)

---

## Appendix: Technology Deep Dive

### MLflow Integration
```python
# Backend: Log metrics during training
mlflow.set_tracking_uri(MLFLOW_URI)
with mlflow.start_run():
    mlflow.log_metrics({
        "roc_auc": 0.85,
        "precision": 0.82,
        "recall": 0.88,
    })
    mlflow.log_model(model, "xgboost-model")

# Frontend: Retrieve model versions
GET /api/mlflow/models/{modelName}/versions
```

### Evidently AI Configuration
```python
# Drift detection setup
from evidently.dashboard import Dashboard
from evidently.tabs import DriftTab

dashboard = Dashboard(tabs=[
    DriftTab(
        reference_data=training_data,
        current_data=production_data,
        columns=feature_columns
    )
])
```

### Prometheus Metrics
```python
# Emit metrics to Prometheus
from prometheus_client import Counter, Histogram

model_accuracy = Gauge('model_accuracy', 'Current model accuracy')
retraining_duration = Histogram('retraining_duration_seconds', 'Time to retrain')

model_accuracy.set(0.85)
retraining_duration.observe(3600)
```

---

**Document Status:** ✅ **READY FOR IMPLEMENTATION**  
**Last Updated:** February 8, 2026  
**Next Review:** Post-implementation (Week 5)  
**Owner:** ML Platform Team  
**Stakeholders:** ML Engineers, Maintenance Managers, DevOps
