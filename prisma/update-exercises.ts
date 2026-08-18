import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const translations = JSON.parse(fs.readFileSync('prisma/exercise-translations.json', 'utf8'));

  console.log('Iniciando actualización de ejercicios en la base de datos...');

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const [eng, esp] of Object.entries(translations)) {
    try {
      const exercise = await prisma.exercise.findUnique({
        where: { name: eng as string }
      });

      if (exercise) {
        await prisma.exercise.update({
          where: { id: exercise.id },
          data: { name: esp as string }
        });
        updated++;
      } else {
        // Tal vez ya está traducido o no existe
        const alreadyTranslated = await prisma.exercise.findUnique({
          where: { name: esp as string }
        });
        if (alreadyTranslated) {
          skipped++;
        } else {
          // Si no existe, lo creamos para que coincida con el nuevo json
          await prisma.exercise.create({
            data: { name: esp as string }
          });
          updated++;
        }
      }
    } catch (error) {
      console.error(`Error procesando ${eng}:`, error);
      errors++;
    }
  }

  console.log(`Proceso completado.`);
  console.log(`Actualizados/Creados: ${updated}`);
  console.log(`Omitidos (ya traducidos): ${skipped}`);
  console.log(`Errores: ${errors}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
