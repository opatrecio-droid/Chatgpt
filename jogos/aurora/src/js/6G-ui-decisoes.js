/* 6G-ui-decisoes: v27 (A2) — nada pausa o jogo nem abre janela sozinho para pedir uma escolha.
   • UI.dock: cartão inferior sem pausa (o mapa continua visível e vivo por cima; toque fora fecha). Serve às decisões, ao cartão de prédio
     (6H-ui-predio) e a qualquer painel curto que venha depois.
   • Decisões pendentes (evento de cidade com prazo, 3K-decisoes): um atalho pequeno no canto do mapa com a contagem regressiva; abre as mesmas
     escolhas de antes, num cartão. Sem decisão até o prazo, Aurora aplica a opção segura e escreve uma linha no registro.
   • Caixa de pendências: o que antes abria janela sozinho (relatório da Maré, baú da Arena, Colosso, marcos de poder, novidades da versão) vira
     uma linha aqui + um aviso com toque; os pedidos dos moradores também são listados. Marcação simples e classes claras: o visual final vem na fase de arte. */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const UI = G.UI, R = G.R, ic = UI.ic, esc = UI.esc, $ = UI.$;
  const mmss = (s) => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60); };

  /* ---------- estilo ---------- */
  const css = document.createElement('style');
  css.textContent = [
    '#bcard{position:absolute;left:calc(var(--sal) + 8px);right:calc(var(--sar) + 8px);bottom:calc(var(--navh) + var(--sab) + 8px);max-height:min(48vh,440px);z-index:17;display:none;flex-direction:column;padding:12px 12px 10px;border-radius:18px;border-color:var(--gold)}',
    '#bcard.on{display:flex;animation:bcin .22s cubic-bezier(.2,.9,.3,1)}',
    '@keyframes bcin{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}',
    '#bcard .bc-x{position:absolute;right:6px;top:6px;width:36px;height:36px;display:grid;place-items:center;border-radius:12px;color:var(--mut);z-index:2}',
    '#bcard .bc-x svg{font-size:14px}',
    '#bcard .bc-in{overflow-y:auto;overflow-x:hidden;min-height:0;touch-action:pan-y;-webkit-overflow-scrolling:touch;padding-right:2px}',
    '#bcard .acts{display:flex;gap:8px;margin-top:10px}#bcard .acts .btn{flex:1}',
    '#bcard .bc-foot{flex:none;padding-top:2px}',
    '.dock-on #quest,.dock-on #fabs,.dock-on #fabs-l,.dock-on #inspect{display:none!important}',
    '@media (min-width:860px){#bcard{left:50%;right:auto;width:430px;margin-left:-215px;bottom:calc(var(--navh) + 26px)}}',
    /* cartão da decisão */
    '.dcn .eyebrow{font-family:"Aurora Cinzel",serif;color:var(--gold);letter-spacing:.22em;font-size:10.5px;text-transform:uppercase;margin:0 36px 2px 0}',
    '.dcn h3{font-family:"Aurora Cinzel",serif;font-size:17px;color:var(--gold2);letter-spacing:.04em;margin:0 36px 6px 0}',
    '.dcn .art{height:54px;margin:4px 0 6px}',
    '.dcn .lead{font-size:12.5px;color:#cfd5e4;line-height:1.42;margin:0 0 8px}',
    '.dcn .opt{padding:9px 11px;margin-bottom:6px}.dec .opt b{font-size:13px}.dec .opt span{font-size:11.5px}',
    '.dcn .dc-cd{display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:800;color:var(--mut);margin:2px 0 0}',
    '.dcn .dc-cd svg{font-size:13px;color:var(--gold)}.dec .dc-cd b{color:var(--gold2)}',
    '.dcn .dc-cd.urgent b{color:#ff9a9a}',
    /* atalho no mapa */
    '#fab-inbox{position:relative;display:none;place-items:center;line-height:1}',
    '#fab-inbox.on{display:grid}',
    '#fab-inbox svg.rg{position:absolute;left:-1px;top:-1px;width:48px;height:48px;transform:rotate(-90deg);pointer-events:none;font-size:0}',
    '#fab-inbox .rg circle{fill:none;stroke-width:2.6}#fab-inbox .rg .bg{stroke:rgba(255,255,255,.1)}',
    '#fab-inbox .rg .fg{stroke:var(--gold2);stroke-linecap:round;transition:stroke-dashoffset .5s linear,stroke .3s}',
    '#fab-inbox.urgent .rg .fg{stroke:var(--bad)}',
    '#fab-inbox .fi-i{position:absolute;left:0;right:0;top:9px;display:grid;place-items:center;font-size:17px}',
    '#fab-inbox .fi-t{position:absolute;left:0;right:0;bottom:7px;font-size:9.5px;font-weight:900;color:var(--gold2);letter-spacing:.02em}',
    '#fab-inbox.noct .fi-i{top:0;bottom:0;display:grid;align-items:center}#fab-inbox.noct .fi-t{display:none}',
    '#fab-inbox .fdot{position:absolute;top:-3px;right:-3px;min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:var(--bad);color:#fff;font-size:10px;font-weight:900;display:none;place-items:center;box-shadow:0 0 0 2px #10141f}',
    '#fab-inbox.many .fdot{display:grid}',
    '#fab-inbox.new{animation:fabp 1.3s ease-in-out infinite alternate}',
    /* lista de pendências */
    '.ib h3{font-family:"Aurora Cinzel",serif;font-size:15px;color:var(--gold2);letter-spacing:.06em;margin:0 36px 8px 0}',
    '.ib .ib-sec{font-family:"Aurora Cinzel",serif;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin:8px 2px 5px}',
    '.ib .ib-row{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:8px 10px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid var(--line2);margin-bottom:6px;color:inherit;font:inherit}',
    '.ib .ib-row.dc{border-color:var(--gold);background:linear-gradient(180deg,rgba(226,182,89,.14),rgba(226,182,89,.04))}',
    '.ib .ib-row .ib-i{flex:none;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:rgba(0,0,0,.28);color:var(--gold2);font-size:18px}',
    '.ib .ib-row .ib-i.px{background-size:34px 34px;border:2px solid #4a557a}',
    '.ib .ib-row .gr{flex:1;min-width:0}',
    '.ib .ib-row b{display:block;font-size:12.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.ib .ib-row small{display:block;font-size:11px;color:var(--mut);font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.ib .ib-row .go{flex:none;font-size:10.5px;font-weight:900;padding:3px 9px;border-radius:9px;color:#1a1408;background:linear-gradient(180deg,#f7dc92,#d8a544)}',
    '.ib .ib-empty{color:var(--mut);font-size:12.5px;text-align:center;padding:14px 8px}',
    '#toasts .toast[data-a]{pointer-events:auto;cursor:pointer;border-color:rgba(247,220,146,.7)}',
    '#toasts .toast[data-a]::after{content:"toque para ver";flex:none;margin-left:auto;font-size:10px;font-weight:800;color:var(--gold2);opacity:.85;white-space:nowrap}',
  ].join('\n');
  document.head.appendChild(css);

  /* ================= UI.dock: cartão inferior, sem pausa ================= */
  const D = (UI.dock = { kind: '', key: '', tick: null, v: null });
  D.el = () => $('#bcard');
  D.open = (kind, html, o) => {
    const el = D.el(); if (!el) return false; o = o || {};
    if (UI.sheet) UI.close();
    D.kind = kind; D.key = o.key || ''; D.tick = null; D.v = o.v || null;
    el.innerHTML = '<button class="bc-x" data-a="dockx" aria-label="Fechar">' + ic('close') + '</button><div class="bc-in ' + (o.cls || '') + '">' + html + '</div>' + (o.foot ? '<div class="bc-foot">' + o.foot + '</div>' : '');
    el.classList.add('on'); $('#app').classList.add('dock-on');
    if (R && R.sel) UI.inspect(null);
    return true;
  };
  D.close = () => {
    if (!D.kind) return; const el = D.el();
    D.kind = ''; D.key = ''; D.tick = null; D.v = null;
    if (el) { el.classList.remove('on'); el.innerHTML = ''; } $('#app').classList.remove('dock-on');
  };
  D.body = () => { const el = D.el(); return el ? el.querySelector('.bc-in') : null; };
  UI.ACT.dockx = () => D.close();

  /* ================= caixa de pendências ================= */
  const REP = [], PROV = [], pinged = {};
  UI.inboxAdd = (it) => { const i = REP.findIndex((x) => x.key === it.key); if (i >= 0) REP.splice(i, 1); REP.push(Object.assign({ t: performance.now() }, it)); while (REP.length > 6) REP.shift(); };
  UI.inboxRemove = (key) => { const i = REP.findIndex((x) => x.key === key); if (i >= 0) REP.splice(i, 1); };
  UI.inboxProvider = (fn) => PROV.push(fn);
  UI.inboxItems = () => { let a = REP.slice(); for (const p of PROV) { try { a = a.concat(p() || []); } catch (e) { /* um provedor com defeito não derruba o resto */ } } return a; };
  /* um aviso com toque (uma vez por chave): o jogador abre quando quiser */
  UI.inboxPing = (key, msg, icon, act) => { if (pinged[key]) return; pinged[key] = 1; UI.toast(msg, 'epic', icon || 'scroll', 6500, act || 'decisoes'); };
  G.on('start', () => { REP.length = 0; for (const k in pinged) delete pinged[k]; D.close(); });
  /* pendências derivadas do estado (sobrevivem a recarregar a página): fim de temporada da Arena, cerimônias do Colosso e novidades da versão */
  UI.inboxProvider(() => { const S = G.S, a = S && S.arena; return a && a.pend && UI.arenaSeason ? [{ key: 'arena-bau', ic: 'trophy', title: 'A temporada da Arena terminou', sub: 'O baú já está no cofre · toque para ver', ping: 'A temporada da Arena terminou: veja o seu baú.', open: () => UI.arenaSeason(G.S.arena.pend) }] : []; });
  UI.inboxProvider(() => {
    const S = G.S, c = S && S.colosso; if (!c || !c.pend || !c.pend.length || !UI.colossoPend) return [];
    return c.pend.filter((x) => x.k === 'win' || x.k === 'rank').map((x) => ({ key: 'colosso-' + x.k, ic: 'skull', title: x.k === 'win' ? 'O Colosso caiu!' : 'Prêmio do Colosso da semana', sub: x.k === 'win' ? 'O baú já está no cofre · toque para ver' : 'Posição no ranking · toque para ver', ping: x.k === 'win' ? 'O Colosso foi derrubado! Veja o baú.' : 'O prêmio do Colosso da semana chegou.', open: () => UI.colossoPend(x.k) }));
  });
  UI.inboxProvider(() => (UI.newsPending && G.S && G.S.tut.done && UI.newsPending().length ? [{ key: 'novidades', ic: 'spark', title: 'Novidades da versão ' + G.VERSION.replace(/\.0$/, ''), sub: 'O que mudou desde a sua última visita', ping: 'Novidades da versão ' + G.VERSION.replace(/\.0$/, '') + ': toque para ler.', open: () => UI.whatsNew() }] : []));

  /* ================= a decisão pendente (evento de cidade) ================= */
  const evTotal = () => { const S = G.S; return Math.max(1, (S.ev.until || 0) - (S.ev.at || 0)); };
  const evLeftReal = () => G.eventLeft() / Math.max(1, G.S.speed || 1);
  UI.eventModal = (e) => {
    const S = G.S; e = e || G.eventNow(); if (!e) return;
    const v = new UI.View($('#bcard'));
    let h = '<div class="dcn"><div class="eyebrow">Acontece em Aurora</div><h3>' + esc(e.title) + '</h3>' + UI.artBox(e.art) + '<p class="lead">' + esc(e.text) + '</p>';
    e.opts.forEach((o, i) => { const dis = () => { const c = o.c ? o.c() : 0; return !!((o.can && !o.can(G.S)) || (c && G.S.gold < c)); }; h += '<button class="opt" data-a="evopt:' + i + '" ' + v.Dis(dis) + '><b>' + esc(o.l) + '</b><span>' + esc(typeof o.d === 'function' ? o.d() : o.d) + '</span></button>'; });
    const auto = e.opts[G.eventAutoIdx(e)];
    h += '<div ' + v.At('class', () => 'dc-cd' + (evLeftReal() < 40 ? ' urgent' : '')) + '>' + ic('moon') + '<span>Sem decisão, Aurora escolhe <b>' + esc(auto.l) + '</b> em <b>' + v.T(() => mmss(evLeftReal())) + '</b></span></div>' +
      '<div class="acts"><button class="btn" data-a="dockx">Decidir depois</button></div></div>';
    D.open('evento', h, { key: e.id, v });
    D.tick = () => { v.refresh(); const n = G.eventNow(); if (!n || n.id !== e.id) { D.close(); UI.toast('O prazo acabou: Aurora seguiu o caminho seguro.', 'info', 'scroll'); } };
    void S;
  };
  UI.ACT.evopt = (a) => {
    const e = G.eventNow(); if (!e) { D.close(); return UI.toast('Esta decisão já foi tomada.', 'info', 'scroll'); }
    const r = G.eventChoose(+a[0]); D.close(); if (r) UI.toast(r, 'info', 'scroll');
  };
  UI.ACT.evopen = () => UI.eventModal();

  /* ================= painel de pendências ================= */
  const rows = () => {
    const S = G.S, out = [], e = G.eventNow();
    if (e) out.push({ k: 'ev', e });
    const P = S.pedidos && S.pedidos.list || [];
    for (const r of P) out.push({ k: 'pd', r });
    for (const it of UI.inboxItems()) out.push({ k: 'it', it });
    return out;
  };
  const sigOf = (rs) => rs.map((x) => x.k === 'ev' ? 'e' + x.e.id : x.k === 'pd' ? 'p' + x.r.id : 'i' + x.it.key).join('|');
  const npcPt = (who) => { const n = G.npcs.find((x) => x.name === who); return G.A.portrait(G.A.npcLook(n || { name: who, look: 30, job: 'Morador' })); };
  const panel = () => {
    const rs = rows(), v = new UI.View($('#bcard'));
    let h = '<div class="ib"><h3>Pendências</h3>';
    if (!rs.length) h += '<div class="ib-empty">Nada pendente. Tudo em dia em Aurora.</div>';
    const ev = rs.filter((x) => x.k === 'ev'), pd = rs.filter((x) => x.k === 'pd'), it = rs.filter((x) => x.k === 'it');
    if (ev.length) { h += '<div class="ib-sec">Decisão</div>'; for (const x of ev) h += '<button class="ib-row dc" data-a="evopen"><i class="ib-i">' + ic('scroll') + '</i><div class="gr"><b>' + esc(x.e.title) + '</b><small>Decide sozinha em ' + v.T(() => mmss(evLeftReal())) + '</small></div><span class="go">Decidir</span></button>'; }
    if (pd.length) { h += '<div class="ib-sec">Pedidos dos moradores</div>'; for (const x of pd) { const i = G.pedidoInfo(x.r); h += '<button class="ib-row" data-a="pedido:' + x.r.id + '"><i class="ib-i px" style="background-image:url(' + npcPt(x.r.who) + ')"></i><div class="gr"><b>' + esc(x.r.who) + ': ' + esc(i.title) + '</b><small>até ' + esc(i.dln) + ' · sem castigo se vencer</small></div><span class="go">' + v.T(() => { const q = G.pedidoGet(x.r.id); if (!q) return ''; const j = G.pedidoInfo(q); return j.ready ? 'Pronto' : G.fmt(j.cur) + '/' + G.fmt(j.n); }) + '</span></button>'; } }
    if (it.length) { h += '<div class="ib-sec">Avisos</div>'; for (const x of it) h += '<button class="ib-row" data-a="ibopen:' + esc(x.it.key) + '"><i class="ib-i">' + ic(x.it.ic || 'scroll') + '</i><div class="gr"><b>' + esc(x.it.title) + '</b><small>' + esc(x.it.sub || '') + '</small></div><span class="go">Ver</span></button>'; }
    h += '<div class="acts"><button class="btn" data-a="dockx">Fechar</button></div></div>';
    const sig = sigOf(rs);
    D.open('decisoes', h, { key: sig, v });
    D.tick = () => { v.refresh(); if (sigOf(rows()) !== D.key) { if (D.kind === 'decisoes') panel(); } };
  };
  UI.ACT.decisoes = () => { if (D.kind === 'decisoes') return D.close(); panel(); };
  UI.ACT.ibopen = (a) => {
    const it = UI.inboxItems().find((x) => x.key === a[0]); D.close(); if (!it) return;
    UI.inboxRemove(it.key);
    it.open();
  };

  /* ================= montagem, avisos e atualização ================= */
  const bd0 = UI.build;
  UI.build = () => {
    bd0();
    const app = $('#app'), fl = $('#fabs-l');
    if (app && !$('#bcard')) app.insertAdjacentHTML('beforeend', '<div id="bcard" class="glass"></div>');
    const C = (2 * Math.PI * 21).toFixed(1);
    if (fl && !$('#fab-inbox')) fl.insertAdjacentHTML('beforeend', '<button class="fab glass" data-a="decisoes" id="fab-inbox"><svg class="rg" viewBox="0 0 48 48"><circle class="bg" cx="24" cy="24" r="21"/><circle class="fg" cx="24" cy="24" r="21" stroke-dasharray="' + C + '" stroke-dashoffset="0"/></svg><span class="fi-i">' + ic('scroll') + '</span><span class="fi-t"></span><i class="fdot"></i></button>');
  };
  /* decisão nova: só um aviso com toque, nunca uma janela */
  G.on('event', (e) => { UI.toast('Decisão em Aurora: ' + e.title, 'epic', 'scroll', 6500, 'decisoes'); G.sfx('pick'); });
  let lastSig = '', lastT = '', lastOff = '', C0 = 2 * Math.PI * 21;
  const paintFab = () => {
    const f = $('#fab-inbox'), S = G.S; if (!f || !S) return;
    const e = G.eventNow(), items = UI.inboxItems(), n = (e ? 1 : 0) + items.length;
    for (const it of items) if (it.ping) UI.inboxPing(it.key, it.ping, it.ic);
    const sig = (e ? e.id : '') + '|' + items.length;
    if (sig !== lastSig) { f.classList.toggle('on', n > 0); f.classList.toggle('many', n > 1); f.classList.toggle('noct', !e); f.querySelector('.fdot').textContent = n > 1 ? n : ''; if (sig !== lastSig && n > 0) { f.classList.remove('new'); void f.offsetWidth; f.classList.add('new'); setTimeout(() => f.classList.remove('new'), 4200); } lastSig = sig; lastT = ''; lastOff = ''; }
    if (e) {
      const t = mmss(evLeftReal()); if (t !== lastT) { lastT = t; f.querySelector('.fi-t').textContent = t; }
      const off = (C0 * (1 - G.clamp(G.eventLeft() / evTotal(), 0, 1))).toFixed(1); if (off !== lastOff) { lastOff = off; f.querySelector('.fg').setAttribute('stroke-dashoffset', off); }
      f.classList.toggle('urgent', evLeftReal() < 40);
    } else f.classList.remove('urgent');
  };
  const rf0 = UI.refresh;
  UI.refresh = () => { rf0(); if (!G.S || !G.M.running) return; paintFab(); if (D.tick) D.tick(); };

  /* o cartão e os painéis não convivem; um toque num herói/morador/monstro (UI.inspect) ou uma janela fecham o cartão */
  const open0 = UI.open;
  UI.open = (n, t, s) => { D.close(); return open0(n, t, s); };
  const in0 = UI.inspect;
  UI.inspect = (sel) => { if (sel && D.kind) D.close(); return in0(sel); };
  const m0 = UI.modal;
  UI.modal = (h, o) => { if (D.kind) D.close(); return m0(h, o); };
})();

;
