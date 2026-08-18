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
  targetRir: z.number().int().min(0).max(3).optional(),
  targetRirs: z.array(z.number().int().min(0).max(3)).optional(),
}).refine(
  (data) => (data.exerciseId ? 1 : 0) + (data.movementId ? 1 : 0) === 1,
  { message: "Debe indicarse exactamente uno: exerciseId o movementId" }
);

const createRoutineSchema = z.object({
  name: z.string().min(1),
  routineType: z.enum(["WEIDER", "FULL_BODY", "UPPER_LOWER", "PUSH_PULL_LEGS", "OTHER"]).optional(),
  days: z.array(z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"])).optional(),
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
      days: true,
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
        create: parsed.data.exercises.map((exercise) => ({
          order: exercise.order,
          targetSets: exercise.targetSets,
          targetRepsMin: exercise.targetRepsMin,
          targetRepsMax: exercise.targetRepsMax,
          targetRir: exercise.targetRirs?.[0] ?? exercise.targetRir ?? 2,
          targetRirs: exercise.targetRirs ?? [exercise.targetRir ?? 2].slice(0, exercise.targetSets),
          ...(exercise.exerciseId ? { exercise: { connect: { id: exercise.exerciseId } } } : {}),
          ...(exercise.movementId ? { movement: { connect: { id: exercise.movementId } } } : {}),
        })),
      },
      days: {
        create: (parsed.data.days ?? []).map((day) => ({ day })),
      },
    },
    include: {
      exercises: { include: { exercise: true, movement: true } },
      days: true,
    },
  });

  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  if (body?.all) {
    await prisma.routine.deleteMany({ where: { userId: session.user.id } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "No se indicó acción válida" }, { status: 400 });
}
