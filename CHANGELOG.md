# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-10

### Added
- **Module 1**: Created the foundation of the UI Design System (Tailwind, Lucide).
- **Module 2**: Established the PostgreSQL Database schema and Prisma ORM layer.
- **Module 3**: Built the complete Authentication & JWT system.
- **Module 4**: Handled Role Management (Admin, Faculty, Student).
- **Module 5**: Implemented Academic Hierarchies (Institutes, Departments, Classes, Subjects).
- **Module 6 & 7**: Crafted specific Student and Faculty Dashboards with robust data fetching.
- **Module 8**: Forged the Core Attendance Engine capable of generating and validating Sessions.
- **Module 9**: Constructed the Analytics processing engine for live dashboard metrics.
- **Module 10**: Introduced Cryptographic Dynamic QR code scanning for physical proximity checks.
- **Module 11**: Implemented AI Face Verification via TensorFlow.js for biometric identity proof.
- **Module 12**: Created real-time Notification triggers for dropping attendance thresholds.
- **Module 13**: Established an overarching Admin System management portal.
- **Module 14**: Developed Export engines to generate attendance records in PDF, Excel, and CSV formats.
- **Module 15**: Hardened the system with Rate Limiting, Environment Validators, and Unit/API Tests.
- **Module 16**: Containerized the entire infrastructure into reproducible Docker Compose pods.
- **Module 17**: Generated comprehensive multi-role documentation and demo data seeders.

### Security
- Passwords enforced via `bcrypt` hashing.
- API requests guarded by `jsonwebtoken` signature verification and Role-Based Access Controls.
- Face Recognition embeddings are processed and isolated entirely on our internal servers (no 3rd party APIs).
- Production deployment hides stack traces and uses `helmet` for HTTP header security.
