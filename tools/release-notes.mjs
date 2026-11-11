// Extrait de CHANGELOG.md les notes d'une version :  node tools/release-notes.mjs 1.1.0
import { readFileSync } from 'node:fs';
const v = process.argv[2];
const txt = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
const lines = txt.split(/\r?\n/);
const start = lines.findIndex((l) => new RegExp('^##\\s+\\[?v?' + v.replace(/\./g, '\\.') + '\\]?(\\s|$)').test(l));
if (start < 0) { console.error(`CHANGELOG.md n'a pas de section « ## ${v} » : ajoute les notes de cette version.`); process.exit(1); }
let end = lines.findIndex((l, i) => i > start && /^##\s/.test(l)); if (end < 0) end = lines.length;
const body = lines.slice(start + 1, end).join('\n').trim();
if (!body) { console.error(`La section « ## ${v} » de CHANGELOG.md est vide.`); process.exit(1); }
console.log(body);
