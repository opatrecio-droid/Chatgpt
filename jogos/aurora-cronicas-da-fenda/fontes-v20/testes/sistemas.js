// Testes dos sistemas da v20 (sem tela)
const fs = require('fs'), vm = require('vm'), assert = require('assert');
let a = 5; Math.random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
vm.runInThisContext(fs.readFileSync(process.argv[2], 'utf8'));
const G = globalThis.G; G.DEBUG = 1; const errs = []; const ce = console.error; console.error = (...x) => errs.push(x.map(String).join(' '));
const ok = (c, m) => { if (!c) { console.log('FALHOU:', m); process.exitCode = 1; } else console.log('ok  ', m); };
G.W.init();

/* ---- 1. migração de save da v19 ---- */
G.S = G.deserialize(fs.readFileSync(process.argv[3], 'utf8')); G.afterLoad();
let S = G.S;
ok(S.decor && S.stable && Array.isArray(S.stable.list) && S.mascate.offers.length === 4, 'save v19: campos novos criados e mascate sorteado');
ok(S.heroes.every((h) => G.SLOT_IDS.every((s) => s in h.gear) && Array.isArray(h.sk) && h.arts && h.ap >= 0 && h.wake === 0), 'save v19: heróis migrados (8 slots, artes, despertar)');
ok(S.heroes[0].ap === 34 + 9, 'save v19: pontos de Arte retroativos (nível 35, rank B) = ' + S.heroes[0].ap);
ok(S.heroes[1].ap >= 115, 'save v19: renascido recebe bônus de pontos = ' + S.heroes[1].ap);
for (let t = 0; t < 600; t += 0.05) G.tick(0.05);
ok(errs.length === 0, 'save v19: 2 dias de jogo sem erro (' + errs.length + ')');
const rt = G.deserialize(G.serialize()); ok(rt.heroes.length === S.heroes.length && rt.stable && rt.decor, 'serializa e recarrega');

/* ---- 2. jogo novo com recursos fartos ---- */
G.newGame(); S = G.S;
S.gold = 1e9; S.selos = 500; S.nucleos = 500; S.realm.lvl = 30;
for (const k in G.RES) S.res[k] = 100000;
for (const id of G.BLD_IDS) S.b[id] = { lvl: 10 };
G.dirtyAll(); G.syncNpcs();
ok(G.npcs.some((n) => n.name === 'Tomé'), 'Tomé, o tratador, mora na cidade');
ok(G.W.plots.estabulo && G.W.walkable(58.5, 39.5) && !G.W.walkable(57, 36), 'lote do Estábulo: porta livre, base bloqueada');
ok(G.W.path(44, 54, G.W.door('estabulo')[0], G.W.door('estabulo')[1]).length > 0, 'há caminho da praça ao Estábulo');

/* um herói de cada classe */
S.heroes.length = 0;
for (const c of G.CLASS_IDS) for (let i = 0; i < 4; i++) { const h = G.makeHero({ cls: c, lvl: 45, rar: 2 }); h.rank = 4; h._dirty = true; S.heroes.push(h); }
/* vocações: cada um dos 4 de cada classe segue um destino diferente */
let jobsOk = true;
for (const c of G.CLASS_IDS) {
  const hs = S.heroes.filter((h) => h.cls === c), t3 = G.jobBranches(c, 3);
  assert(t3.length === 4, 'classe ' + c + ' tem 4 destinos');
  hs.forEach((h, i) => { const j3 = t3[i], j2 = G.JOBS[j3].from; const b = G.heroStats(h).atk; if (!G.changeJob(h, j2) || !G.changeJob(h, j3)) jobsOk = false; if (G.heroTitle(h) !== G.JOBS[j3].name) jobsOk = false; void b; });
}
ok(jobsOk && S.stats.jobs === 48, 'as 36 vocações: 24 heróis mudaram de classe duas vezes (' + S.stats.jobs + ')');
const h0 = S.heroes[0];
ok(!G.changeJob(h0, G.jobBranches(h0.cls, 3)[1]), 'não dá para trocar de ramo sem redefinir');
const before = h0.j3; ok(G.jobReset(h0) && !h0.j2 && !h0.j3, 'redefinir vocação por Selos'); G.changeJob(h0, G.JOBS[before].from); G.changeJob(h0, before);
/* habilidades */
ok(G.skillUp(h0, 0) && G.skillUp(h0, 1) && G.skillUp(h0, 2) && G.skillLvl(h0, 2) === 2 && G.skillPow(h0, 2) > 1, 'treino de habilidades com Tomos');
/* artes */
const st0 = G.heroStats(h0).atk; h0.ap = 260;
ok(G.artAdd(h0, 'forca', 500) === 100 && G.artLvl(h0, 'forca') === 100 && G.heroStats(h0).atk > st0 * 1.15, 'Arte da Força até 100 (+40% do ataque-base): ' + Math.round(st0) + ' → ' + Math.round(G.heroStats(h0).atk));
const n = G.artAuto(h0); ok(n === 160 && h0.ap === 0, 'distribuição automática gastou ' + n);
ok(G.artReset(h0) && h0.ap === 260 && G.artSpent(h0) === 0, 'redistribuir devolve os pontos');
ok(G.artBuy(h0) && h0.ap === 261, 'meditar compra 1 ponto');
/* despertar */
const hp0 = G.heroStats(h0).hp; let wk = 0; h0.rank = 7; h0._dirty = true; const hp1 = G.heroStats(h0).hp;
while (G.wake(h0)) wk++;
ok(wk === 4 && h0.wake === 4 && G.heroStats(h0).hp > hp1 * 1.15 && G.potCap(h0) >= 5, 'Despertar 4/4: vida ' + hp1 + ' → ' + G.heroStats(h0).hp);
h0.hp = 1; const fell = G.heroFall(h0, null); ok(fell === false && h0.hp > 1 && h0.state !== 'fallen', 'Transcendência segura a primeira queda do dia'); h0.hp = G.heroStats(h0).hp;
h0.rank = 4; h0._dirty = true; void hp0;
/* montarias */
let tamed = 0; for (const k of G.MOUNT_IDS) if (G.tame(k)) tamed++;
ok(tamed === 6 && S.stable.list.length === 6, 'as 6 espécies foram domadas');
const mt = S.stable.list[5], sp0 = G.heroStats(h0).spd, bag0 = G.bagCap(h0);
G.mountAssign(mt, h0); ok(G.mountOf(h0) === mt && G.heroStats(h0).spd > sp0 * 1.25 && G.bagCap(h0) === bag0 + 8, 'Draco: mais velocidade e +8 de bolsa');
const used = G.mountFeed(mt, 10000); ok(mt.lvl === 10 && used === 216, 'ração leva a montaria ao nível 10 (' + used + ')');
G.mountAssign(S.stable.list[0], h0); ok(h0.mount === S.stable.list[0].id && mt.hero === 0, 'trocar de montaria libera a anterior');
S.res.racao = 0; G.dayHooks(); ok(S.stable.hungry === 1, 'sem ração: montarias com fome'); S.res.racao = 50; G.dayHooks(); ok(S.stable.hungry === 0 && S.res.racao === 49, 'com ração: 1 por montaria em uso');
/* decoração */
let dec = 0; for (const d of G.DECOR) while (G.buyDecor(d.id)) dec++;
ok(dec === 30 && G.charm() === G.DECOR.reduce((s, d) => s + d.charm * 3, 0), 'decoração completa: 10 enfeites × 3 níveis, Encanto ' + G.charm());
ok(!G.W.walkable(38.5, 51.5) && G.W.walkable(44, 47.5), 'estátua bloqueia o ladrilho; arco não bloqueia');
ok(G.W.path(40, 46.5, 48, 46.5).length > 0 && G.W.path(44, 42, 44, 66).length > 0, 'ruas continuam transitáveis com os enfeites');
/* armazém */
S.inv.length = 0; let made = 0; for (const t of G.GEAR_IDS) { if (G.craft(t, 3, true, true)) made++; }
ok(made === G.GEAR_IDS.length, 'forja produz os 15 tipos de peça (' + made + ')');
const it = S.inv[0]; G.toggleLock(it); ok(!G.dismantle(it), 'peça reservada não é desmontada'); G.toggleLock(it);
const y = G.dismantle(S.inv[1]); ok(y && Object.keys(y).length >= 2, 'desmonte devolve material: ' + JSON.stringify(y));
while (S.inv.length < G.invCap()) S.inv.push({ id: G.uid(), type: 'espada', tier: 1, rar: 0, plus: 0, forSale: true });
ok(!G.canCraft('espada', 1, false).ok && /cheio/.test(G.canCraft('espada', 1, false).why), 'armazém cheio bloqueia a forja');
const da = G.dismantleAll(0); ok(da.n > 50 && S.inv.every((i) => i.rar !== 0 || i.lock), 'desmontar tudo (Comum): ' + da.n + ' peças');
/* cura, ordens, mascate */
h0.hp = 10; const hc = G.healCost(h0); ok(hc > 0 && G.healNow(h0) && h0.hp === G.heroStats(h0).hp, 'cura paga: ' + hc + ' moedas');
G.orderAll('bosque'); ok(S.heroes.every((h) => h.order === 'bosque'), 'ordem em massa'); G.orderAll('auto');
ok(G.mascateBuy(0) && S.mascate.offers[0].sold === 1 && !G.mascateBuy(0), 'mascate vende uma vez cada oferta');
ok(['padrao', 'nivel', 'poder', 'estado'].every((k) => { S.opts.hsort = k; return G.sortedHeroes().length === S.heroes.length; }), 'ordenações de caçadores');

/* ---- 3. combate com todas as vocações: 6 dias de jogo ---- */
const use = {}; const jst = G.jobSkillTry;
G.jobSkillTry = (h, m, mons, frac) => { const b2 = h.tS2, b3 = h.tS3; const r = jst(h, m, mons, frac); if (r) { const id = h.tS2 !== b2 && h.tS2 > b2 ? h.j2 : h.j3; use[id] = (use[id] || 0) + 1; } return r; };
for (const z of G.ZONES) { S.zones[z.id].tier = 2; S.zones[z.id].maxTier = 2; }
S.heroes.forEach((h, i) => { h.order = G.ZONES[i % 4].id; h.state = 'town'; });
errs.length = 0; let maxHeroes = S.heroes.length;
for (let t = 0; t < 6 * G.DAY_SEC; t += 0.05) G.tick(0.05);
const unused = G.JOB_IDS.filter((j) => !use[j]);
ok(errs.length === 0, '6 dias com 24 heróis de vocação: sem erros (' + errs.slice(0, 3).join(' / ') + ')');
ok(unused.length === 0, 'todas as 36 habilidades de vocação foram usadas em combate' + (unused.length ? ' — faltou: ' + unused.join(',') : ''));
ok(S.heroes.length === maxHeroes && S.stats.kills > 3000, 'abates: ' + S.stats.kills + ' · quedas: ' + S.stats.falls + ' · chefes: ' + S.stats.bosses);
ok(S.heroes.every((h) => isFinite(h.hp) && isFinite(G.heroStats(h).atk) && h.hp <= G.heroStats(h).hp + 1), 'atributos finitos e vida dentro do máximo');
const filled = S.heroes.map((h) => Object.values(h.gear).filter(Boolean).length); ok(Math.min(...filled) >= 3 && Math.max(...filled) >= 7, 'heróis compraram peças novas sozinhos (mín ' + Math.min(...filled) + ', máx ' + Math.max(...filled) + ' de 8)');
console.error = ce;
console.log('usos:', Object.keys(use).map((k) => k + ':' + use[k]).join(' '));
