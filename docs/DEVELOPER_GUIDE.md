# AttendX Developer Setup Guide

This guide is for software engineers looking to contribute to AttendX locally.

## 1. Prerequisites
- Node.js (v20+)
- PostgreSQL (v15+)
- Git

## 2. Local Setup Sequence
Clone the repository and install dependencies in both project roots:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## 3. Database Initialization
Ensure PostgreSQL is running locally, then configure your `.env` files in both directories.

```bash
# In the backend directory
npx prisma db push
npm run seed:demo
```

## 4. Running Development Servers
You will need two terminal windows.

**Terminal 1 (Backend API)**:
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend UI)**:
```bash
cd frontend
npm run dev
```

The UI will be available at `http://localhost:3000` and the API at `http://localhost:5000`.

## 5. Coding Standards
- **Strict Typing**: We use `TypeScript` strictly. Do not use `any` unless absolutely necessary (e.g., catching unknown external errors).
- **ESLint**: Ensure `npm run lint` passes before committing.
- **Tailwind**: Stick to the pre-defined variables in `tailwind.config.ts` to maintain our design aesthetic.
