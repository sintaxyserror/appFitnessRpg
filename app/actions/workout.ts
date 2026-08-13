"use server";

import { prisma } from "@/lib/prisma";
import { SessionType } from "@prisma/client";
import { syncCharacterClass } from "@/lib/character-logic";
import { revalidatePath } from "next/cache";

export async function addWorkoutSession(data: {
  userId: string;
  type: SessionType;
  durationMin: number;
  notes?: string;
}) {
  const session = await prisma.workoutSession.create({
    data: {
      userId: data.userId,
      type: data.type,
      durationMin: data.durationMin,
      notes: data.notes,
    },
  });

  // Cada vez que se añade un entrenamiento, recalculamos la clase
  await syncCharacterClass(data.userId);

  revalidatePath("/");
  return session;
}
