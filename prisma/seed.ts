import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";

type RawExercise = {
  name: string;
};

async function main() {
  const filePath = path.join(__dirname, "exercises-raw.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const exercises: RawExercise[] = JSON.parse(raw);

  console.log(`Encontrados ${exercises.length} ejercicios en el dataset.`);

  let created = 0;

  for (const ex of exercises) {
    await prisma.exercise.upsert({
      where: { name: ex.name },
      update: {},
      create: { name: ex.name },
    });
    created++;
  }

  console.log(`Proceso completado. Ejercicios procesados: ${created}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
