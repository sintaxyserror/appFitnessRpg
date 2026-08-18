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

const updateRoutineSchema = z.object({
  name: z.string().min(1).optional(),
  routineType: z.enum(["WEIDER", "FULL_BODY", "UPPER_LOWER", "PUSH_PULL_LEGS", "OTHER"]).optional(),
  exercises: z.array(routineExerciseSchema).optional(),
});

async function findOwnedRoutine(id: string, userId: string) {
  const routine = await prisma.routine.findUnique({ where: { id } });
  return routine?.userId === userId ? routine : null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const routine = await prisma.routine.findUnique({
    where: { id },
    include: {
      exercises: {
        include: { exercise: true, movement: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!routine || routine.userId !== session.user.id) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  return NextResponse.json(routine);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await findOwnedRoutine(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateRoutineSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (parsed.data.exercises) {
      // Reemplaza la lista completa de ejercicios (más simple y predecible que hacer diff).
      await tx.routineExercise.deleteMany({ where: { routineId: id } });
    }

    return tx.routine.update({
      where: { id },
      data: {
        name: parsed.data.name,
        routineType: parsed.data.routineType,
        ...(parsed.data.exercises
          ? { exercises: { create: parsed.data.exercises } }
          : {}),
      },
      include: { exercises: { include: { exercise: true, movement: true } } },
    });
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await findOwnedRoutine(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  await prisma.routine.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
