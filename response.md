# Backend response to `BACKEND_API_REQUIREMENTS.md`

This document answers the requirements and open questions from the frontend-facing spec, aligned with the **current madhuban360-backend** codebase (Express + **PostgreSQL** via Neon).

---

## 1. Database: Neo4j vs what this project uses

**This backend does not use Neo4j.** It uses **PostgreSQL** (hosted on **Neon**). Schema changes are done with **SQL migrations** (`src/db/migrations/`, `npm run migrate up`).

If “no access to the database” only means you cannot open the Neon **dashboard**, you can still develop against the API using a valid `DATABASE_URL` in `.env`. You only need **new tables** when you introduce **new persisted concepts** that are not already modeled (see §6).

---

## 2. Endpoint inventory: what exists vs what the new UI asks for

Legend: **Yes** = implemented in this repo | **Partial** = similar but different contract | **No** = not implemented

### Auth

| Requirement | Status |
|-------------|--------|
| `POST /api/auth/login` | **Yes** — returns `{ success, message?, data: { user, token } }`. Email/username + password supported; mobile + `roleId` mode also exists. |

### Web admin — dashboard

| Requirement | Status |
|-------------|--------|
| `GET /api/dashboard/metrics` | **No** |
| `GET /api/dashboard/sales-pipeline` | **No** |
| `GET /api/dashboard/revenue` | **No** |
| `GET /api/dashboard/alerts` | **No** |
| `GET /api/dashboard/activity` | **No** |

**Insight:** These are **new backend features**. The UI can keep mocking until product defines **data sources** (pure aggregates from `properties` / `users` / `tasks` vs new sales/CRM entities).

### Users & helpers

| Requirement | Status |
|-------------|--------|
| `GET/POST /api/users`, `GET/PUT/PATCH/DELETE /api/users/:id` | **Yes** — `PATCH` and `PUT` both supported for update. |
| `PUT/PATCH .../reset-password` | **Yes** — `PATCH/PUT /api/users/:id/password` and `.../reset-password`. |
| `PATCH /api/users/:id/role` | **Yes** (recently wired). |
| `GET /api/roles`, `GET /api/departments`, `GET /api/departments/:id` | **Yes** |
| `GET /api/users/supervisors`, `managers`, `staff` | **Yes** |

| Requirement | Status |
|-------------|--------|
| `GET /api/users/me`, `PUT /api/users/me`, `PUT .../change-password` | **No** — today the client uses a known user id + admin APIs or derives user from JWT on the client only. **Recommended backend work:** add `GET/PUT /api/users/me` (auth middleware, `userId` from token) and `PUT /api/users/me/password`. |

**User object shape:** `User.toResponse` exposes `id`, `email`, `name`, `username`, `role`, `roleId`, `phone`, `departmentId`, `department`, `supervisorId`, `status`, `lastLoginAt`, etc. **`jobTitle`** is not a first-class field in the current model response; confirm if it maps to an existing column or needs a migration.

### Tasks (admin)

| Requirement | Status |
|-------------|--------|
| `GET /api/tasks` with filters | **Yes** — supports query params including status-related behavior in the task model (see §4). |
| `GET/POST /api/tasks`, `PATCH/DELETE /api/tasks/:id` | **Yes** — admin-only for mutating routes; `PATCH` for update. |
| `PUT /api/tasks/:id` | **Partial** — use **`PATCH`** (uploads use multipart on `PATCH`/`POST`). |
| `PATCH /api/tasks/:id/status` | **No** — status is updated via **`PATCH /api/tasks/:id`** body, not a dedicated `.../status` sub-resource. |
| `POST /api/tasks/:id/approve` / `reject` | **Partial** — canonical is **`PATCH /api/tasks/:id/approve`** with body `{ "approved": true \| false }` (see §3). |

### Properties

| Requirement | Status |
|-------------|--------|
| CRUD + `GET /api/properties/summary` | **Yes** |
| `GET /api/properties/:id?include=floors` | **Yes** — nested floors/zones when `include=floors`. |
| `GET /api/properties/:id/floors`, `.../floors/:floorId/zones` | **Yes** — alternate explicit routes. |

### Property tabs — work orders / assets / reports

| Requirement | Status |
|-------------|--------|
| Work orders from tasks | **Aligned** — backend has tasks; no separate work-order resource. |
| `GET /api/assets`, `GET /api/assets/summary` | **No** — there is **no** assets router in `src/`. A migration history includes an `assets` table, but **REST endpoints were never implemented** (or were removed). |
| `GET /api/reports`, `GET /api/reports/analytics` | **No** |

### Mobile — staff

| Requirement | Status |
|-------------|--------|
| `GET /api/staff/tasks`, `GET .../tasks/:id`, `POST .../complete` | **Yes** |
| `PATCH /api/staff/tasks/:id/status` | **No** — staff progress is driven by **`POST .../complete`** (and supervisor approval flow), not a generic status PATCH. Changing task state may require **`PATCH /api/tasks/:id`** (admin) or the completion/approval flows. |
| Attendance endpoints | **No** |
| `GET /api/staff/notifications`, `PATCH .../read` | **Yes** |
| Profile ` /api/users/me` | **No** (see above) |

### Supervisor

| Requirement | Status |
|-------------|--------|
| `GET /api/supervisor/dashboard`, task list routes | **Yes** |
| `GET /api/supervisor/notifications` + mark read | **Yes** |

### Manager

| Requirement | Status |
|-------------|--------|
| `GET /api/manager/tasks`, supervisors, etc. | **Yes** |
| Approve/reject as `POST .../approve` / `reject` | **Partial** — same as admin: use **`PATCH /api/tasks/:id/approve`**. |

---

## 3. Answers to “Validations / clarifications” (from backend)

### 1) Approve / reject contract

**Canonical for this backend:**

- **`PATCH /api/tasks/:id/approve`**
- **Body:** `{ "approved": true }` (approve) or `{ "approved": false }` (reject / send back)

There is **no** separate `POST .../approve` and `POST .../reject` route and **no** `PATCH .../reject`. The frontend should standardize on **one endpoint + boolean** (or we add thin aliases later for ergonomics only).

**Auth:** `supervisorOrAdmin`-style middleware — supervisor for their team’s tasks, admin broadly.

### 2) Task status canonical list

**Database / API today** (tasks table constraint and usage) centers on lowercase values such as:

`pending`, `in_progress`, `completed`, `overdue`, `pending_approval`

They are **not** the same as the UI’s `TO_DO | IN_PROGRESS | REVIEW | COMPLETED | CANCELLED`.

**Recommendation:**

- Either **map in the frontend** (e.g. `REVIEW` ↔ `pending_approval`, `TO_DO` ↔ `pending`) **or**
- Add a **small mapping layer** in the API responses (preferred long-term for one source of truth).

**`PENDING_APPROVAL`:** Treat as **`pending_approval`** on the wire for this API.

### 3) Staff task completion upload

**Endpoint:** `POST /api/staff/tasks/:id/complete` (multipart).

**Fields:** `before`, `after` (files), `notes` (text). JSON-only completion with notes is also supported where implemented.

**Limits:** See multer / upload middleware config in `src/middleware` (and S3 vs local storage). Frontend should document max size per product.

### 4) Properties floors / zones

**`GET /api/properties/:id?include=floors`** returns the property plus nested floors and zones (see `propertyController.getOne` + `toResponseWithFloorsAndZones`).

**Tasks:** Creation supports **`floorId`** / **`zoneId`** where the task module expects them — use property endpoints to resolve ids for dropdowns.

### 5) Assets & reports response shape

**Not applicable until routes exist.** When implemented, prefer:

`{ "success": true, "data": <payload>, "total"?: number }` to match existing list endpoints (`properties`, `users`).

### 6) Role-based filtering

**JWT carries role; routes use `authMiddleware` + `requireRole` / custom checks.** The frontend should **not** rely on spoofing `role` query params for authorization — backend enforces role.

### 7) Pagination & search

- **Users:** pagination + filters supported (see user list API).
- **Properties:** `page`, `limit`, `search`, etc.
- **Tasks:** list supports filtering via task model/query params — align with `taskController` / `Task.findAll` options.

---

## 4. Do you need more tables?

| Feature area | Need new tables? | Notes |
|--------------|------------------|--------|
| Dashboard **aggregates only** (counts from users/properties/tasks) | **Often no** | Can be computed in SQL/API from existing tables. |
| **Sales pipeline / revenue** as real CRM data | **Yes, likely** | Not modeled in current core schema; needs product schema or integration. |
| **Alerts / activity feed** | **Depends** | Could be derived from tasks/notifications/audit logs, or new `activity_log` / `alerts` tables if you need rich feeds. |
| **Attendance** | **Yes** | No attendance tables or routes in this repo; new table(s) + APIs required. |
| **Reports** persisted with history | **Optional** | Could be generated on the fly first; persist if you need “generated report” history. |
| **Assets** | **Maybe** | If `assets` table exists after migrations, you might **expose APIs** before adding columns; if product needs fields the table lacks, extend with migrations. |

**You do not need Neo4j.** Stay on Postgres unless there is a separate graph use case.

---

## 5. Questions for the frontend team

1. **Statuses:** Confirm whether the Figma **canonical enums** (`TO_DO`, `REVIEW`, …) should become the **API contract** (then backend adds mapping + validation) or the **UI layer only** (map to existing lowercase statuses).
2. **Dashboard:** Which metrics are **must-have for v1** vs placeholder? That decides whether we only aggregate existing tables or build new entities (sales, attendance).
3. **Profile:** Is **`GET/PUT /api/users/me`** required for mobile launch? If yes, prioritize it over cosmetic dashboard endpoints.
4. **Assets tab:** Should assets be **per property**, **global**, and do we need **work-order linkage** or only a simple registry?
5. **Reject vs approve:** Is a **single PATCH** with `approved: false` acceptable for all roles (supervisor/manager), or do you need different copy/behavior per role in the UI only?

---

## 6. Other backend insights

1. **Single source of Postman:** Use `postman/Madhuban360-API.postman_collection.json` for the real routes; align the frontend service layer with **`PATCH /api/tasks/:id/approve`**.
2. **Idempotency / ordering:** Migrations and Neon access are orthogonal to API design — schema changes are tracked in git; coordinate with whoever manages Neon for new migrations in shared environments.
3. **Legacy `/api/supervisors`:** Exists with different auth expectations than `/api/users`; prefer **user APIs** for admin UI consistency.
4. **Scope control:** Implementing **dashboard + attendance + assets + reports + /me** in one go is large; suggest phased delivery: **(A)** contract alignment for tasks/users/properties, **(B)** `/api/users/me`, **(C)** dashboard aggregates, **(D)** attendance, **(E)** assets/reports as needed.

---

## 7. Summary

| Topic | Takeaway |
|-------|----------|
| Neo4j | **Not used** — stack is **PostgreSQL (Neon)**. |
| New tables | Needed for **attendance**, likely for **rich sales/reports** if not mock; **optional** for dashboard if read-only aggregates suffice. |
| Biggest contract gaps | **Dashboard** routes, **assets** routes, **reports** routes, **attendance**, **`/api/users/me`**, **`PATCH` vs `POST` for approve/reject**, **status enum naming**. |
| Approve/reject | Use **`PATCH /api/tasks/:id/approve`** + `{ approved: boolean }`. |

This file can stay next to `BACKEND_API_REQUIREMENTS.md` and be updated as endpoints are implemented.
