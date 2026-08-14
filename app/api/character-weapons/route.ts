import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const unlockWeaponSchema = z.object({
  weaponId: z.string(),
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

  const weapons = await prisma.characterWeapon.findMany({
    where: { characterId: character.id },
    include: { weapon: true },
    orderBy: { unlockedAt: "asc" },
  });

  return NextResponse.json(weapons);
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
  const parsed = unlockWeaponSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const weapon = await prisma.weapon.findUnique({ where: { id: parsed.data.weaponId } });
  if (!weapon) {
    return NextResponse.json({ error: "Arma no encontrada" }, { status: 404 });
  }

  if (character.level < weapon.requiredLevel) {
    return NextResponse.json(
      { error: `Necesitas nivel ${weapon.requiredLevel}, tienes ${character.level}` },
      { status: 400 }
    );
  }

  if (character.skillPoints < 1) {
    return NextResponse.json({ error: "No tienes puntos de habilidad disponibles" }, { status: 400 });
  }

  const existing = await prisma.characterWeapon.findUnique({
    where: { characterId_weaponId: { characterId: character.id, weaponId: weapon.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "Ya has desbloqueado esta arma" }, { status: 409 });
  }

  const created = await prisma.$transaction(async (tx) => {
    const characterWeapon = await tx.characterWeapon.create({
      data: {
        characterId: character.id,
        weaponId: weapon.id,
        currentDamage: weapon.baseDamage,
      },
      include: { weapon: true },
    });

    await tx.character.update({
      where: { id: character.id },
      data: { skillPoints: character.skillPoints - 1 },
    });

    return characterWeapon;
  });

  return NextResponse.json(created, { status: 201 });
}
