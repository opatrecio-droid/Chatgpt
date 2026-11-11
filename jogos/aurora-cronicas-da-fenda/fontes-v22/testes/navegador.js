// Teste no navegador (Playwright): node navegador.js <v22.html> <pasta-das-capturas> [save21.json] [v21.html]
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
(async () => {
  const [file, out, save21, file21] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const errs = []; const watch = (p) => { p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); }); };
  const mk = async (w, h) => { const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: true, hasTouch: true }); const p = await ctx.newPage(); watch(p); return p; };
  const log = (...x) => console.log(...x);
  let p = await mk(412, 915);
  const shot = async (n) => { await p.waitForTimeout(350); await p.screenshot({ path: out + '/' + n + '.png' }); };
  const scr = async (fn, y) => { await p.evaluate(fn); if (y != null) await p.evaluate((yy) => { const el = document.querySelector('#sheet .sh-body'); if (el) el.scrollTop = yy; }, y); };
  /* 1. jogo novo e guias */
  await p.goto('file://' + path.resolve(file)); await p.waitForSelector('#title.on');
  log('título:', await p.evaluate(() => document.querySelector('#title .ver').textContent));
  await p.click('[data-a="t-new"]'); await p.waitForTimeout(900);
  for (let i = 0; i < 6; i++) { const s = await p.$('[data-a="tskip"]'); if (s) { await s.click(); await p.waitForTimeout(200); } }
  const guides = [];
  for (let i = 0; i < 4; i++) { await p.waitForTimeout(700); const t = await p.evaluate(() => (G.UI.modalOpen ? document.querySelector('#modal .eyebrow') && document.querySelector('#modal .eyebrow').textContent : '')); if (!t) break; guides.push(t); if (/Companheiros/.test(t)) await shot('01-guia-v22'); const g = await p.$('#modal.on [data-a="mclose"]'); if (g) await g.click(); }
  log('guias:', guides.join(' | '), '· seen.v22 =', await p.evaluate(() => G.S.tut.seen.v22));
  /* 2. espólio no chão: aparece e é recolhido por toque real */
  await p.evaluate(() => {
    const S = G.S; S.paused = true; G.R.follow = 0; G.UI.inspect(null);
    S.heroes.forEach((h, i) => { h.state = 'idle'; h.until = 1e9; h.x = 40 + i * 4; h.y = 57; h.path = null; });
    G.R.focus(44, 51, true);
    const a = G.dropAdd(44, 51, 'couro', 3, 0), b2 = G.dropAdd(44.6, 51.2, 'gosma', 2, 0), c = G.dropAdd(41, 49, 'presa', 1, 0);
    a.x = 44; a.y = 51; b2.x = 44.7; b2.y = 51.1; c.x = 41; c.y = 49.5;
  });
  await shot('02-espolio-no-chao');
  const before = await p.evaluate(() => ({ couro: G.S.res.couro || 0, gosma: G.S.res.gosma || 0, presa: G.S.res.presa || 0, n: G.drops.length, picked: G.S.stats.picked }));
  const pt = await p.evaluate(() => G.R.worldToScreen(44, 51 - 0.35));
  await p.touchscreen.tap(pt[0], pt[1]); await p.waitForTimeout(250); await shot('03-toque-recolheu');
  const after = await p.evaluate(() => ({ couro: G.S.res.couro || 0, gosma: G.S.res.gosma || 0, presa: G.S.res.presa || 0, n: G.drops.length, picked: G.S.stats.picked }));
  log('toque no espólio:', JSON.stringify(before), '→', JSON.stringify(after), after.couro === before.couro + 3 && after.gosma === before.gosma + 2 && after.n === 1 ? 'OK' : 'FALHOU');
  /* 3. mascote indo buscar item no campo */
  const fetch = await p.evaluate(() => {
    const S = G.S, h = S.heroes[0]; S.pets.length = 0; for (const x of S.heroes) x.pet = 0; G.drops.length = 0;
    const pet = G.petNew('raposa', 2); G.petAssign(pet, h);
    h.state = 'hunt'; h.until = 0; h.x = 44; h.y = 22; h.path = null; h.tgt = null; h.zone = 'bosque';
    for (const m of G.mons) m.gone = true; G.mons.length = 0;
    const d = G.dropAdd(46.5, 23, 'couro', 2, h.id); d.x = 46.5; d.y = 23;
    G.R.focus(45, 22, true); G.R.setZoom(G.R.cam.zf * 1.6, 206, 457); S.paused = false; S.speed = 1;
    window._petTest = { id: pet.id }; return pet.id;
  });
  await p.evaluate(() => { const h = G.S.heroes[0]; h._hold = setInterval(() => { h.state = 'hunt'; h.x = 44; h.y = 22; h.path = null; h.tgt = null; h.tThink = 9; }, 30); });
  await p.waitForTimeout(500); await shot('04-mascote-indo');
  await p.waitForTimeout(1600); await shot('05-mascote-voltando');
  const pr = await p.evaluate((id) => { const pet = G.petById(id), r = G.petRt.get(id); clearInterval(G.S.heroes[0]._hold); return { bagN: pet.bagN, st: r && r.st, x: r && +r.x.toFixed(1), drops: G.drops.length }; }, fetch);
  log('mascote buscou o item:', JSON.stringify(pr), pr.bagN === 2 && pr.drops === 0 ? 'OK' : 'FALHOU');
  /* 4. fichas e painéis */
  await p.evaluate(() => {
    const S = G.S; S.paused = true; S.gold = 5e6; S.selos = 80; S.nucleos = 40; S.realm.lvl = 15;
    for (const k in G.RES) S.res[k] = (S.res[k] || 0) + (G.RES[k].emb ? 6 : 400);
    for (const id of G.BLD_IDS) S.b[id] = { lvl: id === 'cidadela' ? 6 : 5 }; G.dirtyAll(); G.syncNpcs();
    S.pets.length = 0; for (const x of S.heroes) x.pet = 0;
    const want = [['draquinho', 4], ['medusa', 3], ['jabuti', 0], ['sapo', 1], ['gato', 0], ['gato', 0], ['broto', 0], ['olho', 3], ['fenix', 5]];
    for (const [k, r] of want) G.petNew(k, r);
    G.petAssign(S.pets[0], S.heroes[0]); G.petAssign(S.pets[1], S.heroes[1]); S.pets[0].bag = { couro: 5, presa: 1 }; S.pets[0].bagN = 6;
    const a = S.heroes[0]; a.lvl = 44; a.rank = 4; a._dirty = true; for (const id of ['t_rubro', 'a_draco']) G.cosBuy(id); G.cosWear(a, 'traje', 't_rubro'); G.cosWear(a, 'asas', 'a_draco');
    G.emit('heroes'); G.UI.open('herois', 'lista', { hero: a.id });
  });
  await shot('06-ficha');
  await p.click('.dside [data-a^="petpick:"]'); await p.waitForTimeout(400); await shot('07-escolha-mascote');
  const nOpts = await p.evaluate(() => document.querySelectorAll('#modal [data-a^="petset:"]').length);
  log('escolha de mascote: botões =', nOpts);
  await p.click('#modal [data-a^="petset:' + (await p.evaluate(() => G.S.heroes[0].id)) + ':' + (await p.evaluate(() => G.S.pets[7].id)) + '"]'); await p.waitForTimeout(300);
  log('trocou para:', await p.evaluate(() => G.PETS[G.petOf(G.S.heroes[0]).k].name), '· o anterior ficou livre:', await p.evaluate(() => G.S.pets[0].hero === 0 && G.S.pets[0].bagN === 0));
  await p.evaluate(() => G.UI.closeModal());
  await scr(() => G.UI.act('htab', ['bolsa']), 520); await shot('08-bolsa');
  await scr(() => { G.UI.close(); G.UI.open('armazem', 'atelie'); }); await p.evaluate(() => { const el = document.getElementById('viveiro'); if (el) el.scrollIntoView({ block: 'start' }); }); await shot('09-viveiro');
  await p.click('[data-a="petfuse:0"]'); await p.waitForTimeout(350); await shot('10-fusao');
  const fused = await p.evaluate(() => { const n0 = G.S.pets.length; return n0; });
  await p.click('#modal [data-a^="fgo:"]'); await p.waitForTimeout(400);
  log('fusão pela tela:', fused, '→', await p.evaluate(() => G.S.pets.length), 'mascotes · fusões', await p.evaluate(() => G.S.stats.fusions));
  await scr(() => { G.UI.close(); G.UI.open('missoes', 'incursoes'); }, 0); await shot('11-incursoes');
  await scr(() => {}, 520); await shot('12-incursoes-grupo');
  await scr(() => { G.UI.close(); G.UI.open('missoes', 'caminhos'); }, 0); await shot('13-caminhos');
  await scr(() => { G.UI.close(); G.UI.open('reino', 'mercado'); G.S.mascate.offers[0] = { id: 'ovo', rar: 1, n: 1, gold: 6000, sold: 0 }; G.UI.redraw(); }); await p.evaluate(() => { const el = document.querySelector('[data-a="masc:0"]'); if (el) el.scrollIntoView({ block: 'center' }); }); await shot('14-mascate-ovo');
  /* 5. uma Incursão do começo ao fim, em 3×, pela tela */
  await p.evaluate(() => {
    const S = G.S; G.UI.close(); S.paused = false; S.speed = 3; S.realm.lvl = 15; S.inc.dayDone = 0;
    for (const x of S.heroes) { x.lvl = 20; x.rank = 1; x._dirty = true; x.hp = G.heroStats(x).hp; x.potions = 6; x.state = 'town'; x.inside = null; x.fome = 100; x.energia = 100; }
    G.UI.open('missoes', 'incursoes');
  });
  await p.waitForTimeout(400);
  await p.click('[data-a="incgo"]'); await p.waitForTimeout(500);
  log('Incursão iniciada:', await p.evaluate(() => !!G.S.inc.run && G.S.inc.run.z + ' Grau ' + G.S.inc.run.g + ' grupo ' + G.S.inc.run.ids.length));
  await p.evaluate(() => { G.UI.close(); const z = G.ZONE[G.S.inc.run.z]; G.R.focus(z.lair[0], z.lair[1], true); });
  let ph = '', t0 = Date.now(), seenAlfa = false;
  while (Date.now() - t0 < 150000) {
    const s = await p.evaluate(() => (G.S.inc.run ? G.S.inc.run.phase : 'fim'));
    if (s !== ph) { ph = s; log('  fase:', s, 'aos', Math.round((Date.now() - t0) / 1000), 's'); }
    if (s === 'alfa' && !seenAlfa) { seenAlfa = true; await p.waitForTimeout(1500); await shot('15-alfa'); }
    if (s === 'fim') break; await p.waitForTimeout(500);
  }
  await p.waitForTimeout(600); await shot('16-fim-incursao');
  log('Incursão terminou:', await p.evaluate(() => JSON.stringify(G.S.inc.last)), '· mascotes', await p.evaluate(() => G.S.pets.length));
  await p.evaluate(() => { G.UI.open('missoes', 'incursoes'); }); await shot('17-incursoes-depois');
  /* desempenho: tempo médio de G.tick e R.frame em 3× com a cidade cheia */
  const perf = async (pg) => pg.evaluate(async () => {
    const S = G.S; G.UI.close(); S.paused = false; S.speed = 3; let tk = 0, nt = 0, fr = 0, nf = 0; const t0 = G.tick, f0 = G.R.frame;
    G.tick = (d) => { const a = performance.now(); t0(d); tk += performance.now() - a; nt++; }; G.R.frame = (d) => { const a = performance.now(); f0(d); fr += performance.now() - a; nf++; };
    await new Promise((r) => setTimeout(r, 6000)); G.tick = t0; G.R.frame = f0;
    return { tickMs: +(tk / nt).toFixed(3), frameMs: +(fr / nf).toFixed(3), quadros: nf };
  });
  /* 6. save da v21 com mascotes, aberto na v22 */
  if (save21) {
    const p2 = await mk(412, 915); p = p2;
    await p2.goto('file://' + path.resolve(file)); await p2.waitForSelector('#title.on');
    await p2.evaluate((s) => { localStorage.setItem(G.SAVE_KEY, s); }, fs.readFileSync(save21, 'utf8'));
    await p2.reload(); await p2.waitForSelector('#title.on'); await p2.click('[data-a="t-continue"]'); await p2.waitForTimeout(1200);
    for (let i = 0; i < 6; i++) { const g = await p2.$('#modal.on [data-a="mclose"]'); if (!g) break; await g.click(); await p2.waitForTimeout(500); }
    log('save v21 na v22:', await p2.evaluate(() => JSON.stringify({ versao: G.VERSION, mascotes: G.S.pets.map((x) => x.k + ':' + G.RAR[x.rar] + (x.hero ? '→' + G.S.heroes.find((h) => h.id === x.hero).name : '')), cos: Object.keys(G.S.cos) })));
    await p2.evaluate(() => { G.S.paused = true; G.UI.open('herois', 'lista', { hero: G.S.heroes[0].id }); }); await shot('18-save21-ficha');
    await p2.evaluate(() => { G.UI.close(); G.S.paused = false; G.R.follow = G.S.heroes[0].id; }); await p2.waitForTimeout(2500); await shot('19-save21-mapa');
  }
  /* 7. tela pequena 360×640: nada passa da largura */
  const p3 = await mk(360, 640); p = p3;
  await p3.goto('file://' + path.resolve(file)); await p3.waitForSelector('#title.on'); await p3.click('[data-a="t-new"]'); await p3.waitForTimeout(900);
  for (let i = 0; i < 6; i++) { const s = await p3.$('[data-a="tskip"]'); if (s) { await s.click(); await p3.waitForTimeout(150); } }
  await p3.evaluate(() => { const S = G.S; S.tut.done = true; S.tut.seen.v20 = S.tut.seen.v21 = 1; G.UI.closeModal(); });
  await p3.waitForTimeout(500); const g22 = await p3.$('#modal.on'); if (g22) await p3.screenshot({ path: out + '/20-360-guia.png' }); await p3.evaluate(() => G.UI.closeModal());
  await p3.evaluate(() => { const S = G.S; S.realm.lvl = 12; S.gold = 1e6; for (const id of G.BLD_IDS) S.b[id] = { lvl: 4 }; for (const k of ['olho', 'medusa', 'jabuti', 'gato', 'gato', 'gato']) G.petNew(k, k === 'olho' ? 4 : 0); G.petAssign(G.S.pets[0], S.heroes[0]); S.mascate.offers[0] = { id: 'ovo', rar: 0, n: 1, gold: 2400, sold: 0 }; S.paused = true; });
  const over = [];
  const check = async (nm, fn) => { await p3.evaluate(fn); await p3.waitForTimeout(350); const r = await p3.evaluate(() => { const bad = []; const W = document.documentElement.clientWidth; for (const el of document.querySelectorAll('#sheet *, #modal *')) { if (el.closest('.tabs')) continue; const b2 = el.getBoundingClientRect(); if (b2.width && b2.right > W + 1) bad.push((el.className && el.className.baseVal == null ? el.className : el.tagName) + ':' + Math.round(b2.right)); } return { page: document.documentElement.scrollWidth, W, bad: bad.slice(0, 4) }; }); if (r.page > r.W || r.bad.length) over.push(nm + ' ' + JSON.stringify(r)); await p3.screenshot({ path: out + '/21-360-' + nm + '.png' }); };
  await check('ficha', () => G.UI.open('herois', 'lista', { hero: G.S.heroes[0].id }));
  await check('bolsa', () => G.UI.act('htab', ['bolsa']));
  await check('escolha', () => { G.UI.close(); G.UI.act('petpick', [String(G.S.heroes[0].id)]); });
  await check('viveiro', () => { G.UI.closeModal(); G.UI.open('armazem', 'atelie'); const el = document.getElementById('viveiro'); if (el) el.scrollIntoView(); });
  await check('fusao', () => G.UI.act('petfuse', ['0']));
  await check('incursoes', () => { G.UI.closeModal(); G.UI.open('missoes', 'incursoes'); });
  await check('mercado', () => { G.UI.open('reino', 'mercado'); const el = document.querySelector('[data-a="masc:0"]'); if (el) el.scrollIntoView(); });
  log('360×640: estouros de largura =', over.length ? over.join(' | ') : 'nenhum');
  /* desempenho: mesma cena nas duas versões (8 heróis nível 40, cidade nível 5, 3×); na v22 cada herói leva um mascote */
  const perfRun = async (f, pets) => {
    const pg = await mk(412, 915); await pg.goto('file://' + path.resolve(f)); await pg.waitForSelector('#title.on'); await pg.click('[data-a="t-new"]'); await pg.waitForTimeout(900);
    for (let i = 0; i < 6; i++) { const s2 = await pg.$('[data-a="tskip"]'); if (s2) { await s2.click(); await pg.waitForTimeout(150); } }
    await pg.evaluate((pt) => {
      const S = G.S; S.tut.done = true; S.tut.seen.v20 = S.tut.seen.v21 = S.tut.seen.v22 = 1; G.UI.closeModal(); S.gold = 5e6; S.realm.lvl = 15;
      for (const id of G.BLD_IDS) S.b[id] = { lvl: id === 'cidadela' ? 6 : 5 }; G.dirtyAll(); G.syncNpcs();
      while (S.heroes.length < 8) G.hire(G.rollCandidates('gold')[0]);
      for (const x of S.heroes) { x.lvl = 40; x.rank = 4; x._dirty = true; x.hp = G.heroStats(x).hp; }
      if (pt && G.petNew) for (const x of S.heroes) G.petAssign(G.petNew(G.pick(G.PET_IDS), 3), x);
      G.R.focus(44, 40, true);
    }, pets);
    await pg.waitForTimeout(4000); const r = await perf(pg); await pg.close(); return r;
  };
  if (file21) { log('desempenho v21 (3×):', JSON.stringify(await perfRun(file21, false))); log('desempenho v22 (3×):', JSON.stringify(await perfRun(file, true))); log('desempenho v21 (3×, de novo):', JSON.stringify(await perfRun(file21, false))); log('desempenho v22 (3×, de novo):', JSON.stringify(await perfRun(file, true))); }
  log('ERROS:', errs.length); for (const e of errs.slice(0, 8)) log(e);
  await b.close();
})();
