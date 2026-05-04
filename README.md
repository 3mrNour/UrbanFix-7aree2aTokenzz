# Urban Fix

![Hackathon](https://img.shields.io/badge/BuildWithAI-3rd%20Place-brightgreen)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Tailwind-61DAFB)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933)
![Database](https://img.shields.io/badge/Database-MongoDB-47A248)
![Architecture](https://img.shields.io/badge/Architecture-Clean%20Architecture-blue)

Urban Fix is a smart city infrastructure maintenance platform that bridges the communication and execution gap between citizens and municipal authorities. Citizens can report public issues in real time, managers can triage and dispatch work efficiently, technicians can resolve tasks with evidence, and city governors can monitor city-wide operations through analytics and geospatial insights.

This project won **3rd place** in the **BuildWithAI Hackathon**.

---

## Table of Contents

- [Why Urban Fix](#why-urban-fix)
- [Role-Based Orchestration](#role-based-orchestration)
- [Advanced Technical Logic](#advanced-technical-logic)
- [Clean Architecture & Separation of Concerns](#clean-architecture--separation-of-concerns)
- [Tech Stack](#tech-stack)
- [System Workflow](#system-workflow)
- [Installation & Setup](#installation--setup)
- [API Overview](#api-overview)
- [Screenshots](#screenshots)

---

## Why Urban Fix

Urban infrastructure issues are often delayed due to fragmented communication and manual follow-up. Urban Fix provides a single, role-aware operational pipeline where:

- Citizens submit geotagged problems with visual proof.
- Managers validate incidents and orchestrate assignments.
- Technicians execute work with completion evidence.
- Governors supervise performance through city-level dashboards and map intelligence.

The result is faster response times, better accountability, and measurable municipal performance.

---

## Role-Based Orchestration

Urban Fix uses a **4-role orchestration model** to ensure clear responsibilities and secure access control.

| Role | Core Responsibility | Key Authorities |
|---|---|---|
| **Citizen** | Report city issues | Create reports, upload `photoBefore`, track report status lifecycle |
| **District Manager** | Validate and coordinate field operations | Review reports (approve/reject), assign/delegate technicians, monitor district queues |
| **Field Technician** | Execute and close assigned work | Accept tasks, move status to `IN_PROGRESS`/`RESOLVED`, upload mandatory `photoAfter` |
| **City Governor** | Strategic oversight and governance | Access global reports, monitor analytics, view heatmap, supervise user roles |

---

## Advanced Technical Logic

### 1) Geospatial Intelligence
- MongoDB geospatial modeling with `2dsphere` indexes on report and user location fields.
- Geo-powered workflows for location-aware operations and proximity-based decision support.
- Duplicate prevention strategy is modeled around a **50-meter proximity rule** to reduce redundant report noise in dense urban zones.

### 2) Closure Validation (Proof of Work)
- Task closure is controlled by strict state transitions.
- A technician cannot resolve a task without uploading a **mandatory completion photo** (`photoAfter`), ensuring auditability and reducing false closures.

### 3) Smart Dispatching (Least Busy Technician)
- Technician assignment uses workload-aware ranking.
- Aggregation computes active task counts and prioritizes the **least busy technician** to optimize operational load balancing.
- Proximity signals are combined with workload metrics for practical dispatch recommendations.

### 4) SLA Enforcement
- Priority-aware operational logic is designed to support SLA compliance.
- High-priority incidents are surfaced for accelerated handling, with escalation-ready governance through management and executive dashboards.

---

## Clean Architecture & Separation of Concerns

The codebase follows a modular, cleanly layered structure:

- **Backend**
  - `routes/`: API contracts and role-guarded endpoint exposure
  - `controllers/`: business workflows and orchestration logic
  - `models/`: domain entities and persistence rules (Mongoose schemas/indexes)
  - `middleware/`: cross-cutting concerns (auth, RBAC, file handling)
  - `utils/` and `validators/`: reusable policies, enums, and validation helpers
- **Frontend**
  - `features/`: role-focused UI domains (Citizen, Dispatcher/Manager, Technician, Governor)
  - `services/`: centralized API communication and token-aware request handling
  - `App.jsx`: route orchestration and role-based access gating

This separation improves maintainability, testability, and team scalability.

---

## Tech Stack

### Frontend
- React
- Tailwind CSS
- React Hook Form
- Zod
- Axios

### Backend
- Node.js
- Express
- MongoDB (Mongoose)
- JWT Authentication
- Multer (file uploads)

---

## System Workflow

Urban Fix report lifecycle from submission to archiving:

1. **Submission (Citizen)**  
   Citizen submits issue details, geolocation, and `photoBefore`.
2. **Validation (District Manager)**  
   Report is reviewed and either approved (`VALID`) or rejected.
3. **Dispatch (District Manager)**  
   System-assisted recommendation proposes the least busy technician; manager assigns task.
4. **Execution (Field Technician)**  
   Technician starts work (`IN_PROGRESS`) and performs on-site resolution.
5. **Closure (Field Technician)**  
   Technician marks task `RESOLVED` with mandatory `photoAfter` proof.
6. **Oversight & Archiving (City Governor / System Ops)**  
   Reports are monitored through analytics and heatmap views, then retained in lifecycle history including archival state.

---

## Installation & Setup

## Prerequisites

- Node.js (LTS recommended)
- npm
- MongoDB instance (local or cloud)

### 1) Clone Repository

```bash
git clone <your-repo-url>
cd UrbanFix-7aree2aTokenzz
```

### 2) Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
MONGO_URL=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
JWT_EXPIRES_IN=7d
PORT=5000
```

Run backend:

```bash
npm run dev
```

Backend base URL: `http://localhost:5000`

### 3) Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Frontend dev server: typically `http://localhost:5173`

> Note: Frontend service configuration points to backend API at `http://localhost:5000/api`.

---

## API Overview

High-level endpoint groups:

- **Auth & Users**: `/api/users/*`
- **Citizen Reports**: `/api/reports/*`
- **Technician Tasks**: `/api/tasks/*`
- **Manager Operations**: `/api/manager/*`
- **Governor Analytics**: `/api/governor/*`
- **Health Check**: `/health`

For detailed request/response examples, see `backend/requests.http`.

---

## Screenshots

Add your UI previews here:

- **Heatmap View** (Governor Dashboard)  
  `![Heatmap](./docs/screenshots/heatmap.png)`

- **Manager Dashboard**  
  `![Manager Dashboard](./docs/screenshots/manager-dashboard.png)`

- **Citizen App**  
  `![Citizen App](./docs/screenshots/citizen-app.png)`

---

## Project Status

Urban Fix is an active, extensible foundation for digital municipal operations, built with AI-assisted engineering and production-minded architecture principles.
