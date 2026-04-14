# Madhuban Admin API Reference

This document is generated from the backend route handlers in `app/api` and cross-checked against `postman/Madhuban-Backend.postman_collection.json`.

Base URL:

```text
http://localhost:3000
```

Base API prefix:

```text
/api
```

Auth notes:

- Protected endpoints use `Authorization: Bearer <token>`.
- Login returns a JWT valid for 7 days.
- Some endpoints in the collection are admin-facing, but not every one is strictly admin-only in code. This is called out per endpoint.

---

## 1. Auth

### 1.1 POST `/api/auth/login`

Purpose: Login and get a JWT token.

Auth required: No

Request body:

```json
{
  "email": "admin@example.com",
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
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

Error responses:

- `400`: `{"message":"Invalid request body."}`
- `401`: `{"message":"Invalid email or password."}`
- `500`: `{"message":"Something went wrong."}`

---

## 2. Roles

### 2.1 GET `/api/roles`

Purpose: Fetch all available roles.

Auth required: No

Query params: None

Success response `200`:

```json
{
  "data": [
    {
      "id": 1,
      "name": "admin",
      "createdAt": "2026-04-13T00:00:00.000Z",
      "updatedAt": "2026-04-13T00:00:00.000Z"
    }
  ]
}
```

---

## 3. Properties

## 3.1 Read APIs

### 3.1.1 GET `/api/properties/summary`

Purpose: Get compact property cards for admin lists.

Auth required: No

Query params: None

Success response `200`:

```json
{
  "data": [
    {
      "id": 1,
      "name": "Skyline Heights",
      "imageUrl": "/uploads/properties/file.jpg",
      "createdAt": "2026-04-13T00:00:00.000Z",
      "updatedAt": "2026-04-13T00:00:00.000Z",
      "departmentCount": 0,
      "floorCount": 3,
      "zoneCount": 5
    }
  ]
}
```

### 3.1.2 GET `/api/properties`

Purpose: Get all properties with full nested structure.

Auth required: No

Query params: None

Success response `200`:

```json
{
  "data": [
    {
      "id": 1,
      "name": "Skyline Heights",
      "imageUrl": "/uploads/properties/file.jpg",
      "createdAt": "2026-04-13T00:00:00.000Z",
      "updatedAt": "2026-04-13T00:00:00.000Z",
      "departments": [],
      "floors": [
        {
          "id": 10,
          "propertyId": 1,
          "floorNo": 1,
          "createdAt": "2026-04-13T00:00:00.000Z",
          "updatedAt": "2026-04-13T00:00:00.000Z",
          "floorZones": [
            {
              "id": 100,
              "propertyFloorId": 10,
              "zone": "Zone A",
              "createdAt": "2026-04-13T00:00:00.000Z",
              "updatedAt": "2026-04-13T00:00:00.000Z"
            }
          ]
        }
      ]
    }
  ]
}
```

### 3.1.3 GET `/api/properties/:id`

Purpose: Get one property with departments, floors, and zones.

Auth required: No

Path params:

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `number` | Yes | Positive integer property ID |

Success response `200`:

```json
{
  "data": {
    "id": 1,
    "name": "Skyline Heights",
    "imageUrl": "/uploads/properties/file.jpg",
    "createdAt": "2026-04-13T00:00:00.000Z",
    "updatedAt": "2026-04-13T00:00:00.000Z",
    "departments": [],
    "floors": [
      {
        "id": 10,
        "propertyId": 1,
        "floorNo": 1,
        "createdAt": "2026-04-13T00:00:00.000Z",
        "updatedAt": "2026-04-13T00:00:00.000Z",
        "floorZones": [
          {
            "id": 100,
            "propertyFloorId": 10,
            "zone": "Zone A",
            "createdAt": "2026-04-13T00:00:00.000Z",
            "updatedAt": "2026-04-13T00:00:00.000Z"
          }
        ]
      }
    ]
  }
}
```

Error responses:

- `400`: `{"message":"Invalid property id."}`
- `404`: `{"message":"Property not found."}`

### 3.1.4 GET `/api/properties/:id/floors`

Purpose: Get floors for a property.

Auth required: No

Path params:

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `number` | Yes | Positive integer property ID |

Success response `200`:

```json
{
  "data": [
    {
      "id": 10,
      "propertyId": 1,
      "floorNo": 1,
      "createdAt": "2026-04-13T00:00:00.000Z",
      "updatedAt": "2026-04-13T00:00:00.000Z"
    }
  ]
}
```

Error responses:

- `400`: `{"message":"Invalid property id."}`
- `404`: `{"message":"Property not found."}`

### 3.1.5 GET `/api/properties/:id/floors/:floorId/zones`

Purpose: Get zones for one floor inside a property.

Auth required: No

Path params:

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `number` | Yes | Positive integer property ID |
| `floorId` | `number` | Yes | Positive integer property floor ID |

Success response `200`:

```json
{
  "data": [
    {
      "id": 100,
      "propertyFloorId": 10,
      "zone": "Zone A",
      "createdAt": "2026-04-13T00:00:00.000Z",
      "updatedAt": "2026-04-13T00:00:00.000Z"
    }
  ]
}
```

Error responses:

- `400`: `{"message":"Invalid property or floor id."}`
- `404`: `{"message":"Floor not found for this property."}`

## 3.2 Write APIs

### 3.2.1 POST `/api/properties`

Purpose: Create a property with optional nested floors, zones, and optional image.

Auth required: No

Supported content types:

- `application/json`
- `multipart/form-data`

#### JSON request body

```json
{
  "propertyName": "Skyline Heights",
  "floors": [
    {
      "floorNumber": 1,
      "zones": [
        { "name": "Zone A" },
        { "name": "Zone B" }
      ]
    }
  ]
}
```

Allowed JSON fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `propertyName` | `string` | Conditionally | Use `propertyName` or `name` |
| `name` | `string` | Conditionally | Alias of `propertyName` |
| `floors` | `array` | No | Defaults to empty array |
| `floors[].floorNumber` | `number` | Yes if floor provided | Integer |
| `floors[].zones` | `array` | No | Defaults to empty array |
| `floors[].zones[].name` | `string` | Yes if zone provided | Non-empty |

#### Multipart form-data body

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `propertyName` | `string` | Conditionally | Use `propertyName` or `name` |
| `name` | `string` | Conditionally | Alias of `propertyName` |
| `floors` | `string` | No | JSON array string |
| `image` | `file` | No | `jpeg`, `png`, `gif`, `webp`, max 5MB |

Success response `201`:

```json
{
  "message": "Property created.",
  "data": {
    "id": 1,
    "name": "Skyline Heights",
    "imageUrl": "/uploads/properties/file.jpg",
    "createdAt": "2026-04-13T00:00:00.000Z",
    "updatedAt": "2026-04-13T00:00:00.000Z",
    "departments": [],
    "floors": [
      {
        "id": 10,
        "propertyId": 1,
        "floorNo": 1,
        "createdAt": "2026-04-13T00:00:00.000Z",
        "updatedAt": "2026-04-13T00:00:00.000Z",
        "floorZones": [
          {
            "id": 100,
            "propertyFloorId": 10,
            "zone": "Zone A",
            "createdAt": "2026-04-13T00:00:00.000Z",
            "updatedAt": "2026-04-13T00:00:00.000Z"
          }
        ]
      }
    ]
  }
}
```

Error responses:

- `400`: invalid JSON body, invalid floors JSON, invalid floors structure, duplicate `floorNumber`, duplicate zone names on same floor, missing `propertyName/name`, invalid image type, image too large
- `409`: hierarchy uniqueness conflict

### 3.2.2 PATCH `/api/properties/:id`

Purpose: Update a property.

Auth required: No

Path params:

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `number` | Yes | Positive integer property ID |

Request body:

```json
{
  "name": "Updated Property Name"
}
```

Body fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | `string` | Yes | Currently the only updatable field |

Success response `200`:

```json
{
  "message": "Property updated.",
  "data": {
    "id": 1,
    "name": "Updated Property Name",
    "imageUrl": "/uploads/properties/file.jpg",
    "createdAt": "2026-04-13T00:00:00.000Z",
    "updatedAt": "2026-04-13T00:00:00.000Z",
    "departments": [],
    "floors": []
  }
}
```

Error responses:

- `400`: `{"message":"Invalid property id."}` or `{"message":"Invalid payload."}`
- `404`: `{"message":"Property not found."}`
- `409`: `{"message":"A property with this name already exists."}`

### 3.2.3 DELETE `/api/properties/:id`

Purpose: Delete a property.

Auth required: No

Path params:

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `number` | Yes | Positive integer property ID |

Request body: None

Success response `200`:

```json
{
  "message": "Property deleted."
}
```

Error responses:

- `400`: `{"message":"Invalid property id."}`
- `404`: `{"message":"Property not found."}`

---

## 4. Users

### 4.1 GET `/api/users`

Purpose: Get paginated users with role and reporting hierarchy.

Auth required: No

Query params:

| Param | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `page` | `number` | No | `1` | Minimum effective value is `1` |
| `limit` | `number` | No | `10` | Clamped to `1..100` |

Success response `200`:

```json
{
  "data": [
    {
      "id": 1,
      "name": "User Name",
      "email": "user@example.com",
      "role": "manager",
      "manager": {
        "id": 2,
        "name": "Manager Name",
        "email": "manager@example.com"
      },
      "supervisor": {
        "id": 3,
        "name": "Supervisor Name",
        "email": "supervisor@example.com"
      },
      "createdAt": "2026-04-13T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

### 4.2 GET `/api/users/managers`

Purpose: Get all manager users.

Auth required: No

Success response `200`:

```json
{
  "data": [
    {
      "id": 2,
      "name": "Manager Name",
      "email": "manager@example.com",
      "supervisorCount": 4
    }
  ]
}
```

### 4.3 GET `/api/users/supervisors`

Purpose: Get all supervisor users.

Auth required: No

Success response `200`:

```json
{
  "data": [
    {
      "id": 3,
      "name": "Supervisor Name",
      "email": "supervisor@example.com",
      "manager": {
        "id": 2,
        "name": "Manager Name",
        "email": "manager@example.com"
      },
      "staffCount": 8
    }
  ]
}
```

### 4.4 GET `/api/users/staff`

Purpose: Get all staff users.

Auth required: No

Success response `200`:

```json
{
  "data": [
    {
      "id": 4,
      "name": "Staff Name",
      "email": "staff@example.com",
      "supervisor": {
        "id": 3,
        "name": "Supervisor Name",
        "email": "supervisor@example.com"
      }
    }
  ]
}
```

---

## 5. Master Tasks

### 5.1 GET `/api/tasks`

Purpose: Get all master tasks.

Auth required: No

Success response `200`:

```json
{
  "data": [
    {
      "id": 1,
      "title": "Daily Reporting",
      "description": "Submit shift report",
      "zoneId": 100,
      "priority": "HIGH",
      "startTime": "1970-01-01T09:00:00.000Z",
      "endTime": "1970-01-01T11:30:00.000Z",
      "materials": ["mop", "bucket", "detergent"],
      "createdByAdminId": 1,
      "createdAt": "2026-04-13T00:00:00.000Z",
      "updatedAt": "2026-04-13T00:00:00.000Z",
      "createdByAdmin": {
        "id": 1,
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "zone": {
        "id": 100,
        "zone": "Zone A",
        "propertyFloorId": 10
      }
    }
  ]
}
```

### 5.2 POST `/api/tasks`

Purpose: Create a master task.

Auth required: Yes

Role access:

- `admin` only

Headers:

```text
Authorization: Bearer <token>
Content-Type: application/json
```

Request body:

```json
{
  "title": "Daily Reporting",
  "description": "Submit shift report",
  "zoneId": 100,
  "priority": "HIGH",
  "startTime": "09:00",
  "endTime": "11:30",
  "materials": ["mop", "bucket", "detergent"]
}
```

Body fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | `string` | Yes | Non-empty |
| `description` | `string` | No | Optional |
| `zoneId` | `number \| null` | No | Must exist if provided |
| `priority` | `string \| null` | No | Any non-empty string up to 64 chars |
| `startTime` | `string \| null` | No | Accepts ISO datetime or `HH:mm` or `HH:mm:ss` |
| `endTime` | `string \| null` | No | Accepts ISO datetime or `HH:mm` or `HH:mm:ss` |
| `materials` | `string[] \| null` | No | Stored as JSON |

Success response `201`:

```json
{
  "message": "Master task created.",
  "data": {
    "id": 1,
    "title": "Daily Reporting",
    "description": "Submit shift report",
    "zoneId": 100,
    "priority": "HIGH",
    "startTime": "1970-01-01T09:00:00.000Z",
    "endTime": "1970-01-01T11:30:00.000Z",
    "materials": ["mop", "bucket", "detergent"],
    "createdByAdminId": 1,
    "createdAt": "2026-04-13T00:00:00.000Z",
    "updatedAt": "2026-04-13T00:00:00.000Z",
    "zone": {
      "id": 100,
      "zone": "Zone A",
      "propertyFloorId": 10
    }
  }
}
```

Error responses:

- `401`: `{"message":"Unauthorized."}`
- `403`: `{"message":"Only admin can create master tasks."}`
- `400`: invalid payload, invalid `startTime/endTime`, invalid `zoneId`

---

## 6. Staff Master Tasks

### 6.1 GET `/api/staff-master-tasks`

Purpose: Get all staff task assignments.

Auth required: No

Success response `200`:

```json
{
  "data": [
    {
      "id": 1,
      "staffId": 4,
      "masterTaskId": 1,
      "startDate": "2026-04-13T00:00:00.000Z",
      "endDate": "2026-04-20T00:00:00.000Z",
      "isActive": true,
      "createdAt": "2026-04-13T00:00:00.000Z",
      "updatedAt": "2026-04-13T00:00:00.000Z",
      "staff": {
        "id": 4,
        "name": "Staff Name",
        "email": "staff@example.com",
        "supervisor": {
          "id": 3,
          "name": "Supervisor Name",
          "email": "supervisor@example.com"
        }
      },
      "masterTask": {
        "id": 1,
        "title": "Daily Reporting"
      }
    }
  ]
}
```

### 6.2 POST `/api/staff-master-tasks`

Purpose: Assign a master task to a staff member for a date range.

Auth required: Yes

Role access in code:

- `admin`
- `manager`
- `supervisor`

Headers:

```text
Authorization: Bearer <token>
Content-Type: application/json
```

Request body:

```json
{
  "staffId": 4,
  "masterTaskId": 1,
  "startDate": "2026-04-13",
  "endDate": "2026-04-20"
}
```

Body fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `staffId` | `number` | Yes | Must belong to a user with role `staff` |
| `masterTaskId` | `number` | Yes | Must exist |
| `startDate` | `string` | Yes | Must be parseable by JavaScript `Date` |
| `endDate` | `string` | Yes | Must be parseable by JavaScript `Date` |

Success response `201`:

```json
{
  "message": "Task assigned to staff.",
  "data": {
    "id": 1,
    "staffId": 4,
    "masterTaskId": 1,
    "startDate": "2026-04-13T00:00:00.000Z",
    "endDate": "2026-04-20T00:00:00.000Z",
    "isActive": true,
    "createdAt": "2026-04-13T00:00:00.000Z",
    "updatedAt": "2026-04-13T00:00:00.000Z"
  }
}
```

Error responses:

- `401`: `{"message":"Unauthorized."}`
- `403`: `{"message":"Not allowed."}`
- `403`: `{"message":"Supervisor can only assign own staff."}`
- `403`: `{"message":"Manager can only assign staff under own supervisors."}`
- `400`: invalid payload, invalid date, invalid staff user, `startDate` after `endDate`
- `404`: `{"message":"Master task not found."}`

---

## 7. Cron

### 7.1 POST `/api/cron/daily-tasks`

Purpose: Manually generate daily tasks from active staff assignments for today.

Auth required: Yes

Role access:

- `admin` only

Headers:

```text
Authorization: Bearer <token>
```

Request body: None

Success response `200`:

```json
{
  "message": "Daily task generation completed.",
  "created": 5,
  "skipped": 2
}
```

Response field meanings:

| Field | Type | Meaning |
| --- | --- | --- |
| `created` | `number` | Daily tasks created for today |
| `skipped` | `number` | Assignments skipped because a task already existed |

Error responses:

- `401`: `{"message":"Unauthorized."}`
- `403`: `{"message":"Only admin can run cron manually."}`

---

## 8. Daily Staff Tasks

### 8.1 GET `/api/daily-staff-tasks`

Purpose: Get generated daily staff tasks for a date.

Auth required: No

Query params:

| Param | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `date` | `string` | No | today | Parsed with JavaScript `Date`; normalized to UTC day |

Example:

```text
/api/daily-staff-tasks?date=2026-04-13
```

Success response `200`:

```json
{
  "data": [
    {
      "id": 1,
      "staffMasterTaskId": 1,
      "staffId": 4,
      "taskDate": "2026-04-13T00:00:00.000Z",
      "status": "PENDING",
      "createdAt": "2026-04-13T00:00:00.000Z",
      "updatedAt": "2026-04-13T00:00:00.000Z",
      "staff": {
        "id": 4,
        "name": "Staff Name",
        "email": "staff@example.com",
        "supervisor": {
          "id": 3,
          "name": "Supervisor Name",
          "email": "supervisor@example.com"
        }
      },
      "staffMasterTask": {
        "id": 1,
        "staffId": 4,
        "masterTaskId": 1,
        "startDate": "2026-04-13T00:00:00.000Z",
        "endDate": "2026-04-20T00:00:00.000Z",
        "isActive": true,
        "createdAt": "2026-04-13T00:00:00.000Z",
        "updatedAt": "2026-04-13T00:00:00.000Z",
        "masterTask": {
          "id": 1,
          "title": "Daily Reporting",
          "description": "Submit shift report",
          "zoneId": 100,
          "priority": "HIGH",
          "startTime": "1970-01-01T09:00:00.000Z",
          "endTime": "1970-01-01T11:30:00.000Z",
          "materials": ["mop", "bucket", "detergent"],
          "createdByAdminId": 1,
          "createdAt": "2026-04-13T00:00:00.000Z",
          "updatedAt": "2026-04-13T00:00:00.000Z"
        }
      }
    }
  ]
}
```

---

## 9. Frontend Integration Order

Recommended sequence for admin frontend integration:

1. `POST /api/auth/login`
2. `GET /api/roles`
3. `GET /api/properties/summary`
4. `GET /api/properties`
5. `GET /api/properties/:id`
6. `GET /api/properties/:id/floors`
7. `GET /api/properties/:id/floors/:floorId/zones`
8. `POST /api/properties`
9. `PATCH /api/properties/:id`
10. `DELETE /api/properties/:id`
11. `GET /api/users`
12. `GET /api/users/managers`
13. `GET /api/users/supervisors`
14. `GET /api/users/staff`
15. `GET /api/tasks`
16. `POST /api/tasks`
17. `GET /api/staff-master-tasks`
18. `POST /api/staff-master-tasks`
19. `POST /api/cron/daily-tasks`
20. `GET /api/daily-staff-tasks`

---

## 10. Important Implementation Notes

- `POST /api/tasks` and `POST /api/cron/daily-tasks` are truly admin-only in backend code.
- `POST /api/staff-master-tasks` is not admin-only in code; managers and supervisors can also assign tasks within hierarchy restrictions.
- Most read endpoints currently have no auth guard in code.
- Property create/update/delete routes also currently have no auth guard in code.
- Time fields in master tasks are returned as time-only values stored as database `Time`, but serialized as ISO datetime-like strings.
- `materials` is stored as JSON and can be `null`.
- Property image upload returns a relative URL like `/uploads/properties/<filename>`.

