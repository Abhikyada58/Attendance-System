# AttendX — Incident Response Guide

## Purpose
This guide describes how to detect, contain, investigate, recover from, and review security incidents in AttendX.

---

## Severity Levels

| Severity | Description | Examples | Response Time |
|---|---|---|---|
| CRITICAL | Immediate system-wide risk | Database breach, admin compromise, mass data exposure | Immediate |
| HIGH | Significant risk to users | Account takeover, biometric data access, privilege escalation | < 1 hour |
| MEDIUM | Limited risk, contained impact | Brute force campaign, IDOR discovery, session theft | < 4 hours |
| LOW | Minor, no user impact | Single failed login, minor misconfiguration | < 24 hours |
| INFO | Informational, no action needed | Normal login, expected system behaviour | Log only |

---

## Detection Sources

### Automated Detection (Security Dashboard)
Access: **Admin → Security Monitor**

Signals to watch:
- 🔴 CRITICAL security events
- 🟠 HIGH severity events
- Spike in failed logins in the last 24 hours
- Active sessions from unexpected locations
- Rapid session creation by a single user

### Manual Detection
- User reports unusual activity via Support Ticket
- Faculty reports unauthorized attendance modification
- Admin notices unexpected setting changes in audit log

---

## Incident Response Process

### Phase 1 — DETECT

1. Check **Admin → Security Monitor** for active HIGH/CRITICAL events
2. Review failed login summary (`/admin/security/failed-logins`)
3. Check for suspicious session patterns (`/admin/security/sessions`)
4. Review audit logs for unexpected admin actions

### Phase 2 — CONTAIN

**If an account is compromised:**
```
1. Navigate to Admin → Users → [User]
2. Set account status to SUSPENDED
3. Revoke all sessions (can be done by admin via DB or API)
4. Record action in the SecurityEvent adminNotes
```

**If a token appears stolen:**
```
1. Identify the token hash from SecurityEvent logs
2. Update UserSession.revokedAt = NOW() for that session
3. Suspend user account if needed
4. Require password reset
```

**If brute force is detected:**
```
- Account lockout triggers automatically after 5 failures in 15 minutes
- For persistent attacks: block at network/firewall level
- Do NOT permanently lock the account based only on automated signals
```

**If biometric data is implicated:**
```
1. Disable FaceProfile (status = DISABLED) for affected students
2. Log BIOMETRIC_DELETED security event
3. Notify affected students via Support system
```

### Phase 3 — INVESTIGATE

1. Open the SecurityEvent in Admin → Security Monitor
2. Change status to `INVESTIGATING`
3. Record findings in `adminNotes` field
4. Review related events:
   - Same actorId
   - Same IP address
   - Same time window
5. Check AuditLog for admin actions during the incident window
6. Check LoginAttempt records for the affected email

**What NOT to do:**
- Do not accuse users based only on IP address (shared IPs are common in institutions)
- Do not permanently disable accounts without confirmation
- Do not delete security event records to "clean up"

### Phase 4 — RECOVER

1. Restore account access if the incident was resolved
2. Reset compromised credentials
3. Require password change on next login (admin can set status = PENDING or coordinate directly)
4. Re-enable suspended accounts only after verification
5. If biometric data was compromised: require re-enrollment after policy review

### Phase 5 — REVIEW

After every MEDIUM or higher incident:
1. Update SecurityEvent status to `RESOLVED`
2. Document what happened, how it was detected, how it was contained
3. Identify if any system control failed
4. Determine if code/configuration changes are needed
5. Update this incident response guide if the process was insufficient

---

## Common Scenarios

### Scenario A: Student reports "I didn't log that attendance"
1. Check AttendanceRecord for the session
2. Review QRCodeToken used (if QR method)
3. Check FaceProfile scans (if face method)
4. Verify if attendance was corrected — check AttendanceCorrectionRequest
5. If fraud suspected: log ATTENDANCE_FRAUD_DETECTED event

### Scenario B: Admin account shows unusual activity
1. Immediately check AuditLog for admin actions in last 24h
2. Check SessionRecord for that admin's recent logins
3. If unauthorized access: suspend account, revoke all sessions
4. Require password reset through out-of-band communication
5. Log HIGH severity SecurityEvent

### Scenario C: Mass failed logins against many accounts
1. Check `/admin/security/failed-logins` — look at suspiciousEmails
2. Note IP addresses — if same IP: network-level block
3. Verify account lockout is functioning (check LoginAttempt records)
4. Log SUSPICIOUS_ACTIVITY event
5. Monitor for 24 hours

### Scenario D: User requests account deletion
1. Soft-delete the User account (status = INACTIVE)
2. Delete biometric data (FaceProfile) immediately
3. Log BIOMETRIC_DELETED if biometric data existed
4. Retain attendance records as required by institutional policy
5. Delete notifications, session records
6. Do NOT delete AuditLog entries

---

## Contact Points

| Role | Responsibility |
|---|---|
| System Administrator | Account management, session revocation, DB access |
| Security Administrator | Incident investigation, SecurityEvent management |
| Faculty | Report attendance anomalies |
| Support Staff | First line of user-reported incidents |

---

## Post-Incident Communication

**To affected users:**
- Notify via Support Ticket (category: ACCOUNT)
- Do not reveal investigation details
- Advise: change password, review active sessions

**To administrators:**
- Log in AdminNotes of the SecurityEvent
- Update status and resolution details

---

## Disclaimer

This incident response plan is designed for an educational AttendX deployment. A production system in an institution handling real student data should adapt this plan to institutional policies and, where required, applicable regulatory requirements.
