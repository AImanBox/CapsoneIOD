# Training & Test Dataset Documentation

**Files:** `docs/train_tr.csv` (training split) and `docs/train_te.csv` (test split)  
**Train Rows:** 136,429 (production dataset)  
**Test Rows:** 90,954 (production dataset)  
**Source:** [Binary Classification of Machine Failures](https://github.com/JMViJi/Binary-Classification-of-Machine-Failures)  
**Format:** CSV (Comma-Separated Values)  
**Downloaded:** February 8, 2026

### Dataset Statistics

| Metric | Train | Test |
|--------|-------|------|
| **Rows** | 136,429 | 90,954 |
| **Size** | 6.85 MB | 4.46 MB |
| **Columns** | 14 | 13 |
| **Status** | ✅ Ready | ✅ Ready |

---

## Column Reference

### Identifiers

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | Integer | Unique record ID | 1, 2, 3... |
| `Product ID` | String | Machine identifier (Type + serial) | M14860, L47181, H21654 |
| `Type` | String | Machine category | M, L, H (categorical) |

### Sensor Features (Numeric Inputs)

| Column | Unit | Range | Description |
|--------|------|-------|-------------|
| `Air temperature [K]` | Kelvin | ~295-310K | Ambient environment temperature |
| `Process temperature [K]` | Kelvin | ~305-320K | Machine operational temperature |
| `Rotational speed [rpm]` | RPM | 1200-2886 | Machine rotation speed |
| `Torque [Nm]` | Newton-meters | 3.8-76.6 | Rotational force applied |
| `Tool wear [min]` | Minutes | 0-255 | Accumulated tool wear |

### Target Variable

| Column | Type | Values | Description |
|--------|------|--------|-------------|
| `Machine failure` | Binary | 0 or 1 | 0 = No failure, 1 = Failure occurred |

### Failure Modes (Multi-Label)

When `Machine failure = 1`, one or more of these are true:

| Column | Type | Values | Description |
|--------|------|--------|-------------|
| `TWF` | Binary | 0 or 1 | Tool Wear Failure |
| `HDF` | Binary | 0 or 1 | Heat Dissipation Failure |
| `PWF` | Binary | 0 or 1 | Power Failure |
| `OSF` | Binary | 0 or 1 | Overstrain Failure |
| `RNF` | Binary | 0 or 1 | Random Failure |

---

## Train vs Test Dataset

### Training Dataset (`docs/train.csv`)

**Purpose:** Model learning and validation  
**Rows:** 100 (sample) | Full: 10,000+  
**Columns:** 13 (includes target & failure modes)  
**Structure:**
- ID: 1-100
- Features: Air temp, Process temp, Speed, Torque, Tool wear
- Target: `Machine failure` (0 or 1)
- Failure modes: `TWF`, `HDF`, `PWF`, `OSF`, `RNF`

**Use Case:**
```python
# Train/validation split for model development
df_train = pd.read_csv('docs/train.csv')
X = df_train[['Air temperature [K]', 'Process temperature [K]', ...]]
y = df_train['Machine failure']
model.fit(X, y)  # Learn patterns
```

### Test Dataset (`docs/train_te.csv`)

**Purpose:** Model evaluation and predictions  
**Rows:** 50 (sample) | Full: 2,500+  
**Columns:** 8 (sensor features only, NO target)  
**Structure:**
- ID: 101-150
- Features: Air temp, Process temp, Speed, Torque, Tool wear
- Target: **NOT INCLUDED** (to be predicted)
- Failure modes: **NOT INCLUDED** (predictions are objective)

**Use Case:**
```python
# Make predictions on unseen data (no labels available during prediction time)
df_test = pd.read_csv('docs/test.csv')
X_test = df_test[['Air temperature [K]', 'Process temperature [K]', ...]]
predictions = model.predict(X_test)  # Predict failures
prediction_probs = model.predict_proba(X_test)  # Confidence scores

# Create submission
submission = pd.DataFrame({
    'id': df_test['id'],
    'Machine_failure': prediction_probs[:, 1]  # Failure probability
})
submission.to_csv('submission.csv', index=False)
```

### Key Differences

| Aspect | Train | Test |
|--------|-------|------|
| **Purpose** | Model training & validation | Production predictions |
| **Rows** | 100 (sample) / 10,000+ (full) | 50 (sample) / 2,500+ (full) |
| **Target** | ✅ Included (`Machine failure`) | ❌ NOT included |
| **Failure Modes** | ✅ Included (TWF, HDF, PWF, OSF, RNF) | ❌ NOT included |
| **Use** | `model.fit(X_train, y_train)` | `model.predict(X_test)` |
| **Expected Output** | Model weights learned | Predictions only |

---

### Class Distribution

```
Machine Failure = 0 (No Failure):  ~98% of data
Machine Failure = 1 (Failure):     ~2% of data
```

*Note: This is an imbalanced classification problem. Always track precision, recall, F1, and ROC-AUC—not just accuracy.*

### Feature Ranges (Sample Data)

| Feature | Min | Max | Mean | Std Dev |
|---------|-----|-----|------|---------|
| Air Temperature [K] | 298.0 | 298.4 | 298.15 | 0.13 |
| Process Temperature [K] | 308.4 | 309.3 | 308.83 | 0.28 |
| Rotational Speed [rpm] | 1200 | 1610 | 1475 | 89.2 |
| Torque [Nm] | 38.9 | 72.4 | 49.8 | 7.6 |
| Tool Wear [min] | 0 | 199 | 99.5 | 57.9 |

---

## Example Rows

### Healthy Machine (No Failure)
```
id=1, Product_ID=M14860, Type=M, Air_temp=298.1K, Process_temp=308.6K
Rotational_speed=1551rpm, Torque=42.8Nm, Tool_wear=0min
→ Machine_failure=0 (all failure modes = 0)
```

### Failed Machine (Tool Wear Failure)
```
id=7, Product_ID=M14862, Type=M, Air_temp=298.1K, Process_temp=308.5K
Rotational_speed=1552rpm, Torque=48.5Nm, Tool_wear=13min
→ Machine_failure=1, TWF=1, HDF=0, PWF=0, OSF=0, RNF=0
(Failure caused by tool wear)
```

### Failed Machine (Heat Dissipation Failure)
```
id=11, Product_ID=H21656, Type=H, Air_temp=298.1K, Process_temp=309.2K
Rotational_speed=1380rpm, Torque=55.8Nm, Tool_wear=21min
→ Machine_failure=1, TWF=0, HDF=1, PWF=0, OSF=0, RNF=0
(Failure caused by heat dissipation issue)
```

---

## How to Use This Dataset

### For ML Model Development

1. **Load the data:**
   ```python
   import pandas as pd
   df = pd.read_csv('docs/train.csv')
   # 100 rows (sample) or 10,000+ (full)
   ```

2. **Explore the data:**
   ```python
   df.info()  # Check data types
   df.describe()  # Statistical summary
   df['Machine failure'].value_counts()  # Check class distribution (~98% vs ~2%)
   ```

3. **Prepare for modeling:**
   ```python
   # Separate features and target
   X = df[['Air temperature [K]', 'Process temperature [K]', 
           'Rotational speed [rpm]', 'Torque [Nm]', 'Tool wear [min]']]
   y = df['Machine failure']
   
   # Handle class imbalance with weighted loss
   from sklearn.utils.class_weight import compute_class_weight
   class_weights = compute_class_weight('balanced', 
                                        classes=np.unique(y), 
                                        y=y)
   ```

4. **Train XGBoost with class weights:**
   ```python
   import xgboost as xgb
   model = xgb.XGBClassifier(scale_pos_weight=50, random_state=42)
   # scale_pos_weight accounts for ~98/2 imbalance
   model.fit(X, y)
   ```

### For Model Performance Monitoring (Story 10)

This dataset is the **training foundation** for Story 10 (Model Performance Monitoring):

- **In Production:** New sensor readings arrive continuously
- **Predictions:** Model applies to new data using same 5 features
- **Ground Truth:** Actual machine failures recorded (with delay)
- **Monitoring:** Track model accuracy, drift, concept changes
- **Action:** Retrain when performance drops >5%

---

## Important Considerations

### Class Imbalance Problem

The ~2% failure rate means:
- **Naive Accuracy:** Always predicting "no failure" gets ~98% accuracy
- **Better Metric:** Use precision, recall, F1, ROC-AUC instead
- **Training:** Use class weights (XGBoost: `scale_pos_weight`) or SMOTE
- **Monitoring:** Story 10 tracks these metrics across time

### Data Characteristics

1. **Continuous Sensors:** All input features are continuous (float values)
2. **Categorical Type:** Machine type (M, L, H) may need encoding
3. **No Missing Values:** Dataset is clean (from Kaggle competition)
4. **Feature Ranges:** Sensors operate in normal ranges (no outliers in sample)
5. **Feature Engineering:** Consider interactions (Torque × Speed, Temp ratios)

### Production Implications

- **Concept Drift:** Production data distribution may differ from training
- **Label Delay:** Ground truth (actual failures) may arrive hours/days later
- **Retraining:** Trigger when ROC-AUC drops >5% or drift detected (Story 10)
- **Explainability:** Use SHAP to explain predictions to maintenance teams
- **Monitoring:** Real-time accuracy tracking essential for predictive maintenance

---

## Related Files

- **Full dataset:** https://github.com/JMViJi/Binary-Classification-of-Machine-Failures
- **Story 10 spec:** [`docs/implementation-plans/Model-Performance-Monitoring.md`](./implementation-plans/Model-Performance-Monitoring.md)
- **Data reference:** [`docs/DATA-SOURCE-REFERENCE.md`](./DATA-SOURCE-REFERENCE.md)
- **Technical description:** [`docs/technical-description/README.md`](./technical-description/README.md)

---

## FAQ

**Q: Why is the dataset imbalanced (2% failures)?**  
A: Real-world predictive maintenance is preventive—machines rarely fail because they're maintained. This reflects reality.

**Q: Should I use accuracy to evaluate the model?**  
A: No. Use precision, recall, F1, and ROC-AUC. Accuracy is misleading for imbalanced data.

**Q: How do I handle the class imbalance?**  
A: Use `scale_pos_weight` in XGBoost (or `class_weight` in sklearn), or apply SMOTE to training data.

**Q: What do the failure modes represent?**  
A: Different causes of failure (tool wear, heat, power, overstrain, random). Important for understanding root causes and maintenance decisions.

**Q: How often should I retrain the model?**  
A: When ROC-AUC drops >5% from baseline (Story 10 detects this automatically).

---

**Last Updated:** February 8, 2026  
**Status:** Sample dataset created for reference  
**Full dataset size:** 6.85 MB (available at GitHub)
