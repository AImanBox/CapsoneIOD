"""
@file train_models.py
@description Main model training script for machine failure prediction
@module ml.scripts.train_models
@created 2026-02-08

Trains XGBoost and LightGBM models on the binary classification dataset.
Handles class imbalance, hyperparameter optimization, and model evaluation.
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
from sklearn.metrics import (
    roc_auc_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, roc_curve, auc
)
import matplotlib.pyplot as plt

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from data_loader import DataLoader
from feature_engineering import FeatureEngineer


class ModelTrainer:
    """
    Train and evaluate gradient boosting models.
    
    @description
    Manages the complete training pipeline including data loading,
    preprocessing, feature engineering, model training, and evaluation.
    """
    
    def __init__(self, output_dir: str = 'ml/models', data_dir: str = 'docs'):
        """
        Initialize trainer.
        
        @param output_dir Directory to save trained models and metrics
        @param data_dir Directory containing train.csv and test.csv
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.data_loader = DataLoader(data_dir=data_dir)
        self.feature_engineer = FeatureEngineer()
        
        self.models = {}
        self.metrics = {}
        self.timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
    def load_and_prepare_data(self, test_size: float = 0.2):
        """
        Load, preprocess, and engineer features.
        
        @param test_size Fraction for test set
        @returns Tuple of (X_train, X_test, y_train, y_test, scale_pos_weight)
        """
        print("\n" + "="*70)
        print("STEP 1: LOAD AND PREPARE DATA")
        print("="*70)
        
        # Load training data
        df_train = self.data_loader.load_train_data()
        df_train = self.data_loader.preprocess_features(df_train, fit=True)
        
        # Engineer features
        print("\n🔧 Engineering features...")
        df_train = self.feature_engineer.engineer_features(df_train, include_advanced=True)
        
        # Extract features and target
        X_train, y_train = self.data_loader.extract_features_target(df_train, include_failure_modes=True)
        
        # Split data
        X_train, X_test, y_train, y_test = self.data_loader.train_test_split_stratified(
            X_train, y_train, test_size=test_size
        )
        
        # Calculate class weight
        scale_pos_weight = self.data_loader.get_class_weight(y_train)
        print(f"\n📊 Class weight (scale_pos_weight): {scale_pos_weight:.2f}")
        print(f"   This accounts for ~{scale_pos_weight:.0f}:1 negative:positive ratio")
        
        return X_train, X_test, y_train, y_test, scale_pos_weight
    
    def train_xgboost(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        scale_pos_weight: float,
        params: Dict[str, Any] = None
    ) -> xgb.XGBClassifier:
        """
        Train XGBoost model.
        
        @param X_train Training features
        @param y_train Training target
        @param scale_pos_weight Class weight for imbalance handling
        @param params Optional hyperparameters (uses defaults if None)
        @returns Trained XGBClassifier
        """
        print("\n" + "="*70)
        print("STEP 2A: TRAIN XGBOOST MODEL")
        print("="*70)
        
        if params is None:
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
        
        model = xgb.XGBClassifier(**params)
        
        print(f"\n🚀 Training on {len(X_train)} samples with {X_train.shape[1]} features...")
        model.fit(X_train, y_train)
        
        print(f"✅ XGBoost training complete!")
        
        return model
    
    def train_lightgbm(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        scale_pos_weight: float,
        params: Dict[str, Any] = None
    ) -> lgb.LGBMClassifier:
        """
        Train LightGBM model.
        
        @param X_train Training features
        @param y_train Training target
        @param scale_pos_weight Class weight for imbalance handling
        @param params Optional hyperparameters (uses defaults if None)
        @returns Trained LGBMClassifier
        """
        print("\n" + "="*70)
        print("STEP 2B: TRAIN LIGHTGBM MODEL")
        print("="*70)
        
        if params is None:
            params = {
                'max_depth': 8,
                'learning_rate': 0.1,
                'n_estimators': 200,
                'subsample': 0.8,
                'colsample_bytree': 0.8,
                'random_state': 42,
                'verbose': 1,
                'scale_pos_weight': scale_pos_weight,
                'metric': 'auc'
            }
        
        print(f"\nLightGBM Parameters:")
        for key, val in params.items():
            print(f"  {key}: {val}")
        
        model = lgb.LGBMClassifier(**params)
        
        print(f"\n🚀 Training on {len(X_train)} samples with {X_train.shape[1]} features...")
        model.fit(X_train, y_train)
        
        print(f"✅ LightGBM training complete!")
        
        return model
    
    def evaluate_model(
        self,
        model,
        X_test: pd.DataFrame,
        y_test: pd.Series,
        model_name: str
    ) -> Dict[str, float]:
        """
        Evaluate model performance.
        
        @param model Trained model
        @param X_test Test features
        @param y_test Test target
        @param model_name Name of model for reporting
        @returns Dict of evaluation metrics
        """
        print(f"\n📊 Evaluating {model_name}...")
        
        # Predictions
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)[:, 1]
        
        # Metrics
        metrics = {
            'roc_auc': roc_auc_score(y_test, y_pred_proba),
            'precision': precision_score(y_test, y_pred),
            'recall': recall_score(y_test, y_pred),
            'f1': f1_score(y_test, y_pred),
            'accuracy': model.score(X_test, y_test)
        }
        
        print(f"\n{model_name} Performance:")
        print(f"  ROC-AUC:  {metrics['roc_auc']:.4f}")
        print(f"  Precision: {metrics['precision']:.4f}")
        print(f"  Recall:   {metrics['recall']:.4f}")
        print(f"  F1 Score: {metrics['f1']:.4f}")
        print(f"  Accuracy: {metrics['accuracy']:.4f}")
        
        # Confusion matrix
        tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
        print(f"\nConfusion Matrix:")
        print(f"  True Negatives:  {tn}")
        print(f"  False Positives: {fp}")
        print(f"  False Negatives: {fn}")
        print(f"  True Positives:  {tp}")
        
        return metrics
    
    def train_and_evaluate(self):
        """
        Execute complete training pipeline.
        
        @returns Dict with all models and metrics
        """
        print("\n" + "="*70)
        print("MACHINE FAILURE PREDICTION - MODEL TRAINING")
        print("="*70)
        print(f"Dataset: Binary Classification of Machine Failures (Kaggle)")
        print(f"Source: https://github.com/JMViJi/Binary-Classification-of-Machine-Failures")
        print(f"Timestamp: {self.timestamp}")
        
        # Data preparation
        X_train, X_test, y_train, y_test, scale_pos_weight = self.load_and_prepare_data()
        
        # Train both models
        xgb_model = self.train_xgboost(X_train, y_train, scale_pos_weight)
        lgb_model = self.train_lightgbm(X_train, y_train, scale_pos_weight)
        
        # Evaluate
        print("\n" + "="*70)
        print("STEP 3: MODEL EVALUATION")
        print("="*70)
        
        xgb_metrics = self.evaluate_model(xgb_model, X_test, y_test, 'XGBoost')
        lgb_metrics = self.evaluate_model(lgb_model, X_test, y_test, 'LightGBM')
        
        # Store results
        self.models['xgboost'] = xgb_model
        self.models['lightgbm'] = lgb_model
        self.metrics['xgboost'] = xgb_metrics
        self.metrics['lightgbm'] = lgb_metrics
        
        # Save models and metrics
        print("\n" + "="*70)
        print("STEP 4: SAVE MODELS AND METRICS")
        print("="*70)
        
        self._save_models_and_metrics(X_train.columns.tolist())
        
        return {
            'models': self.models,
            'metrics': self.metrics,
            'feature_columns': X_train.columns.tolist(),
            'scale_pos_weight': scale_pos_weight
        }
    
    def _save_models_and_metrics(self, feature_columns: list):
        """Save trained models and evaluation metrics to disk."""
        
        # Save models
        for model_name, model in self.models.items():
            model_path = self.output_dir / f'{model_name}_model_{self.timestamp}.pkl'
            with open(model_path, 'wb') as f:
                pickle.dump(model, f)
            print(f"\n✅ Saved {model_name} model: {model_path}")
        
        # Save metrics
        metrics_path = self.output_dir / f'training_metrics_{self.timestamp}.json'
        metrics_data = {
            'timestamp': self.timestamp,
            'xgboost': self.metrics['xgboost'],
            'lightgbm': self.metrics['lightgbm'],
            'feature_count': len(feature_columns),
            'dataset_info': {
                'source': 'Binary Classification of Machine Failures (Kaggle)',
                'repository': 'https://github.com/JMViJi/Binary-Classification-of-Machine-Failures',
            }
        }
        
        with open(metrics_path, 'w') as f:
            json.dump(metrics_data, f, indent=2)
        print(f"✅ Saved metrics: {metrics_path}")
        
        # Save feature columns
        features_path = self.output_dir / f'feature_columns_{self.timestamp}.json'
        with open(features_path, 'w') as f:
            json.dump({'feature_columns': feature_columns}, f, indent=2)
        print(f"✅ Saved feature columns: {features_path}")
        
        print(f"\n📁 All outputs saved to: {self.output_dir}")


if __name__ == '__main__':
    trainer = ModelTrainer(output_dir='ml/models', data_dir='docs')
    results = trainer.train_and_evaluate()
    
    print("\n" + "="*70)
    print("✅ MODEL TRAINING COMPLETE")
    print("="*70)
    print(f"Models trained: {list(results['models'].keys())}")
    print(f"Features engineered: {len(results['feature_columns'])}")
    print(f"Output directory: ml/models")
