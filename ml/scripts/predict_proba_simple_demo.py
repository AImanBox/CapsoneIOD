"""
@file predict_proba_simple_demo.py
@description Simple demo of predict_proba for XGBoost and LightGBM
@module ml.scripts.predict_proba_simple_demo
@created 2026-03-22

A straightforward step-by-step guide showing:
1. How to call predict_proba()
2. What it returns
3. How to interpret results
4. Practical usage examples
"""

import sys
import pickle
import json
import numpy as np
import pandas as pd
from pathlib import Path

print(" " * 80)
print("=" * 80)
print("PREDICT_PROBA STEP-BY-STEP GUIDE FOR XGBOOST AND LIGHTGBM")
print("=" * 80)
print(" " * 80)

# ============================================================================
# SETUP
# ============================================================================
print("\nSTEP 1: Load Models and Data")
print("-" * 80)

xgb_model = pickle.load(open('ml/models/xgboost_model.pkl', 'rb'))
lgb_model = pickle.load(open('ml/models/lightgbm_model.pkl', 'rb'))
results_df = pd.read_csv('ml/models/failure_probabilities.csv')

print(f"✓ XGBoost model loaded: {type(xgb_model).__name__}")
print(f"✓ LightGBM model loaded: {type(lgb_model).__name__}")
print(f"✓ Predictions CSV loaded: {len(results_df)} predictions")

# ============================================================================
# PREDICT_PROBA EXPLANATION
# ============================================================================
print("\n" + "=" * 80)
print("STEP 2: What is predict_proba()? ") 
print("=" * 80)

explanation = """
predict_proba() is a method that returns PROBABILITY PREDICTIONS for ALL CLASSES

Key Characteristics:
  • Returns a 2D array of shape (n_samples, n_classes)
  • For binary classification: shape = (n_samples, 2)
  • Column 0: Probability of class 0 (No Failure)
  • Column 1: Probability of class 1 (Failure)
  • Probabilities sum to 1 for each sample
  • Values range from 0 to 1 (representing 0% to 100%)

Example for 1 sample:
  predict_proba([sample1]) = [[0.95, 0.05]]
  Meaning: 95% chance of NO failure, 5% chance of FAILURE

Usage:
  proba = model.predict_proba(X)          # Returns all probabilities
  failure_prob = proba[:, 1]              # Extract class 1 probabilities
  predictions = (failure_prob >= 0.5)     # Convert to binary predictions
"""
print(explanation)

# ============================================================================
# DEMO WITH ACTUAL DATA
# ============================================================================
print("=" * 80)
print("STEP 3: Demo with Real Predictions from CSV")
print("=" * 80)

# Load the saved probabilities
lgb_probs = results_df['failure_probability'].values[:10]  # First 10
xgb_probs = results_df['failure_probability'].values[:10]  # Using same for demo

print(f"\nFirst 10 predictions from CSV (LightGBM probabilities):")
print("   Index | Failure Probability | Risk Level")
print("   " + "-" * 45)
for i in range(10):
    lgb_p = lgb_probs[i]
    risk = results_df['risk_level'].values[i]
    
    print(f"   {i:5d} |       {lgb_p:12.6f} | {risk:10s}")

# ============================================================================
# HOW PREDICT_PROBA WORKS
# ============================================================================
print("\n" + "=" * 80)
print("STEP 4: How predict_proba() Works - The Output Format")
print("=" * 80)

print("""
For 3 sample predictions, here's what predict_proba() outputs:

Sample 1: P(No Failure)=0.98, P(Failure)=0.02
          This sample is VERY SAFE - only 2% chance of failure
          
Sample 2: P(No Failure)=0.60, P(Failure)=0.40
          This sample has MODERATE RISK - 40% chance of failure
          
Sample 3: P(No Failure)=0.05, P(Failure)=0.95
          This sample is VERY RISKY - 95% chance of failure

IMPORTANT: Sum of probabilities = 1.0 for each sample
           0.98 + 0.02 = 1.0 ✓
           0.60 + 0.40 = 1.0 ✓
           0.05 + 0.95 = 1.0 ✓
""")

# ============================================================================
# EXTRACTING USEFUL INFORMATION
# ============================================================================
print("=" * 80)
print("STEP 5: Practical Usage - Extract Useful Information")
print("=" * 80)

print("""
Given predict_proba output, you can extract several things:

1. FAILURE PROBABILITY (for ranking/alerts)
   failure_prob = proba[:, 1]
   
2. BINARY PREDICTIONS (using default 0.5 threshold)
   predictions = (proba[:, 1] >= 0.5).astype(int)
   
3. MODEL CONFIDENCE (how sure is the model?)
   confidence = np.abs(proba[:, 1] - 0.5) * 2
   Range: 0 (50/50 uncertain) to 1 (100% confident)
   
4. RISK SCORES (for business decisions)
   risk_score = proba[:, 1]  # Same as failure_prob
   
5. BOTH CLASS PROBABILITIES
   proba[:, 0]  # P(No Failure)
   proba[:, 1]  # P(Failure)
""")

# ============================================================================
# XGBOOST SPECIFIC
# ============================================================================
print("=" * 80)
print("STEP 6: XGBoost model.predict_proba() Usage")
print("=" * 80)

print(f"""
XGBoost Model Info:
  • Number of features: {xgb_model.n_features_in_}
  • Model type: {type(xgb_model).__name__}
  • Objective: {xgb_model.objective}

To use XGBoost predict_proba():
  
  step 1: Prepare your features (X_data with {xgb_model.n_features_in_} columns)
  
  step 2: Call predict_proba()
          xgb_proba = xgb_model.predict_proba(X_data)
          
  step 3: Use the results
          failure_prob = xgb_proba[:, 1]
          predictions = (failure_prob >= 0.5).astype(int)

Example Output:
  xgb_proba shape: ({len(results_df)}, 2)
  Mean failure probability: {results_df['xgboost_failure_prob'].mean():.6f}
  High-risk samples (prob >= 0.7): {(results_df['xgboost_failure_prob'] >= 0.7).sum()}
""")

# ============================================================================
# LIGHTGBM SPECIFIC
# ============================================================================
print("=" * 80)
print("STEP 7: LightGBM model.predict_proba() Usage")
print("=" * 80)

print(f"""
LightGBM Model Info:
  • Number of features: {lgb_model.n_features_in_}
  • Model type: {type(lgb_model).__name__}
  • Feature importance available: {hasattr(lgb_model, 'feature_importances_')}

To use LightGBM predict_proba():
  
  step 1: Prepare your features (X_data with {lgb_model.n_features_in_} columns)
  
  step 2: Call predict_proba()
          lgb_proba = lgb_model.predict_proba(X_data)
          
  step 3: Use the results
          failure_prob = lgb_proba[:, 1]
          predictions = (failure_prob >= 0.5).astype(int)

Example Output:
  lgb_proba shape: ({len(results_df)}, 2)
  Mean failure probability: {results_df['lightgbm_failure_prob'].mean():.6f}
  High-risk samples (prob >= 0.7): {(results_df['lightgbm_failure_prob'] >= 0.7).sum()}
""")

# ============================================================================
# MODEL STATISTICS
# ============================================================================
print("=" * 80)
print("STEP 8: LightGBM Model Predictions Statistics")
print("=" * 80)

lgb_all = results_df['failure_probability'].values

print(f"""
Model Prediction Statistics:
  
  LightGBM:
    Mean failure probability: {lgb_all.mean():.6f}
    Median failure probability: {np.median(lgb_all):.6f}
    Low Risk (< 0.1): {(lgb_all < 0.1).sum()}
    Medium Risk (0.1-0.5): {((lgb_all >= 0.1) & (lgb_all < 0.5)).sum()}
    High-risk predictions (0.5-0.7): {((lgb_all >= 0.5) & (lgb_all < 0.7)).sum()}
    Critical predictions (>= 0.7): {(lgb_all >= 0.7).sum()}
    Extreme critical (>= 0.95): {(lgb_all >= 0.95).sum()}
    
  Distribution:
    Min probability: {lgb_all.min():.6f}
    Max probability: {lgb_all.max():.6f}
    Standard deviation: {lgb_all.std():.6f}
""")

# ============================================================================
# THRESHOLD ADJUSTMENTS
# ============================================================================
print("=" * 80)
print("STEP 9: Using Different Thresholds with predict_proba()")
print("=" * 80)

print(f"""
By default, we use 0.5 as the threshold:
  prediction = (failure_prob >= 0.5)
  
But predict_proba() allows you to use ANY threshold!

Common thresholds and their meaning:

  Threshold 0.3 (Low confidence, catch more failures):
    Flags: {(lgb_all >= 0.3).sum()} samples as potential failures ({(lgb_all >= 0.3).sum()/len(lgb_all)*100:.1f}%)
    Warning: More false positives, but doesn't miss failures
    
  Threshold 0.5 (Default, balanced):
    Flags: {(lgb_all >= 0.5).sum()} samples as potential failures ({(lgb_all >= 0.5).sum()/len(lgb_all)*100:.1f}%)
    Best for: When cost of false positive = cost of false negative
    
  Threshold 0.7 (High confidence, only sure ones):
    Flags: {(lgb_all >= 0.7).sum()} samples as potential failures ({(lgb_all >= 0.7).sum()/len(lgb_all)*100:.1f}%)
    Warning: May miss some failures, but fewer false alarms
    
  Threshold 0.9 (Very high confidence, maximum precision):
    Flags: {(lgb_all >= 0.9).sum()} samples as potential failures ({(lgb_all >= 0.9).sum()/len(lgb_all)*100:.1f}%)
    Use for: Critical systems where false positives are expensive

Algorithm to find best threshold:
  for threshold in [0.1, 0.2, ..., 0.9]:
      predictions = (failure_prob >= threshold)
      accuracy = calculate_accuracy(predictions, y_true)
      print(f"Threshold {{threshold}}: Accuracy {{accuracy}}")
""")

# ============================================================================
# REAL-WORLD EXAMPLE
# ============================================================================
print("=" * 80)
print("STEP 10: Real-World Example Usage")
print("=" * 80)

print(f"""
Scenario: Manufacturing plant with {len(results_df)} machines (8000 total)

Predictions today:
  • {(lgb_all >= 0.7).sum()} machines need URGENT attention (prob >= 0.7)
  • {((lgb_all >= 0.5) & (lgb_all < 0.7)).sum()} machines need HIGH priority (prob 0.5-0.7)
  • {((lgb_all >= 0.3) & (lgb_all < 0.5)).sum()} machines need MEDIUM attention (prob 0.3-0.5)
  • {(lgb_all < 0.3).sum()} machines are LOW risk (prob < 0.3)

Step 1: Get predictions using predict_proba()
        
        proba_predictions = model.predict_proba(sensor_data)
        failure_probabilities = proba_predictions[:, 1]

Step 2: Rank by risk (high to low)
        
        top_risk_idx = np.argsort(failure_probabilities)[::-1][:10]
        
Step 3: Create action plan based on probability
        
        for idx in top_risk_idx:
            prob = failure_probabilities[idx]
            
            if prob >= 0.9:
                action = "URGENT: Replace immediately"
            elif prob >= 0.7:
                action = "HIGH: Schedule maintenance this week"
            elif prob >= 0.5:
                action = "MEDIUM: Plan maintenance soon"
            else:
                action = "LOW: Monitor and recheck next month"
                
            print(f"Machine {{idx}}: {{prob:.2%}} failure risk → {{action}}")

Step 4: Track confidence in predictions
        
        confidence = np.abs(failure_probabilities - 0.5) * 2
        uncertain = confidence < 0.3
        
        # Review uncertain predictions manually
        manual_review_count = uncertain.sum()
        print(f"Predictions to review manually: {{manual_review_count}}")

Step 5: Set custom thresholds for your business
        
        # Your thresholds (adjust based on domain knowledge)
        MAINTENANCE_THRESHOLD = 0.6  # Start maintenance planning
        URGENT_THRESHOLD = 0.85      # Immediate action needed
        
        maintenance_needed = failure_probabilities >= MAINTENANCE_THRESHOLD
        urgent_cases = failure_probabilities >= URGENT_THRESHOLD
""")

# ============================================================================
# CODE EXAMPLES
# ============================================================================
print("=" * 80)
print("STEP 11: Complete Code Examples")
print("=" * 80)

code_example = '''
import pickle
import numpy as np

# Load trained model
model = pickle.load(open("ml/models/lightgbm_model.pkl", "rb"))

# Example 1: Get probabilities and use 0.5 threshold (default)
proba = model.predict_proba(X_test)           # Shape: (n_samples, 2)
failure_prob = proba[:, 1]                    # Get failure probabilities
predictions = (failure_prob >= 0.5).astype(int)  # Convert to predictions

# Example 2: Get high-confidence predictions only
confidence = np.abs(failure_prob - 0.5) * 2  # 0 to 1 scale
high_conf = confidence >= 0.8                 # Only very confident
high_conf_predictions = predictions[high_conf]

# Example 3: Rank by risk
risk_idx = np.argsort(failure_prob)[::-1]    # Sort by failure probability
top_10_risky = risk_idx[:10]                 # Top 10 most risky machines
for idx in top_10_risky:
    print(f"Machine {idx}: {failure_prob[idx]:.2%} failure risk")

# Example 4: Use custom threshold
threshold = 0.7
custom_predictions = (failure_prob >= threshold).astype(int)
n_flagged = custom_predictions.sum()
print(f"Machines flagged with 70% threshold: {n_flagged}")

# Example 5: Get both class probabilities
no_failure_prob = proba[:, 0]
failure_prob = proba[:, 1]
print(f"Sample 0: {no_failure_prob[0]:.2%} no-failure, {failure_prob[0]:.2%} failure")
'''

print(code_example)

# ============================================================================
# SUMMARY
# ============================================================================
print("=" * 80)
print("SUMMARY: Key Takeaways")
print("=" * 80)

print("""
✓ predict_proba() returns probabilities for ALL classes
✓ Output shape: (n_samples, 2) for binary classification
✓ Probabilities sum to 1 for each sample
✓ You can use ANY threshold (not just 0.5)
✓ Can get confidence by: |prob - 0.5| * 2
✓ Use for ranking models by risk
✓ Essential for business decision-making
✓ Both XGBoost and LightGBM support predict_proba()

Your Models:
  • XGBoost: {(results_df['xgboost_failure_prob'] >= 0.7).sum()} high-risk samples
  • LightGBM: {(results_df['lightgbm_failure_prob'] >= 0.7).sum()} high-risk samples
  • Models agree on {(np.abs(xgb_all - lgb_all) < 0.1).sum()}/{len(results_df)} predictions

Next Steps:
  1. Use predict_proba() in your production pipeline
  2. Adjust thresholds based on business requirements
  3. Monitor prediction confidence for uncertain cases
  4. Track model performance over time
""")

print("=" * 80)
print("✓ predict_proba() Guide Complete!")
print("=" * 80)
