# Project Structure Exploration Summary
**Generated:** March 23, 2026 | **Dataset:** Binary Classification of Machine Failures

---

## 1. AI MODELS IN `ml/models/` FOLDER

### Binary Model Files
| File | Type | Details |
|------|------|---------|
| `xgboost_model.pkl` | Pickle | Trained XGBoost classifier (production) |
| `lightgbm_model.pkl` | Pickle | Trained LightGBM classifier (production) |

### Model Metadata & Reports
| File | Purpose |
|------|---------|
| `ML_models.json` | **Primary Configuration** - Model registry with hyperparameters, metrics, and training info |
| `model_comparison_results.json` | Model performance comparison metrics |
| `CROSS_VALIDATION_REPORT_20260308_142824.json` | Cross-validation stability report (earlier run) |
| `CROSS_VALIDATION_REPORT_20260308_142905.json` | Cross-validation stability report (later run) |
| `roc_curves.json` | ROC curve data for model evaluation |
| `roc_curves_comprehensive.json` | Extended ROC curve analysis |
| `probability_report.json` | Prediction probability analysis |
| `failure_probabilities.csv` | Failure probability predictions CSV |

### ML_models.json Configuration

**Timestamp:** `20260323_001525` (March 23, 2026, 00:15:25)

**Training Configuration:**
```json
{
  "testSize": 0.2,
  "randomState": 42,
  "splitStrategy": "Stratified Random Split",
  "datasetSize": 10000  // Note: Actual training uses 109,143 samples
}
```

**XGBoost Model Metrics:**
- **ROC-AUC:** 0.9400 (94.00%)
- **Precision:** 0.8909 (89.09%)
- **Recall:** 0.7977 (79.77%)
- **F1-Score:** 0.8417 (84.17%)
- **Accuracy:** 0.9953 (99.53%)
- **Training Date:** 2026-03-23T00:15:32.578688
- **Status:** Production

| Metric | Value |
|--------|-------|
| True Negatives | 26,814 |
| False Positives | 42 |
| False Negatives | 87 |
| True Positives | 343 |

**LightGBM Model Metrics:**
- **ROC-AUC:** 0.9365 (93.65%)
- **Precision:** 0.6667 (66.67%)
- **Recall:** 0.8233 (82.33%)
- **F1-Score:** 0.7367 (73.67%)
- **Accuracy:** 0.9907 (99.07%)
- **Training Date:** 2026-03-23T00:15:32.578705
- **Status:** Production

| Metric | Value |
|--------|-------|
| True Negatives | 26,679 |
| False Positives | 177 |
| False Negatives | 76 |
| True Positives | 354 |

---

## 2. ALL TRAINING SCRIPTS

### Root-Level Training Scripts (Production & Utility)

| Script | Purpose | Key Features |
|--------|---------|--------------|
| **retrain_all_models.py** | ⭐ Main production retraining | Uses train_tr.csv, applies feature engineering, trains both XGBoost and LightGBM |
| **retrain_models_v2.py** | Optimized hyperparameter version | Less aggressive regularization (alpha=0.1, lambda=0.1) |
| **generate_submission.py** | Generate submission file | Creates submission.csv from predictions on train_te.csv (27,286 samples) |
| **generate_submission_binary.py** | Binary predictions submission | Includes id, Product ID, and Machine failure predictions |
| **generate_submission_calibrated.py** | Calibrated probability submission | Applies probability calibration |
| **generate_submission_final.py** | Final optimized submission | Enhanced prediction generation |
| **generate_submission_test.py** | Test submission generation | Testing variant |
| **generate_submission_v2.py** | Alternative submission format v2 | Version 2 format |
| **generate_web_data.py** | Web app data generation | Prepares data for web interface |
| **generate_web_data_final.py** | Final web data export | Production web data |
| **refresh_report.py** | Generate refresh/status report | Reports current model state |
| **check_dirs.py** | Directory structure validation | Verifies project organization |
| **display_results.py** | Display prediction results | Shows model predictions |
| **download_test_csv.py** | Download test data | Utilities for data retrieval |

### Machine Learning Scripts in `ml/scripts/`

#### Core Training Scripts
| Script | Purpose | Details |
|--------|---------|---------|
| **train_models.py** | Primary training pipeline | Class `ModelTrainer` - loads data, engineers features, trains XGBoost and LightGBM |
| **retrain_models.py** | Production retraining pipeline | Class `RetrainingPipeline` - configurable test_size (default 0.2) and random_state (default 42) |
| **prepare_and_train.py** | Preparation + training combo | Combines data preparation with model training in single workflow |

#### Model Evaluation & Comparison Scripts
| Script | Purpose | Class | Key Method |
|--------|---------|-------|------------|
| **cross_validate_models.py** | Cross-validation stability | `CrossValidator` | `cross_validate_xgboost()`, `cross_validate_lightgbm()` |
| **compare_models_simple.py** | Simple model comparison | `SimpleModelComparison` | `train_and_evaluate()` |
| **compare_models_datasets.py** | Dataset-specific comparison | `ModelComparison` | `train_and_evaluate()` per dataset |

#### Prediction & Analysis Scripts
| Script | Purpose | Output |
|--------|---------|--------|
| **generate_failure_probabilities_csv.py** | Export failure probabilities | CSV file with predictions |
| **calculate_failure_probabilities.py** | Calculate probability metrics | Analysis of prediction distribution |
| **predict_proba_demo.py** | Full demonstration | Step-by-step prediction example |
| **predict_proba_quick_demo.py** | Quick prediction demo | Minimal working example |
| **predict_proba_simple_demo.py** | Simplified demo | Basic prediction walkthrough |
| **predict_proba_step_by_step.py** | Detailed step-by-step | Educational breakdown of prediction process |
| **generate_probability_report.py** | Probability analysis report | Comprehensive probability analysis |
| **generate_roc_curves.py** | ROC curve generation | Standard ROC curves |
| **generate_roc_comprehensive.py** | Comprehensive ROC analysis | Extended ROC curve analysis |
| **generate_submission.py** | Submission generation | Creates submission.csv |

---

## 3. DATA LOADING MECHANISM

### Data Loader Architecture

**File:** `ml/data_loader.py`

**Class:** `DataLoader`
- **Location:** `d:\Project\Capstone Project\ml\data_loader.py`
- **Initialized with:** `data_dir` parameter (default: `'docs'`)

### Feature Columns (5 numeric features)
```python
FEATURE_COLUMNS = [
    'Air temperature [K]',      # Ambient operating temperature
    'Process temperature [K]',  # Machine process temperature
    'Rotational speed [rpm]',   # Motor/spindle rotation speed
    'Torque [Nm]',              # Applied torque
    'Tool wear [min]'           # Cumulative tool wear time
]
```

### Categorical Column
```python
CATEGORICAL_COLUMN = 'Type'  # Product type (L, M, H)
```

### Target Variable
```python
TARGET_COLUMN = 'Machine failure'  # Binary target (0 or 1)
```

### Failure Modes (5 binary flags)
```python
FAILURE_MODES = ['TWF', 'HDF', 'PWF', 'OSF', 'RNF']
# TWF: Tool Wear Failure
# HDF: Heat Dissipation Failure
# PWF: Power Loss Failure
# OSF: Overstrain Failure
# RNF: Random Nonfatal Failure
```

### Key DataLoader Methods

| Method | Purpose | Input | Output |
|--------|---------|-------|--------|
| `load_train_data()` | Load training set | - | DataFrame (train_tr.csv) |
| `load_test_data()` | Load test set | - | DataFrame (train_te.csv) |
| `preprocess_features()` | Encode & validate | df, fit=bool | Preprocessed DataFrame |
| `validate_class_distribution()` | Check imbalance | - | Distribution report |

### Data Validation
- ✅ Validates all required columns exist
- ✅ Checks for missing values
- ✅ Validates numeric ranges
- ✅ Reports class imbalance
- ✅ Encodes categorical `Type` column

---

## 4. FEATURE ENGINEERING MECHANISM

**File:** `ml/feature_engineering.py`

**Class:** `FeatureEngineer`

### Base Features Engineered

#### Physics-Based Features
| Feature | Formula | Purpose |
|---------|---------|---------|
| `Power` | Torque × (RPM / 60.0) | Mechanical power output (watts equivalent) |
| `Temperature_Diff` | Process Temp - Air Temp | Temperature above ambient conditions |
| `Wear_Rate` | Tool Wear / (Torque + 1) | Normalized wear accounting for load |
| `Total_Failure_Count` | Sum of [TWF, HDF, PWF, OSF, RNF] | Multiple simultaneous failure conditions |

#### Interaction Features
| Feature | Purpose |
|---------|---------|
| `Torque_Speed_Interaction` | Torque × Rotational Speed interaction |
| `Wear_Power_Interaction` | Wear × Power (wear accelerates with high power) |
| `Temp_Wear_Interaction` | Temperature × Wear (thermal stress on worn parts) |

#### Advanced Features (optional)
| Feature | Purpose |
|---------|---------|
| `Torque_Squared` | Nonlinear torque relationship |
| `Speed_Squared` | Nonlinear speed relationship |
| `Wear_Squared` | Nonlinear wear relationship |
| `Torque_Speed_Ratio` | Normalized feature ratio |
| `Wear_Speed_Ratio` | Normalized wear ratio |

### Feature Engineering Pipeline
```python
FeatureEngineer.engineer_features(df, include_advanced=True)
```

---

## 5. TRAINING/TEST DATA SPLITS

### Location
- **Training Data:** `docs/train_tr.csv`
- **Test Data:** `docs/train_te.csv`

### Data Distribution

| Dataset | File | Rows | Columns | Failure Count | Failure Rate |
|---------|------|------|---------|---------------|--------------|
| **Training** | train_tr.csv | 109,143 | 14 | 1,718 | 1.57% |
| **Test** | train_te.csv | 27,286 | 14 | 430 | 1.58% |
| **Combined Total** | - | 136,429 | 14 | 2,148 | 1.57% |

### Split Strategy
- **Method:** Stratified Random Split
- **Train/Test Ratio:** 80% / 20%
- **Random State:** 42 (for reproducibility)
- **Stratification:** On `Machine failure` target (preserves class distribution)

### Data Columns (14 total)

| # | Column Name | Type | Notes |
|----|-------------|------|-------|
| 1 | `id` | int64 | Sample ID |
| 2 | `Product ID` | object | Product identifier (L, M, H prefixed) |
| 3 | `Type` | object | Categorical: 'L', 'M', or 'H' |
| 4 | `Air temperature [K]` | float64 | Ambient temp (Kelvin) |
| 5 | `Process temperature [K]` | float64 | Operating temp (Kelvin) |
| 6 | `Rotational speed [rpm]` | int64 | RPM |
| 7 | `Torque [Nm]` | float64 | Newton-meters |
| 8 | `Tool wear [min]` | int64 | Minutes |
| 9 | `TWF` | int64 | Binary flag |
| 10 | `HDF` | int64 | Binary flag |
| 11 | `PWF` | int64 | Binary flag |
| 12 | `OSF` | int64 | Binary flag |
| 13 | `RNF` | int64 | Binary flag |
| 14 | `Machine failure` | int64 | Target (0 or 1) |

### Class Imbalance Handling
- **Imbalance Ratio:** ~63:1 (negative:positive)
- **Scale Pos Weight:** 62.47 (calculated from training set)
- **Strategy:** Used in both XGBoost and LightGBM to handle imbalance

---

## 6. TRAINING PARAMETERS & HYPERPARAMETERS

### Standard Hyperparameters (Used Across Most Scripts)

#### XGBoost Configuration
```python
{
    'max_depth': 8,
    'learning_rate': 0.1,
    'n_estimators': 200,
    'scale_pos_weight': 62.47,        # Handle imbalance
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'random_state': 42
}
```

#### LightGBM Configuration
```python
{
    'n_estimators': 200,
    'learning_rate': 0.05,
    'max_depth': 7,
    'num_leaves': 31,
    'min_child_samples': 20,
    'reg_alpha': 0.1,                 # Reduced L1 regularization
    'reg_lambda': 0.1,                # Reduced L2 regularization
    'scale_pos_weight': 62.47,        # Handle imbalance
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'random_state': 42,
    'verbose': -1
}
```

### Data Preparation Parameters

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `test_size` | 0.2 | 20% for test/validation |
| `random_state` | 42 | Reproducibility seed |
| `stratified` | True | Preserve class distribution |

---

## 7. CONFIGURATION FILES

### Primary Configuration
- **`ml/models/ML_models.json`** 
  - Model registry with metadata
  - Training timestamp: 20260323_001525
  - Hyperparameters, metrics, confusion matrices
  - Status: Both models in "production"

### Model Artifact Files
- **`ml/models/xgboost_model.pkl`** - Serialized XGBoost model
- **`ml/models/lightgbm_model.pkl`** - Serialized LightGBM model

### Dependencies & Environment
- **`ml/requirements.txt`** - Python package requirements
  ```
  pandas>=2.0.0
  numpy>=1.24.0
  scikit-learn>=1.3.0
  xgboost>=2.0.0
  lightgbm>=4.0.0
  matplotlib>=3.7.0
  jupyter>=1.0.0
  ipykernel>=6.25.0
  shap>=0.43.0
  mlflow>=2.8.0
  ```

---

## 8. PROJECT STRUCTURE OVERVIEW

```
d:\Project\Capstone Project\
├── ml/                          # ML Module
│   ├── __init__.py             # Package initialization
│   ├── data_loader.py          # ⭐ Data loading class
│   ├── feature_engineering.py  # ⭐ Feature engineering class
│   ├── requirements.txt         # Dependencies
│   ├── models/                 # ⭐ Trained models & configs
│   │   ├── xgboost_model.pkl
│   │   ├── lightgbm_model.pkl
│   │   ├── ML_models.json      # ⭐ Primary config
│   │   ├── *.json              # Analysis reports
│   │   └── *.csv               # Results
│   └── scripts/                # ⭐ Training scripts
│       ├── __init__.py
│       ├── train_models.py     # Core training
│       ├── retrain_models.py   # Production retraining
│       ├── cross_validate_models.py
│       ├── compare_models_*.py # Model comparison
│       ├── predict_proba_*.py  # Prediction demos
│       ├── generate_*.py       # Report generation
│       └── ... (13 scripts total)
│
├── docs/                        # ⭐ Data directory
│   ├── train_tr.csv            # Training data (109,143 rows)
│   ├── train_te.csv            # Test data (27,286 rows)
│   └── ... (analysis & reports)
│
├── package/                     # Next.js web application
│   ├── package.json
│   ├── tsconfig.json
│   └── ... (web app files)
│
├── .github/instructions/        # Project guidelines
│   ├── Architecture & Design Guidelines.instructions.md
│   ├── Code Quality Standards.instructions.md
│   └── Documentation Rules.instructions.md
│
└── Root Level Training Scripts  # ⭐ Production scripts
    ├── retrain_all_models.py
    ├── retrain_models_v2.py
    ├── generate_submission*.py (6 versions)
    ├── generate_web_data*.py (2 versions)
    └── ... (utility scripts)
```

---

## 9. QUICK REFERENCE: HOW MODELS ARE TRAINED

### Training Flow

```
1. DATA LOADING (data_loader.py)
   ↓
   Load train_tr.csv (109,143 samples)
   └─ Validate columns & class distribution
   
2. FEATURE ENGINEERING (feature_engineering.py)
   ↓
   Create 20+ derived features:
   ├─ Power calculations
   ├─ Temperature ratios
   ├─ Wear rates
   ├─ Interaction features
   └─ Advanced polynomial features
   
3. PREPROCESSING
   ↓
   ├─ Encode categorical 'Type' column
   ├─ Handle Product ID
   ├─ Select numeric features only
   └─ Calculate scale_pos_weight (62.47)
   
4. MODEL TRAINING (ml/scripts/train_models.py)
   ↓
   ├─ XGBoost: max_depth=8, lr=0.1, n_estimators=200
   └─ LightGBM: max_depth=7, lr=0.05, n_estimators=200
   
5. EVALUATION
   ↓
   ├─ ROC-AUC scoring
   ├─ Precision, Recall, F1-Score
   ├─ Confusion Matrix Analysis
   └─ Cross-validation (optional)
   
6. MODEL PERSISTENCE
   ↓
   ├─ Save as .pkl files
   ├─ Update ML_models.json
   └─ Generate reports
```

### Entry Points for Training

**Production:**
- `python retrain_all_models.py` - Full retrain with best settings
- `python retrain_models_v2.py` - Alternative optimized version

**ML Module:**
- `python ml/scripts/train_models.py` - Core training logic
- `python ml/scripts/retrain_models.py` - Configurable pipeline

---

## 10. KEY METRICS & MODEL PERFORMANCE

### Latest Model Status (20260323_001525)

| Metric | XGBoost | LightGBM | Winner |
|--------|---------|----------|--------|
| ROC-AUC | 0.9400 ⭐ | 0.9365 | XGBoost |
| Precision | 0.8909 ⭐ | 0.6667 | XGBoost |
| Recall | 0.7977 | 0.8233 ⭐ | LightGBM |
| F1-Score | 0.8417 ⭐ | 0.7367 | XGBoost |
| Accuracy | 0.9953 ⭐ | 0.9907 | XGBoost |

**Recommendation:** XGBoost is the primary production model (better precision, ROC-AUC, F1-Score, accuracy)

---

## 11. DATA SOURCES & DOCUMENTATION

### Internal Documentation
- [COMPLETE_DATASET_OVERVIEW.md](COMPLETE_DATASET_OVERVIEW.md) - Dataset details
- [TRAINING-GUIDE.md](TRAINING-GUIDE.md) - Training instructions
- [docs/MODEL_COMPARISON_ANALYSIS.md](docs/MODEL_COMPARISON_ANALYSIS.md) - Model analysis
- [docs/DOCUMENTATION_INDEX.md](docs/DOCUMENTATION_INDEX.md) - All documentation index

### Dataset Origin
- **Source:** Kaggle - Binary Classification of Machine Failures
- **Total Samples:** 136,429
- **Features:** 5 numeric + 1 categorical + 5 failure mode flags
- **Target:** Machine failure (binary classification)

---

## Summary Statistics

| Item | Count |
|------|-------|
| **Total Trained Models** | 2 (XGBoost, LightGBM) |
| **Model Pickle Files** | 2 |
| **Configuration/Report Files** | 8 |
| **Training Scripts (root level)** | 14 |
| **Training Scripts (ml/scripts/)** | 17 |
| **Data Files** | 2 |
| **Feature Columns** | 14 (5 numeric + 1 categorical + 5 flags + target + ids) |
| **Engineered Features Created** | 20+ potential features |
| **Total Training Samples** | 109,143 |
| **Total Test Samples** | 27,286 |
| **Failure Mode Types** | 5 (TWF, HDF, PWF, OSF, RNF) |

---

**End of Project Structure Exploration Report**
