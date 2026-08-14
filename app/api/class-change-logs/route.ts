import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

  const logs = await prisma.classChangeLog.findMany({
    where: { characterId: character.id },
    orderBy: { changedAt: "desc" },
  });

  return NextResponse.json(logs);
}
