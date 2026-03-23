#!/usr/bin/env python3
"""
@file generate_predictions_test.py
@description Generate failure predictions for test.csv dataset
@module prediction
@created 2026-03-23

Generates predictions for test.csv (unlabeled test set) using the trained models.
Creates failure_probabilities_test.csv with predictions and risk levels.
"""

import pickle
import pandas as pd
import numpy as np
import sys
import json
from pathlib import Path
from datetime import datetime
import warnings

warnings.filterwarnings('ignore')

# Add ml module to path
ml_path = Path(__file__).parent / 'ml'
sys.path.insert(0, str(ml_path))

from feature_engineering import FeatureEngineer

print("=" * 80)
print("GENERATING PREDICTIONS FOR test.csv")
print("=" * 80)
print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 80)

# ============================================
# STEP 1: LOAD TEST DATA
# ============================================
print("\n[1/4] LOADING TEST DATA")
print("-" * 80)

test_file = 'docs/test.csv'
print(f"Loading test data from: {test_file}")

test_df = pd.read_csv(test_file)
print(f"✅ Loaded: {len(test_df):,} samples × {len(test_df.columns)} columns")
print(f"   Columns: {list(test_df.columns)}")

# Store IDs for later
test_ids = test_df['id'].values.copy()

# ============================================
# STEP 2: FEATURE ENGINEERING
# ============================================
print("\n[2/4] FEATURE ENGINEERING")
print("-" * 80)

X_test = test_df.copy()

# Apply feature engineering
X_test = FeatureEngineer.engineer_features(X_test, include_advanced=True)

# Clean column names
X_test.columns = X_test.columns.str.replace('[', '').str.replace(']', '')

# Encode categorical features
type_mapping = {'L': 0, 'M': 1, 'H': 2}
if 'Type' in X_test.columns:
    X_test['Type_encoded'] = X_test['Type'].map(type_mapping)
    X_test = X_test.drop('Type', axis=1)

if 'Product ID' in X_test.columns:
    X_test['ProductID_encoded'] = pd.factorize(X_test['Product ID'])[0]
    X_test = X_test.drop('Product ID', axis=1)

X_test = X_test.drop(['id'], axis=1, errors='ignore')
X_test = X_test.select_dtypes(include=[np.number])

print(f"✅ Features engineered: {X_test.shape[0]:,} rows × {X_test.shape[1]} features")

# ============================================
# STEP 3: LOAD MODELS & GENERATE PREDICTIONS
# ============================================
print("\n[3/4] GENERATING PREDICTIONS")
print("-" * 80)

# Sort features to match training data order
feature_order = sorted(X_test.columns)
X_test = X_test[feature_order]
print(f"✅ Features sorted: {len(feature_order)} columns aligned")

# Load trained models
print("Loading trained models...")
xgb_model = pickle.load(open('ml/models/xgboost_model.pkl', 'rb'))
lgb_model = pickle.load(open('ml/models/lightgbm_model.pkl', 'rb'))
print("✅ Models loaded")

# Generate predictions using XGBoost (primary model)
print("\nGenerating XGBoost predictions...")
xgb_predictions = xgb_model.predict(X_test)
xgb_probabilities = xgb_model.predict_proba(X_test)[:, 1]
print(f"✅ XGBoost predictions generated: {len(xgb_probabilities):,} predictions")

# Generate predictions using LightGBM (ensemble)
print("Generating LightGBM predictions...")
lgb_predictions = lgb_model.predict(X_test)
lgb_probabilities = lgb_model.predict_proba(X_test)[:, 1]
print(f"✅ LightGBM predictions generated: {len(lgb_probabilities):,} predictions")

# Ensemble: Average probabilities
ensemble_probabilities = (xgb_probabilities + lgb_probabilities) / 2
print(f"✅ Ensemble predictions created (average of both models)")

# Use XGBoost as primary for this export
failure_probabilities = xgb_probabilities

# ============================================
# STEP 4: CREATE OUTPUT DATAFRAME
# ============================================
print("\n[4/4] CREATING OUTPUT FILES")
print("-" * 80)

# Extract relevant columns from original test data for context
output_df = pd.DataFrame({
    'id': test_ids,
    'Air temperature [K]': test_df['Air temperature [K]'].values,
    'Process temperature [K]': test_df['Process temperature [K]'].values,
    'Rotational speed [rpm]': test_df['Rotational speed [rpm]'].values,
    'Torque [Nm]': test_df['Torque [Nm]'].values,
    'Tool wear [min]': test_df['Tool wear [min]'].values,
    'XGBoost_probability': xgb_probabilities,
    'LightGBM_probability': lgb_probabilities,
    'Ensemble_probability': ensemble_probabilities,
    'XGBoost_prediction': xgb_predictions,
    'LightGBM_prediction': lgb_predictions,
})

# Map probabilities to risk levels
def get_risk_level(prob):
    if prob >= 0.95:
        return 'Critical'
    elif prob >= 0.75:
        return 'High'
    elif prob >= 0.50:
        return 'Medium'
    elif prob >= 0.25:
        return 'Low'
    else:
        return 'Very Low'

output_df['risk_level'] = output_df['XGBoost_probability'].apply(get_risk_level)

# Save to CSV
output_csv_path = 'ml/models/failure_probabilities_test.csv'
output_df.to_csv(output_csv_path, index=False)
print(f"✅ Predictions saved to: {output_csv_path}")
print(f"   Rows: {len(output_df):,}")
print(f"   Columns: {len(output_df.columns)}")

# ============================================
# STEP 5: GENERATE SUMMARY REPORT
# ============================================
print("\n[SUMMARY STATISTICS]")
print("-" * 80)

# Calculate statistics
total_records = len(output_df)
predicted_failures = (output_df['XGBoost_prediction'] == 1).sum()
failure_rate = (predicted_failures / total_records) * 100

print(f"Total Records: {total_records:,}")
print(f"Predicted Failures (XGBoost): {predicted_failures:,}")
print(f"Predicted Failure Rate: {failure_rate:.2f}%")

# Risk distribution
risk_dist = output_df['risk_level'].value_counts().to_dict()
print(f"\nRisk Category Breakdown:")
for risk_level in ['Critical', 'High', 'Medium', 'Low', 'Very Low']:
    count = risk_dist.get(risk_level, 0)
    pct = (count / total_records * 100) if total_records > 0 else 0
    print(f"  - {risk_level}: {count:,} ({pct:.2f}%)")

# Probability statistics
prob_mean = output_df['XGBoost_probability'].mean()
prob_median = output_df['XGBoost_probability'].median()
prob_std = output_df['XGBoost_probability'].std()
prob_min = output_df['XGBoost_probability'].min()
prob_max = output_df['XGBoost_probability'].max()

print(f"\nProbability Statistics (XGBoost):")
print(f"  - Mean: {prob_mean:.4f}")
print(f"  - Median: {prob_median:.4f}")
print(f"  - Std Dev: {prob_std:.4f}")
print(f"  - Min: {prob_min:.4f}")
print(f"  - Max: {prob_max:.4f}")

# Quartiles
q25 = output_df['XGBoost_probability'].quantile(0.25)
q75 = output_df['XGBoost_probability'].quantile(0.75)
print(f"  - Q1 (25%): {q25:.4f}")
print(f"  - Q3 (75%): {q75:.4f}")

# Create summary report JSON
summary_report = {
    'dataset': 'test.csv',
    'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
    'total_records': int(total_records),
    'predicted_failures': int(predicted_failures),
    'failure_rate': float(failure_rate),
    'probability_stats': {
        'mean': float(prob_mean),
        'median': float(prob_median),
        'std': float(prob_std),
        'min': float(prob_min),
        'max': float(prob_max),
        'q25': float(q25),
        'q75': float(q75),
    },
    'risk_distribution': {
        'Critical': int(risk_dist.get('Critical', 0)),
        'High': int(risk_dist.get('High', 0)),
        'Medium': int(risk_dist.get('Medium', 0)),
        'Low': int(risk_dist.get('Low', 0)),
        'Very Low': int(risk_dist.get('Very Low', 0)),
    },
    'models_used': {
        'primary': 'XGBoost',
        'ensemble': ['XGBoost', 'LightGBM'],
        'probability_column': 'XGBoost_probability',
    }
}

# Save summary report
report_path = 'ml/models/probability_report_test.json'
with open(report_path, 'w') as f:
    json.dump(summary_report, f, indent=2)

print(f"\n✅ Summary report saved to: {report_path}")

# ============================================
# COMPLETION
# ============================================
print("\n" + "=" * 80)
print("✅ PREDICTIONS GENERATED SUCCESSFULLY")
print("=" * 80)
print(f"\nOutput Files:")
print(f"  - Predictions: {output_csv_path}")
print(f"  - Summary: {report_path}")
print(f"\nData Source: test.csv ({total_records:,} test samples)")
print(f"Predictions Ready for Web App")
print("=" * 80)

sys.exit(0)
