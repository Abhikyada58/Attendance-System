# Disaster Recovery (DR) Plan

This document outlines how AttendX recovers from catastrophic failure domains.

## 1. Disaster Scenarios & Responses

### Scenario A: Total Database Corruption / Deletion
- **Detection**: Application throws 500 errors on all read/write paths; `health/ready` check fails.
- **Containment**: Route traffic to a static "Maintenance" page.
- **Recovery**: 
  1. Provision a new PostgreSQL instance.
  2. Run `scripts/restore.ts` selecting the latest `.sql` backup.
  3. Re-run `npx prisma migrate deploy` to ensure schema definitions match code.
  4. Run `integrity.service.ts` full scan to ensure data structure is sound.
- **RTO:** 15-30 minutes.

### Scenario B: Application Server Compromise
- **Detection**: Module 25 Security Audit logs abnormal admin activity or unexpected SSH access.
- **Containment**: Immediately sever external network access to the server. Revoke all API keys and rotate the `JWT_SECRET`.
- **Recovery**:
  1. Deploy a fresh environment from CI/CD to a new server instance.
  2. Force logout all users by incrementing a global session version or relying on the rotated `JWT_SECRET`.
  3. Restore configuration from secure vault (do not pull `.env` from the compromised server).

### Scenario C: Bad Deployment / Migration
- **Detection**: New release crashes on startup or corrupts new records.
- **Containment**: Immediately rollback CI/CD deployment to the previous stable SHA.
- **Recovery**: If a database migration was destructive, restore the database to the point-in-time immediately before the deployment.

> [!CAUTION]
> Never manually edit the `_prisma_migrations` table to "fix" a bad migration state. Always restore from backup if a migration corrupts production data.
