import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createMissionSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  targetType: z.enum(["WEIGHTS", "CARDIO", "CALISTHENICS", "SPORT"]),
  targetValue: z.number().int().min(1),
  rewardXp: z.number().int().min(0).default(0),
  expiresAt: z.coerce.date(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const character = await prisma.character.findUnique({
    where: { userId: session.user.id },
  });
  if (!character) {
    return NextResponse.json([]);
  }

  const missions = await prisma.mission.findMany({
    where: { characterId: character.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(missions);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const character = await prisma.character.findUnique({
    where: { userId: session.user.id },
  });
  if (!character) {
    return NextResponse.json({ error: "Necesitas un personaje para crear misiones" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = createMissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const created = await prisma.mission.create({
    data: { ...parsed.data, characterId: character.id },
  });

  return NextResponse.json(created, { status: 201 });
}
