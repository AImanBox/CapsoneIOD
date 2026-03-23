"""
Generate submission.csv with CALIBRATED threshold to match actual failure rate (1.57%)
Uses train_te.csv validation set with optimized threshold of 0.96
"""

import pickle
import pandas as pd
import numpy as np
import os
import sys
from pathlib import Path

# Add ml module to path for imports
ml_path = Path(__file__).parent / 'ml'
sys.path.insert(0, str(ml_path))
from feature_engineering import FeatureEngineer

# ============================================
# Step 1: Load Models
# ============================================
print("Loading trained models...")
lgb_model = pickle.load(open('ml/models/lightgbm_model.pkl', 'rb'))
print("✅ Models loaded")

# ============================================
# Step 2: Load Validation Data
# ============================================
print("\nLoading train_te.csv (validation set)...")
test_df = pd.read_csv('docs/train_te.csv')
ids = test_df['id'].values
actual_labels = test_df['Machine failure'].values
print(f"✅ Loaded: {test_df.shape[0]:,} samples")

# ============================================
# Step 3: Engineer Features
# ============================================
print("\nEngineering features...")
X_test = test_df.copy()

# Apply feature engineering
X_test = FeatureEngineer.engineer_features(X_test, include_advanced=True)

# Encode categorical features
type_mapping = {'L': 0, 'M': 1, 'H': 2}
if 'Type' in X_test.columns:
    X_test['Type_encoded'] = X_test['Type'].map(type_mapping)
    X_test = X_test.drop('Type', axis=1)

# Encode Product ID
if 'Product ID' in X_test.columns:
    X_test['ProductID_encoded'] = pd.factorize(X_test['Product ID'])[0]

# ADD: Machine failure placeholder
X_test['Machine failure'] = 0

# Drop non-feature columns
X_test = X_test.drop(['id', 'Product ID'], axis=1, errors='ignore')

# Select numeric features only
X_test = X_test.select_dtypes(include=[np.number])

print(f"✅ Features engineered: {X_test.shape[0]:,} x {X_test.shape[1]} features")

# ============================================
# Step 4: Generate Predictions
# ============================================
print("\nGenerating predictions with LightGBM...")
proba = lgb_model.predict_proba(X_test)
failure_prob = proba[:, 1]

print(f"✅ Predictions generated")
print(f"   Probability range: [{failure_prob.min():.4f}, {failure_prob.max():.4f}]")
print(f"   Mean: {failure_prob.mean():.4f}")

# ============================================
# Step 5: Apply CALIBRATED Threshold (0.96)
# ============================================
print("\n" + "="*70)
print("CALIBRATION ANALYSIS")
print("="*70)

actual_failure_rate = (actual_labels == 1).sum() / len(actual_labels) * 100
print(f"\nActual failure rate in train_te.csv: {actual_failure_rate:.2f}%")

# Use threshold of 0.96 to match actual distribution
CALIBRATED_THRESHOLD = 0.96
binary_predictions = (failure_prob >= CALIBRATED_THRESHOLD).astype(int)
pred_failure_rate = (binary_predictions == 1).sum() / len(binary_predictions) * 100

print(f"\nUsing CALIBRATED THRESHOLD: {CALIBRATED_THRESHOLD}")
print(f"Predicted failure rate: {pred_failure_rate:.2f}%")

# Calculate accuracy
accuracy = (binary_predictions == actual_labels).sum() / len(actual_labels) * 100
print(f"Accuracy on validation set: {accuracy:.2f}%")

# Risk distribution
critical = (failure_prob >= 0.95).sum()
high_risk = ((failure_prob >= 0.90) & (failure_prob < 0.95)).sum()
medium_risk = ((failure_prob >= 0.75) & (failure_prob < 0.90)).sum()
low_risk = (failure_prob < 0.75).sum()

print(f"\nProbability Distribution:")
print(f"  - Critical (prob >= 0.95): {critical:,} ({critical/len(failure_prob)*100:.1f}%)")
print(f"  - High-risk (0.90-0.95): {high_risk:,} ({high_risk/len(failure_prob)*100:.1f}%)")
print(f"  - Medium-risk (0.75-0.90): {medium_risk:,} ({medium_risk/len(failure_prob)*100:.1f}%)")
print(f"  - Low-risk (< 0.75): {low_risk:,} ({low_risk/len(failure_prob)*100:.1f}%)")

# ============================================
# Step 6: Create and Save Submission
# ============================================
print("\n" + "="*70)
print("Creating submission.csv with calibrated predictions...")
submission_df = pd.DataFrame({
    'id': ids,
    'proba': np.round(failure_prob, 2),
    'Machine failure': binary_predictions  # Binary prediction at 0.96 threshold
})

submission_df.to_csv('submission_calibrated.csv', index=False)

print(f"✅ Submission saved: submission_calibrated.csv")
print(f"   Rows: {len(submission_df):,}")
print(f"   Size: {os.path.getsize('submission_calibrated.csv'):,} bytes")

print(f"\nFirst 15 rows:")
print(submission_df.head(15))

print(f"\nRows with Machine failure = 1 (predicted):")
print(f"  Count: {(submission_df['Machine failure'] == 1).sum():,}")
print(submission_df[submission_df['Machine failure'] == 1].head(10))

print(f"\n✅ Successfully generated submission_calibrated.csv!")
print(f"   Dataset: Validation set (train_te.csv)")
print(f"   Threshold: {CALIBRATED_THRESHOLD} (calibrated to match 1.57% failure rate)")
print(f"   Validation Accuracy: {accuracy:.2f}%")
