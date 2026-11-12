#!/usr/bin/env node
/* Fumaça da Fase B da v27 (cidade viva + mascotes) no Chromium do Playwright, com viewport de celular (412×915, escala 2, toque), reaproveitando o fluxo de
   tools/smoke.js (jogo novo pela tela de título, Rosa, toque em prédios pelo cartão). Não monta nada: abre o HTML já montado (padrão aurora-v27.html).
   B1: a Lenharia, a Pedreira e a Fazenda percorrem um ciclo completo cada (todas as fases são vistas, com tela de verdade: câmera perto, fotos de cada fase),
       a entrega mostra "+N recurso" no mapa, o cartão do prédio lista o que cada um está fazendo, o Modo leve mantém o vai-e-vem sem partículas.
   B2: ovos chocam como vagantes que andam pela praça e escolhem dono (linha no registro + aviso), o cartão do vagante, um herói com 3 mascotes que o seguem sem se
       sobrepor, a ficha com Carisma, o 4º mascote recusado, save/recarga e save antigo (um mascote por herói).
   Qualquer erro de console ou de página reprova. Mede também o custo do quadro (R.frame) com os três prédios no máximo de equipe; com --base outro.html compara
   com uma versão anterior. Uso: node tools/smoke-vida.js [--file x.html] [--out pasta] [--base anterior.html] [--perf-only]
   Capturas em --out (padrão: a pasta da fase B do scratchpad, se existir, senão /tmp/aurora-smoke-vida). Código de saída 1 se algo falhar. */
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : d; };
const flag = (k) => process.argv.indexOf('--' + k) >= 0;
const FILE = path.resolve(arg('file', path.join(__dirname, '..', 'aurora-v27.html')));
const BASE = arg('base', '');
const DEF_OUT = '/tmp/claude-0/-home-user-Chatgpt/7a7f5893-7401-5a6e-8d04-2ae4d5f0aa59/scratchpad/phaseB';
const OUT = arg('out', fs.existsSync(path.dirname(DEF_OUT)) ? DEF_OUT : '/tmp/aurora-smoke-vida');
fs.mkdirSync(OUT, { recursive: true });
if (!flag('perf-only')) for (const f of fs.readdirSync(OUT)) if (/^\d\d-.*\.png$/.test(f)) fs.unlinkSync(path.join(OUT, f));      // capturas de execuções anteriores

const errs = [], results = [];
let page, n = 0;
const shot = async (name, clip) => { const f = path.join(OUT, String(++n).padStart(2, '0') + '-' + name + '.png'); await page.screenshot(Object.assign({ path: f, scale: 'device' }, clip ? { clip } : {})); return f; };
const step = async (name, fn) => {
  const t0 = Date.now(), e0 = errs.length;
  try { await fn(); const bad = errs.length - e0; results.push({ name, ok: bad === 0, ms: Date.now() - t0, note: bad ? bad + ' erro(s) de console/página' : '' }); }
  catch (e) { results.push({ name, ok: false, ms: Date.now() - t0, note: String(e && e.message || e).split('\n')[0] }); try { await shot('FALHA-' + name.replace(/\W+/g, '-').slice(0, 30)); } catch (e2) { /* ok */ } }
  const r = results[results.length - 1]; console.log((r.ok ? '  ok   ' : '  FAIL ') + name + ' (' + r.ms + ' ms)' + (r.note ? ' — ' + r.note : ''));
};
const assert = (c, msg) => { if (!c) throw new Error(msg); };
const ev = (fn, a) => page.evaluate(fn, a);
const startContinue = async () => { await page.waitForSelector('#title.on', { timeout: 30000 }); await page.tap('[data-a="t-continue"]'); };
const newGame = async () => {
  await page.goto('file://' + FILE); await page.waitForSelector('#title.on', { timeout: 30000 });
  await page.tap('[data-a="t-new"]'); await page.waitForSelector('#modal.on .rosa', { timeout: 15000 }); await page.tap('[data-a="tskip"]'); await page.waitForTimeout(500);
};
/* avança a simulação com ticks manuais até a condição valer (o laço de quadros real continua desenhando por cima) */
const until = (cond, args, maxTicks) => ev(([cond, args, max]) => { const f = new Function('a', 'return (' + cond + ')(a)'); for (let i = 0; i < max; i++) { G.tick(0.04); const r = f(args); if (r) return r; } return null; }, [cond.toString(), args, maxTicks || 60000]);
/* foto de perto de um ponto do mundo, recortada em volta dele */
const closeShot = async (name, x, y, zoom) => {
  await ev(([x, y, z]) => { const R = G.R; R.follow = 0; R.setZoom(z); R.focus(x, y - 0.6, true); }, [x, y, zoom || 5]);
  await page.waitForTimeout(260);
  const sp = await ev(([x, y]) => G.R.worldToScreen(x, y), [x, y]);
  const cw = 230, ch = 200, cx = Math.max(0, Math.min(412 - cw, sp[0] - cw / 2)), cy = Math.max(0, Math.min(915 - ch, sp[1] - ch * 0.68));
  return shot(name, { x: cx, y: cy, width: cw, height: ch });
};
const hideUi = (on) => ev((on) => { for (const sel of ['#hud', '#quest', '#banner', '#toasts', '#fab-inbox', '#roster', '.rost']) { const e = document.querySelector(sel); if (e) e.style.visibility = on ? 'hidden' : ''; } }, on);
/* leva o prédio para a faixa livre acima do cartão e toca nele (como em smoke.js) */
const focusTap = async (id) => {
  await ev((id) => { const R = G.R, p = G.W.plots[id]; R.follow = 0; R.focus(p.cx, p.cy, true); const a = R.screenToWorld(0, 0), b = R.screenToWorld(0, 100), tpp = (b[1] - a[1]) / 100; R.focus(p.cx, p.cy + 0.6 + (innerHeight / 2 - 300) * tpp, true); }, id);
  await page.waitForTimeout(300);
  const pt = await ev((id) => { const p = G.W.plots[id], [x, y] = G.R.worldToScreen(p.cx, p.cy + 0.6); return [x, y]; }, id);
  await page.touchscreen.tap(pt[0], pt[1]); await page.waitForTimeout(450);
};
const prepare = () => ev(() => {
  const S = G.S; S.tut.guide = 0; S.speed = 1; S.paused = false;
  S.b.cidadela.lvl = 7; for (const id of ['lenharia', 'pedreira', 'fazenda']) S.b[id].lvl = 6; S.b.ferraria = { lvl: 3 }; S.b.padaria = { lvl: 2 }; S.b.alquimista = { lvl: 2 };
  G.syncNpcs(); G.dirtyAll(); S.gold = 9000; S.clock = 8 * 60; S.res.trigo = 200; S.res.ervas = 50;
  G.UI.banner = () => {}; window.__toasts = []; const o = G.UI.toast; G.UI.toast = (m, k, i) => { window.__toasts.push(m); return o(m, k, i); };
});

const SITES = {
  lenharia: ['toTree', 'chop', 'watch', 'saw', 'pick', 'carry', 'drop'],
  pedreira: ['toRock', 'mine', 'gather', 'carry', 'drop'],
  fazenda: ['harvest', 'bundle', 'carry', 'drop', 'till', 'plant', 'water'],
};
const POP = { lenharia: /^\+\d+ madeira/i, pedreira: /^\+\d+ (pedra|min[ée]rio)/i, fazenda: /^\+\d+ (trigo|ervas)/i };

/* ---------------------------------------------------------------------------------------- custo do quadro */
const perf = async (browser, file, tag) => {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const pg = await ctx.newPage(); const e = []; pg.on('pageerror', (x) => e.push(x.message));
  await pg.goto('file://' + file); await pg.waitForSelector('#title.on', { timeout: 30000 });
  await pg.tap('[data-a="t-new"]'); await pg.waitForSelector('#modal.on .rosa'); await pg.tap('[data-a="tskip"]'); await pg.waitForTimeout(400);
  const r = await pg.evaluate(async () => {
    const S = G.S; S.tut.guide = 0; S.b.cidadela.lvl = 7; for (const id of ['lenharia', 'pedreira', 'fazenda']) S.b[id].lvl = 6; G.syncNpcs(); G.dirtyAll(); S.clock = 9 * 60; S.paused = true; S.heroes.length = 0;
    for (let i = 0; i < 1200; i++) G.tick(0.04);      // as equipes já estão em serviço (na versão anterior, enfeitando)
    const out = {};
    for (const [name, x, y] of [['lenharia', 72, 26], ['pedreira', 28, 71], ['fazenda', 67, 56], ['cidade', 44, 54]]) {
      G.R.follow = 0; G.R.focus(x, y, true); await new Promise((r) => setTimeout(r, 200));
      const N = 240, t0 = performance.now(); for (let i = 0; i < N; i++) { G.tick(0.02); G.R.frame(0.016); } const ms = (performance.now() - t0) / N;
      let d0 = performance.now(); for (let i = 0; i < N; i++) G.R.frame(0.016); const draw = (performance.now() - d0) / N;
      out[name] = { tickDraw: +ms.toFixed(2), draw: +draw.toFixed(2) };
    }
    const t0 = performance.now(); for (let i = 0; i < 2000; i++) G.tick(0.034); out.tick = +((performance.now() - t0) / 2000).toFixed(3);
    return out;
  });
  await ctx.close(); return { tag, r, errs: e };
};

(async () => {
  console.log('Fumaça da Fase B · ' + FILE + '\n       capturas em ' + OUT);
  const browser = await chromium.launch();
  if (flag('perf-only')) { const a = await perf(browser, FILE, 'depois'); console.log(JSON.stringify(a)); if (BASE) console.log(JSON.stringify(await perf(browser, path.resolve(BASE), 'antes'))); await browser.close(); return; }
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  page = await ctx.newPage(); page.setDefaultTimeout(10000);
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console.error: ' + m.text()); });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));

  await step('jogo novo, reino preparado (Lenharia, Pedreira e Fazenda no nível 6)', async () => {
    await newGame(); await prepare();
    const r = await ev(() => ({ w: G.npcs.filter((n) => n.wk).length, ver: G.VERSION }));
    assert(r.w === 9, 'esperava 9 trabalhadores de campo, vi ' + r.w);
  });

  await step('mapa rodando a 3×: nada pausa, as equipes saem de casa e trabalham', async () => {
    await ev(() => { G.S.speed = 3; G.S.paused = false; G.R.follow = 0; G.R.focus(72, 27, true); });
    await page.waitForTimeout(7000);
    const r = await ev(() => ({ t: G.S.t, paused: G.S.paused, active: G.npcs.filter((n) => n._wk).length, hr: G.S.clock / 60 }));
    assert(!r.paused && r.t > 20, 'o jogo não andou');
    assert(r.active >= 6, 'só ' + r.active + ' trabalhadores em serviço às ' + r.hr.toFixed(1) + ' h');
    await shot('lenharia-mapa-3x');
  });

  /* ---- os três laços, em tempo real, com a tela de verdade ---- */
  for (const site of Object.keys(SITES)) {
    await step(site + ': um ciclo completo em tempo real (todas as fases) e a entrega mostra "+N"', async () => {
      await ev((site) => { const S = G.S; S.speed = 3; S.paused = false; S.clock = 8 * 60; const p = G.W.life; const c = { lenharia: [72, 27], pedreira: [28, 71], fazenda: [67, 54] }[site]; G.R.follow = 0; G.R.focus(c[0], c[1], true); window.__seen = {}; window.__pop = ''; window.__pops0 = G.life.pops;
        const re = { lenharia: /^\+\d+ madeira/i, pedreira: /^\+\d+ (pedra|min[ée]rio)/i, fazenda: /^\+\d+ (trigo|ervas)/i }[site];
        window.__poll = setInterval(() => { for (const n of G.npcs) if (n._wk && n.at === site) window.__seen[n.w.ph] = 1; for (const f of G.R.fxs) if (f.t === 'num' && re.test(f.s || '')) window.__pop = f.s; }, 60); }, site);
      const need = SITES[site]; let seen = {}, t0 = Date.now();
      while (Date.now() - t0 < 90000) { await page.waitForTimeout(700); seen = await ev(() => window.__seen); if (need.every((p) => seen[p])) break; if (await ev(() => G.S.clock / 60 > 17.5)) await ev(() => { G.S.clock = 8 * 60; }); }
      const miss = need.filter((p) => !seen[p]); assert(!miss.length, 'fases que não apareceram: ' + miss.join(', ') + ' (vi ' + Object.keys(seen).join(',') + ')');
      for (let i = 0; i < 60 && !(await ev(() => window.__pop)); i++) await page.waitForTimeout(500);
      const r = await ev(() => ({ pop: window.__pop, pops: G.life.pops - window.__pops0, st: G.lifeStats() }));
      assert(POP[site].test(r.pop), 'nenhum "+N recurso" deste prédio apareceu no mapa (vi "' + r.pop + '")');
      assert(r.pops > 0, 'sem entregas contadas');
      for (const k in r.st.made) assert(r.st.shown[k] <= r.st.made[k] + 1e-6, 'mostrou mais ' + k + ' do que foi produzido');
      await ev(() => { clearInterval(window.__poll); G.S.speed = 1; });
      console.log('         ' + site + ': fases ' + need.join('→') + ' · pop "' + r.pop + '" · entregas ' + r.pops);
      await shot(site + '-mapa-padrao');
    });
  }

  /* ---- fotos de perto de cada fase (a simulação é conduzida à mão até a fase) ---- */
  for (const site of Object.keys(SITES)) {
    await step(site + ': fotos de cada fase (perto)', async () => {
      await ev(() => { G.S.paused = true; G.S.speed = 1; G.S.clock = 9 * 60; }); await hideUi(true);
      for (const ph of SITES[site]) {
        const got = await until(([site, ph]) => { const n = G.npcs.find((n) => n._wk && n.at === site && n.w.ph === ph); return n ? { x: n.x, y: n.y, name: n.name } : null; }, [site, ph], 80000);
        assert(got, site + ': fase ' + ph + ' não aconteceu');
        await ev(() => { for (let i = 0; i < 6; i++) G.tick(0.04); });
        await closeShot(site + '-' + ph, got.x, got.y, 5);
      }
      await hideUi(false);
    });
  }

  await step('cartão do prédio: cada trabalhador com a atividade ao vivo', async () => {
    await ev(() => { G.S.paused = false; G.S.speed = 1; G.S.clock = 8.5 * 60; });
    for (const id of ['lenharia', 'pedreira', 'fazenda']) {
      await focusTap(id);
      const k = await ev(() => ({ kind: G.UI.dock.kind, key: G.UI.dock.key, txt: document.querySelector('#bcard').innerText }));
      assert(k.kind === 'predio' && k.key === id, 'cartão não abriu para ' + id);
      const acts = /(indo|cortando|vendo|serrando|erguendo|levando|empilhando|afiando|esperando|voltando|picando|juntando|secando|colhendo|ceifando|amarrando|guardando|capinando|semeando|regando|tomando)/i;
      assert(acts.test(k.txt) && /LÁ DENTRO AGORA/i.test(k.txt), 'o cartão de ' + id + ' não mostra a atividade: ' + k.txt.slice(-160).replace(/\n/g, ' | '));
      const lines = await ev(() => [...document.querySelectorAll('#bcard .bk-who .bp')].map((e) => e.innerText.replace(/\n/g, ' ')));
      assert(lines.length >= 3, id + ': esperava 3 membros da equipe no cartão, vi ' + lines.length);
      console.log('         ' + id + ': ' + lines.join(' / '));
      await shot('cartao-' + id);
    }
    await ev(() => G.UI.dock.close());
  });

  await step('Modo leve: o vai-e-vem continua e as partículas somem', async () => {
    await ev(() => { G.S.opts.lowFx = 1; G.S.speed = 3; G.S.paused = false; G.S.clock = 8 * 60; G.R.parts.length = 0; G.R.focus(72, 27, true); });
    await page.waitForTimeout(5000);
    const r = await ev(() => ({ parts: G.R.parts.length, active: G.npcs.filter((n) => n._wk).length, ph: G.npcs.filter((n) => n._wk).map((n) => n.w.ph).join(',') }));
    assert(r.active >= 6, 'as equipes pararam no Modo leve');
    assert(r.parts < 40, 'muitas partículas no Modo leve: ' + r.parts);
    await ev(() => { G.S.opts.lowFx = 0; G.S.speed = 1; });
  });

  /* ---------------------------------------------------------------- B2 */
  await step('ovos chocam como vagantes: andam pela praça com o marcador "procurando dono"', async () => {
    await ev(() => { const S = G.S; G.UI.toast = ((o) => (m, k, i) => { window.__toasts.push(m); return o(m, k, i); })(G.UI.toast); S.clock = 11 * 60; S.speed = 1; S.paused = false;
      G.petHatch('lobinho', 2, 'teste'); G.petHatch('fadinha', 3, 'teste'); G.petHatch('gato', 0, 'teste'); G.petHatch('draquinho', 4, 'teste');
      for (const h of S.heroes) { h.x = 42 + Math.random() * 4; h.y = 55.5 + Math.random() * 1.5; h.state = 'town'; h.tThink = 99; } G.R.follow = 0; G.R.setZoom(5); G.R.focus(44, 55, true); });
    const p0 = await ev(() => G.S.pets.filter((p) => p.out).map((p) => { const r = G.petRt.get(p.id); return r ? [r.x, r.y] : null; }));
    assert(p0.length === 4 && p0.every(Boolean), 'esperava 4 vagantes com posição, vi ' + JSON.stringify(p0));
    await page.waitForTimeout(6000);
    const p1 = await ev(() => G.S.pets.filter((p) => p.out).map((p) => { const r = G.petRt.get(p.id); return r ? [r.x, r.y, r.mode, p.tp, Math.round(p.at - G.S.t)] : null; }));
    const moved = p1.filter((q, i) => q && Math.hypot(q[0] - p0[i][0], q[1] - p0[i][1]) > 0.5).length;
    assert(moved >= 2, 'os vagantes não andaram (' + moved + ' se moveram): ' + JSON.stringify(p1));
    assert(await ev(() => G.S.pets.every((p) => p.out && !p.hero && G.W.inTown(G.petRt.get(p.id).x, G.petRt.get(p.id).y))), 'um vagante saiu da cidade');
    await shot('vagantes-na-praca');
  });

  await step('toque no vagante: cartão com espécie, raridade, o que dá, temperamento, prazo e favorito', async () => {
    await ev(() => { G.S.speed = 1; G.S.paused = true; });
    const pos = await ev(() => { const p = G.S.pets.find((q) => q.out && q.k === 'lobinho'); const r = G.petRt.get(p.id); G.R.follow = 0; G.R.focus(r.x, r.y - 0.2, true); const s = G.R.worldToScreen(r.x, r.y - 0.4); return s; });
    await page.waitForTimeout(250);
    const pos2 = await ev(() => { const p = G.S.pets.find((q) => q.out && q.k === 'lobinho'); const r = G.petRt.get(p.id); return G.R.worldToScreen(r.x, r.y - 0.4); });
    await page.touchscreen.tap(pos2[0], pos2[1]); await page.waitForTimeout(500);
    const k = await ev(() => ({ kind: G.UI.dock.kind, txt: document.querySelector('#bcard').innerText }));
    assert(k.kind === 'pet', 'o toque não abriu o cartão do vagante (dock=' + k.kind + ')');
    for (const re of [/Filhote de Lobo/, /Raro/i, /Dá/, /Temperamento/i, /Valente|Dengoso/, /Escolhe em/i, /Prefere agora/i, /procurando dono/i]) assert(re.test(k.txt), 'o cartão não mostra ' + re + ': ' + k.txt.slice(0, 200).replace(/\n/g, ' | '));
    await shot('cartao-do-vagante');
    void pos; await ev(() => { G.UI.dock.close(); G.S.paused = false; });
  });

  await step('o vagante escolhe sozinho: linha no registro e aviso (sem janela), com o favorito já seguindo o herói', async () => {
    const fav = await ev(() => { const S = G.S; for (const h of S.heroes) { h.x = 43 + Math.random() * 3; h.y = 55.5 + Math.random(); h.state = 'town'; h.tThink = 99; h.inside = null; } return null; });
    void fav;
    await page.waitForTimeout(3500);
    const trail = await ev(() => G.S.pets.filter((p) => p.out).map((p) => { const r = G.petRt.get(p.id); return r && r.mode; }));
    assert(trail.some((m) => m === 'trail'), 'nenhum vagante segue o favorito na cidade: ' + JSON.stringify(trail));
    await shot('vagante-seguindo-favorito');
    await ev(() => { G.S.speed = 3; G.S.paused = false; });
    await ev(() => { for (const h of G.S.heroes) { h.tThink = 99; } });
    const got = await until(() => G.S.pets.every((p) => !p.out) ? 1 : 0, null, 40000);
    assert(got, 'os vagantes não escolheram a tempo');
    const r = await ev(() => ({ lines: G.S.log.map((l) => l.m).filter((m) => /escolheu/.test(m)), toasts: window.__toasts.filter((m) => /escolheu/.test(m)), modal: G.UI.modalOpen, heroes: G.S.heroes.map((h) => [h.name, h.pets.length]) }));
    assert(r.lines.length >= 4, 'esperava 4 linhas «escolheu», vi ' + r.lines.length);
    assert(r.toasts.length >= 1 && !r.modal, 'sem aviso leve ou abriu janela: ' + JSON.stringify(r.toasts));
    console.log('         ' + r.lines[0]);
    await ev(() => { G.S.speed = 1; });
  });

  await step('herói com 3 mascotes: eles o seguem em fila, sem se sobrepor', async () => {
    const info = await ev(() => {
      const S = G.S, h = S.heroes[0]; S.b.estabulo = { lvl: 10 };
      for (const p of S.pets.slice()) G.petAssign(p, null);
      while (h.pets.length < 3) { const p = G.petNew(['draquinho', 'fadinha', 'gato'][h.pets.length], 3); p.out = 0; G.petAssign(p, h); }
      G.petAssign(G.petNew('coruja', 0), h);
      h.state = 'town'; h.inside = null; h.x = 40; h.y = 55.5; h.tThink = 99; G.petRt.clear(); G.R.setZoom(5); G.R.follow = h.id;
      return { n: h.pets.length };
    });
    assert(info.n === 3, 'o 4º mascote não foi recusado (h.pets=' + info.n + ')');
    /* anda pela praça: vai e volta */
    await ev(() => { const h = G.S.heroes[0]; G.go(h, 49, 56); h.state = 'goto'; h.dest = null; });
    let minD = 9, maxFar = 0, over = 0;
    for (let i = 0; i < 14; i++) {
      await page.waitForTimeout(450);
      const r = await ev(() => { const h = G.S.heroes[0]; h.state = 'town'; h.tThink = 99; if (!h.path || !h.path.length) { h._leg = !h._leg; G.go(h, h._leg ? 38.5 : 49, 55.5 + (h._leg ? 0.8 : 0)); } G.step(h, 0.45, h.dir ? 2.4 : 2.4); const rs = G.petsOf(h).map((p) => G.petRt.get(p.id)).filter(Boolean); let md = 9; for (let a = 0; a < rs.length; a++) for (let b = a + 1; b < rs.length; b++) md = Math.min(md, Math.hypot(rs[a].x - rs[b].x, rs[a].y - rs[b].y)); return { n: rs.length, md, far: Math.max(...rs.map((r) => Math.hypot(r.x - h.x, r.y - h.y))) }; });
      if (r.n === 3) { minD = Math.min(minD, r.md); maxFar = Math.max(maxFar, r.far); if (r.md < 0.3) over++; }
    }
    assert(maxFar < 6, 'os mascotes ficaram longe do dono (' + maxFar.toFixed(1) + ' passos)');
    assert(over <= 2, 'mascotes se sobrepõem com frequência (' + over + ' amostras com menos de 0,3 passo; mínimo ' + minD.toFixed(2) + ')');
    await ev(() => { const h = G.S.heroes[0]; h.path = null; h.moving = false; G.R.follow = h.id; });
    await page.waitForTimeout(2500);
    await shot('heroi-com-3-mascotes');
    console.log('         distância mínima entre mascotes ' + minD.toFixed(2) + ' · mais longe do dono ' + maxFar.toFixed(1));
    await ev(() => { G.R.follow = 0; });
  });

  await step('ficha do herói: Carisma explicado, 3 mascotes e o 4º recusado com aviso', async () => {
    const hid = await ev(() => G.S.heroes[0].id);
    await ev((id) => { G.UI.open('herois', 'lista', { hero: id }); }, hid); await page.waitForTimeout(500);
    const txt = await ev(() => document.querySelector('#sheet') ? document.querySelector('#sheet').innerText : document.body.innerText);
    assert(/Carisma/.test(txt) && /Personalidade/.test(txt) && /Fama/.test(txt), 'a ficha não mostra o Carisma e suas partes');
    await ev(() => { const el = [...document.querySelectorAll('#sheet .sec, #sheet h3')].find((e) => /Carisma/.test(e.textContent)); if (el) el.scrollIntoView({ block: 'center' }); }); await page.waitForTimeout(300);
    await shot('ficha-carisma', { x: 0, y: 150, width: 412, height: 600 });
    await page.tap('[data-a^="petpick:"]'); await page.waitForSelector('#modal.on'); await page.waitForTimeout(300);
    const m = await ev(() => document.querySelector('#modal').innerText);
    assert(/Mascotes de/.test(m) && /3\/3/.test(m) && /50%/.test(m), 'a janela de mascotes não mostra 3/3 e o retorno decrescente: ' + m.slice(0, 160));
    assert((m.match(/Dispensar/g) || []).length === 3, 'esperava 3 botões Dispensar');
    await shot('mascotes-do-heroi', { x: 0, y: 40, width: 412, height: 860 });
    await page.tap('[data-a="mclose"]'); await page.waitForTimeout(250);
    await ev(() => G.UI.close());
  });

  await step('Viveiro: estados dos mascotes e botões «Soltar na praça» / «Recolher»; escolher o dono à mão', async () => {
    await ev(() => {
      const S = G.S; S.realm.lvl = Math.max(S.realm.lvl, 6); S.b.estabulo = { lvl: 10 }; for (const h of S.heroes) { while (h.pets.length > 0) G.petAssign(G.petById(h.pets[0]), null); }
      for (const p of S.pets.slice()) if (p.out) G.petToViveiro(p);
      const a = G.petNew('jabuti', 1); a.out = 0; const b = G.petNew('morcego', 0); G.petStrayOn(b); const c = G.petNew('golem', 2); c.out = 0; G.petAssign(c, S.heroes[1]);
      window.__v = { stored: a.id, stray: b.id, owned: c.id }; G.UI.open('armazem', 'atelie');
    });
    await page.waitForTimeout(500);
    await ev(() => { const el = document.getElementById('viveiro'); if (el) el.scrollIntoView({ block: 'start' }); }); await page.waitForTimeout(300);
    const txt = await ev(() => document.body.innerText);
    for (const re of [/Viveiro/, /Soltar na praça/, /Recolher/, /vaga pela praça procurando dono/, /livre no Viveiro/, /acompanha /]) assert(re.test(txt), 'o Viveiro não mostra ' + re);
    await shot('viveiro', { x: 0, y: 60, width: 412, height: 800 });
    await page.tap('[data-a="petsq:' + (await ev(() => window.__v.stored)) + '"]'); await page.waitForTimeout(300);
    assert(await ev(() => G.petById(window.__v.stored).out === 1), '«Soltar na praça» não soltou o mascote');
    await page.tap('[data-a="petrec:' + (await ev(() => window.__v.stray)) + '"]'); await page.waitForTimeout(300);
    assert(await ev(() => G.petById(window.__v.stray).out === 0), '«Recolher» não guardou o vagante');
    await ev(() => G.UI.close()); await page.waitForTimeout(300);
    /* escolher o dono à mão: toque no vagante, «Escolher o dono», um herói da lista */
    await ev(() => { const p = G.petById(window.__v.stored); G.R.setZoom(5); for (const h of G.S.heroes) { h.x = 40 + Math.random() * 2; h.y = 56 + Math.random(); h.state = 'town'; h.tThink = 99; } G.S.paused = true; const r = G.petRt.get(p.id); G.R.follow = 0; G.R.focus(r.x, r.y - 0.2, true); });
    await page.waitForTimeout(300);
    const pt = await ev(() => { const r = G.petRt.get(window.__v.stored); return G.R.worldToScreen(r.x, r.y - 0.4); });
    await page.touchscreen.tap(pt[0], pt[1]); await page.waitForTimeout(500);
    assert(await ev(() => G.UI.dock.kind === 'pet'), 'o toque não abriu o cartão do vagante');
    await page.tap('[data-a^="petown:"]'); await page.waitForSelector('#modal.on'); await page.waitForTimeout(300);
    await shot('escolher-o-dono', { x: 0, y: 40, width: 412, height: 800 });
    await page.tap('.opt[data-a^="petgive:"]:not([disabled])'); await page.waitForTimeout(400);
    assert(await ev(() => G.petById(window.__v.stored).hero > 0 && !G.petById(window.__v.stored).out), 'escolher o dono à mão não passou o mascote ao herói');
    await ev(() => { G.S.paused = false; });
  });

  await step('save e recarga: três mascotes, vagante e relógio de escolha sobrevivem', async () => {
    await ev(() => { const S = G.S, h = S.heroes[0]; while (h.pets.length < 3) { const q = G.petNew(['draquinho', 'fadinha', 'gato'][h.pets.length], 2); q.out = 0; G.petAssign(q, h); } const p = G.petNew('raposa', 1); G.petStrayOn(p); window.__stray = { id: p.id, left: Math.round(p.at - S.t) }; G.M.save(); });
    await page.reload(); await startContinue(); await page.waitForTimeout(1500);
    const r = await ev(() => { const S = G.S, h = S.heroes[0], p = G.petById(window.__stray ? window.__stray.id : 0); return { run: G.M.running, n: h.pets.length, ok: G.petsOf(h).every((q) => q.hero === h.id), links: S.pets.filter((q) => q.hero).length }; });
    assert(r.run && r.n === 3 && r.ok, 'os 3 mascotes não voltaram: ' + JSON.stringify(r));
  });

  await step('save da v27-A (um mascote por herói, sem h.pets) carrega e migra', async () => {
    await ev(() => {
      G.M.save(); const k = G.SAVE_KEY, s = JSON.parse(localStorage.getItem(k));
      const h = s.heroes[0], keep = h.pets[0]; for (const x of s.heroes) { delete x.pets; x.pet = 0; } h.pet = keep;
      for (const p of s.pets) { delete p.out; delete p.tp; delete p.at; if (p.id !== keep) p.hero = 0; }
      s.saved = Date.now() - 5000; localStorage.setItem(k, JSON.stringify(s)); G.M.save = () => false; window.__keep = keep;
    });
    await page.reload(); await startContinue(); await page.waitForTimeout(1800);
    const r = await ev(() => { const S = G.S, h = S.heroes[0]; return { run: G.M.running, pets: h.pets.slice(), pet: h.pet, links: S.pets.filter((p) => p.hero).length, out: S.pets.filter((p) => p.out).length, all: S.heroes.every((x) => Array.isArray(x.pets)) }; });
    assert(r.run && r.all && r.pets.length === 1 && r.pets[0] === r.pet && r.links === 1 && r.out === 0, 'migração falhou: ' + JSON.stringify(r));
    await shot('save-v27a-migrado', { x: 0, y: 0, width: 412, height: 400 });
  });

  await browser.close();
  /* ---- custo do quadro ---- */
  const b2 = await chromium.launch();
  const depois = await perf(b2, FILE, 'depois'); let antes = null;
  if (BASE && fs.existsSync(BASE)) antes = await perf(b2, path.resolve(BASE), 'antes');
  await b2.close();
  const fmt = (o) => ['lenharia', 'pedreira', 'fazenda', 'cidade'].map((k) => k + ' ' + o.r[k].draw + ' ms').join(' · ') + ' · tick ' + o.r.tick + ' ms';
  console.log('\nCusto do quadro (R.frame, ms, 3 prédios no nível 6):\n  depois: ' + fmt(depois)); if (antes) console.log('  antes : ' + fmt(antes));
  if (depois.errs.length) errs.push(...depois.errs.map((e) => 'perf: ' + e));

  const bad = results.filter((r) => !r.ok), ne = errs.length;
  if (ne) { console.log('\nErros de console/página:'); [...new Set(errs)].slice(0, 12).forEach((e) => console.log('  - ' + e.slice(0, 300))); }
  console.log('\n' + (results.length - bad.length) + ' ok, ' + bad.length + ' falhas, ' + ne + ' erros de console/página');
  process.exit(bad.length || ne ? 1 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
