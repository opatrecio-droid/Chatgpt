const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const file = 'file://' + path.resolve(process.argv[2]);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto(file);
  await p.waitForSelector('#title.on', { timeout: 20000 });
  await p.screenshot({ path: (process.argv[3] || '.') + '/00-title.png' });
  await p.click('[data-a="t-new"]');
  await p.waitForTimeout(1200);
  // pula a apresentação
  for (let i = 0; i < 6; i++) { const s = await p.$('[data-a="tskip"]'); if (s) { await s.click(); await p.waitForTimeout(200); } }
  await p.waitForTimeout(800);
  await p.screenshot({ path: (process.argv[3] || '.') + '/01-guia.png' });
  const g = await p.$('[data-a="mclose"]'); if (g) await g.click();
  // estado avançado para exercitar tudo
  await p.evaluate(() => {
    const S = G.S; S.gold = 5e6; S.selos = 60; S.nucleos = 40; S.realm.lvl = 14;
    for (const k in G.RES) S.res[k] = (S.res[k] || 0) + (G.RES[k].emb ? 6 : 400);
    for (const id of G.BLD_IDS) S.b[id] = { lvl: id === 'cidadela' ? 6 : 5 };
    G.dirtyAll(); G.syncNpcs();
    const mk = (cls, lvl, rank, rar) => { const h = G.makeHero({ cls, lvl, rar }); h.rank = rank; h.gold = 3000; h._dirty = true; h.x = 44 + Math.random() * 3; h.y = 56; S.heroes.push(h); return h; };
    const a = S.heroes[0]; a.lvl = 44; a.rank = 4; a._dirty = true; a.ap = 37;
    mk('cav', 33, 3, 1); mk('pal', 25, 2, 2); mk('lad', 52, 5, 3);
    G.changeJob(a, 'duelista'); a.hp = G.heroStats(a).hp * 0.4;
    for (const [s, t] of G.heroSlots(a)) if (!a.gear[s] && s !== 'cinto') a.gear[s] = { id: G.uid(), type: t, tier: 3, rar: (s.length % 4), plus: s === 'elmo' ? 2 : 0 };
    a.bag = { gosma: 4, couro: 2, presa: 1, osso: 3, runa: 1, tomo: 1 }; a.bagN = 12; a._dirty = true;
    G.tame('cavalo'); G.tame('lobo'); G.tame('cervo'); G.mountAssign(S.stable.list[1], S.heroes[3]);
    G.buyDecor('canteiros'); G.buyDecor('estandartes'); G.buyDecor('fonte'); G.buyDecor('poco'); G.buyDecor('estatua'); G.buyDecor('relogio'); G.buyDecor('lampioes'); G.buyDecor('altar'); G.buyDecor('arco'); G.buyDecor('jardim'); G.buyDecor('arco');
    for (const t of ['espada', 'elmo', 'botas', 'luvas', 'cinto', 'sinete', 'anel', 'pesada']) G.craft(t, 2, t === 'sinete', true);
    S.inv[1].lock = 1; S.inv[2].plus = 3;
    G.emit('heroes'); G.S.paused = true;
  });
  const shot = async (name, fn, wait) => { await p.evaluate(fn); await p.waitForTimeout(wait || 450); await p.screenshot({ path: (process.argv[3] || '.') + '/' + name + '.png' }); };
  const hid = await p.evaluate(() => G.S.heroes[0].id);
  await shot('02-herois', () => G.UI.open('herois'));
  await shot('03-ficha', (0, eval)('(() => G.UI.open("herois", "lista", { hero: ' + hid + ' }))'));
  await p.evaluate(() => { document.querySelector('#sheet .sh-body').scrollTop = 420; }); await p.waitForTimeout(200); await p.screenshot({ path: (process.argv[3] || '.') + '/03b-ficha-baixo.png' });
  await shot('04-habil', () => G.UI.act('htab', ['habil']));
  await p.evaluate(() => { document.querySelector('#sheet .sh-body').scrollTop = 700; }); await p.waitForTimeout(200); await p.screenshot({ path: (process.argv[3] || '.') + '/04b-arvore.png' });
  await shot('05-artes', () => G.UI.act('htab', ['artes']));
  await p.evaluate(() => { document.querySelector('#sheet .sh-body').scrollTop = 330; }); await p.waitForTimeout(200); await p.screenshot({ path: (process.argv[3] || '.') + '/05b-artes.png' });
  await shot('06-mont', () => G.UI.act('htab', ['mont']));
  await shot('07-bolsa', () => G.UI.act('htab', ['bolsa']));
  await shot('08-decor', () => { G.UI.close(); G.UI.open('reino', 'decor'); });
  await shot('09-estabulo', () => G.UI.open('reino', 'estabulo'));
  await shot('10-mercado', () => G.UI.open('reino', 'mercado'));
  await shot('11-armazem', () => { G.UI.close(); G.UI.open('armazem', 'equip'); });
  await shot('12-armazem-esp', () => G.UI.open('armazem', 'especiais'));
  await shot('13-forja', () => { G.UI.close(); G.UI.open('forja', 'forjar'); });
  // modal de vocação
  await p.evaluate((0, eval)('(() => { G.UI.close(); G.UI.open("herois", "lista", { hero: ' + hid + ', ht: "habil" }); })')); await p.waitForTimeout(300);
  await shot('14-job-modal', (0, eval)('(() => G.UI.act("job", [' + hid + ', "mestre_laminas"]))'));
  await p.evaluate(() => { G.UI.closeModal(); G.UI.close(); G.S.paused = false; G.S.speed = 3; G.R.follow = 0; G.R.focus(44, 51); });
  await p.waitForTimeout(2500); await p.screenshot({ path: (process.argv[3] || '.') + '/15-praca.png' });
  await p.evaluate(() => { G.R.focus(58, 38); }); await p.waitForTimeout(1200); await p.screenshot({ path: (process.argv[3] || '.') + '/16-estabulo-mapa.png' });
  // segue o herói montado fora da cidade
  await p.evaluate(() => { const h = G.S.heroes[3]; h.order = 'bosque'; G.R.follow = h.id; }); await p.waitForTimeout(9000); await p.screenshot({ path: (process.argv[3] || '.') + '/17-montado.png' });
  await p.waitForTimeout(6000);
  const st = await p.evaluate(() => ({ t: Math.round(G.S.t), kills: G.S.stats.kills, states: G.S.heroes.map((h) => h.name + ':' + h.state).join(' ') }));
  console.log(JSON.stringify(st)); console.log('ERROS:', errs.length); for (const e of errs.slice(0, 8)) console.log(e);
  await b.close();
})();
