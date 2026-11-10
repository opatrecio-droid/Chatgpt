/* 60-ui: HUD único, navegação, avisos, toque no mapa e tela de título.
   Regra de ouro (correção do pisca-pisca): nada é reconstruído por quadro. A estrutura só é
   refeita quando um evento do jogo a muda; os números são atualizados nó a nó, e só se mudaram. */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const UI = (G.UI = { sheet: null, modalOpen: false });
  const A = G.A, R = G.R;
  const $ = (UI.$ = (s, el) => (el || document).querySelector(s));

  /* ---------- ícones (SVG) ---------- */
  const IC = {
    coin: '<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="6" fill="#0003"/><path d="M11 8h2v8h-2z" fill="#fff8"/>',
    seal: '<path d="M12 1.8l2.5 2.3 3.3-.6.9 3.3 3 1.5-1.2 3.2 1.2 3.2-3 1.5-.9 3.3-3.3-.6L12 22.2l-2.5-2.3-3.3.6-.9-3.3-3-1.5 1.2-3.2-1.2-3.2 3-1.5.9-3.3 3.3.6z"/><circle cx="12" cy="12" r="4.2" fill="#0003"/>',
    core: '<path d="M12 2l8.6 5v10L12 22l-8.6-5V7z"/><path d="M12 2v20M3.4 7l8.6 5 8.6-5" stroke="#fff6" stroke-width="1.2" fill="none"/>',
    heart: '<path d="M12 21s-7.6-4.7-9.7-9.4C.8 8.1 2.9 4.4 6.6 4.4c2.1 0 3.8 1.1 5.4 3 1.6-1.9 3.3-3 5.4-3 3.7 0 5.8 3.7 4.3 7.2C19.6 16.3 12 21 12 21z"/>',
    sword: '<path d="M20.5 2l1.5 1.5-.6 4.3-8.6 8.6 1.6 1.6-1.6 1.6-2.2-2.2-3.4 3.4-1.9-1.9 3.4-3.4-2.2-2.2 1.6-1.6 1.6 1.6 8.6-8.6z"/>',
    shield: '<path d="M12 2l8 3v6c0 5-3.4 9.2-8 11-4.6-1.800-8-6-8-11V5z"/>',
    star: '<path d="M12 2.300l3 6.200 6.700.9-4.900 4.700 1.200 6.700L12 17.500l-6 3.300 1.200-6.700L2.300 9.400l6.700-.9z"/>',
    bag: '<path d="M8 7V6a4 4 0 018 0v1h2.600L20 21H4L5.400 7zm2 0h4V6a2 2 0 00-4 0z"/>',
    hammer: '<path d="M13.500 2.500l7 4-2.200 3.800-2.500-1.400-6.300 11-3.300-1.900 6.300-11-2.500-1.400z"/>',
    crown: '<path d="M2.500 8l5 4L12 5l4.500 7 5-4L20 18H4zM4 19.500h16V21.500H4z"/>',
    skull: '<path fill-rule="evenodd" d="M12 2.500c-4.700 0-8 3.300-8 7.600 0 2.600 1.200 4.700 3 6V19c0 .8.700 1.500 1.500 1.500h7c.8 0 1.500-.7 1.500-1.500v-2.900c1.800-1.300 3-3.400 3-6 0-4.300-3.300-7.600-8-7.600zM8.500 9a2.200 2.200 0 110 4.400 2.200 2.200 0 010-4.400zm7 0a2.200 2.200 0 110 4.400 2.200 2.200 0 010-4.400zM12 14l1.300 2.400h-2.600z"/>',
    scroll: '<path d="M7 3h11a3 3 0 013 3v2h-4v10a3 3 0 01-3 3H5a3 3 0 01-3-3v-2h10v2a1 1 0 002 0V6a1 1 0 00-1-1H9v9H5V5a2 2 0 012-2z"/>',
    eye: '<path fill-rule="evenodd" d="M12 5c5 0 8.500 4 10 7-1.500 3-5 7-10 7S3.500 15 2 12c1.500-3 5-7 10-7zm0 3a4 4 0 100 8 4 4 0 000-8zm0 2a2 2 0 110 4 2 2 0 010-4z"/>',
    horn: '<path d="M3 9l12-5v16L3 15zM16.500 8.500a4 4 0 010 7zM5 16h4l1 5H7z"/>',
    sun: '<circle cx="12" cy="12" r="5"/><path d="M11 1h2v4h-2zM11 19h2v4h-2zM1 11h4v2H1zM19 11h4v2h-4zM4.200 5.600l1.400-1.400 2.800 2.800L7 8.400zM15.600 17l1.400-1.400 2.800 2.800-1.400 1.400zM4.200 18.400L7 15.600 8.400 17l-2.800 2.800zM15.600 7l2.800-2.800 1.400 1.400L17 8.400z"/>',
    moon: '<path d="M20.500 14.500A9 9 0 019.500 3.500a9 9 0 1011 11z"/>',
    flag: '<path d="M5 2h2v20H5zM8 3h11l-3 4.500 3 4.500H8z"/>',
    meal: '<path d="M2.500 11h19a9.500 9.500 0 01-6.500 9v1.500H9V20a9.500 9.500 0 01-6.500-9zM8 2.500c1.200 1.800 1.200 3.200 0 5H6.500c1.200-1.800 1.200-3.200 0-5zm4.800 0c1.200 1.800 1.200 3.200 0 5h-1.600c1.200-1.800 1.200-3.200 0-5zm4.700 0c1.200 1.800 1.200 3.200 0 5H16c1.200-1.800 1.200-3.200 0-5z"/>',
    bed: '<path d="M2 5h2.200v7.500H11V9h7a4 4 0 014 4v6.500h-2.200V17H4.200v2.500H2zM7.300 7.500a2.200 2.200 0 110 4.400 2.200 2.200 0 010-4.400z"/>',
    bolt: '<path d="M13.500 1.500L4 14h6l-1.500 8.500L19 9.500h-6.500z"/>',
    smile: '<path fill-rule="evenodd" d="M12 2a10 10 0 110 20 10 10 0 010-20zM8.500 8.500a1.500 1.500 0 100 3 1.500 1.500 0 000-3zm7 0a1.500 1.500 0 100 3 1.500 1.500 0 000-3zM7.300 14c.9 2.100 2.600 3.300 4.700 3.300s3.800-1.200 4.700-3.300z"/>',
    map: '<path fill-rule="evenodd" d="M9 3l6 2.500L21 3v15.500L15 21l-6-2.500L3 21V5.500zm0 2.200v11.100l6 2.500V7.700z"/>',
    pause: '<path d="M6 4h4.200v16H6zM13.800 4H18v16h-4.200z"/>', play: '<path d="M6 3l15 9-15 9z"/>',
    close: '<path d="M5.300 3.900L12 10.600l6.700-6.700 1.400 1.400L13.400 12l6.700 6.700-1.400 1.400L12 13.400l-6.700 6.700-1.400-1.400L10.600 12 3.900 5.300z"/>',
    back: '<path d="M14.500 3.500l2 2L10 12l6.500 6.500-2 2L6 12z"/>', next: '<path d="M9.500 3.500l-2 2L14 12l-6.500 6.500 2 2L18 12z"/>',
    plus: '<path d="M10.500 3h3v7.500H21v3h-7.500V21h-3v-7.500H3v-3h7.500z"/>', minus: '<path d="M3 10.500h18v3H3z"/>',
    check: '<path d="M9.500 17.800L3.700 12l2-2 3.800 3.800 8.800-8.800 2 2z"/>',
    up: '<path d="M12 3l8.500 9.500h-5.200V21H8.700v-8.500H3.500z"/>',
    people: '<path d="M8 3.500a3.700 3.700 0 110 7.400 3.700 3.700 0 010-7.400zm8.500 1.500a3.100 3.100 0 110 6.200 3.100 3.100 0 010-6.200zM1.200 20.500c0-4.200 3-6.800 6.800-6.800s6.800 2.600 6.800 6.800zm15-6.500c3.400 0 6.600 2.200 6.600 6.500h-6.200c0-2.300-.8-4.300-2.200-5.800.500-.4 1.100-.7 1.800-.7z"/>',
    castle: '<path d="M2.500 21V8.500h2.800V11h2.200V8.500h2.800V11h3.400V8.500h2.800V11h2.200V8.500h2.800V21h-6.200v-4.800a3.300 3.300 0 00-6.600 0V21zM11 2h2l.4 5.500h-2.800z"/>',
    anvil: '<path d="M2 5.500h13.500V8c2.300 0 4.200-.9 6.500-2.300 0 4-2.800 6.500-6.500 6.500v1.600l2.500 3V19.500H5v-2.700l2.500-3v-2.900C4.300 10.400 2 8.700 2 5.500z"/>',
    grid: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
    book: '<path fill-rule="evenodd" d="M4 4.500A2.500 2.500 0 016.500 2H20v16.500H6.800a1.200 1.200 0 000 2.400H20V22H6.500A2.500 2.500 0 014 19.500zM8 6v2.200h8V6z"/>',
    trophy: '<path fill-rule="evenodd" d="M7 2.500h10v2h4.200V8a4.300 4.300 0 01-4.500 4.200A5.500 5.500 0 0113.300 15v2.800H16V21H8v-3.200h2.700V15a5.500 5.500 0 01-3.400-2.800A4.300 4.300 0 012.800 8V4.500H7zM5 6.500V8c0 1.100.8 2 1.900 2.200V6.500zm12.100 0v3.700A2.200 2.200 0 0019 8V6.500z"/>',
    lock: '<path fill-rule="evenodd" d="M7 10V7a5 5 0 0110 0v3h1.500c.8 0 1.500.7 1.500 1.500v9c0 .8-.7 1.500-1.500 1.500h-13c-.8 0-1.500-.7-1.500-1.500v-9c0-.8.7-1.500 1.500-1.500zm2.200 0h5.600V7a2.800 2.800 0 00-5.600 0z"/>',
    portal: '<path d="M4.500 22V11a7.500 7.500 0 0115 0v11h-3.200V11a4.300 4.300 0 00-8.600 0v11z"/><circle cx="12" cy="13.500" r="2.200"/>',
    chest: '<path d="M3 10a5.500 5.500 0 015.500-5.500h7A5.500 5.500 0 0121 10v1.800H3zM3 13.300h7.300v1.400a1.700 1.700 0 003.400 0v-1.400H21V20H3z"/>',
    road: '<path fill-rule="evenodd" d="M8.500 2h7l4 20h-6.300l-.3-4h-1.800l-.3 4H4.500zm2.700 4l-.2 3h2l-.2-3zm-.5 6l-.3 3.500h3.200L13.300 12z"/>',
    speed: '<path d="M3 5l8.500 7L3 19zM12.500 5L21 12l-8.500 7z"/>',
    target: '<path fill-rule="evenodd" d="M11 1.500h2v3.100a7.500 7.500 0 016.400 6.400h3.100v2h-3.100a7.500 7.500 0 01-6.400 6.400v3.100h-2v-3.100A7.500 7.500 0 014.600 13H1.500v-2h3.100A7.500 7.500 0 0111 4.600zm1 5.200a5.300 5.300 0 100 10.600 5.300 5.300 0 000-10.600zm0 3a2.300 2.300 0 110 4.600 2.300 2.300 0 010-4.600z"/>',
    gear: '<path d="M3 6h10.200a3 3 0 015.600 0H21v2.400h-2.200a3 3 0 01-5.600 0H3zm0 9.600h2.200a3 3 0 015.600 0H21V18H10.800a3 3 0 01-5.600 0H3z"/>',
    gift: '<path d="M3 8h4.300A3 3 0 0112 4.600 3 3 0 0116.700 8H21v4H3zm1.200 5.200h6.600V21H4.200zm9 0h6.600V21h-6.600z"/>',
    info: '<path fill-rule="evenodd" d="M12 2a10 10 0 110 20 10 10 0 010-20zm-1.300 8.500V17h2.600v-6.500zm0-3.800v2.400h2.600V6.700z"/>',
    potion: '<path d="M9 2h6v2.200h-1v3.500l4.600 7.800A4.300 4.300 0 0114.900 22H9.100a4.300 4.300 0 01-3.700-6.500L10 7.700V4.200H9z"/>',
    zzz: '<path d="M4 5h8v2l-5 5.500h5V15H3.500v-2l5-5.500H4zM14 12h6.500v1.700l-3.700 4h3.700V20H13.500v-1.700l3.700-4H14z"/>',
    run: '<path d="M14 2.500a2.300 2.300 0 110 4.600 2.300 2.300 0 010-4.600zM9.500 8l4.500-.5 2.500 3.500 3.500 1-.6 2.300-4.400-1.300-1-1.400-1 3.900 3 3.200V22h-2.500v-2.500l-3.300-3.400L9 19.500 3.500 18l.6-2.300 3.500 1 1.500-6-2.600.9V15H4.200v-5z"/>',
    wheat: '<path d="M11 22V11.500C8 11.500 6 9.500 6 6.500c2 0 3.700.8 5 2.200V2h2v6.700c1.300-1.400 3-2.200 5-2.200 0 3-2 5-5 5V22z"/>',
    wave: '<path d="M2 15c2-3.500 4.500-3.500 6.500 0s4.500 3.500 6.500 0 4.500-3.500 7 0v4H2zM7 4l5 5 5-5v3.500l-5 5-5-5z"/>',
    vol: '<path d="M3 9h4l5-4.500v15L7 15H3zm11.500-1a5 5 0 010 8z"/>',
    save: '<path fill-rule="evenodd" d="M4 3h13l4 4v14H4zm3 2v5h9V5zm5 8a3 3 0 100 6 3 3 0 000-6z"/>',
    trash: '<path d="M8.500 2.500h7l.8 2H21v2.300H3V4.500h4.700zM5 8.300h14L17.800 21.500H6.200z"/>',
  };
  const ic = (UI.ic = (n) => '<svg class="i" viewBox="0 0 24 24">' + (IC[n] || IC.info) + '</svg>');
  UI.cost = (gold, cost, extra) => {
    const S = G.S; let h = '';
    if (gold) h += '<span class="cost' + (S.gold < gold ? ' lack' : '') + '">' + ic('coin') + G.fmt(gold) + '</span>';
    for (const k in cost || {}) h += '<span class="cost' + ((S.res[k] || 0) < cost[k] ? ' lack' : '') + '" title="' + G.RES[k].name + '"><i class="px ri-' + k + '"></i>' + G.fmt(cost[k]) + '</span>';
    return '<div class="costs">' + h + (extra || '') + '</div>';
  };
  const esc = (UI.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]));

  /* ---------- vínculos: atualização nó a nó ---------- */
  let bid = 0;
  class View {
    constructor(root) { this.root = root; this.b = []; }
    reset() { this.b.length = 0; }
    _p(o) { o.id = ++bid; o.last = o.fn(); this.b.push(o); return o; }
    T(fn, cls) { const o = this._p({ fn, k: 0 }); return '<span data-b="' + o.id + '"' + (cls ? ' class="' + cls + '"' : '') + '>' + o.last + '</span>'; }
    W(fn) { const o = this._p({ fn, k: 1 }); return 'data-b="' + o.id + '" style="width:' + o.last + '%"'; }
    At(name, fn) { const o = this._p({ fn, k: 2, name }); return 'data-b="' + o.id + '" ' + name + '="' + o.last + '"'; }
    Dis(fn) { const o = this._p({ fn, k: 3 }); return 'data-b="' + o.id + '"' + (o.last ? ' disabled' : ''); }
    Badge(fn, cls) { const o = this._p({ fn, k: 4 }); return '<i class="dot' + (cls ? ' ' + cls : '') + (o.last ? ' on' : '') + '" data-b="' + o.id + '">' + (o.last || '') + '</i>'; }
    St(prop, fn) { const o = this._p({ fn, k: 5, name: prop }); return 'data-b="' + o.id + '" style="' + prop + ':' + o.last + '"'; }
    refresh() {
      for (const o of this.b) {
        const v = o.fn(); if (v === o.last) continue;
        const n = o.n || (o.n = this.root.querySelector('[data-b="' + o.id + '"]')); if (!n) continue;
        switch (o.k) { case 0: n.textContent = v; if (n.classList.contains('bumpable') && +String(v).replace(/\D/g, '') > +String(o.last).replace(/\D/g, '')) { n.classList.remove('bump'); void n.offsetWidth; n.classList.add('bump'); } break; case 1: n.style.width = v + '%'; break; case 2: n.setAttribute(o.name, v); break; case 3: n.disabled = !!v; break; case 4: n.textContent = v || ''; n.classList.toggle('on', !!v); break; case 5: n.style.setProperty(o.name, v); break; }
        o.last = v;
      }
    }
  }
  UI.View = View;

  /* ---------- montagem ---------- */
  let hud, rosterV, inspV, questV;
  UI.build = () => {
    const app = document.getElementById('app');
    app.innerHTML = '<canvas id="view"></canvas>' +
      '<div id="hud"></div><div id="toasts"></div><div id="banner"></div>' +
      '<div id="fabs-l"></div><div id="fabs"></div><div id="inspect" class="glass"></div><button id="quest" class="glass" data-a="open:missoes:jornada"></button>' +
      '<div id="shade" data-a="close"></div><div id="sheet"><div class="sh-head"><button class="bk" data-a="back">' + ic('back') + '</button><h2></h2><button class="x" data-a="close">' + ic('close') + '</button></div><div class="tabs"></div><div class="sh-body"></div></div>' +
      '<nav id="nav"></nav><div id="modal"></div><div id="title"></div>';
    hud = new View($('#hud')); rosterV = new View($('#hud')); inspV = new View($('#inspect')); questV = new View($('#quest'));
    buildHud(); buildNav(); buildFabs();
    app.addEventListener('click', onClick);
    bindCanvas($('#view'));
    window.addEventListener('keydown', (e) => {
      if (!G.S || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') { e.preventDefault(); UI.act('pause'); } else if (e.key === '1' || e.key === '2' || e.key === '3') { G.S.speed = +e.key; } else if (e.key === 'Escape') { if (UI.modalOpen) UI.closeModal(); else UI.close(); } else if (e.key === 'm' || e.key === 'M') UI.act('map');
    });
    wireEvents();
  };
  const C = 2 * Math.PI * 16;
  const buildHud = () => {
    const S = () => G.S;
    hud.reset();
    $('#hud').innerHTML =
      '<div class="hud-row"><button class="realm glass" data-a="open:reino:geral"><span class="ring"><svg viewBox="0 0 40 40"><circle class="bg" cx="20" cy="20" r="16"/><circle class="fg" cx="20" cy="20" r="16" stroke-dasharray="' + C.toFixed(1) + '" ' + hud.St('stroke-dashoffset', () => (G.S ? (C * (1 - G.S.realm.xp / G.realmNeed(G.S.realm.lvl))).toFixed(1) : C)) + '/></svg><b>' + hud.T(() => (G.S ? G.S.realm.lvl : 1)) + '</b></span>' +
      '<span class="rt"><i>' + hud.T(() => (G.S ? G.threatName(G.S.realm.lvl) : '')) + '</i><em><span ' + hud.At('data-n', () => (G.S && G.isNight(G.S.clock) ? 1 : 0)) + ' class="dn">' + ic('sun') + ic('moon') + '</span>' + hud.T(() => (G.S ? 'Dia ' + G.S.day + ' · ' + G.clockStr(Math.floor(G.S.clock / 10) * 10) : '')) + '</em></span></button>' +
      '<div class="ctl"><button class="glass" data-a="speed" id="b-speed">' + hud.T(() => (G.S ? G.S.speed + '×' : '1×')) + '</button><button class="glass" data-a="pause" ' + hud.At('class', () => 'glass' + (G.S && G.S.paused ? ' on' : '')) + '>' + ic('pause') + '</button></div></div>' +
      '<div class="cur"><span class="chip glass gold">' + ic('coin') + hud.T(() => (G.S ? G.fmt(G.S.gold) : 0), 'bumpable') + '</span><span class="chip glass selo" data-a="open:mais:bencaos">' + ic('seal') + hud.T(() => (G.S ? G.S.selos : 0), 'bumpable') + '</span><span class="chip glass nuc" data-a="portal">' + ic('core') + hud.T(() => (G.S ? G.S.nucleos : 0), 'bumpable') + '</span><span class="sp"></span>' +
      '<span ' + hud.At('class', () => 'chip glass mini' + (G.S && G.bOk('taverna') && G.S.res.refeicao < 1 ? ' warn' : '')) + ' data-a="open:reino:geral"><i class="px ri-refeicao" style="width:16px;height:16px"></i>' + hud.T(() => (G.S ? Math.floor(G.S.res.refeicao || 0) : 0)) + '</span><span ' + hud.At('class', () => 'chip glass mini' + (G.S && G.bOk('alquimista') && G.S.res.pocao < 1 ? ' warn' : '')) + ' data-a="open:reino:geral"><i class="px ri-pocao" style="width:16px;height:16px"></i>' + hud.T(() => (G.S ? Math.floor(G.S.res.pocao || 0) : 0)) + '</span></div>' +
      '<div id="roster"></div><div id="zonechip" class="glass"></div><div id="bossbar" class="glass"><b><span id="bb-n"></span><span id="bb-p"></span></b><div class="bar big p"><i id="bb-f"></i></div></div>';
    void S;
  };
  const stateIcon = (h) => ({ hunt: 'sword', travel: 'run', return: 'bag', flee: 'run', fallen: 'skull', recover: 'heart', defend: 'shield', rift: 'portal', inside: h.act === 'rest' ? 'zzz' : h.act === 'eat' ? 'meal' : h.act === 'heal' ? 'heart' : h.act === 'train' ? 'target' : 'coin', goto: 'castle', idle: 'smile', town: 'castle' })[h.state] || 'castle';
  UI.portrait = (h) => A.portrait(A.heroLook(h));
  const buildRoster = () => {
    const S = G.S, el = $('#roster'); if (!S || !el) return;
    rosterV.reset(); rosterV.root = el;
    let h = '';
    for (const x of S.heroes) {
      h += '<button class="hc" data-a="hero:' + x.id + '" ' + rosterV.At('data-s', () => x.state) + ' id="hc' + x.id + '" style="border-color:' + G.RANK_COLOR[x.rank] + '"><i class="pt px" style="background-image:url(' + UI.portrait(x) + ')"></i><i class="rk" style="background:' + G.RANK_COLOR[x.rank] + '">' + G.RANKS[x.rank] + '</i><span class="lv">' + rosterV.T(() => x.lvl) + '</span><span class="st" ' + rosterV.At('data-i', () => stateIcon(x)) + '></span><span class="hpb"><i ' + rosterV.W(() => Math.round(100 * Math.max(0, x.hp) / G.heroStats(x).hp)) + '></i></span>' + '<i ' + rosterV.At('class', () => (G.canPromote(x) || G.canRebirth(x) ? 'upm on' : 'upm')) + '></i></button>';
    }
    if (S.heroes.length < G.heroCap()) h += '<button class="hc add" data-a="portal">' + ic('plus') + '</button>';
    el.innerHTML = h;
    lastIcons = {};
  };
  let lastIcons = {};
  const refreshRosterIcons = () => { for (const x of G.S.heroes) { const i = stateIcon(x); if (lastIcons[x.id] === i) continue; const n = document.querySelector('#hc' + x.id + ' .st'); if (n) { n.innerHTML = ic(i); lastIcons[x.id] = i; } const c = document.getElementById('hc' + x.id); if (c) c.classList.toggle('sel', R.follow === x.id); } };
  const NAV = [['reino', 'castle', 'Reino'], ['herois', 'people', 'Heróis'], ['forja', 'anvil', 'Forja'], ['missoes', 'scroll', 'Missões'], ['mais', 'grid', 'Mais']];
  UI.badges = {
    reino: () => { let n = 0; for (const id of G.BLD_IDS) if ((G.bLvl(id) === 0 && G.bAvailable(id) && G.canUpgrade(id).ok) || (G.S.b[id] && G.S.b[id].dmg)) n++; return n; },
    herois: () => G.S.heroes.filter((h) => G.canPromote(h) || G.canRebirth(h)).length,
    forja: () => (G.bOk('ferraria') ? UI.wanted().filter((w) => w.can).length : 0),
    missoes: () => (G.questCur().done ? 1 : 0) + G.S.daily.list.filter((c) => !c.claimed && c.p >= c.n).length + (!G.S.daily.claimed && G.S.daily.list.length && G.S.daily.list.every((c) => c.claimed) ? 1 : 0),
    mais: () => G.achPending(),
  };
  /* o que os heróis querem e ainda não existe à venda */
  let wantCache = null, wantT = -1;
  UI.wanted = () => {
    const S = G.S; if (wantCache && S.t - wantT < 2) return wantCache; wantT = S.t;
    const mt = G.forgeMaxTier(), out = [], seen = {};
    if (mt > 0) for (const h of S.heroes) { const c = G.CLASSES[h.cls]; for (const [slot, type] of [['arma', c.w], ['armadura', c.a], ['acessorio', 'anel']]) { const cur = h.gear[slot]; let t = mt; while (t > 1 && G.TIER_LVL(t) > h.lvl + 6) t--; if (cur && cur.tier >= t) continue; if (S.inv.some((i) => i.forSale && i.type === type && i.tier >= t)) continue; const k = type + t; if (seen[k]) { seen[k].who.push(h.name); continue; } const o = { type, tier: t, who: [h.name], can: G.canCraft(type, t, false).ok, pay: h.gold >= G.itemPrice({ type, tier: t, rar: 0, plus: 0 }) }; seen[k] = o; out.push(o); } }
    wantCache = out; return out;
  };
  let navV;
  const buildNav = () => { const el = $('#nav'); navV = new View(el); el.innerHTML = NAV.map(([id, i, l]) => '<button data-a="open:' + id + '" id="nav-' + id + '">' + ic(i) + '<span>' + l + '</span>' + navV.Badge(() => (G.S ? UI.badges[id]() : 0), id === 'forja' || id === 'reino' ? 'gold' : '') + '</button>').join(''); };
  let decV;
  const buildFabs = () => {
    $('#fabs-l').innerHTML = '<button class="fab glass" data-a="map">' + ic('map') + '</button><button class="fab glass" data-a="home">' + ic('castle') + '</button>';
    const el = $('#fabs'); decV = new View(el);
    el.innerHTML = '<div id="decrees">' + G.DECREES.map((d) => '<button class="dec glass" data-a="decree:' + d.id + '" ' + decV.Dis(() => !G.S || !G.decreeReady(d) || G.S.gold < G.decreeCost(d)) + '><span class="di">' + ic(d.icon) + '</span><span>' + d.name + '<small>' + decV.T(() => { if (!G.S) return ''; const left = (G.S.decrees[d.id] || 0) - G.S.t; return left > 0 ? 'pronto em ' + Math.ceil(left) + 's' : G.decreeCost(d) ? G.fmt(G.decreeCost(d)) + ' moedas' : 'pronto'; }) + '</small></span></button>').join('') + '</div><button class="fab glass" data-a="decrees" id="fab-dec">' + ic('bolt') + '</button>';
  };

  /* ---------- jornada (rodapé) ---------- */
  let questSig = '';
  const refreshQuest = () => {
    const q = G.questCur(), el = $('#quest'); const sig = q.t + '|' + q.done;
    if (sig !== questSig) {
      questSig = sig; questV.reset();
      el.classList.toggle('done', q.done);
      el.setAttribute('data-a', q.done ? 'questclaim' : 'open:missoes:jornada');
      el.innerHTML = '<span class="qi">' + ic(q.done ? 'chest' : 'scroll') + '</span><span class="qt"><b>' + esc(q.t) + '</b><div class="bar"><i ' + questV.W(() => { const c = G.questCur(); return Math.round(100 * c.cur / c.n); }) + '></i></div></span><span class="qn">' + (q.done ? 'Resgatar' : questV.T(() => { const c = G.questCur(); return G.fmt(c.cur) + '/' + G.fmt(c.n); })) + '</span>';
    } else questV.refresh();
  };

  /* ---------- inspeção ---------- */
  UI.inspect = (sel) => {
    R.sel = sel; const el = $('#inspect'); inspV.reset();
    if (!sel) { el.classList.remove('on'); $('#quest').style.display = ''; return; }
    let h = '';
    if (sel.type === 'hero') { const x = sel.ref; h = '<i class="ip px" style="background-image:url(' + UI.portrait(x) + ')"></i><span class="it"><b>' + esc(x.name) + ' · ' + G.heroTitle(x) + ' ' + inspV.T(() => 'Nv ' + x.lvl) + '</b>' + inspV.T(() => G.stateLabel(x)) + '</span><button class="btn sm pri" data-a="herod:' + x.id + '">Ficha</button>'; }
    else if (sel.type === 'mon') { const m = sel.ref, d = G.MON[m.k]; h = '<i class="ip px" style="background-image:url(' + A.monPortrait(m.k) + ')"></i><span class="it"><b>' + (m.elite ? 'Elite · ' : '') + d.name + ' Nv ' + m.lvl + '</b>' + inspV.T(() => (m.dead ? 'Abatido' : 'Vida ' + G.fmt(Math.max(0, m.hp)) + ' / ' + G.fmt(m.hpMax))) + '</span><button class="btn sm" data-a="mark">' + ic('target') + 'Alvo</button>'; }
    else if (sel.type === 'npc') { const n = sel.ref; h = '<i class="ip px" style="background-image:url(' + A.portrait(A.npcLook(n)) + ')"></i><span class="it"><b>' + esc(n.name) + '</b><span>' + n.job + (n.at && G.BLD[n.at] ? ' · ' + G.BLD[n.at].short : '') + '</span></span>'; if (!n.guard) { n.say = G.pick(G.BARKS.npc); n.sayT = 3.5; } }
    el.innerHTML = h + '<button class="btn sm" data-a="unsel">' + ic('close') + '</button>';
    el.classList.add('on'); $('#quest').style.display = 'none';
  };

  /* ---------- avisos ---------- */
  UI.toast = (m, k, icon) => {
    const box = $('#toasts'); while (box.children.length >= 3) box.firstChild.remove();
    const t = document.createElement('div'); t.className = 'toast ' + (k || ''); t.innerHTML = ic(icon || (k === 'bad' ? 'skull' : k === 'good' ? 'check' : 'info')) + '<span>' + esc(m) + '</span>';
    box.appendChild(t); setTimeout(() => t.remove(), 3500);
  };
  let banT = 0;
  UI.banner = (small, big, sub) => { const b = $('#banner'); b.innerHTML = '<small>' + small + '</small><h2>' + big + '</h2>' + (sub ? '<p>' + sub + '</p>' : ''); b.classList.remove('on'); void b.offsetWidth; b.classList.add('on'); clearTimeout(banT); banT = setTimeout(() => b.classList.remove('on'), 3300); };

  /* ---------- ações ---------- */
  const onClick = (e) => {
    const t = e.target.closest('[data-a]'); if (!t || t.disabled) return;
    const [a, ...args] = t.getAttribute('data-a').split(':');
    G.sfx('click'); UI.act(a, args, t);
  };
  UI.ACT = {
    open: (a) => UI.open(a[0], a[1]), close: () => UI.close(), back: () => UI.back(),
    speed: () => { const S = G.S; S.speed = S.speed >= 3 ? 1 : S.speed + 1; S.paused = false; },
    pause: () => { G.S.paused = !G.S.paused; },
    hero: (a) => { const h = G.S.heroes.find((x) => x.id === +a[0]); if (!h) return; if (R.follow === h.id && R.sel && R.sel.ref === h) return UI.ACT.herod(a); R.follow = h.id; if (h.inside || h.state === 'recover') R.focus(h.x, h.y); UI.inspect({ type: 'hero', ref: h }); },
    herod: (a) => UI.open('herois', 'lista', { hero: +a[0] }),
    unsel: () => { R.follow = 0; UI.inspect(null); },
    mark: () => { if (R.sel && R.sel.type === 'mon') { R.sel.ref.mark = !R.sel.ref.mark; UI.toast(R.sel.ref.mark ? 'Alvo marcado: os heróis dão prioridade.' : 'Alvo desmarcado.', 'info', 'target'); } },
    home: () => { R.follow = 0; R.focus(44, 53); },
    map: () => UI.mapModal(),
    decrees: () => { const d = $('#decrees'); d.classList.toggle('on'); $('#fab-dec').classList.toggle('on', d.classList.contains('on')); },
    decree: (a) => { if (!G.useDecree(a[0])) UI.toast('Ainda não está pronto.', 'bad'); },
    portal: () => UI.recruitModal(),
    questclaim: () => { if (G.questClaim()) { UI.toast('Recompensa da jornada recebida!', 'good', 'chest'); questSig = ''; } },
  };
  UI.act = (a, args, el) => { const f = UI.ACT[a]; if (f) f(args || [], el); };

  /* ---------- toque no mapa ---------- */
  const bindCanvas = (cv) => {
    const pts = new Map(); let moved = false, pinch = 0, sx = 0, sy = 0;
    cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.size === 1) { moved = false; sx = e.clientX; sy = e.clientY; } if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); moved = true; } });
    cv.addEventListener('pointermove', (e) => {
      const p = pts.get(e.pointerId); if (!p) return;
      if (pts.size === 1) { const dx = e.clientX - p.x, dy = e.clientY - p.y; if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) > 7) moved = true; if (moved) R.pan(dx, dy); p.x = e.clientX; p.y = e.clientY; }
      else if (pts.size === 2) { p.x = e.clientX; p.y = e.clientY; const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch > 0) R.setZoom(R.cam.zf * (d / pinch), (a.x + b.x) / 2, (a.y + b.y) / 2); pinch = d; }
    });
    const up = (e) => { const had = pts.has(e.pointerId); pts.delete(e.pointerId); if (pts.size < 2) pinch = 0; if (had && !moved && pts.size === 0 && e.type === 'pointerup') tap(e.clientX, e.clientY); if (pts.size === 1) { const p = [...pts.values()][0]; sx = p.x; sy = p.y; moved = true; } };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', (e) => { e.preventDefault(); R.setZoom(R.cam.zf * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY); }, { passive: false });
  };
  const tap = (x, y) => {
    if (!G.S || !G.M.running) return;
    const r = R.pick(x, y);
    if (!r) { if (UI.sheet && window.innerWidth < 860) UI.close(); else UI.ACT.unsel(); return; }
    G.sfx('click');
    if (r.type === 'hero') { R.follow = r.ref.id; UI.inspect(r); }
    else if (r.type === 'mon' || r.type === 'npc') { R.follow = 0; UI.inspect(r); }
    else if (r.type === 'portal') UI.recruitModal();
    else if (r.type === 'board') UI.open('missoes', 'contratos');
    else if (r.type === 'bld') UI.open('reino', 'obras', { bld: r.id });
  };

  /* ---------- atualização periódica (4×/s) ---------- */
  let bossN = '';
  UI.refresh = () => {
    if (!G.S || !G.M.running) return;
    hud.refresh(); rosterV.refresh(); refreshRosterIcons(); navV.refresh(); decV.refresh(); refreshQuest();
    if (R.sel) { inspV.refresh(); if (R.sel.type === 'mon' && (R.sel.ref.dead || R.sel.ref.gone)) UI.inspect(null); }
    if (UI.sheet) UI.sheetRefresh();
    /* barra de chefe */
    let boss = null; for (const m of G.mons) if (m.boss && !m.dead && (m.tgt || m.hp < m.hpMax)) { boss = m; break; }
    const bb = $('#bossbar');
    if (boss) { const d = G.MON[boss.k]; if (bossN !== boss.id) { bossN = boss.id; $('#bb-n').textContent = d.name + ' · Nv ' + boss.lvl; bb.classList.add('on'); } $('#bb-f').style.width = Math.round(100 * Math.max(0, boss.hp) / boss.hpMax) + '%'; $('#bb-p').textContent = Math.round(100 * Math.max(0, boss.hp) / boss.hpMax) + '%'; }
    else if (bossN !== '') { bossN = ''; bb.classList.remove('on'); }
  };

  /* ---------- eventos do jogo ---------- */
  let zoneT = 0;
  const wireEvents = () => {
    G.on('toast', (d) => UI.toast(d.m, d.k, d.icon));
    G.on('heroes', buildRoster); G.on('promo', buildRoster); G.on('bld', () => { buildRoster(); });
    G.on('start', (d) => { $('#title').classList.remove('on'); buildRoster(); questSig = ''; UI.refresh(); if (d.off) UI.offlineModal(d.off); else if (!G.S.tut.done) setTimeout(() => UI.tutorial(), 600); });
    G.on('realm', (d) => { UI.banner(d.threatUp ? 'A ameaça cresce: ' + d.threatUp : 'O renome de Aurora cresce', 'Nível de Reino ' + d.lvl, '+' + G.fmt(d.gold) + ' moedas · +' + d.selos + ' Selo' + (d.selos > 1 ? 's' : '') + (d.unlocked.length ? ' · Novo: ' + d.unlocked.join(', ') : '')); });
    G.on('boss', (d) => { UI.banner('Um chefe despertou', G.MON[G.ZONE[d.z].boss].name, G.ZONE[d.z].name); });
    G.on('mare', (d) => { if (d.on) UI.banner('Às armas!', 'Maré da Fenda', 'Invasores marcham sobre Aurora'); else UI.mareModal(d); });
    G.on('rift', () => {});
    G.on('event', (e) => UI.eventModal(e));
    G.on('newday', (t) => { UI.toast('Dia ' + G.S.day + ' — ontem: +' + G.fmt(t._in) + ' / −' + G.fmt(t._out) + ' moedas', 'info', 'sun'); });
    G.on('camzone', (zi) => { const el = $('#zonechip'); const z = zi >= 0 && zi < G.ZONES.length ? G.ZONES[zi] : null; const name = z ? z.name + ' · Nv ' + G.zoneLvl(z, G.S.zones[z.id].tier) : zi === 7 ? 'Cratera da Fenda' : zi === 8 ? 'Aurora' : zi === 9 ? 'Mata dos Lenhadores' : ''; if (!name) { el.classList.remove('on'); return; } el.textContent = name; el.classList.add('on'); clearTimeout(zoneT); zoneT = setTimeout(() => el.classList.remove('on'), 2600); });
    for (const ev of ['bld', 'inv', 'heroes', 'daily', 'quest', 'bless', 'works', 'realm', 'rift', 'mare', 'ach', 'newday', 'promo', 'bosskill', 'boss', 'eventdone', 'hour']) G.on(ev, () => UI.sheetDirty(ev));
  };

  /* ---------- tela de título ---------- */
  UI.showTitle = () => {
    const t = $('#title'), has = G.M.hasSave();
    let sky = ''; const hs = [34, 52, 40, 70, 46, 96, 58, 44, 66, 38, 50, 30]; for (const h of hs) sky += '<i style="height:' + h + 'px"></i>';
    t.innerHTML = '<div class="stars"></div><div class="moon m1"></div><div class="moon m2"></div><div class="sky">' + sky + '</div><div class="hill"></div>' +
      '<div class="inner"><div class="eyebrow">Cidade Viva</div><h1>Aurora</h1><div class="sub">Crônicas da Fenda</div><p class="tag">Sob duas luas, um reino de caçadores espera por você.<br>Erga a cidade, forje lendas, enfrente a Fenda.</p>' +
      (has ? '<button class="btn pri" data-a="t-continue">Continuar jornada</button><button class="btn" data-a="t-new">Nova jornada</button>' : '<button class="btn pri" data-a="t-new">Iniciar jornada</button>') +
      '<button class="btn" data-a="t-import">Importar save</button><div class="ver">v' + G.VERSION + ' · Reforjada · salva sozinho neste aparelho</div></div>';
    t.classList.add('on');
  };
  UI.ACT['t-continue'] = () => { G.emit('audio-unlock'); G.M.start(false); };
  UI.ACT['t-new'] = () => { G.emit('audio-unlock'); if (G.M.hasSave()) UI.confirm('Começar do zero?', 'A jornada salva neste aparelho será apagada. Não há como desfazer.', 'Apagar e começar', () => { G.M.wipe(); G.M.start(true); }); else G.M.start(true); };
  UI.ACT['t-import'] = () => UI.importModal();
})();
