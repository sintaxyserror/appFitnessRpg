"use server";

import { revalidatePath } from "next/cache";
import { SessionType } from "@prisma/client";
import {
  createWorkoutSession,
  normalizeWorkoutSessionInput,
} from "@/lib/services/workout-session-service";

export async function addWorkoutSession(data: {
  userId: string;
  type: SessionType;
  durationMin: number;
  notes?: string;
}) {
  const session = await createWorkoutSession(
    data.userId,
    normalizeWorkoutSessionInput(data)
  );

  revalidatePath("/");
  return session;
}
