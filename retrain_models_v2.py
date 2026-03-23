"""
Retrain models with less aggressive regularization
"""

import pandas as pd
import numpy as np
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from lightgbm import LGBMClassifier
from xgboost import XGBClassifier
import warnings
warnings.filterwarnings('ignore')

import sys
from pathlib import Path
ml_path = Path(__file__).parent / 'ml'
sys.path.insert(0, str(ml_path))
from feature_engineering import FeatureEngineer

print("="*70)
print("Retraining Models with Optimized Hyperparameters")
print("="*70)

# Load data
print("\nLoading train_tr.csv...")
train_df = pd.read_csv('docs/train_tr.csv')
print(f"  Shape: {train_df.shape}")
print(f"  Failures: {(train_df['Machine failure'] == 1).sum()} ({(train_df['Machine failure'] == 1).sum()/len(train_df)*100:.2f}%)")

# Feature engineering
print("\nEngineering features...")
X = train_df.copy()
X = FeatureEngineer.engineer_features(X, include_advanced=True)
X.columns = X.columns.str.replace('[', '').str.replace(']', '')

type_mapping = {'L': 0, 'M': 1, 'H': 2}
if 'Type' in X.columns:
    X['Type_encoded'] = X['Type'].map(type_mapping)
    X = X.drop('Type', axis=1)

if 'Product ID' in X.columns:
    X['ProductID_encoded'] = pd.factorize(X['Product ID'])[0]

y = X['Machine failure']
X = X.drop(['id', 'Product ID', 'Machine failure'], axis=1, errors='ignore')
X = X.select_dtypes(include=[np.number])

print(f"  Features: {X.shape[1]}")
print(f"  Samples: {X.shape[0]}")

# Train LightGBM with less regularization
print("\n" + "="*70)
print("Training LightGBM...")
print("="*70)

lgb_params = {
    'n_estimators': 200,
    'learning_rate': 0.05,
    'max_depth': 7,
    'num_leaves': 31,
    'min_child_samples': 20,
    'reg_alpha': 0.1,  # Reduced from 0.5
    'reg_lambda': 0.1,  # Reduced from 1.0
    'scale_pos_weight': 62.47,  # ~1.58% failure rate
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'random_state': 42,
    'verbose': -1
}

lgb_model = LGBMClassifier(**lgb_params)
lgb_model.fit(X, y)

# Get probabilities on training set
lgb_proba = lgb_model.predict_proba(X)[:, 1]
print(f"\nTraining Set Probabilities:")
print(f"  Min: {lgb_proba.min():.8f}")
print(f"  Max: {lgb_proba.max():.8f}")
print(f"  Mean: {lgb_proba.mean():.8f}")
print(f"  Std: {lgb_proba.std():.8f}")
print(f"  Unique values: {len(np.unique(lgb_proba))}")

# Check accuracy
lgb_pred = lgb_model.predict(X)
lgb_acc = (lgb_pred == y).sum() / len(y)
print(f"\nTraining Accuracy: {lgb_acc:.4f} ({(lgb_pred == 1).sum()}/{len(y)} predicted failures)")

# Save model
pickle.dump(lgb_model, open('ml/models/lightgbm_model.pkl', 'wb'))
print("✅ Saved: ml/models/lightgbm_model.pkl")

# Train XGBoost with less regularization
print("\n" + "="*70)
print("Training XGBoost...")
print("="*70)

xgb_params = {
    'n_estimators': 200,
    'learning_rate': 0.05,
    'max_depth': 5,
    'min_child_weight': 5,  # Reduced from 10
    'gamma': 0.5,  # Reduced from 1.0
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'reg_alpha': 0.1,  # Reduced from 0.5
    'reg_lambda': 0.1,  # Reduced from 1.0
    'scale_pos_weight': 62.47,  # ~1.58% failure rate
    'random_state': 42,
    'verbosity': 0
}

xgb_model = XGBClassifier(**xgb_params)
xgb_model.fit(X, y)

# Get probabilities on training set
xgb_proba = xgb_model.predict_proba(X)[:, 1]
print(f"\nTraining Set Probabilities:")
print(f"  Min: {xgb_proba.min():.8f}")
print(f"  Max: {xgb_proba.max():.8f}")
print(f"  Mean: {xgb_proba.mean():.8f}")
print(f"  Std: {xgb_proba.std():.8f}")
print(f"  Unique values: {len(np.unique(xgb_proba))}")

# Check accuracy
xgb_pred = xgb_model.predict(X)
xgb_acc = (xgb_pred == y).sum() / len(y)
print(f"\nTraining Accuracy: {xgb_acc:.4f} ({(xgb_pred == 1).sum()}/{len(y)} predicted failures)")

# Save model
pickle.dump(xgb_model, open('ml/models/xgboost_model.pkl', 'wb'))
print("✅ Saved: ml/models/xgboost_model.pkl")

print("\n" + "="*70)
print("✅ Models retrained successfully!")
print("="*70)
