"""
@file calculate_failure_probabilities.py
@description Calculate failure probability scores for all records using the best LightGBM model
@module ml.scripts.calculate_failure_probabilities
@created 2026-03-22

Generates failure probability predictions for the entire dataset using the trained LightGBM model.
Results are saved with probability scores, predicted labels, and risk classifications.
"""

import sys
import json
import pickle
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple

import pandas as pd
import numpy as np
import lightgbm as lgb
from sklearn.preprocessing import LabelEncoder

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from data_loader import DataLoader
from feature_engineering import FeatureEngineer


def classify_risk_level(probability: float) -> str:
    """
    Classify failure probability into risk categories.
    
    @param probability - Predicted failure probability (0-1)
    @returns Risk level classification
    """
    if probability < 0.1:
        return 'Very Low'
    elif probability < 0.3:
        return 'Low'
    elif probability < 0.5:
        return 'Medium'
    elif probability < 0.7:
        return 'High'
    else:
        return 'Critical'

def calculate_probabilities(
    X: pd.DataFrame,
    model: object
) -> pd.DataFrame:
    """
    Calculate failure probability scores for input features.
    
    @description
    Generates predictions with probability scores for each record.
    Includes risk classification and confidence metrics.
    
    @param X - Input features DataFrame
    @param model - Trained LightGBM model
    @returns DataFrame with predictions and probability scores
    """
    # Get probability scores
    probabilities = model.predict(X)
    
    # Get binary predictions
    predictions = (probabilities >= 0.5).astype(int)
    
    # Create results DataFrame
    results = pd.DataFrame({
        'failure_probability': probabilities,
        'predicted_failure': predictions,
        'risk_level': [classify_risk_level(p) for p in probabilities],
        'confidence': np.abs(probabilities - 0.5) * 2  # How confident (0-1)
    })
    
    return results

def generate_probability_report(
    predictions_df: pd.DataFrame,
    output_file: str
) -> Dict[str, any]:
    """
    Generate summary statistics for probability predictions.
    
    @param predictions_df - DataFrame with predictions
    @param output_file - Path to save results
    @returns Summary statistics dictionary
    """
    stats = {
        'total_records': len(predictions_df),
        'predicted_failures': int(predictions_df['predicted_failure'].sum()),
        'predicted_no_failures': int((predictions_df['predicted_failure'] == 0).sum()),
        'failure_rate': float(predictions_df['predicted_failure'].mean()),
        'probability_stats': {
            'mean': float(predictions_df['failure_probability'].mean()),
            'median': float(predictions_df['failure_probability'].median()),
            'std': float(predictions_df['failure_probability'].std()),
            'min': float(predictions_df['failure_probability'].min()),
            'max': float(predictions_df['failure_probability'].max()),
            'q25': float(predictions_df['failure_probability'].quantile(0.25)),
            'q75': float(predictions_df['failure_probability'].quantile(0.75))
        },
        'risk_distribution': predictions_df['risk_level'].value_counts().to_dict(),
        'confidence_stats': {
            'mean': float(predictions_df['confidence'].mean()),
            'median': float(predictions_df['confidence'].median()),
            'above_0_9': int((predictions_df['confidence'] >= 0.9).sum()),
            'above_0_8': int((predictions_df['confidence'] >= 0.8).sum())
        },
        'timestamp': datetime.now().isoformat()
    }
    
    return stats

def main():
    """
    Main execution: Load data, model, and calculate probabilities.
    """
    try:
        print("🔄 Loading dataset...")
        loader = DataLoader(data_dir='docs')
        train_df = loader.load_train_data()
        
        # Keep UDI for later
        udi_col = train_df['UDI'].copy()
        
        # Preprocess features
        print("🔄 Preprocessing features...")
        train_df_processed = loader.preprocess_features(train_df, fit=True)
        X, y = loader.extract_features_target(train_df_processed, include_failure_modes=True)
        print(f"✓ Preprocessed: {X.shape[0]} records, {X.shape[1]} features")
        
        # Get the encoded Product ID using LabelEncoder
        product_id_encoder = LabelEncoder()
        product_id_encoded = product_id_encoder.fit_transform(train_df['Product ID'])
        
        # Engineer features
        print("🔄 Engineering features...")
        X_engineered = FeatureEngineer.engineer_features(X)
        
        # Add UDI and Product ID at the beginning
        X_engineered.insert(0, 'UDI', udi_col.astype('int64').values)
        X_engineered.insert(1, 'Product_ID', product_id_encoded)
        
        # Rename columns to match model's expectations
        # Remove brackets and replace spaces with underscores
        rename_dict = {}
        for col in X_engineered.columns:
            # Remove brackets first: "Tool wear [min]" -> "Tool wear min"
            new_col = col.replace('[', '').replace(']', '').strip()
            # Then replace spaces with underscores: "Tool wear min" -> "Tool_wear_min"
            new_col = new_col.replace(' ', '_')
            rename_dict[col] = new_col
        
        X_engineered = X_engineered.rename(columns=rename_dict)
        
        print(f"✓ Features engineered & prepared: {X_engineered.shape[1]} features")
        print(f"  Sample columns: {X_engineered.columns[:5].tolist()}...")
        
        print("\n🔄 Loading LightGBM model...")
        model_path = Path(__file__).parent.parent / 'models' / 'lightgbm_model.pkl'
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        print(f"✓ Model loaded from {model_path}")
        
        # Get feature names from the model
        feature_names = model.feature_name_
        print(f"✓ Model expects {len(feature_names)} features")
        
        # Reorder X_engineered to match model's expected feature order
        try:
            X_engineered = X_engineered[feature_names]
            print(f"✓ Features reordered to match model")
        except KeyError as e:
            missing = set(feature_names) - set(X_engineered.columns)
            print(f"❌ Missing features: {missing}")
            print(f"  Available: {X_engineered.columns.tolist()}")
            raise
        
        print("\n🔄 Calculating failure probabilities...")
        predictions = calculate_probabilities(X_engineered, model)
        print(f"✓ Probabilities calculated for {len(predictions)} records")
        
        print("\n📊 Generating probability report...")
        report = generate_probability_report(predictions, "")
        
        # Save predictions to CSV (with original column names)
        output_csv = Path(__file__).parent.parent / 'models' / 'failure_probabilities.csv'
        final_output = train_df.copy()  # Use original train_df for output
        final_output['failure_probability'] = predictions['failure_probability'].values
        final_output['predicted_failure'] = predictions['predicted_failure'].values
        final_output['risk_level'] = predictions['risk_level'].values
        final_output['confidence'] = predictions['confidence'].values
        final_output.to_csv(output_csv, index=False)
        print(f"✓ Predictions saved to {output_csv.name} ({len(final_output)} records)")
        
        # Save report as JSON
        output_json = Path(__file__).parent.parent / 'models' / 'probability_report.json'
        with open(output_json, 'w') as f:
            json.dump(report, f, indent=2)
        print(f"✓ Report saved to {output_json.name}")
        
        # Print summary
        print("\n" + "="*60)
        print("📈 FAILURE PROBABILITY SUMMARY")
        print("="*60)
        print(f"Total Records: {report['total_records']:,}")
        print(f"Predicted Failures: {report['predicted_failures']:,} ({report['failure_rate']*100:.2f}%)")
        print(f"Predicted No Failures: {report['predicted_no_failures']:,}")
        print(f"\nProbability Statistics:")
        print(f"  Mean: {report['probability_stats']['mean']:.4f}")
        print(f"  Median: {report['probability_stats']['median']:.4f}")
        print(f"  Std Dev: {report['probability_stats']['std']:.4f}")
        print(f"  Range: [{report['probability_stats']['min']:.4f}, {report['probability_stats']['max']:.4f}]")
        print(f"\nRisk Distribution:")
        for risk, count in sorted(report['risk_distribution'].items()):
            pct = (count / report['total_records']) * 100
            print(f"  {risk:12s}: {count:6,} records ({pct:5.2f}%)")
        print(f"\nConfidence (avg): {report['confidence_stats']['mean']:.2%}")
        print(f"High confidence (≥0.9): {report['confidence_stats']['above_0_9']:,} records")
        print("="*60)
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
