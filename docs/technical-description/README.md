# Technical Description: Predictive Maintenance Platform

## 1. Application Overview

**Purpose:** A comprehensive predictive maintenance platform that uses machine learning to forecast equipment failures before they occur, enabling proactive maintenance scheduling and minimizing unplanned downtime.

**Architecture Pattern:** Next.js App Router with Server Components for scalable, real-time monitoring of industrial equipment

**Key Capabilities:**
- Real-time sensor data ingestion and visualization
- AI-powered failure risk prediction with explainable AI (SHAP)
- Automated alerting and notification system
- Preventive maintenance task management
- Historical analysis and trend identification
- Model performance monitoring and retraining workflows
- Fleet-wide health dashboard and KPI tracking
- Compliance-ready audit trails and reporting

---

## 2. Technology Stack

| Layer | Technology | Rationale |
|-------|----------|-----------|
| **Frontend Framework** | Next.js 15 (App Router) | Server components for real-time data updates, built-in API routes, excellent performance |
| **Language** | TypeScript | Type safety prevents runtime errors in data-intensive operations |
| **Styling** | Tailwind CSS + shadcn/ui | Industrial design system, responsive dashboards, premium aesthetics |
| **State Management** | React Server Components + React Context | Minimal client-side state, server-driven real-time updates |
| **Database (Transactional)** | Supabase (PostgreSQL) | Real-time subscriptions for sensor data, built-in auth, vector search for anomaly detection |
| **Time-Series Database** | TimescaleDB (PostgreSQL extension) | Optimized for high-frequency sensor data (1000+ ops/sec), compression, retention policies |
| **Graph Database** | Neo4j / Memgraph | Equipment relationships, maintenance history chains, anomaly propagation |
| **Cache Layer** | Redis | Real-time metrics aggregation, prediction cache, session management |
| **Message Queue** | Bull/Redis Queues | Asynchronous prediction jobs, alert distribution, data ETL pipelines |
| **ML Model Runtime** | TensorFlow.js + Python (FastAPI) | Browser-based feature engineering, server-side batch predictions |
| **Model Training** | XGBoost / LightGBM / CatBoost | Gradient boosting handles tabular sensor data, class imbalance weighting |
| **Explainability** | SHAP (Python backend) | Feature importance, model interpretation for compliance |
| **Real-time Communication** | WebSocket / Server-Sent Events | Live updates for predictions and alerts |
| **Authentication** | Supabase Auth + OAuth2 | Role-based access control (Manager, Technician, Analyst, Admin) |
| **Monitoring** | Prometheus + Grafana | Infrastructure metrics, model performance tracking, alerting |
| **API Documentation** | Swagger/OpenAPI | Auto-generated API docs for integration partners |

---

## 2.5 ML Dataset & Model Training

**Dataset Source:** [Binary Classification of Machine Failures](https://github.com/JMViJi/Binary-Classification-of-Machine-Failures)  
**Competition:** Kaggle Playground Series S3E17

### Training Data Features

Machine sensor readings captured at regular intervals:

| Feature | Unit | Range | Notes |
|---------|------|-------|-------|
| Air Temperature | Kelvin | ~295-310K | Ambient conditions |
| Process Temperature | Kelvin | ~305-320K | Operational temperature |
| Rotational Speed | RPM | 1200-2886 | Higher = more stress & wear |
| Torque | Nm | 3.8-76.6 | Load indicator |
| Tool Wear | Minutes | 0-255 | Maintenance indicator |

### Failure Modes (Multi-Label)

Targets tracked during model monitoring:

- **TWF (Tool Wear Failure):** Caused by accumulated tool wear exceeding threshold
- **HDF (Heat Dissipation Failure):** Machine unable to dissipate operational heat
- **PWF (Power Failure):** Electrical/power supply malfunctions  
- **OSF (Overstrain Failure):** Machine operating beyond safe stress limits
- **RNF (Random Failure):** Unplanned, unspecified failures
- **Overall:** Binary target (0 = no failure, 1 = any failure)

### Class Imbalance & Monitoring Implications

- **Failure Rate:** ~2% of data points represent failures
- **Challenge:** Imbalanced classification requires weighted loss functions (XGBoost), SMOTE, or threshold optimization
- **Monitoring:** Focus on precision, recall, F1, ROC-AUC—not raw accuracy
- **Real-World Gap:** Production distribution may differ from training (concept drift)

### Model Architecture

**Algorithm:** XGBoost / LightGBM (gradient boosting for tabular sensor data)

**Key Characteristics:**
- Handles non-linear sensor relationships
- Native feature importance for explainability
- Fast inference (~5ms per prediction)
- Supports sample weighting for class imbalance

---

## 3. Project Folder Structure

```
predictive-maintenance/
├── app/                                 # Next.js 15 App Router
│   ├── (auth)/                          # Authentication routes
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/                     # Main application routes
│   │   ├── page.tsx                     # Dashboard home (fleet overview)
│   │   ├── machines/
│   │   │   ├── page.tsx                 # Machines list view
│   │   │   ├── [machineId]/
│   │   │   │   ├── page.tsx             # Machine detail/monitoring
│   │   │   │   ├── history/
│   │   │   │   │   └── page.tsx         # Historical data & trends
│   │   │   │   └── maintenance/
│   │   │   │       └── page.tsx         # Maintenance history logs
│   │   │   └── comparison/
│   │   │       └── page.tsx             # Multi-machine comparison
│   │   ├── analytics/
│   │   │   ├── page.tsx                 # Dashboard analytics
│   │   │   ├── correlation/
│   │   │   │   └── page.tsx             # Feature correlation heatmaps
│   │   │   └── model-performance/
│   │   │       └── page.tsx             # Model metrics & ROC curves
│   │   ├── alerts/
│   │   │   ├── page.tsx                 # Alerts & notifications
│   │   │   └── [alertId]/
│   │   │       └── page.tsx             # Alert details & history
│   │   ├── maintenance/
│   │   │   ├── page.tsx                 # Task management
│   │   │   ├── create/
│   │   │   │   └── page.tsx             # Create new task
│   │   │   └── [taskId]/
│   │   │       └── page.tsx             # Task details & updates
│   │   ├── settings/
│   │   │   ├── page.tsx                 # Notification thresholds, alert config
│   │   │   ├── models/
│   │   │   │   └── page.tsx             # Model management & retraining
│   │   │   └── integrations/
│   │   │       └── page.tsx             # Third-party integrations
│   │   └── layout.tsx                   # Dashboard layout (Header, Sidebar, Footer)
│   ├── api/                             # API routes
│   │   ├── machines/
│   │   │   ├── route.ts                 # GET all machines, POST create
│   │   │   └── [machineId]/
│   │   │       ├── route.ts             # GET/PUT/DELETE machine
│   │   │       ├── metrics/
│   │   │       │   └── route.ts         # Stream live sensor data
│   │   │       └── predictions/
│   │   │           └── route.ts         # Get failure predictions
│   │   ├── predictions/
│   │   │   ├── route.ts                 # Batch prediction endpoint
│   │   │   └── explain/
│   │   │       └── route.ts             # SHAP explanations
│   │   ├── alerts/
│   │   │   └── route.ts                 # Create/list alerts
│   │   ├── analytics/
│   │   │   ├── correlation/
│   │   │   │   └── route.ts             # Correlation heatmaps
│   │   │   ├── trends/
│   │   │   │   └── route.ts             # Historical trend data
│   │   │   └── model-performance/
│   │   │       └── route.ts             # ROC-AUC, accuracy metrics
│   │   ├── maintenance/
│   │   │   └── route.ts                 # Task CRUD operations
│   │   ├── data-export/
│   │   │   └── route.ts                 # Export to CSV/JSON
│   │   └── webhooks/
│   │       ├── sensor-intake/
│   │       │   └── route.ts             # Webhook for IoT sensor data
│   │       └── model-training/
│   │           └── route.ts             # Trigger retraining
│   ├── layout.tsx                       # Root layout
│   ├── globals.css                      # Global styles & Tailwind config
│   └── error.tsx                        # Error boundary
├── components/
│   ├── ui/                              # Base UI components (premium design)
│   │   ├── Button.tsx                   # Interactive buttons
│   │   ├── Card.tsx                     # Card containers
│   │   ├── Input.tsx                    # Form inputs
│   │   ├── Select.tsx                   # Dropdown menus
│   │   ├── Badge.tsx                    # Status indicators (Risk levels)
│   │   ├── Alert.tsx                    # Notification alerts
│   │   ├── Tooltip.tsx                  # Hover informational tooltips
│   │   ├── Modal.tsx                    # Modal dialogs
│   │   └── Spinner.tsx                  # Loading indicators
│   ├── layout/
│   │   ├── Header.tsx                   # Top navigation bar
│   │   ├── Sidebar.tsx                  # Left navigation menu
│   │   ├── Footer.tsx                   # Page footer
│   │   ├── Navigation.tsx               # Navigation links
│   │   └── UserMenu.tsx                 # User profile dropdown
│   └── features/                        # Feature-specific components
│       ├── Dashboard/
│       │   ├── FleetOverview.tsx        # Fleet health summary
│       │   ├── HighRiskMachines.tsx     # Top 10 at-risk machines
│       │   ├── MaintenanceMetrics.tsx   # Task completion KPIs
│       │   └── RiskDistribution.tsx     # Risk level histogram
│       ├── MachineMonitoring/
│       │   ├── SensorGauge.tsx          # Real-time sensor displays
│       │   ├── TrendChart.tsx           # Historical trend line chart
│       │   ├── FailureRiskCard.tsx      # Risk percentage & status
│       │   ├── FeatureImportance.tsx    # SHAP bar chart
│       │   └── AnomalyIndicator.tsx     # Highlight unusual readings
│       ├── AlertsPanel/
│       │   ├── AlertList.tsx            # Scrollable alerts list
│       │   ├── AlertDetail.tsx          # Expanded alert view
│       │   └── NotificationPrefs.tsx    # Alert threshold settings
│       ├── DataAnalytics/
│       │   ├── CorrelationHeatmap.tsx   # Sensor correlations
│       │   ├── FailurePatterns.tsx      # Historical analysis
│       │   └── ROCCurve.tsx             # Model performance plot
│       ├── MaintenanceTasks/
│       │   ├── TaskBoard.tsx            # Kanban board (To-Do, In Progress, Done)
│       │   ├── TaskCard.tsx             # Individual task display
│       │   ├── TaskForm.tsx             # Create/edit task form
│       │   └── TaskTimeline.tsx         # Task history timeline
│       ├── Comparison/
│       │   ├── MachineComparison.tsx    # Side-by-side metrics
│       │   └── ComparisonChart.tsx      # Multi-series trend overlay
│       └── Explainability/
│           ├── SHAPSummary.tsx          # SHAP feature importance
│           ├── DecisionPlot.tsx         # How model reached prediction
│           └── FeatureExplainer.tsx     # Individual feature explanation
├── hooks/                               # Custom React hooks
│   ├── useMachines.ts                   # Fetch & cache machines data
│   ├── useRealTimeSensors.ts            # WebSocket subscription to sensor data
│   ├── usePredictions.ts                # Fetch & cache ML predictions
│   ├── useLiveAlerts.ts                 # Subscribe to alert events
│   ├── useMaintenanceTasks.ts           # CRUD operations for tasks
│   ├── useAnalytics.ts                  # Fetch analytics data
│   ├── useTheme.ts                      # Dark/light mode toggle
│   └── useNotifications.ts              # Toast/notification system
├── lib/                                 # Utilities & helpers
│   ├── utils.ts                         # General utility functions
│   ├── constants.ts                     # Application-wide constants
│   ├── supabase/
│   │   ├── client.ts                    # Supabase client (browser)
│   │   ├── server.ts                    # Supabase client (server)
│   │   └── admin.ts                     # Admin operations
│   ├── timeseries/
│   │   └── db.ts                        # TimescaleDB connection & queries
│   ├── graph/
│   │   └── client.ts                    # Neo4j graph database client
│   ├── redis/
│   │   └── client.ts                    # Redis cache client
│   ├── ml/
│   │   ├── predictions.ts               # Interface to ML backend
│   │   ├── shap-client.ts               # SHAP explanation requests
│   │   └── model-info.ts                # Model metadata & performance
│   ├── alerts/
│   │   ├── evaluator.ts                 # Threshold evaluation logic
│   │   └── notifier.ts                  # Multi-channel notifications
│   ├── validation/
│   │   ├── schemas.ts                   # Zod/Joi validation schemas
│   │   └── sanitize.ts                  # Input sanitization
│   ├── auth/
│   │   ├── rbac.ts                      # Role-based access control
│   │   └── middleware.ts                # Auth verification middleware
│   └── formatters/
│       ├── sensors.ts                   # Format sensor readings
│       ├── predictions.ts               # Format prediction outputs
│       └── dates.ts                     # Date/time formatting
├── services/                            # Business logic layer
│   ├── machineService.ts                # Machine CRUD & relationships
│   ├── sensorService.ts                 # Sensor data ingestion & aggregation
│   ├── predictionService.ts             # Call ML backend, cache results
│   ├── alertService.ts                  # Evaluation & dispatch logic
│   ├── maintenanceService.ts            # Task management
│   ├── analyticsService.ts              # Analytics calculations & queries
│   ├── reportService.ts                 # PDF/Excel report generation
│   └── integrationService.ts            # Third-party API calls
├── types/                               # TypeScript definitions
│   ├── machine.ts                       # Machine data models
│   ├── sensor.ts                        # Sensor & metric types
│   ├── prediction.ts                    # ML prediction structures
│   ├── alert.ts                         # Alert types
│   ├── maintenance.ts                   # Task & workflow types
│   ├── analytics.ts                     # Analytics/report types
│   ├── api.ts                           # API request/response shapes
│   ├── user.ts                          # User & auth types
│   └── errors.ts                        # Custom error types
├── constants/
│   ├── index.ts                         # Global constants
│   ├── thresholds.ts                    # Default alert thresholds
│   ├── colors.ts                        # Design system colors
│   └── endpoints.ts                     # API endpoint URLs
├── docs/
│   ├── stories/
│   │   └── predictive-maintenance.stories.md
│   ├── technical-description/
│   │   └── README.md                    # This file
│   ├── architecture/
│   │   ├── data-flow.md
│   │   ├── ml-pipeline.md
│   │   └── deployment.md
│   ├── api-reference/
│   │   └── openapi.yaml                 # OpenAPI specification
│   └── guides/
│       ├── setup.md
│       ├── configuration.md
│       └── troubleshooting.md
├── .github/
│   ├── workflows/
│   │   ├── test.yml
│   │   ├── deploy.yml
│   │   └── model-monitoring.yml
│   ├── instructions/
│   │   ├── Architecture & Design Guidelines.instructions.md
│   │   ├── Code Quality Standards.instructions.md
│   │   └── Documentation Rules.instructions.md
│   └── prompts/
│       └── generate-technical-description.prompt.md
├── public/
│   ├── brand/
│   │   ├── logo-dark.svg
│   │   ├── logo-light.svg
│   │   └── favicon.ico
│   ├── icons/
│   │   ├── sensor.svg
│   │   ├── alert.svg
│   │   ├── checkmark.svg
│   │   └── warning.svg
│   └── images/
│       └── illustrations/
├── scripts/
│   ├── seed-data.ts                     # Populate demo data
│   ├── train-model.py                   # Model training script
│   ├── evaluate-model.py                # Model evaluation
│   └── migrate-db.ts                    # Database migrations
├── .env.example                         # Environment variables template
├── .env.local                           # Local environment (git-ignored)
├── package.json                         # Dependencies & scripts
├── tsconfig.json                        # TypeScript configuration
├── tailwind.config.ts                   # Tailwind CSS setup
├── next.config.ts                       # Next.js configuration
├── vitest.config.ts                     # Testing configuration
├── README.md                            # Project overview
├── CONTRIBUTING.md                      # Contribution guidelines
└── LICENSE                              # License file
```

---

## 4. Data Models

### Machine

```typescript
/**
 * Represents an industrial machine or equipment unit
 * @interface Machine
 * @category Data Models
 */
interface Machine {
  id: string;                           // UUID: mch_xxxxx
  name: string;                         // Display name
  machineType: 'TYPE_L' | 'TYPE_M' | 'TYPE_H'; // Operating type
  location: string;                     // Physical location/facility
  installDate: Date;                    // Installation timestamp
  status: 'ACTIVE' | 'MAINTENANCE' | 'RETIRED'; // Current status
  lastPredictionAt?: Date;              // Latest prediction timestamp
  failureRiskScore: number;             // 0-100 (percentage)
  failureRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; // Categorical
  modelVersion: string;                 // Version of prediction model used
  alerts: Alert[];                      // Active alerts
  lastMaintenanceDate?: Date;           // Preventive maintenance date
  operatingHours: number;               // Cumulative uptime
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Real-time sensor readings from a machine
 * @interface SensorReading
 */
interface SensorReading {
  id: string;                           // UUID: srd_xxxxx
  machineId: string;                    // FK to Machine
  timestamp: Date;                      // Data collection time
  torque: number;                       // Torque [Nm]
  rotationalSpeed: number;              // Rotational speed [RPM]
  toolWear: number;                     // Tool wear [min]
  airTemperature: number;               // Air temperature [K]
  processTemperature: number;           // Process temperature [K]
  
  // Derived features (calculated server-side)
  power?: number;                       // Power = Torque × Rotational Speed
  temperatureDifference?: number;       // Process - Air temperature
  wearRate?: number;                    // Tool wear / Torque
  totalFailureIndicators?: number;      // Sum of TWF, HDF, PWF, OSF, RNF
  
  // Failure indicators (binary flags)
  twf: boolean;                         // Tool Wear Failure
  hdf: boolean;                         // Heat Dissipation Failure
  pwf: boolean;                         // Power Failure
  osf: boolean;                         // Overstrain Failure
  rnf: boolean;                         // Random Failures
}

/**
 * ML model prediction for a machine
 * @interface PredictionResult
 */
interface PredictionResult {
  id: string;                           // UUID: pred_xxxxx
  machineId: string;                    // FK to Machine
  modelId: string;                      // Model identifier & version
  predictionTimestamp: Date;            // When prediction was made
  failureProbability: number;           // 0-1 (decimal)
  confidence: number;                   // 0-1 (model confidence)
  
  // Feature importance (SHAP values)
  featureImportance: {
    power: number;
    temperatureDifference: number;
    wearRate: number;
    totalFailureIndicators: number;
    rotationalSpeed: number;
    toolWear: number;
    [key: string]: number;              // Top N features
  };
  
  // Top contributing factors for explanation
  topFactors: Array<{
    feature: string;
    value: number;
    contribution: number;               // SHAP value
    threshold?: number;                 // Alert threshold
  }>;
  
  reasoning: string;                    // Plain English explanation
  createdAt: Date;
}

/**
 * Alert triggered by risk threshold or anomaly
 * @interface Alert
 */
interface Alert {
  id: string;                           // UUID: alrt_xxxxx
  machineId: string;                    // FK to Machine
  severity: 'INFO' | 'WARNING' | 'CRITICAL'; // Alert level
  alertType: 'RISK_THRESHOLD' | 'ANOMALY' | 'PATTERN' | 'MAINTENANCE_DUE';
  riskScore: number;                    // Current risk score at alert time
  detectedAt: Date;                     // When issue was detected
  resolvedAt?: Date;                    // When alert was cleared
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'; // Alert state
  
  message: string;                      // User-friendly alert message
  recommendations: string[];            // Suggested actions
  
  notifiedUsers: Array<{
    userId: string;
    method: 'EMAIL' | 'SMS' | 'IN_APP'; // Notification channel
    sentAt: Date;
  }>;
  
  createdAt: Date;
}

/**
 * Preventive maintenance task
 * @interface MaintenanceTask
 */
interface MaintenanceTask {
  id: string;                           // UUID: task_xxxxx
  machineId: string;                    // FK to Machine
  triggeredBy: 'ALERT' | 'SCHEDULE' | 'MANUAL'; // What caused task creation
  alertId?: string;                     // FK to Alert (if applicable)
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  
  title: string;                        // Task name
  description: string;                  // Detailed instructions
  type: 'INSPECTION' | 'REPLACEMENT' | 'ADJUSTMENT' | 'LUBRICATION' | 'CALIBRATION';
  
  assignedTo?: string;                  // Technician user ID
  scheduledStart?: Date;
  scheduledEnd?: Date;
  actuaStart?: Date;
  actualEnd?: Date;
  
  estimatedDuration: number;            // Minutes
  actualDuration?: number;              // Minutes (if completed)
  
  notes?: string;                       // Completion notes
  failure?: boolean;                    // Did machine fail? (post-mortem)
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Model performance metrics
 * @interface ModelMetrics
 */
interface ModelMetrics {
  id: string;
  modelVersion: string;
  evaluationDate: Date;
  
  // Classification metrics
  rocAuc: number;                       // ROC-AUC score
  precision: number;                    // True positives / (TP + FP)
  recall: number;                       // True positives / (TP + FN)
  f1Score: number;                      // Harmonic mean of precision & recall
  accuracy: number;                     // Correct predictions / total
  
  // Imbalance handling
  classBalance: {
    failureRate: number;                // % of failures in training data
    scalePosWeight: number;             // Class weight for XGBoost
  };
  
  // Feature statistics
  featureCount: number;
  topFeatures: string[];
  
  trainingDate: Date;
  trainingDataSize: number;
  crossValidationScheme: 'STRATIFIED_5_FOLD';
}

/**
 * User profile with role-based permissions
 * @interface User
 */
interface User {
  id: string;                           // UUID: usr_xxxxx
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'TECHNICIAN' | 'ANALYST'; // Permission level
  department: string;                   // Operations, Maintenance, Engineering
  
  // Notification preferences
  notificationPreferences: {
    criticalAlerts: boolean;
    weeklyReports: boolean;
    modelUpdates: boolean;
    channels: ('EMAIL' | 'SMS' | 'IN_APP')[];
  };
  
  // Assigned machines
  assignedMachines?: string[];          // Machine IDs for technicians
  
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
}

/**
 * API response wrapper
 * @interface ApiResponse
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;                       // Machine-readable error code
    message: string;                    // Human-readable message
    details?: Record<string, unknown>;  // Additional context
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    timestamp: Date;
  };
}
```

---

## 5. API Endpoint Specification

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | User login (email + password) |
| `POST` | `/api/auth/logout` | User logout |
| `POST` | `/api/auth/refresh` | Refresh session token |
| `POST` | `/api/auth/forgot-password` | Initiate password reset |

### Machines

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/machines` | List all machines (with filters) |
| `GET` | `/api/machines/:machineId` | Get machine detail |
| `POST` | `/api/machines` | Register new machine |
| `PUT` | `/api/machines/:machineId` | Update machine metadata |
| `DELETE` | `/api/machines/:machineId` | Retire machine |
| `GET` | `/api/machines/:machineId/metrics` | Stream real-time sensor data (WebSocket/SSE) |

### Predictions & Failures

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/predictions?machineId=xxx` | Get latest prediction for machine(s) |
| `GET` | `/api/predictions/:predictionId` | Get specific prediction |
| `POST` | `/api/predictions/batch` | Batch predict for multiple machines |
| `POST` | `/api/predictions/:predictionId/explain` | Get SHAP explanation |
| `GET` | `/api/predictions/history/:machineId` | Historical predictions over time |

### Alerts & Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/alerts` | List alerts (with filters for status, severity) |
| `GET` | `/api/alerts/:alertId` | Get alert details |
| `POST` | `/api/alerts/:alertId/acknowledge` | Mark alert as acknowledged |
| `POST` | `/api/alerts/:alertId/resolve` | Close alert |
| `PUT` | `/api/alerts/settings` | Update alert thresholds for user |
| `GET` | `/api/alerts/real-time` | Subscribe to live alerts (WebSocket) |

### Analytics & Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics/correlation?timeRange=7d` | Sensor correlation heatmap data |
| `GET` | `/api/analytics/trends/:machineId` | Historical trend data |
| `GET` | `/api/analytics/failures/summary` | Fleet failure statistics |
| `GET` | `/api/analytics/model-performance` | ROC curves, accuracy metrics |
| `GET` | `/api/analytics/export?format=csv` | Export data for external analysis |

### Maintenance Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/maintenance` | List maintenance tasks |
| `POST` | `/api/maintenance` | Create new task |
| `GET` | `/api/maintenance/:taskId` | Get task details |
| `PUT` | `/api/maintenance/:taskId` | Update task (assign, reschedule, complete) |
| `DELETE` | `/api/maintenance/:taskId` | Cancel task |
| `GET` | `/api/maintenance/schedule` | View maintenance calendar |

### Data Ingestion (IoT/External Systems)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/webhooks/sensor-intake` | Accept sensor data from IoT devices |
| `POST` | `/api/webhooks/import-data` | Bulk import historical data |
| `GET` | `/api/webhooks/status` | Health check for integrations |

### Model Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/models` | List available models |
| `GET` | `/api/models/current` | Get active production model |
| `POST` | `/api/models/retrain` | Trigger model retraining |
| `GET` | `/api/models/:modelId/metrics` | Model performance metrics |
| `POST` | `/api/models/:modelId/promote` | Promote model to production |

### Example Request/Response

**Request: Get Machine Predictions**
```bash
GET /api/predictions?machineId=mch_abc123
Authorization: Bearer {token}
Accept: application/json
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "pred_xyz789",
    "machineId": "mch_abc123",
    "modelId": "model_v2.1",
    "predictionTimestamp": "2025-02-08T10:30:00Z",
    "failureProbability": 0.78,
    "confidence": 0.92,
    "featureImportance": {
      "power": 0.34,
      "temperatureDifference": 0.28,
      "wearRate": 0.21,
      "totalFailureIndicators": 0.12,
      "rotationalSpeed": 0.05
    },
    "topFactors": [
      {
        "feature": "power",
        "value": 8500,
        "contribution": 0.34,
        "threshold": 7000
      },
      {
        "feature": "temperatureDifference",
        "value": 45,
        "contribution": 0.28,
        "threshold": 40
      }
    ],
    "reasoning": "Failure risk is HIGH (78%) due to: (1) Power consumption exceeding optimal range (8500W vs 7000W threshold), and (2) Process temperature 45K above air temperature (vs 40K threshold). Tool wear (312 min) also approaching critical levels. Recommend immediate inspection of torque system and thermal management.",
    "createdAt": "2025-02-08T10:30:00Z"
  },
  "meta": {
    "timestamp": "2025-02-08T10:35:00Z"
  }
}
```

---

## 6. Component Hierarchy & Layout

```
App (layout.tsx)
│
├── Header
│   ├── Logo
│   ├── Title / Page Breadcrumbs
│   ├── Search Bar (machines/tasks)
│   └── User Menu
│       ├── Profile
│       ├── Notifications Badge
│       └── Logout
│
├── Sidebar (Left Navigation)
│   ├── Dashboard Link
│   ├── Machines
│   │   ├── All Machines
│   │   └── Comparison View
│   ├── Analytics
│   │   ├── Correlations
│   │   ├── Trends
│   │   └── Model Performance
│   ├── Maintenance
│   │   ├── Tasks
│   │   └── Schedule
│   ├── Alerts & Notifications
│   ├── Settings
│   │   ├── Alert Thresholds
│   │   ├── Model Management
│   │   └── Integrations
│   └── Logout
│
├── Main Content Area
│   │
│   ├── Dashboard (/)
│   │   ├── Fleet Overview Card
│   │   │   ├── Total Machines
│   │   │   ├── Average Risk Score
│   │   │   ├── Critical Alerts Count
│   │   │   └── Uptime %
│   │   ├── Risk Distribution Chart
│   │   │   └── Pie: LOW / MEDIUM / HIGH / CRITICAL
│   │   ├── Top 10 Machines at Risk (Table)
│   │   │   ├── Machine Name
│   │   │   ├── Risk %
│   │   │   ├── Primary Factor
│   │   │   └── Quick Actions
│   │   ├── Recent Alerts
│   │   │   └── AlertCard (machine, severity, time)
│   │   ├── Maintenance Pipeline
│   │   │   ├── PENDING count
│   │   │   ├── IN_PROGRESS count
│   │   │   └── COMPLETED count (this week)
│   │   └── Model Performance Summary
│   │       └── ROC-AUC, Accuracy
│   │
│   ├── Machines List (/machines)
│   │   ├── Filter Panel (Type, Location, Status)
│   │   ├── Search Bar
│   │   ├── Machines Grid / Table
│   │   │   └── MachineCard (× n)
│   │   │       ├── Machine Name
│   │   │       ├── Risk Badge
│   │   │       ├── Status
│   │   │       ├── Last Prediction Time
│   │   │       └── "View Details" Button
│   │   └── Pagination
│   │
│   ├── Machine Detail (/machines/[machineId])
│   │   ├── Machine Header
│   │   │   ├── Name, Type, Location
│   │   │   ├── Risk Score (Large)
│   │   │   ├── Active Alerts Count
│   │   │   └── Quick Actions (Create Task, Export)
│   │   ├── Tabs:
│   │   │   ├── Overview (default)
│   │   │   │   ├── Current Sensor Readings (Gauges)
│   │   │   │   │   ├── Torque [Nm]
│   │   │   │   │   ├── Rotational Speed [RPM]
│   │   │   │   │   ├── Tool Wear [min]
│   │   │   │   │   ├── Air Temp [K]
│   │   │   │   │   └── Process Temp [K]
│   │   │   │   ├── Failure Risk Card
│   │   │   │   │   ├── Risk %
│   │   │   │   │   ├── Confidence %
│   │   │   │   │   └── Top 3 Contributing Factors
│   │   │   │   ├── Feature Importance Bar Chart (SHAP)
│   │   │   │   ├── Reasoning Text
│   │   │   │   └── "View Full Explanation" Link
│   │   │   ├── History (/machines/[machineId]/history)
│   │   │   │   ├── 30-day Sensor Trend Charts
│   │   │   │   ├── Risk Score Evolution
│   │   │   │   └── Anomalies Timeline
│   │   │   └── Maintenance (/machines/[machineId]/maintenance)
│   │   │       ├── Historical Tasks
│   │   │       ├── Maintenance Schedule
│   │   │       └── "New Task" Button
│   │   │
│   │   ├── Comparison View (/machines/comparison)
│   │   │   ├── Machine Selector (Multi-select)
│   │   │   ├── Side-by-side Metrics Comparison
│   │   │   ├── Overlaid Trend Charts
│   │   │   └── Export Comparison Button
│   │   │
│   ├── Alerts (/alerts)
│   │   ├── Filter: Status, Severity, Machine
│   │   ├── Alert Count Summary
│   │   ├── Alert List
│   │   │   └── AlertCard (× n)
│   │   │       ├── Icon (Severity)
│   │   │       ├── Machine Name
│   │   │       ├── Alert Message
│   │   │       ├── Time & Risk Score
│   │   │       ├── "Acknowledge" Button
│   │   │       └── "Resolve" Button
│   │   └── Alert Detail Modal
│   │       ├── Full Message
│   │       ├── Recommendations
│   │       ├── Machine Context (readings)
│   │       ├── Related Tasks
│   │       └── Status Buttons
│   │
│   ├── Analytics (/analytics)
│   │   ├── Correlation Heatmap
│   │   │   └── Sensor-to-sensor correlations
│   │   ├── Failure Patterns
│   │   │   ├── Failures by Machine Type
│   │   │   ├── Failures by Sector
│   │   │   └── Time-of-day patterns
│   │   └── ROC-AUC Curve & Metrics
│   │
│   ├── Maintenance Tasks (/maintenance)
│   │   ├── Kanban Board
│   │   │   ├── PENDING Column
│   │   │   ├── IN_PROGRESS Column
│   │   │   ├── COMPLETED Column
│   │   │   └── CANCELLED Column
│   │   ├── TaskCard (draggable)
│   │   │   ├── Task Title
│   │   │   ├── Priority Badge
│   │   │   ├── Assigned Technician
│   │   │   ├── Due Date
│   │   │   └── "View" Link
│   │   └── Task Detail Modal
│   │       ├── Title, Description
│   │       ├── Assign to Technician
│   │       ├── Schedule Dates
│   │       ├── Priority
│   │       ├── Notes
│   │       ├── Related Alert
│   │       └── Status Buttons (Complete, Cancel)
│   │
│   └── Settings (/settings)
│       ├── Alert Thresholds
│       │   ├── Severity Level Selector
│       │   ├── Risk % Thresholds (Low, Medium, High, Critical)
│       │   └── Save Button
│       ├── Notification Preferences
│       │   ├── Critical Alerts (toggle)
│       │   ├── Weekly Reports (toggle)
│       │   ├── Notification Channels (Email, SMS, In-App)
│       │   └── Save Button
│       └── Model Management
│           ├── Current Model Version
│           ├── Model Performance Metrics
│           ├── Retrain Button (Admin only)
│           └── Model History / Changelog
│
└── Footer
    ├── Copyright
    ├── Links (Privacy, Terms, Support)
    └── Build Version
```

---

## 7. Real-Time Data Flow Architecture

```
IoT Sensors / External Systems
    ↓
    │
    ├─→ Webhook Handler (/api/webhooks/sensor-intake)
    │       ↓
    │   Validate & Sanitize
    │       ↓
    │   Store in TimescaleDB (High-frequency)
    │       ↓
    │   Publish to Redis Channel (Real-time subscribers)
    │
    ├─→ Feature Engineering Service
    │       (Calculate: Power, Temp Diff, Wear Rate, etc.)
    │       ↓
    │   Cache derived features in Redis
    │
    ├─→ ML Prediction Service (On Schedule or On-Demand)
    │       ↓
    │   Call Python ML Backend (XGBoost / LightGBM)
    │       ↓
    │   Get: Failure Probability, Confidence, SHAP values
    │       ↓
    │   Store Prediction in Supabase
    │       ↓
    │   Publish Prediction to Redis Channel
    │
    ├─→ Alert Evaluation Service
    │       (Check: Probability vs Thresholds)
    │       ↓
    │   If threshold exceeded: Create Alert
    │       ↓
    │   Publish Alert to Redis Channel
    │
    └─→ WebSocket Server / Server-Sent Events
            (Client subscriptions)
            ↓
        Dashboard updates in real-time
        (No page refresh needed)
```

---

## 8. Machine Learning Pipeline

### Data Requirements

**Training Data:**
- Historical sensor readings (12+ months)
- Labeled failure events
- Failure type indicators (TWF, HDF, PWF, OSF, RNF)
- Operating conditions (machine type, location, load profile)

**Target Variable:**
- Binary: Failure (1) or No Failure (0)
- ~2% failure rate (severely imbalanced)

### ML Training Infrastructure (ml/ directory)

The project includes a complete Python-based ML training pipeline:

**Location:** `ml/` directory

**Components:**
1. **`ml/data_loader.py`** - Load and preprocess datasets
2. **`ml/feature_engineering.py`** - Create engineered features
3. **`ml/scripts/train_models.py`** - Main training pipeline
4. **`ml/README.md`** - Comprehensive training documentation
5. **`ml/requirements.txt`** - Python dependencies

**Quick Start:**
```bash
cd ml
pip install -r requirements.txt
python scripts/train_models.py
```

**Outputs:**
- Trained XGBoost and LightGBM models (.pkl files)
- Training metrics (ROC-AUC, precision, recall, F1)
- Feature columns used (for prediction consistency)
- Timestamped artifacts for version tracking

**Dataset:** Binary Classification of Machine Failures (Kaggle)
- Training data: 136,429 samples with failure labels
- Test data: 90,954 samples
- Features: 7 sensors + 5 failure mode indicators

See `ml/README.md` for detailed documentation on feature engineering, hyperparameter tuning, SHAP integration, and MLflow setup.

### Model Training Workflow

```
1. Data Collection & Validation (ml/data_loader.py)
   - Load from docs/train.csv (136,429 rows)
   - Check data integrity & class distribution
   - Handle categorical (Type: L, M, H) encoding

2. Feature Engineering (ml/feature_engineering.py)
   - Power = Torque × Rotational Speed
   - Temperature Difference = Process - Air
   - Wear Rate = Tool Wear / Torque
   - Total Failure Count (sum of indicators)
   - Interaction features (Torque × Speed, Wear × Power)
   - Advanced polynomial & ratio features

3. Data Preprocessing (ml/data_loader.py)
   - Encoding: Label encoding for machine type
   - Validation: Stratified train/test split
   - Drop: ID columns, unused identifiers

4. Class Imbalance Handling
   - scale_pos_weight = 49 (98/2 ratio)
   - Stratified K-Fold cross-validation
   - ROC-AUC and F1 as primary metrics (not accuracy)

5. Model Training (ml/scripts/train_models.py)
   - XGBoost: max_depth=8, learning_rate=0.1, n_estimators=200
   - LightGBM: max_depth=8, learning_rate=0.1, n_estimators=200
   - Both use scale_pos_weight=49 for imbalance

6. Feature Importance Analysis
   - Built-in feature_importances_ from models
   - Optional SHAP for deeper analysis
   - Top 10 features tracking

7. Model Evaluation
   - ROC-AUC: Primary metric (target ≥ 0.85)
   - Precision: ≥ 0.80 (fewer false alarms)
   - Recall: ≥ 0.70 (catch real failures)
   - F1 Score: Balanced metric
   - Confusion matrix analysis

8. Model Versioning
   - Timestamped artifacts (xgboost_model_YYYYMMDD_HHMMSS.pkl)
   - Metrics JSON for each run
   - Feature columns recorded for consistency

9. Production Deployment
   - Load model from ml/models/ in FastAPI backend
   - Create prediction endpoints
   - Register with MLflow for tracking
   - Enable A/B testing with previous model

10. Continuous Retraining (Story 10)
    - Triggered weekly or on drift detection
    - Compare metrics against production model
    - Promote if performance improves
    - Automatic rollback if degradation detected
```

### Model Explainability (SHAP)

For each prediction:
1. **SHAP Summary Plot:**
   - Shows impact of top 10 features
   - Color: Red = increases failure risk, Blue = decreases risk

2. **SHAP Decision Plot:**
   - Traces how each feature pushes prediction from base value to final prediction

3. **Plain English Reasoning:**
   ```
   "Failure risk is HIGH (78%) because:
   1. Power (8500W) exceeds safe threshold (7000W)
      → Indicates system strain
   2. Temperature difference (45K) is above normal (40K)
      → Suggests poor heat dissipation
   3. Tool wear (312 min) approaching critical level (350 min)
      → Lubrication/inspection recommended"
   ```

---

## 9. Security & Compliance

### Authentication & Authorization
- **OAuth2 via Supabase Auth** (email + password)
- **JWT token exchange** (short-lived access tokens)
- **Role-based access control (RBAC):**
  - Admin: Full system access
  - Manager: View all machines, manage alerts & tasks
  - Technician: View assigned machines, update tasks
  - Analyst: View analytics, export data (read-only)

### Data Protection
- **Encryption in transit:** TLS 1.3 for all API calls
- **Encryption at rest:** Database encryption (Supabase default)
- **Input sanitization:** Zod/Joi validation on all inputs
- **SQL injection prevention:** Parameterized queries (ORM)
- **CSRF protection:** SameSite cookies, CSRF tokens

### API Security
- **Rate limiting:** 100 req/min per IP
- **CORS policy:** Restrict to known domains
- **API versioning:** `/api/v1/*` (future-proof)
- **API keys:** Support Bearer token + API key auth

### Environment Variables
```bash
# Public (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Private (server-only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://:pass@host:6379
ML_BACKEND_URL=https://ml-api.internal:8000
OPENAI_API_KEY=sk-...
```

---

## 10. Deployment Architecture

### Development
- **Local:** Next.js dev server, Supabase local emulator
- **Database:** SQLite (Supabase local)
- **ML Backend:** Python with `pip install -r requirements.txt`

### Production
- **Frontend:** Vercel (Next.js hosting)
- **Backend API:** Cloud Run / ECS (containerized)
- **Database:** Supabase hosted (PostgreSQL + TimescaleDB extension)
- **Cache:** Redis Cloud or AWS ElastiCache
- **Graph DB:** Neo4j Aura
- **ML Backend:** FastAPI on GPU instance (AWS SageMaker / Google Vertex AI)
- **CDN:** Cloudflare

### CI/CD Pipeline
```
Git Push → GitHub Actions
  ├─ Lint (ESLint, Prettier)
  ├─ Type Check (TypeScript)
  ├─ Unit Tests (Vitest)
  ├─ Integration Tests (Cypress)
  ├─ Build Docker image
  └─ Deploy to Production

Model Training Workflow
  └─ Weekly scheduled job
  ├─ Fetch new training data
  ├─ Feature engineering
  ├─ Train XGBoost/LightGBM
  ├─ Evaluate ROC-AUC
  └─ If better → promote to production
```

---

## 11. Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| **Page Load** | < 2 seconds | DCP, including charts |
| **API Response** | < 500ms | Average response time |
| **Prediction Latency** | < 5 seconds | From data arrival to prediction |
| **WebSocket Update** | < 1 second | Real-time sensor updates |
| **Dashboard Render** | < 3 seconds | Fleet overview with 100+ machines |
| **Concurrent Users** | 1000+ | Horizontal scaling with Vercel/K8s |
| **Data Throughput** | 10,000 readings/sec | TimescaleDB with indexing |

---

## 12. Monitoring & Observability

### Application Metrics
- **Frontend:** Google Analytics, Sentry (error tracking)
- **Backend:** Prometheus (API latency, request count, errors)
- **Database:** Supabase monitoring (query performance, replication lag)

### Model Monitoring
- **Prediction Accuracy:** Compare predictions vs actual failures
- **Data Drift:** Monitor input feature distributions
- **Model Drift:** Track ROC-AUC, precision, recall over time
- **Retraining Triggers:** Automatic if accuracy drops >5%

### Logging
- **Centralized Logging:** Datadog / ELK Stack
- **Log Levels:** INFO, WARN, ERROR (structured JSON format)
- **Retention:** 30 days hot, 1 year cold archive

---

## 13. Testing Strategy

### Unit Tests (Vitest)
- Business logic functions
- Feature engineering calculations
- Validation functions

### Component Tests (React Testing Library)
- UI components
- User interactions
- Form submissions

### Integration Tests (Cypress)
- End-to-end workflows
  - Login → Dashboard → View Machine → Create Task → Logout
- API integration

### Load Testing (k6 / Artillery)
- Simulate 1000 concurrent users
- Test WebSocket scaling
- Database query performance under load

---

## 14. Documentation

### API Documentation
- **Format:** OpenAPI 3.0 (Swagger)
- **Location:** `/docs` endpoint (auto-generated)

### Component Documentation
- **Tool:** Storybook
- **Status:** Interactive component library

### Architecture Decision Records (ADRs)
- Decision: Gradient Boosting for failure prediction
- Decision: React Server Components for real-time updates
- Decision: TimescaleDB for time-series sensor data

---

## 15. Compliance Checklist

Before production launch, ensure:
- [ ] All data models have JSDoc with examples
- [ ] API endpoints have test cases
- [ ] Error handling comprehensive (no 500s without logging)
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention verified
- [ ] CORS policy configured
- [ ] Rate limiting enabled
- [ ] Sensitive data not in logs
- [ ] Model performance metrics documented
- [ ] Deployment runbook completed
- [ ] Load testing results reviewed (< 2s response at 1000 users)
- [ ] Security audit passed
- [ ] Data privacy policy published
- [ ] Terms of service drafted
