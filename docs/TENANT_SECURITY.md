# Tenant Security Policies (Module 29)

This document outlines the strict security boundaries enforced across AttendX for multi-tenancy.

## 1. Feature Isolation
Tenant A must never bleed into Tenant B.
- **Attendance / QR Code:** QR Tokens embed the `sessionId`, which belongs to a `TeachingAssignment`, which belongs to a `Class`, which belongs to an `Institute`. The validation flow confirms the student scanning the code shares the exact same `instituteId` as the QR session.
- **Face Recognition AI:** AI Biometric searches are hard-filtered. When a student scans their face at Tenant A, the Face Matching engine *only* pulls vector embeddings for students mapped to Tenant A. Global similarity searches are blocked at the ORM layer.
- **Notifications:** Background jobs that process notifications inject `instituteId` into the queue payload. Only users mapped to that tenant receive the push.

## 2. Platform Roles
### Super Admin
- Platform-level users (e.g. system developers or sales team).
- `User.role === 'SUPER_ADMIN'`
- Can create new institutions, suspend them, and manage global settings.
- Can assume the role of an Institution Admin by passing `x-tenant-id` to debug tenant-specific issues.

### Institution Admin (ADMIN)
- `User.role === 'ADMIN'` with a valid `instituteId`.
- Can manage Departments, Faculty, Classes, and Students *only* within their `instituteId`.
- Completely locked out from global settings (e.g., configuring AWS S3 or Twilio credentials).

## 3. Data Leak Prevention (DLP)
- **Exports (CSV/PDF):** Report generation explicitly uses `getTenantPrisma(tenantId)` to pull data. It is mathematically impossible for a faulty API endpoint to export the entire global `Student` table to a user, as the Prisma Extension will append `WHERE instituteId = 'XYZ'`.
- **Error Messages:** If a user tries to access a record belonging to another institution, the API will respond with `404 Not Found` rather than `403 Forbidden` to prevent them from enumerating valid IDs from other tenants.
