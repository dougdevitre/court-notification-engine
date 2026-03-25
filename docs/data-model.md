# Court Notification Engine Data Model

## Entity Relationship Diagram

```mermaid
erDiagram
    NOTIFICATION {
        string id PK
        string userId FK
        string channel "sms | email | push | in-app"
        string template
        json data
        string urgency "critical | high | medium | low"
        string status "pending | queued | sent | delivered | opened | acknowledged | failed | bounced"
        string eventType
        string caseId
        datetime createdAt
        datetime scheduledFor
        datetime sentAt
    }

    SCHEDULED_JOB {
        string id PK
        string notificationId FK
        datetime scheduledFor
        string status "pending | processing | completed | cancelled"
        int retryCount
        datetime lastAttemptAt
    }

    ESCALATION_CHAIN {
        string id PK
        string notificationId FK
        string userId
        string status "active | acknowledged | completed | cancelled"
        datetime createdAt
    }

    ESCALATION_STEP {
        string id PK
        string chainId FK
        string channel
        int delayMinutes
        string urgency
        int stepOrder
        string status "pending | triggered | skipped"
        datetime triggeredAt
    }

    DELIVERY_EVENT {
        string id PK
        string notificationId FK
        string eventType "sent | delivered | opened | clicked | bounced | failed"
        datetime timestamp
        json metadata
    }

    NOTIFICATION_TEMPLATE {
        string id PK
        string name
        string subject
        text body
        text smsBody
        string locale
        datetime createdAt
        datetime updatedAt
    }

    DEVICE_REGISTRATION {
        string id PK
        string userId FK
        string deviceToken
        string platform "ios | android | web"
        datetime registeredAt
        datetime lastUsedAt
    }

    USER_PREFERENCE {
        string id PK
        string userId FK
        string channel
        boolean enabled
        string quietHoursStart
        string quietHoursEnd
        string timezone
    }

    RECOVERY_PLAN {
        string id PK
        string userId FK
        string caseId
        string missedAction
        datetime originalDeadline
        string severity
        datetime createdAt
    }

    RECOVERY_STEP {
        string id PK
        string planId FK
        string action
        string urgency
        datetime dueDate
        string status "pending | completed | skipped"
    }

    NOTIFICATION ||--o{ DELIVERY_EVENT : tracks
    NOTIFICATION ||--o| SCHEDULED_JOB : schedules
    NOTIFICATION ||--o| ESCALATION_CHAIN : escalates
    ESCALATION_CHAIN ||--o{ ESCALATION_STEP : contains
    NOTIFICATION_TEMPLATE ||--o{ NOTIFICATION : renders
    DEVICE_REGISTRATION ||--o{ NOTIFICATION : targets
    USER_PREFERENCE ||--o{ NOTIFICATION : filters
    RECOVERY_PLAN ||--o{ RECOVERY_STEP : contains
```

## Key Relationships

- A **Notification** represents a single message sent (or to be sent) to a user via a specific channel
- **Scheduled Jobs** manage future delivery of notifications with retry logic
- **Escalation Chains** define a sequence of increasingly urgent notifications when earlier ones go unacknowledged
- **Delivery Events** form an audit trail of what happened to each notification (sent, opened, bounced, etc.)
- **Templates** define reusable message formats with variable interpolation for different channels
- **Device Registrations** track push notification tokens per user and platform
- **User Preferences** control per-channel opt-in/opt-out and quiet hours
- **Recovery Plans** are created when deadlines are missed, containing ordered recovery steps
