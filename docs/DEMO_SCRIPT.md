# AttendX Presentation Demo Script

This script provides a structured, foolproof path for demonstrating AttendX to stakeholders or academic evaluators.

## Prerequisites Before Presenting
1. Ensure the system is running: `docker compose up -d`
2. Run the demo seed script: `docker compose exec backend npm run seed:demo`
   *(This ensures the analytics charts look populated and beautiful)*

## Slide 1: The Problem
"Traditional attendance systems are manual, slow, prone to proxy attendance, and offer no real-time analytical insight into student performance."

## Slide 2: The AttendX Solution
"AttendX is a full-stack smart attendance platform solving this via secure dynamic QR codes, AI Face Verification, and instant analytics."

## Live Demo: Step-by-Step

### Step 1: Faculty Session Creation
1. Open an Incognito Window and login as `faculty@demo.com` (Password: `demo123`).
2. Navigate to **Dashboard -> Create Session**.
3. Select "Database Management Systems" for the CSE-A class.
4. Enable "Secure QR Attendance" and launch the session.
5. Emphasize how the QR code rotates every 10 seconds to prevent students from taking photos of it and sending it to friends at home.

### Step 2: Student Check-in (AI & QR)
1. Open a normal window and login as `student@demo.com` (Password: `demo123`).
2. Navigate to **Scan Attendance**.
3. Attempt to scan the QR code displayed on the Faculty's screen.
4. *Optional*: Demonstrate Facial Recognition if your webcam is active, showing how TensorFlow detects biometric depth instantly.
5. The screen flashes "Attendance Marked Successfully!"

### Step 3: Analytics & Notifications
1. Stay on the Student screen and navigate to **Analytics**.
2. Point out that the attendance percentage jumped in real-time.
3. Show the **Notifications** dropdown - an alert will be sitting there stating "Attendance successfully registered for Database Management Systems".

### Step 4: Admin Oversight & Reporting
1. Logout of the student account and login as `admin@demo.com`.
2. Open the **Admin Dashboard** to show system-wide analytics.
3. Navigate to **Reports**, filter by CSE-A, and click "Export to PDF".
4. Open the downloaded PDF to show the professional, print-ready document format.

## Conclusion
"AttendX prevents proxy attendance cryptographically, saves faculty 15 minutes per lecture, and allows administration to intervene immediately when a student's attendance drops below critical thresholds."
