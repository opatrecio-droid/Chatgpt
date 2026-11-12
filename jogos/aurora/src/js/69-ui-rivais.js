/* 69-ui-rivais: v25 (lote 3-B) — telas e arte do Nêmesis e da revanche na Arena, do visitante rival que passeia por Aurora (arte no mapa,
   cartão e duelo amistoso), das notícias dos rivais no retorno e dos laços na ficha do herói. A simulação mora em 3D-rivais.js. */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const UI = G.UI, A = G.A, R = G.R, ic = UI.ic, esc = UI.esc, $ = UI.$;
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };
  const emblem = UI.arenaEmblem || ((e, px) => '<svg class="emb" viewBox="0 0 32 38" width="' + px + '" height="' + Math.round(px * 38 / 32) + '"><path d="M16 1.5L29.5 5.5V18C29.5 27 23.5 33.5 16 36.5C8.5 33.5 2.5 27 2.5 18V5.5Z" fill="' + e.c1 + '" stroke="#f0d27a" stroke-width="1.7"/></svg>');
  const insIc = (px) => '<svg class="i ins-ic" viewBox="0 0 24 24" style="color:#9ad0ff;width:' + (px || 14) + 'px;height:' + (px || 14) + 'px"><circle cx="12" cy="12" r="10"/><path d="M14.6 6.4a6.2 6.2 0 100 11.2 5 5 0 010-11.2z" fill="#0a1230" opacity=".7"/><circle cx="12" cy="12" r="10" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1"/></svg>';
  const cap1 = (s) => s.replace(/^./, (c) => c.toUpperCase());

  /* ---------- estilo ---------- */
  const css = document.createElement('style');
  css.textContent = [
    /* Nêmesis: cartão, oferta destacada, faixa no ranking */
    '.nemc{position:relative;border-radius:16px;padding:12px;margin-bottom:10px;border:1px solid rgba(238,100,100,.55);background:linear-gradient(135deg,rgba(130,28,42,.55),rgba(26,22,50,.9));box-shadow:0 0 18px rgba(238,80,80,.2)}',
    '.nemc .hd{display:flex;gap:10px;align-items:center}',
    '.nemc .emb{flex:none;filter:drop-shadow(0 0 8px rgba(255,90,90,.75))}',
    '.nemc .gr{flex:1;min-width:0}',
    '.nemc .tag{display:block;font-family:"Aurora Cinzel",serif;letter-spacing:.2em;font-size:10px;font-weight:700;color:#ffb0a8;text-transform:uppercase}',
    '.nemc h3{font-size:14.5px;font-weight:800;line-height:1.2;margin:1px 0 0;color:#fff}',
    '.nemc .sb{font-size:11.5px;color:#e0c8d0;margin-top:2px}',
    '.nemc q{display:block;margin-top:8px;font-style:italic;color:#ffd0c8;font-size:12px;line-height:1.4;quotes:none}',
    '.nemc .nt{margin-top:6px;font-size:11.5px;color:#d8dcec;line-height:1.4}',
    '.nemc .nt b{color:var(--gold2)}',
    '.arof.nem{border-color:rgba(238,100,100,.75);background:linear-gradient(180deg,rgba(150,34,48,.3),rgba(255,255,255,.03));box-shadow:0 0 0 1px rgba(238,100,100,.25),0 0 16px rgba(238,80,80,.25);margin-top:14px}',
    '.arof.nem .emb{filter:drop-shadow(0 0 7px rgba(255,90,90,.8))}',
    '.arof .nrb{position:absolute;top:-9px;left:12px;height:18px;line-height:18px;padding:0 9px;border-radius:9px;font-family:"Aurora Cinzel",serif;letter-spacing:.08em;font-size:10px;font-weight:700;color:#fff;background:linear-gradient(180deg,#d8454f,#8c1f2c);box-shadow:0 2px 6px rgba(0,0,0,.4);white-space:nowrap}',
    '.btn.rev{background:linear-gradient(180deg,#ff9a8a,#d8454f);color:#240608;border-color:#ffd0c8;box-shadow:0 3px 10px rgba(216,69,79,.35)}',
    '.ar-rk.nem{background:linear-gradient(90deg,rgba(150,34,48,.4),rgba(255,255,255,.035));box-shadow:0 0 0 1px rgba(238,100,100,.35)}',
    '.ar-rk .nmt{display:inline-block;margin-left:6px;height:15px;line-height:15px;padding:0 6px;border-radius:8px;font-size:9px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#fff;background:#b8323f;vertical-align:1px}',
    '.rvg{margin:10px 0 4px;padding:10px;border-radius:14px;text-align:center;border:1px solid rgba(255,208,120,.6);background:radial-gradient(circle at 50% 0,rgba(255,224,140,.22),rgba(120,26,40,.35))}',
    '.rvg .big{font-family:"Aurora Cinzel",serif;font-size:20px;letter-spacing:.1em;font-weight:700;color:var(--gold2)}',
    '.rvg .sub{font-size:12px;color:#e6dcc8;margin-top:2px}',
    '.rvq{margin:8px 4px 0;padding:8px 10px;border-radius:12px;border-left:3px solid #d8454f;background:rgba(0,0,0,.28);font-size:12px;line-height:1.4;text-align:left;color:#ffd8d0}',
    '.rvq i{display:block;font-style:normal;font-size:10.5px;color:var(--mut);font-weight:800;margin-top:3px}',
    '.rvq.n{border-color:#b98ff5;color:#e6dcff}',
    /* visitante */
    '.vsc .top{display:flex;gap:12px;align-items:center;justify-content:center;margin:8px 0}',
    '.vsc .top .pt{width:66px;height:66px;border-radius:14px;background-color:rgba(0,0,0,.3);background-size:66px 66px;border:2px solid var(--vc);box-shadow:0 0 16px var(--vg)}',
    '.vsc .duo{margin-top:10px;padding:10px 12px;border-radius:14px;border:1px solid var(--line);background:linear-gradient(180deg,rgba(226,182,89,.1),rgba(226,182,89,.03))}',
    '.vsc .duo h4{font-size:13.5px;margin:0 0 3px}',
    '.vsc .duo p{font-size:11.5px;color:#cfd5e4;line-height:1.45;margin:0 0 8px}',
    '.vsc .lgb{margin:0 auto}',
    /* notícias do retorno */
    '.rvnews{margin:8px 0 6px;padding:8px 10px;border-radius:12px;background:rgba(0,0,0,.26);border:1px solid var(--line2);text-align:left}',
    '.rvnews .h{display:flex;align-items:center;gap:6px;font-family:"Aurora Cinzel",serif;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold2);margin-bottom:4px}',
    '.rvnews .h svg{font-size:13px}',
    '.rvnews li{list-style:none;font-size:12px;line-height:1.4;color:#d8dcec;padding:1px 0}',
    '.rvnews li b{color:#fff}',
    /* laços */
    '.lcl .lr{display:flex;align-items:center;gap:9px;padding:6px 0;border-top:1px solid rgba(255,255,255,.06)}',
    '.lcl .lr:first-child{border-top:0}',
    '.lcl .pt{width:34px;height:34px;border-radius:9px;background-color:rgba(0,0,0,.3);background-size:34px 34px;border:2px solid #4a557a;flex:none}',
    '.lcl .gr{flex:1;min-width:0}',
    '.lcl .nm{display:flex;align-items:center;gap:6px;font-weight:800;font-size:12.5px;white-space:nowrap;overflow:hidden}',
    '.lcl .nm em{font-style:normal;font-size:10.5px;font-weight:900;padding:1px 7px;border-radius:9px;color:#1a1408;background:var(--lcc)}',
    '.lcl .nm i{width:7px;height:7px;border-radius:50%;background:#7df09a;box-shadow:0 0 6px #7df09a;flex:none}',
    '.lcl .bar{margin-top:4px;height:5px}',
    '.lcl .sb{font-size:10.5px;color:var(--mut);font-weight:700;margin-top:2px}',
    '.lcb{font-size:11.5px;color:#cfd5e4;margin-top:6px;padding-top:6px;border-top:1px dashed rgba(255,255,255,.12)}',
    '.lcb b{color:#9af0b0}',
  ].join('\n');
  document.head.appendChild(css);

  /* ================= 3B.1 Nêmesis e revanche na Arena ================= */
  const nemCard = (nem, offers) => {
    const riv = nem.riv, inOff = offers.some((o) => o.i === nem.i);
    return '<div class="nemc"><div class="hd">' + emblem(riv, 48) + '<div class="gr"><span class="tag">Seu Nêmesis</span><h3>' + esc(riv.name) + '</h3><div class="sb">' + esc(riv.lead.title + ' ' + riv.lead.name) + ' · ' + nem.l + (nem.l === 1 ? ' derrota guardada' : ' derrotas guardadas') + '</div></div></div>' +
      '<q>“' + esc(G.nemTaunt(nem.i, 'pre')) + '”</q><div class="nt">' + (inOff ? 'Está entre os adversários de hoje. Vença a <b>Revanche</b>: +50% de pontos, Insígnias de vingança e o título <b>Vingador</b>.' : 'Não está entre os adversários de agora. Ele volta de vez em quando: quando aparecer, a Revanche vale +50% de pontos.') + '</div></div>';
  };
  /* decora o HTML da aba Arena (sem mexer no 65-ui-arena): cartão do Nêmesis, ofertas de revanche e faixa no ranking */
  const decorate = (html) => {
    const nem = G.nemesis(); if (!nem) return html;
    if (html.indexOf('class="arof"') >= 0 || html.indexOf('Adversários de hoje') >= 0) {
      const offers = G.arenaOffersReady() ? G.arenaOffers() : [];
      const parts = html.split('<div class="arof">'), out = [parts[0]];
      for (let k = 1; k < parts.length; k++) {
        const o = offers[k - 1];
        if (o && o.rev) out.push('<div class="arof nem"><span class="nrb">Nêmesis · Revanche +50%</span>' + parts[k].replace('Desafiar</button>', 'Revanche</button>').replace('class="btn sm pri" data-a="arfight:', 'class="btn sm pri rev" data-a="arfight:'));
        else out.push('<div class="arof">' + parts[k]);
      }
      html = out.join('');
      html = html.replace('<div class="sec">Adversários de hoje</div>', nemCard(nem, offers) + '<div class="sec">Adversários de hoje</div>');
    }
    const key = '<button class="ar-rk" data-a="arriv:' + nem.i + '"', at = html.indexOf(key);
    if (at >= 0) {
      const sm = html.indexOf('<small>', at);
      html = html.slice(0, at) + '<button class="ar-rk nem" data-a="arriv:' + nem.i + '"' + html.slice(at + key.length, sm) + '<em class="nmt">Nêmesis</em>' + html.slice(sm);
    }
    return html;
  };
  const M = UI.SHEETS && UI.SHEETS.missoes;
  if (M) {
    const r1 = M.render;
    M.render = function (tab, sub) {
      const html = r1.call(M, tab, sub);
      if (tab !== 'arena' || !G.S || !G.arenaOpen()) return html;
      try { return decorate(html); } catch (e) { console.error(e); return html; }
    };
  }
  /* "Ver reino" do Nêmesis ganha o cartão dele com a provocação */
  const rv1 = UI.ACT.arriv;
  UI.ACT.arriv = (a) => {
    rv1(a);
    try {
      const nem = G.nemesis(), box = $('#modal .mbox'); if (!nem || nem.i !== +a[0] || !box) return;
      const h2 = box.querySelector('h2'); if (!h2) return;
      h2.insertAdjacentHTML('afterend', '<div class="nemc" style="margin-top:8px"><span class="tag">Seu Nêmesis</span><q>“' + esc(G.nemTaunt(nem.i, 'pre')) + '”</q><div class="nt">Ele já levou <b>' + nem.L + '</b> duelo' + (nem.L === 1 ? '' : 's') + ' de Aurora e perdeu <b>' + nem.W + '</b>. Rancor guardado: ' + nem.l + '.</div></div>');
    } catch (e) { console.error(e); }
  };
  /* a janela da equipe da revanche anuncia o bônus */
  const af1 = UI.ACT.arfight;
  UI.ACT.arfight = (a) => {
    af1(a);
    try { const o = G.arenaOffers()[+a[0]], e = o && o.rev && $('#modal .ar-tm .eyebrow'); if (e) { e.textContent = 'Revanche · +50% de pontos'; e.style.color = '#ff9a8a'; } } catch (e) { console.error(e); }
  };
  /* resultado do duelo: vingança, provocação do líder e o novo Nêmesis; duelo amistoso troca o resultado inteiro */
  let lastRes = null, friendly = null;
  G.on('arena', (d) => {
    if (d.t === 'duel') { lastRes = d.res; friendly = null; return; }     // um duelo valendo começou: nenhum amistoso abandonado vaza para o resultado dele
    if (d.t !== 'result') return;
    try {
      const box = $('#ar-res .ar-res'); if (!box) return;
      if (friendly) { friendlyResult(box, friendly); friendly = null; return; }
      const res = lastRes; if (!res) return;
      const acts = box.querySelector('.acts'); if (!acts) return;
      const riv = G.arenaRival(res.rival.i), who = riv.lead.title + ' ' + riv.lead.name;
      let h = '';
      if (res.rev && res.rev.vingado) h += '<div class="rvg"><div class="big">Vingança cumprida!</div><div class="sub">O rancor contra ' + esc(G.rivArt(riv.name)) + ' foi quitado.</div><div class="costs" style="justify-content:center;margin-top:6px"><span class="cost">' + insIc(14) + '+' + res.rev.ins + ' Insígnias de vingança</span><span class="cost">' + ic('trophy') + 'título Vingador</span></div></div>';
      else if (res.rev && res.rev.on) h += '<div class="sub" style="margin:4px 0;color:#ffb0a8;font-weight:800">Revanche perdida: o rancor continua.</div>';
      if (res.taunt) h += '<div class="rvq">“' + esc(res.taunt) + '”<i>' + esc(who) + ' · ' + esc(riv.name) + '</i></div>';
      if (res.nemNew) h += '<div class="rvq n">' + esc(cap1(G.rivArt(riv.name))) + ' agora é o seu <b>Nêmesis</b>. Ele vai aparecer de vez em quando, e a revanche vale +50% de pontos.<i>Missões › Arena</i></div>';
      if (h) acts.insertAdjacentHTML('beforebegin', h);
      if (res.rev && res.rev.vingado) { G.sfx('reveal'); R.shake = Math.max(R.shake || 0, 4); }
    } catch (e) { console.error(e); }
  });
  G.on('nemesis', (d) => { if (d.t === 'novo') { G.sfx('nemesis'); } });

  /* ================= 3B.2 visitante rival: arte, toque e cartão ================= */
  const tierFor = (L) => { let t = 1; while (t < 16 && G.TIER_LVL(t + 1) <= L - 2) t++; return t; };
  const visLook = (v) => {
    if (v._look) return v._look;
    const riv = G.arenaRival(v.riv), tier = tierFor(v.lvl), o = A.heroLook({ cls: v.cls, look: v.look, rank: v.rank, gear: { arma: { tier }, armadura: { tier } }, cos: {} }), mix = A.mix;
    o.body = mix(o.body || '#888888', riv.c1, 0.5); o.cape = mix(riv.c1, '#000000', 0.15); o.trim = riv.c2; if (o.scarf) o.scarf = riv.c2;
    o.key = 'vis|' + riv.i + '|' + v.k + '|' + v.rank + '|' + tier;
    return (v._look = o);
  };
  const imgs = new Map();
  const embImg = (i) => {
    let im = imgs.get(i); if (im) return im;
    const svg = emblem(G.arenaRival(i), 30).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); imgs.set(i, im); return im;
  };
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath(); };
  const bubble = (ctx, px, py, text, z) => {
    const dpr = Math.min(3, window.devicePixelRatio || 1), fs = Math.round(G.clamp(z * 2.6, 10.5 * dpr, 13 * dpr)), cw = ctx.canvas.width;
    ctx.font = '700 ' + fs + 'px "Aurora Manrope",system-ui,sans-serif'; ctx.textAlign = 'center';
    const tw = ctx.measureText(text).width, w = tw + fs * 1.2, h = fs * 1.8, x = Math.round(G.clamp(px - w / 2, 4, cw - w - 4)), y = Math.round(py - h);
    ctx.fillStyle = 'rgba(255,252,240,.96)'; rr(ctx, x, y, w, h, fs * 0.6); ctx.fill();
    ctx.beginPath(); ctx.moveTo(px - fs * 0.4, y + h - 1); ctx.lineTo(px, y + h + fs * 0.45); ctx.lineTo(px + fs * 0.4, y + h - 1); ctx.fill();
    ctx.fillStyle = '#2a2030'; ctx.textBaseline = 'middle'; ctx.fillText(text, x + w / 2, y + h / 2 + 1); ctx.textBaseline = 'alphabetic';
  };
  /* o visitante: herói com as cores do reino, estandarte nas costas, brasão flutuando e o nome do reino */
  const drawVis = (v, X, Y, z, over) => {
    const ctx = R.ctx, riv = G.arenaRival(v.riv), px = Math.round(X(v.x)), py = Math.round(Y(v.y)), dpr = Math.min(3, window.devicePixelRatio || 1);
    if (v._ph == null) v._ph = (G.hash(v.name) % 100) / 25;
    const sheet = A.charSheet(visLook(v)), fr = A.charFrame(v, R.t), sxp = sheet.idx[fr] * 26;
    const out = v.state === 'leave' ? 0.85 : 1;
    ctx.globalAlpha = out;
    /* sombra e anel de toque */
    ctx.fillStyle = 'rgba(10,16,30,.28)'; ctx.beginPath(); ctx.ellipse(px, py, 6.5 * z, 2.7 * z, 0, 0, 6.283); ctx.fill();
    const rk = (R.t * 0.7) % 1; ctx.globalAlpha = out * (1 - rk) * 0.7; ctx.strokeStyle = riv.c2; ctx.lineWidth = Math.max(1, z * 0.7); ctx.beginPath(); ctx.ellipse(px, py, (9 + 8 * rk) * z, (3.6 + 3.2 * rk) * z, 0, 0, 6.283); ctx.stroke(); ctx.globalAlpha = out;
    ctx.save(); ctx.translate(px, py); if (v.dir < 0) ctx.scale(-1, 1);
    /* estandarte: haste atrás do ombro e flâmula ondulando */
    const sw = Math.sin(R.t * 3 + v._ph) * 1.2;
    ctx.fillStyle = '#5a4026'; ctx.fillRect(Math.round(-11 * z), Math.round(-33 * z), Math.max(1, Math.round(z)), Math.round(26 * z));
    ctx.fillStyle = riv.c1; ctx.beginPath(); ctx.moveTo(-11 * z, -33 * z); ctx.lineTo(-3 * z + sw * z, -31 * z); ctx.lineTo(-11 * z, -25 * z); ctx.closePath(); ctx.fill();
    ctx.fillStyle = riv.c2; ctx.fillRect(Math.round(-10.4 * z), Math.round(-31.4 * z), Math.round(5 * z + sw * z * 0.5), Math.max(1, Math.round(z)));
    ctx.drawImage(sheet.cv, sxp, 0, 26, 30, -13 * z, -27 * z, 26 * z, 30 * z);
    ctx.restore();
    ctx.globalAlpha = 1;
    over.push(() => {
      const top = py - 31 * z, fs = Math.round(G.clamp(z * 2.6, 10.5 * dpr, 13 * dpr)), im = embImg(v.riv), bob = Math.sin(R.t * 2.4 + v._ph) * 1.2 * z;
      if (im.complete && im.naturalWidth) { const w = 8 * z; ctx.drawImage(im, px - w / 2, top - 15 * z + bob, w, w * 38 / 32); }
      ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2, dpr * 2.2); ctx.strokeStyle = 'rgba(16,12,24,.92)';
      ctx.font = '800 ' + fs + 'px "Aurora Manrope",system-ui,sans-serif'; ctx.strokeText(v.name, px, top - 2 * z); ctx.fillStyle = '#fff4d0'; ctx.fillText(v.name, px, top - 2 * z);
      if (v.sayT > 0 && v.say) bubble(ctx, px, top - 17 * z, v.say, z);
    });
  };
  const dm1 = R.dynMore;
  R.dynMore = (dyn, vx0, vx1, vy0, vy1) => {
    if (dm1) dm1(dyn, vx0, vx1, vy0, vy1);
    const v = G.visitor; if (v && v.x > vx0 && v.x < vx1 && v.y > vy0 && v.y < vy1) dyn.push({ y: v.y, k: 'x', e: v, f: drawVis });
  };
  /* toque no visitante: área generosa, com prioridade sobre heróis e criatura da sorte */
  const pk1 = R.pick;
  R.pick = (px, py) => {
    const v = G.visitor;
    if (v) { const w = R.screenToWorld(px, py); if (Math.hypot(v.x - w[0], v.y - 0.8 - w[1]) < 1.5) return { type: 'npc', ref: v }; }
    return pk1(px, py);
  };
  const in1 = UI.inspect;
  UI.inspect = (sel) => { if (sel && sel.ref && sel.ref.vis) { R.sel = null; visitorCard(sel.ref); return; } return in1(sel); };

  const lgBadge = (lg) => { const L = G.ARENA_LEAGUES[lg]; return '<span class="lgb" style="--lc:' + L.col + ';--lg:' + rgba(L.col, 0.5) + '">' + ic('trophy') + L.name + '</span>'; };
  const visitorCard = (v) => {
    const inf = G.visitorInfo(v); if (!inf) return;
    const riv = inf.riv, L = G.ARENA_LEAGUES[inf.liga], url = A.portrait(visLook(v)), nem = G.nemesis();
    let h = '<div class="vsc"><div class="eyebrow">' + (v.fem ? 'Campeã visitante' : 'Campeão visitante') + '</div><h2>' + esc(v.name) + '</h2>' +
      '<div class="top"><i class="pt px" style="background-image:url(' + url + ');--vc:' + riv.c1 + ';--vg:' + rgba(riv.c1, 0.6) + '"></i>' + emblem(riv, 56) + '</div>' +
      '<p class="lead" style="margin:4px 0 6px"><b class="gold">' + esc(riv.name) + '</b><br>' + esc(riv.lead.title) + ' ' + esc(riv.lead.name) + ' · ' + esc(riv.style) + '<br>“' + esc(riv.motto) + '”</p>' +
      '<div style="text-align:center;margin:6px 0">' + lgBadge(inf.liga) + '</div>' +
      '<div class="ar-st2"><div class="stat"><small>Posição</small><b>' + inf.pos + 'º de ' + inf.total + '</b></div><div class="stat"><small>Pontos</small><b>' + G.fmt(inf.pts) + '</b></div><div class="stat"><small>Heróis</small><b>' + riv.size + '</b></div></div>';
    if (inf.nem || (nem && nem.i === riv.i)) h += '<div class="nemc" style="margin:8px 0"><span class="tag">Seu Nêmesis</span><q>“' + esc(G.nemTaunt(riv.i, 'pre')) + '”</q></div>';
    h += '<div class="duo"><h4>Duelo amistoso</h4><p>Uma vez por dia, sem gastar tíquete. Vale um prêmio pequeno (moedas e Insígnias) e <b>não vale pontos de liga</b>: é só honra e estima. A equipe é montada sozinha, com os seus melhores heróis.</p>' +
      (inf.can ? '<button class="btn pri" data-a="vsduel" style="width:100%">' + ic('sword') + 'Aceitar o duelo</button>' : '<button class="btn" disabled style="width:100%">' + (inf.used ? 'Você já duelou com um visitante hoje' : 'Faltam heróis para este duelo') + '</button>' + (inf.used ? '<p class="mut" style="margin:6px 0 0;text-align:center">Volta à meia-noite, pelo relógio do aparelho.</p>' : '')) + '</div>';
    UI.modal(h + '<div class="acts"><button class="btn pri" data-a="mclose">Fechar</button></div></div>');
    G.sfx('click');
  };
  UI.visitorCard = visitorCard;
  UI.ACT.vsduel = () => {
    const res = G.visitorDuel(); if (res.err) return UI.toast(res.err, 'bad');
    friendly = res; UI.closeModal(); UI.arenaDuelModal(res);
  };
  const friendlyResult = (box, res) => {
    const win = res.win;
    box.className = 'ar-res ' + (win ? 'w' : 'l');
    box.innerHTML = '<div class="big">' + (win ? 'VITÓRIA' : 'DERROTA') + '</div>' +
      '<div class="sub">Duelo amistoso com <b class="gold">' + esc(res.visitor) + '</b> · ' + esc(res.rival.name) + '</div>' +
      '<div class="costs" style="justify-content:center">' + (res.gold ? '<span class="cost">' + ic('coin') + '+' + G.fmt(res.gold) + ' moedas</span>' : '') + '<span class="cost">' + insIc(14) + '+' + res.ins + (res.ins > 1 ? ' Insígnias' : ' Insígnia') + '</span></div>' +
      '<div class="sub" style="margin-top:6px;color:var(--mut)">Não vale pontos de liga. ' + (win ? 'Honra de campeão.' : 'Na próxima, a taverna é por conta de quem perdeu.') + '</div>' +
      (res.mvp ? '<div class="mvp">Destaque: <b>' + esc(res.mvp.name) + '</b> · ' + G.fmt(res.mvp.dmg) + ' de dano · ' + Math.round(res.t) + ' s de luta</div>' : '') +
      '<div class="acts"><button class="btn pri" data-a="mclose">Voltar ao mapa</button></div>';
  };
  G.on('visitante', (d) => {
    if (d.t === 'chegou') {
      const v = d.v, riv = G.arenaRival(v.riv);
      G.sfx('horn'); UI.toast((v.fem ? 'Uma campeã ' : 'Um campeão ') + G.rivArtDe(riv.name) + ' chegou a Aurora! Toque ' + (v.fem ? 'nela' : 'nele') + '.', 'epic', 'flag');
    }
  });
  G.on('laco', () => { if (UI.sheet) UI.sheetDirty(); });

  /* ================= 3B.1 notícias dos rivais no retorno ================= */
  const om1 = UI.offlineModal;
  UI.offlineModal = (o) => {
    om1(o);
    try {
      const r = G.ret && G.ret().off, n = (o && o.news) || (r && r.news); if (!n || !n.lines || !n.lines.length) return;
      const box = $('#modal .mbox'), lead = box && box.querySelector('p.lead'); if (!lead || box.querySelector('.rvnews')) return;
      lead.insertAdjacentHTML('afterend', '<div class="rvnews"><div class="h">' + ic('flag') + 'Notícias dos rivais</div><ul style="margin:0;padding:0">' + n.lines.map((l) => '<li>' + esc(l) + '</li>').join('') + '</ul></div>');
    } catch (e) { console.error(e); }
  };

  /* ================= 3B.3 laços na ficha do herói (aba Feitos) ================= */
  const LCOL = ['#4a557a', '#9fb4d8', '#7df09a', '#ffd35a'], LCOL_OPP = ['#4a557a', '#9fb4d8', '#ff9a6a', '#ff7ac0'];
  const bonusLine = (b) => { const a = []; if (b.atk) a.push('+' + Math.round(b.atk * 100) + '% ataque'); if (b.def) a.push('+' + Math.round(b.def * 100) + '% defesa'); if (b.mood) a.push('+' + Math.round(b.mood * 100) + '% ânimo'); return a.join(' · '); };
  const lacoRow = (o) => {
    const col = (o.opp ? LCOL_OPP : LCOL)[o.lv], B = o.lv >= 2 ? (o.opp ? G.LACOS.bonusOpp : G.LACOS.bonus)[o.lv] : null;
    return '<div class="lr" style="--lcc:' + col + '"><i class="pt px" style="background-image:url(' + UI.portrait(o.h) + ');border-color:' + G.RANK_COLOR[o.h.rank] + '"></i><div class="gr"><div class="nm">' + esc(o.h.name) + '<em>' + esc(o.name) + '</em>' + (o.near ? '<i title="Está por perto"></i>' : '') + '</div>' +
      (o.lv < 3 ? '<div class="bar"><i style="width:' + o.pct + '%"></i></div>' : '') + '<div class="sb">' + (B ? bonusLine(B) + ' quando estão perto' : 'Caçar juntos aproxima.') + (o.lv < 3 ? ' · próximo nível: ' + o.v + ' de ' + o.next : '') + '</div></div></div>';
  };
  const lacosSec = (x) => {
    const l = G.lacosOf(x);
    let h = '<div class="sec">Laços · ' + l.length + '</div>';
    if (!l.length) return h + '<div class="empty">Heróis que caçam e duelam juntos criam laços. Os de ' + esc(x.name) + ' aparecem aqui.</div>';
    h += '<div class="card"><div class="lcl">' + l.slice(0, 5).map(lacoRow).join('') + '</div>';
    if (l.length > 5) h += '<div class="mut" style="font-size:11px;text-align:center;margin-top:4px">e mais ' + (l.length - 5) + ' laço' + (l.length - 5 === 1 ? '' : 's') + ' mais fracos</div>';
    const b = G.lacoBonus(x), bl = bonusLine(b);
    h += '<div class="lcb">' + (bl ? 'Agora, com companheiros por perto: <b>' + bl + '</b>.' : 'Nenhum companheiro por perto agora. O bônus é de até 3% e só vale quando os dois estão a poucos passos.') + '</div></div>';
    return h;
  };
  const uf1 = UI.feitosTab;
  if (uf1) UI.feitosTab = (x) => {
    const html = uf1(x);
    try { return html.replace('<div class="sec">Linha do tempo</div>', lacosSec(x) + '<div class="sec">Linha do tempo</div>'); } catch (e) { console.error(e); return html; }
  };

  /* ================= sons ================= */
  const AU = G.AU;
  if (AU && AU.SFX) {
    AU.SFX.laco = () => { AU.seq([660, 880, 1109, 1319], 0.08, 'triangle', 0.1, 0.34); };
    AU.SFX.nemesis = (t) => { AU.tone(98, t, 0.5, 'sawtooth', 0.12); AU.seq([220, 185, 147], 0.14, 'square', 0.07, 0.3); };
  }
})();

;
