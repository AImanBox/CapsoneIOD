#!/usr/bin/env python3
"""
@file retrain_models_comprehensive.py
@description Comprehensive model retraining script with train_tr.csv and train_te.csv
@module retrain
@created 2026-03-23

Retrains all AI models (XGBoost, LightGBM) with the official training dataset split.
- Training: train_tr.csv (80% of data)
- Validation/Test: train_te.csv (20% of data)
- Includes feature engineering, model evaluation, and configuration updates
"""

import pickle
import json
import pandas as pd
import numpy as np
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Tuple
import warnings

# Suppress warnings
warnings.filterwarnings('ignore')

# Add ml module to path
ml_path = Path(__file__).parent / 'ml'
sys.path.insert(0, str(ml_path))

from feature_engineering import FeatureEngineer
from sklearn.metrics import (
    roc_auc_score, accuracy_score, precision_score, recall_score, 
    f1_score, confusion_matrix, classification_report, roc_curve
)
from lightgbm import LGBMClassifier
from xgboost import XGBClassifier

# ============================================
# CONFIGURATION
# ============================================
CONFIG = {
    'data_dir': 'docs',
    'train_file': 'docs/train_tr.csv',
    'test_file': 'docs/train_te.csv',
    'models_dir': 'ml/models',
    'test_size': 0.2,
    'random_state': 42,
    'include_advanced_features': True,
    'models': {
        'lightgbm': {
            'file': 'ml/models/lightgbm_model.pkl',
            'params': {
                'n_estimators': 200,
                'learning_rate': 0.05,
                'max_depth': 7,
                'min_child_samples': 20,
                'num_leaves': 31,
                'class_weight': 'balanced',
                'reg_alpha': 0.1,
                'reg_lambda': 0.1,
                'random_state': 42,
                'n_jobs': -1,
                'verbose': -1
            }
        },
        'xgboost': {
            'file': 'ml/models/xgboost_model.pkl',
            'params': {
                'n_estimators': 200,
                'learning_rate': 0.1,
                'max_depth': 8,
                'min_child_weight': 5,
                'colsample_bytree': 0.8,
                'subsample': 0.8,
                'gamma': 0,
                'reg_alpha': 0.1,
                'reg_lambda': 1.0,
                'random_state': 42,
                'n_jobs': -1,
                'verbosity': 0
            }
        }
    }
}

print("=" * 80)
print("COMPREHENSIVE MODEL RETRAINING")
print("=" * 80)
print(f"Training Data: {CONFIG['train_file']}")
print(f"Test Data: {CONFIG['test_file']}")
print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 80)

# ============================================
# STEP 1: LOAD AND EXPLORE DATA
# ============================================
print("\n[1/6] LOADING DATA")
print("-" * 80)

# Load training data
print("Loading training data (train_tr.csv)...")
train_df = pd.read_csv(CONFIG['train_file'])
print(f"✅ Loaded: {len(train_df):,} rows × {len(train_df.columns)} columns")

# Load test data
print("Loading test data (train_te.csv)...")
test_df = pd.read_csv(CONFIG['test_file'])
print(f"✅ Loaded: {len(test_df):,} rows × {len(test_df.columns)} columns")

# Validate data
print("\nData Validation:")
print(f"  Train columns: {list(train_df.columns)}")
print(f"  Test columns: {list(test_df.columns)}")

# Class distribution
print("\nClass Distribution:")
train_target = train_df['Machine failure']
test_target = test_df['Machine failure']

train_pos = (train_target == 1).sum()
train_neg = (train_target == 0).sum()
test_pos = (test_target == 1).sum()
test_neg = (test_target == 0).sum()

print(f"\n  Training Set:")
print(f"    - Negative (0): {train_neg:,} ({train_neg/len(train_df)*100:.2f}%)")
print(f"    - Positive (1): {train_pos:,} ({train_pos/len(train_df)*100:.2f}%)")
print(f"    - Failure Rate: {train_pos/len(train_df)*100:.2f}%")

print(f"\n  Test Set:")
print(f"    - Negative (0): {test_neg:,} ({test_neg/len(test_df)*100:.2f}%)")
print(f"    - Positive (1): {test_pos:,} ({test_pos/len(test_df)*100:.2f}%)")
print(f"    - Failure Rate: {test_pos/len(test_df)*100:.2f}%")

# ============================================
# STEP 2: FEATURE ENGINEERING
# ============================================
print("\n[2/6] FEATURE ENGINEERING")
print("-" * 80)

print("Engineering features (Training Set)...")
X_train = train_df.copy()
y_train = X_train.pop('Machine failure').values

X_train = FeatureEngineer.engineer_features(
    X_train, 
    include_advanced=CONFIG['include_advanced_features']
)

# Clean column names for LightGBM compatibility
X_train.columns = X_train.columns.str.replace('[', '').str.replace(']', '')

# Encode categorical features
type_mapping = {'L': 0, 'M': 1, 'H': 2}
if 'Type' in X_train.columns:
    X_train['Type_encoded'] = X_train['Type'].map(type_mapping)
    X_train = X_train.drop('Type', axis=1)

if 'Product ID' in X_train.columns:
    X_train['ProductID_encoded'] = pd.factorize(X_train['Product ID'])[0]
    X_train = X_train.drop('Product ID', axis=1)

# Drop non-numeric columns
X_train = X_train.drop(['id'], axis=1, errors='ignore')
X_train = X_train.select_dtypes(include=[np.number])

print(f"✅ Features engineered: {X_train.shape[0]:,} rows × {X_train.shape[1]} features")
print(f"   Feature columns: {list(X_train.columns)}")

# Engineer test features (same transformations)
print("\nEngineering features (Test Set)...")
X_test = test_df.copy()
y_test = X_test.pop('Machine failure').values

X_test = FeatureEngineer.engineer_features(
    X_test,
    include_advanced=CONFIG['include_advanced_features']
)

X_test.columns = X_test.columns.str.replace('[', '').str.replace(']', '')

if 'Type' in X_test.columns:
    X_test['Type_encoded'] = X_test['Type'].map(type_mapping)
    X_test = X_test.drop('Type', axis=1)

if 'Product ID' in X_test.columns:
    X_test['ProductID_encoded'] = pd.factorize(X_test['Product ID'])[0]
    X_test = X_test.drop('Product ID', axis=1)

X_test = X_test.drop(['id'], axis=1, errors='ignore')
X_test = X_test.select_dtypes(include=[np.number])

print(f"✅ Features engineered: {X_test.shape[0]:,} rows × {X_test.shape[1]} features")

# Align features
common_cols = sorted(set(X_train.columns) & set(X_test.columns))
X_train = X_train[common_cols]
X_test = X_test[common_cols]

print(f"\n✅ Aligned features: {len(common_cols)} features")

# ============================================
# STEP 3: TRAIN MODELS
# ============================================
print("\n[3/6] TRAINING MODELS")
print("-" * 80)

models = {}
metrics = {}

# Calculate scale_pos_weight for imbalanced data (for XGBoost)
scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()
print(f"Class imbalance ratio (scale_pos_weight for XGBoost): {scale_pos_weight:.2f}")

# -------- LightGBM --------
print("\n[3A] Training LightGBM Model...")
print("Hyperparameters:")
for param, value in CONFIG['models']['lightgbm']['params'].items():
    print(f"  - {param}: {value}")

lgb_model = LGBMClassifier(**CONFIG['models']['lightgbm']['params'])
lgb_model.fit(X_train, y_train)

print("✅ LightGBM model trained")

# Save LightGBM
Path(CONFIG['models_dir']).mkdir(parents=True, exist_ok=True)
pickle.dump(lgb_model, open(CONFIG['models']['lightgbm']['file'], 'wb'))
print(f"✅ LightGBM model saved to {CONFIG['models']['lightgbm']['file']}")

models['lightgbm'] = lgb_model

# -------- XGBoost --------
print("\n[3B] Training XGBoost Model...")
print("Hyperparameters:")
xgb_params = CONFIG['models']['xgboost']['params'].copy()
xgb_params['scale_pos_weight'] = scale_pos_weight
for param, value in xgb_params.items():
    print(f"  - {param}: {value}")

xgb_model = XGBClassifier(**xgb_params)
xgb_model.fit(X_train, y_train)

print("✅ XGBoost model trained")

# Save XGBoost
pickle.dump(xgb_model, open(CONFIG['models']['xgboost']['file'], 'wb'))
print(f"✅ XGBoost model saved to {CONFIG['models']['xgboost']['file']}")

models['xgboost'] = xgb_model

# ============================================
# STEP 4: EVALUATE ON TRAINING SET
# ============================================
print("\n[4/6] EVALUATING ON TRAINING SET")
print("-" * 80)

def evaluate_model(model, X, y, set_name: str = "Training"):
    """Evaluate model and return metrics."""
    y_pred = model.predict(X)
    y_proba = model.predict_proba(X)[:, 1]
    
    metrics_dict = {
        'ROC-AUC': roc_auc_score(y, y_proba),
        'Accuracy': accuracy_score(y, y_pred),
        'Precision': precision_score(y, y_pred, zero_division=0),
        'Recall': recall_score(y, y_pred, zero_division=0),
        'F1-Score': f1_score(y, y_pred, zero_division=0),
    }
    
    print(f"\n{set_name} Set Metrics:")
    for metric_name, metric_val in metrics_dict.items():
        print(f"  - {metric_name}: {metric_val:.4f}")
    
    return metrics_dict, y_pred, y_proba

# Evaluate LightGBM on training set
print("\n[LightGBM - Training Set]")
lgb_train_metrics, lgb_train_pred, lgb_train_proba = evaluate_model(
    lgb_model, X_train, y_train, "Training"
)

# Evaluate XGBoost on training set
print("\n[XGBoost - Training Set]")
xgb_train_metrics, xgb_train_pred, xgb_train_proba = evaluate_model(
    xgb_model, X_train, y_train, "Training"
)

# ============================================
# STEP 5: VALIDATE ON TEST SET (train_te.csv)
# ============================================
print("\n[5/6] VALIDATING ON TEST SET (train_te.csv)")
print("-" * 80)

# Evaluate LightGBM on test set
print("\n[LightGBM - Test Set]")
lgb_test_metrics, lgb_test_pred, lgb_test_proba = evaluate_model(
    lgb_model, X_test, y_test, "Test"
)

# Evaluate XGBoost on test set
print("\n[XGBoost - Test Set]")
xgb_test_metrics, xgb_test_pred, xgb_test_proba = evaluate_model(
    xgb_model, X_test, y_test, "Test"
)

# ============================================
# STEP 6: UPDATE CONFIGURATION FILE
# ============================================
print("\n[6/6] UPDATING CONFIGURATION")
print("-" * 80)

# Load existing config or create new one
config_file = Path('ml/models/ML_models.json')
if config_file.exists():
    with open(config_file, 'r') as f:
        ml_config = json.load(f)
else:
    ml_config = {}

# Update configuration with new metrics and training info
timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

ml_config['last_updated'] = timestamp
ml_config['training_date'] = timestamp
ml_config['data_split'] = {
    'training': 'train_tr.csv',
    'test': 'train_te.csv',
    'split_ratio': '80-20',
    'total_samples': len(train_df) + len(test_df)
}

# LightGBM Configuration
ml_config['models'] = ml_config.get('models', {})
ml_config['models']['lightgbm'] = {
    'name': 'LightGBM',
    'type': 'GradientBoosting',
    'file': CONFIG['models']['lightgbm']['file'],
    'hyperparameters': CONFIG['models']['lightgbm']['params'],
    'training_metrics': lgb_train_metrics,
    'test_metrics': lgb_test_metrics,
    'feature_count': X_train.shape[1],
    'training_samples': len(X_train),
    'test_samples': len(X_test)
}

# XGBoost Configuration
xgb_params_full = CONFIG['models']['xgboost']['params'].copy()
xgb_params_full['scale_pos_weight'] = scale_pos_weight

ml_config['models']['xgboost'] = {
    'name': 'XGBoost',
    'type': 'GradientBoosting',
    'file': CONFIG['models']['xgboost']['file'],
    'hyperparameters': xgb_params_full,
    'training_metrics': xgb_train_metrics,
    'test_metrics': xgb_test_metrics,
    'feature_count': X_train.shape[1],
    'training_samples': len(X_train),
    'test_samples': len(X_test)
}

# Save updated configuration
Path('ml/models').mkdir(parents=True, exist_ok=True)
with open(config_file, 'w') as f:
    json.dump(ml_config, f, indent=2)

print(f"✅ Configuration updated and saved to {config_file}")

# ============================================
# SUMMARY REPORT
# ============================================
print("\n" + "=" * 80)
print("RETRAINING COMPLETE - SUMMARY REPORT")
print("=" * 80)

summary = {
    'timestamp': timestamp,
    'training_file': CONFIG['train_file'],
    'test_file': CONFIG['test_file'],
    'training_samples': len(X_train),
    'test_samples': len(X_test),
    'feature_count': X_train.shape[1],
    'models': {
        'lightgbm': {
            'train_auc': f"{lgb_train_metrics['ROC-AUC']:.4f}",
            'test_auc': f"{lgb_test_metrics['ROC-AUC']:.4f}",
            'status': '✅ TRAINED'
        },
        'xgboost': {
            'train_auc': f"{xgb_train_metrics['ROC-AUC']:.4f}",
            'test_auc': f"{xgb_test_metrics['ROC-AUC']:.4f}",
            'status': '✅ TRAINED'
        }
    }
}

print("\n📊 MODEL PERFORMANCE SUMMARY:")
print("\n  LightGBM:")
print(f"    - Training ROC-AUC: {lgb_train_metrics['ROC-AUC']:.4f}")
print(f"    - Test ROC-AUC:     {lgb_test_metrics['ROC-AUC']:.4f}")
print(f"    - Training F1:      {lgb_train_metrics['F1-Score']:.4f}")
print(f"    - Test F1:          {lgb_test_metrics['F1-Score']:.4f}")

print("\n  XGBoost:")
print(f"    - Training ROC-AUC: {xgb_train_metrics['ROC-AUC']:.4f}")
print(f"    - Test ROC-AUC:     {xgb_test_metrics['ROC-AUC']:.4f}")
print(f"    - Training F1:      {xgb_train_metrics['F1-Score']:.4f}")
print(f"    - Test F1:          {xgb_test_metrics['F1-Score']:.4f}")

print("\n📁 FILES UPDATED:")
print(f"  - {CONFIG['models']['lightgbm']['file']}")
print(f"  - {CONFIG['models']['xgboost']['file']}")
print(f"  - {config_file}")

print("\n✅ PROJECT REFRESH COMPLETE!")
print("=" * 80)

# Save summary to JSON
summary_file = Path('ml/models/TRAINING_REPORT_' + datetime.now().strftime('%Y%m%d_%H%M%S') + '.json')
with open(summary_file, 'w') as f:
    json.dump(summary, f, indent=2)

print(f"\n📋 Training report saved to: {summary_file}")

sys.exit(0)
