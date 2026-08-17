# API Security Policy (Module 30)

## 1. Authentication
- Human interactions (Web/Mobile apps) authenticate via JWT tokens exchanged during the OAuth or Password flow.
- Machine-to-Machine integrations authenticate using an `x-api-key` header. API keys are generated per-tenant and cryptographically hashed before storage in the `ApiKey` table. Raw keys are never stored.

## 2. Authorization
API Keys are constrained by:
- **Tenant Scope:** If created by an Institution Admin, the key inherently locks all database queries to that specific `instituteId` via the Prisma Client Extension.
- **Expiration:** Keys can have TTLs to force rotation.
- **Revocation:** Administrators can manually revoke a key.

## 3. Idempotency
Critical mutation endpoints (e.g., POST `/attendance/qr/validate`) check the `Idempotency-Key` header to prevent double-processing. 
This protects the system against network retries that could unintentionally corrupt data by attempting the same operation twice.

## 4. Rate Limiting
Global rate limiting enforces 500 requests per 15 minutes per IP. 
Future development will add specific quotas per `tenantId` to protect against noisy-neighbor attacks where one institution's faulty integration overwhelms the platform.
