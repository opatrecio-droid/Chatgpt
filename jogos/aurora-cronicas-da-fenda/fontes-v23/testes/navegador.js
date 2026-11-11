// Teste no navegador (Playwright): node navegador.js <v23.html> <pasta-das-capturas> [save22.json]
// Toques reais (touchscreen) no mapa e nos botões; confere estado do jogo depois de cada passo.
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
(async () => {
  const [file, out, save22] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const errs = []; const watch = (p) => { p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); }); };
  const mk = async (w, h) => { const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: true, hasTouch: true }); const p = await ctx.newPage(); watch(p); return p; };
  const log = (...x) => console.log(...x); let fails = 0; const ok = (c, m) => { if (!c) fails++; log((c ? 'ok   ' : 'FALHOU ') + m); };
  let p = await mk(412, 915);
  const shot = async (n) => { await p.waitForTimeout(350); await p.screenshot({ path: out + '/' + n + '.png' }); };
  const tapEl = async (sel) => { const loc = p.locator(sel).first(); await loc.scrollIntoViewIfNeeded(); await p.waitForTimeout(120); const bb = await loc.boundingBox(); if (!bb) throw new Error('sem ' + sel); await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(250); };
  /* toque real no telhado de um prédio */
  const tapBld = async (id) => {
    const pt = await p.evaluate((i) => { const q = G.W.plots[i]; G.R.follow = 0; G.R.focus(q.cx, q.cy, true); return null; }, id); void pt;
    await p.waitForTimeout(250);
    const s = await p.evaluate((i) => { const q = G.W.plots[i]; return G.R.worldToScreen(q.cx, q.cy - 0.6); }, id);
    await p.touchscreen.tap(s[0], s[1]); await p.waitForTimeout(400);
    return p.evaluate(() => (document.querySelector('#bp-root h2') || {}).textContent || '');
  };
  /* 1. jogo novo e guias */
  await p.goto('file://' + path.resolve(file)); await p.waitForSelector('#title.on');
  log('título:', await p.evaluate(() => document.querySelector('#title .ver').textContent));
  await p.click('[data-a="t-new"]'); await p.waitForTimeout(900);
  for (let i = 0; i < 6; i++) { const s = await p.$('[data-a="tskip"]'); if (s) { await s.click(); await p.waitForTimeout(200); } }
  const guides = [];
  for (let i = 0; i < 5; i++) { await p.waitForTimeout(700); const t = await p.evaluate(() => (G.UI.modalOpen ? document.querySelector('#modal .eyebrow') && document.querySelector('#modal .eyebrow').textContent : '')); if (!t) break; guides.push(t); if (/Ofícios/.test(t)) await shot('01-guia-v23'); const g = await p.$('#modal.on [data-a="mclose"]'); if (g) await g.click(); }
  log('guias:', guides.join(' | '));
  ok(await p.evaluate(() => G.S.tut.seen.v23 === 1), 'guia da v23 visto e marcado (seen.v23)');
  /* 2. prédio ainda não construído (Enfermaria no começo) por toque no mapa */
  await p.evaluate(() => { G.S.paused = true; G.UI.inspect(null); });
  let t = await tapBld('enfermaria'); await shot('02-enfermaria-nao-construida');
  ok(/A construir · Enfermaria/.test(t) && await p.evaluate(() => !!document.querySelector('#bp-root [data-a="bpup:enfermaria"]') && /Construir/.test(document.querySelector('#bp-root [data-a="bpup:enfermaria"]').textContent)), 'toque na Enfermaria não construída: «' + t + '» com botão Construir');
  await tapEl('#bp-root [data-a="bpup:enfermaria"]'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => G.bLvl('enfermaria') === 1 && /Nv 1 · Enfermaria/.test(document.querySelector('#bp-root h2').textContent)), 'Construir pelo painel: Enfermaria Nv 1, o painel se atualiza');
  await tapEl('#modal.on [data-a="mclose"]');
  /* 3. cidade crescida: Taverna, Enfermaria, Mercado, Fazenda */
  await p.evaluate(() => {
    const S = G.S; S.gold = 5e6; S.realm.lvl = 15; S.selos = 50;
    for (const k in G.RES) S.res[k] = (S.res[k] || 0) + (G.RES[k].emb ? 6 : 300);
    for (const id of G.BLD_IDS) S.b[id] = { lvl: id === 'cidadela' ? 6 : id === 'taverna' ? 7 : 5 }; G.dirtyAll(); G.syncNpcs(); S.res.refeicao = 40;
    while (S.heroes.length < 6) G.hire(G.rollCandidates('gold')[0]);
    S.heroes.forEach((h, i) => { h.lvl = 18 + i; h._dirty = true; h.gold = 800; });
    G.emit('heroes'); G.emit('bld');
  });
  t = await tapBld('taverna'); await shot('03-taverna-servico');
  ok(/Nv 7 · Taverna do Cervo/.test(t) && await p.evaluate(() => document.querySelectorAll('#bp-root .mnu').length === 4 && document.querySelectorAll('#bp-root .mnu.lock').length === 1), 'Taverna Nv 7: 4 degraus no cardápio, 1 trancado (Banquete no Nv 9)');
  await p.evaluate(() => { const el = document.querySelector('#bp-root .bpn'); if (el) el.scrollIntoView({ block: 'center' }); }); await shot('04-taverna-proximo-nivel');
  ok(await p.evaluate(() => /No nível 8/.test(document.querySelector('#bp-root .bpn').textContent)), 'faixa do próximo nível: ' + await p.evaluate(() => document.querySelector('#bp-root .bpn').textContent.slice(0, 110)));
  /* trocar o degrau servido */
  await p.evaluate(() => document.querySelector('#bp-root [data-a="bpsvc:taverna:2"]').scrollIntoView({ block: 'center' }));
  await tapEl('#bp-root [data-a="bpsvc:taverna:2"]');
  ok(await p.evaluate(() => G.S.svc.taverna === 2 && G.svcMax('taverna') === 1 && document.querySelector('#bp-root .mnu.top b').textContent.indexOf('Ensopado') >= 0), 'Servir até aqui (degrau 2): a Taverna passa a servir até o Ensopado');
  await shot('05-taverna-degrau-2');
  /* um herói come com a Taverna limitada; outro espera na porta */
  await p.evaluate(() => {
    const S = G.S, [a, c] = S.heroes; for (const x of [a, c]) { x.state = 'goto'; x.dest = 'taverna'; x.act = 'eat'; x.path = null; x.fome = 20; x.gold = 1e5; }
    S.paused = false; S.speed = 1; G.updateHero(a, 0.05, []); G.updateHero(c, 0.05, []); a.until = S.t + 30; c.until = S.t + 30;
  });
  await tapEl('#bp-root [data-a="bpt:her"]'); await p.waitForTimeout(700); await shot('06-taverna-herois');
  const rows = await p.evaluate(() => [...document.querySelectorAll('#bp-root .bpr')].map((r) => r.textContent));
  ok(rows.length >= 2 && rows.every((r) => /Comendo: Ensopado/.test(r)), 'aba Heróis: ' + rows.length + ' comendo o Ensopado (degrau servido), com tempo restante');
  await tapEl('#bp-root [data-a="bpt:svc"]'); await p.evaluate(() => document.querySelector('#bp-root [data-a="bpsvc:taverna:0"]').scrollIntoView({ block: 'center' }));
  await tapEl('#bp-root [data-a="bpsvc:taverna:0"]'); ok(await p.evaluate(() => G.S.svc.taverna === 0), 'de volta a «Sempre o melhor liberado»');
  await tapEl('#modal.on [data-a="mclose"]'); await p.evaluate(() => { G.S.paused = true; });
  /* Enfermaria: tabela do reerguer e um caído */
  await p.evaluate(() => { const h = G.S.heroes[2]; h.state = 'recover'; h.inside = 'enfermaria'; h.reviveAt = G.S.t + 80; });
  t = await tapBld('enfermaria');
  await p.evaluate(() => { const el = document.querySelector('#bp-root .dif4'); if (el) el.scrollIntoView({ block: 'center' }); }); await shot('07-enfermaria-reerguer');
  ok(/Nv 5 · Enfermaria/.test(t) && await p.evaluate(() => document.querySelectorAll('#bp-root .dif4 .stat').length === 4), 'Enfermaria: tabela de reerguer nas 4 dificuldades');
  await tapEl('#bp-root [data-a="bpt:her"]'); await shot('08-enfermaria-herois');
  const g0 = await p.evaluate(() => G.S.gold);
  await tapEl('#bp-root [data-a^="bprev:"]');
  ok(await p.evaluate((g) => G.S.heroes[2].state === 'town' && G.S.gold === g - G.reviveCost(G.S.heroes[2]), g0), 'Reerguer pelo painel cobra o custo da dificuldade e o herói volta');
  await tapEl('#modal.on [data-a="mclose"]');
  /* Fazenda: produção */
  t = await tapBld('fazenda'); await shot('09-fazenda-producao');
  ok(/Fazenda de Joca/.test(t) && await p.evaluate(() => /Produção/.test(document.querySelector('#bp-root .bpt').textContent) && /trigo|Trigo/.test(document.querySelector('#bp-root .bpb').textContent) && /Joca/.test(document.querySelector('#bp-root .bpb').textContent)), 'Fazenda: aba Produção com taxas, estoque e quem trabalha');
  await tapEl('#modal.on [data-a="mclose"]');
  /* 4. Mercado: encomendar, cancelar, encomendar de novo e ver a entrega na alvorada */
  t = await tapBld('mercado');
  await p.evaluate(() => document.getElementById('ord-sec').scrollIntoView({ block: 'start' })); await shot('10-mercado-encomendas');
  ok(/Mercado/.test(t) && await p.evaluate(() => document.querySelectorAll('#bp-root .ordc').length === G.ordItems().length), 'Mercado: ' + await p.evaluate(() => G.ordItems().length) + ' materiais encomendáveis no painel');
  await tapEl('#bp-root [data-a="ordk:couro"]'); await tapEl('#bp-root [data-a="ordq:10"]'); await tapEl('#bp-root [data-a="ordq:100"]');
  const q = await p.evaluate(() => +document.querySelector('#bp-root .ordq b').textContent);
  const gold1 = await p.evaluate(() => G.S.gold), cost1 = await p.evaluate((n) => G.ordCost('couro', n), q);
  await p.evaluate(() => document.querySelector('#bp-root [data-a="ordgo"]').scrollIntoView({ block: 'center' })); await tapEl('#bp-root [data-a="ordgo"]');
  ok(q === 120 && await p.evaluate((g) => G.S.orders.length === 1 && G.S.orders[0].n === 120 && G.S.gold === g, gold1 - cost1), '+10 e +100: encomenda de ' + q + ' Couro paga (' + cost1 + ' moedas)');
  await p.evaluate(() => document.querySelector('#bp-root [data-a^="ordx:"]').scrollIntoView({ block: 'center' })); await shot('11-encomenda-aberta');
  await tapEl('#bp-root [data-a^="ordx:"]'); await shot('12-cancelar'); await tapEl('#modal.on [data-a="myes"]');
  ok(await p.evaluate((e) => G.S.orders.length === 0 && G.S.gold === e, gold1 - cost1 + Math.floor(cost1 * 0.75)), 'cancelada pela confirmação: voltaram ' + Math.floor(cost1 * 0.75) + ' moedas (75%)');
  await p.evaluate(() => { G.UI.open('reino', 'mercado'); }); await p.waitForTimeout(300);
  await p.evaluate(() => document.getElementById('ord-sec').scrollIntoView({ block: 'start' })); await shot('13-reino-mercado-encomendas');
  await tapEl('#sheet [data-a="ordk:gosma"]'); await p.evaluate(() => document.querySelector('#sheet [data-a="ordgo"]').scrollIntoView({ block: 'center' })); await tapEl('#sheet [data-a="ordgo"]');
  const before = await p.evaluate(() => ({ n: G.S.orders.length, k: G.S.orders[0] && G.S.orders[0].k, q: G.S.orders[0] && G.S.orders[0].n, res: G.S.res.gosma, day: G.S.day }));
  ok(before.n === 1 && before.k === 'gosma', 'Reino › Mercado: encomenda de ' + before.q + ' Gosma');
  await p.evaluate(() => { G.UI.close(); const S = G.S; S.clock = 340; S.ev.next = S.day + 9; S.paused = false; S.speed = 3; G.R.focus(55, 52, true); });
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(250); if (await p.evaluate((d) => G.S.day > d, before.day)) break; }
  await p.waitForTimeout(300); await shot('14-entrega-na-alvorada');
  const after = await p.evaluate(() => ({ n: G.S.orders.length, res: G.S.res.gosma, day: G.S.day, log: G.S.log.slice(-20).map((l) => l.m).find((m) => /caravana chegou/.test(m)) || '' }));
  ok(after.day === before.day + 1 && after.n === 0 && after.res >= before.res + before.q && !!after.log, 'alvorada do dia ' + after.day + ': ' + after.log);
  /* a virada do dia pode trazer um evento (janela): escolhe a última opção e segue */
  for (let i = 0; i < 3; i++) { const has = await p.evaluate(() => G.UI.modalOpen); if (!has) break; await p.evaluate(() => { if (G.S.ev.pending) { const e = G.EVENTS.find((x) => x.id === G.S.ev.pending); G.UI.act('evopt', [String(e.opts.length - 1)]); } else G.UI.closeModal(); }); await p.waitForTimeout(300); }
  /* 5. vozes da cidade */
  await p.evaluate(() => { const S = G.S; S.paused = true; S.opts.vozes = 0; for (const h of S.heroes.slice(0, 4)) G.bark(h, 'hunt', 1); G.bark(S.heroes[1], 'hungry', 1); });
  await p.waitForTimeout(400);
  ok(await p.evaluate(() => !document.getElementById('vozes').classList.contains('on') && document.getElementById('fab-voz').classList.contains('new')), 'vozes fechadas por padrão no celular; o botão avisa que há falas novas');
  await tapEl('#fab-voz'); await p.waitForTimeout(400); await shot('15-vozes-aberto');
  const vz = await p.evaluate(() => [...document.querySelectorAll('#vozes .vzi')].map((x) => x.textContent));
  ok(vz.length >= 5 && /Estou faminto|taverna/.test(vz[0]), 'vozes abertas: ' + vz.length + ' falas, a mais nova em cima («' + vz[0] + '»)');
  const hid = await p.evaluate(() => +document.querySelector('#vozes .vzi').getAttribute('data-a').split(':')[1]);
  await tapEl('#vozes .vzi'); await p.waitForTimeout(300);
  ok(await p.evaluate((i) => G.R.follow === i && G.R.sel && G.R.sel.ref.id === i, hid), 'tocar na fala leva a câmera a quem falou');
  /* o painel não cobre os botões nem a faixa da jornada */
  const cover = await p.evaluate(() => { const v = document.getElementById('vozes').getBoundingClientRect(); const hit = []; for (const el of document.querySelectorAll('#fabs-l .fab, #fabs .fab, #fab-dec, #quest, #inspect.on, #nav, #roster .hc')) { const r = el.getBoundingClientRect(); if (r.width && !(r.right <= v.left || r.left >= v.right || r.bottom <= v.top || r.top >= v.bottom)) hit.push(el.id || el.className); } return hit; });
  ok(cover.length === 0, 'vozes abertas não cobrem botões, jornada, inspeção nem a barra de navegação' + (cover.length ? ': ' + cover.join(',') : ''));
  await tapEl('#vozes .vzh button'); ok(await p.evaluate(() => !document.getElementById('vozes').classList.contains('on') && G.S.opts.vozes === 0), 'fechar pelo × do painel');
  await tapEl('#fab-voz'); ok(await p.evaluate(() => document.getElementById('vozes').classList.contains('on')), 'abrir de novo pelo botão');
  /* 6. Reino › Prédios: botão de informação */
  await p.evaluate(() => { G.UI.inspect(null); G.UI.open('reino', 'obras'); }); await p.waitForTimeout(300); await shot('16-reino-predios');
  await tapEl('#sheet [data-a="bp:padaria"]'); t = await p.evaluate(() => (document.querySelector('#bp-root h2') || {}).textContent || '');
  ok(/Padaria/.test(t), 'botão de informação em Reino › Prédios abre o painel: ' + t); await shot('17-padaria');
  await p.evaluate(() => { G.UI.closeModal(); G.UI.close(); });
  /* ficha com efeitos */
  await p.evaluate(() => { const h = G.S.heroes[0]; h.fedT = G.S.t + 200; h.fedA = 0.06; h.fedX = 0.05; h.restT = G.S.t + 120; h.restF = 0.25; G.UI.open('herois', 'lista', { hero: h.id }); });
  await p.waitForTimeout(400); await p.evaluate(() => { const el = document.querySelector('#sheet .efl'); if (el) el.scrollIntoView({ block: 'center' }); }); await shot('18-ficha-efeitos');
  ok(await p.evaluate(() => /Bem alimentado/.test(document.querySelector('#sheet .efl').textContent) && /Descansado/.test(document.querySelector('#sheet .efl').textContent)), 'ficha mostra bem alimentado e descansado');
  await p.evaluate(() => G.UI.close());
  /* 7. todos os 16 prédios abrem o painel sem erro */
  const n16 = await p.evaluate(() => { let n = 0; for (const id of G.BLD_IDS) { G.UI.bldPanel(id); if (document.querySelector('#bp-root h2')) n++; G.UI.ACT.bpt(['her']); G.UI.closeModal(); } return n; });
  ok(n16 === 16, 'os 16 prédios abrem o painel nas duas abas (' + n16 + ')');
  /* 8. save da v22 aberto na v23 */
  if (save22) {
    const p2 = await mk(412, 915); p = p2;
    await p2.goto('file://' + path.resolve(file)); await p2.waitForSelector('#title.on');
    /* um jogador da v22 que já viu os guias até a v22 */
    const sv = JSON.parse(fs.readFileSync(save22, 'utf8')); sv.tut.done = true; sv.tut.seen = { v20: 1, v21: 1, v22: 1 };
    await p2.evaluate((s) => { localStorage.setItem(G.SAVE_KEY, s); }, JSON.stringify(sv));
    await p2.reload(); await p2.waitForSelector('#title.on'); await p2.click('[data-a="t-continue"]'); await p2.waitForTimeout(1200);
    const gs = []; for (let i = 0; i < 6; i++) { await p2.waitForTimeout(600); const e = await p2.evaluate(() => (G.UI.modalOpen ? (document.querySelector('#modal .eyebrow') || {}).textContent || 'modal' : '')); if (!e) break; gs.push(e); const g = await p2.$('#modal.on [data-a="mclose"]'); if (!g) break; await g.click(); await p2.waitForTimeout(500); }
    const st = await p2.evaluate(() => ({ versao: G.VERSION, dia: G.S.day, herois: G.S.heroes.length, mascotes: G.S.pets.length, svc: G.S.svc, orders: G.S.orders.length, v23: G.S.tut.seen.v23 }));
    log('save v22 na v23:', JSON.stringify(st), '· janelas:', gs.join(' | '));
    ok(st.versao === '23.0' && st.mascotes === 3 && st.svc && st.svc.taverna === 0 && st.v23 === 1, 'save da v22 abre na v23 com mascotes, campos novos e o guia da v23');
    await p2.evaluate(() => { G.S.paused = false; }); await p2.waitForTimeout(2500);
    t = await tapBld('taverna'); await shot('19-save22-taverna');
    ok(/Taverna/.test(t), 'save v22: painel da Taverna «' + t + '»');
    await p2.evaluate(() => G.UI.closeModal());
  }
  /* 9. tela pequena 360×640: nada passa da largura */
  const p3 = await mk(360, 640); p = p3;
  await p3.goto('file://' + path.resolve(file)); await p3.waitForSelector('#title.on'); await p3.click('[data-a="t-new"]'); await p3.waitForTimeout(900);
  for (let i = 0; i < 6; i++) { const s = await p3.$('[data-a="tskip"]'); if (s) { await s.click(); await p3.waitForTimeout(150); } }
  await p3.evaluate(() => { const S = G.S; S.tut.done = true; S.tut.seen.v20 = S.tut.seen.v21 = S.tut.seen.v22 = 1; G.UI.closeModal(); });
  await p3.waitForTimeout(600); if (await p3.$('#modal.on')) await p3.screenshot({ path: out + '/20-360-guia-v23.png' }); await p3.evaluate(() => G.UI.closeModal());
  await p3.evaluate(() => { const S = G.S; S.realm.lvl = 20; S.gold = 1e6; for (const id of G.BLD_IDS) S.b[id] = { lvl: id === 'cidadela' ? 8 : 9 }; G.dirtyAll(); G.syncNpcs(); while (S.heroes.length < 7) G.hire(G.rollCandidates('gold')[0]); G.ordPlace('osso', 200); G.ordPlace('presa', 30); S.paused = true; });
  const over = [];
  const check = async (nm, fn, yScroll, arg) => {
    await p3.evaluate(fn, arg); await p3.waitForTimeout(350);
    if (yScroll) await p3.evaluate((y) => { const el = document.querySelector('#modal .mbox') || document.querySelector('#sheet .sh-body'); if (el) el.scrollTop = y; }, yScroll);
    const r = await p3.evaluate(() => { const bad = []; const W = document.documentElement.clientWidth; for (const el of document.querySelectorAll('#sheet *, #modal *, #vozes *')) { if (el.closest('.tabs')) continue; const b2 = el.getBoundingClientRect(); if (b2.width && b2.right > W + 1) bad.push((el.className && el.className.baseVal == null ? el.className : el.tagName) + ':' + Math.round(b2.right)); } return { page: document.documentElement.scrollWidth, W, bad: bad.slice(0, 4) }; });
    if (r.page > r.W || r.bad.length) over.push(nm + ' ' + JSON.stringify(r));
    await p3.screenshot({ path: out + '/21-360-' + nm + '.png' });
  };
  for (const id of ['taverna', 'hospedaria', 'enfermaria', 'mercado', 'fazenda', 'treino', 'cidadela']) { await check(id, (i) => { G.UI.closeModal(); G.UI.bldPanel(i); }, 0, id); if (!(await p3.evaluate((i) => !!document.querySelector('#bp-root') && document.querySelector('#bp-root h2').textContent.indexOf(G.BLD[i].name) >= 0, id))) over.push(id + ': painel não abriu'); }
  await check('taverna-fim', () => { G.UI.closeModal(); G.UI.bldPanel('taverna'); }, 2000);
  await check('mercado-encomendas', () => { G.UI.closeModal(); G.UI.bldPanel('mercado'); document.getElementById('ord-sec').scrollIntoView({ block: 'start' }); });
  await check('enfermaria-herois', () => { G.UI.closeModal(); G.UI.bldPanel('enfermaria', 'her'); });
  await check('reino-mercado', () => { G.UI.closeModal(); G.UI.open('reino', 'mercado'); document.getElementById('ord-sec').scrollIntoView({ block: 'start' }); });
  await check('reino-predios', () => { G.UI.open('reino', 'obras'); });
  await check('vozes', () => { G.UI.close(); G.S.paused = false; G.S.opts.vozes = 1; for (const h of G.S.heroes) G.bark(h, 'town', 1); G.bark(G.S.heroes[0], 'full', 1); });
  log('360×640: estouros de largura =', over.length ? over.join(' | ') : 'nenhum');
  ok(!over.length, '360×640 sem estouro de largura');
  log('ERROS DE PÁGINA/CONSOLE:', errs.length); for (const e of errs.slice(0, 8)) log(e);
  ok(!errs.length, 'zero erros de página e de console');
  log(fails ? fails + ' verificação(ões) falharam no navegador' : 'todas as verificações do navegador passaram');
  await b.close();
})();
