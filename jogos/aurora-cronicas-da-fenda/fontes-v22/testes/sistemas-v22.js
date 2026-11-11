// Testes dos sistemas da v22 (sem tela): node sistemas-v22.js <core22.js> <save21.json> <save19.json>
const fs = require('fs'), vm = require('vm');
let a = 22; const rng = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
Math.random = rng;
vm.runInThisContext(fs.readFileSync(process.argv[2], 'utf8'));
const G = globalThis.G; G.DEBUG = 1; const errs = []; const ce = console.error; console.error = (...x) => errs.push(x.map(String).join(' '));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FALHOU:', m); process.exitCode = 1; } else console.log('ok  ', m); };
const fixed = (v, fn) => { Math.random = () => v; try { return fn(); } finally { Math.random = rng; } };
const enc = (dt, secs) => { for (let t = 0; t < secs; t += dt) { G.S.t += dt; G.updateEncounters(dt); } };
G.W.init();

/* ---------- 1. saves antigos ---------- */
G.S = G.deserialize(fs.readFileSync(process.argv[3], 'utf8')); G.afterLoad(); let S = G.S;
const by = (k) => S.pets.filter((p) => p.k === k);
ok(S.pets.length === 5 && by('gato').length === 2 && by('raposa').length === 1 && by('draquinho').length === 1 && by('coruja').length === 1, 'save v21: as 5 cópias de mascote viraram 5 indivíduos (' + S.pets.map((p) => p.k).join(', ') + ')');
ok(by('draquinho')[0].rar === 4 && by('raposa')[0].rar === 2 && by('coruja')[0].rar === 1 && by('gato')[0].rar === 0, 'save v21: cada um com a raridade-base da espécie');
ok(G.petOf(S.heroes[0]).k === 'draquinho' && G.petOf(S.heroes[1]).k === 'gato' && G.petOf(S.heroes[2]).k === 'raposa' && G.petOf(S.heroes[0]).hero === S.heroes[0].id, 'save v21: quem vestia continua com o seu mascote');
ok(!Object.keys(S.cos).some((k) => /^p_/.test(k)) && S.cos.t_rubro === 1 && S.heroes.every((h) => !('pet' in h.cos)) && S.heroes[0].cos.traje === 't_rubro', 'save v21: ids de mascote saíram do guarda-roupa; traje continua');
ok(!G.COS_SLOTS.includes('pet') && !G.COS_IDS.some((k) => G.COS[k].slot === 'pet'), 'o guarda-roupa não tem mais espaço de mascote');
const a0 = G.heroStats(S.heroes[0]).atk; S.heroes[0]._dirty = true;
ok(G.heroBonus(S.heroes[0]).crit >= 0.03 * 2.1 - 1e-9, 'save v21: o Draquinho Lendário dá o bônus passivo × 2,1 (crítico +' + (0.03 * 2.1 * 100).toFixed(1) + '%)'); void a0;
G.afterLoad(); ok(G.S.pets.length === 5, 'carregar de novo não duplica os mascotes migrados');
errs.length = 0; for (let t = 0; t < 2 * G.DAY_SEC; t += 0.05) G.tick(0.05);
ok(errs.length === 0, 'save v21: 2 dias de jogo sem erro (' + errs.slice(0, 2).join(' / ') + ')');
G.S = G.deserialize(fs.readFileSync(process.argv[4], 'utf8')); G.afterLoad(); S = G.S;
ok(Array.isArray(S.pets) && S.pets.length === 0 && S.inc && S.inc.best && S.heroes.every((h) => h.pet === 0), 'save v19: campos da v22 criados');
errs.length = 0; for (let t = 0; t < 600; t += 0.05) G.tick(0.05); ok(errs.length === 0, 'save v19: 2 dias sem erro');
G.newGame(); for (let t = 0; t < 200; t += 0.05) G.tick(0.05);
const raw = JSON.parse(G.serialize()); delete raw.pets; delete raw.inc; delete raw.diff; delete raw.cos; delete raw.paths; delete raw.decorPos; for (const h of raw.heroes) { delete h.cos; delete h.autoArt; delete h.pet; }
G.S = G.deserialize(JSON.stringify(raw)); G.afterLoad(); S = G.S;
ok(S.pets.length === 0 && S.inc.dayDone === 0 && S.heroes.every((h) => h.pet === 0 && h.cos), 'save v20: campos da v21 e da v22 criados');

/* ---------- 2. jogo novo, reino farto ---------- */
G.newGame(); S = G.S; S.gold = 1e9; S.selos = 900; S.nucleos = 900; S.realm.lvl = 30; for (const k in G.RES) S.res[k] = 1e4; for (const id of G.BLD_IDS) S.b[id] = { lvl: 10 }; G.dirtyAll();
G.mons.length = 0;
const h = S.heroes[0], h2 = S.heroes[1];
const mon = (k, x, y, o) => { const m = G.makeMon(k, 12, x, y, Object.assign({ zi: 0 }, o || {})); G.mons.push(m); return m; };
/* regra dos 50% */
let m = mon('lobo', 44, 20); h.bag = {}; h.bagN = 0; G.drops.length = 0;
fixed(0.3, () => G.lootGive(h, m, 'couro', 10));
ok(h.bag.couro === 10 && G.drops.length === 1 && G.drops[0].n === 9 && G.drops[0].k === 'couro', 'regra dos 50%: 10 × 1,9 = 19 → 10 na bolsa e 9 no chão (a unidade ímpar é sorteada)');
h.bag = {}; h.bagN = 0; G.drops.length = 0;
fixed(0.75, () => G.lootGive(h, m, 'gosma', 3)); ok(h.bag.gosma === 2 && G.drops[0].n === 3, 'número ímpar: a sobra vai para um dos lados por sorteio (3 × 1,9 → 5: 2 na bolsa, 3 no chão)');
h.bag = {}; h.bagN = 0; G.drops.length = 0;
fixed(0.95, () => G.lootGive(h, m, 'gosma', 1)); ok(h.bagN === 0 && G.drops.length === 1 && G.drops[0].n === 1, '1 unidade: cai inteira no chão quando o sorteio manda (1 × 1,9 → 1)');
h.bag = {}; h.bagN = 0; G.drops.length = 0;
fixed(0.3, () => G.lootGive(h, m, 'gosma', 1)); ok(h.bagN === 1 && G.drops[0].n === 1, '1 unidade com sorteio favorável vira 2: uma para cada lado');
/* itens-chave */
h.bag = {}; h.bagN = 0; G.drops.length = 0;
for (const k of ['emb1', 'tomo', 'alma']) G.lootGive(h, m, k, 2);
ok(h.bag.emb1 === 2 && h.bag.tomo === 2 && h.bag.alma === 2 && G.drops.length === 0, 'itens-chave (emblema, Tomo, Cristal de Alma) vão inteiros para o herói');
/* abates de verdade: metade na bolsa, metade no chão, chefe sem itens-chave no chão */
h.bag = {}; h.bagN = 0; G.drops.length = 0; let bagZ = 0, gndZ = 0;
for (let i = 0; i < 600; i++) { const o = mon(G.pick(['lobo', 'slime', 'javali']), 44, 20, { elite: i % 7 === 0 }); o.hitBy[h.id] = 1; G.killMon(o, h); for (const d of G.drops) gndZ += d.n; G.drops.length = 0; }
for (const k in h.bag) if (G.RES[k].z && !G.RES[k].emb) bagZ += h.bag[k];
ok(Math.abs(bagZ / gndZ - 1) < 0.12, '600 abates: bolsa ' + bagZ + ' × chão ' + gndZ + ' (razão ' + (bagZ / gndZ).toFixed(2) + ')');
h.bag = {}; h.bagN = 0; G.drops.length = 0; const bz = G.makeMon('anciao', 20, 44, 14, { zi: 0 }); bz.hitBy[h.id] = 1; G.mons.push(bz); G.killMon(bz, h);
ok(h.bag.emb1 >= 1 && h.bag.alma === 1 && h.bag.tomo >= 1 && G.drops.length >= 3 && G.drops.every((d) => !G.lootKey(d.k)), 'chefe: emblema, alma e tomo na bolsa; ' + G.drops.length + ' pilhas de material no chão');
/* expiração e teto */
G.drops.length = 0; const d1 = G.dropAdd(44, 20, 'couro', 2, h.id), d2 = G.dropAdd(44, 21, 'couro', 2, h.id); d1.t = S.t - G.DROP_LIFE - 1; d2.t = S.t - G.DROP_LIFE + 20;
G.updateEncounters(1.1); ok(G.drops.length === 1 && G.drops[0] === d2 && d1.n === 0, 'item some depois de ' + G.DROP_LIFE + ' s; o mais novo fica');
G.drops.length = 0; for (let i = 0; i < 300; i++) G.dropAdd(44, 20, 'gosma', 1, 0);
ok(G.drops.length === G.DROP_MAX && G.drops[0].id > 50, 'teto de ' + G.DROP_MAX + ' itens: os mais velhos são descartados');
/* coleta por toque */
G.drops.length = 0; S.daily.list = [{ k: 'mat', m: 'couro', n: 99, p: 0, claimed: false, t: 'x', gold: 1 }];
const t1 = G.dropAdd(44, 20, 'couro', 3), t2 = G.dropAdd(44.6, 20.3, 'couro', 2), t3 = G.dropAdd(44.2, 19.8, 'presa', 1), far = G.dropAdd(50, 20, 'couro', 5);
t2.x = t1.x + 0.6; t2.y = t1.y; t3.x = t1.x - 0.4; t3.y = t1.y + 0.3; far.x = t1.x + 6; far.y = t1.y;
const cr = S.res.couro, pr = S.res.presa, mats0 = S.rep.today.mats || 0, pk0 = S.stats.picked;
const got = G.dropTake(t1);
ok(got.n === 6 && S.res.couro === cr + 5 && S.res.presa === pr + 1 && G.drops.length === 1 && G.drops[0] === far, 'toque: o item e os vizinhos vão para o Armazém (+' + got.n + '); o distante fica');
ok(S.daily.list[0].p === 5 && (S.rep.today.mats || 0) === mats0 + 6 && S.stats.picked === pk0 + 3, 'toque conta para o contrato de material, o relatório do dia e o Caminho (3 pilhas)');
ok(G.dropTake(t1) === null, 'item já recolhido não rende de novo');

/* ---------- 3. mascotes ---------- */
S.pets.length = 0; for (const x of S.heroes) x.pet = 0;
const hunter = (x) => { x.state = 'hunt'; x.inside = null; x.x = 44; x.y = 20; x.tgt = null; x.path = null; x.hp = G.heroStats(x).hp; };
const caps = [], life0 = G.DROP_LIFE; G.DROP_LIFE = 1e4; // aqui o teste é a carga, não a expiração
for (let r = 0; r <= 5; r++) {
  G.drops.length = 0; G.petRt.clear(); hunter(h);
  const p = G.petNew('lobinho', r); G.petAssign(p, h);
  for (let i = 0; i < 50; i++) G.dropAdd(44 + G.rnd(-4, 4), 20 + G.rnd(-3, 3), 'couro', 1, 0);
  enc(0.05, 120); caps.push(p.bagN);
  if (r < 5) G.petAssign(p, null);
}
G.DROP_LIFE = life0;
ok(caps.join(',') === G.PET_CAP.join(','), 'mascote recolhe até o limite de carga da raridade: ' + caps.join(', '));
const p5 = G.petOf(h); const rt5 = G.petRt.get(p5.id);
ok(rt5 && G.drops.reduce((s, d) => s + d.n, 0) === 50 - 32 && rt5.st === 'follow', 'cheio, ele para de buscar e volta a seguir o dono');
const pc = G.petNew('jabuti', 0); G.petAssign(pc, h2); hunter(h2); G.drops.length = 0; for (let i = 0; i < 20; i++) G.dropAdd(44 + G.rnd(-4, 4), 20 + G.rnd(-3, 3), 'couro', 1, 0); enc(0.05, 60);
ok(pc.bagN === 9 && G.petLoadCap(pc) === 9, 'papel Carga: Jabuti Comum leva 9 (6 × 1,5)');
/* entrega na Guilda junto com o herói */
h.bag = { couro: 4 }; h.bagN = 4; h.state = 'town'; const cou = S.res.couro;
G.heroDecide(h); ok(h.act === 'deliver' && h.dest === 'guilda', 'herói com espólio vai entregar na Guilda');
h.bag = {}; h.bagN = 0; h.state = 'town'; G.heroDecide(h); ok(h.act === 'deliver', 'bolsa vazia, mas o mascote carregado: também vai à Guilda');
h.bag = { couro: 4 }; h.bagN = 4; h.state = 'inside'; h.act = 'deliver'; h.until = S.t; G.updateHero(h, 0.05, G.mons);
ok(S.res.couro === cou + 4 + 32 && p5.bagN === 0 && h.bagN === 0, 'entrega: bolsa (4) + carga do mascote (32) no Armazém');
/* queda: o mascote não perde a carga */
hunter(h); p5.bag = { couro: 7 }; p5.bagN = 7; h.bag = { couro: 3 }; h.bagN = 3; h.grace = S.day; h.wake = 0; const fell = G.heroFall(h, null);
ok(fell && h.bagN === 0 && p5.bagN === 7, 'o dono caiu e perdeu a bolsa; o mascote continuou com 7');
enc(0.05, 3); ok(G.petRt.get(p5.id).st === 'wait', 'com o dono caído, o mascote espera');
h.state = 'town'; h.hp = G.heroStats(h).hp;
/* Fraqueza */
const mw = mon('orc', 44, 22); mw.lvl = 20;
const dmg = (mm) => fixed(0.5, () => { const hp0 = h.hp = 1e7; h.state = 'hunt'; h.buff = {}; h.shield = 0; G.dmgToHero(mm, h, 1); return hp0 - h.hp; });
const dN = dmg(mw); mw.weak = S.t + 5; mw.weakF = 0.3; const dW = dmg(mw);
ok(dW < dN * 0.8, 'Fraqueza 30%: o monstro bate menos (' + Math.round(dN) + ' → ' + Math.round(dW) + ')');
const hitN = fixed(0.5, () => { mw.weak = 0; mw.hp = mw.hpMax = 1e9; return G.dmgToMon(h, mw, 1); }), hitW = fixed(0.5, () => { mw.weak = S.t + 5; mw.hp = mw.hpMax; return G.dmgToMon(h, mw, 1); });
ok(hitW > hitN, 'Fraqueza: o monstro defende menos (' + hitN + ' → ' + hitW + ')');
const fx = G.petNew('draquinho', 4), mt = mon('orc', 45, 20); mt.hp = mt.hpMax = 1e9; G.petAssign(fx, h); hunter(h); h.tgt = mt; h.state = 'hunt';
enc(0.05, 4); ok(mt.weak > S.t && Math.abs(mt.weakF - G.weakF(fx)) < 1e-9 && Math.abs(G.weakF(fx) - 0.14 * 2.1) < 1e-9, 'mascote de Fraqueza lança no alvo do dono (Lendário: ' + Math.round(G.weakF(fx) * 100) + '%)');
const bw = G.makeMon('anciao', 20, 45, 20, { zi: 0 }); G.petWeaken(fx, h, bw, null); ok(Math.abs(bw.weakF - G.weakF(fx) * 0.5) < 1e-9 && bw.weak - S.t <= G.WEAK_DUR * 0.6 + 1e-9, 'chefes resistem: metade da força e 60% da duração');
/* Vigor */
G.petAssign(fx, null); h._dirty = true; const hpBase = G.heroStats(h).hp;
const vg = G.petNew('broto', 3); G.petAssign(vg, h); const hpV = G.heroStats(h).hp;
ok(hpV > hpBase * 1.1, 'Vigor: Brotinho Épico aumenta a vida máxima (' + hpBase + ' → ' + hpV + ')');
hunter(h); h.hp = hpV * 0.5; h.lastHit = S.t; G.petRtOf(vg, h).tV = 0; const hb = h.hp; enc(0.05, 0.2);
ok(Math.abs(h.hp - hb - hpV * G.vigHeal(vg)) < 1, 'Vigor cura ' + Math.round(G.vigHeal(vg) * 100) + '% da vida do dono em combate');
/* fusão */
for (const x of S.heroes) if (x.pet) G.petAssign(G.petOf(x), null);
S.pets.length = 0; const c3 = [G.petNew('gato', 0), G.petNew('sapo', 0), G.petNew('jabuti', 0)], other = G.petNew('broto', 1);
ok(!G.petCanFuse([c3[0], c3[1], other]), 'fusão recusa raridades diferentes');
G.petAssign(c3[0], h); ok(!G.petFuse(c3), 'fusão recusa mascote que acompanha um herói'); G.petAssign(c3[0], null);
const fu = G.petFuse(c3); ok(fu && fu.rar === 1 && ['gato', 'sapo', 'jabuti'].includes(fu.k) && S.pets.length === 2 && S.stats.fusions === 1, 'três Comuns livres viram um Incomum (' + G.PETS[fu.k].name + ')');
const myth = [0, 1, 2].map(() => G.petNew('fenix', 5)); ok(!G.petCanFuse(myth), 'Mítico não se funde');
/* Viveiro */
S.pets.length = 0; S.b.estabulo = { lvl: 3 }; ok(G.petCap() === 14, 'Viveiro: 8 + 2 por nível do Estábulo (Estábulo 3 → 14)');
for (let i = 0; i < 14; i++) G.petNew('gato', 0);
const po0 = S.res.po_estelar, al0 = S.res.alma; const hx = G.petHatch('gato', 3, 'teste');
ok(hx === null && S.pets.length === 14 && S.res.po_estelar === po0 + 22 && S.res.alma === al0 + 2, 'Viveiro cheio: o ovo Épico vira 22 Pó Estelar e 2 Cristais de Alma');
S.mascate.offers[0] = { id: 'ovo', rar: 0, n: 1, gold: 100, sold: 0 }; ok(!G.mascateBuy(0), 'Mascate não vende ovo com o Viveiro cheio');
const rel = S.pets[0]; ok(G.petRelease(rel) && S.pets.length === 13 && G.mascateBuy(0) && S.pets.length === 14, 'soltar libera vaga; o ovo do Mascate choca na hora');
S.b.estabulo = { lvl: 10 };
/* dispensar herói devolve o mascote ao Viveiro */
const pd = S.pets[1]; G.petAssign(pd, h2); pd.bag = { couro: 2 }; pd.bagN = 2; const cc = S.res.couro; G.dismiss(h2);
ok(pd.hero === 0 && pd.bagN === 0 && S.res.couro === cc + 2, 'herói dispensado: o mascote volta ao Viveiro e a carga vai para o Armazém');

/* ---------- 4. Incursões ---------- */
const sum = G.INC_ODDS.map((r) => r.reduce((x, y) => x + y, 0)); ok(sum.every((v) => Math.abs(v - 100) < 1e-9), 'tabela de raridade: cada Grau soma 100%');
const mean = (g) => { let s = 0; for (let i = 0; i < 4000; i++) s += G.incRar(g); return s / 4000; };
const means = [1, 3, 5, 7, 10].map(mean);
ok(means.every((v, i) => !i || v > means[i - 1]), 'raridade média sobe com o Grau: ' + means.map((v) => v.toFixed(2)).join(' < '));
let r1 = [0, 0, 0, 0, 0, 0], r10 = [0, 0, 0, 0, 0, 0]; for (let i = 0; i < 20000; i++) { r1[G.incRar(1)]++; r10[G.incRar(10)]++; }
ok(r1[3] + r1[4] + r1[5] === 0 && r1[0] + r1[1] > 19000 && r10[0] + r10[1] === 0 && r10[5] > 600 && r10[5] < 1400, 'Grau I: só Comum/Incomum/Raro (' + r1.slice(0, 3).join('/') + '); Grau X: Mítico em ' + (r10[5] / 200).toFixed(1) + '%');
let nat = 0; for (let i = 0; i < 4000; i++) if (G.ZPETS.pantano.includes(G.petRoll('pantano', 2))) nat++;
ok(nat > 1600, 'as 2 espécies nativas do Pântano saem em ' + (nat / 40).toFixed(0) + '% dos ovos de lá');
ok(G.PET_IDS.length >= 12 && G.PET_IDS.filter((k) => G.PETS[k].role === 'fraqueza').length >= 3 && G.PET_IDS.filter((k) => G.PETS[k].role === 'vigor').length >= 3 && G.ZONES.every((z) => (G.ZPETS[z.id] || []).length === 2), G.PET_IDS.length + ' espécies, papéis espalhados, 2 nativas por zona');
/* trancas */
S.realm.lvl = 5; ok(!G.incCanStart('bosque', 1).ok, 'Incursões trancadas antes do Nível de Reino 6'); S.realm.lvl = 30;
ok(!G.incCanStart('bosque', 2).ok && G.incCanStart('bosque', 1).ok, 'só o Grau I abre no começo');
S.rift.run = { floor: 1, ids: [], phase: 'walk', t: 0, limit: 150 }; ok(!G.incCanStart('bosque', 1).ok, 'não sai durante a Fenda'); S.rift.run = null;
S.mare.active = { gate: 'n' }; ok(!G.incCanStart('bosque', 1).ok, 'não sai durante a Maré'); S.mare.active = null;
/* vitória forçada: heróis muito fortes no Grau I do Bosque */
G.mons.length = 0; G.drops.length = 0;
for (const x of S.heroes) { x.lvl = 70; x.rank = 6; x._dirty = true; x.hp = G.heroStats(x).hp; x.state = 'town'; x.inside = null; x.x = 44; x.y = 56; x.potions = 6; x.fome = 100; x.energia = 100; }
S.pets.length = 0; for (const x of S.heroes) x.pet = 0;
const ids = S.heroes.map((x) => x.id), pets0 = S.pets.length, w0 = S.stats.incWins, tomo0 = S.res.tomo;
ok(G.incStart('bosque', 1, ids) && S.inc.run && S.heroes.every((x) => x.state === 'inc') && S.inc.dayDone === S.day, 'Incursão de ' + ids.length + ' heróis partiu (tentativa grátis do dia usada)');
ok(!G.riftCanStart(), 'a Fenda não sai durante a Incursão');
const phases = new Set(); errs.length = 0; let tt = 0; while (S.inc.run && tt < 500) { G.tick(0.05); tt += 0.05; if (S.inc.run) phases.add(S.inc.run.phase); }
ok(!S.inc.run && S.inc.last.win === 1 && S.inc.best.bosque === 1 && S.stats.incWins === w0 + 1, 'Incursão vencida em ' + Math.round(tt) + ' s (fases: ' + [...phases].join(' → ') + ')');
ok(S.pets.length === pets0 + 1 && S.res.tomo > tomo0 && G.incMax('bosque') === 2, 'vitória: ovo chocado (' + G.PETS[S.pets[S.pets.length - 1].k].name + ' ' + G.RAR[S.pets[S.pets.length - 1].rar] + '), Tomos, e o Grau II abriu');
ok(!G.mons.some((x) => x.inc) || G.mons.filter((x) => x.inc).every((x) => x.gone), 'monstros da Incursão somem no fim');
ok(errs.length === 0, 'vitória sem erros (' + errs.slice(0, 2).join(' / ') + ')');
/* derrota forçada: heróis fracos no Grau X */
for (let t = 0; t < 60; t += 0.05) G.tick(0.05);
S.inc.best.bosque = 9; const nuc0 = S.nucleos;
for (const x of S.heroes) { x.lvl = 2; x.rank = 0; x._dirty = true; x.hp = G.heroStats(x).hp; x.state = 'town'; x.inside = null; x.potions = 0; x.wake = 0; x.grace = S.day; }
ok(G.incStart('bosque', 10, ids) && S.nucleos === nuc0 - G.incCost(), 'segunda tentativa no mesmo dia custa ' + G.incCost() + ' Núcleos');
tt = 0; while (S.inc.run && tt < 600) { G.tick(0.05); tt += 0.05; }
ok(!S.inc.run && S.inc.last.win === 0 && S.inc.best.bosque === 9 && S.stats.incWins === w0 + 1, 'Incursão perdida (' + (S.inc.last.why === 'time' ? 'tempo esgotado' : 'todos caíram') + ' em ' + Math.round(tt) + ' s): o Grau X continua fechado');
/* a Maré espera */
S.inc.run = { z: 'bosque', g: 1, ids: [], phase: 'walk', t: 0, ft: 0, wt: 0, limit: 240, lvl: 11, n: 0, alfa: 0 };
S.mare.next = S.day; S.clock = 1229.5; G.updateTown(0.2); ok(!S.mare.active && S.mare.held === S.day, 'a Maré não começa durante a Incursão');
S.inc.run = null; G.updateEncounters(0.05); ok(!!S.mare.active, 'acabada a Incursão, a Maré que esperava começa'); S.mare.active = null;

/* ---------- 5. Caminhos ---------- */
ok(G.PATHS.length === 23 && ['adotar', 'toque10', 'incursao', 'pet_raro', 'fusao'].every((id) => G.PATHS.some((d) => d.id === id)), 'Caminhos: 18 da v21 + 5 novos');
G.newGame(); S = G.S; S.stats.kills = 30; ok(G.pathClaim('adotar') && S.pets.length === 1 && G.petOf(S.heroes[0]) && G.petOf(S.heroes[0]).rar === 0, 'Caminho "Adote o primeiro mascote" dá um Comum ao primeiro herói sem mascote');
ok(G.PATHS.every((d) => { const v = G.pathCur(d); return v >= 0 && v <= d.n; }), 'todos os Caminhos calculam progresso');

/* ---------- 6. salvar e carregar ---------- */
const pp = S.pets[0]; pp.bag = { gosma: 3 }; pp.bagN = 3; S.inc.best.bosque = 4; S.inc.dayDone = S.day; G.dropAdd(44, 20, 'gosma', 2, 0);
const js = G.serialize(), back = JSON.parse(js);
ok(!('drops' in back) && back.pets[0].bag.gosma === 3 && back.pets[0].hero === S.heroes[0].id && back.heroes[0].pet === pp.id && back.inc.best.bosque === 4 && back.inc.dayDone === S.day, 'salvar: mascotes com carga, dono, Graus e tentativa do dia; nada do chão nem posição');
G.S = G.deserialize(js); G.afterLoad(); S = G.S;
ok(S.pets.length === 1 && G.petOf(S.heroes[0]) === S.pets[0] && S.pets[0].bagN === 3 && G.drops.length === 0 && G.petRt.size === 0 && S.inc.run === null, 'carregar: mascote volta com o dono e a carga; chão e posições zerados');

/* ---------- 7. três dias de jogo com tudo ---------- */
S.gold = 1e7; S.realm.lvl = 12; for (const id of G.BLD_IDS) S.b[id] = { lvl: 6 }; G.dirtyAll();
for (const x of S.heroes) { x.lvl = 30; x.rank = 3; x._dirty = true; x.hp = G.heroStats(x).hp; }
for (const k of ['olho', 'medusa']) { const p = G.petNew(k, 3); const x = S.heroes.find((y) => !y.pet); if (x) G.petAssign(p, x); }
errs.length = 0; let picked = 0, maxDrops = 0;
for (let t = 0; t < 3 * G.DAY_SEC; t += 0.05) { G.tick(0.05); maxDrops = Math.max(maxDrops, G.drops.length); if (Math.floor(t / 30) !== Math.floor((t - 0.05) / 30) && G.drops.length) { const r = G.dropTake(G.drops[0]); if (r) picked += r.n; if (G.incCanStart('bosque', 1).ok) G.incStart('bosque', 1, S.heroes.map((x) => x.id)); } }
ok(errs.length === 0 && S.stats.weak > 0 && picked > 0, '3 dias com mascotes, toques e Incursão: sem erros · Fraquezas ' + S.stats.weak + ' · recolhidos por toque ' + picked + ' · máximo no chão ' + maxDrops + ' · abates ' + S.stats.kills);
console.error = ce;
console.log(fails ? fails + ' verificação(ões) falharam' : 'todas as verificações da v22 passaram');
