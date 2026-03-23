"""
@file generate_failure_probabilities_csv.py
@description Generate failure probabilities CSV from submission.csv
@module ml.scripts.generate_failure_probabilities_csv
@created 2026-03-23

Generates a comprehensive CSV with all predictions and risk levels,
used by the API to extract critical predictions.
"""

import pandas as pd
import numpy as np
from pathlib import Path


def categorize_risk(probability: float) -> str:
    """
    Categorize failure probability into risk level.
    
    @param probability Failure probability (0-1)
    @returns Risk level string
    """
    if probability >= 0.95:
        return "Critical"
    elif probability >= 0.70:
        return "High"
    elif probability >= 0.50:
        return "Medium"
    elif probability >= 0.10:
        return "Low"
    else:
        return "Very Low"


def generate_failure_probabilities_csv(
    test_data_path: str = 'docs/test.csv',
    submission_path: str = 'submission.csv',
    output_path: str = 'ml/models/failure_probabilities.csv'
) -> None:
    """
    Generate CSV with all test predictions and risk levels.
    
    @description
    Creates comprehensive CSV combining test data with predicted probabilities
    and categorized risk levels for analysis and API consumption.
    
    @param test_data_path Path to test.csv
    @param submission_path Path to submission.csv with predictions
    @param output_path Path to save failure_probabilities.csv
    """
    print("=" * 70)
    print("GENERATING FAILURE PROBABILITIES CSV")
    print("=" * 70)
    
    # Load data
    print(f"\n📖 Loading data...")
    try:
        test_df = pd.read_csv(test_data_path)
        submission_df = pd.read_csv(submission_path)
        print(f"   ✅ Loaded {len(test_df)} test records")
        print(f"   ✅ Loaded {len(submission_df)} predictions")
    except FileNotFoundError as e:
        print(f"   ❌ Error: {e}")
        raise
    
    # Merge data
    print(f"\n🔗 Merging test data with predictions...")
    df = test_df.merge(submission_df, on='id', how='inner')
    print(f"   ✅ Merged {len(df)} records")
    
    # Add risk level
    print(f"\n🎯 Categorizing risk levels...")
    df['risk_level'] = df['proba'].apply(categorize_risk)
    print(f"   ✅ Risk levels assigned")
    
    # Reorder columns for readability
    columns_order = ['id', 'UDI', 'Product ID', 'Type', 
                     'Air temperature [K]', 'Process temperature [K]',
                     'Rotational speed [rpm]', 'Torque [Nm]', 'Tool wear [min]',
                     'TWF', 'HDF', 'PWF', 'OSF', 'RNF',
                     'Machine failure', 'proba', 'risk_level']
    
    df_output = df[[col for col in columns_order if col in df.columns]]
    
    # Save CSV
    print(f"\n💾 Saving to {output_path}...")
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    df_output.to_csv(output_file, index=False)
    print(f"   ✅ Saved {len(df_output)} records")
    
    # Summary
    print(f"\n📊 Summary:")
    print(f"   Row count: {len(df_output):,}")
    print(f"   Column count: {len(df_output.columns)}")
    print(f"\n   Risk Level Distribution:")
    risk_counts = df_output['risk_level'].value_counts().sort_index()
    for risk_level in ['Very Low', 'Low', 'Medium', 'High', 'Critical']:
        count = risk_counts.get(risk_level, 0)
        percentage = (count / len(df_output)) * 100
        print(f"      {risk_level}: {count:,} ({percentage:.2f}%)")
    
    print("\n" + "=" * 70)
    print("✅ FAILURE PROBABILITIES CSV GENERATION COMPLETE")
    print("=" * 70)


if __name__ == '__main__':
    generate_failure_probabilities_csv()
