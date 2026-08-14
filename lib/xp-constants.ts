import { AttributeType, SessionType } from "@prisma/client";

// XP base ganado por minuto de entreno, antes de aplicar diminishing returns.
export const BASE_XP_PER_MINUTE = 10;

// Qué atributo sube con cada tipo de sesión de entreno.
export const SESSION_TYPE_TO_ATTRIBUTE: Record<SessionType, AttributeType> = {
  WEIGHTS: "STRENGTH",
  CARDIO: "ENDURANCE",
  CALISTHENICS: "AGILITY",
  SPORT: "DEXTERITY",
};

// Curva de nivel de atributo: XP total acumulado necesario para alcanzar cada nivel.
// level 1 -> 0 XP, level 2 -> 100 XP, level 3 -> ~283 XP, etc. (curva exponencial suave)
export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(100 * Math.pow(level - 1, 1.5));
}

// Diminishing returns: penaliza entrenar el mismo tipo muchos días seguidos.
// recentSameTypeCount = cuántas sesiones del mismo tipo hubo en los últimos 7 días (sin contar la actual).
export function diminishingReturnsMultiplier(recentSameTypeCount: number): number {
  const MIN_MULTIPLIER = 0.4;
  const DECAY_PER_SESSION = 0.15;
  const multiplier = 1 - recentSameTypeCount * DECAY_PER_SESSION;
  return Math.max(MIN_MULTIPLIER, multiplier);
}

// Umbral de inercia para el cambio de clase: 21 días (~3 semanas).
export const CLASS_CHANGE_THRESHOLD_DAYS = 21;

// Mapeo de atributo dominante a clase. VITALITY no tiene clase propia
// (representa constancia general, no un "estilo de combate").
export const DOMINANT_ATTRIBUTE_TO_CLASS: Partial<Record<AttributeType, "WARRIOR" | "EXPLORER" | "MONK">> = {
  STRENGTH: "WARRIOR",
  ENDURANCE: "EXPLORER",
  AGILITY: "MONK",
};

// Diferencia mínima de nivel entre el atributo top y el segundo para considerarlo "dominante".
// Si es menor, se considera equilibrado -> Paladín.
export const DOMINANCE_MARGIN = 2;

// XP de arma ganado por cada muerte en una partida de rol.
export const WEAPON_XP_PER_KILL = 10;

// Curva de nivel de arma (más corta que la de atributos, ya que hay pocas armas).
export function weaponXpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(50 * Math.pow(level - 1, 1.3));
}

// Incremento de daño base del arma por cada nivel ganado.
export const WEAPON_DAMAGE_PER_LEVEL = 2;

// --- Vitalidad: constancia general, no ligada a un tipo de sesión concreto ---

// XP base de Vitalidad por cada sesión registrada, sea del tipo que sea.
export const VITALITY_BASE_XP_PER_SESSION = 5;

// XP extra por cada día de racha consecutiva entrenando (crece suave, con tope).
export const VITALITY_STREAK_BONUS_PER_DAY = 0.5;
export const VITALITY_MAX_STREAK_BONUS = 15;

// Días sin entrenar antes de que la Vitalidad empiece a decaer.
export const VITALITY_DECAY_GRACE_DAYS = 3;

// XP de Vitalidad perdido por cada día de inactividad una vez superado el margen.
export const VITALITY_DECAY_XP_PER_DAY = 5;
