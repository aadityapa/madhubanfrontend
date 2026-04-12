# Backend API Requirements (from new UI)

This document is intended for the backend engineer/agent. It summarizes **what the frontend UI now expects** across:
- **Web Admin** (`apps/web-admin`)
- **Mobile** (`apps/mobile`) by role: **Staff**, **Supervisor**, **Manager**

It also lists **open questions / validations needed** where the backend contract is unclear or inconsistent in the reference API files.

## Global expectations

### Auth & headers
- **Bearer auth**: Frontend sends `Authorization: Bearer <token>` for protected endpoints.
- **Login**
  - `POST /api/auth/login`
  - Expected response shape (frontend tolerates variations, but prefer this):

```json
{
  "success": true,
  "data": {
    "token": "jwt-or-token",
    "user": { "id": "…", "name": "…", "email": "…", "role": "admin|manager|supervisor|staff", "lastLoginAt": "ISO" }
  }
}
```

### Common response conventions (preferred)
- Success:

```json
{ "success": true, "data": <payload> }
```

- Error:

```json
{ "success": false, "message": "Human readable message", "error": "Optional machine detail" }
```

### Enumerations (important)
- **Task status** (canonical): `TO_DO | IN_PROGRESS | REVIEW | COMPLETED | CANCELLED`
  - The UI also references `PENDING_APPROVAL` (treated as `REVIEW`).
- **User roles**: `admin | manager | supervisor | staff`
  - Web-admin displays title-case labels; backend can stay lowercase.
- **User status**: `active | suspended | inactive`

---

## Web Admin (web-admin)

Routes are defined in `apps/web-admin/src/App.tsx`:
- `/login` (public)
- `/dashboard`, `/users`, `/properties`, `/tasks` (protected)
- `/hrms`, `/sales`, `/facilities`, `/legal`, `/accounts`, `/store`, `/reports` (currently “Coming soon” placeholders)

### 1) Login page (`/login`)
- `POST /api/auth/login`
  - Body: `{ "email": string, "password": string }`
  - Returns token + user

### 2) Dashboard page (`/dashboard`)
The dashboard UI expects these endpoints (even if initially mocked, we want backend parity):
- `GET /api/dashboard/metrics`
- `GET /api/dashboard/sales-pipeline?period=6m|…`
- `GET /api/dashboard/revenue?period=6m|…`
- `GET /api/dashboard/alerts`
- `GET /api/dashboard/activity`

Suggested shapes:

**Metrics**
```json
{
  "totalProperties": 0,
  "activeProperties": 0,
  "inactiveProperties": 0,
  "totalUsers": 0,
  "admins": 0,
  "staff": 0,
  "openTasks": 0,
  "dueToday": 0,
  "attendancePercent": 0
}
```

**Sales pipeline**
```json
{
  "data": [{ "name": "Leads", "value": 0 }],
  "summary": { "value": 0, "trend": 0, "label": "from last month" }
}
```

**Revenue**
```json
{
  "data": [{ "name": "JAN", "revenue": 0 }],
  "summary": { "value": 0, "trend": 0, "label": "Year-to-date" }
}
```

**Alerts**
```json
[
  { "id": "…", "title": "…", "reportedBy": "…", "timeAgo": "…", "urgency": "URGENT|MEDIUM|LOW", "icon": "building|light|water|..." }
]
```

**Activity**
```json
[
  { "id": "…", "text": "…", "source": "System|Personnel|…", "timeAgo": "…" }
]
```

### 3) User Management (`/users`)
CRUD + dropdown helpers.

**User CRUD**
- `GET /api/users?limit=9999&page=1` (frontend requests high limit)
- `GET /api/users/:id`
- `POST /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`
- `PUT /api/users/:id/reset-password` (optional but referenced)

**Dropdown helpers**
- `GET /api/roles`
- `GET /api/departments`
- `GET /api/departments/:id`
- For assigning reporting structure / hierarchy (optional, used in reference):
  - `GET /api/users/supervisors`
  - `GET /api/users/managers`
  - `GET /api/users/staff` (also used by task assignment UI)

Minimum user shape expected by UI:
```json
{
  "id": "string-or-number",
  "name": "Full Name",
  "email": "email",
  "phone": "string?",
  "role": "admin|manager|supervisor|staff",
  "status": "active|suspended|inactive",
  "jobTitle": "string?",
  "department": "string?",
  "lastLoginAt": "ISO?"
}
```

### 4) Task Manager (`/tasks`)
Kanban-style management.

- `GET /api/tasks` supports query params:
  - `status`, `priority`, `assigneeId`, `dueDate`
- `GET /api/tasks/:id`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `PATCH /api/tasks/:id/status`
- `DELETE /api/tasks/:id`
- Approval flow (see validation section):
  - `POST /api/tasks/:id/approve`
  - `POST /api/tasks/:id/reject`

Create/Update expects to support these fields (UI currently sends a subset; safe to accept extras):
```json
{
  "taskName": "string",
  "description": "string",
  "assigneeId": "string",
  "priority": "NORMAL|HIGH|URGENT|LOW|…",
  "propertyId": "string?",
  "departmentId": "string?",
  "startDate": "YYYY-MM-DD?",
  "endDate": "YYYY-MM-DD?",
  "startTime": "HH:mm or ISO?",
  "endTime": "HH:mm or ISO?",
  "timeDuration": "string or number?",
  "frequency": "string?",
  "roomNumber": "string?",
  "locationFloor": "string?",
  "instructions": ["string"],
  "attachments": ["string|url"] or multipart
}
```

### 5) Property Management (`/properties`)
Tabs: **Work Orders**, **Asset Tracking**, **Reports**.

#### Properties CRUD
- `GET /api/properties`
- `GET /api/properties/:id`
- `GET /api/properties/:id?include=floors` (nested floors/zones)
- `POST /api/properties` (supports JSON and/or multipart)
- `PATCH /api/properties/:id` (supports JSON and/or multipart)
- `DELETE /api/properties/:id`
- `GET /api/properties/summary`

Preferred property shape:
```json
{
  "id": "…",
  "propertyName": "…",
  "propertyType": "COMMERCIAL|RESIDENTIAL|INDUSTRIAL|…",
  "imageUrl": "https://…?",
  "location": "City, State?",
  "city": "…?",
  "stateProvince": "…?",
  "amcStatus": "ACTIVE|EXPIRING_SOON|EXPIRED|…"
}
```

#### Work Orders tab
For now the frontend derives “work orders” from **tasks**:
- Uses `GET /api/tasks` and maps task → work order rows.
If backend later introduces a dedicated work-order resource, we can swap.

#### Asset Tracking tab
- `GET /api/assets`
- `GET /api/assets/summary`

Suggested asset shape:
```json
{
  "id": "…",
  "name": "…",
  "location": "…",
  "condition": "excellent|good|fair|poor",
  "lastMaintenance": "ISO or display string",
  "nextMaintenance": "ISO or display string",
  "overdue": true
}
```

#### Reports tab
- `GET /api/reports`
- `GET /api/reports/analytics`

Suggested report list item:
```json
{ "id": "…", "name": "…", "category": "Financial|Operational|Sustainability|…", "generatedDate": "ISO" }
```

Analytics can return whatever KPI + chart shape backend chooses, but should be consistent.

---

## Mobile (by role)

### Staff (end user)

#### Staff tasks
- `GET /api/staff/tasks?status=<optional>`
  - Used by `apps/mobile/src/screens/tabs/TasksScreen.tsx`
- `GET /api/staff/tasks/:id`
- `PATCH /api/staff/tasks/:id/status` body: `{ "status": "IN_PROGRESS|COMPLETED|..." }`
- `POST /api/staff/tasks/:id/complete` (multipart)
  - fields: `before` (file), `after` (file), `notes` (string?)

#### Attendance
- `POST /api/attendance/check-in` body: `{ "location": "string" }`
- `POST /api/attendance/check-out` body: `{}`
- `GET /api/attendance/today` → `{ checkedIn: boolean, checkInAt?: ISO, checkOutAt?: ISO }`

#### Profile
- `GET /api/users/me`
- `PUT /api/users/me`
- `PUT /api/users/me/change-password`

#### Notifications (reference exists; not fully wired everywhere yet)
- `GET /api/staff/notifications`
- `PATCH /api/staff/notifications/:id/read`

### Supervisor
- `GET /api/supervisor/dashboard`
- `GET /api/supervisor/tasks/completed`
- `GET /api/supervisor/tasks/pending`
- `GET /api/supervisor/tasks/all`
- `GET /api/supervisor/tasks/:id`

Approval/reject endpoints for supervisor need backend confirmation (see below).

### Manager
- Uses generic `/api/tasks` heavily (overview + KPIs can be derived).
- Approvals:
  - `POST /api/tasks/:id/approve`
  - `POST /api/tasks/:id/reject`
- Reports:
  - `GET /api/reports/analytics?period=weekly|monthly|...`

---

## Validations / clarifications needed (please confirm)

1) **Approve/Reject contract mismatch**
   - Reference `taskService`: `POST /api/tasks/:id/approve` and `POST /api/tasks/:id/reject`
   - Reference `supervisorService`: `PATCH /api/tasks/:id/approve` with `{ approved: true|false }`
   - Please confirm which one is canonical. Frontend can adapt, but we need one consistent API.

2) **Task status canonical list**
   - Confirm allowed statuses and whether `PENDING_APPROVAL` exists.
   - Confirm whether `/api/tasks/:id/status` expects `TO_DO` vs `pending` etc.

3) **Staff task completion upload**
   - Confirm multipart field names (`before`, `after`, `notes`) and max file size/type.
   - Confirm if backend stores URLs on task record (and the response shape after upload).

4) **Properties floors/zones**
   - What is the expected schema for `GET /api/properties/:id?include=floors`?
   - Are floors/zones needed now for task creation (floorId/zoneId), or later?

5) **Assets & reports**
   - Confirm whether `/api/assets` returns `{ list, total }` or `{ data: { list, total } }` or plain array.
   - Confirm `/api/reports/analytics` response shape (KPIs + chart series).

6) **Role-based filtering**
   - Are endpoints auto-filtered by the token’s role (recommended), or should frontend send explicit `role` query params?

7) **Pagination & search**
   - `GET /api/users?limit=&page=` is used; do tasks/properties/assets also support pagination/search server-side?

