'use strict';
/* Teste de fumaça no navegador (Playwright + Chromium).
   Abre o jogo, começa uma jornada, força o despertar de um chefe, acompanha a investida e
   confere erros do jogo, erros do console e a taxa de quadros.
   Uso: node navegador.js [caminho do HTML] [pasta para as capturas] */
const path = require('path');
const { chromium } = require('playwright');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', 'aurora-cronicas-da-fenda.html'));
const out = process.argv[3] || null;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const logs = [];
  page.on('console', (m) => { if (m.type() === 'error') logs.push(m.text().slice(0, 300)); });
  page.on('pageerror', (e) => logs.push('PAGEERROR ' + String(e.stack || e).slice(0, 500)));
  await page.goto('file://' + file); await page.waitForTimeout(2500);
  await page.getByText('Iniciar jornada').first().click(); await page.waitForTimeout(1500);
  const shot = async (name) => { if (out) await page.screenshot({ path: path.join(out, name + '.png') }); };
  const step = (sec) => page.evaluate((s) => { for (let k = 0; k < 30 * s; k++) G.tick(1 / 30); }, sec);
  let fail = 0; const check = (ok, label, extra) => { console.log((ok ? 'ok   ' : 'FALHA ') + label + (extra ? ' · ' + extra : '')); if (!ok) fail++; };

  /* avisos: várias mensagens de uma vez ocupam uma única faixa e nada fica no centro */
  const lane = await page.evaluate(() => {
    G.toast('Kael caiu em combate!', 'bad', 'skull'); G.toast('Contrato cumprido', 'good', 'scroll');
    G.UI.banner('Um chefe despertou', 'Ancião da Matilha', 'Bosque Sussurrante'); G.toast('Aviso comum', 'info');
    const msgs = document.querySelectorAll('#av-slot .av-msg:not(.out)'), b = document.getElementById('banner'), r = document.getElementById('av-lane').getBoundingClientRect();
    return { visible: msgs.length, banner: getComputedStyle(b).display, top: Math.round(r.top), right: Math.round(r.right), state: G.UI.avisos.state() };
  });
  check(lane.visible === 1 && lane.banner === 'none', 'uma mensagem visível por vez, sem faixa no centro', JSON.stringify(lane));
  check(lane.right <= 412 - 80, 'a faixa não invade a coluna do botão Atividades', 'direita=' + lane.right);
  await shot('avisos');

  /* mapa: a câmera entra na margem de neblina e o canto do mapa aparece abaixo do HUD */
  const fog = await page.evaluate(() => { G.R.follow = 0; G.R.focus(-99, -99, true); return new Promise((r) => setTimeout(() => r({ corner: G.R.worldToScreen(0, 0).map(Math.round), hud: Math.round(document.getElementById('hud').getBoundingClientRect().bottom) }), 400)); });
  check(fog.corner[1] > fog.hud + 40 && fog.corner[0] > 60, 'canto do mapa visível fora do HUD', JSON.stringify(fog));
  await shot('neblina');

  /* chefe: desperta, a companhia é convocada e investe */
  await step(300);
  await page.evaluate(() => { G.S.stats.bosses = Math.max(1, G.S.stats.bosses); G.S.zones.bosque.gauge = 999; for (let k = 0; k < 90; k++) G.tick(1 / 30); });
  let st = await page.evaluate(() => G.rallyState('bosque'));
  check(st.phase === 'call' && st.members > 0, 'chefe despertou e os heróis foram convocados', JSON.stringify(st));
  let assault = false;
  for (let i = 0; i < 40 && !assault; i++) { await step(5); st = await page.evaluate(() => { const r = G.rallyState('bosque'), b = G.mons.find((m) => m.boss && !m.dead); if (b && r.phase === 'assault') { G.R.follow = 0; G.R.focus(b.x, b.y + 1, true); } return r; }); assault = st.phase === 'assault'; }
  check(assault, 'a companhia reunida investiu contra o chefe', JSON.stringify(st));
  await page.waitForTimeout(600); await shot('chefe');

  /* arte: folhas de 64×64 para heróis e moradores */
  const art = await page.evaluate(() => { const h = G.A.charSheet(G.A.heroLook(G.S.heroes[0])), n = G.A.charSheet(G.A.npcLook(G.CAST[0])); return { hero: [h.fw, h.fh, h.scale], npc: [n.fw, n.fh], frames: Object.keys(h.idx).length, stats: G.A.hero64Stats() }; });
  check(art.hero[0] === 64 && art.hero[1] === 64 && art.npc[0] === 64, 'heróis e moradores em 64×64', JSON.stringify(art));

  const perf = await page.evaluate(() => new Promise((res) => { G.R.follow = G.S.heroes[0].id; let n = 0, worst = 0; const t0 = performance.now(); let last = t0; const f = () => { const t = performance.now(); worst = Math.max(worst, t - last); last = t; n++; if (t - t0 < 3000) requestAnimationFrame(f); else res({ fps: Math.round(n / ((t - t0) / 1000)), worstMs: Math.round(worst) }); }; requestAnimationFrame(f); }));
  check(perf.fps >= 30, 'taxa de quadros', JSON.stringify(perf));
  const errs = await page.evaluate(() => ({ n: G.errorCount, first: G.errors.slice(0, 3).map((e) => e.event + ': ' + e.message) }));
  check(errs.n === 0, 'sem erros registrados pelo jogo', JSON.stringify(errs));
  check(logs.length === 0, 'console sem erros', logs.join(' | '));
  await browser.close();
  console.log(fail ? fail + ' verificação(ões) falharam' : 'tudo certo');
  process.exit(fail ? 1 : 0);
})();
