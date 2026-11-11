// Assemble l'appli de bureau : src/app.html + geom.js + bibliothèques locales (hors ligne) -> app/index.html
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const nm = (...p) => join(root, 'node_modules', ...p);
const rd = (p, enc = 'utf8') => readFileSync(p, enc);
let src = rd(join(root, 'src/app.html'));

const need = (s, what) => { if (!src.includes(s)) throw new Error('motif introuvable : ' + what); };
const sub = (a, b, what) => { need(a, what); src = src.replace(a, () => b); };

// 1. bibliothèques locales plutôt que CDN
mkdirSync(join(root, 'app/vendor'), { recursive: true });
copyFileSync(nm('three/build/three.min.js'), join(root, 'app/vendor/three.min.js'));
copyFileSync(nm('three/examples/js/loaders/SVGLoader.js'), join(root, 'app/vendor/SVGLoader.js'));
copyFileSync(nm('opentype.js/dist/opentype.min.js'), join(root, 'app/vendor/opentype.min.js'));
sub('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', 'vendor/three.min.js', 'three');
sub('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/SVGLoader.js', 'vendor/SVGLoader.js', 'SVGLoader');
sub('https://cdnjs.cloudflare.com/ajax/libs/opentype.js/1.3.4/opentype.min.js', 'vendor/opentype.min.js', 'opentype');

// 2. police Outfit locale
let css = '';
for (const w of [400, 500, 600, 700]) {
  const f = `outfit-latin-${w}-normal.woff2`;
  mkdirSync(join(root, 'app/fonts'), { recursive: true });
  copyFileSync(nm('@fontsource/outfit/files', f), join(root, 'app/fonts', f));
  css += `@font-face{font-family:"Outfit";font-style:normal;font-weight:${w};font-display:swap;src:url(${f}) format("woff2")}\n`;
}
writeFileSync(join(root, 'app/fonts/outfit.css'), css);
sub('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap', 'fonts/outfit.css', 'police');

// 3. moteur de géométrie (manifold) et police du texte intégré
const man = rd(nm('manifold-3d/manifold.js')).replace('export default Module;', '');
const wasm = readFileSync(nm('manifold-3d/manifold.wasm')).toString('base64');
const font = readFileSync(nm('@fontsource/inter/files/inter-latin-700-normal.woff')).toString('base64');
sub('/*__MANIFOLD_JS__*/', man, 'manifold');
sub('__WASM_B64__', wasm, 'wasm');
sub('__FONT_B64__', font, 'font');
sub('/*__GEOM_JS__*/', rd(join(root, 'src/geom.js')), 'geom');

writeFileSync(join(root, 'app/index.html'),
  '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>' + src + '</body></html>');
console.log('app/index.html', (src.length / 1e6).toFixed(2), 'Mo');
