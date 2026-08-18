-- CreateEnum
CREATE TYPE "RoutineType" AS ENUM ('WEIDER', 'FULL_BODY', 'UPPER_LOWER', 'PUSH_PULL_LEGS', 'OTHER');

-- CreateEnum
CREATE TYPE "MuscleGroup" AS ENUM ('CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'FOREARMS', 'QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'ABS', 'FULL_BODY', 'OTHER');

-- CreateEnum
CREATE TYPE "CardioType" AS ENUM ('CONTINUOUS', 'INTERVALS', 'FARTLEK');

-- CreateEnum
CREATE TYPE "IntervalType" AS ENUM ('WORK', 'REST');

-- AlterTable
ALTER TABLE "CalisthenicsMovement" ADD COLUMN     "muscleGroup" "MuscleGroup";

-- AlterTable
ALTER TABLE "CalisthenicsSet" ADD COLUMN     "restSeconds" INTEGER,
ADD COLUMN     "rir" INTEGER;

-- AlterTable
ALTER TABLE "CardioDetail" ADD COLUMN     "cardioType" "CardioType" NOT NULL DEFAULT 'CONTINUOUS',
ALTER COLUMN "distanceKm" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "muscleGroup" "MuscleGroup";

-- AlterTable
ALTER TABLE "WeightSet" ADD COLUMN     "restSeconds" INTEGER,
ADD COLUMN     "rir" INTEGER;

-- AlterTable
ALTER TABLE "WorkoutSession" ADD COLUMN     "routineType" "RoutineType";

-- CreateTable
CREATE TABLE "CardioInterval" (
    "id" TEXT NOT NULL,
    "cardioDetailId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "IntervalType" NOT NULL,
    "distanceKm" DOUBLE PRECISION,
    "durationMin" DOUBLE PRECISION,
    "paceMinKm" DOUBLE PRECISION,

    CONSTRAINT "CardioInterval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CardioInterval_cardioDetailId_order_idx" ON "CardioInterval"("cardioDetailId", "order");

-- AddForeignKey
ALTER TABLE "CardioInterval" ADD CONSTRAINT "CardioInterval_cardioDetailId_fkey" FOREIGN KEY ("cardioDetailId") REFERENCES "CardioDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;
