/*
  Warnings:

  - You are about to drop the column `isAvailable` on the `menu_items` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MenuItemStatus" AS ENUM ('ACTIVE', 'OUT_OF_STOCK', 'INACTIVE');

-- DropIndex
DROP INDEX "menu_items_restaurantId_isAvailable_idx";

-- AlterTable
ALTER TABLE "menu_items" DROP COLUMN "isAvailable",
ADD COLUMN     "prepTimeMinutes" INTEGER,
ADD COLUMN     "status" "MenuItemStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "menu_items_restaurantId_status_idx" ON "menu_items"("restaurantId", "status");
