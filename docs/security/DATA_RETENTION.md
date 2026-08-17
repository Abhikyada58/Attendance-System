# AttendX — Data Retention Policy

## Purpose
This document defines how long AttendX retains different types of data and the reasoning behind each period.

> **Note:** These retention periods are configurable by system administrators. Adjust them to match your institution's academic policies.

---

## Retention Schedule

| Data Type | Retention Period | Reason | Deletion Method |
|---|---|---|---|
| User accounts | Indefinite while enrolled | Academic records requirement | Soft delete on graduation |
| Attendance records | Indefinite (academic record) | Required for transcripts/audits | Never auto-deleted |
| Session tokens (UserSession) | 30 days after expiry | Security audit trail | Cron job cleanup |
| Login attempt records (LoginAttempt) | 30 days | Brute force pattern analysis | Cron job cleanup |
| Security events (SecurityEvent) | 1 year | Security audit history | Cron job archive |
| Notifications | 90 days | User access, then no value | Cron job cleanup |
| Support tickets | 2 years after closure | Institutional accountability | Soft delete |
| Biometric embeddings | Until deletion requested | Consent-based | Manual + audited |
| Audit logs (AuditLog) | 3 years | Administrative accountability | Never auto-deleted |
| Data export requests | 7 days | Track abuse, then clean | Cron job cleanup |
| Password reset tokens | On use or 24h | Security | Auto-expire |

---

## Retention Rationale

### Attendance Records — Kept Indefinitely
Academic attendance records are institutional records. Students may need them for:
- Grade disputes
- Scholarship applications
- Graduation verification
- Regulatory audits

**Do not auto-delete attendance records.**

### Session Records — 30 Days
Active sessions expire in 7 days. Revoked sessions are retained for 30 days to support:
- Session replay detection
- Security incident investigation

### Security Events — 1 Year
Security events are needed for:
- Incident response investigations
- Pattern analysis of attacks
- Compliance demonstration

### Biometric Data — Consent-Based
Face embeddings are retained until:
- The student requests deletion
- The institution updates its biometric policy
- The student's enrollment ends (institutional policy decision)

**Biometric deletion is always audited.**

---

## Retention Jobs (Automated Cleanup)

The backend cron job (`src/cron.ts`) runs these cleanup tasks:

| Job | Schedule | Action |
|---|---|---|
| Expired session cleanup | Daily at 2:00 AM | Delete expired/revoked sessions older than 30 days |
| Old login attempt cleanup | Daily at 2:30 AM | Delete login attempts older than 30 days |
| Old notification cleanup | Daily at 3:00 AM | Delete read notifications older than 90 days |
| Old security event archive | Weekly Sunday 4:00 AM | Flag resolved events older than 1 year |

---

## Soft Delete vs Hard Delete

| Resource | Delete Type | Reason |
|---|---|---|
| User accounts | Soft delete (status=INACTIVE) | Historical attendance records must remain |
| Attendance records | Hard delete not allowed | Academic integrity |
| Support tickets | Soft delete | Institutional accountability |
| Biometric data | Hard delete (audited) | Privacy — no reason to keep |
| Session records | Hard delete after 30 days | No long-term value |
| Notifications | Hard delete after 90 days | No long-term value |

---

## Configuring Retention Periods

Retention periods can be adjusted by administrators via:
- `SystemSetting` table entries
- Direct cron job configuration in `backend/src/cron.ts`

Contact your system administrator to adjust retention to match institutional requirements.

---

## Backup Retention

Database backups should be treated with the same sensitivity as the live data.
- Backups containing biometric data must be encrypted
- Backup access must be restricted to system administrators
- Backup retention should align with the data categories above

---

## Disclaimer

These retention periods are suggestions for a student project. A production deployment must align retention periods with applicable academic, legal, and institutional requirements.
