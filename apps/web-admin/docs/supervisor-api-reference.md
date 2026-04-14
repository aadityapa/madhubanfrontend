# Madhuban Supervisor API Reference

This document is generated from the backend route handlers in `app/api/supervisor` and cross-checked against `postman/Madhuban-Backend.postman_collection.json`.

Base URL:

```text
http://localhost:3000
```

Base API prefix:

```text
/api
```

Auth notes:

- All supervisor endpoints require `Authorization: Bearer <token>`.
- The token must belong to a user whose role is `supervisor`.
- Date-based supervisor APIs use IST calendar-day normalization internally.

---

## 1. Auth

### 1.1 POST `/api/auth/login`

Purpose: Login as supervisor and get a JWT token.

Auth required: No

Request body:

```json
{
  "email": "supervisor@madhuban360.com",
  "password": "Supervisor@123"
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
    "id": 3,
    "name": "Default Supervisor",
    "email": "supervisor@madhuban360.com",
    "role": "supervisor"
  }
}
```

Error responses:

- `400`: `{"message":"Invalid request body."}`
- `401`: `{"message":"Invalid email or password."}`
- `500`: `{"message":"Something went wrong."}`

---

## 2. Dashboard

### 2.1 GET `/api/supervisor/dashboard`

Purpose: Fetch supervisor dashboard data for today or a specific date.

Auth required: Yes

Role access:

- `supervisor` only

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
/api/supervisor/dashboard
/api/supervisor/dashboard?date=2026-04-14
```

Success response `200`:

```json
{
  "data": {
    "profile": {
      "name": "Default Supervisor",
      "initials": "DS",
      "role": "SUPERVISOR"
    },
    "context": {
      "label": "Property A - Morning",
      "shift": "MORNING",
      "shiftLabel": "Morning"
    },
    "stats": {
      "needsReview": 4,
      "approved": 9,
      "rejected": 2
    },
    "completion": {
      "percent": 73,
      "done": 11,
      "pending": 4,
      "total": 15
    },
    "urgentTasks": [
      {
        "dailyTaskId": 123,
        "taskTitle": "Wash lobby",
        "assigneeName": "Amit Kumar",
        "assigneeInitials": "AK",
        "urgencyKind": "OVERDUE",
        "label": "12M OVERDUE",
        "deadlineAt": "2026-04-14T06:30:00.000Z"
      }
    ],
    "zones": [
      {
        "zoneId": 10,
        "zoneName": "Reception",
        "propertyName": "Property A",
        "floorNo": 1,
        "assigned": 6,
        "done": 5,
        "percent": 83,
        "healthBand": "MEDIUM"
      }
    ],
    "recentActivity": [
      {
        "id": 55,
        "action": "APPROVED",
        "decidedAt": "2026-04-14T08:20:00.000Z",
        "timeDisplay": "1:50 pm",
        "taskTitle": "Pantry cleanup",
        "staffName": "Ravi Singh",
        "note": "Looks good."
      }
    ],
    "badges": {
      "tasksPending": 4,
      "notificationsUnread": 0
    },
    "date": "2026-04-14T00:00:00.000Z",
    "shiftInProgress": true
  }
}
```

Response sections:

| Field | Type | Notes |
| --- | --- | --- |
| `profile` | `object` | Supervisor identity summary |
| `context` | `object` | Property context and current shift |
| `stats` | `object` | Approval KPI counts |
| `completion` | `object` | Done vs pending summary |
| `urgentTasks` | `array` | Overdue or due-soon tasks |
| `zones` | `array` | Zone completion and health band |
| `recentActivity` | `array` | Recent approval/rejection decisions |
| `badges` | `object` | UI badge counters |
| `date` | `string` | Normalized IST day as ISO string |
| `shiftInProgress` | `boolean` | Derived from supervisor attendance row |

Error responses:

- `401`: `{"message":"Unauthorized."}`
- `403`: `{"message":"Not allowed."}`
- `400`: `{"message":"Invalid query params."}` or `{"message":"Invalid date. Use YYYY-MM-DD or ISO date."}`

---

## 3. Attendance

### 3.1 GET `/api/supervisor/attendance`

Purpose: Get supervisor attendance status for today or a specific date.

Auth required: Yes

Role access:

- `supervisor` only

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
    "selfieUrl": "https://bucket.s3.region.amazonaws.com/attendance/3/2026-04-14/selfie-file.jpg",
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

### 3.2 POST `/api/supervisor/attendance`

Purpose: Check in or check out supervisor attendance.

Auth required: Yes

Role access:

- `supervisor` only

Headers:

```text
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Supported actions:

- `check_in`
- `check_out`

#### 3.2.1 Check-in body

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `action` | `string` | Yes | Must be `check_in` |
| `latitude` | `string` | Yes | Must parse to number |
| `longitude` | `string` | Yes | Must parse to number |
| `selfie` | `file` | Yes | `image/jpeg` or `image/png` |

Example form-data:

| Key | Value |
| --- | --- |
| `action` | `check_in` |
| `latitude` | `28.6139` |
| `longitude` | `77.2090` |
| `selfie` | image file |

#### 3.2.2 Check-out body

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
    "selfieUrl": "https://bucket.s3.region.amazonaws.com/attendance/3/2026-04-14/selfie-file.jpg",
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

## 4. Reports

### 4.1 GET `/api/supervisor/reports/shift`

Purpose: Fetch the full supervisor shift report dataset for one day.

Auth required: Yes

Role access:

- `supervisor` only

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
    "date": "2026-04-14T00:00:00.000Z",
    "overview": {
      "completion": {
        "percent": 73,
        "done": 11,
        "pending": 4,
        "total": 15
      },
      "approvals": {
        "approved": 9,
        "pending": 4,
        "rejected": 2
      }
    },
    "zones": [
      {
        "zoneId": 10,
        "zoneName": "Reception",
        "propertyName": "Property A",
        "floorNo": 1,
        "assigned": 6,
        "done": 5,
        "percent": 83
      }
    ],
    "functions": [
      {
        "functionKey": "cleaning",
        "functionLabel": "Cleaning",
        "assigned": 12,
        "approved": 8,
        "percent": 67
      }
    ],
    "employees": [
      {
        "staffId": 7,
        "name": "Amit Kumar",
        "initials": "AK",
        "scorePercent": 80,
        "tasks": 5,
        "onTimePercent": 60
      }
    ],
    "escalations": [
      {
        "kind": "NO_SHOW",
        "staffId": 8,
        "staffName": "Ravi Singh",
        "label": "No Show",
        "time": null
      },
      {
        "kind": "OVERDUE_TASK",
        "dailyTaskId": 123,
        "staffId": 7,
        "staffName": "Amit Kumar",
        "title": "Wash lobby",
        "zoneName": "Reception",
        "label": "14m overdue",
        "deadlineAt": "2026-04-14T06:30:00.000Z"
      }
    ]
  }
}
```

Report sections:

| Field | Type | Notes |
| --- | --- | --- |
| `overview` | `object` | Completion and approval summary |
| `zones` | `array` | Zone completion rows |
| `functions` | `array` | Zone groups mapped into functional buckets |
| `employees` | `array` | Staff performance summary |
| `escalations` | `array` | No-show and overdue-task exceptions |

Error responses:

- `401`: `{"message":"Unauthorized."}`
- `403`: `{"message":"Not allowed."}`
- `400`: `{"message":"Invalid query params."}` or `{"message":"Invalid date. Use YYYY-MM-DD or ISO date."}`

Function group mapping used by backend:

- `cleaning`
- `pantry`
- `security_assist`
- `maintenance`
- `other`

### 4.2 GET `/api/supervisor/reports/shift/employees/:staffId`

Purpose: Fetch one staff member's shift summary and task log for a date.

Auth required: Yes

Role access:

- `supervisor` only

Headers:

```text
Authorization: Bearer <token>
```

Path params:

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `staffId` | `number` | Yes | Positive integer |

Query params:

| Param | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `date` | `string` | No | today | Accepts `YYYY-MM-DD` or ISO date |

Success response `200`:

```json
{
  "data": {
    "staffId": 7,
    "staffName": "Amit Kumar",
    "staffInitials": "AK",
    "summary": {
      "staffId": 7,
      "name": "Amit Kumar",
      "initials": "AK",
      "scorePercent": 80,
      "tasks": 5,
      "onTimePercent": 60
    },
    "logs": [
      {
        "dailyTaskId": 123,
        "title": "Wash lobby",
        "zoneName": "Reception",
        "propertyName": "Property A",
        "floorNo": 1,
        "status": "DONE",
        "time": "2026-04-14T08:10:00.000Z",
        "rating": 5
      }
    ]
  }
}
```

Behavior notes:

- If the `staffId` does not belong to the logged-in supervisor, backend currently returns:
  - empty staff name
  - `summary: null`
  - `logs: []`
- This route does not currently return `403` for out-of-scope staff; it returns an empty payload shape.

Error responses:

- `401`: `{"message":"Unauthorized."}`
- `403`: `{"message":"Not allowed."}`
- `400`: `{"message":"Invalid query params."}`, `{"message":"Invalid staffId."}`, or `{"message":"Invalid date. Use YYYY-MM-DD or ISO date."}`

---

## 5. Reviews

### 5.1 GET `/api/supervisor/reviews`

Purpose: Fetch supervisor review cards for staff-submitted after-photo approvals.

Auth required: Yes

Role access:

- `supervisor` only

Headers:

```text
Authorization: Bearer <token>
```

Query params:

| Param | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `date` | `string` | No | today | Accepts `YYYY-MM-DD` or ISO date |
| `status` | `needs_review \| sent_back \| approved \| all` | No | `needs_review` | Maps to approval status filter |
| `q` | `string` | No | - | Searches task title, zone, or staff name |
| `priority` | `CRITICAL \| HIGH` | No | - | Filters master task priority |
| `page` | `number` | No | `1` | Minimum `1` |
| `limit` | `number` | No | `20` | Range `1..100` |

Examples:

```text
/api/supervisor/reviews?date=2026-04-14&status=needs_review&page=1&limit=20
/api/supervisor/reviews?date=2026-04-14&status=approved&q=reception&priority=HIGH
```

Success response `200`:

```json
{
  "data": {
    "date": "2026-04-14T00:00:00.000Z",
    "status": "needs_review",
    "counts": {
      "needsReview": 4,
      "sentBack": 2,
      "approved": 9
    },
    "items": [
      {
        "approvalId": 55,
        "dailyTaskId": 123,
        "approvalStatus": "PENDING",
        "submittedAt": "2026-04-14T08:00:00.000Z",
        "overdueLabel": "12m overdue",
        "task": {
          "title": "Wash lobby",
          "priority": "HIGH",
          "startTime": "09:00:00",
          "endTime": "11:30:00"
        },
        "maker": {
          "staffId": 7,
          "name": "Amit Kumar",
          "initials": "AK"
        },
        "zone": {
          "zoneId": 10,
          "zoneName": "Reception",
          "floorNo": 1,
          "propertyName": "Property A"
        },
        "photos": {
          "beforePhotoUrl": "https://...",
          "afterPhotoUrl": "https://..."
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 4,
      "totalPages": 1
    }
  }
}
```

Status mapping in backend:

| Query status | DB status |
| --- | --- |
| `needs_review` | `PENDING` |
| `sent_back` | `REJECTED` |
| `approved` | `APPROVED` |
| `all` | no status filter |

Error responses:

- `401`: `{"message":"Unauthorized."}`
- `403`: `{"message":"Not allowed."}`
- `400`: `{"message":"Invalid query params."}` or `{"message":"Invalid date. Use YYYY-MM-DD or ISO date."}`

### 5.2 GET `/api/supervisor/reviews/:dailyTaskId`

Purpose: Fetch full review detail for one daily task approval.

Auth required: Yes

Role access:

- `supervisor` only

Headers:

```text
Authorization: Bearer <token>
```

Path params:

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `dailyTaskId` | `number` | Yes | Positive integer |

Success response `200`:

```json
{
  "data": {
    "dailyTaskId": 123,
    "taskDate": "2026-04-14T00:00:00.000Z",
    "task": {
      "id": 21,
      "title": "Wash lobby",
      "description": "Deep clean reception area",
      "priority": "HIGH",
      "startTime": "09:00:00",
      "endTime": "11:30:00"
    },
    "zone": {
      "zoneId": 10,
      "zoneName": "Reception",
      "floorNo": 1,
      "propertyName": "Property A"
    },
    "maker": {
      "staffId": 7,
      "name": "Amit Kumar",
      "email": "amit@example.com",
      "initials": "AK"
    },
    "photos": {
      "beforePhotoUrl": "https://...",
      "afterPhotoUrl": "https://..."
    },
    "dailyTask": {
      "status": "COMPLETED",
      "startedAt": "2026-04-14T07:30:00.000Z",
      "completedAt": "2026-04-14T08:00:00.000Z"
    },
    "approval": {
      "id": 55,
      "status": "PENDING",
      "submittedAt": "2026-04-14T08:00:00.000Z",
      "decidedAt": null,
      "decisionNote": null,
      "rating": null
    }
  }
}
```

Error responses:

- `401`: `{"message":"Unauthorized."}`
- `403`: `{"message":"Not allowed."}`
- `400`: `{"message":"Invalid dailyTaskId."}`
- `404`: `{"message":"Review not found."}`

### 5.3 POST `/api/supervisor/reviews/:dailyTaskId/decision`

Purpose: Approve or send back a submitted task review.

Auth required: Yes

Role access:

- `supervisor` only

Headers:

```text
Authorization: Bearer <token>
Content-Type: application/json
```

Path params:

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `dailyTaskId` | `number` | Yes | Positive integer |

Request body:

```json
{
  "action": "approve",
  "comment": "Looks good.",
  "rating": 5
}
```

Allowed body fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `action` | `approve \| send_back` | Yes | Controls final approval status |
| `comment` | `string` | No | Max 2000 chars |
| `rating` | `number` | No | Integer `1..5` |

Backend status mapping:

| Action | Stored status |
| --- | --- |
| `approve` | `APPROVED` |
| `send_back` | `REJECTED` |

Success response `200`:

```json
{
  "data": {
    "approval": {
      "id": 55,
      "dailyTaskId": 123,
      "status": "APPROVED",
      "submittedAt": "2026-04-14T08:00:00.000Z",
      "decidedAt": "2026-04-14T08:10:00.000Z",
      "decisionNote": "Looks good.",
      "rating": 5,
      "supervisorId": 3
    }
  }
}
```

Error responses:

- `401`: `{"message":"Unauthorized."}`
- `403`: `{"message":"Not allowed."}`
- `400`: `{"message":"Invalid dailyTaskId."}` or `{"message":"Invalid payload."}`
- `404`: `{"message":"Review not found."}`

---

## 6. Shared Daily Task Lookup

### 6.1 GET `/api/daily-staff-tasks`

Purpose: Fetch generated daily staff tasks by date. This is not under `/api/supervisor`, but it is used in supervisor-related flows and appears alongside supervisor APIs in the Postman collection.

Auth required: No

Query params:

| Param | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `date` | `string` | No | today | Parsed by JavaScript `Date`, normalized to IST day in backend |

Success response `200`:

```json
{
  "data": [
    {
      "id": 123,
      "staffMasterTaskId": 15,
      "staffId": 7,
      "taskDate": "2026-04-14T00:00:00.000Z",
      "status": "PENDING",
      "beforePhotoUrl": null,
      "afterPhotoUrl": null,
      "startedAt": "2026-04-14T07:30:00.000Z",
      "completedAt": "2026-04-14T08:00:00.000Z",
      "createdAt": "2026-04-14T07:00:00.000Z",
      "updatedAt": "2026-04-14T08:00:00.000Z",
      "staff": {
        "id": 7,
        "name": "Amit Kumar",
        "email": "amit@example.com",
        "supervisor": {
          "id": 3,
          "name": "Default Supervisor",
          "email": "supervisor@madhuban360.com"
        }
      },
      "staffMasterTask": {
        "id": 15,
        "staffId": 7,
        "masterTaskId": 21,
        "startDate": "2026-04-01T00:00:00.000Z",
        "endDate": "2026-04-30T00:00:00.000Z",
        "isActive": true,
        "createdAt": "2026-04-01T00:00:00.000Z",
        "updatedAt": "2026-04-14T00:00:00.000Z",
        "masterTask": {
          "id": 21,
          "title": "Wash lobby",
          "description": "Deep clean reception area",
          "zoneId": 10,
          "priority": "HIGH",
          "startTime": "1970-01-01T09:00:00.000Z",
          "endTime": "1970-01-01T11:30:00.000Z",
          "materials": ["mop", "bucket"],
          "createdByAdminId": 1,
          "createdAt": "2026-04-01T00:00:00.000Z",
          "updatedAt": "2026-04-01T00:00:00.000Z"
        }
      }
    }
  ]
}
```

---

## 7. Frontend Integration Order

Recommended sequence for supervisor frontend integration:

1. `POST /api/auth/login`
2. `GET /api/supervisor/dashboard`
3. `GET /api/supervisor/attendance`
4. `POST /api/supervisor/attendance` for `check_in`
5. `POST /api/supervisor/attendance` for `check_out`
6. `GET /api/supervisor/reports/shift`
7. `GET /api/supervisor/reports/shift/employees/:staffId`
8. `GET /api/supervisor/reviews`
9. `GET /api/supervisor/reviews/:dailyTaskId`
10. `POST /api/supervisor/reviews/:dailyTaskId/decision`
11. `GET /api/daily-staff-tasks`

---

## 8. Important Implementation Notes

- All `/api/supervisor/*` routes are properly role-guarded for `supervisor`.
- Supervisor attendance uses the same `StaffAttendance` table as staff attendance, keyed by the supervisor user ID.
- Attendance `GET` can read historical dates, but attendance `POST` always writes to the current IST day.
- Review lists are built from `TaskApproval` rows created when staff submit after-photos.
- Review decision `send_back` stores `REJECTED` in the database.
- Report and dashboard completion logic treat a task as done if either:
  - `DailyStaffTask.status === COMPLETED`, or
  - linked `TaskApproval.status === APPROVED`
- Supervisor employee-detail route currently returns an empty payload instead of `403` when the staff member is outside that supervisor's hierarchy.

