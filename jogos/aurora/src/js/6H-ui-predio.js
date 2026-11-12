/* 6H-ui-predio: v27 (A4) — tocar num prédio do mapa abre um cartão inferior (o mapa segue visível e vivo por cima, sem pausa, toque fora fecha) com:
   nome, nível e a arte do prédio; o que ele faz; o que dá agora e o que dá no próximo nível (números de G.bldInfo, que usa as funções da própria
   simulação); quem está lá dentro agora (equipe e heróis, ao vivo); o botão Evoluir/Construir (mesmas regras e custos do painel Reino › Prédios, com
   o que falta quando não dá) e, para quem tem tela própria (Forja, Guilda, Mercado…), o botão Abrir. O painel Reino › Prédios continua existindo. */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const UI = G.UI, A = G.A, R = G.R, Wd = G.W, ic = UI.ic, esc = UI.esc, $ = UI.$, D = UI.dock;

  const css = document.createElement('style');
  css.textContent = [
    '.bk-h{display:flex;gap:10px;align-items:center;margin:0 34px 6px 0}',
    '.bk-h .th{flex:none;width:58px;height:58px;background-color:var(--inset);background-size:contain;border:var(--u) solid var(--line)}',
    '.bk-h .gr{flex:1;min-width:0}',
    '.bk-h h3{font-family:var(--fh);font-size:16px;color:var(--gold2);letter-spacing:.03em;line-height:1.15}',
    '.bk-h .lv{display:flex;align-items:center;gap:6px;margin-top:3px;font-size:15px;font-weight:800;color:var(--mut)}',
    '.bk-h .lv b{color:var(--gold2);font-size:15px}',
    '.bk-h .lv .pill{height:18px;font-size:8px;font-family:var(--fc)}',
    '.bk-d{font-size:15px;line-height:1.4;color:#cfd5e4;margin:0 0 8px}',
    '.bk-warn{font-size:15px;font-weight:800;color:#ffb3b3;background:rgba(238,100,100,.12);border:var(--u) solid rgba(238,100,100,.45);padding:6px 9px;margin-bottom:8px}',
    '.bk-t{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr) minmax(0,1.15fr);gap:2px 8px;align-items:baseline;margin:0 0 8px;font-size:15px}',
    '.bk-t .hd{font-family:var(--fh);font-size:8px;font-family:var(--fc);letter-spacing:.14em;text-transform:uppercase;color:var(--gold);padding-bottom:2px;border-bottom:var(--u) solid var(--line2)}',
    '.bk-t .hd.r{color:var(--good)}',
    '.bk-t .lb{color:var(--mut);font-weight:700;min-width:0}',
    '.bk-t .nw{font-weight:800;color:#fff;min-width:0}',
    '.bk-t .nx{font-weight:800;color:#b8f0c8;min-width:0}',
    '.bk-t .nx small{font-weight:800;color:var(--good);font-size:8px;font-family:var(--fc);margin-left:3px}',
    '.bk-t .nx.worse{color:#ffd9a0}.bk-t .nx.worse small{color:#ffb070}',
    '.bk-t .nx.eq{color:var(--mut)}.bk-t .nx.eq small{display:none}',
    '.bk-t .dash{color:var(--mut)}',
    '.bk-who{display:flex;flex-wrap:wrap;gap:5px;margin:0 0 8px;align-items:center}',
    '.bk-who .lbl{font-family:var(--fh);font-size:8px;font-family:var(--fc);letter-spacing:.14em;text-transform:uppercase;color:var(--gold);width:100%}',
    '.bk-who .bp{display:inline-flex;align-items:center;gap:5px;min-height:24px;padding:2px 8px;background:var(--fill2);font-size:15px;font-weight:800;max-width:100%;color:#e8ebf4}',
    '.bk-who .bp small{color:var(--mut);font-weight:700;font-size:8px;font-family:var(--fc)}',
    '.bk-who .bp.h{background:rgba(95,207,124,.14);border:var(--u) solid rgba(95,207,124,.4)}',
    '.bk-who .bp .i{color:var(--good)}',
    '.bk-who .none{font-size:15px;color:var(--mut)}',
    '.bk-up{border-top:var(--u) solid var(--line2);padding-top:8px}',
    '.bk-up .costs{margin-top:0;flex:1}',
    '.bk-up .row{align-items:center;gap:8px}',
    '.bk-miss{font-size:15px;font-weight:800;color:#ffb3b3;margin-top:5px}',
    '.bk-miss.ok{display:none}',
    '.bk-open{margin-top:6px;display:flex;gap:8px}.bk-open .btn{flex:1}',
    '.bk-sub{font-size:15px;color:var(--mut);font-weight:700;margin-top:4px}',
    '.bk-opens{font-size:15px;color:#b8f0c8;font-weight:700;margin:-2px 0 8px}',
  ].join('\n');
  document.head.appendChild(css);

  /* tela própria de cada prédio: [rótulo, painel, aba] */
  const OPEN = {
    cidadela: ['Reino', 'reino', 'geral'], guilda: ['Contratos', 'missoes', 'contratos'], hospedaria: ['Heróis', 'herois', 'lista'], taverna: ['Consumíveis', 'armazem', 'consumo'],
    enfermaria: ['Heróis', 'herois', 'lista'], ferraria: ['Forja', 'forja', 'forjar'], alquimista: ['Consumíveis', 'armazem', 'consumo'], mercado: ['Mercado', 'reino', 'mercado'],
    padaria: ['Consumíveis', 'armazem', 'consumo'], treino: ['Heróis', 'herois', 'lista'], santuario: ['Bênçãos', 'mais', 'bencaos'], torre: ['Reino', 'reino', 'geral'],
    fazenda: ['Materiais', 'armazem', 'materiais'], lenharia: ['Materiais', 'armazem', 'materiais'], pedreira: ['Materiais', 'armazem', 'materiais'], estabulo: ['Estábulo', 'reino', 'estabulo'],
  };
  const thumbs = {};
  const thumb = (id) => { const l = G.bLvl(id), k = id + '|' + (l <= 1 ? 1 : l < 3 ? 2 : l < 6 ? 3 : l < 10 ? 4 : 5); if (!thumbs[k]) thumbs[k] = A.building(id, Math.max(1, l), 0).cv.toDataURL(); return thumbs[k]; };

  /* custo com marcação ao vivo (vermelho quando falta) */
  const costHtml = (v, gold, cost) => {
    let h = '';
    if (gold) h += '<span ' + v.At('class', () => 'cost' + (G.S.gold < gold ? ' lack' : '')) + '>' + ic('coin') + G.fmt(gold) + '</span>';
    for (const k in cost || {}) h += '<span ' + v.At('class', () => 'cost' + ((G.S.res[k] || 0) < cost[k] ? ' lack' : '')) + '><i class="px ri-' + k + '"></i>' + G.fmt(cost[k]) + ' <span class="mut">' + esc(G.RES[k].name.split(' ')[0]) + '</span></span>';
    return '<div class="costs">' + h + '</div>';
  };
  /* o que falta, em palavras (vazio quando dá para fazer) */
  const missing = (id) => {
    const c = G.canUpgrade(id); if (c.ok) return '';
    if (!c.c) return c.why || 'Não é possível agora.';
    const S = G.S, a = [];
    if (S.gold < c.c.gold) a.push(G.fmt(c.c.gold - S.gold) + ' moedas');
    for (const k in c.c.cost) { const n = c.c.cost[k] - Math.floor(S.res[k] || 0); if (n > 0) a.push(G.fmt(n) + ' ' + G.RES[k].name); }
    return a.length ? 'Faltam: ' + a.join(' · ') : c.why || 'Não é possível agora.';
  };

  /* diferença entre o nível de agora e o próximo: verde quando melhora (a.low = "menor é melhor"), âmbar quando piora, apagado quando igual */
  const delta = (a, b) => {
    const dv = b.v - a.v; if (Math.abs(dv) < 0.05) return { t: b.t, cls: 'eq' };
    const u = a.u ? (a.u.length <= 6 ? a.u : a.u[0] === '%' ? '%' : '') : '';
    const s = a.fd ? a.fd(Math.round(dv)) : (dv > 0 ? '+' : '−') + a.f(Math.abs(dv)) + u;
    return { t: b.t, d: s, cls: (dv < 0) === !!a.low ? '' : 'worse' };
  };
  const factsHtml = (info) => {
    const nx = info.next, now = info.now;
    if (!now.length && !nx) return '';
    const hasNow = now.length > 0, src = hasNow ? now : nx;
    let h = '<div class="bk-t"><span class="hd">O que dá</span><span class="hd">' + (hasNow ? 'Agora' : '—') + '</span><span class="hd r">' + (nx ? (hasNow ? 'Nível ' + (info.lvl + 1) : 'Nível 1') : '—') + '</span>';
    src.forEach((f, i) => {
      const n = nx ? nx[i] : null;
      const a = hasNow ? f : null;
      h += '<span class="lb">' + esc(f.label) + '</span><span class="nw">' + (a ? esc(a.t) : '<span class="dash">—</span>') + '</span>';
      if (!nx) h += '<span class="nx eq">—</span>';
      else if (!a) h += '<span class="nx">' + esc(n.t) + '</span>';
      else { const d = delta(a, n); h += '<span class="nx ' + d.cls + '">' + esc(d.t) + (d.d ? '<small>' + esc(d.d) + '</small>' : '') + '</span>'; }
    });
    return h + '</div>';
  };
  const whoHtml = (id) => {
    const p = G.bldPresence(id);
    let h = '<div class="bk-who"><span class="lbl">Lá dentro agora</span>';
    for (const x of p.heroes) h += '<span class="bp h" data-a="hero:' + x.id + '">' + ic('sword') + esc(x.name) + ' <small>' + esc(x.st) + '</small></span>';
    for (const n of p.npcs) h += '<span class="bp">' + esc(n.name) + ' <small>' + esc(n.job + ' · ' + n.st) + '</small></span>';
    if (p.training) h += '<span class="bp">' + ic('target') + 'Treinando <small>' + p.training.n + ' de ' + p.training.of + ' vagas</small></span>';
    if (!p.heroes.length && !p.npcs.length && !p.training) h += '<span class="none">Ninguém trabalha aqui.</span>';
    return h + '</div>';
  };

  /* ---------- o cartão ---------- */
  let cur = '', sigStruct = '';
  const structSig = (i) => [i.id, i.lvl, i.dmg, i.avail, i.maxed, i.needRealm].join('|');
  const render = (id) => {
    const info = G.bldInfo(id), v = new UI.View($('#bcard'));
    const op = OPEN[id];
    let h = '<div class="bk">' +
      '<div class="bk-h"><i class="th px" style="background-image:url(' + thumb(id) + ')"></i><div class="gr"><h3>' + esc(info.name) + '</h3><div class="lv">' + (info.built ? '<b>Nível ' + info.lvl + '</b>' + (info.dmg ? '<span class="pill" style="color:#ff9a9a">fechada</span>' : '<span class="pill">aberta</span>') : '<span class="pill gold">ainda não construído</span>') + (info.disc ? '<span class="pill" style="color:var(--good)">−' + info.disc + '% em obras</span>' : '') + '</div></div></div>' +
      '<p class="bk-d">' + esc(info.desc) + '</p>';
    if (info.dmg) h += '<div class="bk-warn">Danificada na Maré: fechada até o conserto. Nada do que ela dá funciona agora.</div>';
    if (!info.avail) h += '<div class="bk-warn">Requer Cidadela nível ' + info.cid + '.</div>';
    h += '<div class="bk-facts" id="bk-facts">' + factsHtml(info) + '</div>';
    if (info.opens && info.opens.length) h += '<div class="bk-opens">Nível ' + (info.lvl + 1) + ' abre: ' + esc(info.opens.join(', ')) + '.</div>';
    h += '<div id="bk-who">' + whoHtml(id) + '</div>';
    h += '</div>';
    /* ação: fica fora da área rolável, sempre à vista */
    let f = '<div class="bk-up">';
    if (info.dmg) f += '<div class="row"><div class="gr">' + costHtml(v, info.repair) + '</div><button class="btn red" data-a="repair:' + id + '" ' + v.Dis(() => G.S.gold < G.repairCost(id)) + '>' + ic('hammer') + 'Consertar</button></div>';
    else if (!info.avail) f += '<div class="bk-sub">Melhore a Cidadela para liberar este terreno.</div>';
    else if (info.maxed) f += '<div class="bk-sub gold">No limite do nível ' + info.lvl + '. Melhore a Cidadela para o nível ' + (info.lvl - 1) + ' para continuar.</div>';
    else {
      f += '<div class="row"><div class="gr">' + costHtml(v, info.cost.gold, info.cost.cost) + '</div><button class="btn pri" id="bk-up" data-a="bupg:' + id + '" ' + v.Dis(() => !G.canUpgrade(id).ok) + '>' + ic(info.built ? 'up' : 'hammer') + (info.built ? 'Evoluir' : 'Construir') + '</button></div>';
      f += '<div ' + v.At('class', () => 'bk-miss' + (G.canUpgrade(id).ok ? ' ok' : '')) + '>' + v.T(() => missing(id)) + '</div>';
    }
    if (op && info.avail) f += '<div class="bk-open"><button class="btn sm" data-a="bopen:' + id + '">' + ic('grid') + 'Abrir ' + esc(op[0]) + '</button><button class="btn sm" data-a="bsee:' + id + '">' + ic('map') + 'Ver no mapa</button></div>';
    f += '</div>';
    const body = D.body(), keep = body && D.kind === 'predio' && D.key === id ? body.scrollTop : 0;
    D.open('predio', h, { key: id, v, foot: f });
    if (keep) { const b = D.body(); if (b) b.scrollTop = keep; }
    cur = id; sigStruct = structSig(info);
    let fSig = factsHtml(info), wSig = whoHtml(id);
    D.tick = () => {
      v.refresh();
      const i2 = G.bldInfo(id);
      if (structSig(i2) !== sigStruct) return render(id);                      // mudou de nível, foi danificado, abriu…: refaz o cartão
      const f2 = factsHtml(i2); if (f2 !== fSig) { fSig = f2; const el = $('#bk-facts'); if (el) el.innerHTML = f2; }
      const w2 = whoHtml(id); if (w2 !== wSig) { wSig = w2; const el = $('#bk-who'); if (el) el.innerHTML = w2; }
    };
  };
  /* posiciona a câmera para o prédio aparecer na faixa livre acima do cartão */
  const focusAbove = (id) => {
    const p = Wd.plots[id]; if (!p) return;
    const card = D.el(), hud = $('#hud'); if (!card || !hud) return;
    const top = hud.getBoundingClientRect().bottom, bot = card.getBoundingClientRect().top, mid = (top + bot) / 2, shift = innerHeight / 2 - mid;
    const a = R.screenToWorld(0, 0), b = R.screenToWorld(0, 100), tpp = (b[1] - a[1]) / 100;
    R.follow = 0; R.focus(p.cx, p.cy - 0.6 + shift * tpp);
  };
  UI.bldCard = (id) => {
    if (!G.BLD[id]) return;
    G.sfx('click');
    render(id); focusAbove(id);
  };
  UI.ACT.bupg = (a) => {
    const id = a[0], was = G.bLvl(id);
    if (!G.upgrade(id)) { UI.toast(missing(id) || 'Não é possível agora.', 'bad'); return; }
    UI.toast(G.BLD[id].short + (was ? ' chegou ao nível ' + G.bLvl(id) + '.' : ' foi erguida.'), 'good', 'hammer');
    if (D.kind === 'predio' && D.key === id) render(id);
  };
  UI.ACT.bopen = (a) => { const op = OPEN[a[0]]; D.close(); if (op) UI.open(op[1], op[2]); };
  UI.ACT.bsee = (a) => { const p = Wd.plots[a[0]]; if (p) focusAbove(a[0]); };
  /* ---------- as casas da vila (moradia): não são prédios de G.BLD, mas também respondem ao toque ---------- */
  const pk0 = R.pick;
  R.pick = (px, py) => {
    const r = pk0(px, py); if (r) return r;
    const [wx, wy] = R.screenToWorld(px, py);
    for (const h of Wd.houses) if (wx >= h.x - 0.4 && wx <= h.x + 4.4 && wy >= h.y - 2.4 && wy <= h.y + 3.6) return { type: 'house', i: h.i };
    return null;
  };
  const houseThumbs = {};
  UI.houseCard = (i) => {
    const hs = Wd.houses[i]; if (!hs) return;
    G.sfx('click');
    const sig = () => G.npcs.filter((n) => n.home === i).map((n) => n.name + n.act + n.state + n.inside).join('|') + G.S.pop + '|' + G.popCap();
    const body = () => {
      const res = G.npcs.filter((n) => n.home === i);
      let h = '<div class="bk-who"><span class="lbl">Moram aqui</span>';
      for (const n of res) h += '<span class="bp">' + esc(n.name) + ' <small>' + esc((n.job || 'Morador') + ' · ' + (n.inside && n.act === 'home' ? 'em casa' : n.act === 'work' ? 'no trabalho' : n.act === 'lunch' ? 'almoçando' : n.act === 'leisure' ? 'de folga' : n.act === 'hide' ? 'abrigado' : 'a caminho')) + '</small></span>';
      if (!res.length) h += '<span class="none">Casa vazia por enquanto.</span>';
      return h + '</div>';
    };
    const t = '<div class="bk"><div class="bk-h"><i class="th px" style="background-image:url(' + (houseThumbs[i] || (houseThumbs[i] = A.cottage(i).cv.toDataURL())) + ')"></i><div class="gr"><h3>Casa da vila nº ' + (i + 1) + '</h3><div class="lv"><span class="pill">moradia</span></div></div></div>' +
      '<p class="bk-d">Onde os moradores dormem e jantam. Mais construções e mais níveis da Cidadela atraem mais moradores; eles pagam o dízimo e fazem a cidade andar.</p>' +
      '<div class="bk-t"><span class="hd">O que dá</span><span class="hd">Agora</span><span class="hd"></span><span class="lb">Moradores na cidade</span><span class="nw" id="bk-pop">' + G.S.pop + ' de ' + G.popCap() + '</span><span class="nx eq">—</span><span class="lb">Dízimo por dia (toda a cidade)</span><span class="nw">' + G.fmt(G.taxEstimate()) + ' moedas</span><span class="nx eq">—</span></div><div id="bk-who">' + body() + '</div></div>';
    D.open('casa', t, { key: 'casa' + i });
    let last = sig(); D.tick = () => { const s = sig(); if (s !== last) { last = s; const el = $('#bk-who'); if (el) el.innerHTML = body(); const p = $('#bk-pop'); if (p) p.textContent = G.S.pop + ' de ' + G.popCap(); } };
    const card = D.el(), hud = $('#hud'); if (card && hud) { const top = hud.getBoundingClientRect().bottom, bot = card.getBoundingClientRect().top, shift = innerHeight / 2 - (top + bot) / 2; const a = R.screenToWorld(0, 0), b = R.screenToWorld(0, 100); R.follow = 0; R.focus(hs.x + 2, hs.y + 1 + shift * ((b[1] - a[1]) / 100)); }
  };
  /* o painel antigo (Reino › Prédios) ainda leva ao cartão pela miniatura do prédio */
  UI.ACT.see = (a) => { if (UI.sheet) UI.close(); UI.bldCard(a[0]); };
  G.on('bld', (id) => { if (D.kind === 'predio' && (id === D.key || id == null)) render(D.key); });
  void cur;
})();

;
