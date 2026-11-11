// Génère les logos de brand/ et les images du site à partir de build/icon.svg et de la police Outfit.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
const require = createRequire(import.meta.url);
const opentype = require('opentype.js');
const R = (p) => new URL('../' + p, import.meta.url);
const buf = readFileSync(R('node_modules/@fontsource/outfit/files/outfit-latin-700-normal.woff'));
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const icon = readFileSync(R('build/icon.svg'), 'utf8').replace(/<\/?svg[^>]*>/g, '');
const word = (x, y, size, fill3d, fillRest) => {
  const a = font.getPath('3D', x, y, size, { kerning: true }), w = font.getAdvanceWidth('3D', size, { kerning: true });
  const b = font.getPath('Infinite', x + w, y, size, { kerning: true });
  return { svg: `<path d="${a.toPathData(1)}" fill="${fill3d}"/><path d="${b.toPathData(1)}" fill="${fillRest}"/>`, width: w + font.getAdvanceWidth('Infinite', size, { kerning: true }) };
};
const horiz = (fg) => { const t = word(150, 92, 76, '#ff8468', fg); return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.ceil(170 + t.width)} 128"><g transform="translate(-8 -8) scale(.140625)">${icon}</g>${t.svg}</svg>`; };
writeFileSync(R('brand/logo-icone.svg'), readFileSync(R('build/icon.svg')));
writeFileSync(R('brand/logo-horizontal-clair.svg'), horiz('#f3f1ff'));   // texte clair, pour fond sombre
writeFileSync(R('brand/logo-horizontal-sombre.svg'), horiz('#1b1545'));  // texte sombre, pour fond clair
const t = word(0, 60, 76, '#ff8468', '#f3f1ff');
writeFileSync(R('brand/mot-symbole.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.ceil(t.width)} 78">${t.svg}</svg>`);
const png = (svg, w) => new Resvg(svg, { fitTo: { mode: 'width', value: w } }).render().asPng();
const iconSvg = readFileSync(R('build/icon.svg'));
writeFileSync(R('brand/logo-icone-1024.png'), png(iconSvg, 1024));
writeFileSync(R('site/img/icon-512.png'), png(iconSvg, 512));
writeFileSync(R('site/img/icon-180.png'), png(iconSvg, 180));
writeFileSync(R('site/img/favicon.svg'), iconSvg);
writeFileSync(R('site/img/logo.svg'), horiz('#f3f1ff'));
// image de partage (Open Graph) 1200×630
const o = word(96, 300, 96, '#ff8468', '#f3f1ff');
const sub = font.getPath('Modélisation 3D simple pour l’impression 3D', 96, 376, 33).toPathData(1);
writeFileSync(R('site/img/og.png'), png(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630"><defs><radialGradient id="g" cx="15%" cy="0%" r="90%"><stop offset="0" stop-color="#3a2a9a"/><stop offset="1" stop-color="#0c0a22"/></radialGradient></defs><rect width="1200" height="630" fill="url(#g)"/><g transform="translate(790 150) scale(.33)">${icon}</g>${o.svg}<path d="${sub}" fill="#aea8dc"/></svg>`, 1200));
console.log('brand/ et site/img/ générés');
