/*
  Warnings:

  - You are about to drop the column `cleaningStatus` on the `HusbandryData` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "HusbandryData" DROP COLUMN "cleaningStatus",
ADD COLUMN     "isClean" BOOLEAN;

-- AlterTable
ALTER TABLE "Tank" ADD COLUMN     "salinity" DOUBLE PRECISION;
