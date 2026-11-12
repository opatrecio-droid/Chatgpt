#!/usr/bin/env node
/* Fumaça do jogo no navegador (reutilizável nas próximas fases). Não monta nada: abre o HTML já montado (padrão aurora-v27.html) no Chromium do Playwright
   com viewport de celular (412×915, escala 2, toque), começa um jogo NOVO pela tela de título e pela apresentação da Rosa, deixa rodar, toca em prédios,
   evolui um pelo cartão, dispara e resolve uma decisão pendente, confere que nada pausa o jogo, simula ausências (reescreve `saved` do save e recarrega:
   2 h e 20 h), a volta da aba escondida e um save "antigo" (sem os campos da v27, lenharia/pedreira no nível 0). Qualquer erro de console ou de página reprova.
   Uso: node tools/smoke.js [--file caminho.html] [--out pasta] [--hours 2,20]
   Capturas (PNG, em pixels CSS) em --out (padrão: a pasta da fase A do scratchpad, se existir, senão /tmp/aurora-smoke). Código de saída 1 se algo falhar. */
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const FILE = path.resolve(arg('file', path.join(__dirname, '..', 'aurora-v27.html')));
const DEF_OUT = '/tmp/claude-0/-home-user-Chatgpt/7a7f5893-7401-5a6e-8d04-2ae4d5f0aa59/scratchpad/phaseA';
const OUT = arg('out', fs.existsSync(path.dirname(DEF_OUT)) ? DEF_OUT : '/tmp/aurora-smoke');
const HOURS = arg('hours', '2,20').split(',').map(Number);
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (/^\d\d-.*\.png$/.test(f)) fs.unlinkSync(path.join(OUT, f));      // capturas de execuções anteriores

const errs = [], results = [];
let page, n = 0;
const shot = async (name) => { const f = path.join(OUT, String(++n).padStart(2, '0') + '-' + name + '.png'); await page.screenshot({ path: f, scale: 'css' }); return f; };
const step = async (name, fn) => {
  const t0 = Date.now(), e0 = errs.length;
  try { await fn(); const bad = errs.length - e0; results.push({ name, ok: bad === 0, ms: Date.now() - t0, note: bad ? bad + ' erro(s) de console/página' : '' }); }
  catch (e) { results.push({ name, ok: false, ms: Date.now() - t0, note: String(e && e.message || e).split('\n')[0] }); try { await shot('FALHA-' + name.replace(/\W+/g, '-').slice(0, 30)); } catch (e2) { /* ok */ } }
  const r = results[results.length - 1]; console.log((r.ok ? '  ok   ' : '  FAIL ') + name + ' (' + r.ms + ' ms)' + (r.note ? ' — ' + r.note : ''));
};
const assert = (c, msg) => { if (!c) throw new Error(msg); };
const ev = (fn, a) => page.evaluate(fn, a);
const waitAway = async (ms) => { await page.waitForFunction(() => !G.M.away, null, { timeout: ms || 60000 }); };
const startContinue = async () => { await page.waitForSelector('#title.on', { timeout: 30000 }); await page.tap('[data-a="t-continue"]'); };
const tamperSaved = (hoursAgo) => ev((h) => { G.M.save(); const k = G.SAVE_KEY, s = JSON.parse(localStorage.getItem(k)); s.saved = Date.now() - h * 3600 * 1000; localStorage.setItem(k, JSON.stringify(s)); G.M.save = () => false; /* o pagehide do reload não pode regravar o horário */ }, hoursAgo);
/* leva o prédio para a faixa livre acima do cartão (y = 300 px) e toca nele, como um jogador faria (o cartão pode estar aberto de outro prédio) */
const focusTap = async (id) => {
  await ev((id) => { const R = G.R, p = G.W.plots[id]; R.follow = 0; R.focus(p.cx, p.cy, true); const a = R.screenToWorld(0, 0), b = R.screenToWorld(0, 100), tpp = (b[1] - a[1]) / 100; R.focus(p.cx, p.cy + 0.6 + (innerHeight / 2 - 300) * tpp, true); }, id);
  await page.waitForTimeout(300);
  const pt = await ev((id) => { const p = G.W.plots[id], [x, y] = G.R.worldToScreen(p.cx, p.cy + 0.6); return [x, y]; }, id);
  await page.touchscreen.tap(pt[0], pt[1]);
  await page.waitForTimeout(450);
};

(async () => {
  console.log('Fumaça · ' + FILE + '\n       capturas em ' + OUT);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  page = await ctx.newPage(); page.setDefaultTimeout(10000);
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console.error: ' + m.text()); });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  const open = async () => { await page.goto('file://' + FILE); await page.waitForSelector('#title.on', { timeout: 30000 }); };

  await step('abre o HTML e mostra a tela de título', async () => { await open(); assert(await ev(() => typeof G !== 'undefined' && G.VERSION === '27.0'), 'G.VERSION não é 27.0'); await shot('titulo'); });
  await step('jogo novo pela tela de título e apresentação da Rosa', async () => {
    await page.tap('[data-a="t-new"]');
    await page.waitForSelector('#modal.on .rosa', { timeout: 15000 });
    await shot('apresentacao-1');
    await page.tap('[data-a="tnext"]'); await page.waitForTimeout(300);
    await page.tap('[data-a="tnext"]'); await page.waitForTimeout(500);
    assert(await ev(() => G.S.tut.done && !G.UI.modalOpen), 'a apresentação não terminou');
    assert(await ev(() => G.bLvl('lenharia') === 1 && G.bLvl('pedreira') === 1), 'lenharia/pedreira não começam no nível 1');
  });
  await step('deixa rodar a 3×: nada abre sozinho nem pausa', async () => {
    const t0 = await ev(() => { G.S.speed = 3; G.S.tut.guide = 0; return G.S.t; });
    await page.waitForTimeout(6000);
    const r = await ev(() => ({ t: G.S.t, paused: G.S.paused, modal: G.UI.modalOpen, mp: G.M.modalPause }));
    assert(r.t - t0 > 10, 'o tempo de jogo não andou (' + (r.t - t0).toFixed(1) + ')');
    assert(!r.paused && !r.modal && r.mp === undefined, 'jogo pausado ou janela aberta: ' + JSON.stringify(r));
    await shot('mapa-rodando');
  });
  await step('toca em prédios: cartão com tudo, sem pausa, toque fora fecha', async () => {
    await ev(() => { G.S.gold = 3000; G.S.res.madeira = 300; G.S.res.pedra = 300; G.S.res.minerio = 100; });
    for (const id of ['guilda', 'ferraria', 'lenharia', 'pedreira', 'taverna', 'cidadela']) {
      await focusTap(id);
      const k = await ev(() => ({ kind: G.UI.dock.kind, key: G.UI.dock.key, txt: document.querySelector('#bcard').innerText, paused: G.S.paused, modal: G.UI.modalOpen }));
      assert(k.kind === 'predio' && k.key === id, 'cartão não abriu para ' + id + ' ' + JSON.stringify(k));
      assert(!k.paused && !k.modal, 'cartão pausou o jogo ou abriu janela');
      assert(/O QUE DÁ/i.test(k.txt) && /Salário da equipe/.test(k.txt) && /LÁ DENTRO AGORA/i.test(k.txt), 'faltam seções no cartão de ' + id + ': ' + k.txt.slice(0, 120));
      assert(/Evoluir|Construir|Consertar|limite|Requer/i.test(k.txt), 'sem ação no cartão de ' + id);
      await shot('cartao-' + id);
    }
    /* uma casa da vila (moradia) também responde ao toque */
    await ev(() => { const R = G.R, h = G.W.houses[0]; R.follow = 0; R.focus(h.x + 2, h.y + 1, true); const a = R.screenToWorld(0, 0), b = R.screenToWorld(0, 100); R.focus(h.x + 2, h.y + 1 + (innerHeight / 2 - 300) * ((b[1] - a[1]) / 100), true); });
    await page.waitForTimeout(300);
    { const pt = await ev(() => { const h = G.W.houses[0], [x, y] = G.R.worldToScreen(h.x + 2, h.y + 1.5); return [x, y]; }); await page.touchscreen.tap(pt[0], pt[1]); await page.waitForTimeout(450); }
    assert(await ev(() => G.UI.dock.kind === 'casa' && /Moram aqui/i.test(document.querySelector('#bcard').innerText)), 'a casa da vila não abriu cartão');
    await shot('cartao-casa');
    /* toque num ponto vazio do mapa, acima do cartão, fecha */
    const pt = await ev(() => { const h = document.querySelector('#hud').getBoundingClientRect().bottom, c = document.querySelector('#bcard').getBoundingClientRect().top; for (let y = h + 20; y < c - 20; y += 12) for (let x = 20; x < innerWidth - 20; x += 24) if (!G.R.pick(x, y)) return [x, y]; return null; });
    assert(pt, 'não achei um ponto vazio do mapa'); await page.touchscreen.tap(pt[0], pt[1]); await page.waitForTimeout(300);
    assert(await ev(() => !G.UI.dock.kind), 'toque fora não fechou o cartão');
  });
  await step('evolui um prédio pelo cartão (Evoluir) e mostra o que falta quando não dá', async () => {
    await ev(() => { G.S.gold = 5000; G.S.res.madeira = 300; G.S.res.pedra = 300; });
    const l0 = await ev(() => G.bLvl('guilda'));
    await focusTap('guilda');
    await page.tap('#bk-up'); await page.waitForTimeout(400);
    const l1 = await ev(() => G.bLvl('guilda'));
    assert(l1 === l0 + 1, 'o nível da Guilda não subiu (' + l0 + ' -> ' + l1 + ')');
    assert(await ev(() => /Nível 2/.test(document.querySelector('#bcard').innerText)), 'o cartão não mostra o novo nível');
    await shot('cartao-apos-evoluir');
    await ev(() => { G.S.gold = 10; });
    await focusTap('hospedaria'); await page.waitForTimeout(500);
    const miss = await ev(() => { const e = document.querySelector('.bk-miss'); return { t: e ? e.innerText : '', vis: !!e && !e.classList.contains('ok'), dis: document.querySelector('#bk-up').disabled }; });
    assert(miss.vis && /^Faltam/.test(miss.t) && miss.dis, 'não mostra o que falta: ' + JSON.stringify(miss));
    await shot('cartao-o-que-falta');
    await ev(() => G.UI.dock.close());
  });
  await step('decisão pendente: não abre janela, atalho com contagem, escolher resolve', async () => {
    await ev(() => { const S = G.S; S.gold = 5000; S.ev.pending = null; S.ev.next = 0; G.eventRoll(); });
    await page.waitForTimeout(700);
    const r = await ev(() => ({ pend: G.S.ev.pending, modal: G.UI.modalOpen, fab: document.querySelector('#fab-inbox').classList.contains('on'), t: document.querySelector('#fab-inbox .fi-t').textContent, paused: G.S.paused }));
    assert(r.pend && !r.modal && r.fab && /\d:\d\d/.test(r.t) && !r.paused, 'estado inesperado: ' + JSON.stringify(r));
    await shot('decisao-atalho');
    await page.tap('#fab-inbox'); await page.waitForTimeout(400); await shot('pendencias');
    await page.tap('[data-a="evopen"]'); await page.waitForTimeout(400); await shot('decisao-cartao');
    const t0 = await ev(() => G.S.t); await page.waitForTimeout(600);
    assert(await ev((t0) => G.S.t > t0, t0), 'o jogo parou com a decisão aberta');
    await page.tap('.opt[data-a="evopt:0"]:not([disabled]), .opt[data-a="evopt:1"]:not([disabled])'); await page.waitForTimeout(400);
    assert(await ev(() => !G.S.ev.pending && !G.UI.dock.kind), 'a decisão não foi resolvida/fechada');
  });
  await step('decisão ignorada: Aurora resolve sozinha e escreve uma linha no registro', async () => {
    await ev(() => { const S = G.S; S.ev.pending = null; S.ev.next = 0; G.eventRoll(); S.ev.until = S.t + 4; });
    await page.waitForTimeout(3500);
    const r = await ev(() => ({ pend: G.S.ev.pending, line: G.S.log.slice(-12).map((l) => l.m).find((m) => /ninguém decidiu a tempo/.test(m)) || '', modal: G.UI.modalOpen }));
    assert(!r.pend && r.line && !r.modal, 'não resolveu sozinha: ' + JSON.stringify(r));
  });
  await step('só o botão de pausa pausa (janela do Portal aberta não pausa)', async () => {
    await ev(() => G.UI.recruitModal()); await page.waitForSelector('#modal.on', { timeout: 5000 });      // a janela que o toque no Portal abre
    const t0 = await ev(() => G.S.t); await page.waitForTimeout(900);
    assert(await ev((t0) => G.S.t > t0 && !G.S.paused, t0), 'a janela do Portal pausou o jogo'); await shot('portal-sem-pausa');
    await page.tap('[data-a="mclose"]'); await page.waitForTimeout(250);
    await page.tap('.ctl [data-a="pause"]'); await page.waitForTimeout(300);
    const a = await ev(() => G.S.t); await page.waitForTimeout(700);
    assert(await ev((a) => G.S.paused && G.S.t === a, a), 'o botão de pausa não pausou');
    await page.tap('.ctl [data-a="pause"]'); await page.waitForTimeout(300);
    assert(await ev(() => !G.S.paused), 'não despausou');
  });

  /* ---- ausências: reescreve `saved` e recarrega ---- */
  for (const h of HOURS) {
    await step('ausência de ' + h + ' h: tela de espera, simulação e um único resumo', async () => {
      await ev(() => { G.S.speed = 1; });
      await tamperSaved(h);
      await open(); const t0 = Date.now();
      await startContinue();
      await page.waitForTimeout(700);
      const mid = await ev(() => ({ away: G.M.away, vis: !!document.querySelector('#away.on') }));
      if (mid.away) { assert(mid.vis, 'sem tela de espera'); await shot('espera-' + h + 'h'); }
      await waitAway(60000);
      const ms = Date.now() - t0;
      await page.waitForSelector('#modal.on', { timeout: 15000 });
      await page.waitForTimeout(500);
      const r = await ev(() => ({ day: G.S.day, txt: document.querySelector('#modal').innerText, modals: document.querySelectorAll('#modal .mbox').length, off: G.S.ret && G.S.ret.off ? { secs: G.S.ret.off.secs, eff: G.S.ret.off.eff, est: G.S.ret.off.est, cards: G.S.ret.off.cards.length } : null, paused: G.S.paused, run: G.M.running }));
      assert(/Aurora não parou/.test(r.txt) && r.modals === 1 && r.off, 'resumo ausente ou duplicado: ' + r.txt.slice(0, 80));
      assert(r.run && !r.paused, 'o jogo não está rodando depois do resumo');
      const effH = Math.min(h, 16) <= 8 ? Math.min(h, 16) * 0.5 : 4 + (Math.min(h, 16) - 8) * 0.3;
      assert(Math.abs(r.off.eff - effH * 3600) < 5, 'tempo vivido errado: ' + r.off.eff + ' (esperado ' + effH * 3600 + ')');
      console.log('         ' + h + ' h fora: ' + ms + ' ms até o resumo · simulado ' + (r.off.eff - r.off.est) + ' s de ' + r.off.eff + ' · dia ' + r.day + ' · cartas ' + r.off.cards);
      await shot('resumo-' + h + 'h');
      await ev(() => { const m = document.querySelector('#modal .mbox'); if (m) m.scrollTop = 99999; }); await page.waitForTimeout(250); await shot('resumo-' + h + 'h-fim');
      await page.tap('#modal [data-a="mclose"]'); await page.waitForTimeout(400);
      assert(await ev(() => !G.UI.modalOpen && !(G.S.ret && G.S.ret.off)), 'o resumo não fechou e entregou as cartas');
    });
  }
  await step('o mesmo tempo não conta duas vezes (recarregar logo depois não simula de novo)', async () => {
    await ev(() => { G.M.save(); });
    const d0 = await ev(() => G.S.day);
    await open(); await startContinue(); await page.waitForTimeout(900);
    const r = await ev(() => ({ away: G.M.away, modal: G.UI.modalOpen, day: G.S.day, run: G.M.running }));
    assert(!r.away && !r.modal && r.run && r.day - d0 <= 1, 'simulou de novo: ' + JSON.stringify(r) + ' d0=' + d0);
  });
  await step('aba escondida por 2 h volta como ausência (visibilitychange)', async () => {
    await ev(() => { G.S.speed = 1; });
    const d0 = await ev(() => G.S.day);
    await ev(() => { let hid = true; Object.defineProperty(document, 'hidden', { configurable: true, get: () => hid }); document.dispatchEvent(new Event('visibilitychange')); window.__show = () => { hid = false; G.M.hiddenAt = Date.now() - 2 * 3600 * 1000; document.dispatchEvent(new Event('visibilitychange')); }; });
    await page.waitForTimeout(300);
    const savedAtHide = await ev(() => JSON.parse(localStorage.getItem(G.SAVE_KEY)).saved);
    await ev(() => window.__show());
    await page.waitForTimeout(500); const mid = await ev(() => G.M.away); if (mid) await shot('espera-aba');
    await waitAway(60000); await page.waitForSelector('#modal.on', { timeout: 15000 }); await page.waitForTimeout(400);
    const r = await ev(() => ({ day: G.S.day, txt: document.querySelector('#modal').innerText, saved: JSON.parse(localStorage.getItem(G.SAVE_KEY)).saved, now: Date.now() }));
    assert(/Aurora não parou/.test(r.txt) && r.day - d0 >= 10, 'sem resumo ou sem avanço: dias ' + (r.day - d0));
    assert(r.now - r.saved < 8000 && r.saved >= savedAtHide, 'S.saved não foi regravado depois do avanço (' + (r.now - r.saved) + ' ms)');
    await shot('resumo-aba'); await page.tap('#modal [data-a="mclose"]'); await page.waitForTimeout(300);
  });
  /* save REAL da v26: joga alguns segundos no aurora-v26.html (mesmo origin file://, mesmo localStorage) e abre o save na v27, já com 30 min de ausência */
  const V26 = path.join(path.dirname(FILE), 'aurora-v26.html');
  if (fs.existsSync(V26)) await step('save real da v26 (jogado de verdade no aurora-v26.html) carrega na v27 e simula a ausência', async () => {
    await page.goto('file://' + V26); await page.waitForSelector('#title.on', { timeout: 30000 });
    await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForSelector('#title.on');
    await page.tap('[data-a="t-new"]'); await page.waitForSelector('#modal.on .rosa'); await page.tap('[data-a="tskip"]'); await page.waitForTimeout(300);
    await ev(() => { G.S.speed = 3; }); await page.waitForTimeout(7000);
    const v26 = await ev(() => { G.M.save(); const s = JSON.parse(localStorage.getItem(G.SAVE_KEY)); s.saved = Date.now() - 1800 * 1000; localStorage.setItem(G.SAVE_KEY, JSON.stringify(s)); G.M.save = () => false; return { ver: G.VERSION, day: s.day, lenharia: (s.b.lenharia || {}).lvl || 0, pedreira: (s.b.pedreira || {}).lvl || 0, until: s.ev.until, kills: s.stats.kills }; });
    assert(v26.ver === '26.0' && v26.lenharia === 0 && v26.pedreira === 0 && v26.until === undefined, 'não é um save puro da v26: ' + JSON.stringify(v26));
    await open(); await startContinue(); await waitAway(30000);
    await page.waitForSelector('#modal.on', { timeout: 15000 }); await page.waitForTimeout(500);
    const r = await ev(() => ({ ver: G.VERSION, run: G.M.running, l: G.bLvl('lenharia'), p: G.bLvl('pedreira'), day: G.S.day, kills: G.S.stats.kills, txt: document.querySelector('#modal').innerText.slice(0, 60) }));
    assert(r.ver === '27.0' && r.run && r.l === 1 && r.p === 1 && r.kills > v26.kills && r.day > v26.day && /Aurora não parou/.test(r.txt), 'migração do save real falhou: ' + JSON.stringify(r) + ' / v26: ' + JSON.stringify(v26));
    await shot('save-v26-migrado'); await page.tap('#modal [data-a="mclose"]'); await page.waitForTimeout(300);
    console.log('         save v26: dia ' + v26.day + ', ' + v26.kills + ' abates -> dia ' + r.day + ', ' + r.kills + ' abates, lenharia ' + r.l + ', pedreira ' + r.p);
  });
  await step('save antigo (sem campos da v27, lenharia/pedreira no 0) carrega e funciona', async () => {
    await ev(() => {
      G.M.save(); const k = G.SAVE_KEY, s = JSON.parse(localStorage.getItem(k));
      delete s.ev.until; delete s.ev.at; delete s.b.lenharia; s.b.pedreira = { lvl: 0 }; delete s.sys; delete s.ret; delete s.tut.seen.v27;
      s.ev.pending = 'festival'; s.saved = Date.now() - 20000; localStorage.setItem(k, JSON.stringify(s)); G.M.save = () => false;
    });
    await open(); await startContinue(); await page.waitForTimeout(1500);
    const r = await ev(() => ({ run: G.M.running, l: G.bLvl('lenharia'), p: G.bLvl('pedreira'), pend: G.S.ev.pending, until: G.S.ev.until, left: G.eventLeft(), npcs: G.npcs.filter((n) => n.name === 'Nuno' || n.name === 'Pedro').length }));
    assert(r.run && r.l === 1 && r.p === 1 && r.npcs === 2, 'migração falhou: ' + JSON.stringify(r));
    assert(r.pend === 'festival' && r.until > 0 && r.left > 0, 'o evento pendente do save antigo não ganhou prazo: ' + JSON.stringify(r));
    await page.waitForTimeout(3000); await shot('save-antigo');
    assert(await ev(() => G.S.t > 3), 'o jogo não andou');
  });

  await browser.close();
  const bad = results.filter((r) => !r.ok), ne = errs.length;
  if (ne) { console.log('\nErros de console/página:'); [...new Set(errs)].slice(0, 12).forEach((e) => console.log('  - ' + e.slice(0, 300))); }
  console.log('\n' + (results.length - bad.length) + ' ok, ' + bad.length + ' falhas, ' + ne + ' erros de console/página');
  process.exit(bad.length || ne ? 1 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
