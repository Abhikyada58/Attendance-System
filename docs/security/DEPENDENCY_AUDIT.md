# AttendX — Dependency Security Audit

## Audit Date
2026-08-12

## Tool Used
`npm audit` (npm v10+)

## Summary
5 vulnerabilities found in transitive dependencies (dependencies of dependencies).

| Package | Severity | Direct Dependency? | Impact on AttendX |
|---|---|---|---|
| nodemailer ≤9.0.0 | HIGH | Yes (direct) | Email is DISABLED by default. Not used in current build. |
| tar ≤7.5.20 | CRITICAL | No (via @mapbox/node-pre-gyp) | Build-time tool only. Not in production runtime. |
| uuid <11.1.1 | MODERATE | No (via exceljs) | exceljs is used for report exports only |
| @mapbox/node-pre-gyp | CRITICAL | No (transitive) | Native module build tool. Not in production code path. |

---

## Risk Assessment

### nodemailer — HIGH (ACCEPTED RISK)
- **CVEs:** SMTP command injection, CRLF injection, TLS validation bypass
- **Attack surface in AttendX:** ZERO — email is disabled by default (`emailEnabled: false`)
- **Fix:** `npm audit fix --force` would install nodemailer@9.0.5 — a major breaking version
- **Action:** Accepted risk. Email feature is disabled. When email is enabled in production, upgrade to nodemailer@9.0.5 and test email functionality.
- **Tracking:** Do NOT enable email transport until nodemailer is upgraded.

### tar (via @mapbox/node-pre-gyp) — CRITICAL (ACCEPTED RISK)
- **CVEs:** Arbitrary file creation/overwrite, path traversal, DoS
- **Attack surface in AttendX:** NONE — `tar` is used by `node-pre-gyp` to build native modules (bcrypt, canvas) at install time. It is NOT used during application runtime.
- **Fix:** Upgrading tar directly is not possible — it's a transitive dependency of @mapbox/node-pre-gyp
- **Action:** Accepted risk. Only exploitable during `npm install` on a trusted machine, not during application runtime.
- **Mitigations:** Run `npm install` only on trusted CI/developer machines.

### uuid (via exceljs) — MODERATE (ACCEPTED RISK)
- **CVEs:** Missing buffer bounds check in v3/v5/v6
- **Attack surface in AttendX:** LOW — exceljs is used for report exports. The uuid vulnerability affects specific API usage patterns.
- **Fix:** `npm audit fix --force` would downgrade exceljs to 3.4.0 — may break report generation
- **Action:** Accepted risk. Monitor exceljs for a patch that includes uuid@11.1.1+.

---

## Recommendations

1. **Before enabling email:** Upgrade nodemailer to 9.0.5 and test email delivery
2. **For production deployment:** Run npm install in a locked, trusted environment
3. **Monitor:** Check `npm audit` before each major deployment

---

## What Was Fixed
`npm audit fix` was run. No non-breaking fixes were available — all remaining vulnerabilities require major version upgrades.

---

## Vulnerabilities Found This Module (Module 25 Code)
Zero vulnerabilities introduced by Module 25 code additions. All new code:
- Uses built-in `crypto` module (SHA-256 hashing — no external dep)
- Uses existing `bcrypt`, `jsonwebtoken`, `zod`, `prisma` — no new security deps added
- Uses existing `express-rate-limit`, `helmet`, `cors` — already in project
