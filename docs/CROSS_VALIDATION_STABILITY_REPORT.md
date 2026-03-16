# Cross-Validation Stability Assessment Report
**Date**: March 8, 2026  
**Report ID**: CROSS_VALIDATION_20260308  
**Timestamp**: 20260308_142905  
**Status**: ✅ COMPLETE

---

## Executive Summary

Both XGBoost and LightGBM models have been rigorously validated using 5-fold stratified cross-validation to assess their stability and generalization capability. The results demonstrate **EXCELLENT stability** for both models with minimal variance across folds.

### Key Findings
- ✅ **XGBoost**: EXCELLENT stability (CV: 0.40%)
- ✅ **LightGBM**: EXCELLENT stability (CV: 0.39%)
- ✅ Both models show consistent performance across all 5 folds
- ✅ High confidence in production deployment
- ✅ Minimal variance indicates robust generalization

---

## 1. Cross-Validation Methodology

### Approach
- **Strategy**: 5-Fold Stratified K-Fold Cross-Validation
- **Folds**: 5 separate train/test splits
- **Stratification**: Class distribution maintained in each fold
- **Random State**: 42 (for reproducibility)
- **Data**: All 10,000 samples from machine_failure.csv
- **Features**: 25 engineered features

### Rationale
- Stratified split ensures each fold has representative failure/non-failure ratios
- 5 folds provide good balance between computing time and variance estimation
- Full dataset used (unlike single 80/20 split) provides more robust assessment
- Fixed random_state ensures reproducibility

### Data Split Configuration
```
Original Dataset (10,000 samples):
├── No Failure (0):  9,661 samples (96.61%)
└── Failure (1):       339 samples (3.39%)

Each Fold Contains:
├── Training: ~8,000 samples
└── Testing:  ~2,000 samples

Stratification Maintains:
├── No Failure (0): ~96.61% in each fold
└── Failure (1):     ~3.39% in each fold
```

---

## 2. XGBoost Cross-Validation Results

### Per-Fold Performance

| Fold | ROC-AUC | Precision | Recall | F1-Score | Accuracy | Train Size | Test Size |
|------|---------|-----------|--------|----------|----------|-----------|-----------|
| 1 | 0.9872 | 0.9848 | 0.9701 | 0.9774 | 0.9985 | 8000 | 2000 |
| 2 | 0.9930 | 1.0000 | 0.9706 | 0.9852 | 0.9990 | 8000 | 2000 |
| 3 | 0.9854 | 1.0000 | 0.9706 | 0.9852 | 0.9990 | 8000 | 2000 |
| 4 | 0.9896 | 1.0000 | 0.9706 | 0.9852 | 0.9990 | 8000 | 2000 |
| 5 | 0.9898 | 1.0000 | 0.9853 | 0.9926 | 0.9995 | 8000 | 2000 |

### Summary Statistics

| Metric | Mean | Std Dev | Min | Max | Range | CV% | Stability |
|--------|------|---------|-----|-----|-------|-----|-----------|
| **ROC-AUC** | 0.9890 | 0.0026 | 0.9854 | 0.9930 | 0.0076 | 0.26% | ⭐ EXCELLENT |
| **Precision** | 0.9970 | 0.0061 | 0.9848 | 1.0000 | 0.0152 | 0.61% | ⭐ EXCELLENT |
| **Recall** | 0.9734 | 0.0059 | 0.9701 | 0.9853 | 0.0151 | 0.61% | ⭐ EXCELLENT |
| **F1-Score** | 0.9851 | 0.0048 | 0.9774 | 0.9926 | 0.0151 | 0.49% | ⭐ EXCELLENT |
| **Accuracy** | 0.9990 | 0.0003 | 0.9985 | 0.9995 | 0.0010 | 0.03% | ⭐ EXCELLENT |

### Stability Analysis
- **Average CV (Coefficient of Variation)**: 0.40%
- **Overall Stability Grade**: 🌟 **EXCELLENT**
- **Assessment**: Highly stable model, excellent for production

#### Metric-by-Metric Assessment
1. **ROC-AUC (0.26% CV)**: Exceptional discrimination consistency
   - Range: 0.9854 - 0.9930 (0.76% spread)
   - Interpretation: Model reliably distinguishes failures across all data splits
   
2. **Precision (0.61% CV)**: Very high and stable
   - Range: 0.9848 - 1.0000
   - Interpretation: Consistent false alarm rate across folds
   
3. **Recall (0.61% CV)**: Robust failure detection
   - Range: 0.9701 - 0.9853
   - Interpretation: Model catches similar proportion of failures in all splits
   
4. **F1-Score (0.49% CV)**: Excellent balance
   - Range: 0.9774 - 0.9926
   - Interpretation: Consistent precision-recall tradeoff
   
5. **Accuracy (0.03% CV)**: Remarkably stable
   - Range: 0.9985 - 0.9995
   - Interpretation: Virtually no variance in overall correctness

---

## 3. LightGBM Cross-Validation Results

### Per-Fold Performance

| Fold | ROC-AUC | Precision | Recall | F1-Score | Accuracy | Train Size | Test Size |
|------|---------|-----------|--------|----------|----------|-----------|-----------|
| 1 | 0.9897 | 0.9848 | 0.9701 | 0.9774 | 0.9985 | 8000 | 2000 |
| 2 | 0.9853 | 1.0000 | 0.9706 | 0.9852 | 0.9990 | 8000 | 2000 |
| 3 | 0.9910 | 1.0000 | 0.9706 | 0.9852 | 0.9990 | 8000 | 2000 |
| 4 | 0.9907 | 1.0000 | 0.9706 | 0.9852 | 0.9990 | 8000 | 2000 |
| 5 | 0.9930 | 0.9853 | 0.9853 | 0.9853 | 0.9990 | 8000 | 2000 |

### Summary Statistics

| Metric | Mean | Std Dev | Min | Max | Range | CV% | Stability |
|--------|------|---------|-----|-----|-------|-----|-----------|
| **ROC-AUC** | 0.9899 | 0.0026 | 0.9853 | 0.9930 | 0.0077 | 0.26% | ⭐ EXCELLENT |
| **Precision** | 0.9940 | 0.0073 | 0.9848 | 1.0000 | 0.0152 | 0.74% | ⭐ EXCELLENT |
| **Recall** | 0.9734 | 0.0059 | 0.9701 | 0.9853 | 0.0151 | 0.61% | ⭐ EXCELLENT |
| **F1-Score** | 0.9836 | 0.0031 | 0.9774 | 0.9853 | 0.0079 | 0.31% | ⭐ EXCELLENT |
| **Accuracy** | 0.9989 | 0.0002 | 0.9985 | 0.9990 | 0.0005 | 0.02% | ⭐ EXCELLENT |

### Stability Analysis
- **Average CV (Coefficient of Variation)**: 0.39%
- **Overall Stability Grade**: 🌟 **EXCELLENT**
- **Assessment**: Highly stable model, excellent for production

#### Metric-by-Metric Assessment
1. **ROC-AUC (0.26% CV)**: Exceptional discrimination consistency
   - Range: 0.9853 - 0.9930 (0.77% spread)
   - Interpretation: Model reliably distinguishes failures across all data splits
   
2. **Precision (0.74% CV)**: Very high and stable
   - Range: 0.9848 - 1.0000
   - Interpretation: Consistent false alarm rate across folds
   
3. **Recall (0.61% CV)**: Robust failure detection
   - Range: 0.9701 - 0.9853
   - Interpretation: Model catches similar proportion of failures in all splits
   
4. **F1-Score (0.31% CV)**: Excellent and highly consistent balance
   - Range: 0.9774 - 0.9853
   - Interpretation: Most consistent precision-recall tradeoff across folds
   
5. **Accuracy (0.02% CV)**: Remarkably stable
   - Range: 0.9985 - 0.9990
   - Interpretation: Virtually no variance in overall correctness

---

## 4. Comparative Stability Analysis

### Model Comparison

| Aspect | XGBoost | LightGBM | Winner | Interpretation |
|--------|---------|----------|--------|-----------------|
| **Average CV** | 0.40% | 0.39% | LightGBM | Marginally more stable |
| **ROC-AUC CV** | 0.26% | 0.26% | Tie | Identical discrimination stability |
| **Precision CV** | 0.61% | 0.74% | XGBoost | Slightly more consistent |
| **Recall CV** | 0.61% | 0.61% | Tie | Identical failure detection stability |
| **F1 CV** | 0.49% | 0.31% | LightGBM | Better precision-recall balance |
| **Accuracy CV** | 0.03% | 0.02% | LightGBM | Marginally more stable |
| **Overall Stability** | EXCELLENT | EXCELLENT | Essentially Equal | Both production-ready |

### Key Observations
1. **Both models are exceptionally stable** (CV < 0.4%)
2. **LightGBM slightly more stable overall** (0.39% vs 0.40%)
3. **No meaningful difference in ROC-AUC stability** (0.26% for both)
4. **Recall identical and stable** (0.61% CV for both)
5. **LightGBM shows slightly better F1 consistency** (0.31% vs 0.49%)

---

## 5. Stability Interpretation

### Classification Scale
- **CV < 1.0%**: EXCELLENT - Highly stable, suitable for production
- **CV 1.0-2.0%**: VERY GOOD - Stable, suitable for production
- **CV 2.0-5.0%**: GOOD - Reasonably stable, acceptable
- **CV 5.0-10.0%**: ACCEPTABLE - Moderate variance, monitor
- **CV > 10.0%**: CONCERNING - High variance, investigate

### Model Stability Scale
- **Average CV < 1.0%**: EXCELLENT - Highly stable for production ✅
- **Average CV 1.0-2.0%**: VERY GOOD - Suitable for production ✅
- **Average CV 2.0-5.0%**: GOOD - Acceptable for production ✅
- **Average CV 5.0-10.0%**: ACCEPTABLE - Requires monitoring ⚠️
- **Average CV > 10.0%**: CONCERNING - Needs investigation ❌

### Assessment Results
- **XGBoost**: 0.40% average CV → **EXCELLENT** ⭐
- **LightGBM**: 0.39% average CV → **EXCELLENT** ⭐

---

## 6. Production Readiness Assessment

### Stability Indicators ✅
- [x] Both models show <0.5% coefficient of variation
- [x] Consistency across all 5 folds excellent
- [x] No problematic metrics or significant variance
- [x] High reproducibility with fixed random_state
- [x] All metrics remain above 97% across folds

### Generalization Capability ✅
- [x] Cross-validation ROC-AUC (0.989-0.990) matches single-split (0.991-0.993)
- [x] Minimal gap between best and worst fold performance
- [x] Model doesn't overfit to specific data distributions
- [x] Stratification ensures balanced fold composition
- [x] Excellent performance on unseen data likely

### Risk Assessment ✅
- [x] MINIMAL RISK: Both models are highly stable
- [x] Both achieve >99.8% accuracy consistently
- [x] Both catch >97% of failures reliably
- [x] Both maintain <1% false alarm rate consistently
- [x] No fold shows concerning degradation

---

## 7. Recommendations

### For Staging/Testing
✅ **Proceed with deployment** - Both models demonstrate excellent stability

### Deployment Strategy
1. **Primary**: Deploy LightGBM (0.39% CV, best F1 consistency)
2. **Secondary**: Keep XGBoost as backup (0.40% CV, excellent stability)
3. **Monitoring**: Track actual vs. predicted failures in first 30 days
4. **Retraining**: Schedule quarterly with same cross-validation protocol

### Monitoring Recommendations
- Monitor false negative rate (target: <5% of actual failures)
- Monitor false positive rate (target: <1% of normal operations)
- Compare production CV% with baseline CV% (0.39-0.40%)
- If production metrics diverge >2% from CV results, investigate

### Quality Assurance
- Continue using same training parameters (test_size=0.2, random_state=42)
- Maintain 5-fold cross-validation protocol for future retraining
- Document any metric changes >1% in quarterly reports
- Update this stability assessment with each major retraining

---

## 8. Conclusion

Both XGBoost and LightGBM models have been rigorously validated and demonstrate **EXCELLENT stability** with minimal variance across cross-validation folds. The models show:

- ✅ Outstanding generalization capability
- ✅ Consistent performance across different data distributions
- ✅ High confidence for production deployment
- ✅ Reliable failure detection (>97% across all folds)
- ✅ Minimal false alarms (<1% across all folds)

### Final Status: **✅ APPROVED FOR PRODUCTION DEPLOYMENT**

Both models are production-ready. LightGBM is recommended as primary with XGBoost as backup.

---

## 9. Technical Details

### Computing Environment
- Python 3.14.2
- XGBoost: Latest version
- LightGBM: Latest version
- scikit-learn: Latest version

### Hyperparameters Used in CV
```
max_depth: 8
learning_rate: 0.1
n_estimators: 200
subsample: 0.8
colsample_bytree: 0.8
random_state: 42
scale_pos_weight: 28.50
```

### Evaluation Metrics
- **ROC-AUC**: Area under the Receiver Operating Characteristic curve
- **Precision**: TP / (TP + FP) - accuracy of positive predictions
- **Recall**: TP / (TP + FN) - coverage of actual positives
- **F1-Score**: 2 * (Precision * Recall) / (Precision + Recall) - harmonic mean
- **Accuracy**: (TP + TN) / (TP + TN + FP + FN) - overall correctness

### Statistical Measures
- **Mean**: Average metric value across 5 folds
- **Std Dev**: Standard deviation (measure of variation)
- **CV (Coefficient of Variation)**: (Std Dev / Mean) * 100% (relative variation)
- **Range**: Max - Min (absolute variation)

---

**Report Generated**: 2026-03-08 14:29:30  
**Validation Method**: 5-Fold Stratified K-Fold Cross-Validation  
**Status**: ✅ COMPLETE AND APPROVED  
**Next Review**: Q2 2026 (scheduled retraining)
