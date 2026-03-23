"""
Generate submission.csv with test.csv including id and Machine failure predictions
Binary classification: 0 = No Failure, 1 = Failure
"""

import pickle
import pandas as pd
import numpy as np
import os
import sys
from pathlib import Path

# Add ml module to path
ml_path = Path(__file__).parent / 'ml'
sys.path.insert(0, str(ml_path))
from feature_engineering import FeatureEngineer

print("="*70)
print("SUBMISSION.CSV GENERATION - With Machine Failure Predictions")
print("="*70)

# ============================================
# Step 1: Load Models
# ============================================
print("\n📦 Loading trained models...")
lgb_model = pickle.load(open('ml/models/lightgbm_model.pkl', 'rb'))
xgb_model = pickle.load(open('ml/models/xgboost_model.pkl', 'rb'))
print("✅ Models loaded")

# ============================================
# Step 2: Load Test Data
# ============================================
print("\n📊 Loading test.csv...")
test_df = pd.read_csv('docs/test.csv')
ids = test_df['id'].values
print(f"✅ Loaded: {test_df.shape[0]:,} samples")

# ============================================
# Step 3: Engineer Features
# ============================================
print("\n🔧 Engineering features...")
X_test = test_df.copy()
X_test = FeatureEngineer.engineer_features(X_test, include_advanced=True)

# Encode categorical features
type_mapping = {'L': 0, 'M': 1, 'H': 2}
if 'Type' in X_test.columns:
    X_test['Type_encoded'] = X_test['Type'].map(type_mapping)
    X_test = X_test.drop('Type', axis=1)

if 'Product ID' in X_test.columns:
    X_test['ProductID_encoded'] = pd.factorize(X_test['Product ID'])[0]

# Add Machine failure placeholder (required for model features)
X_test['Machine failure'] = 0

# Drop non-feature columns
X_test = X_test.drop(['id', 'Product ID'], axis=1, errors='ignore')
X_test = X_test.select_dtypes(include=[np.number])

print(f"✅ Features engineered: {X_test.shape}")

# ============================================
# Step 4: Generate Predictions
# ============================================
print("\n🤖 Generating predictions with LightGBM...")
proba = lgb_model.predict_proba(X_test)
failure_prob = proba[:, 1]

print(f"✅ Predictions generated")
print(f"   Probability range: [{failure_prob.min():.4f}, {failure_prob.max():.4f}]")
print(f"   Mean: {failure_prob.mean():.4f}, Median: {np.median(failure_prob):.4f}")

# ============================================
# Step 5: Convert to Binary Predictions (0.5 threshold)
# ============================================
print("\n⚙️  Converting to binary predictions (threshold = 0.5)...")
machine_failure_predictions = (failure_prob >= 0.5).astype(int)

# Statistics
no_failure = (machine_failure_predictions == 0).sum()
failure = (machine_failure_predictions == 1).sum()

print(f"✅ Binary predictions generated:")
print(f"   No Failure (0): {no_failure:,} machines ({no_failure/len(machine_failure_predictions)*100:.1f}%)")
print(f"   Failure (1): {failure:,} machines ({failure/len(machine_failure_predictions)*100:.1f}%)")

# ============================================
# Step 6: Create Submission
# ============================================
print("\n📝 Creating submission.csv...")
submission_df = pd.DataFrame({
    'id': ids,
    'Machine failure': machine_failure_predictions
})

print(f"✅ Submission DataFrame created: {submission_df.shape}")
print(f"\nFirst 20 rows:")
print(submission_df.head(20))

# ============================================
# Step 7: Save Submission
# ============================================
print("\n💾 Saving submission.csv...")
submission_df.to_csv('submission.csv', index=False)

file_size = os.path.getsize('submission.csv')
print(f"✅ submission.csv saved")
print(f"   File size: {file_size:,} bytes")
print(f"   Rows: {len(submission_df):,}")
print(f"   Columns: {', '.join(submission_df.columns)}")

print("\n" + "="*70)
print(f"✅ Successfully generated submission.csv")
print(f"   Dataset: test.csv (90,954 samples)")
print(f"   Model: LightGBM")
print(f"   Format: id, Machine failure (binary: 0 or 1)")
print("="*70)
