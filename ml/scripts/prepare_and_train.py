#!/usr/bin/env python3
"""
@file prepare_and_train.py
@description Complete pipeline: prepare machine_failure.csv and train all models
@module ml.scripts.prepare_and_train
@created 2026-03-07

This script:
1. Loads machine_failure.csv
2. Splits into train/test stratified by target
3. Trains XGBoost model
4. Trains LightGBM model
5. Evaluates and saves models with metrics
"""

import os
import sys
import json
import pickle
from pathlib import Path
from datetime import datetime
from typing import Dict, Tuple, Any

import pandas as pd
import numpy as np
import xgboost as xgb
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    roc_auc_score, precision_score, recall_score, f1_score,
    accuracy_score, confusion_matrix, classification_report
)

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from data_loader import DataLoader
from feature_engineering import FeatureEngineer


class FullPipelineTrainer:
    """Complete training pipeline with data preparation."""
    
    def __init__(self):
        self.data_dir = Path('docs')
        self.output_dir = Path('ml/models')
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.data_loader = DataLoader(data_dir='docs')
        self.feature_engineer = FeatureEngineer()
        
        self.label_encoder = LabelEncoder()
        self.models = {}
        self.metrics = {}
        self.timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    def prepare_datasets(self):
        """Load and split machine_failure.csv into train/test."""
        print("\n" + "="*70)
        print("STEP 1: PREPARE DATASETS FROM machine_failure.csv")
        print("="*70)
        
        # Load the machine failure dataset
        df = pd.read_csv(self.data_dir / 'machine_failure.csv')
        print(f"\n✅ Loaded machine_failure.csv: {len(df)} rows × {len(df.columns)} columns")
        
        # Show class distribution
        print(f"\n📊 Class distribution:")
        print(df['Machine failure'].value_counts())
        print(f"   Failure rate: {df['Machine failure'].mean():.2%}")
        
        # Stratified split: 70% train, 30% test
        X = df.drop('Machine failure', axis=1)
        y = df['Machine failure']
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, 
            test_size=0.3,
            stratify=y,
            random_state=42
        )
        
        print(f"\n✅ Train/Test Split (stratified):")
        print(f"   Train: {len(X_train)} samples ({y_train.sum()} failures, {y_train.mean():.2%})")
        print(f"   Test:  {len(X_test)} samples ({y_test.sum()} failures, {y_test.mean():.2%})")
        
        # Save train/test splits
        train_df = X_train.copy()
        train_df['Machine failure'] = y_train.values
        test_df = X_test.copy()
        test_df['Machine failure'] = y_test.values
        
        train_df.to_csv(self.data_dir / 'train.csv', index=False)
        test_df.to_csv(self.data_dir / 'test.csv', index=False)
        
        print(f"\n✅ Saved:")
        print(f"   - docs/train.csv ({len(train_df)} rows)")
        print(f"   - docs/test.csv ({len(test_df)} rows)")
        
        return X_train, X_test, y_train, y_test
    
    def preprocess_and_engineer(self, X_train, X_test, y_train, y_test):
        """Preprocess features and engineer new ones."""
        print("\n" + "="*70)
        print("STEP 2: PREPROCESS & ENGINEER FEATURES")
        print("="*70)
        
        # Convert to DataFrame for preprocessing
        train_df = X_train.copy()
        train_df['Machine failure'] = y_train.values
        
        test_df = X_test.copy()
        test_df['Machine failure'] = y_test.values
        
        # Preprocess (encode Type column)
        print("\n🔤 Encoding categorical features...")
        train_df = self.data_loader.preprocess_features(train_df, fit=True)
        test_df = self.data_loader.preprocess_features(test_df, fit=False)
        
        # Engineer features
        print("\n🔧 Engineering features...")
        train_df = self.feature_engineer.engineer_features(train_df, include_advanced=True)
        test_df = self.feature_engineer.engineer_features(test_df, include_advanced=True)
        
        # Extract features and targets
        feature_cols = [col for col in train_df.columns if col != 'Machine failure']
        X_train_processed = train_df[feature_cols]
        X_test_processed = test_df[feature_cols]
        y_train_processed = train_df['Machine failure']
        y_test_processed = test_df['Machine failure']
        
        print(f"\n✅ Features engineered: {len(feature_cols)} features")
        print(f"   Features: {feature_cols[:5]}... (+{len(feature_cols)-5} more)")
        
        # Calculate class weight
        scale_pos_weight = (y_train_processed == 0).sum() / (y_train_processed == 1).sum()
        print(f"\n📊 Class weight (scale_pos_weight): {scale_pos_weight:.2f}")
        
        return X_train_processed, X_test_processed, y_train_processed, y_test_processed, scale_pos_weight
    
    def train_xgboost(self, X_train, X_test, y_train, y_test, scale_pos_weight):
        """Train XGBoost model."""
        print("\n" + "="*70)
        print("STEP 3A: TRAIN XGBOOST MODEL")
        print("="*70)
        
        params = {
            'max_depth': 8,
            'learning_rate': 0.1,
            'n_estimators': 200,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'random_state': 42,
            'verbosity': 1,
            'scale_pos_weight': scale_pos_weight,
            'eval_metric': 'logloss'
        }
        
        print(f"\nXGBoost Parameters:")
        for key, val in params.items():
            print(f"  {key}: {val}")
        
        print(f"\n🚀 Training on {len(X_train)} samples...")
        model = xgb.XGBClassifier(**params)
        model.fit(X_train, y_train)
        
        # Evaluate
        print(f"\n✅ XGBoost training complete!")
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)[:, 1]
        
        metrics = {
            'rocAuc': float(roc_auc_score(y_test, y_pred_proba)),
            'precision': float(precision_score(y_test, y_pred)),
            'recall': float(recall_score(y_test, y_pred)),
            'f1Score': float(f1_score(y_test, y_pred)),
            'accuracy': float(accuracy_score(y_test, y_pred)),
        }
        
        cm = confusion_matrix(y_test, y_pred)
        metrics['confusionMatrix'] = {
            'trueNegatives': int(cm[0, 0]),
            'falsePositives': int(cm[0, 1]),
            'falseNegatives': int(cm[1, 0]),
            'truePositives': int(cm[1, 1]),
        }
        
        print(f"\n📊 XGBoost Metrics:")
        print(f"   ROC-AUC:  {metrics['rocAuc']:.4f}")
        print(f"   Precision: {metrics['precision']:.4f}")
        print(f"   Recall:    {metrics['recall']:.4f}")
        print(f"   F1-Score:  {metrics['f1Score']:.4f}")
        print(f"   Accuracy:  {metrics['accuracy']:.4f}")
        
        self.models['xgboost_v5'] = model
        self.metrics['xgboost_v5'] = metrics
        
        return model, metrics
    
    def train_lightgbm(self, X_train, X_test, y_train, y_test, scale_pos_weight):
        """Train LightGBM model."""
        print("\n" + "="*70)
        print("STEP 3B: TRAIN LIGHTGBM MODEL")
        print("="*70)
        
        params = {
            'max_depth': 8,
            'learning_rate': 0.1,
            'n_estimators': 200,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'random_state': 42,
            'verbosity': -1,
            'scale_pos_weight': scale_pos_weight,
        }
        
        print(f"\nLightGBM Parameters:")
        for key, val in params.items():
            print(f"  {key}: {val}")
        
        print(f"\n🚀 Training on {len(X_train)} samples...")
        model = lgb.LGBMClassifier(**params)
        model.fit(X_train, y_train)
        
        # Evaluate
        print(f"\n✅ LightGBM training complete!")
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)[:, 1]
        
        metrics = {
            'rocAuc': float(roc_auc_score(y_test, y_pred_proba)),
            'precision': float(precision_score(y_test, y_pred)),
            'recall': float(recall_score(y_test, y_pred)),
            'f1Score': float(f1_score(y_test, y_pred)),
            'accuracy': float(accuracy_score(y_test, y_pred)),
        }
        
        cm = confusion_matrix(y_test, y_pred)
        metrics['confusionMatrix'] = {
            'trueNegatives': int(cm[0, 0]),
            'falsePositives': int(cm[0, 1]),
            'falseNegatives': int(cm[1, 0]),
            'truePositives': int(cm[1, 1]),
        }
        
        print(f"\n📊 LightGBM Metrics:")
        print(f"   ROC-AUC:  {metrics['rocAuc']:.4f}")
        print(f"   Precision: {metrics['precision']:.4f}")
        print(f"   Recall:    {metrics['recall']:.4f}")
        print(f"   F1-Score:  {metrics['f1Score']:.4f}")
        print(f"   Accuracy:  {metrics['accuracy']:.4f}")
        
        self.models['lightgbm_v3'] = model
        self.metrics['lightgbm_v3'] = metrics
        
        return model, metrics
    
    def save_models_and_registry(self):
        """Save trained models and generate registry."""
        print("\n" + "="*70)
        print("STEP 4: SAVE MODELS & CREATE REGISTRY")
        print("="*70)
        
        # Save models as pickle files
        for model_name, model in self.models.items():
            model_path = self.output_dir / f"{model_name}.pkl"
            with open(model_path, 'wb') as f:
                pickle.dump(model, f)
            print(f"✅ Saved {model_name} → {model_path}")
        
        # Create model registry
        registry = {
            'timestamp': self.timestamp,
            'datasetSize': 10000,  # Placeholder, update with actual
            'models': {}
        }
        
        for model_name, metrics in self.metrics.items():
            registry['models'][model_name] = {
                'name': model_name,
                'type': 'xgboost' if 'xgboost' in model_name else 'lightgbm',
                'version': model_name.split('_')[1] if '_' in model_name else '1',
                'status': 'production',
                'trainingDate': datetime.now().isoformat(),
                'metrics': metrics
            }
        
        # Save registry
        registry_path = self.output_dir / 'ML_models.json'
        with open(registry_path, 'w') as f:
            json.dump(registry, f, indent=2)
        
        print(f"\n✅ Saved model registry → {registry_path}")
        
        # Display summary
        print(f"\n📋 Model Registry Summary:")
        print(json.dumps(registry, indent=2))
    
    def run_full_pipeline(self):
        """Execute complete training pipeline."""
        print("\n" + "🚀 "*30)
        print("MACHINE FAILURE PREDICTION - FULL TRAINING PIPELINE")
        print("🚀 "*30)
        
        # Step 1: Prepare datasets
        X_train, X_test, y_train, y_test = self.prepare_datasets()
        
        # Step 2: Preprocess and engineer features
        X_train_p, X_test_p, y_train_p, y_test_p, scale_pos_weight = self.preprocess_and_engineer(
            X_train, X_test, y_train, y_test
        )
        
        # Step 3: Train models
        xgb_model, xgb_metrics = self.train_xgboost(X_train_p, X_test_p, y_train_p, y_test_p, scale_pos_weight)
        lgb_model, lgb_metrics = self.train_lightgbm(X_train_p, X_test_p, y_train_p, y_test_p, scale_pos_weight)
        
        # Step 4: Save models and registry
        self.save_models_and_registry()
        
        print("\n" + "✅ "*30)
        print("TRAINING PIPELINE COMPLETE!")
        print("✅ "*30)
        
        return {
            'xgboost': (xgb_model, xgb_metrics),
            'lightgbm': (lgb_model, lgb_metrics)
        }


if __name__ == '__main__':
    trainer = FullPipelineTrainer()
    results = trainer.run_full_pipeline()
