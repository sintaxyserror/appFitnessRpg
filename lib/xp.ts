import { AttributeType, SessionType, CharacterClass } from "@prisma/client";
import {
  BASE_XP_PER_MINUTE,
  SESSION_TYPE_TO_ATTRIBUTE,
  xpRequiredForLevel,
  diminishingReturnsMultiplier,
  CLASS_CHANGE_THRESHOLD_DAYS,
  DOMINANT_ATTRIBUTE_TO_CLASS,
  DOMINANCE_MARGIN,
  WEAPON_XP_PER_KILL,
  weaponXpRequiredForLevel,
  WEAPON_DAMAGE_PER_LEVEL,
  VITALITY_BASE_XP_PER_SESSION,
  VITALITY_STREAK_BONUS_PER_DAY,
  VITALITY_MAX_STREAK_BONUS,
  VITALITY_DECAY_GRACE_DAYS,
  VITALITY_DECAY_XP_PER_DAY,
} from "./xp-constants";

export function calculateWorkoutXp(
  durationMin: number,
  recentSameTypeCount: number
): number {
  const base = durationMin * BASE_XP_PER_MINUTE;
  const multiplier = diminishingReturnsMultiplier(recentSameTypeCount);
  return Math.round(base * multiplier);
}

export function getAttributeForSessionType(type: SessionType): AttributeType {
  return SESSION_TYPE_TO_ATTRIBUTE[type];
}

export function calculateAttributeLevel(totalXp: number): number {
  let level = 1;
  while (xpRequiredForLevel(level + 1) <= totalXp) {
    level++;
  }
  return level;
}

export function calculateCharacterLevel(attributeLevels: number[]): number {
  if (attributeLevels.length === 0) return 1;
  const sum = attributeLevels.reduce((acc, lvl) => acc + lvl, 0);
  return Math.floor(sum / attributeLevels.length);
}

export function calculateSkillPointsGained(
  previousLevel: number,
  newLevel: number
): number {
  return Math.max(0, newLevel - previousLevel);
}

export type AttributeLevels = Record<AttributeType, number>;

export function determineDominantClass(levels: AttributeLevels): CharacterClass {
  const relevant: AttributeType[] = ["STRENGTH", "ENDURANCE", "AGILITY"];
  const sorted = [...relevant].sort((a, b) => levels[b] - levels[a]);
  const [top, second] = sorted;

  const isDominant = levels[top] - levels[second] >= DOMINANCE_MARGIN;
  if (!isDominant) return "PALADIN";

  const mapped = DOMINANT_ATTRIBUTE_TO_CLASS[top];
  return mapped ?? "PALADIN";
}

export type ClassInertiaState = {
  currentClass: CharacterClass;
  pendingClass: CharacterClass | null;
  pendingSince: Date | null;
};

export type ClassInertiaResult = {
  newCurrentClass: CharacterClass;
  newPendingClass: CharacterClass | null;
  newPendingSince: Date | null;
  classChanged: boolean;
};

export function applyClassInertia(
  state: ClassInertiaState,
  dominantNow: CharacterClass,
  now: Date
): ClassInertiaResult {
  if (dominantNow === state.currentClass) {
    return {
      newCurrentClass: state.currentClass,
      newPendingClass: null,
      newPendingSince: null,
      classChanged: false,
    };
  }

  if (dominantNow !== state.pendingClass) {
    return {
      newCurrentClass: state.currentClass,
      newPendingClass: dominantNow,
      newPendingSince: now,
      classChanged: false,
    };
  }

  const daysSincePending = state.pendingSince
    ? (now.getTime() - state.pendingSince.getTime()) / (1000 * 60 * 60 * 24)
    : 0;

  if (daysSincePending >= CLASS_CHANGE_THRESHOLD_DAYS) {
    return {
      newCurrentClass: dominantNow,
      newPendingClass: null,
      newPendingSince: null,
      classChanged: true,
    };
  }

  return {
    newCurrentClass: state.currentClass,
    newPendingClass: state.pendingClass,
    newPendingSince: state.pendingSince,
    classChanged: false,
  };
}

export function calculateWeaponXpFromKills(kills: number): number {
  return kills * WEAPON_XP_PER_KILL;
}

export function calculateWeaponLevel(totalXp: number): number {
  let level = 1;
  while (weaponXpRequiredForLevel(level + 1) <= totalXp) {
    level++;
  }
  return level;
}

export function calculateWeaponDamage(baseDamage: number, level: number): number {
  return baseDamage + (level - 1) * WEAPON_DAMAGE_PER_LEVEL;
}
// ---------------------------------------------------------------------------
// Vitalidad: constancia general
// ---------------------------------------------------------------------------

/**
 * Calcula la racha de días consecutivos entrenando, dado un array de fechas
 * de sesiones (ordenadas de más reciente a más antigua) y la fecha de "hoy".
 */
export function calculateStreakDays(sessionDates: Date[], today: Date): number {
  if (sessionDates.length === 0) return 0;

  const uniqueDays = new Set(
    sessionDates.map((d) => d.toISOString().split("T")[0])
  );

  let streak = 0;
  const cursor = new Date(today);

  while (uniqueDays.has(cursor.toISOString().split("T")[0])) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

/** XP de Vitalidad ganado al registrar una sesión, según la racha actual. */
export function calculateVitalityXpGain(streakDays: number): number {
  const streakBonus = Math.min(
    streakDays * VITALITY_STREAK_BONUS_PER_DAY,
    VITALITY_MAX_STREAK_BONUS
  );
  return Math.round(VITALITY_BASE_XP_PER_SESSION + streakBonus);
}

/**
 * XP de Vitalidad perdido por inactividad.
 * daysSinceLastSession = días completos desde la última sesión registrada.
 */
export function calculateVitalityDecay(daysSinceLastSession: number): number {
  const daysOverGrace = daysSinceLastSession - VITALITY_DECAY_GRACE_DAYS;
  if (daysOverGrace <= 0) return 0;
  return daysOverGrace * VITALITY_DECAY_XP_PER_DAY;
}
