// Gera uma página de prévia da arte e tira uma captura. Uso: node tools/preview.js <modo> <saida.png>
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const SRC = path.join(__dirname, '..', 'src');
const mode = process.argv[2] || 'chars', out = process.argv[3] || '/tmp/prev.png';
const files = fs.readdirSync(SRC).filter((f) => /^\d\d-.*\.js$/.test(f) && +f.slice(0, 2) < 50).sort();
const js = files.map((f) => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n;\n');
const page = `<!doctype html><meta charset=utf-8><body style="margin:0;background:#3a5a3a"><canvas id=c></canvas><script>${js}
;G.W.init();G.newGame();
const cv=document.getElementById('c');const Z=${+process.argv[4] || 5};
const mode='${mode}';
(${preview.toString()})();
</script>`;
function preview() {
  const A = G.A; let x;
  const setup = (w, h, bg) => { cv.width = w; cv.height = h; x = cv.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = bg || '#4a7a48'; x.fillRect(0, 0, w, h); };
  if (mode === 'chars') {
    setup(26 * 9 * Z + 20, 30 * Z * 12 + 20);
    let row = 0;
    const put = (o) => { const s = A.charSheet(o); x.drawImage(s.cv, 0, 0, s.cv.width, 30, 10, 10 + row * 30 * Z, s.cv.width * Z, 30 * Z); row++; };
    for (const cls of G.CLASS_IDS) { const h = G.makeHero({ cls, lvl: 1 }); h.look = { skin: row % 5, hair: (row * 3 + 1) % 10, style: row % 6, seed: row }; put(A.heroLook(h)); }
    for (const cls of ['esp', 'cav', 'mag']) { const h = G.makeHero({ cls, lvl: 45 }); h.gear.arma.tier = 4; h.gear.armadura = { type: G.CLASSES[cls].a, tier: 4, rar: 2, plus: 0 }; h.look = { skin: 3, hair: 7 + row % 3, style: 2 + row % 3, seed: 5 }; put(A.heroLook(h)); }
    for (const n of [{ name: 'Fábio', job: 'Ferreiro', look: 9 }, { name: 'Alda', job: 'Padeira', look: 15 }, { name: 'Joca', job: 'Fazendeiro', look: 19 }]) put(A.npcLook(n));
  }
  if (mode === 'mons') {
    const ids = G.MON_IDS; setup(4 * 64 * Z / 2 + 20, Math.ceil(ids.length / 2) * 56 * Z / 2 + 20, '#5a7a50');
    ids.forEach((k, i) => { const s = A.monSheet(k, 0); const col = i % 2, row = Math.floor(i / 2); x.drawImage(s.cv, 0, 0, s.cv.width, s.h, 10 + col * 2 * 64 * Z / 2, 10 + row * 56 * Z / 2, s.cv.width * Z / 2 * (s.w > 40 ? 0.5 : 1), s.h * Z / 2 * (s.w > 40 ? 0.5 : 1)); });
  }
  if (mode === 'icons') {
    setup(16 * Z * 10 + 20, 16 * Z * 5 + 20, '#1a2233'); A.buildIcons(); let i = 0;
    for (const id in A.resURL) { const im = new Image(); const k = i++; im.onload = () => x.drawImage(im, 10 + (k % 10) * 16 * Z, 10 + Math.floor(k / 10) * 16 * Z, 16 * Z, 16 * Z); im.src = A.resURL[id]; }
  }
  if (mode === 'props') {
    const names = Object.keys(A.PROPS); setup(40 * Z * 8 + 20, 56 * Z * Math.ceil(names.length / 8) * 1 + 20, '#5a8a50');
    names.forEach((n, i) => { for (let v = 0; v < 1; v++) { const s = A.prop(n, i % 4); x.drawImage(s.cv, 10 + (i % 8) * 40 * Z, 10 + Math.floor(i / 8) * 56 * Z, s.cv.width * Z, s.cv.height * Z); } });
  }
  if (mode === 'blds') {
    const ids = G.BLD_IDS; setup(112 * Z * 4 + 20, 120 * Z * 4 + 20, '#6a9a58');
    ids.forEach((id, i) => { const s = A.building(id, [1, 4, 7, 12][i % 4], 0); x.drawImage(s.cv, 10 + (i % 4) * 112 * Z, 10 + Math.floor(i / 4) * 120 * Z, s.cv.width * Z, s.cv.height * Z); });
    const s = A.building('enfermaria', 0, 0); x.drawImage(s.cv, 10 + 3 * 112 * Z, 10 + 3 * 120 * Z, s.cv.width * Z, s.cv.height * Z);
  }
  if (mode === 'terrain') { const t = A.terrain(); setup(t.width * Z, t.height * Z); x.drawImage(t, 0, 0, t.width * Z, t.height * Z); }
}
(async () => {
  const f = path.join(require('os').tmpdir(), 'aurora-prev-' + mode + '.html'); fs.writeFileSync(f, page);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  p.on('pageerror', (e) => console.log('ERRO', e.message)); p.on('console', (m) => { if (m.type() === 'error') console.log('console', m.text()); });
  await p.goto('file://' + f); await p.waitForTimeout(500);
  await (await p.$('#c')).screenshot({ path: out }); await b.close(); console.log('ok', out);
})();
