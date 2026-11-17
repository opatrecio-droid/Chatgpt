// Sequência longa de um prédio animado, para revisar o movimento quadro a quadro.
// Uso: node tools/building-seq.js <arquivo.html> <prefixo> <id> [N=16] [ms=250] [hora=10]
// Gera <prefixo>-00..NN.png (zoom 6, equipe no posto) e <prefixo>-folha.png (todos os quadros numa folha 4×N/4).
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [f, out, id, N = 16, D = 250, H = 10] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 430, height: 860 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
  await p.goto('file://' + path.resolve(f)); await p.waitForFunction(() => window.G && G.UI && G.R, null, { timeout: 60000 });
  await p.waitForTimeout(400); await p.click('[data-a="t-new"]'); await p.waitForTimeout(1500);
  const pin = () => p.evaluate(([id, H]) => { G.UI.closeModal(); G.UI.close(); G.R.follow = 0; const pl = G.W.plots[id];
    G.S.b[id] = Object.assign(G.S.b[id] || {}, { lvl: 1, dmg: 0 }); G.S.clock = H * 60; G.R.focus(pl.x + 3, pl.y + 2.2, true); G.R.cam.zf = 6; G.R.cam.z = 6;
    for (const n of G.npcs || []) if (n.at === id) { n.act = H >= 6 && H < 20 ? 'work' : 'home'; n.state = 'in'; n.inside = true; n.tThink = 999; n.until = 0; } }, [id, +H]);
  await pin(); if (await p.evaluate(() => !!G.syncNpcs)) await p.evaluate(() => G.syncNpcs()); await pin(); await p.waitForTimeout(800);
  const clip = { x: 15, y: 130, width: 400, height: 470 }, files = [];
  for (let i = 0; i < +N; i++) { await pin(); const fn = `${out}-${String(i).padStart(2, '0')}.png`; await p.screenshot({ path: fn, clip }); files.push(fn); await p.waitForTimeout(+D); }
  /* folha: monta no próprio navegador */
  const imgs = files.map(fn => 'data:image/png;base64,' + require('fs').readFileSync(fn).toString('base64'));
  const sheet = await p.evaluate(async (imgs) => { const L = await Promise.all(imgs.map(s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = s; })));
    const cols = 4, w = 400, h = 470, c = document.createElement('canvas'); c.width = cols * w; c.height = Math.ceil(L.length / cols) * h; const x = c.getContext('2d');
    L.forEach((im, k) => { x.drawImage(im, (k % cols) * w, ((k / cols) | 0) * h); x.fillStyle = '#ff0'; x.font = 'bold 22px sans-serif'; x.fillText(String(k), (k % cols) * w + 6, ((k / cols) | 0) * h + 24); });
    return c.toDataURL('image/png'); }, imgs);
  require('fs').writeFileSync(out + '-folha.png', Buffer.from(sheet.split(',')[1], 'base64'));
  console.log(errs.slice(0, 8).join('\n') || 'sem erros'); await b.close();
})();
