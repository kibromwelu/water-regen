/*
  Warnings:

  - You are about to drop the `refreshToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "SensorType" AS ENUM ('DO', 'PH', 'NH4', 'NO2', 'ALK', 'WATER_TEMPERATURE');

-- CreateEnum
CREATE TYPE "ConditionValueType" AS ENUM ('GTE', 'GT', 'LTE', 'LT');

-- CreateEnum
CREATE TYPE "ConditionType" AS ENUM ('ALERT', 'FEEDING');

-- CreateEnum
CREATE TYPE "IntervalType" AS ENUM ('DAYS', 'WEEKS', 'MONTHS', 'YEARS');

-- CreateEnum
CREATE TYPE "TodoType" AS ENUM ('FEEDING', 'ALERT', 'RECURRING', 'FEEDING_INCREASE');

-- DropForeignKey
ALTER TABLE "public"."refreshToken" DROP CONSTRAINT "refreshToken_userId_fkey";

-- DropTable
DROP TABLE "public"."refreshToken";

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tank" (
    "id" TEXT NOT NULL,
    "tankerId" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "whitelegShrimpStrain" TEXT NOT NULL,
    "averageBodyWeight" DOUBLE PRECISION NOT NULL,
    "numberStocked" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "Tank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HusbandryData" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "cleaningStatus" BOOLEAN,
    "WaterTemperature" DOUBLE PRECISION,
    "do" DOUBLE PRECISION,
    "ph" DOUBLE PRECISION,
    "nh4" DOUBLE PRECISION,
    "no2" DOUBLE PRECISION,
    "alk" DOUBLE PRECISION,
    "salinity" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "tankId" TEXT NOT NULL,

    CONSTRAINT "HusbandryData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedingData" (
    "id" TEXT NOT NULL,
    "type" TEXT,
    "amount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "husbandryDataId" TEXT NOT NULL,

    CONSTRAINT "FeedingData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplementDosing" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "dosage" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "husbandryDataId" TEXT NOT NULL,

    CONSTRAINT "SupplementDosing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Condition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sensor" "SensorType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "condition" "ConditionValueType" NOT NULL,
    "recommendation" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "ConditionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "tankId" TEXT NOT NULL,

    CONSTRAINT "Condition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringCondition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "intervalType" "IntervalType" NOT NULL,
    "intervalValue" INTEGER NOT NULL,
    "endDate" TIMESTAMP(3),
    "endingCount" INTEGER,
    "message" TEXT NOT NULL,
    "lastMessageSent" TIMESTAMP(3) NOT NULL,
    "totalMessageSent" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "tankId" TEXT NOT NULL,

    CONSTRAINT "RecurringCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedIncreaseCondition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "referenceTime" TEXT NOT NULL,
    "dailyMessageSentCount" INTEGER NOT NULL,
    "lastMessageSent" TIMESTAMP(3),
    "lastFeedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalMessageSent" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "tankId" TEXT NOT NULL,

    CONSTRAINT "FeedIncreaseCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Todo" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "TodoType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "tankId" TEXT NOT NULL,

    CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Record" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "averageBodyWeight" DOUBLE PRECISION,
    "shrimpWeight" DOUBLE PRECISION,
    "feedAdded" DOUBLE PRECISION,
    "fcr" DOUBLE PRECISION,
    "estimatedCount" INTEGER,
    "estimatedHarvest" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "tankId" TEXT NOT NULL,

    CONSTRAINT "Record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_userId_key" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Tank_tankerId_key" ON "Tank"("tankerId");

-- CreateIndex
CREATE UNIQUE INDEX "HusbandryData_date_key" ON "HusbandryData"("date");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tank" ADD CONSTRAINT "Tank_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HusbandryData" ADD CONSTRAINT "HusbandryData_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "Tank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedingData" ADD CONSTRAINT "FeedingData_husbandryDataId_fkey" FOREIGN KEY ("husbandryDataId") REFERENCES "HusbandryData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplementDosing" ADD CONSTRAINT "SupplementDosing_husbandryDataId_fkey" FOREIGN KEY ("husbandryDataId") REFERENCES "HusbandryData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Condition" ADD CONSTRAINT "Condition_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "Tank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringCondition" ADD CONSTRAINT "RecurringCondition_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "Tank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedIncreaseCondition" ADD CONSTRAINT "FeedIncreaseCondition_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "Tank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "Tank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "Tank"("id") ON DELETE CASCADE ON UPDATE CASCADE;
