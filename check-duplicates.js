const fs = require('fs');
const translations = JSON.parse(fs.readFileSync('prisma/exercise-translations.json', 'utf8'));
const values = Object.values(translations);
const duplicates = values.filter((item, index) => values.indexOf(item) !== index);
if (duplicates.length > 0) {
  console.log('Duplicate translations found:', [...new Set(duplicates)]);
} else {
  console.log('No duplicate translations found.');
}
