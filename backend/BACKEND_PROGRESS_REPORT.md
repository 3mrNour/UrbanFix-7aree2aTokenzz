# Urban Fix Backend - Complete Progress Report

هذا الملف يوثق كل ما تم بناؤه فعليًا داخل `backend` حتى الآن بناءً على قراءة الملفات الحالية.

## 1) Architecture Overview

- المشروع يعمل بـ `ES Modules` (`"type": "module"`).
- السيرفر الأساسي في `index.js`.
- قاعدة البيانات: MongoDB عبر `mongoose`.
- Middleware الأساسية:
  - `cors`
  - `express.json`
  - `express.urlencoded`
- Static uploads serving:
  - `/uploads`
- Error handling:
  - 404 route handler
  - global error middleware
- startup flow:
  1. `connectDB()`
  2. `ensureDefaultAdmin()`
  3. `app.listen(...)`

## 2) Current Folder Modules

### `models`

#### `models/User.js`
- Single user schema (بدون discriminators حاليًا).
- الحقول:
  - `fullName` (required)
  - `nationalId` (unique + sparse)
  - `employeeId` (unique + sparse)
  - `password` (required, `select: false`)
  - `phoneNumber` (required, unique)
  - `role` (`CITIZEN`, `TECHNICIAN`, `MANAGER`, `GOVERNOR`)
  - `isActive` (default = `false`)
  - `deletedAt`
- Pre-save hook لتشفير كلمة المرور بـ `bcrypt` (12 rounds).
- Instance method: `comparePassword()`.

#### `models/report.model.js`
- Report schema مرتبط بالمستخدم عبر references:
  - `citizen` (required ObjectId -> `User`)
  - `assignedTechnician` (optional ObjectId -> `User`)
  - `districtManager` (optional ObjectId -> `User`)
- حقول التشغيل:
  - `category`, `description`, `urgency`
  - `photoBefore` (required)
  - `photoAfter` (proof of work)
  - `status`
- GeoJSON support:
  - `location.type = "Point"`
  - `location.coordinates = [lng, lat]` مع validation
  - `2dsphere` index على `location`

## 3) Security & Auth

### `utils/generateToken.js`
- JWT generation using:
  - payload: `{ id: userId }`
  - secret: `JWT_SECRET`
  - expiry: `JWT_EXPIRES_IN` أو `7d`

### `middleware/authMiddleware.js`
- `protect`:
  - يتحقق من Bearer token
  - يفك JWT
  - يجلب المستخدم من DB
  - يرفض المستخدم غير النشط
  - يضع المستخدم في `req.user`
- `restrictTo(...roles)`:
  - role-based authorization

## 4) Admin Bootstrapping (No Temporary Manual Setup)

### `utils/seedAdmin.js`
- عند startup يتم التأكد من وجود admin افتراضي.
- لو admin غير موجود يتم إنشاؤه تلقائيًا.
- لو موجود وغير active يتم تفعيله.
- الإعدادات تُقرأ من `.env` (مع defaults):
  - `ADMIN_FULL_NAME`
  - `ADMIN_EMPLOYEE_ID` (default `ADMIN-0001`)
  - `ADMIN_PHONE_NUMBER`
  - `ADMIN_PASSWORD` (default `Admin@12345`)
  - `ADMIN_ROLE` (`GOVERNOR` أو `MANAGER`)

## 5) Controllers

### `controllers/userController.js`
- `createUser`
- `getUserProfile`
- `getAllUsers` (filter + pagination)
- `updateUser` (يدعم `isActive` للتفعيل/التعطيل)
- `deleteUser` (soft toggle عبر `isActive` + `deletedAt`)
- `login`
  - citizen/staff login by `nationalId` or `employeeId`
  - يرجع:
    - `token`
    - `accessToken`
    - `data`
- `loginAdmin`
  - admin-only login by `employeeId`
  - role لازم يكون `MANAGER` أو `GOVERNOR`
  - يرجع:
    - `token`
    - `accessToken`
    - `data`

### `controllers/reportController.js` (Citizen)
- `createReport`
  - ينشئ بلاغ مربوط بـ `req.user.id` كمواطن
- `getMyReports`
  - يرجع بلاغات المواطن الحالي فقط

### `controllers/taskController.js` (Technician)
- `getAssignedTasks`
- `getTaskDetails`
- `updateTaskStatus`
  - status المسموح: `IN_PROGRESS`, `RESOLVED`
  - **Closure Validation مطبق**:
    - لو `RESOLVED` لازم `photoAfter` file
    - بدون ملف => `400`

### `controllers/governorController.js` (City Governor)
- `getGlobalReports`
  - كل البلاغات + filters:
    - `status`, `category`, `urgency`, `fromDate`, `toDate`
  - populate للمواطن والفني
- `getSystemAnalytics` (Aggregation)
  - إجمالي البلاغات آخر 24 ساعة
  - counts by status (`PENDING`, `IN_PROGRESS`, `RESOLVED`)
  - top categories
  - average resolution time للبلاغات المحلولة
- `getHeatmapMapData`
  - يرجع بيانات map فقط:
    - `location`, `status`, `urgency`, `category`, `createdAt`

## 6) Routes

### `routes/userRoutes.js`
- Public:
  - `POST /api/users`
  - `POST /api/users/login`
  - `POST /api/users/admin/login`
- Protected:
  - `GET /api/users/profile` (any authenticated)
  - `GET /api/users` (`GOVERNOR`)
  - `PATCH /api/users/:id` (`GOVERNOR`)
  - `DELETE /api/users/:id` (`GOVERNOR`)

### `routes/reportRoutes.js` (Citizen)
- `POST /api/reports` (`CITIZEN`)
- `GET /api/reports/my-reports` (`CITIZEN`)

### `routes/taskRoutes.js` (Technician)
- `GET /api/tasks` (`TECHNICIAN`)
- `GET /api/tasks/:id` (`TECHNICIAN`)
- `PATCH /api/tasks/:id/status` (`TECHNICIAN`)
  - upload via Multer (`photoAfter`)

### `routes/governorRoutes.js` (Governor)
- `GET /api/governor/reports` (`GOVERNOR`)
- `GET /api/governor/analytics` (`GOVERNOR`)
- `GET /api/governor/heatmap` (`GOVERNOR`)

## 7) Mounted API in `index.js`

- `/api/users`
- `/api/reports`
- `/api/tasks`
- `/api/governor`
- `/health`

## 8) Validation Layer

### `validators/userValidator.js`
- Create validation:
  - role-based:
    - CITIZEN requires `nationalId`
    - Staff requires `employeeId`
- Update validation:
  - Mongo ID check
  - field constraints
  - منع تحديث `password` عبر update endpoint

## 9) Postman Collections Status

### `postman/UrbanFix-All-Endpoints.postman_collection.json` (Primary)
- يحتوي endpoints لكل modules:
  - System
  - Users/Auth
  - Citizen Reports
  - Technician Tasks
- Login requests (`Citizen`, `Technician`, `Admin`) فيها Scripts تحفظ تلقائيًا:
  - `token` في environment
  - `userId` عند توفره
- collection تستخدم:
  - `Authorization: Bearer {{token}}`

### `postman/UrbanFix-User-Routes.postman_collection.json`
- قديم ومحدود لمسارات user فقط.

## 10) Environment & Dependencies

### `.env` required keys
- `MONGO_URL`
- `PORT`
- `JWT_SECRET`

### optional admin seed keys
- `ADMIN_FULL_NAME`
- `ADMIN_EMPLOYEE_ID`
- `ADMIN_PHONE_NUMBER`
- `ADMIN_PASSWORD`
- `ADMIN_ROLE`

### `package.json`
- runtime:
  - `express`, `mongoose`, `cors`, `dotenv`
  - `bcrypt`, `jsonwebtoken`
  - `multer`, `express-validator`
- dev:
  - `nodemon`

## 11) Key Business Rules Implemented

1. Access control by role:
   - Citizen / Technician / Governor boundaries واضحة.
2. Governor controls user management:
   - list, update, activate/deactivate users.
3. Technician closure validation:
   - `RESOLVED` requires `photoAfter`.
4. JWT token returned in sign-in responses:
   - `token` + `accessToken`.
5. Postman auto token storage:
   - token saved automatically after login.

## 12) Current Known Gaps (Next Engineering Steps)

1. إضافة validators منفصلة لـ:
   - login endpoints
   - report creation
   - task status updates
2. فرض file size/type limits في Multer.
3. إضافة centralized logger + structured error codes.
4. إضافة integration tests لمسارات auth/reports/tasks/governor.
5. إزالة/أرشفة الـ user-only old Postman collection لمنع اللبس.

---

Last verified from current workspace files in `backend`.
