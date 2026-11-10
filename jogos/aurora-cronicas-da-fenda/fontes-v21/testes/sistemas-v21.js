// Testes dos sistemas da v21 (sem tela)
const fs = require('fs'), vm = require('vm');
let a = 5; Math.random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
vm.runInThisContext(fs.readFileSync(process.argv[2], 'utf8'));
const G = globalThis.G; G.DEBUG = 1; const errs = []; const ce = console.error; console.error = (...x) => errs.push(x.map(String).join(' '));
const ok = (c, m) => { if (!c) { console.log('FALHOU:', m); process.exitCode = 1; } else console.log('ok  ', m); };
G.W.init();
/* save da v20 (gerado aqui mesmo, sem os campos da v21) */
G.newGame(); let S = G.S; for (let t = 0; t < 300; t += 0.05) G.tick(0.05);
const raw = JSON.parse(G.serialize()); delete raw.diff; delete raw.cos; delete raw.paths; delete raw.decorPos; for (const h of raw.heroes) { delete h.cos; delete h.autoArt; }
G.S = G.deserialize(JSON.stringify(raw)); G.afterLoad(); S = G.S;
ok(S.diff === 1 && S.cos && S.paths && S.decorPos && S.heroes.every((h) => h.cos && 'reliquia' in h.cos && h.autoArt === 0), 'save da v20: campos da v21 criados');

G.newGame(); S = G.S; S.gold = 1e9; S.selos = 900; S.nucleos = 900; S.realm.lvl = 30; for (const k in G.RES) S.res[k] = 1e5; for (const id of G.BLD_IDS) S.b[id] = { lvl: 10 }; G.dirtyAll();
const h = S.heroes[0], h2 = S.heroes[1];
/* guarda-roupa */
const shop = G.COS_IDS.filter((k) => G.COS[k].cost); let bought = 0; for (const id of shop) if (G.cosBuy(id)) bought++;
ok(bought === shop.length && bought === 16, 'Ateliê: ' + bought + ' peças compradas (6 trajes, 4 asas, 6 mascotes)');
ok(!G.cosBuy('r_presa') && !G.cosCan('r_presa').ok, 'relíquias não se compram');
const a0 = G.heroStats(h).atk; ok(G.cosWear(h, 'traje', 't_rubro') && G.heroStats(h).atk > a0 * 1.02, 'traje dá bônus de ataque');
ok(!G.cosWear(h2, 'traje', 't_rubro') && G.cosFree('t_rubro') === 0, 'uma cópia veste um herói por vez');
G.cosBuy('t_rubro'); ok(G.cosWear(h2, 'traje', 't_rubro') && G.cosInUse('t_rubro') === 2, 'segunda cópia veste outro herói');
ok(!G.cosWear(h, 'asas', 'p_gato') && G.cosWear(h, 'asas', 'a_fada') && G.cosWear(h, 'pet', 'p_raposa'), 'cada peça só entra no próprio espaço');
ok(G.cosWear(h, 'traje', null) && h.cos.traje === null && G.cosFree('t_rubro') === 1, 'tirar devolve a cópia');
/* relíquias */
S.zones.bosque.bossKills = 2; let got = 0; for (let i = 0; i < 40 && !got; i++) if (G.relicRoll('bosque', h)) got = 1;
S.cos = Object.assign({}, S.cos); delete S.cos.r_presa; S.zones.bosque.bossKills = 3;
ok(G.relicRoll('bosque', h) && G.cosOwned('r_presa') === 1 && G.cosWear(h, 'reliquia', 'r_presa'), 'relíquia garantida na 3ª vitória e equipável');
/* dificuldade */
const m1 = G.makeMon('lobo', 10, 30, 20, { zi: 0 }); ok(G.setDiff(3), 'troca para Pesadelo'); const m3 = G.makeMon('lobo', 10, 30, 20, { zi: 0 }); const mr = G.makeMon('lobo', 10, 30, 20, { rift: 1 });
ok(Math.abs(m3.hpMax / m1.hpMax - 1.8) < 0.02 && Math.abs(m3.atk / m1.atk - 1.55) < 0.02 && mr.hpMax === m1.hpMax, 'Pesadelo: +80% vida, +55% ataque; Fenda não muda');
S.realm.lvl = 3; G.setDiff(1); ok(!G.setDiff(2), 'Difícil trancado antes do Reino 4'); S.realm.lvl = 30;
/* enfeites móveis */
for (const d of G.DECOR) G.buyDecor(d.id);
ok(!G.decorCanPlace('estatua', 0, 10, 10).ok && !G.decorCanPlace('estatua', 0, 40, 46.5).ok && !G.decorCanPlace('estatua', 0, 44.5, 54.5).ok, 'recusa fora da cidade, na porta da Guilda e na fonte');
ok(!G.decorCanPlace('estatua', 0, 43.5, 41.5).ok, 'recusa junto ao portão');
ok(G.decorPlace('estatua', 0, 47.2, 55.3) && !G.W.walkable(47.5, 55.5) && G.W.walkable(38.5, 51.5), 'estátua movida: ladrilho novo bloqueado, o antigo liberado');
ok(!G.decorCanPlace('poco', 0, 47.2, 55.3).ok, 'dois enfeites não dividem o ladrilho');
ok(!G.decorPlace('fonte', 0, 40, 55), 'a Fonte das Luas não sai do lugar');
G.decorResetPos('estatua'); ok(!G.W.walkable(38.5, 51.5) && G.W.walkable(47.5, 55.5), 'restaurar posição original');
/* um beco: fechar a única passagem é recusado */
let sealed = 0, tried = 0; for (let y = 41; y < 67; y++) for (let x = 29; x < 59; x++) { const r = G.decorCanPlace('altar', 0, x + 0.5, y + 0.5); tried++; if (!r.ok && /Fecharia/.test(r.why)) sealed++; }
ok(tried > 500, 'varredura de ' + tried + ' ladrilhos sem erro (' + sealed + ' recusados por fechar passagem)');
/* Caminhos */
ok(G.pathsPending() >= 3, 'Caminhos prontos para resgate: ' + G.pathsPending());
const s0 = S.selos; ok(G.pathClaim('vestir') && S.selos === s0 + 2 && !G.pathClaim('vestir'), 'resgate de Caminho paga uma vez');
ok(G.PATHS.every((d) => { const v = G.pathCur(d); return v >= 0 && v <= d.n; }), 'os 18 Caminhos calculam progresso');
/* artes automáticas */
h.arts = {}; h.ap = 0; h.autoArt = 1; G.artGain(h, 7); ok(h.ap === 0 && G.artSpent(h) === 7, 'Artes automáticas gastam os pontos novos');
/* 3 dias no Pesadelo com tudo vestido */
G.setDiff(3); for (const x of S.heroes) { x.lvl = 40; x.rank = 4; x._dirty = true; x.hp = G.heroStats(x).hp; }
errs.length = 0; for (let t = 0; t < 3 * G.DAY_SEC; t += 0.05) G.tick(0.05);
ok(errs.length === 0, '3 dias no Pesadelo sem erros (' + errs.slice(0, 2).join(' / ') + ') · abates ' + S.stats.kills);
const rt = G.deserialize(G.serialize()); ok(rt.diff === 3 && rt.cos.t_rubro === 2 && rt.heroes[0].cos.asas === 'a_fada', 'salvar e carregar mantém guarda-roupa e dificuldade');
console.error = ce;
