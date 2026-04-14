{{baseUrl}}/api/manager/dashboard or {{baseUrl}}/api/manager/dashboard?date={{taskDate}}
response: {
    "data": {
        "profile": {
            "name": "Default Manager",
            "initials": "DM",
            "role": "MANAGER"
        },
        "context": {
            "label": "HO - Evening",
            "shift": "EVENING",
            "shiftLabel": "Evening"
        },
        "stats": {
            "needsReview": 0,
            "approved": 1,
            "rejected": 1
        },
        "completion": {
            "percent": 50,
            "done": 1,
            "pending": 1,
            "total": 2
        },
        "urgentTasks": [],
        "zones": [
            {
                "zoneId": 4,
                "zoneName": "HR Desk",
                "propertyName": "HO",
                "floorNo": 1,
                "assigned": 1,
                "done": 1,
                "percent": 100,
                "healthBand": "HIGH"
            }
        ],
        "recentActivity": [
            {
                "id": 2,
                "action": "APPROVED",
                "decidedAt": "2026-04-14T13:27:58.919Z",
                "timeDisplay": "6:57 pm",
                "taskTitle": "Daily Reporting",
                "staffName": "Default Staff",
                "note": null
            },
            {
                "id": 1,
                "action": "REJECTED",
                "decidedAt": "2026-04-14T09:13:53.228Z",
                "timeDisplay": "2:43 pm",
                "taskTitle": "Daily Attendance Check",
                "staffName": "Default Staff",
                "note": "Dust on surface. Please re-clean and upload after photo."
            }
        ],
        "badges": {
            "tasksPending": 0,
            "notificationsUnread": 0
        },
        "date": "2026-04-14T00:00:00.000Z",
        "shiftInProgress": false
    }
}
2. {{baseUrl}}/api/manager/profile
response: {
    "data": {
        "profile": {
            "manager_id": 2,
            "full_name": "Default Manager",
            "email": "manager@madhuban360.com",
            "initials": "DM",
            "role": "MANAGER"
        },
        "badges": {
            "shift": "EVENING",
            "status": "INACTIVE"
        },
        "account": {
            "propertyLabel": "HO - Evening",
            "reportingTo": null,
            "appVersion": "1.0.0"
        }
    }
}
3. {{baseUrl}}/api/manager/tasks?supervisorId={{supervisorUserId}}&date={{taskDate}}&filter=all&page=1&limit=20
response: {
    "data": {
        "date": "2026-03-28T00:00:00.000Z",
        "supervisorId": 3,
        "filter": "all",
        "counts": {
            "all": 0,
            "critical": 0,
            "high": 0,
            "done": 0
        },
        "progress": {
            "done": 0,
            "total": 0,
            "percent": 0
        },
        "tasks": [],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 0,
            "totalPages": 1
        }
    }
}
4. {{baseUrl}}/api/manager/reports/shift?date={{taskDate}}
response: {
    "data": {
        "date": "2026-03-28T00:00:00.000Z",
        "overview": {
            "completion": {
                "percent": 0,
                "done": 0,
                "pending": 0,
                "total": 0
            },
            "approvals": {
                "approved": 0,
                "pending": 0,
                "rejected": 0
            }
        },
        "zones": [],
        "functions": [],
        "employees": [],
        "escalations": [
            {
                "kind": "NO_SHOW",
                "staffId": 4,
                "staffName": "Default Staff",
                "label": "No Show",
                "time": null
            }
        ]
    }
}
5. {{baseUrl}}/api/manager/reports/shift/employees/{{staffId}}?date={{taskDate}}
response: probably the same as above
 