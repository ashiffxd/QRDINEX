-- CreateEnum
CREATE TYPE "DiningTableStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'OUT_OF_SERVICE');

-- CreateTable
CREATE TABLE "dining_tables" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "tableNumber" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" "DiningTableStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dining_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_codes" (
    "id" UUID NOT NULL,
    "tableId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qr_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_categories" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "itemName" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "imageUrl" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isVeg" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dining_tables_restaurantId_idx" ON "dining_tables"("restaurantId");

-- CreateIndex
CREATE INDEX "dining_tables_status_idx" ON "dining_tables"("status");

-- CreateIndex
CREATE INDEX "dining_tables_restaurantId_status_idx" ON "dining_tables"("restaurantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "dining_tables_restaurantId_tableNumber_key" ON "dining_tables"("restaurantId", "tableNumber");

-- CreateIndex
CREATE UNIQUE INDEX "qr_codes_token_key" ON "qr_codes"("token");

-- CreateIndex
CREATE INDEX "qr_codes_tableId_idx" ON "qr_codes"("tableId");

-- CreateIndex
CREATE INDEX "qr_codes_tableId_isActive_idx" ON "qr_codes"("tableId", "isActive");

-- CreateIndex
CREATE INDEX "qr_codes_token_idx" ON "qr_codes"("token");

-- CreateIndex
CREATE INDEX "menu_categories_restaurantId_idx" ON "menu_categories"("restaurantId");

-- CreateIndex
CREATE INDEX "menu_categories_restaurantId_displayOrder_idx" ON "menu_categories"("restaurantId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "menu_categories_restaurantId_name_key" ON "menu_categories"("restaurantId", "name");

-- CreateIndex
CREATE INDEX "menu_items_restaurantId_idx" ON "menu_items"("restaurantId");

-- CreateIndex
CREATE INDEX "menu_items_categoryId_idx" ON "menu_items"("categoryId");

-- CreateIndex
CREATE INDEX "menu_items_restaurantId_isAvailable_idx" ON "menu_items"("restaurantId", "isAvailable");

-- CreateIndex
CREATE INDEX "menu_items_categoryId_displayOrder_idx" ON "menu_items"("categoryId", "displayOrder");

-- CreateIndex
CREATE INDEX "menu_items_restaurantId_categoryId_idx" ON "menu_items"("restaurantId", "categoryId");

-- AddForeignKey
ALTER TABLE "dining_tables" ADD CONSTRAINT "dining_tables_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "dining_tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "menu_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
