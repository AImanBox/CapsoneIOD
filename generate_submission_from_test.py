#!/usr/bin/env python3
"""
Generate submission.csv from test.csv with predictions
"""

import pickle
import pandas as pd
import numpy as np
import sys
from pathlib import Path
import warnings

warnings.filterwarnings('ignore')

# Add ml module to path
ml_path = Path('.') / 'ml'
sys.path.insert(0, str(ml_path))

from feature_engineering import FeatureEngineer

print("=" * 80)
print("GENERATING SUBMISSION.CSV FROM test.csv")
print("=" * 80)

# Load test data
print("\n[1/4] Loading test.csv...")
test_df = pd.read_csv('docs/test.csv')
print(f"✅ Loaded: {len(test_df):,} samples")
print(f"   Columns: {list(test_df.columns)}")

# Store IDs
test_ids = test_df['id'].values.copy()

# Feature Engineering
print("\n[2/4] Feature engineering...")
X_test = test_df.copy()
X_test = FeatureEngineer.engineer_features(X_test, include_advanced=True)
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

# Sort features to match training order
feature_order = sorted(X_test.columns)
X_test = X_test[feature_order]

print(f"✅ Features engineered: {X_test.shape[1]} features")

# Load and generate predictions
print("\n[3/4] Generating predictions...")
xgb_model = pickle.load(open('ml/models/xgboost_model.pkl', 'rb'))

xgb_probabilities = xgb_model.predict_proba(X_test)[:, 1]
xgb_predictions = xgb_model.predict(X_test)

print(f"✅ Predictions generated for {len(test_ids):,} samples")

# Create submission dataframe
print("\n[4/4] Creating submission.csv...")
submission_df = pd.DataFrame({
    'id': test_ids,
    'proba': xgb_probabilities,
    'Machine failure': xgb_predictions
})

# Format proba to 2 decimal places
with open('submission.csv', 'w') as f:
    f.write('id,proba,Machine failure\n')
    for idx, row in submission_df.iterrows():
        f.write('{},{:.2f},{}\n'.format(int(row['id']), float(row['proba']), int(row['Machine failure'])))

# Verify
submission_df = pd.read_csv('submission.csv')
print(f"✅ Submission.csv created with {len(submission_df):,} rows")
print()
print("Statistics:")
print(f"  - Total samples: {len(submission_df):,}")
print(f"  - Predicted failures: {(submission_df['Machine failure'] == 1).sum():,}")
print(f"  - Failure rate: {(submission_df['Machine failure'] == 1).sum() / len(submission_df) * 100:.2f}%")
print()
print("Sample data:")
print(submission_df.head(20)[['id', 'proba', 'Machine failure']].to_string())
print()
print("✅ COMPLETE - submission.csv updated with test.csv data")
