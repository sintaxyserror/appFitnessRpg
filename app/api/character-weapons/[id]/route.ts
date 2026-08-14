import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateCharacterWeaponSchema = z.object({
  equipped: z.boolean(),
});

async function findOwnedCharacterWeapon(id: string, userId: string) {
  const cw = await prisma.characterWeapon.findUnique({
    where: { id },
    include: { character: true },
  });
  return cw?.character.userId === userId ? cw : null;
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
  const cw = await findOwnedCharacterWeapon(id, session.user.id);
  if (!cw) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  return NextResponse.json(cw);
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
  const existing = await findOwnedCharacterWeapon(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateCharacterWeaponSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Solo una arma puede estar equipada a la vez: desequipa el resto antes.
  if (parsed.data.equipped) {
    await prisma.characterWeapon.updateMany({
      where: { characterId: existing.characterId },
      data: { equipped: false },
    });
  }

  const updated = await prisma.characterWeapon.update({
    where: { id },
    data: { equipped: parsed.data.equipped },
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
  const existing = await findOwnedCharacterWeapon(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  await prisma.characterWeapon.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
