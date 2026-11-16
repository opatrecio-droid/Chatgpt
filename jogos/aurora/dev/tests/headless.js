/* Motor sem tela: carrega todos os <script> do HTML num contexto isolado do Node.
   Uso: const { load } = require('./headless'); const G = load(caminhoDoHtml); */
'use strict';
const fs = require('fs');
const vm = require('vm');

exports.scripts = (html) => {
  const out = [];
  const re = /<script(?:\s+id="([^"]*)")?[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) out.push({ id: m[1] || 'main', code: m[2] });
  return out;
};

exports.load = (file, opts = {}) => {
  const html = fs.readFileSync(file, 'utf8');
  const sandbox = {
    console, performance, setTimeout, clearTimeout, setInterval, clearInterval,
    Math: Object.create(Math), Date, JSON, Promise,
    Uint8Array, Int8Array, Uint16Array, Int16Array, Uint32Array, Int32Array, Float32Array, Float64Array,
    Map, Set, WeakMap, WeakSet, Symbol, Array, Object, Number, String, Boolean, Error, TypeError, RangeError, RegExp,
    navigator: { userAgent: 'node' },
  };
  sandbox.globalThis = sandbox; sandbox.self = sandbox;
  const ctx = vm.createContext(sandbox);
  const skipped = [];
  for (const s of exports.scripts(html)) {
    try { vm.runInContext(s.code, ctx, { filename: s.id + '.js' }); }
    catch (e) { skipped.push(s.id + ': ' + String(e.message).slice(0, 160)); if (opts.strict) throw e; }
  }
  const G = sandbox.G;
  G._skipped = skipped;
  G._sandbox = sandbox;
  return G;
};

/* Começa um reino novo com semente fixa. */
exports.start = (G, seed = 271, diff = 1) => {
  G.rng = G.seeded(seed);
  G._sandbox.Math.random = G.rng;
  G.arenaNow = () => Date.UTC(2026, 10, 12, 12) + (G.S ? G.S.t / G.DAY_SEC : 0) * 86400000;
  G.W.init();
  G.newGame();
  G.S.diff = diff; G.S.tut.done = true; G.S.paused = false;
  return G.S;
};

/* O robô do jogo não usa o Posto Comercial. Um jogador atento pede ali o material de promoção
   (Emblema da zona) quando um herói chega ao teto do rank; sem isso ninguém passa do nível 10. */
exports.proxy = (G) => {
  const S = G.S, want = {};
  for (const h of S.heroes) { const q = G.promoReq(h); if (!q || h.lvl < q.lvl) continue; for (const k in q.cost) want[k] = (want[k] || 0) + q.cost[k]; }
  for (const k in want) { const lack = want[k] - Math.floor(S.res[k] || 0); if (lack > 0 && !G.tradeOrder(k)) G.tradeSet(k, lack); }
};

/* Avança `seconds` de jogo; `bot` faz as ações públicas do jogador a cada 2 s. */
exports.run = (G, seconds, bot = true, each) => {
  const n = Math.round(seconds * 30), actions = G._actions || (G._actions = {});
  for (let i = 0; i < n; i++) {
    if (bot && i % 60 === 0) { exports.proxy(G); G.debugAct(actions); }
    G.tick(1 / 30);
    if (each && i % 30 === 0) each(G.S);
  }
};
