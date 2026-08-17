# Data Integrity Strategy

AttendX prioritizes **Correctness, Consistency, Durability, and Recoverability** of all academic data. Attendance records are classified as **CRITICAL** academic data.

## 1. Automated Integrity Checks
AttendX runs a daily automated job (at 2:00 AM) via `integrity.service.ts` to detect anomalies that may bypass application logic:

| Check | Description | Severity |
| :--- | :--- | :--- |
| **Duplicate Attendance** | Detects if a student has multiple records for a single session (race conditions). | CRITICAL |
| **Orphan Attendance** | Detects attendance records pointing to deleted students or sessions. | ERROR |
| **Timetable Collisions** | Detects overlapping classes scheduled in the same physical room. | WARNING |
| **Invalid User Profiles** | Detects `STUDENT` or `FACULTY` accounts missing their respective profile records. | ERROR |

## 2. Referential Integrity
The database relies heavily on PostgreSQL constraints defined via Prisma:
- `Cascade Delete` is used carefully. Deleting an Institute deletes Departments, but deleting a Faculty does not delete historical Attendance Records (they are preserved for audit).
- `@@unique([sessionId, studentId])` prevents duplicate attendance at the database level.

## 3. Atomic Operations
Critical business logic runs inside `$transaction` blocks:
- **Bulk Marking Attendance:** Uses transactional `deleteMany` and `createMany` to ensure partial failures roll back completely.
- **Leave Approvals:** Updating a leave request and marking the corresponding attendance session as 'EXCUSED' is atomic.

## 4. Anomaly Resolution
> [!WARNING]  
> The system **detects and reports** anomalies but does **not automatically repair** them. This prevents automated scripts from destroying ambiguous business data. Admins must manually review and resolve `CRITICAL` issues.
