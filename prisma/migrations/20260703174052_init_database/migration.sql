-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'OWNER');

-- CreateEnum
CREATE TYPE "RestaurantStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'REJECTED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'CONTACTED', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurants" (
    "id" UUID NOT NULL,
    "restaurantCode" TEXT NOT NULL,
    "restaurantName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "logoUrl" TEXT,
    "status" "RestaurantStatus" NOT NULL DEFAULT 'PENDING',
    "ownerId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_verifications" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contactedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" UUID,
    "approvalStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_status_logs" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "oldStatus" "RestaurantStatus" NOT NULL,
    "newStatus" "RestaurantStatus" NOT NULL,
    "reason" TEXT,
    "changedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurant_status_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_restaurantCode_key" ON "restaurants"("restaurantCode");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_ownerId_key" ON "restaurants"("ownerId");

-- CreateIndex
CREATE INDEX "restaurants_status_idx" ON "restaurants"("status");

-- CreateIndex
CREATE INDEX "restaurants_city_idx" ON "restaurants"("city");

-- CreateIndex
CREATE INDEX "restaurants_ownerId_idx" ON "restaurants"("ownerId");

-- CreateIndex
CREATE INDEX "restaurants_restaurantCode_idx" ON "restaurants"("restaurantCode");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_verifications_restaurantId_key" ON "restaurant_verifications"("restaurantId");

-- CreateIndex
CREATE INDEX "restaurant_verifications_approvalStatus_idx" ON "restaurant_verifications"("approvalStatus");

-- CreateIndex
CREATE INDEX "restaurant_verifications_verifiedBy_idx" ON "restaurant_verifications"("verifiedBy");

-- CreateIndex
CREATE INDEX "restaurant_status_logs_restaurantId_idx" ON "restaurant_status_logs"("restaurantId");

-- CreateIndex
CREATE INDEX "restaurant_status_logs_changedBy_idx" ON "restaurant_status_logs"("changedBy");

-- CreateIndex
CREATE INDEX "restaurant_status_logs_newStatus_idx" ON "restaurant_status_logs"("newStatus");

-- CreateIndex
CREATE INDEX "restaurant_status_logs_createdAt_idx" ON "restaurant_status_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_verifications" ADD CONSTRAINT "restaurant_verifications_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_verifications" ADD CONSTRAINT "restaurant_verifications_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_status_logs" ADD CONSTRAINT "restaurant_status_logs_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_status_logs" ADD CONSTRAINT "restaurant_status_logs_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
