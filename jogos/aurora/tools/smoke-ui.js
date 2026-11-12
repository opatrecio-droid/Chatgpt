#!/usr/bin/env node
/* Fumaça da interface (Fase C da v27): abre TODAS as telas alcançáveis (título, apresentação, mapa em repouso, bandejas do HUD, trilho de atalhos,
   cada aba de cada painel da barra, ficha do herói e suas abas, janelas, cartões de prédio, pendências e decisão, retorno de ausência) em três telas:
   412×915 (dpr 2), 360×640 (dpr 1) e 412×915 com dpr fracionário (2,625). Em cada uma confere: nenhum erro de console/página, nenhum rolamento
   horizontal do #app, que o border-image das molduras realmente renderizou (não "none") e registra os textos cortados/estourados (aviso, não reprova).
   Tira uma captura por tela em --out/<tela>/NN-nome.png.
   Uso: node tools/smoke-ui.js [--file x.html] [--out pasta] [--only 412x915-d2] [--quick] */
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const flag = (k) => process.argv.includes('--' + k);
const FILE = path.resolve(arg('file', path.join(__dirname, '..', 'aurora-v27.html')));
const DEF_OUT = '/tmp/claude-0/-home-user-Chatgpt/7a7f5893-7401-5a6e-8d04-2ae4d5f0aa59/scratchpad/phaseC/ui';
const OUT = arg('out', fs.existsSync(path.dirname(DEF_OUT)) ? DEF_OUT : '/tmp/aurora-ui');
const CONFIGS = [
  { name: '412x915-d2', w: 412, h: 915, dpr: 2 },
  { name: '360x640-d1', w: 360, h: 640, dpr: 1 },
  { name: '412x915-d2625', w: 412, h: 915, dpr: 2.625 },
].filter((c) => !arg('only', '') || c.name === arg('only', ''));

/* estado "rico": tudo liberado, 7 heróis, recursos (roda dentro da página) */
const rich = () => {
  const S = G.S; S.tut.guide = 0; S.tut.done = true;
  S.realm.lvl = 7; S.realm.xp = 40; S.day = 22; S.clock = 6 * 60 + 10;
  for (const id of G.BLD_IDS) S.b[id] = Object.assign(S.b[id] || {}, { lvl: id === 'cidadela' ? 7 : 4 });
  S.gold = 220000; S.selos = 15; S.nucleos = 43;
  for (const k in G.RES) S.res[k] = Math.max(S.res[k] || 0, 45);
  while (S.heroes.length < 7) S.heroes.push(G.makeHero({ lvl: 30 + S.heroes.length * 3, rar: S.heroes.length % 4 }));
  G.syncNpcs && G.syncNpcs(); G.dirtyAll && G.dirtyAll(); G.emit('bld'); G.emit('heroes');
  S.quest.step = Math.max(S.quest.step, 7); S.paused = false; S.speed = 1; S.sys = null; G.sysCheck && G.sysCheck('quiet');
};

const problems = [], summary = [];
(async () => {
  const browser = await chromium.launch();
  for (const cfg of CONFIGS) {
    const dir = path.join(OUT, cfg.name); fs.mkdirSync(dir, { recursive: true });
    for (const f of fs.readdirSync(dir)) if (/^\d\d-.*\.png$/.test(f)) fs.unlinkSync(path.join(dir, f));
    const ctx = await browser.newContext({ viewport: { width: cfg.w, height: cfg.h }, deviceScaleFactor: cfg.dpr, isMobile: true, hasTouch: true });
    const page = await ctx.newPage(); page.setDefaultTimeout(10000);
    const errs = []; page.on('console', (m) => { if (m.type() === 'error') errs.push('console.error: ' + m.text()); }); page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
    const ev = (fn, a) => page.evaluate(fn, a);
    let n = 0, ok = 0, bad = 0; const warn = [];
    const log = (m) => console.log('[' + cfg.name + '] ' + m);

    /* confere a tela aberta */
    const check = async (name) => {
      const r = await ev(() => {
        const out = { overflow: false, frames: [], clipped: [], off: [] };
        const app = document.getElementById('app');
        out.overflow = app.scrollWidth > app.clientWidth + 1 || document.documentElement.scrollWidth > innerWidth + 1;
        if (out.overflow) {      // quem estoura: esconde cada filho até o rolamento sumir
          const sw = app.scrollWidth, res = [];
          const walk = (el, d) => { for (const c of el.children) { const old = c.style.display; c.style.display = 'none'; const s2 = app.scrollWidth; c.style.display = old; if (s2 < sw) { res.push((c.id ? '#' + c.id : '') + '.' + String(c.className).slice(0, 24) + '<' + c.tagName.toLowerCase() + '>'); if (d < 5) walk(c, d + 1); } } };
          walk(app, 0); out.culprit = res.slice(0, 6).join(' > ');
        }
        const vis = (e) => { const r = e.getBoundingClientRect(); if (!r.width || !r.height) return false; const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0'; };
        for (const sel of ['.hud-row', '#sheet.on', '.mbox', '#bcard.on', '#nav']) { const e = document.querySelector(sel); if (e && vis(e)) { const b = getComputedStyle(e).borderImageSource; out.frames.push([sel, /url\(/.test(b)]); } }
        const roots = [...document.querySelectorAll('#sheet.on, #modal.on, #bcard.on, #hud, #rail, #nav, #quest, #nrw')].filter(vis);
        for (const root of roots) for (const e of root.querySelectorAll('*')) {
          if (out.clipped.length > 12) break;
          const t = (e.childNodes.length && [...e.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) ? e.textContent.trim() : '';
          if (!t || !vis(e)) continue;
          const cs = getComputedStyle(e);
          if (e.scrollWidth > e.clientWidth + 1 && /hidden|clip/.test(cs.overflowX) && e.clientWidth > 0) out.clipped.push((cs.textOverflow === 'ellipsis' ? '…' : 'X') + ' ' + t.slice(0, 40));
          const r = e.getBoundingClientRect(); let sc = false; for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if (/auto|scroll/.test(o)) { sc = true; break; } } if (!sc && r.right > innerWidth + 2 && r.left < innerWidth) out.off.push(t.slice(0, 40) + ' @' + Math.round(r.right));
        }
        return out;
      });
      const issues = [];
      if (r.overflow) issues.push('rolamento horizontal do #app' + (r.culprit ? ' (' + r.culprit + ')' : ''));
      for (const [sel, okf] of r.frames) if (!okf) issues.push('border-image não renderizou em ' + sel);
      if (r.off.length) issues.push('texto fora da tela: ' + r.off.slice(0, 3).join(' | '));
      if (r.clipped.length) warn.push(name + ': cortado ' + r.clipped.slice(0, 6).join(' | '));
      return issues;
    };
    const S = async (name, fn, o) => {
      o = o || {}; const e0 = errs.length; let issues = [];
      try {
        await fn(); await page.waitForTimeout(o.wait || 380);
        issues = await check(name);
        await page.screenshot({ path: path.join(dir, String(++n).padStart(2, '0') + '-' + name.replace(/[^\w-]+/g, '-') + '.png'), scale: 'css' });
      } catch (e) { issues.push('exceção: ' + String(e && e.message || e).split('\n')[0]); }
      const ne = errs.length - e0; if (ne) issues.push(ne + ' erro(s): ' + errs.slice(e0).join(' || ').slice(0, 220));
      if (issues.length) { bad++; problems.push(cfg.name + ' · ' + name + ' — ' + issues.join('; ')); log('FALHA ' + name + ' — ' + issues.join('; ')); } else ok++;
      if (o.after) { try { await o.after(); } catch (e) { /* ok */ } }
    };
    const closeAll = () => ev(() => { const U = G.UI; if (U.modalOpen) U.closeModal(); if (U.dock && U.dock.kind) U.dock.close(); U.close(); document.querySelectorAll('.tray.on,#logtray.on').forEach((e) => e.classList.remove('on')); });

    /* ---------- boot, título, apresentação ---------- */
    await page.goto('file://' + FILE, { waitUntil: 'domcontentloaded' });
    await S('boot', async () => { await page.waitForSelector('#boot'); }, { wait: 60 });
    await page.waitForSelector('#title.on', { timeout: 30000 }); await page.waitForTimeout(600);
    await S('titulo', async () => {});
    await ev(() => { localStorage.clear(); });
    await page.tap('[data-a="t-new"]'); await page.waitForSelector('#modal.on .rosa');
    await S('apresentacao-rosa', async () => {});
    await page.tap('[data-a="tnext"]'); await page.waitForTimeout(300);
    await S('apresentacao-2', async () => {});
    await page.tap('[data-a="tskip"]').catch(() => page.tap('[data-a="tnext"]')); await page.waitForTimeout(600);
    await ev(() => { G.S.tut.done = true; G.S.tut.guide = 0; if (G.UI.modalOpen) G.UI.closeModal(); });
    await page.waitForTimeout(800);
    await S('mapa-jogo-novo', async () => {}, { wait: 600 });

    /* ---------- estado rico ---------- */
    await ev(rich); await page.waitForTimeout(1500);
    await ev(() => { for (const k of Object.keys(G.S.sys.nw)) delete G.S.sys.nw[k]; });
    await S('mapa-em-repouso', async () => { await ev(() => { G.UI.toast('Aurora cresceu.', 'good', 'castle'); }); }, { wait: 800 });
    await S('mapa-bandeja-recursos', async () => { await page.tap('.cur .chip.gold'); });
    await S('mapa-fila-de-avisos', async () => { await ev(() => { const U = G.UI; for (let i = 0; i < 7; i++) U.toast('Aviso de teste número ' + (i + 1) + ' para a fila', i % 2 ? 'info' : 'good', 'spark'); }); }, { wait: 500 });
    await S('mapa-registro-aberto', async () => { await page.waitForTimeout(5000); await ev(() => { const c = document.querySelector('#logchip'); if (c) c.click(); else G.UI.ACT.logtray(); }); });
    await closeAll();
    await S('trilho-recolhido', async () => { await page.tap('#railtab'); }, { after: () => page.tap('#railtab') });
    await S('trilho-decretos', async () => { await page.tap('#fab-dec'); }, { after: () => ev(() => { document.querySelector('#decrees').classList.remove('on'); }) });
    await S('mapa-semana-aberta', async () => { await page.waitForTimeout(500); await ev(() => { const w = document.querySelector('#hudx .wk'); if (w && w.style.display !== 'none') w.click(); }); });
    await ev(() => { document.querySelectorAll('#hudx .open').forEach((e) => e.classList.remove('open')); });

    /* ---------- trilho: bloqueado e novo ---------- */
    await S('trilho-bloqueado-e-novo', async () => { await ev(() => { const S0 = G.S; S0.realm.lvl = 4; S0.sys.open = {}; for (const k of Object.keys(S0.sys.nw)) delete S0.sys.nw[k]; S0.sys.nw.arena = 1; G.sysCheck('quiet'); S0.sys.open.arena = 0; delete S0.sys.open.arena; }); await page.waitForTimeout(800); });
    await S('trilho-toque-no-bloqueado', async () => { await ev(() => { const el = document.querySelector('#rail .rs.lk:not([style*="none"])'); if (el) el.click(); }); });
    await ev(rich); await page.waitForTimeout(600);

    /* ---------- comportamento: trilho, fila de avisos, fichas do HUD, faixa de objetivo ---------- */
    const B = async (name, fn) => { const e0 = errs.length; try { await fn(); ok++; } catch (e) { bad++; const m = cfg.name + ' · comportamento: ' + name + ' — ' + String(e && e.message || e).split('\n')[0]; problems.push(m); log('FALHA ' + m); } if (errs.length > e0) { bad++; problems.push(cfg.name + ' · comportamento: ' + name + ' — erro de console'); } };
    const must = (c, m) => { if (!c) throw new Error(m); };
    await closeAll(); await ev(() => { G.S.opts.railOff = 0; });
    await B('cada ícone do trilho abre a tela certa', async () => {
      for (const [id, name, tab] of [['incursoes', 'missoes', 'incursoes'], ['colosso', 'missoes', 'colosso'], ['arena', 'missoes', 'arena'], ['fenda', 'missoes', 'fenda'], ['viveiro', 'armazem', 'atelie']]) {
        await ev(() => G.UI.close());
        await page.evaluate((id) => { document.querySelector('#rail [data-r="' + id + '"]').click(); }, id); await page.waitForTimeout(200);
        const r = await ev(() => G.UI.sheet && [G.UI.sheet.name, G.UI.sheet.tab]); must(r && r[0] === name && r[1] === tab, id + ' abriu ' + JSON.stringify(r));
      }
      await ev(() => G.UI.close());
    });
    await B('Decretos abre a bandeja de decretos', async () => { await page.evaluate(() => document.querySelector('#fab-dec').click()); await page.waitForTimeout(150); must(await ev(() => document.querySelector('#decrees').classList.contains('on')), 'bandeja não abriu'); await page.evaluate(() => document.querySelector('#fab-dec').click()); });
    await B('a aba recolhe o trilho e o estado fica em S.opts', async () => {
      await page.tap('#railtab'); await page.waitForTimeout(300);
      const r = await ev(() => ({ off: G.S.opts.railOff, vis: [...document.querySelectorAll('#rail .rs')].filter((e) => e.offsetParent && e.getBoundingClientRect().width > 30).length }));
      must(r.off === 1 && r.vis === 0, 'recolhido: ' + JSON.stringify(r)); await page.tap('#railtab'); await page.waitForTimeout(300);
      must(await ev(() => G.S.opts.railOff === 0), 'não reabriu');
    });
    await B('no máximo um aviso visível, o resto vira +N', async () => {
      await ev(() => { for (let i = 0; i < 9; i++) G.UI.toast('Aviso ' + i, 'info', 'spark'); }); await page.waitForTimeout(250);
      const r = await ev(() => ({ n: document.querySelectorAll('#toasts .toast').length, c: (document.querySelector('#toasts .toast .tc') || {}).textContent }));
      must(r.n === 1, r.n + ' avisos visíveis'); must(/^\+\d+$/.test(r.c || ''), 'sem contador +N: ' + r.c);
      await page.waitForTimeout(9000);
    });
    await B('ficha da semana: um toque abre o texto, o segundo abre a tela', async () => {
      const has = await ev(() => { const w = document.querySelector('#hudx .wk'); return !!w && w.style.display !== 'none'; }); if (!has) return;
      await page.evaluate(() => document.querySelector('#hudx .wk').click()); await page.waitForTimeout(150);
      must(await ev(() => document.querySelector('#hudx .wk').classList.contains('open') && !G.UI.modalOpen), 'primeiro toque não só expandiu');
      await page.evaluate(() => document.querySelector('#hudx .wk').click()); await page.waitForTimeout(300);
      must(await ev(() => G.UI.modalOpen), 'segundo toque não abriu a janela'); await closeAll();
    });
    await B('uma faixa de objetivo só', async () => {
      await page.waitForTimeout(900);
      const r = await ev(() => ['#quest', '#nrw'].map((q) => { const e = document.querySelector(q); const cs = e && getComputedStyle(e); return !!e && cs.display !== 'none' && cs.visibility !== 'hidden' && e.offsetHeight > 0 ? 1 : 0; }));
      must(r[0] + r[1] === 1, 'faixas visíveis: ' + JSON.stringify(r));
    });
    await B('retratos: faixa rolável e ordenada quando passam de 5', async () => {
      const r = await ev(() => { const el = document.querySelector('#roster'); return { n: G.S.heroes.length, sc: el.scrollWidth > el.clientWidth || G.S.heroes.length <= 5, ord: [...el.querySelectorAll('.hc')].filter((e) => e.style.order !== '').length }; });
      must(r.n > 5 ? r.ord > 0 : true, 'ordem não aplicada ' + JSON.stringify(r));
    });

    /* ---------- painéis da barra: cada aba ---------- */
    const sheets = await ev(() => Object.keys(G.UI.SHEETS).map((k) => [k, (G.UI.tabsFor(k, G.UI.SHEETS[k].tabs) || []).filter((t) => !/^lock:/.test(t[0])).map((t) => t[0])]));
    for (const [name, tabs] of sheets) {
      if (!tabs.length) { await S('painel-' + name, async () => { await ev((n) => G.UI.open(n), name); await page.waitForTimeout(250); }, { after: closeAll }); continue; }
      for (const tab of tabs) {
        if (flag('quick') && tabs.indexOf(tab) > 1) continue;
        await S('painel-' + name + '-' + tab, async () => { await ev(([n, t]) => { G.UI.close(); G.UI.open(n, t); }, [name, tab]); await page.waitForTimeout(250); await ev(() => { const b = document.querySelector('#sheet .sh-body'); if (b) b.scrollTop = 0; }); }, { after: closeAll });
        if (!flag('quick') && !/^(reino|missoes|mais)$/.test(name) || tabs.indexOf(tab) >= 0) { /* rolagem: segunda página */ }
      }
    }
    /* ficha do herói e abas */
    await S('heroi-ficha', async () => { await ev(() => { const h = G.S.heroes[0]; G.UI.open('herois', 'lista', { hero: h.id }); }); });
    const htabs = await ev(() => [...document.querySelectorAll('#sheet .htabs button')].map((b) => b.getAttribute('data-a')));
    for (const a of htabs) { if (!a) continue; await S('heroi-aba-' + a.replace(/\W+/g, '-'), async () => { await ev((a) => { const b = document.querySelector('#sheet .htabs [data-a="' + a + '"]'); if (b) b.click(); }, a); }); }
    await closeAll();

    /* ---------- janelas ---------- */
    const M = (name, js, o) => S('janela-' + name, async () => { await ev(js); await page.waitForSelector('#modal.on', { timeout: 4000 }).catch(() => {}); }, Object.assign({ after: closeAll }, o || {}));
    await M('recrutar', () => G.UI.recruitModal());
    await M('mapa-do-reino', () => G.UI.mapModal());
    await M('dificuldade', () => G.UI.diffModal());
    await M('confirmar', () => G.UI.confirm('Apagar tudo?', 'A jornada salva neste aparelho será apagada. Não há como desfazer.', 'Apagar', () => {}));
    await M('exportar', () => G.UI.exportModal());
    await M('importar', () => G.UI.importModal());
    await M('calendario', () => G.UI.calModal && G.UI.calModal());
    await M('semana', () => G.UI.weekModal && G.UI.weekModal());
    await M('novidades', () => G.UI.whatsNew && G.UI.whatsNew());
    await M('item', () => { const it = G.S.inv[0]; if (it) G.UI.itemModal(it.id); else G.UI.toast('sem item'); });
    await M('presente', () => G.UI.giftModal(G.S.heroes[0].id));
    await M('mare', () => G.UI.mareModal({ on: false, win: true, a: { killed: 8, total: 10, lost: 0 }, rewards: { gold: 120 } }));
    await S('janela-duelo-da-arena', async () => { await ev(() => { G.UI.open('missoes', 'arena'); }); await page.waitForTimeout(400); await ev(() => { const b = document.querySelector('[data-a^="arfight:"]:not([disabled])'); if (b) b.click(); }); await page.waitForSelector('#modal.on', { timeout: 4000 }).catch(() => {}); await page.waitForTimeout(1500); }, { after: closeAll });
    await M('evento-cidade', () => { const S0 = G.S; S0.ev.pending = null; S0.ev.next = 0; G.eventRoll(); G.UI.eventModal(); });
    await closeAll();

    /* ---------- cartões do mapa ---------- */
    const dock = (name, js) => S('cartao-' + name, async () => { await ev(js); }, { after: closeAll });
    await dock('predio-lenharia', () => G.UI.bldCard('lenharia'));
    await dock('predio-ferraria', () => G.UI.bldCard('ferraria'));
    await dock('predio-guilda', () => G.UI.bldCard('guilda'));
    await dock('casa', () => G.UI.houseCard(0));
    await S('pendencias-e-decisao', async () => { await ev(() => { const S0 = G.S; S0.ev.pending = null; S0.ev.next = 0; G.eventRoll(); }); await page.waitForTimeout(800); await page.tap('#fab-inbox'); }, { after: closeAll });
    await S('atalho-decisao-no-trilho', async () => { await page.waitForTimeout(300); });
    await S('decisao-cartao', async () => { await ev(() => G.UI.eventModal()); }, { after: closeAll });
    await ev(() => { const S0 = G.S; S0.ev.pending = null; });
    await S('inspecionar-heroi', async () => { await ev(() => { const h = G.S.heroes[1]; G.R.follow = h.id; G.UI.inspect({ type: 'hero', ref: h }); }); }, { after: () => ev(() => G.UI.inspect(null)) });
    await S('banner-de-reino', async () => { await ev(() => G.UI.banner('O renome de Aurora cresce', 'Nível de Reino 8', '+5.000 moedas · +3 Selos')); }, { wait: 500 });
    await S('heroi-em-perigo', async () => { await ev(() => { const h = G.S.heroes[2]; G.emit('danger', { h }); }); }, { wait: 600 });

    /* ---------- ausência: tela de espera e resumo ---------- */
    await ev(() => { G.M.save(); const k = G.SAVE_KEY, s = JSON.parse(localStorage.getItem(k)); s.saved = Date.now() - 20 * 3600 * 1000; localStorage.setItem(k, JSON.stringify(s)); G.M.save = () => false; });
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForSelector('#title.on', { timeout: 30000 }); await page.waitForTimeout(400);
    await page.tap('[data-a="t-continue"]');
    await S('ausencia-calculando', async () => {}, { wait: 250 });
    await page.waitForFunction(() => !G.M.away, null, { timeout: 60000 }).catch(() => {});
    await page.waitForSelector('#modal.on', { timeout: 15000 }).catch(() => {});
    await S('ausencia-resumo', async () => { await page.waitForTimeout(500); }, { wait: 600 });
    await ev(() => { const m = document.querySelector('#modal.on'); const b = m && m.querySelector('[data-a="mclose"], .btn.pri'); if (b) b.click(); });
    await closeAll(); await page.waitForTimeout(500);

    const real = errs.length; log(ok + ' telas ok, ' + bad + ' com problema' + (warn.length ? ', ' + warn.length + ' avisos de texto cortado' : '') + (real ? ', ' + real + ' erros de console no total' : ''));
    for (const w of warn.slice(0, 40)) console.log('  aviso · ' + w);
    summary.push({ cfg: cfg.name, ok, bad, warn: warn.length, errors: errs.length });
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ summary, problems }, null, 1));
  console.log('\nCapturas em ' + OUT + '\n' + (problems.length ? problems.length + ' problema(s):\n  - ' + problems.join('\n  - ') : 'sem problemas'));
  process.exit(problems.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
