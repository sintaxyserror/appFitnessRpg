"use server";

import { prisma } from "@/lib/prisma";
import { CharacterClass } from "@prisma/client";
import { syncCharacterClass } from "@/lib/character-logic";

export async function getOrCreateCharacter(userId: string, name: string) {
  let character = await prisma.character.findUnique({
    where: { userId },
    include: {
        attributes: true
    }
  });

  if (!character) {
    character = await prisma.character.create({
      data: {
        userId,
        name,
        characterClass: CharacterClass.UNDEFINED,
        attributes: {
          create: [
            { type: "STRENGTH", level: 1, xp: 0 },
            { type: "ENDURANCE", level: 1, xp: 0 },
            { type: "AGILITY", level: 1, xp: 0 },
            { type: "DEXTERITY", level: 1, xp: 0 },
            { type: "VITALITY", level: 1, xp: 0 },
          ],
        },
      },
      include: {
          attributes: true
      }
    });
  }

  return character;
}

export async function refreshCharacterClass(userId: string) {
    return await syncCharacterClass(userId);
}
