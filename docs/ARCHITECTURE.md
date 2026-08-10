# AttendX Architecture

## High-Level Architecture
AttendX relies on a containerized microservice design ensuring clean separation of concerns and robust scalability.

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

## System Components

### 1. Frontend UI (Next.js & Tailwind)
The client-side interface heavily uses React Server Components where appropriate and strictly typed context providers to manage JWT states. The UI implements a unique blend of Glassmorphism and controlled Neobrutalism for a premium aesthetic.

### 2. Backend Engine (Node.js & Express)
The backend acts as a stateless REST API, meaning it can be scaled horizontally behind a load balancer without session stickiness.

### 3. Database Layer (Prisma & PostgreSQL)
Prisma provides type-safe ORM access. Relationships are enforced natively in the database (e.g., cascading deletes for dropped users).

### 4. AI Verification Module
Facial recognition utilizes `@tensorflow/tfjs-node` and `@vladmandic/face-api`. Models are strictly hosted internally in the backend `/weights` folder. Images are NEVER sent to third-party APIs (like AWS Rekognition), ensuring total biometric privacy.

### 5. Deployment Orchestration (Docker)
Production deployment utilizes multi-stage Docker builds. Development dependencies are entirely purged from the final `node:20-alpine` images, drastically reducing surface area for attacks.
