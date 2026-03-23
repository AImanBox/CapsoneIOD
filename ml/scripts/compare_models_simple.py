#!/usr/bin/env python3
"""
@file compare_models_simple.py
@description Simple model comparison using train_tr.csv (training) and train_te.csv (validation)
@module ml.scripts.compare_models_simple
@created 2026-03-07
"""

import os
import sys
import json
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
    accuracy_score, confusion_matrix
)


class SimpleModelComparison:
    """Simple comparison using raw features only."""
    
    def __init__(self):
        self.output_dir = Path('ml/models')
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.results = {
            'train': {},
            'test': {}
        }
    
    def analyze_datasets(self):
        """Analyze both datasets."""
        print("\n" + "="*70)
        print("DATASET ANALYSIS & COMPARISON")
        print("="*70)
        
        # Load datasets - use train_tr.csv (training) and train_te.csv (validation)
        train_df = pd.read_csv('docs/train_tr.csv')
        test_df = pd.read_csv('docs/train_te.csv')
        
        # Check columns
        print(f"\ntrain_tr.csv columns: {list(train_df.columns)[:5]}")
        print(f"train_te.csv columns: {list(test_df.columns)[:5]}")
        
        print(f"\n📊 train_tr.csv (Training Set - 80%):")
        print(f"   Rows: {len(train_df):,}")
        target_col = [c for c in train_df.columns if 'failure' in c.lower()][0]
        print(f"   Failures: {int(train_df[target_col].sum())} ({train_df[target_col].mean():.2%})")
        print(f"   Non-failures: {len(train_df) - int(train_df[target_col].sum())}")
        
        print(f"\n📊 train_te.csv (Validation Set - 20%):")
        print(f"   Rows: {len(test_df):,}")
        target_col_test = [c for c in test_df.columns if 'failure' in c.lower()][0]
        print(f"   Failures: {int(test_df[target_col_test].sum())} ({test_df[target_col_test].mean():.2%})")
        print(f"   Non-failures: {len(test_df) - int(test_df[target_col_test].sum())}")
        
        return train_df, test_df
    
    def prepare_simple(self, df: pd.DataFrame, dataset_name: str):
        """Prepare dataset with simple feature selection."""
        print(f"\n🔧 Preparing {dataset_name}...")
        
        df = df.copy()
        
        # Find target column
        target_col = [c for c in df.columns if 'failure' in c.lower()][0]
        
        # Clean column names - remove brackets from sensor columns only
        rename_map = {
            'Air temperature [K]': 'Air_temperature_K',
            'Process temperature [K]': 'Process_temperature_K',
            'Rotational speed [rpm]': 'Rotational_speed_rpm',
            'Torque [Nm]': 'Torque_Nm',
            'Tool wear [min]': 'Tool_wear_min'
        }
        df.rename(columns=rename_map, inplace=True)
        
        # Select numeric features only
        feature_cols = [
            'Air_temperature_K', 'Process_temperature_K',
            'Rotational_speed_rpm', 'Torque_Nm', 'Tool_wear_min',
            'TWF', 'HDF', 'PWF', 'OSF', 'RNF'
        ]
        
        # Encode Type column
        df['Type_encoded'] = LabelEncoder().fit_transform(df['Type'])
        feature_cols.append('Type_encoded')
        
        X = df[feature_cols]
        y = df[target_col]
        
        # Use pre-split datasets directly (train_tr.csv for training, train_te.csv for validation)
        scale_pos_weight = (y == 0).sum() / (y == 1).sum()
        
        print(f"   ✅ Samples: {len(X)}")
        print(f"   📊 Features: {len(feature_cols)}, Scale pos weight: {scale_pos_weight:.2f}")
        
        return X, X, y, y, scale_pos_weight, feature_cols
    
    def train_and_evaluate(self, X_train, X_test, y_train, y_test, dataset_name: str):
        """Train both models on training set, evaluate on validation set."""
        print(f"\n" + "="*70)
        print(f"TRAINING ON {dataset_name.upper()} | VALIDATING ON VALIDATION SET")
        print("="*70)
        
        results = {}
        
        # XGBoost
        print(f"\n🚀 Training XGBoost...")
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
            'rocAuc': round(float(roc_auc_score(y_test, y_pred_proba_xgb)), 4),
            'precision': round(float(precision_score(y_test, y_pred_xgb)), 4),
            'recall': round(float(recall_score(y_test, y_pred_xgb)), 4),
            'f1Score': round(float(f1_score(y_test, y_pred_xgb)), 4),
            'accuracy': round(float(accuracy_score(y_test, y_pred_xgb)), 4),
        }
        
        cm = confusion_matrix(y_test, y_pred_xgb)
        xgb_metrics['confusionMatrix'] = {
            'tn': int(cm[0, 0]), 'fp': int(cm[0, 1]),
            'fn': int(cm[1, 0]), 'tp': int(cm[1, 1])
        }
        
        print(f"   ✅ XGBoost - ROC-AUC: {xgb_metrics['rocAuc']:.4f}, F1: {xgb_metrics['f1Score']:.4f}")
        results['xgboost'] = xgb_metrics
        
        # LightGBM
        print(f"\n🚀 Training LightGBM...")
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
            'rocAuc': round(float(roc_auc_score(y_test, y_pred_proba_lgb)), 4),
            'precision': round(float(precision_score(y_test, y_pred_lgb)), 4),
            'recall': round(float(recall_score(y_test, y_pred_lgb)), 4),
            'f1Score': round(float(f1_score(y_test, y_pred_lgb)), 4),
            'accuracy': round(float(accuracy_score(y_test, y_pred_lgb)), 4),
        }
        
        cm = confusion_matrix(y_test, y_pred_lgb)
        lgb_metrics['confusionMatrix'] = {
            'tn': int(cm[0, 0]), 'fp': int(cm[0, 1]),
            'fn': int(cm[1, 0]), 'tp': int(cm[1, 1])
        }
        
        print(f"   ✅ LightGBM - ROC-AUC: {lgb_metrics['rocAuc']:.4f}, F1: {lgb_metrics['f1Score']:.4f}")
        results['lightgbm'] = lgb_metrics
        
        return results
    
    def generate_comparison(self):
        """Generate and save comparison."""
        print("\n" + "="*70)
        print("COMPARISON ANALYSIS")
        print("="*70)
        
        comparison_data = {
            'timestamp': datetime.now().isoformat(),
            'xgboost': {
                'train': self.results['train']['xgboost'],
                'test': self.results['test']['xgboost'],
                'differences': {
                    'rocAuc': round(self.results['test']['xgboost']['rocAuc'] - self.results['train']['xgboost']['rocAuc'], 4),
                    'precision': round(self.results['test']['xgboost']['precision'] - self.results['train']['xgboost']['precision'], 4),
                    'recall': round(self.results['test']['xgboost']['recall'] - self.results['train']['xgboost']['recall'], 4),
                    'f1Score': round(self.results['test']['xgboost']['f1Score'] - self.results['train']['xgboost']['f1Score'], 4),
                    'accuracy': round(self.results['test']['xgboost']['accuracy'] - self.results['train']['xgboost']['accuracy'], 4),
                }
            },
            'lightgbm': {
                'train': self.results['train']['lightgbm'],
                'test': self.results['test']['lightgbm'],
                'differences': {
                    'rocAuc': round(self.results['test']['lightgbm']['rocAuc'] - self.results['train']['lightgbm']['rocAuc'], 4),
                    'precision': round(self.results['test']['lightgbm']['precision'] - self.results['train']['lightgbm']['precision'], 4),
                    'recall': round(self.results['test']['lightgbm']['recall'] - self.results['train']['lightgbm']['recall'], 4),
                    'f1Score': round(self.results['test']['lightgbm']['f1Score'] - self.results['train']['lightgbm']['f1Score'], 4),
                    'accuracy': round(self.results['test']['lightgbm']['accuracy'] - self.results['train']['lightgbm']['accuracy'], 4),
                }
            }
        }
        
        # Print report
        print("\n📊 XGBoost Comparison:")
        for metric, val in comparison_data['xgboost']['differences'].items():
            print(f"   {metric:15}: {val:+.4f}")
        
        print("\n📊 LightGBM Comparison:")
        for metric, val in comparison_data['lightgbm']['differences'].items():
            print(f"   {metric:15}: {val:+.4f}")
        
        # Save to JSON
        comp_path = self.output_dir / 'model_comparison_results.json'
        with open(comp_path, 'w') as f:
            json.dump(comparison_data, f, indent=2)
        
        print(f"\n✅ Comparison saved to {comp_path}")
        
        return comparison_data
    
    def run(self):
        """Run complete comparison."""
        print("\n" + "🔬 "*30)
        print("MODEL COMPARISON: train.csv vs test.csv")
        print("🔬 "*30)
        
        # Analyze
        train_df, test_df = self.analyze_datasets()
        
        # Prepare train.csv
        X_train_train, X_test_train, y_train_train, y_test_train, _, _ = self.prepare_simple(
            train_df, "train.csv"
        )
        
        # Prepare test.csv
        X_train_test, X_test_test, y_train_test, y_test_test, _, _ = self.prepare_simple(
            test_df, "test.csv"
        )
        
        # Train on train.csv
        self.results['train'] = self.train_and_evaluate(
            X_train_train, X_test_train, y_train_train, y_test_train, "train.csv"
        )
        
        # Train on test.csv
        self.results['test'] = self.train_and_evaluate(
            X_train_test, X_test_test, y_train_test, y_test_test, "test.csv"
        )
        
        # Generate comparison
        comparison = self.generate_comparison()
        
        print("\n" + "✅ "*30)
        print("COMPARISON COMPLETE!")
        print("✅ "*30)
        
        return comparison


if __name__ == '__main__':
    comparator = SimpleModelComparison()
    results = comparator.run()
