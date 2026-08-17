# API Development Guide (Module 30)

This guide outlines how to build consistent, secure, and idempotent APIs in AttendX.

## 1. Directory Structure
Endpoints are located in `src/routes/v1/`.
Controllers are in `src/controllers/`.

## 2. Authentication & Tenancy
Every protected route must use `requireAuth`.
This middleware:
1. Validates JWT or `x-api-key`.
2. Extracts `instituteId` (Tenant).
3. Attaches `req.user` and `req.tenantId`.

**Important**: In controllers, ALWAYS fetch the `getTenantPrisma(req.tenantId)` instance for DB calls to prevent cross-tenant data leakage.

## 3. Idempotency
For endpoints that mutate state and could be dangerously retried (e.g., Marking Attendance, Creating Payments), wrap the route in `idempotencyMiddleware`.

```typescript
router.post('/qr/scan', idempotencyMiddleware, qrController.scanToken);
```

Clients can then pass the `Idempotency-Key` header (usually a UUID). If they retry the exact same request, the middleware intercepts it and returns the cached 2xx response.

## 4. Error Handling
Never expose raw database errors. Use `AppError` which translates to a standard JSON envelope:
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Student not found"
  }
}
```

## 5. Webhooks
When a significant business event occurs, dispatch it via `webhookService`:
```typescript
webhookService.dispatchEvent(tenantId, 'attendance.created', { studentId, status: 'PRESENT' });
```
The service handles HMAC signing and exponential backoff retry.
