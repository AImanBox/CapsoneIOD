#!/usr/bin/env python3
"""
@file retrain_models.py
@description Complete retraining pipeline with configurable parameters
@module ml.scripts.retrain_models
@created 2026-03-08

This script retrains all AI models with specified parameters:
1. Loads machine_failure.csv
2. Splits into train/test with test_size=0.2, random_state=42 (stratified)
3. Preprocesses and engineers features
4. Trains XGBoost model
5. Trains LightGBM model
6. Evaluates and saves models with metrics
7. Updates model registry
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


class RetrainingPipeline:
    """Complete retraining pipeline with configurable parameters."""
    
    def __init__(self, test_size: float = 0.2, random_state: int = 42):
        """
        Initialize retraining pipeline.
        
        @param test_size Fraction of data for testing (default 0.2 for 80/20 split)
        @param random_state Random seed for reproducibility (default 42)
        """
        self.test_size = test_size
        self.random_state = random_state
        
        self.data_dir = Path('docs')
        self.output_dir = Path('ml/models')
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.data_loader = DataLoader(data_dir='docs')
        self.feature_engineer = FeatureEngineer()
        
        self.label_encoder = LabelEncoder()
        self.models = {}
        self.metrics = {}
        self.timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        print(f"\n{'='*70}")
        print(f"RETRAINING PIPELINE INITIALIZED")
        print(f"{'='*70}")
        print(f"Test Size: {self.test_size} ({self.test_size*100:.0f}%)")
        print(f"Train Size: {1-self.test_size} ({(1-self.test_size)*100:.0f}%)")
        print(f"Random State: {self.random_state}")
        print(f"Timestamp: {self.timestamp}")
    
    def prepare_datasets(self):
        """Load and split machine_failure.csv into train/test with configured parameters."""
        print("\n" + "="*70)
        print("STEP 1: PREPARE DATASETS FROM machine_failure.csv")
        print("="*70)
        
        # Load the machine failure dataset
        if not (self.data_dir / 'machine_failure.csv').exists():
            raise FileNotFoundError(f"machine_failure.csv not found in {self.data_dir}")
        
        df = pd.read_csv(self.data_dir / 'machine_failure.csv')
        print(f"\n✅ Loaded machine_failure.csv: {len(df)} rows × {len(df.columns)} columns")
        
        # Show class distribution
        print(f"\n📊 Original Dataset Class Distribution:")
        class_counts = df['Machine failure'].value_counts()
        print(f"   No Failure (0): {class_counts[0]} samples ({class_counts[0]/len(df):.2%})")
        print(f"   Failure (1):    {class_counts[1]} samples ({class_counts[1]/len(df):.2%})")
        print(f"   Overall Failure Rate: {df['Machine failure'].mean():.2%}")
        
        # Stratified split with configured test_size and random_state
        X = df.drop('Machine failure', axis=1)
        y = df['Machine failure']
        
        print(f"\n🔀 Splitting dataset...")
        print(f"   Strategy: Stratified random split")
        print(f"   Test Size: {self.test_size} ({self.test_size*100:.1f}%)")
        print(f"   Train Size: {1-self.test_size} ({(1-self.test_size)*100:.1f}%)")
        print(f"   Random State: {self.random_state}")
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, 
            test_size=self.test_size,
            stratify=y,
            random_state=self.random_state
        )
        
        print(f"\n✅ Train/Test Split (stratified):")
        print(f"   Train: {len(X_train)} samples")
        print(f"      - No Failure (0): {(y_train == 0).sum()} samples ({(y_train == 0).sum()/len(y_train):.2%})")
        print(f"      - Failure (1):    {(y_train == 1).sum()} samples ({(y_train == 1).sum()/len(y_train):.2%})")
        print(f"   Test:  {len(X_test)} samples")
        print(f"      - No Failure (0): {(y_test == 0).sum()} samples ({(y_test == 0).sum()/len(y_test):.2%})")
        print(f"      - Failure (1):    {(y_test == 1).sum()} samples ({(y_test == 1).sum()/len(y_test):.2%})")
        
        # Save train/test splits
        train_df = X_train.copy()
        train_df['Machine failure'] = y_train.values
        test_df = X_test.copy()
        test_df['Machine failure'] = y_test.values
        
        train_path = self.data_dir / 'train.csv'
        test_path = self.data_dir / 'test.csv'
        
        train_df.to_csv(train_path, index=False)
        test_df.to_csv(test_path, index=False)
        
        print(f"\n✅ Saved train/test splits:")
        print(f"   - {train_path} ({len(train_df)} rows)")
        print(f"   - {test_path} ({len(test_df)} rows)")
        
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
        print(f"   ✓ Categorical encoding complete")
        
        # Engineer features
        print("\n🔧 Engineering features...")
        train_df = self.feature_engineer.engineer_features(train_df, include_advanced=True)
        test_df = self.feature_engineer.engineer_features(test_df, include_advanced=True)
        print(f"   ✓ Feature engineering complete")
        
        # Extract features and targets
        feature_cols = [col for col in train_df.columns if col != 'Machine failure']
        X_train_processed = train_df[feature_cols]
        X_test_processed = test_df[feature_cols]
        y_train_processed = train_df['Machine failure']
        y_test_processed = test_df['Machine failure']
        
        # Convert any remaining object columns to numeric
        print("\n🔢 Converting any remaining object columns to numeric...")
        for col in X_train_processed.columns:
            if X_train_processed[col].dtype == 'object':
                print(f"   Converting {col} from object to numeric...")
                # Try to convert to numeric, coercing errors to NaN then fill with mode
                X_train_processed[col] = pd.to_numeric(X_train_processed[col], errors='coerce')
                X_test_processed[col] = pd.to_numeric(X_test_processed[col], errors='coerce')
                # Fill NaN with median
                fill_value = X_train_processed[col].median()
                X_train_processed[col].fillna(fill_value, inplace=True)
                X_test_processed[col].fillna(fill_value, inplace=True)
        print(f"   ✓ All columns converted to numeric types")
        
        # Clean column names for XGBoost compatibility
        print("\n🧹 Cleaning column names for model compatibility...")
        # XGBoost doesn't allow [ ] < > in feature names
        X_train_processed = X_train_processed.copy()
        X_test_processed = X_test_processed.copy()
        
        new_cols = {}
        for col in X_train_processed.columns:
            clean_col = col.replace('[', '').replace(']', '').replace('<', '').replace('>', '')
            new_cols[col] = clean_col
        
        X_train_processed.rename(columns=new_cols, inplace=True)
        X_test_processed.rename(columns=new_cols, inplace=True)
        feature_cols = X_train_processed.columns.tolist()
        print(f"   ✓ Column names cleaned")
        
        print(f"\n✅ Features engineered: {len(feature_cols)} features")
        print(f"   Sample features: {feature_cols[:5]}")
        if len(feature_cols) > 5:
            print(f"   ... and {len(feature_cols)-5} more")
        
        # Calculate class weight for imbalance handling
        num_negatives = (y_train_processed == 0).sum()
        num_positives = (y_train_processed == 1).sum()
        scale_pos_weight = num_negatives / num_positives
        
        print(f"\n⚖️  Class Imbalance Handling:")
        print(f"   Training set negative samples: {num_negatives}")
        print(f"   Training set positive samples: {num_positives}")
        print(f"   Scale pos weight: {scale_pos_weight:.2f} ({num_negatives}:{num_positives})")
        print(f"   This means: One positive failure is weighted as {scale_pos_weight:.2f} negative samples")
        
        return X_train_processed, X_test_processed, y_train_processed, y_test_processed, scale_pos_weight
    
    def train_xgboost(self, X_train, X_test, y_train, y_test, scale_pos_weight):
        """Train XGBoost model with optimized hyperparameters."""
        print("\n" + "="*70)
        print("STEP 3A: TRAIN XGBOOST MODEL")
        print("="*70)
        
        params = {
            'max_depth': 8,
            'learning_rate': 0.1,
            'n_estimators': 200,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'random_state': self.random_state,
            'verbosity': 1,
            'scale_pos_weight': scale_pos_weight,
            'eval_metric': 'logloss'
        }
        
        print(f"\n🎯 XGBoost Hyperparameters:")
        for key, val in params.items():
            print(f"   {key}: {val}")
        
        print(f"\n🚀 Training XGBoost on {len(X_train)} samples with {X_train.shape[1]} features...")
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
        
        print(f"\n📊 XGBoost Performance Metrics:")
        print(f"   ROC-AUC:  {metrics['rocAuc']:.4f}")
        print(f"   Precision: {metrics['precision']:.4f}")
        print(f"   Recall:    {metrics['recall']:.4f}")
        print(f"   F1-Score:  {metrics['f1Score']:.4f}")
        print(f"   Accuracy:  {metrics['accuracy']:.4f}")
        print(f"\n📋 Confusion Matrix:")
        print(f"   True Negatives:  {metrics['confusionMatrix']['trueNegatives']}")
        print(f"   False Positives: {metrics['confusionMatrix']['falsePositives']}")
        print(f"   False Negatives: {metrics['confusionMatrix']['falseNegatives']}")
        print(f"   True Positives:  {metrics['confusionMatrix']['truePositives']}")
        
        self.models['xgboost'] = model
        self.metrics['xgboost'] = metrics
        
        return model, metrics
    
    def train_lightgbm(self, X_train, X_test, y_train, y_test, scale_pos_weight):
        """Train LightGBM model with optimized hyperparameters."""
        print("\n" + "="*70)
        print("STEP 3B: TRAIN LIGHTGBM MODEL")
        print("="*70)
        
        params = {
            'max_depth': 8,
            'learning_rate': 0.1,
            'n_estimators': 200,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'random_state': self.random_state,
            'verbosity': -1,
            'scale_pos_weight': scale_pos_weight,
        }
        
        print(f"\n🎯 LightGBM Hyperparameters:")
        for key, val in params.items():
            print(f"   {key}: {val}")
        
        print(f"\n🚀 Training LightGBM on {len(X_train)} samples with {X_train.shape[1]} features...")
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
        
        print(f"\n📊 LightGBM Performance Metrics:")
        print(f"   ROC-AUC:  {metrics['rocAuc']:.4f}")
        print(f"   Precision: {metrics['precision']:.4f}")
        print(f"   Recall:    {metrics['recall']:.4f}")
        print(f"   F1-Score:  {metrics['f1Score']:.4f}")
        print(f"   Accuracy:  {metrics['accuracy']:.4f}")
        print(f"\n📋 Confusion Matrix:")
        print(f"   True Negatives:  {metrics['confusionMatrix']['trueNegatives']}")
        print(f"   False Positives: {metrics['confusionMatrix']['falsePositives']}")
        print(f"   False Negatives: {metrics['confusionMatrix']['falseNegatives']}")
        print(f"   True Positives:  {metrics['confusionMatrix']['truePositives']}")
        
        self.models['lightgbm'] = model
        self.metrics['lightgbm'] = metrics
        
        return model, metrics
    
    def save_models_and_registry(self):
        """Save trained models and generate registry."""
        print("\n" + "="*70)
        print("STEP 4: SAVE MODELS & CREATE REGISTRY")
        print("="*70)
        
        # Save models as pickle files
        print("\n💾 Saving models...")
        for model_name, model in self.models.items():
            model_path = self.output_dir / f"{model_name}_model.pkl"
            with open(model_path, 'wb') as f:
                pickle.dump(model, f)
            print(f"   ✓ Saved {model_name} → {model_path}")
        
        # Create model registry
        registry = {
            'timestamp': self.timestamp,
            'trainingConfig': {
                'testSize': self.test_size,
                'randomState': self.random_state,
                'splitStrategy': 'Stratified Random Split',
                'datasetSize': 10000,
            },
            'models': {}
        }
        
        for model_name, metrics in self.metrics.items():
            registry['models'][model_name] = {
                'name': model_name,
                'type': 'xgboost' if 'xgboost' in model_name else 'lightgbm',
                'status': 'production',
                'trainingDate': datetime.now().isoformat(),
                'metrics': metrics
            }
        
        # Save registry
        registry_path = self.output_dir / 'model_comparison_results.json'
        with open(registry_path, 'w') as f:
            json.dump(registry, f, indent=2)
        
        print(f"\n   ✓ Saved model registry → {registry_path}")
        
        # Also save as ML_models.json for compatibility
        ml_models_path = self.output_dir / 'ML_models.json'
        with open(ml_models_path, 'w') as f:
            json.dump(registry, f, indent=2)
        print(f"   ✓ Saved ML_models.json → {ml_models_path}")
        
        print(f"\n📋 Model Registry Summary:")
        print(json.dumps(registry, indent=2))
    
    def run_full_pipeline(self):
        """Execute complete retraining pipeline."""
        print("\n" + "🚀 "*35)
        print("MACHINE FAILURE PREDICTION - FULL RETRAINING PIPELINE")
        print("🚀 "*35)
        print(f"Configuration: test_size={self.test_size}, random_state={self.random_state}")
        
        try:
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
            
            print("\n" + "✅ "*35)
            print("RETRAINING PIPELINE COMPLETE!")
            print("✅ "*35)
            
            return {
                'xgboost': (xgb_model, xgb_metrics),
                'lightgbm': (lgb_model, lgb_metrics),
                'config': {
                    'test_size': self.test_size,
                    'random_state': self.random_state,
                    'timestamp': self.timestamp
                }
            }
        
        except Exception as e:
            print(f"\n❌ ERROR during training pipeline: {e}")
            import traceback
            traceback.print_exc()
            raise


if __name__ == '__main__':
    # Retrain with test_size=0.2 and random_state=42
    trainer = RetrainingPipeline(test_size=0.2, random_state=42)
    results = trainer.run_full_pipeline()
