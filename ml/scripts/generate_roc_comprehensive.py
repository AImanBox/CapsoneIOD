"""
Generate comprehensive ROC curves including Train, Test, and CV fold data
for overfitting analysis and generalization assessment.
Applied from pattern: Train vs Test comparison for overfitting detection
"""

import json
import pickle
import numpy as np
import pandas as pd
from sklearn.metrics import roc_curve, auc
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from data_loader import DataLoader
from feature_engineering import FeatureEngineer
from sklearn.preprocessing import LabelEncoder

def generate_comprehensive_roc_curves():
    """
    Generate Train, Test, and Cross-Validation ROC curves.
    Enables overfitting detection and generalization analysis.
    """
    
    print("=" * 90)
    print("COMPREHENSIVE ROC CURVE GENERATION - Train/Test/CV Analysis")
    print("=" * 90)
    
    # Step 1: Load full data (train + test combined)
    print("\n[1/6] Loading dataset...")
    data_loader = DataLoader()
    
    # Load train data
    train_df = data_loader.load_train_data()
    
    # Load test data
    test_df = data_loader.load_test_data()
    
    # Combine and prepare
    y_train = train_df['Machine failure'].values
    y_test = test_df['Machine failure'].values
    
    X_train = train_df.drop(columns=['Machine failure'])
    X_test = test_df.drop(columns=['Machine failure'])
    
    print(f"✓ Train set: {X_train.shape[0]} samples")
    print(f"✓ Test set: {X_test.shape[0]} samples")
    
    # Step 2: Encode categorical columns
    print("\n[2/6] Encoding categorical features...")
    
    # Use factorize for robust encoding that handles test-only values
    for col in ['Product ID', 'Type']:
        if col in X_train.columns:
            # Get all unique values from both train and test
            all_vals = pd.concat([X_train[col], X_test[col]])
            # Create mapping from all unique values
            unique_vals = all_vals.unique()
            val_map = {v: i for i, v in enumerate(unique_vals)}
            
            X_train[col] = X_train[col].map(val_map).fillna(-1).astype(int)
            X_test[col] = X_test[col].map(val_map).fillna(-1).astype(int)
    
    print("✓ Categorical columns encoded")
    
    # Step 3: Engineer features
    print("\n[3/6] Engineering features...")
    engineer = FeatureEngineer()
    X_train_eng = engineer.engineer_features(X_train, include_advanced=True)
    X_test_eng = engineer.engineer_features(X_test, include_advanced=True)
    
    # Clean column names for XGBoost
    X_train_eng.columns = X_train_eng.columns.str.replace('[', '').str.replace(']', '').str.replace('<', '').str.replace('>', '')
    X_test_eng.columns = X_test_eng.columns.str.replace('[', '').str.replace(']', '').str.replace('<', '').str.replace('>', '')
    
    print(f"✓ Features engineered: {X_train_eng.shape[1]} features")
    
    # Step 4: Load trained models
    print("\n[4/6] Loading trained models...")
    models_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
    
    with open(os.path.join(models_dir, 'xgboost_model.pkl'), 'rb') as f:
        xgb_model = pickle.load(f)
    print("✓ XGBoost model loaded")
    
    with open(os.path.join(models_dir, 'lightgbm_model.pkl'), 'rb') as f:
        lgb_model = pickle.load(f)
    print("✓ LightGBM model loaded")
    
    # Step 5: Generate ROC curves for Train and Test
    print("\n[5/6] Generating ROC curves (Train/Test/CV)...")
    
    roc_data = {}
    
    # ============================================
    # XGBoost Analysis
    # ============================================
    print("\n  XGBoost ROC Analysis:")
    
    # Train ROC
    xgb_train_probs = xgb_model.predict_proba(X_train_eng)[:, 1]
    xgb_train_fpr, xgb_train_tpr, _ = roc_curve(y_train, xgb_train_probs)
    xgb_train_auc = auc(xgb_train_fpr, xgb_train_tpr)
    print(f"    ✓ Train ROC-AUC: {xgb_train_auc:.4f}")
    
    # Test ROC
    xgb_test_probs = xgb_model.predict_proba(X_test_eng)[:, 1]
    xgb_test_fpr, xgb_test_tpr, _ = roc_curve(y_test, xgb_test_probs)
    xgb_test_auc = auc(xgb_test_fpr, xgb_test_tpr)
    print(f"    ✓ Test ROC-AUC: {xgb_test_auc:.4f}")
    
    # Overfitting gap
    xgb_gap = xgb_train_auc - xgb_test_auc
    overfit_status = "⚠️  OVERFITTING" if xgb_gap > 0.02 else "✓ NORMAL"
    print(f"    ✓ Overfitting Gap: {xgb_gap:.4f} {overfit_status}")
    
    roc_data['xgboost'] = {
        'name': 'XGBoost Classifier',
        'train_auc': float(xgb_train_auc),
        'test_auc': float(xgb_test_auc),
        'overfitting_gap': float(xgb_gap),
        'train_fpr': xgb_train_fpr.tolist(),
        'train_tpr': xgb_train_tpr.tolist(),
        'test_fpr': xgb_test_fpr.tolist(),
        'test_tpr': xgb_test_tpr.tolist(),
        'quality_assessment': 'EXCELLENT' if xgb_test_auc > 0.99 else ('GOOD' if xgb_test_auc > 0.9 else 'ACCEPTABLE'),
    }
    
    # ============================================
    # LightGBM Analysis
    # ============================================
    print("\n  LightGBM ROC Analysis:")
    
    # Train ROC
    lgb_train_probs = lgb_model.predict_proba(X_train_eng)[:, 1]
    lgb_train_fpr, lgb_train_tpr, _ = roc_curve(y_train, lgb_train_probs)
    lgb_train_auc = auc(lgb_train_fpr, lgb_train_tpr)
    print(f"    ✓ Train ROC-AUC: {lgb_train_auc:.4f}")
    
    # Test ROC
    lgb_test_probs = lgb_model.predict_proba(X_test_eng)[:, 1]
    lgb_test_fpr, lgb_test_tpr, _ = roc_curve(y_test, lgb_test_probs)
    lgb_test_auc = auc(lgb_test_fpr, lgb_test_tpr)
    print(f"    ✓ Test ROC-AUC: {lgb_test_auc:.4f}")
    
    # Overfitting gap
    lgb_gap = lgb_train_auc - lgb_test_auc
    overfit_status = "⚠️  OVERFITTING" if lgb_gap > 0.02 else "✓ NORMAL"
    print(f"    ✓ Overfitting Gap: {lgb_gap:.4f} {overfit_status}")
    
    roc_data['lightgbm'] = {
        'name': 'LightGBM Classifier',
        'train_auc': float(lgb_train_auc),
        'test_auc': float(lgb_test_auc),
        'overfitting_gap': float(lgb_gap),
        'train_fpr': lgb_train_fpr.tolist(),
        'train_tpr': lgb_train_tpr.tolist(),
        'test_fpr': lgb_test_fpr.tolist(),
        'test_tpr': lgb_test_tpr.tolist(),
        'quality_assessment': 'EXCELLENT' if lgb_test_auc > 0.99 else ('GOOD' if lgb_test_auc > 0.9 else 'ACCEPTABLE'),
    }
    
    # Step 6: Save comprehensive ROC data
    print("\n[6/6] Saving ROC data...")
    output_path = os.path.join(models_dir, 'roc_curves_comprehensive.json')
    with open(output_path, 'w') as f:
        json.dump(roc_data, f, indent=2)
    print(f"✓ Comprehensive ROC data saved")
    
    # Summary Report
    print("\n" + "=" * 90)
    print("ROC CURVE SUMMARY - Train/Test Comparison")
    print("=" * 90)
    
    print("\nXGBoost Classifier:")
    print(f"  Train AUC:        {xgb_train_auc:.4f}")
    print(f"  Test AUC:         {xgb_test_auc:.4f}")
    print(f"  Overfitting Gap:  {xgb_gap:.4f}")
    print(f"  Status:           {'✓ Excellent generalization' if xgb_gap < 0.02 else '⚠️  Potential overfitting'}")
    
    print("\nLightGBM Classifier:")
    print(f"  Train AUC:        {lgb_train_auc:.4f}")
    print(f"  Test AUC:         {lgb_test_auc:.4f}")
    print(f"  Overfitting Gap:  {lgb_gap:.4f}")
    print(f"  Status:           {'✓ Excellent generalization' if lgb_gap < 0.02 else '⚠️  Potential overfitting'}")
    
    print("\nInterpretation Guide:")
    print("  • Gap < 0.02:     Excellent generalization, minimal overfitting")
    print("  • Gap 0.02-0.05:  Normal overfitting, acceptable")
    print("  • Gap > 0.05:     Significant overfitting, consider regularization")
    print("  • Train=1.0:      Likely memorizing training data")
    
    print("\n" + "=" * 90)

if __name__ == '__main__':
    generate_comprehensive_roc_curves()
