import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createMovementSchema = z.object({
  name: z.string().min(1),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  const movements = await prisma.calisthenicsMovement.findMany({
    where: search ? { name: { contains: search, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(movements);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createMovementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.calisthenicsMovement.findUnique({
    where: { name: parsed.data.name },
  });
  if (existing) {
    return NextResponse.json({ error: "Ya existe ese movimiento" }, { status: 409 });
  }

  const created = await prisma.calisthenicsMovement.create({ data: parsed.data });
  return NextResponse.json(created, { status: 201 });
}
