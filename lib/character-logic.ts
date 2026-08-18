import { CharacterClass } from "@prisma/client";
import { prisma } from "./prisma";
import {
  determineDominantClass,
  applyClassInertia,
  type AttributeLevels,
} from "./xp";

export async function calculateCharacterClass(userId: string): Promise<CharacterClass> {
  const character = await prisma.character.findUnique({
    where: { userId },
    include: { attributes: true },
  });

  if (!character || character.attributes.length === 0) {
    return CharacterClass.UNDEFINED;
  }

  const levels: AttributeLevels = {
    STRENGTH: 1,
    ENDURANCE: 1,
    AGILITY: 1,
    DEXTERITY: 1,
    VITALITY: 1,
  };

  for (const attribute of character.attributes) {
    levels[attribute.type] = attribute.level;
  }

  return determineDominantClass(levels);
}

export async function syncCharacterClass(userId: string) {
  const character = await prisma.character.findUnique({
    where: { userId },
    include: { attributes: true },
  });

  if (!character || character.attributes.length === 0) {
    return null;
  }

  const levels: AttributeLevels = {
    STRENGTH: 1,
    ENDURANCE: 1,
    AGILITY: 1,
    DEXTERITY: 1,
    VITALITY: 1,
  };

  for (const attribute of character.attributes) {
    levels[attribute.type] = attribute.level;
  }

  const dominantNow = determineDominantClass(levels);
  const inertiaResult = applyClassInertia(
    {
      currentClass: character.characterClass,
      pendingClass: character.pendingClass,
      pendingSince: character.pendingSince,
    },
    dominantNow,
    new Date()
  );

  return prisma.character.update({
    where: { id: character.id },
    data: {
      characterClass: inertiaResult.newCurrentClass,
      pendingClass: inertiaResult.newPendingClass,
      pendingSince: inertiaResult.newPendingSince,
    },
  });
}
