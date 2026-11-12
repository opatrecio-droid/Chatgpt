/* Ajudantes de teste do Aurora: carregar o jogo sem tela (load) e dirigir o Chromium via Playwright (open/watch/mkSave). */
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path');
const FILE = path.join(__dirname, '..', 'aurora.html');
exports.FILE = FILE;
exports.URL = 'file://' + FILE;
exports.load = (file, seed) => {
  const html = fs.readFileSync(file || FILE, 'utf8');
  const m = html.match(/<script>([\s\S]*)<\/script>/);
  let s = (seed || 1) >>> 0; const rnd = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const mathR = Object.create(Math); mathR.random = rnd;
  const errors = [];
  const ctx = { console: { log() {}, warn() {}, error: (...a) => errors.push(a.join(' ')) }, Math: mathR, Date, JSON, setTimeout() {}, clearTimeout() {}, performance: { now: () => 0 } };
  ctx.globalThis = ctx; vm.createContext(ctx);
  vm.runInContext(m[1], ctx, { filename: 'aurora.js' });
  const G = ctx.G; G.W.init && G.W.init(); G.newGame(); G.errors = errors; return G;
};
exports.open = async (w, h, o) => {
  const { chromium } = require('playwright');
  o = o || {};
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: !!o.touch });
  if (o.save) await ctx.addInitScript((s) => { try { localStorage.setItem('aurora.v19.save', s); } catch (e) { /* ok */ } }, o.save);
  if (o.init) await ctx.addInitScript(o.init, o.initArg);   // v28: script que roda antes da página (ex.: trocar Date.now para testar o relógio da semana)
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto(o.url || exports.URL);
  await page.waitForSelector('#title.on', { timeout: 15000 });
  return { browser, page, errs };
};
/* registra as janelas (#modal) que aparecem: [{t (ms), k}] */
exports.watch = async (page) => {
  await page.evaluate(() => {
    window.__w = []; window.__t0 = performance.now();
    let last = '';
    setInterval(() => {
      const m = document.getElementById('modal'); const on = m && m.classList.contains('on');
      const k = on ? ((m.querySelector('.eyebrow') || {}).textContent || '') + ' | ' + ((m.querySelector('h2,h3') || {}).textContent || '') : '';
      if (k !== last) { window.__w.push({ t: Math.round(performance.now() - window.__t0), k: k || '(fechada)' }); last = k; }
    }, 50);
  });
};
exports.windows = (page) => page.evaluate(() => window.__w);
/* save de teste a partir de um JSON gravado pelo simulador (--save=): "saved" recuado no tempo */
exports.mkSave = (file, o) => {
  o = o || {};
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  d.saved = Date.now() - (o.hoursAgo || 0) * 3600e3 - (o.minAgo || 0) * 60e3;
  if (o.tutDone !== false) d.tut.done = true;
  if (o.seen) d.tut.seen = o.seen;
  if (o.mut) o.mut(d);
  return JSON.stringify(d);
};
exports.cont = async (page) => { await page.click('[data-a="t-continue"]'); };
/* v28: relógio falso para testar a semana do Colosso/Arena. Use como { init: L.fakeClock, initArg: { base: new Date(2026, 10, 12, 15).getTime() } }
   e avance com page.evaluate(() => { window.__dt += ms; }). Só Date.now() é trocado (é o que o jogo usa para o relógio da semana). */
exports.fakeClock = (arg) => { const real = Date.now.bind(Date), off = arg.base - real(); window.__dt = 0; Date.now = () => real() + off + window.__dt; };
