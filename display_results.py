import pandas as pd
import json

print("="*70)
print("📊 FAILURE PROBABILITY ANALYSIS RESULTS")
print("="*70)

# Load the predictions
df = pd.read_csv('ml/models/failure_probabilities.csv')

print(f"\n✓ Total Records Analyzed: {len(df):,}")
print(f"  - Predicted Failures: {(df['predicted_failure'] == 1).sum():,} ({(df['predicted_failure'] == 1).mean()*100:.2f}%)")
print(f"  - Predicted No Failures: {(df['predicted_failure'] == 0).sum():,}")

print(f"\n📈 Probability Statistics:")
print(f"  Min:    {df['failure_probability'].min():.4f}")
print(f"  Max:    {df['failure_probability'].max():.4f}")
print(f"  Mean:   {df['failure_probability'].mean():.4f}")
print(f"  Median: {df['failure_probability'].median():.4f}")
print(f"  Std:    {df['failure_probability'].std():.4f}")

print(f"\n⚠️  Risk Level Distribution:")
for risk in sorted(df['risk_level'].unique()):
    count = (df['risk_level'] == risk).sum()
    pct = count / len(df) * 100
    print(f"  {risk:12s}: {count:6,} records ({pct:5.2f}%)")

print(f"\n🔍 Sample Predictions (First 10 Predicted Failures):")
print("-" * 90)
failures = df[df['predicted_failure'] == 1].head(10)[
    ['UDI', 'Product ID', 'Tool wear [min]', 'failure_probability', 'risk_level', 'confidence']
]
print(failures.to_string(index=False))

print(f"\n📁 Output Files Generated:")
print(f"  • ml/models/failure_probabilities.csv - Full predictions (8,000 rows)")
print(f"  • ml/models/probability_report.json - Summary report")

# Load and display report
with open('ml/models/probability_report.json') as f:
    report = json.load(f)

print(f"\n📋 Report Timestamp: {report['timestamp']}")
print("\n" + "="*70)
