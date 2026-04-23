# Urban Fix Backend - Full Progress Report

هذا التقرير يوثّق الحالة الحالية الفعلية لكل ملفات `backend` وما تم تنفيذه حتى الآن.

## 1) Current Backend Architecture

### Entry Point: `index.js`
- المشروع يعمل بـ `ES Modules`.
- Middlewares مفعلة:
  - `cors()`
  - `express.json({ limit: "1mb" })`
  - `express.urlencoded({ extended: true })`
- Static serving:
  - `app.use("/uploads", express.static(...))`
- Database bootstrap:
  - `connectDB()` باستخدام `mongoose.connect(process.env.MONGO_URL)`
  - فشل الاتصال يؤدي إلى `process.exit(1)`
- Routes mounted:
  - `/api/users`
  - `/api/reports`
  - `/api/tasks`
- Diagnostics:
  - `GET /health`
  - 404 handler
  - global error middleware

## 2) Data Models

### `models/User.js`
- Single user schema (ليس discriminators حاليًا).
- الحقول:
  - `fullName` (required)
  - `nationalId` (unique + sparse)
  - `employeeId` (unique + sparse)
  - `password` (required, `select: false`)
  - `phoneNumber` (required, unique)
  - `role` (`CITIZEN | TECHNICIAN | MANAGER | GOVERNOR`)
  - `isActive` (default: `false`)
  - `deletedAt` (default: `null`)
- Middleware:
  - pre-save hashing بكلفة 12 rounds عبر `bcrypt`
- Method:
  - `comparePassword(plainText)`

### `models/report.model.js`
- الربط بالمواطن عبر reference فقط (بدون تكرار بيانات):
  - `citizen: ObjectId -> User (required)`
- حقول البلاغ الأساسية:
  - `category`, `description`, `urgency`
  - `photoBefore` (required)
  - `photoAfter` (proof of work)
  - `status` من `ReportStatus`
  - `assignedTechnician`, `districtManager`
  - `rejectionReason`
- GeoJSON location:
  - `type: "Point"`
  - `coordinates: [longitude, latitude]`
  - validator لطول الإحداثيات = 2
- Index:
  - `2dsphere` على `location`

## 3) Security and Authentication Layer

### `utils/generateToken.js`
- إنشاء JWT بالـ payload:
  - `{ id: userId }`
- يعتمد على:
  - `JWT_SECRET`
  - `JWT_EXPIRES_IN` (default: `7d`)

### `middleware/authMiddleware.js`
- `protect`:
  - يقرأ Bearer token
  - يتحقق من JWT
  - يجلب المستخدم ويضيفه إلى `req.user`
  - يرفض الحساب غير النشط
- `restrictTo(...allowedRoles)`:
  - role-based authorization

## 4) Controllers Status

### `controllers/userController.js`
- `createUser`
- `login` (بالـ `nationalId` أو `employeeId` + password)
- `getUserProfile`
- `getAllUsers` (filter + pagination)
- `updateUser`
- `deleteUser` (soft toggle)
- Error handling:
  - 422 validation
  - 409 duplicate unique field

### `controllers/reportController.js` (Citizen Module)
- `createReport`
  - يربط البلاغ بالمستخدم الحالي: `citizen: req.user.id`
- `getMyReports`
  - يجلب بلاغات المواطن الحالي فقط

### `controllers/taskController.js` (Technician Module)
- `getAssignedTasks`
  - يجلب البلاغات المعيّنة للفني الحالي
  - populate لبيانات المواطن (`fullName`, `phoneNumber`)
- `getTaskDetails`
  - يجلب تفاصيل مهمة واحدة إذا كانت مخصصة لنفس الفني
- `updateTaskStatus`
  - يسمح فقط: `IN_PROGRESS`, `RESOLVED`
  - **Closure Validation مطبقة**:
    - عند التحويل إلى `RESOLVED` يجب رفع ملف `photoAfter`
    - بدون الملف -> `400 Bad Request`

## 5) Routes Status

### `routes/userRoutes.js`
- `POST /api/users/login` (public)
- `POST /api/users` (public create)
- `GET /api/users` (MANAGER/GOVERNOR)
- `GET /api/users/profile` (authenticated)
- `PATCH /api/users/:id` (MANAGER/GOVERNOR)
- `DELETE /api/users/:id` (GOVERNOR)

### `routes/reportRoutes.js`
- `POST /api/reports` (CITIZEN)
- `GET /api/reports/my-reports` (CITIZEN)

### `routes/taskRoutes.js`
- `GET /api/tasks` (TECHNICIAN)
- `GET /api/tasks/:id` (TECHNICIAN)
- `PATCH /api/tasks/:id/status` (TECHNICIAN + Multer upload `photoAfter`)

## 6) Validators and Enums

### `validators/userValidator.js`
- Create validator:
  - role-based validation:
    - CITIZEN requires `nationalId`
    - staff requires `employeeId`
- Update validator:
  - MongoId check
  - field constraints
  - يمنع تعديل `password` عبر update route

### `utils/enums.js`
- `UserRoles`
- `ReportStatus`
- `IssueCategories`
- `UrgencyLevels`

## 7) Environment and Dependencies

### `.env`
- يحتوي المتغيرات الأساسية:
  - `MONGO_URL`
  - `PORT`
  - `JWT_SECRET`
- ملاحظة أمنية: لا يتم عرض القيم الحساسة في هذا التقرير.

### `package.json`
- Dependencies:
  - `express`, `mongoose`, `cors`, `dotenv`
  - `bcrypt`, `jsonwebtoken`
  - `multer`, `express-validator`
- Dev:
  - `nodemon`
- script:
  - `npm run dev`

## 8) What Happened So Far (Chronological Summary)

1. تجهيز Express entry point + Mongo connection + global error handling.
2. بناء User module (model/controller/routes/validator).
3. حل مشكلة ربط المسارات `/api/users`.
4. التحويل الكامل إلى ES Modules.
5. إضافة JWT auth (`generateToken`, `protect`, `restrictTo`) + `login`.
6. بناء Citizen Reports flow (`createReport`, `getMyReports`) مع حماية role-based.
7. بناء Technician Tasks flow:
   - assigned tasks
   - task details
   - status update
   - mandatory proof photo on closure (`RESOLVED`)
8. توصيل كل modules في `index.js`:
   - users + reports + tasks

## 9) Full API Endpoints (Current)

### System
- `GET /health`

### Users
- `POST /api/users`
- `POST /api/users/login`
- `GET /api/users`
- `GET /api/users/profile`
- `PATCH /api/users/:id`
- `DELETE /api/users/:id`

### Reports (Citizen)
- `POST /api/reports`
- `GET /api/reports/my-reports`

### Tasks (Technician)
- `GET /api/tasks`
- `GET /api/tasks/:id`
- `PATCH /api/tasks/:id/status` (multipart/form-data for `photoAfter`)

## 10) Current Gaps / Recommended Next Steps

1. إضافة validators خاصة بـ:
   - `login`
   - `createReport`
   - `updateTaskStatus`
2. إضافة file type / size restrictions على Multer (security hardening).
3. توحيد naming/style بين الملفات.
4. إضافة integration tests لمسارات auth/reports/tasks.
5. تبني discriminators في User لاحقًا إذا مطلوب معماريًا.

---

Last updated from real workspace files in `backend`.
# Urban Fix Backend - Progress Report (Updated)

هذا التقرير مبني على قراءة ملفات `backend` الموجودة فعليًا الآن.

## 1) نظرة عامة على الحالة الحالية

- المشروع يعمل بـ `ES Modules` (في `package.json`: `"type": "module"`).
- Entry point في `index.js` ويشمل:
  - `cors`, `express.json`, `express.urlencoded`
  - static serving على `/uploads`
  - MongoDB connection عبر `mongoose`
  - global 404 + global error handler
- الراوتات المربوطة حاليًا:
  - `app.use("/api/users", userRoutes)`
  - `app.use("/api/reports", reportRoutes)`

## 2) الملفات الأساسية وما تحتويه

### `models/User.js`

- User schema واحد (غير مبني على discriminators حاليًا).
- الحقول:
  - `fullName`
  - `nationalId` (unique + sparse)
  - `employeeId` (unique + sparse)
  - `password` (select: false)
  - `phoneNumber` (unique)
  - `role` من `UserRoles`
  - `isActive` (default: `false`)
  - `deletedAt`
- pre-save hook لتشفير كلمة المرور بـ `bcrypt`.
- method `comparePassword`.

### `models/report.model.js`

- نموذج البلاغ مرتبط بالمواطن بالـ reference:
  - `citizen: { type: ObjectId, ref: "User", required: true }`
- GeoJSON Point مدعوم في `location`:
  - `type: "Point"`
  - `coordinates: [longitude, latitude]` مع validator لطول المصفوفة = 2
- الحقول الأساسية موجودة:
  - `category`, `description`, `photoBefore`, `status`
- `2dsphere` index موجود على `location`.

### `controllers/userController.js`

- دوال CRUD:
  - `createUser`
  - `getUserProfile`
  - `getAllUsers` (filter + pagination)
  - `updateUser`
  - `deleteUser` (soft delete عبر `isActive` toggle)
- دالة `login` مضافة:
  - تسجيل الدخول بـ (`nationalId` أو `employeeId`) + `password`
  - مقارنة الباسورد عبر `comparePassword`
  - إنشاء JWT عبر `generateToken`
  - منع دخول الحساب غير النشط

### `controllers/reportController.js`

- `createReport`:
  - ينشئ بلاغ جديد
  - يأخذ `citizen` من `req.user.id` (بدون تكرار بيانات المواطن)
- `getMyReports`:
  - يرجع بلاغات المستخدم الحالي فقط
  - مع `populate` محدود لبيانات المواطن (`fullName`, `phoneNumber`, `role`)

### `middleware/authMiddleware.js`

- `protect`:
  - يقرأ Bearer token
  - يتحقق من JWT
  - يجلب المستخدم ويضعه في `req.user`
  - يرفض token ناقص/غير صالح أو مستخدم غير نشط
- `restrictTo(...roles)`:
  - يتحقق أن `req.user.role` ضمن الأدوار المسموح بها

### `utils/generateToken.js`

- ينشئ JWT بالـ payload:
  - `{ id: userId }`
- يعتمد على:
  - `JWT_SECRET`
  - `JWT_EXPIRES_IN` (اختياري، الافتراضي `7d`)

### `routes/userRoutes.js`

- `POST /api/users/login` (عام)
- `POST /api/users` (create user)
- `GET /api/users` (محمي + `MANAGER|GOVERNOR`)
- `GET /api/users/profile` (محمي)
- `PATCH /api/users/:id` (محمي + `MANAGER|GOVERNOR`)
- `DELETE /api/users/:id` (محمي + `GOVERNOR`)

### `routes/reportRoutes.js`

- `POST /api/reports` (محمي + `CITIZEN`)
- `GET /api/reports/my-reports` (محمي + `CITIZEN`)

### `validators/userValidator.js`

- `createUserValidator`:
  - يتحقق من `fullName/password/phoneNumber/role`
  - `nationalId` إلزامي للمواطن
  - `employeeId` إلزامي للـ staff
- `updateUserValidator`:
  - يتحقق من `id` كـ MongoId
  - يتحقق من الحقول المسموح بها
  - يمنع تحديث `password` من endpoint التحديث

### `utils/enums.js`

- `UserRoles`: `CITIZEN`, `MANAGER`, `TECHNICIAN`, `GOVERNOR`
- `ReportStatus`: `PENDING`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`, `ARCHIVED`
- `IssueCategories` و `UrgencyLevels`

### `postman/UrbanFix-User-Routes.postman_collection.json`

- موجودة وجاهزة لاختبار User APIs.
- ملاحظة: هذه الـ collection ما زالت مركزة على user endpoints فقط، ولم يتم تحديثها بعد لتشمل report endpoints الجديدة.

## 3) ما تم إنجازه زمنيًا (مختصر)

1. بناء entry point وربط Mongo + middlewares + global error handling.
2. إنشاء User module (model/controller/routes/validator).
3. إضافة Postman collection لمسارات المستخدم.
4. حل مشكلة `Route not found: /api/users` بربط الراوت في `index.js`.
5. تفعيل ESM بشكل كامل لحل تعارض CommonJS/ESM.
6. إضافة auth system:
   - token generator
   - `protect` + `restrictTo`
   - `login` endpoint
7. إنشاء Citizen report flow:
   - `createReport`
   - `getMyReports`
   - report routes محمية ومربوطة في السيرفر.

## 4) API Contract الحالي

### System
- `GET /health`

### Users
- `POST /api/users` إنشاء مستخدم
- `POST /api/users/login` تسجيل دخول
- `GET /api/users` قائمة المستخدمين (Manager/Governor)
- `GET /api/users/profile` بروفايل المستخدم الحالي
- `PATCH /api/users/:id` تحديث مستخدم
- `DELETE /api/users/:id` تعطيل/إعادة تفعيل

### Reports (Citizen Module)
- `POST /api/reports` إنشاء بلاغ (CITIZEN فقط)
- `GET /api/reports/my-reports` جلب بلاغات المواطن الحالي

## 5) ملاحظات مهمة

- لا يوجد تكرار لبيانات `fullName` داخل نموذج البلاغ؛ الربط يتم دائمًا عبر `citizen` reference إلى `User`.
- `User.isActive` default حاليًا = `false`، لذا المستخدم الجديد لن يسجل دخول إلا بعد تفعيله.
- يجب وجود `JWT_SECRET` داخل `.env` حتى تعمل المصادقة.
- تم تجنب عرض القيم الحساسة في هذا التقرير.

## 6) فجوات/تحسينات مقترحة

1. إضافة validator خاص بتسجيل الدخول.
2. إضافة validator خاص بإنشاء البلاغات (report validation middleware).
3. تحديث Postman collection لتشمل:
   - `POST /api/users/login`
   - `POST /api/reports`
   - `GET /api/reports/my-reports`
4. توحيد naming/style بين الملفات (خصوصًا single quotes/double quotes في بعض الملفات).
5. إضافة اختبارات تكامل للـ auth + reports.

---

Last verified from actual files in `backend` on current workspace state.
