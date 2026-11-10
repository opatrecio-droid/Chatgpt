// gera um save da v19 depois de N dias (para testar migração)
const fs = require('fs'), vm = require('vm');
let a = 11; Math.random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
vm.runInThisContext(fs.readFileSync(process.argv[2], 'utf8'));
const G = globalThis.G; G.W.init(); G.newGame(); const S = G.S;
for (let t = 0; t < 5 * G.DAY_SEC; t += 0.05) { G.tick(0.05); if (Math.floor(t / 20) !== Math.floor((t - 0.05) / 20)) { for (const id of G.BLD_IDS) if (G.canUpgrade(id).ok) G.upgrade(id); for (const h of S.heroes) if (G.canPromote(h)) G.promote(h); } }
S.heroes[0].rank = 3; S.heroes[0].lvl = 35; S.heroes[1].stars = 1;
fs.writeFileSync(process.argv[3], G.serialize());
console.log('save19 ok dia', S.day, 'herois', S.heroes.length);
