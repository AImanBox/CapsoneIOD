"""
Generate updated prediction reports from submission.csv for web app
"""

import json
import pandas as pd
import numpy as np

print("Generating updated prediction data for web app...")

# Load the new submission data
submission_df = pd.read_csv('submission.csv')
train_te = pd.read_csv('docs/train_te.csv')

print(f"Submission: {submission_df.shape}")
print(f"train_te: {train_te.shape}")

# Use submission's Machine failure prediction and train_te's features
merged = submission_df.copy()
train_features = train_te[['id', 'Air temperature [K]', 'Process temperature [K]', 
                            'Rotational speed [rpm]', 'Torque [Nm]', 'Tool wear [min]']]
merged = merged.merge(train_features, on='id', how='left')

print(f"Loaded {len(merged)} predictions")

# ============================================
# Generate Probability Report
# ============================================

probability_stats = {
    'mean': float(np.round(merged['proba'].mean(), 6)),
    'median': float(np.round(np.median(merged['proba']), 6)),
    'std': float(np.round(merged['proba'].std(), 6)),
    'min': float(np.round(merged['proba'].min(), 6)),
    'max': float(np.round(merged['proba'].max(), 6)),
    'q25': float(np.round(np.percentile(merged['proba'], 25), 6)),
    'q75': float(np.round(np.percentile(merged['proba'], 75), 6)),
}

# Risk distribution
risk_distribution = {
    'Critical': int((merged['Machine failure'] == 1).sum()),
    'High': 0,
    'Medium': 0,
    'Low': int((merged['Machine failure'] == 0).sum()),
    'Very Low': 0
}

probability_report = {
    'total_records': int(len(merged)),
    'predicted_failures': int((merged['Machine failure'] == 1).sum()),
    'failure_rate': float(np.round((merged['Machine failure'] == 1).sum() / len(merged) * 100, 2)),
    'probability_stats': probability_stats,
    'risk_distribution': risk_distribution
}

print("\nProbability Report:")
print(json.dumps(probability_report, indent=2))

# Save probability report
with open('ml/models/probability_report.json', 'w') as f:
    json.dump(probability_report, f, indent=2)

print("✅ Saved: ml/models/probability_report.json")

# ============================================
# Generate Failure Probabilities CSV
# ============================================

# Create output CSV with all features
output_df = merged[['id', 'Air temperature [K]', 'Process temperature [K]', 
                     'Rotational speed [rpm]', 'Torque [Nm]', 'Tool wear [min]',
                     'proba', 'Machine failure']].copy()

# Rename proba to failure_probability for API compatibility
output_df['failure_probability'] = output_df['proba']
output_df['risk_level'] = output_df['Machine failure'].apply(
    lambda x: 'Critical' if x == 1 else 'Low'
)

# Keep original column names for CSV
output_df = merged[['id', 'Air temperature [K]', 'Process temperature [K]', 
                     'Rotational speed [rpm]', 'Torque [Nm]', 'Tool wear [min]']].copy()
output_df['failure_probability'] = merged['proba']
output_df['risk_level'] = merged['Machine failure'].apply(
    lambda x: 'Critical' if x == 1 else 'Low'
)

# Save to CSV
output_df.to_csv('ml/models/failure_probabilities.csv', index=False)
print("✅ Saved: ml/models/failure_probabilities.csv")

# ============================================
# Summary
# ============================================

print("\n" + "="*70)
print("UPDATED PREDICTION DATA SUMMARY")
print("="*70)
print(f"\nTotal Predictions: {probability_report['total_records']:,}")
print(f"Predicted Failures: {probability_report['predicted_failures']}")
print(f"Failure Rate: {probability_report['failure_rate']:.2f}%")
print(f"\nMean Probability: {probability_stats['mean']:.6f}")
print(f"Median Probability: {probability_stats['median']:.6f}")
print(f"Probability Range: [{probability_stats['min']:.6f}, {probability_stats['max']:.6f}]")
print(f"\n✅ Web app data files updated successfully!")
