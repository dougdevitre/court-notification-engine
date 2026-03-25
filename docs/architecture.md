# Court Notification Engine — Architecture

## Overview

The notification engine processes court events (hearings, deadlines, case updates) and delivers timely, plain-language notifications through the most appropriate channel. It supports escalation chains (reminders that increase in urgency) and recovery flows (guidance when an action is missed).

---

## 1. Notification Pipeline

Every notification flows through a consistent pipeline: event intake, template rendering, channel routing, delivery, and tracking.

```mermaid
flowchart TD
    A[Event Source] --> B[NotificationEngine]
    B --> C{Urgency Level}
    C -->|Critical| D[Immediate Send]
    C -->|High| E[Queue with Priority]
    C -->|Medium| F[Batch Digest]
    C -->|Low| G[Next Digest Cycle]

    D --> H[TemplateEngine]
    E --> H
    F --> H
    G --> H

    H --> I[ChannelRouter]
    I --> J[SMS Provider]
    I --> K[Email Provider]
    I --> L[Push Service]
    I --> M[In-App Store]

    J --> N[DeliveryTracker]
    K --> N
    L --> N
    M --> N
```

---

## 2. Channel Routing

The channel router selects the best delivery channel based on user preferences, urgency level, and message type. Users can set preferred channels per notification type.

```mermaid
flowchart LR
    subgraph UserPreferences
        UP1[Preferred: SMS]
        UP2[Fallback: Email]
        UP3[Quiet Hours: 10pm-7am]
    end

    subgraph ChannelRouter
        CR1{Is urgent?}
        CR2{Quiet hours?}
        CR3{Channel available?}
    end

    subgraph Channels
        SMS[SMS Provider]
        EMAIL[Email Provider]
        PUSH[Push Notification]
        INAPP[In-App Alert]
    end

    UP1 --> CR1
    CR1 -->|Yes| SMS
    CR1 -->|No| CR2
    CR2 -->|Yes| INAPP
    CR2 -->|No| CR3
    CR3 -->|SMS available| SMS
    CR3 -->|SMS unavailable| EMAIL
```

---

## 3. Escalation Logic

Escalation chains send a sequence of reminders with increasing urgency as a deadline approaches. If the user acknowledges a reminder, the remaining chain is cancelled.

```mermaid
sequenceDiagram
    participant S as Scheduler
    participant E as EscalationManager
    participant N as NotificationEngine
    participant U as User
    participant T as DeliveryTracker

    Note over S: 7 days before hearing
    S->>E: Trigger reminder chain
    E->>N: Send email (informational)
    N->>U: "Your hearing is in 7 days"
    U-->>T: Opens email

    Note over S: 3 days before hearing
    S->>E: Next in chain
    E->>N: Send SMS (important)
    N->>U: "Hearing in 3 days — prepare docs"

    Note over S: 1 day before hearing
    S->>E: Next in chain
    E->>N: Send SMS + Push (urgent)
    N->>U: "TOMORROW: Hearing at 9am"

    Note over S: Day of hearing
    S->>E: Final reminder
    E->>N: Send Push (critical)
    N->>U: "TODAY: Hearing in 2 hours"
```

---

## 4. Recovery Flow

When the delivery tracker detects that a deadline has passed without user acknowledgment, the recovery advisor generates context-specific suggestions for next steps.

```mermaid
flowchart TD
    A[DeliveryTracker] --> B{Action taken<br/>before deadline?}
    B -->|Yes| C[Mark Complete]
    B -->|No| D[RecoveryAdvisor]

    D --> E{Event Type}
    E -->|Missed Hearing| F["Suggest: File motion to vacate,<br/>contact legal aid"]
    E -->|Missed Filing| G["Suggest: Emergency filing,<br/>explain consequences"]
    E -->|Missed Payment| H["Suggest: Payment plan,<br/>hardship waiver"]

    F --> I[Recovery Notification]
    G --> I
    H --> I

    I --> J[Send via preferred channel]
```

---

## Data Flow Summary

1. **Event sources** (court calendars, case updates) feed events into the engine
2. **Notification engine** determines urgency and routes to the template engine
3. **Template engine** renders plain-language messages
4. **Channel router** selects SMS, email, push, or in-app based on preferences + urgency
5. **Delivery tracker** monitors opens, clicks, and acknowledgments
6. **Recovery advisor** intervenes with helpful suggestions when deadlines are missed
