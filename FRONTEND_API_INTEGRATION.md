# Frontend integration guide — implementation, routing & API reference

This document describes **how to call** the new APIs from a web or mobile client, **exact paths and methods**, **request/response bodies**, and how to fix **404** issues.

**Backend entry point:** run **`npm run dev`** or **`npm start`**. These execute **`src/server.js`**, which registers all routes below. If you start a different file (e.g. an old `app.js` that does not mount the same routers), new routes will **404**.

---

## 1. Base URL, routing & headers

### Base URL

| Environment | Example |
|-------------|---------|
| Local API | `http://localhost:3000` |
| Deployed | `https://your-api-domain.com` |

Every route in this doc is **appended to the base URL** with **no trailing slash** on the base (avoid `http://localhost:3000/` + path duplication issues).

### Path prefix

All JSON APIs use the prefix **`/api`**.

| Wrong | Correct |
|-------|---------|
| `http://localhost:3000/dashboard/metrics` | `http://localhost:3000/api/dashboard/metrics` |
| `http://localhost:3000/users/me` | `http://localhost:3000/api/users/me` |

### Required headers (protected routes)

| Header | Value |
|--------|--------|
| `Content-Type` | `application/json` (for JSON bodies) |
| `Authorization` | `Bearer <access_token>` |

Omitting `Authorization` on protected routes returns **401**, not 404.

### CORS (browser dev)

Set `FRONTEND_ORIGIN` in the backend `.env` to your dev URL (e.g. `http://localhost:5173`) or the server allows `*` when unset. If the browser shows CORS errors, fix origin — that is different from 404.

---

## 2. How to implement on the frontend (patterns)

### 2.1 Environment variable

Point one variable at the API root **without** a trailing slash:

```env
VITE_API_URL=http://localhost:3000
```

Use:

```text
`${import.meta.env.VITE_API_URL}/api/dashboard/metrics`
```

(React: `REACT_APP_API_URL`, etc.)

### 2.2 `fetch` example (GET with auth)

```javascript
const baseUrl = import.meta.env.VITE_API_URL; // no trailing slash
const token = localStorage.getItem('token');

const res = await fetch(`${baseUrl}/api/users/me`, {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const json = await res.json();
if (!res.ok) {
  console.error(json.message || res.status);
  return;
}
// json.success === true, json.data === user object
```

### 2.3 `fetch` example (POST JSON)

```javascript
const res = await fetch(`${baseUrl}/api/attendance/check-in`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ location: 'Main gate' }),
});
const json = await res.json();
```

### 2.4 Vite dev proxy (optional — avoids CORS during local dev)

`vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

Then the frontend can call **`/api/...`** with a **relative** URL (same origin as Vite). Ensure you are not double-prefixing (`VITE_API_URL` + `/api` twice).

### 2.5 Multipart (staff task start / complete)

Use `FormData`; **do not** set `Content-Type` manually (browser sets boundary):

```javascript
const form = new FormData();
form.append('before', fileInput.files[0]);
form.append('notes', 'Optional notes');

await fetch(`${baseUrl}/api/staff/tasks/${taskId}/start`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: form,
});
```

---

## 3. Troubleshooting **404 Not Found**

| Cause | What to check |
|-------|----------------|
| **Wrong path** | Must include **`/api`** prefix (see §1). |
| **Trailing slash mismatch** | Express routes are registered **without** a trailing slash; avoid `.../metrics/` if your client normalizes badly. |
| **Wrong HTTP method** | e.g. `GET /api/attendance/check-in` → **404** (method must be **POST**). Use exact method from tables below. |
| **Wrong server process** | Run **`npm run dev`** from **`madhuban360-backend`** so **`src/server.js`** loads. Confirm `GET /health` returns JSON. |
| **Old code / branch** | `src/server.js` must contain `app.use('/api/dashboard', dashboardRoutes)` etc. Pull latest or re-clone. |
| **Proxy / gateway** | Production reverse proxy must forward `/api/*` to the Node app. |
| **Not 404 but looks broken** | **401** = missing/invalid token. **403** = wrong role (e.g. dashboard requires **`admin`** in JWT). |

**Smoke test in terminal (replace `TOKEN`):**

```bash
curl -s http://localhost:3000/health
curl -s -H "Authorization: Bearer TOKEN" http://localhost:3000/api/users/me
```

If `curl` works but the browser 404s, the problem is **base URL** or **proxy** in the frontend build.

---

## 4. Backend route map (Express)

Mounted in **`src/server.js`**:

| Mount path | Router file |
|------------|-------------|
| `/api/users` | `src/routes/userRoutes.js` |
| `/api/dashboard` | `src/routes/dashboardRoutes.js` |
| `/api/reports` | `src/routes/reportRoutes.js` |
| `/api/assets` | `src/routes/assetRoutes.js` |
| `/api/attendance` | `src/routes/attendanceRoutes.js` |
| `/api/tasks` | `src/routes/taskRoutes.js` |
| `/api/staff` | `src/routes/staffRoutes.js` |

---

## 5. API reference — method, path, body, response

`base` = your API base **without** `/api` (e.g. `http://localhost:3000`). Full URL = `base + path`.

### 5.1 Profile — `/api/users`

**Auth:** JWT for all three.

| Method | Full path | Request body | Success response (shape) |
|--------|-----------|--------------|---------------------------|
| `GET` | `/api/users/me` | — | `{ "success": true, "data": { ...user, "stats"?, "roleTier"? } }` |
| `PUT` | `/api/users/me` | `{ "name"?, "username"?, "email"?, "phone"? }` | `{ "success": true, "message": "...", "data": { ...user } }` |
| `PUT` | `/api/users/me/password` | `{ "currentPassword": "string", "newPassword": "string" }` | `{ "success": true, "message": "...", "data": { ...user } }` — **re-login required** |
| `PUT` | `/api/users/me/change-password` | same as password | alias of above |

**Example response (`GET /me`) — abbreviated:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin",
    "role": "admin",
    "phone": "9999999999",
    "status": "active",
    "lastLoginAt": "2026-03-31T12:00:00.000Z"
  }
}
```

---

### 5.2 Dashboard — `/api/dashboard`

**Auth:** JWT + role **`admin`** (string in token must be `admin`; `super_admin` may get **403** unless backend is extended).

| Method | Path | Query | Success response |
|--------|------|-------|------------------|
| `GET` | `/api/dashboard/metrics` | — | `{ "success": true, "data": { "totalProperties", "activeProperties", "inactiveProperties", "totalUsers", "admins", "staff", "openTasks", "dueToday", "attendancePercent" } }` |
| `GET` | `/api/dashboard/alerts` | — | `{ "success": true, "data": [ { "id", "title", "reportedBy", "timeAgo", "urgency", "icon" } ] }` |
| `GET` | `/api/dashboard/activity` | — | `{ "success": true, "data": [ { "id", "text", "source", "timeAgo" } ] }` |
| `GET` | `/api/dashboard/sales-pipeline` | `period` optional: `6m`, `30d`, `90d`, `12m` | `{ "success": true, "data": { "data": [ { "name", "value" } ], "summary": { "value", "trend", "label" } } }` **← nested `data.data`** |
| `GET` | `/api/dashboard/revenue` | `period` optional | `{ "success": true, "data": { "data": [ { "name", "revenue" } ], "summary": { "value", "trend", "label" } } }` |

**Example (`GET /api/dashboard/metrics`):**

```json
{
  "success": true,
  "data": {
    "totalProperties": 3,
    "activeProperties": 2,
    "inactiveProperties": 0,
    "totalUsers": 12,
    "admins": 1,
    "staff": 5,
    "openTasks": 8,
    "dueToday": 1,
    "attendancePercent": 0
  }
}
```

---

### 5.3 Reports — `/api/reports`

**Auth:** JWT + role **`admin`**, **`manager`**, or **`supervisor`**.

| Method | Path | Query | Success response |
|--------|------|-------|------------------|
| `GET` | `/api/reports` | — | `{ "success": true, "data": [ { "id", "name", "category", "generatedDate", "recordCount" } ] }` |
| `GET` | `/api/reports/analytics` | `period` e.g. `weekly`, `monthly`, `7d` | `{ "success": true, "data": { "period", "kpis", "taskStatusBreakdown", "priorityBreakdown" } }` |

---

### 5.4 Assets (stub) — `/api/assets`

**Auth:** JWT + **`admin`** or **`manager`**.

| Method | Path | Success response |
|--------|------|------------------|
| `GET` | `/api/assets` | `{ "success": true, "data": [], "total": 0, "meta": { "stub": true, "persistence": "disabled_until_assets_table_returns" } }` |
| `GET` | `/api/assets/summary` | `{ "success": true, "data": { "totalAssets", "overdue", "dueSoon", "inGoodCondition" }, "meta": { ... } }` |

---

### 5.5 Attendance (stub) — `/api/attendance`

**Auth:** JWT (any logged-in user).

| Method | Path | Request body | Success response |
|--------|------|--------------|------------------|
| `POST` | `/api/attendance/check-in` | `{ "location"?: "string" }` | `{ "success": true, "data": { "checkedIn", "checkInAt", "checkOutAt", "location" }, "meta": { "persistent": false, "storage": "memory" } }` |
| `POST` | `/api/attendance/check-out` | `{}` | same shape; `checkOutAt` set |
| `GET` | `/api/attendance/today` | — | same `data` + `meta` |

---

### 5.6 Admin tasks — `/api/tasks`

**Auth:** varies — see below.

| Method | Path | Body | Role |
|--------|------|------|------|
| `PATCH` | `/api/tasks/:id/status` | `{ "status": "pending" \| "in_progress" \| ... }` | **admin** |
| `PATCH` | `/api/tasks/:id/approve` | `{ "approved": true \| false }` | **admin** or **supervisor** (assignee’s supervisor) |
| `POST` | `/api/tasks/:id/approve` | optional `{ "approved": true }` | same |
| `POST` | `/api/tasks/:id/reject` | — | same (forces reject) |

**Status aliases (in body):** `TO_DO` → `pending`, `IN_PROGRESS` → `in_progress`, `REVIEW` / `PENDING_APPROVAL` → `pending_approval`, etc.

**Success:** `{ "success": true, "data": { ...task } }`

---

### 5.7 Staff tasks — `/api/staff`

**Auth:** JWT + **`staff`** or **`housekeeping`**.

| Method | Path | Body | Success |
|--------|------|------|---------|
| `POST` | `/api/staff/tasks/:id/start` | `multipart/form-data`: `before` (files), `notes`; or JSON `{ "notes" }` | `{ "success": true, "data": { ...task detail } }` |
| `PATCH` | `/api/staff/tasks/:id/status` | `{ "status": "IN_PROGRESS" \| "REVIEW" \| ... }` | delegates to start/complete |
| `POST` | `/api/staff/tasks/:id/complete` | multipart: `before`, `after`, `notes` or JSON notes only | `{ "success": true, "data": { ... } }` |

**Common mistake:** using `/api/tasks/...` for staff actions — staff flows are under **`/api/staff/tasks/...`**.

---

## 6. Implementation plan vs codebase (summary)

| Area | Status |
|------|--------|
| Profile `/api/users/me` | Implemented |
| Dashboard `/api/dashboard/*` | Implemented |
| Reports `/api/reports/*` | Implemented |
| Assets stub `/api/assets/*` | Implemented |
| Attendance stub `/api/attendance/*` | Implemented |
| Task approve / status | Implemented |
| Staff start / status / complete | Implemented |

---

## 7. What to give the frontend team

1. **This file** — routing, bodies, responses, 404 fixes, `fetch` examples.  
2. **`postman/Madhuban360-API.postman_collection.json`** — import and set `baseUrl`.  
3. **Backend `.env`:** `JWT_SECRET`, `DATABASE_URL`, optional `FRONTEND_ORIGIN`.

---

## 8. Document history

- Expanded with frontend implementation patterns, exact paths, nested `data` shapes, and 404 troubleshooting.
