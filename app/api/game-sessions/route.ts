import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { calculateWeaponXpFromKills, calculateWeaponLevel, calculateWeaponDamage } from "@/lib/xp";

const createGameSessionSchema = z.object({
  characterWeaponId: z.string(),
  date: z.coerce.date().optional(),
  durationMin: z.number().int().min(1).optional(),
  notes: z.string().optional(),
  kills: z.number().int().min(0).default(0),
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

  const sessions = await prisma.gameSession.findMany({
    where: { characterId: character.id },
    include: { characterWeapon: { include: { weapon: true } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(sessions);
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
  const parsed = createGameSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const characterWeapon = await prisma.characterWeapon.findUnique({
    where: { id: parsed.data.characterWeaponId },
    include: { weapon: true },
  });
  if (!characterWeapon || characterWeapon.characterId !== character.id) {
    return NextResponse.json({ error: "Arma no encontrada" }, { status: 404 });
  }

  const weaponXpGained = calculateWeaponXpFromKills(parsed.data.kills);

  const created = await prisma.$transaction(async (tx) => {
    const gameSession = await tx.gameSession.create({
      data: {
        characterId: character.id,
        characterWeaponId: characterWeapon.id,
        date: parsed.data.date ?? new Date(),
        durationMin: parsed.data.durationMin,
        notes: parsed.data.notes,
        kills: parsed.data.kills,
        xpGained: weaponXpGained,
      },
    });

    const newXp = characterWeapon.xp + weaponXpGained;
    const newLevel = calculateWeaponLevel(newXp);
    const newDamage = calculateWeaponDamage(characterWeapon.weapon.baseDamage, newLevel);

    await tx.characterWeapon.update({
      where: { id: characterWeapon.id },
      data: { xp: newXp, level: newLevel, currentDamage: newDamage },
    });

    return gameSession;
  });

  return NextResponse.json(created, { status: 201 });
}
