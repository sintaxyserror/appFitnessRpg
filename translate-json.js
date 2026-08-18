const fs = require('fs');

const exercises = JSON.parse(fs.readFileSync('prisma/exercises-raw.json', 'utf8'));
const translations = JSON.parse(fs.readFileSync('prisma/exercise-translations.json', 'utf8'));

const updatedExercises = exercises.map(ex => {
  if (translations[ex.name]) {
    return { ...ex, name: translations[ex.name] };
  }
  return ex;
});

fs.writeFileSync('prisma/exercises-raw.json', JSON.stringify(updatedExercises, null, 2));
console.log('Updated prisma/exercises-raw.json with translated names.');
