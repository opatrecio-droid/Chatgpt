  /* ================= v22: mascotes, Viveiro, espólio no chão e Incursões ================= */
  const petImg = (k, w) => '<i class="px pimg" style="width:' + w + 'px;height:' + Math.round(w * 12 / 14) + 'px;background-image:url(' + A.petURL(k) + ')"></i>';
  const pctTxt = (v) => (Math.round(v * 1000) / 10).toString().replace('.', ',') + '%';
  const petThumb = (p, w) => '<span class="pthumb" style="border-color:' + G.RAR_COLOR[p.rar] + '">' + petImg(p.k, w || 42) + '</span>';
  const rarTxt = (r) => '<i class="rtag rar' + r + '">' + G.RAR[r] + '</i>';
  const roleLine = (p) => {
    const d = G.PETS[p.k], ro = G.PET_ROLE[d.role];
    const t = d.role === 'carga' ? 'leva ' + G.petLoadCap(p) + ' itens, 50% a mais que outros da mesma raridade'
      : d.role === 'faro' ? 'busca o espólio a até ' + String(G.PET_R_FARO).replace('.', ',') + ' passos do dono e corre 35% mais'
        : d.role === 'fraqueza' ? 'a cada ' + G.WEAK_CD + ' s, o alvo do dono bate e defende ' + pctTxt(G.weakF(p)) + ' menos por ' + G.WEAK_DUR + ' s (chefes resistem à metade)'
          : 'cura ' + pctTxt(G.vigHeal(p)) + ' da vida do dono a cada ' + G.VIG_CD + ' s em combate';
    return '<span class="prole">' + ic(ro.icon) + ro.name + '</span> ' + t + '.';
  };
  /* espaço roxo "Mascote" na ficha */
  const petSlot = (x) => {
    const p = G.petOf(x);
    return '<button class="ds sp' + (p ? '' : ' vz') + '" data-a="petpick:' + x.id + '">' + (p ? '<i class="gi px" style="background-image:url(' + A.petURL(p.k) + ');background-size:34px 29px;border-color:' + G.RAR_COLOR[p.rar] + '!important"></i>' : '<i class="gi">' + ic('paw') + '</i>') + '<small>Mascote</small></button>';
  };
  const petCard = (p, x, viv) => {
    const d = G.PETS[p.k], cap = G.petLoadCap(p), owner = p.hero ? hid(p.hero) : null, mine = !!x && p.hero === x.id;
    let btn = '';
    if (x) btn = mine ? '<button class="btn sm" data-a="petset:' + x.id + ':0">' + ic('close') + 'Dispensar</button>' : '<button class="btn sm pri" data-a="petset:' + x.id + ':' + p.id + '">' + ic('paw') + 'Acompanhar</button>';
    else if (viv) btn = owner ? '<span class="pill">' + ic('people') + esc(owner.name) + '</span>' : '<button class="btn sm" data-a="petfree:' + p.id + '">Soltar</button>';
    return '<div class="card pcard' + (mine ? ' hl' : '') + '"><div class="row" style="align-items:flex-start">' + petThumb(p) + '<div class="gr"><h3>' + d.name + ' ' + rarTxt(p.rar) + '</h3><p><b class="gold">' + bonusText(G.petBonus(p)) + '</b></p><p>' + roleLine(p) + '</p><p>Carga ' + p.bagN + ' / ' + cap + (viv ? (owner ? ' · acompanha ' + esc(owner.name) : ' · livre no Viveiro') : '') + '</p></div></div>' +
      (btn ? '<div class="row pact"><span class="gr mut pdesc">' + esc(d.desc) + '</span>' + btn + '</div>' : '') + '</div>';
  };
  const petModal = (x) => {
    const S = G.S, cur = G.petOf(x), free = G.petFree().sort((a, b) => b.rar - a.rar || G.PET_IDS.indexOf(a.k) - G.PET_IDS.indexOf(b.k));
    let h = '<div class="eyebrow">Viveiro de Aurora · ' + S.pets.length + ' / ' + G.petCap() + '</div><h2>Mascote de ' + esc(x.name) + '</h2><p class="lead" style="font-size:12.5px">O mascote segue o herói, recolhe o espólio que cai no chão e entrega tudo na Guilda junto com ele. Raridade maior carrega mais e fortalece o bônus e o papel.</p>';
    if (cur) h += '<div class="sec">Acompanhando</div>' + petCard(cur, x);
    h += '<div class="sec">Livres no Viveiro</div>' + (free.length ? free.map((p) => petCard(p, x)).join('') : '<div class="card"><p style="margin:0">' + (S.pets.length ? 'Todos os mascotes já acompanham alguém.' : 'Nenhum mascote ainda.') + ' Ovos vêm das Incursões (Missões › Incursões) e, às vezes, do Mascate; o primeiro chega por um Caminho.</p></div>');
    UI.modal(h + '<div class="acts"><button class="btn" data-a="petviv">' + ic('chest') + 'Viveiro</button><button class="btn" data-a="mclose">Fechar</button></div>', { pause: false });
  };
  /* aba Bolsa: a carga do mascote */
  const petBagSec = (x) => {
    const p = G.petOf(x);
    if (!p) return '<div class="sec">Mascote</div><div class="card"><div class="row"><span class="pthumb">' + ic('paw') + '</span><p class="gr" style="margin:0">Sem mascote. Toque no espaço roxo «Mascote» da ficha para escolher um. Ele recolhe o espólio que cai no chão.</p></div></div>';
    const ks = Object.keys(p.bag).filter((k) => p.bag[k] > 0), cap = G.petLoadCap(p);
    return '<div class="sec">Carga do mascote <span class="mut" style="letter-spacing:0;text-transform:none;font-family:inherit">' + v.T(() => p.bagN + ' / ' + cap) + '</span></div><div class="card"><div class="row">' + petThumb(p, 36) + '<div class="gr"><b style="font-size:13px">' + G.PETS[p.k].name + '</b> ' + rarTxt(p.rar) + '<div style="margin-top:6px">' + bar(() => Math.round(100 * p.bagN / cap), 'big o') + '</div></div></div>' +
      (ks.length ? '<div class="bagg" style="margin-top:8px">' + ks.map((k) => '<span class="bi" title="' + G.RES[k].name + '"><i class="px ri-' + k + '"></i><b>' + p.bag[k] + '</b><small>' + G.RES[k].name.split(' ')[0] + '</small></span>').join('') + '</div>' : '<p style="margin-top:8px">Nada recolhido nesta saída.</p>') +
      '<p style="margin-top:6px">A carga vai para o Armazém junto com a bolsa, na Guilda. Se o dono cair, o mascote não perde nada.</p></div>';
  };
  /* Armazém › Ateliê › Viveiro */
  const viveiroSec = () => {
    const S = G.S, L = S.pets.slice().sort((a, b) => b.rar - a.rar || (a.hero ? 0 : 1) - (b.hero ? 0 : 1) || G.PET_IDS.indexOf(a.k) - G.PET_IDS.indexOf(b.k));
    let h = '<div class="sec" id="viveiro">Viveiro <span class="mut" style="letter-spacing:0;text-transform:none;font-family:inherit">' + S.pets.length + ' / ' + G.petCap() + '</span></div>';
    h += '<div class="card hl"><p style="margin-top:0">Os mascotes acompanham os heróis e recolhem o espólio que cai no chão. Cabem ' + G.petCap() + ' (8 + 2 por nível do Estábulo). Três mascotes livres da mesma raridade se fundem em um da raridade seguinte.</p><div class="chips" style="margin-top:8px">' +
      [0, 1, 2, 3, 4].map((r) => { const n = G.petFree().filter((p) => p.rar === r).length; return '<button data-a="petfuse:' + r + '"' + (n >= 3 ? '' : ' disabled') + '>Fundir <b class="rar' + r + '">' + G.RAR[r] + '</b> · ' + n + '</button>'; }).join('') + '</div></div>';
    return h + (L.length ? L.map((p) => petCard(p, null, true)).join('') : '<div class="card"><p style="margin:0">Nenhum mascote ainda. O primeiro vem pelo Caminho «Adote o primeiro mascote»; os raros, das Incursões.</p></div>');
  };
  let fuseSel = [];
  const fuseModal = (r) => {
    const fr = G.petFree().filter((p) => p.rar === r);
    fuseSel = fuseSel.filter((id) => fr.some((p) => p.id === id)); if (!fuseSel.length) fuseSel = fr.slice(0, 3).map((p) => p.id);
    let h = '<div class="eyebrow">Viveiro · fusão</div><h2>Fundir três ' + G.RAR[r].toLowerCase() + 's</h2><p class="lead" style="font-size:12.5px">Escolha três. Eles viram um mascote ' + G.RAR[r + 1] + ' de uma das três espécies, por sorteio. A carga vai de ' + G.PET_CAP[r] + ' para ' + G.PET_CAP[r + 1] + ' e os bônus ficam ' + Math.round((G.PET_POW[r + 1] / G.PET_POW[r] - 1) * 100) + '% mais fortes.</p>';
    for (const p of fr) { const on = fuseSel.indexOf(p.id) >= 0; h += '<button class="slot" data-a="fsel:' + r + ':' + p.id + '" style="' + (on ? 'box-shadow:inset 0 0 0 2px var(--gold)' : '') + '">' + petImg(p.k, 36) + '<span class="gr"><b>' + G.PETS[p.k].name + '</b><br><span class="mut" style="font-size:11.5px">' + G.PET_ROLE[G.PETS[p.k].role].name + ' · ' + bonusText(G.petBonus(p)) + '</span></span><i class="sw' + (on ? ' on' : '') + '"></i></button>'; }
    UI.modal(h + '<div class="acts"><button class="btn" data-a="mclose">Cancelar</button><button class="btn pri" data-a="fgo:' + r + '"' + (fuseSel.length === 3 ? '' : ' disabled') + '>Fundir</button></div>', { pause: false });
  };

  /* ================= Missões › Incursões ================= */
  let incZ = null, incParty = null; const incG = {};
  const PHASE = { walk: 'Marcha até o covil', w1: '1ª onda de elites', w2: '2ª onda de elites', alfa: 'O Alfa' };
  const arrowR = () => ic('back').replace('class="i"', 'class="i" style="transform:scaleX(-1)"');
  const incRunCard = (r) => {
    const z = G.ZONE[r.z], alfa = () => G.mons.find((m) => m.id === (G.S.inc.run && G.S.inc.run.alfa) && !m.dead);
    let h = '<div class="card"><h3>' + ic('skull') + ' Incursão em andamento <small>' + z.name + ' · Grau ' + G.roman(r.g) + '</small></h3>';
    h += '<div class="kv"><span>Fase</span><b>' + v.T(() => (G.S.inc.run ? PHASE[G.S.inc.run.phase] : 'encerrada')) + '</b></div>';
    h += '<div class="kv"><span>Tempo de combate</span><b>' + v.T(() => { const q = G.S.inc.run; if (!q) return '—'; return q.phase === 'walk' ? 'começa no covil' : 'restam ' + Math.max(0, Math.ceil(q.limit - q.ft)) + ' s'; }) + '</b></div>';
    if (r.phase === 'alfa') h += '<div class="kv"><span>Alfa · ' + G.MON[z.boss].name + ' Nv ' + r.lvl + '</span><b>' + v.T(() => { const m = alfa(); return m ? Math.round(100 * Math.max(0, m.hp) / m.hpMax) + '%' : '—'; }) + '</b></div>' + bar(() => { const m = alfa(); return m ? Math.round(100 * Math.max(0, m.hp) / m.hpMax) : 0; }, 'big p');
    h += '<div class="sec">Grupo</div>';
    for (const id of r.ids) { const x = hid(id); if (!x) continue; h += '<div class="row" style="margin-bottom:6px"><i class="px" style="width:30px;height:30px;background-image:url(' + UI.portrait(x) + ');background-size:30px 30px"></i><div class="gr"><b style="font-size:12.5px">' + esc(x.name) + '</b> <span class="mut" style="font-size:11px">' + v.T(() => (x.state === 'inc' ? x.potions + ' poções' : G.stateLabel(x))) + '</span>' + bar(() => Math.round(100 * Math.max(0, x.hp) / G.heroStats(x).hp), 'g') + '</div></div>'; }
    return h + '<button class="btn wide" style="margin-top:8px" data-a="goto:' + z.lair[0] + ':' + z.lair[1] + '">' + ic('eye') + 'Ver o covil</button></div>';
  };
  const tabIncursoes = () => {
    const S = G.S;
    if (!G.incOpen()) return '<div class="empty">' + ic('lock').replace('class="i"', 'class="i" style="font-size:28px;margin:0 auto 8px"') + 'As Incursões se abrem quando Aurora alcançar o Nível de Reino 6. São a fonte dos mascotes raros.</div>';
    const zs = G.ZONES.filter(G.zoneUnlocked);
    if (!incZ || !zs.some((z) => z.id === incZ)) incZ = zs[0].id;
    let h = '<div class="card hl"><h3 class="cz">Incursões</h3><p>Até cinco heróis invadem o covil de uma zona: duas ondas de elites e depois o Alfa, uma versão mais forte do chefe. Lá dentro ninguém recua. A vitória choca um ovo de mascote — quanto mais alto o Grau, mais rara a cria.</p><div class="grid3" style="margin-top:8px"><div class="stat"><small>Vitórias</small><b>' + (S.inc.wins || 0) + '</b></div><div class="stat"><small>Viveiro</small><b>' + S.pets.length + ' / ' + G.petCap() + '</b></div><div class="stat"><small>Hoje</small><b>' + v.T(() => (G.incFree() ? 'grátis' : G.incCost() + ' Núcleos')) + '</b></div></div></div>';
    if (S.inc.run) return h + incRunCard(S.inc.run);
    const L = S.inc.last;
    if (L && L.day >= S.day - 1 && G.ZONE[L.z]) h += '<div class="card' + (L.win ? ' lk' : '') + '"><div class="row">' + (L.win && L.k ? petImg(L.k, 34) : ic(L.win ? 'check' : 'skull')) + '<p class="gr" style="margin:0">Última: ' + G.ZONE[L.z].name + ', Grau ' + G.roman(L.g) + ' — ' + (L.win ? 'vitória' + (L.k ? (L.pet ? '; chocou ' : '; Viveiro cheio, o ovo de ') + G.PETS[L.k].name + ' ' + G.RAR[L.rar] + (L.pet ? '' : ' virou Pó Estelar') : '') : 'derrota (' + (L.why === 'time' ? 'o tempo acabou' : 'todos caíram') + ')') + '.</p></div></div>';
    h += '<div class="sec">Covil</div><div class="chips">' + zs.map((z) => { const b = G.incBest(z.id); return '<button data-a="incz:' + z.id + '" class="' + (z.id === incZ ? 'on' : '') + '">' + z.name.split(' ')[0] + (b ? ' · ' + G.roman(b) : '') + '</button>'; }).join('') + '</div>';
    const max = G.incMax(incZ), g = G.clamp(incG[incZ] || max, 1, max), z = G.ZONE[incZ], lvl = G.incLvl(incZ, g), zm = G.ZMATS[z.n]; incG[incZ] = g;
    h += '<div class="card" style="margin-top:8px"><div class="row"><button class="btn sm" data-a="incg:-1"' + (g <= 1 ? ' disabled' : '') + '>' + ic('back') + '</button><div class="gr" style="text-align:center"><b class="cz" style="font-size:17px">Grau ' + G.roman(g) + '</b><br><span class="mut" style="font-size:11.5px">' + z.name + '</span></div><button class="btn sm" data-a="incg:1"' + (g >= max ? ' disabled' : '') + '>' + arrowR() + '</button></div>';
    h += '<div class="kv"><span>Alfa</span><b>' + G.MON[z.boss].name + ' · Nv ' + lvl + '</b></div><div class="kv"><span>Ondas de elites</span><b>Nv ' + (lvl - 4) + ' e ' + (lvl - 3) + '</b></div><div class="kv"><span>Tempo de combate</span><b>' + Math.round(G.INC_LIMIT / 60) + ' min</b></div>';
    h += '<div class="kv"><span>Prêmio</span><b>ovo · ' + (4 + 2 * g) + ' ' + G.RES[zm.a].name.split(' ')[0] + ' · ' + (4 + 2 * g) + ' ' + G.RES[zm.b].name.split(' ')[0] + ' · ' + (1 + Math.floor(g / 3)) + ' ' + G.RES[zm.r].name.split(' ')[0] + ' · ' + (1 + Math.floor(g / 3)) + ' Tomo(s)</b></div>';
    if (g === max && g > G.incBest(incZ) && g < G.INC_GRADES) h += '<p class="gold" style="margin-top:6px">Vencer abre o Grau ' + G.roman(g + 1) + ' neste covil.</p>';
    h += '<p style="margin-top:8px">Chance de raridade do ovo</p><div class="odds">' + G.INC_ODDS[g - 1].map((w, i) => '<span class="od' + (w ? '' : ' z') + '" style="border-color:' + G.RAR_COLOR[i] + '"><b style="color:' + G.RAR_COLOR[i] + '">' + String(w).replace('.', ',') + '%</b><small>' + G.RAR[i] + '</small></span>').join('') + '</div>';
    h += '<p style="margin-top:8px">Nativos do covil, mais prováveis no ovo:</p><div class="row" style="margin-top:4px;gap:14px">' + (G.ZPETS[incZ] || []).map((k) => '<span class="row" style="gap:6px">' + petImg(k, 28) + '<span style="font-size:12px"><b>' + G.PETS[k].name + '</b><br><span class="mut">' + G.PET_ROLE[G.PETS[k].role].name + '</span></span></span>').join('') + '</div></div>';
    const avail = S.heroes.filter((x) => x.state !== 'fallen' && x.state !== 'recover' && x.state !== 'rift');
    if (!incParty) incParty = avail.slice().sort((a2, b2) => G.heroStats(b2).eff - G.heroStats(a2).eff).slice(0, 5).map((x) => x.id);
    incParty = incParty.filter((id) => avail.some((x) => x.id === id));
    h += '<div class="sec">Grupo (até 5)</div>';
    for (const x of avail) { const on = incParty.indexOf(x.id) >= 0, e = G.heroStats(x).eff, pt = G.petOf(x); h += '<button class="slot" data-a="incp:' + x.id + '" style="' + (on ? 'box-shadow:inset 0 0 0 2px var(--gold)' : '') + '"><i class="px" style="width:36px;height:36px;background-image:url(' + UI.portrait(x) + ');background-size:36px 36px"></i><span class="gr"><b>' + rank(x.rank) + ' ' + esc(x.name) + '</b><br><span class="' + (e >= lvl + 2 ? 'good' : e >= lvl - 2 ? 'gold' : 'bad') + '" style="font-size:11.5px">aguenta até Nv ' + e + ' · ' + x.potions + ' poções</span></span>' + (pt ? petImg(pt.k, 24) : '') + '<i class="sw' + (on ? ' on' : '') + '"></i></button>'; }
    const c = G.incCanStart(incZ, g);
    h += '<button class="btn pri wide" style="margin-top:6px" data-a="incgo" ' + v.Dis(() => !G.incCanStart(incZ, g).ok || !incParty || !incParty.length) + '>' + ic('skull') + (G.incFree() ? 'Enviar Incursão' : 'Tentar de novo hoje · ' + G.incCost() + ' Núcleos') + '</button><p class="mut" style="text-align:center;font-size:11.5px;margin-top:6px">' + (c.ok ? 'Uma tentativa grátis por dia. Não sai junto com a Maré nem com a Fenda.' : c.why + '.') + '</p>';
    return h;
  };
  UI.dropTap = (d) => { G.dropTake(d); };
  Object.assign(UI.ACT, {
    petpick: (a) => { const h = hid(a[0]); if (h) petModal(h); },
    petset: (a) => {
      const h = hid(a[0]); if (!h) return; const p = +a[1] ? G.petById(+a[1]) : G.petOf(h); if (!p) return;
      if (+a[1]) { G.petAssign(p, h); UI.toast(G.PETS[p.k].name + ' agora acompanha ' + h.name + '.', 'good', 'paw'); } else { G.petAssign(p, null); UI.toast(G.PETS[p.k].name + ' voltou ao Viveiro.', 'info', 'paw'); }
      petModal(h); draw(false);
    },
    petviv: () => { UI.closeModal(); UI.open('armazem', 'atelie'); setTimeout(() => { const el = document.getElementById('viveiro'); if (el) el.scrollIntoView({ block: 'start' }); }, 30); },
    petfree: (a) => { const p = G.petById(+a[0]); if (p) UI.confirm('Soltar ' + G.PETS[p.k].name + '?', 'O mascote volta para a natureza e deixa ' + 2 * (p.rar + 1) + ' Pó Estelar no Viveiro. Não há como desfazer.', 'Soltar', () => { G.petRelease(p); draw(false); }); },
    petfuse: (a) => { fuseSel = []; fuseModal(+a[0]); },
    fsel: (a) => { const id = +a[1], i = fuseSel.indexOf(id); if (i >= 0) fuseSel.splice(i, 1); else if (fuseSel.length < 3) fuseSel.push(id); else UI.toast('A fusão usa exatamente três.', 'bad'); fuseModal(+a[0]); },
    fgo: () => { const n = G.petFuse(fuseSel.map((id) => G.petById(id))); UI.closeModal(); fuseSel = []; if (n) { UI.banner('Fusão no Viveiro', G.PETS[n.k].name, G.RAR[n.rar]); draw(false); } else UI.toast('Escolha três mascotes livres da mesma raridade.', 'bad'); },
    incz: (a) => { incZ = a[0]; draw(false); },
    incg: (a) => { const max = G.incMax(incZ); incG[incZ] = G.clamp((incG[incZ] || max) + +a[0], 1, max); draw(false); },
    incp: (a) => { const id = +a[0], i = incParty.indexOf(id); if (i >= 0) incParty.splice(i, 1); else if (incParty.length < 5) incParty.push(id); else UI.toast('A Incursão leva no máximo 5 heróis.', 'bad'); draw(false); },
    incgo: () => { const g = incG[incZ] || G.incMax(incZ); if (G.incStart(incZ, g, incParty || [])) { incParty = null; UI.toast('Incursão a caminho do covil!', 'boss', 'skull'); draw(true); } else UI.toast((G.incCanStart(incZ, g).why || 'Escolha o grupo') + '.', 'bad'); },
  });
  G.on('inc', (d) => {
    if (!d || !d.end || !d.last) return; const L = d.last;
    if (L.win) UI.banner('Incursão vencida · Grau ' + G.roman(L.g), L.k ? G.PETS[L.k].name + ' ' + G.RAR[L.rar] : 'Vitória', L.pet ? 'Um ovo chocou no Viveiro' : 'Viveiro cheio: o ovo virou Pó Estelar e Cristal de Alma');
  });
  UI.compGuide = () => {
    G.S.tut.seen.v22 = 1;
    UI.modal('<div class="eyebrow">Aurora v' + G.VERSION + ' · Companheiros</div><h2>O que há de novo</h2>' +
      [['bag', 'Espólio no chão', 'Metade do que os monstros soltam vai para a bolsa do herói; a outra metade cai no chão e some depois de um tempo. Toque no brilho para mandar direto ao Armazém.'],
        ['paw', 'Mascotes de verdade', 'Cada herói leva um mascote que recolhe o que caiu e entrega na Guilda junto com ele. Toque no espaço roxo «Mascote» da ficha.'],
        ['star', 'Raridade e papéis', 'Raridade maior carrega mais. Alguns lançam Fraqueza nos monstros, outros dão vida e curam o dono.'],
        ['skull', 'Incursões', 'Missões › Incursões, a partir do Nível de Reino 6: elites, um Alfa e um ovo de mascote no fim. Graus altos chocam crias raras.'],
        ['chest', 'Viveiro e fusão', 'Armazém › Ateliê › Viveiro: três mascotes da mesma raridade viram um da raridade seguinte.']]
        .map(([i, t, d]) => '<div class="row" style="margin-bottom:9px"><span class="thumb sm" style="display:grid;place-items:center;font-size:20px;color:var(--gold2)">' + ic(i) + '</span><div class="gr"><b style="font-size:13px">' + t + '</b><br><span class="mut" style="font-size:12px">' + d + '</span></div></div>').join('') +
      '<div class="acts"><button class="btn pri" data-a="mclose">Entendi</button></div>');
  };
