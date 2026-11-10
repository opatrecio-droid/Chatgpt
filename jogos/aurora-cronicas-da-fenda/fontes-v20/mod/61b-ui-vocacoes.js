  /* ================= HERÓIS (v20: lista em cartões e ficha com abas) ================= */
  const BONUS_LBL = { hp: 'vida', atk: 'ataque', def: 'defesa', crit: 'crítico', eva: 'esquiva', aspd: 'vel. de ataque', spd: 'movimento', cdr: 'recarga mais rápida', critDmg: 'dano crítico', gold: 'moedas', drop: 'espólio', xp: 'experiência', heal: 'cura', elite: 'dano em elites e chefes', thorns: 'dano devolvido', mood: 'ânimo natural' };
  const bonusText = (p, f) => { const a = []; for (const k in p) a.push(k === 'rng' ? '+' + String(p[k]).replace('.', ',') + ' de alcance' : '+' + Math.round(p[k] * (f || 1) * 100) + '% ' + BONUS_LBL[k]); return a.join(' · '); };
  const inl = (name) => ic(name).replace('class="i"', 'class="i" style="display:inline;vertical-align:-2px"');
  const rarTag = (r) => '<i class="rtag rar' + r + '">' + G.RAR[r][0] + '</i>';
  const stars = (x) => (x.stars ? ' <span class="gold">' + '★'.repeat(Math.min(5, x.stars)) + (x.stars > 5 ? '×' + x.stars : '') + '</span>' : '');
  const heroFlag = (x) => G.canPromote(x) || G.canRebirth(x) || G.canJob(x) || G.canWake(x);
  const mountURLs = {};
  const mountImg = (k, size) => { if (!mountURLs[k]) { const cv = A.mk(30, 22); cv.getContext('2d').drawImage(A.mountSheet(k), 0, 0, 30, 22, 0, 0, 30, 22); mountURLs[k] = cv.toDataURL(); } return '<i class="px mimg" style="width:' + (size || 60) + 'px;height:' + Math.round((size || 60) * 22 / 30) + 'px;background-image:url(' + mountURLs[k] + ')"></i>'; };
  const decURLs = {};
  const decImg = (d) => { const l = Math.max(1, G.decorLvl(d.id)), k = d.id + l; if (!decURLs[k]) { const s = A.prop(d.spr, d.id === 'canteiros' ? 0 : l - 1); decURLs[k] = s ? s.cv.toDataURL() : ''; } return decURLs[k]; };

  const herois = {
    title: 'Heróis', tabs: [],
    render(tab, sub) {
      const S = G.S;
      const h0 = sub && sub.hero ? S.heroes.find((x) => x.id === sub.hero) : null;
      if (h0) return heroDetail(h0, sub.ht || 'ficha');
      let h = '<div class="card hl"><div class="row"><span class="thumb sm" style="display:grid;place-items:center;font-size:22px;color:var(--epic)">' + ic('portal') + '</span><div class="gr"><h3>Portal de Aurora <small>' + S.heroes.length + ' / ' + G.heroCap() + ' heróis</small></h3><p>' + (S.heroes.length >= G.heroCap() ? 'Sem camas livres. Melhore a Hospedaria.' : 'O Portal revela três viajantes. Você escolhe um.') + '</p></div><button class="btn vio" data-a="portal">Abrir</button></div></div>';
      /* ordens em massa */
      const allOrder = S.heroes.length && S.heroes.every((x) => x.order === S.heroes[0].order) ? S.heroes[0].order : null;
      h += '<div class="card"><p style="margin:0 0 6px">' + inl('target') + ' Campo de caça de todos</p><div class="chips"><button data-a="orderall:auto" class="' + (allOrder === 'auto' ? 'on' : '') + '">Automático</button>' + G.ZONES.filter(G.zoneUnlocked).map((z) => '<button data-a="orderall:' + z.id + '" class="' + (allOrder === z.id ? 'on' : '') + '">' + z.name.split(' ')[0] + ' · Nv ' + G.zoneLvl(z, S.zones[z.id].tier) + '</button>').join('') + '</div>' +
        '<div class="row" style="margin-top:10px"><div class="gr"><p style="margin:0 0 6px">' + inl('sort') + ' Ordenar caçadores</p><div class="chips">' + G.HSORT.map(([id, l]) => '<button data-a="hsort:' + id + '" class="' + ((S.opts.hsort || 'padrao') === id ? 'on' : '') + '">' + l + '</button>').join('') + '</div></div></div>' +
        '<button class="btn wide" style="margin-top:10px" data-a="hhealall" ' + v.Dis(() => { const c = G.healAllCost(); return !c || G.S.gold < c; }) + '>' + ic('heart') + 'Curar todos · ' + v.T(() => G.fmt(G.healAllCost())) + ' moedas</button></div>';
      h += '<div class="hgrid">';
      for (const x of G.sortedHeroes()) {
        h += '<div class="hcard" style="border-color:' + G.RANK_COLOR[x.rank] + '"><button class="hc-top" data-a="herod:' + x.id + '"><span class="hc-nm">' + rank(x.rank) + '<b>' + esc(x.name) + '</b>' + rarTag(x.rar) + '</span><span class="hc-sub">' + v.T(() => 'Nv.' + x.lvl) + ' <span style="color:' + G.CLASSES[x.cls].color + '">' + G.heroTitle(x) + '</span>' + stars(x) + '</span>' +
          '<i class="px hc-pt" style="background-image:url(' + A.fullBody(A.heroLook(x)) + ')"></i>' + (heroFlag(x) ? '<span class="pill gold hc-up">' + ic('up') + '</span>' : (x.ap || 0) > 0 ? '<span class="pill hc-up" style="color:var(--epic)">' + ic('book') + x.ap + '</span>' : '') +
          '<span class="mini">' + bar(() => Math.round(100 * Math.max(0, x.hp) / G.heroStats(x).hp), 'g') + bar(() => Math.round(x.fome), 'o') + bar(() => Math.round(x.animo), 'p') + bar(() => Math.round(x.energia), 'b') + '</span><span class="hc-st">' + v.T(() => G.stateLabel(x) + (x.noZone ? ' · sem zona segura!' : '')) + '</span></button>' +
          '<div class="hc-btns"><button class="btn sm" data-a="hheal:' + x.id + '" ' + v.Dis(() => { const c = G.healCost(x); return !c || G.S.gold < c; }) + '>' + ic('heart') + v.T(() => (x.state === 'recover' || x.state === 'fallen' ? 'Reerguer' : 'Curar')) + '</button><button class="btn sm" data-a="herod:' + x.id + '">Info</button><button class="btn sm loc" data-a="follow:' + x.id + '">' + ic('target') + '</button></div></div>';
      }
      return h + '</div><p class="mut" style="text-align:center;font-size:11px;margin-top:8px">Barras: vida · saciedade · ânimo · vigor</p>';
    },
    subTitle(sub) { const h = sub && sub.hero ? G.S.heroes.find((x) => x.id === sub.hero) : null; return h ? h.name : null; },
  };

  const HTABS = [['ficha', 'scroll', 'Ficha'], ['habil', 'spark', 'Habilidades'], ['artes', 'book', 'Artes'], ['mont', 'shoe', 'Montaria'], ['bolsa', 'bag', 'Bolsa']];
  const dollSlot = (x, slot) => {
    const it = x.gear[slot], type = G.slotType(x, slot);
    return it ? '<button class="ds" data-a="item:' + it.id + ':' + x.id + '">' + gi(it) + '<small>' + G.SLOT[slot] + '</small></button>'
      : '<button class="ds vz" data-a="slotinfo:' + slot + ':' + x.id + '"><i class="gi px gi-' + type + '"></i><small>' + G.SLOT[slot] + '</small></button>';
  };
  const heroDetail = (x, tab) => {
    const look = A.heroLook(x);
    let h = '<div class="card hl"><div class="row"><div class="gr"><h3 style="font-size:16px">' + rank(x.rank) + ' ' + esc(x.name) + stars(x) + '</h3><p><span class="rar' + x.rar + '" style="font-weight:800">' + G.RAR[x.rar] + '</span> · ' + G.heroTitle(x) + ' · ' + v.T(() => 'Nível ' + x.lvl + ' / ' + G.RANK_CAP[x.rank]) + '</p></div><span class="cost" title="Bolsa do herói">' + ic('coin') + v.T(() => G.fmt(x.gold)) + '</span></div>' +
      '<div class="doll">' + dollSlot(x, 'acessorio') + dollSlot(x, 'elmo') + dollSlot(x, 'armadura') + dollSlot(x, 'arma') + '<i class="px dfig" style="background-image:url(' + A.fullBody(look) + ')"></i>' + dollSlot(x, 'luvas') + dollSlot(x, 'anel') + dollSlot(x, 'cinto') + dollSlot(x, 'botas') + '</div>' +
      '<div class="xpl">' + bar(() => Math.round(100 * x.xp / G.xpNeed(x.lvl)), 'big p') + '<b>' + v.T(() => 'EXP ' + G.fmt(x.xp) + '/' + G.fmt(G.xpNeed(x.lvl))) + '</b></div>' +
      '<div class="row" style="margin-top:8px"><span class="gr mut" style="font-size:12px">' + v.T(() => G.stateLabel(x)) + '</span><button class="btn sm" data-a="follow:' + x.id + '">' + ic('eye') + 'Seguir</button><span ' + v.At('style', () => (x.state === 'recover' || x.state === 'fallen' ? '' : 'display:none')) + '><button class="btn sm red" data-a="revive:' + x.id + '" ' + v.Dis(() => G.S.gold < G.price(x, 'revive') * 2) + '>' + ic('heart') + 'Reerguer · ' + G.fmt(G.price(x, 'revive') * 2) + '</button></span></div></div>';
    const tb = { ficha: () => (G.canPromote(x) || G.canRebirth(x) || G.canWake(x) ? 1 : 0), habil: () => (G.canJob(x) ? 1 : 0), artes: () => x.ap || 0 };
    h += '<div class="htabs">' + HTABS.map(([id, i, l]) => '<button data-a="htab:' + id + '" class="' + (id === tab ? 'on' : '') + '">' + ic(i) + '<span>' + l + '</span>' + (tb[id] ? v.Badge(tb[id], id === 'artes' ? 'vio' : '') : '') + '</button>').join('') + '</div>';
    return h + (tab === 'habil' ? tabHabil(x) : tab === 'artes' ? tabArtes(x) : tab === 'mont' ? tabMont(x) : tab === 'bolsa' ? tabBolsa(x) : tabFicha(x));
  };

  /* ---------- aba Ficha ---------- */
  const tabFicha = (x) => {
    const S = G.S, c = G.CLASSES[x.cls], st = () => G.heroStats(x);
    let h = '<div class="card"><div class="row"><div class="gr"><h3 class="cz rar' + x.rar + '" style="font-size:17px;letter-spacing:.08em">' + G.RAR[x.rar].toUpperCase() + '</h3><p style="margin-top:0">Nv.' + v.T(() => x.lvl) + ' <b style="color:' + c.color + '">' + G.heroTitle(x) + '</b></p></div><div style="text-align:right"><small class="mut" style="font-weight:800;letter-spacing:.06em">DPS</small><br><b style="font-size:17px">' + v.T(() => G.fmt(G.heroDps(x))) + '</b></div></div>' +
      '<div class="fgrid"><div><div class="need">' + ic('heart') + '<span class="nb">' + bar(() => Math.round(100 * Math.max(0, x.hp) / st().hp), 'big r') + '<i>' + v.T(() => 'HP ' + G.fmt(Math.max(0, x.hp)) + '/' + G.fmt(st().hp)) + '</i></span></div><div class="need">' + ic('meal') + '<span class="nb">' + bar(() => Math.round(x.fome), 'big o') + '<i>' + v.T(() => 'Saciedade ' + Math.round(x.fome) + '/100') + '</i></span></div><div class="need">' + ic('smile') + '<span class="nb">' + bar(() => Math.round(x.animo), 'big g') + '<i>' + v.T(() => 'Ânimo ' + Math.round(x.animo) + '/100') + '</i></span></div><div class="need">' + ic('zzz') + '<span class="nb">' + bar(() => Math.round(x.energia), 'big b') + '<i>' + v.T(() => 'Vigor ' + Math.round(x.energia) + '/100') + '</i></span></div></div>' +
      '<div class="fst"><div>' + ic('sword') + '<span>ATQ</span><b>' + v.T(() => G.fmt(st().atk)) + '</b></div><div>' + ic('shield') + '<span>DEF</span><b>' + v.T(() => G.fmt(st().def)) + '</b></div><div>' + ic('target') + '<span>CRÍT</span><b>' + v.T(() => pct(st().crit)) + '</b></div><div>' + ic('bolt') + '<span>VEL ATQ</span><b>' + v.T(() => (1 / st().int).toFixed(2).replace('.', ',')) + '</b></div><div>' + ic('run') + '<span>Evasão</span><b>' + v.T(() => pct(st().eva)) + '</b></div></div></div>' +
      '<div class="grid3" style="margin-top:8px"><div class="stat"><small>Dano crít.</small><b>' + v.T(() => pct(st().critDmg)) + '</b></div><div class="stat"><small>Aguenta até</small><b>' + v.T(() => 'Nv ' + st().eff) + '</b></div><div class="stat"><small>Abates · quedas</small><b>' + v.T(() => G.fmt(x.kills) + ' · ' + x.falls) + '</b></div></div>';
    /* Despertar */
    const w = G.wakeNext(x), wk = x.wake || 0;
    h += '<div class="wake' + (G.canWake(x) ? ' rdy' : '') + '"><div class="row"><b class="gr">Despertar</b><span class="pips">' + [0, 1, 2, 3].map((i) => '<i class="' + (i < wk ? 'on' : '') + '">' + ic('spark') + '</i>').join('') + '</span><b>' + wk + ' / 4</b></div>' +
      (w ? '<p><b class="gold">' + w.name + '</b> · +8% em vida, ataque e defesa · ' + w.perk + '.</p>' + (G.wakeReady(x) ? '<div class="row" style="margin-top:2px"><div class="gr">' + cost(w.gold, w.cost) + '</div><button class="btn vio" data-a="wake:' + x.id + '" ' + v.Dis(() => !G.canWake(x)) + '>' + ic('spark') + 'Despertar</button></div>' : '<p class="bad">Requer Rank ' + G.RANKS[w.rank] + (w.rank === 7 ? ' (ou um renascimento)' : '') + '.</p>') : '<p class="gold">Despertar completo: +32% em vida, ataque e defesa.</p>') + '</div></div>';
    h += '<p class="mut" style="font-size:12px;margin:2px 2px 0">' + inl('potion') + ' ' + v.T(() => x.potions + ' / ' + G.potCap(x)) + ' poções · espólio ' + v.T(() => x.bagN + ' / ' + G.bagCap(x)) + '</p>';
    /* ordens */
    h += '<div class="sec">Ordens</div><div class="card"><p style="margin:0 0 6px">Onde caçar</p><div class="chips"><button data-a="order:' + x.id + ':auto" class="' + (x.order === 'auto' ? 'on' : '') + '">Automático</button>' + G.ZONES.filter(G.zoneUnlocked).map((z) => '<button data-a="order:' + x.id + ':' + z.id + '" class="' + (x.order === z.id ? 'on' : '') + '">' + z.name.split(' ')[0] + ' · Nv ' + G.zoneLvl(z, S.zones[z.id].tier) + '</button>').join('') + '</div><p style="margin:10px 0 6px">Cautela — quando recuar</p><div class="seg">' + G.CAUTION.map((cc, i) => '<button data-a="caution:' + x.id + ':' + i + '" class="' + (x.caution === i ? 'on' : '') + '">' + cc.name + '</button>').join('') + '</div><p>' + ['Recua só com 20% de vida e encara chefes mais fortes. Mais abates, mais quedas.', 'Recua com 35% de vida. Entra em chefes quando aguenta ou tem companhia.', 'Recua com 50% de vida e nunca enfrenta chefes. Seguro, porém lento.'][x.caution] + '</p></div>';
    /* promoção */
    const q = G.promoReq(x);
    h += '<div class="sec">Carreira</div>';
    if (G.canRebirth(x)) h += '<div class="card hl"><h3>Renascimento</h3><p>' + esc(x.name) + ' volta ao nível 1, Rank E, com +30% em todos os atributos para sempre. Mantém equipamento, vocação, Artes e Despertar, e ganha 15 pontos de Arte.</p><button class="btn vio wide" style="margin-top:8px" data-a="rebirth:' + x.id + '">' + ic('star') + 'Renascer sob as Duas Luas</button></div>';
    else if (q) h += '<div class="card"><h3>Promoção a Rank ' + G.RANKS[x.rank + 1] + ' <small>atributos ×' + (G.RANK_MULT[x.rank + 1] / G.RANK_MULT[x.rank]).toFixed(2).replace('.', ',') + ' · nível máximo ' + G.RANK_CAP[x.rank + 1] + '</small></h3><div class="kv"><span>Nível ' + q.lvl + '</span><b ' + v.At('class', () => (x.lvl >= q.lvl ? 'good' : 'bad')) + '>' + v.T(() => x.lvl + ' / ' + q.lvl) + '</b></div><div class="kv"><span>Guilda nível ' + q.guilda + '</span><b class="' + (G.bLvl('guilda') >= q.guilda ? 'good' : 'bad') + '">' + G.bLvl('guilda') + ' / ' + q.guilda + '</b></div><div class="row" style="margin-top:4px"><div class="gr">' + cost(q.gold, q.cost) + '</div><button class="btn pri" data-a="promote:' + x.id + '" ' + v.Dis(() => !G.canPromote(x)) + '>' + ic('up') + 'Promover</button></div></div>';
    else h += '<div class="card"><p>Rank máximo. Alcance o nível 80 para renascer.</p></div>';
    h += '<div class="sec">Traços</div>';
    for (const t of x.traits) h += '<div class="trait"><b>' + G.TRAITS[t].name + '</b><span>' + G.TRAITS[t].desc + '</span></div>';
    h += '<button class="btn wide" style="margin-top:10px;color:#ff9a9a" data-a="dismiss:' + x.id + '">' + ic('trash') + 'Dispensar ' + esc(x.name) + '</button>';
    return h;
  };

  /* ---------- aba Habilidades (árvore de vocação) ---------- */
  const skTile = (x, i, sk, col) => {
    const l = G.skillLvl(x, i), r = G.canSkillUp(x, i), c = G.skillUpCost(x, i), maxed = l >= 10;
    return '<div class="sk"><div class="row"><span class="ski" style="background:' + col + '">' + ic(i === 0 ? 'sword' : i === 1 ? 'bolt' : 'spark') + '<em>Nv.' + l + '</em></span><div class="gr"><b>' + sk.name + '</b><p>' + sk.desc + ' Recarga de ' + sk.cd + ' s.' + (l > 1 ? ' <span class="good">Força +' + Math.round((G.skillPow(x, i) - 1) * 100) + '%.</span>' : '') + '</p></div></div>' +
      (maxed ? '<p class="gold" style="margin-top:4px">Nível máximo.</p>' : '<div class="row" style="margin-top:2px"><div class="gr">' + cost(c.gold, c.cost) + '</div><button class="btn sm pri" data-a="skup:' + x.id + ':' + i + '" ' + v.Dis(() => !G.canSkillUp(x, i).ok) + '>' + ic('up') + 'Treinar</button></div>' + (r.ok || !r.why || r.why.indexOf('Faltam') === 0 ? '' : '<p class="bad" style="margin-top:4px">' + r.why + '.</p>')) + '</div>';
  };
  const jobOpt = (x, id, pickable) => {
    const j = G.JOBS[id], c = G.CLASSES[x.cls];
    return '<button class="sk opt2' + (pickable ? ' can' : ' off') + '" data-a="job:' + x.id + ':' + id + '"><div class="row"><span class="ski" style="background:' + (pickable ? c.color : '#3a3f55') + '">' + ic(j.t === 2 ? 'bolt' : 'spark') + '<em>Nv.0</em></span><div class="gr"><b>' + j.skill.name + '</b><p>' + (pickable ? j.skill.desc : 'Disponível após a mudança de classe para <b style="color:' + c.color + '">' + j.name + '</b>') + '</p></div>' + (pickable ? ic('next') : ic('lock')) + '</div></button>';
  };
  const tabHabil = (x) => {
    const c = G.CLASSES[x.cls], ps = G.PASSIVES[x.cls], t = G.jobTier(x), ready = G.jobReady(x);
    let h = '<div class="sec">Habilidade básica</div>' + skTile(x, 0, c.skill, c.color) + '<div class="sk"><div class="row"><span class="ski" style="background:#4a5578">' + ic('shield') + '<em>pass.</em></span><div class="gr"><b>' + ps.name + '</b><p>' + ps.desc + ' Sempre ativa.</p></div></div></div>';
    /* 2ª habilidade */
    h += '<div class="sec">2ª habilidade</div>';
    if (x.j2) h += skTile(x, 1, G.JOBS[x.j2].skill, c.color);
    else { h += G.jobBranches(x.cls, 2).map((id) => jobOpt(x, id, ready)).join(''); if (!ready) h += '<p class="mut" style="font-size:11.5px;margin:0 2px">A primeira mudança de classe abre no <b class="gold">Rank C</b>.</p>'; }
    /* 3ª habilidade */
    h += '<div class="sec">3ª habilidade</div>';
    if (x.j3) h += skTile(x, 2, G.JOBS[x.j3].skill, c.color);
    else { h += G.jobBranches(x.cls, 3, x.j2).map((id) => jobOpt(x, id, !!x.j2 && ready)).join(''); if (!(x.j2 && ready)) h += '<p class="mut" style="font-size:11.5px;margin:0 2px">' + (x.j2 ? 'A segunda mudança de classe abre no <b class="gold">Rank A</b>.' : 'Escolha primeiro a 2ª classe. A segunda mudança abre no <b class="gold">Rank A</b>.') + '</p>'; }
    /* árvore */
    const node = (id, on, dim) => { const j = id ? G.JOBS[id] : null; return '<button class="node' + (on ? ' on' : '') + (dim ? ' dim' : '') + '"' + (id ? ' data-a="job:' + x.id + ':' + id + '"' : '') + ' style="' + (on ? 'border-color:' + c.color : '') + '"><b>' + (j ? j.name : c.name) + '</b><small>' + (j ? bonusText(j.p) : bonusText(ps.p)) + '</small></button>'; };
    const b2 = G.jobBranches(x.cls, 2);
    h += '<div class="sec">Árvore de vocação</div><div class="tree"><div class="tl">' + node(null, true) + '</div><div class="tarrow">' + ic('up') + '</div><div class="tl">' + b2.map((id) => node(id, x.j2 === id, x.j2 && x.j2 !== id)).join('') + '</div><div class="tarrow">' + ic('up') + '</div><div class="tl t4">' + b2.map((b) => '<div class="tcol">' + G.jobBranches(x.cls, 3, b).map((id) => node(id, x.j3 === id, (x.j2 && x.j2 !== b) || (x.j3 && x.j3 !== id))).join('') + '</div>').join('') + '</div></div>';
    if (t < 3) { const q = G.jobReq(t + 1); h += '<div class="card" style="margin-top:8px"><h3>' + (t === 1 ? '1ª' : '2ª') + ' mudança de classe</h3><div class="kv"><span>Rank ' + G.RANKS[q.rank] + ' ou superior</span><b class="' + (ready ? 'good' : 'bad') + '">Rank ' + G.RANKS[x.rank] + (x.stars ? ' ★' : '') + '</b></div>' + cost(q.gold, q.cost) + '<p>' + (ready ? 'Toque em uma das vocações acima para ver os detalhes e escolher.' : 'Os Tomos de Técnica caem de elites, chefes, da Fenda e da Maré.') + ' A escolha fecha o outro ramo.</p></div>'; }
    if (x.j2) h += '<button class="btn wide" style="margin-top:8px" data-a="jobreset:' + x.id + '" ' + v.Dis(() => G.S.selos < G.jobResetCost()) + '>' + ic('seal') + 'Trocar de vocação · ' + G.jobResetCost() + ' Selos</button>';
    return h;
  };
  const jobModal = (x, id) => {
    const j = G.JOBS[id], q = G.jobReq(j.t), opts = G.jobOptions(x), mine = x.j2 === id || x.j3 === id, pick = opts.indexOf(id) >= 0 && G.jobReady(x);
    UI.modal('<div class="eyebrow">' + (j.t === 2 ? '2ª classe' : '3ª classe') + ' · ' + G.CLASSES[j.base].name + '</div><h2>' + j.name + '</h2><p class="lead">' + j.desc + '</p><div class="trait"><b>' + j.skill.name + '</b><span>' + j.skill.desc + ' Recarga de ' + j.skill.cd + ' s.</span></div><div class="trait"><b>Passiva da vocação</b><span>' + bonusText(j.p) + '</span></div>' +
      (mine ? '<p class="lead good" style="font-weight:800">Vocação atual de ' + esc(x.name) + '.</p><div class="acts"><button class="btn pri" data-a="mclose">Fechar</button></div>'
        : pick ? UI.cost(q.gold, q.cost) + '<p class="lead" style="font-size:12px;margin-bottom:0">A escolha fecha o outro ramo. Trocar depois custa ' + G.jobResetCost() + ' Selos.</p><div class="acts"><button class="btn" data-a="mclose">Agora não</button><button class="btn pri" data-a="jobok:' + x.id + ':' + id + '"' + (G.canJob(x) ? '' : ' disabled') + '>' + ic('up') + 'Tornar-se ' + j.name + '</button></div>'
          : '<p class="lead bad" style="font-size:12.5px">' + (j.t === 3 && !x.j2 ? 'Vem depois de ' + G.JOBS[j.from].name + '.' : j.t === 3 && x.j2 !== j.from ? 'Pertence ao ramo de ' + G.JOBS[j.from].name + '.' : j.t <= G.jobTier(x) ? 'Este ramo foi fechado pela escolha atual.' : 'Requer Rank ' + G.RANKS[q.rank] + '.') + '</p><div class="acts"><button class="btn pri" data-a="mclose">Fechar</button></div>'), { pause: false });
  };

  /* ---------- aba Artes Secretas ---------- */
  let artStep = 1;
  const tabArtes = (x) => {
    let h = '<div class="card hl"><div class="row"><div class="gr"><h3>' + inl('book') + ' Artes Secretas</h3><p>Cada ponto reforça um aspecto do herói para sempre. Pontos vêm de níveis, promoções, chefes, vocações e meditação.</p></div></div><div class="grid2" style="margin-top:8px"><div class="stat"><small>Pontos disponíveis</small><b class="epic" style="font-size:18px">' + v.T(() => x.ap || 0) + '</b></div><div class="stat"><small>Pontos Secretos totais</small><b class="good" style="font-size:18px">' + v.T(() => G.artSpent(x)) + '</b></div></div>' +
      '<div class="row" style="margin-top:8px"><span class="mut" style="font-size:12px;font-weight:700">Por toque</span><div class="seg gr">' + [1, 5, 25].map((n) => '<button data-a="artstep:' + n + '" class="' + (artStep === n ? 'on' : '') + '">+' + n + '</button>').join('') + '</div></div></div>';
    h += '<div class="arts">';
    for (const a of G.ARTS) {
      const n = G.artLvl(x, a.id), val = Math.abs(a.per * n * 100);
      h += '<button class="arte' + (n >= G.ART_MAX ? ' max' : '') + '" data-a="art:' + x.id + ':' + a.id + '" ' + v.Dis(() => !(x.ap > 0) || G.artLvl(x, a.id) >= G.ART_MAX) + '><span class="ai">' + ic(a.icon) + (a.per < 0 ? '<i>' + ic('minus') + '</i>' : '') + '</span><b>' + a.name + '</b><em>' + n + '/' + G.ART_MAX + '</em><small>' + (a.per < 0 ? '−' : '+') + (val % 1 ? val.toFixed(1).replace('.', ',') : val) + '% ' + a.what.replace(/^de /, '') + '</small></button>';
    }
    h += '</div><div class="grid2" style="margin-top:8px"><button class="btn" data-a="artauto:' + x.id + '" ' + v.Dis(() => !(x.ap > 0)) + '>' + ic('check') + 'Distribuir pela classe</button><button class="btn" data-a="artbuy:' + x.id + '" ' + v.Dis(() => !G.bOk('treino') || G.S.gold < G.artBuyCost(x)) + '>' + ic('zzz') + 'Meditar +1 · ' + v.T(() => G.fmt(G.artBuyCost(x))) + '</button></div>' +
      (G.bOk('treino') ? '' : '<p class="mut" style="font-size:11.5px;text-align:center;margin-top:6px">A meditação guiada exige o Campo de Treino.</p>') +
      '<button class="btn wide" style="margin-top:8px" data-a="artreset:' + x.id + '" ' + v.Dis(() => !G.artSpent(x) || G.S.selos < G.artResetCost()) + '>' + ic('seal') + 'Redistribuir tudo · ' + G.artResetCost() + ' Selo</button>';
    return h;
  };

  /* ---------- aba Montaria ---------- */
  const mountCard = (mt, x) => {
    const d = G.MOUNTS[mt.k], rider = G.S.heroes.find((q) => q.mount === mt.id);
    return '<div class="card"><div class="row">' + mountImg(mt.k, 66) + '<div class="gr"><h3 class="rar' + d.rar + '">' + d.name + ' <span class="lvl">Nv ' + mt.lvl + '</span></h3><p>' + bonusText(d.p, G.mountF(mt)) + ' · +' + d.bag + ' de bolsa' + (G.S.stable.hungry ? ' <span class="bad">(com fome: metade)</span>' : '') + '</p>' + (mt.lvl < G.MOUNT_MAX ? '<div style="margin-top:5px">' + bar(() => Math.round(100 * mt.xp / G.mountNeed(mt)), 'o') + '</div><p>' + v.T(() => mt.xp + ' / ' + G.mountNeed(mt)) + ' de ração para o nível ' + (mt.lvl + 1) + '</p>' : '<p class="gold">Nível máximo.</p>') + '</div></div>' +
      '<div class="row" style="margin-top:8px">' + (mt.lvl < G.MOUNT_MAX ? '<button class="btn sm" data-a="mfeed:' + mt.id + ':1" ' + v.Dis(() => (G.S.res.racao || 0) < 1) + '><i class="px ri-racao" style="width:16px;height:16px"></i>+1</button><button class="btn sm" data-a="mfeed:' + mt.id + ':10" ' + v.Dis(() => (G.S.res.racao || 0) < 1) + '><i class="px ri-racao" style="width:16px;height:16px"></i>+10</button>' : '') + '<span class="gr"></span>' +
      (x ? '<button class="btn sm" data-a="mrider:' + mt.id + ':0">Desmontar</button>' : '<button class="btn sm" data-a="mride:' + mt.id + '">' + ic('people') + (rider ? esc(rider.name) : 'Sem cavaleiro') + '</button><button class="btn sm" style="color:#ff9a9a" data-a="mfree:' + mt.id + '">' + ic('trash') + '</button>') + '</div></div>';
  };
  const tabMont = (x) => {
    const S = G.S, mt = G.mountOf(x);
    if (mt) return '<div class="sec">Montaria de ' + esc(x.name) + '</div>' + mountCard(mt, x) + '<p class="mut" style="font-size:11.5px;text-align:center">Cada montaria em uso come 1 ração por dia. Ração no Estábulo: ' + v.T(() => Math.floor(G.S.res.racao || 0)) + '.</p>';
    const free = S.stable.list.filter((m) => !S.heroes.some((q) => q.mount === m.id));
    let h = '<div class="empty" style="padding:22px 10px 12px"><b style="color:var(--text);font-size:14.5px">Nenhum animal de montaria foi montado.</b><br><br>' + (G.bLvl('estabulo') ? 'Montarias aceleram a viagem, aumentam a bolsa e dão bônus de combate.' : 'Construa o Estábulo (Cidadela nível 3) para domar montarias.') + '<br><br><button class="btn pri" data-a="open:reino:' + (G.bLvl('estabulo') ? 'estabulo' : 'obras') + '">' + ic('shoe') + 'Ir para o Estábulo</button></div>';
    if (free.length) { h += '<div class="sec">Livres no Estábulo</div>'; for (const m of free) { const d = G.MOUNTS[m.k]; h += '<div class="card"><div class="row">' + mountImg(m.k, 54) + '<div class="gr"><h3 class="rar' + d.rar + '">' + d.name + ' <span class="lvl">Nv ' + m.lvl + '</span></h3><p>' + bonusText(d.p, G.mountF(m)) + ' · +' + d.bag + ' de bolsa</p></div><button class="btn sm pri" data-a="mrider:' + m.id + ':' + x.id + '">Montar</button></div></div>'; } }
    return h;
  };
  const riderModal = (mt) => {
    const d = G.MOUNTS[mt.k];
    let h = '<div class="eyebrow">Estábulo do Vale</div><h2>' + d.name + '</h2><p class="lead">Quem vai montar? ' + bonusText(d.p, G.mountF(mt)) + '.</p><button class="opt" data-a="mrider:' + mt.id + ':0"><b>Ninguém</b><span>Fica descansando na baia.</span></button>';
    for (const x of G.S.heroes) { const cur = G.mountOf(x); h += '<button class="opt" data-a="mrider:' + mt.id + ':' + x.id + '"><b>' + rank(x.rank) + ' ' + esc(x.name) + ' <span class="mut" style="font-weight:700">Nv ' + x.lvl + ' · ' + G.heroTitle(x) + '</span></b><span>' + (cur ? (cur === mt ? 'Cavaleiro atual' : 'Monta ' + G.MOUNTS[cur.k].name + ' — troca de montaria') : 'A pé') + '</span></button>'; }
    UI.modal(h + '<div class="acts"><button class="btn" data-a="mclose">Cancelar</button></div>', { pause: false });
  };

  /* ---------- aba Bolsa ---------- */
  const tabBolsa = (x) => {
    const ks = Object.keys(x.bag).filter((k) => x.bag[k] > 0);
    let h = '<div class="sec">Material <span class="mut" style="letter-spacing:0;text-transform:none;font-family:inherit">' + x.bagN + ' / ' + G.bagCap(x) + '</span></div>';
    h += ks.length ? '<div class="bagg">' + ks.map((k) => '<span class="bi" title="' + G.RES[k].name + '"><i class="px ri-' + k + '"></i><b>' + x.bag[k] + '</b><small>' + G.RES[k].name.split(' ')[0] + '</small></span>').join('') + '</div>' : '<div class="empty">Bolsa vazia. O espólio aparece aqui até ser entregue na Guilda.</div>';
    h += '<div class="sec">Provisões</div><div class="grid3"><div class="stat"><small>Poções</small><b>' + v.T(() => x.potions + ' / ' + G.potCap(x)) + '</b></div><div class="stat"><small>Moedas</small><b class="gold">' + v.T(() => G.fmt(x.gold)) + '</b></div><div class="stat"><small>Espólio</small><b>' + v.T(() => x.bagN + ' / ' + G.bagCap(x)) + '</b></div></div>' +
      '<p class="mut" style="font-size:11.5px;margin:8px 2px">O herói volta sozinho quando a bolsa enche. As moedas dele viram suas quando ele gasta na cidade.</p>' +
      '<button class="btn wide" data-a="recall:' + x.id + '" ' + v.Dis(() => x.state !== 'hunt' && x.state !== 'travel') + '>' + ic('castle') + 'Chamar de volta à cidade</button>';
    return h;
  };

  /* ================= REINO › Decoração e Estábulo ================= */
  const tabDecor = () => {
    const ch = G.charm();
    let h = '<div class="card hl"><div class="row"><span class="thumb sm" style="display:grid;place-items:center;font-size:22px;color:#ff9ac8">' + ic('flower') + '</span><div class="gr"><h3>Encanto de Aurora <span class="lvl">' + ch + '</span></h3><p>Cada ponto de Encanto rende +1% de dízimo; a cada 10, a cidade abriga mais um morador. Cada enfeite ainda dá um bônus próprio e aparece na praça.</p></div></div></div>';
    let locked = '';
    for (const d of G.DECOR) {
      const l = G.decorLvl(d.id), r = G.canDecor(d.id), c = G.decorCost(d.id, l + 1);
      const val = (n) => (d.pct ? '+' + Math.round(d.per * n * 100) + '%' : '+' + d.per * n) + d.unit;
      if (G.bLvl('cidadela') < d.cid) { locked += '<div class="card lock"><div class="row"><span class="thumb sm" style="display:grid;place-items:center;font-size:20px">' + ic('lock') + '</span><div class="gr"><h3>' + d.name + '</h3><p>Requer Cidadela nível ' + d.cid + '. ' + val(1) + ' por nível.</p></div></div></div>'; continue; }
      h += '<div class="card"><div class="row"><i class="thumb px" style="background-image:url(' + decImg(d) + ');background-size:contain"' + (l ? ' data-a="goto:' + d.spots[0][0] + ':' + d.spots[0][1] + '"' : '') + '></i><div class="gr"><h3>' + d.name + (l ? ' <span class="lvl">Nv ' + l + '</span>' : ' <span class="pill gold">novo</span>') + '</h3><p>' + d.desc + '</p><p>' + (l ? 'Agora: <b class="gold">' + val(l) + '</b> · ' : '') + 'Encanto +' + d.charm + ' por nível</p></div></div>' +
        (l >= G.DECOR_MAX ? '<p class="gold" style="margin-top:6px">No nível máximo.</p>' : '<p style="margin-top:6px"><b class="good">Nv ' + (l + 1) + ':</b> ' + val(l + 1) + '</p><div class="row" style="margin-top:2px"><div class="gr">' + cost(c.gold, c.cost) + '</div><button class="btn pri" data-a="decor:' + d.id + '" ' + v.Dis(() => !G.canDecor(d.id).ok) + '>' + ic(l ? 'up' : 'hammer') + (l ? 'Ampliar' : 'Colocar') + '</button></div>') + '</div>';
      void r;
    }
    return h + (locked ? '<div class="sec">Em breve</div>' + locked : '');
  };
  const tabEstabulo = () => {
    const S = G.S, L = G.bLvl('estabulo');
    if (!L) return '<div class="empty">' + ic('shoe').replace('class="i"', 'class="i" style="font-size:28px;margin:0 auto 8px"') + (G.bAvailable('estabulo') ? 'O Estábulo do Vale ainda não foi erguido. Ele fica ao norte das muralhas.' : 'O Estábulo do Vale abre com a Cidadela no nível 3.') + '<br><br><button class="btn pri" data-a="open:reino:obras">Ver construções</button></div>';
    const riders = S.heroes.filter((x) => x.mount).length;
    let h = '<div class="card hl"><div class="grid3"><div class="stat"><small>Baias</small><b>' + S.stable.list.length + ' / ' + G.stallCap() + '</b></div><div class="stat"><small>Ração</small><b>' + v.T(() => Math.floor(G.S.res.racao || 0) + ' / ' + G.resCap('racao')) + '</b></div><div class="stat"><small>Consumo por dia</small><b>' + riders + '</b></div></div><p style="margin-top:8px">Tomé transforma 2 trigo em 1 ração (' + G.racaoRate().toFixed(1).replace('.', ',') + ' por hora, das 5h às 21h). Ração alimenta as montarias em uso e as faz subir de nível.' + (S.stable.hungry ? ' <b class="bad">Faltou ração hoje: as montarias rendem a metade.</b>' : '') + '</p></div>';
    h += '<div class="sec">Suas montarias</div>';
    if (!S.stable.list.length) h += '<div class="empty">Nenhuma montaria ainda. Dome a primeira logo abaixo.</div>';
    for (const mt of S.stable.list) h += mountCard(mt, null);
    h += '<div class="sec">Domar</div>';
    for (const k of G.MOUNT_IDS) {
      const d = G.MOUNTS[k], r = G.canTame(k), lockd = L < d.est;
      h += '<div class="card' + (lockd ? ' lock' : '') + '"><div class="row">' + mountImg(k, 60) + '<div class="gr"><h3 class="rar' + d.rar + '">' + d.name + ' <small>' + G.RAR[d.rar] + '</small></h3><p>' + d.desc + '</p><p><b class="gold">' + bonusText(d.p) + '</b> · +' + d.bag + ' de bolsa</p></div></div>' + (lockd ? '<p class="bad" style="margin-top:6px">Requer Estábulo nível ' + d.est + '.</p>' : '<div class="row" style="margin-top:2px"><div class="gr">' + cost(d.gold, d.cost) + '</div><button class="btn pri" data-a="tame:' + k + '" ' + v.Dis(() => !G.canTame(k).ok) + '>' + ic('shoe') + 'Domar</button></div>' + (!r.ok && r.why === 'Sem baias livres' ? '<p class="bad" style="margin-top:4px">Sem baias livres. Melhore o Estábulo.</p>' : '')) + '</div>';
    }
    return h;
  };
  const mascateCard = () => {
    const S = G.S, ms = S.mascate; if (!ms.offers.length) return '';
    let h = '<div class="card hl"><h3>' + inl('bag') + ' Mascate errante <small>ofertas de hoje</small></h3><p>Passa pelo Mercado todo amanhecer com quatro raridades. O que não for comprado vai embora com ele.</p>';
    ms.offers.forEach((o, i) => {
      const nm = o.id === 'nucleos' ? 'Núcleo' : G.RES[o.id].name, icn = o.id === 'nucleos' ? '<span style="font-size:22px;color:#c8a0ff;width:28px;display:grid;place-items:center">' + ic('core') + '</span>' : '<i class="px ri-' + o.id + '" style="width:28px;height:28px"></i>';
      h += '<div class="row" style="margin-top:8px">' + icn + '<div class="gr"><b style="font-size:12.5px">' + o.n + '× ' + nm + '</b></div><button class="btn sm ' + (o.selos ? 'vio' : 'pri') + '" data-a="masc:' + i + '" ' + v.Dis(() => !!G.S.mascate.offers[i].sold || (o.selos ? G.S.selos < o.selos : G.S.gold < o.gold)) + '>' + (o.sold ? ic('check') + 'Comprado' : o.selos ? ic('seal') + o.selos : ic('coin') + G.fmt(o.gold)) + '</button></div>';
    });
    return h + '</div>';
  };

  /* ================= ARMAZÉM DA CIDADE ================= */
  let whSlot = 'todos';
  const SP_INFO = { tomo: 'Sobe o nível das habilidades e paga as mudanças de classe. Cai de elites, chefes, Fenda e Maré.', alma: 'Usado no Despertar e na 2ª mudança de classe. Vem de chefes, da Maré e da Fenda.', po_estelar: 'Sobra do desmonte de peças Incomuns ou melhores. Usado no Despertar.', racao: 'Feita no Estábulo com trigo. Alimenta e evolui as montarias.', essencia: 'Vem da Fenda Infinita. Forja equipamentos Ascendentes.' };
  const whEquip = () => {
    const S = G.S, cap = G.invCap();
    let h = '<div class="card hl"><div class="row"><span class="thumb sm" style="display:grid;place-items:center;font-size:22px;color:var(--gold2)">' + ic('chest') + '</span><div class="gr"><h3>Armazém da Cidade <small>' + S.inv.length + ' / ' + cap + '</small></h3>' + bar(() => Math.min(100, Math.round(100 * G.S.inv.length / G.invCap())), 'big' + (S.inv.length >= cap ? ' r' : '')) + '<p>Tudo aqui fica à venda para os heróis. Peças <b>reservadas</b> ' + inl('lock') + ' não são vendidas nem desmontadas em lote.</p></div></div></div>';
    h += '<div class="chips" style="margin-bottom:8px"><button data-a="whslot:todos" class="' + (whSlot === 'todos' ? 'on' : '') + '">Tudo</button>' + G.SLOT_IDS.map((s) => '<button data-a="whslot:' + s + '" class="' + (whSlot === s ? 'on' : '') + '">' + G.SLOT[s] + '</button>').join('') + '</div>';
    const cnt = [0, 0, 0, 0, 0, 0]; for (const it of S.inv) if (!it.lock) cnt[it.rar]++;
    h += '<div class="dall"><span>Desmontar<br>tudo</span>' + G.RAR.map((n, r) => '<button class="rar' + r + '" data-a="dall:' + r + '"' + (cnt[r] ? '' : ' disabled') + '>' + n + (cnt[r] ? ' ' + cnt[r] : '') + '</button>').join('') + '</div>';
    const items = S.inv.filter((it) => whSlot === 'todos' || G.GEAR[it.type].kind === whSlot).sort((a, b) => b.tier - a.tier || b.rar - a.rar || b.plus - a.plus);
    if (!items.length) return h + '<div class="empty" style="padding:34px 10px"><b style="font-size:15px;color:var(--text)">Sem equipamentos no Armazém da Cidade.</b><br><br>' + (G.bLvl('ferraria') ? '<button class="btn pri" data-a="open:forja:forjar">' + ic('hammer') + 'Ir para a Forja</button>' : 'Construa a Ferraria para começar a forjar.') + '</div>';
    for (const it of items) {
      const y = G.dismantleYield(it);
      h += '<div class="card' + (it.lock ? ' lk' : '') + '"><div class="row">' + gi(it) + '<div class="gr"><h3 class="rar' + it.rar + '">' + G.itemName(it) + (it.lock ? ' ' + inl('lock') : '') + '</h3><p>' + G.RAR[it.rar] + ' · ' + G.SLOT[G.GEAR[it.type].kind] + ' · ' + itemLine(it) + ' · <span class="gold">' + G.fmt(G.itemPrice(it)) + ' moedas</span></p></div></div>' +
        '<div class="row whb" style="margin-top:8px"><button class="btn sm" data-a="item:' + it.id + '">' + ic('up') + 'Aprimorar</button><button class="btn sm" data-a="gift:' + it.id + '">' + ic('gift') + 'Dar</button><button class="btn sm' + (it.lock ? ' on' : '') + '" data-a="lock:' + it.id + '" title="Reservar">' + ic(it.lock ? 'lock' : 'unlock') + '</button><span class="gr"></span><button class="btn sm" data-a="dis:' + it.id + '"' + (it.lock ? ' disabled' : '') + ' title="' + Object.keys(y).map((k) => y[k] + ' ' + G.RES[k].name).join(', ') + '">' + ic('hammer') + 'Desmontar</button><button class="btn sm" data-a="melt:' + it.id + '"' + (it.lock ? ' disabled' : '') + '>' + ic('coin') + G.fmt(Math.round(G.itemPrice(it) * (G.bOk('mercado') ? 0.4 : 0.25))) + '</button></div></div>';
    }
    return h;
  };
  const resTile = (id, capFn, extra) => '<div class="res"><i class="px ri-' + id + '"></i><div class="gr"><b>' + v.T(() => G.fmt(G.S.res[id] || 0) + (capFn ? ' / ' + G.fmt(capFn()) : '')) + '</b><small>' + G.RES[id].name + (extra || '') + '</small></div></div>';
  const armazem = {
    title: 'Armazém', tabs: [['equip', 'Equipamento'], ['consumo', 'Consumíveis'], ['materiais', 'Materiais'], ['especiais', 'Especiais']],
    render(tab) {
      const S = G.S, rates = G.prodRates(), rt = (id) => (rates[id] ? ' · +' + rates[id].toFixed(1).replace('.', ',') + '/h' : '');
      if (tab === 'equip') return whEquip();
      if (tab === 'consumo') {
        let h = '<div class="sec">Para os heróis</div><div class="grid2">' + resTile('refeicao', () => G.resCap('refeicao'), rt('refeicao')) + resTile('pocao', () => G.resCap('pocao'), rt('pocao')) + '</div>';
        h += '<div class="sec">Para as montarias</div><div class="grid2">' + resTile('racao', () => G.resCap('racao'), rt('racao')) + '</div><p class="mut" style="font-size:11.5px;margin:6px 2px">' + SP_INFO.racao + '</p>';
        h += '<div class="sec">Para o treino</div><div class="grid2">' + resTile('tomo') + '</div><p class="mut" style="font-size:11.5px;margin:6px 2px">' + SP_INFO.tomo + '</p>';
        return h;
      }
      if (tab === 'materiais') {
        let h = '<div class="sec">Matéria-prima</div><div class="grid2">'; for (const id of ['madeira', 'pedra', 'minerio', 'trigo', 'ervas']) h += resTile(id, () => G.resCap(id), rt(id)); h += '</div>';
        const mats = Object.keys(S.res).filter((k) => G.RES[k] && G.BASE_RES.indexOf(k) < 0 && !G.RES[k].sp && !G.RES[k].emb && k !== 'essencia' && S.res[k] >= 1);
        h += '<div class="sec">Espólio dos heróis</div>';
        h += mats.length ? '<div class="bagg">' + mats.map((k) => '<span class="bi" title="' + G.RES[k].name + '"><i class="px ri-' + k + '"></i><b>' + v.T(() => G.fmt(G.S.res[k] || 0)) + '</b><small>' + G.RES[k].name.split(' ')[0] + '</small></span>').join('') + '</div>' : '<div class="empty">Nenhum espólio ainda. Os heróis entregam na Guilda o que caçam.</div>';
        return h + '<p class="mut" style="font-size:11.5px;text-align:center;margin-top:10px">Venda o excedente em Reino › Mercado.</p>';
      }
      if (tab === 'especiais') {
        let h = '<div class="grid2"><div class="res"><span style="font-size:20px;color:#ff9ac8">' + ic('seal') + '</span><div class="gr"><b>' + v.T(() => G.S.selos) + '</b><small>Selos de Renome</small></div></div><div class="res"><span style="font-size:20px;color:#c8a0ff">' + ic('core') + '</span><div class="gr"><b>' + v.T(() => G.S.nucleos) + '</b><small>Núcleos</small></div></div></div>';
        for (const id of ['alma', 'po_estelar', 'essencia']) h += '<div class="card" style="margin-top:8px"><div class="row"><i class="px ri-' + id + '" style="width:30px;height:30px"></i><div class="gr"><h3>' + G.RES[id].name + ' <span class="lvl">' + v.T(() => G.fmt(G.S.res[id] || 0)) + '</span></h3><p>' + SP_INFO[id] + '</p></div></div></div>';
        const embs = Object.keys(G.RES).filter((k) => G.RES[k].emb);
        h += '<div class="sec">Emblemas dos chefes</div><div class="bagg">' + embs.map((k) => '<span class="bi' + ((S.res[k] || 0) >= 1 ? '' : ' none') + '" title="' + G.RES[k].name + '"><i class="px ri-' + k + '"></i><b>' + v.T(() => G.fmt(G.S.res[k] || 0)) + '</b><small>' + G.RES[k].name.replace('Emblema ', '') + '</small></span>').join('') + '</div><p class="mut" style="font-size:11.5px;margin:8px 2px">Emblemas pagam promoções de rank, mudanças de classe e melhorias de construções.</p>';
        return h;
      }
      return '';
    },
  };

  /* ---------- ações dos sistemas novos ---------- */
  const hid = (id) => G.S.heroes.find((x) => x.id === +id);
  const mid = (id) => G.S.stable.list.find((m) => m.id === +id);
  Object.assign(UI.ACT, {
    htab: (a) => { if (UI.sheet && UI.sheet.sub) { UI.sheet.sub.ht = a[0]; draw(true); } },
    hsort: (a) => { G.S.opts.hsort = a[0]; draw(false); },
    orderall: (a) => { G.orderAll(a[0]); UI.toast(a[0] === 'auto' ? 'Cada herói escolhe onde caçar.' : 'Todos os heróis vão caçar em ' + G.ZONE[a[0]].name + '.', 'info', 'target'); draw(false); },
    hheal: (a) => { const h = hid(a[0]); if (h && !G.healNow(h)) UI.toast('Faltam moedas.', 'bad'); },
    hhealall: () => { const n = G.healAll(); if (n) UI.toast(n + ' herói(s) curado(s).', 'good', 'heart'); else UI.toast('Faltam moedas.', 'bad'); },
    recall: (a) => { const h = hid(a[0]); if (h && G.recall(h)) UI.toast(h.name + ' está voltando para a cidade.', 'info', 'castle'); },
    slotinfo: (a) => { const h = hid(a[1]); if (!h) return; const t = G.slotType(h, a[0]), g = G.GEAR[t]; UI.toast(G.gearUnlocked(t) ? g.name + ': forje na Ferraria — ' + h.name + ' compra se tiver moedas.' : g.name + ': requer Ferraria nível ' + g.req + '.', 'info', 'anvil'); },
    job: (a) => { const h = hid(a[0]); if (h && G.JOBS[a[1]]) jobModal(h, a[1]); },
    jobok: (a) => { const h = hid(a[0]); UI.closeModal(); if (h && G.changeJob(h, a[1])) { UI.banner('Mudança de classe', G.JOBS[a[1]].name, h.name + ' aprendeu ' + G.JOBS[a[1]].skill.name); draw(false); } else UI.toast('Faltam recursos para a mudança de classe.', 'bad'); },
    jobreset: (a) => { const h = hid(a[0]); if (h) UI.confirm('Trocar de vocação?', h.name + ' volta à classe-base e pode escolher outro caminho. Os níveis das habilidades ficam guardados. Custa ' + G.jobResetCost() + ' Selos; refazer as mudanças de classe custa de novo.', 'Trocar', () => { if (!G.jobReset(h)) UI.toast('Faltam Selos de Renome.', 'bad'); draw(false); }); },
    skup: (a) => { const h = hid(a[0]); if (!h) return; if (G.skillUp(h, +a[1])) UI.toast(G.heroSkills(h)[+a[1]].name + ' subiu para o nível ' + G.skillLvl(h, +a[1]) + '.', 'good', 'up'); else UI.toast((G.canSkillUp(h, +a[1]).why || 'Não é possível agora') + '.', 'bad'); draw(false); },
    wake: (a) => { const h = hid(a[0]); if (h && G.wake(h)) { UI.banner('Despertar ' + h.wake + ' / 4', h.name, G.WAKES[h.wake - 1].name); draw(false); } },
    artstep: (a) => { artStep = +a[0]; draw(false); },
    art: (a) => { const h = hid(a[0]); if (h && G.artAdd(h, a[1], artStep)) draw(false); },
    artauto: (a) => { const h = hid(a[0]); if (!h) return; const n = G.artAuto(h); if (n) UI.toast(n + ' ponto(s) distribuído(s) nas Artes da classe.', 'good', 'book'); draw(false); },
    artbuy: (a) => { const h = hid(a[0]); if (h && !G.artBuy(h)) UI.toast(G.bOk('treino') ? 'Faltam moedas.' : 'Requer o Campo de Treino.', 'bad'); },
    artreset: (a) => { const h = hid(a[0]); if (h) UI.confirm('Redistribuir as Artes?', 'Todos os pontos gastos voltam para ' + h.name + ' distribuir de novo. Custa ' + G.artResetCost() + ' Selo de Renome.', 'Redistribuir', () => { if (!G.artReset(h)) UI.toast('Faltam Selos de Renome.', 'bad'); draw(false); }); },
    tame: (a) => { const mt = G.tame(a[0]); if (!mt) return UI.toast(G.canTame(a[0]).why + '.', 'bad'); UI.banner('Nova montaria', G.MOUNTS[a[0]].name, 'Escolha um cavaleiro no Estábulo'); draw(false); },
    mfeed: (a) => { const mt = mid(a[0]); if (mt && !G.mountFeed(mt, +a[1])) UI.toast('Sem ração no Estábulo.', 'bad'); else draw(false); },
    mride: (a) => { const mt = mid(a[0]); if (mt) riderModal(mt); },
    mrider: (a) => { const mt = mid(a[0]), h = +a[1] ? hid(a[1]) : null; if (UI.modalOpen) UI.closeModal(); if (!mt) return; G.mountAssign(mt, h); if (h) UI.toast(h.name + ' agora monta ' + G.MOUNTS[mt.k].name + '.', 'good', 'shoe'); draw(false); },
    mfree: (a) => { const mt = mid(a[0]); if (mt) UI.confirm('Soltar ' + G.MOUNTS[mt.k].name + '?', 'A montaria volta para a natureza e a baia fica livre. Não há como desfazer.', 'Soltar', () => { G.mountRelease(mt); draw(false); }); },
    decor: (a) => { if (!G.buyDecor(a[0])) UI.toast((G.canDecor(a[0]).why || 'Não é possível agora') + '.', 'bad'); else draw(false); },
    masc: (a) => { if (!G.mascateBuy(+a[0])) UI.toast('Não foi possível comprar.', 'bad'); else { UI.toast('Negócio fechado com o Mascate.', 'good', 'bag'); draw(false); } },
    whslot: (a) => { whSlot = a[0]; draw(false); },
    lock: (a) => { const it = G.S.inv.find((i) => i.id === +a[0]); if (it) { G.toggleLock(it); UI.toast(it.lock ? 'Peça reservada: os heróis não compram.' : 'Peça liberada para venda.', 'info', it.lock ? 'lock' : 'unlock'); } },
    dis: (a) => { const it = G.S.inv.find((i) => i.id === +a[0]); if (!it) return; const y = G.dismantle(it); if (y) UI.toast('Desmontado: ' + Object.keys(y).map((k) => '+' + y[k] + ' ' + G.RES[k].name).join(', '), 'good', 'hammer'); },
    dall: (a) => { const r = +a[0], n = G.S.inv.filter((it) => !it.lock && it.rar === r).length; if (!n) return; UI.confirm('Desmontar ' + n + ' peça(s)?', 'Todas as peças de raridade ' + G.RAR[r] + ' que não estão reservadas viram material (metade da receita' + (r ? ' e Pó Estelar' : '') + '). Não há como desfazer.', 'Desmontar tudo', () => { const o = G.dismantleAll(r); if (o.n) UI.toast(o.n + ' peça(s) desmontada(s): ' + Object.keys(o.tot).map((k) => '+' + o.tot[k] + ' ' + G.RES[k].name.split(' ')[0]).join(', '), 'good', 'hammer'); }); },
  });
  /* guia das novidades: aparece uma vez, depois da apresentação */
  UI.vocGuide = () => {
    G.S.tut.seen.v20 = 1;
    UI.modal('<div class="eyebrow">Aurora v' + G.VERSION + ' · Vocações</div><h2>Novos caminhos</h2><p class="lead">A ficha de cada herói ganhou cinco abas. Toque em um herói e explore.</p>' +
      [['spark', 'Vocações', 'No Rank C e no Rank A o herói muda de classe: dois ramos, quatro destinos, uma 2ª e uma 3ª habilidade.'], ['book', 'Artes Secretas', '15 artes de 0 a 100. Cada nível, promoção e chefe rende pontos.'], ['star', 'Despertar', 'Quatro estágios com Cristais de Alma e Pó Estelar.'], ['shoe', 'Montarias', 'O Estábulo (Cidadela 3) doma seis espécies e faz ração.'], ['anvil', '8 peças de equipamento', 'Elmo, botas, manoplas, cinturão e anel abrem com a Ferraria.'], ['chest', 'Armazém e Decoração', 'Reserve, desmonte em lote e enfeite a praça por bônus e Encanto.']]
        .map(([i, t, d]) => '<div class="row" style="margin-bottom:9px"><span class="thumb sm" style="display:grid;place-items:center;font-size:20px;color:var(--gold2)">' + ic(i) + '</span><div class="gr"><b style="font-size:13px">' + t + '</b><br><span class="mut" style="font-size:12px">' + d + '</span></div></div>').join('') +
      '<div class="acts"><button class="btn pri" data-a="mclose">Entendi</button></div>');
  };

