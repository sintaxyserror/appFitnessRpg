import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createAchievementSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
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

  const achievements = await prisma.achievement.findMany({
    where: { characterId: character.id },
    orderBy: { unlockedAt: "desc" },
  });

  return NextResponse.json(achievements);
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
    return NextResponse.json({ error: "Necesitas un personaje" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = createAchievementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const created = await prisma.achievement.create({
    data: { ...parsed.data, characterId: character.id },
  });

  return NextResponse.json(created, { status: 201 });
}
