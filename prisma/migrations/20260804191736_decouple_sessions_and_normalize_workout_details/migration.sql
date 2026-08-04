/*
  Warnings:

  - You are about to drop the column `characterId` on the `WorkoutSession` table. All the data in the column will be lost.
  - You are about to drop the column `details` on the `WorkoutSession` table. All the data in the column will be lost.
  - Added the required column `userId` to the `WorkoutSession` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "WorkoutSession" DROP CONSTRAINT "WorkoutSession_characterId_fkey";

-- DropIndex
DROP INDEX "WorkoutSession_characterId_date_idx";

-- AlterTable
ALTER TABLE "WorkoutSession" DROP COLUMN "characterId",
DROP COLUMN "details",
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "xpGained" DROP NOT NULL,
ALTER COLUMN "xpGained" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeightSet" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "WeightSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalisthenicsMovement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "CalisthenicsMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalisthenicsSet" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "movementId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "progression" TEXT NOT NULL,

    CONSTRAINT "CalisthenicsSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardioDetail" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "avgPaceMinKm" DOUBLE PRECISION,
    "avgHeartRate" INTEGER,

    CONSTRAINT "CardioDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SportDetail" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sportType" TEXT NOT NULL,
    "perceivedIntensity" INTEGER NOT NULL,

    CONSTRAINT "SportDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_name_key" ON "Exercise"("name");

-- CreateIndex
CREATE INDEX "WeightSet_exerciseId_idx" ON "WeightSet"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "CalisthenicsMovement_name_key" ON "CalisthenicsMovement"("name");

-- CreateIndex
CREATE INDEX "CalisthenicsSet_movementId_idx" ON "CalisthenicsSet"("movementId");

-- CreateIndex
CREATE UNIQUE INDEX "CardioDetail_sessionId_key" ON "CardioDetail"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SportDetail_sessionId_key" ON "SportDetail"("sessionId");

-- CreateIndex
CREATE INDEX "WorkoutSession_userId_date_idx" ON "WorkoutSession"("userId", "date");

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeightSet" ADD CONSTRAINT "WeightSet_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeightSet" ADD CONSTRAINT "WeightSet_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalisthenicsSet" ADD CONSTRAINT "CalisthenicsSet_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalisthenicsSet" ADD CONSTRAINT "CalisthenicsSet_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "CalisthenicsMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardioDetail" ADD CONSTRAINT "CardioDetail_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SportDetail" ADD CONSTRAINT "SportDetail_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
