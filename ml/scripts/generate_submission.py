"""
@file generate_submission.py
@description Generate submission file with predicted probabilities for test.csv
@module ml.scripts.generate_submission
@created 2026-03-23

Creates submission.csv with test IDs and predicted failure probabilities
from the trained XGBoost model.
"""

import os
import sys
import pickle
import pandas as pd
import numpy as np
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from data_loader import DataLoader
from feature_engineering import FeatureEngineer


def generate_submission(
    model_path: str = 'ml/models/xgboost_model.pkl',
    test_data_path: str = 'docs/test.csv',
    output_path: str = 'submission.csv',
    data_dir: str = 'docs'
) -> None:
    """
    Generate submission CSV with predicted probabilities.
    
    @description
    Loads test data, applies feature engineering, generates predictions
    from trained model, and creates submission file.
    
    @param model_path Path to trained model
    @param test_data_path Path to test.csv
    @param output_path Path to save submission.csv
    @param data_dir Directory containing train.csv for label encoder
    """
    print("=" * 60)
    print("GENERATING SUBMISSION FILE")
    print("=" * 60)
    
    # Load test data
    print(f"\n📖 Loading test data from {test_data_path}...")
    try:
        test_df = pd.read_csv(test_data_path)
        print(f"   ✅ Loaded {len(test_df)} rows × {len(test_df.columns)} columns")
    except FileNotFoundError:
        print(f"   ❌ Error: File not found {test_data_path}")
        raise
    
    # Extract IDs before any processing
    test_ids = test_df['id'].copy()
    print(f"   ✅ Extracted {len(test_ids)} test IDs")
    
    # Initialize DataLoader to handle preprocessing
    print(f"\n🔧 Initializing data preprocessing...")
    data_loader = DataLoader(data_dir=data_dir)
    
    # Load training data to fit preprocessor
    train_df = data_loader.load_train_data()
    
    # Preprocess training data (fit encoders)
    print(f"   Preprocessing training data...")
    train_processed = data_loader.preprocess_features(train_df, fit=True)
    
    # Preprocess test data (use fitted encoders)
    print(f"   Preprocessing test data...")
    test_processed = data_loader.preprocess_features(test_df, fit=False)
    
    # Apply feature engineering
    print(f"\n⚙️  Applying feature engineering...")
    train_engineered = FeatureEngineer.engineer_features(train_processed, include_advanced=True)
    test_engineered = FeatureEngineer.engineer_features(test_processed, include_advanced=True)
    print(f"   ✅ Engineered features created")
    
    # Get all columns except target
    all_feature_cols = [col for col in test_engineered.columns if col != 'Machine failure']
    print(f"   ✅ Total features: {len(all_feature_cols)}")
    
    # Prepare test data with renamed columns
    test_for_prediction = test_engineered[all_feature_cols].copy()
    
    # Encode Product ID as integer representation
    if 'Product ID' in test_for_prediction.columns:
        from sklearn.preprocessing import LabelEncoder
        product_encoder = LabelEncoder()
        test_for_prediction['Product ID'] = product_encoder.fit_transform(test_for_prediction['Product ID'].astype(str))
        print(f"   ✅ Encoded Product ID column")
    
    # Rename columns to remove square brackets (match training format)
    test_for_prediction.columns = [col.replace('[', '').replace(']', '') for col in test_for_prediction.columns]
    
    X_test = test_for_prediction.values
    print(f"   ✅ X_test shape: {X_test.shape}")
    
    # Load trained model
    print(f"\n🤖 Loading trained model from {model_path}...")
    try:
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        print(f"   ✅ Model loaded successfully")
    except FileNotFoundError:
        print(f"   ❌ Error: Model file not found at {model_path}")
        raise
    
    # Generate predictions
    print(f"\n🔮 Generating predictions...")
    probabilities = model.predict_proba(X_test)
    # Get probability of class 1 (failure)
    proba_failure = probabilities[:, 1]
    print(f"   ✅ Generated predictions for {len(proba_failure)} samples")
    print(f"   Min probability: {proba_failure.min():.4f}")
    print(f"   Max probability: {proba_failure.max():.4f}")
    print(f"   Mean probability: {proba_failure.mean():.4f}")
    
    # Create submission DataFrame
    print(f"\n📝 Creating submission file...")
    submission_df = pd.DataFrame({
        'id': test_ids,
        'proba': np.round(proba_failure, 2)  # Round to 2 decimal places
    })
    
    # Save submission file
    submission_df.to_csv(output_path, index=False)
    print(f"   ✅ Submission file saved to: {output_path}")
    print(f"   ✅ Total rows: {len(submission_df)}")
    
    # Display sample
    print(f"\n📊 Sample submission data (first 10 rows):")
    print(submission_df.head(10).to_string(index=False))
    
    print(f"\n✅ Submission generation complete!")
    print("=" * 60)
    
    return submission_df


if __name__ == '__main__':
    # Generate submission
    submission_df = generate_submission()
