// Uso: node scripts/materialize-files.js outputs\ui.json frontend
//      node scripts/materialize-files.js outputs\backend.json backend
const fs = require('fs');
const path = require('path');

const [,, jsonPath, outDir] = process.argv;
if (!jsonPath || !outDir) {
  console.error('Usage: node scripts/materialize-files.js <files.json> <outDir>');
  process.exit(1);
}
const raw = fs.readFileSync(jsonPath, 'utf8');
const payload = JSON.parse(raw);
if (!payload.files || !Array.isArray(payload.files)) {
  console.error('Invalid JSON: expected { files: [{path, content}] }');
  process.exit(1);
}
for (const f of payload.files) {
  const dest = path.join(outDir, f.path);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, f.content, 'utf8');
  console.log('Wrote', dest);
}
console.log('Done.');
