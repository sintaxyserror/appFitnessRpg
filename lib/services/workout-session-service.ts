import { prisma } from "../prisma";
import {
  calculateWorkoutXp,
  getAttributeForSessionType,
  calculateAttributeLevel,
  calculateCharacterLevel,
  calculateSkillPointsGained,
  calculateStreakDays,
  calculateVitalityXpGain,
  determineDominantClass,
  applyClassInertia,
  type AttributeLevels,
} from "../xp";
import type { CreateWorkoutSessionInput } from "../validation/workout-session";
import type { AttributeType, SessionType } from "@prisma/client";

const ATTRIBUTE_TYPES: AttributeType[] = [
  "STRENGTH",
  "ENDURANCE",
  "AGILITY",
  "DEXTERITY",
  "VITALITY",
];

type WorkoutSessionInputLike = {
  type: SessionType;
  durationMin: number;
  date?: Date;
  notes?: string;
  routineId?: string;
  routineType?: "WEIDER" | "FULL_BODY" | "UPPER_LOWER" | "PUSH_PULL_LEGS" | "OTHER";
  weightSets?: Array<{
    exerciseId: string;
    setNumber: number;
    reps: number;
    weightKg: number;
    restSeconds?: number;
    rir?: number;
    note?: string;
  }>;
  calisthenicsSets?: Array<{
    movementId: string;
    setNumber: number;
    reps: number;
    progression: string;
    restSeconds?: number;
    rir?: number;
    note?: string;
  }>;
  cardioDetail?: {
    cardioType?: "CONTINUOUS" | "INTERVALS" | "FARTLEK";
    distanceKm?: number;
    avgPaceMinKm?: number;
    avgHeartRate?: number;
    intervals?: Array<{
      order: number;
      type: "WORK" | "REST";
      distanceKm?: number;
      durationMin?: number;
      paceMinKm?: number;
    }>;
  };
  sportDetail?: {
    sportType?: string;
    perceivedIntensity?: number;
  };
};

export function normalizeWorkoutSessionInput(
  input: WorkoutSessionInputLike
): CreateWorkoutSessionInput {
  const base = {
    type: input.type,
    durationMin: input.durationMin,
    date: input.date,
    notes: input.notes,
    routineId: input.routineId,
    routineType: input.routineType,
  };

  if (input.type === "WEIGHTS") {
    return {
      ...base,
      type: "WEIGHTS",
      weightSets: input.weightSets ?? [],
    } as CreateWorkoutSessionInput;
  }

  if (input.type === "CALISTHENICS") {
    return {
      ...base,
      type: "CALISTHENICS",
      calisthenicsSets: input.calisthenicsSets ?? [],
    } as CreateWorkoutSessionInput;
  }

  if (input.type === "CARDIO") {
    return {
      ...base,
      type: "CARDIO",
      cardioDetail: {
        cardioType: input.cardioDetail?.cardioType ?? "CONTINUOUS",
        distanceKm: input.cardioDetail?.distanceKm,
        avgPaceMinKm: input.cardioDetail?.avgPaceMinKm,
        avgHeartRate: input.cardioDetail?.avgHeartRate,
        intervals: input.cardioDetail?.intervals ?? [],
      },
    } as CreateWorkoutSessionInput;
  }

  return {
    ...base,
    type: "SPORT",
    sportDetail: {
      sportType: input.sportDetail?.sportType ?? "",
      perceivedIntensity: input.sportDetail?.perceivedIntensity ?? 5,
    },
  } as CreateWorkoutSessionInput;
}

export async function createWorkoutSession(
  userId: string,
  input: WorkoutSessionInputLike
) {
  const normalizedInput = normalizeWorkoutSessionInput(input);
  const date = normalizedInput.date ?? new Date();

  const sevenDaysAgo = new Date(date);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentSameTypeCount = await prisma.workoutSession.count({
    where: {
      userId,
      type: normalizedInput.type,
      date: { gte: sevenDaysAgo, lt: date },
    },
  });

  const xpGained = calculateWorkoutXp(normalizedInput.durationMin, recentSameTypeCount);

  const character = await prisma.character.findUnique({
    where: { userId },
    include: { attributes: true },
  });

  const session = await prisma.$transaction(async (tx) => {
    const created = await tx.workoutSession.create({
      data: {
        userId,
        type: normalizedInput.type,
        date,
        durationMin: normalizedInput.durationMin,
        notes: normalizedInput.notes,
        xpGained: character ? xpGained : null,
        routineId:
          normalizedInput.type === "WEIGHTS" || normalizedInput.type === "CALISTHENICS"
            ? normalizedInput.routineId
            : undefined,
        routineType:
          normalizedInput.type === "WEIGHTS" || normalizedInput.type === "CALISTHENICS"
            ? normalizedInput.routineType
            : undefined,
      },
    });

    if (normalizedInput.type === "WEIGHTS") {
      const weightSets = (normalizedInput as any).weightSets ?? [];
      if (weightSets.length > 0) {
        await tx.weightSet.createMany({
          data: weightSets.map((set: any) => ({
            sessionId: created.id,
            exerciseId: set.exerciseId,
            setNumber: set.setNumber,
            reps: set.reps,
            weightKg: set.weightKg,
            restSeconds: set.restSeconds,
            rir: set.rir,
            note: set.note,
          })),
        });
      }
    } else if (normalizedInput.type === "CALISTHENICS") {
      const calisthenicsSets = (normalizedInput as any).calisthenicsSets ?? [];
      if (calisthenicsSets.length > 0) {
        await tx.calisthenicsSet.createMany({
          data: calisthenicsSets.map((set: any) => ({
            sessionId: created.id,
            movementId: set.movementId,
            setNumber: set.setNumber,
            reps: set.reps,
            progression: set.progression,
            restSeconds: set.restSeconds,
            rir: set.rir,
            note: set.note,
          })),
        });
      }
    } else if (normalizedInput.type === "CARDIO") {
      const cardioDetailData = (normalizedInput as any).cardioDetail;
      const cardioDetail = await tx.cardioDetail.create({
        data: {
          sessionId: created.id,
          cardioType: cardioDetailData.cardioType,
          distanceKm: cardioDetailData.distanceKm,
          avgPaceMinKm: cardioDetailData.avgPaceMinKm,
          avgHeartRate: cardioDetailData.avgHeartRate,
        },
      });

      if (cardioDetailData.intervals && cardioDetailData.intervals.length > 0) {
        await tx.cardioInterval.createMany({
          data: cardioDetailData.intervals.map((interval: any) => ({
            cardioDetailId: cardioDetail.id,
            order: interval.order,
            type: interval.type,
            distanceKm: interval.distanceKm,
            durationMin: interval.durationMin,
            paceMinKm: interval.paceMinKm,
          })),
        });
      }
    } else if (normalizedInput.type === "SPORT") {
      const sportDetailData = (normalizedInput as any).sportDetail;
      await tx.sportDetail.create({
        data: {
          sessionId: created.id,
          sportType: sportDetailData.sportType,
          perceivedIntensity: sportDetailData.perceivedIntensity,
        },
      });
    }

    return created;
  });

  if (!character) {
    return session;
  }

  const attributeType = getAttributeForSessionType(normalizedInput.type);

  const recentDates = await prisma.workoutSession.findMany({
    where: { userId },
    select: { date: true },
    orderBy: { date: "desc" },
    take: 60,
  });
  const streakDays = calculateStreakDays(
    recentDates.map((s) => s.date),
    date
  );
  const vitalityXpGain = calculateVitalityXpGain(streakDays);

  const updatedAttributes: AttributeLevels = {} as AttributeLevels;

  await prisma.$transaction(async (tx) => {
    for (const type of ATTRIBUTE_TYPES) {
      const current = character.attributes.find((a) => a.type === type);
      if (!current) continue;

      const xpToAdd = type === attributeType ? xpGained : type === "VITALITY" ? vitalityXpGain : 0;
      const newXp = current.xp + xpToAdd;
      const newLevel = calculateAttributeLevel(newXp);

      if (xpToAdd > 0) {
        await tx.attribute.update({
          where: { id: current.id },
          data: { xp: newXp, level: newLevel },
        });
      }

      updatedAttributes[type] = newLevel;
    }

    const previousLevel = character.level;
    const newLevel = calculateCharacterLevel(Object.values(updatedAttributes));
    const skillPointsGained = calculateSkillPointsGained(previousLevel, newLevel);

    const dominantNow = determineDominantClass(updatedAttributes);
    const inertiaResult = applyClassInertia(
      {
        currentClass: character.characterClass,
        pendingClass: character.pendingClass,
        pendingSince: character.pendingSince,
      },
      dominantNow,
      date
    );

    await tx.character.update({
      where: { id: character.id },
      data: {
        level: newLevel,
        skillPoints: character.skillPoints + skillPointsGained,
        characterClass: inertiaResult.newCurrentClass,
        pendingClass: inertiaResult.newPendingClass,
        pendingSince: inertiaResult.newPendingSince,
      },
    });

    if (inertiaResult.classChanged) {
      await tx.classChangeLog.create({
        data: {
          characterId: character.id,
          fromClass: character.characterClass,
          toClass: inertiaResult.newCurrentClass,
        },
      });
    }
  });

  return session;
}
