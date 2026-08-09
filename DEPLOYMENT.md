# QRDineX — Production Deployment & Launch Guide

This document outlines the step-by-step instructions for deploying QRDineX to production environments (e.g. Render, Railway, or AWS EC2) with PostgreSQL and Socket.IO real-time synchronization.

---

## 1. Environment Variables Checklist

Ensure the following environment variables are set in your production hosting service dashboard:

| Variable Name | Required | Example / Guidance |
| :--- | :--- | :--- |
| `NODE_ENV` | **Yes** | `production` |
| `PORT` | **Yes** | `10000` (or host provided port) |
| `DATABASE_URL` | **Yes** | PostgreSQL connection pool URL (e.g. Neon, Supabase, Render Postgres) |
| `DIRECT_URL` | **Yes** | Direct PostgreSQL connection string (for Prisma migrations) |
| `JWT_SECRET` | **Yes** | Minimum 32-character random string for signing JWT tokens |
| `JWT_EXPIRES_IN` | **Yes** | `7d` |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Public domain of the application (e.g., `https://qrdinex.onrender.com`) |

---

## 2. Pre-Deployment Database Preparation

Before deploying the application code, execute Prisma migrations against your production database:

```bash
# Push schema to production PostgreSQL
npx prisma db push

# Generate fresh Prisma Client
npx prisma generate
```

---

## 3. Render Web Service Deployment Steps

QRDineX uses a custom Node.js HTTP + Socket.IO server (`server.ts`).

### Step-by-Step Render Setup:

1. **Create Web Service**:
   - Log into Render and click **New +** -> **Web Service**.
   - Connect your GitHub repository.

2. **Configure Settings**:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start` (Runs `ts-node server.ts` or Node entry point)

3. **Add Environment Variables**:
   - Copy all environment variables from Section 1 above into the Render environment settings.

4. **Deploy**:
   - Click **Create Web Service** to start the automatic build and deployment pipeline.

---

## 4. Production Security & Launch Checklist

- [x] **Route Protection**: HTTP-only JWT cookies enforced across all `/dashboard/*` and `/api/owner/*` routes.
- [x] **Rate Limiting**: Sliding window rate limiting active on `/api/auth/login`, `/api/auth/signup`, `/api/customer/orders`, and `/api/customer/session/request-bill`.
- [x] **Structured Logging**: Production logger active with parameter redaction for sensitive fields.
- [x] **Socket.IO Real-Time Sync**: CORS origins restricted to `NEXT_PUBLIC_APP_URL`.
- [x] **Data Isolation**: All database queries strictly scoped by `restaurantId`.

---

## 5. Troubleshooting & Support

- **Database Connection Issues**: Verify that PostgreSQL accepts connections from your deployment server IP and that `sslmode=require` is appended if required by your database provider.
- **Socket.IO Disconnections**: Ensure WebSockets are enabled on your load balancer / reverse proxy. Render supports WebSockets out-of-the-box on standard HTTP/HTTPS ports.
