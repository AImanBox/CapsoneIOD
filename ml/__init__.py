"""
ML Training Package for Machine Failure Prediction

This package contains data loading, feature engineering, and model training
infrastructure for the Binary Classification of Machine Failures dataset.

@package ml
@version 1.0.0
@created 2026-02-08

Modules:
  - data_loader: Load and preprocess training/test data
  - feature_engineering: Create domain-specific features
  - scripts.train_models: Main training pipeline
"""

__version__ = '1.0.0'
__author__ = 'ML Development Team'

from .data_loader import DataLoader
from .feature_engineering import FeatureEngineer

__all__ = ['DataLoader', 'FeatureEngineer']
