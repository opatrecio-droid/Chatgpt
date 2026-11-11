// Gera um save da v22 com mascotes, Incursão vencida e espólio no chão: node save22.js <core22.js> <saida.json>
const fs = require('fs'), vm = require('vm');
let a = 17; Math.random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
vm.runInThisContext(fs.readFileSync(process.argv[2], 'utf8'));
const G = globalThis.G; G.W.init(); G.newGame(); const S = G.S;
if (G.VERSION !== '22.0') throw new Error('este gerador precisa do núcleo da v22');
for (let t = 0; t < 2 * G.DAY_SEC; t += 0.05) G.tick(0.05);
S.gold += 2e5; S.realm.lvl = Math.max(S.realm.lvl, 12); for (const id of ['taverna', 'hospedaria', 'enfermaria', 'mercado']) S.b[id] = { lvl: 7 }; S.b.cidadela = { lvl: 6 }; G.dirtyAll();
const [h0, h1] = S.heroes;
G.petAssign(G.petNew('raposa', 2), h0); G.petAssign(G.petNew('broto', 3), h1); G.petNew('gato', 0);
G.petOf(h0).bag = { couro: 4 }; G.petOf(h0).bagN = 4; S.inc.best.bosque = 2;
h1.wound = S.t + 100; h0.fome = 20;
for (let t = 0; t < 60; t += 0.05) G.tick(0.05);
fs.writeFileSync(process.argv[3], G.serialize());
console.log('save22 ok dia', S.day, 'heróis', S.heroes.length, 'mascotes', S.pets.map((p) => p.k + ':' + p.rar + (p.hero ? '→' + p.hero : '')).join(','));
