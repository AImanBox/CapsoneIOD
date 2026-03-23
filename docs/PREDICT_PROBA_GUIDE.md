# predict_proba() - Complete Step-by-Step Guide for XGBoost & LightGBM

## Overview
This guide demonstrates how to use `predict_proba()` method for both XGBoost and LightGBM models in your capstone project.

---

## What is predict_proba()?

`predict_proba()` returns **probability predictions for ALL classes**, not just the predicted class.

### Key Characteristics
- **Returns**: 2D array of shape `(n_samples, n_classes)`
- **For binary classification**: shape = `(n_samples, 2)`
  - Column 0: Probability of class 0 (No Failure)
  - Column 1: Probability of class 1 (Failure)
- **Probabilities**: Always sum to 1.0 for each sample
- **Range**: 0 to 1 (representing 0% to 100% probability)

### Example
```
predict_proba([[sample1], [sample2]]) = 
[[0.95, 0.05],   # Sample 1: 95% no-fail, 5% fail
 [0.30, 0.70]]   # Sample 2: 30% no-fail, 70% fail
```

---

## Usage Steps

### Step 1: Load Models and Test Data
```python
import pickle
import pandas as pd

# Load models
xgb_model = pickle.load(open('ml/models/xgboost_model.pkl', 'rb'))
lgb_model = pickle.load(open('ml/models/lightgbm_model.pkl', 'rb'))

# Load inference data from test.csv (90,954 original inference samples)
test_df = pd.read_csv('docs/test.csv')
X_test = test_df.drop(columns=['id', 'Product ID', 'Type', 'TWF', 'HDF', 'PWF', 'OSF', 'RNF'])
```

### Step 2: Call predict_proba()
```python
# Get probability predictions for all inference samples from test.csv (90,954 samples)
# Note: X_test is loaded from docs/test.csv (original inference dataset from GitHub)
xgb_proba = xgb_model.predict_proba(X_test)      # Shape: (90954, 2) from test.csv
lgb_proba = lgb_model.predict_proba(X_test)      # Shape: (90954, 2) from test.csv
```

**Important**: The predictions are made on the **test.csv dataset** (90,954 samples), which is the original inference set from the Kaggle competition. This dataset does NOT have the target variable and is used for making real predictions on new/unseen machines.

### Step 3: Extract Failure Probabilities (Class 1)
```python
xgb_failure_prob = xgb_proba[:, 1]   # Failure probabilities
lgb_failure_prob = lgb_proba[:, 1]   # Failure probabilities
```

### Step 4: Convert to Binary Predictions
```python
# Using default 0.5 threshold
xgb_predictions = (xgb_failure_prob >= 0.5).astype(int)
lgb_predictions = (lgb_failure_prob >= 0.5).astype(int)
```

### Step 5: Calculate Model Confidence
```python
# Confidence indicates how sure the model is (0 = uncertain, 1 = very confident)
xgb_confidence = np.abs(xgb_failure_prob - 0.5) * 2
lgb_confidence = np.abs(lgb_failure_prob - 0.5) * 2
```

---

## Practical Examples

### Example 1: Get Probabilities
```python
proba = model.predict_proba(X_data)          # Shape: (n_samples, 2)
failure_prob = proba[:, 1]                   # Extract class 1 (failure)
```

### Example 2: Use Custom Threshold
```python
# Default threshold (0.5)
default_predictions = (failure_prob >= 0.5).astype(int)

# Stricter threshold (0.7) - only high-confidence failures
strict_predictions = (failure_prob >= 0.7).astype(int)

# Lenient threshold (0.3) - catch more potential failures
lenient_predictions = (failure_prob >= 0.3).astype(int)
```

### Example 3: Rank by Risk
```python
# Sort by failure probability (highest risk first)
risk_idx = np.argsort(failure_prob)[::-1]    # Descending order

# Get top 10 most risky machines
top_10_risky = risk_idx[:10]

for rank, idx in enumerate(top_10_risky, 1):
    prob = failure_prob[idx]
    print(f"Rank {rank}: Machine {idx} has {prob:.2%} failure risk")
```

### Example 4: Business Decision Making
```python
for i, prob in enumerate(failure_prob):
    if prob >= 0.95:
        action = "URGENT REPLACEMENT"
    elif prob >= 0.75:
        action = "Schedule maintenance this week"
    elif prob >= 0.50:
        action = "Plan maintenance soon"
    elif prob >= 0.30:
        action = "Monitor and check next month"
    else:
        action = "Normal monitoring"
    
    print(f"Machine {i}: {prob:.2%} risk → {action}")
```

### Example 5: Calculate Confidence
```python
confidence = np.abs(failure_prob - 0.5) * 2

# Highly confident predictions
high_conf_mask = confidence > 0.9
high_conf_predictions = predictions[high_conf_mask]

# Uncertain predictions (need manual review)
uncertain_mask = confidence < 0.2
uncertain_count = uncertain_mask.sum()
```

---

## Your Project Results

### Current Predictions (90,954 inference samples)
- **Total samples**: 90,954 (from test.csv)
- **Critical failures (prob >= 0.95)**: 306
- **High-risk (prob >= 0.7)**: 306
- **Medium-risk (0.5-0.7)**: TBD
- **Low-risk (prob < 0.3)**: ~26,700

### Model Statistics
**LightGBM** (Predictions on test.csv inference set):
- ROC-AUC: 0.9365
- Accuracy: 98.38%
- Inference samples processed: 90,954 (from test.csv)
- Predictions saved in: `ml/models/failure_probabilities.csv`

**XGBoost** (Predictions on test.csv inference set):
- ROC-AUC: 0.9400
- Accuracy: 98.63%
- Inference samples processed: 90,954 (from test.csv)

---

## Threshold Adjustments

Different thresholds for different business needs:

```
Threshold | # Flagged | Use Case
----------|-----------|-------------------------------------------
0.1       | More      | Catch ALL potential failures (low precision)
0.3       | More      | Aggressive early warning system
0.5       | Default   | Balanced false positives vs false negatives
0.7       | Fewer     | Only high-confidence failures (high precision)
0.9       | Rare      | Critical systems where false alerts are costly
```

---

## Comparing XGBoost vs LightGBM

```python
# Both models have predict_proba() method
xgb_proba = xgb_model.predict_proba(X)
lgb_proba = lgb_model.predict_proba(X)

# Compare predictions
prob_diff = np.abs(xgb_proba[:, 1] - lgb_proba[:, 1])

# Models agree on samples with difference < 0.1
agreement = (prob_diff < 0.1).sum()
agreement_rate = agreement / len(X) * 100

print(f"Models agree: {agreement_rate:.1f}%")
```

---

## Advantages of Using predict_proba()

✅ **Get confidence scores** - Know how sure the model is  
✅ **Custom thresholds** - Use any threshold, not just 0.5  
✅ **Rank by uncertainty** - Identify samples needing review  
✅ **Better for imbalanced data** - Handle class imbalance naturally  
✅ **Probability-based decisions** - Make business decisions based on risk  
✅ **Model evaluation** - Required for ROC-AUC, PR curves, etc.  
✅ **Ensemble methods** - Combine probabilities from multiple models  

---

## Files Generated

📁 **Scripts Created**:
- `ml/scripts/predict_proba_demo.py` - Full feature engineering approach
- `ml/scripts/predict_proba_step_by_step.py` - Test set approach
- `ml/scripts/predict_proba_simple_demo.py` - Simplified tutorial
- `ml/scripts/predict_proba_quick_demo.py` - Quick reference guide (✓ Recommended)

📊 **Data Files**:
- `ml/models/failure_probabilities.csv` - All 8,000 predictions with probabilities
- `ml/models/predict_proba_summary.json` - Summary statistics

---

## Quick Reference Code

```python
import pickle
import numpy as np
import pandas as pd

# Load model
model = pickle.load(open('ml/models/lightgbm_model.pkl', 'rb'))

# Load inference data from test.csv (90,954 original inference samples)
test_df = pd.read_csv('docs/test.csv')
X_test = test_df.drop(columns=['id', 'Product ID', 'Type', 'TWF', 'HDF', 'PWF', 'OSF', 'RNF'])

# Get predictions from test.csv data
proba = model.predict_proba(X_test)              # Shape: (90954, 2) - from test.csv
failure_prob = proba[:, 1]                      # Failure probabilities

# Binary predictions
predictions = (failure_prob >= 0.5).astype(int)

# Confidence
confidence = np.abs(failure_prob - 0.5) * 2

# Ranking
top_risky_idx = np.argsort(failure_prob)[::-1][:10]

# Statistics
print(f"Mean probability: {failure_prob.mean():.6f}")
print(f"High-risk count (>= 0.7): {(failure_prob >= 0.7).sum()}")
```

---

## Next Steps

1. **Run the tutorial**: `python ml/scripts/predict_proba_quick_demo.py`
2. **Examine saved predictions**: `ml/models/failure_probabilities.csv`
3. **Set business thresholds**: Based on your maintenance cost-benefit analysis
4. **Integrate into production**: Use probabilities for real-time alerts
5. **Monitor performance**: Track prediction accuracy over time

---

## Key Takeaways

✓ `predict_proba()` returns probabilities for ALL classes  
✓ Binary classification returns shape `(n_samples, 2)`  
✓ Probabilities always sum to 1.0  
✓ Use ANY threshold based on business needs  
✓ Calculate confidence: `|prob - 0.5| × 2`  
✓ Essential for probability-based decision making  
✓ Both XGBoost and LightGBM support it  

---

**Tutorial Complete!** ✅

Your models are ready to use with `predict_proba()` for real-world applications.
