# AttendX — Security Architecture

## Overview
AttendX implements Defense in Depth — multiple overlapping security layers so no single failure compromises the system.

---

## Authentication

### Password Hashing
- Algorithm: **bcrypt** with 10 salt rounds
- Passwords are never stored in plaintext
- Passwords are never logged or returned in API responses

### Password Policy
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 digit
- Password changes require current password verification

### JWT Tokens
- Signed with `HS256` using a secret from environment variable `JWT_SECRET`
- Default expiry: 7 days (configurable via `JWT_EXPIRES_IN`)
- Token payload contains only: `userId`, `role`
- Sensitive fields (email, name, etc.) are never in the JWT

---

## Session Management

### Session Tracking (Module 25)
Every login creates a `UserSession` record containing:
- SHA-256 hash of the JWT (never the raw token)
- Device info (parsed from User-Agent)
- IP address
- createdAt, lastUsedAt, expiresAt

The raw JWT is never stored. Only its hash is kept.

### Session Verification
On every authenticated request:
1. JWT is cryptographically verified
2. User account status is checked (SUSPENDED → rejected)
3. Session revocation is checked via tokenHash lookup

### Session Revocation
Users can:
- View all their active sessions
- Revoke any specific session
- Revoke all sessions except the current one

Admins can view all system-wide active sessions.

---

## Account Lockout

After **5 failed login attempts** within **15 minutes**, the account email is temporarily locked.

- Lockout duration: 15 minutes from first failure in the window
- Lockout is per-email, not per-IP (prevents IP-rotation bypass while not punishing shared IPs)
- All lockout events are logged as `ACCOUNT_LOCKED` security events

---

## Authorization

### Role-Based Access Control (RBAC)
Three roles exist: `STUDENT`, `FACULTY`, `ADMIN`

- `requireAuth` middleware: verifies JWT + session
- `requireRole(...)` middleware: enforces role restrictions
- Every protected endpoint uses both middlewares

### Resource Ownership (IDOR Protection)
- Attendance records: verified against student's own records
- Sessions: users can only revoke their own sessions
- Tickets: users see only their own tickets
- Reports: users can only export their own data

### Admin-only Routes
- `/admin/*` — requires `ADMIN` role
- `/admin/security/*` — requires `ADMIN` role
- Security event `adminNotes` field is only returned on admin endpoints

---

## Rate Limiting

| Endpoint | Window | Limit |
|---|---|---|
| POST /auth/login | 15 min | 10 requests |
| POST /auth/register | 1 hour | 5 requests |
| POST /privacy/export | 24 hours | 2 requests |
| Global (production) | 15 min | 500 requests |
| Dev/Test | — | Unlimited |

---

## API Security

### Input Validation
All request bodies are validated using **Zod schemas** before reaching business logic.
- Unknown fields are stripped
- String fields have max length limits
- Email fields are normalized (lowercased, trimmed)

### Output Security
API responses never contain:
- `passwordHash`
- JWT tokens (except on login)
- `tokenHash` from session records
- Raw biometric embeddings
- Internal database IDs not relevant to the user

### Request Correlation
Every response includes `X-Request-ID` header for audit tracing.

---

## Security Headers

Configured via Helmet.js:

| Header | Value |
|---|---|
| `Content-Security-Policy` | Restricts script/style/image/connect sources to `'self'` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `HSTS` | Enabled in production (1 year, includeSubDomains, preload) |

---

## CORS

- Development: `localhost:3000`, `localhost:3001`
- Production: Configured via `ALLOWED_ORIGINS` environment variable
- Wildcard CORS (`*`) is never used in production

---

## Security Event Logging

Every significant action is logged to the `SecurityEvent` table:

| Event | Severity |
|---|---|
| LOGIN_SUCCESS | INFO |
| LOGIN_FAILED | LOW |
| ACCOUNT_LOCKED | MEDIUM |
| PASSWORD_CHANGED | MEDIUM |
| SESSION_REVOKED | LOW |
| ALL_SESSIONS_REVOKED | MEDIUM |
| UNAUTHORIZED_ACCESS | MEDIUM |
| BIOMETRIC_DELETED | HIGH |
| ADMIN_SETTING_CHANGED | MEDIUM |
| SUSPICIOUS_ACTIVITY | HIGH |

Logged data: type, severity, actorId, targetId, IP address, User-Agent, request ID.
**Never logged:** passwords, tokens, biometric embeddings.

---

## Biometric Data

- Face embeddings stored as float arrays in `FaceProfile` table
- Never returned via public API responses
- Only accessible to the face recognition service
- Deletion is audited as `BIOMETRIC_DELETED` security event
- Students cannot access other students' biometric data

---

## QR Token Security

- QR tokens are stored as hashes in `QRCodeToken` table
- Each token has an `expiresAt` and `revokedAt`
- Expired or revoked tokens are rejected
- Tokens are bound to a specific attendance session

---

## Environment Variables

All secrets must be set via environment variables:
- `JWT_SECRET` — JWT signing secret (min 32 chars)
- `DATABASE_URL` — Database connection string
- `ALLOWED_ORIGINS` — Production CORS origins

Secrets are never committed to the repository.

---

## Dependency Security

```bash
npm audit         # Check for known vulnerabilities
npx tsc --noEmit  # TypeScript type safety check
```

---

## Known Limitations

1. **No MFA yet** — TOTP library is installed but MFA is not yet enforced for admin accounts
2. **No refresh tokens** — JWT-only authentication (session revocation partially mitigates this)
3. **Export is synchronous** — For large accounts, export should be made async with email delivery
4. **No CAPTCHA** — Rate limiting and lockout are used instead
5. **Face recognition privacy** — Biometric consent tracking is not yet fully implemented in UI
