#!/usr/bin/env python3
"""
@file compare_models_datasets.py
@description Train models on both machine_failure.csv and train.csv, compare results
@module ml.scripts.compare_models_datasets
@created 2026-03-07
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

sys.path.insert(0, str(Path(__file__).parent.parent))
from data_loader import DataLoader
from feature_engineering import FeatureEngineer


class ModelComparison:
    """Compare model performance across different datasets."""
    
    def __init__(self):
        self.data_dir = Path('docs')
        self.output_dir = Path('ml/models')
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.data_loader = DataLoader(data_dir='docs')
        self.feature_engineer = FeatureEngineer()
        self.results = {
            'machine_failure': {},
            'train': {}
        }
    
    def analyze_datasets(self):
        """Analyze both datasets."""
        print("\n" + "="*70)
        print("DATASET ANALYSIS & COMPARISON")
        print("="*70)
        
        # Load datasets
        mf_df = pd.read_csv(self.data_dir / 'machine_failure.csv')
        train_df = pd.read_csv(self.data_dir / 'train.csv')
        
        # Analysis
        mf_stats = {
            'rows': len(mf_df),
            'cols': len(mf_df.columns),
            'failures': int(mf_df['Machine failure'].sum()),
            'failure_rate': float(mf_df['Machine failure'].mean()),
            'features_count': len(mf_df.columns) - 1  # excluding target
        }
        
        train_stats = {
            'rows': len(train_df),
            'cols': len(train_df.columns),
            'failures': int(train_df['Machine failure'].sum()),
            'failure_rate': float(train_df['Machine failure'].mean()),
            'features_count': len(train_df.columns) - 1
        }
        
        print(f"\n📊 machine_failure.csv:")
        print(f"   Rows: {mf_stats['rows']:,}")
        print(f"   Failures: {mf_stats['failures']} ({mf_stats['failure_rate']:.2%})")
        print(f"   Non-failures: {mf_stats['rows'] - mf_stats['failures']} ({100 - mf_stats['failure_rate']*100:.2f}%)")
        
        print(f"\n📊 train.csv:")
        print(f"   Rows: {train_stats['rows']:,}")
        print(f"   Failures: {train_stats['failures']} ({train_stats['failure_rate']:.2%})")
        print(f"   Non-failures: {train_stats['rows'] - train_stats['failures']} ({100 - train_stats['failure_rate']*100:.2f}%)")
        
        return mf_df, train_df, mf_stats, train_stats
    
    def prepare_dataset(self, df: pd.DataFrame, dataset_name: str):
        """Prepare dataset for training."""
        print(f"\n🔧 Preparing {dataset_name}...")
        
        # Drop non-numeric ID columns
        df = df.copy()
        cols_to_drop = ['UDI', 'Product ID', 'id']
        df = df.drop([col for col in cols_to_drop if col in df.columns], axis=1)
        
        # Clean column names (remove special characters)
        df.columns = [col.replace('[', '').replace(']', '') for col in df.columns]
        
        # Preprocess
        df = self.data_loader.preprocess_features(df, fit=True)
        
        # Engineer features
        df = self.feature_engineer.engineer_features(df, include_advanced=True)
        
        # Extract features and target
        X = df.drop('Machine failure', axis=1)
        y = df['Machine failure']
        
        # Clean column names again after engineering
        X.columns = [col.replace('[', '').replace(']', '').replace(' ', '_') for col in X.columns]
        
        # Split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, stratify=y, random_state=42
        )
        
        scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()
        
        print(f"   ✅ {len(X_train)} train samples, {len(X_test)} test samples")
        print(f"   📊 Scale pos weight: {scale_pos_weight:.2f}")
        
        return X_train, X_test, y_train, y_test, scale_pos_weight
    
    def train_and_evaluate(self, X_train, X_test, y_train, y_test, dataset_name: str):
        """Train both models and evaluate."""
        print(f"\n" + "="*70)
        print(f"TRAINING ON {dataset_name.upper()}")
        print("="*70)
        
        results = {}
        
        # Drop non-numeric columns
        numeric_cols = X_train.select_dtypes(include=[np.number]).columns
        X_train = X_train[numeric_cols]
        X_test = X_test[numeric_cols]
        
        print(f"   Using {len(numeric_cols)} numeric features")
        
        # XGBoost
        print(f"\n🚀 Training XGBoost on {dataset_name}...")
        xgb_model = xgb.XGBClassifier(
            max_depth=8, learning_rate=0.1, n_estimators=200,
            subsample=0.8, colsample_bytree=0.8, random_state=42,
            verbosity=0, eval_metric='logloss'
        )
        xgb_model.fit(X_train, y_train)
        
        y_pred_xgb = xgb_model.predict(X_test)
        y_pred_proba_xgb = xgb_model.predict_proba(X_test)[:, 1]
        
        xgb_metrics = {
            'model': 'XGBoost',
            'rocAuc': float(roc_auc_score(y_test, y_pred_proba_xgb)),
            'precision': float(precision_score(y_test, y_pred_xgb)),
            'recall': float(recall_score(y_test, y_pred_xgb)),
            'f1Score': float(f1_score(y_test, y_pred_xgb)),
            'accuracy': float(accuracy_score(y_test, y_pred_xgb)),
        }
        
        cm = confusion_matrix(y_test, y_pred_xgb)
        xgb_metrics['confusionMatrix'] = {
            'tn': int(cm[0, 0]), 'fp': int(cm[0, 1]),
            'fn': int(cm[1, 0]), 'tp': int(cm[1, 1])
        }
        
        print(f"   ✅ ROC-AUC: {xgb_metrics['rocAuc']:.4f}")
        print(f"      Precision: {xgb_metrics['precision']:.4f}, Recall: {xgb_metrics['recall']:.4f}")
        print(f"      F1: {xgb_metrics['f1Score']:.4f}, Accuracy: {xgb_metrics['accuracy']:.4f}")
        
        results['xgboost'] = xgb_metrics
        
        # LightGBM
        print(f"\n🚀 Training LightGBM on {dataset_name}...")
        lgb_model = lgb.LGBMClassifier(
            max_depth=8, learning_rate=0.1, n_estimators=200,
            subsample=0.8, colsample_bytree=0.8, random_state=42,
            verbosity=-1
        )
        lgb_model.fit(X_train, y_train)
        
        y_pred_lgb = lgb_model.predict(X_test)
        y_pred_proba_lgb = lgb_model.predict_proba(X_test)[:, 1]
        
        lgb_metrics = {
            'model': 'LightGBM',
            'rocAuc': float(roc_auc_score(y_test, y_pred_proba_lgb)),
            'precision': float(precision_score(y_test, y_pred_xgb)),
            'recall': float(recall_score(y_test, y_pred_lgb)),
            'f1Score': float(f1_score(y_test, y_pred_lgb)),
            'accuracy': float(accuracy_score(y_test, y_pred_lgb)),
        }
        
        cm = confusion_matrix(y_test, y_pred_lgb)
        lgb_metrics['confusionMatrix'] = {
            'tn': int(cm[0, 0]), 'fp': int(cm[0, 1]),
            'fn': int(cm[1, 0]), 'tp': int(cm[1, 1])
        }
        
        print(f"   ✅ ROC-AUC: {lgb_metrics['rocAuc']:.4f}")
        print(f"      Precision: {lgb_metrics['precision']:.4f}, Recall: {lgb_metrics['recall']:.4f}")
        print(f"      F1: {lgb_metrics['f1Score']:.4f}, Accuracy: {lgb_metrics['accuracy']:.4f}")
        
        results['lightgbm'] = lgb_metrics
        
        return results
    
    def generate_comparison_report(self):
        """Generate comparison report."""
        print("\n" + "="*70)
        print("COMPARISON ANALYSIS")
        print("="*70)
        
        # Calculate differences
        comparison = {
            'timestamp': datetime.now().isoformat(),
            'xgboost': {
                'machine_failure': self.results['machine_failure']['xgboost'],
                'train': self.results['train']['xgboost'],
            },
            'lightgbm': {
                'machine_failure': self.results['machine_failure']['lightgbm'],
                'train': self.results['train']['lightgbm'],
            }
        }
        
        # Calculate differences
        print("\n📊 XGBoost Comparison (machine_failure vs train):")
        for metric in ['rocAuc', 'precision', 'recall', 'f1Score', 'accuracy']:
            mf_val = self.results['machine_failure']['xgboost'][metric]
            train_val = self.results['train']['xgboost'][metric]
            diff = train_val - mf_val
            print(f"   {metric:15} - MF: {mf_val:.4f}, Train: {train_val:.4f}, Diff: {diff:+.4f}")
        
        print("\n📊 LightGBM Comparison (machine_failure vs train):")
        for metric in ['rocAuc', 'precision', 'recall', 'f1Score', 'accuracy']:
            mf_val = self.results['machine_failure']['lightgbm'][metric]
            train_val = self.results['train']['lightgbm'][metric]
            diff = train_val - mf_val
            print(f"   {metric:15} - MF: {mf_val:.4f}, Train: {train_val:.4f}, Diff: {diff:+.4f}")
        
        # Save comparison
        comp_path = self.output_dir / 'model_comparison_results.json'
        with open(comp_path, 'w') as f:
            json.dump(comparison, f, indent=2)
        
        print(f"\n✅ Comparison saved to {comp_path}")
        
        return comparison
    
    def run_comparison(self):
        """Run complete comparison."""
        print("\n" + "🔬 "*30)
        print("MODEL COMPARISON: machine_failure.csv vs train.csv")
        print("🔬 "*30)
        
        # Analyze datasets
        mf_df, train_df, mf_stats, train_stats = self.analyze_datasets()
        
        # Prepare on machine_failure.csv (use full dataset)
        X_train_mf, X_test_mf, y_train_mf, y_test_mf, scale_mf = self.prepare_dataset(
            mf_df, "machine_failure.csv"
        )
        
        # Prepare on train.csv (already split data)
        X_train_train, X_test_train, y_train_train, y_test_train, scale_train = self.prepare_dataset(
            train_df, "train.csv"
        )
        
        # Train and evaluate
        self.results['machine_failure'] = self.train_and_evaluate(
            X_train_mf, X_test_mf, y_train_mf, y_test_mf, "machine_failure.csv"
        )
        
        self.results['train'] = self.train_and_evaluate(
            X_train_train, X_test_train, y_train_train, y_test_train, "train.csv"
        )
        
        # Generate report
        comparison = self.generate_comparison_report()
        
        print("\n" + "✅ "*30)
        print("COMPARISON COMPLETE!")
        print("✅ "*30)
        
        return comparison


if __name__ == '__main__':
    comparator = ModelComparison()
    results = comparator.run_comparison()
