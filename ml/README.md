/**
 * @file ml/README.md
 * @description ML Training Infrastructure for Machine Failure Prediction (Capstone Project)
 * @created 2026-02-08
 * @status Complete - Ready for model training
 * @project capstone_project
 */

# ML Training Infrastructure - Capstone Project

## Overview

This directory contains the complete machine learning training pipeline for binary classification of machine failures as part of the capstone project. The infrastructure is designed to train gradient boosting models (XGBoost, LightGBM) on the Kaggle competition dataset and integrate with the real-time monitoring dashboard.

**Dataset:** [Binary Classification of Machine Failures](https://github.com/JMViJi/Binary-Classification-of-Machine-Failures)
**Competition:** Kaggle Playground Series S3E17

---

## Project Structure

```
ml/
├── README.md                          # This file
├── requirements.txt                   # Python dependencies
├── __init__.py                        # Package initialization
├── data_loader.py                     # Data loading and preprocessing
├── feature_engineering.py             # Feature engineering pipeline
├── scripts/
│   ├── __init__.py
│   ├── train_models.py               # Main training script
│   └── evaluate_models.py            # Model evaluation utilities
├── models/                            # Trained models (output)
│   ├── xgboost_model_*.pkl           # Trained XGBoost model
│   ├── lightgbm_model_*.pkl          # Trained LightGBM model
│   ├── training_metrics_*.json       # Evaluation metrics
│   └── feature_columns_*.json        # Feature names used
└── data/                              # Data directory (symlink to ../docs)
```

---

## Installation

### Prerequisites

- Python 3.9+
- pip or conda
- Virtual environment (recommended)

### Setup

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r ml/requirements.txt
```

### Verify Installation

```bash
python -c "import xgboost; import lightgbm; print('✅ All dependencies installed')"
```

---

## Quick Start

### Train Models

```bash
# From project root, run training pipeline
cd ml/scripts
python train_models.py
```

**Output:**
- `ml/models/xgboost_model_YYYYMMDD_HHMMSS.pkl` - Trained XGBoost
- `ml/models/lightgbm_model_YYYYMMDD_HHMMSS.pkl` - Trained LightGBM
- `ml/models/training_metrics_YYYYMMDD_HHMMSS.json` - Performance metrics
- `ml/models/feature_columns_YYYYMMDD_HHMMSS.json` - Feature names

### Load Trained Model

```python
import pickle
from ml.data_loader import DataLoader

# Load model
with open('ml/models/xgboost_model_*.pkl', 'rb') as f:
    model = pickle.load(f)

# Load feature columns
import json
with open('ml/models/feature_columns_*.json', 'r') as f:
    features = json.load(f)['feature_columns']

# Make predictions
predictions = model.predict(X_new[features])
prediction_proba = model.predict_proba(X_new[features])
```

---

## Dataset

### Training Split (docs/train_tr.csv)

| Metric | Value |
|--------|-------|
| **Rows** | 109,143 |
| **Columns** | 14 |
| **Split** | 80% of full dataset |
| **Target Variable** | Machine failure (0/1) |
| **Class Imbalance** | ~96.2% no failure, ~3.8% failure |
| **Features** | 7 sensors + 5 failure modes |

**Columns:**
- `id` - Sample index
- `Product ID` - Machine identifier
- `Type` - Machine category (L, M, H)
- `Air temperature [K]` - Ambient temperature
- `Process temperature [K]` - Operating temperature
- `Rotational speed [rpm]` - Shaft rotation speed
- `Torque [Nm]` - Rotational force
- `Tool wear [min]` - Accumulated wear
- `Machine failure` - Target (0 = no failure, 1 = failure)
- `TWF,HDF,PWF,OSF,RNF` - Failure mode indicators

### Test Split (docs/train_te.csv)

| Metric | Value |
|--------|-------|
| **Rows** | 27,286 |
| **Columns** | 14 |
| **Split** | 20% of full dataset |
| **Purpose** | Model validation and performance evaluation |
| **Target Variable** | Machine failure (0/1) |

---

## Feature Engineering

The training pipeline implements domain-specific feature engineering:

### Base Features

- **Power** = Torque × Rotational Speed
  - Represents mechanical power output
  - Critical for understanding energy dissipation

- **Temperature Difference** = Process Temp - Air Temp
  - Indicates operational temperature above ambient
  - Reflects heating from friction

- **Wear Rate** = Tool Wear / (Torque + 1)
  - Normalized wear accounting for load
  - Higher rates indicate accelerated degradation

- **Total Failure Count** = Sum of failure mode indicators
  - Indicates multiple simultaneous failure conditions
  - Important for multi-failure scenarios

### Interaction Features

- `Torque_Speed_Interaction` - Combined mechanical stress
- `Wear_Power_Interaction` - Wear acceleration under power
- `Temp_Wear_Interaction` - Thermal stress on worn parts

### Advanced Features (when enabled)

- Polynomial features (squared values)
- Ratio features (normalized relationships)
- Additional non-linear transformations

---

## Training Parameters

### XGBoost Configuration

```python
xgb_params = {
    'max_depth': 8,              # Tree depth
    'learning_rate': 0.1,        # Boosting learning rate
    'n_estimators': 200,         # Number of boosting rounds
    'subsample': 0.8,            # Row subsampling rate
    'colsample_bytree': 0.8,     # Feature subsampling rate
    'scale_pos_weight': 49,      # Class weight (~98/2 ratio)
    'eval_metric': 'logloss',    # Evaluation metric
}
```

### LightGBM Configuration

```python
lgb_params = {
    'max_depth': 8,              # Max tree depth
    'learning_rate': 0.1,        # Learning rate
    'n_estimators': 200,         # Number of leaves iterations
    'subsample': 0.8,            # Sample rate per iteration
    'colsample_bytree': 0.8,     # Feature rate per iteration
    'scale_pos_weight': 49,      # Class weight for imbalance
    'metric': 'auc',             # Primary metric
}
```

---

## Evaluation Metrics

The training pipeline evaluates models on:

| Metric | Purpose | Current |
|--------|---------|---------|
| **ROC-AUC** | Overall discrimination ability | Expected: 0.85+ |
| **Precision** | True positive rate among predictions | Expected: 0.80+ |
| **Recall** | True positive identification rate | Expected: 0.85+ |
| **F1 Score** | Harmonic mean of precision/recall | Expected: 0.82+ |
| **Accuracy** | Overall prediction correctness | Expected: 0.98+ |

**Note:** High accuracy is misleading for imbalanced data. ROC-AUC and F1 are more reliable metrics.

---

## Class Imbalance Handling

The dataset has ~2% failure rate (imbalanced). The training pipeline handles this through:

### 1. Scale Pos Weight

```python
scale_pos_weight = n_negative / n_positive  # ~49 for this dataset
# Used in XGBoost and LightGBM parameters
```

### 2. Stratified Cross-Validation

```python
train_test_split(..., stratify=y)  # Maintains class distribution
```

### 3. Appropriate Metrics

- ROC-AUC (does not depend on threshold)
- Precision/Recall (not misled by imbalance)
- F1 Score (balances precision/recall)

### 4. Optional: SMOTE (for future enhancement)

```python
from imblearn.over_sampling import SMOTE
smote = SMOTE(random_state=42)
X_train_resampled, y_train_resampled = smote.fit_resample(X_train, y_train)
```

---

## Usage Examples

### Example 1: Train Models

```python
from ml.scripts.train_models import ModelTrainer

trainer = ModelTrainer(output_dir='ml/models', data_dir='docs')
results = trainer.train_and_evaluate()

print(f"XGBoost ROC-AUC: {results['metrics']['xgboost']['roc_auc']:.4f}")
print(f"LightGBM ROC-AUC: {results['metrics']['lightgbm']['roc_auc']:.4f}")
```

### Example 2: Load and Use Trained Model

```python
import pickle
import pandas as pd
from ml.data_loader import DataLoader
from ml.feature_engineering import FeatureEngineer

# Load model and feature columns
with open('ml/models/xgboost_model_20260208_153000.pkl', 'rb') as f:
    model = pickle.load(f)

# Prepare new data
loader = DataLoader(data_dir='docs')
engineer = FeatureEngineer()

df_new = pd.read_csv('new_sensor_data.csv')
df_new = loader.preprocess_features(df_new, fit=False)
df_new = engineer.engineer_features(df_new)

# Make predictions
X_new = df_new[features]  # features from training
predictions = model.predict(X_new)
probabilities = model.predict_proba(X_new)[:, 1]

print(f"Predictions: {predictions}")
print(f"Failure probability: {probabilities}")
```

### Example 3: Feature Importance Analysis

```python
import xgboost as xgb

# Get feature importances
importance = model.get_booster().get_score(importance_type='weight')
sorted_importance = sorted(importance.items(), key=lambda x: x[1], reverse=True)

# Plot top 10 features
for feature, importance in sorted_importance[:10]:
    print(f"{feature}: {importance}")
```

---

## Model Registry & Versioning

Each training run generates timestamped outputs:

```
ml/models/
├── xgboost_model_20260208_153000.pkl         # Model v1
├── training_metrics_20260208_153000.json     # Metrics v1
├── feature_columns_20260208_153000.json      # Features v1
├── xgboost_model_20260209_100000.pkl         # Model v2
├── training_metrics_20260209_100000.json     # Metrics v2
└── feature_columns_20260209_100000.json      # Features v2
```

**To use a specific model version:**
```bash
ls -la ml/models/ | grep xgboost_model  # List all versions
# Load by timestamp
```

---

## Monitoring & Retraining

### When to Retrain

- ROC-AUC drops by >5% on new data
- Data distribution changes detected (drift)
- New failure modes emerge
- Scheduled monthly retraining

### Monitoring Strategy (Story 10)

The platform (Story 10) tracks:
1. Real-time predictions vs actual outcomes
2. Model metrics over time
3. Data drift detection (Evidently AI)
4. Automatic retraining triggers

---

## Advanced Topics

### Hyperparameter Tuning

```python
from optuna import create_study, Trial

def objective(trial: Trial):
    params = {
        'max_depth': trial.suggest_int('max_depth', 5, 15),
        'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3),
        'n_estimators': trial.suggest_int('n_estimators', 100, 500),
    }
    # Train model with params, return ROC-AUC on test set
    ...

study = create_study(direction='maximize')
study.optimize(objective, n_trials=100)
```

### SHAP Explanations

```python
import shap

# Create SHAP explainer
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test)

# Summary plot
shap.summary_plot(shap_values, X_test, plot_type='bar')

# Individual prediction explanation
shap.force_plot(explainer.expected_value, shap_values[0], X_test.iloc[0])
```

### MLflow Integration

```python
import mlflow

with mlflow.start_run():
    mlflow.log_params({
        'max_depth': 8,
        'learning_rate': 0.1,
        'algorithm': 'xgboost'
    })
    
    # Train model...
    
    mlflow.log_metrics({
        'roc_auc': 0.85,
        'precision': 0.82,
        'recall': 0.88
    })
    
    mlflow.sklearn.log_model(model, 'xgboost-model')
```

---

## Troubleshooting

### Issue: Memory Error During Training

```python
# Solution: Reduce data or simplify features
# Or use LightGBM (more memory-efficient)
```

### Issue: Imbalanced Class Metrics

```python
# Always use stratified split!
train_test_split(..., stratify=y)

# Avoid accuracy metric
# Use: ROC-AUC, F1, recall, precision
```

### Issue: Model Overfitting

```python
# Increase regularization:
xgb_params = {
    'max_depth': 6,           # Reduce depth
    'subsample': 0.7,         # Reduce row sampling
    'colsample_bytree': 0.7,  # Reduce feature sampling
}
```

---

## Next Steps

1. **Run Training Pipeline**
   ```bash
   python ml/scripts/train_models.py
   ```

2. **Verify Model Performance**
   - Check ROC-AUC scores in metrics JSON
   - Compare XGBoost vs LightGBM performance

3. **Deploy to MLflow Registry**
   - Register best model version
   - Set staging/production tag

4. **Integrate with Story 10**
   - Load models in FastAPI backend
   - Create prediction endpoints
   - Set up monitoring dashboard

5. **Set Up Automated Retraining**
   - Weekly scheduled jobs
   - Drift detection triggers
   - Model registry versioning

---

## References

- **Dataset Source:** https://github.com/JMViJi/Binary-Classification-of-Machine-Failures
- **XGBoost Docs:** https://xgboost.readthedocs.io/
- **LightGBM Docs:** https://lightgbm.readthedocs.io/
- **Kaggle Competition:** https://www.kaggle.com/competitions/playground-series-s3e17
- **SHAP Documentation:** https://shap.readthedocs.io/
- **MLflow Documentation:** https://mlflow.org/docs/

---

**Last Updated:** February 8, 2026
**Status:** Production Ready
**Maintainers:** ML Development Team
