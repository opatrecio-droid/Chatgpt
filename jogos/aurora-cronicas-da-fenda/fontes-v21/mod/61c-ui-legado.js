  /* ================= v21: guarda-roupa, dificuldade, enfeites móveis e Caminhos ================= */
  const COS_ICON = { traje: 'shirt', asas: 'wing', pet: 'paw', reliquia: 'crown' };
  const cosSlot = (x, slot) => {
    const id = x.cos && x.cos[slot];
    return '<button class="ds sp' + (id ? '' : ' vz') + '" data-a="cos:' + x.id + ':' + slot + '">' + (id ? '<i class="gi px" style="background-image:url(' + A.cosURL(id, x) + ')"></i>' : '<i class="gi">' + ic(COS_ICON[slot]) + '</i>') + '<small>' + G.COS_SLOT_NAME[slot] + '</small></button>';
  };
  const dollV21 = (x, look) => '<div class="dollw"><div class="dside">' + cosSlot(x, 'traje') + cosSlot(x, 'pet') + '</div><div class="doll">' + dollSlot(x, 'acessorio') + dollSlot(x, 'elmo') + dollSlot(x, 'armadura') + dollSlot(x, 'arma') + '<i class="px dfig" style="background-image:url(' + A.fullBody(look) + ')"></i>' + dollSlot(x, 'luvas') + dollSlot(x, 'anel') + dollSlot(x, 'cinto') + dollSlot(x, 'botas') + '</div><div class="dside">' + cosSlot(x, 'asas') + cosSlot(x, 'reliquia') + '</div></div>';
  const cosCost = (c) => UI.cost(c.gold || 0, c.res || {}, (c.selos ? '<span class="cost' + (G.S.selos < c.selos ? ' lack' : '') + '">' + ic('seal') + c.selos + '</span>' : '') + (c.nucleos ? '<span class="cost' + (G.S.nucleos < c.nucleos ? ' lack' : '') + '">' + ic('core') + c.nucleos + '</span>' : ''));
  const cosCard = (id, x) => {
    const d = G.COS[id], slot = d.slot, cur = x && x.cos && x.cos[slot], own = G.cosOwned(id), free = G.cosFree(id), mine = cur === id, can = G.cosCan(id), locked = d.cost && G.S.realm.lvl < d.req, hk = x ? x.id : 0;
    return '<div class="card' + (mine ? ' hl' : locked || (!d.cost && !own) ? ' lock' : '') + '" style="text-align:left"><div class="row"><i class="thumb px" style="background-image:url(' + A.cosURL(id, x) + ');background-size:' + (slot === 'traje' ? '46px 53px' : 'contain') + '"></i><div class="gr"><h3 class="rar' + d.rar + '">' + d.name + '</h3><p><b class="gold">' + bonusText(d.p) + '</b></p><p>' + d.desc + '</p><p>' + (own ? 'No reino: ' + own + ' · livre' + (free === 1 ? '' : 's') + ': ' + free : d.cost ? 'Ainda não comprado' : 'Ainda não conquistada') + '</p></div></div>' +
      (locked ? '<p class="bad" style="margin-top:6px">' + can.why + '.</p>' : '<div class="row" style="margin-top:4px"><div class="gr">' + (d.cost ? cosCost(d.cost) : '<p style="margin:0">' + can.why + '.</p>') + '</div>' + (mine ? '<span class="pill gold">' + ic('check') + 'vestindo</span>' : x && free > 0 ? '<button class="btn sm pri" data-a="cosw:' + hk + ':' + slot + ':' + id + '">Vestir</button>' : '') + (d.cost ? '<button class="btn sm' + (free > 0 || mine ? '' : ' vio') + '" data-a="cosb:' + hk + ':' + slot + ':' + id + '"' + (can.ok ? '' : ' disabled') + '>Comprar</button>' : '') + '</div>') + '</div>';
  };
  const tabAtelie = () => {
    let h = '<div class="card hl"><div class="row"><span class="thumb sm" style="display:grid;place-items:center;font-size:22px;color:#c9a4ff">' + ic('shirt') + '</span><div class="gr"><h3>Ateliê de Aurora</h3><p>Trajes, asas e mascotes mudam o visual do herói e dão um bônus. Cada cópia veste um herói por vez: para vestir, toque nos espaços roxos da ficha.</p></div></div></div>';
    for (const slot of G.COS_SLOTS) { h += '<div class="sec">' + ({ traje: 'Trajes', asas: 'Asas', pet: 'Mascotes', reliquia: 'Relíquias dos chefes' })[slot] + '</div>'; for (const id of G.COS_IDS) if (G.COS[id].slot === slot) h += cosCard(id, null); }
    return h;
  };
  const cosModal = (x, slot) => {
    const cur = x.cos && x.cos[slot];
    let h = '<div class="eyebrow">' + (slot === 'reliquia' ? 'Relíquias do reino' : 'Ateliê de Aurora') + '</div><h2>' + G.COS_SLOT_NAME[slot] + ' de ' + esc(x.name) + '</h2><p class="lead" style="font-size:12.5px">' + (slot === 'reliquia' ? 'Relíquias não se compram: a 3ª vitória sobre cada chefe de zona garante a dele, e a Fenda entrega uma a cada 10 andares.' : 'Cada peça comprada veste um herói por vez. Compre mais cópias para vestir outros.') + '</p>';
    if (cur) h += '<button class="btn wide" style="margin-bottom:10px" data-a="cosw:' + x.id + ':' + slot + ':0">' + ic('close') + 'Tirar ' + G.COS[cur].name + '</button>';
    for (const id of G.COS_IDS) if (G.COS[id].slot === slot) h += cosCard(id, x);
    UI.modal(h + '<div class="acts"><button class="btn" data-a="mclose">Fechar</button></div>', { pause: false });
  };
  UI.diffModal = () => {
    const S = G.S;
    let h = '<div class="eyebrow">Dificuldade do reino</div><h2>' + G.diffCur().name + '</h2><p class="lead" style="font-size:12.5px">Vale para todas as zonas e para a Maré. A Fenda Infinita tem a própria escada. Trocar não custa nada; os monstros soltos reaparecem na força nova.</p>';
    G.DIFFS.forEach((d, i) => { const lock = S.realm.lvl < d.realm; h += '<button class="opt" data-a="diffset:' + i + '"' + (lock ? ' disabled' : '') + ' style="' + (S.diff === i ? 'border-color:' + d.c + ';box-shadow:inset 0 0 0 1px ' + d.c : '') + '"><b style="color:' + d.c + '">' + inl('skull') + ' ' + d.name + (S.diff === i ? ' · atual' : '') + '</b><span>' + (lock ? 'Abre no Nível de Reino ' + d.realm + '. ' : '') + d.desc + '</span></button>'; });
    UI.modal(h + '<div class="acts"><button class="btn" data-a="mclose">Fechar</button></div>');
  };
  /* mover enfeites: o painel fecha e os toques no mapa escolhem o ladrilho */
  UI.placing = null;
  const placeBar = () => {
    const p = UI.placing, d = G.DEC[p.id], n = d.spots.length, el = $('#inspect');
    el.innerHTML = '<i class="ip px" style="background-image:url(' + decImg(d) + ');background-size:contain"></i><span class="it"><b>Mover: ' + d.name + '</b><span>' + (n > 1 ? 'Peça ' + (p.i + 1) + ' de ' + n + ' · ' : '') + 'toque em um ladrilho livre</span></span>' + (n > 1 ? '<button class="btn sm" data-a="decskip">Pular</button>' : '') + '<button class="btn sm pri" data-a="decdone">Pronto</button>';
    el.classList.add('on'); $('#quest').style.display = 'none';
    const s = G.decorSpots(d)[p.i]; R.mark = { x: s[0], y: s[1] }; if (p.i === 0) R.focus(s[0], s[1] + 1.5);
  };
  const placeEnd = (reopen) => { UI.placing = null; R.mark = null; UI.inspect(null); if (reopen) UI.open('reino', 'decor'); };
  UI.placeTap = (sx, sy) => {
    const p = UI.placing, w = R.screenToWorld(sx, sy), r = G.decorCanPlace(p.id, p.i, w[0], w[1]);
    if (!r.ok) return UI.toast(r.why + '.', 'bad');
    G.decorPlace(p.id, p.i, w[0], w[1]); G.sfx('build'); p.i++;
    if (p.i >= G.DEC[p.id].spots.length) { UI.toast('Enfeite no lugar novo.', 'good', 'flower'); placeEnd(true); } else placeBar();
  };
  const open0 = UI.open; UI.open = (n, t, s) => { if (UI.placing) { UI.placing = null; R.mark = null; UI.inspect(null); } return open0(n, t, s); };
  const rwChips = (r) => Object.keys(r).map((k) => '<span class="cost">' + (k === 'gold' ? ic('coin') + G.fmt(r.gold) : k === 'selos' ? ic('seal') + r.selos : k === 'nucleos' ? ic('core') + r.nucleos : '<i class="px ri-' + k + '"></i>' + r[k] + ' <span class="mut">' + G.RES[k].name.split(' ')[0] + '</span>') + '</span>').join('');
  const tabCaminhos = () => {
    const open = G.PATHS.filter((d) => !G.pathDone(d)), done = G.PATHS.length - open.length;
    let h = '<div class="card hl"><div class="row"><span class="thumb sm" style="display:grid;place-items:center;font-size:22px;color:var(--gold2)">' + ic('map') + '</span><div class="gr"><h3>Caminhos <small>' + done + ' / ' + G.PATHS.length + ' concluídos</small></h3>' + bar(() => Math.round(100 * done / G.PATHS.length), 'big') + '<p>Objetivos livres, em qualquer ordem, que apresentam os sistemas novos e pagam em Tomos, Cristais de Alma e Selos.</p></div></div></div>';
    open.sort((a, b) => (G.pathCur(b) >= b.n) - (G.pathCur(a) >= a.n));
    for (const d of open) {
      const ok = G.pathCur(d) >= d.n;
      h += '<div class="card' + (ok ? ' hl' : '') + '"><h3>' + esc(d.t) + '</h3><p>' + esc(d.h) + '</p><div style="margin-top:7px">' + bar(() => Math.round(100 * G.pathCur(d) / d.n), 'big g') + '</div><div class="row" style="margin-top:8px"><div class="gr"><div class="costs" style="margin:0">' + rwChips(d.r) + '</div></div><span class="mut" style="font-size:11.5px;font-weight:800">' + v.T(() => G.fmt(G.pathCur(d)) + ' / ' + G.fmt(d.n)) + '</span><button class="btn sm pri" data-a="pathclaim:' + d.id + '" ' + v.Dis(() => G.pathCur(d) < d.n) + '>' + ic('chest') + 'Receber</button></div></div>';
    }
    if (done) h += '<div class="sec">Concluídos</div>' + G.PATHS.filter(G.pathDone).map((d) => '<div class="card lock"><div class="row">' + ic('check') + '<div class="gr"><b style="font-size:12.5px">' + esc(d.t) + '</b></div></div></div>').join('');
    return h;
  };
  const SK_ICON = { hit: 'sword', multi: 'sword', aoe: 'bolt', stun: 'star', slow: 'wave', dot: 'potion', vuln: 'target', buff: 'flag', heal: 'heart', shield: 'shield', cleanse: 'heart', taunt: 'horn' };
  const CLS_ICON = { esp: 'sword', cav: 'shield', arq: 'target', mag: 'bolt', pal: 'heart', lad: 'skull' };
  const BUFF_ICON = { atk: 'flag', def: 'shield', eva: 'run', thorns: 'shield', regen: 'heart', aspd: 'bolt' };
  const skIcon = (sk, cls) => {
    if (!sk.ops) return CLS_ICON[cls] || 'sword';
    const o = sk.ops[0];
    if (o.o === 'hit') return o.exec ? 'skull' : o.crit ? 'eye' : o.pierce ? 'target' : o.gold ? 'coin' : (o.n || 1) > 1 ? 'bolt' : sk.ops[1] ? SK_ICON[sk.ops[1].o] || 'sword' : 'sword';
    if (o.o === 'aoe') return sk.ops[1] ? SK_ICON[sk.ops[1].o] || 'sun' : 'sun';
    if (o.o === 'buff') return BUFF_ICON[o.k] || 'flag';
    return SK_ICON[o.o] || 'spark';
  };
  Object.assign(UI.ACT, {
    cos: (a) => { const h = hid(a[0]); if (h) cosModal(h, a[1]); },
    cosw: (a) => { const h = hid(a[0]); if (!h) return; if (G.cosWear(h, a[1], a[2] === '0' ? null : a[2])) { cosModal(h, a[1]); draw(false); } else UI.toast('Sem cópia livre desta peça.', 'bad'); },
    cosb: (a) => { const h = +a[0] ? hid(a[0]) : null; if (!G.cosBuy(a[2])) return UI.toast(G.cosCan(a[2]).why + '.', 'bad'); if (h && !h.cos[a[1]]) G.cosWear(h, a[1], a[2]); UI.toast(G.COS[a[2]].name + ' chegou do Ateliê.', 'good', 'gift'); if (h) cosModal(h, a[1]); draw(false); },
    diff: () => UI.diffModal(),
    diffset: (a) => { if (G.setDiff(+a[0])) UI.banner('Dificuldade do reino', G.diffCur().name, G.diffCur().desc); UI.closeModal(); },
    decmove: (a) => { if (!G.decorLvl(a[0]) || !G.decorMovable(a[0])) return; UI.close(); R.follow = 0; UI.inspect(null); UI.placing = { id: a[0], i: 0 }; placeBar(); },
    decskip: () => { const p = UI.placing; if (!p) return; p.i++; if (p.i >= G.DEC[p.id].spots.length) placeEnd(true); else placeBar(); },
    decdone: () => { if (UI.placing) placeEnd(true); },
    decreset: (a) => { G.decorResetPos(a[0]); UI.toast('Enfeite de volta ao lugar original.', 'info', 'flower'); draw(false); },
    pathclaim: (a) => { const t = G.pathClaim(a[0]); if (t) { UI.toast('Caminho concluído: ' + t, 'good', 'chest'); draw(false); } },
    artautotog: (a) => { const h = hid(a[0]); if (!h) return; h.autoArt = h.autoArt ? 0 : 1; if (h.autoArt) G.artAuto(h); draw(false); },
  });
  UI.legGuide = () => {
    G.S.tut.seen.v21 = 1;
    UI.modal('<div class="eyebrow">Aurora v' + G.VERSION + ' · Legado</div><h2>O que há de novo</h2>' +
      [['shirt', 'Trajes, asas e mascotes', 'Os espaços roxos ao lado do herói abrem o Ateliê. Cada peça muda o visual e dá um bônus.'], ['crown', 'Relíquias', 'Cada chefe de zona guarda uma. A 3ª vitória garante.'], ['skull', 'Dificuldade', 'A caveira no alto da tela troca entre Fácil, Normal, Difícil e Pesadelo.'], ['flower', 'Enfeites móveis', 'Reino › Decoração › Mover: toque no ladrilho onde quer cada peça.'], ['map', 'Caminhos', 'Missões › Caminhos: 18 objetivos livres com recompensas.']]
        .map(([i, t, d]) => '<div class="row" style="margin-bottom:9px"><span class="thumb sm" style="display:grid;place-items:center;font-size:20px;color:var(--gold2)">' + ic(i) + '</span><div class="gr"><b style="font-size:13px">' + t + '</b><br><span class="mut" style="font-size:12px">' + d + '</span></div></div>').join('') +
      '<div class="acts"><button class="btn pri" data-a="mclose">Entendi</button></div>');
  };

