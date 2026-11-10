/* Autoteste rápido dos caminhos de fim de jogo e de salvar/carregar (sem tela). */
const fs = require('fs'), path = require('path'), vm = require('vm');
const SRC = path.join(__dirname, '..', 'src');
const ctx = vm.createContext({ console, Math, Date, JSON, Object, Array, Set, Map, Uint8Array, Int8Array, Float32Array, Int32Array, Uint32Array, Number, String, isFinite, parseInt });
for (const f of ['00-core.js', '10-data.js', '20-world.js', '30-heroes.js', '31-monsters.js', '32-town.js', '33-meta.js']) vm.runInContext(fs.readFileSync(path.join(SRC, f), 'utf8'), ctx, { filename: f });
const G = ctx.G; G.W.init(); G.newGame(); let S = G.S;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FALHA') + ' ' + m); if (!c) process.exitCode = 1; };
for (let i = 0; i < 3000; i++) G.tick(0.1);
// salvar / carregar
const raw = G.serialize(); G.S = G.deserialize(raw); G.afterLoad(); S = G.S;
for (let i = 0; i < 3000; i++) G.tick(0.1);
ok(S.heroes.length === 3 && S.stats.kills > 0, 'salvar/carregar e continuar (' + S.stats.kills + ' abates)');
// fim de jogo: tudo liberado
S.realm.lvl = 40; S.gold = 1e12; S.selos = 500; S.nucleos = 500;
for (const k in G.RES) S.res[k] = 1e6;
for (const id of G.BLD_IDS) { if (!S.b[id]) S.b[id] = { lvl: 0 }; S.b[id].lvl = 20; }
G.dirtyAll();
const h = S.heroes[0];
for (let r = 0; r < 7; r++) { h.lvl = G.RANK_CAP[h.rank]; h._dirty = true; ok(G.promote(h), 'promoção para ' + G.RANKS[h.rank]); }
h.lvl = 80; ok(G.canRebirth(h) && G.rebirth(h) && h.stars === 1 && h.lvl === 1, 'renascimento');
ok(G.forgeMaxTier() >= 9, 'forja alcança tiers Ascendentes (' + G.forgeMaxTier() + ')');
const it = G.craft('espada', 8, true); ok(it && it.rar >= 2, 'obra-prima Ascendente: ' + (it && G.itemName(it) + ' ' + G.RAR[it.rar]));
let up = 0; for (let i = 0; i < 200 && it.plus < 15; i++) { const r = G.upgradeItem(it); if (r.ok && r.win) up++; } ok(it.plus === 15, 'aprimoramento até +15');
for (const z of G.ZONES) { S.zones[z.id].tier = 30; S.zones[z.id].maxTier = 30; }
for (const m of G.mons) m.gone = true;
for (const x of S.heroes) { x.lvl = 80; x.rank = 7; x._dirty = true; for (const [slot, type] of [['arma', G.CLASSES[x.cls].w], ['armadura', G.CLASSES[x.cls].a], ['acessorio', 'anel']]) x.gear[slot] = { id: G.uid(), type, tier: 9, rar: 4, plus: 10 }; x.hp = G.heroStats(x).hp; }
const k0 = S.stats.kills; for (let i = 0; i < 6000; i++) G.tick(0.1);
ok(S.stats.kills > k0, 'caçada em corrupção 30 (' + (S.stats.kills - k0) + ' abates, eff ' + S.heroes.map((x) => G.heroStats(x).eff).join('/') + ', zonas nv ' + G.ZONES.map((z) => G.zoneLvl(z, 30)).join('/') + ')');
G.mareStart(); for (let i = 0; i < 2500; i++) G.tick(0.1); ok(!S.mare.active, 'Maré termina (vitórias ' + S.mare.wins + ', derrotas ' + S.mare.losses + ')');
ok(G.riftStart(S.heroes.map((x) => x.id)), 'Fenda inicia'); for (let i = 0; i < 3000; i++) G.tick(0.1); ok(!S.rift.run, 'Fenda termina (recorde ' + S.rift.best + ')');
for (const w of G.WORKS) ok(G.buyWork(w.id), 'obra pública ' + w.id);
for (const b of G.BLESS) ok(G.buyBless(b.id), 'bênção ' + b.id);
for (const d of G.DECREES) ok(G.useDecree(d.id), 'decreto ' + d.id);
S.rep.hist.push({ d: 1, i: 1000, o: 200, k: 100, f: 1, x: 5000, m: 80 }); const off = G.offline(3600); ok(off && off.gold > 0, 'progresso offline: ' + JSON.stringify(off));
for (let d = 0; d < 12; d++) { S.ev.next = S.day; S.ev.pending = null; G.eventRoll(); } ok(true, 'eventos aleatórios');
const raw2 = G.serialize(); G.S = G.deserialize(raw2); G.afterLoad(); for (let i = 0; i < 500; i++) G.tick(0.1); ok(true, 'save de fim de jogo (' + Math.round(raw2.length / 1024) + ' KB)');
let bad = 0; for (const x of G.S.heroes) for (const k of ['hp', 'x', 'y', 'gold', 'xp']) if (!isFinite(x[k])) bad++; ok(!bad && isFinite(G.S.gold), 'sem NaN no estado');
