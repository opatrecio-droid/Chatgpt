/* 6D-ui-sinergias: v26 (lote 4-B) — telas da ressonância de inscrições (ficha do herói, ficha da peça, reforja, Códex) e das
   combinações de formação (equipe da Arena, resultado do duelo, aba do Colosso). A simulação mora em 3H-sinergias.js. */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const UI = G.UI, ic = UI.ic, esc = UI.esc, $ = UI.$;
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };
  const fcv = (col) => '--fc:' + col + ';--fg:' + rgba(col, 0.2);
  const S0 = () => G.S;

  /* ---------- estilo ---------- */
  const css = document.createElement('style');
  css.textContent = [
    '.fam{display:inline-block;font-size:15px;vertical-align:-1.5px;margin-right:3px}',
    '.fam .i{display:inline-block}',
    '.rs-lead{font-size:15px;line-height:1.4;margin:0 0 4px}',
    '.rs-row{display:flex;gap:10px;padding:9px 0;border-top:var(--u) solid var(--line2)}',
    '.rs-row.first{border-top:0}',
    '.rs-ic{width:32px;height:32px;display:grid;place-items:center;flex:none;background:var(--fg);border:var(--u) solid var(--fc);color:var(--fc);font-size:16px}',
    '.rs-gr{flex:1;min-width:0}',
    '.rs-top{display:flex;align-items:baseline;gap:8px}',
    '.rs-top b{font-size:15px;color:var(--fc);letter-spacing:.02em}',
    '.rs-top em{font-style:normal;font-size:8px;font-family:var(--fc);font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--mut);flex:1}',
    '.rs-top .rs-n{font-size:15px;font-weight:900;color:#fff;flex:none}',
    '.rs-top .rs-n small{font-size:8px;font-family:var(--fc);color:var(--mut);font-weight:800}',
    '.rs-bar{display:flex;gap:3px;margin:5px 0 5px}',
    '.rs-bar i{flex:1;height:15px;background:var(--fill2);font-style:normal;font-size:8px;font-family:var(--fc);font-weight:900;display:grid;place-items:center;color:rgba(255,255,255,.35)}',
    '.rs-bar i.on{background:var(--fc);color:#1b110c;box-shadow:none}',
    '.rs-bar i.gt{outline:1px solid rgba(255,255,255,.22);outline-offset:-1px}',
    '.rs-bar i.on.gt{outline-color:#fff}',
    '.rs-fx{font-size:15px;line-height:1.4;color:#d8dcea}',
    '.rs-fx b{color:var(--fc);font-weight:800}',
    '.rs-nx{font-size:15px;line-height:1.35;color:var(--mut);margin-top:2px}',
    '.rs-nx b{color:#cfd5e4}',
    '.rs-pc{margin-top:8px;padding:8px 10px;background:var(--inset);border:var(--u) solid var(--line2)}',
    '.rs-pc .rs-h{font-family:var(--fh);font-size:8px;font-family:var(--fc);letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:5px}',
    '.rs-ch{display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 9px 0 6px;font-size:15px;font-weight:800;background:var(--fg);border:var(--u) solid var(--fc);color:var(--fc);margin:0 5px 4px 0}',
    '.rs-ch ',
    '.rs-ch b{color:#fff}',
    '.rs-ln{font-size:15px;line-height:1.4;color:#d8dcea;margin:3px 0 0}',
    '.rs-ln b{color:var(--fc)}',
    '.rs-ln.rsu{color:#b8f0c4}.rs-ln.rsd{color:#ffb4a8}',
    '.rs-ln .ar{color:var(--mut)}',
    '.rs-cx .cxr{display:flex;gap:9px;align-items:flex-start;padding:7px 0;border-top:var(--u) solid var(--line2)}',
    '.rs-cx .cxr:first-child{border-top:0}',
    '.sy-box{margin:2px 0 8px;padding:9px 10px;background:var(--inset);border:var(--u) solid var(--line2)}',
    '.sy-h{display:flex;align-items:center;gap:8px;margin-bottom:6px}',
    '.sy-h b{font-family:var(--fh);font-size:15px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);flex:1}',
    '.sy-h span{font-size:8px;font-family:var(--fc);font-weight:800;color:var(--mut)}',
    '.sy-chs{display:flex;flex-wrap:wrap;gap:5px}',
    '.sy-ch{display:inline-flex;align-items:center;gap:4px;min-height:26px;padding:3px 10px 3px 7px;font-size:15px;font-weight:800;background:var(--fg);border:var(--u) solid var(--fc);color:var(--fc);text-align:left;line-height:1.15}',
    '.sy-ch .i{flex:none}',
    '.sy-ch.rv{opacity:.92;border-style:dashed}',
    '.sy-eff{font-size:15px;line-height:1.4;color:#d8dcea;margin:5px 0 0}',
    '.sy-eff b{color:var(--fc)}',
    '.sy-eff small{color:var(--mut);font-size:8px;font-family:var(--fc)}',
    '.sy-tip{display:flex;gap:8px;align-items:center;margin-top:8px;padding:7px 9px;background:rgba(226,182,89,.12);border:var(--u) dotted rgba(226,182,89,.5);font-size:15px;line-height:1.4;color:#f1e6c6}',
    '.sy-tip>span{flex:1;min-width:0}',
    '.sy-tip b{color:var(--gold2)}',
    '.sy-tip .btn{flex:none;height:30px;padding:0 12px;font-size:15px}',
    '.sy-none{font-size:15px;line-height:1.4;color:var(--mut);margin:0}',
    '.sy-more{display:block;width:100%;margin-top:7px;padding:6px 0 0;font-size:15px;font-weight:800;color:var(--mut);text-align:center;letter-spacing:.04em}',
    '.sy-bk{margin-top:6px}',
    '.sy-bk .bk{display:flex;gap:8px;align-items:flex-start;padding:7px 0;border-top:var(--u) solid var(--line2)}',
    '.sy-bk .bk .ik{width:26px;height:26px;display:grid;place-items:center;flex:none;background:var(--fg);border:var(--u) solid var(--fc);color:var(--fc);font-size:15px}',
    '.sy-bk .bk .gr{flex:1;min-width:0;font-size:15px;line-height:1.35;color:#d8dcea}',
    '.sy-bk .bk .gr b{display:block;color:var(--fc);font-size:15px}',
    '.sy-bk .bk .gr small{display:block;color:var(--mut);font-size:8px;font-family:var(--fc)}',
    '.sy-bk .bk.on{background:var(--fg);padding-left:6px;padding-right:6px}',
    '.sy-bk .bk .ok{flex:none;font-size:8px;font-family:var(--fc);font-weight:900;letter-spacing:.08em;color:#9af0b0;text-transform:uppercase}',
    '.sy-duel{display:flex;flex-wrap:wrap;gap:4px 5px;justify-content:center;margin:2px 0 6px}',
    '.sy-duel .sy-ch{min-height:22px;padding:2px 8px 2px 6px;font-size:8px;font-family:var(--fc);animation:sypop .5s cubic-bezier(.2,1.5,.4,1) both}',
    '.sy-lg{text-align:center;font-size:8px;font-family:var(--fc);letter-spacing:.06em;color:var(--mut);margin:-2px 0 5px}',
    '.sy-duel .sy-ch:nth-child(2){animation-delay:.15s}.sy-duel .sy-ch:nth-child(3){animation-delay:.3s}.sy-duel .sy-ch:nth-child(4){animation-delay:.45s}',
    '@keyframes sypop{from{transform:scale(.3);opacity:0}}',
    '.sy-res{margin:8px 0 2px;padding:9px 11px;background:var(--fg);border:var(--u) solid var(--fc);text-align:left}',
    '.sy-res .t{font-size:8px;font-family:var(--fc);font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:var(--fc)}',
    '.sy-res .n{font-family:var(--fh);font-size:16px;color:#fff;margin:1px 0 2px}',
    '.sy-res .d{font-size:15px;line-height:1.4;color:#d8dcea}',
    '.sy-res.plain{background:var(--fill2);border-color:var(--line2)}',
    '.sy-res.plain .t{color:var(--mut)}',
    '.sy-col .sy-chs{margin-top:6px}',
  ].join('\n');
  document.head.appendChild(css);

  const famChip = (f, txt) => '<span class="rs-ch" style="' + fcv(f.col) + '">' + ic(f.icon) + txt + '</span>';
  const comboChip = (c, cls) => '<span class="sy-ch' + (cls ? ' ' + cls : '') + '" style="' + fcv(c.col) + '">' + ic(c.icon) + esc(c.name) + '</span>';
  const joinNames = (a) => (a.length > 1 ? a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1] : a[0] || '');
  const hOf = (it) => { const S = S0(); for (const h of S.heroes) for (const k in h.gear) if (h.gear[k] === it) return h; return null; };

  /* ================= 4B.1 inscrições: família em cada linha ================= */
  UI.famTag = (id) => {
    const f = G.insFam(id); if (!f) return '';
    return '<span class="fam" style="color:' + f.col + '" title="Família ' + f.name + ' (ressonância)">' + ic(f.icon) + '</span>';
  };

  /* ficha do herói: as famílias com a barra de inscrições e o próximo bônus */
  UI.resCard = (x) => {
    const L = G.resList(G.resOf(x)); if (!L.length) return '';
    const act = L.filter((r) => r.t).length;
    let h = '<div class="sec">Ressonância<span class="mut" style="font-family:inherit;letter-spacing:0;text-transform:none;font-size:15px;font-weight:700;margin-left:auto">' + (act ? act + (act === 1 ? ' ativa' : ' ativas') : 'nenhuma ativa ainda') + '</span></div><div class="card rsc">' +
      '<p class="rs-lead mut">Inscrições da mesma família, somando todas as peças, despertam bônus de conjunto aos 2, 3 e 4.</p>';
    L.forEach((r, i) => {
      const f = r.f, n = Math.min(4, r.n);
      const fx = []; for (let k = 0; k < r.t; k++) fx.push('<b>' + f.tiers[k].n + '</b>: ' + f.tiers[k].txt);
      h += '<div class="rs-row' + (i ? '' : ' first') + '" style="' + fcv(f.col) + '"><span class="rs-ic">' + ic(f.icon) + '</span><div class="rs-gr">' +
        '<div class="rs-top"><b>' + f.name + '</b><em>' + (r.t === 3 ? 'máxima' : r.t ? 'nível ' + r.t : 'despertando') + '</em><span class="rs-n">' + r.n + '<small> / ' + (r.need || 4) + '</small></span></div>' +
        '<div class="rs-bar">' + [1, 2, 3, 4].map((k) => '<i class="' + (n >= k ? 'on' : '') + (k >= 2 ? ' gt' : '') + '">' + k + '</i>').join('') + '</div>' +
        (fx.length ? '<div class="rs-fx">' + fx.join('<br>') + '</div>' : '') +
        (r.next ? '<div class="rs-nx">Com ' + r.need + ': <b>' + r.next.n + '</b> · ' + r.next.txt + '</div>' : '') + '</div></div>';
    });
    return h + '</div>';
  };
  const ih0 = UI.insHero;
  UI.insHero = (x) => ih0(x) + UI.resCard(x);

  /* ficha da peça: famílias presentes e o que ela faz pela ressonância (de quem a veste ou de quem a vestiria) */
  const famsOf = (ins) => { const c = {}; for (const e of ins || []) { const f = G.RES_OF[e[0]]; if (f) c[f] = (c[f] || 0) + 1; } return c; };
  const tierLine = (f, a, b) => {
    const ta = G.resTier(a), tb = G.resTier(b), nb = tb ? f.tiers[tb - 1] : null;
    const need = (t) => (t < 3 ? G.RES_TIERS[t] : 4);
    if (tb > ta) return '<p class="rs-ln rsu" style="' + fcv(f.col) + '"><b>' + f.name + '</b> <span class="ar">' + a + '/' + need(ta) + ' →</span> ' + b + '/' + need(tb) + ' · desperta <b>' + nb.n + '</b> (' + nb.txt + ')</p>';
    if (tb < ta) return '<p class="rs-ln rsd" style="' + fcv(f.col) + '"><b>' + f.name + '</b> <span class="ar">' + a + '/' + need(ta) + ' →</span> ' + b + '/' + need(tb) + ' · perde <b>' + f.tiers[ta - 1].n + '</b></p>';
    if (a !== b) return '<p class="rs-ln" style="' + fcv(f.col) + '"><b>' + f.name + '</b> <span class="ar">' + a + '/' + need(ta) + ' →</span> ' + b + '/' + need(tb) + (tb < 3 ? ' · faltam ' + (G.RES_TIERS[tb] - b) + ' para <b>' + f.tiers[tb].n + '</b>' : '') + '</p>';
    return '';
  };
  UI.resPiece = (it, hid) => {
    if (!it || !it.ins || !it.ins.length) return '';
    const fm = famsOf(it.ins), ids = Object.keys(fm); if (!ids.length) return '';
    const S = S0(), holder = (hid && S.heroes.find((x) => x.id === hid)) || hOf(it);
    let h = '<div class="rs-pc"><div class="rs-h">Ressonância</div>' + ids.map((id) => famChip(G.RES_FAM[id], G.RES_FAM[id].name + ' <b>×' + fm[id] + '</b>')).join('');
    if (holder) {
      const rc = G.resOf(holder);
      h += '<p class="rs-ln" style="margin-top:2px"><b style="color:#fff">' + esc(holder.name) + '</b> veste esta peça:</p>';
      for (const id of ids) {
        const f = G.RES_FAM[id], n = rc[id] || 0, t = G.resTier(n), nx = t < 3 ? f.tiers[t] : null;
        h += '<p class="rs-ln" style="' + fcv(f.col) + '"><b>' + f.name + '</b> ' + n + '/' + (t < 3 ? G.RES_TIERS[t] : 4) + (nx ? ' · faltam ' + (G.RES_TIERS[t] - n) + ' para <b>' + nx.n + '</b>' : ' · ressonância máxima') + '</p>';
      }
    } else {
      const help = G.resHelp(it).slice(0, 2);
      if (help.length) for (const r of help) h += '<p class="rs-ln rsu" style="' + fcv(r.f.col) + '">Ajudaria <b style="color:#fff">' + esc(r.h.name) + '</b>: <b>' + r.f.name + '</b> ' + r.from + ' → ' + r.to + ' · desperta <b>' + r.f.tiers[r.tier - 1].n + '</b> (' + r.f.tiers[r.tier - 1].txt + ')</p>';
      else h += '<p class="rs-ln mut">Nenhum herói sobe de nível de ressonância com esta peça agora.</p>';
    }
    return h + '</div>';
  };
  const im1 = UI.itemModal;
  UI.itemModal = (id, hid, msg) => {
    im1(id, hid, msg);
    const it = UI.findItem && UI.findItem(id, hid), l = $('#modal .insl'); if (!it || !l || $('#modal .rs-pc')) return;
    l.insertAdjacentHTML('afterend', UI.resPiece(it, hid));
  };
  /* reforja: antes e depois da ressonância de quem veste a peça */
  UI.resReforge = (it, hid) => {
    const holder = (hid && S0().heroes.find((x) => x.id === hid)) || hOf(it); if (!holder || !it.rfp) return '';
    const kind = G.GEAR[it.type].kind, a = G.resWith(holder, kind, it.ins), b = G.resWith(holder, kind, it.rfp);
    let h = '';
    for (const f of G.RES_FAMS) h += tierLine(f, a[f.id] || 0, b[f.id] || 0);
    return '<div class="rs-pc"><div class="rs-h">Ressonância de ' + esc(holder.name) + '</div>' + (h || '<p class="rs-ln mut">As famílias de ' + esc(holder.name) + ' não mudam com esta reforja.</p>') + '</div>';
  };
  const rm1 = UI.reforgeModal;
  UI.reforgeModal = (id, hid, msg) => {
    rm1(id, hid, msg);
    const it = UI.findItem && UI.findItem(id, hid); if (!it) return;
    if (it.rfp) {
      const g = $('#modal .rfgrid'); if (g && !$('#modal .rs-pc')) g.insertAdjacentHTML('afterend', UI.resReforge(it, hid));
    } else {
      const l = $('#modal .insl'); if (l && !$('#modal .rs-pc')) l.insertAdjacentHTML('afterend', UI.resPiece(it, hid));
    }
  };

  /* aviso quando um herói desperta uma ressonância */
  let lastRes = 0;
  G.on('resonancia', (d) => {
    const now = performance.now(); if (now - lastRes < 4000) return; lastRes = now;
    UI.toast('Ressonância ' + d.f.name + ': ' + d.f.tiers[d.t - 1].n + ' despertou em ' + d.h.name + '!', 'good', d.f.icon);
    G.sfx('perfect');
  });

  /* ================= Códex: as famílias ================= */
  const M1 = UI.SHEETS && UI.SHEETS.mais;
  if (M1) {
    const mr = M1.render;
    M1.render = function (tab, sub) {
      const html = mr.call(M1, tab, sub);
      if (tab !== 'codex') return html;
      const c = G.codex();
      let h = '<div class="sec">Ressonância · 6 famílias</div><div class="card rs-cx"><p class="rs-lead mut">Quando um herói reúne 2, 3 ou 4 inscrições da mesma família, ganha bônus de conjunto.</p>';
      for (const f of G.RES_FAMS) {
        const mem = f.ins.map((id) => ((c.ins[id] || 0) ? G.INS[id].name.replace(/^(da|do|dos|das|de) /, '') : '? ? ?')).join(' · ');
        h += '<div class="cxr" style="' + fcv(f.col) + '"><span class="rs-ic">' + ic(f.icon) + '</span><div class="rs-gr"><div class="rs-top"><b>' + f.name + '</b></div><div class="rs-nx" style="margin-top:0">' + mem + '</div>' +
          f.tiers.map((t, i) => '<div class="rs-fx"><b>' + G.RES_TIERS[i] + '</b> · ' + t.n + ': ' + t.txt + '</div>').join('') + '</div></div>';
      }
      h += '</div>';
      const k = html.indexOf('<div class="sec">Peças · tier');
      return k < 0 ? html + h : html.slice(0, k) + h + html.slice(k);
    };
  }

  /* ================= 4B.2 Formação × classes ================= */
  const effLine = (c) => '<b>' + esc(c.name) + '</b> · ' + esc(c.req) + '<br><small>' + esc(c.txt) + '</small>';
  UI.synBook = (activeIds, colo) => {
    const on = {}; for (const a of activeIds || []) on[a] = 1;
    return '<div class="sy-bk">' + G.SYN.filter((c) => !(colo && c.colo === 0)).map((c) => '<div class="bk' + (on[c.id] ? ' on' : '') + '" style="' + fcv(c.col) + '"><span class="ik">' + ic(c.icon) + '</span><div class="gr"><b>' + esc(c.name) + '</b>' + esc(c.req) + '<small>' + esc(c.txt) + '</small></div>' + (on[c.id] ? '<span class="ok">ativa</span>' : '') + '</div>').join('') + '</div>';
  };
  let showBook = false;
  /* tela de equipe da Arena (gancho em 65: topo da lista de heróis): combinações ativas, as do rival, sugestão e o livro de combinações */
  UI.synTeam = (tm) => {
    if (!tm || !tm.sel || !tm.offer) return '';
    const S = S0(), sel = tm.sel, n = G.arenaRival(tm.offer.i).size;
    const act = sel.length >= 2 ? G.synTeam(sel) : [];
    const byId = (id) => S.heroes.find((x) => x.id === id);
    let h = '<div class="sy-box"><div class="sy-h"><b>Formação</b><span>' + (act.length ? act.length + (act.length === 1 ? ' combinação ativa' : ' combinações ativas') : sel.length < n ? 'escolha ' + n + ' heróis' : 'nenhuma combinação') + '</span></div>';
    if (act.length) {
      h += '<div class="sy-chs">' + act.map((a) => comboChip(G.SYN_BY[a.id])).join('') + '</div>';
      h += act.map((a) => { const c = G.SYN_BY[a.id]; return '<p class="sy-eff" style="' + fcv(c.col) + '"><b>' + esc(c.name) + '</b> · ' + esc(joinNames(a.who.map((id) => (byId(id) || { name: '?' }).name))) + '<br><small>' + esc(c.txt) + '</small></p>'; }).join('');
    } else if (sel.length >= n) h += '<p class="sy-none">Nenhuma combinação com estas classes e posições. Cavaleiro na frente com Mago no fundo, dois Arqueiros atrás, Paladino com qualquer aliado… toque em “Ver todas”.</p>';
    if (sel.length === n) {
      const sg = G.synSuggest(sel);
      if (sg) h += '<div class="sy-tip"><span>' + esc(sg.text) + '<b>' + esc(sg.combo.name) + '</b> <small class="mut">(' + esc(sg.combo.txt) + ')</small>.</span><button class="btn sm pri" data-a="synapply">Aplicar</button></div>';
    }
    /* o rival também usa combinações */
    try {
      const rz = G.arenaRealize(tm.offer.i, tm.offer.ratio), bps = G.arenaRivalBps(rz), ra = G.synFind(bps.map((b) => ({ cls: b.cls, row: b.row }))).act;
      if (ra.length) h += '<p class="sy-eff" style="margin-top:7px"><b style="color:#ffb0a8">Rival</b> · ' + ra.map((a) => esc(G.SYN_BY[a.id].name) + ' <small>(' + esc(joinNames(a.who.map((i) => bps[i].name))) + ')</small>').join(' · ') + '</p>';
    } catch (e) { console.error(e); }
    h += '<button class="sy-more" data-a="synbook">' + (showBook ? 'Esconder as combinações' : 'Ver todas as ' + G.SYN.length + ' combinações') + '</button>';
    if (showBook) h += UI.synBook(act.map((a) => a.id));
    return h + '</div>';
  };
  UI.ACT.synbook = () => { showBook = !showBook; if (UI.arenaTmRedraw) UI.arenaTmRedraw(); };
  UI.ACT.synapply = () => {
    const tm = UI.arenaTm && UI.arenaTm(); if (!tm) return;
    const sg = G.synSuggest(tm.sel); if (!sg) return;
    tm.sel.splice(0, tm.sel.length, ...sg.team.map((x) => ({ id: x.id, r: x.r })));
    G.sfx('click'); UI.toast(sg.combo.name + ' ativada.', 'good', sg.combo.icon);
    if (UI.arenaTmRedraw) UI.arenaTmRedraw();
  };
  /* duelo: as combinações de cada lado surgem acima do palco */
  const synOf = (res) => (res.syn ? { me: res.syn.me, rv: res.syn.rv, dec: res.syn.dec } : res.sim && res.sim.syn ? { me: res.sim.syn[0], rv: res.sim.syn[1], dec: null } : null);
  UI.synDuel = (res) => {
    const sy = synOf(res); if (!sy || (!sy.me.length && !sy.rv.length)) return;
    const st = $('#modal .ar-stage'); if (!st) return;
    st.insertAdjacentHTML('beforebegin', '<div class="sy-duel">' + sy.me.map((a) => comboChip(G.SYN_BY[a.id])).join('') + sy.rv.map((a) => comboChip(G.SYN_BY[a.id], 'rv')).join('') + '</div>' + (sy.rv.length && sy.me.length ? '<div class="sy-lg">combinações ativas · tracejadas: do rival</div>' : ''));
    setTimeout(() => G.sfx('arena'), 250);
  };
  /* resultado: a combinação decisiva */
  UI.synResult = (res, box) => {
    const sy = synOf(res), el = box && box.querySelector('.ar-res'); if (!sy || !el) return;
    let h = '';
    if (sy.dec) {
      const c = G.SYN_BY[sy.dec.id], mine = sy.dec.side === 0;
      h = '<div class="sy-res" style="' + fcv(c.col) + '"><div class="t">' + (mine ? 'Combinação decisiva' : 'Foi a combinação do rival') + '</div><div class="n">' + ic(c.icon).replace('class="i"', 'class="i" style="display:inline;vertical-align:-2px;margin-right:5px"') + esc(c.name) + '</div><div class="d">' +
        (mine ? esc(joinNames(sy.dec.names)) + ' fizeram a diferença: sem ' + esc(c.name) + ', esta luta teria sido perdida e a chance de vitória cairia de ' + Math.round(sy.dec.p0 * 100) + '% para ' + Math.round(sy.dec.p1 * 100) + '%. ' + esc(c.txt) + '.' : esc(joinNames(sy.dec.names)) + ' viraram a luta com ' + esc(c.name) + ' (' + esc(c.txt) + '). Sem ela, a sua chance subiria de ' + Math.round((1 - sy.dec.p0) * 100) + '% para ' + Math.round((1 - sy.dec.p1) * 100) + '%. Tente desfazê-la: ' + esc(c.req.toLowerCase()) + '.') + '</div></div>';
    } else if (sy.me.length) {
      h = '<div class="sy-res plain"><div class="t">Combinações em campo</div><div class="d">' + sy.me.map((a) => esc(G.SYN_BY[a.id].name)).join(' · ') + (sy.rv.length ? ' <span class="mut">· do rival: ' + sy.rv.map((a) => esc(G.SYN_BY[a.id].name)).join(' · ') + '</span>' : '') + '. Nenhuma decidiu sozinha o duelo.</div></div>';
    } else if (sy.rv.length) {
      h = '<div class="sy-res plain"><div class="t">Combinações do rival</div><div class="d">' + sy.rv.map((a) => esc(G.SYN_BY[a.id].name)).join(' · ') + '. Na tela de equipe, a dica sugere uma formação para o seu lado.</div></div>';
    }
    if (!h) return;
    const m = el.querySelector('.mvp') || el.querySelector('.acts');
    if (m) m.insertAdjacentHTML('beforebegin', h); else el.insertAdjacentHTML('beforeend', h);
  };

  /* ================= aba do Colosso: formação do grupo ================= */
  const MM = UI.SHEETS && UI.SHEETS.missoes;
  if (MM) {
    const r0 = MM.render;
    MM.render = function (tab, sub) {
      const html = r0.call(MM, tab, sub);
      if (tab !== 'colosso') return html;
      let live = false; try { live = G.colossoInfo().live; } catch (e) { /* sem Colosso */ }
      const cur = G.colSyn || { act: [], n: 0 }, all = G.colSynAll(), use = live && cur.n > 0 ? cur : all;
      let h = '<div class="sec">Formação do grupo</div><div class="card sy-col"><p class="rs-lead mut">Quem marcha junto se fortalece: classes e posições (corpo a corpo à frente; arqueiros e magos atrás) formam as mesmas combinações da Arena. Como o grupo é grande e acumula várias, aqui os bônus valem ' + Math.round(G.SYN_COL * 100) + '%.</p>';
      h += '<div class="sy-h" style="margin-bottom:0"><b style="flex:none">' + (live && cur.n > 0 ? 'Lutando agora' : 'Se todos forem') + '</b><span style="flex:1;text-align:right">' + (use.act.length ? use.act.length + (use.act.length === 1 ? ' combinação' : ' combinações') : 'nenhuma combinação') + '</span></div>';
      if (use.act.length) {
        h += '<div class="sy-chs">' + use.act.map((a) => comboChip(G.SYN_BY[a.id])).join('') + '</div>' + use.act.slice(0, 4).map((a) => { const c = G.SYN_BY[a.id]; return '<p class="sy-eff" style="' + fcv(c.col) + '"><b>' + esc(c.name) + '</b> · ' + esc(joinNames(a.names)) + '<br><small>' + esc(c.txt) + '</small></p>'; }).join('') + (use.act.length > 4 ? '<p class="sy-eff"><small>…e mais ' + (use.act.length - 4) + (use.act.length - 4 === 1 ? ' combinação' : ' combinações') + '. “Ver todas as combinações” mostra o que cada uma pede.</small></p>' : '');
      } else h += '<p class="sy-none" style="margin-top:6px">' + (live && cur.n > 0 ? 'O grupo de agora não forma nenhuma combinação.' : 'Os heróis de hoje não formam combinações.') + ' Veja quais existem abaixo.</p>';
      h += '<button class="sy-more" data-a="syncolbook">' + (showColBook ? 'Esconder as combinações' : 'Ver todas as combinações') + '</button>';
      if (showColBook) h += UI.synBook(use.act.map((a) => a.id), true);
      h += '</div>';
      const k = html.indexOf('<div class="sec">Marcos de dano</div>');
      return k < 0 ? html + h : html.slice(0, k) + h + html.slice(k);
    };
  }
  let showColBook = false;
  UI.ACT.syncolbook = () => { showColBook = !showColBook; UI.sheetDirty(); };
})();
;
