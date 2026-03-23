"""
@file generate_probability_report.py
@description Generate probability report from submission.csv with latest predictions
@module ml.scripts.generate_probability_report
@created 2026-03-23

Generates comprehensive probability statistics and risk distribution report
from submission.csv predictions on the full test dataset (27,286 samples).
"""

import json
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime


def generate_probability_report(
    submission_path: str = 'submission.csv',
    output_path: str = 'ml/models/probability_report.json'
) -> dict:
    """
    Generate probability report from submission.csv predictions.
    
    @description
    Calculates comprehensive statistics about predicted failure probabilities
    and creates risk distribution across different probability ranges.
    
    @param submission_path Path to submission.csv with predictions
    @param output_path Path to save probability_report.json
    @returns Dictionary with probability statistics
    """
    print("=" * 70)
    print("GENERATING PROBABILITY REPORT")
    print("=" * 70)
    
    # Load submission data
    print(f"\n📖 Loading submission data from {submission_path}...")
    try:
        df = pd.read_csv(submission_path)
        print(f"   ✅ Loaded {len(df)} predictions")
    except FileNotFoundError:
        print(f"   ❌ Error: File not found {submission_path}")
        raise
    
    # Extract probabilities
    probabilities = df['proba'].values
    print(f"   ✅ Extracted probabilities")
    print(f"   - Min: {probabilities.min():.4f}")
    print(f"   - Max: {probabilities.max():.4f}")
    print(f"   - Mean: {probabilities.mean():.6f}")
    
    # Calculate statistics
    print(f"\n📊 Calculating probability statistics...")
    prob_stats = {
        "mean": float(np.mean(probabilities)),
        "median": float(np.median(probabilities)),
        "std": float(np.std(probabilities)),
        "min": float(np.min(probabilities)),
        "max": float(np.max(probabilities)),
        "q25": float(np.percentile(probabilities, 25)),
        "q75": float(np.percentile(probabilities, 75)),
    }
    
    print(f"   ✅ Statistics calculated:")
    for key, value in prob_stats.items():
        print(f"      {key}: {value:.6f}")
    
    # Categorize risk levels
    print(f"\n🎯 Categorizing risk levels...")
    risk_distribution = {
        "Very Low": int(np.sum(probabilities < 0.10)),
        "Low": int(np.sum((probabilities >= 0.10) & (probabilities < 0.50))),
        "Medium": int(np.sum((probabilities >= 0.50) & (probabilities < 0.70))),
        "High": int(np.sum((probabilities >= 0.70) & (probabilities < 0.95))),
        "Critical": int(np.sum(probabilities >= 0.95)),
    }
    
    print(f"   Risk Distribution:")
    total_check = 0
    for risk_level, count in risk_distribution.items():
        percentage = (count / len(probabilities)) * 100
        print(f"      {risk_level}: {count:,} ({percentage:.2f}%)")
        total_check += count
    
    # Failure predictions (probability >= 0.50)
    predicted_failures = int(np.sum(probabilities >= 0.50))
    predicted_no_failures = len(probabilities) - predicted_failures
    failure_rate = predicted_failures / len(probabilities)
    
    print(f"\n🔮 Failure Predictions:")
    print(f"   - Total Records: {len(probabilities):,}")
    print(f"   - Predicted Failures (≥0.50): {predicted_failures:,}")
    print(f"   - Predicted No Failures: {predicted_no_failures:,}")
    print(f"   - Failure Rate: {failure_rate:.6f} ({failure_rate*100:.2f}%)")
    
    # Build report
    report = {
        "total_records": len(probabilities),
        "predicted_failures": predicted_failures,
        "predicted_no_failures": predicted_no_failures,
        "failure_rate": failure_rate,
        "probability_stats": prob_stats,
        "risk_distribution": risk_distribution,
        "timestamp": datetime.now().isoformat()
    }
    
    # Save report
    print(f"\n💾 Saving report to {output_path}...")
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_file, 'w') as f:
        json.dump(report, f, indent=2)
    print(f"   ✅ Report saved successfully")
    
    print("\n" + "=" * 70)
    print("✅ PROBABILITY REPORT GENERATION COMPLETE")
    print("=" * 70)
    
    return report


if __name__ == '__main__':
    report = generate_probability_report()
