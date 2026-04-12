# Backend Handoff Spec (new UI + flows + required APIs)

This document is meant to be pasted/handed to the backend engineer/agent so they can create an implementation plan **based on their codebase**.

It consolidates:
- The **current UI flows** (web-admin + mobile roles)
- The **new content** introduced by the redesign
- The **API contract we need** (including what exists vs what needs building)
- My **inputs, concerns, and validations** to resolve early

References used on frontend side:
- `BACKEND_API_REQUIREMENTS.md` (frontend expectations)
- `response.md` (backend’s current-state answers; canonical routes; what is missing)

---

## 1) Roles & hierarchy (expected workflow)

### Roles
- **Staff** (mobile): executes tasks; captures before/after proof
- **Supervisor** (mobile/web): oversees a team; reviews completion proof; approves/rejects
- **Manager** (mobile/web): higher-level oversight; can approve/reject; reporting/analytics
- **Admin** (web-admin): can create/update users, tasks, properties; global visibility

### Hierarchy expectations
- Staff members are assigned under a Supervisor (and/or Manager) via `supervisorId` / reporting structure.
- Approval permissions should be enforced by backend (RBAC + scoping):
  - Supervisor can only act on tasks for their staff/team.
  - Admin/Manager can act globally (or per org rules).

---

## 2) Core task lifecycle (IMPORTANT — proof & approval flow)

This is the most important “new design” behavior to support.

### Task lifecycle (v1)

1. **Admin creates task** (web-admin Task Manager / Property Work Orders)
   - Assign to a Staff user (`assigneeId`) or a team.
2. **Staff sees assigned tasks** on mobile (`/api/staff/tasks`)
3. **Staff starts task**
   - UI flow requires a **Before photo** capture at start (proof of initial condition).
   - After submitting before proof, task becomes **Ongoing** in the UI.
4. **Staff completes task**
   - UI prompts for an **After photo** capture.
   - Staff uploads after photo (proof of completion).
5. **Supervisor review**
   - Supervisor sees tasks pending approval (review queue).
   - Supervisor can:
     - **Approve** → task becomes Completed
     - **Reject** → task returns to In Progress / rework state (backend-defined)
6. (Optional) **Manager review** / escalation / reporting

### Required backend support for the lifecycle

#### Proof uploads (before/after)
- Endpoint already confirmed in backend response:
  - `POST /api/staff/tasks/:id/complete` (multipart)
  - Fields: `before`, `after` (files), `notes` (string)
- Expectation:
  - It should support **before only** submission (start) and **after later** submission (finish), OR separate endpoints for start/finish.

#### Status transitions
Backend response indicates:
- Canonical task status values today (DB/API): `pending`, `in_progress`, `completed`, `overdue`, `pending_approval`
- Approval uses:
  - `PATCH /api/tasks/:id/approve` with `{ approved: true|false }`

**Clarification needed** (choose one):
- **Option A (recommended):** keep `POST /api/staff/tasks/:id/complete` for proof, and also provide a staff-safe “start” endpoint:
  - `POST /api/staff/tasks/:id/start` → sets `in_progress`, stores `startedAt`, stores `before` photo (or references uploaded proof)
- **Option B:** add `PATCH /api/staff/tasks/:id/status` specifically for Staff
  - Only allow permitted transitions (e.g., `pending` → `in_progress`)
- **Option C:** treat “start” as UI-only until completion upload (not recommended if we want persistence / analytics).

---

## 3) Current UI pages (what data they need)

### A) Web Admin (web-admin)

#### `/login`
- `POST /api/auth/login`
- Response: `{ success, data: { user, token } }`

#### `/dashboard` (Admin dashboard)
Backend response says these are **NOT implemented** yet:
- `GET /api/dashboard/metrics`
- `GET /api/dashboard/alerts`
- `GET /api/dashboard/activity`
- `GET /api/dashboard/sales-pipeline`
- `GET /api/dashboard/revenue`

**Input:** For v1, we can derive metrics/alerts/activity from existing tables (`users`, `tasks`, `properties`) without introducing CRM entities.

#### `/users` (User Management)
Backend response says these exist:
- `GET /api/users` (+ filters/pagination)
- `GET /api/users/:id`
- `POST /api/users`
- `PATCH /api/users/:id` (and `PUT` also supported)
- `DELETE /api/users/:id`
- Password routes exist: `.../reset-password` and/or `.../password`
Helpers exist:
- `GET /api/roles`
- `GET /api/departments`, `GET /api/departments/:id`
- `GET /api/users/supervisors`, `/managers`, `/staff`

**Note:** `jobTitle` is not first-class currently; confirm mapping or migration.

#### `/tasks` (Task Manager)
Backend response says:
- `GET /api/tasks` exists
- `PATCH /api/tasks/:id` exists for updates
- No `PATCH /api/tasks/:id/status` (status updated via PATCH `/api/tasks/:id`)
- Approve/reject canonical: `PATCH /api/tasks/:id/approve` `{ approved: boolean }`

**Input:** Add a tiny alias route `PATCH /api/tasks/:id/status` for frontend ergonomics (optional but helpful).

#### `/properties` (Property Management)
Backend response says:
- Properties CRUD + summary exist: `/api/properties`, `/api/properties/summary`
- Floors/zones supported via:
  - `GET /api/properties/:id?include=floors`
  - `GET /api/properties/:id/floors`
  - `GET /api/properties/:id/floors/:floorId/zones`

Backend response says missing:
- `/api/assets`, `/api/assets/summary`
- `/api/reports`, `/api/reports/analytics`

Work Orders tab uses tasks (no separate work-order resource).

---

### B) Mobile (mobile app)

#### Staff
- Tasks list: `GET /api/staff/tasks`
- Task detail: `GET /api/staff/tasks/:id`
- Completion proof: `POST /api/staff/tasks/:id/complete` (multipart: `before`, `after`, `notes`)
- Notifications exist:
  - `GET /api/staff/notifications`
  - `PATCH /api/staff/notifications/:id/read`
- Attendance missing (must be built):
  - `POST /api/attendance/check-in`
  - `POST /api/attendance/check-out`
  - `GET /api/attendance/today`

#### Supervisor
Backend response says these exist:
- `GET /api/supervisor/dashboard`
- Supervisor task list routes
- Supervisor notifications
Approval flow:
- `PATCH /api/tasks/:id/approve` `{ approved: true|false }` (canonical)

#### Manager
Backend response says manager routes exist and use the same approval route.

#### Profile (`/api/users/me`)
Backend response says missing:
- `GET /api/users/me`, `PUT /api/users/me`, `PUT /api/users/me/password`

**Input:** This is a very high-value addition for mobile + general identity consistency.

---

## 4) What needs to be built (from backend response)

### Must-have for new design (recommended order)

1) **Task lifecycle support for Staff “Start → Before → Ongoing → After → Review → Approve/Reject”**
   - Decide and implement Staff “start” persistence mechanism (see §2).
   - Ensure `POST /api/staff/tasks/:id/complete` supports before-only and after-only submissions (or split endpoints).
   - Ensure supervisor approval route is stable: `PATCH /api/tasks/:id/approve` `{ approved }`.

2) **`/api/users/me`**
   - `GET /api/users/me`
   - `PUT /api/users/me`
   - `PUT /api/users/me/password`

3) **Attendance**
   - New table(s) + routes:
     - `POST /api/attendance/check-in`
     - `POST /api/attendance/check-out`
     - `GET /api/attendance/today`

4) **Assets**
   - Implement routers:
     - `GET /api/assets`
     - `GET /api/assets/summary`
   - Decide if `assets` table already exists from migrations; extend only if needed.

5) **Reports**
   - Implement:
     - `GET /api/reports`
     - `GET /api/reports/analytics`
   - v1 can be computed (no new tables) unless report history is required.

6) **Dashboard endpoints**
   - Implement `/api/dashboard/*` using aggregates from existing data.
   - Defer sales/revenue if not modeled.

---

## 5) My questions / concerns to validate early

1) **Staff start behavior**
   - Without a staff-safe status endpoint, how do we persist “started / ongoing”?
   - Proposed minimal: `POST /api/staff/tasks/:id/start` (sets `in_progress`, stores `startedAt`, optionally requires `before` photo).

2) **Proof uploads partial completion**
   - Confirm if backend supports:
     - `complete` with only `before`
     - later `complete` with only `after`
   - If not: split endpoints:
     - `POST /api/staff/tasks/:id/before`
     - `POST /api/staff/tasks/:id/after`

3) **Status mapping**
   - Confirm whether backend will keep lowercase statuses and frontend maps,
     or backend will normalize output for frontend.

4) **Rejection semantics**
   - When `approved: false`, should task go to `in_progress` (rework) or `pending`?
   - Should rejection require a reason (string)?

5) **Task scoping**
   - Confirm supervisor can only approve tasks belonging to their team (enforced by backend).

6) **jobTitle field**
   - Does it exist today? If not, do we add column + migrations?

---

## 6) Acceptance criteria (what “done” looks like)

### Staff flow acceptance
- Staff can:
  - See tasks
  - Start a task (backend persists it)
  - Upload before proof
  - See an ongoing task after before proof
  - Upload after proof
  - Task moves into supervisor review state (`pending_approval`)

### Supervisor flow acceptance
- Supervisor sees queue of tasks pending approval.
- Supervisor approves/rejects via `PATCH /api/tasks/:id/approve` `{ approved }`.

### Admin flow acceptance
- Admin can create tasks/users/properties and see them reflected in UI.

---

## 7) Notes for backend agent
- Backend stack: **Express + Postgres (Neon)**; changes via SQL migrations in `src/db/migrations/`.
- Please keep API responses consistent:
  - `{ success: true, data: ... }` on success
  - `{ success: false, message: "...", error?: "..." }` on error

