#!/usr/bin/env node
/* Medição de desempenho do Aurora no Chromium com CPU limitada (celular modesto). Lote 4-C.3.
   Uso: node ferramentas/perf.js SAVE.json [--file=aurora.html] [--secs=15] [--throttle=4] [--w=360] [--h=640] [--scen=praca,cacada,colosso] [--profile] [--trace] [--lowfx] [--autofx] [--json]
   SAVE.json = save de jogo de meio (ex.: node ferramentas/sim.js --min=120 --quiet --save=/tmp/mid.json).
   Cenários (cada um roda --secs segundos, depois de 4 s de aquecimento):
     praca    noite, câmera na praça (fogueira, moradores, visitante), heróis em volta
     cacada   dia, câmera seguindo um herói que caça fora da cidade, todos os heróis na caçada
     painel   igual à praça, com o painel Reino aberto (o mapa quase não aparece)
     colosso  sábado ao meio-dia, Colosso desperto e todos convocados, câmera sobre o Colosso (muitas partículas)
   Mede: tempo de quadro (rAF), de G.tick, de G.R.frame, de UI.refresh e de M.save por quadro; com --profile imprime as funções que mais pesam. */
'use strict';
const path = require('path');
const L = require('./teste-lib.js');
const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find((x) => x.startsWith('--' + k + '=')); return a ? a.slice(a.indexOf('=') + 1) : d; };
const SAVE = args.find((a) => !a.startsWith('--'));
if (!SAVE) { console.error('uso: perf.js SAVE.json [opções]'); process.exit(2); }
const FILE = path.resolve(opt('file', L.FILE));
const SECS = +opt('secs', 15), RATE = +opt('throttle', 4), W = +opt('w', 360), H = +opt('h', 640);
const SCEN = opt('scen', 'praca,cacada,colosso,painel').split(',');
const PROFILE = args.includes('--profile'), LOWFX = args.includes('--lowfx'), JSONOUT = args.includes('--json'), AUTOFX = args.includes('--autofx'), TRACE = args.includes('--trace'), EVAL = opt('eval', '');   // --eval="js": roda na página antes de medir (experimentos A/B)

const SATURDAY = new Date(2026, 10, 14, 12).getTime();

const setup = {
  praca: () => { G.S.clock = 21 * 60; G.S.paused = false; G.S.speed = 1; G.R.follow = 0; G.R.focus(44, 55, true); },
  cacada: () => {
    G.S.clock = 10 * 60; G.S.paused = false; G.S.speed = 1;
    const h = G.S.heroes.find((x) => x.state === 'hunt') || G.S.heroes[0]; G.R.follow = h.id;
  },
  painel: () => { G.S.clock = 21 * 60; G.S.paused = false; G.S.speed = 1; G.R.follow = 0; G.R.focus(44, 55, true); G.UI.open('reino', 'obras'); },
  colosso: () => {
    G.S.paused = false; G.S.speed = 1; G.S.clock = 12 * 60;
    if (G.colossoCall) G.colossoCall(1);
    G.R.follow = 0;
  },
};

(async () => {
  const save = L.mkSave(SAVE, { minAgo: 0 });
  const out = {};
  for (const sc of SCEN) {
    const { browser, page, errs } = await L.open(W, H, { save, url: 'file://' + FILE, init: L.fakeClock, initArg: { base: SATURDAY } });
    const cdp = await page.context().newCDPSession(page);
    await page.click('[data-a="t-continue"]');
    await page.waitForTimeout(1500);
    await page.evaluate(() => { G.UI.queueModal = () => {}; if (G.UI.modalOpen) G.UI.closeModal(); G.M.modalPause = false; G.S.tut.done = true; });
    for (let i = 0; i < 10; i++) { await page.waitForTimeout(700); const open = await page.evaluate(() => { const o = G.UI.modalOpen; if (o) G.UI.closeModal(); G.M.modalPause = false; return o; }); if (!open && i > 2) break; }
    await page.evaluate(`(${setup[sc].toString()})()`);
    if (!AUTOFX) await page.evaluate(() => { G.S.opts.lowNo = 1; });   // v26: sem o Modo leve automático (ele mudaria o que está sendo medido)
    if (LOWFX) await page.evaluate(() => { G.S.opts.lowFx = 1; });
    if (EVAL) await page.evaluate(EVAL);
    if (sc === 'colosso') await page.waitForTimeout(500);
    /* ganchos de medição */
    await page.evaluate(() => {
      const P = (window.__perf = { f: [], tick: 0, nt: 0, frame: 0, ref: 0, refN: 0, refMax: 0, save: 0, saveMax: 0, tmax: 0, fmax: 0, on: false });
      const now = () => performance.now();
      const t0 = G.tick; G.tick = (dt) => { const a = now(); t0(dt); if (P.on) { const d = now() - a; P.tick += d; P.nt++; if (d > P.tmax) P.tmax = d; } };
      const f0 = G.R.frame; G.R.frame = (dt) => { const a = now(); f0(dt); if (P.on) { const d = now() - a; P.frame += d; if (d > P.fmax) P.fmax = d; } };
      const r0 = G.UI.refresh; G.UI.refresh = () => { const a = now(); r0(); if (P.on) { const d = now() - a; P.ref += d; P.refN++; if (d > P.refMax) P.refMax = d; } };
      const s0 = G.M.save; G.M.save = () => { const a = now(); const r = s0(); if (P.on) { const d = now() - a; P.save += d; if (d > P.saveMax) P.saveMax = d; } return r; };
      let last = 0; const loop = (t) => { requestAnimationFrame(loop); if (last && P.on) P.f.push(t - last); last = t; }; requestAnimationFrame(loop);
    });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
    await page.waitForTimeout(4000);
    if (PROFILE) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 400 }); await cdp.send('Profiler.start'); }
    const traceEvents = [];
    if (TRACE) { cdp.on('Tracing.dataCollected', (d) => { for (const e of d.value) traceEvents.push(e); }); await cdp.send('Tracing.start', { traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'cc', 'gpu', 'viz'] }, transferMode: 'ReportEvents' }); }
    await page.evaluate(() => { window.__perf.on = true; });
    await page.waitForTimeout(SECS * 1000);
    if (TRACE) { const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r)); await cdp.send('Tracing.end'); await done; }
    const m = await page.evaluate(() => {
      const P = window.__perf; P.on = false; const f = P.f.slice().sort((a, b) => a - b), n = f.length;
      const q = (p) => (n ? f[Math.min(n - 1, Math.floor(p * n))] : 0);
      const parts = G.R.parts.length, fxs = G.R.fxs.length, mons = G.mons.length, heroes = G.S.heroes.length;
      return { frames: n, avg: n ? f.reduce((a, b) => a + b, 0) / n : 0, p50: q(0.5), p95: q(0.95), p99: q(0.99), max: n ? f[n - 1] : 0, over33: f.filter((x) => x > 33.4).length,
        tickPerFrame: n ? P.tick / n : 0, tickCalls: P.nt, tickAvg: P.nt ? P.tick / P.nt : 0, tickMax: P.tmax, frameAvg: n ? P.frame / n : 0, frameMax: P.fmax, refAvg: P.ref / Math.max(1, P.refN), refN: P.refN, refMax: P.refMax, saveMax: P.saveMax, parts, fxs, mons, heroes,
        states: G.S.heroes.reduce((o, h) => { o[h.state] = (o[h.state] || 0) + 1; return o; }, {}), scenes: G.scenesInfo ? G.scenesInfo() : null, colosso: G.colossoLive ? !!G.colossoLive() : null, lowFx: G.S.opts.lowFx };
    });
    if (PROFILE) {
      const { profile } = await cdp.send('Profiler.stop');
      const self = new Map(); const dt = profile.timeDeltas; const byId = new Map(profile.nodes.map((n) => [n.id, n]));
      const tot = {}; for (let i = 0; i < profile.samples.length; i++) tot[profile.samples[i]] = (tot[profile.samples[i]] || 0) + (dt[i] || 0);
      let all = 0;
      for (const id in tot) { const n = byId.get(+id), cf = n.callFrame, key = (cf.functionName || '(anon)') + ' @' + (cf.url.endsWith('aurora.html') ? 'L' + (cf.lineNumber + 1) : cf.url.slice(-20)) + ':' + cf.columnNumber; self.set(key, (self.get(key) || 0) + tot[id]); all += tot[id]; }
      m.profile = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 22).map(([k, v]) => [k, +(v / 1000).toFixed(0) + ' ms', +(100 * v / all).toFixed(1) + '%']);
    }
    if (TRACE) {
      const by = {}; for (const e of traceEvents) { if (e.ph !== 'X' || !e.dur) continue; const k = (e.tid + '').slice(-3) + ' ' + e.name; by[k] = (by[k] || 0) + e.dur; }
      m.trace = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 26).map(([k, v]) => [k, +(v / 1000).toFixed(0)]);
    }
    m.errs = errs;
    out[sc] = m;
    await browser.close();
  }
  if (JSONOUT) { console.log(JSON.stringify(out)); return; }
  console.log('Aurora perf · ' + path.basename(FILE) + ' · ' + W + 'x' + H + ' · CPU ' + RATE + 'x · ' + SECS + ' s por cenário' + (LOWFX ? ' · lowFx' : ''));
  for (const sc of SCEN) {
    const m = out[sc], f = (x) => x.toFixed(1);
    console.log('\n[' + sc + '] quadros ' + m.frames + ' (' + (m.frames / SECS).toFixed(0) + ' fps) · quadro médio ' + f(m.avg) + ' ms · p50 ' + f(m.p50) + ' · p95 ' + f(m.p95) + ' · p99 ' + f(m.p99) + ' · máx ' + f(m.max) + ' · quadros > 33 ms: ' + m.over33);
    console.log('  G.tick por quadro ' + f(m.tickPerFrame) + ' ms (' + m.tickCalls + ' chamadas, máx ' + f(m.tickMax) + ') · R.frame ' + f(m.frameAvg) + ' ms (máx ' + f(m.frameMax) + ') · UI.refresh ' + f(m.refAvg) + ' ms por chamada (' + m.refN + ' chamadas, máx ' + f(m.refMax) + ') · save máx ' + f(m.saveMax) + ' ms');
    console.log('  partículas ' + m.parts + ' · efeitos ' + m.fxs + ' · monstros ' + m.mons + ' · heróis ' + m.heroes + ' ' + JSON.stringify(m.states) + ' · cenas ' + JSON.stringify(m.scenes) + ' · colosso ' + m.colosso + ' · lowFx ' + m.lowFx + (m.errs.length ? ' · ERROS ' + JSON.stringify(m.errs) : ''));
    if (m.trace) for (const [k, ms] of m.trace) console.log('    trace ' + String(ms).padStart(7) + ' ms  ' + k);
    if (m.profile) for (const [k, ms, p] of m.profile) console.log('    ' + p.padStart(6) + ' ' + ms.padStart(8) + '  ' + k);
  }
})();
