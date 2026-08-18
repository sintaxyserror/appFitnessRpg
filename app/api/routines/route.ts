import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const routineExerciseSchema = z.object({
  order: z.number().int().min(1),
  exerciseId: z.string().optional(),
  movementId: z.string().optional(),
  targetSets: z.number().int().min(1),
  targetRepsMin: z.number().int().min(1),
  targetRepsMax: z.number().int().min(1),
}).refine(
  (data) => (data.exerciseId ? 1 : 0) + (data.movementId ? 1 : 0) === 1,
  { message: "Debe indicarse exactamente uno: exerciseId o movementId" }
);

const createRoutineSchema = z.object({
  name: z.string().min(1),
  routineType: z.enum(["WEIDER", "FULL_BODY", "UPPER_LOWER", "PUSH_PULL_LEGS", "OTHER"]).optional(),
  exercises: z.array(routineExerciseSchema).min(1),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const routines = await prisma.routine.findMany({
    where: { userId: session.user.id },
    include: {
      exercises: {
        include: { exercise: true, movement: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(routines);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createRoutineSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const created = await prisma.routine.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      routineType: parsed.data.routineType,
      exercises: {
        create: parsed.data.exercises,
      },
    },
    include: {
      exercises: { include: { exercise: true, movement: true } },
    },
  });

  return NextResponse.json(created, { status: 201 });
}
