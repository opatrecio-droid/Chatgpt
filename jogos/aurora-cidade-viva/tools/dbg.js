// depuração: causas das quedas e como os heróis gastam o tempo (com o robô jogando)
const fs = require('fs'), path = require('path'), vm = require('vm');
const SRC = path.join(__dirname, '..', 'src');
const ctx = vm.createContext({ console, Math, Date, JSON, Object, Array, Set, Map, Uint8Array, Int8Array, Float32Array, Int32Array, Uint32Array, Number, String, isFinite, parseInt, process, require, __dirname });
for (const f of ['00-core.js', '10-data.js', '20-world.js', '30-heroes.js', '31-monsters.js', '32-town.js', '33-meta.js']) vm.runInContext(fs.readFileSync(path.join(SRC, f), 'utf8'), ctx, { filename: f });
const G = ctx.G; G.W.init(); G.newGame(); const S = G.S;
const botSrc = fs.readFileSync(path.join(__dirname, 'sim.js'), 'utf8').match(/function bot\(\) \{[\s\S]*?\n\}\n/)[0];
ctx.STYLE = 'ativo'; ctx.mark = () => {}; ctx.S = S;
vm.runInContext(botSrc, ctx);
const by = {}, st = {}; const orig = G.heroFall;
const FROM = +process.argv[3] || 1;
G.heroFall = (h, m) => { const r = orig(h, m); if (r && S.day >= FROM) { const k = (m ? m.k + (m.elite ? '*' : '') + (m.raid ? ' MARÉ' : '') + (m.rift ? ' FENDA' : '') : 'dot') + ' L' + (m ? m.lvl : 0) + ' vs eff' + G.heroStats(h).eff + ' ' + h.cls + ' pot' + h.potions + ' est=' + h._ps; by[k] = (by[k] || 0) + 1; } return r; };
const DAYS = +process.argv[2] || 4; let bt = 0;
while (S.day <= DAYS) { for (const h of S.heroes) h._ps = h.state; G.tick(0.1); bt -= 0.1; if (bt <= 0) { bt = 8; ctx.bot(); } if (S.day >= FROM) for (const h of S.heroes) { const k = h.state === 'inside' ? 'in:' + h.act : h.state; st[k] = (st[k] || 0) + 1; } }
console.log(Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 30).map((e) => e[1] + '× ' + e[0]).join('\n'));
const tot = Object.values(st).reduce((a, b) => a + b, 0);
console.log('\ntempo: ' + Object.entries(st).sort((a, b) => b[1] - a[1]).map((e) => e[0] + ' ' + (100 * e[1] / tot).toFixed(1) + '%').join(', '));
console.log(S.heroes.map((h) => h.name + ' ' + h.cls + ' nv' + h.lvl + ' hp' + G.heroStats(h).hp + ' atk' + Math.round(G.heroStats(h).atk) + ' def' + Math.round(G.heroStats(h).def) + ' eff' + G.heroStats(h).eff + ' pot' + h.potions + ' $' + Math.round(h.gold) + ' gear ' + ['arma', 'armadura', 'acessorio'].map((k) => (h.gear[k] ? 'T' + h.gear[k].tier + 'r' + h.gear[k].rar : '-')).join('/') + ' zona ' + h.zone).join('\n'));
console.log('zonas', JSON.stringify(S.zones));
