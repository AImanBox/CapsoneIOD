# Machine Failure Prediction - Model Retraining Report
**Date**: March 8, 2026  
**Report ID**: MODEL_RETRAINING_20260308  
**Status**: ✅ COMPLETE

---

## Executive Summary

This report documents the complete retraining of all AI models (XGBoost and LightGBM) for the Machine Failure Prediction system with standardized parameters: **test_size=0.2** and **random_state=42**.

### Key Achievements
- ✅ Successfully retrained both XGBoost and LightGBM models
- ✅ Achieved exceptional prediction performance (>99% accuracy)
- ✅ Maintained reproducibility with fixed random_state=42
- ✅ Documented all configuration and metrics changes
- ✅ Both models ready for production deployment

---

## 1. Training Configuration

### New Training Parameters (Retraining)
| Parameter | Value | Purpose |
|-----------|-------|---------|
| **Test Size** | 0.2 (20%) | Consistent evaluation on 2,000 test samples |
| **Train Size** | 0.8 (80%) | 8,000 training samples for model fitting |
| **Random State** | 42 | Fixed seed for reproducibility across runs |
| **Split Strategy** | Stratified Random | Maintains class distribution in both sets |
| **Dataset** | machine_failure.csv | 10,000 samples, 14 raw features |
| **Timestamp** | 2026-03-08 14:17:13 | Exact execution time |

### Dataset Characteristics
| Property | Train Set | Test Set | Total |
|----------|-----------|----------|-------|
| **Total Samples** | 8,000 | 2,000 | 10,000 |
| **Failure Samples** | 271 | 68 | 339 |
| **No-Failure Samples** | 7,729 | 1,932 | 9,661 |
| **Failure Rate** | 3.39% | 3.40% | 3.39% |

**Class Imbalance Mitigation:**
- Scale pos weight: **28.52** (one failure weighted as 28.52 normal operations)
- Stratified split ensures both sets maintain 3.39% failure rate
- Enables effective training on highly imbalanced data

---

## 2. Feature Engineering

### Feature Summary
- **Raw Features**: 14 (from machine_failure.csv)
- **Engineered Features**: 25 (after processing)
- **Feature Types**: 
  - Sensor measurements: 5 numeric
  - Advanced features: 20 engineered

### Engineered Feature Categories
| Category | Features | Description |
|----------|----------|-------------|
| **Basic** | UDI, Product ID, Type | Identification and classification |
| **Temperature** | Air temperature K, Process temperature K | Thermal characteristics |
| **Mechanical** | Rotational speed, Torque | Operational parameters |
| **Wear** | Tool Wear | Degradation indicator |
| **Advanced** | 15+ interaction terms | Derived from base features |

### Column Name Cleaning
All feature names cleaned for model compatibility:
- Removed special characters: `[`, `]`, `<`, `>`
- Example: `Air temperature [K]` → `Air temperature K`
- Ensures XGBoost and LightGBM compatibility

---

## 3. XGBoost Model - Retrained

### Model Configuration
```python
XGBClassifier(
    max_depth=8,
    learning_rate=0.1,
    n_estimators=200,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    scale_pos_weight=28.52,
    eval_metric='logloss'
)
```

### Performance Metrics

#### Primary Metrics
| Metric | Score | Interpretation |
|--------|-------|-----------------|
| **ROC-AUC** | 0.9910 | Excellent discrimination between failure/no-failure |
| **Precision** | 0.9851 | 98.51% of predicted failures are actual failures |
| **Recall** | 0.9706 | 97.06% of actual failures are correctly identified |
| **F1-Score** | 0.9778 | Strong balance between precision and recall |
| **Accuracy** | 0.9985 | 99.85% overall correctness |

#### Confusion Matrix
```
                Predicted Negative    Predicted Positive
Actual Negative      1,931                    1
Actual Positive          2                   66
```

**Interpretation:**
- **True Negatives (TN)**: 1,931 correctly identified normal operations
- **False Positives (FP)**: 1 normal operation falsely flagged as failure
- **False Negatives (FN)**: 2 actual failures missed
- **True Positives (TP)**: 66 failures correctly identified

#### Error Analysis
| Error Type | Count | Rate | Impact |
|------------|-------|------|--------|
| **False Positives** | 1 | 0.05% | Minimal unnecessary maintenance |
| **False Negatives** | 2 | 3.0% | Critical - 2/68 failures missed |
| **Total Misclassifications** | 3 | 0.15% | Excellent overall accuracy |

---

## 4. LightGBM Model - Retrained

### Model Configuration
```python
LGBMClassifier(
    max_depth=8,
    learning_rate=0.1,
    n_estimators=200,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    scale_pos_weight=28.52
)
```

### Performance Metrics

#### Primary Metrics
| Metric | Score | Interpretation |
|--------|-------|-----------------|
| **ROC-AUC** | 0.9933 | **BEST** exceptional discrimination ability |
| **Precision** | 0.9706 | 97.06% of predicted failures are actual failures |
| **Recall** | 0.9706 | 97.06% of actual failures are correctly identified |
| **F1-Score** | 0.9706 | Perfect balance between precision and recall |
| **Accuracy** | 0.9980 | 99.80% overall correctness |

#### Confusion Matrix
```
                Predicted Negative    Predicted Positive
Actual Negative      1,930                    2
Actual Positive          2                   66
```

**Interpretation:**
- **True Negatives (TN)**: 1,930 correctly identified normal operations
- **False Positives (FP)**: 2 normal operations falsely flagged as failures
- **False Negatives (FN)**: 2 actual failures missed
- **True Positives (TP)**: 66 failures correctly identified

#### Error Analysis
| Error Type | Count | Rate | Impact |
|------------|-------|------|--------|
| **False Positives** | 2 | 0.10% | Minimal unnecessary maintenance |
| **False Negatives** | 2 | 3.0% | Critical - 2/68 failures missed |
| **Total Misclassifications** | 4 | 0.20% | Excellent overall accuracy |

---

## 5. Model Comparison

### Performance Comparison Matrix

| Metric | XGBoost | LightGBM | Winner | Difference |
|--------|---------|----------|--------|------------|
| **ROC-AUC** | 0.9910 | **0.9933** | LightGBM | +0.0023 |
| **Precision** | **0.9851** | 0.9706 | XGBoost | +0.0145 |
| **Recall** | **0.9706** | **0.9706** | Tie | 0.0000 |
| **F1-Score** | **0.9778** | **0.9706** | XGBoost | +0.0072 |
| **Accuracy** | **0.9985** | 0.9980 | XGBoost | +0.0005 |

### Visual Comparison

```
Metric Performance (Higher is Better):

ROC-AUC:        XGBoost ████████████████████████ 0.9910
                LightGBM █████████████████████████ 0.9933*

Precision:      XGBoost █████████████████████████ 0.9851*
                LightGBM ████████████████████████ 0.9706

Recall (F1):    XGBoost █████████████████████████ 0.9706*
                LightGBM █████████████████████████ 0.9706*

Accuracy:       XGBoost █████████████████████████ 0.9985*
                LightGBM ████████████████████████ 0.9980
```

### Error Comparison

| Model | FP | FN | Total Errors | Error Rate |
|-------|----|----|--------------|-----------|
| **XGBoost** | 1 | 2 | 3 | 0.15% |
| **LightGBM** | 2 | 2 | 4 | 0.20% |

**Analysis:**
- XGBoost has fewer false negatives (2 vs 2) - equal
- XGBoost has fewer false positives (1 vs 2) - better for maintenance costs
- LightGBoost has highest ROC-AUC - best for overall discrimination
- Both models excel at capturing actual failures

---

## 6. Key Findings

### ✅ Strengths
1. **Outstanding Accuracy**: Both models achieve >99.8% accuracy
2. **Balanced Performance**: 
   - High recall (97%+) - catches most failures
   - High precision (97%+) - minimizes false alarms
3. **Consistent Recall**: Both models identify 97.06% of actual failures
4. **Reproducibility**: Fixed random_state ensures consistent results across runs
5. **Class Imbalance Handling**: Both models handle 28.52:1 imbalance effectively

### ⚠️ Considerations
1. **False Negative Rate (~3%)**: 
   - 2 actual failures missed in test set
   - Potential risk: missed maintenance opportunities
   - Mitigation: Use ensemble or conservative threshold

2. **False Positive Rate (<0.1%)**: 
   - Minimal unnecessary maintenance triggered
   - Cost-effective in production

3. **Small Difference Between Models**:
   - LightGBM ROC-AUC slightly better (+0.23%)
   - XGBoost precision slightly better (+1.45%)
   - Choose based on specific deployment need

---

## 7. Model Selection Recommendation

### Decision Framework

**Choose LightGBM if:**
- ✓ Maximizing overall discrimination ability (ROC-AUC: 0.9933)
- ✓ Want the absolute best statistical classifier
- ✓ Balancing precision and recall equally
- ✓ Fast inference speed is important
- **Recommendation**: Production use - slightly better ROC-AUC

**Choose XGBoost if:**
- ✓ Minimizing false alarms important (precision: 0.9851)
- ✓ Want highest accuracy (99.85%)
- ✓ Avoiding unnecessary maintenance costs
- ✓ Need maximum F1-score (0.9778)
- **Recommendation**: Safety-critical applications - better precision

### Final Recommendation: **LIGHTGBM** 🌟
**Rationale:**
- ROC-AUC 0.9933 is marginally superior
- Identical recall to XGBoost (97.06%)
- Acceptable false positive rate (0.10%)
- Production ready with excellent performance

---

## 8. Training Artifacts

### Saved Models
| File | Location | Status |
|------|----------|--------|
| `xgboost_model.pkl` | ml/models/ | ✅ Ready |
| `lightgbm_model.pkl` | ml/models/ | ✅ Ready |
| `ML_models.json` | ml/models/ | ✅ Registry |
| `model_comparison_results.json` | ml/models/ | ✅ Metrics |

### Data Splits
| File | Rows | Purpose |
|------|------|---------|
| `train.csv` | 8,000 | Model training |
| `test.csv` | 2,000 | Model evaluation |
| `machine_failure.csv` | 10,000 | Source dataset |

---

## 9. Deployment Checklist

- [x] Models trained with standardized parameters (test_size=0.2, random_state=42)
- [x] Both models achieve >99.8% accuracy
- [x] Proper class imbalance handling (scale_pos_weight=28.52)
- [x] Feature engineering completed (25 features)
- [x] Metrics documented and compared
- [x] Models saved in production format (.pkl)
- [x] Registry created for model versioning
- [x] Confusion matrices documented
- [x] Error analysis completed
- [x] Recommendation provided

---

## 10. Conclusions

### Summary
Both XGBoost and LightGBM models have been successfully retrained with consistent, reproducible parameters (test_size=0.2, random_state=42). The models demonstrate exceptional performance with >99.8% accuracy and balanced precision-recall metrics.

### Performance Highlights
- **Best ROC-AUC**: LightGBM (0.9933)
- **Best Precision**: XGBoost (0.9851)
- **Best Accuracy**: XGBoost (0.9985)
- **Balanced F1**: Both models (0.9706-0.9778)

### Deployment Status
✅ **Both models are production-ready**
- Recommend: **LightGBM** for primary deployment
- Fallback: **XGBoost** as secondary/ensemble option

### Next Steps
1. Deploy LightGBM model to production
2. Monitor false negative rate (<3%) in live environment
3. Implement feedback loop for continuous improvement
4. Schedule quarterly retraining cycles
5. Maintain detailed prediction audit logs

---

**Report Generated**: 2026-03-08 14:17:30  
**Prepared By**: AI Model Training Pipeline  
**Version**: 1.0  
**Status**: ✅ COMPLETE AND APPROVED FOR DEPLOYMENT
