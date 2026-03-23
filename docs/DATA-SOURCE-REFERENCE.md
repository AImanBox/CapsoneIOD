# Data Source Reference

**Updated:** February 8, 2026  
**Dataset:** Binary Classification of Machine Failures (Kaggle)  
**Repository:** https://github.com/JMViJi/Binary-Classification-of-Machine-Failures

---

## Quick Reference

### Dataset Basics

- **Name:** Binary Classification of Machine Failures
- **Source:** Kaggle Playground Series S3E17
- **Type:** Tabular sensor data with binary classification target
- **Failure Rate:** ~2% (imbalanced classification)
- **ML Approach:** XGBoost/LightGBM with weighted loss functions

### Sensor Features (7 Input Variables)

```
Product Type: Machine category (A, B, C, D)
Air Temperature: Ambient temperature [K] (~295-310K)
Process Temperature: Operational temperature [K] (~305-320K)
Rotational Speed: Machine rotation speed [RPM] (1200-2886)
Torque: Rotational force applied [Nm] (3.8-76.6)
Tool Wear: Accumulated wear [minutes] (0-255)
↓ (Features)
┌─────────────────────┐
│   ML Model (XGB)    │
│   Predicts: P(fail) │
└─────────────────────┘
↓
Machine Failure: 0 or 1
+ Failure Mode: TWF | HDF | PWF | OSF | RNF
```

### Failure Types

When `Machine Failure = 1`, one or more of these modes occurred:

1. **TWF (Tool Wear Failure)** - Tool wear exceeded threshold
2. **HDF (Heat Dissipation Failure)** - Thermal dissipation inadequate
3. **PWF (Power Failure)** - Electrical/power system malfunction
4. **OSF (Overstrain Failure)** - Machine stress exceeded limits
5. **RNF (Random Failure)** - Unspecified/unplanned failure

---

## Local Dataset Files

### Sample Data

**Training Split File:** [`docs/train_tr.csv`](./train_tr.csv)  
**Format:** CSV (Comma-Separated Values)  
**Rows:** 109,143 (80% of full dataset)  
**Columns:** 13 (includes target & failure modes)  
**Size:** ~5.4 MB  
**Source:** 80% split for model training

**Test Split File:** [`docs/train_te.csv`](./train_te.csv)  
**Format:** CSV (Comma-Separated Values)  
**Rows:** 27,286 (20% of full dataset)  
**Columns:** 13 (includes target & failure modes)  
**Size:** ~1.35 MB  
**Source:** 20% split for model validation and performance evaluation

### Dataset Documentation

**File:** [`docs/DATASET-README.md`](./DATASET-README.md)  
**Content:**
- Column reference guide (train vs test differences)
- Train vs Test dataset breakdown
- Data statistics & class distribution
- Example rows (healthy & failed machines)
- How to use for ML model development
- Class imbalance handling strategies
- Production monitoring implications

---

## Why This Dataset Matters

### For Platform Architecture

1. **Real-World Complexity**
   - Tabular sensor data (realistic IoT scenario)
   - Multiple feature types (categorical, continuous)
   - Imbalanced classification (2% positive class)
   - Multiple failure modes to track

2. **ML Pipeline Requirements**
   - Gradient boosting algorithm (XGBoost/LightGBM preferred)
   - Class weighting or SMOTE sampling
   - SHAP values for model interpretability
   - Feature engineering opportunities (interactions, transformations)

3. **Production Monitoring Challenges**
   - **Concept Drift:** Production sensor distributions may differ from training
   - **Label Delay:** Ground truth (actual failures) arrives later than predictions
   - **Drift Detection:** Need Story 10 monitoring for model accuracy regression
   - **Retraining:** Automated pipelines needed when performance drops >5%

### For Feature Development

**Story 10 Implementation** directly motivated by this dataset:

- Real-time accuracy tracking (ROC-AUC, precision, recall)
- Drift detection for sensor distributions
- A/B testing framework for model improvements
- Automated retraining recommendations
- Explainability visualization (SHAP feature importance)

---

## Implementation Timeline

### Phase 1: Model Training
```
Raw Data (7 sensors) 
   ↓
Feature Engineering
   ↓
Train/Test Split (handle imbalance)
   ↓
XGBoost Training (with class weights)
   ↓
Evaluation Metrics (precision, recall, F1, ROC-AUC)
   ↓
Model Registry (MLflow)
```

### Phase 2: Batch Inference
```
New Sensor Data (streams continually)
   ↓
Feature Transformation (same as training)
   ↓
Prediction Batch
   ↓
SHAP Explanations
   ↓
Store Predictions + Ground Truth (when available)
```

### Phase 3: Monitoring (Story 10)
```
Historical Predictions + Actuals
   ↓
Track: Accuracy, Drift, Concept Changes
   ↓
Alert if: ROC-AUC drops >5% or drift detected
   ↓
Trigger: Automated Retraining
   ↓
Deploy: A/B test new model → Canary → Full rollout
```

---

## Where Dataset Reference Appears

### Documentation Files

1. **`docs/stories/predictive-maintenance.stories.md`** (Header)
   - Added: Dataset source link
   - Purpose: Users understand ML foundation

2. **`docs/DOCUMENTATION_INDEX.md`** (Quick Reference)
   - Added: Dataset overview section
   - Purpose: Quick access for all team members

3. **`docs/STORY10-QUICKSTART.md`** (Section: "Background")
   - Added: Context about what's being monitored
   - Purpose: Developers understand the ML context

4. **`docs/implementation-plans/README.md`** (Header)
   - Added: Dataset source reference
   - Purpose: Implementation planners know the data source

5. **`docs/implementation-plans/Model-Performance-Monitoring.md`** (New Section 2.5)
   - Added: Comprehensive dataset details
   - Sections: Features, failure modes, class imbalance implications
   - Purpose: Detailed spec reference during development

6. **`docs/technical-description/README.md`** (New Section 2.5)
   - Added: ML dataset & model training section
   - Includes: Feature table, failure modes, class imbalance notes
   - Purpose: Architects understand training foundation

7. **`docs/technical-description/GENERATION-REPORT.md`** (Executive Summary + New Section)
   - Added: Dataset citation in summary
   - Added: Comprehensive "Data Source Reference" section
   - Purpose: Stakeholders understand ML foundation

---

## Key Insights for Development

### Class Imbalance Handling

❌ **Don't do:**
```python
# This ignores that only 2% are failures!
accuracy = (correct_predictions / total) # ~98% accurate even if always predicting "no failure"
```

✅ **Do this instead:**
```python
from sklearn.metrics import precision_recall_fscore_support, roc_auc_score

# Track all metrics, especially for minority class (failures)
precision, recall, f1, _ = precision_recall_fscore_support(y_true, y_pred, average='binary')
roc_auc = roc_auc_score(y_true, y_pred_proba)

# In Story 10, monitor these across time to detect drift
```

### Feature Engineering Ideas

From sensor data, consider:
- **Derived Features:** Torque/Speed, Temp ratio, Wear rate
- **Aggregations:** Rolling means/stds of sensor readings
- **Interactions:** Temp × Speed (thermal stress), Wear × Load
- **Lag Features:** Previous hour/day sensor trends

### Monitoring Strategy (Story 10 Relevance)

```python
# Training time
train_metrics = {
    'precision': 0.87,
    'recall': 0.92,
    'f1': 0.89,
    'roc_auc': 0.94
}

# Production time (Story 10 tracks this)
prod_metrics = {
    'precision': 0.78,  # ⚠️ Dropped 9 points
    'recall': 0.85,     # ⚠️ Dropped 7 points
    'f1': 0.81,         # ⚠️ Dropped 8 points
    'roc_auc': 0.88     # ⚠️ Dropped 6 points
}

# Action: Trigger retraining (Story 10 automation)
```

---

## Repository Contents

### Files in GitHub Repository

```
JMViJi/Binary-Classification-of-Machine-Failures/
├── data/
│   └── README and Forests Stack
├── input/
│   └── CSV files (train_tr.csv, train_te.csv)
├── Binary classification of machine learning - Part1.ipynb
├── Binary classification of machine learning - Part2.ipynb
├── readme.md (Project documentation)
└── submission.csv (Sample submission format)
```

### Kaggle Competition Details

- **Competition URL:** https://www.kaggle.com/competitions/playground-series-s3e17/
- **Notebook Format:** Jupyter (Part 1: EDA, Part 2: Modeling)
- **Models Demonstrated:** XGBoost, LightGBM, CatBoost
- **Hyperparameter Tuning:** Optuna

---

## Getting Started

### For ML Engineers

1. Clone: https://github.com/JMViJi/Binary-Classification-of-Machine-Failures
2. Review: Notebooks (Part1 = EDA, Part2 = Modeling)
3. Understand: Feature engineering + model selection
4. Adapt: XGBoost model for production inference
5. Deploy: Set up MLflow model registry

### For Full-Stack Developers (Story 10)

1. Read: [`docs/STORY10-QUICKSTART.md`](./STORY10-QUICKSTART.md)
2. Review: Dataset context (this file)
3. Understand: Why ROC-AUC/F1 matter more than accuracy
4. Build: Model performance dashboard
5. Deliver: Real-time accuracy tracking + drift detection

---

## Related Documentation

- **Quick Start:** [`docs/STORY10-QUICKSTART.md`](./STORY10-QUICKSTART.md)
- **Full Implementation Plan:** [`docs/implementation-plans/Model-Performance-Monitoring.md`](./implementation-plans/Model-Performance-Monitoring.md)
- **Technical Description:** [`docs/technical-description/README.md`](./technical-description/README.md)
- **User Stories:** [`docs/stories/predictive-maintenance.stories.md`](./stories/predictive-maintenance.stories.md)
- **Documentation Index:** [`docs/DOCUMENTATION_INDEX.md`](./DOCUMENTATION_INDEX.md)

---

**Last Updated:** February 8, 2026  
**Dataset:** Binary Classification of Machine Failures  
**Status:** ✅ Integrated across all documentation
