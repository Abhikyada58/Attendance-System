# AttendX — Privacy Documentation

## What Data AttendX Collects and Why

This document describes the personal data AttendX stores, why it is collected, who can access it, and how it is managed.

---

## Data Categories

### 1. Identity Data — CONFIDENTIAL
| Field | Purpose |
|---|---|
| Name | Display in UI, identify user in records |
| Email | Authentication, communication |
| Role | Determine access permissions |
| Student/Faculty ID | Academic record linking |
| Department/Institute | Academic structure assignment |

**Who can access:** The user themselves, ADMIN accounts.
**API note:** Passwords are never returned in any response.

---

### 2. Attendance Data — CONFIDENTIAL
| Field | Purpose |
|---|---|
| Session records | Track class participation |
| Attendance status (PRESENT/ABSENT/LATE/EXCUSED) | Academic compliance |
| Marked timestamp | Audit trail |

**Who can access:** The student (own records), assigned Faculty (for their classes), ADMIN.
**Protection:** Faculty can only access attendance for classes they are assigned to teach.

---

### 3. Biometric Data — HIGHLY SENSITIVE
| Field | Purpose |
|---|---|
| Face embedding (float array) | Face recognition attendance |
| Enrollment status | Track biometric setup |

**Who can access:** Face recognition service only. Not returned via user-facing API.
**Deletion:** Students can request deletion through the Support system or admin.
**Retention:** Deleted immediately when requested and access is revoked.

---

### 4. Session & Security Data — INTERNAL
| Field | Purpose |
|---|---|
| Token hash (SHA-256 of JWT) | Session validity check |
| Device info (parsed from User-Agent) | Session management display |
| IP address | Security event context |
| Login attempt records | Brute force protection |

**Who can access:** The user (own sessions), ADMIN (all sessions for security monitoring).
**Retention:** Sessions expire after 7 days. Login attempt records kept for 30 days.

---

### 5. Support Tickets — CONFIDENTIAL
| Field | Purpose |
|---|---|
| Ticket subject/description | Track user issues |
| Internal comments | Admin investigation notes |

**Who can access:** Creator, assigned support staff, ADMIN.
**Note:** Internal comments are NOT visible to the ticket creator.

---

### 6. Notifications — INTERNAL
| Field | Purpose |
|---|---|
| Notification messages | Inform user of events |
| Read status | Track engagement |

**Who can access:** The user themselves only.

---

### 7. Academic & Engagement Data — INTERNAL
| Field | Purpose |
|---|---|
| Goals, achievements | Gamification |
| Engagement score | Participation tracking |

**Who can access:** The student themselves, ADMIN (aggregate).

---

### 8. Audit Logs — INTERNAL
| Field | Purpose |
|---|---|
| Admin actions on resources | Accountability trail |

**Who can access:** ADMIN only. Users cannot view or modify audit logs.

---

## Data Access Summary

| Data Category | User (own) | Faculty | Admin |
|---|---|---|---|
| Profile | ✅ Read | ❌ | ✅ Read/Write |
| Attendance | ✅ Read | ✅ Own classes | ✅ Full |
| Biometric | ❌ | ❌ | ✅ Admin control |
| Sessions | ✅ Read/Revoke | ❌ | ✅ Read |
| Tickets | ✅ Own tickets | ❌ | ✅ Full |
| Audit logs | ❌ | ❌ | ✅ Read |

---

## User Rights

### View Your Data
- Log in to AttendX
- Navigate to Dashboard → Profile

### Export Your Data
- Navigate to Profile → Privacy
- Click "Download My Data"
- A JSON file containing your profile, attendance, goals, achievements, and tickets is downloaded
- Exports are limited to 2 per 24 hours

### Correct Your Data
- Profile name: edit via Profile page
- Attendance corrections: submit via Leave/Correction requests
- Wrong academic assignment: contact administration

### Delete Your Biometric Data
- Contact support via Support Tickets
- Select category: Face Recognition
- Admin will process and audit the deletion

---

## What AttendX Does NOT Collect

- Precise GPS location
- Device hardware identifiers
- Raw face images (only mathematical embeddings)
- Browsing history outside the application
- Financial information
- Social media profiles

---

## Third-Party Services

Currently AttendX runs entirely on institutional infrastructure. No data is sent to third-party cloud services except:
- Email delivery (if configured by the institution — disabled by default)

---

## Data Classification

| Level | Description | Examples |
|---|---|---|
| PUBLIC | No sensitivity | Feature flags, academic year names |
| INTERNAL | Operational, not sensitive | Timetables, class schedules |
| CONFIDENTIAL | Personal information | Attendance records, profiles |
| HIGHLY SENSITIVE | Requires special protection | Biometric embeddings, audit logs |

---

## Technical Privacy Controls

1. **Bcrypt hashing** — passwords never stored plaintext
2. **Session token hashing** — JWT tokens stored as SHA-256 hashes only
3. **Biometric API protection** — face embeddings never returned via public API
4. **Output filtering** — all API responses strip sensitive internal fields
5. **IDOR protection** — users cannot access other users' resources
6. **Data export authorization** — users can only export their own data
7. **Audit logging** — all significant actions logged immutably

---

## Disclaimer

AttendX is an educational project. This documentation describes the technical privacy controls implemented. It does not constitute a legally binding privacy policy.
