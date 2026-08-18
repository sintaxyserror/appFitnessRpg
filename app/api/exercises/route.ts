import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createExerciseSchema = z.object({
  name: z.string().min(1),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  const exercises = await prisma.exercise.findMany({
    where: search ? { name: { contains: search, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(exercises);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createExerciseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.exercise.findUnique({ where: { name: parsed.data.name } });
  if (existing) {
    return NextResponse.json({ error: "Ya existe ese ejercicio" }, { status: 409 });
  }

  const created = await prisma.exercise.create({ data: parsed.data });
  return NextResponse.json(created, { status: 201 });
}
