"""
Retrain ALL models using train_tr.csv (training set)
Ensures consistent feature preprocessing across all models
"""

import pickle
import pandas as pd
import numpy as np
import sys
from pathlib import Path
from sklearn.model_selection import train_test_split
from lightgbm import LGBMClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    roc_auc_score, accuracy_score, precision_score, recall_score, 
    f1_score, confusion_matrix, classification_report
)

# Add ml module
ml_path = Path(__file__).parent / 'ml'
sys.path.insert(0, str(ml_path))
from feature_engineering import FeatureEngineer

print("="*70)
print("RETRAINING ALL MODELS WITH train_tr.csv")
print("="*70)

# ============================================
# Step 1: Load Training Data
# ============================================
print("\n1. Loading training data...")
train_df = pd.read_csv('docs/train_tr.csv')
print(f"   ✅ Loaded: {len(train_df):,} samples")
print(f"   Columns: {list(train_df.columns)}")

# Check class distribution
print(f"\n   Class Distribution:")
print(f"   - No Failure (0): {(train_df['Machine failure'] == 0).sum():,}")
print(f"   - Failure (1): {(train_df['Machine failure'] == 1).sum():,}")
failure_rate = (train_df['Machine failure'] == 1).sum() / len(train_df) * 100
print(f"   - Failure Rate: {failure_rate:.2f}%")

# ============================================
# Step 2: Feature Engineering
# ============================================
print("\n2. Engineering features...")
X = train_df.copy()
y = X['Machine failure'].values

# Apply feature engineering
X = FeatureEngineer.engineer_features(X, include_advanced=True)

# Fix column names (remove brackets for LightGBM compatibility)
X.columns = X.columns.str.replace('[', '').str.replace(']', '')

# Encode categorical features
type_mapping = {'L': 0, 'M': 1, 'H': 2}
if 'Type' in X.columns:
    X['Type_encoded'] = X['Type'].map(type_mapping)
    X = X.drop('Type', axis=1)

if 'Product ID' in X.columns:
    X['ProductID_encoded'] = pd.factorize(X['Product ID'])[0]

# Keep Machine failure column (needed for model)
# X['Machine failure'] already exists

# Drop non-feature columns
X = X.drop(['id', 'Product ID'], axis=1, errors='ignore')

# Select numeric features only
X = X.select_dtypes(include=[np.number])

print(f"   ✅ Features engineered: {X.shape[0]:,} x {X.shape[1]} features")
print(f"   Feature columns: {list(X.columns)}")

# ============================================
# Step 3: Train LightGBM Model
# ============================================
print("\n3. Training LightGBM model...")
print("   Hyperparameters:")
print("   - n_estimators: 1000")
print("   - learning_rate: 0.05")
print("   - max_depth: 7")
print("   - min_child_samples: 20")
print("   - class_weight: balanced")

lgb_model = LGBMClassifier(
    n_estimators=500,           # Reduced from 1000
    learning_rate=0.01,         # Lower learning rate for better generalization
    max_depth=5,                # Reduced from 7 to prevent overfitting
    min_child_samples=50,       # Increased from 20 to regularize
    num_leaves=15,              # More conservative
    class_weight='balanced',
    reg_alpha=0.5,              # L1 regularization
    reg_lambda=1.0,             # L2 regularization
    random_state=42,
    n_jobs=-1,
    verbose=-1
)

lgb_model.fit(X, y)
print("   ✅ LightGBM trained")

# Save model
pickle.dump(lgb_model, open('ml/models/lightgbm_model.pkl', 'wb'))
print("   ✅ LightGBM model saved")

# Evaluate on training set
lgb_train_proba = lgb_model.predict_proba(X)[:, 1]
lgb_train_pred = lgb_model.predict(X)

lgb_metrics = {
    'ROC-AUC': roc_auc_score(y, lgb_train_proba),
    'Accuracy': accuracy_score(y, lgb_train_pred),
    'Precision': precision_score(y, lgb_train_pred),
    'Recall': recall_score(y, lgb_train_pred),
    'F1': f1_score(y, lgb_train_pred)
}

print(f"\n   LightGBM Training Metrics:")
for metric, value in lgb_metrics.items():
    print(f"   - {metric}: {value:.4f}")

# ============================================
# Step 4: Train XGBoost Model
# ============================================
print("\n4. Training XGBoost model...")
print("   Hyperparameters:")
print("   - n_estimators: 1000")
print("   - learning_rate: 0.05")
print("   - max_depth: 6")
print("   - scale_pos_weight: (calculated from class imbalance)")

# Calculate scale_pos_weight for imbalanced data
scale_pos = (y == 0).sum() / (y == 1).sum()

xgb_model = XGBClassifier(
    n_estimators=500,           # Reduced from 1000
    learning_rate=0.01,         # Lower learning rate
    max_depth=4,                # Reduced from 6
    min_child_weight=10,        # Increased regularization
    gamma=1.0,                  # Minimum loss reduction
    reg_alpha=0.5,              # L1 regularization
    reg_lambda=1.0,             # L2 regularization
    scale_pos_weight=scale_pos,
    random_state=42,
    n_jobs=-1,
    verbosity=0
)

xgb_model.fit(X, y)
print("   ✅ XGBoost trained")

# Save model
pickle.dump(xgb_model, open('ml/models/xgboost_model.pkl', 'wb'))
print("   ✅ XGBoost model saved")

# Evaluate on training set
xgb_train_proba = xgb_model.predict_proba(X)[:, 1]
xgb_train_pred = xgb_model.predict(X)

xgb_metrics = {
    'ROC-AUC': roc_auc_score(y, xgb_train_proba),
    'Accuracy': accuracy_score(y, xgb_train_pred),
    'Precision': precision_score(y, xgb_train_pred),
    'Recall': recall_score(y, xgb_train_pred),
    'F1': f1_score(y, xgb_train_pred)
}

print(f"\n   XGBoost Training Metrics:")
for metric, value in xgb_metrics.items():
    print(f"   - {metric}: {value:.4f}")

# ============================================
# Step 5: Validate on train_te.csv
# ============================================
print("\n5. Validating on train_te.csv...")
test_df = pd.read_csv('docs/train_te.csv')
X_test = test_df.copy()
y_test = X_test['Machine failure'].values

# Apply same feature engineering
X_test = FeatureEngineer.engineer_features(X_test, include_advanced=True)

# Fix column names (remove brackets for LightGBM compatibility)
X_test.columns = X_test.columns.str.replace('[', '').str.replace(']', '')

type_mapping = {'L': 0, 'M': 1, 'H': 2}
if 'Type' in X_test.columns:
    X_test['Type_encoded'] = X_test['Type'].map(type_mapping)
    X_test = X_test.drop('Type', axis=1)

if 'Product ID' in X_test.columns:
    X_test['ProductID_encoded'] = pd.factorize(X_test['Product ID'])[0]

X_test = X_test.drop(['id', 'Product ID'], axis=1, errors='ignore')
X_test = X_test.select_dtypes(include=[np.number])

print(f"   Validation set: {len(X_test):,} samples")

# LightGBM validation
lgb_val_proba = lgb_model.predict_proba(X_test)[:, 1]
lgb_val_pred = lgb_model.predict(X_test)

lgb_val_metrics = {
    'ROC-AUC': roc_auc_score(y_test, lgb_val_proba),
    'Accuracy': accuracy_score(y_test, lgb_val_pred),
    'Precision': precision_score(y_test, lgb_val_pred),
    'Recall': recall_score(y_test, lgb_val_pred),
    'F1': f1_score(y_test, lgb_val_pred)
}

print(f"\n   LightGBM Validation Metrics:")
for metric, value in lgb_val_metrics.items():
    print(f"   - {metric}: {value:.4f}")

# XGBoost validation
xgb_val_proba = xgb_model.predict_proba(X_test)[:, 1]
xgb_val_pred = xgb_model.predict(X_test)

xgb_val_metrics = {
    'ROC-AUC': roc_auc_score(y_test, xgb_val_proba),
    'Accuracy': accuracy_score(y_test, xgb_val_pred),
    'Precision': precision_score(y_test, xgb_val_pred),
    'Recall': recall_score(y_test, xgb_val_pred),
    'F1': f1_score(y_test, xgb_val_pred)
}

print(f"\n   XGBoost Validation Metrics:")
for metric, value in xgb_val_metrics.items():
    print(f"   - {metric}: {value:.4f}")

# ============================================
# Step 6: Probability Analysis
# ============================================
print("\n" + "="*70)
print("PROBABILITY DISTRIBUTION ANALYSIS")
print("="*70)

print(f"\nLightGBM Validation Probabilities:")
print(f"  Mean: {lgb_val_proba.mean():.4f}")
print(f"  Median: {np.median(lgb_val_proba):.4f}")
print(f"  Min: {lgb_val_proba.min():.4f}")
print(f"  Max: {lgb_val_proba.max():.4f}")
print(f"  Std: {lgb_val_proba.std():.4f}")

print(f"\nXGBoost Validation Probabilities:")
print(f"  Mean: {xgb_val_proba.mean():.4f}")
print(f"  Median: {np.median(xgb_val_proba):.4f}")
print(f"  Min: {xgb_val_proba.min():.4f}")
print(f"  Max: {xgb_val_proba.max():.4f}")
print(f"  Std: {xgb_val_proba.std():.4f}")

# ============================================
# Step 7: Summary
# ============================================
print("\n" + "="*70)
print("RETRAINING COMPLETE")
print("="*70)

print(f"\n✅ Both models retrained with train_tr.csv")
print(f"   - LightGBM saved: ml/models/lightgbm_model.pkl")
print(f"   - XGBoost saved: ml/models/xgboost_model.pkl")

print(f"\n📊 Model Performance Summary:")
print(f"\n   LightGBM:")
print(f"   - Training ROC-AUC: {lgb_metrics['ROC-AUC']:.4f}")
print(f"   - Validation ROC-AUC: {lgb_val_metrics['ROC-AUC']:.4f}")
print(f"   - Validation Accuracy: {lgb_val_metrics['Accuracy']:.4f}")

print(f"\n   XGBoost:")
print(f"   - Training ROC-AUC: {xgb_metrics['ROC-AUC']:.4f}")
print(f"   - Validation ROC-AUC: {xgb_val_metrics['ROC-AUC']:.4f}")
print(f"   - Validation Accuracy: {xgb_val_metrics['Accuracy']:.4f}")

print(f"\n✅ Ready to generate new submissions with retrained models!")
