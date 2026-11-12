/* 6B-ui-atrito: v25 — interface do lote 3-D: guia completo (3D.1), HUD compacto (3D.2), alerta de herói em perigo (3D.3),
   peças no chão e +N com proteção (3D.4), vibração e tremor (3D.5). Só interface. */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const UI = G.UI, A = G.A, R = G.R, ic = UI.ic, esc = UI.esc, $ = UI.$;
  const css = document.createElement('style');
  css.textContent = [
    /* 3D.1: pré-requisito na barra da Jornada (no lugar da barrinha de progresso) */
    '#quest .qpre{display:block;margin-top:3px;font-size:10.5px;font-weight:800;color:var(--gold2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '#quest.pre .qn{display:none}',
    '.prebox{margin:8px 0 2px;padding:8px 10px;border-radius:10px;border:1px solid rgba(226,182,89,.5);background:rgba(226,182,89,.09)}',
    '.prebox b{color:var(--gold2)}.prebox ol{margin:5px 0 0;padding-left:18px;font-size:12.5px;line-height:1.45}',
    '.prebox .btn{margin-top:8px}',
  ].join('\n');
  document.head.appendChild(css);

  /* ================= 3D.1 guia completo e pré-requisitos ================= */
  /* A mão cobre toda a Jornada até "Construa o Mercado" (passo 13). Passos que pedem toque apontam o toque, com a cadeia de
     pré-requisitos de G.questPrereq() na frente (Cidadela, Nível de Reino, nível do herói); passos que o jogo cumpre sozinho
     (abates, nível, chefe) mostram uma dica curta junto da barra da Jornada por alguns segundos. Os passos 0, 2, 3 e 4 seguem na 67. */
  UI.GUIDE_LAST = 13;
  const MASC = { mercado: 1, treino: 1, santuario: 1, estabulo: 1 };
  const art = (id) => (MASC[id] ? 'o ' : 'a ') + G.BLD[id].name;
  let pasStep = -1, pasT0 = 0;
  /* dica passiva: some depois de alguns segundos em cada passo; nunca fica por cima de painel aberto */
  const hint = (st, text, ms) => {
    const now = performance.now();
    if (pasStep !== st) { pasStep = st; pasT0 = now; }
    if (now - pasT0 > (ms || 16000) || R.sel) return null;
    const e = $('#quest'); if (!UI.gd.vis(e) || UI.gd.covered(e)) return null;
    return { el: e, text, key: 'pas' + st };
  };
  const buildTarget = (st, p) => {
    const id = p.id, G0 = UI.gd, rep = p.k === 'repair', lvl = G.bLvl(id);
    const verb = rep ? 'conserte' : lvl ? 'melhore' : 'construa', k = 'b' + st + id;
    if (G0.sheetOn('reino')) {
      if (UI.sheet.tab !== 'obras') { const t = G0.tabBtn('obras'); return G0.vis(t) ? { el: t, text: 'Abra a aba Prédios.', key: k + 't' } : null; }
      const b = $('#sheet [data-a="' + (rep ? 'repair:' : 'upg:') + id + '"]') || $('#bc-' + id);
      if (b) return { el: b, text: b.disabled ? 'Faltam moedas ou materiais: seus heróis vão juntar.' : 'Toque para ' + (rep ? 'consertar ' : lvl ? 'melhorar ' : 'construir ') + art(id) + '.', key: k + 'b', scroll: 1 };
      return null;
    }
    return { el: $('#nav-reino'), text: 'Abra o Reino e ' + verb + ' ' + art(id) + '.', key: k + 'n' };
  };
  const contractTarget = (st) => {
    const S = G.S, G0 = UI.gd, ready = S.daily.list.findIndex((c) => !c.claimed && c.p >= c.n);
    if (G0.sheetOn('missoes')) {
      if (UI.sheet.tab !== 'contratos') { const t = G0.tabBtn('contratos'); return G0.vis(t) ? { el: t, text: 'Abra a aba Contratos.', key: 'c' + st + 't' } : null; }
      const b = ready >= 0 ? $('#sheet [data-a="contract:' + ready + '"]') : null;
      return b ? { el: b, text: 'Toque em Receber.', key: 'c' + st + 'b', scroll: 1 } : null;
    }
    if (ready >= 0) return { el: $('#nav-missoes'), text: 'Um contrato está pronto! Abra Missões e receba.', key: 'c' + st + 'n' };
    const now = performance.now(); if (pasStep !== st) { pasStep = st; pasT0 = now; }
    return now - pasT0 < 20000 ? { el: $('#nav-missoes'), text: 'Abra Missões › Contratos. Seus heróis os cumprem sozinhos.', key: 'c' + st + 'o' } : null;
  };
  const promoTarget = (st) => {
    const S = G.S, G0 = UI.gd, h = S.heroes.find((x) => G.canPromote(x)); if (!h) return null;
    if (G0.sheetOn('herois')) {
      const pb = $('#sheet [data-a="promote:' + h.id + '"]'); if (pb) return { el: pb, text: 'Toque em Promover.', key: 'p' + st + 'b', scroll: 1 };
      const c = $('#sheet [data-a="herod:' + h.id + '"]'); if (c) return { el: c, text: h.name + ' pode ser promovido. Toque no cartão.', key: 'p' + st + 'c', scroll: 1 };
      return null;
    }
    return { el: $('#nav-herois'), text: h.name + ' pode ser promovido! Abra Heróis.', key: 'p' + st + 'n' };
  };
  UI.guideExtra = (q, st) => {
    const pre = G.questPrereq(), b = G.questBuild(), p = pre ? (pre.root.k === 'realm' ? pre.root : pre.first) : b ? { k: 'bld', id: b.id, lvl: b.lvl } : null;
    if (p) {
      if (p.k === 'realm') return hint(st, 'Primeiro, o Nível de Reino ' + p.lvl + ': construir, vencer chefes e cumprir missões o fazem subir.', 22000);
      if (p.k === 'hlvl') return hint(st, 'Primeiro, ' + G.preStepTxt(p) + '. Eles sobem de nível caçando.', 22000);
      return buildTarget(st, p);
    }
    if (/contrato/i.test(q.t)) return contractTarget(st);
    if (/^Promova/.test(q.t)) return promoTarget(st) || hint(st, q.h);
    return hint(st, q.h + (q.n > 1 ? ' (' + q.cur + '/' + q.n + ')' : ''));
  };
  /* barra da Jornada com pré-requisito: toque leva direto à obra de que o passo depende */
  UI.ACT.gopre = () => {
    const p = G.questPrereq(), f = p && p.first;
    if (f && (f.k === 'bld' || f.k === 'repair')) UI.open('reino', 'obras', { bld: f.id });
    else if (f && f.k === 'hlvl') UI.open('herois', 'lista');
    else UI.open('missoes', 'jornada');
  };
  /* caixa "Antes" da aba Missões › Jornada */
  UI.preCard = () => {
    const p = G.questPrereq(); if (!p) return '';
    const f = p.first, go = f.k === 'bld' || f.k === 'repair' ? 'Ir para ' + G.BLD[f.id].short : f.k === 'hlvl' ? 'Abrir Heróis' : '';
    return '<div class="prebox"><b>Antes, falta isto' + (p.goal ? ' para ' + esc(p.goal) : '') + ':</b><ol>' + p.steps.map((s) => '<li>' + esc(G.preStepTxt(s).replace(/^./, (c) => c.toUpperCase())) + (s.k === 'realm' ? ' <small class="mut">(agora ' + G.S.realm.lvl + ')</small>' : s.k === 'hlvl' ? ' <small class="mut">(' + esc(s.name) + ' está no ' + s.have + ')</small>' : '') + '</li>').join('') + '</ol>' +
      (go ? '<button class="btn sm pri" data-a="gopre">' + go + '</button>' : '') + '</div>';
  };

  /* ================= 3D.2 HUD compacto (360×640) ================= */
  /* Em telas baixas (altura ≤ 720 px) o HUD encolhe: barra do reino menor, fichas e cartões de herói mais baixos, navegação de 54 px, e a
     Jornada e a próxima recompensa colam mais. A Jornada vira grade (ícone | título em até 2 linhas | barra + contagem), então o título
     não é mais cortado. Um botão ▾ no fim da faixa da semana recolhe a fila de heróis (lembrado neste aparelho). Em 412×860 só mudam a
     Jornada (título inteiro) e a faixa da semana. */
  css.textContent += '\n' + [
    '@media (max-width:859px){',
    '#quest{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:0 8px;align-items:center;padding:6px 10px}',
    '#quest .qi{grid-column:1;grid-row:1/span 2}',
    '#quest .qt{display:contents}',
    '#quest .qt b{grid-column:2/span 2;grid-row:1;white-space:normal;line-height:1.2;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}',
    '#quest .bar{grid-column:2;grid-row:2;margin-top:4px}',
    '#quest .qpre{grid-column:2/span 2;grid-row:2}',
    '#quest .qn{grid-column:3;grid-row:2;margin-top:4px}',
    '#nrw .nt{white-space:normal;line-height:1.15;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2}',
    '}',
    '@media (max-width:380px){',
    '#quest .qt b{font-size:11.5px}',
    '#quest{grid-template-columns:minmax(0,1fr) auto}#quest .qi{display:none}',
    '#quest .qt b,#quest .qpre{grid-column:1/span 2}#quest .bar{grid-column:1}#quest .qn{grid-column:2}',
    '}',
    '#hudtog{display:none;margin-left:auto;flex:none;width:28px;height:24px;border-radius:12px;place-items:center;color:var(--gold2);position:relative}',
    '#hudtog svg{width:14px;height:14px;fill:currentColor;transition:transform .2s}',
    '#hudtog::after{content:"";position:absolute;inset:-7px -6px}',
    '#hud.min #hudtog svg{transform:rotate(180deg)}',
    '@media (max-width:420px){#hudx:has(.sorte.on) .tm{display:none}}',
    '@media (max-width:859px) and (max-height:720px){',
    ':root{--navh:50px}#hud.min #roster{display:none}',
    '#hudtog{display:grid}',
    '#hud{gap:3px;padding-top:calc(var(--sat) + 5px)}',
    '.realm{padding:2px 9px 2px 3px}.ring,.ring svg{width:32px;height:32px}.ring b{font-size:13px}',
    '.ctl button{width:40px}.ctl button.dif{width:46px}',
    '.chip,.chip.mini{height:26px;font-size:12px}.chip svg{font-size:14px}',
    '#hudx{min-height:24px}#hudx .wk,#hudx .pwr,#hudx .sorte{height:24px}',
    '#roster{padding:0}',
    '.hc{width:40px;height:42px;border-radius:10px}',
    '.hc .pt{width:34px;height:34px;background-size:34px 34px}',
    '.hc .rk{min-width:12px;height:12px;font-size:8px;border-radius:4px}',
    '.hc .hpb{left:3px;right:3px;bottom:3px;height:4px}.hc .lv{bottom:6px;font-size:8.5px}.hc .st{bottom:6px;font-size:9.5px}',
    '#nav button{height:44px;gap:1px}#nav button svg{font-size:20px}',
    '#quest,#inspect,#fabs,#fabs-l{bottom:calc(var(--navh) + var(--sab) + 6px)}',
    '#nrw{bottom:calc(var(--navh) + var(--sab) + 6px + var(--qh,40px) + 4px);height:30px;min-height:0;padding:0 10px!important}#nrw .nv{padding:2px 6px}',
    '#nrw::after{content:"";position:absolute;left:0;right:0;top:-3px;bottom:-3px}',
    '}',
  ].join('\n');
  const HM_KEY = 'aurora.hudmin';
  const hmGet = () => { try { return localStorage.getItem(HM_KEY) === '1'; } catch (e) { return false; } };
  const hmSet = (v) => { try { localStorage.setItem(HM_KEY, v ? '1' : '0'); } catch (e) { /* ok */ } };
  UI.ACT.hudtog = () => { const h = $('#hud'); if (!h) return; const v = !h.classList.contains('min'); h.classList.toggle('min', v); hmSet(v); const b = $('#hudtog'); if (b) b.title = v ? 'Mostrar os heróis' : 'Recolher os heróis'; };
  const bdHx = UI.build;
  UI.build = () => {
    bdHx();
    const row = $('#hudx'); if (row && !$('#hudtog')) row.insertAdjacentHTML('beforeend', '<button id="hudtog" class="glass" data-a="hudtog" title="Recolher os heróis">' + ic('up') + '</button>');
    const h = $('#hud'); if (h && hmGet()) { h.classList.add('min'); const b = $('#hudtog'); if (b) b.title = 'Mostrar os heróis'; }
  };

  /* ================= 3D.3 aviso de herói em perigo ================= */
  /* Evento 'danger' (3F): a vida caiu muito, sem poção e com golpes recentes. Cartão vermelho com o retrato logo abaixo do HUD, uma vez por
     perigo: toque no retrato para acompanhar o herói; "Reunir" (Toque de Reunir) e "Curar" (Luz da Aurora, +40% de vida de todos). Some
     sozinho quando a vida se recupera, o herói sai da luta ou depois de 12 s. */
  css.textContent += '\n' + [
    '#dng{position:absolute;left:50%;transform:translateX(-50%);top:calc(var(--hudb,200px) + 8px);width:min(92vw,400px);z-index:9;display:flex;flex-direction:column;gap:6px;pointer-events:none}',
    '.dg{pointer-events:auto;display:flex;align-items:center;gap:8px;padding:6px 8px 6px 6px;border-radius:14px;background:linear-gradient(180deg,#4d1d26,#2b1119);border:1.5px solid #ee6464;box-shadow:0 6px 18px rgba(0,0,0,.5),0 0 14px rgba(238,100,100,.4);animation:dgin .25s ease-out,dgp 1.1s ease-in-out infinite alternate}',
    '@keyframes dgin{from{opacity:0;transform:translateY(-8px)}}@keyframes dgp{to{box-shadow:0 6px 18px rgba(0,0,0,.5),0 0 22px rgba(238,100,100,.75)}}',
    '.dg .dgp{flex:none;width:44px;height:44px;border-radius:10px;border:2px solid #ee6464;background:#141a30;display:grid;place-items:center;overflow:hidden}',
    '.dg .dgp i{width:40px;height:40px;background-size:40px 40px}',
    '.dg .dgt{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.25}',
    '.dg .dgt b{font-size:12.5px;color:#ffd0d0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.dg .dgt small{font-size:11px;color:#ffb3b3;font-weight:700}',
    '.dg .btn{flex:none;min-height:36px;padding:0 9px;font-size:11.5px}',
    '@media (prefers-reduced-motion:reduce){.dg{animation:none}}',
    '@media (max-width:859px){#app #toasts{top:calc(var(--hudb,200px) + 8px + var(--dgh,0px))}}',
  ].join('\n');
  const dgSet = () => { const b = $('#dng'); document.documentElement.style.setProperty('--dgh', b && b.children.length ? Math.ceil(b.getBoundingClientRect().height + 6) + 'px' : '0px'); };
  const dgAdd = (d) => {
    const box = $('#dng'); if (!box || !G.S) return;
    const h = d.h; if (box.querySelector('[data-id="' + h.id + '"]')) return;
    while (box.children.length >= 2) box.firstChild.remove();
    const el = document.createElement('div'); el.className = 'dg'; el.dataset.id = h.id; el._t0 = performance.now();
    el.innerHTML = '<button class="dgp" data-a="hero:' + h.id + '" title="Acompanhar ' + esc(h.name) + '"><i class="px" style="background-image:url(' + UI.portrait(h) + ')"></i></button>' +
      '<span class="dgt"><b>' + esc(h.name) + ' em perigo!</b><small></small></span>' +
      '<button class="btn sm" data-a="decree:reunir" data-dec="reunir" title="Toque de Reunir: todos voltam para a cidade">Reunir</button><button class="btn sm pri" data-a="decree:aurora" data-dec="aurora" title="Luz da Aurora: cura 40% da vida de todos os heróis em campo">Curar</button>';
    box.appendChild(el); dgFill(el, h); dgSet(); G.sfx('weak');
  };
  const dgFill = (el, h) => {
    const st = G.heroStats(h), pct = Math.max(1, Math.round(100 * h.hp / st.hp));
    const sm = el.querySelector('small'); const t = 'Vida ' + pct + '% · sem poções' + (el.dataset.boss === '1' ? ' · chefe por perto' : '');
    if (sm.textContent !== t) sm.textContent = t;
    for (const b of el.querySelectorAll('[data-dec]')) { const d = G.DECREES.find((x) => x.id === b.dataset.dec), ok = G.decreeReady(d); if (b.disabled === ok) b.disabled = !ok; }
  };
  let dgT = 0;
  const dgTick = () => {
    const box = $('#dng'); if (!box || !box.children.length || !G.S) return;
    const now = performance.now(); if (now - dgT < 400) return; dgT = now;
    let ch = false;
    for (const el of Array.from(box.children)) {
      const h = G.S.heroes.find((x) => x.id === +el.dataset.id), st = h && G.heroStats(h);
      if (!h || h.state === 'fallen' || h.state === 'recover' || h.state === 'town' || h.state === 'inside' || h.hp > st.hp * 0.5 || now - el._t0 > 12000) { el.remove(); ch = true; } else dgFill(el, h);
    }
    if (ch) dgSet();
  };
  const bdD = UI.build;
  UI.build = () => { bdD(); const app = $('#app'); if (app && !$('#dng')) app.insertAdjacentHTML('beforeend', '<div id="dng"></div>'); };
  G.on('danger', (d) => { if (G.S && G.M.running) { dgAdd(d); const el = $('#dng [data-id="' + d.h.id + '"]'); if (el && d.boss) el.dataset.boss = '1'; } });
  G.on('decree', () => { const box = $('#dng'); if (box) { box.innerHTML = ''; dgSet(); } });
  const rfD = UI.refresh;
  UI.refresh = () => { rfD(); dgTick(); };

  /* ================= 3D.4 peças no chão e +N com chance clara e proteção ================= */
  /* Peças caídas (G.pieces, 3F): brilho na cor da raridade (feixe de luz em Épico+), ícone da peça, tremeluz nos últimos segundos.
     Toque = Armazém (cerimônia só para Épico+, via G.giveItem → G.revealForge). */
  const pcImgs = {};
  const pcImg = (type) => {
    let e = pcImgs[type]; if (e) return e.ok ? e.img : null;
    e = pcImgs[type] = { ok: false, img: new Image() };
    const t = document.createElement('i'); t.className = 'gi gi-' + type; t.style.display = 'none'; document.body.appendChild(t);
    const m = /url\(["']?([^"')]+)["']?\)/.exec(getComputedStyle(t).backgroundImage); t.remove();
    if (m) { e.img.onload = () => { e.ok = true; }; e.img.src = m[1]; }
    return null;
  };
  const drawPiece = (p, X, Y, z) => {
    const ctx = R.ctx, S = G.S, left = G.PIECE.life - (S.t - p.t);
    if (left < G.PIECE.blink && Math.floor(R.t * 6) % 2) return;
    const col = G.RAR_COLOR[p.rar], px = Math.round(X(p.x)), py = Math.round(Y(p.y)), sc = Math.max(1, Math.round(z * 1.05)), sz = 16 * sc;
    const bob = Math.round((Math.sin(R.t * 3 + p.id) * 0.8 + 0.8) * sc), cy = py - sz / 2 - bob, pul = 0.5 + 0.5 * Math.sin(R.t * 4 + p.id);
    ctx.save();
    if (p.rar >= 3) {                                                  // feixe de luz para o alto
      const g = ctx.createLinearGradient(0, py, 0, py - 95 * z); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = 0.4 + 0.2 * pul; ctx.fillStyle = g; ctx.fillRect(px - 4.2 * z, py - 95 * z, 8.4 * z, 95 * z);
    }
    const gr = (p.rar >= 3 ? 20 : 14) * z, rg = ctx.createRadialGradient(px, cy, 1, px, cy, gr);
    rg.addColorStop(0, col); rg.addColorStop(0.55, col); rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.5 + 0.3 * pul + (p.rar >= 4 ? 0.15 : 0); ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(px, cy, gr, 0, 6.283); ctx.fill();
    ctx.globalAlpha = 0.9; ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, Math.round(z * 0.6)); ctx.beginPath(); ctx.ellipse(px, py, 6 * z, 2.4 * z, 0, 0, 6.283); ctx.stroke();
    ctx.globalAlpha = 1;
    const im = pcImg(p.spec.type);
    if (im) { ctx.imageSmoothingEnabled = false; ctx.drawImage(im, 0, 0, 16, 16, Math.round(px - sz / 2), Math.round(py - sz - bob), sz, sz); }
    const tw = (R.t * 1.4 + p.id * 0.37) % 1.8;                        // cintilar
    if (tw < 0.35) { const a = Math.sin(tw / 0.35 * Math.PI), sx = Math.round(px + ((p.id * 7) % 9 - 4) * sc), sy = Math.round(cy - sz * 0.3); ctx.globalAlpha = a; ctx.fillStyle = '#fff'; ctx.fillRect(sx - sc, sy, 3 * sc, sc); ctx.fillRect(sx, sy - sc, sc, 3 * sc); }
    ctx.restore();
  };
  const dm0 = R.dynMore;
  R.dynMore = (dyn, vx0, vx1, vy0, vy1) => {
    if (dm0) dm0(dyn, vx0, vx1, vy0, vy1);
    for (const p of G.pieces) if (p.x > vx0 && p.x < vx1 && p.y > vy0 && p.y < vy1 + 1) dyn.push({ y: p.y - 0.05, k: 'x', e: p, f: drawPiece });
  };
  const pm0 = R.pickMore;
  R.pickMore = (wx, wy) => {
    let best = null, bd = 1.0;
    for (const p of G.pieces) { const d = Math.hypot(p.x - wx, p.y - 0.4 - wy); if (d < bd) { bd = d; best = p; } }
    return best ? { type: 'drop', ref: best } : pm0 ? pm0(wx, wy) : null;
  };
  const nm0 = R.nightMore;
  R.nightMore = (hole) => { if (nm0) nm0(hole); for (const p of G.pieces) hole(p.x, p.y - 0.3, 1.6, 0.7); };
  const dt0 = UI.dropTap;
  UI.dropTap = (d) => {
    if (!d || !d.spec) return dt0 ? dt0(d) : null;
    const it = G.pieceTake(d);
    if (it && it.rar < 3) UI.toast('Peça no Armazém: ' + G.itemName(it) + ' (' + G.RAR[it.rar] + ')', it.rar >= 2 ? 'good' : 'info', 'hammer');
  };

  /* Aprimorar +N: chance em destaque, o que acontece numa falha e o Pergaminho de Proteção */
  css.textContent += '\n' + [
    '.upc{margin:10px 0 2px;padding:9px 11px;border-radius:12px;border:1px solid var(--line2);background:rgba(255,255,255,.04);text-align:left}',
    '.upc .upr{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:6px;font-size:12.5px}',
    '.upc .upp{font-family:"Aurora Cinzel",serif;font-size:20px}.upp.good{color:var(--good)}.upp.mid{color:var(--gold2)}.upp.bad{color:var(--bad)}',
    '.upc .upn{margin:7px 0 0;font-size:11.5px;color:var(--mut);line-height:1.35}',
    '.upc .tog{border-bottom:0;padding:8px 0 0}',
  ].join('\n');
  let protOn = true;
  const im0 = UI.itemModal;
  UI.itemModal = (id, hid, msg) => {
    im0(id, hid, msg);
    const it = UI.findItem && UI.findItem(id, hid), acts = $('#modal .acts'); if (!it || !acts) return;
    const S = G.S, max = Math.min(15, 4 + G.bLvl('ferraria'));
    if (msg && !msg.win) {                                            // texto da falha
      const p = Array.from(document.querySelectorAll('#modal p.lead')).find((e) => e.textContent.indexOf('têmpera falhou') >= 0);
      if (p) { p.textContent = msg.saved ? 'A têmpera falhou, mas o Pergaminho de Proteção devolveu moedas e materiais.' : 'A têmpera falhou. A peça continua em +' + it.plus + ', mas moedas e materiais se perderam.'; if (msg.saved) { p.classList.remove('bad'); p.classList.add('good'); } }
    }
    if (!G.bOk('ferraria') || it.plus >= max) return;
    const c = G.upgradeCost(it), pct = Math.round(c.chance * 100), have = S.res.pergaminho || 0, cls = pct >= 70 ? 'good' : pct >= 40 ? 'mid' : 'bad', bar = pct >= 70 ? 'g' : pct >= 40 ? 'o' : 'r';
    for (const e of document.querySelectorAll('#modal .cost')) if (/^chance/.test(e.textContent.trim())) e.remove();
    if (have < 1) protOn = true;
    acts.insertAdjacentHTML('beforebegin', '<div class="upc"><div class="upr"><b>Chance de sucesso</b><b class="upp ' + cls + '">' + pct + '%</b></div><div class="bar big ' + bar + '"><i style="width:' + pct + '%"></i></div>' +
      '<p class="upn">' + (pct >= 100 ? 'Garantido nesta etapa.' : 'Se falhar: a peça continua em +' + it.plus + ', mas as moedas e os materiais se perdem.') + '</p>' +
      (pct >= 100 ? '' : have > 0 ? '<button class="tog" data-a="protog"><span>Proteger com Pergaminho<small>Você tem ' + have + '. Se falhar, moedas e materiais voltam e o pergaminho é gasto; se der certo, ele fica.</small></span><i class="sw prot' + (protOn ? ' on' : '') + '"></i></button>' : '<p class="upn">Sem Pergaminho de Proteção. Ele vem do Baú do dia, de chefes e da Loja da Arena.</p>') + '</div>');
  };
  UI.ACT.protog = () => { protOn = !protOn; const sw = $('#modal .sw.prot'); if (sw) sw.classList.toggle('on', protOn); };
  UI.ACT.mupg = (a) => {
    const it = UI.findItem(+a[0], +a[1]); if (!it) return;
    const r = G.upgradeItem(it, protOn && (G.S.res.pergaminho || 0) > 0 && G.upgradeCost(it).chance < 1);
    if (!r.ok) return UI.toast(r.why, 'bad');
    UI.itemModal(+a[0], +a[1], r); UI.sheetDirty();
  };

  /* ================= 3D.5 vibração e tremor nos picos ================= */
  /* UI.feel(tipo): tremor curto de tela (R.shake) e vibração (navigator.vibrate, quando o aparelho tem). Mais forte para Lendário/Mítico, chefe
     derrotado, vitória na Arena a partir da liga Platina e marco de poder; curtinho para queda de herói e aviso de perigo. Opções › "Vibração e
     tremor de tela" desliga os dois (S.opts.noVibe; o padrão é ligado). O Modo leve e "reduzir movimento" do aparelho também calam o tremor. */
  const PAT = { epic: [30], legend: [45, 40, 70], myth: [60, 50, 60, 50, 160], boss: [90, 40, 110], arena: [50, 40, 130], mark: [40, 40, 40, 40, 90], fall: [140], danger: [30, 40, 30] };
  const SHK = { epic: 3, legend: 5, myth: 7, boss: 6, arena: 5, mark: 4 };
  const calm = () => { const S = G.S; return !S || (S.opts && S.opts.noVibe); };
  let redV = false, redT = -1e9;   // v26 (4C.3): o setter de R.shake roda a cada quadro; matchMedia só a cada 3 s
  const reduce = () => { const n = performance.now(); if (n - redT > 3000) { redT = n; try { redV = !!(window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches); } catch (e) { redV = false; } } return redV; };
  UI.feel = (kind) => {
    if (calm()) return;
    const sh = SHK[kind];
    if (sh && !(G.S.opts && G.S.opts.lowFx) && !reduce()) R.shake = Math.max(R.shake || 0, sh);
    try { if (navigator.vibrate && PAT[kind]) navigator.vibrate(PAT[kind]); } catch (e) { /* sem suporte */ }
  };
  /* o interruptor das Opções vale também para os tremores que já existiam (chefe, cartas, cerimônias, Arena) */
  { let shv = R.shake || 0; Object.defineProperty(R, 'shake', { get: () => shv, set: (x) => { shv = calm() || (G.S && G.S.opts && G.S.opts.lowFx) || reduce() ? 0 : x; }, configurable: true }); }
  G.on('reveal', (d) => { if (!d.it || d.it.rar < 4) return; UI.feel(d.it.rar >= 5 ? 'myth' : 'legend'); });
  G.on('bosskill', () => UI.feel('boss'));
  G.on('pmark', () => UI.feel('mark'));
  G.on('herofall', () => UI.feel('fall'));
  G.on('danger', () => UI.feel('danger'));
  G.on('arena', (d) => { if (d.t !== 'result') return; const a = G.arena(); if (a && a.last && a.last.win && G.arenaLeague(a.pts) >= 3) UI.feel('arena'); });

  /* @@fim6B */
})();

;
