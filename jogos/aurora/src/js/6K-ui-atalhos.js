/* 6K-ui-atalhos: v27 (fase C, C2) — o trilho de atalhos flutuantes, sem caixas: esprites de pixel art com o próprio contorno,
   um rótulo mínimo e um quadradinho vermelho com a contagem quando há algo a fazer. Cada ícone abre direto a tela que já existe
   (nada de tela nova): Decisões (a entrada da Fase A, agora aqui), Incursões, Colossos, Arena, Fenda, Viveiro e Decretos.
   Forja e Missões não entram: já moram na barra de baixo. Sistema ainda fechado: só aparece, apagado e com cadeado, quando está perto de abrir;
   o toque diz o que falta. Uma aba de latão recolhe o trilho (guardado em S.opts.railOff); recolhido, só os pontos de aviso ficam.
   Num aparelho baixo (altura de rodapé que não comporta o trilho) ele passa para duas colunas ou, se nem assim couber, nasce recolhido. */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const UI = G.UI, $ = UI.$, ic = UI.ic;
  const safe = (fn, d) => { try { return fn(); } catch (e) { return d; } };

  /* id, esprite, rótulo, ação, sistema (G.SYSTEMS) e a contagem do selo vermelho */
  const ITEMS = [
    { id: 'incursoes', sp: 'incursao', l: 'Incursão', a: 'open:missoes:incursoes', sys: 'incursoes', n: () => (G.incOpen() && G.incFree() && !G.incBusy() ? 1 : 0) },
    { id: 'colosso', sp: 'colosso', l: 'Colosso', a: 'open:missoes:colosso', sys: 'colosso', n: () => (G.colossoOpen() && G.colossoWin().phase === 'on' ? 1 : 0) },
    { id: 'arena', sp: 'arena', l: 'Arena', a: 'open:missoes:arena', sys: 'arena', n: () => (G.arenaOpen() ? Math.min(9, G.arenaTickets().free) : 0) },
    { id: 'fenda', sp: 'fenda', l: 'Fenda', a: 'open:missoes:fenda', sys: 'fenda', n: () => (G.riftOpen() && !G.S.rift.run && G.S.rift.dayDone !== G.S.day ? 1 : 0) },
    { id: 'viveiro', sp: 'viveiro', l: 'Viveiro', a: 'viveiro', sys: 'atelie', n: () => G.petStrays().length },
    { id: 'decretos', sp: 'decretos', l: 'Decretos', a: 'decrees', sys: 'decretos', n: () => 0, domId: 'fab-dec' },
  ];
  const lockURL = () => 'url(' + G.PX.dataURL('lock') + ')';

  const build = () => {
    const app = $('#app'); if (!app || $('#rail')) return;
    const r = document.createElement('div'); r.id = 'rail';
    let h = '<button id="railtab" data-a="railtog" aria-label="Recolher atalhos">' + ic('chevu') + '<i class="rd"></i></button>';
    for (const it of ITEMS) h += '<button class="rs lk" id="' + (it.domId || 'rs-' + it.id) + '" data-r="' + it.id + '" data-a="rs:' + it.id + '" style="display:none"><i class="bx" data-s="' + it.sp + '"></i><span class="rl">' + it.l + '</span><i class="rb"></i></button>';
    r.innerHTML = h;
    /* Decisões (6G) vem primeiro: o elemento #fab-inbox é criado lá e mora aqui */
    const inbox = $('#fab-inbox'); if (inbox) { const t = r.querySelector('#railtab'); t.insertAdjacentElement('afterend', inbox); }
    app.insertBefore(r, $('#fabs-l'));
    r.style.setProperty('--lk', lockURL());
  };

  let sig = '', railH = -1, railW = -1;
  const paint = () => {
    const r = $('#rail'), S = G.S; if (!r || !S) return;
    let s = '';
    for (const it of ITEMS) {
      const el = r.querySelector('[data-r="' + it.id + '"]'); if (!el) continue;
      const open = G.sysOpen(it.sys), near = !open && G.sysNear(it.sys), n = open ? safe(it.n, 0) : 0, nw = open && G.sysNew(it.sys);
      const show = open || near;
      s += (show ? (open ? 'o' : 'l') : 'h') + n + (nw ? 'N' : '');
      el.style.display = show ? '' : 'none';
      el.classList.toggle('lk', !open); el.classList.toggle('has', n > 0); el.classList.toggle('nw', nw);
      const b = el.querySelector('.rb'); if (b && b.textContent !== (n > 0 ? String(n) : '')) b.textContent = n > 0 ? n : '';
    }
    const inbox = $('#fab-inbox'); if (inbox) s += inbox.classList.contains('on') ? 'i' : '';
    const anyShown = ITEMS.some((it) => { const e = r.querySelector('[data-r="' + it.id + '"]'); return e && e.style.display !== 'none'; }) || (inbox && inbox.classList.contains('on'));
    r.querySelector('#railtab').style.display = anyShown ? '' : 'none';      // sem atalho nenhum, nem a aba aparece
    const collapsed = isOff();
    r.classList.toggle('off', collapsed); $('#app').classList.toggle('roff', collapsed);
    /* ponto de aviso na aba quando recolhido e há algo */
    const any = [...r.querySelectorAll('.rs.has')].some((e) => e.style.display !== 'none');
    r.querySelector('.rd').style.display = collapsed && any ? 'block' : 'none';
    /* a altura disponível: do rodapé do HUD até o rodapé do mapa (barra de baixo + faixa da missão) */
    const hudb = $('#hud').getBoundingClientRect().bottom, nav = $('#nav').getBoundingClientRect().top;
    const strip = Math.max(...['#quest', '#nrw', '#inspect'].map((q) => { const e = $(q); return e && e.offsetHeight && getComputedStyle(e).display !== 'none' ? Math.max(0, nav - e.getBoundingClientRect().top) : 0; }));
    const avail = Math.floor(nav - hudb - strip - 18);
    const rw = collapsed || !anyShown ? 0 : Math.ceil(r.getBoundingClientRect().width) + 6;
    if (rw !== railW) { railW = rw; document.documentElement.style.setProperty('--railw', rw + 'px'); }      // em tela baixa o aviso não cobre o trilho
    if (avail !== railH) { railH = avail; r.style.setProperty('--railh', Math.max(120, avail) + 'px'); document.documentElement.style.setProperty('--stripx', Math.max(0, strip - 6) + 'px'); }
    void sig;
  };
  /* aviso: no primeiro uso em tela baixa, sem escolha do jogador, o trilho nasce recolhido */
  const isOff = () => {
    const o = G.S && G.S.opts; if (!o) return false;
    if (o.railOff === 1) return true; if (o.railOff === 0) return false;
    return window.innerHeight < 700 && railH >= 0 && railH < 3 * 62;
  };
  const setOff = (v) => { G.S.opts.railOff = v ? 1 : 0; paint(); };

  Object.assign(UI.ACT, {
    railtog: () => { setOff(!isOff()); },
    rs: (a) => {
      const it = ITEMS.find((x) => x.id === a[0]); if (!it) return;
      if (!G.sysOpen(it.sys)) { const d = G.SYS[it.sys]; UI.toast((d ? d.n : it.l) + ' abre com: ' + G.sysReq(it.sys) + '.', 'info', 'lock'); return; }
      G.sysTouch(it.sys);
      if (it.a === 'viveiro') { UI.open('armazem', 'atelie'); setTimeout(() => { const e = $('#viveiro'); if (e) e.scrollIntoView({ block: 'start' }); }, 60); return; }
      const [a0, ...rest] = it.a.split(':'); UI.act(a0, rest);
    },
  });

  const bd0 = UI.build;
  UI.build = () => { bd0(); build(); railH = -1; paint(); };
  const rf0 = UI.refresh;
  let acc = 0;
  UI.refresh = () => { rf0(); if (!G.S || !G.M.running) return; const t = performance.now(); if (t - acc > 400) { acc = t; paint(); } };
  G.on('start', () => { railH = -1; paint(); });
  window.addEventListener('resize', () => { railH = -1; });
})();

;
