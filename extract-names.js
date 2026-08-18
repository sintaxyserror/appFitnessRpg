const fs = require('fs');
const exercises = JSON.parse(fs.readFileSync('prisma/exercises-raw.json', 'utf8'));
const names = exercises.map(ex => ex.name);
fs.writeFileSync('prisma/exercise-names.txt', names.join('\n'));
