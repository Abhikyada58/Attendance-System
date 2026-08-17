# Multi-Tenant Architecture (Module 29)

AttendX is a true Multi-Tenant SaaS platform. Each institution operating on AttendX is treated as an isolated "Tenant". The tenant boundary is absolute and enforced at the database level, meaning it is impossible for a developer to accidentally query data across institutions without explicit platform-level override.

## 1. The Tenant Model
The core tenant entity is the `Institute`. 
- Every academic entity (Student, Faculty, Department, Class, Course) belongs strictly to an `Institute`.
- The `User` model represents a global identity (e.g. `john@example.edu` is unique across the platform), but authorization is scoped via `user.instituteId` or through their specific Student/Faculty profile.

## 2. Tenant Context & Authentication
When a user logs in:
1. `auth.service.ts` verifies credentials and checks account status.
2. The user's `instituteId` is embedded into their securely signed JWT payload.
3. On subsequent API requests, `tenant.middleware.ts` extracts this `instituteId` and attaches it to the Express request (`req.tenantId`).

> [!WARNING]  
> AttendX **never** relies on the client passing a tenant ID (e.g., `?tenant=123`) for authorization. The tenant boundary is securely derived from the trusted JWT.

## 3. Database Isolation (The Safe Repository Pattern)
AttendX uses **Prisma Client Extensions** to enforce Row Level Security-style behavior at the ORM layer.
- Through `getTenantPrisma(tenantId)`, the Prisma client automatically intercepts all `findMany`, `findFirst`, `update`, and `delete` calls on tenant-owned models.
- It automatically injects `where: { instituteId: tenantId }`.
- **Result:** A developer simply writes `prisma.student.findMany()`, and the framework automatically guarantees it only returns students for the active user's institution.

## 4. Super Admin Platform Access
A new `SUPER_ADMIN` role exists for platform operators.
- Super Admins do not have an `instituteId` mapped to their user profile.
- They can override the tenant middleware by passing an explicit `x-tenant-id` header to manage a specific institution.
- All actions taken by a Super Admin are logged in the `AuditLog` for compliance.

## 5. Storage & Caching Boundaries
- **Cache Isolation:** `cache.service.ts` must prefix keys with `tenant:{tenantId}:` to prevent overlapping settings or sessions.
- **File Storage:** File uploads (avatars, face profiles, documents) are namespaced by their `instituteId`. Even if a user from Tenant A guesses the file URL of Tenant B, the API authorization layer will block the download.
