// Gera um save da v21 com mascotes comprados no Ateliê e vestidos: node save21.js <core21.js> <saida.json>
const fs = require('fs'), vm = require('vm');
let a = 13; Math.random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
vm.runInThisContext(fs.readFileSync(process.argv[2], 'utf8'));
const G = globalThis.G; G.W.init(); G.newGame(); const S = G.S;
if (G.VERSION !== '21.0') throw new Error('este gerador precisa do núcleo da v21');
for (let t = 0; t < 2 * G.DAY_SEC; t += 0.05) G.tick(0.05);
S.gold += 1e6; S.selos += 80; S.realm.lvl = Math.max(S.realm.lvl, 15); S.res.brasa = 5;
for (const id of ['p_gato', 'p_gato', 'p_raposa', 'p_draquinho', 'p_coruja', 't_rubro']) if (!G.cosBuy(id)) throw new Error('não comprou ' + id);
const [h0, h1, h2] = S.heroes;
G.cosWear(h0, 'pet', 'p_draquinho'); G.cosWear(h1, 'pet', 'p_gato'); G.cosWear(h2, 'pet', 'p_raposa'); G.cosWear(h0, 'traje', 't_rubro');
for (let t = 0; t < 60; t += 0.05) G.tick(0.05);
fs.writeFileSync(process.argv[3], G.serialize());
console.log('save21 ok dia', S.day, 'heróis', S.heroes.length, 'guarda-roupa', JSON.stringify(S.cos), 'vestidos', S.heroes.map((h) => h.cos.pet).join(','));
