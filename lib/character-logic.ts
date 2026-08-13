import { SessionType, CharacterClass } from "@prisma/client";
import { prisma } from "./prisma";

/**
 * Determina la clase del personaje basándose en la distribución de tiempo de entrenamiento
 * de los últimos 30 días.
 */
export async function calculateCharacterClass(userId: string): Promise<CharacterClass> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sessions = await prisma.workoutSession.findMany({
    where: {
      userId,
      date: {
        gte: thirtyDaysAgo,
      },
    },
    select: {
      type: true,
      durationMin: true,
    },
  });

  if (sessions.length === 0) return CharacterClass.UNDEFINED;

  const totals: Record<SessionType, number> = {
    WEIGHTS: 0,
    CARDIO: 0,
    CALISTHENICS: 0,
    SPORT: 0,
  };

  sessions.forEach((s) => {
    totals[s.type] += s.durationMin;
  });

  const totalTime = Object.values(totals).reduce((a, b) => a + b, 0);
  if (totalTime === 0) return CharacterClass.UNDEFINED;

  const weightsPct = totals.WEIGHTS / totalTime;
  const cardioPct = totals.CARDIO / totalTime;
  const calisthenicsPct = totals.CALISTHENICS / totalTime;
  const sportPct = totals.SPORT / totalTime;

  // REGLAS DE CLASE:
  
  // 1. PALADÍN: Entrenamiento equilibrado (al menos dos categorías principales > 25%)
  const mainCategories = [weightsPct, cardioPct, calisthenicsPct];
  const significantCount = mainCategories.filter(p => p >= 0.25).length;
  
  if (significantCount >= 2) {
    return CharacterClass.PALADIN;
  }

  // 2. GUERRERO: Predominancia de pesas (> 50%)
  if (weightsPct > 0.50) {
    return CharacterClass.WARRIOR;
  }

  // 3. EXPLORADOR: Predominancia de cardio o deportes de resistencia (> 50%)
  // El deporte suele ser cardiovascular o mixto, lo sumamos aquí para el Explorador si no es la categoría dominante por sí sola
  if (cardioPct + (sportPct * 0.5) > 0.50) {
    return CharacterClass.EXPLORER;
  }

  // 4. MONJE: Predominancia de calistenia (> 50%)
  if (calisthenicsPct > 0.50) {
    return CharacterClass.MONK;
  }

  // Fallback: La categoría con más tiempo
  const max = Math.max(weightsPct, cardioPct, calisthenicsPct, sportPct);
  if (max === weightsPct) return CharacterClass.WARRIOR;
  if (max === cardioPct) return CharacterClass.EXPLORER;
  if (max === calisthenicsPct) return CharacterClass.MONK;
  if (max === sportPct) return CharacterClass.EXPLORER; // Los deportistas suelen ser exploradores por defecto

  return CharacterClass.UNDEFINED;
}

/**
 * Sincroniza la clase del personaje con su historial actual.
 */
export async function syncCharacterClass(userId: string) {
  const newClass = await calculateCharacterClass(userId);
  const character = await prisma.character.findUnique({
    where: { userId },
  });

  if (!character) return null;

  // Si la clase actual es diferente a la calculada
  if (character.characterClass !== newClass) {
    // Si era indefinido, asignamos directamente
    if (character.characterClass === CharacterClass.UNDEFINED) {
      return await prisma.character.update({
        where: { userId },
        data: { characterClass: newClass },
      });
    }

    // Si ya tenía clase, la ponemos como pendiente para avisar al usuario
    // o para que el cambio se consolide después de X tiempo (ej. 7 días de consistencia)
    return await prisma.character.update({
      where: { userId },
      data: {
        pendingClass: newClass,
        pendingSince: new Date(),
      },
    });
  }

  return character;
}
