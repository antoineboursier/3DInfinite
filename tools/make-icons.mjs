// Génère build/icon.png (1024) à partir de build/icon.svg — lancé avant chaque fabrication des installeurs
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
const svg = readFileSync(new URL('../build/icon.svg', import.meta.url));
const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1024 } }).render().asPng();
writeFileSync(new URL('../build/icon.png', import.meta.url), png);
console.log('build/icon.png', png.length, 'octets');
