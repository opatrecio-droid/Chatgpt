/* Aurora — Crônicas da Fenda · v27 "Reino Sem Pausa"
   00-core: utilitários, barramento de eventos, relógio e estado. Sem DOM. */
'use strict';
var G = (typeof globalThis !== 'undefined' ? globalThis : window).G = {};
G.VERSION = '27.0';
G.BUILD = 'Aurora_ciclo_038_reino_sem_pausa';
G.SAVE_KEY = 'aurora.v19.save';
G.HEADLESS = typeof document === 'undefined';

/* ---------- utilitários ---------- */
G.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
G.lerp = (a, b, t) => a + (b - a) * t;
G.rnd = (a, b) => a + Math.random() * (b - a);
G.ri = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
G.chance = (p) => Math.random() < p;
G.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
G.dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
G.dist2 = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
G.shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
G.wpick = (pairs) => { // [[item, peso], ...]
  let tot = 0; for (const p of pairs) tot += p[1];
  let r = Math.random() * tot;
  for (const p of pairs) { r -= p[1]; if (r <= 0) return p[0]; }
  return pairs[pairs.length - 1][0];
};
/* RNG determinístico para geração do mapa e da arte (mesma cidade em todo aparelho). */
G.seeded = (seed) => { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
G.hash = (s) => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

G.fmt = (n) => {
  n = Math.floor(n || 0);
  const a = Math.abs(n);
  if (a < 10000) return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (a < 1e6) return (n / 1e3).toFixed(a < 1e5 ? 1 : 0).replace('.', ',') + 'k';
  if (a < 1e9) return (n / 1e6).toFixed(a < 1e7 ? 2 : 1).replace('.', ',') + 'M';
  if (a < 1e12) return (n / 1e9).toFixed(2).replace('.', ',') + 'B';
  return (n / 1e12).toFixed(2).replace('.', ',') + 'T';
};
G.pct = (v) => Math.round(v * 100) + '%';
G.roman = (n) => { const r = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let s = ''; for (const [v, t] of r) while (n >= v) { s += t; n -= v; } return s || '0'; };

/* ---------- eventos ---------- */
G._ls = {};
G.on = (ev, fn) => { (G._ls[ev] || (G._ls[ev] = [])).push(fn); };
/* v27 (A1): G.OFFLINE = o tempo ausente está sendo simulado (3J-ausencia). Nesse modo a simulação roda como no Node (sem
   efeitos, sons, avisos nem balões) e só os eventos que a própria simulação escuta chegam aos ouvintes; o resto é contado em
   G._offEv e a interface se atualiza uma vez no fim. Assim nada de janela, aviso ou partícula se acumula durante o avanço. */
G.OFFLINE = false;
G._offEv = null;
G.SIM_EVENTS = { gold: 1, duelo: 1, arena: 1, inv: 1, start: 1 };   // ouvintes de simulação (33-meta, 3A, 3B, 3F, 3G, 3D)
G.emit = (ev, d) => {
  if (G.OFFLINE && !G.SIM_EVENTS[ev]) { const c = G._offEv; if (c) c[ev] = (c[ev] || 0) + 1; return; }
  const l = G._ls[ev]; if (l) for (let i = 0; i < l.length; i++) { try { l[i](d); } catch (e) { if (G.DEBUG) console.error(ev, e); } }
};

/* Efeitos visuais/sonoros: a simulação só enfileira; o render consome. */
G.fx = [];
G.addFx = (o) => { if (!G.HEADLESS && !G.OFFLINE && G.fx.length < 400) G.fx.push(o); };
G.sfx = (name, x, y) => { if (!G.HEADLESS && !G.OFFLINE) G.emit('sfx', { name, x, y }); };

/* ---------- relógio ---------- */
G.DAY_SEC = 300;                 // segundos reais por dia de jogo em 1×
G.MIN_PER_SEC = 1440 / G.DAY_SEC; // minutos de jogo por segundo real (4,8)
G.WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
G.clockStr = (m) => { m = Math.floor(m) % 1440; const h = Math.floor(m / 60), mm = m % 60; return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm; };
G.isNight = (m) => m >= 1260 || m < 330;            // 21:00–05:30
G.hour = () => G.S.clock / 60;
/* 0 = dia pleno, 1 = noite fechada (com transições suaves de 90 min) */
G.darkness = (m) => {
  const h = (m % 1440) / 60;
  if (h >= 7 && h < 18.5) return 0;
  if (h >= 18.5 && h < 21) return (h - 18.5) / 2.5;
  if (h >= 21 || h < 4.5) return 1;
  return 1 - (h - 4.5) / 2.5;
};

/* ---------- registro (crônica) ---------- */
G.log = (msg, kind) => {
  const S = G.S; if (!S) return;
  S.log.push({ d: S.day, c: Math.floor(S.clock), m: msg, k: kind || 'info' });
  if (S.log.length > 80) S.log.splice(0, S.log.length - 80);
  if (G.OFFLINE && G._offLog) G._offLog(msg, kind || 'info');       // v27 (A1): o resumo do retorno recolhe as linhas notáveis
  G.emit('log', { m: msg, k: kind || 'info' });
};
G.toast = (msg, kind, icon, act) => { if (!G.HEADLESS && !G.OFFLINE) G.emit('toast', { m: msg, k: kind || 'info', icon, act }); };

/* ---------- estado ---------- */
G.S = null;
G.newState = () => ({
  v: 3,
  created: Date.now(), saved: Date.now(),
  t: 0, day: 1, clock: 360, speed: 1, paused: false,
  gold: 350, selos: 0, nucleos: 2,
  res: { madeira: 30, pedra: 16, minerio: 6, trigo: 24, ervas: 10, refeicao: 10, pocao: 5 },
  realm: { lvl: 1, xp: 0 },
  b: {},            // construções: id -> { lvl, dmg, q... }
  heroes: [], inv: [], nextId: 1,
  zones: {},        // id -> { tier, maxTier, gauge, kills, bossKills }
  rift: { floor: 1, best: 0, dayDone: 0, run: null },
  bless: {}, works: {}, bestiary: {}, ach: {}, achSeen: {},
  quest: { step: 0, done: false, decree: null, decreeN: 0 },
  daily: { day: 0, list: [], streak: 0, lastFull: 0, claimed: false },
  mare: { next: 6, ease: 0, wins: 0, losses: 0, active: null, warned: 0 },
  ev: { next: 2, caravan: null, buff: {}, redMoon: 0 },
  decrees: {},      // poderes ativos: id -> pronto em S.t
  stats: { kills: 0, elites: 0, bosses: 0, falls: 0, crafted: 0, goldIn: 0, goldOut: 0, sold: 0, promos: 0, rebirths: 0, contracts: 0, maxLvl: 1, played: 0, recruits: 0, potions: 0, meals: 0, jobs: 0, artes: 0, wakes: 0, mounts: 0, decor: 0, dismantled: 0 },
  decor: {},        // enfeites da cidade: id -> nível
  stable: { list: [], hungry: 0 },   // montarias do Estábulo
  mascate: { day: 0, offers: [] },   // ofertas do comerciante errante
  diff: 1,          // dificuldade do reino (0 Fácil … 3 Pesadelo)
  cos: {},          // guarda-roupa: id -> cópias
  paths: {},        // Caminhos já resgatados
  decorPos: {},     // enfeites movidos: id -> posições
  pets: [],         // mascotes: { id, k, rar, hero, bag, bagN }
  inc: { best: {}, dayDone: 0, wins: 0, run: null, last: null },   // Incursões: maior Grau vencido por zona
  rep: { today: {}, last: null, hist: [] },   // relatório diário
  log: [],
  opts: { sfx: 0.7, music: 0.35, follow: 0, autoSpeed: 1, lowFx: 0, autoForge: 1, autoSell: 1, hsort: 'padrao' },
  tut: { step: 0, done: false, seen: {} },
  cam: null,
});

G.uid = () => G.S.nextId++;

/* Dinheiro: toda entrada e saída passa por aqui para alimentar o relatório do dia. */
G.earn = (n, why) => {
  if (!(n > 0)) return;
  const S = G.S; n = Math.round(n);
  S.gold += n; S.stats.goldIn += n;
  S.rep.today[why] = (S.rep.today[why] || 0) + n;
  G.emit('gold', { n, why });
};
G.spend = (n, why) => {
  const S = G.S; n = Math.round(n);
  if (n <= 0) return true;
  if (S.gold < n) return false;
  S.gold -= n; S.stats.goldOut += n;
  S.rep.today['-' + why] = (S.rep.today['-' + why] || 0) + n;
  G.emit('gold', { n: -n, why });
  return true;
};
G.addRes = (id, n) => { const r = G.S.res; r[id] = Math.max(0, (r[id] || 0) + n); if (n) G.emit('res', { id, n }); };
G.hasRes = (cost) => { const r = G.S.res; for (const k in cost) if ((r[k] || 0) < cost[k]) return false; return true; };
G.payRes = (cost) => { if (!G.hasRes(cost)) return false; for (const k in cost) G.addRes(k, -cost[k]); return true; };

/* ---------- salvar / carregar ---------- */
G.serialize = () => {
  const S = G.S; S.saved = Date.now();
  const heroes = S.heroes.map((h) => {
    const o = {};
    for (const k in h) { if (k[0] === '_' || k === 'path' || k === 'tgt') continue; o[k] = h[k]; }
    return o;
  });
  const out = Object.assign({}, S, { heroes });
  return JSON.stringify(out);
};
G.deserialize = (str) => {
  const d = JSON.parse(str);
  if (!d || typeof d !== 'object' || !d.realm || !Array.isArray(d.heroes)) throw new Error('save inválido');
  const f = G.newState();
  for (const k in f) {
    if (d[k] == null) d[k] = f[k];
    else if (typeof f[k] === 'object' && !Array.isArray(f[k])) for (const k2 in f[k]) if (d[k][k2] == null) d[k][k2] = f[k][k2];
  }
  return d;
};

;
