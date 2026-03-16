#!/usr/bin/env python3
"""
@file compare_models_simple.py
@description Simple model comparison between machine_failure.csv and train.csv
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
            'machine_failure': {},
            'train': {}
        }
    
    def analyze_datasets(self):
        """Analyze both datasets."""
        print("\n" + "="*70)
        print("DATASET ANALYSIS & COMPARISON")
        print("="*70)
        
        # Load datasets
        mf_df = pd.read_csv('docs/machine_failure.csv')
        train_df = pd.read_csv('docs/train.csv')
        
        # Check columns
        print(f"\nmachine_failure.csv columns: {list(mf_df.columns)[:5]}")
        print(f"train.csv columns: {list(train_df.columns)[:5]}")
        
        print(f"\n📊 machine_failure.csv:")
        print(f"   Rows: {len(mf_df):,}")
        target_col = [c for c in mf_df.columns if 'failure' in c.lower()][0]
        print(f"   Failures: {int(mf_df[target_col].sum())} ({mf_df[target_col].mean():.2%})")
        print(f"   Non-failures: {len(mf_df) - int(mf_df[target_col].sum())}")
        
        print(f"\n📊 train.csv:")
        print(f"   Rows: {len(train_df):,}")
        target_col_train = [c for c in train_df.columns if 'failure' in c.lower()][0]
        print(f"   Failures: {int(train_df[target_col_train].sum())} ({train_df[target_col_train].mean():.2%})")
        print(f"   Non-failures: {len(train_df) - int(train_df[target_col_train].sum())}")
        
        return mf_df, train_df
    
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
        
        # Split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, stratify=y, random_state=42
        )
        
        scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()
        
        print(f"   ✅ Train: {len(X_train)}, Test: {len(X_test)}")
        print(f"   📊 Features: {len(feature_cols)}, Scale pos weight: {scale_pos_weight:.2f}")
        
        return X_train, X_test, y_train, y_test, scale_pos_weight, feature_cols
    
    def train_and_evaluate(self, X_train, X_test, y_train, y_test, dataset_name: str):
        """Train both models."""
        print(f"\n" + "="*70)
        print(f"TRAINING ON {dataset_name.upper()}")
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
                'machine_failure': self.results['machine_failure']['xgboost'],
                'train': self.results['train']['xgboost'],
                'differences': {
                    'rocAuc': round(self.results['train']['xgboost']['rocAuc'] - self.results['machine_failure']['xgboost']['rocAuc'], 4),
                    'precision': round(self.results['train']['xgboost']['precision'] - self.results['machine_failure']['xgboost']['precision'], 4),
                    'recall': round(self.results['train']['xgboost']['recall'] - self.results['machine_failure']['xgboost']['recall'], 4),
                    'f1Score': round(self.results['train']['xgboost']['f1Score'] - self.results['machine_failure']['xgboost']['f1Score'], 4),
                    'accuracy': round(self.results['train']['xgboost']['accuracy'] - self.results['machine_failure']['xgboost']['accuracy'], 4),
                }
            },
            'lightgbm': {
                'machine_failure': self.results['machine_failure']['lightgbm'],
                'train': self.results['train']['lightgbm'],
                'differences': {
                    'rocAuc': round(self.results['train']['lightgbm']['rocAuc'] - self.results['machine_failure']['lightgbm']['rocAuc'], 4),
                    'precision': round(self.results['train']['lightgbm']['precision'] - self.results['machine_failure']['lightgbm']['precision'], 4),
                    'recall': round(self.results['train']['lightgbm']['recall'] - self.results['machine_failure']['lightgbm']['recall'], 4),
                    'f1Score': round(self.results['train']['lightgbm']['f1Score'] - self.results['machine_failure']['lightgbm']['f1Score'], 4),
                    'accuracy': round(self.results['train']['lightgbm']['accuracy'] - self.results['machine_failure']['lightgbm']['accuracy'], 4),
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
        print("MODEL COMPARISON: machine_failure.csv vs train.csv")
        print("🔬 "*30)
        
        # Analyze
        mf_df, train_df = self.analyze_datasets()
        
        # Prepare machine_failure
        X_train_mf, X_test_mf, y_train_mf, y_test_mf, _, _ = self.prepare_simple(
            mf_df, "machine_failure.csv"
        )
        
        # Prepare train.csv
        X_train_train, X_test_train, y_train_train, y_test_train, _, _ = self.prepare_simple(
            train_df, "train.csv"
        )
        
        # Train on machine_failure
        self.results['machine_failure'] = self.train_and_evaluate(
            X_train_mf, X_test_mf, y_train_mf, y_test_mf, "machine_failure.csv"
        )
        
        # Train on train.csv
        self.results['train'] = self.train_and_evaluate(
            X_train_train, X_test_train, y_train_train, y_test_train, "train.csv"
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
