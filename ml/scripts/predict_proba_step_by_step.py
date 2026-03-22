"""
@file predict_proba_step_by_step.py
@description Simple step-by-step guide using predict_proba for XGBoost and LightGBM
@module ml.scripts.predict_proba_step_by_step
@created 2026-03-22

STEP-BY-STEP WORKFLOW:
1. Load and prepare test data
2. Load XGBoost model
3. Use XGBoost.predict_proba()
4. Load LightGBM model
5. Use LightGBM.predict_proba()
6. Compare results between models
7. Save predictions
"""

import sys
import pickle
import json
from pathlib import Path
from typing import Dict

import pandas as pd
import numpy as np
import xgboost as xgb
import lightgbm as lgb

# Add to path for feature engineering
sys.path.insert(0, str(Path(__file__).parent.parent))
from feature_engineering import FeatureEngineer

# ============================================================================
# STEP 1: LOAD TEST DATA (Same way as during training)
# ============================================================================
print("=" * 80)
print("STEP 1: Loading test data (prepared for model inference)")
print("=" * 80)

# Path setup
DATA_DIR = Path('docs')
MODELS_DIR = Path('ml/models')

# Load test data that was created during training
test_data_path = DATA_DIR / 'test.csv'
if not test_data_path.exists():
    print(f"❌ Test data not found at {test_data_path}")
    print("   Run retrain_models.py first to prepare train/test splits")
    sys.exit(1)

test_df = pd.read_csv(test_data_path)
print(f"✓ Loaded test data: {test_df.shape[0]} rows × {test_df.shape[1]} columns")

# Separate features from target
X_test = test_df.drop('Machine failure', axis=1)
y_test = test_df['Machine failure'].values

# Engineer features to match training data
engineer = FeatureEngineer()
X_test = engineer.engineer_features(X_test)

# Drop non-numeric columns 
X_test = X_test.select_dtypes(include=[np.number])

print(f"✓ Features after engineering: {X_test.shape[1]} numeric columns")
print(f"✓ Target distribution - No Failure: {(y_test == 0).sum()}, Failure: {(y_test == 1).sum()}")

# ============================================================================
# STEP 2: LOAD XGBOOST MODEL
# ============================================================================
print("\n" + "=" * 80)
print("STEP 2: Loading XGBoost model")
print("=" * 80)

xgb_model_path = MODELS_DIR / 'xgboost_model.pkl'
with open(xgb_model_path, 'rb') as f:
    xgb_model = pickle.load(f)

print(f"✓ XGBoost model loaded from: {xgb_model_path}")
print(f"✓ Model type: {type(xgb_model).__name__}")

# ============================================================================
# STEP 3: XGBOOST - USING predict_proba()
# ============================================================================
print("\n" + "=" * 80)
print("STEP 3: XGBoost - predict_proba() in action")
print("=" * 80)

print("\nWhat is predict_proba()?")
print("  - Returns probability predictions for BOTH classes")
print("  - Output shape: (n_samples, n_classes) = (2000, 2)")
print("  - Column 0: Probability of NO failure (class 0)")
print("  - Column 1: Probability of FAILURE (class 1)")
print("  - Probabilities sum to 1 for each sample")

print("\nCalling XGBoost model.predict_proba(X_test)...")
xgb_proba = xgb_model.predict_proba(X_test)

print(f"\n✓ Output shape: {xgb_proba.shape}")
print(f"✓ Data type: {xgb_proba.dtype}")

# Show first 5 predictions
print(f"\nFirst 5 samples - XGBoost predict_proba() output:")
print("   Index | P(No Failure) | P(Failure)")
print("   " + "-" * 40)
for i in range(5):
    p_no_fail = xgb_proba[i, 0]
    p_fail = xgb_proba[i, 1]
    print(f"   {i:5d} | {p_no_fail:13.6f} | {p_fail:9.6f}", end="")
    print(f" (Sum: {p_no_fail + p_fail:.6f})")  # Should be 1.0

# Extract failure probabilities (class 1)
xgb_failure_prob = xgb_proba[:, 1]

print(f"\n✓ XGBoost Failure Probability Statistics:")
print(f"   Mean:   {xgb_failure_prob.mean():.6f}")
print(f"   Median: {np.median(xgb_failure_prob):.6f}")
print(f"   Std:    {xgb_failure_prob.std():.6f}")
print(f"   Min:    {xgb_failure_prob.min():.6f}")
print(f"   Max:    {xgb_failure_prob.max():.6f}")

# ============================================================================
# STEP 4: LOAD LIGHTGBM MODEL
# ============================================================================
print("\n" + "=" * 80)
print("STEP 4: Loading LightGBM model")
print("=" * 80)

lgb_model_path = MODELS_DIR / 'lightgbm_model.pkl'
with open(lgb_model_path, 'rb') as f:
    lgb_model = pickle.load(f)

print(f"✓ LightGBM model loaded from: {lgb_model_path}")
print(f"✓ Model type: {type(lgb_model).__name__}")

# ============================================================================
# STEP 5: LIGHTGBM - USING predict_proba()
# ============================================================================
print("\n" + "=" * 80)
print("STEP 5: LightGBM - predict_proba() in action")
print("=" * 80)

print("\nCalling LightGBM model.predict_proba(X_test)...")
lgb_proba = lgb_model.predict_proba(X_test)

print(f"\n✓ Output shape: {lgb_proba.shape}")
print(f"✓ Data type: {lgb_proba.dtype}")

# Show first 5 predictions
print(f"\nFirst 5 samples - LightGBM predict_proba() output:")
print("   Index | P(No Failure) | P(Failure)")
print("   " + "-" * 40)
for i in range(5):
    p_no_fail = lgb_proba[i, 0]
    p_fail = lgb_proba[i, 1]
    print(f"   {i:5d} | {p_no_fail:13.6f} | {p_fail:9.6f}", end="")
    print(f" (Sum: {p_no_fail + p_fail:.6f})")  # Should be 1.0

# Extract failure probabilities (class 1)
lgb_failure_prob = lgb_proba[:, 1]

print(f"\n✓ LightGBM Failure Probability Statistics:")
print(f"   Mean:   {lgb_failure_prob.mean():.6f}")
print(f"   Median: {np.median(lgb_failure_prob):.6f}")
print(f"   Std:    {lgb_failure_prob.std():.6f}")
print(f"   Min:    {lgb_failure_prob.min():.6f}")
print(f"   Max:    {lgb_failure_prob.max():.6f}")

# ============================================================================
# STEP 6: CONVERT TO BINARY PREDICTIONS
# ============================================================================
print("\n" + "=" * 80)
print("STEP 6: Converting probabilities to binary predictions")
print("=" * 80)

print("\nUsing threshold of 0.5:")
print("  - If P(Failure) >= 0.5 → predict Failure (1)")
print("  - If P(Failure) < 0.5 → predict No Failure (0)")

xgb_pred = (xgb_failure_prob >= 0.5).astype(int)
lgb_pred = (lgb_failure_prob >= 0.5).astype(int)

print(f"\n✓ XGBoost predictions:  {xgb_pred.sum()} failures, {(xgb_pred == 0).sum()} no-failures")
print(f"✓ LightGBM predictions: {lgb_pred.sum()} failures, {(lgb_pred == 0).sum()} no-failures")
print(f"✓ Actual test labels:   {(y_test == 1).sum()} failures, {(y_test == 0).sum()} no-failures")

# ============================================================================
# STEP 7: CONFIDENCE SCORES
# ============================================================================
print("\n" + "=" * 80)
print("STEP 7: Model confidence scores")
print("=" * 80)

print("\nConfidence = |P(Predicted Class) - 0.5| × 2")
print("  - Ranges from 0 (50/50 uncertain) to 1 (100% confident)")

xgb_confidence = np.abs(xgb_failure_prob - 0.5) * 2
lgb_confidence = np.abs(lgb_failure_prob - 0.5) * 2

print(f"\n✓ XGBoost Confidence:")
print(f"   Mean:   {xgb_confidence.mean():.4f}")
print(f"   Min:    {xgb_confidence.min():.4f}")
print(f"   Max:    {xgb_confidence.max():.4f}")

print(f"\n✓ LightGBM Confidence:")
print(f"   Mean:   {lgb_confidence.mean():.4f}")
print(f"   Min:    {lgb_confidence.min():.4f}")
print(f"   Max:    {lgb_confidence.max():.4f}")

# ============================================================================
# STEP 8: COMPARE MODEL PREDICTIONS
# ============================================================================
print("\n" + "=" * 80)
print("STEP 8: Comparing XGBoost vs LightGBM")
print("=" * 80)

prob_diff = np.abs(xgb_failure_prob - lgb_failure_prob)
agreement = np.sum(xgb_pred == lgb_pred)
disagreement = np.sum(xgb_pred != lgb_pred)

print(f"\n✓ Model Agreement:")
print(f"   Agree:    {agreement:5d} samples ({agreement / len(y_test) * 100:6.2f}%)")
print(f"   Disagree: {disagreement:5d} samples ({disagreement / len(y_test) * 100:6.2f}%)")

print(f"\n✓ Probability Difference (|XGBoost - LightGBM|):")
print(f"   Mean:     {prob_diff.mean():.6f}")
print(f"   Max:      {prob_diff.max():.6f}")
print(f"   Std Dev:  {prob_diff.std():.6f}")

# Find samples with largest disagreement
top_disagree_idx = np.argsort(prob_diff)[-5:][::-1]
print(f"\n✓ Top 5 samples with largest probability difference:")
print("   Index | XGB Prob | LGB Prob | Diff   | XGB Pred | LGB Pred | Actual")
print("   " + "-" * 75)
for idx in top_disagree_idx:
    xgb_p = xgb_failure_prob[idx]
    lgb_p = lgb_failure_prob[idx]
    diff = prob_diff[idx]
    xgb_p_val = xgb_pred[idx]
    lgb_p_val = lgb_pred[idx]
    actual = y_test[idx]
    print(f"   {idx:5d} | {xgb_p:8.5f} | {lgb_p:8.5f} | {diff:6.5f} | {xgb_p_val:8d} | {lgb_p_val:8d} | {actual:6d}")

# ============================================================================
# STEP 9: RISK CATEGORIZATION
# ============================================================================
print("\n" + "=" * 80)
print("STEP 9: Categorizing predictions into risk levels")
print("=" * 80)

def categorize_risk(prob):
    """Categorize failure probability into risk levels."""
    if prob < 0.1:
        return 'Very Low'
    elif prob < 0.3:
        return 'Low'
    elif prob < 0.5:
        return 'Medium'
    elif prob < 0.7:
        return 'High'
    else:
        return 'Critical'

risk_categories = [categorize_risk(p) for p in lgb_failure_prob]
risk_counts = pd.Series(risk_categories).value_counts()

print(f"\n✓ LightGBM Risk Distribution:")
for risk_level in ['Critical', 'High', 'Medium', 'Low', 'Very Low']:
    count = risk_counts.get(risk_level, 0)
    pct = count / len(risk_categories) * 100
    print(f"   {risk_level:12s}: {count:5d} samples ({pct:6.2f}%)")

# ============================================================================
# STEP 10: SAVE RESULTS
# ============================================================================
print("\n" + "=" * 80)
print("STEP 10: Saving predictions to CSV and JSON")
print("=" * 80)

# Create results DataFrame
results_df = pd.DataFrame({
    'sample_id': range(len(X_test)),
    'xgboost_prob_no_failure': xgb_proba[:, 0],
    'xgboost_prob_failure': xgb_failure_prob,
    'xgboost_prediction': xgb_pred,
    'xgboost_confidence': xgb_confidence,
    'lightgbm_prob_no_failure': lgb_proba[:, 0],
    'lightgbm_prob_failure': lgb_failure_prob,
    'lightgbm_prediction': lgb_pred,
    'lightgbm_confidence': lgb_confidence,
    'lightgbm_risk_level': risk_categories,
    'actual_label': y_test,
})

# Save to CSV
output_csv = MODELS_DIR / 'predict_proba_results.csv'
results_df.to_csv(output_csv, index=False)
print(f"✓ Saved detailed results to: {output_csv}")

# Save summary statistics to JSON
summary = {
    'total_test_samples': len(y_test),
    'xgboost': {
        'method': 'predict_proba()',
        'predictions': {
            'failures': int(xgb_pred.sum()),
            'no_failures': int((xgb_pred == 0).sum()),
        },
        'probability_stats': {
            'mean': float(xgb_failure_prob.mean()),
            'median': float(np.median(xgb_failure_prob)),
            'std': float(xgb_failure_prob.std()),
            'min': float(xgb_failure_prob.min()),
            'max': float(xgb_failure_prob.max()),
        },
    },
    'lightgbm': {
        'method': 'predict_proba()',
        'predictions': {
            'failures': int(lgb_pred.sum()),
            'no_failures': int((lgb_pred == 0).sum()),
        },
        'probability_stats': {
            'mean': float(lgb_failure_prob.mean()),
            'median': float(np.median(lgb_failure_prob)),
            'std': float(lgb_failure_prob.std()),
            'min': float(lgb_failure_prob.min()),
            'max': float(lgb_failure_prob.max()),
        },
    },
    'comparison': {
        'models_agree': int(agreement),
        'models_disagree': int(disagreement),
        'agreement_rate': float(agreement / len(y_test)),
        'mean_probability_difference': float(prob_diff.mean()),
        'max_probability_difference': float(prob_diff.max()),
    },
    'actual_test_data': {
        'failures': int((y_test == 1).sum()),
        'no_failures': int((y_test == 0).sum()),
    },
}

output_json = MODELS_DIR / 'predict_proba_summary.json'
with open(output_json, 'w') as f:
    json.dump(summary, f, indent=2)
print(f"✓ Saved summary to: {output_json}")

# ============================================================================
# STEP 11: KEY TAKEAWAYS
# ============================================================================
print("\n" + "=" * 80)
print("STEP 11: KEY TAKEAWAYS - predict_proba() Usage")
print("=" * 80)

print(f"""
📊 WHAT predict_proba() DOES:
   Returns probability scores for BOTH classes (not just the predicted class)
   
✓ USAGE PATTERN:
   proba = model.predict_proba(X)  # Returns shape (n_samples, 2)
   class_1_prob = proba[:, 1]      # Extract failure probabilities
   predictions = (class_1_prob >= 0.5).astype(int)  # Binary predictions

📈 ADVANTAGES:
   • Get confidence in predictions
   • Use custom thresholds (not just 0.5)
   • Rank samples by prediction uncertainty
   • Better for imbalanced datasets
   • Required for ROC-AUC and other metrics

✓ REAL-WORLD USAGE:
   • Set higher threshold (0.7+) for high-confidence alerts only
   • Use probabilities to rank maintenance priority
   • Flag low-confidence predictions (prob near 0.5) for review
   • Ensemble multiple model probabilities for better decisions

📁 OUTPUT FILES CREATED:
   • {output_csv.name}: Complete predictions for all test samples
   • {output_json.name}: Summary statistics for both models

✓ MODELS COMPARED:
   • XGBoost: {len(xgb_model.feature_importances_)} features
   • LightGBM: {len(lgb_model.feature_importances_)} features
   • Test Set: {len(y_test)} samples
   • Agreement Rate: {agreement / len(y_test) * 100:.1f}%
""")

print("=" * 80)
print("✓ Step-by-step predict_proba() demonstration complete!")
print("=" * 80)
