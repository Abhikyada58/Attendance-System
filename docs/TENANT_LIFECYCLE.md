# Tenant Lifecycle Management (Module 29)

This document defines the lifecycle states and transitions for an Institution (Tenant) within AttendX.

## 1. Lifecycle States
- **PENDING:** An institution has requested onboarding, or a Super Admin has provisioned the shell of the tenant, but activation is incomplete. Logins for users mapped to this tenant are disabled.
- **ACTIVE:** The institution is fully functional. Students and Faculty can log in, mark attendance, and generate reports.
- **SUSPENDED:** Platform administration has paused the tenant (e.g., for non-payment or compliance violations).
  - Users attempting to login receive a `403 Forbidden` with a message "Your institution account has been temporarily suspended."
  - Background jobs (Notifications, Alerts) for this tenant are paused.
- **ARCHIVED:** The institution is no longer an active customer. Data is retained strictly for compliance purposes (respecting Module 25 Privacy retention). Write operations are permanently disabled.

## 2. Tenant Deletion (Offboarding)
AttendX does not support "one-click" deletion of an institution to prevent catastrophic data loss.
- **Process:** The institution is first moved to `ARCHIVED`.
- **Soft Delete:** A script deletes all PII (Face Profiles, personal emails) but retains aggregated historical attendance stats if contractually allowed.
- **Hard Delete:** After 30 days in `ARCHIVED` state, a Super Admin can trigger a hard delete script that cascades through all tenant-owned models.

## 3. Data Migration & Export
- If an institution leaves AttendX, they can request a full data export.
- The export script uses `getTenantPrisma(tenantId)` to pull a JSON snapshot of their Users, Academic Structure, and Attendance Records, ensuring no platform-level data or other institutions' data is included in the payload.
