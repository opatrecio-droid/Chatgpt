/* Aurora 043 · avisos em uma faixa só.
   Substitui a fila de avisos, a manchete do centro da tela e a ficha de zona por um único diretor:
   uma mensagem visível por vez, com prioridade, logo abaixo dos retratos. O que não cabe vai para
   o registro (contador "+N"). Seguir herói, barra de chefe e Colosso viram linhas fixas da mesma faixa. */
(function () {
  'use strict';
  if (G.HEADLESS || !G.UI) return;
  const UI = G.UI, $ = (s) => document.querySelector(s), esc = UI.esc, ic = UI.ic;
  const PRI = { ambient: 0, info: 1, good: 2, gold: 2, epic: 3, bad: 3, boss: 4 };
  const QUEUE_MAX = 4, LOG_MAX = 40;
  const LOG = UI.logRec || (UI.logRec = []);
  const Q = [];
  let cur = null, curEl = null, timer = 0, dropped = 0, lane = null, slot = null, more = null, tray = null, trayT = 0;

  const kind = (k) => (PRI[k] != null ? k : 'info');
  const record = (m, k, icon) => {
    if (!m) return;
    LOG.push({ m, k: kind(k), icon, t: G.S ? G.S.t : 0, d: G.S ? G.S.day : 0 });
    while (LOG.length > LOG_MAX) LOG.shift();
  };

  /* A faixa mora dentro do HUD; as linhas fixas são levadas para dentro dela. */
  const ensure = () => {
    const hud = $('#hud'); if (!hud) return false;
    if (!lane || !lane.isConnected) {
      lane = document.createElement('div'); lane.id = 'av-lane';
      lane.innerHTML = '<div id="av-slot" role="status" aria-live="polite"></div><button id="av-more" data-a="avlog" hidden></button><div id="av-tray" hidden></div>';
      hud.appendChild(lane);
      slot = lane.querySelector('#av-slot'); more = lane.querySelector('#av-more'); tray = lane.querySelector('#av-tray');
      cur = null; curEl = null; clearTimeout(timer);
    }
    for (const id of ['hub-follow', 'bossbar', 'colbar']) {
      const el = document.getElementById(id);
      if (el && el.parentNode !== lane) lane.insertBefore(el, slot);
    }
    return true;
  };

  /* Segura a fila enquanto a tela está ocupada por algo maior. */
  const overlap = (a, b) => a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  const held = () => {
    if (!G.S || !G.M || !G.M.running) return true;
    if (UI.modalOpen || UI.sheet) return true;
    const tip = $('#guide.on .gd-tip');
    if (tip && lane) { const r = lane.getBoundingClientRect(); if (overlap(tip.getBoundingClientRect(), { left: r.left, right: r.right, top: r.top, bottom: r.top + 96 })) return true; }
    return false;
  };

  const paintMore = () => {
    if (!more) return;
    const show = !cur && dropped > 0 && tray.hidden;
    more.hidden = !show;
    if (show) more.innerHTML = ic('scroll') + '<span>+' + dropped + (dropped === 1 ? ' aviso' : ' avisos') + '</span>';
    if (curEl) { const n = curEl.querySelector('.av-n'); if (n) n.textContent = Q.length ? '+' + Q.length : ''; }
  };

  const finish = () => {
    clearTimeout(timer);
    const el = curEl; cur = null; curEl = null;
    if (el) { el.classList.add('out'); setTimeout(() => el.remove(), 230); }
    paintMore();
    setTimeout(pump, 240);
  };

  const pump = () => {
    if (cur || !Q.length || !ensure() || held()) { paintMore(); return; }
    /* avisos comuns que esperaram demais já perderam a hora: vão direto para o registro */
    const now = performance.now();
    for (let i = Q.length - 1; i >= 0; i--) if (PRI[Q[i].k] <= 2 && !Q[i].head && now - Q[i].at > 14000) { Q.splice(i, 1); dropped++; }
    if (!Q.length) { paintMore(); return; }
    Q.sort((a, b) => (b.head ? 9 : PRI[b.k]) - (a.head ? 9 : PRI[a.k]) || a.at - b.at);
    const q = Q.shift(), el = document.createElement(q.act ? 'button' : 'div');
    el.className = 'av-msg k-' + q.k + (q.head ? ' head' : '');
    if (q.act) el.setAttribute('data-a', q.act);
    const icon = q.icon || (q.k === 'bad' ? 'skull' : q.k === 'good' ? 'check' : q.k === 'boss' ? 'skull' : q.k === 'epic' ? 'crown' : 'info');
    const body = q.head
      ? '<small>' + esc(q.head[0]) + '</small><b>' + esc(q.head[1]) + '</b>' + (q.head[2] ? '<em>' + esc(q.head[2]) + '</em>' : '')
      : q.html || esc(q.n > 1 ? q.m + ' ×' + q.n : q.m);
    el.innerHTML = '<span class="av-ic">' + ic(icon) + '</span><span class="av-tx">' + body + '</span><span class="av-n"></span>';
    slot.textContent = ''; slot.appendChild(el);
    cur = q; curEl = el;
    const base = q.head ? 3400 : q.act ? 4600 : q.k === 'ambient' ? 2200 : Math.min(q.dur || 2800, 4200);
    const dur = Q.length ? Math.min(base, q.head ? 2800 : 2000) : base;
    timer = setTimeout(finish, dur);
    paintMore();
  };

  const enqueue = (q) => {
    q.k = kind(q.k); q.at = performance.now();
    /* a zona sob a câmera só aparece com a faixa livre e nunca espera */
    if (q.k === 'ambient') { if (cur || Q.length || held()) return; Q.push(q); return pump(); }
    /* uma manchete substitui o nome da zona na hora */
    if (cur && cur.k === 'ambient') finish();
    Q.push(q);
    while (Q.length > QUEUE_MAX) {
      let i = -1, low = 99;
      Q.forEach((x, j) => { const p = x.head ? 9 : PRI[x.k] + (x.act ? 0.5 : 0); if (p < low) { low = p; i = j; } });
      Q.splice(i, 1); dropped++;
    }
    pump();
  };

  /* ---------- API pública (mesmas assinaturas de antes) ---------- */
  UI.toast = (m, k, icon, dur, act) => {
    m = String(m == null ? '' : m); k = kind(k); if (!m) return;
    const same = Q.find((x) => !x.head && x.m === m && x.k === k);
    if (same) { same.n = (same.n || 1) + 1; return; }
    if (cur && !cur.head && cur.m === m && cur.k === k && curEl) {
      cur.n = (cur.n || 1) + 1; const tx = curEl.querySelector('.av-tx'); if (tx) tx.textContent = m + ' ×' + cur.n; return;
    }
    record(m, k, icon);
    enqueue({ m, k, icon, dur, act });
  };
  UI.toastHtml = (html, k, dur, m) => { record(m, k, 'star'); enqueue({ html, k, dur: dur || 4200, m: m || '' }); };
  UI.banner = (small, big, sub) => {
    const strip = (s) => String(s == null ? '' : s).replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
    const a = strip(small), b = strip(big), c = strip(sub);
    const boss = /chefe|maré|mare|colosso|armas|ameaça/i.test(a + ' ' + b);
    record(a + ': ' + b + (c ? ' · ' + c : ''), boss ? 'boss' : 'epic', boss ? 'skull' : 'crown');
    /* o aviso simples do mesmo fato (ex.: "X despertou!") fica redundante com a manchete */
    for (let i = Q.length - 1; i >= 0; i--) if (!Q[i].head && Q[i].m && b && Q[i].m.indexOf(b) === 0) Q.splice(i, 1);
    if (cur && !cur.head && cur.m && b && cur.m.indexOf(b) === 0) finish();
    enqueue({ head: [a, b, c], k: boss ? 'boss' : 'epic', icon: boss ? 'skull' : 'crown', m: b });
  };
  UI.ambient = (text) => enqueue({ m: String(text), k: 'ambient' });

  const closeTray = () => { if (tray) tray.hidden = true; clearTimeout(trayT); paintMore(); };
  UI.ACT.avlog = () => {
    if (!ensure()) return;
    if (!tray.hidden) return closeTray();
    dropped = 0;
    tray.innerHTML = LOG.length
      ? LOG.slice(-12).reverse().map((l) => '<div class="av-row k-' + kind(l.k) + '"><small>D' + l.d + '</small><span>' + esc(l.m) + '</span></div>').join('')
      : '<div class="av-empty">Nada por aqui ainda.</div>';
    tray.hidden = false; paintMore();
    clearTimeout(trayT); trayT = setTimeout(closeTray, 8000);
  };
  UI.ACT.logtray = UI.ACT.avlog;
  G.hook('mapTap', () => { if (tray && !tray.hidden) closeTray(); }, 5);

  /* ---------- ligações ---------- */
  G.on('start', () => {
    Q.length = 0; dropped = 0; LOG.length = 0; clearTimeout(timer);
    if (curEl) curEl.remove(); cur = null; curEl = null;
    ensure(); closeTray();
  });
  /* O nome da zona usava uma ficha própria no HUD; agora é a mensagem mais discreta da faixa. */
  G.on('camzone', (zi) => {
    if (!G.S) return;
    const z = zi >= 0 && zi < G.ZONES.length ? G.ZONES[zi] : null;
    const name = z ? z.name + ' · Nv ' + G.zoneLvl(z, G.S.zones[z.id].tier) : zi === 7 ? 'Cratera da Fenda' : zi === 8 ? 'Aurora' : zi === 9 ? 'Mata dos Lenhadores' : '';
    if (name) UI.ambient(name);
  });
  G.hook('uiBuild', ensure, 90000);
  G.hook('uiRefreshAfter', () => { ensure(); if (!cur && Q.length) pump(); else paintMore(); }, 90000);
  UI.avisos = { queue: Q, log: LOG, state: () => ({ showing: cur ? (cur.head ? cur.head[1] : cur.m) : null, waiting: Q.length, dropped }) };
  if ($('#hud')) ensure();
})();
