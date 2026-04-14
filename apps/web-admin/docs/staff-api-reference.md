# Madhuban Staff API Reference

This document is generated from the backend route handlers in `app/api/staff` and cross-checked against `postman/Madhuban-Backend.postman_collection.json`.

Base URL:

```text
http://localhost:3000
```

Base API prefix:

```text
/api
```

Auth notes:

- All staff endpoints require `Authorization: Bearer <token>`.
- The token must belong to a user whose role is `staff`.
- Date-based staff APIs use IST calendar-day normalization internally.

---

## 1. Auth

### 1.1 POST `/api/auth/login`

Purpose: Login as staff and get a JWT token.

Auth required: No

Request body:

```json
{
  "email": "staff@example.com",
  "password": "your-password"
}
```

Body fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `email` | `string` | Yes | Must be a valid email |
| `password` | `string` | Yes | Non-empty |

Success response `200`:

```json
{
  "message": "Login successful.",
  "token": "jwt-token",
  "user": {
    "id": 7,
    "name": "Staff User",
    "email": "staff@example.com",
    "role": "staff"
  }
}
```

Error responses:

- `400`: `{"message":"Invalid request body."}`
- `401`: `{"message":"Invalid email or password."}`
- `500`: `{"message":"Something went wrong."}`

---

## 2. Profile

### 2.1 GET `/api/staff/profile`

Purpose: Fetch the mobile profile payload for the logged-in staff user.

Auth required: Yes

Role access:

- `staff` only

Headers:

```text
Authorization: Bearer <token>
```

Query params: None

Success response `200`:

```json
{
  "data": {
    "staff_id": 7,
    "full_name": "Amit Kumar",
    "email": "amit@example.com",
    "initials": "AK",
    "role": "STAFF",
    "is_active": true,
    "status": "ACTIVE",
    "profile_picture_url": null,
    "stats": {
      "functions": 3,
      "zones": 5,
      "locations": 2
    },
    "assignment_details": {
      "assigned_checker_id": 3,
      "assigned_checker_name": "Default Supervisor",
      "default_tasks_per_day": 6,
      "is_eligible_for_attendance_incentive": true
    },
    "assigned_functions": [
      {
        "function_name": "Cleaning",
        "is_primary": true,
        "status": "Active",
        "zones": [
          {
            "name": "Reception",
            "floor": "Floor 1",
            "priority": "High"
          }
        ]
      }
    ],
    "current_assignments": {
      "shift": "Morning",
      "shift_code": "MORNING",
      "tasks": [
        {
          "area": "Reception",
          "floor": "Floor 1",
          "description": "Deep clean reception area"
        }
      ]
    },
    "skills_and_certifications": []
  }
}
```

Response sections:

| Field | Type | Notes |
| --- | --- | --- |
| `stats` | `object` | Counts of distinct functions, zones, and locations |
| `assignment_details` | `object` | Supervisor/checker assignment and task/day summary |
| `assigned_functions` | `array` | Grouped current active assignments by task title |
| `current_assignments` | `object` | Current shift and today's task summaries |
| `skills_and_certifications` | `string[]` | Always empty in current implementation |

Error responses:

- `401`: `{"message":"Unauthorized."}`
- `403`: `{"message":"Not allowed."}`
- `404`: `{"message":"User not found."}`

Implementation notes:

- `status` is derived from whether there are active assignments overlapping today.
- `profile_picture_url` is currently always `null`.
- `is_eligible_for_attendance_incentive` is `true` when today's attendance row has `status === "PRESENT"`.

---

## 3. Dashboard

### 3.1 GET `/api/staff/dashboard`

Purpose: Fetch a compact task-count dashboard for today or a specific date.

Auth required: Yes

Role access:

- `staff` only

Headers:

```text
Authorization: Bearer <token>
```

Query params:

| Param | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `date` | `string` | No | today | Accepts `YYYY-MM-DD` or ISO date |

Examples:

```text
/api/staff/dashboard
/api/staff/dashboard?date=2026-04-14
```

Success response `200`:

```json
{
  "data": {
    "date": "2026-04-14T00:00:00.000Z",
    "shift": "MORNING",
    "counts": {
      "assigned": 6,
      "completed": 2,
      "remaining": 4
    },
    "actionNeeded": {
      "criticalPending": 3
    }
  }
}
```

Response fields:

| Field | Type | Notes |
| --- | --- | --- |
| `date` | `string` | Normalized IST day as ISO string |
| `shift` | `MORNING \| EVENING \| NIGHT` | Derived from current IST time |
| `counts.assigned` | `number` | Total daily tasks for that date |
| `counts.completed` | `number` | Daily tasks with `status = COMPLETED` |
| `counts.remaining` | `number` | `assigned - completed` |
| `actionNeeded.criticalPending` | `number` | Pending tasks with priority `HIGH` or `CRITICAL` |

Error responses:

- `401`: `{"message":"Unauthorized."}`
- `403`: `{"message":"Not allowed."}`
- `400`: `{"message":"Invalid query params."}` or `{"message":"Invalid date. Use YYYY-MM-DD or ISO date."}`

---

## 4. Attendance

### 4.1 GET `/api/staff/attendance`

Purpose: Get staff attendance status for today or a specific date.

Auth required: Yes

Role access:

- `staff` only

Headers:

```text
Authorization: Bearer <token>
```

Query params:

| Param | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `date` | `string` | No | today | Accepts `YYYY-MM-DD` or ISO date |

Success response `200`:

```json
{
  "data": {
    "workDate": "2026-04-14T00:00:00.000Z",
    "status": "PRESENT",
    "phase": "ACTIVE",
    "checkInAt": "2026-04-14T03:50:00.000Z",
    "checkOutAt": null,
    "selfieUrl": "https://bucket.s3.region.amazonaws.com/attendance/7/2026-04-14/selfie-file.jpg",
    "checkInLatitude": 28.6139,
    "checkInLongitude": 77.209,
    "checkOutLatitude": null,
    "checkOutLongitude": null,
    "shift": "MORNING"
  }
}
```

Attendance response fields:

| Field | Type | Notes |
| --- | --- | --- |
| `workDate` | `string` | Normalized IST day as ISO string |
| `status` | `string \| null` | Typically `PRESENT` after check-in |
| `phase` | `NOT_CHECKED_IN \| ACTIVE \| COMPLETED` | Derived from check-in/out state |
| `checkInAt` | `string \| null` | ISO timestamp |
| `checkOutAt` | `string \| null` | ISO timestamp |
| `selfieUrl` | `string \| null` | Present after successful check-in |
| `checkInLatitude` | `number \| null` | GPS coordinate |
| `checkInLongitude` | `number \| null` | GPS coordinate |
| `checkOutLatitude` | `number \| null` | GPS coordinate |
| `checkOutLongitude` | `number \| null` | GPS coordinate |
| `shift` | `MORNING \| EVENING \| NIGHT` | Derived from current IST time |

Error responses:

- `401`: `{"message":"Unauthorized."}`
- `403`: `{"message":"Not allowed."}`
- `400`: `{"message":"Invalid query params."}` or `{"message":"Invalid date. Use YYYY-MM-DD or ISO date."}`

### 4.2 POST `/api/staff/attendance`

Purpose: Check in or check out staff attendance.

Auth required: Yes

Role access:

- `staff` only

Headers:

```text
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Supported actions:

- `check_in`
- `check_out`

#### 4.2.1 Check-in body

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `action` | `string` | Yes | Must be `check_in` |
| `latitude` | `string` | Yes | Must parse to number |
| `longitude` | `string` | Yes | Must parse to number |
| `selfie` | `file` | Yes | `image/jpeg` or `image/png` |

#### 4.2.2 Check-out body

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `action` | `string` | Yes | Must be `check_out` |
| `latitude` | `string` | Yes | Must parse to number |
| `longitude` | `string` | Yes | Must parse to number |

Success response `200`:

```json
{
  "data": {
    "workDate": "2026-04-14T00:00:00.000Z",
    "status": "PRESENT",
    "phase": "COMPLETED",
    "checkInAt": "2026-04-14T03:50:00.000Z",
    "checkOutAt": "2026-04-14T12:20:00.000Z",
    "selfieUrl": "https://bucket.s3.region.amazonaws.com/attendance/7/2026-04-14/selfie-file.jpg",
    "checkInLatitude": 28.6139,
    "checkInLongitude": 77.209,
    "checkOutLatitude": 28.6139,
    "checkOutLongitude": 77.209,
    "shift": "EVENING"
  }
}
```

Error responses:

- `401`: `{"message":"Unauthorized."}`
- `403`: `{"message":"Not allowed."}`
- `400`: invalid multipart body, missing `action`, invalid latitude/longitude, out-of-range GPS, missing selfie on check-in, invalid selfie type, empty file, check out before check in
- `409`: already checked in for this day, already checked out for this day

Implementation notes:

- Check-in always writes attendance for the current IST day, not an arbitrary date.
- Check-in uploads the selfie to S3 and returns the public URL.
- Required env for selfie upload:
  - `AWS_REGION`
  - `AWS_S3_BUCKET`

---

## 5. Tasks

### 5.1 GET `/api/staff/tasks`

Purpose: Fetch daily staff tasks for a date, with filter tabs and pagination.

Auth required: Yes

Role access:

- `staff` only

Headers:

```text
Authorization: Bearer <token>
```

Query params:

| Param | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `date` | `string` | No | today | Accepts `YYYY-MM-DD` or ISO date |
| `filter` | `all \| critical \| high \| done` | No | `all` | Task tab filter |
| `page` | `number` | No | `1` | Minimum `1` |
| `limit` | `number` | No | `20` | Range `1..100` |

Examples:

```text
/api/staff/tasks
/api/staff/tasks?date=2026-04-14&filter=critical&page=1&limit=20
/api/staff/tasks?filter=done
```

Success response `200`:

```json
{
  "data": {
    "date": "2026-04-14T00:00:00.000Z",
    "filter": "all",
    "counts": {
      "all": 6,
      "critical": 1,
      "high": 2,
      "done": 2
    },
    "progress": {
      "done": 2,
      "total": 6,
      "percent": 33
    },
    "tasks": [
      {
        "id": 123,
        "status": "PENDING",
        "taskDate": "2026-04-14T00:00:00.000Z",
        "approval": {
          "status": "REJECTED",
          "decisionNote": "Re-clean and upload after photo again."
        },
        "masterTask": {
          "id": 21,
          "title": "Wash lobby",
          "description": "Deep clean reception area",
          "priority": "HIGH",
          "startTime": "09:00:00",
          "endTime": "11:30:00",
          "zoneId": 10,
          "zone": "Reception"
        },
        "location": {
          "propertyId": 1,
          "propertyName": "Property A",
          "floorNo": 1
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 6,
      "totalPages": 1
    }
  }
}
```

Filter behavior:

| Filter | Backend behavior |
| --- | --- |
| `all` | No additional filter |
| `critical` | `MasterTask.priority = CRITICAL` |
| `high` | `MasterTask.priority = HIGH` |
| `done` | `DailyStaffTask.status = COMPLETED` |

Response notes:

- `progress.percent` is based on `done / all`.
- `approval` is `null` if no review record exists.
- `taskDate` is returned as a `Date` object serialized by JSON response handling.

Error responses:

- `401`: `{"message":"Unauthorized."}`
- `403`: `{"message":"Not allowed."}`
- `400`: `{"message":"Invalid query params."}` or `{"message":"Invalid date. Use YYYY-MM-DD or ISO date."}`

---

## 6. Task Photos

### 6.1 POST `/api/staff/tasks/:dailyTaskId/before-photo`

Purpose: Upload the before photo for a daily task.

Auth required: Yes

Role access:

- `staff` only

Headers:

```text
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Path params:

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `dailyTaskId` | `number` | Yes | Positive integer |

Request body:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `photo` | `file` | Yes | `image/jpeg` or `image/png` |

Success response `200`:

```json
{
  "data": {
    "beforePhotoUrl": "https://bucket.s3.region.amazonaws.com/tasks/123/before/file.jpg"
  }
}
```

Error responses:

- `401`: `{"message":"Unauthorized."}`
- `403`: `{"message":"Not allowed."}`
- `400`: `{"message":"Invalid dailyTaskId."}`, `{"message":"photo file is required."}`, `{"message":"Invalid photo type. Use image/jpeg or image/png."}`, or `{"message":"Empty file."}`
- `404`: `{"message":"Task not found."}`

Implementation notes:

- The task must belong to the logged-in staff user.
- Upload target key format is `tasks/<dailyTaskId>/before/<timestamp>.<ext>`.
- Required env:
  - `AWS_REGION`
  - `AWS_S3_BUCKET`

### 6.2 POST `/api/staff/tasks/:dailyTaskId/after-photo`

Purpose: Upload the after photo and create or reset the supervisor approval record.

Auth required: Yes

Role access:

- `staff` only

Headers:

```text
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Path params:

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `dailyTaskId` | `number` | Yes | Positive integer |

Request body:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `photo` | `file` | Yes | `image/jpeg` or `image/png` |

Success response `200`:

```json
{
  "data": {
    "afterPhotoUrl": "https://bucket.s3.region.amazonaws.com/tasks/123/after/file.jpg",
    "approval": {
      "id": 55,
      "status": "PENDING",
      "supervisorId": 3
    }
  }
}
```

Error responses:

- `401`: `{"message":"Unauthorized."}`
- `403`: `{"message":"Not allowed."}`
- `400`: `{"message":"Invalid dailyTaskId."}`, `{"message":"Before photo is required first."}`, `{"message":"Supervisor not assigned for this staff."}`, `{"message":"photo file is required."}`, `{"message":"Invalid photo type. Use image/jpeg or image/png."}`, or `{"message":"Empty file."}`
- `404`: `{"message":"Task not found."}`
- `500`: `{"message":"Failed to create approval."}`

Implementation notes:

- After-photo requires an existing `beforePhotoUrl`.
- If an approval already exists, backend resets it to:
  - `status = PENDING`
  - `decisionNote = null`
  - `decidedAt = null`
- Upload target key format is `tasks/<dailyTaskId>/after/<timestamp>.<ext>`.

---

## 7. Reports

### 7.1 GET `/api/staff/report`

Purpose: Fetch the monthly staff performance report.

Auth required: Yes

Role access:

- `staff` only

Headers:

```text
Authorization: Bearer <token>
```

Query params:

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `year` | `number` | Yes | Integer between `2000` and `2100` |
| `month` | `number` | Yes | Integer between `1` and `12` |

Example:

```text
/api/staff/report?year=2026&month=4
```

Success response `200`:

```json
{
  "data": {
    "period": {
      "year": 2026,
      "month": 4,
      "label": "April 2026"
    },
    "byPriority": [
      {
        "priority": "CRITICAL",
        "count": 3
      },
      {
        "priority": "HIGH",
        "count": 8
      }
    ],
    "byPriorityCounts": {
      "CRITICAL": 3,
      "HIGH": 8
    },
    "byZone": [
      {
        "zoneId": 10,
        "zoneName": "Reception",
        "propertyName": "Property A",
        "floorNo": 1,
        "assigned": 20,
        "done": 16,
        "percent": 80
      }
    ],
    "attendance": {
      "currentStreakDays": 4,
      "bestStreakDays": 9,
      "days": [
        {
          "date": "2026-04-01",
          "status": "PRESENT"
        },
        {
          "date": "2026-04-02",
          "status": "UNKNOWN"
        }
      ]
    },
    "feedback": [
      {
        "id": 55,
        "taskTitle": "Wash lobby",
        "comment": "Looks good.",
        "rating": 5,
        "checkerInitials": "DS",
        "decidedAt": "2026-04-14T08:10:00.000Z",
        "relativeLabel": "Today"
      }
    ]
  }
}
```

Response sections:

| Field | Type | Notes |
| --- | --- | --- |
| `period` | `object` | Selected month summary |
| `byPriority` | `array` | Priority bucket counts |
| `byPriorityCounts` | `object` | Same counts keyed by priority |
| `byZone` | `array` | Zone completion rows |
| `attendance` | `object` | Present streaks and day-level status grid |
| `feedback` | `array` | Last 5 supervisor feedback entries |

Attendance report details:

| Field | Type | Notes |
| --- | --- | --- |
| `currentStreakDays` | `number` | Current present streak ending at latest present day |
| `bestStreakDays` | `number` | Best historical present streak |
| `days[]` | `array` | One entry for each day in month |
| `days[].status` | `string` | `PRESENT`, `UNKNOWN`, or other stored attendance status |

Feedback details:

| Field | Type | Notes |
| --- | --- | --- |
| `comment` | `string \| null` | Supervisor decision note |
| `rating` | `number \| null` | 1..5 rating |
| `checkerInitials` | `string` | Derived from supervisor name |
| `relativeLabel` | `string` | `Today`, `Yesterday`, or `YYYY-MM-DD` |

Error responses:

- `401`: `{"message":"Unauthorized."}`
- `403`: `{"message":"Not allowed."}`
- `400`: `{"message":"Invalid query. Use year and month (1-12)."}` in intent, though the current source string contains an encoding artifact

Implementation notes:

- Zone performance treats a task as done if either:
  - `DailyStaffTask.status === COMPLETED`, or
  - linked `TaskApproval.status === APPROVED`
- Priority counts use `UNKNOWN` when the master task priority is `null`.

---

## 8. Frontend Integration Order

Recommended sequence for staff frontend integration:

1. `POST /api/auth/login`
2. `GET /api/staff/profile`
3. `GET /api/staff/dashboard`
4. `GET /api/staff/attendance`
5. `POST /api/staff/attendance` for `check_in`
6. `POST /api/staff/attendance` for `check_out`
7. `GET /api/staff/tasks`
8. `POST /api/staff/tasks/:dailyTaskId/before-photo`
9. `POST /api/staff/tasks/:dailyTaskId/after-photo`
10. `GET /api/staff/report`

---

## 9. Important Implementation Notes

- All `/api/staff/*` routes are properly role-guarded for `staff`.
- Attendance and dashboard date handling are IST-normalized.
- Attendance `GET` can read historical dates, but attendance `POST` always writes to the current IST day.
- Staff task photo uploads require S3 configuration.
- After-photo upload is what triggers the supervisor review flow by inserting or resetting a `TaskApproval` row.
- The task list `done` filter only checks `DailyStaffTask.status === COMPLETED`; it does not include `APPROVED` review state in the filter itself.
- The monthly report uses approval state when computing zone completion percentages.

