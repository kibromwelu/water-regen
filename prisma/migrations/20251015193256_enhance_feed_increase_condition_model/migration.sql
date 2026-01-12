/*
  Warnings:

  - You are about to drop the column `lastFeedAmount` on the `FeedIncreaseCondition` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tankId]` on the table `FeedIncreaseCondition` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tankId,date]` on the table `HusbandryData` will be added. If there are existing duplicate values, this will fail.
  - Made the column `type` on table `FeedingData` required. This step will fail if there are existing NULL values in that column.
  - Made the column `amount` on table `FeedingData` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `SupplementDosing` required. This step will fail if there are existing NULL values in that column.
  - Made the column `dosage` on table `SupplementDosing` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "public"."HusbandryData_date_key";

-- AlterTable
ALTER TABLE "FeedIncreaseCondition" DROP COLUMN "lastFeedAmount",
ADD COLUMN     "expectedFeedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "FeedingData" ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "amount" SET NOT NULL,
ALTER COLUMN "amount" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "SupplementDosing" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "dosage" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "FeedIncreaseCondition_tankId_key" ON "FeedIncreaseCondition"("tankId");

-- CreateIndex
CREATE UNIQUE INDEX "HusbandryData_tankId_date_key" ON "HusbandryData"("tankId", "date");
