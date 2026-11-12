#!/usr/bin/env node
/* Capturas do lote 4-C (clareza progressiva, Livro do Reino, efeitos leves automáticos) em capturas/ciclo4-c/.
   Uso: node ferramentas/captura-4c.js   (360×640 e 412×860, deviceScaleFactor 1). Também imprime o que aparece na interface nos primeiros 60 s. */
'use strict';
const fs = require('fs'), path = require('path');
const L = require('./teste-lib.js');
const OUT = path.join(__dirname, '..', 'capturas', 'ciclo4-c');
fs.mkdirSync(OUT, { recursive: true });

const visible = (page) => page.evaluate(() => {
  const vis = (el) => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  return {
    barra: [...document.querySelectorAll('#nav button')].filter(vis).map((b) => b.textContent.trim().replace(/\d+$/, '')),
    hud: [...document.querySelectorAll('#hud .chip, #hud .ctl button, #hud .hud-row .realm, #hudx button')].filter(vis).map((b) => b.getAttribute('data-a') || b.className.replace(/\s*glass\s*/, ' ').trim()),
    botoes: [...document.querySelectorAll('#fabs-l button, #fabs button')].filter(vis).map((b) => b.getAttribute('data-a')),
  };
});
const closeModals = async (page) => { for (let i = 0; i < 6; i++) { const open = await page.evaluate(() => { const o = G.UI.modalOpen; if (o) G.UI.closeModal(); return o; }); if (!open) break; await page.waitForTimeout(700); } };
const click = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); if (e) e.click(); return !!e; }, sel);

(async () => {
  for (const [w, h] of [[360, 640], [412, 860]]) {
    const tag = w;
    /* 1. primeiro minuto */
    {
      const { browser, page, errs } = await L.open(w, h);
      await page.click('[data-a="t-new"]'); await page.waitForTimeout(1200);
      await page.click('text=Pular').catch(() => {});
      await page.waitForTimeout(1500);
      console.log(w + ' · primeiro minuto (0–5 s):', JSON.stringify(await visible(page)));
      await page.screenshot({ path: path.join(OUT, '01-primeiro-minuto-' + tag + '.png') });
      await page.waitForTimeout(25000);
      console.log(w + ' · primeiro minuto (30 s):', JSON.stringify(await visible(page)));
      /* 2. libera a Forja: selo Novo! e dica de uma linha */
      await page.evaluate(() => { G.S.quest.step = 3; G.S.tut.guide = 0; G.emit('quest'); });
      await page.waitForTimeout(3500);
      await page.evaluate(() => { document.getElementById('toasts').innerHTML = ''; G.S.b.ferraria = { lvl: 1 }; G.emit('bld'); });
      await page.waitForTimeout(2200);
      await page.screenshot({ path: path.join(OUT, '02-novo-selo-dica-' + tag + '.png') });
      /* 3. cadeado com o requisito (Missões, Reino 3) */
      await page.evaluate(() => { G.S.realm.lvl = 2; G.S.quest.step = 5; G.emit('realm', { lvl: 2 }); });
      await page.waitForTimeout(1500);
      await page.evaluate(() => { document.getElementById('toasts').innerHTML = ''; });
      await click(page, '#nav-missoes'); await page.waitForTimeout(600);
      await page.evaluate(() => { const t = document.querySelector('#sheet .tabs'); t.scrollLeft = 999; });
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(OUT, '03-cadeado-requisito-' + tag + '.png') });
      await click(page, '#sheet .x'); await page.waitForTimeout(300);
      /* 4. Livro do Reino: índice (Mais › Livro) e uma página */
      await click(page, '#nav-mais'); await page.waitForTimeout(500);
      await click(page, '#sheet [data-a="tab:livro"]'); await page.waitForTimeout(500);
      await page.evaluate(() => { document.querySelector('#sheet .sh-body').scrollTop = 150; });
      await page.screenshot({ path: path.join(OUT, '04-livro-indice-' + tag + '.png') });
      await click(page, '#sheet [data-a="bookp:forja"]'); await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUT, '05-livro-pagina-' + tag + '.png') });
      await click(page, '[data-a="mclose"]'); await page.waitForTimeout(300);
      /* 6. Opções com o Modo leve ligado sozinho */
      await page.evaluate(() => { G.fxAuto(); });
      await click(page, '#sheet [data-a="tab:opcoes"]'); await page.waitForTimeout(900);
      await page.evaluate(() => { const b = document.querySelector('#sheet .sh-body'); const t = document.querySelector('[data-a="opt:lowFx"]'); if (t) b.scrollTop = t.offsetTop - 150; });
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(OUT, '06-opcoes-efeitos-leves-' + tag + '.png') });
      /* 7. ficha do herói só com as abas liberadas (sem Montaria, Artes e Feitos nos primeiros minutos) */
      await page.evaluate(() => { G.S.opts.lowFx = 0; G.S.heroes.forEach((x) => { x.ap = 0; }); G.S.realm.lvl = 1; G.S.sys.open.artes = 0; G.S.sys.open.feitos = 0; G.S.sys.open.estabulo = 0; });
      await click(page, '#sheet .x'); await page.waitForTimeout(300);
      await page.evaluate(() => { document.getElementById('toasts').innerHTML = ''; G.UI.open('herois', 'lista', { hero: G.S.heroes[0].id }); });
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(OUT, '07-ficha-abas-liberadas-' + tag + '.png') });
      console.log(w + ' · erros:', JSON.stringify(errs));
      await browser.close();
    }
  }
})();
