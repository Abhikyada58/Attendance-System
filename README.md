<<<<<<< HEAD
# Attendance-System
=======
# AttendX - Smart Attendance Management System

AttendX is a full-stack, smart attendance management system designed for educational institutions. It features role-based dashboards, cryptographic QR attendance, AI-based facial recognition, and detailed CSV/Excel/PDF reporting.

## 🚀 Features

- **Multi-Role Dashboards**: Dedicated interfaces for Students, Faculty, and Admins.
- **Dynamic QR Attendance**: Cryptographically secure, rotating QR codes for rapid classroom check-ins.
- **AI Face Recognition**: Biometric attendance verification using TensorFlow.js.
- **Smart Analytics & Notifications**: Real-time attendance calculation and threshold-based alerts (e.g. < 75% warnings).
- **Advanced Exporting**: Generate and download detailed reports in PDF, CSV, and Excel formats instantly.

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS (Glassmorphism & Controlled Neobrutalism)
- **Icons**: Lucide React

### Backend
- **Framework**: Node.js & Express
- **Database**: PostgreSQL
- **ORM**: Prisma
- **AI**: face-api.js (TensorFlow)
- **Security**: JWT, bcrypt, Helmet, express-rate-limit

### DevOps
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx
- **CI/CD**: GitHub Actions

## 🐳 Quick Start (Docker)

To deploy AttendX locally or in production:

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/sem5-project.git
   cd sem5-project
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env and set secure passwords and a 32+ character JWT_SECRET
   ```

3. **Start Infrastructure**
   ```bash
   docker compose up -d --build
   ```

4. **Initialize Database Schema**
   ```bash
   docker compose exec backend npx prisma migrate deploy
   ```

5. **Access the Application**
   Open your browser and navigate to `http://localhost`.

## 📚 Documentation
For complete production deployment instructions, backup procedures, and rollback plans, please see the [DEPLOYMENT.md](DEPLOYMENT.md) guide.

## 🛡️ Architecture

```text
             Internet
                │
              HTTPS
                │
             Reverse
          Proxy (Nginx)
          ┌─────┴─────┐
          ↓           ↓
  Frontend(Next)  Backend(Express)
                       │
                       ↓
                   Database
                 (PostgreSQL)
```
>>>>>>> origin/master
