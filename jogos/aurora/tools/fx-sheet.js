// Folha de quadros das animações de habilidade (para revisar a arte).
// Uso: node tools/fx-sheet.js <arquivo.html> <saida.png> <chaves|classes> [quadros=6]
//   chaves: lista separada por vírgula, ex.: "base:esp,duelista" ou classes "esp,cav" (todas as 7 da classe)
// Cada linha = uma habilidade; cada coluna = um instante de 0 a dur. Também imprime erros de página.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const file = path.resolve(process.argv[2]);
  const out = process.argv[3] || 'fx-sheet.png';
  const sel = (process.argv[4] || 'esp').split(',');
  const frames = Number(process.argv[5] || 6);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text().slice(0, 300)); });
  await page.goto('file://' + file);
  await page.waitForFunction(() => window.G && G.M && G.UI && G.A && G.A.SkillFX, null, { timeout: 60000 });
  await page.waitForTimeout(400);
  await page.click('[data-a="t-new"]');
  await page.waitForTimeout(1200);
  const report = await page.evaluate(({ sel, frames }) => {
    const FX = G.A.SkillFX, A = G.A;
    const keys = sel.flatMap(s => (G.CLASSES[s] ? FX.classSkills(s) : [s]));
    const FW = 210, FH = 140, z = 2, tile = 32, LABEL = 150;
    const cv = document.createElement('canvas'); cv.width = LABEL + FW * frames; cv.height = FH * keys.length;
    Object.assign(cv.style, { position: 'fixed', left: 0, top: 0, zIndex: 99999, background: '#000' });
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
    const fake = cls => ({ id: 0, cls, rar: 2, rank: 3, look: { skin: 1, hair: 3, style: 2, seed: 11 }, cos: {}, gear: { arma: { type: G.CLASSES[cls].w, tier: 3, rar: 2, plus: 0 }, armadura: { type: G.CLASSES[cls].a, tier: 3, rar: 2, plus: 0 } } });
    const drawHero = (cls, x, y, pose, flip) => {
      try {
        const s = A.charSheet(A.heroLook(fake(cls))), n = s.idx[pose] || 0, fw = s.fw || 26, fh = s.fh || 30, fs = s.scale || 1, ax = s.ax == null ? 13 : s.ax, ay = s.ay == null ? 27 : s.ay;
        if (s.need) s.need(pose);
        ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1); ctx.drawImage(s.cv, n * fw, 0, fw, fh, -ax * fs * z, -ay * fs * z, fw * fs * z, fh * fs * z); ctx.restore();
      } catch (e) { ctx.fillStyle = '#8af'; ctx.fillRect(x - 8, y - 40, 16, 40); }
    };
    const drawMon = (x, y) => {
      try { const s = A.monSheet('esqueleto', 0, 0), sw = s.sw || s.w, sh = s.sh || s.h; ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1); ctx.drawImage(s.cv, 0, 0, sw, sh, -s.w * z / 2, -(s.h - 2) * z, s.w * z, s.h * z); ctx.restore(); }
      catch (e) { ctx.fillStyle = '#c66'; ctx.fillRect(x - 8, y - 30, 16, 30); }
    };
    const missing = [];
    keys.forEach((key, row) => {
      const info = FX.info(key); if (!FX.has(key)) missing.push(key);
      const dur = FX.duration(key), y0 = row * FH;
      ctx.fillStyle = '#111'; ctx.fillRect(0, y0, LABEL, FH);
      ctx.fillStyle = info ? info.color : '#fff'; ctx.font = 'bold 13px Arial'; ctx.fillText(info ? info.name : key, 6, y0 + 22);
      ctx.fillStyle = '#bbb'; ctx.font = '11px Arial'; ctx.fillText(key, 6, y0 + 40); ctx.fillText('dur ' + dur + 's  hits ' + FX.hits(key).join(','), 6, y0 + 56);
      if (!FX.has(key)) { ctx.fillStyle = '#f66'; ctx.fillText('SEM ARTE (genérica)', 6, y0 + 74); }
      for (let f = 0; f < frames; f++) {
        const t = dur * (0.04 + 0.92 * f / Math.max(1, frames - 1)), x0 = LABEL + f * FW;
        ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, FW, FH); ctx.clip();
        const g = ctx.createLinearGradient(0, y0, 0, y0 + FH); g.addColorStop(0, '#1c2433'); g.addColorStop(1, '#2d3a2a'); ctx.fillStyle = g; ctx.fillRect(x0, y0, FW, FH);
        const gy = y0 + FH - 26, cx = x0 + (info && info.ranged ? 40 : 78), tx = x0 + 150;
        drawHero(info ? info.cls : 'esp', cx - 34, gy + 6, 'idle0', false);
        drawHero(info ? info.cls : 'esp', cx, gy, 'cast0', false);
        drawMon(tx, gy); drawMon(tx + 30, gy - 14); drawMon(tx + 22, gy + 12);
        const sc = { x: cx, y: gy, tx, ty: gy, z, tile, dir: 1, quiet: false, light: false, world: false, seed: 1234 + row, W: cv.width, H: cv.height,
          others: [{ x: tx + 30, y: gy - 14 }, { x: tx + 22, y: gy + 12 }], allies: [{ x: cx - 34, y: gy + 6 }], shake: () => {} };
        FX.render(ctx, key, t, sc);
        ctx.restore();
        ctx.fillStyle = '#fff8'; ctx.font = '10px Arial'; ctx.fillText('t=' + t.toFixed(2), x0 + 4, y0 + 12);
        ctx.strokeStyle = '#000'; ctx.strokeRect(x0 + 0.5, y0 + 0.5, FW - 1, FH - 1);
      }
    });
    return { w: cv.width, h: cv.height, keys: keys.length, missing };
  }, { sel, frames });
  await page.setViewportSize({ width: Math.min(report.w, 4000), height: Math.min(report.h, 8000) });
  await page.waitForTimeout(200);
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: report.w, height: report.h } });
  console.log(JSON.stringify(report));
  console.log(errors.slice(0, 15).join('\n') || 'sem erros');
  await browser.close();
})();
