import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createWeaponSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(["MELEE", "RANGED", "MAGIC"]),
  diceType: z.string().min(1),
  baseDamage: z.number().int().min(0),
  requiredLevel: z.number().int().min(1),
});

export async function GET() {
  const weapons = await prisma.weapon.findMany({
    orderBy: { requiredLevel: "asc" },
  });

  return NextResponse.json(weapons);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createWeaponSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const created = await prisma.weapon.create({ data: parsed.data });
  return NextResponse.json(created, { status: 201 });
}
