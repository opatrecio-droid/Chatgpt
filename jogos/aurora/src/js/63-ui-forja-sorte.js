/* 63-ui-forja-sorte: v23 — inscrições nas fichas, reforja, cerimônia de raridade e Garantia do Portal. */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const UI = G.UI, A = G.A, R = G.R, ic = UI.ic, esc = UI.esc, $ = UI.$;

  /* ---------- estilo ---------- */
  const css = document.createElement('style');
  css.textContent = [
    '.insl{display:flex;flex-direction:column;gap:4px;margin-top:8px}',
    '.ins{position:relative;display:flex;align-items:center;gap:7px;min-height:26px;padding:3px 8px;border-radius:9px;background:rgba(255,255,255,.05);border-left:3px solid var(--qc);font-size:11.5px;line-height:1.25;overflow:hidden}',
    '.ins .pp{flex:none;font-size:7.5px;letter-spacing:1px;color:var(--qc);white-space:nowrap}',
    '.ins b{flex:none;color:var(--qc);font-weight:800;white-space:nowrap}',
    '.ins em{font-style:normal;color:#cfd5e4;min-width:0}',
    '.ins.q5{background:linear-gradient(90deg,rgba(255,211,90,.22),rgba(255,211,90,.06));box-shadow:0 0 12px rgba(255,211,90,.22),inset 0 0 0 1px rgba(255,211,90,.42)}',
    '.ins.q5 b{text-shadow:0 0 8px rgba(255,211,90,.75)}',
    '.ins.q5::after{content:"";position:absolute;top:0;bottom:0;width:38%;left:-45%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.34),transparent);animation:insh 2.8s ease-in-out infinite}',
    '@keyframes insh{0%,55%{left:-45%}100%{left:120%}}',
    '.ins.none{border-left-color:#556;color:var(--mut);font-style:italic;background:rgba(255,255,255,.03)}',
    '.insb{display:flex;justify-content:flex-end;margin-top:6px}',
    '.hins{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}',
    '.hins .pill b{color:var(--gold2)}',
    '#rflash{position:absolute;inset:0;z-index:70;pointer-events:none;opacity:0;background:radial-gradient(circle at 50% 44%,rgba(255,255,255,.95) 0%,var(--fc,#fff) 32%,transparent 80%)}',
    '#rflash.on{animation:rfl .95s ease-out}#rflash.on.big{animation:rflb 1.5s ease-out}',
    '@keyframes rfl{0%{opacity:0}10%{opacity:.8}100%{opacity:0}}@keyframes rflb{0%{opacity:0}8%{opacity:1}30%{opacity:.7}100%{opacity:0}}',
    '.mbox.rcbox{background:none;border:0;box-shadow:none;padding:0;overflow:visible;width:min(100%,334px)}',
    '.mbox.rcbox::before,.mbox.rcbox::after{display:none}',
    '.rc{position:relative;perspective:1200px;width:100%}',
    '.rc.big:not(.flipped){animation:rcwob .45s ease-in-out infinite}',
    '@keyframes rcwob{0%,100%{transform:rotate(-1.4deg)}50%{transform:rotate(1.4deg)}}',
    '.rc-flip{position:relative;transform-style:preserve-3d;-webkit-transform-style:preserve-3d;transform:rotateY(180deg);transition:transform .95s cubic-bezier(.3,1.2,.4,1);cursor:pointer}',
    '.rc.flipped .rc-flip{transform:rotateY(0)}',
    '.rc-face{backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:20px;border:2px solid var(--rc);background:linear-gradient(180deg,#252f58,#10152a);box-shadow:0 0 30px var(--rcg),0 18px 50px rgba(0,0,0,.6)}',
    '.rc-front{position:relative;padding:18px 14px 16px;text-align:center}',
    '.rc-back{position:absolute;inset:0;transform:rotateY(180deg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;overflow:hidden;background:radial-gradient(circle at 50% 46%,var(--rcg),transparent 62%),repeating-conic-gradient(from 0deg at 50% 46%,rgba(255,255,255,.07) 0 9deg,transparent 9deg 18deg),linear-gradient(180deg,#252f58,#10152a)}',
    '.rc-back b{font-size:74px;line-height:1;color:var(--rc);text-shadow:0 0 22px var(--rc),0 0 50px var(--rc);animation:rcpulse 1.1s ease-in-out infinite alternate}',
    '.rc-back span{font-family:"Aurora Cinzel",serif;font-size:11.5px;letter-spacing:.28em;text-transform:uppercase;color:var(--gold2);opacity:.9}',
    '@keyframes rcpulse{from{transform:scale(.9);opacity:.75}to{transform:scale(1.08);opacity:1}}',
    '.rc-rar{font-family:"Aurora Cinzel",serif;font-weight:700;letter-spacing:.3em;font-size:13px;color:var(--rc);text-shadow:0 0 12px var(--rc)}',
    '.rc.big .rc-rar{font-size:27px;letter-spacing:.14em;text-shadow:0 0 14px var(--rc),0 0 34px var(--rc);animation:rcpop .7s cubic-bezier(.2,1.5,.4,1) both}',
    '@keyframes rcpop{from{transform:scale(.4);opacity:0}}',
    '.rc-ico{display:flex;justify-content:center;margin:12px 0 6px;filter:drop-shadow(0 0 14px var(--rc))}',
    '.rc-name{font-family:"Aurora Cinzel",serif;font-size:19px;letter-spacing:.04em;margin-top:2px}',
    '.rc-tag{font-size:11.5px;font-style:italic;color:var(--mut);margin:3px 6px 0}',
    '.rc-line{font-size:12.5px;color:#cfd5e4;margin:8px 0 0}',
    '.rc-front .insl{text-align:left;margin-top:12px}',
    '.rc-acts{display:flex;gap:8px;margin-top:14px}.rc-acts .btn{flex:1}',
    '.rc-q{text-align:center;color:var(--mut);font-size:11.5px;margin-top:8px}',
    '.rp{position:absolute;left:50%;top:46%;width:var(--s);height:var(--s);margin:-2px;border-radius:50%;background:var(--rc);box-shadow:0 0 9px var(--rc);opacity:0;pointer-events:none}',
    '.rc.go .rp{animation:rpb 1.6s ease-out var(--d) forwards}',
    '@keyframes rpb{0%{opacity:1;transform:translate(0,0) scale(1.2)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.2)}}',
    '.gar{margin:-2px 0 9px;padding:8px 11px 9px;border-radius:12px;background:rgba(0,0,0,.22);border:1px dashed var(--line)}',
    '.gar .gh{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}.gar .gh b{font-family:"Aurora Cinzel",serif;color:var(--gold2);font-size:13px;letter-spacing:.04em}.gar .gh span{font-size:11.5px;color:var(--mut)}',
    '.gar .gp{display:flex;gap:3px;margin-top:6px}.gar .gp i{flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.12)}.gar .gp i.on{background:linear-gradient(90deg,#b98ff5,#e6d0ff)}',
    '.gar.rdy{border:1px solid #b98ff5;box-shadow:0 0 16px rgba(185,143,245,.45);animation:garp 1.2s ease-in-out infinite alternate}.gar.rdy .gh span{color:#e6d0ff;font-weight:800}.gar.rdy .gp i{background:linear-gradient(90deg,#f7dc92,#fff3c4)}',
    '@keyframes garp{from{box-shadow:0 0 8px rgba(185,143,245,.3)}to{box-shadow:0 0 20px rgba(185,143,245,.7)}}',
    '.gnote{margin:8px 0 0;padding:7px 10px;border-radius:11px;text-align:center;font-size:12.5px;font-weight:800;color:#e6d0ff;background:rgba(185,143,245,.16);border:1px solid #b98ff5}',
    '.rfgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}',
    '.rfcol{min-width:0;border-radius:12px;padding:8px 7px 7px;background:rgba(0,0,0,.22);border:1px solid var(--line2)}',
    '.rfcol h4{margin:0 0 6px;font-family:"Aurora Cinzel",serif;font-size:11px;letter-spacing:.2em;text-align:center;color:var(--mut)}',
    '.rfcol.new{border-color:var(--line);background:linear-gradient(180deg,rgba(226,182,89,.12),rgba(0,0,0,.2))}',
    '.rfcol.new h4{color:var(--gold2)}',
    '.rfcol .insl{margin-top:0;gap:5px}',
    '.rfcol .ins{flex-wrap:wrap;gap:1px 6px;padding:4px 6px}',
    '.rfcol .ins em{flex-basis:100%;font-size:11px}',
    '.rfcol.new .ins{animation:rfin .5s cubic-bezier(.2,1.3,.4,1) backwards;animation-delay:calc(var(--i,0) * .28s + .1s)}',
    '@keyframes rfin{from{opacity:0;transform:translateX(14px) scale(.96)}}',
    '.rfcol .none{font-size:11.5px;text-align:center;border-left:0}',
    '.rfperf{margin-top:8px;text-align:center;font-family:"Aurora Cinzel",serif;font-weight:700;letter-spacing:.14em;font-size:12px;color:#ffd35a;text-shadow:0 0 12px rgba(255,211,90,.85);animation:rfp 1.1s ease-in-out infinite alternate}',
    '@keyframes rfp{from{opacity:.65;transform:scale(.98)}to{opacity:1;transform:scale(1.04)}}',
    '.rfdelta{margin-top:10px;text-align:center;font-size:12.5px;color:#cfd5e4}',
    '.rfdelta b{font-weight:900}',
  ].join('\n');
  document.head.appendChild(css);

  /* ---------- inscrições em HTML ---------- */
  const pips = (q) => '●'.repeat(q) + '○'.repeat(5 - q);
  const insRow = (it, e) => {
    const d = G.INS[e[0]]; if (!d) return '';
    const q = e[1];
    return '<div class="ins q' + q + '" style="--qc:' + G.INS_QCOL[q] + '" title="Qualidade ' + q + ' de 5 · ' + G.INS_Q[q] + '"><span class="pp">' + pips(q) + '</span><b>' + (UI.famTag ? UI.famTag(e[0]) : '') + d.name + '</b><em>' + esc(G.insText(it, e[0], q)) + '</em></div>';   // v26 (4B.1): ícone da família
  };
  /* lista de inscrições de uma peça. o.card: acrescenta o atalho de Reforja (Armazém) */
  UI.insList = (it, list) => (list || []).map((e) => insRow(it, e)).join('');
  UI.insHtml = (it, o) => {
    o = o || {};
    if (!it || it.rar < 1) return '';
    let h = '';
    if (it.ins && it.ins.length) h = UI.insList(it, it.ins);
    else if (!it.ins) h = '<div class="ins none">Peça antiga, sem inscrições.</div>';
    if (!h) return '';
    if (o.card) h += '<div class="insb"><button class="btn sm" data-a="mrf:' + it.id + ':0">' + ic('spark') + 'Reforjar inscrições</button></div>';
    return '<div class="insl">' + h + '</div>';
  };
  /* inscrições somadas de um herói (ficha) */
  UI.insHero = (x) => {
    const T = G.insHero(x); if (!G.insAny(T)) return '';
    const pills = [];
    for (const k in G.INS_TOT) if (T[k]) { const v = T[k] * 100; pills.push('<span class="pill">' + G.INS_TOT[k][0] + ' <b>' + (k === 'cdr' ? '-' : '+') + (v < 10 ? v.toFixed(1) : Math.round(v)).toString().replace('.', ',') + '%</b></span>'); }
    return '<div class="sec">Inscrições das peças</div><div class="card" style="padding-top:4px"><div class="hins">' + pills.join('') + '</div></div>';
  };
  UI.forjaNote = () => '<p class="mut" style="font-size:11.5px;margin:0 2px 8px">Peças <span class="rar1">Incomuns</span> ou melhores nascem com <b class="gold">inscrições</b> sorteadas: 1 (Incomum), 1–2 (Raro), 2 (Épico), 3 (Lendário), 4 (Mítico). Cada uma tem qualidade de 1 a 5; a <b class="gold">perfeita</b> brilha. Obra-prima sorteia a qualidade duas vezes e fica com a melhor.</p>';

  /* ---------- ficha da peça (Aprimorar) ---------- */
  const findItem = (id, hid) => { const S = G.S; if (hid) { const h = S.heroes.find((x) => x.id === hid); if (h) for (const k in h.gear) if (h.gear[k] && h.gear[k].id === id) return h.gear[k]; } return S.inv.find((i) => i.id === id); };
  UI.findItem = findItem;
  UI.itemModal = (id, hid, msg) => {
    const it = findItem(id, hid); if (!it) return;
    const c = G.upgradeCost(it), max = Math.min(15, 4 + G.bLvl('ferraria')), S = G.S;
    const nxt = Object.assign({}, it, { plus: it.plus + 1 });
    const can = G.bOk('ferraria') && it.plus < max && S.gold >= c.gold && G.hasRes(c.cost);
    const rf = G.canReforge(it);
    const rfOff = !rf.ok && !rf.pending && !rf.c;
    const rfBtn = it.rar < 1 ? '' : '<button class="btn vio wide" style="margin-top:10px" data-a="mrf:' + id + ':' + (hid || 0) + '"' + (rfOff ? ' disabled' : '') + '>' + ic('spark') + (it.rfp ? 'Ver reforja pendente' : 'Reforjar inscrições') + '</button>' + (rfOff ? '<p class="mut" style="text-align:center;font-size:11.5px;margin-top:5px">' + rf.why + '.</p>' : '');
    UI.modal('<div class="eyebrow">' + G.RAR[it.rar] + '</div><h2 class="rar' + it.rar + '">' + G.itemName(it) + '</h2><div style="display:flex;justify-content:center;margin:12px 0">' + UI.gi(it).replace('class="gi', 'style="width:64px;height:64px;background-size:52px 52px" class="gi') + '</div><p class="lead" style="margin-bottom:4px">' + UI.itemLine(it) + (it.plus < max ? '<br><span class="good">+' + (it.plus + 1) + ': ' + UI.itemLine(nxt) + '</span>' : '<br>No limite da Ferraria (+' + max + ').') + '</p>' + UI.insHtml(it, { modal: 1 }) + (msg ? '<p class="lead ' + (msg.win ? 'good' : 'bad') + '" style="font-weight:800;margin-bottom:0">' + (msg.win ? 'Aprimorado!' : 'A têmpera falhou. Os materiais se perderam.') + '</p>' : '') +
      (it.plus < max ? UI.cost(c.gold, c.cost, '<span class="cost">chance ' + Math.round(c.chance * 100) + '%</span>') : '') + '<div class="acts"><button class="btn" data-a="mclose">Fechar</button><button class="btn pri" data-a="mupg:' + id + ':' + (hid || 0) + '"' + (can ? '' : ' disabled') + '>' + ic('up') + 'Aprimorar</button></div>' + rfBtn, { pause: false });
  };

  /* ---------- Reforja ---------- */
  /* duas vistas na mesma janela: a introdução (custo e inscrições atuais) e o antes/depois (manter ou aceitar) */
  UI.reforgeModal = (id, hid, msg) => {
    const it = findItem(id, hid); if (!it) return;
    const S = G.S, tag = id + ':' + (hid || 0);
    if (it.rfp) {
      const perfect = G.insPerfect(it.rfp), d = G.reforgeDelta(it), dp = Math.round(Math.abs(d) * 100);
      const col = (list, cls) => '<div class="rfcol' + (cls ? ' ' + cls : '') + '"><h4>' + (cls ? 'DEPOIS' : 'ANTES') + '</h4>' + (list && list.length ? '<div class="insl">' + list.map((e, i) => insRow(it, e).replace('<div class="ins ', '<div style="--i:' + i + '" class="ins ')).join('') + '</div>' : '<div class="ins none">Sem inscrições</div>') + '</div>';
      UI.modal('<div class="eyebrow">Reforja · Ferraria</div><h2 class="rar' + it.rar + '">' + G.itemName(it) + '</h2><p class="lead" style="margin:6px 4px 0">As inscrições foram sorteadas de novo. <b>Manter</b> fica com as de agora; <b>Aceitar</b> troca pelas novas.</p><div class="rfgrid">' + col(it.ins, '') + col(it.rfp, 'new') + '</div>' +
        (perfect ? '<div class="rfperf">★ INSCRIÇÃO PERFEITA! ★</div>' : '') +
        UI.cmpLine(it) +
        '<div class="acts"><button class="btn" data-a="mrfk:' + tag + '">Manter</button><button class="btn pri" data-a="mrfa:' + tag + '">' + ic('check') + 'Aceitar</button></div>', { pause: false, lock: true });
      if (perfect) { G.sfx('perfect'); }
      return;
    }
    const r = G.canReforge(it), c = r.c || G.reforgeCost(it), n = it.rf || 0;
    UI.modal('<div class="eyebrow">Reforja · Ferraria</div><h2 class="rar' + it.rar + '">' + G.itemName(it) + '</h2><div style="display:flex;justify-content:center;margin:12px 0 4px">' + UI.gi(it).replace('class="gi', 'style="width:56px;height:56px;background-size:46px 46px" class="gi') + '</div>' +
      (msg ? '<p class="lead ' + (msg.cls || '') + '" style="font-weight:800;margin:8px 4px 0">' + msg.t + '</p>' : '') +
      '<p class="lead" style="margin:8px 4px 0">Sorteia de novo <b>todas</b> as inscrições da peça. Você vê o antes e o depois e escolhe manter ou aceitar. ' + (n ? 'Esta peça já foi reforjada ' + n + (n === 1 ? ' vez' : ' vezes') + ': o custo sobe a cada uma.' : 'O custo sobe a cada reforja da mesma peça.') + '</p>' + UI.insHtml(it, { modal: 1 }) +
      UI.cost(c.gold, { po_reforja: c.po }) + '<p class="mut" style="text-align:center;font-size:11.5px;margin-top:6px">Você tem ' + G.fmt(S.res.po_reforja || 0) + ' Pó de Reforja. Ele sai do desmonte de peças.</p>' +
      (r.ok ? '' : '<p class="lead bad" style="font-weight:800;margin:8px 4px 0">' + r.why + '</p>') +
      '<div class="acts"><button class="btn" data-a="mclose">Fechar</button><button class="btn vio" data-a="mrfgo:' + tag + '"' + (r.ok ? '' : ' disabled') + '>' + ic('spark') + 'Reforjar</button></div>', { pause: false });
  };
  Object.assign(UI.ACT, {
    mrf: (a) => UI.reforgeModal(+a[0], +a[1]),
    mrfgo: (a) => { const it = findItem(+a[0], +a[1]); if (!it) return; const r = G.reforgeRoll(it); if (!r.ok) return UI.toast(r.why, 'bad'); UI.reforgeModal(+a[0], +a[1]); UI.sheetDirty(); },
    mrfk: (a) => { const it = findItem(+a[0], +a[1]); if (!it) return; G.reforgeKeep(it); UI.reforgeModal(+a[0], +a[1], { t: 'Inscrições mantidas.', cls: '' }); UI.sheetDirty(); },
    mrfa: (a) => { const it = findItem(+a[0], +a[1]); if (!it) return; const r = G.reforgeAccept(it); UI.reforgeModal(+a[0], +a[1], { t: r && r.perfect ? 'Nova inscrição perfeita aceita!' : 'Novas inscrições aceitas.', cls: 'good' }); UI.sheetDirty(); },
  });
  /* ---------- cerimônia de raridade ---------- */
  /* Épico+ vira uma carta que "vira" para revelar nome, raridade e inscrições. Cartas entram numa fila: nunca duas ao mesmo
     tempo, e só abrem quando não há outra janela na tela (a apresentação, um evento, o Portal…). */
  const TAGS = { 3: 'A Ferraria cantou.', 4: 'Os martelos silenciaram. Algo antigo despertou.', 5: 'As Duas Luas se alinharam sobre a bigorna.' };
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };
  let Q = [], cur = null, cidN = 0;
  const flash = (col, big) => {
    let f = $('#rflash');
    if (!f) { f = document.createElement('div'); f.id = 'rflash'; ($('#app') || document.body).appendChild(f); }
    f.style.setProperty('--fc', col); f.className = ''; void f.offsetWidth; f.className = big ? 'on big' : 'on';
  };
  const cardHtml = (it, cid) => {
    const big = it.rar >= 4, col = G.RAR_COLOR[it.rar], n = big ? 30 : 12, parts = [];
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, r = 80 + Math.random() * (big ? 190 : 110); parts.push('<i class="rp" style="--dx:' + Math.round(Math.cos(a) * r) + 'px;--dy:' + Math.round(Math.sin(a) * r * 0.9) + 'px;--s:' + (3 + Math.floor(Math.random() * 4)) + 'px;--d:' + (Math.random() * 0.3).toFixed(2) + 's"></i>'); }
    const ico = UI.gi(it).replace('class="gi', 'style="width:78px;height:78px;background-size:62px 62px" class="gi');
    const label = big ? G.RAR[it.rar].toUpperCase() + '!' : '✦ ' + G.RAR[it.rar].toUpperCase() + ' ✦';
    return '<div class="rc' + (big ? ' big' : '') + '" data-cid="' + cid + '" style="--rc:' + col + ';--rcg:' + rgba(col, 0.5) + '">' + parts.join('') +
      '<div class="rc-flip" data-a="rcflip"><div class="rc-face rc-back"><b>✦</b><span>Toque para revelar</span></div>' +
      '<div class="rc-face rc-front"><div class="rc-rar">' + label + '</div><div class="rc-ico">' + ico + '</div><h3 class="rc-name rar' + it.rar + '">' + G.itemName(it) + '</h3><p class="rc-tag">' + TAGS[it.rar] + '</p>' +
      '<p class="rc-line">' + G.SLOT[G.GEAR[it.type].kind] + ' · ' + UI.itemLine(it) + '</p>' + UI.insHtml(it, {}) + '</div></div></div>' +
      '<div class="rc-acts"><button class="btn" data-a="rclock:' + it.id + '" id="rclock">' + ic(it.lock ? 'lock' : 'unlock') + (it.lock ? 'Reservada' : 'Reservar') + '</button><button class="btn pri" data-a="mclose">Continuar</button></div>' +
      '<div class="rc-q">' + (Q.length ? '+' + Q.length + ' na fila' : '') + '</div>';
  };
  const showCard = (d) => {
    const it = d.it, big = it.rar >= 4, cid = ++cidN;
    cur = { cid, d };
    flash(G.RAR_COLOR[it.rar], big);
    UI.modal(cardHtml(it, cid), { pause: false, lock: true, onClose: () => { cur = null; setTimeout(pump, 350); } });
    const box = $('#modal .mbox'); if (box) box.classList.add('rcbox');
    if (big) R.shake = Math.max(R.shake || 0, 4);
    setTimeout(() => flip(cid), big ? 1050 : 700);
  };
  const flip = (cid) => {
    if (!cur || cur.cid !== cid) return;
    const rc = $('#modal .rc[data-cid="' + cid + '"]'); if (!rc || rc.classList.contains('flipped')) return;
    const it = cur.d.it;
    rc.classList.add('flipped', 'go');
    G.sfx(it.rar >= 4 ? 'reveal2' : 'reveal');
    if (it.rar >= 4) R.shake = Math.max(R.shake || 0, 5);
    if (G.insPerfect(it.ins)) setTimeout(() => G.sfx('perfect'), 500);
  };
  const pump = () => {
    if (cur) { if ($('#modal .rc[data-cid="' + cur.cid + '"]')) return; Q.unshift(cur.d); cur = null; }   // outra janela tomou o lugar: a carta volta à fila
    if (Q.length) UI.queueModal(UI.PRIO.cerimonia, () => { if (!Q.length || !G.M.running) return false; showCard(Q.shift()); }, 'cartas');
  };
  UI.ACT.rcflip = () => { if (cur) flip(cur.cid); };
  UI.ACT.rclock = (a) => { const it = G.S.inv.find((i) => i.id === +a[0]) || (cur && cur.d.it); if (!it) return; G.toggleLock(it); const b = $('#rclock'); if (b) b.innerHTML = ic(it.lock ? 'lock' : 'unlock') + (it.lock ? 'Reservada' : 'Reservar'); UI.sheetDirty(); };
  /* v27 (A2): só abre a carta quem acabou de causar a revelação (forja manual, peça pega no chão, baú aberto); o que a cidade faz sozinha (encomenda automática, peça que ninguém pegou) é só um aviso */
  G.on('reveal', (d) => { if (d.silent) return; Q.push(d); setTimeout(pump, 450); });
  const rf0 = UI.refresh; UI.refresh = () => { rf0(); pump(); };
  UI.revealTest = (it) => { Q.push({ it, silent: false, big: it.rar >= 4 }); pump(); };   // para testes e capturas
  /* ---------- Garantia do Portal ---------- */
  const rm0 = UI.recruitModal;
  UI.recruitModal = () => {
    rm0();
    const btn = $('#modal [data-a="summon:gold"]'); if (!btn) return;
    const n = Math.min(G.PITY_MAX, G.pity()), rdy = n >= G.PITY_MAX;
    btn.insertAdjacentHTML('afterend', '<div class="gar' + (rdy ? ' rdy' : '') + '"><div class="gh"><b>Garantia: ' + n + '/' + G.PITY_MAX + '</b><span>' + (rdy ? 'O próximo sorteio traz um Épico!' : 'A cada ' + G.PITY_MAX + ' sorteios sem Épico, o próximo garante um.') + '</span></div><div class="gp">' + Array.from({ length: G.PITY_MAX }, (_, i) => '<i' + (i < n ? ' class="on"' : '') + '></i>').join('') + '</div></div>');
  };
  const sm0 = UI.ACT.summon;
  UI.ACT.summon = (a) => {
    sm0(a);
    if (a[0] !== 'nucleo' && G.S.sorte && G.S.sorte.last) { const h2 = $('#modal h2'); if (h2) h2.insertAdjacentHTML('afterend', '<p class="gnote">Garantia do Portal! Um herói Épico atravessou.</p>'); G.sfx('perfect'); }
  };
})();

;
