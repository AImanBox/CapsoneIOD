#!/usr/bin/env python3
"""
@file cross_validate_models.py
@description Cross-validation pipeline to validate model stability
@module ml.scripts.cross_validate_models
@created 2026-03-08

This script performs 5-fold cross-validation on both XGBoost and LightGBM models
to assess their stability and generalization capability across different data splits.

Process:
1. Load train.csv and test.csv
2. Preprocess and engineer features
3. Run 5-fold stratified cross-validation for both models
4. Calculate mean and std of all metrics
5. Generate stability report
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Tuple, List

import pandas as pd
import numpy as np
import xgboost as xgb
import lightgbm as lgb
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import (
    roc_auc_score, precision_score, recall_score, f1_score,
    accuracy_score, confusion_matrix
)

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from data_loader import DataLoader
from feature_engineering import FeatureEngineer


class CrossValidationValidator:
    """Cross-validation validator for model stability assessment."""
    
    def __init__(self, n_splits: int = 5, random_state: int = 42, test_size: float = 0.2):
        """
        Initialize cross-validation validator.
        
        @param n_splits Number of folds for cross-validation
        @param random_state Random seed for reproducibility
        @param test_size Test set fraction (for comparison with single split)
        """
        self.n_splits = n_splits
        self.random_state = random_state
        self.test_size = test_size
        
        self.data_dir = Path('docs')
        self.output_dir = Path('ml/models')
        
        self.data_loader = DataLoader(data_dir='docs')
        self.feature_engineer = FeatureEngineer()
        
        self.cv_results = {}
        self.timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        print(f"\n{'='*70}")
        print(f"CROSS-VALIDATION VALIDATOR INITIALIZED")
        print(f"{'='*70}")
        print(f"Number of Folds: {self.n_splits}")
        print(f"Random State: {self.random_state}")
        print(f"Timestamp: {self.timestamp}")
    
    def load_and_prepare_data(self):
        """Load and prepare data for cross-validation."""
        print("\n" + "="*70)
        print("STEP 1: LOAD AND PREPARE DATA")
        print("="*70)
        
        # Load dataset (combine train and test for full cross-validation)
        train_path = self.data_dir / 'train.csv'
        test_path = self.data_dir / 'test.csv'
        
        if not train_path.exists():
            raise FileNotFoundError(f"train.csv not found in {self.data_dir}")
        if not test_path.exists():
            raise FileNotFoundError(f"test.csv not found in {self.data_dir}")
        
        df_train = pd.read_csv(train_path)
        df_test = pd.read_csv(test_path)
        df = pd.concat([df_train, df_test], ignore_index=True)
        print(f"\n✅ Loaded train.csv and test.csv: {len(df)} rows × {len(df.columns)} columns")
        
        # Show class distribution
        print(f"\n📊 Dataset Class Distribution:")
        class_counts = df['Machine failure'].value_counts()
        print(f"   No Failure (0): {class_counts[0]} samples ({class_counts[0]/len(df):.2%})")
        print(f"   Failure (1):    {class_counts[1]} samples ({class_counts[1]/len(df):.2%})")
        
        # Prepare data
        X = df.drop('Machine failure', axis=1)
        y = df['Machine failure']
        
        # Preprocess and engineer features
        print(f"\n🔧 Preprocessing and engineering features...")
        
        # Create DataFrame for processing
        temp_df = X.copy()
        temp_df['Machine failure'] = y.values
        
        # Preprocess
        temp_df = self.data_loader.preprocess_features(temp_df, fit=True)
        
        # Engineer features
        temp_df = self.feature_engineer.engineer_features(temp_df, include_advanced=True)
        
        # Extract features
        feature_cols = [col for col in temp_df.columns if col != 'Machine failure']
        X_processed = temp_df[feature_cols]
        y_processed = temp_df['Machine failure']
        
        # Convert object columns to numeric
        for col in X_processed.columns:
            if X_processed[col].dtype == 'object':
                X_processed[col] = pd.to_numeric(X_processed[col], errors='coerce')
                fill_value = X_processed[col].median()
                X_processed[col].fillna(fill_value, inplace=True)
        
        # Clean column names
        new_cols = {}
        for col in X_processed.columns:
            clean_col = col.replace('[', '').replace(']', '').replace('<', '').replace('>', '')
            new_cols[col] = clean_col
        
        X_processed = X_processed.copy()
        X_processed.rename(columns=new_cols, inplace=True)
        
        print(f"✅ Data prepared: {X_processed.shape[0]} samples × {X_processed.shape[1]} features")
        
        # Calculate class weight
        scale_pos_weight = (y_processed == 0).sum() / (y_processed == 1).sum()
        print(f"\n⚖️  Class Weight: {scale_pos_weight:.2f}")
        
        return X_processed, y_processed, scale_pos_weight
    
    def run_cv_xgboost(self, X, y, scale_pos_weight):
        """Run cross-validation for XGBoost."""
        print("\n" + "="*70)
        print("STEP 2A: CROSS-VALIDATE XGBOOST")
        print("="*70)
        
        fold_results = []
        skf = StratifiedKFold(n_splits=self.n_splits, shuffle=True, random_state=self.random_state)
        
        for fold_num, (train_idx, test_idx) in enumerate(skf.split(X, y), 1):
            print(f"\n🔄 Fold {fold_num}/{self.n_splits}...")
            
            X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
            y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
            
            # Train model
            model = xgb.XGBClassifier(
                max_depth=8,
                learning_rate=0.1,
                n_estimators=200,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=self.random_state,
                verbosity=0,
                scale_pos_weight=scale_pos_weight,
                eval_metric='logloss'
            )
            
            model.fit(X_train, y_train)
            
            # Evaluate
            y_pred = model.predict(X_test)
            y_pred_proba = model.predict_proba(X_test)[:, 1]
            
            metrics = {
                'fold': fold_num,
                'rocAuc': float(roc_auc_score(y_test, y_pred_proba)),
                'precision': float(precision_score(y_test, y_pred)),
                'recall': float(recall_score(y_test, y_pred)),
                'f1Score': float(f1_score(y_test, y_pred)),
                'accuracy': float(accuracy_score(y_test, y_pred)),
                'trainSize': len(X_train),
                'testSize': len(X_test),
                'failureRate': float(y_test.mean()),
            }
            
            fold_results.append(metrics)
            
            print(f"   ROC-AUC: {metrics['rocAuc']:.4f} | Acc: {metrics['accuracy']:.4f} | " +
                  f"Prec: {metrics['precision']:.4f} | Recall: {metrics['recall']:.4f}")
        
        # Summary statistics
        print(f"\n✅ XGBoost Cross-Validation Complete!")
        print(f"\n📊 Summary Statistics:")
        
        summary = {
            'model': 'XGBoost',
            'folds': self.n_splits,
            'metrics': {}
        }
        
        for metric_name in ['rocAuc', 'precision', 'recall', 'f1Score', 'accuracy']:
            values = [result[metric_name] for result in fold_results]
            mean_val = np.mean(values)
            std_val = np.std(values)
            min_val = np.min(values)
            max_val = np.max(values)
            
            summary['metrics'][metric_name] = {
                'mean': round(mean_val, 4),
                'std': round(std_val, 4),
                'min': round(min_val, 4),
                'max': round(max_val, 4),
                'range': round(max_val - min_val, 4),
                'cv': round(std_val / mean_val * 100, 2) if mean_val != 0 else 0
            }
            
            print(f"   {metric_name:15} → Mean: {mean_val:.4f} ± {std_val:.4f} " +
                  f"(CV: {summary['metrics'][metric_name]['cv']:.1f}%)")
        
        summary['fold_results'] = fold_results
        self.cv_results['xgboost'] = summary
        
        return summary
    
    def run_cv_lightgbm(self, X, y, scale_pos_weight):
        """Run cross-validation for LightGBM."""
        print("\n" + "="*70)
        print("STEP 2B: CROSS-VALIDATE LIGHTGBM")
        print("="*70)
        
        fold_results = []
        skf = StratifiedKFold(n_splits=self.n_splits, shuffle=True, random_state=self.random_state)
        
        for fold_num, (train_idx, test_idx) in enumerate(skf.split(X, y), 1):
            print(f"\n🔄 Fold {fold_num}/{self.n_splits}...")
            
            X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
            y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
            
            # Train model
            model = lgb.LGBMClassifier(
                max_depth=8,
                learning_rate=0.1,
                n_estimators=200,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=self.random_state,
                verbosity=-1,
                scale_pos_weight=scale_pos_weight
            )
            
            model.fit(X_train, y_train)
            
            # Evaluate
            y_pred = model.predict(X_test)
            y_pred_proba = model.predict_proba(X_test)[:, 1]
            
            metrics = {
                'fold': fold_num,
                'rocAuc': float(roc_auc_score(y_test, y_pred_proba)),
                'precision': float(precision_score(y_test, y_pred)),
                'recall': float(recall_score(y_test, y_pred)),
                'f1Score': float(f1_score(y_test, y_pred)),
                'accuracy': float(accuracy_score(y_test, y_pred)),
                'trainSize': len(X_train),
                'testSize': len(X_test),
                'failureRate': float(y_test.mean()),
            }
            
            fold_results.append(metrics)
            
            print(f"   ROC-AUC: {metrics['rocAuc']:.4f} | Acc: {metrics['accuracy']:.4f} | " +
                  f"Prec: {metrics['precision']:.4f} | Recall: {metrics['recall']:.4f}")
        
        # Summary statistics
        print(f"\n✅ LightGBM Cross-Validation Complete!")
        print(f"\n📊 Summary Statistics:")
        
        summary = {
            'model': 'LightGBM',
            'folds': self.n_splits,
            'metrics': {}
        }
        
        for metric_name in ['rocAuc', 'precision', 'recall', 'f1Score', 'accuracy']:
            values = [result[metric_name] for result in fold_results]
            mean_val = np.mean(values)
            std_val = np.std(values)
            min_val = np.min(values)
            max_val = np.max(values)
            
            summary['metrics'][metric_name] = {
                'mean': round(mean_val, 4),
                'std': round(std_val, 4),
                'min': round(min_val, 4),
                'max': round(max_val, 4),
                'range': round(max_val - min_val, 4),
                'cv': round(std_val / mean_val * 100, 2) if mean_val != 0 else 0
            }
            
            print(f"   {metric_name:15} → Mean: {mean_val:.4f} ± {std_val:.4f} " +
                  f"(CV: {summary['metrics'][metric_name]['cv']:.1f}%)")
        
        summary['fold_results'] = fold_results
        self.cv_results['lightgbm'] = summary
        
        return summary
    
    def generate_stability_report(self):
        """Generate stability assessment report."""
        print("\n" + "="*70)
        print("STEP 3: GENERATE STABILITY REPORT")
        print("="*70)
        
        report = {
            'timestamp': self.timestamp,
            'methodology': {
                'cross_validation': 'Stratified K-Fold',
                'folds': self.n_splits,
                'random_state': self.random_state,
                'shuffle': True
            },
            'results': self.cv_results,
            'stability_assessment': {}
        }
        
        # Assess stability for each model
        for model_name in ['xgboost', 'lightgbm']:
            cv_summary = self.cv_results[model_name]
            
            stability = {
                'model': model_name.upper(),
                'stability_grade': None,
                'metrics_analysis': {}
            }
            
            # Analyze each metric
            for metric_name, metric_stats in cv_summary['metrics'].items():
                cv_percent = metric_stats['cv']  # Coefficient of variation
                
                # Grade stability based on CV
                if cv_percent < 1.0:
                    grade = 'EXCELLENT'
                    assessment = 'Highly stable, very low variance'
                elif cv_percent < 2.0:
                    grade = 'VERY GOOD'
                    assessment = 'Stable, low variance'
                elif cv_percent < 5.0:
                    grade = 'GOOD'
                    assessment = 'Reasonably stable'
                elif cv_percent < 10.0:
                    grade = 'ACCEPTABLE'
                    assessment = 'Moderate variance, acceptable'
                else:
                    grade = 'CONCERNING'
                    assessment = 'High variance, unstable'
                
                stability['metrics_analysis'][metric_name] = {
                    'mean': metric_stats['mean'],
                    'std': metric_stats['std'],
                    'range': metric_stats['range'],
                    'cv_percent': cv_percent,
                    'stability_grade': grade,
                    'assessment': assessment
                }
            
            # Overall stability grade (based on average CV)
            avg_cv = np.mean([m['cv_percent'] for m in stability['metrics_analysis'].values()])
            
            if avg_cv < 1.0:
                stability['stability_grade'] = 'EXCELLENT'
                stability['overall_assessment'] = '🌟 Highly stable model, excellent for production'
            elif avg_cv < 2.0:
                stability['stability_grade'] = 'VERY GOOD'
                stability['overall_assessment'] = '✅ Stable model, suitable for production'
            elif avg_cv < 5.0:
                stability['stability_grade'] = 'GOOD'
                stability['overall_assessment'] = '✓ Reasonably stable, acceptable for production'
            elif avg_cv < 10.0:
                stability['stability_grade'] = 'ACCEPTABLE'
                stability['overall_assessment'] = '⚠️ Moderate stability, monitor in production'
            else:
                stability['stability_grade'] = 'CONCERNING'
                stability['overall_assessment'] = '❌ Unstable, requires investigation'
            
            stability['average_cv_percent'] = round(avg_cv, 2)
            report['stability_assessment'][model_name] = stability
        
        # Save report
        report_path = self.output_dir / f'CROSS_VALIDATION_REPORT_{self.timestamp}.json'
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\n✅ Report saved: {report_path}")
        
        return report
    
    def print_stability_summary(self, report):
        """Print stability assessment summary."""
        print("\n" + "="*70)
        print("CROSS-VALIDATION STABILITY ASSESSMENT")
        print("="*70)
        
        for model_name, assessment in report['stability_assessment'].items():
            print(f"\n🔍 {model_name.upper()}")
            print(f"   Overall Stability Grade: {assessment['stability_grade']}")
            print(f"   Average CV: {assessment['average_cv_percent']:.2f}%")
            print(f"   Assessment: {assessment['overall_assessment']}")
            
            print(f"\n   Metric Details:")
            for metric, details in assessment['metrics_analysis'].items():
                print(f"      {metric:12} → {details['stability_grade']:10} " +
                      f"(CV: {details['cv_percent']:6.2f}%, Range: {details['range']:.4f})")
    
    def run_full_validation(self):
        """Execute complete cross-validation pipeline."""
        print("\n" + "🔄 "*35)
        print("CROSS-VALIDATION STABILITY ASSESSMENT")
        print("🔄 "*35)
        
        try:
            # Load and prepare data
            X, y, scale_pos_weight = self.load_and_prepare_data()
            
            # Run cross-validations
            xgb_summary = self.run_cv_xgboost(X, y, scale_pos_weight)
            lgb_summary = self.run_cv_lightgbm(X, y, scale_pos_weight)
            
            # Generate report
            report = self.generate_stability_report()
            
            # Print summary
            self.print_stability_summary(report)
            
            print("\n" + "✅ "*35)
            print("CROSS-VALIDATION ASSESSMENT COMPLETE!")
            print("✅ "*35)
            
            return report
        
        except Exception as e:
            print(f"\n❌ ERROR during cross-validation: {e}")
            import traceback
            traceback.print_exc()
            raise


if __name__ == '__main__':
    validator = CrossValidationValidator(n_splits=5, random_state=42)
    report = validator.run_full_validation()
