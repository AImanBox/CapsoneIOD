"""
Generate submission using test.csv instead of train_te.csv
"""

import pickle
import pandas as pd
import numpy as np
import sys
from pathlib import Path

ml_path = Path(__file__).parent / 'ml'
sys.path.insert(0, str(ml_path))
from feature_engineering import FeatureEngineer

print("="*70)
print("Generating Submission with test.csv")
print("="*70)

# Load model
print("\nLoading LightGBM model...")
lgb_model = pickle.load(open('ml/models/lightgbm_model.pkl', 'rb'))

# Load test data
print("Loading test.csv...")
test_df = pd.read_csv('docs/test.csv')
ids = test_df['id'].values

print(f"  Shape: {test_df.shape}")
print(f"  Records: {len(test_df):,}")

# Feature engineering
print("Engineering features...")
X_test = test_df.copy()
X_test = FeatureEngineer.engineer_features(X_test, include_advanced=True)
X_test.columns = X_test.columns.str.replace('[', '').str.replace(']', '')

type_mapping = {'L': 0, 'M': 1, 'H': 2}
if 'Type' in X_test.columns:
    X_test['Type_encoded'] = X_test['Type'].map(type_mapping)
    X_test = X_test.drop('Type', axis=1)

if 'Product ID' in X_test.columns:
    X_test['ProductID_encoded'] = pd.factorize(X_test['Product ID'])[0]
    X_test = X_test.drop('Product ID', axis=1)

# Drop non-numeric and ID columns
cols_to_drop = ['id', 'Machine failure']
for col in cols_to_drop:
    if col in X_test.columns:
        X_test = X_test.drop(col, axis=1)

X_test = X_test.select_dtypes(include=[np.number])

# Generate predictions
print("Generating predictions...")
proba = lgb_model.predict_proba(X_test)[:, 1]
pred = lgb_model.predict(X_test)

print(f"\nProbability Statistics:")
print(f"  Min: {proba.min():.4f}")
print(f"  Max: {proba.max():.4f}")
print(f"  Mean: {proba.mean():.4f}")
print(f"  Median: {np.median(proba):.4f}")

# Create submission with 2 decimal precision
submission_df = pd.DataFrame({
    'id': ids,
    'proba': np.round(proba, 2),
    'Machine failure': pred.astype(int)
})

# Save submission
submission_df.to_csv('submission.csv', index=False)
print(f"\n✅ Saved: submission.csv ({len(submission_df):,} rows)")
print(f"   Predicted failures: {pred.sum():.0f} ({pred.sum()/len(proba)*100:.2f}%)")

# ============================================
# Update web app data files
# ============================================

print("\n" + "="*70)
print("Generating Web App Data Files")
print("="*70)

probability_stats = {
    'mean': float(np.round(proba.mean(), 6)),
    'median': float(np.round(np.median(proba), 6)),
    'std': float(np.round(proba.std(), 6)),
    'min': float(np.round(proba.min(), 6)),
    'max': float(np.round(proba.max(), 6)),
    'q25': float(np.round(np.percentile(proba, 25), 6)),
    'q75': float(np.round(np.percentile(proba, 75), 6)),
}

# Risk distribution
risk_distribution = {
    'Critical': int((pred == 1).sum()),
    'High': 0,
    'Medium': 0,
    'Low': int((pred == 0).sum()),
    'Very Low': 0
}

probability_report = {
    'total_records': int(len(submission_df)),
    'predicted_failures': int((pred == 1).sum()),
    'failure_rate': float(np.round((pred == 1).sum() / len(proba) * 100, 2)),
    'probability_stats': probability_stats,
    'risk_distribution': risk_distribution,
    'source_data': 'test.csv (90,954 records)'
}

print("\nProbability Report:")
print(f"  Total Records: {probability_report['total_records']:,}")
print(f"  Predicted Failures: {probability_report['predicted_failures']}")
print(f"  Failure Rate: {probability_report['failure_rate']:.2f}%")
print(f"  Mean Probability: {probability_stats['mean']:.4f}")
print(f"  Probability Range: [{probability_stats['min']:.4f}, {probability_stats['max']:.4f}]")

# Save probability report
import json
with open('ml/models/probability_report.json', 'w') as f:
    json.dump(probability_report, f, indent=2)

print("\n✅ Saved: ml/models/probability_report.json")

# Generate Failure Probabilities CSV for API
test_features = test_df[['id', 'Air temperature [K]', 'Process temperature [K]', 
                          'Rotational speed [rpm]', 'Torque [Nm]', 'Tool wear [min]']].copy()
output_df = test_features.copy()
output_df['failure_probability'] = np.round(proba, 4)
output_df['risk_level'] = pd.Series(pred.astype(int)).apply(lambda x: 'Critical' if x == 1 else 'Low').values

output_df.to_csv('ml/models/failure_probabilities.csv', index=False)
print("✅ Saved: ml/models/failure_probabilities.csv")

print("\n" + "="*70)
print("✅ Submission generated successfully using test.csv!")
print("="*70)
