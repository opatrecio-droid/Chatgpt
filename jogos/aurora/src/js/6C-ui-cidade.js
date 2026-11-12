/* 6C-ui-cidade: v26 (lote 4-A) — telas e arte dos pedidos dos moradores (balão sobre o morador, cartão, entrega e agradecimento)
   e das cenas da cidade (fogueira, mesa da taverna, treino amistoso). A simulação mora em 3G-cidade.js. */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const UI = G.UI, A = G.A, R = G.R, Wd = G.W, ic = UI.ic, esc = UI.esc, $ = UI.$;

  /* ---------- estilo ---------- */
  const css = document.createElement('style');
  css.textContent = [
    '.pdc .pdh{display:flex;gap:11px;align-items:center;margin:6px 0 8px}',
    '.pdc .pdh .pt{width:56px;height:56px;background-color:var(--inset);background-size:56px 56px;border:var(--u) solid var(--gold);box-shadow:none;flex:none}',
    '.pdc .pdh .gr{flex:1;min-width:0}',
    '.pdc .pdh b{display:block;font-size:16px;font-weight:800}',
    '.pdc .pdh small{display:block;font-size:15px;color:var(--mut);font-weight:700;margin-top:1px}',
    '.pdc .pdst{flex:none;height:22px;line-height:22px;padding:0 9px;font-size:8px;font-family:var(--fc);font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#1a1408;background:linear-gradient(#f7dc92 0 28%,#d8a544 28% 100%)}',
    '.pdc .pdst.ok{background:linear-gradient(#9af0b0 0 28%,#46b868 28% 100%)}',
    '.pdc q{display:block;quotes:none;font-style:italic;font-size:15px;line-height:1.45;color:#e6e0cc;padding:8px 11px;background:var(--inset);border-left:calc(var(--u)*2) solid var(--gold);margin:2px 0 8px}',
    '.pdc h2{margin:2px 0 8px}',
    '.pdc .pdp{display:flex;align-items:center;gap:10px;padding:9px 11px;background:var(--inset);border:var(--u) solid var(--line2)}',
    '.pdc .pdp .px{width:28px;height:28px;flex:none}',
    '.pdc .pdp .i{color:var(--gold2)}',
    '.pdc .pdp .gr{flex:1;min-width:0}',
    '.pdc .pdp .pdn{font-size:15px;color:var(--mut);font-weight:700;margin-bottom:5px}',
    '.pdc .pdp .pdn b{color:#fff;font-size:15px}',
    '.pdc .pdp.ok .pdn b{color:#9af0b0}',
    '.pdc .pdr{margin-top:10px}',
    '.pdc .pdr small,.pdc .pdt small{display:block;font-size:8px;font-family:var(--fc);color:var(--mut);font-weight:800;text-transform:uppercase;letter-spacing:.08em}',
    '.pdc .pdr .costs{margin-top:5px}',
    '.pdc .pdt{margin-top:10px}',
    '.pdc .pdt .bar{margin-top:5px;height:4px}',
    '.pdc .pdt .bar i{background:linear-gradient(#f0b050 0 28%,#c8863a 28% 100%)}',
    '.pdc .nt2{margin-top:8px;font-size:15px;color:var(--mut);line-height:1.4;text-align:center}',
    '.pdl{margin:0 0 10px}',
    '.pdl .pd1{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:8px 10px;background:var(--fill2);border:var(--u) solid var(--line2);margin-bottom:6px;color:inherit;font:inherit}',
    '.pdl .pd1.ok{border-color:#58c070;box-shadow:none}',
    '.pdl .pd1 .pt{width:38px;height:38px;background-color:var(--inset);background-size:38px 38px;border:var(--u) solid #4a557a;flex:none}',
    '.pdl .pd1 .gr{flex:1;min-width:0}',
    '.pdl .pd1 b{display:block;font-size:15px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.pdl .pd1 small{display:block;font-size:15px;color:var(--mut);font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.pdl .pd1 .bar{margin-top:4px;height:4px}',
    '.pdl .pd1 .tg{flex:none;font-size:8px;font-family:var(--fc);font-weight:900;padding:3px 8px;color:#1a1408;background:linear-gradient(#f7dc92 0 28%,#d8a544 28% 100%)}',
    '.pdl .pd1.ok .tg{background:linear-gradient(#9af0b0 0 28%,#46b868 28% 100%)}',
    '.pdl .hd{display:flex;align-items:center;gap:6px;font-family:var(--fh);font-size:15px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold2);margin:2px 2px 7px}',
    '.pdl .hd small{margin-left:auto;font-family:inherit;letter-spacing:.04em;text-transform:none;color:var(--mut);font-weight:700;font-size:15px}',
  ].join('\n');
  document.head.appendChild(css);

  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };
  const npcOf = (who) => G.npcs.find((n) => n.name === who) || null;
  const npcPortrait = (n, who) => (n ? A.portrait(A.npcLook(n)) : A.portrait(A.npcLook({ name: who, look: 30, job: 'Morador' })));

  /* ================= 4A.1 balão sobre o morador ================= */
  /* posição do balão no mundo: sobre a cabeça do morador; se ele está dentro do prédio, sobre o letreiro do prédio dele */
  const S0 = () => G.S;
  const balloonAt = (r, i) => {
    const n = npcOf(r.who);
    if (n && !n.inside) return { x: n.x, y: n.y - 2.75, n, out: 1 };
    const c = G.CAST.find((x) => x.name === r.who), p = c && c.at ? Wd.plots[c.at] : null;
    if (p) { const b = S0().b[c.at], sp = A.building(c.at, b ? b.lvl : 1, b && b.dmg); return { x: p.x + 3 + (i ? 1.3 : 0), y: p.y + 4 - (sp.h - 1) / 16 - 1.1, n, out: 0 }; }
    return n ? { x: n.x, y: n.y - 2.75, n, out: 1 } : null;
  };
  const drawBalloon = (d, X, Y, z, over) => {
    const ctx = R.ctx, dpr = Math.min(3, window.devicePixelRatio || 1), S = G.S;
    over.push(() => {
      const r = d.r, ready = G.pedidoReady(r), age = S.t - r.t0, px = Math.round(X(d.x)), bob = Math.sin(R.t * 3.1 + r.id) * 1.7 * z, rad = Math.round(G.clamp(z * 6.2, 11.5 * dpr, 18 * dpr));
      const pop = 1 + 0.4 * Math.max(0, 1 - age / 1.2);
      const py = Math.round(Y(d.y) + bob), rr = rad * pop;
      ctx.save();
      if (ready) { const k = (R.t * 1.4) % 1; ctx.globalAlpha = (1 - k) * 0.65; ctx.strokeStyle = '#9af0b0'; ctx.lineWidth = Math.max(2, z * 0.8); ctx.beginPath(); ctx.arc(px, py, rr * (1.1 + 0.9 * k), 0, 6.283); ctx.stroke(); ctx.globalAlpha = 1; }
      ctx.fillStyle = 'rgba(14,10,22,.55)'; ctx.beginPath(); ctx.ellipse(px, py + rr * 1.28, rr * 0.55, rr * 0.2, 0, 0, 6.283); ctx.fill();
      ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2, z * 0.9); ctx.strokeStyle = '#3a2410';
      ctx.fillStyle = ready ? '#7be59a' : '#ffd86a';
      ctx.beginPath(); ctx.arc(px, py, rr, 0, 6.283); ctx.moveTo(px - rr * 0.45, py + rr * 0.78); ctx.lineTo(px, py + rr * 1.42); ctx.lineTo(px + rr * 0.45, py + rr * 0.78); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = ready ? '#fff' : '#fff6cc'; ctx.beginPath(); ctx.arc(px - rr * 0.3, py - rr * 0.32, rr * 0.32, 0, 6.283); ctx.globalAlpha = 0.35; ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = '#3a2410'; ctx.font = Math.round(15 * (window.devicePixelRatio || 1)) + 'px "Aurora Pixel",monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(ready ? '✓' : '!', px, py + rr * 0.06); ctx.textBaseline = 'alphabetic';
      ctx.restore();
    });
  };
  /* agradecimento de quem está dentro do prédio: o balão de fala aparece sobre o prédio */
  const thanks = [];
  const rrect = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath(); };
  const drawThanks = (d, X, Y, z, over) => {
    const ctx = R.ctx, dpr = Math.min(3, window.devicePixelRatio || 1);
    over.push(() => {
      const fs = Math.round(G.clamp(z * 2.6, 10.5 * dpr, 13 * dpr)), px = Math.round(X(d.x)), py = Math.round(Y(d.y));
      const life = d.life - (performance.now() - d.t0) / 1000; if (life <= 0) return; ctx.save(); ctx.globalAlpha = Math.min(1, life / 0.5);
      ctx.font = Math.round(15 * (window.devicePixelRatio || 1)) + 'px "Aurora Pixel",monospace'; ctx.textAlign = 'center';
      const nm = d.who + ': ' + d.text, tw = ctx.measureText(nm).width, w = tw + fs * 1.2, h = fs * 1.8, x = Math.round(G.clamp(px - w / 2, 4, ctx.canvas.width - w - 4)), y = py - h;
      ctx.fillStyle = 'rgba(255,252,240,.97)'; rrect(ctx, x, y, w, h, fs * 0.6); ctx.fill();
      ctx.beginPath(); ctx.moveTo(px - fs * 0.4, y + h - 1); ctx.lineTo(px, y + h + fs * 0.45); ctx.lineTo(px + fs * 0.4, y + h - 1); ctx.fill();
      ctx.fillStyle = '#2a2030'; ctx.textBaseline = 'middle'; ctx.fillText(nm, x + w / 2, y + h / 2 + 1);
      ctx.restore();
    });
  };
  const dm1 = R.dynMore;
  R.dynMore = (dyn, vx0, vx1, vy0, vy1) => {
    if (dm1) dm1(dyn, vx0, vx1, vy0, vy1);
    const S = G.S, P = S.pedidos;
    if (P && P.list.length) P.list.forEach((r, i) => {
      const n = npcOf(r.who); if (n && n.sayT > 0 && n.say && !n.inside) return;      // falando: o balão de fala toma o lugar
      const b = balloonAt(r, i); if (!b || b.x < vx0 - 2 || b.x > vx1 + 2 || b.y < vy0 - 3 || b.y > vy1 + 3) return;
      dyn.push({ y: b.y + 20, k: 'x', e: { x: b.x, y: b.y, r }, f: drawBalloon });
    });
    const now = performance.now();
    for (let i = thanks.length - 1; i >= 0; i--) { const t = thanks[i]; if (now - t.t0 > t.life * 1000) { thanks.splice(i, 1); continue; } dyn.push({ y: t.y + 20, k: 'x', e: t, f: drawThanks }); }
  };
  /* luz no balão à noite e toque: o balão aceita um toque generoso (e o morador também) */
  const nm1 = R.nightMore;
  R.nightMore = (hole) => {
    if (nm1) nm1(hole);
    const P = G.S.pedidos; if (P && P.list.length) P.list.forEach((r, i) => { const b = balloonAt(r, i); if (b) hole(b.x, b.y + 0.4, 1.9, 0.85); });
  };
  const pk1 = R.pick;
  R.pick = (px, py) => {
    const P = G.S && G.S.pedidos;
    if (P && P.list.length) {
      const w = R.screenToWorld(px, py);
      for (let i = 0; i < P.list.length; i++) { const r = P.list[i], b = balloonAt(r, i); if (b && b.n && Math.hypot(b.x - w[0], b.y + 0.2 - w[1]) < 1.15) return { type: 'npc', ref: b.n }; }
    }
    return pk1(px, py);
  };
  const in1 = UI.inspect;
  UI.inspect = (sel) => {
    if (sel && sel.type === 'npc' && sel.ref && !sel.ref.vis && !sel.ref.guard) { const r = G.pedidoOf(sel.ref.name); if (r) { R.sel = null; R.follow = 0; return pedidoCard(r.id); } }
    return in1(sel);
  };

  /* ================= 4A.1 o cartão do pedido ================= */
  const rewardChips = (rw) => '<div class="costs">' + G.pedidoRewardParts(rw).map((p) => '<span class="cost">' + (p.id ? '<i class="px ri-' + p.id + '"></i>' : ic(p.ic)) + esc(p.t) + '</span>').join('') + '</div>';
  const fmtLeft = (s) => { s = Math.max(0, Math.round(s)); const m = Math.floor(s / 60); return m + ' min ' + (s % 60 < 10 ? '0' : '') + (s % 60) + ' s'; };
  const pedidoCard = (id) => {
    const r = G.pedidoGet(id); if (!r) return;
    const i = G.pedidoInfo(r), n = npcOf(r.who), bl = i.at && G.BLD[i.at] ? G.BLD[i.at].name : 'Aurora';
    let prog;
    if (i.kind === 'res') prog = '<div class="pdp' + (i.ready ? ' ok' : '') + '"><i class="px ri-' + r.a.res + '"></i><div class="gr"><div class="pdn"><b>' + G.fmt(G.S.res[r.a.res] || 0) + '</b> / ' + G.fmt(r.n) + ' ' + esc(G.RES[r.a.res].name) + ' no Armazém</div><div class="bar"><i style="width:' + Math.round(i.pct * 100) + '%"></i></div></div></div>';
    else if (i.kind === 'time') prog = '<div class="pdp' + (i.ready ? ' ok' : '') + '">' + ic(i.ready ? 'check' : 'heart') + '<div class="gr"><div class="pdn">' + (i.ready ? '<b>Promessa cumprida</b>' : 'Ninguém caiu até agora: <b>' + i.cur + '%</b> do caminho') + '</div><div class="bar"><i style="width:' + Math.round(i.pct * 100) + '%"></i></div></div></div>';
    else prog = '<div class="pdp' + (i.ready ? ' ok' : '') + '">' + ic(i.ready ? 'check' : 'target') + '<div class="gr"><div class="pdn"><b>' + G.fmt(i.cur) + '</b> / ' + G.fmt(i.n) + (i.ready ? ' · cumprido' : ' · os heróis cuidam disso sozinhos') + '</div><div class="bar"><i style="width:' + Math.round(i.pct * 100) + '%"></i></div></div></div>';
    const btn = i.ready ? '<button class="btn pri" data-a="pedidoent:' + r.id + '">' + ic('gift') + (i.kind === 'res' ? 'Entregar' : 'Receber') + '</button>' : '<button class="btn" disabled>' + ic('lock') + (i.kind === 'res' ? 'Faltam ' + G.fmt(i.n - Math.min(i.n, G.S.res[r.a.res] || 0)) : 'Em andamento') + '</button>';
    UI.modal('<div class="pdc"><div class="eyebrow">Pedido de morador</div>' +
      '<div class="pdh"><i class="pt px" style="background-image:url(' + npcPortrait(n, r.who) + ')"></i><div class="gr"><b>' + esc(r.who) + '</b><small>' + esc(i.job) + ' · ' + esc(bl) + '</small></div><span class="pdst' + (i.ready ? ' ok' : '') + '">' + (i.ready ? 'Pronto' : 'Pedido') + '</span></div>' +
      '<q>“' + esc(i.quote) + '”</q><h2>' + esc(i.title) + '</h2>' + prog +
      '<div class="pdr"><small>Prêmio</small>' + rewardChips(r.rw) + '</div>' +
      '<div class="pdt"><small>Prazo: até ' + esc(i.dln) + ' · restam ' + fmtLeft(i.left) + '</small><div class="bar"><i style="width:' + Math.round(i.pctLeft * 100) + '%"></i></div></div>' +
      '<p class="nt2">Pedido que vence some sem castigo. Cada morador tem a sua maneira de agradecer.</p>' +
      '<div class="acts"><button class="btn" data-a="mclose">Fechar</button>' + btn + '</div></div>');
    G.sfx('click');
  };
  UI.pedidoCard = pedidoCard;
  UI.ACT.pedido = (a) => { if (UI.modalOpen) UI.closeModal(); pedidoCard(+a[0]); };
  UI.ACT.pedidoent = (a) => {
    const res = G.pedidoDeliver(+a[0]);
    if (res.err) { UI.toast(res.err, 'bad', 'scroll'); return; }
    if (UI.modalOpen) UI.closeModal();
  };

  /* ================= 4A.1 avisos, entrega e agradecimento ================= */
  const burst = (x, y) => { try { R.burst(x, y, 16, ['#ffd86a', '#ffffff', '#9af0b0'], 2.4, 0.8, 0); } catch (e) { /* ok */ } };
  G.on('pedido', (d) => {
    const S = G.S; if (!S) return;
    if (d.t === 'novo') {
      const r = d.r, n = npcOf(r.who);
      G.sfx('pick'); UI.toast(r.who + ' pede ajuda: ' + G.PEDIDO_MODELS[r.m].title(r), 'info', 'scroll');
      if (n && !n.inside && !(n.sayT > 0)) { n.say = r.q.length > 46 ? r.q.slice(0, r.q.lastIndexOf(' ', 44)) + '…' : r.q; n.sayT = 4; }
    } else if (d.t === 'entregue') {
      const n = npcOf(d.who), gold = d.rw.gold || 0;
      G.sfx('quest'); G.sfx('coin');
      if (n && !n.inside) { n.say = d.thanks; n.sayT = 5.2; n.dir = n.dir || 1; G.addFx({ t: 'text', x: n.x, y: n.y - 2.1, s: '+' + G.fmt(gold), c: '#ffd35a' }); burst(n.x, n.y - 1); }
      else {
        const c = G.CAST.find((x) => x.name === d.who), p = c && c.at ? Wd.plots[c.at] : null;
        if (p) { const b = balloonAt(d.r, 0); thanks.push({ x: b ? b.x : p.x + 3, y: b ? b.y : p.y - 2, who: d.who, text: d.thanks, life: 5.2, t0: performance.now() }); G.addFx({ t: 'text', x: p.x + 3, y: p.y + 1, s: '+' + G.fmt(gold), c: '#ffd35a' }); burst(p.x + 3, p.y + 2.4); }
      }
      if (!n || n.inside) UI.toast(d.who + ': “' + d.thanks + '”', 'good', 'smile');
      UI.toast('Recebido: ' + d.parts.map((x) => x.t).join(' · '), 'good', 'gift');
    }
    if (UI.sheet) UI.sheetDirty();
  });

  /* ================= 4A.1 lista na aba Missões › Contratos ================= */
  const sh0 = UI.SHEETS.missoes.render;
  UI.SHEETS.missoes.render = function (tab) {
    const out = sh0.apply(this, arguments);
    if (tab !== 'contratos') return out;
    const P = G.S.pedidos; if (!P || (!P.list.length && !P.n)) return out;
    let h = '<div class="pdl"><div class="hd">' + ic('scroll') + 'Pedidos da cidade<small>' + (P.n || 0) + ' atendidos</small></div>';
    if (!P.list.length) h += '<p class="mut" style="margin:0 0 6px;font-size:15px">Nenhum pedido agora. Os moradores logo pedem de novo.</p>';
    for (const r of P.list) {
      const i = G.pedidoInfo(r), n = npcOf(r.who);
      h += '<button class="pd1' + (i.ready ? ' ok' : '') + '" data-a="pedido:' + r.id + '"><i class="pt px" style="background-image:url(' + npcPortrait(n, r.who) + ')"></i><div class="gr"><b>' + esc(r.who) + ': ' + esc(i.title) + '</b><small>até ' + esc(i.dln) + '</small><div class="bar"><i style="width:' + Math.round(i.pct * 100) + '%"></i></div></div><span class="tg">' + (i.ready ? 'Pronto' : G.fmt(i.cur) + '/' + G.fmt(i.n)) + '</span></button>';
    }
    return h + '</div>' + out;
  };
  UI.SHEETS.missoes.badge.contratos = ((b0) => () => b0() + (G.S.pedidos ? G.S.pedidos.list.filter((r) => G.pedidoReady(r)).length : 0))(UI.SHEETS.missoes.badge.contratos);

  /* @@fim6C-pedidos */
})();

(function () {
  /* ================= 4A.2 arte das cenas da cidade: fogueira, mesa da Taverna, pátio de treino ================= */
  if (G.HEADLESS) return;
  const R = G.R;
  const rect = (ctx, x, y, w, h) => ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  const ell = (ctx, x, y, rx, ry) => { ctx.beginPath(); ctx.ellipse(Math.round(x), Math.round(y), rx, ry, 0, 0, 6.283); ctx.fill(); };

  /* fogueira: pedras, toras cruzadas, chamas em pilhas de pixels, brasas que sobem; sem a cena, só a cova apagada */
  const drawFire = (sc, X, Y, z0, over, lit) => {
    const ctx = R.ctx, px = X(sc.x), py = Y(sc.y), t = R.t, S = G.S, dark = G.darkness(S.clock), z = z0 * 1.3;
    ctx.fillStyle = 'rgba(24,18,16,.5)'; ell(ctx, px, py + z, 9 * z, 3.8 * z);
    for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.283 + 0.3, sx = px + Math.cos(a) * 7.6 * z - 1.8 * z, sy = py + z + Math.sin(a) * 3.2 * z - 1.6 * z; ctx.fillStyle = i % 2 ? '#7d838c' : '#9aa0a8'; rect(ctx, sx, sy, 3.6 * z, 3.2 * z); ctx.fillStyle = '#c9ced4'; rect(ctx, sx, sy, 3.6 * z, z); }
    ctx.fillStyle = lit ? '#1a1210' : '#2a2220'; ell(ctx, px, py + 0.4 * z, 5.6 * z, 2.3 * z);
    ctx.save(); ctx.translate(px, py);
    for (const a of [0.5, -0.5, 0]) { ctx.save(); ctx.rotate(a); ctx.fillStyle = '#6b4424'; rect(ctx, -7 * z, -1.2 * z, 14 * z, 2.6 * z); ctx.fillStyle = '#9a6a3c'; rect(ctx, -7 * z, -1.2 * z, 14 * z, 0.9 * z); ctx.restore(); }
    ctx.restore();
    if (!lit) return;
    const k = Math.max(0.4, Math.min(1, (dark - 0.22) / 0.35)), amp = (0.9 + 0.04 * sc.seats.filter((s) => s.e).length) * k;
    if (dark > 0.15) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const r = 32 * z * amp, g = ctx.createRadialGradient(px, py - 5 * z, 0, px, py - 5 * z, r); g.addColorStop(0, 'rgba(255,170,70,' + (0.42 * Math.min(1, dark * 1.3)) + ')'); g.addColorStop(1, 'rgba(255,170,70,0)'); ctx.fillStyle = g; ctx.fillRect(px - r, py - 5 * z - r, r * 2, r * 2); ctx.restore(); }
    for (let i = -3; i <= 3; i++) {
      const hh = (9.5 - Math.abs(i) * 2.1 + 2.4 * Math.sin(t * 10 + i * 1.7) + 1.3 * Math.sin(t * 17 + i)) * z * amp, x = px + i * 1.9 * z - 1 * z, w = 2.1 * z;
      ctx.fillStyle = '#d9371a'; rect(ctx, x, py - hh, w, hh);
      ctx.fillStyle = '#ff8a1e'; rect(ctx, x + 0.2 * z, py - hh * 0.8, w - 0.4 * z, hh * 0.8);
      ctx.fillStyle = '#ffd24a'; rect(ctx, x + 0.4 * z, py - hh * 0.55, w - 0.8 * z, hh * 0.55);
      if (Math.abs(i) < 2) { ctx.fillStyle = '#fff6c8'; rect(ctx, x + 0.6 * z, py - hh * 0.3, w - 1.2 * z, hh * 0.3); }
    }
    for (let i = 0; i < 7; i++) { const ph = (t * 0.9 + i * 0.37) % 1, sx = px + Math.sin(i * 2.3 + t * 2) * 5 * z * (0.4 + ph), sy = py - (7 + ph * 24) * z; ctx.globalAlpha = (1 - ph) * 0.9; ctx.fillStyle = i % 2 ? '#ffd070' : '#ff8a3a'; rect(ctx, sx, sy, Math.max(1, z * 0.8), Math.max(1, z * 0.8)); }
    ctx.globalAlpha = 1;
  };
  /* tora para sentar (fogueira) ou banco (taverna): desenhada à frente de quem senta, cobrindo as pernas */
  const drawSeatLog = (d, X, Y, z) => {
    const ctx = R.ctx, s = d.s, px = X(s.x), py = Y(s.y);
    if (d.k === 'tav') { ctx.fillStyle = 'rgba(10,16,30,.25)'; ell(ctx, px, py + 2.6 * z, 6 * z, 2 * z); ctx.fillStyle = '#5a3a20'; rect(ctx, px - 4.6 * z, py + 0.6 * z, 9.2 * z, 3 * z); ctx.fillStyle = '#9a6a3c'; rect(ctx, px - 4.6 * z, py + 0.2 * z, 9.2 * z, 1.4 * z); return; }
    ctx.fillStyle = 'rgba(10,16,30,.25)'; ell(ctx, px, py + 3 * z, 7.5 * z, 2.2 * z);
    ctx.fillStyle = '#5b3a20'; rect(ctx, px - 6.2 * z, py - 0.6 * z, 12.4 * z, 4 * z); ctx.fillStyle = '#8a5a30'; rect(ctx, px - 6.2 * z, py - 1.2 * z, 12.4 * z, 1.8 * z); ctx.fillStyle = '#c8975c'; rect(ctx, px - 6.2 * z, py - 1.2 * z, 12.4 * z, 0.7 * z);
    ctx.fillStyle = '#3c2614'; rect(ctx, px - 6.2 * z, py + 2.2 * z, 1.4 * z, 1.2 * z); rect(ctx, px + 4.8 * z, py + 2.2 * z, 1.4 * z, 1.2 * z);
  };
  /* mesa redonda com canecas e uma lamparina */
  const drawTable = (sc, X, Y, z0) => {
    const z = z0 * 1.3, ctx = R.ctx, px = X(sc.x), py = Y(sc.y), dark = G.darkness(G.S.clock), t = R.t;
    ctx.fillStyle = 'rgba(10,16,30,.28)'; ell(ctx, px, py + 3 * z, 11 * z, 3.4 * z);
    ctx.fillStyle = '#4a2f1a'; rect(ctx, px - 1.4 * z, py - 1 * z, 2.8 * z, 5 * z); rect(ctx, px - 4.4 * z, py + 3.2 * z, 8.8 * z, 1.2 * z);
    ctx.fillStyle = '#5e3a1e'; ell(ctx, px, py - 2.2 * z, 11.4 * z, 5 * z);
    ctx.fillStyle = '#9a6a3c'; ell(ctx, px, py - 3 * z, 11 * z, 4.6 * z);
    ctx.fillStyle = '#b98550'; ell(ctx, px - 1.5 * z, py - 3.4 * z, 8 * z, 3 * z);
    for (const [dx, dy, c] of [[-5.2, -3.4, '#e8d8a0'], [4.6, -3.0, '#d8c488'], [-0.8, -1.6, '#e8d8a0'], [2.4, -4.4, '#d8c488']]) { ctx.fillStyle = c; rect(ctx, px + dx * z, py + (dy - 2.4) * z, 2.6 * z, 2.8 * z); ctx.fillStyle = '#c89a40'; rect(ctx, px + dx * z + 0.3 * z, py + (dy - 2.4) * z + 0.2 * z, 2 * z, 0.9 * z); }
    ctx.fillStyle = '#3a2a1c'; rect(ctx, px - 0.9 * z, py - 8 * z, 1.8 * z, 4 * z); ctx.fillStyle = dark > 0.2 ? '#ffd070' : '#d8b860'; rect(ctx, px - 1.3 * z, py - 9.6 * z, 2.6 * z, 2.2 * z);
    if (dark > 0.2) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const r = 18 * z * (0.9 + 0.1 * Math.sin(t * 7)), g = ctx.createRadialGradient(px, py - 9 * z, 0, px, py - 9 * z, r); g.addColorStop(0, 'rgba(255,200,100,' + (0.35 * dark) + ')'); g.addColorStop(1, 'rgba(255,200,100,0)'); ctx.fillStyle = g; ctx.fillRect(px - r, py - 9 * z - r, r * 2, r * 2); ctx.restore(); }
  };
  const dm2 = R.dynMore;
  R.dynMore = (dyn, vx0, vx1, vy0, vy1) => {
    if (dm2) dm2(dyn, vx0, vx1, vy0, vy1);
    const S = G.S, sc = G.scenes, fc = G.SCENE.fire;
    if (sc.train) for (const d of dyn) if ((d.k === 'h' || d.k === 'n') && d.e && d.e._sc === 'train') d.y += 2.2;   // dentro do pátio: desenha à frente da cerca do prédio
    /* a cova da fogueira existe sempre (apagada de dia); a cena acende as chamas */
    if (fc.x > vx0 - 3 && fc.x < vx1 + 3 && fc.y > vy0 - 3 && fc.y < vy1 + 3) dyn.push({ y: fc.y, k: 'x', e: sc.fire || { x: fc.x, y: fc.y, seats: [] }, f: (e, X, Y, z, over) => drawFire(e, X, Y, z, over, !!sc.fire) });
    for (const k in sc) {
      const c = sc[k]; if (c.x < vx0 - 4 || c.x > vx1 + 4 || c.y < vy0 - 4 || c.y > vy1 + 4) continue;
      if (k === 'tav') dyn.push({ y: c.y, k: 'x', e: c, f: (e, X, Y, z) => drawTable(e, X, Y, z) });
      if (k === 'fire' || k === 'tav') for (const s of c.seats) dyn.push({ y: s.y + 0.18, k: 'x', e: { s, k }, f: (e, X, Y, z) => drawSeatLog(e, X, Y, z) });
    }
    void S;
  };
  const nm2 = R.nightMore;
  R.nightMore = (hole) => {
    if (nm2) nm2(hole);
    const sc = G.scenes; if (!sc) return;
    if (sc.fire) hole(sc.fire.x, sc.fire.y - 0.9, 5.6, 0.95);
    if (sc.tav) hole(sc.tav.x, sc.tav.y - 0.8, 3.2, 0.8);
  };
  /* @@fim6C-cenas */
})();
;
