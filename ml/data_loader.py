"""
@file data_loader.py
@description Data loading and preprocessing module for machine failure prediction
@module ml.data_loader
@created 2026-02-08

Handles loading, validating, and preprocessing the Binary Classification of Machine Failures dataset.
Implements class imbalance handling and feature engineering for ML model training.
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Tuple, Dict, Any
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split


class DataLoader:
    """
    Load and preprocess machine failure datasets.
    
    @description
    Manages loading of train_tr.csv (training split) and train_te.csv (test split) from the binary classification dataset.
    Handles categorical encoding, missing value validation, and feature preparation.
    """
    
    FEATURE_COLUMNS = [
        'Air temperature [K]',
        'Process temperature [K]',
        'Rotational speed [rpm]',
        'Torque [Nm]',
        'Tool wear [min]'
    ]
    
    CATEGORICAL_COLUMN = 'Type'
    TARGET_COLUMN = 'Machine failure'
    FAILURE_MODES = ['TWF', 'HDF', 'PWF', 'OSF', 'RNF']
    
    def __init__(self, data_dir: str = 'docs'):
        """
        Initialize DataLoader.
        
        @param data_dir Path to directory containing train_tr.csv and train_te.csv
        """
        self.data_dir = Path(data_dir)
        self.label_encoder = LabelEncoder()
        self.feature_stats = {}
    
    def load_train_data(self) -> pd.DataFrame:
        """
        Load and validate training dataset (80% split from original dataset).
        
        @returns DataFrame with training data including target variable
        @throws FileNotFoundError if train_tr.csv not found
        """
        train_path = self.data_dir / 'train_tr.csv'
        if not train_path.exists():
            raise FileNotFoundError(f"Training data not found at {train_path}")
        
        df = pd.read_csv(train_path)
        print(f"✅ Loaded train_tr.csv: {len(df)} rows × {len(df.columns)} columns")
        print(f"   Class distribution: {df[self.TARGET_COLUMN].value_counts().to_dict()}")
        
        return df
    
    def load_test_data(self) -> pd.DataFrame:
        """
        Load test dataset (20% split from original dataset).
        
        @returns DataFrame with test data for evaluation/prediction
        @throws FileNotFoundError if train_te.csv not found
        """
        test_path = self.data_dir / 'train_te.csv'
        if not test_path.exists():
            raise FileNotFoundError(f"Test data not found at {test_path}")
        
        df = pd.read_csv(test_path)
        print(f"✅ Loaded train_te.csv: {len(df)} rows × {len(df.columns)} columns")
        
        return df
    
    def preprocess_features(self, df: pd.DataFrame, fit: bool = False) -> pd.DataFrame:
        """
        Preprocess features (encoding, validation).
        
        @param df Input DataFrame
        @param fit Whether to fit label encoder (True for training data)
        @returns Preprocessed DataFrame with encoded categorical features
        """
        df = df.copy()
        
        # Validate required columns exist
        required_cols = self.FEATURE_COLUMNS + [self.CATEGORICAL_COLUMN]
        missing = set(required_cols) - set(df.columns)
        if missing:
            raise ValueError(f"Missing columns: {missing}")
        
        # Check for missing values
        missing_values = df[required_cols].isnull().sum()
        if missing_values.any():
            print(f"⚠️  Missing values detected:\n{missing_values[missing_values > 0]}")
        
        # Encode categorical Type column
        if fit:
            df[self.CATEGORICAL_COLUMN] = self.label_encoder.fit_transform(df[self.CATEGORICAL_COLUMN])
        else:
            df[self.CATEGORICAL_COLUMN] = self.label_encoder.transform(df[self.CATEGORICAL_COLUMN])
        
        # Store feature statistics for reference
        if fit:
            self.feature_stats = df[self.FEATURE_COLUMNS].describe().to_dict()
        
        return df
    
    def extract_features_target(
        self, 
        df: pd.DataFrame,
        include_failure_modes: bool = False
    ) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Extract features and target variable from training data.
        
        @param df Preprocessed training DataFrame
        @param include_failure_modes Whether to include failure mode features
        @returns Tuple of (X: features DataFrame, y: target Series)
        """
        feature_cols = [self.CATEGORICAL_COLUMN] + self.FEATURE_COLUMNS
        
        if include_failure_modes:
            feature_cols.extend(self.FAILURE_MODES)
        
        X = df[feature_cols].copy()
        y = df[self.TARGET_COLUMN].copy()
        
        return X, y
    
    def extract_features_only(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Extract features from test data (no target).
        
        @param df Preprocessed test DataFrame
        @returns Features DataFrame
        """
        feature_cols = [self.CATEGORICAL_COLUMN] + self.FEATURE_COLUMNS
        return df[feature_cols].copy()
    
    @staticmethod
    def get_class_weight(y: pd.Series) -> float:
        """
        Calculate scale_pos_weight for imbalanced classification.
        
        @description
        Computes the ratio of negative to positive samples for use in XGBoost.
        For ~98% negative (no failure) and ~2% positive (failure):
        scale_pos_weight ≈ 49 (98/2)
        
        @param y Target variable Series
        @returns Float: positive class weight
        """
        n_negative = (y == 0).sum()
        n_positive = (y == 1).sum()
        scale_pos_weight = n_negative / n_positive if n_positive > 0 else 1.0
        return scale_pos_weight
    
    @staticmethod
    def train_test_split_stratified(
        X: pd.DataFrame,
        y: pd.Series,
        test_size: float = 0.2,
        random_state: int = 42
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
        """
        Split data into train/test with stratification (preserve class distribution).
        
        @param X Features
        @param y Target variable
        @param test_size Fraction for test set (default: 0.2)
        @param random_state Random seed for reproducibility
        @returns Tuple of (X_train, X_test, y_train, y_test)
        """
        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            test_size=test_size,
            stratify=y,
            random_state=random_state
        )
        
        print(f"\n✅ Train/Test Split (stratified):")
        print(f"   Train: {len(X_train)} samples ({y_train.sum()} failures)")
        print(f"   Test:  {len(X_test)} samples ({y_test.sum()} failures)")
        print(f"   Failure rate - Train: {y_train.mean():.2%}, Test: {y_test.mean():.2%}")
        
        return X_train, X_test, y_train, y_test


if __name__ == '__main__':
    # Test the data loader
    loader = DataLoader(data_dir='docs')
    
    print("="*60)
    print("LOADING TRAINING DATA")
    print("="*60)
    df_train = loader.load_train_data()
    df_train = loader.preprocess_features(df_train, fit=True)
    X_train, y_train = loader.extract_features_target(df_train)
    scale_pos_weight = loader.get_class_weight(y_train)
    print(f"\n📊 Scale pos weight (for XGBoost): {scale_pos_weight:.2f}")
    
    print("\n" + "="*60)
    print("LOADING TEST DATA")
    print("="*60)
    df_test = loader.load_test_data()
    df_test = loader.preprocess_features(df_test, fit=False)
    X_test = loader.extract_features_only(df_test)
    
    print(f"\n✅ Data loading complete!")
