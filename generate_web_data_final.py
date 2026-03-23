"""
Generate submission.csv with actual probability values (not rounded)
and update web app data
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
print("Generating Submission with Full Probability Values")
print("="*70)

# Load model
print("\nLoading LightGBM model...")
lgb_model = pickle.load(open('ml/models/lightgbm_model.pkl', 'rb'))

# Load validation data
print("Loading train_te.csv...")
test_df = pd.read_csv('docs/train_te.csv')
train_tr = pd.read_csv('docs/train_tr.csv')
ids = test_df['id'].values
actual_labels = test_df['Machine failure'].values

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

X_test['Machine failure'] = 0
X_test = X_test.drop(['id', 'Product ID'], axis=1, errors='ignore')
X_test = X_test.select_dtypes(include=[np.number])

# Generate predictions
print("Generating predictions...")
proba = lgb_model.predict_proba(X_test)[:, 1]

print(f"\nProbability Statistics:")
print(f"  Min: {proba.min():.8f}")
print(f"  Max: {proba.max():.8f}")
print(f"  Mean: {proba.mean():.8f}")
print(f"  Median: {np.median(proba):.8f}")

# Get binary predictions (top 1.58%)
test_te_actual_rate = (actual_labels == 1).sum() / len(actual_labels) * 100
target_count = int(len(proba) * (test_te_actual_rate / 100))
sorted_indices = np.argsort(proba)[::-1]
binary_predictions = np.zeros(len(proba))
binary_predictions[sorted_indices[:target_count]] = 1

# Create submission with FULL precision probabilities
submission_df = pd.DataFrame({
    'id': ids,
    'proba': proba,  # Full precision, not rounded
    'Machine failure': binary_predictions.astype(int)
})

# Save submission
submission_df.to_csv('submission.csv', index=False)
print(f"\n✅ Saved: submission.csv ({len(submission_df):,} rows)")
print(f"   Predicted failures: {binary_predictions.sum():.0f} ({binary_predictions.sum()/len(proba)*100:.2f}%)")

# Also save with rounded probabilities for display
display_df = submission_df.copy()
display_df['proba'] = display_df['proba'].round(4)
display_df.to_csv('submission_display.csv', index=False)
print(f"✅ Saved: submission_display.csv (rounded to 4 decimals for readability)")

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
    'Critical': int((binary_predictions == 1).sum()),
    'High': 0,
    'Medium': 0,
    'Low': int((binary_predictions == 0).sum()),
    'Very Low': 0
}

probability_report = {
    'total_records': int(len(submission_df)),
    'predicted_failures': int((binary_predictions == 1).sum()),
    'failure_rate': float(np.round((binary_predictions == 1).sum() / len(proba) * 100, 2)),
    'probability_stats': probability_stats,
    'risk_distribution': risk_distribution
}

print("\nProbability Report:")
print(f"  Total Records: {probability_report['total_records']:,}")
print(f"  Predicted Failures: {probability_report['predicted_failures']}")
print(f"  Failure Rate: {probability_report['failure_rate']:.2f}%")
print(f"  Mean Probability: {probability_stats['mean']:.8f}")
print(f"  Probability Range: [{probability_stats['min']:.8f}, {probability_stats['max']:.8f}]")

# Save probability report
import json
with open('ml/models/probability_report.json', 'w') as f:
    json.dump(probability_report, f, indent=2)

print("\n✅ Saved: ml/models/probability_report.json")

# Generate Failure Probabilities CSV for API
train_features = test_df[['id', 'Air temperature [K]', 'Process temperature [K]', 
                           'Rotational speed [rpm]', 'Torque [Nm]', 'Tool wear [min]']].copy()
output_df = train_features.copy()
output_df['failure_probability'] = proba
output_df['risk_level'] = pd.Series(binary_predictions.astype(int)).apply(lambda x: 'Critical' if x == 1 else 'Low').values

output_df.to_csv('ml/models/failure_probabilities.csv', index=False)
print("✅ Saved: ml/models/failure_probabilities.csv")

print("\n" + "="*70)
print("✅ Web app data files updated successfully!")
print("="*70)
