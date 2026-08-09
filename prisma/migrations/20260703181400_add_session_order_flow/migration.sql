-- =============================================================================
-- Migration: add_session_order_flow
-- Phase 2.2 — Customer Session & Order Flow
-- Models: DiningSession, Order, OrderItem
-- Enums:  SessionStatus, OrderStatus
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------

CREATE TYPE "SessionStatus" AS ENUM (
  'PENDING',
  'OPEN',
  'CLOSED',
  'EXPIRED'
);

CREATE TYPE "OrderStatus" AS ENUM (
  'PLACED',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'SERVED',
  'COMPLETED',
  'CANCELLED'
);

-- ---------------------------------------------------------------------------
-- TABLE: dining_sessions
-- ---------------------------------------------------------------------------

CREATE TABLE "dining_sessions" (
  "id"           UUID         NOT NULL DEFAULT gen_random_uuid(),
  "restaurantId" UUID         NOT NULL,
  "tableId"      UUID         NOT NULL,
  "status"       "SessionStatus" NOT NULL DEFAULT 'PENDING',
  "startedAt"    TIMESTAMP(3),
  "closedAt"     TIMESTAMP(3),
  "expiresAt"    TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "dining_sessions_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "dining_sessions"
  ADD CONSTRAINT "dining_sessions_restaurantId_fkey"
    FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "dining_sessions"
  ADD CONSTRAINT "dining_sessions_tableId_fkey"
    FOREIGN KEY ("tableId") REFERENCES "dining_tables"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Standard indexes
CREATE INDEX "dining_sessions_restaurantId_idx"         ON "dining_sessions"("restaurantId");
CREATE INDEX "dining_sessions_tableId_idx"              ON "dining_sessions"("tableId");
CREATE INDEX "dining_sessions_status_idx"               ON "dining_sessions"("status");
CREATE INDEX "dining_sessions_tableId_status_idx"       ON "dining_sessions"("tableId", "status");
CREATE INDEX "dining_sessions_restaurantId_status_idx"  ON "dining_sessions"("restaurantId", "status");
CREATE INDEX "dining_sessions_createdAt_idx"            ON "dining_sessions"("createdAt");
CREATE INDEX "dining_sessions_expiresAt_idx"            ON "dining_sessions"("expiresAt");

-- ---------------------------------------------------------------------------
-- PARTIAL UNIQUE INDEX — One OPEN session per DiningTable
--
-- Prisma's @@unique does not support partial (conditional) indexes.
-- This constraint is added here directly in the migration SQL.
--
-- Effect: Attempting to INSERT or UPDATE a second row with the same tableId
-- and status = 'OPEN' will raise a unique violation error.
-- PENDING, CLOSED, and EXPIRED sessions are NOT covered by this constraint
-- and may coexist freely (historical records).
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX "one_open_session_per_table"
  ON "dining_sessions" ("tableId")
  WHERE (status = 'OPEN');

-- ---------------------------------------------------------------------------
-- TABLE: orders
-- ---------------------------------------------------------------------------

CREATE TABLE "orders" (
  "id"           UUID          NOT NULL DEFAULT gen_random_uuid(),
  "restaurantId" UUID          NOT NULL,
  "sessionId"    UUID          NOT NULL,
  "status"       "OrderStatus" NOT NULL DEFAULT 'PLACED',
  "totalAmount"  DECIMAL(10,2) NOT NULL,
  "createdAt"    TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3)  NOT NULL,

  CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "orders"
  ADD CONSTRAINT "orders_restaurantId_fkey"
    FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "dining_sessions"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "orders_restaurantId_idx"         ON "orders"("restaurantId");
CREATE INDEX "orders_sessionId_idx"            ON "orders"("sessionId");
CREATE INDEX "orders_status_idx"               ON "orders"("status");
CREATE INDEX "orders_restaurantId_status_idx"  ON "orders"("restaurantId", "status");
CREATE INDEX "orders_sessionId_status_idx"     ON "orders"("sessionId", "status");
CREATE INDEX "orders_createdAt_idx"            ON "orders"("createdAt");

-- ---------------------------------------------------------------------------
-- TABLE: order_items
-- ---------------------------------------------------------------------------

CREATE TABLE "order_items" (
  "id"              UUID          NOT NULL DEFAULT gen_random_uuid(),
  "orderId"         UUID          NOT NULL,
  "menuItemId"      UUID          NOT NULL,
  "quantity"        INTEGER       NOT NULL,
  "priceAtPurchase" DECIMAL(10,2) NOT NULL,
  "subtotal"        DECIMAL(10,2) NOT NULL,
  "createdAt"       TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_menuItemId_fkey"
    FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "order_items_orderId_idx"             ON "order_items"("orderId");
CREATE INDEX "order_items_menuItemId_idx"           ON "order_items"("menuItemId");
CREATE INDEX "order_items_orderId_menuItemId_idx"   ON "order_items"("orderId", "menuItemId");
