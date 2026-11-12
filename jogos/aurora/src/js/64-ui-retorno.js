/* 64-ui-retorno: v24 — janela de retorno com cartas, calendário de 7 dias, faixa da semana temática no HUD e a criatura
   da sorte (arte, desenho, toque e efeitos). A simulação mora em 38-retorno.js. */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const UI = G.UI, A = G.A, R = G.R, ic = UI.ic, esc = UI.esc, $ = UI.$;
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };

  /* ---------- estilo ---------- */
  const css = document.createElement('style');
  css.textContent = [
    /* faixa da semana e Sorte, logo abaixo dos heróis */
    /* cartas de retorno */
    '.rcd-h{font-family:var(--fh);font-size:15px;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);text-align:center;margin:14px 0 2px}',
    '.rcd-s{text-align:center;color:var(--mut);font-size:15px;margin:0 0 8px}',
    '.rcdg{display:flex;flex-wrap:wrap;gap:7px;justify-content:center;margin:6px auto 2px}',
    '.rcd{position:relative;width:80px;flex:none;aspect-ratio:3/4;perspective:700px;cursor:pointer;touch-action:manipulation}',
    '.rcd-in{position:absolute;inset:0;transform-style:preserve-3d;-webkit-transform-style:preserve-3d;transition:transform .6s cubic-bezier(.3,1.25,.4,1)}',
    '.rcd.on .rcd-in{transform:rotateY(180deg)}.rcd.nf .rcd-in{transition:none}',
    '.rcd-f{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;}',
    '.rcd-back{background:#2c2040;display:grid;place-items:center;border:var(--u) solid rgba(226,182,89,.55);,repeating-conic-gradient(from 0deg at 50% 46%,rgba(255,255,255,.07) 0 10deg,transparent 10deg 20deg),linear-gradient(#3d2618 0 28%,#1b110c 28% 100%);box-shadow:none}',
    '.rcd-back b{font-size:32px;line-height:1;color:var(--gold2);text-shadow:var(--u) var(--u) 0 var(--ol);animation:rtp 1.3s ease-in-out infinite alternate}',
    '.rcd:nth-child(2n) .rcd-back b{animation-delay:.35s}.rcd:nth-child(3n) .rcd-back b{animation-delay:.7s}',
    '@keyframes rtp{from{transform:scale(.88);opacity:.7}to{transform:scale(1.08);opacity:1}}',
    '.rcd:active .rcd-in{transform:scale(.96)}.rcd.on:active .rcd-in{transform:rotateY(180deg) scale(.96)}',
    '.rcd-front{transform:rotateY(180deg);display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:6px 4px 6px;text-align:center;overflow:hidden;border:var(--u) solid var(--rc);background:linear-gradient(#3d2618 0 28%,#1b110c 28% 100%);box-shadow:none}',
    '.rcd.hi .rcd-front{box-shadow:none}',
    '.rcd.hi.on:not(.nf) .rcd-front::after{content:"";position:absolute;top:0;bottom:0;width:42%;left:-60%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.38),transparent);animation:rtsh 1.6s ease-out .5s 2}',
    '@keyframes rtsh{to{left:130%}}',
    '.rcd-front em{font-style:normal;font-family:var(--fh);font-weight:700;font-size:8px;font-family:var(--fc);letter-spacing:.16em;text-transform:uppercase;color:var(--rc);text-shadow:var(--u) var(--u) 0 var(--ol);}',
    '.rcd-ic{display:flex;align-items:center;justify-content:center;gap:2px;flex:1;min-height:0;}',
    '.rcd-ic .i{--is:2;}.rcd-ic .px{width:26px;height:26px}.rcd-ic .gi{width:38px;height:38px;background-size:30px 30px}',
    '.c-coin .i{color:#f5c84a}.c-core .i{color:#b98ff5}.c-seal .i{color:#ff9ac8}',
    '.rcd-front strong{font-size:8px;font-family:var(--fc);line-height:1.15;font-weight:800;color:#eef0f6;max-width:100%}',
    '.rcd-v{font-size:8px;font-family:var(--fc);font-weight:900;color:var(--gold2);line-height:1.2;max-width:100%}',
    '.rcd-c{text-align:center;color:var(--mut);font-size:15px;margin-top:8px}',
    /* calendário */
    '.calg{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:12px 0 4px}',
    '.ct{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-height:92px;padding:8px 4px 7px;text-align:center;border:var(--u) solid var(--line2);background:var(--fill2)}',
    '.ct small{font-family:var(--fh);font-size:8px;font-family:var(--fc);letter-spacing:.18em;color:var(--mut)}',
    '.ct .i{color:var(--gold2)}.ct b{font-size:15px;line-height:1.15;font-weight:800;color:#dfe4f1}',
    '.ct.d7{grid-column:span 2;border-color:rgba(245,176,65,.6);background:rgba(245,176,65,.2)}.ct.d7 .i{--is:2;color:#f5b041}.ct.d7 b{font-size:15px;color:#ffd98a}',
    '.ct.lat{opacity:.62}',
    '.ct.done{opacity:.55;border-color:rgba(95,207,124,.45)}.ct.done .i,.ct.done b{filter:saturate(.5)}',
    '.ct.done::after{content:"✓";position:absolute;top:5px;right:7px;font-size:15px;font-weight:900;color:var(--good)}',
    '.ct.now{border:var(--u) solid var(--gold);background:rgba(226,182,89,.26);box-shadow:none;animation:ctn 1.3s ease-in-out infinite alternate}',
    '.ct.now small{color:var(--gold2)}.ct.now i{font-style:normal;font-size:8px;font-family:var(--fc);color:var(--mut);line-height:1.2}',
    '@keyframes ctn{from{box-shadow:none}to{box-shadow:none}}',
    '.calres{margin:10px 0 0;padding:9px 10px;text-align:center;background:rgba(95,207,124,.12);border:var(--u) solid rgba(95,207,124,.5)}',
    '.calres b{display:block;font-size:15px;color:#b0f0c0;margin-bottom:4px}.calres .costs{justify-content:center}',
    '.calnote{text-align:center;font-size:15px;margin:9px 4px 0;line-height:1.2;padding:2px 6px}',
    /* semana */
    '.wkico{background:var(--inset);width:56px;height:56px;margin:10px auto 0;display:grid;place-items:center;font-size:24px;color:var(--wc);border:var(--u) solid var(--wc);box-shadow:none}',
    '.wkn{display:flex;gap:6px;margin-top:6px}.wkn span{flex:1;display:flex;align-items:center;gap:6px;padding:6px 8px;background:var(--fill2);font-size:15px;font-weight:800;color:#cfd5e4;min-width:0}.wkn .i{flex:none}',
  ].join('\n');
  document.head.appendChild(css);

  /* ---------- peças de HTML ---------- */
  const rIco = (k, s) => '<i class="px ri-' + k + '" style="width:' + s + 'px;height:' + s + 'px"></i>';
  const chip = (x) => '<span class="cost">' + (x.i === 'res' ? rIco(x.id, 16) : x.i === 'gear' ? ic('anvil') : ic(x.i)) + esc(x.t) + '</span>';
  const chips = (p) => '<div class="costs">' + G.prizeParts(p).map(chip).join('') + '</div>';

  /* ================= 1B.1 janela de retorno com cartas ================= */
  const cardHtml = (c, i) => {
    const col = G.RAR_COLOR[c.r], pt = G.prizeParts(c.p);
    let ico = '', val = '';
    switch (c.k) {
      case 'gold': ico = '<span class="c-coin">' + ic('coin') + '</span>'; val = '+' + G.fmt(c.p.gold); break;
      case 'nuc': ico = '<span class="c-core">' + ic('core') + '</span>'; val = '+' + c.p.nucleos; break;
      case 'selo': ico = '<span class="c-seal">' + ic('seal') + '</span>'; val = '+' + c.p.selos; break;
      case 'gear': ico = UI.gi(c.p.it); val = c.p.it.ins.length ? c.p.it.ins.length + (c.p.it.ins.length > 1 ? ' inscrições' : ' inscrição') : 'sem inscrições'; break;
      default: ico = pt.filter((x) => x.i === 'res').map((x) => rIco(x.id, pt.length > 1 ? 24 : 30)).join(''); val = pt.map((x) => '+' + G.fmt(x.n) + ' ' + G.RES[x.id].name.split(' ')[0]).join('<br>');
    }
    const ttl = c.k === 'gear' ? G.itemName(c.p.it) : G.RET_TITLE[c.k];
    return '<div class="rcd' + (c.st ? ' on nf' : '') + (c.r >= 3 ? ' hi' : '') + '" id="rc' + i + '" data-a="rtflip:' + i + '" style="--rc:' + col + ';--rcg:' + rgba(col, 0.5) + '"><div class="rcd-in"><div class="rcd-f rcd-back"><b>✦</b></div>' +
      '<div class="rcd-f rcd-front"><em>' + G.RAR[c.r] + '</em><div class="rcd-ic">' + ico + '</div><strong>' + esc(ttl) + '</strong><span class="rcd-v">' + val + '</span></div></div></div>';
  };
  const flipped = (off) => off.cards.filter((c) => c.st).length;
  const countTxt = (off) => { const n = flipped(off), t = off.cards.length; return n >= t ? 'Tudo virado e guardado no cofre.' : 'Viradas ' + n + ' de ' + t + ' · toque para virar'; };
  /* a janela original "Enquanto você esteve fora" continua igual; aqui entram os achados e os botões novos */
  const om0 = UI.offlineModal;
  UI.offlineModal = (o) => {
    om0(o);
    const off = G.ret().off;
    if (!off || !off.cards || !off.cards.length) return;
    const box = $('#modal .mbox'); if (!box) return;
    const html0 = box.innerHTML, k = html0.lastIndexOf('<div class="acts">'), head = k >= 0 ? html0.slice(0, k) : html0, n = off.cards.length;
    const cols = Math.ceil(n / Math.ceil(n / 4));                    // 5 cartas: 3+2, 6: 3+3, 7: 4+3, 8: 4+4
    UI.modal(head + '<div class="rcd-h">Achados da viagem</div><p class="rcd-s">' + (n === 1 ? 'Uma carta' : n + ' cartas') + ' · uma por hora fora</p>' +
      '<div class="rcdg" style="max-width:' + (cols * 80 + (cols - 1) * 7) + 'px">' + off.cards.map(cardHtml).join('') + '</div><div class="rcd-c" id="rtc">' + countTxt(off) + '</div>' +
      '<div class="acts"><button class="btn" data-a="rtall" id="rtall"' + (flipped(off) >= n ? ' disabled' : '') + '>' + ic('spark') + 'Virar todas</button><button class="btn pri" data-a="mclose">Voltar ao trono</button></div>', { lock: true, onClose: closeReturn });
    { const bx = $('#modal .mbox'); if (bx) bx.classList.add('rt'); }
  };
  const closeReturn = () => {
    const n = G.retFinish();
    if (n) UI.toast(n + (n > 1 ? ' achados guardados no cofre.' : ' achado guardado no cofre.'), 'good', 'gift');
    if (G.M && G.M.save) G.M.save();
  };
  const doFlip = (i) => {
    const c = G.retFlip(i); if (!c) return false;
    const el = $('#rc' + i); if (el) el.classList.add('on');
    const off = G.ret().off, t = $('#rtc'); if (off && t) t.textContent = countTxt(off); else if (t) t.textContent = 'Tudo virado e guardado no cofre.';
    if (off && flipped(off) >= off.cards.length) { const b = $('#rtall'); if (b) b.disabled = true; }
    G.sfx('flip');
    if (c.r >= 2) setTimeout(() => G.sfx(c.r >= 4 ? 'reveal2' : c.r >= 3 ? 'reveal' : 'rare'), 240);
    if (c.k === 'gear' && G.insPerfect(c.p.it.ins)) setTimeout(() => G.sfx('perfect'), 520);
    if (c.r >= 3) R.shake = Math.max(R.shake || 0, c.r >= 4 ? 5 : 3);
    UI.sheetDirty && UI.sheetDirty('inv');
    return true;
  };
  UI.ACT.rtflip = (a) => { doFlip(+a[0]); };
  UI.ACT.rtall = () => {
    const off = G.ret().off; if (!off) return;
    const b = $('#rtall'); if (b) b.disabled = true;
    off.cards.forEach((c, i) => { if (!c.st) setTimeout(() => { if (G.ret().off === off) doFlip(i); }, 230 * i); });
  };

  /* ================= 1B.2 calendário de 7 dias ================= */
  const calTile = (i, done, nowDay, ok) => {
    const d = G.CAL[i], day = i + 1, st = day <= done ? 'done' : day === nowDay && ok ? 'now' : 'lat';
    return '<div class="ct ' + st + (day === 7 ? ' d7' : '') + '"><small>DIA ' + day + '</small>' + ic(d.i) + '<b>' + d.n + '</b>' + (st === 'now' ? '<i>' + d.d + '</i>' : '') + '</div>';
  };
  UI.calModal = (res) => {
    const st = G.calState(), c = G.ret().cal, done = st.got ? c.ld : c.n, nxt = st.got ? (c.ld >= 7 ? 1 : c.ld + 1) : st.next;
    let h = '<div class="eyebrow">Calendário de Aurora' + (c.cyc ? ' · ciclo ' + (c.cyc + 1) : '') + '</div><h2>Um presente por dia</h2>' +
      '<p class="lead" style="margin-bottom:0">' + (st.ok ? 'O presente do dia ' + st.next + ' espera por você.' : 'O presente de hoje já está com você.') + ' Faltou um dia? O calendário espera: nada se perde e nada volta ao começo.</p><div class="calg">';
    for (let i = 0; i < 7; i++) h += calTile(i, done, st.next, st.ok);
    h += '</div>';
    if (res) h += '<div class="calres"><b>Dia ' + res.day + ' recebido!</b>' + chips(res.p) + '</div>';
    if (st.ok) h += '<div class="acts"><button class="btn" data-a="mclose">Agora não</button><button class="btn pri" data-a="calgo">' + ic('gift') + 'Receber o dia ' + st.next + '</button></div>';
    else h += '<p class="calnote">Próximo presente amanhã: ' + G.CAL[nxt - 1].n + '.</p><div class="acts"><button class="btn pri" data-a="mclose">Fechar</button></div>';
    UI.modal(h);
  };
  UI.ACT.cal = () => UI.calModal();
  UI.ACT.calgo = () => {
    const r = G.calClaim(); if (!r) return UI.calModal();
    const big = r.it && r.it.rar >= 3;
    G.sfx(r.day >= 7 ? 'reveal2' : 'rare');
    if (big) { UI.closeModal(); UI.toast('Baú Lendário aberto! ' + G.itemName(r.it) + '.', 'epic', 'crown'); }
    else { UI.calModal(r); UI.toast('Dia ' + r.day + ' do calendário recebido.', 'good', 'gift'); }
  };
  /* cartão no topo da aba Missões › Contratos */
  UI.calCard = () => {
    const st = G.calState(), c = G.ret().cal, done = st.got ? c.ld : c.n, pips = [];
    for (let i = 1; i <= 7; i++) pips.push('<i style="flex:1;height:6px;background:' + (i <= done ? 'var(--gold)' : 'rgba(255,255,255,.12)') + '"></i>');
    return '<div class="card hl"><div class="row"><span class="thumb sm" style="display:grid;place-items:center;font-size:20px;color:var(--gold2)">' + ic('gift') + '</span><div class="gr"><h3>Calendário de Aurora <small>' + (st.ok ? 'dia ' + st.next + ' de 7' : 'hoje recebido') + '</small></h3><p>Um presente por dia real. O 7º é um Baú Lendário. Faltar não pune.</p></div><button class="btn ' + (st.ok ? 'pri' : '') + '" data-a="cal">' + (st.ok ? 'Receber' : 'Ver') + '</button></div><div style="display:flex;gap:3px;margin-top:8px">' + pips.join('') + '</div></div>';
  };

  /* ================= 1B.4 faixa da semana temática ================= */
  UI.weekModal = () => {
    const w = G.week(); if (w.id === 'none') return;
    const nx = [1, 2, 3].map((n) => G.weekNext(n));
    UI.modal('<div class="eyebrow">Semana temática</div><h2>' + esc(w.name) + '</h2><div class="wkico" style="--wc:' + w.col + ';--wg:' + rgba(w.col, 0.4) + '">' + ic(w.icon) + '</div>' +
      '<p class="lead">' + esc(w.desc) + '</p><div class="grid3" style="grid-template-columns:1fr 1fr"><div class="stat"><small>Bônus</small><b class="gold" style="font-size:15px">' + esc(w.eff) + '</b></div><div class="stat"><small>Termina em</small><b>' + G.fmtLeft(w.left) + '</b></div></div>' +
      '<p class="calnote" style="margin-bottom:0">A semana vira na segunda-feira, à meia-noite, pelo relógio do seu aparelho. Depois dela:</p><div class="wkn">' + nx.map((x) => '<span style="color:' + x.col + '">' + ic(x.icon) + '<em style="font-style:normal;overflow:hidden;text-overflow:ellipsis">' + esc(x.short) + '</em></span>').join('') + '</div>' +
      '<div class="acts"><button class="btn pri" data-a="mclose">Entendi</button></div>', { pause: false });
  };
  UI.ACT.week = () => UI.weekModal();
  UI.ACT.sorte = () => UI.toast('Sorte: +50% de espólio por mais ' + Math.ceil(G.sorteLeft()) + ' s.', 'good', 'spark');
  const mmss = (s) => { s = Math.ceil(s); return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60); };
  let lastWk = '', lastSo = '', lastDot = -1;
  const paintHud = () => {
    const wk = $('#hudx .wk'), so = $('#hudx .sorte'); if (!wk || !G.S) return;
    const w = G.week();
    if (w.id === 'none') { wk.style.display = 'none'; lastWk = ''; }
    else {
      const t = w.id + '|' + G.fmtLeft(w.left);
      if (t !== lastWk) { lastWk = t; wk.style.display = ''; wk.style.setProperty('--wc', w.col); wk.style.setProperty('--wl', rgba(w.col, 0.5)); wk.innerHTML = ic(w.icon) + '<b>' + esc(w.name).replace(/^(Semana d[ao]s? )/, '<span class="tm">$1</span>') + '</b><small><span class="tm">termina em </span>' + G.fmtLeft(w.left) + '</small>'; }
    }
    const sl = G.sorteLeft(), st = sl > 0 ? mmss(sl) : '';
    if (st !== lastSo) { lastSo = st; so.classList.toggle('on', !!st); so.innerHTML = st ? ic('spark') + 'Sorte ' + st : ''; }
    const ok = G.calState().ok ? 1 : 0;
    if (ok !== lastDot) { lastDot = ok; const f = $('#fab-cal'); if (f) f.classList.toggle('has', !!ok); }
  };
  const bd0 = UI.build;
  UI.build = () => {
    bd0();
    const hud = $('#hud'), z = $('#zonechip'), fl = $('#fabs-l');
    if (hud && !$('#hudx')) { const row = document.createElement('div'); row.id = 'hudx'; row.innerHTML = '<button class="wk" data-a="week"></button><button class="sorte" data-a="sorte"></button>'; hud.insertBefore(row, z); }
    if (fl && !$('#fab-cal')) fl.insertAdjacentHTML('beforeend', '<button class="fab glass" data-a="cal" id="fab-cal">' + ic('gift') + '<i class="fdot"></i></button>');
  };
  const mb0 = UI.badges.missoes;
  UI.badges.missoes = () => mb0() + (G.calState().ok ? 1 : 0);

  /* ================= fila: retorno interrompido e calendário do dia ================= */
  let lastClose = 0, startAt = 0;
  const cm0 = UI.closeModal;
  UI.closeModal = () => { lastClose = performance.now(); cm0(); };
  G.on('start', () => { startAt = performance.now(); lastLuckyV = null; });
  const pump = () => {
    const S = G.S; if (!S || !G.M.running) return;
    const r = G.ret();
    if (r.off && r.off.cards && r.off.cards.length) UI.queueModal(UI.PRIO.retorno, () => { const o = G.ret().off; if (!o || !o.cards || !o.cards.length) return false; UI.offlineModal(o); }, 'retorno');   // a página foi fechada sem entregar: mesmas cartas
    if (!S.tut.done) return;
    const st = G.calState(), c = r.cal;
    if (st.ok && c.shown !== st.today) {
      if (!c.arm) c.arm = S.t + (S.stats.played < 400 ? 150 : 2);                               // jogo novo: só depois da apresentação, das primeiras missões e de um respiro
      if (S.t >= c.arm) { c.shown = st.today; UI.toast('O presente do dia espera no Calendário', 'epic', 'gift', 6500, 'cal'); }   // v27 (A2): era uma janela sozinha; agora um aviso com toque (o botão do calendário também pulsa)
    }
  };
  const rf1 = UI.refresh;
  UI.refresh = () => { rf1(); paintHud(); pump(); };

  /* ================= 1B.3 criatura da sorte ================= */
  const INK = '#1a1422';
  /* Luminho: um filhote de luz com antenas de estrela, asinhas e uma lua na testa (16×16, dois quadros) */
  const lumPix = (f) => {
    const p = new A.Pix(16, 16), B = '#ffe3a0', S = '#f0b648', L = '#fff8dc', W = '#c8ecff', WS = '#8ec5f5', GOLD = '#ffd35a', PINK = '#ff9ab0';
    if (f) { p.ell(2.1, 9.4, 2.4, 1.7, W); p.ell(13.9, 9.4, 2.4, 1.7, W); p.set(0, 9, WS); p.set(15, 9, WS); p.set(1, 8, '#ffffff'); p.set(14, 8, '#ffffff'); }
    else { p.ell(2, 6.3, 1.9, 3.3, W); p.ell(14, 6.3, 1.9, 3.3, W); p.col(0, 5, 7, WS); p.col(15, 5, 7, WS); p.set(1, 4, '#ffffff'); p.set(14, 4, '#ffffff'); }
    p.line(6, 4, 5, 2, S); p.line(10, 4, 11, 2, S); p.set(5, 1, GOLD); p.set(11, 1, GOLD); p.set(4, 1, '#fff3b0'); p.set(6, 1, '#fff3b0'); p.set(10, 1, '#fff3b0'); p.set(12, 1, '#fff3b0');
    p.ell(8, 9, 4.7, 4.5, B); p.ell(8.4, 10.7, 3.1, 2.4, L); p.row(5, 10, 13, S);
    p.set(7, 5, GOLD); p.set(8, 5, GOLD); p.set(8, 4, GOLD);
    p.rect(5, 7, 2, 3, INK); p.rect(9, 7, 2, 3, INK); p.set(5, 7, '#ffffff'); p.set(9, 7, '#ffffff'); p.set(6, 9, '#6a5a8a'); p.set(10, 9, '#6a5a8a');
    p.set(4, 10, PINK); p.set(5, 10, PINK); p.set(10, 10, PINK); p.set(11, 10, PINK);
    p.set(7, 11, INK); p.set(8, 11, INK);
    p.rect(5, 14, 2, 1, S); p.rect(9, 14, 2, 1, S);
    return p.outline(INK);
  };
  let lumCv = null;
  const lumSheet = () => {
    if (lumCv) return lumCv;
    lumCv = A.mk(32, 16); const x = lumCv.getContext('2d'); x.drawImage(lumPix(0).canvas(), 0, 0); x.drawImage(lumPix(1).canvas(), 16, 0);
    return lumCv;
  };
  UI.lumSheet = lumSheet;
  const drawLucky = (c, X, Y, z) => {
    const ctx = R.ctx, px = Math.round(X(c.x)), py = Math.round(Y(c.y)), sc = Math.max(3, Math.round(z * 2)), w = 16 * sc;
    const left = c.life - c.t, blink = left < 3.2 && Math.floor(R.t * 9) % 2;
    /* rastro de brilho */
    for (let i = 0; i < c.tr.length; i++) {
      const q = c.tr[i], k = 1 - q.a / 0.9, qx = Math.round(X(q.x) + Math.sin(i * 2.3) * z * 2), qy = Math.round(Y(q.y) + Math.cos(i * 1.7) * z * 2 + q.a * z * 6), s = Math.max(1, Math.round((1 + 2.2 * k) * z * 0.7));
      ctx.globalAlpha = k * 0.85; ctx.fillStyle = i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#ffe07a' : '#bfe9ff'; ctx.fillRect(qx - s, qy, s * 3, s); ctx.fillRect(qx, qy - s, s, s * 3);
    }
    ctx.globalAlpha = blink ? 0.45 : 1;
    /* sombra no chão e halo */
    ctx.fillStyle = 'rgba(10,16,30,.2)'; ctx.beginPath(); ctx.ellipse(px, Math.round(Y(c.y + 1.9)), 5 * z, 1.9 * z, 0, 0, 6.283); ctx.fill();
    const hr = 21 * z * (1 + 0.1 * Math.sin(R.t * 5)), g = ctx.createRadialGradient(px, py, 2, px, py, hr);
    g.addColorStop(0, 'rgba(255,238,160,.85)'); g.addColorStop(0.45, 'rgba(255,208,90,.38)'); g.addColorStop(1, 'rgba(255,214,110,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, hr, 0, 6.283); ctx.fill();
    /* anel de toque */
    const rk = (R.t * 0.8) % 1; ctx.globalAlpha = (blink ? 0.45 : 1) * (1 - rk) * 0.55; ctx.strokeStyle = '#ffe9a0'; ctx.lineWidth = Math.max(1, z * 0.7); ctx.beginPath(); ctx.arc(px, py, (11 + 12 * rk) * z, 0, 6.283); ctx.stroke();
    ctx.globalAlpha = blink ? 0.45 : 1;
    /* corpo */
    const fr = Math.floor(R.t * 7) % 2, hop = Math.round(Math.sin(R.t * 7) * z * 0.6);
    ctx.save(); ctx.translate(px, py + hop); if (c.dir < 0) ctx.scale(-1, 1);
    ctx.drawImage(lumSheet(), fr * 16, 0, 16, 16, -w / 2, -w / 2, w, w);
    ctx.restore();
    /* estrelinhas em volta */
    for (let i = 0; i < 3; i++) {
      const a = R.t * 2.2 + i * 2.094, sx = Math.round(px + Math.cos(a) * 11 * z), sy = Math.round(py + Math.sin(a) * 8 * z - 2 * z), s = Math.max(1, Math.round(z * (0.8 + 0.5 * Math.sin(R.t * 6 + i * 2))));
      ctx.fillStyle = i === 1 ? '#bfe9ff' : '#fff3b0'; ctx.fillRect(sx - s, sy, s * 3, s); ctx.fillRect(sx, sy - s, s, s * 3);
    }
    ctx.globalAlpha = 1;
    if (Math.random() < 0.5) R.burst(c.x + G.rnd(-0.3, 0.3), c.y + G.rnd(0, 0.5), 1, ['#ffe07a', '#ffffff', '#bfe9ff'], 0.5, 0.7, 0.4);
  };
  const dm0 = R.dynMore;
  R.dynMore = (dyn, vx0, vx1, vy0, vy1) => { if (dm0) dm0(dyn, vx0, vx1, vy0, vy1); const c = G.lucky; if (c && !c.done) dyn.push({ y: c.y + 2.5, k: 'x', e: c, f: drawLucky }); };
  /* toque: prioridade sobre heróis e monstros, e uma área generosa para o dedo */
  const pk0 = R.pick;
  R.pick = (px, py) => {
    const c = G.lucky;
    if (c && !c.done) { const w = R.screenToWorld(px, py); if (Math.hypot(c.x - w[0], c.y - w[1]) < 1.7) return { type: 'lucky', ref: c }; }
    return pk0(px, py);
  };
  UI.luckyTap = () => { G.luckyTap(); };
  /* retângulo visível do mapa (em ladrilhos), sem o HUD, a barra da jornada e a ficha aberta. null = o mapa está coberto */
  let lastLuckyV = null, lastLuckyT = 0;
  G.luckyView = () => {
    const now = performance.now(); if (lastLuckyV !== null && now - lastLuckyT < 120) return lastLuckyV || null;
    lastLuckyT = now;
    const w = window.innerWidth, h = window.innerHeight; let right = w - 12;
    if (UI.sheet) { if (w < 860) return (lastLuckyV = false, null); right = w - 450; }
    const hud = $('#hud'), top = (hud ? hud.getBoundingClientRect().bottom : 200) + 16, bot = h - 62 - 118;
    if (bot - top < 150 || right - 12 < 160) return (lastLuckyV = false, null);
    const a = R.screenToWorld(12, top), b = R.screenToWorld(right, bot);
    lastLuckyV = { x0: a[0], y0: a[1], x1: b[0], y1: b[1] };
    return lastLuckyV;
  };
  const fm0 = R.fxMore;
  R.fxMore = (f) => {
    if (f.t === 'lkpuf') {
      R.fxs.push({ t: 'ring', x: f.x, y: f.y, c: '#fff3b0', r: 1.5, age: 0, life: 0.5, fill: 1 });
      R.burst(f.x, f.y, 26, ['#ffe07a', '#ffffff', '#bfe9ff'], 2.4, 0.9, 1.2);
    } else if (f.t === 'lkget') {
      R.fxs.push({ t: 'ring', x: f.x, y: f.y, c: '#ffd35a', r: 2.6, age: 0, life: 0.6, fill: 1 });
      R.fxs.push({ t: 'ring', x: f.x, y: f.y, c: '#ffffff', r: 1.6, age: -0.1, life: 0.5 });
      R.fxs.push({ t: 'pillar', x: f.x, y: f.y + 0.8, c: '#ffe07a', age: 0, life: 0.9 });
      R.burst(f.x, f.y, 40, ['#ffd35a', '#ffffff', '#ffe07a', '#bfe9ff'], 4.2, 1.1, 2);
    } else if (f.t === 'lkrain') {
      for (let i = 0; i < 8; i++) G.addFx({ t: 'coin', x: f.x + G.rnd(-1.8, 1.8), y: f.y - G.rnd(0.2, 1.6), n: 9999 });
    } else if (fm0) fm0(f);
  };
  /* sons novos (a tabela de sons do 70-audio expõe tone/noise/seq) */
  const AU = G.AU;
  if (AU && AU.SFX) {
    const S = AU.SFX, tone = AU.tone, noise = AU.noise, seq = AU.seq;
    S.flip = (t) => { noise(t, 0.08, 0.2, 2600, 0.7, 'highpass'); tone(480, t, 0.08, 'triangle', 0.1, 980); };
    S.luminho = (t) => { seq([1568, 2093, 2637, 3136, 2637], 0.07, 'sine', 0.09, 0.32); };
    S.puf = (t) => { noise(t, 0.2, 0.22, 1400, 0.7, 'lowpass'); tone(520, t, 0.16, 'sine', 0.1, 170); };
    S.sorte = (t) => { seq([784, 1047, 1319, 1568, 2093], 0.055, 'triangle', 0.14, 0.4); tone(3136, t + 0.28, 0.4, 'sine', 0.06); };
    S.chuva = (t) => { for (let i = 0; i < 7; i++) { tone(1568 + (i % 3) * 260, t + i * 0.06, 0.07, 'square', 0.05); tone(2093, t + i * 0.06 + 0.04, 0.09, 'square', 0.04); } };
  }
  G.on('lucky', (d) => {
    if (d.t === 'spawn') { G.sfx('luminho'); UI.toast('Uma criatura da sorte cruzou Aurora! Toque nela!', 'epic', 'star'); }
    else if (d.t === 'puf') { G.addFx({ t: 'lkpuf', x: d.x, y: d.y }); G.sfx('puf'); UI.toast('A criatura da sorte sumiu com um puf…', 'info', 'star'); }
    else if (d.t === 'caught') {
      G.addFx({ t: 'lkget', x: d.x, y: d.y });
      if (d.kind === 'chuva') { G.addFx({ t: 'lkrain', x: d.x, y: d.y }); G.sfx('chuva'); G.addFx({ t: 'text', x: d.x, y: d.y - 1, s: '+' + G.fmt(d.p.gold), c: '#ffd35a' }); }
      else if (d.kind === 'nucleo') { G.sfx('sorte'); G.addFx({ t: 'text', x: d.x, y: d.y - 1, s: '+' + d.p.nucleos + ' Núcleo' + (d.p.nucleos > 1 ? 's' : ''), c: '#c8a0ff' }); }
      else if (d.kind === 'sorte') { G.sfx('sorte'); G.addFx({ t: 'text', x: d.x, y: d.y - 1, s: 'SORTE!', c: '#ffe07a' }); }
      else { G.sfx('sorte'); G.addFx({ t: 'text', x: d.x, y: d.y - 1, s: 'Materiais!', c: '#bfe9ff' }); }
      R.shake = Math.max(R.shake || 0, 3);
      UI.toast(d.text, 'good', d.kind === 'chuva' ? 'coin' : d.kind === 'nucleo' ? 'core' : d.kind === 'mats' ? 'bag' : 'spark');
    }
  });
})();

;
