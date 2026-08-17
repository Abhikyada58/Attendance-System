# Business Continuity Plan (BCP)

The Business Continuity Plan defines how AttendX continues operating in a **Degraded Mode** when non-critical subsystems fail.

## 1. Service Priorities

| Tier | Services | Continuity Strategy |
| :--- | :--- | :--- |
| **Tier 1 (Critical)** | Core Database, API, Manual & QR Attendance | Must remain operational. If down, system is considered in full outage. |
| **Tier 2 (Important)** | AI Face Recognition, Notification Dispatcher | If down, gracefully degrade. Users fallback to QR/Manual. Notifications are queued for later delivery. |
| **Tier 3 (Non-Critical)**| Analytics, Gamification, Leaderboards | If down, UI components hide or show a "Temporarily Unavailable" state. Core attendance is unaffected. |

## 2. Degraded Modes

### AI Service Unavailable
If the AI Face Recognition container or third-party API goes down:
- The `health/` endpoint will report status as `degraded`.
- The Frontend will detect the degraded state and disable the "Face Scan" button, showing an alert: "AI Services are temporarily offline. Please use QR Attendance."
- **Attendance is not blocked.**

### Notification Service Failure
If the email provider (e.g., SendGrid) blocks our account or goes offline:
- The `queue.service.ts` will attempt to deliver the notification.
- Upon failure, it will retry up to 3 times with exponential backoff.
- If it definitively fails, it logs a `JOB_DEAD_LETTER` error.
- **Attendance is not blocked.** The student still successfully marks attendance in the database, they just don't get the confirmation email.

## 3. Read-Only Mode
In severe scenarios where write capacity is compromised (e.g., database primary goes down but a read-replica is available), AttendX can be restarted with the environment variable `MAINTENANCE_MODE=READ_ONLY`. 
- Faculties can view historical attendance and reports.
- New attendance marking will be temporarily disabled with a clean UI message.
