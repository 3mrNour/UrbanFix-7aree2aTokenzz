# Backend Status Report

## System Overview

The workspace currently implements a multi-role Urban Fix backend with these primary entities and modules:

- **Users** (`CITIZEN`, `TECHNICIAN`, `MANAGER`, `GOVERNOR`) with JWT auth and role-based access control.
- **Reports** created by citizens, enriched with geo-location and lifecycle statuses.
- **District management** via `districtId` scoping for managers and technicians.
- **Technician tasks** for assigned report execution and closure proof upload.
- **Governor analytics** for global oversight (reports grid, aggregated KPIs, heatmap data).
- **Auto-seeded admin** on server startup.

Core business logic currently enforced:
- Role-based route restrictions through `protect` + `restrictTo`.
- Manager is blocked from report creation.
- Citizen report creation requires account district assignment.
- Technician cannot resolve tasks without `photoAfter` upload.
- Governor-only access for user management endpoints and governor dashboard endpoints.

---

## Endpoints Inventory

| Method | Route | Required Inputs (Body / Params / Query) | Middlewares | Current Status |
|---|---|---|---|---|
| GET | `/health` | None | None | Completed |
| POST | `/api/users` | Body: `fullName`, `password`, `phoneNumber`, `role`; plus `nationalId` for CITIZEN or `employeeId` for staff | `createUserValidator` | Needs Testing |
| POST | `/api/users/login` | Body: (`nationalId` or `employeeId`), `password` | None | Completed |
| POST | `/api/users/admin/login` | Body: `employeeId`, `password` | None | Completed |
| GET | `/api/users` | Query (optional): `role`, `isActive`, `page`, `limit` | `protect`, `restrictTo("GOVERNOR")` | Completed |
| GET | `/api/users/profile` | None | `protect` | Completed |
| PATCH | `/api/users/:id` | Params: `id`; Body (optional): `fullName`, `phoneNumber`, `nationalId`, `employeeId`, `role`, `isActive` | `protect`, `restrictTo("GOVERNOR")`, `updateUserValidator` | Needs Testing |
| DELETE | `/api/users/:id` | Params: `id` | `protect`, `restrictTo("GOVERNOR")` | Completed |
| POST | `/api/reports` | Body: `category`, `description`, `photoBefore`, `location.coordinates`; optional: `urgency`, `addressDescription`; district taken from `req.user.districtId` | `protect`, `blockManagerReportCreation`, `restrictTo("CITIZEN")` | Needs Testing |
| GET | `/api/reports/my-reports` | None | `protect`, `restrictTo("CITIZEN")` | Completed |
| GET | `/api/tasks` | None | `protect`, `restrictTo("TECHNICIAN")` | Completed |
| GET | `/api/tasks/:id` | Params: `id` | `protect`, `restrictTo("TECHNICIAN")` | Completed |
| PATCH | `/api/tasks/:id/status` | Params: `id`; Body: `status` (`IN_PROGRESS` or `RESOLVED`); if `RESOLVED` then multipart file `photoAfter` required | `protect`, `restrictTo("TECHNICIAN")`, `multer.single("photoAfter")` | Completed |
| GET | `/api/governor/reports` | Query (optional): `status`, `category`, `urgency`, `fromDate`, `toDate` | `protect`, `restrictTo("GOVERNOR")` | Completed |
| GET | `/api/governor/analytics` | None | `protect`, `restrictTo("GOVERNOR")` | Completed |
| GET | `/api/governor/heatmap` | Query (optional): `status`, `category`, `urgency`, `fromDate`, `toDate` | `protect`, `restrictTo("GOVERNOR")` | Completed |
| GET | `/api/manager/reports` | Query (optional): `status`, `category`, `urgency` | `protect`, `restrictTo("MANAGER")`, `requireDistrictAssignment` | Completed |
| PATCH | `/api/manager/reports/:id/review` | Params: `id`; Body: `status` (`VALID`/`REJECTED`/`SPAM`), and `category` required when `status=VALID` | `protect`, `restrictTo("MANAGER")`, `requireDistrictAssignment` | Needs Testing |
| GET | `/api/manager/reports/:reportId/suggestions` | Params: `reportId` | `protect`, `restrictTo("MANAGER")`, `requireDistrictAssignment` | Completed |
| PATCH | `/api/manager/reports/:reportId/assign` | Params: `reportId`; Body: `technicianId` | `protect`, `restrictTo("MANAGER")`, `requireDistrictAssignment` | Completed |

---

## Missing / Broken / Risky Pieces

### 1) Schema-Logic Mismatch in Report Triage Flow
- `Report.category` is currently **required** in schema.
- But District Manager logic says category is assigned on acceptance (`VALID`) during triage.
- This conflicts with any intended flow where citizen submits uncategorized report first.
- **Recommendation:** make `category` optional at creation time, enforce it when manager sets status `VALID`.

### 2) District Assignment Not Exposed in User Create/Update Flows
- `User` schema now has `districtId`, but `createUser` payload and `updateUser` allowed fields do not include `districtId`.
- This can block citizen report creation (`createReport` requires `req.user.districtId`).
- **Recommendation:** allow Governor to set `districtId` in user create/update workflows.

### 3) Unused Middleware Function
- `enforceDistrictScopeByResource` is defined in `districtScopeMiddleware.js` but not used in routes.
- **Recommendation:** wire it to manager/governor resource-specific endpoints for stronger reusable boundary enforcement.

### 4) Potential Geo Query Fragility
- Smart assignment uses `$geoNear` on `User.currentLocation`.
- Users without valid `currentLocation.coordinates` may reduce suggestion quality.
- **Recommendation:** validate/store technician location reliably and consider fallback sorting behavior explicitly.

### 5) Validation Gaps (Route-level)
- No dedicated validators for:
  - `/api/users/login`
  - `/api/users/admin/login`
  - `/api/reports`
  - `/api/tasks/:id/status`
  - district manager review/assign endpoints
- **Recommendation:** add express-validator chains for all write operations.

### 6) Inconsistent Naming + Duplicate Paths in workspace listing
- `report.model.js` appears via two path styles in listing (`models/...` and `models\...`); likely same file but can confuse tooling/reports.
- **Recommendation:** keep naming/style normalized.

### 7) Data Migration Risk
- `Report.districtId` is now required.
- Existing old reports in DB (if any) may fail updates/queries depending on code path.
- **Recommendation:** run one-time migration to backfill `districtId`.

---

## Overall QA Assessment

- **Implemented breadth:** High (auth, roles, citizens, technicians, managers, governor analytics).
- **Business rule enforcement:** Good, with critical rules present.
- **Operational readiness:** Medium (requires targeted tests + validator hardening + schema alignment for triage/district assignment).

