// Testes dos sistemas da v23 (sem tela): node sistemas-v23.js <core23.js> <save22.json> <save21.json> <save19.json>
const fs = require('fs'), vm = require('vm');
let a = 23; const rng = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
Math.random = rng;
vm.runInThisContext(fs.readFileSync(process.argv[2], 'utf8'));
const G = globalThis.G; G.DEBUG = 1; const errs = []; const ce = console.error; console.error = (...x) => errs.push(x.map(String).join(' '));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FALHOU:', m); process.exitCode = 1; } else console.log('ok  ', m); };
const near = (x, y, e) => Math.abs(x - y) <= (e || 1e-9);
G.W.init();
let S;
const days = (n) => { for (let t = 0; t < n * G.DAY_SEC; t += 0.05) G.tick(0.05); };
const v23fields = () => S.svc && G.SVC_IDS.every((k) => S.svc[k] === 0) && Array.isArray(S.orders) && S.stats.svcT && G.SVC_IDS.every((k) => S.stats.svcT[k].length === 4) && S.heroes.every((h) => h.fedT === 0 || h.fedT > 0) && S.stats.waits >= 0;

/* ---------- 1. saves antigos ---------- */
const sv22 = JSON.parse(fs.readFileSync(process.argv[3], 'utf8')), petSig = (L) => L.map((p) => p.k + ':' + p.rar + ':' + p.hero + ':' + p.bagN).join(',');
G.S = G.deserialize(fs.readFileSync(process.argv[3], 'utf8')); G.afterLoad(); S = G.S;
const pets22 = petSig(S.pets);
ok(v23fields() && S.orders.length === 0, 'save v22: campos da v23 criados (degrau servido automático, sem encomendas)');
ok(S.pets.length === 3 && pets22 === petSig(sv22.pets) && G.petOf(S.heroes[0]).k === 'raposa' && S.heroes.every((x, i) => x.pet === sv22.heroes[i].pet) && S.inc.best.bosque === 2, 'save v22: mascotes com dono e carga, Graus das Incursões preservados (' + pets22 + ')');
ok(S.heroes[1].wound > S.t, 'save v22: o ferimento em curso continua');
G.afterLoad(); ok(S.pets.length === 3 && v23fields(), 'carregar de novo não duplica nada');
errs.length = 0; days(2); ok(errs.length === 0, 'save v22: 2 dias de jogo sem erro (' + errs.slice(0, 2).join(' / ') + ')');
G.S = G.deserialize(fs.readFileSync(process.argv[4], 'utf8')); G.afterLoad(); S = G.S;
ok(v23fields() && S.pets.length === 5, 'save v21: mascotes migrados pela v22 e campos da v23 criados');
errs.length = 0; days(1); ok(errs.length === 0, 'save v21: 1 dia sem erro');
G.S = G.deserialize(fs.readFileSync(process.argv[5], 'utf8')); G.afterLoad(); S = G.S;
ok(v23fields() && Array.isArray(S.pets), 'save v19: campos da v20 à v23 criados');
errs.length = 0; days(2); ok(errs.length === 0, 'save v19: 2 dias sem erro (' + errs.slice(0, 2).join(' / ') + ')');
G.newGame(); days(0.5);
const raw = JSON.parse(G.serialize()); delete raw.svc; delete raw.orders; delete raw.stats.svcT; delete raw.stats.waits; for (const h of raw.heroes) for (const k of ['fedT', 'fedA', 'fedX', 'restT', 'restF']) delete h[k];
G.S = G.deserialize(JSON.stringify(raw)); G.afterLoad(); S = G.S;
ok(v23fields() && S.heroes.every((h) => h.restT === 0 && h.fedA === 0), 'save sem os campos da v23 (v20/v22 gerado aqui): tudo criado');

/* ---------- 2. degraus liberados por nível ---------- */
const fresh = (lv) => {
  G.newGame(); S = G.S; S.gold = 1e9; S.selos = 900; S.nucleos = 900; S.realm.lvl = 30; for (const k in G.RES) S.res[k] = 1e4;
  for (const id of G.BLD_IDS) S.b[id] = { lvl: lv == null ? 10 : lv }; S.res.refeicao = 60; G.dirtyAll(); G.mons.length = 0;
};
fresh(10);
const opens = []; for (let l = 0; l <= 10; l++) opens.push(G.svcTiersOpen('taverna', l));
ok(opens.join(',') === '0,1,1,2,2,2,3,3,3,4,4', 'degraus liberados nos níveis 1, 3, 6 e 9: ' + opens.join(','));
ok(G.SVC_IDS.length === 3 && G.SVC_IDS.every((k) => G.SVC[k].tiers.length === 4 && G.SVC[k].tiers.every((t, i) => !i || (t.p > G.SVC[k].tiers[i - 1].p && t.r > G.SVC[k].tiers[i - 1].r))), 'cada cardápio tem 4 degraus, cada um mais caro e mais rápido que o anterior');
S.b.taverna.lvl = 4; ok(G.svcMax('taverna') === 1, 'Taverna nível 4 serve até o degrau 2 (' + G.SVC.taverna.tiers[1].name + ')');
ok(G.svcSet('taverna', 1) && G.svcMax('taverna') === 0 && !G.svcSet('taverna', 3) && !G.svcSet('taverna', 7), 'o jogador limita ao degrau 1; degrau ainda trancado ou inválido é recusado');
ok(G.svcSet('taverna', 0) && G.svcMax('taverna') === 1, 'de volta ao automático: o melhor liberado');
S.b.taverna.lvl = 0; ok(G.svcMax('taverna') === -1 && G.bldCap('taverna') === 0, 'prédio não construído não serve nada'); S.b.taverna.lvl = 10;

/* ---------- 3. escolha do degrau pelo ouro ---------- */
const h = S.heroes[0];
const reset = (x) => { x.state = 'town'; x.inside = null; x.lux = 0; x._waitB = null; x._waitN = 0; x.path = null; x.x = 44; x.y = 56; x.fome = 30; x.energia = 30; x.hp = G.heroStats(x).hp; x.wound = 0; x.dot = null; x.fedT = x.restT = 0; };
const arriveAt = (x, bid, act) => { x.state = 'goto'; x.dest = bid; x.act = act; x.path = null; G.updateHero(x, 0.05, []); return x.state; };
const runInside = (x, max) => { let t = 0; while (x.state === 'inside' && t < (max || 120)) { S.t += 0.05; t += 0.05; G.updateHero(x, 0.05, []); } return t; };
h.lvl = 20; h._dirty = true; reset(h);
const fee = (i) => G.svcFee(h, 'taverna', i);
ok(fee(0) === G.price(h, 'meal') && fee(1) > fee(0) && fee(3) > fee(2), 'taxas da Taverna para um herói Nv 20: ' + [0, 1, 2, 3].map(fee).join(' · ') + ' moedas');
h.gold = fee(3); let ref0 = S.res.refeicao; arriveAt(h, 'taverna', 'eat');
ok(h.state === 'inside' && h._svcI === 3 && h.gold === 0 && ref0 - S.res.refeicao === 3, 'com ouro para o Banquete, pede o Banquete (gasta 3 refeições e paga ' + fee(3) + ')');
runInside(h); reset(h);
h.gold = fee(3) - 1; arriveAt(h, 'taverna', 'eat'); ok(h._svcI === 2 && h.gold === fee(3) - 1 - fee(2), 'um pouco menos de ouro: o Assado (degrau 3)'); runInside(h); reset(h);
h.gold = fee(1); arriveAt(h, 'taverna', 'eat'); ok(h._svcI === 1, 'só o bastante para o Ensopado: degrau 2'); runInside(h); reset(h);
const earn0 = S.rep.today.servicos || 0; h.gold = 0; h.fome = 10; ref0 = S.res.refeicao; arriveAt(h, 'taverna', 'eat');
ok(h.state === 'inside' && h._svcI === 0 && (S.rep.today.servicos || 0) === earn0 && ref0 - S.res.refeicao === 1, 'sem moedas: atendido no degrau 1, de graça, como sempre foi');
runInside(h); ok(h.fome > 70 && h.state === 'town', 'herói sem ouro saiu de barriga cheia (saciedade ' + Math.round(h.fome) + ')'); reset(h);
h.gold = 3; arriveAt(h, 'taverna', 'eat'); ok(h._svcI === 0 && h.gold === 0, 'ouro menor que a taxa do Caldo: paga o que tem'); runInside(h); reset(h);
h.gold = 1e6; S.res.refeicao = 5; arriveAt(h, 'taverna', 'eat'); ok(h._svcI === 2, 'estoque baixo (5): o Banquete, que gasta 3, só sai com 6 ou mais — serve o Assado'); runInside(h); reset(h);
S.res.refeicao = 60; G.svcSet('taverna', 2); h.gold = 1e6; arriveAt(h, 'taverna', 'eat'); ok(h._svcI === 1, 'o jogador limitou a Taverna ao degrau 2: o herói rico come o Ensopado'); runInside(h); reset(h); G.svcSet('taverna', 0);
const gEarn = S.rep.today.servicos || 0; h.gold = 1e6; arriveAt(h, 'taverna', 'eat'); ok((S.rep.today.servicos || 0) - gEarn === fee(3), 'a taxa vai para o cofre como «Serviços aos heróis»'); runInside(h); reset(h);
const durs = [0, 1, 2, 3].map((i) => G.svcEatDur(i)), fills = [0, 1, 2, 3].map((i) => 22 * G.SVC.taverna.tiers[i].r * durs[i]);
ok(durs.every((d, i) => !i || d < durs[i - 1]) && fills.every((f, i) => !i || f > fills[i - 1]), 'degraus altos enchem mais e mais rápido: ' + fills.map((f, i) => Math.round(f) + ' em ' + durs[i].toFixed(1) + ' s').join(' · '));
/* Hospedaria e Enfermaria também escolhem pelo ouro */
h.gold = G.svcFee(h, 'hospedaria', 2); h.energia = 20; arriveAt(h, 'hospedaria', 'rest'); ok(h._svcI === 2 && h.gold === 0, 'Hospedaria: ouro exato para o Aposento do Vigia');
const tR = runInside(h); ok(h.energia >= 99.9 && tR < 30, 'descansou de 20 a 100 de vigor em ' + tR.toFixed(1) + ' s'); reset(h);
h.gold = 0; h.energia = 20; arriveAt(h, 'hospedaria', 'rest'); ok(h.state === 'inside' && h._svcI === 0, 'Hospedaria sem ouro: Catre do Viajante, atendido'); const tR0 = runInside(h); ok(tR0 > tR, 'o Catre é mais lento (' + tR0.toFixed(1) + ' s)'); reset(h);

/* ---------- 4. efeitos: bem alimentado e descansado ---------- */
const a0 = G.heroMod(h).a; h.gold = 1e6; h.fome = 20; arriveAt(h, 'taverna', 'eat'); ok(!(h.fedT > S.t), 'o efeito ainda não vale enquanto come');
runInside(h); const T3 = G.SVC.taverna.tiers[3];
ok(near(h.fedT - S.t, T3.fed.t, 0.06) && h.fedA === T3.fed.atk && h.fedX === T3.fed.xp, 'Banquete: bem alimentado por ' + T3.fed.t + ' s (+' + T3.fed.atk * 100 + '% ataque, +' + T3.fed.xp * 100 + '% exp.)');
ok(near(G.heroMod(h).a / a0, 1 + T3.fed.atk, 1e-9), 'bem alimentado: ataque × ' + (1 + T3.fed.atk));
const xpGain = (fed) => { h.fedT = fed ? S.t + 50 : 0; h.xp = 0; G.giveXp(h, 1); return h.xp; };
const xpF = xpGain(true) / xpGain(false), st0 = G.heroStats(h), base = 1 + G.traitSum(h, 'xp') + st0.xpF;
ok(near(xpF, (base + T3.fed.xp) / base, 1e-9), 'bem alimentado: experiência × ' + xpF.toFixed(3));
h.fedT = S.t + 2; h.fedA = 0.09; ok(/Bem alimentado/.test(G.effText(h)), 'a ficha mostra «' + G.effText(h) + '»');
S.t += 3; ok(near(G.heroMod(h).a, a0) && !/Bem alimentado/.test(G.effText(h)), 'o efeito expira e o ataque volta ao normal');
h.fedT = S.t + 100; h.fedA = 0.09; h.fedX = 0.1; G.svcSet('taverna', 2); h.fome = 20; arriveAt(h, 'taverna', 'eat'); runInside(h);
ok(h.fedA === 0.09 && h.fedT > S.t + 90, 'um prato mais fraco não apaga o banquete que ainda vale'); G.svcSet('taverna', 0); reset(h);
const tire = (rested) => { reset(h); h.restT = rested ? S.t + 100 : 0; h.restF = 0.35; h.state = 'idle'; h.until = S.t + 1e3; h.energia = 80; for (let i = 0; i < 40; i++) { S.t += 0.05; G.updateHero(h, 0.05, []); } return 80 - h.energia; };
const d0 = tire(false), d1 = tire(true);
ok(near(d1 / d0, 0.65, 1e-6), 'descansado (Suíte): cansa 35% mais devagar (' + d0.toFixed(3) + ' → ' + d1.toFixed(3) + ')');
reset(h); h.gold = 1e6; h.energia = 10; arriveAt(h, 'hospedaria', 'rest'); runInside(h); const T4 = G.SVC.hospedaria.tiers[3];
ok(h._svcI === 3 || (near(h.restT - S.t, T4.rest.t, 0.06) && h.restF === T4.rest.f), 'Suíte das Duas Luas: descansado por ' + T4.rest.t + ' s');
S.t += T4.rest.t + 1; ok(near(tire(false), d0, 1e-9) && !(h.restT > S.t), 'descansado expira');

/* ---------- 5. Enfermaria: cura que tira ferimento e veneno ---------- */
const hurt = () => { reset(h); h.hp = G.heroStats(h).hp * 0.5; h.wound = S.t + 150; h.dot = { dps: 1, until: S.t + 4, c: '#9be08a' }; h.gold = 1e6; };
S.b.enfermaria.lvl = 3; hurt(); arriveAt(h, 'enfermaria', 'heal');
ok(h._svcI === 1 && h.dot === null && h.wound > S.t, 'Enfermaria nível 3 (Compressa de Ervas): tira o veneno, o ferimento fica');
ok(!G.svcCures(h), 'nível 3: a Enfermaria ainda não tira ferimento'); runInside(h);
S.b.enfermaria.lvl = 6; hurt(); ok(G.svcCures(h), 'nível 6: tira'); arriveAt(h, 'enfermaria', 'heal');
ok(h._svcI === 2 && h.dot === null && h.wound === 0 && G.heroMod(h).d === 1, 'Sutura de Prata: tira ferimento e veneno na hora (defesa volta a 100%)');
const tH = runInside(h); ok(h.hp >= G.heroStats(h).hp - 1e-6, 'curou 50% da vida em ' + tH.toFixed(1) + ' s');
S.b.enfermaria.lvl = 10; hurt(); h.energia = 40; arriveAt(h, 'enfermaria', 'heal'); runInside(h); ok(h._svcI === 3 && h.energia >= 69.5, 'Elixir da Fonte: +30 de vigor ao sair (' + Math.round(h.energia) + ')');
/* ferido de vida cheia procura a Enfermaria que sabe tirar o ferimento */
const calm = () => { reset(h); h.lvl = G.RANK_CAP[h.rank]; h._dirty = true; h.hp = G.heroStats(h).hp; h.fome = 100; h.energia = 100; h.animo = 95; h.potions = G.potCap(h); h.bag = {}; h.bagN = 0; S.inv.length = 0; h.gold = 1e5; h.wound = S.t + 150; };
calm(); S.b.enfermaria.lvl = 6; G.heroDecide(h); ok(h.dest === 'enfermaria' && h.act === 'heal', 'ferido de vida cheia vai à Enfermaria que tira ferimento');
calm(); S.b.enfermaria.lvl = 3; G.heroDecide(h); ok(h.state === 'travel', 'com a Enfermaria nível 3, segue para a caçada');
calm(); S.b.enfermaria.lvl = 6; G.svcSet('enfermaria', 2); G.heroDecide(h); ok(h.state === 'travel', 'limitada ao degrau 2 pelo jogador, também não'); G.svcSet('enfermaria', 0);
h.lvl = 20; h._dirty = true;

/* ---------- 6. lotação ---------- */
fresh(10); S.b.taverna.lvl = 1; S.b.enfermaria.lvl = 1; G.dirtyAll();
ok(G.bldCap('taverna') === 4 && G.bldCap('enfermaria') === 4 && G.bldCap('hospedaria') === 13 && G.bldCap('treino') === 10 && G.bldCap('guilda') === 0, 'lotação: Taverna e Enfermaria Nv 1 → 4, Hospedaria Nv 10 → 13, Treino Nv 10 → 10, Guilda sem limite');
ok([1, 2, 3, 5, 10].every((l) => { S.b.taverna.lvl = l; return G.bldCap('taverna') >= 3 + l && G.bldCap('taverna') >= G.heroCap() - (10 - l); }), 'Taverna, Hospedaria e Enfermaria comportam tantos heróis quanto a Hospedaria do mesmo nível'); S.b.taverna.lvl = 1;
while (S.heroes.length < G.heroCap()) G.hire(G.rollCandidates('gold')[0]);
const hs = S.heroes; for (const x of hs) reset(x);
for (let i = 0; i < 4; i++) { const x = hs[i]; x.state = 'inside'; x.inside = 'taverna'; x.act = 'eat'; x.until = S.t + 100; }
const w = hs[5]; reset(w); w.fome = 30; const wt0 = S.stats.waits;
arriveAt(w, 'taverna', 'eat'); ok(w.state === 'idle' && w._waitB === 'taverna' && S.stats.waits === wt0 + 1 && G.stateLabel(w) === 'Esperando vaga: Taverna', 'Taverna cheia (4/4): o herói espera na porta («' + G.stateLabel(w) + '»)');
ok(G.bldWho('taverna').waiting.indexOf(w) >= 0 && G.bldWho('taverna').inside.length === 4, 'o painel vê 4 lá dentro e 1 esperando');
arriveAt(w, 'taverna', 'eat'); ok(w.state === 'idle' && w._waitN === 2, 'segunda tentativa: espera de novo');
const ex0 = S.stats.svcExtra; arriveAt(w, 'taverna', 'eat'); ok(w.state === 'inside' && S.stats.svcExtra === ex0 + 1, 'terceira tentativa: atendido mesmo lotado (ninguém fica sem comer)');
const st6 = hs[6]; reset(st6); st6.fome = 0; arriveAt(st6, 'taverna', 'eat'); ok(st6.state === 'inside', 'saciedade zerada passa na frente');
for (let i = 0; i < 4; i++) { const x = hs[7 + i]; x.state = 'inside'; x.inside = 'enfermaria'; x.act = 'heal'; x.until = S.t + 100; }
const cr = hs[11]; reset(cr); cr.hp = G.heroStats(cr).hp * 0.2; arriveAt(cr, 'enfermaria', 'heal'); ok(cr.state === 'inside', 'Enfermaria cheia: vida crítica (20%) é atendida na hora');
const md = hs[12]; reset(md); md.hp = G.heroStats(md).hp * 0.5; arriveAt(md, 'enfermaria', 'heal'); ok(md.state === 'idle' && md._waitB === 'enfermaria', 'Enfermaria cheia: vida em 50% espera');
/* caído não passa pela porta: vai direto para a recuperação */
md.state = 'fallen'; md.until = S.t - 1; G.updateHero(md, 0.05, []); ok(md.state === 'recover' && md.inside === 'enfermaria' && G.bldWho('enfermaria').recover.indexOf(md) >= 0, 'caído vai para a recuperação mesmo com a Enfermaria lotada');

/* ---------- 7. muitos heróis famintos e feridos por 2 dias: lotação respeitada e ninguém travado ---------- */
fresh(10); S.b.taverna.lvl = 1; S.b.enfermaria.lvl = 1; S.b.hospedaria.lvl = 12; S.realm.lvl = 12; G.dirtyAll();
while (S.heroes.length < G.heroCap()) G.hire(G.rollCandidates('gold')[0]);
for (const x of S.heroes) { reset(x); x.lvl = 12; x._dirty = true; x.fome = 25; x.energia = 15; x.hp = G.heroStats(x).hp * 0.45; x.gold = G.ri(0, 600); x.tThink = Math.random(); }
const N = S.heroes.length, sa0 = G.svcArrive, byp = new Set();
G.svcArrive = (x, st, pay, enter) => { const full = G.bldCap(x.dest) && G.bldIn(x.dest) >= G.bldCap(x.dest); sa0(x, st, pay, enter); if (full && x.state === 'inside') byp.add(x); };
const out = new Set(), stuck = {}, maxStuck = {}; let over = 0, peak = { taverna: 0, enfermaria: 0, hospedaria: 0 }, served = 0;
errs.length = 0;
for (let t = 0; t < 2 * G.DAY_SEC; t += 0.05) {
  G.tick(0.05); if (S.res.refeicao < 6) S.res.refeicao = 12;
  for (const x of S.heroes) {
    if (x.state !== 'inside') byp.delete(x);
    if (['hunt', 'travel'].includes(x.state)) out.add(x.id);
    const inTown = ['town', 'idle', 'goto', 'inside'].includes(x.state) && !S.mare.active;
    stuck[x.id] = inTown ? (stuck[x.id] || 0) + 0.05 : 0; maxStuck[x.id] = Math.max(maxStuck[x.id] || 0, stuck[x.id]);
  }
  for (const b of ['taverna', 'enfermaria', 'hospedaria']) { const n = G.bldIn(b); peak[b] = Math.max(peak[b], n); let nb = 0; for (const x of S.heroes) if (x.state === 'inside' && x.inside === b && !byp.has(x)) nb++; if (nb > G.bldCap(b)) over++; }
}
G.svcArrive = sa0; served = G.SVC_IDS.reduce((s, k) => s + S.stats.svcT[k].reduce((p, q) => p + q, 0), 0);
const worst = Math.max(...Object.values(maxStuck));
ok(over === 0, N + ' heróis por 2 dias: a lotação nunca passou do limite fora das exceções (picos: Taverna ' + peak.taverna + '/4, Enfermaria ' + peak.enfermaria + '/4, Hospedaria ' + peak.hospedaria + '/' + G.bldCap('hospedaria') + ')');
ok(out.size === N, 'todos os ' + N + ' heróis voltaram a caçar (' + out.size + '/' + N + ')');
ok(worst < 240, 'nenhum herói ficou travado na cidade: maior permanência seguida ' + worst.toFixed(0) + ' s · esperas ' + S.stats.waits + ' · atendidos lotados ' + S.stats.svcExtra + ' · serviços ' + served);
ok(errs.length === 0, '2 dias de fila sem erros (' + errs.slice(0, 2).join(' / ') + ')');

/* ---------- 8. reerguer: custo pela dificuldade ---------- */
fresh(5); const r = S.heroes[0]; r.lvl = 30; r._dirty = true; const base2 = G.price(r, 'revive') * 2;
const costs = [0, 1, 2, 3].map((d) => G.reviveCost(r, d));
ok(costs[1] === base2 && costs[0] < costs[1] && costs[3] > costs[2] && costs[2] > costs[1], 'reerguer um herói Nv 30: Fácil ' + costs[0] + ' · Normal ' + costs[1] + ' (igual à v22) · Difícil ' + costs[2] + ' · Pesadelo ' + costs[3]);
ok(costs.every((c, i) => c === Math.round(base2 * G.REVIVE_DIFF[i])), 'multiplicadores ' + G.REVIVE_DIFF.join(' / '));
S.realm.lvl = 30; G.setDiff(3); ok(G.reviveCost(r) === costs[3], 'no Pesadelo, o custo do reino é o do Pesadelo');
r.state = 'recover'; r.reviveAt = S.t + 100; S.gold = costs[3] - 1; ok(!G.reviveNow(r) && r.state === 'recover', 'sem moedas suficientes, não reergue');
ok(G.healCost(r) === costs[3], 'o botão de cura da ficha usa o mesmo custo');
S.gold = costs[3]; const out0 = S.rep.today['-cura'] || 0; S.b.enfermaria.lvl = 5;
ok(G.reviveNow(r) && S.gold === 0 && r.state === 'town' && (S.rep.today['-cura'] || 0) - out0 === costs[3], 'reergueu no Pesadelo pagando ' + costs[3]);
ok(near(r.hp / G.heroStats(r).hp, 0.72, 1e-9), 'Enfermaria nível 5: volta com 72% da vida');
ok(G.reviveHp(0) === 0.6 && G.reviveHp(1) === 0.6 && near(G.reviveHp(5), 0.72) && G.reviveHp(10) === 0.85, 'vida ao voltar: 60% sem Enfermaria, 57% + 3% por nível, até 85%');
ok(G.reviveTimeAt(30, 5) < G.reviveTimeAt(30, 4) && near(G.reviveTimeAt(30, 5), (70 + 75) / 2.5 / (1 + G.decorV('altar'))), 'tempo natural de recuperação (Nv 30, Enfermaria 5): ' + G.reviveTimeAt(30, 5).toFixed(0) + ' s');
G.setDiff(0); ok(G.reviveCost(r) === costs[0], 'no Fácil, metade');

/* ---------- 9. encomendas da caravana ---------- */
fresh(5); S.realm.lvl = 1; S.b.mercado.lvl = 0; S.gold = 1e6;
ok(!G.ordCan('couro', 10).ok, 'sem Mercado, não há encomenda');
S.b.mercado.lvl = 4; G.dirtyAll();
ok(G.ordSlots() === 2 && G.ordMax('couro') === 400 && G.ordMax('presa') === 40, 'Mercado nível 4: 2 encomendas em aberto, até 400 comuns ou 40 raros por pedido');
ok(G.ordItems().join(',') === 'gosma,couro,presa' && !G.ordCan('osso', 10).ok, 'Reino 1: só os materiais do Bosque (zonas trancadas ficam de fora)');
ok(['emb1', 'tomo', 'alma', 'po_estelar', 'madeira', 'refeicao'].every((k) => !G.ordOk(k)), 'emblemas, Tomos, Cristais de Alma, Pó Estelar e matéria-prima não se encomendam');
const pc = G.ordPrice('couro'), pr = G.ordPrice('presa');
ok(pc > G.sellPrice('couro') * 4 && pr / G.RES.presa.base > 2.5 * pc / G.RES.couro.base, 'preço bem acima da venda: Couro ' + pc + ' (vende a ' + G.sellPrice('couro') + '), Presa ' + pr + ' (vende a ' + G.sellPrice('presa') + ')');
let g0 = S.gold; const o1 = G.ordPlace('couro', 100);
ok(o1 && S.gold === g0 - G.ordCost('couro', 100) && o1.gold === G.ordCost('couro', 100) && S.orders.length === 1 && (S.rep.today['-encomendas'] || 0) === o1.gold, 'encomenda de 100 Couro paga na hora: ' + o1.gold + ' moedas');
ok(!G.ordCan('couro', 401).ok && !G.ordCan('presa', 41).ok && !G.ordCan('couro', 0).ok, 'quantidade acima do limite ou zero é recusada');
const o2 = G.ordPlace('presa', 10); ok(o2 && !G.ordCan('gosma', 10).ok && /Limite/.test(G.ordCan('gosma', 10).why), 'segunda encomenda aceita; a terceira passa do limite de 2');
S.gold = 5; ok(!G.ordCan('gosma', 10).ok, 'sem moedas, não encomenda'); S.gold = 1e6;
g0 = S.gold; const back = G.ordCancel(o2.id);
ok(back === Math.floor(o2.gold * 0.75) && S.gold === g0 + back && S.orders.length === 1, 'cancelar devolve 75%: ' + back + ' de ' + o2.gold);
ok(G.ordCancel(o2.id) === 0, 'cancelar de novo não devolve nada');
const o3 = G.ordPlace('gosma', 30);
const js = G.serialize(); G.S = G.deserialize(js); G.afterLoad(); S = G.S;
ok(S.orders.length === 2 && S.orders[0].k === 'couro' && S.orders[0].n === 100 && S.orders[1].k === 'gosma' && S.orders[1].gold === o3.gold, 'salvar e carregar mantém as encomendas em aberto');
S.clock = 600; const c0 = S.res.couro, gs0 = S.res.gosma, d0n = S.day; const contr = S.daily.list.map((c) => c.p).join(',');
for (let i = 0; i < 2000 && S.clock < 1400 && S.day === d0n; i++) G.updateTown(0.5);
ok(S.orders.length === 2 && S.res.couro === c0, 'antes da alvorada nada chega');
let guard = 0; while (S.day === d0n && guard++ < 5000) G.updateTown(0.5);
ok(S.day === d0n + 1 && S.clock >= 360 && S.orders.length === 0 && S.res.couro === c0 + 100 && S.res.gosma === gs0 + 30 && S.stats.ordDone === 2, 'na alvorada a caravana entrega tudo no Armazém (+100 Couro, +30 Gosma)');
ok(S.log.slice(-12).some((l) => /caravana chegou/.test(l.m)), 'a crônica avisa a entrega');
void contr;

/* ---------- 10. três dias com tudo ligado ---------- */
fresh(6); S.realm.lvl = 12; for (const x of S.heroes) { x.lvl = 25; x.rank = 2; x._dirty = true; x.hp = G.heroStats(x).hp; x.gold = 3000; }
G.svcSet('hospedaria', 2); G.ordPlace('osso', 50); G.ordPlace('couro', 60);
errs.length = 0; days(3);
const tot = G.SVC_IDS.map((k) => k + ' ' + S.stats.svcT[k].join('/')).join(' · ');
ok(errs.length === 0 && S.orders.length === 0 && S.stats.svcT.hospedaria[3] === 0, '3 dias com cardápios, limite do jogador e encomendas, sem erros (' + tot + ')');
console.error = ce;
console.log(fails ? fails + ' verificação(ões) falharam' : 'todas as verificações da v23 passaram');
