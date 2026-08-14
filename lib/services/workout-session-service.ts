import { prisma } from "@/lib/prisma";
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
} from "@/lib/xp";
import type { CreateWorkoutSessionInput } from "@/lib/validation/workout-session";
import type { AttributeType } from "@prisma/client";

const ATTRIBUTE_TYPES: AttributeType[] = [
  "STRENGTH",
  "ENDURANCE",
  "AGILITY",
  "DEXTERITY",
  "VITALITY",
];

export async function createWorkoutSession(
  userId: string,
  input: CreateWorkoutSessionInput
) {
  const date = input.date ?? new Date();

  // Cuenta sesiones recientes del mismo tipo (últimos 7 días) para diminishing returns.
  const sevenDaysAgo = new Date(date);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentSameTypeCount = await prisma.workoutSession.count({
    where: {
      userId,
      type: input.type,
      date: { gte: sevenDaysAgo, lt: date },
    },
  });

  const xpGained = calculateWorkoutXp(input.durationMin, recentSameTypeCount);

  // Comprueba si el usuario tiene personaje (la capa de rol es opcional).
  const character = await prisma.character.findUnique({
    where: { userId },
    include: { attributes: true },
  });

  // Crea la sesión y su detalle correspondiente en una transacción.
  const session = await prisma.$transaction(async (tx) => {
    const created = await tx.workoutSession.create({
      data: {
        userId,
        type: input.type,
        date,
        durationMin: input.durationMin,
        notes: input.notes,
        xpGained: character ? xpGained : null,
      },
    });

    if (input.type === "WEIGHTS") {
      await tx.weightSet.createMany({
        data: input.weightSets.map((set) => ({
          sessionId: created.id,
          exerciseId: set.exerciseId,
          setNumber: set.setNumber,
          reps: set.reps,
          weightKg: set.weightKg,
        })),
      });
    } else if (input.type === "CALISTHENICS") {
      await tx.calisthenicsSet.createMany({
        data: input.calisthenicsSets.map((set) => ({
          sessionId: created.id,
          movementId: set.movementId,
          setNumber: set.setNumber,
          reps: set.reps,
          progression: set.progression,
        })),
      });
    } else if (input.type === "CARDIO") {
      await tx.cardioDetail.create({
        data: {
          sessionId: created.id,
          distanceKm: input.cardioDetail.distanceKm,
          avgPaceMinKm: input.cardioDetail.avgPaceMinKm,
          avgHeartRate: input.cardioDetail.avgHeartRate,
        },
      });
    } else if (input.type === "SPORT") {
      await tx.sportDetail.create({
        data: {
          sessionId: created.id,
          sportType: input.sportDetail.sportType,
          perceivedIntensity: input.sportDetail.perceivedIntensity,
        },
      });
    }

    return created;
  });

  // Si no hay personaje, la sesión queda como diario puro, sin más.
  if (!character) {
    return session;
  }

  // --- A partir de aquí, cascada de actualización del personaje ---

  const attributeType = getAttributeForSessionType(input.type);

  // Racha de días consecutivos, incluyendo esta sesión.
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

    // Recalcula nivel de personaje y puntos de habilidad.
    const previousLevel = character.level;
    const newLevel = calculateCharacterLevel(Object.values(updatedAttributes));
    const skillPointsGained = calculateSkillPointsGained(previousLevel, newLevel);

    // Aplica inercia de clase.
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