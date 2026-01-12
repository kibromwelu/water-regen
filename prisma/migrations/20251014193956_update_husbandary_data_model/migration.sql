/*
  Warnings:

  - You are about to drop the column `WaterTemperature` on the `HusbandryData` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "HusbandryData" DROP COLUMN "WaterTemperature",
ADD COLUMN     "waterTemperature" DOUBLE PRECISION;
