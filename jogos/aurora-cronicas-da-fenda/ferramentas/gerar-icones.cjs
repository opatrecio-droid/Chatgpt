/* Gera ícones e telas de abertura do Android a partir de um SVG (a mesma lua do favicon do jogo).
   Uso (precisa do Playwright, que já vem no ambiente de desenvolvimento): node ferramentas/gerar-icones.cjs
   Os PNGs gerados ficam versionados em android/app/src/main/res; só rode de novo se mudar o desenho. */
const { chromium } = require('playwright');
const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const RES = join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const FUNDO = '#2b1a12', OURO = '#e2b659', VIOLETA = '#b58cf2';

/* A lua do favicon (64×64) desenhada em um quadro 108×108 de ícone adaptativo.
   escala 1.18 mantém tudo dentro da zona segura (66%). */
const lua = (id) => `
  <defs><mask id="${id}"><rect width="108" height="108" fill="#fff"/><circle cx="${54 + (33 - 32) * 1.18 + 5 * 1.18}" cy="${54 + (25 - 32) * 1.18}" r="${13 * 1.18}" fill="#000"/></mask></defs>
  <g>
    <circle cx="${54 + (26 - 32) * 1.18}" cy="${54 + (30 - 32) * 1.18}" r="${15 * 1.18}" fill="${OURO}" mask="url(#${id})"/>
    <circle cx="${54 + (45 - 32) * 1.18 + 3}" cy="${54 + (42 - 32) * 1.18 + 2}" r="${6 * 1.18}" fill="${VIOLETA}"/>
    <rect x="${54 + 8}" y="${54 - 24}" width="2.4" height="2.4" fill="#fff6d8"/><rect x="${54 + 17}" y="${54 - 14}" width="1.8" height="1.8" fill="#fff6d8"/><rect x="${54 - 26}" y="${54 + 20}" width="1.8" height="1.8" fill="#cfd8ff"/>
  </g>`;

const svgIcone = (modo) => {
  const fundo = modo === 'foreground' ? '' : `<rect width="108" height="108" fill="${FUNDO}"/>`;
  const clip = modo === 'round' ? '<clipPath id="r"><circle cx="54" cy="54" r="54"/></clipPath>' : modo === 'legacy' ? '<clipPath id="r"><rect width="108" height="108" rx="22"/></clipPath>' : '';
  const g = modo === 'foreground' ? lua('m') : `<g clip-path="url(#r)">${fundo}<g transform="translate(54 54) scale(1.12) translate(-54 -54)">${lua('m')}</g></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="100%" height="100%">${clip}${g}</svg>`;
};

const splash = (w, h) => `
  <div style="width:${w}px;height:${h}px;position:relative;overflow:hidden;background:linear-gradient(#070b17,#101833 45%,#2d2b5a 80%,#62406c)">
    <svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0" width="${w}" height="${h}">
      ${Array.from({ length: 70 }, (_, i) => { const s = Math.abs(Math.sin(i * 91.7)), t = Math.abs(Math.cos(i * 47.3)); return `<rect x="${(s * w) | 0}" y="${(t * h * .6) | 0}" width="${1 + (i % 3 === 0 ? 1 : 0)}" height="${1 + (i % 3 === 0 ? 1 : 0)}" fill="${i % 5 ? '#b9c6f0' : '#ffffff'}" opacity="${.4 + (i % 4) * .15}"/>`; }).join('')}
    </svg>
    <div style="position:absolute;left:50%;top:44%;width:${Math.min(w, h) * .3}px;height:${Math.min(w, h) * .3}px;transform:translate(-50%,-60%)">${svgIcone('foreground')}</div>
    <div style="position:absolute;left:0;right:0;top:${h * .58}px;text-align:center;font:700 ${Math.min(w, h) * .085}px/1 'DejaVu Serif',Georgia,serif;letter-spacing:.2em;color:#f3d9a0;text-shadow:0 3px 0 #3a2a10">AURORA</div>
    <div style="position:absolute;left:0;right:0;top:${h * .58 + Math.min(w, h) * .12}px;text-align:center;font:600 ${Math.min(w, h) * .028}px/1 'DejaVu Sans',sans-serif;letter-spacing:.5em;color:#e2b659">CRÔNICAS DA FENDA</div>
  </div>`;

const ICONES = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
const FRENTE = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
const SPLASH_PORT = { mdpi: [320, 480], hdpi: [480, 800], xhdpi: [720, 1280], xxhdpi: [960, 1600], xxxhdpi: [1280, 1920] };

(async () => {
  const b = await chromium.launch();
  const foto = async (html, w, h, destino, transparente) => {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await p.setContent(`<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:${transparente ? 'transparent' : '#000'}}</style>${html}`);
    mkdirSync(join(destino, '..'), { recursive: true });
    await p.screenshot({ path: destino, omitBackground: !!transparente });
    await p.close();
  };
  for (const [d, px] of Object.entries(ICONES)) {
    await foto(`<div style="width:${px}px;height:${px}px">${svgIcone('legacy')}</div>`, px, px, join(RES, `mipmap-${d}`, 'ic_launcher.png'), true);
    await foto(`<div style="width:${px}px;height:${px}px">${svgIcone('round')}</div>`, px, px, join(RES, `mipmap-${d}`, 'ic_launcher_round.png'), true);
    const f = FRENTE[d];
    await foto(`<div style="width:${f}px;height:${f}px">${svgIcone('foreground')}</div>`, f, f, join(RES, `mipmap-${d}`, 'ic_launcher_foreground.png'), true);
  }
  for (const [d, [w, h]] of Object.entries(SPLASH_PORT)) {
    await foto(splash(w, h), w, h, join(RES, `drawable-port-${d}`, 'splash.png'));
    await foto(splash(h, w), h, w, join(RES, `drawable-land-${d}`, 'splash.png'));
  }
  await foto(splash(720, 1280), 720, 1280, join(RES, 'drawable', 'splash.png'));
  writeFileSync(join(__dirname, '..', 'config', 'icone.svg'), svgIcone('legacy').replace('width="100%" height="100%"', 'width="512" height="512"'));
  await b.close();
  console.log('Ícones e splash gerados em', RES);
})();
