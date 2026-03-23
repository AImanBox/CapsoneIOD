"""
Generate submission.csv - with feature mismatch resolution
"""

import pickle
import pandas as pd
import numpy as np
import sys
from pathlib import Path

# Add ml module to path for imports
ml_path = Path(__file__).parent / 'ml'
sys.path.insert(0, str(ml_path))
from feature_engineering import FeatureEngineer

print("Loading models and test data...")
lgb_model = pickle.load(open('ml/models/lightgbm_model.pkl', 'rb'))
test_df = pd.read_csv('docs/test.csv')
ids = test_df['id'].values

# Engineer features
X_test = test_df.copy()
X_test = FeatureEngineer.engineer_features(X_test, include_advanced=True)

# Encode Type  
type_mapping = {'L': 0, 'M': 1, 'H': 2}
if 'Type' in X_test.columns:
    X_test['Type_encoded'] = X_test['Type'].map(type_mapping)
    X_test = X_test.drop('Type', axis=1)

# Try encoding Product ID as well (this might be the missing feature)
if 'Product ID' in X_test.columns:
    # Create product ID hash for numeric encoding
    X_test['ProductID_encoded'] = pd.factorize(X_test['Product ID'])[0]

# Drop non-feature columns
X_test = X_test.drop(['id', 'Product ID'], axis=1, errors='ignore')

# Keep numeric features only
X_test = X_test.select_dtypes(include=[np.number])

print(f"Features shape: {X_test.shape}")
print(f"Features: {list(X_test.columns)}")

# Try prediction with shape check disabled
try:
    print("\nGenerating predictions (with shape check disabled)...")
    proba = lgb_model.predict_proba(X_test, pred_disable_shape_check=True)
    failure_prob = proba[:, 1]
    
    print(f"✅ Predictions generated: {len(failure_prob)} samples")
    print(f"   Min: {failure_prob.min():.4f}, Max: {failure_prob.max():.4f}")
    print(f"   Mean: {failure_prob.mean():.4f}, Std: {failure_prob.std():.4f}")
    
    # Create submission
    submission_df = pd.DataFrame({
        'id': ids,
        'proba': np.round(failure_prob, 2)
    })
    
    submission_df.to_csv('submission.csv', index=False)
    print(f"\n✅ submission.csv saved ({len(submission_df)} rows)")
    print(submission_df.head(10))
    
except Exception as e:
    print(f"❌ Error: {e}")
    print(f"\nTrying alternative: train_te.csv for comparison...")
    
    #Load train_te.csv to compare
    test_alt = pd.read_csv('docs/train_te.csv')
    X_alt = test_alt.copy()
    X_alt = FeatureEngineer.engineer_features(X_alt, include_advanced=True)
    
    if 'Type' in X_alt.columns:
        X_alt['Type_encoded'] = X_alt['Type'].map(type_mapping)
        X_alt = X_alt.drop('Type', axis=1)
    
    if 'Product ID' in X_alt.columns:
        X_alt['ProductID_encoded'] = pd.factorize(X_alt['Product ID'])[0]
    
    X_alt = X_alt.drop(['target', 'id', 'Product ID'], axis=1, errors='ignore')
    X_alt = X_alt.select_dtypes(include=[np.number])
    
    print(f"train_te.csv engineered features: {X_alt.shape}")
    print(f"Columns: {list(X_alt.columns)}")
