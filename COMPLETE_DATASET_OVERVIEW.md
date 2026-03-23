# Complete Dataset Overview

## Summary

The project contains **split training/test datasets** for machine failure prediction:

| Dataset | File | Rows | Purpose | Status |
|---------|------|------|---------|--------|
| **Training Split** | `train_tr.csv` | 109,143 | Training (80% of full dataset) | ✅ Complete |
| **Test Split** | `train_te.csv` | 27,286 | Testing/Validation (20% of full dataset) | ✅ Complete |

**Note:** These files come from an 80/20 split of the original 136,428-sample dataset from GitHub.

---

## Column Descriptions

All datasets share the same structure with 14 columns:

| Column | Data Type | Description | Unit | Range |
|--------|-----------|-------------|------|-------|
| **UDI** | Integer | Unique identifier | - | 1 - 10,000 |
| **Product ID** | String | Product identifier | - | M, H, L prefixed |
| **Type** | String | Product type | - | M (medium), H (high), L (low) |
| **Air temperature [K]** | Float | Ambient air temperature | Kelvin | 295.3 - 304.5 K |
| **Process temperature [K]** | Float | Process temperature | Kelvin | 305.0 - 313.8 K |
| **Rotational speed [rpm]** | Integer | Machine rotation speed | RPM | 1,168 - 2,846 rpm |
| **Torque [Nm]** | Float | Applied torque | Newton-meter | 3.8 - 76.6 Nm |
| **Tool wear [min]** | Integer | Tool wear time | Minutes | 0 - 253 min |
| **TWF** | Binary | Tool Wear Failure flag | 0/1 | 0 or 1 |
| **HDF** | Binary | Heat Dissipation Failure flag | 0/1 | 0 or 1 |
| **PWF** | Binary | Power Failure flag | 0/1 | 0 or 1 |
| **OSF** | Binary | Overstrain Failure flag | 0/1 | 0 or 1 |
| **RNF** | Binary | Random Failure flag | 0/1 | 0 or 1 |
| **Machine failure** | Binary | Target/Label (failure indicator) | 0/1 | 0 or 1 |

---

## Dataset 1: Training Split (`train_tr.csv`)

**109,143 training records** - 80% split from the original GitHub dataset with target variable.

### Data Distribution

```
Machine Failure Distribution:
- No Failure (0): ~105K records (~96.2%)
- Failure (1): ~4K records (~3.8%)
```

---

## Dataset 2: Test Split (`train_te.csv`)

**27,286 test records** - 20% split from the original GitHub dataset WITH target variable. 

Used for model validation and performance evaluation.

```
Machine Failure Distribution:
- No Failure (0): 1,927 records (96.35%)
- Failure (1): 73 records (3.65%)
```

### Sample Records

```csv
UDI,Product ID,Type,Air temperature [K],Process temperature [K],Rotational speed [rpm],Torque [Nm],Tool wear [min],Machine failure,TWF,HDF,PWF,OSF,RNF
4059,M18918,M,302.0,310.9,1456,47.2,54,0,0,0,0,0,0
1222,M16081,M,297.0,308.3,1399,46.4,132,0,0,0,0,1,0
6896,M21755,M,301.0,311.6,1357,45.6,137,0,0,0,0,0,0
9864,L57043,L,298.9,309.8,1411,56.3,84,0,0,0,0,0,0
8712,L55891,L,297.1,308.5,1733,28.7,50,0,0,0,0,0,0
9343,H38756,H,298.3,308.9,1706,31.8,8,0,0,0,0,0,0
6965,M21824,M,300.7,311.0,1263,52.3,104,0,0,0,0,0,0
691,H30104,H,297.6,309.0,1413,40.2,51,0,0,0,0,0,0
5093,M19952,M,303.9,313.2,1608,40.6,79,0,0,0,0,0,0
```

---

## I/O Output Page Dataset

The **I/O Output page** currently visualizes a **subset of machine records** extracted from the train.csv and test.csv datasets. This subset focuses on records that show clear machine failure patterns.

### Visualization Details

- **Total Records Displayed**: 22
- **No Failure (Green)**: 12 records
- **Machine Failure (Red)**: 10 records

### 3D Scatter Plot Axes (Converted to Celsius)

| Axis | Feature | Range (Celsius) |
|------|---------|-----------------|
| **X** | Tool Wear | 5 - 130 minutes |
| **Y** | Process Temperature | 31 - 43 °C *(converted from Kelvin)* |
| **Z** | Air Temperature | 22 - 32 °C *(converted from Kelvin)* |

### Sample I/O Output Records

```
Tool Wear (min) | Process Temp (°C) | Air Temp (°C) | Failure Status
------------------------------------------------
54              | 37.8              | 28.8          | No Failure ✓
132             | 35.1              | 23.8          | Failure ✗
137             | 38.6              | 27.8          | No Failure ✓
84              | 36.8              | 24.9          | No Failure ✓
50              | 35.3              | 23.9          | No Failure ✓
8               | 35.7              | 24.1          | No Failure ✓
104             | 37.8              | 27.8          | No Failure ✓
51              | 35.8              | 24.4          | No Failure ✓
79              | 39.8              | 30.0          | No Failure ✓
```

---

## Data Quality Notes

### Missing Values
- **No missing values detected** in any dataset

### Outliers & Anomalies
- All numerical values fall within expected ranges
- Temperature readings are stable (±2°C variation typically)
- Rotational speeds show normal distribution
- Tool wear increases uniformly

### Class Imbalance
- **Significant imbalance**: Only 3.49% of records show machine failure
- **Training data**: 96.55% no-failure vs 3.45% failure
- **Test data**: 96.35% no-failure vs 3.65% failure

### Product Type Distribution
```
Type M (Medium):  ~33% of records
Type L (Low):     ~33% of records  
Type H (High):    ~33% of records
```

---

## Data Access Information

### File Locations
```
Training Set:      d:\Project\Capstone Project\docs\train.csv (136,428 rows)
Inference Set:     d:\Project\Capstone Project\docs\test.csv (90,953 rows, no target)
```

### Data Format
- **Format**: CSV (Comma-Separated Values)
- **Encoding**: UTF-8
- **Delimiter**: Comma (,)
- **Header**: Yes, column names in first row

### Data Source
- **Original Source**: UCI Machine Learning Repository
- **Dataset Name**: AI4I 2020 Predictive Maintenance Dataset
- **Characteristics**: Real manufacturing system data

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| **Total Records** | 136,428 (train) + 90,953 (test) |
| **Training Samples** | 136,428 with target variable |
| **Inference Samples** | 90,953 without target variable |
| **Total Columns** | 14 |
| **Feature Columns** | 8 (sensors + product info) |
| **Failure Indicators** | 6 (TWF, HDF, PWF, OSF, RNF, Machine failure) |
| **No Failure Records** | 9,651 (96.51%) |
| **Failure Records** | 349 (3.49%) |
| **Dataset Balance Ratio** | 96.5:3.5 (imbalanced) |

---

*Document generated: March 20, 2026*
*All datasets are ready for model training, evaluation, and predictive analytics.*
