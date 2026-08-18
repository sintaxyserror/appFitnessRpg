import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createWorkoutSessionSchema } from "@/lib/validation/workout-session";
import { createWorkoutSession } from "@/lib/services/workout-session-service";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  const sessions = await prisma.workoutSession.findMany({
    where: {
      userId: session.user.id,
      ...(type ? { type: type as any } : {}),
    },
    include: {
      weightSets: { include: { exercise: true } },
      calisthenicsSets: { include: { movement: true } },
      cardioDetail: true,
      sportDetail: true,
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createWorkoutSessionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const created = await createWorkoutSession(session.user.id, parsed.data);

  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  if (body?.all) {
    await prisma.workoutSession.deleteMany({ where: { userId: session.user.id } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "No se indicó acción válida" }, { status: 400 });
}
