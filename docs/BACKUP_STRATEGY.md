# Backup Strategy

AttendX utilizes `pg_dump` and automated retention scripts to ensure business data is safely archived and recoverable.

## 1. Backup Schedule & RPO
- **Full Database Backup:** Runs daily at 1:00 AM.
- **RPO (Recovery Point Objective):** 24 hours. In the worst-case scenario (total unrecoverable database cluster loss), up to 24 hours of attendance data may need to be reconstructed.
- **Location:** Backups are saved to the `backups/` directory (which should be mounted to off-site object storage like AWS S3 in production).

## 2. Retention Policy
- **Daily:** Retained for 7 days.
- Older backups are automatically purged by `scripts/backup.ts` to conserve storage costs, as per Module 25 Privacy Guidelines (we do not retain stale biometric metadata longer than necessary).

## 3. Restore Strategy & RTO
- **Restore Tool:** `pg_restore -c` (Clean and recreate).
- **RTO (Recovery Time Objective):** < 15 minutes. The actual restore process takes seconds for small databases, and under 5 minutes for gigabyte-scale data.
- **Verification:** Every restore must be followed by `npx prisma migrate deploy` to ensure schema consistency, followed by an automated integrity check (`integrity.service.ts`).

> [!IMPORTANT]
> Never restore backups directly into production to "test" them. Restore tests must be executed in an isolated staging environment.

## 4. File Backups
Uploaded files (e.g., Avatars, Face Profiles, Documents) are stored externally (e.g., AWS S3). The S3 bucket must have **Object Versioning** enabled to protect against accidental deletion. File backups are managed by the storage provider.
