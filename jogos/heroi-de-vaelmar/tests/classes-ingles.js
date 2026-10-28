// Procura inglês nas telas de detalhe de todas as classes (info, habilidades, passivas e frascos).
const { abrir } = require('./lib');
const afirma = (ok, msg) => { if (!ok) { console.log('FALHOU:', msg); process.exitCode = 1; } };
(async () => {
  const { browser, page, erros } = await abrir({});
  const achados = await page.evaluate(() => {
    const ING = /(?<![\p{L}])(the|and|of|this|spell|your|that|is|are|will|with|from|can|may|damage|stats|buffs?|debuffs?|Frozen|Paralyzed|Burning|Blind|Poisoned|Stunned|Asleep|Blight|Sigil|Interaction|Chance of|Level|turns)(?![\p{L}])/u;
    const out = {};
    for (const k of Object.keys(CLASSES)) for (const p of ['info', 'skills', 'passives', 'flasks']) {
      const html = mClass(k, p), el = document.createElement('div'); el.innerHTML = html;
      el.querySelectorAll('img').forEach(i => i.remove());
      for (const n of el.querySelectorAll('.cd-it, .cd-desc, .cd-w, .cd-st, h2')) { const t = n.textContent; const m = t.match(ING); if (m) (out[k + '/' + p] ||= []).push(m[0] + ' « ' + t.slice(0, 110)); }
    }
    return out;
  });
  const ks = Object.keys(achados);
  console.log(ks.length, 'telas com inglês');
  for (const k of ks.slice(0, 40)) console.log(k, achados[k].slice(0, 2));
  afirma(ks.length === 0, 'ainda há inglês nas telas de classe');
  console.log(JSON.stringify({ erros })); await browser.close();
})();
