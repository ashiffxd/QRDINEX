# QRDineX — Next-Gen QR Dining & Restaurant Operating Platform

QRDineX is a production-ready, full-stack digital dining platform and restaurant operating system. It provides real-time QR ordering, shared dining session carts, live kitchen display boards (KDS), offline billing & invoice management, business analytics, and restaurant profile administration.

---

## Key Features

- **QR Entry & Session Management**: Dynamic QR token scanning with table binding and multi-device collaborative dining sessions.
- **Shared Session Cart**: Real-time collaborative cart synchronized across dining companions using Socket.IO.
- **Kitchen Display System (KDS)**: High-contrast Kanban board for kitchen chefs (`NEW` → `PREPARING` → `READY`) with live elapsed time tickers and audio notification chimes.
- **Billing & Invoice Engine**: Immutable invoice generation, service charge rules, percentage/flat discounts, multi-method payment confirmation, and round-off logic.
- **Analytics & Business Intelligence**: Operational dashboard tracking revenue, order trends, best-selling menu items, kitchen prep velocity, and table utilization.
- **Restaurant & Account Settings**: Customizable profile metadata, logo URLs, service charge defaults, multi-currency support (`INR ₹`, `USD $`, `EUR €`, `GBP £`, `AED`), and security controls.

---

## Technology Stack

- **Core Framework**: [Next.js 15 (App Router)](https://nextjs.org/) & [React 19](https://react.dev/)
- **Database & ORM**: PostgreSQL via [Prisma ORM (v6)](https://www.prisma.io/)
- **Real-Time Communication**: [Socket.IO](https://socket.io/) (Custom Node.js Server Wrapper)
- **Styling**: Tailwind CSS & Lucide Icons
- **Authentication**: HTTP-Only JWT Session Cookies & Bcrypt Password Hashing
- **Validation & Security**: Server-Side Zod Validation & Sliding Window Rate Limiter

---

## Application Architecture

```
QRDineX Project Structure
├── app/
│   ├── (admin)/            # Super Admin routes
│   ├── (customer)/         # Customer QR scanning, menu, cart, orders, and invoice routes
│   │   ├── menu/
│   │   ├── cart/
│   │   ├── orders/
│   │   └── invoice/
│   ├── (owner)/            # Owner Dashboard routes
│   │   └── dashboard/
│   │       ├── overview/
│   │       ├── tables/
│   │       ├── qr-codes/
│   │       ├── menu/
│   │       ├── orders/
│   │       ├── kitchen/    # Kitchen Display System (KDS)
│   │       ├── sessions/
│   │       ├── analytics/  # Analytics & BI Dashboard
│   │       └── settings/   # Restaurant & Billing Settings
│   └── api/                # REST API Endpoints
│       ├── auth/
│       ├── customer/
│       └── owner/
├── components/             # Reusable UI components
│   ├── customer/
│   └── owner/
├── lib/                    # Auth, database, socket, logger, rate-limit, and currency utilities
├── prisma/                 # PostgreSQL Prisma schema and migrations
├── services/               # Core business logic service layer
├── server.ts               # Custom Node.js HTTP + Socket.IO server entry point
└── DEPLOYMENT.md           # Production deployment guide
```

---

## Getting Started Locally

### Prerequisites

- Node.js (v18.x or v20.x+)
- PostgreSQL Database URL (Local or Neon PostgreSQL)

### Step 1: Clone & Install Dependencies

```bash
git clone https://github.com/your-org/qrdinex.git
cd qrdinex
npm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=3000

# Database URLs
DATABASE_URL="postgresql://user:password@localhost:5432/qrdinex?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/qrdinex?schema=public"

# Authentication Secrets
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters"
JWT_EXPIRES_IN="7d"

# App Public URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Step 3: Initialize Database Schema

```bash
npx prisma db push
npx prisma generate
```

### Step 4: Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## License

Copyright © 2026 QRDineX. All rights reserved.
