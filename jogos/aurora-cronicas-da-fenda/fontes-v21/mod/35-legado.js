/* ===== 35-legado.js ===== */
/* 35-legado: v21 — guarda-roupa (trajes, asas, mascotes), relíquias dos chefes, dificuldade do reino,
   enfeites que mudam de lugar, os Caminhos (objetivos dos sistemas novos) e Artes automáticas. Sem DOM. */
'use strict';
(function () {
  const Wd = G.W;

  /* ================= guarda-roupa e relíquias ================= */
  /* cost: { gold, selos, nucleos, res }. look = cores do traje; c = cores das asas / do mascote. */
  const C = (slot, name, rar, req, cost, p, extra) => Object.assign({ slot, name, rar, req, cost, p }, extra);
  G.COS = {
    /* trajes */
    t_viajante: C('traje', 'Manto do Viajante', 1, 1, { gold: 1800 }, { spd: 0.05, xp: 0.04 }, { look: { body: '#8a7448', cape: '#4a5a3a', trim: '#d8c8a0', legs: '#5a4a3a' }, desc: 'Poeira de mil estradas. Anda mais e aprende mais.' }),
    t_guarda: C('traje', 'Farda da Guarda Real', 1, 2, { gold: 2600 }, { def: 0.05 }, { look: { body: '#3b5fa8', cape: '#c8473d', trim: '#e2b659', legs: '#2c3a5a' }, desc: 'O azul de Aurora, engomado para a batalha.' }),
    t_lunar: C('traje', 'Vestes das Duas Luas', 2, 4, { selos: 6 }, { hp: 0.05, mood: 0.1 }, { look: { body: '#d8dcec', cape: '#8a78c8', trim: '#fff0a0', legs: '#9aa0c0' }, desc: 'Tecidas no Santuário. Quem as veste dorme tranquilo.' }),
    t_rubro: C('traje', 'Traje da Lua Rubra', 2, 6, { selos: 8 }, { atk: 0.05, crit: 0.02 }, { look: { body: '#8a1c2c', cape: '#2a2030', trim: '#ff9a5a', legs: '#2a2030' }, desc: 'Só aparece nas noites vermelhas.' }),
    t_fenda: C('traje', 'Tecido da Fenda', 3, 8, { selos: 5, res: { essencia: 12 } }, { cdr: 0.05, atk: 0.04 }, { look: { body: '#5a2ac8', cape: '#1c1234', trim: '#d070ff', legs: '#2a1c4a' }, desc: 'O pano vibra junto com a rachadura do mundo.' }),
    t_cerimonial: C('traje', 'Armadura Cerimonial', 4, 12, { gold: 60000, selos: 10 }, { hp: 0.06, atk: 0.04, def: 0.06 }, { look: { body: '#e2b659', cape: '#f8f0d8', trim: '#ffffff', legs: '#b08c40' }, desc: 'Ouro batido para os campeões do reino.' }),
    /* asas */
    a_pena: C('asas', 'Asas de Pena', 1, 2, { gold: 4000 }, { spd: 0.06 }, { c: ['#f4f0e8', '#c8c0b0', '#ffffff'], desc: 'Leves como promessa de festa.' }),
    a_cripta: C('asas', 'Asas da Cripta', 2, 5, { selos: 5 }, { eva: 0.04, atk: 0.03 }, { c: ['#5a4a6a', '#34283f', '#9a84b0'], bat: 1, desc: 'Couro de morcego das Ruínas, curtido à luz da lua.' }),
    a_fada: C('asas', 'Asas de Fada', 3, 8, { selos: 8 }, { cdr: 0.05, mood: 0.1 }, { c: ['#8ae0f0', '#4aa0c8', '#f0ffff'], desc: 'Brilham quando o dono está contente.' }),
    a_draco: C('asas', 'Asas Dracônicas', 4, 14, { selos: 10, res: { brasa: 2 } }, { atk: 0.06, hp: 0.05 }, { c: ['#c84a3a', '#84241c', '#ffb070'], bat: 1, desc: 'Ainda quentes ao toque.' }),
    /* mascotes */
    p_gato: C('pet', 'Gato da Taverna', 0, 1, { gold: 1500 }, { gold: 0.08 }, { c: ['#e0a35a', '#a8743c', '#fff0d8'], kind: 'gato', desc: 'Acha moeda até em bolso furado.' }),
    p_coruja: C('pet', 'Coruja Sábia', 1, 2, { gold: 3000 }, { xp: 0.08 }, { c: ['#b89a7a', '#7a5a44', '#fff0d8'], kind: 'ave', desc: 'Observa tudo e não esquece nada.' }),
    p_raposa: C('pet', 'Raposa Ladina', 2, 4, { selos: 4 }, { drop: 0.1 }, { c: ['#e07a3a', '#a84a1c', '#fff4e8'], kind: 'raposa', desc: 'Volta sempre com alguma coisa na boca.' }),
    p_lobinho: C('pet', 'Filhote de Lobo', 2, 6, { selos: 6 }, { atk: 0.05 }, { c: ['#b8c0cc', '#7a8494', '#f4f7fb'], kind: 'raposa', desc: 'Pequeno, mas já rosna para chefes.' }),
    p_fadinha: C('pet', 'Fadinha da Fonte', 3, 9, { selos: 9 }, { hp: 0.04, heal: 0.15 }, { c: ['#f0a8e0', '#c070b0', '#ffffff'], kind: 'fada', desc: 'Nasceu na Fonte das Duas Luas.' }),
    p_draquinho: C('pet', 'Draquinho', 4, 14, { selos: 12, res: { brasa: 1 } }, { atk: 0.05, crit: 0.03 }, { c: ['#c84a3a', '#84241c', '#ffd070'], kind: 'draco', desc: 'Cospe faísca quando espirra.' }),
    /* relíquias: não se compram — caem dos chefes e da Fenda */
    r_presa: C('reliquia', 'Presa do Ancião', 2, 1, null, { atk: 0.06 }, { boss: 'bosque', desc: 'Arrancada do Ancião da Matilha.' }),
    r_filacterio: C('reliquia', 'Filactério de Ocre', 2, 1, null, { cdr: 0.08 }, { boss: 'ruinas', desc: 'O que sobrou do Lich quando a areia assentou.' }),
    r_olho: C('reliquia', 'Olho da Hidra', 3, 1, null, { crit: 0.05 }, { boss: 'ermos', desc: 'Ainda acompanha quem passa.' }),
    r_veu: C('reliquia', 'Véu das Brumas', 3, 1, null, { eva: 0.06 }, { boss: 'pantano', desc: 'Um pedaço de névoa que não se desfaz.' }),
    r_coracao: C('reliquia', 'Coração do Wyrm', 4, 1, null, { hp: 0.1 }, { boss: 'pico', desc: 'Bate devagar, uma vez por hora.' }),
    r_escama: C('reliquia', 'Escama do Dragão', 4, 1, null, { def: 0.1, thorns: 0.05 }, { boss: 'cinzas', desc: 'Nenhuma lâmina de Aurora a riscou.' }),
    r_arauto: C('reliquia', 'Estilhaço do Arauto', 5, 1, null, { atk: 0.05, hp: 0.05, def: 0.05 }, { rift: 1, desc: 'Um caco da própria Fenda. Vem a cada 10 andares.' }),
  };
  G.COS_IDS = Object.keys(G.COS);
  G.COS_SLOTS = ['traje', 'asas', 'pet', 'reliquia'];
  G.COS_SLOT_NAME = { traje: 'Traje', asas: 'Asas', pet: 'Mascote', reliquia: 'Relíquia' };
  G.cosOwned = (id) => (G.S.cos && G.S.cos[id]) || 0;
  G.cosInUse = (id) => { const s = G.COS[id].slot; let n = 0; for (const h of G.S.heroes) if (h.cos && h.cos[s] === id) n++; return n; };
  G.cosFree = (id) => G.cosOwned(id) - G.cosInUse(id);
  G.cosCan = (id) => {
    const S = G.S, d = G.COS[id], c = d.cost;
    if (!c) return { ok: false, why: d.rift ? 'Vem da Fenda Infinita' : 'Cai de ' + G.MON[G.ZONE[d.boss].boss].name };
    if (S.realm.lvl < d.req) return { ok: false, why: 'Requer Nível de Reino ' + d.req };
    if (c.gold && S.gold < c.gold) return { ok: false, why: 'Faltam moedas' };
    if (c.selos && S.selos < c.selos) return { ok: false, why: 'Faltam Selos de Renome' };
    if (c.nucleos && S.nucleos < c.nucleos) return { ok: false, why: 'Faltam Núcleos' };
    if (c.res && !G.hasRes(c.res)) return { ok: false, why: 'Faltam materiais' };
    return { ok: true };
  };
  G.cosGrant = (id) => { const S = G.S; S.cos[id] = (S.cos[id] || 0) + 1; G.emit('cos', id); };
  G.cosBuy = (id) => {
    const S = G.S, d = G.COS[id]; if (!G.cosCan(id).ok) return false; const c = d.cost;
    if (c.gold) G.spend(c.gold, 'obras'); if (c.selos) S.selos -= c.selos; if (c.nucleos) S.nucleos -= c.nucleos; if (c.res) G.payRes(c.res);
    G.cosGrant(id); S.stats.cos = (S.stats.cos || 0) + 1;
    G.log('O Ateliê entregou: ' + d.name + '.', 'good'); G.sfx('rare'); G.gainRealm(15 + 10 * d.rar, 'obra');
    return true;
  };
  G.cosWear = (h, slot, id) => {
    if (!h.cos) h.cos = { traje: null, asas: null, pet: null, reliquia: null };
    if (id) { const d = G.COS[id]; if (!d || d.slot !== slot || (h.cos[slot] !== id && G.cosFree(id) < 1)) return false; }
    h.cos[slot] = id || null; h._dirty = true; if (id) h.animo = Math.min(100, h.animo + 8);
    G.emit('heroes'); return true;
  };
  /* relíquia do chefe: garantida na 3ª vitória se o reino ainda não tem nenhuma; depois, 10% */
  G.relicRoll = (zoneId, h) => {
    const S = G.S, id = G.COS_IDS.find((k) => G.COS[k].boss === zoneId); if (!id) return false;
    const zs = S.zones[zoneId], first = !G.cosOwned(id) && zs.bossKills >= 3;
    if (!first && Math.random() >= 0.1) return false;
    G.cosGrant(id);
    G.log((h ? h.name : 'A caçada') + ' trouxe uma relíquia: ' + G.COS[id].name + '!', 'epic'); G.toast('Relíquia: ' + G.COS[id].name + '!', 'epic', 'crown'); G.sfx('rare');
    return true;
  };

  /* os bônus do guarda-roupa entram na soma do herói */
  const hb0 = G.heroBonus;
  G.heroBonus = (h) => {
    const b = hb0(h);
    if (h.cos) for (const s of G.COS_SLOTS) { const d = h.cos[s] && G.COS[h.cos[s]]; if (d) for (const k in d.p) if (b[k] !== undefined) b[k] += d.p[k]; }
    return b;
  };

  /* ================= dificuldade do reino ================= */
  /* hp/atk dos monstros, rw = experiência e moedas, drop = espólio, shift = níveis a mais que o herói deve respeitar */
  G.DIFFS = [
    { name: 'Fácil', hp: 0.8, atk: 0.8, rw: 0.85, drop: 0.9, shift: -3, realm: 1, c: '#5fcf7c', desc: 'Monstros 20% mais fracos. Rende 15% menos experiência e moedas.' },
    { name: 'Normal', hp: 1, atk: 1, rw: 1, drop: 1, shift: 0, realm: 1, c: '#e2b659', desc: 'O equilíbrio de sempre.' },
    { name: 'Difícil', hp: 1.35, atk: 1.25, rw: 1.3, drop: 1.2, shift: 4, realm: 4, c: '#ee8a4a', desc: 'Monstros bem mais duros. +30% de experiência e moedas, +20% de espólio.' },
    { name: 'Pesadelo', hp: 1.8, atk: 1.55, rw: 1.7, drop: 1.45, shift: 7, realm: 10, c: '#c95af0', desc: 'Para heróis lendários. +70% de experiência e moedas, +45% de espólio.' },
  ];
  G.diffCur = () => G.DIFFS[G.S && G.S.diff != null ? G.S.diff : 1] || G.DIFFS[1];
  G.setDiff = (i) => {
    const S = G.S, d = G.DIFFS[i]; if (!d || S.realm.lvl < d.realm || S.diff === i) return false;
    S.diff = i;
    for (const m of G.mons) if (!m.boss && !m.raid && !m.rift && !m.tgt) m.gone = true; // repovoa na força nova
    for (const h of S.heroes) h.noZone = false;
    G.log('A dificuldade do reino agora é ' + d.name + '.', 'info'); G.emit('diff', i);
    return true;
  };

  /* ================= enfeites que mudam de lugar ================= */
  G.decorSpots = (d) => (G.S && G.S.decorPos && G.S.decorPos[d.id]) || d.spots;
  G.decorMovable = (id) => id !== 'fonte';
  /* todas as portas e portões precisam continuar alcançáveis a partir da praça */
  const reach = (blockIdx) => {
    const W = Wd.w, t = Wd.town, seen = new Uint8Array(W * Wd.h), q = [];
    const s = Math.floor(Wd.plaza.cy + 2) * W + Math.floor(Wd.plaza.cx); seen[s] = 1; q.push(s);
    while (q.length) {
      const c = q.pop(), cx = c % W, cy = (c / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy; if (nx < t.x0 - 1 || ny < t.y0 - 1 || nx > t.x1 + 1 || ny > t.y1 + 1) continue;
        const ni = ny * W + nx; if (seen[ni] || !Wd.walk[ni] || ni === blockIdx) continue; seen[ni] = 1; q.push(ni);
      }
    }
    return seen;
  };
  G.decorCanPlace = (id, i, x, y) => {
    const d = G.DEC[id], W = Wd.w, fx = Math.floor(x), fy = Math.floor(y), idx = fy * W + fx, T = Wd.T;
    if (!Wd.inTown(fx + 0.5, fy + 0.5)) return { ok: false, why: 'Só dentro das muralhas' };
    const tl = Wd.tile[idx]; if (tl !== T.COBBLE && tl !== T.GARDEN) return { ok: false, why: 'Aqui não dá' };
    const spots = G.decorSpots(d), mine = Math.floor(spots[i][1]) * W + Math.floor(spots[i][0]);
    if (!Wd.walk[idx] && idx !== mine) return { ok: false, why: 'Lugar ocupado' };
    let clash = false;
    for (const o of G.DECOR) if (G.decorLvl(o.id)) G.decorSpots(o).forEach((s, k) => { if ((o.id !== id || k !== i) && Math.floor(s[0]) === fx && Math.floor(s[1]) === fy) clash = true; });
    if (clash) return { ok: false, why: 'Já existe um enfeite aqui' };
    const near = (px, py, r) => Math.hypot(px - (fx + 0.5), py - (fy + 0.5)) < r;
    for (const b in Wd.plots) { const dr = Wd.plots[b].door; if (!G.BLD[b].site && near(dr[0], dr[1], 1.3)) return { ok: false, why: 'Muito perto de uma porta' }; }
    for (const g in G.GATES) if (near(G.GATES[g].x, G.GATES[g].y, 2.4)) return { ok: false, why: 'Muito perto do portão' };
    if (near(Wd.portal.mouth[0], Wd.portal.mouth[1], 1.3) || near(Wd.board.at[0], Wd.board.at[1], 1.2) || near(Wd.fountain.x, Wd.fountain.y, 1.6)) return { ok: false, why: 'Deixe a praça respirar' };
    if (d.spots[Math.min(i, d.spots.length - 1)][2]) { // enfeite que bloqueia: confere se a cidade continua ligada
      const was = Wd.walk[mine]; if (mine !== idx && !was) Wd.walk[mine] = 1;
      const seen = reach(idx); if (mine !== idx && !was) Wd.walk[mine] = 0;
      for (const b in Wd.plots) { if (G.BLD[b].site) continue; const dr = Wd.plots[b].door; if (!seen[Math.floor(dr[1]) * W + Math.floor(dr[0])]) return { ok: false, why: 'Fecharia uma passagem' }; }
      for (const [gx, gy] of [[43, 41], [43, 66], [29, 53], [58, 53]]) if (!seen[gy * W + gx]) return { ok: false, why: 'Fecharia um portão' };
    }
    return { ok: true };
  };
  G.decorPlace = (id, i, x, y) => {
    const S = G.S, d = G.DEC[id]; if (!G.decorLvl(id) || !G.decorMovable(id) || !G.decorCanPlace(id, i, x, y).ok) return false;
    if (!S.decorPos[id]) S.decorPos[id] = d.spots.map((s) => s.slice());
    S.decorPos[id][i] = [Math.floor(x) + 0.5, Math.floor(y) + 0.85, d.spots[i][2] || 0];
    G.applyDecor(); G.emit('decor', id); return true;
  };
  G.decorResetPos = (id) => { const S = G.S; if (S.decorPos[id]) { delete S.decorPos[id]; G.applyDecor(); G.emit('decor', id); } };

  /* ================= Caminhos: objetivos dos sistemas novos ================= */
  const any = (f) => (S) => (S.heroes.some(f) ? 1 : 0);
  G.PATHS = [
    { id: 'peca', t: 'Vista um herói com uma peça nova', h: 'Elmo e botas abrem com a Ferraria no nível 2.', p: any((h) => h.gear.elmo || h.gear.botas || h.gear.luvas || h.gear.cinto || h.gear.anel), n: 1, r: { gold: 300, minerio: 20 } },
    { id: 'arte10', t: 'Gaste 10 pontos em Artes Secretas', h: 'Ficha do herói › Artes. Cada nível rende 1 ponto.', p: (S) => S.stats.artes, n: 10, r: { tomo: 2 } },
    { id: 'enfeite3', t: 'Coloque 3 enfeites na cidade', h: 'Reino › Decoração.', p: (S) => S.stats.decor, n: 3, r: { selos: 1, gold: 400 } },
    { id: 'desmonte', t: 'Desmonte 5 peças no Armazém', h: 'Peças Incomuns ou melhores rendem Pó Estelar.', p: (S) => S.stats.dismantled, n: 5, r: { po_estelar: 10 } },
    { id: 'mascate', t: 'Feche um negócio com o Mascate', h: 'Reino › Mercado. As ofertas mudam todo amanhecer.', p: (S) => S.stats.mascate || 0, n: 1, r: { gold: 500 } },
    { id: 'estabulo', t: 'Construa o Estábulo do Vale', h: 'Requer Cidadela nível 3. Fica ao norte das muralhas.', p: () => G.bLvl('estabulo'), n: 1, r: { racao: 20, gold: 500 } },
    { id: 'montaria', t: 'Dê uma montaria a um herói', h: 'Reino › Estábulo: dome e escolha o cavaleiro.', p: any((h) => h.mount), n: 1, r: { racao: 20, tomo: 1 } },
    { id: 'habil2', t: 'Treine uma habilidade até o nível 3', h: 'Ficha › Habilidades. Requer o Campo de Treino e Tomos.', p: (S) => S.heroes.reduce((a, h) => Math.max(a, ...(h.sk || [1])), 1), n: 3, r: { tomo: 3 } },
    { id: 'vestir', t: 'Vista um traje, asas ou mascote', h: 'Toque nos espaços roxos ao lado do herói.', p: any((h) => h.cos && (h.cos.traje || h.cos.asas || h.cos.pet)), n: 1, r: { selos: 2 } },
    { id: 'classe2', t: 'Faça a 1ª mudança de classe', h: 'Rank C, um Emblema de Ocre e 2 Tomos.', p: (S) => S.stats.jobs, n: 1, r: { alma: 1, selos: 2 } },
    { id: 'despertar', t: 'Desperte um herói', h: 'Ficha › Despertar. Cristais de Alma vêm de chefes e da Maré.', p: (S) => S.stats.wakes, n: 1, r: { selos: 3, po_estelar: 10 } },
    { id: 'dificil', t: 'Derrote um chefe no Difícil', h: 'Toque na caveira, no alto da tela, para trocar a dificuldade.', p: (S) => S.stats.hardBoss || 0, n: 1, r: { selos: 3, nucleos: 2 } },
    { id: 'reliquia', t: 'Conquiste uma relíquia', h: 'A 3ª vitória sobre cada chefe de zona garante a dele.', p: (S) => G.COS_IDS.filter((k) => G.COS[k].slot === 'reliquia' && G.cosOwned(k)).length, n: 1, r: { alma: 2 } },
    { id: 'mont5', t: 'Leve uma montaria ao nível 5', h: 'Alimente com ração no Estábulo.', p: (S) => S.stable.list.reduce((a, m) => Math.max(a, m.lvl), 0), n: 5, r: { racao: 40, selos: 2 } },
    { id: 'encanto', t: 'Alcance 50 de Encanto', h: 'Amplie os enfeites da praça.', p: () => G.charm(), n: 50, r: { nucleos: 3, selos: 2 } },
    { id: 'classe3', t: 'Faça a 2ª mudança de classe', h: 'Rank A, um Emblema das Brumas, 5 Tomos e 1 Cristal de Alma.', p: any((h) => h.j3), n: 1, r: { alma: 3, selos: 5 } },
    { id: 'arte300', t: 'Some 300 pontos em Artes Secretas', h: 'Medite no Campo de Treino para acelerar.', p: (S) => S.stats.artes, n: 300, r: { selos: 5, tomo: 5 } },
    { id: 'desperto4', t: 'Complete o Despertar de um herói', h: 'Quatro estágios, até a Transcendência.', p: (S) => S.heroes.reduce((a, h) => Math.max(a, h.wake || 0), 0), n: 4, r: { selos: 10, nucleos: 5 } },
  ];
  G.pathCur = (d) => Math.min(d.n, d.p(G.S) || 0);
  G.pathDone = (d) => !!G.S.paths[d.id];
  G.pathsPending = () => { let n = 0; for (const d of G.PATHS) if (!G.pathDone(d) && G.pathCur(d) >= d.n) n++; return n; };
  G.pathClaim = (id) => {
    const S = G.S, d = G.PATHS.find((x) => x.id === id); if (!d || G.pathDone(d) || G.pathCur(d) < d.n) return null;
    S.paths[id] = 1; const txt = G.giveReward(d.r, 'missoes');
    G.log('Caminho concluído: "' + d.t + '". Recompensa: ' + txt + '.', 'good'); G.gainRealm(30); G.sfx('quest'); G.emit('quest');
    return txt;
  };

  /* ================= ganchos sobre a v20 ================= */
  const ag0 = G.artGain; G.artGain = (h, n) => { ag0(h, n); if (h.autoArt) G.artAuto(h); };
  const mb0 = G.mascateBuy; G.mascateBuy = (i) => { const r = mb0(i); if (r) G.S.stats.mascate = (G.S.stats.mascate || 0) + 1; return r; };
  const vm0 = G.vocMigrate;
  G.vocMigrate = () => {
    const S = G.S;
    if (S.diff == null) S.diff = 1; if (!S.cos) S.cos = {}; if (!S.paths) S.paths = {}; if (!S.decorPos) S.decorPos = {};
    for (const k of ['cos', 'mascate', 'hardBoss']) if (S.stats[k] == null) S.stats[k] = 0;
    for (const id in S.cos) if (!G.COS[id]) delete S.cos[id];
    for (const id in S.decorPos) if (!G.DEC[id] || !Array.isArray(S.decorPos[id]) || S.decorPos[id].length !== G.DEC[id].spots.length) delete S.decorPos[id];
    for (const h of S.heroes) {
      if (!h.cos) h.cos = { traje: null, asas: null, pet: null, reliquia: null };
      for (const s of G.COS_SLOTS) { if (h.cos[s] === undefined) h.cos[s] = null; if (h.cos[s] && !G.COS[h.cos[s]]) h.cos[s] = null; }
      if (h.autoArt == null) h.autoArt = 0;
    }
    vm0();
    /* ninguém veste mais cópias do que o reino tem */
    for (const id of G.COS_IDS) { let extra = G.cosInUse(id) - G.cosOwned(id); if (extra > 0) for (const h of S.heroes) if (extra > 0 && h.cos[G.COS[id].slot] === id) { h.cos[G.COS[id].slot] = null; h._dirty = true; extra--; } }
  };
})();

;
