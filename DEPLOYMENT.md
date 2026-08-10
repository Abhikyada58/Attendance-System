# AttendX Deployment Guide

This guide outlines the procedure to deploy the AttendX Smart Attendance Management System to a production environment.

## 1. Prerequisites
- **Docker**: Engine version 20.10+
- **Docker Compose**: Version 2.0+
- **Domain**: A registered domain name (optional but recommended for production HTTPS)

## 2. Architecture Overview
AttendX uses a containerized microservice architecture:
- **Nginx (Port 80/443)**: Reverse proxy routing `/api` to the Backend and all other traffic to the Frontend.
- **Next.js Frontend (Port 3000)**: Serves the static/hybrid React application.
- **Express Backend (Port 5000)**: Serves the API and handles business logic.
- **PostgreSQL Database (Port 5432)**: Relational database with persistent local volumes.

## 3. Deployment Steps

### Step 1: Clone and Configure
```bash
git clone https://github.com/your-org/sem5-project.git
cd sem5-project

# Copy the example environment variables
cp .env.example .env
```

### Step 2: Set Secrets
Open `.env` and change the default passwords. **CRITICAL**: The `JWT_SECRET` must be at least 32 characters long or the backend will refuse to start.

### Step 3: Build and Start Containers
```bash
# Start the entire infrastructure in detached mode
docker compose up -d --build
```

### Step 4: Run Database Migrations
Before the system can be used, the schema must be applied to the new database.
```bash
# Execute Prisma migration inside the backend container
docker compose exec backend npx prisma migrate deploy
```

### Step 5: Verify Health
You can verify the backend is online and successfully connected to the database by navigating to:
`http://<your-server-ip>/api/v1/health`

## 4. HTTPS & Domain Security (Production)
For public production, you MUST use HTTPS. The easiest way to achieve this is to install **Certbot** and let it modify the `nginx/nginx.conf` file automatically, or use a cloud load balancer (like AWS ALB or Cloudflare) to terminate SSL before traffic reaches the Nginx container.

## 5. Backup & Restore Procedures

### Backing up the Database
Because the database runs in Docker, you can stream a secure SQL dump out of the container:
```bash
docker compose exec -t db pg_dump -U postgres -d attendx -F c > attendx_backup_$(date +%F).dump
```

### Restoring the Database
> **WARNING**: Restoring a database drops the existing connections and overwrites data. Do this carefully!
```bash
# Copy the dump file into the container
docker cp attendx_backup_2026-08-10.dump attendx-db:/tmp/backup.dump

# Restore the dump using pg_restore
docker compose exec db pg_restore -U postgres -d attendx -1 /tmp/backup.dump
```

## 6. Rollback Plan
If a deployment fails:
1. Revert the git commit: `git checkout <previous-stable-sha>`
2. Rebuild the containers: `docker compose up -d --build`
3. If the database schema was broken by a bad migration, restore your latest backup dump.

## 7. Troubleshooting
- **Backend Crashing on Boot**: Check docker logs (`docker compose logs backend`). If it says `ZodError`, your `JWT_SECRET` is too short or missing in the `.env` file.
- **502 Bad Gateway**: The Nginx container is running, but the backend or frontend hasn't finished booting yet. Wait 30 seconds and refresh.
- **Database Connection Error**: Ensure the `POSTGRES_PASSWORD` in your `.env` file strictly matches what you set for the backend `DATABASE_URL`.
