# Enterprise Production-Ready Backend — Renuka Paramedical Fee Dashboard

This repository contains the standalone, enterprise-grade **Node.js / Express.js / PostgreSQL / Prisma ORM** backend REST API developed to power the **Renuka Paramedical Baramati Fee Management System**.

---

## 🌟 Key Architectural Features

- **Decoupled Architecture**: Completely separate backend running on `http://localhost:5000` independent of the frozen frontend.
- **Enterprise Security**: JWT Access & Refresh tokens, bcrypt password hashing, Helmet headers, CORS policies, rate limiting, and input sanitization.
- **Robust Database Engine**: PostgreSQL schema with Prisma ORM, atomic transactions for payment calculations, indexes, and cascading relations.
- **Strict Validation**: Request validation powered by Zod schemas.
- **Centralized Logging**: Structured logging via Winston with error stack traces and daily log rotation.
- **File Storage**: Secure local storage engine for institute logo and document uploads via Multer.
- **Comprehensive API Documentation**: Includes Swagger OpenAPI 3.0 specs and ready-to-import Postman collections.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js >= v18
- PostgreSQL Server running locally or on a remote host (e.g. Supabase/RDS)

### 2. Environment Configuration
Copy `.env.example` to `.env` and adjust the PostgreSQL database connection string:

```bash
cp .env.example .env
```

Ensure `DATABASE_URL` is set:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/renuka_billing_db?schema=public
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup & Seeding
Generate Prisma Client and push database schema:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Default seeded Admin credentials:
- **Username**: `admin`
- **Password**: `<your_configured_password>`

### 5. Running the Application

```bash
# Development Mode (auto-reload)
npm run dev

# Production Mode
npm start
```

Server will start on **`http://localhost:5000`**.
Health check is accessible at `http://localhost:5000/health`.

---

## 📑 API Documentation & Artifacts

- **Swagger Specification**: `backend/docs/swagger.json`
- **Postman Collection**: `backend/docs/postman_collection.json`
- **Verification Mapping**: `backend/VERIFICATION_REPORT.md`

---

## 🧪 Running Integration Tests

```bash
npm test
```
