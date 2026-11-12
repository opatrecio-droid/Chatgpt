/* 6E-ui-progressivo: v26 (lote 4-C.1) — a interface só mostra o que já foi liberado. Abas, botões da barra, chips do HUD e abas da ficha
   dos sistemas trancados ficam ocultos (um cadeado discreto com o requisito aparece só quando o sistema está perto de abrir); o que acabou
   de abrir ganha o selo "Novo!" até o primeiro toque e uma dica de uma linha, uma vez. Só interface: o catálogo e o estado vivem em 3I. */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const UI = G.UI, ic = UI.ic, $ = UI.$;

  /* ---------- estilo: gerado do catálogo (ocultar trancados, selo "Novo!") ---------- */
  const hide = [], seal = { nav: [], tab: [], chip: [], fab: [], htab: [] }, rules = [];
  for (const d of G.SYSTEMS) {
    const sels = [];                                              // onde o sistema mora
    if (d.nav) sels.push(['nav', '#nav-' + d.nav]);
    if (d.chip) sels.push([d.chip === '#fabs' ? 'fab' : 'chip', d.chip === '#fabs' ? '#fab-dec' : d.chip]);
    if (d.htab) sels.push(['htab', '.htabs [data-a="htab:' + d.htab + '"]']);
    if (d.tab) sels.push(['tab', '#sheet .tabs [data-a="tab:' + d.tab[1] + '"]']);
    const gate = d.nav ? ['#nav-' + d.nav] : d.chip ? (d.chip === '#hudx' ? ['#hudx .wk', '#hudx .sorte'] : [d.chip]) : d.htab ? ['.htabs [data-a="htab:' + d.htab + '"]'] : [];
    if (gate.length && d.id !== 'livro') hide.push(gate.map((g) => '#app:not(.so-' + d.id + ') ' + g).join(','));
    for (const [k, sel] of sels) {
      const s2 = k === 'chip' && d.chip === '#hudx' ? '#hudx .wk' : sel;
      seal[k].push('#app.nw-' + d.id + ' ' + s2 + (k === 'chip' ? '::before' : '::after'));
    }
    const nv = d.nav || (d.tab && d.tab[0]) || (d.htab ? 'herois' : null);                // a barra de baixo também avisa que há novidade dentro do painel
    if (nv && !d.nav) seal.nav.push('#app.nw-' + d.id + ' #nav-' + nv + '::after');
  }
  const css = document.createElement('style');
  css.textContent = [
    hide.map((s) => s + '{display:none!important}').join('\n'),
    '#app:not(.so-decretos) #fabs{display:none!important}',
    '@keyframes nvp{from{transform:translateY(0)}to{transform:translateY(calc(var(--u)*-1))}}',
    seal.nav.join(',') + '{content:"";position:absolute;top:calc(var(--u)*1);right:calc(var(--u)*3);width:calc(var(--u)*4);height:calc(var(--u)*4);padding:0;background:var(--brass2);box-shadow:0 0 0 var(--u) var(--ol);pointer-events:none;animation:nvp .8s steps(2) infinite alternate;z-index:2}',
    seal.tab.join(',') + ',' + seal.htab.join(',') + '{content:"";position:absolute;top:calc(var(--u)*1);right:calc(var(--u)*3);width:calc(var(--u)*4);height:calc(var(--u)*4);padding:0;background:var(--brass2);box-shadow:0 0 0 var(--u) var(--ol);pointer-events:none;animation:nvp .8s steps(2) infinite alternate;z-index:2}',
    /* C3: os chips do alto (Poder, Dificuldade, Semana...) não ganham selo: o aviso de uma linha já os apresenta e o HUD fica limpo */
    '#app .rs-none::after{content:none}',
    '#fab-dec,#hud .dif,#pwr,#hudx .wk{position:relative}',
    '#sheet .tabs{padding-top:6px}',
    '.tabs button.lk{display:inline-flex;align-items:center;gap:5px;border-image-source:var(--f-btnd);color:var(--mut)}',
    '.tabs button.lk .i{opacity:.85}',
    '@media (prefers-reduced-motion:reduce){[class*="nw-"] *::after,[class*="nw-"] *::before{animation:none!important}}',
    /* v26 (4C.3): brilho pulsante só com opacidade (animar box-shadow repinta a camada a cada quadro; opacidade vai para a placa de vídeo) */
    '#quest.done,#nrw.rdy,#fab-cal.has{animation:none!important}#fab-cal.has{position:relative}',
    '#quest.done::before,#nrw.rdy::before,#fab-cal.has::before{content:"";position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 0 2px rgba(247,220,146,.7);opacity:.25;animation:glowo 1.4s ease-in-out infinite alternate}',
    '@keyframes glowo{to{opacity:1}}',
  ].join('\n');
  document.head.appendChild(css);

  /* ---------- quais sistemas estão abertos / com selo: classes no #app ---------- */
  let sigO = '', sigN = '';
  const apply = (UI.sysApply = () => {
    const app = $('#app'); if (!app || !G.S) return;
    let o = '', n = '';
    for (const d of G.SYSTEMS) { o += G.sysOpen(d.id) ? '1' : '0'; n += G.sysNew(d.id) ? '1' : '0'; }
    if (o !== sigO) { sigO = o; G.SYSTEMS.forEach((d, i) => app.classList.toggle('so-' + d.id, o[i] === '1')); }
    if (n !== sigN) { sigN = n; G.SYSTEMS.forEach((d, i) => app.classList.toggle('nw-' + d.id, n[i] === '1')); }
  });

  /* ---------- abas: só as liberadas; um cadeado com o requisito para a mais próxima ---------- */
  UI.tabsFor = (name, tabs) => {
    const out = [];
    for (const t of tabs) { const id = G.SYS_TAB[name + ':' + t[0]]; if (!id || G.sysOpen(id)) out.push(t); }
    for (const d of G.SYSTEMS) if (d.tab && d.tab[0] === name && !G.sysOpen(d.id) && G.sysNear(d.id)) { out.push(['lock:' + d.id, (d.s || d.n) + ' · ' + (d.rq || ''), { lock: d.id }]); break; }
    return out;
  };
  /* ao abrir a aba o selo some: chamado pelo desenho do painel para cada aba */
  UI.tabAttr = (name, id, active) => { const sid = G.SYS_TAB[name + ':' + id]; if (sid && active && G.sysNew(sid)) G.sysTouch(sid); return ''; };
  UI.ACT.syslock = (a) => { const d = G.SYS[a[0]]; if (!d) return; UI.toast(d.n + ' abre com: ' + d.req + '.', 'info', 'lock'); };

  /* o número da Jornada não conta o presente do Calendário enquanto o botão dele ainda não apareceu */
  { const mb = UI.badges && UI.badges.missoes; if (mb) UI.badges.missoes = () => mb() - (!G.sysOpen('cal') && G.calState && G.calState().ok ? 1 : 0); }

  /* a ficha só aponta para o Livro de Feitos depois que a aba existe (ou se o herói já tem título) */
  { const ht = UI.hTitle; if (ht) UI.hTitle = (x, mini) => (!mini && !G.sysOpen('feitos') && !(G.titleOf && G.titleOf(x)) ? '' : ht(x, mini)); }

  /* ---------- toques que apagam o selo (barra, chips, abas da ficha) ---------- */
  const touchSel = [];
  for (const d of G.SYSTEMS) {
    if (d.nav) touchSel.push([d.id, '#nav-' + d.nav]);
    if (d.chip) touchSel.push([d.id, d.chip === '#fabs' ? '#fab-dec' : d.chip === '#hudx' ? '#hudx .wk' : d.chip]);
    if (d.htab) touchSel.push([d.id, '.htabs [data-a="htab:' + d.htab + '"]']);
  }
  document.addEventListener('click', (e) => {
    if (!G.S || !e.target.closest) return;
    for (const [id, sel] of touchSel) if (G.sysNew(id) && e.target.closest(sel)) G.sysTouch(id);
  }, true);
  /* o selo de um sistema que mora numa aba também some quando se toca na própria aba (cobre mudar de aba sem redesenhar) */
  const tab0 = UI.ACT.tab;
  UI.ACT.tab = (a) => { tab0(a); if (UI.sheet) { const sid = G.SYS_TAB[UI.sheet.name + ':' + a[0]]; if (sid) G.sysTouch(sid); } };

  /* ---------- dicas de uma linha: fila curta, nunca em cima de janela, e agrupadas se vierem várias de uma vez ---------- */
  const q = []; let qAt = 0;
  G.on('sysopen', (d) => { if (G.SYS[d.id]) q.push(d.id); });
  const pump = () => {
    const S = G.S; if (!S || !q.length || !S.tut.done || UI.modalOpen || performance.now() < qAt) return;
    const ids = q.splice(0, q.length), ds = ids.map((id) => G.SYS[id]);
    if (ds.length >= 3) { const nm = ds.slice(0, 3).map((d) => d.n), more = ds.length - 3; UI.toast('Novos: ' + (more > 0 ? nm.join(', ') + ' e mais ' + more : nm.join(', ').replace(/, ([^,]*)$/, ' e $1')) + '. Procure o selo Novo!', 'epic', ds[0].ic, 7000); }
    else for (const d of ds) UI.toast('Novo: ' + d.n + ' — ' + d.hint, 'epic', d.ic, 7000);
    if (G.sfx) G.sfx('quest');
    qAt = performance.now() + 2500;
  };
  const rf0 = UI.refresh;
  UI.refresh = () => { rf0(); if (!G.S || !G.M.running) return; apply(); pump(); };
  G.on('start', () => { q.length = 0; sigO = sigN = ''; apply(); });
  G.on('sysseen', apply); G.on('syschg', apply);

  /* ---------- efeitos leves automáticos (4C.3): o laço em 90-main chama G.fxAuto quando o quadro médio passa de 20 ms ---------- */
  G.fxAuto = () => {
    const o = G.S.opts; o.lowFx = 1; o.lowAuto = 1;
    UI.toast('Efeitos leves ligados: o aparelho está pesado. Para voltar, Mais › Opções › Modo leve.', 'info', 'bolt', 9000);
  };
  const opt0 = UI.ACT.opt;
  UI.ACT.opt = (a) => { opt0(a); if (a[0] === 'lowFx' && G.S) { const o = G.S.opts; o.lowAuto = 0; o.lowNo = o.lowFx ? 0 : 1; } };   // quem desliga à mão não é ligado de novo sozinho
  { const M2 = UI.SHEETS && UI.SHEETS.mais;
    if (M2) { const r1 = M2.render; M2.render = function (tab) { const h = r1.apply(M2, arguments); return tab === 'opcoes' && G.S.opts.lowAuto ? h.replace('Ajuda em aparelhos antigos.', 'Ajuda em aparelhos antigos. <b class="gold">Ligado sozinho: o jogo estava pesado neste aparelho.</b>') : h; }; } }

  /* abrir um painel pela barra apaga o selo dos sistemas que são o próprio botão (Forja, Armazém) */
  const open0 = UI.open;
  UI.open = (n, t, s) => { const r = open0(n, t, s); for (const d of G.SYSTEMS) if (d.nav === n) G.sysTouch(d.id); return r; };
})();
;
