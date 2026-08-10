# AttendX - Administrator Guide

Welcome to the AttendX System Administration console. This interface grants you complete oversight of the entire institution's attendance operations.

## User Management
As an Administrator, you are responsible for provisioning accounts.
1. Navigate to **Users**.
2. You can create accounts manually or use bulk-import scripts to onboard hundreds of students at once.
3. If an account is compromised, you have the authority to instantly toggle `isActive` to false, which immediately revokes all their existing JWT authentication tokens.

## Academic Structure
You map the physical structure of the institution into AttendX.
- **Departments & Subjects**: Ensure subjects correctly map to their department and credit requirements.
- **Classes**: Map Students and Faculty to specific Classes to automatically generate their personalized dashboards.

## System Oversight
The Admin Dashboard provides a bird's-eye view of real-time attendance trends across the entire campus. You can drill down into specific departments to identify problematic patterns and trigger system-wide alerts if necessary.
