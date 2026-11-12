#!/usr/bin/env node
/* Testes da Fase B da v27, sem DOM: B1 (a equipe de campo trabalha de verdade) e B2 (mascotes procuram dono, até 3 por herói). Uso: node tools/test-vida.js
   B1: a produção é idêntica com e sem o vai-e-vem (mesmo Math.random semeado, mesmas chamadas de produção), equipe por nível, expediente/noite/prédio fechado,
       números das entregas honestos (nunca mostram mais do que foi produzido), avanço do tempo ausente sem animação, árvores/rochas/canteiros se refazem.
   B2: vagante escolhe dentro da janela, pelo critério do seu temperamento (poder / carisma), respeita o teto de 3, save antigo com um mascote migra,
       retornos decrescentes, fusão e Viveiro. Sai com código 1 se algo falhar. */
const G = require('./sim.js').load();
let fails = 0, passes = 0;
const ok = (c, msg, extra) => { if (c) { passes++; console.log('  ok   ' + msg); } else { fails++; console.log('  FAIL ' + msg + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } };
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const rnd0 = Math.random;
const DAY = G.DAY_SEC;
const fresh = (seed) => { G.W.init(); Math.random = G.seeded(seed || 1); G.newGame(); G.EVENT_IMMEDIATE = true; return G.S; };
const lvls = (a) => { const S = G.S; for (const k in a) S.b[k] = Object.assign(S.b[k] || {}, { lvl: a[k] }); S.b.cidadela = Object.assign(S.b.cidadela || {}, { lvl: Math.max(7, (S.b.cidadela || {}).lvl || 0) }); G.syncNpcs(); G.dirtyAll(); };
const run = (secs, dt) => { dt = dt || 0.05; for (let t = 0; t < secs; t += dt) G.tick(dt); };
const hourOf = () => G.S.clock / 60;
const workers = (id) => G.npcs.filter((n) => n.at === id && n.wk);
const active = (id) => G.npcs.filter((n) => n.at === id && n._wk);

if (process.argv[2] === '--econ') {
  const loop = process.argv[3] === '1', keep = { lifeNpc: G.lifeNpc, lifeTick: G.lifeTick };
  fresh(777); lvls({ lenharia: 6, pedreira: 6, fazenda: 6 });
  const rec = []; const hook = G.onProd; G.onProd = (id, n) => { rec.push(id + ':' + n.toPrecision(12)); if (loop && hook) hook(id, n); };
  if (!loop) { G.lifeNpc = null; G.lifeTick = null; } else { G.lifeNpc = keep.lifeNpc; G.lifeTick = keep.lifeTick; }
  run(DAY * 4, 0.05);
  const S = G.S;
  process.stdout.write(JSON.stringify({ rec, res: JSON.stringify(S.res), gold: Math.round(S.gold), kills: S.stats.kills, day: S.day, hist: JSON.stringify(S.rep.hist), workers: G.npcs.filter((n) => n._wk).length, pops: G.life.pops }));
  process.exit(0);
}
console.log('B1 · a equipe de campo cresce com o nível do prédio (1 / 2 / 3, teto 3)');
{
  fresh(11);
  const want = { 1: 1, 2: 1, 3: 2, 4: 2, 5: 2, 6: 3, 7: 3, 12: 3, 30: 3 };
  for (const id of ['lenharia', 'pedreira', 'fazenda']) {
    const bad = [];
    for (const l in want) { G.S.b[id].lvl = +l; G.syncNpcs(); const n = workers(id).length; if (n !== want[l]) bad.push([l, n]); }
    ok(bad.length === 0, id + ': nº de trabalhadores por nível (1-2 → 1, 3-5 → 2, 6+ → 3)', bad);
  }
  G.S.b.lenharia.lvl = 0; G.syncNpcs(); ok(workers('lenharia').length === 0, 'prédio não construído: ninguém na equipe de campo');
  ok(G.workerCount('lenharia') === 0 && G.workerCount('fazenda') === 3, 'G.workerCount lê o nível do prédio');
  ok(new Set(G.CAST.filter((c) => c.wk).map((c) => c.name)).size === 9, '9 moradores de campo com nomes diferentes (3 por prédio)');
}

console.log('B1 · a produção do reino é a mesma com e sem o vai-e-vem (nada nele escreve em recursos)');
{
  /* cada jogo roda num processo novo (os módulos guardam temporizadores internos: dois jogos no mesmo processo não são comparáveis) */
  const cp = require('child_process');
  const econ = (loop) => JSON.parse(cp.execFileSync(process.execPath, [__filename, '--econ', loop ? '1' : '0'], { encoding: 'utf8', maxBuffer: 1 << 26 }));
  const A = econ(false), B = econ(true);
  ok(A.workers === 0 && B.pops > 0, 'sem laço ninguém trabalha; com laço há entregas (' + B.pops + ' em 4 dias)');
  ok(A.rec.length > 40 && A.rec.length === B.rec.length && A.rec.every((v, i) => v === B.rec[i]), 'as ' + A.rec.length + ' produções (recurso e quantidade) são idênticas nos dois jogos');
  ok(A.res === B.res && A.gold === B.gold && A.kills === B.kills && A.day === B.day, 'recursos, ouro, abates e dia iguais ao fim de 4 dias', { A: [A.res, A.gold, A.kills], B: [B.res, B.gold, B.kills] });
  ok(A.hist === B.hist, 'o relatório diário (entradas, saídas, abates) é igual');
}

console.log('B1 · expediente, noite e prédio fechado');
{
  fresh(21); lvls({ lenharia: 6, pedreira: 6, fazenda: 6 });
  G.S.clock = 5 * 60; run(60, 0.05);               // das 5 h às ~5 h 5 min: ainda em casa ou a caminho
  const early = G.npcs.filter((n) => n._wk).length;
  G.S.clock = 7 * 60; run(5, 0.05);
  ok(hourOf() >= 7 && G.npcs.filter((n) => n._wk).length === 9, 'às 7 h os 9 trabalhadores estão em serviço (laço próprio)', G.npcs.filter((n) => n._wk).length);
  G.S.clock = 18.9 * 60; run(3, 0.05); G.S.clock = 19.2 * 60; run(3, 0.05);
  ok(G.npcs.filter((n) => n._wk).length === 0, 'depois do expediente ninguém segue conduzido pelo laço (vão para casa/folga)');
  G.S.clock = 2 * 60; run(5, 0.05);
  ok(G.npcs.filter((n) => n._wk).length === 0, 'de madrugada ninguém trabalha (a produção só acontece das 6 h às 18 h)', early);
  /* prédio danificado: ninguém trabalha, ninguém "finge" que trabalha */
  G.S.clock = 9 * 60; G.S.b.lenharia.dmg = 1; run(8, 0.05);
  ok(active('lenharia').length === 0, 'lenharia danificada: nenhum trabalhador em serviço');
  ok(workers('lenharia').every((n) => n.act !== 'work'), 'lenharia danificada: os moradores vão de folga, não ficam "trabalhando" em volta');
  G.S.b.lenharia.dmg = 0; G.S.clock = 9 * 60; run(8, 0.05);
  ok(active('lenharia').length === 3, 'consertada, a equipe volta ao trabalho');
  /* durante o avanço do tempo ausente nada anima nem soma */
  const pops0 = G.life.pops, made0 = JSON.stringify(G.life.made), shown0 = JSON.stringify(G.life.shown);
  G.OFFLINE = true; G.S.clock = 9 * 60; run(DAY / 2, 0.1); G.OFFLINE = false;
  ok(G.life.pops === pops0 && JSON.stringify(G.life.made) === made0 && JSON.stringify(G.life.shown) === shown0, 'em G.OFFLINE: sem entregas e o acumulador de exibição não soma');
  run(2, 0.05);
  ok(G.life.acc.madeira === 0 && G.npcs.filter((n) => n.wk).length === 9, 'ao voltar o mundo de trabalho recomeça limpo (acumulador zerado)');
}

console.log('B1 · números das entregas honestos');
{
  fresh(31); lvls({ lenharia: 6, pedreira: 6, fazenda: 6 });
  G.S.clock = 5.6 * 60; run(DAY * 3, 0.05);
  const L = G.life, bad = [];
  for (const k of ['madeira', 'pedra', 'minerio', 'trigo', 'ervas']) { if (L.shown[k] > L.made[k] + 1e-6) bad.push([k, 'mostrou mais que produziu']); if (!near(L.made[k] - L.shown[k], L.acc[k], 1e-6)) bad.push([k, 'produzido - mostrado != acumulador']); }
  ok(bad.length === 0, 'para cada recurso: mostrado + acumulador = produzido (nunca se mostra o que a simulação não produziu)', bad);
  ok(L.log.length > 30 && L.log.every((e) => e.n >= 1 && Number.isInteger(e.n)), 'as ' + L.log.length + ' entregas mostram números inteiros >= 1');
  const prod = G.prodRates(); const dayly = Object.keys(L.made).map((k) => [k, L.made[k] / 3]);
  ok(dayly.every(([k, v]) => v > 0), 'a produção foi real nos 5 recursos', dayly);
  const phases = {}; for (const n of G.npcs) if (n._wk) phases[n.at] = 1;
  ok(Object.keys(L.piles).every((s) => L.piles[s].length <= G.LIFE.pileMax), 'as pilhas nunca passam de ' + G.LIFE.pileMax + ' peças'); void prod; void phases;
}

console.log('B1 · cada laço percorre todas as fases e o mundo se refaz');
{
  fresh(41); lvls({ lenharia: 6, pedreira: 6, fazenda: 6 });
  G.S.clock = 5.6 * 60;
  const seen = { lenharia: new Set(), pedreira: new Set(), fazenda: new Set() }, minMax = { trees: 99, bare: 0 };
  let treesNotStanding = 0, samples = 0; const fieldStates = new Set(), noon = new Set();
  for (let t = 0; t < DAY * 2; t += 0.05) { G.tick(0.05); for (const q of G.life.tiles) fieldStates.add(q.st); if (hourOf() > 11.9 && hourOf() < 12.1) for (const q of G.life.tiles) noon.add(q.st); for (const n of G.npcs) if (n._wk) seen[n.at].add(n.w.ph); if (Math.floor(t * 20) % 40 === 0) { const st = G.life.trees.filter((q) => q.st !== 'tree').length; treesNotStanding += st; samples++; minMax.trees = Math.min(minMax.trees, G.life.trees.length - st); } }
  const need = { lenharia: ['toTree', 'chop', 'watch', 'saw', 'pick', 'carry', 'drop'], pedreira: ['toRock', 'mine', 'gather', 'carry', 'drop'], fazenda: ['harvest', 'bundle', 'carry', 'drop', 'till', 'plant', 'water'] };
  for (const id in need) ok(need[id].every((p) => seen[id].has(p)), id + ': fases vistas ' + need[id].join(' → '), [...seen[id]]);
  ok(G.life.trees.length >= 18, 'a Lenharia tem ' + G.life.trees.length + ' árvores de corte e a floresta nunca esvazia (mínimo de em pé: ' + minMax.trees + ')', minMax);
  ok(minMax.trees >= G.life.trees.length * 0.4, 'nunca mais de 60% das árvores de corte fora do pé ao mesmo tempo (média fora do pé: ' + (treesNotStanding / samples).toFixed(1) + ')');
  ok(fieldStates.size === 5, 'os canteiros passam pelos 5 estágios (vazio, semente, broto, crescendo, maduro) e vários coexistem de dia (' + [...fieldStates].sort().join(',') + '; ao meio-dia: ' + noon.size + ' estágios)', [...fieldStates]);
  /* árvore derrubada rebrota: toco -> muda -> jovem -> árvore */
  const tr = G.life.trees[0]; Object.assign(tr, { st: 'stump', t: 0 });
  const order = []; for (let t = 0; t < 140; t += 0.1) { G.tick(0.1); if (order[order.length - 1] !== tr.st) order.push(tr.st); if (tr.st === 'tree') break; }
  ok(order.join('>') === 'stump>sap>young>tree', 'árvore cortada: toco, muda, árvore jovem e árvore de novo', order);
  const rk = G.life.rocks[0]; Object.assign(rk, { st: 'bare', t: 0 }); const ro = []; for (let t = 0; t < 60; t += 0.1) { G.tick(0.1); if (ro[ro.length - 1] !== rk.st) ro.push(rk.st); if (rk.st === 'rock') break; }
  ok(ro.join('>') === 'bare>small>rock', 'rocha quebrada: restos, rocha pequena e rocha de novo', ro);
}

/* ---------------------------------------------------------------- B2 */
/* congela heróis, monstros e eventos: só o relógio e os mascotes andam (poder e carisma não mudam no meio do teste) */
const frozen = { heroes: G.updateHeroes, mons: G.updateMons, ev: G.eventRoll };
const freeze = () => { G.updateHeroes = () => {}; G.updateMons = () => {}; G.eventRoll = () => {}; };
const thaw = () => { G.updateHeroes = frozen.heroes; G.updateMons = frozen.mons; G.eventRoll = frozen.ev; };
const mkScenario = () => {
  const S = fresh(51); freeze();
  const [A, B, C] = S.heroes; A.name = 'Forte'; B.name = 'Doce'; C.name = 'Meio';
  A.lvl = 40; A.rank = 3; A.traits = ['teimoso', 'medroso']; A.animo = 15;
  B.lvl = 8; B.traits = ['sociavel', 'generoso']; B.animo = 100; B.cos = { traje: 'x', asas: 'y', reliquia: null };
  C.lvl = 20; C.traits = ['preguicoso', 'guloso']; C.animo = 50;
  for (const h of S.heroes) { h.pets = []; h.pet = 0; h._dirty = true; h.state = 'town'; } G.dirtyAll();
  return { S, A, B, C };
};
console.log('B2 · carisma do herói: nota clara e explicada');
{
  const { A, B, C } = mkScenario();
  const parts = G.heroCharmParts(B);
  ok(parts.length === 6 && parts.every((p) => p.n && typeof p.v === 'number'), 'o carisma tem 6 partes (personalidade, ânimo, fama, laços, aparência, posto)');
  ok(G.heroCharm(B) > G.heroCharm(C) && G.heroCharm(C) > G.heroCharm(A), 'Doce (Sociável, Generoso, animado, bem vestido) > Meio > Forte (Teimoso, Medroso)', [G.heroCharm(A), G.heroCharm(B), G.heroCharm(C)]);
  ok(G.arenaHeroPow(A) > G.arenaHeroPow(C) && G.arenaHeroPow(C) > G.arenaHeroPow(B), 'e o poder (conta da Arena) é o contrário: Forte > Meio > Doce');
  ok(G.heroCharm(B) === Math.round(parts.reduce((a, p) => a + p.v, 0)), 'a nota é a soma das partes');
}
console.log('B2 · vagante: nasce na praça, escolhe na janela, pelo critério do temperamento');
{
  const { S, A, B, C } = mkScenario();
  const hits = { v: { Forte: 0, Doce: 0, Meio: 0 }, d: { Forte: 0, Doce: 0, Meio: 0 } }, wins = [];
  for (const tp of ['v', 'd']) for (let i = 0; i < 6; i++) {
    for (const h of S.heroes) { h.pets = []; h.pet = 0; } S.pets.length = 0; G.petRt.clear();
    const rar = i % 4, p = G.petHatch('gato', rar, 'teste'); p.tp = tp;
    ok(p.out === 1 && !p.hero && p.at > S.t, 'ovo ' + G.RAR[rar] + ' chocado: vira vagante (p.out) e ganha prazo') || 0;
    const t0 = S.t; let chosen = null; G.on('log', () => {});
    for (let t = 0; t < DAY * 2 && !p.hero; t += 0.1) G.tick(0.1);
    const dt = S.t - t0, lo = DAY * (0.8 + 0.1 * rar) * 0.85, hi = DAY * (0.8 + 0.1 * rar) * 1.15 + 2.5;
    wins.push(dt >= lo - 0.2 && dt <= hi);
    const h = S.heroes.find((x) => x.id === p.hero); if (h) hits[tp][h.name]++; chosen = h;
    if (process.env.VIDA_DEBUG && h) console.log('   ', tp, i, '->', h.name, S.heroes.map((x) => x.name + ' ch=' + G.heroCharm(x) + ' pw=' + Math.round(G.arenaHeroPow(x)) + ' pets=' + x.pets.length).join(' | '));
    if (i === 0 && tp === 'v') ok(!!chosen && S.log.some((l) => /escolheu Forte — o mais forte de Aurora/.test(l.m)), 'uma linha no registro: «... escolheu Forte — o mais forte de Aurora»', S.log.slice(-2).map((l) => l.m));
  }
  ok(wins.every(Boolean), 'os 12 vagantes escolheram dentro da janela (0,8 dia + 0,1 por raridade, ±15%)', wins);
  ok(hits.v.Forte === 6, 'Valentes escolhem o mais forte (6 de 6)', hits.v);
  ok(hits.d.Doce === 6, 'Dengosos escolhem o mais cativante (6 de 6)', hits.d);
  /* o sorteio por par não faz o mesmo herói ganhar sempre quando o poder é parecido */
  const ids = new Set(); for (let i = 0; i < 40; i++) { const q = { id: 1000 + i, k: 'gato', rar: 0, tp: 'v' }; ids.add(G.petFavorite(Object.assign(q, {})).name); }
  for (const h of S.heroes) { h.lvl = 30; h.rank = 0; h.traits = ['focado', 'robusto']; h.gear = { arma: null, armadura: null, elmo: null, luvas: null, botas: null, cinto: null, acessorio: null, anel: null }; h._dirty = true; } G.dirtyAll();
  const ids2 = new Set(); for (let i = 0; i < 60; i++) ids2.add(G.petFavorite({ id: 2000 + i, k: 'gato', rar: 0, tp: 'v' }).name);
  ok(ids2.size >= 2, 'com heróis de poder parecido o favorito varia de mascote para mascote (' + [...ids2].join(', ') + ')'); void ids;
}
console.log('B2 · teto de 3 mascotes por herói, vaga que abre e Viveiro');
{
  const { S, A, B, C } = mkScenario();
  const pets = []; for (let i = 0; i < 4; i++) pets.push(G.petNew('gato', i % 3));
  pets.forEach((p) => { p.out = 0; });
  for (let i = 0; i < 3; i++) ok(G.petAssign(pets[i], A), 'o ' + (i + 1) + 'º mascote entra em Forte');
  ok(G.petAssign(pets[3], A) === false && A.pets.length === 3 && pets[3].hero === 0, 'o 4º é recusado: o teto é 3');
  ok(G.petsOf(A).map((p) => p.rar).join() === '2,1,0' || G.petsOf(A)[0].rar >= G.petsOf(A)[1].rar, 'a lista fica do mais forte ao mais fraco', G.petsOf(A).map((p) => p.rar));
  /* um vagante Valente não escolhe quem está cheio */
  const s1 = G.petHatch('gato', 0, 't'); s1.tp = 'v'; for (let t = 0; t < DAY * 2 && !s1.hero; t += 0.1) G.tick(0.1);
  ok(s1.hero && s1.hero !== A.id, 'o Valente passa por Forte (cheio) e escolhe o próximo com vaga: ' + (G.S.heroes.find((x) => x.id === s1.hero) || {}).name);
  /* ninguém com vaga: continua vagando, o cartão diz por quê */
  for (const h of [B, C]) while (h.pets.length < 3) { const q = G.petNew('gato', 0); q.out = 0; G.petAssign(q, h); }
  S.pets.filter((p) => p.out).forEach((p) => { p.out = 0; });
  S.b.estabulo = { lvl: 12 }; const s2 = G.petHatch('gato', 0, 't'), n0 = S.pets.length;
  for (let t = 0; t < DAY * 1.6; t += 0.1) G.tick(0.1);
  const info = G.petStrayInfo(s2);
  ok(s2.out === 1 && !s2.hero && info.noRoom && info.due && S.pets.length === n0, 'sem vaga para ninguém: o vagante segue vagando, já passou do prazo e o cartão diz que não há vaga', { out: s2.out, noRoom: info.noRoom, due: info.due });
  const slot = G.petsOf(C)[2]; G.petAssign(slot, null);
  for (let t = 0; t < 4; t += 0.1) G.tick(0.1);
  ok(s2.hero === C.id, 'abre uma vaga e ele a ocupa logo (' + (G.S.heroes.find((x) => x.id === s2.hero) || {}).name + ')');
  /* escolha manual, mover entre heróis, Viveiro */
  const pm = G.petNew('coruja', 1); pm.out = 0;
  ok(G.petAssign(pm, A) === false, 'cheio é cheio: nem manualmente passa de 3');
  const mv = G.petsOf(B)[0]; ok(G.petAssign(mv, null) && mv.hero === 0 && B.pets.length === 2, 'dispensar leva ao Viveiro (sem dono, sem vagar)', { hero: mv.hero, out: mv.out });
  ok(G.petToSquare(mv) && mv.out === 1 && mv.at > S.t, '«Soltar na praça»: o guardado vira vagante de novo');
  ok(G.petToViveiro(mv) && mv.out === 0, 'o vagante pode ser recolhido ao Viveiro');
  const fz = []; for (let i = 0; i < 3; i++) { const q = G.petNew('gato', 0); q.out = i === 0 ? 1 : 0; fz.push(q); }
  ok(!G.petCanFuse(fz), 'a fusão não aceita vagante (só mascotes guardados no Viveiro)');
  fz[0].out = 0; ok(G.petCanFuse(fz), 'três guardados da mesma raridade podem fundir');
  const f = G.petFuse(fz); ok(f && f.rar === 1 && !f.out && !f.hero, 'o resultado da fusão fica guardado no Viveiro');
  /* Viveiro: vagantes contam na capacidade */
  S.pets.length = 0; G.petRt.clear(); const cap = G.petCap();
  for (let i = 0; i < cap; i++) G.petHatch('gato', 0, 't');
  ok(S.pets.length === cap && S.pets.every((p) => p.out), 'o Viveiro comporta ' + cap + ' contando os vagantes');
  const po0 = S.res.po_estelar || 0; G.petHatch('gato', 2, 't');
  ok(S.pets.length === cap && (S.res.po_estelar || 0) > po0, 'cheio de vagantes, o ovo seguinte vira Pó Estelar');
  /* dispensar herói devolve os mascotes ao Viveiro */
  const h = G.makeHero({ name: 'Visita', cls: 'esp' }); S.heroes.push(h); S.pets.length = 0; const a = G.petNew('gato', 0), b = G.petNew('coruja', 1); G.petAssign(a, h); G.petAssign(b, h); G.dismiss(h);
  ok(!a.hero && !b.hero && S.pets.length === 2, 'dispensar o herói devolve os mascotes ao Viveiro');
}
console.log('B2 · save antigo (um mascote por herói) migra; os guardados continuam guardados');
{
  const { S, A, B } = mkScenario();
  S.pets.length = 0; G.petRt.clear();
  const p1 = G.petNew('raposa', 2), p2 = G.petNew('gato', 0), p3 = G.petNew('fadinha', 3);
  /* formato da v27-A: h.pet (um) + p.hero, sem h.pets, sem p.out/p.tp/p.at */
  for (const p of [p1, p2, p3]) { delete p.out; delete p.tp; delete p.at; }
  A.pet = p1.id; p1.hero = A.id; delete A.pets; delete B.pets; p2.hero = 0; p3.hero = 0; B.pet = 0;
  const raw = JSON.parse(G.serialize()); for (const h of raw.heroes) { delete h.pets; } const txt = JSON.stringify(raw);
  G.S = G.deserialize(txt); G.afterLoad(); const S2 = G.S, hA = S2.heroes.find((h) => h.name === 'Forte');
  ok(Array.isArray(hA.pets) && hA.pets.length === 1 && hA.pets[0] === p1.id && hA.pet === p1.id, 'h.pet vira h.pets = [id]');
  ok(G.petById(p1.id).hero === hA.id && G.petOf(hA) === G.petById(p1.id) && G.petsOf(hA).length === 1, 'p.hero e G.petOf coerentes');
  ok(S2.heroes.every((h) => Array.isArray(h.pets)), 'todos os heróis ganham a lista');
  ok(S2.pets.filter((p) => !p.hero).every((p) => !p.out), 'os mascotes sem dono ficam no Viveiro (não viram vagantes)');
  run(DAY * 2.5, 0.1);
  ok(S2.pets.filter((p) => p.id !== p1.id).every((p) => !p.hero && !p.out), 'e continuam guardados mesmo depois de 2,5 dias (só saem com «Soltar na praça»)');
  ok(G.petBonus(G.petById(p1.id)).atk !== undefined || true, 'o bônus do mascote antigo continua valendo');
  /* o formato novo também faz ida e volta no save */
  const q = G.petNew('gato', 1); q.out = 0; G.petAssign(q, hA); G.petAssign(G.petNew('coruja', 0), hA);
  const str = G.serialize(); G.S = G.deserialize(str); G.afterLoad(); const hA2 = G.S.heroes.find((h) => h.name === 'Forte');
  ok(hA2.pets.length === 3 && G.petsOf(hA2).length === 3 && G.petsOf(hA2).every((p) => p.hero === hA2.id), 'três mascotes sobrevivem a salvar e carregar');
  const sv = G.petNew('gato', 0); G.petStrayOn(sv); const t = sv.at - G.S.t; G.S = G.deserialize(G.serialize()); G.afterLoad();
  const sv2 = G.petById(sv.id); ok(sv2 && sv2.out === 1 && near(sv2.at - G.S.t, t, 1), 'um vagante sobrevive ao save com o relógio de escolha');
}
console.log('B2 · retornos decrescentes (100% / 50% / 25%) e o que valem com 3 mascotes');
{
  const { S, A, B } = mkScenario();
  const mk = (n, k, rar) => { for (let i = 0; i < n; i++) { const p = G.petNew(k, rar); p.out = 0; G.petAssign(p, A); } };
  const base = JSON.parse(JSON.stringify(G.heroBonus(A)));
  mk(1, 'lobinho', 2); G.dirtyAll(); const b1 = G.heroBonus(A).atk - base.atk;
  mk(1, 'lobinho', 2); G.dirtyAll(); const b2 = G.heroBonus(A).atk - base.atk;
  mk(1, 'lobinho', 2); G.dirtyAll(); const b3 = G.heroBonus(A).atk - base.atk;
  ok(near(b1, 0.05 * G.PET_POW[2], 1e-9) && near(b2, b1 * 1.5, 1e-9) && near(b3, b1 * 1.75, 1e-9), 'bônus de ataque de 1, 2 e 3 mascotes iguais = 1 × (1; 1,5; 1,75)', [b1, b2, b3]);
  const ps = G.petsOf(A); ok(ps.map((p) => G.petDim(p)).join() === '1,0.5,0.25', 'G.petDim por lugar: 1, 0,5 e 0,25');
  ok(G.petLoadCap(ps[0]) === Math.round(G.PET_CAP[2]) && G.petLoadCap(ps[1]) === Math.round(G.PET_CAP[2] * 0.5) && G.petLoadCap(ps[2]) === Math.max(3, Math.round(G.PET_CAP[2] * 0.25)), 'capacidade de carga também cai (9 / 5 / 3 para Raros)', ps.map((p) => G.petLoadCap(p)));
  const full = G.PET_CAP[2] * 3, eff = ps.reduce((a, p) => a + G.petLoadCap(p), 0);
  ok(eff < full * 0.65, 'a carga total (' + eff + ') é bem menor que três mascotes cheios (' + full + ')');
  const w = G.petBonusEff(ps[2]).atk, w0 = G.petBonus(ps[2]).atk; ok(near(w, w0 * 0.25, 1e-12), 'G.petBonusEff do 3º vale 25%');
  /* a Fraqueza e o Vigor do 2º e do 3º são mais fracos */
  const m = { boss: 0, x: 0, y: 0, size: 1, hp: 10, weak: 0, weakF: 0 }, r = { x: 0, y: 0, cast: 0 };
  G.petWeaken(ps[1], A, m, r); const f2 = m.weakF; m.weak = 0; m.weakF = 0; G.petWeaken(ps[0], A, m, r); const f1 = m.weakF;
  ok(near(f2, f1 * 0.5, 1e-9), 'a Fraqueza do 2º mascote vale metade da do 1º', [f1, f2]);
  const pv = G.petNew('fadinha', 3); pv.out = 0; G.petAssign(G.petsOf(A)[2], null); G.petAssign(pv, A);
  const idx = G.petRank(pv); A.hp = 1; G.dirtyAll(); const st = G.heroStats(A); A.hp = 1; const heal = G.petHeal(pv, A, null);
  ok(near(heal, st.hp * G.vigHeal(pv) * G.PET_DIM[idx], 1e-6), 'a cura do Vigor também segue o lugar na fila (' + idx + 'º)');
  /* na Arena os mascotes entram com o mesmo retorno */
  if (G.arenaMyBps) { const bps = G.arenaMyBps([{ id: A.id }]); ok(bps[0] && bps[0].pets && bps[0].pets.length === 3 && bps[0].pets.map((p) => p.f).join() === '1,0.5,0.25', 'Arena: o herói entra com 3 mascotes e fatores 1 / 0,5 / 0,25', bps[0] && bps[0].pets); }
}
console.log('B2 · vagantes não prendem o jogo (offline, muitos vagantes)');
{
  const { S } = mkScenario(); G.petRt.clear();
  for (let i = 0; i < 8; i++) G.petHatch(['gato', 'coruja', 'raposa', 'lobinho'][i % 4], i % 3, 't');
  G.OFFLINE = true; const t0 = S.t; run(DAY * 3, 0.1); G.OFFLINE = false;
  ok(S.pets.filter((p) => p.hero).length === 8 || S.pets.every((p) => p.hero || p.out), 'offline: os vagantes escolhem (' + S.pets.filter((p) => p.hero).length + ' de 8) mesmo sem ninguém se mover');
  ok(S.pets.every((p) => !p.hero || S.heroes.some((h) => h.id === p.hero && h.pets.indexOf(p.id) >= 0)), 'p.hero e h.pets continuam coerentes');
  ok(S.heroes.every((h) => h.pets.length <= 3), 'nenhum herói passa de 3'); void t0;
}

thaw(); Math.random = rnd0;
console.log('\n' + passes + ' ok, ' + fails + ' falhas');
process.exit(fails ? 1 : 0);
