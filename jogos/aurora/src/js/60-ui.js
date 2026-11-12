/* 60-ui: HUD único, navegação, avisos, toque no mapa e tela de título.
   Regra de ouro (correção do pisca-pisca): nada é reconstruído por quadro. A estrutura só é
   refeita quando um evento do jogo a muda; os números são atualizados nó a nó, e só se mudaram. */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const UI = (G.UI = { sheet: null, modalOpen: false });
  const A = G.A, R = G.R;
  const $ = (UI.$ = (s, el) => (el || document).querySelector(s));

  /* ---------- ícones: pixel art gerada em 56/57 (UI.ic devolve <i class="i" data-i="nome">) ---------- */
  const ic = (UI.ic = (n) => G.PX.ic(n));
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
      '<div id="hud"></div><div id="banner"></div>' +
      '<div id="fabs-l"></div><div id="fabs"></div><div id="inspect" class="glass"></div><button id="quest" class="glass" data-a="open:missoes:jornada"></button>' +
      '<div id="shade" data-a="close"></div><div id="sheet"><div class="sh-head"><button class="bk" data-a="back">' + ic('back') + '</button><h2></h2><button class="x" data-a="close">' + ic('close') + '</button></div><div class="tabs"></div><div class="sh-body"></div></div>' +
      '<nav id="nav"></nav><div id="modal"></div><div id="title"></div>';
    hud = new View($('#hud')); rosterV = new View($('#hud')); inspV = new View($('#inspect')); questV = new View($('#quest'));
    buildHud(); buildNav(); buildFabs();
    app.addEventListener('click', onClick);
    bindCanvas($('#view'));
    window.addEventListener('keydown', (e) => {
      if (!G.S || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') { e.preventDefault(); UI.act('pause'); } else if (e.key === '1' || e.key === '2' || e.key === '3') { G.S.speed = +e.key; } else if (e.key === 'Escape') { if (UI.modalOpen) UI.closeModal(); else if (UI.dock && UI.dock.kind) UI.dock.close(); else UI.close(); } else if (e.key === 'm' || e.key === 'M') UI.act('map');
    });
    wireEvents();
  };
  const buildHud = () => {
    hud.reset();
    const R_ = (id) => '<span class="chip mini" data-a="open:reino:geral" title="' + G.RES[id].name + '"><i class="px ri-' + id + '"></i>' + hud.T(() => (G.S ? Math.floor(G.S.res[id] || 0) : 0)) + '</span>';
    $('#hud').innerHTML =
      '<div class="hud-row glass"><button class="realm" data-a="open:reino:geral"><span class="ring sl">' + hud.T(() => (G.S ? G.S.realm.lvl : 1)) + '</span>' +
      '<span class="rt"><i>' + hud.T(() => (G.S ? G.threatName(G.S.realm.lvl) : '')) + '</i><em><span ' + hud.At('data-n', () => (G.S && G.isNight(G.S.clock) ? 1 : 0)) + ' class="dn">' + ic('sun') + ic('moon') + '</span>' + hud.T(() => (G.S ? 'Dia ' + G.S.day + ' · ' + G.clockStr(Math.floor(G.S.clock / 10) * 10) : '')) + '</em><span class="xpb"><i ' + hud.W(() => (G.S ? Math.round(100 * G.S.realm.xp / G.realmNeed(G.S.realm.lvl)) : 0)) + '></i></span></span></button>' +
      '<div class="ctl"><button class="dif" data-a="diff" title="Dificuldade" ' + hud.St('color', () => (G.S ? G.diffCur().c : '#d9a441')) + '>' + ic('skull') + '<small>' + hud.T(() => (G.S ? G.diffCur().name : '')) + '</small></button><button data-a="speed" id="b-speed">' + hud.T(() => (G.S ? G.S.speed + '×' : '1×')) + '</button><button data-a="pause" ' + hud.At('class', () => (G.S && G.S.paused ? 'on' : '')) + '>' + ic('pause') + '</button></div></div>' +
      '<div class="cur" data-a="curtog"><span class="chip glass gold">' + ic('coin') + hud.T(() => (G.S ? G.fmt(G.S.gold) : 0), 'bumpable') + '</span><span class="chip glass selo" data-a="open:mais:bencaos">' + ic('seal') + hud.T(() => (G.S ? G.S.selos : 0), 'bumpable') + '</span><span class="chip glass nuc" data-a="portal">' + ic('core') + hud.T(() => (G.S ? G.S.nucleos : 0), 'bumpable') + '</span><span class="sp"></span>' +
      '<span ' + hud.At('class', () => 'chip glass more' + (G.S && ((G.bOk('taverna') && G.S.res.refeicao < 1) || (G.bOk('alquimista') && G.S.res.pocao < 1)) ? ' warn' : '')) + '>' + ic('chevd') + '</span>' +
      '<div class="tray glass" id="tray"><span ' + hud.At('class', () => 'chip mini' + (G.S && G.bOk('taverna') && G.S.res.refeicao < 1 ? ' warn' : '')) + ' data-a="open:reino:geral"><i class="px ri-refeicao"></i>' + hud.T(() => (G.S ? Math.floor(G.S.res.refeicao || 0) : 0)) + '</span><span ' + hud.At('class', () => 'chip mini pot' + (G.S && G.bOk('alquimista') && G.S.res.pocao < 1 ? ' warn' : '')) + ' data-a="open:reino:geral"><i class="px ri-pocao"></i>' + hud.T(() => (G.S ? Math.floor(G.S.res.pocao || 0) : 0)) + '</span>' + R_('madeira') + R_('pedra') + R_('minerio') + '</div></div>' +
      '<div id="roster"></div><div id="zonechip" class="glass"></div><div id="bossbar" class="glass"><b><span id="bb-n"></span><span id="bb-p"></span></b><div class="bar big p"><i id="bb-f"></i></div></div>' +
      '<div id="tslot"><div id="toasts"></div><button id="logchip" data-a="logtray">' + ic('scroll') + '<span class="tc"></span></button><div id="logtray" class="glass"></div></div>';
  };
  const stateIcon = (h) => ({ hunt: 'sword', travel: 'run', return: 'bag', flee: 'run', fallen: 'skull', recover: 'heart', defend: 'shield', rift: 'portal', inc: 'paw', inside: h.act === 'rest' ? 'zzz' : h.act === 'eat' ? 'meal' : h.act === 'heal' ? 'heart' : h.act === 'train' ? 'target' : 'coin', goto: 'castle', idle: 'smile', town: 'castle' })[h.state] || 'castle';
  UI.portrait = (h) => A.portrait(A.heroLook(h));
  const buildRoster = () => {
    const S = G.S, el = $('#roster'); if (!S || !el) return;
    rosterV.reset(); rosterV.root = el;
    let h = '';
    for (const x of S.heroes) {
      h += '<button class="hc" data-a="hero:' + x.id + '" ' + rosterV.At('data-s', () => x.state) + ' id="hc' + x.id + '" style="--rc:' + G.RANK_COLOR[x.rank] + '"><i class="pt px" style="background-image:url(' + UI.portrait(x) + ')"></i><span class="st" ' + rosterV.At('data-i', () => stateIcon(x)) + '></span><span class="hpb"><i ' + rosterV.W(() => Math.round(100 * Math.max(0, x.hp) / G.heroStats(x).hp)) + '></i></span>' + '<i ' + rosterV.At('class', () => (G.canPromote(x) || G.canRebirth(x) || G.canJob(x) || G.canWake(x) ? 'upm on' : 'upm')) + '></i></button>';
    }
    if (S.heroes.length < G.heroCap()) h += '<button class="hc add" data-a="portal">' + ic('plus') + '</button>';
    el.innerHTML = h;
    lastIcons = {}; lastOrder = {};
  };
  let lastIcons = {};
  /* C3: só um glifo de estado, e só quando há algo a dizer (caçar e andar são o normal e não ganham ícone) */
  const QUIET = { hunt: 1, travel: 1, return: 1, goto: 1, town: 1 };
  let lastOrder = {};
  const heroScore = (x) => { const alert = x.state === 'fallen' || x.state === 'recover' ? 3 : x.state === 'flee' || x.hp < G.heroStats(x).hp * 0.35 ? 2 : (G.canPromote(x) || G.canRebirth(x) || G.canJob(x) || G.canWake(x)) ? 1 : 0; return alert * 1000 - x.lvl - x.rank * 100; };
  const refreshRosterIcons = () => {
    const hs = G.S.heroes, big = hs.length > 5;
    for (const x of hs) {
      const i = QUIET[x.state] ? '' : stateIcon(x); const n = document.querySelector('#hc' + x.id + ' .st');
      if (lastIcons[x.id] !== i) { if (n) { n.innerHTML = i ? ic(i) : ''; lastIcons[x.id] = i; } }
      const c = document.getElementById('hc' + x.id); if (!c) continue;
      c.classList.toggle('sel', R.follow === x.id);
      const o = big ? Math.round(heroScore(x)) : 0; if (lastOrder[x.id] !== o) { lastOrder[x.id] = o; c.style.order = o; }
    }
  };
  const NAV = [['reino', 'castle', 'Reino'], ['herois', 'people', 'Heróis'], ['forja', 'anvil', 'Forja'], ['armazem', 'chest', 'Armazém'], ['missoes', 'scroll', 'Missões'], ['mais', 'grid', 'Mais']];
  UI.badges = {
    reino: () => { let n = 0; for (const id of G.BLD_IDS) if ((G.bLvl(id) === 0 && G.bAvailable(id) && G.canUpgrade(id).ok) || (G.S.b[id] && G.S.b[id].dmg)) n++; return n; },
    herois: () => G.S.heroes.filter((h) => G.canPromote(h) || G.canRebirth(h) || G.canJob(h) || G.canWake(h)).length,
    armazem: () => 0,
    forja: () => (G.bOk('ferraria') ? UI.wanted().filter((w) => w.can).length : 0),
    missoes: () => G.pathsPending() + (G.questCur().done ? 1 : 0) + G.S.daily.list.filter((c) => !c.claimed && c.p >= c.n).length + (!G.S.daily.claimed && G.S.daily.list.length && G.S.daily.list.every((c) => c.claimed) ? 1 : 0),
    mais: () => G.achPending(),
  };
  /* o que os heróis querem e ainda não existe à venda */
  let wantCache = null, wantT = -1;
  UI.wanted = () => {
    const S = G.S; if (wantCache && S.t - wantT < 2) return wantCache; wantT = S.t;
    const mt = G.forgeMaxTier(), out = [], seen = {};
    if (mt > 0) for (const h of S.heroes) { for (const [slot, type] of G.heroSlots(h)) { if (!G.gearUnlocked(type)) continue; const cur = h.gear[slot]; let t = mt; while (t > 1 && G.TIER_LVL(t) > h.lvl + 6) t--; if (cur && cur.tier >= t) continue; if (S.inv.some((i) => i.forSale && i.type === type && i.tier >= t)) continue; const k = type + t; if (seen[k]) { seen[k].who.push(h.name); continue; } const o = { type, tier: t, who: [h.name], can: G.canCraft(type, t, false).ok, pay: h.gold >= G.itemPrice({ type, tier: t, rar: 0, plus: 0 }) }; seen[k] = o; out.push(o); } }
    wantCache = out; return out;
  };
  let navV;
  const buildNav = () => { const el = $('#nav'); navV = new View(el); el.innerHTML = NAV.map(([id, i, l]) => '<button data-a="open:' + id + '" id="nav-' + id + '">' + ic(i) + '<span>' + l + '</span>' + navV.Badge(() => (G.S ? UI.badges[id]() : 0), id === 'forja' || id === 'reino' ? 'gold' : '') + '</button>').join(''); };
  let decV;
  const buildFabs = () => {
    $('#fabs-l').innerHTML = '<button class="fab" data-a="map" title="Mapa">' + ic('map') + '</button><button class="fab" data-a="home" title="Cidade">' + ic('castle') + '</button>';
    const el = $('#fabs'); decV = new View(el);
    el.innerHTML = '<div id="decrees" class="glass">' + G.DECREES.map((d) => '<button class="dec" data-a="decree:' + d.id + '" ' + decV.Dis(() => !G.S || !G.decreeReady(d) || G.S.gold < G.decreeCost(d)) + '><span class="di">' + ic(d.icon) + '</span><span>' + d.name + '<small>' + decV.T(() => { if (!G.S) return ''; const left = (G.S.decrees[d.id] || 0) - G.S.t; return left > 0 ? 'pronto em ' + Math.ceil(left) + 's' : G.decreeCost(d) ? G.fmt(G.decreeCost(d)) + ' moedas' : 'pronto'; }) + '</small></span></button>').join('') + '</div>';
  };

  /* ---------- jornada (rodapé) ---------- */
  let questSig = '';
  const refreshQuest = () => {
    const q = G.questCur(), el = $('#quest'), pre = !q.done && G.questPrereq ? G.questPrereq() : null; const sig = q.t + '|' + q.done + '|' + (pre ? pre.txt : '');
    if (sig !== questSig) {
      questSig = sig; questV.reset();
      el.classList.toggle('done', q.done); el.classList.toggle('pre', !!pre);
      el.setAttribute('data-a', q.done ? 'questclaim' : pre && pre.first.k === 'bld' ? 'gopre' : 'open:missoes:jornada');
      el.innerHTML = '<span class="qi">' + ic(q.done ? 'chest' : 'scroll') + '</span><span class="qt"><b>' + esc(q.t) + '</b>' + (pre ? '<small class="qpre">' + esc(pre.txt) + '</small>' : '<div class="bar"><i ' + questV.W(() => { const c = G.questCur(); return Math.round(100 * c.cur / c.n); }) + '></i></div>') + '</span><span class="qn">' + (q.done ? 'Resgatar' : questV.T(() => { const c = G.questCur(); return G.fmt(c.cur) + '/' + G.fmt(c.n); })) + '</span>';
    } else questV.refresh();
  };

  /* ---------- inspeção ---------- */
  UI.inspect = (sel) => {
    R.sel = sel; const el = $('#inspect'); inspV.reset();
    if (!sel) { el.classList.remove('on'); $('#quest').style.display = ''; return; }
    let h = '';
    if (sel.type === 'hero') { const x = sel.ref; h = '<i class="ip px" style="background-image:url(' + UI.portrait(x) + ')"></i><span class="it"><b>' + esc(x.name) + ' · ' + inspV.T(() => 'Nv ' + x.lvl) + '</b>' + inspV.T(() => G.stateLabel(x)) + '</span><button class="btn sm pri" data-a="herod:' + x.id + '">Ficha</button>'; }
    else if (sel.type === 'mon') { const m = sel.ref, d = G.MON[m.k]; h = '<i class="ip px" style="background-image:url(' + A.monPortrait(m.k) + ')"></i><span class="it"><b>' + (m.alfa ? 'Alfa · ' : m.elite ? 'Elite · ' : '') + d.name + ' Nv ' + m.lvl + '</b>' + inspV.T(() => (m.dead ? 'Abatido' : 'Vida ' + G.fmt(Math.max(0, m.hp)) + ' / ' + G.fmt(m.hpMax))) + '</span><button class="btn sm" data-a="mark">' + ic('target') + 'Alvo</button>'; }
    else if (sel.type === 'npc') { const n = sel.ref; h = '<i class="ip px" style="background-image:url(' + A.portrait(A.npcLook(n)) + ')"></i><span class="it"><b>' + esc(n.name) + '</b><span>' + n.job + (n.at && G.BLD[n.at] ? ' · ' + G.BLD[n.at].short : '') + '</span></span>'; if (!n.guard) { n.say = G.pick(G.BARKS.npc); n.sayT = 3.5; } }
    el.innerHTML = h + '<button class="btn sm" data-a="unsel">' + ic('close') + '</button>';
    el.classList.add('on'); $('#quest').style.display = 'none';
  };

  /* ---------- avisos: um de cada vez, em fila curta; o que não coube vira o contador "+N" e entra no registro ---------- */
  const TQ = [], LOG = []; let tCur = null, tTimer = 0, dropped = 0, logT = 0;
  UI.logRec = LOG;
  const kindOf = (k) => k || '';
  const paintLog = () => {
    const n = TQ.length + dropped;
    if (tCur) { const ct = tCur.querySelector('.tc'); if (ct) ct.textContent = n > 0 ? '+' + n : ''; if (!tCur.hasAttribute('data-a') && n > 0) tCur.setAttribute('data-a', 'logtray'); }
    const chip = $('#logchip'); if (!chip) return;
    chip.classList.toggle('on', !tCur && dropped > 0); const c = chip.querySelector('.tc'); if (c) c.textContent = dropped > 0 ? '+' + dropped : '';
  };
  const pump = () => {
    const box = $('#toasts'); if (tCur || !TQ.length || !box) return;
    const q = TQ.shift(), t = document.createElement('div');
    const dur = TQ.length ? Math.min(q.dur, 2200) : Math.min(q.dur, q.act ? 6500 : 4200);
    t.className = 'toast glass ' + kindOf(q.k); t.dataset.m = q.m || ''; t.dataset.k = kindOf(q.k); if (q.act) t.setAttribute('data-a', q.act); t.style.setProperty('--td', Math.max(0.6, dur / 1000 - 0.3) + 's');
    t.innerHTML = q.html || (ic(q.icon || (q.k === 'bad' ? 'skull' : q.k === 'good' ? 'check' : 'info')) + '<span>' + esc(q.m2 || q.m) + '</span>');
    t.insertAdjacentHTML('beforeend', '<span class="tc"></span>');
    box.appendChild(t); tCur = t; paintLog();
    clearTimeout(tTimer); tTimer = setTimeout(() => { t.remove(); tCur = null; pump(); paintLog(); }, dur);
  };
  const enq = (q) => {
    TQ.push(q);
    while (TQ.length > 3) { let i = TQ.findIndex((x) => !x.act && (!x.k || x.k === 'info' || x.k === 'good')); if (i < 0) i = 0; TQ.splice(i, 1); dropped++; }
    pump(); paintLog();
  };
  UI.toast = (m, k, icon, dur, act) => {
    /* o mesmo aviso de novo: soma ×N em vez de enfileirar outro */
    const same = TQ.find((x) => x.m === m && x.k === k); if (same) { same.n = (same.n || 1) + 1; same.m2 = m + ' ×' + same.n; return; }
    if (tCur && tCur.dataset.m === m && tCur.dataset.k === kindOf(k)) { const n = (+tCur.dataset.n || 1) + 1; tCur.dataset.n = n; const sp = tCur.querySelector('span'); if (sp) sp.textContent = m + ' ×' + n; return; }
    LOG.push({ m, k, icon, t: G.S ? G.S.t : 0, d: G.S ? G.S.day : 0 }); while (LOG.length > 30) LOG.shift();
    enq({ m, k, icon, dur: dur || 3000, act });
  };
  /* aviso com HTML próprio (Herói do Dia): entra na mesma fila */
  UI.toastHtml = (html, k, dur, m) => { if (m) { LOG.push({ m, k, icon: 'star', t: G.S ? G.S.t : 0, d: G.S ? G.S.day : 0 }); while (LOG.length > 30) LOG.shift(); } enq({ html, k, dur: dur || 5000 }); };
  G.on('start', () => { TQ.length = 0; dropped = 0; LOG.length = 0; clearTimeout(tTimer); tCur = null; const b = $('#toasts'); if (b) b.innerHTML = ''; paintLog(); });
  const logTray = () => {
    const t = $('#logtray'); if (!t) return;
    if (t.classList.contains('on')) { t.classList.remove('on'); return; }
    dropped = 0; paintLog();
    t.innerHTML = LOG.length ? LOG.slice(-10).reverse().map((l) => '<div class="logl ' + kindOf(l.k) + '"><small>D' + l.d + '</small>' + esc(l.m) + '</div>').join('') : '<div class="empty">Nada por aqui ainda.</div>';
    t.classList.add('on'); clearTimeout(logT); logT = setTimeout(() => t.classList.remove('on'), 7000);
  };
  let banT = 0, trayT = 0;
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
    decrees: () => { const d = $('#decrees'); d.classList.toggle('on'); const f = $('#fab-dec'); if (f) f.classList.toggle('open', d.classList.contains('on')); },
    curtog: () => { const t = $('#tray'); if (!t) return; t.classList.toggle('on'); clearTimeout(trayT); if (t.classList.contains('on')) trayT = setTimeout(() => t.classList.remove('on'), 5000); },
    logtray: () => logTray(),
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
    if (UI.placing && UI.placeTap) return UI.placeTap(x, y);
    const r = R.pick(x, y);
    if (UI.dock && UI.dock.kind && !(r && (r.type === 'bld' || r.type === 'house' || r.type === 'pet'))) UI.dock.close();      // v27 (A4): toque fora do cartão fecha o cartão
    if (!r) { if (UI.sheet && window.innerWidth < 860) UI.close(); else UI.ACT.unsel(); return; }
    if (r.type === 'lucky') return UI.luckyTap && UI.luckyTap();     // v24: criatura da sorte (64-ui-retorno)
    G.sfx('click');
    if (r.type === 'hero') { R.follow = r.ref.id; UI.inspect(r); }
    else if (r.type === 'drop') { if (UI.dropTap) UI.dropTap(r.ref); }
    else if (r.type === 'pet') { if (UI.petTap) UI.petTap(r.ref); }      // v27 (B2): cartão do mascote vagante
    else if (r.type === 'mon' || r.type === 'npc') { R.follow = 0; UI.inspect(r); }
    else if (r.type === 'portal') UI.recruitModal();
    else if (r.type === 'house') { if (UI.dock && UI.dock.key === 'casa' + r.i) UI.dock.close(); else UI.houseCard(r.i); }      // v27 (A4): casas da vila também têm cartão
    else if (r.type === 'board') UI.open('missoes', 'contratos');
    else if (r.type === 'bld') { if (UI.dock && UI.dock.kind === 'predio' && UI.dock.key === r.id) UI.dock.close(); else if (UI.bldCard) UI.bldCard(r.id); else UI.open('reino', 'obras', { bld: r.id }); }   // v27 (A4): cartão do prédio (tocar de novo fecha)
  };

  /* ---------- atualização periódica (4×/s) ---------- */
  let bossN = '';
  UI.refresh = () => {
    if (!G.S || !G.M.running) return;
    hud.refresh(); rosterV.refresh(); refreshRosterIcons(); navV.refresh(); decV.refresh(); refreshQuest();
    if (R.sel) { inspV.refresh(); if (R.sel.type === 'mon' && (R.sel.ref.dead || R.sel.ref.gone)) UI.inspect(null); }
    if (UI.sheet) UI.sheetRefresh();
    /* barra de chefe */
    let boss = null; for (const m of G.mons) if (m.boss && !m.colosso && !m.dead && m.tgt) { boss = m; break; }
    const bb = $('#bossbar');
    if (boss) { const d = G.MON[boss.k]; if (bossN !== boss.id) { bossN = boss.id; $('#bb-n').textContent = (boss.alfa ? 'Alfa · ' : '') + d.name + ' · Nv ' + boss.lvl; bb.classList.add('on'); } $('#bb-f').style.width = Math.round(100 * Math.max(0, boss.hp) / boss.hpMax) + '%'; $('#bb-p').textContent = Math.round(100 * Math.max(0, boss.hp) / boss.hpMax) + '%'; }
    else if (bossN !== '') { bossN = ''; bb.classList.remove('on'); }
  };

  /* ---------- eventos do jogo ---------- */
  let zoneT = 0;
  const wireEvents = () => {
    G.on('toast', (d) => UI.toast(d.m, d.k, d.icon, null, d.act));
    G.on('heroes', buildRoster); G.on('promo', buildRoster); G.on('bld', () => { buildRoster(); });
    G.on('start', (d) => { $('#title').classList.remove('on'); buildRoster(); questSig = ''; UI.refresh(); if (d.off) UI.queueModal(UI.PRIO.retorno, () => UI.offlineModal(d.off), 'retorno'); if (!G.S.tut.done) UI.queueModal(UI.PRIO.tut, () => { if (G.S.tut.done) return false; UI.tutorial(); }, 'tut'); });
    G.on('away', (d) => { if (d.off) UI.queueModal(UI.PRIO.retorno, () => UI.offlineModal(d.off), 'retorno'); });     // v27 (A1): voltou à aba depois de 1 min ou mais
    G.on('realm', (d) => { UI.banner(d.threatUp ? 'A ameaça cresce: ' + d.threatUp : 'O renome de Aurora cresce', 'Nível de Reino ' + d.lvl, '+' + G.fmt(d.gold) + ' moedas · +' + d.selos + ' Selo' + (d.selos > 1 ? 's' : '') + (d.unlocked.length ? ' · Novo: ' + d.unlocked.join(', ') : '')); });
    G.on('boss', (d) => { UI.banner('Um chefe despertou', G.MON[G.ZONE[d.z].boss].name, G.ZONE[d.z].name); });
    /* v27 (A2): o resultado da Maré não abre janela: vira uma linha na caixa de pendências (6G) e o aviso da simulação ganha o toque que a abre */
    G.on('mare', (d) => { if (d.on) UI.banner('Às armas!', 'Maré da Fenda', 'Invasores marcham sobre Aurora'); else UI.inboxAdd({ key: 'mare', ic: 'wave', title: d.win ? 'Aurora resistiu à Maré' : 'A Maré passou por Aurora', sub: 'Relatório · ' + d.a.killed + ' de ' + d.a.total + ' invasores abatidos', open: () => UI.mareModal(d) }); });
    G.on('rift', () => {});
    /* v27 (A2): o evento de cidade não abre janela: é uma decisão pendente no atalho do mapa (6G-ui-decisoes) */
    G.on('newday', (t) => { UI.toast('Dia ' + G.S.day + ' — ontem: +' + G.fmt(t._in) + ' / −' + G.fmt(t._out) + ' moedas', 'info', 'sun'); });
    G.on('camzone', (zi) => { const el = $('#zonechip'); const z = zi >= 0 && zi < G.ZONES.length ? G.ZONES[zi] : null; const name = z ? z.name + ' · Nv ' + G.zoneLvl(z, G.S.zones[z.id].tier) : zi === 7 ? 'Cratera da Fenda' : zi === 8 ? 'Aurora' : zi === 9 ? 'Mata dos Lenhadores' : ''; if (!name) { el.classList.remove('on'); return; } el.textContent = name; el.classList.add('on'); clearTimeout(zoneT); zoneT = setTimeout(() => el.classList.remove('on'), 2600); });
    for (const ev of ['bld', 'inv', 'heroes', 'daily', 'quest', 'bless', 'works', 'realm', 'rift', 'mare', 'ach', 'newday', 'promo', 'bosskill', 'boss', 'eventdone', 'hour', 'stable', 'decor', 'cos', 'diff', 'pets', 'inc']) G.on(ev, () => UI.sheetDirty(ev));
  };

  /* ---------- tela de título ---------- */
  UI.showTitle = () => {
    const t = $('#title'), has = G.M.hasSave();
    let sky = ''; const hs = [34, 52, 40, 70, 46, 96, 58, 44, 66, 38, 50, 30]; for (const h of hs) sky += '<i style="height:' + h + 'px"></i>';
    t.innerHTML = '<div class="stars"></div><div class="moon m1"></div><div class="moon m2"></div><div class="sky">' + sky + '</div><div class="hill"></div>' +
      '<div class="inner"><div class="eyebrow">Cidade Viva</div><h1>Aurora</h1><div class="sub">Crônicas da Fenda</div><p class="tag">Sob duas luas, um reino de caçadores espera por você.<br>Erga a cidade, forje lendas, enfrente a Fenda.</p>' +
      (has ? '<button class="btn pri" data-a="t-continue">Continuar jornada</button><button class="btn" data-a="t-new">Nova jornada</button>' : '<button class="btn pri" data-a="t-new">Iniciar jornada</button>') +
      '<button class="btn" data-a="t-import">Importar save</button><div class="ver">v' + G.VERSION + ' · Reino Sem Pausa · salva sozinho neste aparelho</div></div>';
    t.classList.add('on');
  };
  UI.ACT['t-continue'] = () => { G.emit('audio-unlock'); G.M.start(false); };
  UI.ACT['t-new'] = () => { G.emit('audio-unlock'); if (G.M.hasSave()) UI.confirm('Começar do zero?', 'A jornada salva neste aparelho será apagada. Não há como desfazer.', 'Apagar e começar', () => { G.M.wipe(); G.M.start(true); }); else G.M.start(true); };
  UI.ACT['t-import'] = () => UI.importModal();
})();

;
