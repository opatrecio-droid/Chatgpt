/* 36-companheiros: v22 — espólio no chão (metade na bolsa, metade no chão), mascotes como companheiros
   (indivíduos com raridade, carga e papel, Viveiro e fusão), Incursões (a fonte dos mascotes raros)
   e os Caminhos novos. Sem DOM. */
'use strict';
(function () {
  const Wd = G.W;

  /* ================= espólio no chão ================= */
  /* G.drops não é salvo: some ao carregar, como os monstros. Cada item: posição, recurso, quantidade, nascimento, quem abateu. */
  G.drops = [];
  G.DROP_LIFE = 75;     // segundos de jogo até sumir
  G.DROP_BLINK = 10;    // pisca nos últimos segundos
  G.DROP_MAX = 250;     // teto: descarta os mais velhos
  G.LOOT_F = 1.9;       // espólio por abate em relação à v21 (metade vai à bolsa, metade cai no chão)
  let dropN = 0;
  /* itens-chave vão inteiros para o herói: emblemas, Tomos e Cristais de Alma */
  G.lootKey = (id) => id === 'tomo' || id === 'alma' || !!(G.RES[id] && G.RES[id].emb);
  const addBag = (h, id, n) => { h.bag[id] = (h.bag[id] || 0) + n; h.bagN += n; };
  const dropKill = (d) => { d.n = 0; d.pet = 0; };
  G.dropAdd = (x, y, k, n, by) => {
    const p = Wd.nearestWalk(x + G.rnd(-0.7, 0.7), y + G.rnd(-0.45, 0.45));
    const d = { id: ++dropN, x: p[0], y: p[1], k, n, t: G.S.t, by: by || 0, pet: 0 };
    G.drops.push(d);
    if (G.drops.length > G.DROP_MAX) for (const o of G.drops.splice(0, G.drops.length - G.DROP_MAX)) dropKill(o);
    return d;
  };
  /* chamado por G.killMon para cada material: metade na hora para a bolsa, metade no chão perto do monstro */
  G.lootGive = (h, m, id, n) => {
    if (!(n > 0)) return;
    if (G.lootKey(id)) { addBag(h, id, n); return; }
    const f = n * G.LOOT_F; n = Math.floor(f) + (Math.random() < f % 1 ? 1 : 0);
    const bag = Math.floor(n / 2) + (n % 2 && Math.random() < 0.5 ? 1 : 0), ground = n - bag;
    if (bag) addBag(h, id, bag);
    if (ground) G.dropAdd(m.x, m.y, id, ground, h.id);
  };
  const dropRemove = (d) => { const i = G.drops.indexOf(d); if (i >= 0) G.drops.splice(i, 1); dropKill(d); };
  /* toque do jogador: o item e os vizinhos próximos vão direto para o Armazém */
  G.dropTake = (d, r) => {
    const S = G.S; if (!d || !(d.n > 0)) return null;
    const got = {}; let n = 0, piles = 0;
    for (let i = G.drops.length - 1; i >= 0; i--) {
      const o = G.drops[i]; if (o !== d && Math.hypot(o.x - d.x, o.y - d.y) > (r || 1.3)) continue;
      got[o.k] = (got[o.k] || 0) + o.n; n += o.n; piles++; G.drops.splice(i, 1); dropKill(o);
    }
    for (const k in got) { G.addRes(k, got[k]); S.rep.today.mats = (S.rep.today.mats || 0) + got[k]; G.questEvent('mat', got[k], k); }
    S.stats.picked = (S.stats.picked || 0) + piles;
    G.addFx({ t: 'text', x: d.x, y: d.y - 0.9, s: '+' + n, c: '#ffe07a' }); G.addFx({ t: 'pick', x: d.x, y: d.y - 0.3 }); G.sfx('pick', d.x, d.y);
    G.emit('res', { id: d.k, n });
    return { n, piles, got };
  };
  let dropT = 0;
  const dropsTick = (dt) => {
    dropT -= dt; if (dropT > 0) return; dropT = 1;
    const S = G.S, ds = G.drops; let w = 0;
    for (let i = 0; i < ds.length; i++) { const d = ds[i]; if (d.n > 0 && S.t - d.t < G.DROP_LIFE && S.t >= d.t) ds[w++] = d; else dropKill(d); }
    ds.length = w;
  };

  /* ================= mascotes ================= */
  /* raridade do indivíduo: carga máxima e força (bônus passivo e papel) */
  G.PET_CAP = [6, 9, 13, 18, 24, 32];
  G.PET_POW = [1, 1.2, 1.45, 1.75, 2.1, 2.6];
  G.PET_ROLE = {
    carga: { name: 'Carga', icon: 'bag', short: 'carrega 50% a mais' },
    faro: { name: 'Faro', icon: 'eye', short: 'enxerga longe e corre mais' },
    fraqueza: { name: 'Fraqueza', icon: 'skull', short: 'enfraquece o alvo do dono' },
    vigor: { name: 'Vigor', icon: 'heart', short: 'mais vida e cura o dono' },
  };
  G.PET_R = 4; G.PET_R_FARO = 6.5;        // raio de busca em volta do dono
  G.PET_SCAN = 2; G.PET_SPD = 1.12;        // intervalo entre buscas (s) e velocidade em relação ao dono
  G.WEAK_CD = 9; G.WEAK_DUR = 5;           // Fraqueza: recarga e duração
  G.VIG_CD = 7;                            // Vigor: intervalo da cura
  G.weakF = (p) => Math.min(0.45, 0.14 * G.PET_POW[p.rar]);
  G.vigHp = (p) => 0.05 * G.PET_POW[p.rar];
  G.vigHeal = (p) => 0.035 * G.PET_POW[p.rar];
  /* r0 = raridade-base da espécie (a da v21 para as seis antigas); kind = desenho; c = cores [base, sombra, luz] */
  const P = (name, kind, r0, role, p, c, desc, v21) => ({ name, kind, r0, role, p, c, desc, v21 });
  G.PETS = {
    gato: P('Gato da Taverna', 'gato', 0, 'faro', { gold: 0.08 }, ['#e0a35a', '#a8743c', '#fff0d8'], 'Acha moeda até em bolso furado — e espólio também.', 'p_gato'),
    coruja: P('Coruja Sábia', 'ave', 1, 'faro', { xp: 0.08 }, ['#b89a7a', '#7a5a44', '#fff0d8'], 'Vê do alto o que brilha no chão e não esquece nada.', 'p_coruja'),
    raposa: P('Raposa Ladina', 'raposa', 2, 'carga', { drop: 0.1 }, ['#e07a3a', '#a84a1c', '#fff4e8'], 'Volta sempre com alguma coisa na boca.', 'p_raposa'),
    lobinho: P('Filhote de Lobo', 'raposa', 2, 'fraqueza', { atk: 0.05 }, ['#b8c0cc', '#7a8494', '#f4f7fb'], 'Pequeno, mas rosna para chefes — e eles hesitam.', 'p_lobinho'),
    fadinha: P('Fadinha da Fonte', 'fada', 3, 'vigor', { hp: 0.04, heal: 0.15 }, ['#f0a8e0', '#c070b0', '#ffffff'], 'Nasceu na Fonte das Duas Luas. Sopra cura em quem a leva.', 'p_fadinha'),
    draquinho: P('Draquinho', 'draco', 4, 'fraqueza', { atk: 0.05, crit: 0.03 }, ['#c84a3a', '#84241c', '#ffd070'], 'Cospe faísca quando espirra. O monstro chamuscado amolece.', 'p_draquinho'),
    jabuti: P('Jabuti Musgoso', 'jabuti', 0, 'carga', { def: 0.05 }, ['#6a9a4a', '#3f6a34', '#d8c088'], 'Lento? Só parece. No casco cabe meio armazém.'),
    broto: P('Brotinho', 'broto', 0, 'vigor', { hp: 0.05 }, ['#e05a4a', '#9a2c24', '#fff0d8'], 'Um cogumelo que anda. O pó das pintinhas fecha feridas.'),
    morcego: P('Morceguinho', 'morcego', 1, 'faro', { eva: 0.03, spd: 0.04 }, ['#6a5a7a', '#3c304a', '#d8b8f0'], 'Ouve uma moeda cair do outro lado das Ruínas.'),
    golem: P('Golenzinho de Ocre', 'golem', 1, 'carga', { def: 0.04, hp: 0.03 }, ['#c8964a', '#8a6228', '#f0c880'], 'Feito da areia das Ruínas. Carrega pedra o dia inteiro.'),
    sapo: P('Sapo Brumoso', 'sapo', 1, 'fraqueza', { eva: 0.04 }, ['#5a9a7a', '#2f5a4e', '#d0f0a8'], 'A gosma da língua amolece até couro de troll.'),
    ursinho: P('Ursinho da Nevasca', 'urso', 2, 'vigor', { hp: 0.06 }, ['#e8eef4', '#a8bccc', '#ffffff'], 'Um abraço dele esquenta osso congelado.'),
    olho: P('Olho Errante', 'olho', 3, 'fraqueza', { crit: 0.04 }, ['#b06ae8', '#6e34a8', '#ffe07a'], 'Um pedaço da Fenda que resolveu seguir alguém. O monstro encarado treme.'),
    medusa: P('Medusa das Brumas', 'medusa', 3, 'vigor', { hp: 0.04, cdr: 0.04 }, ['#8ad8e8', '#4a9ab0', '#f0ffff'], 'Flutua na névoa e pinga um orvalho que cura.'),
    fenix: P('Fenixzinha', 'fenix', 4, 'vigor', { hp: 0.05, atk: 0.04 }, ['#ff8a3a', '#c8401c', '#ffe08a'], 'Renasce das cinzas — e não deixa o dono ficar nelas.'),
  };
  G.PET_IDS = Object.keys(G.PETS);
  /* duas espécies nativas de cada zona: os ovos das Incursões puxam para elas */
  G.ZPETS = { bosque: ['jabuti', 'lobinho'], ruinas: ['golem', 'morcego'], ermos: ['olho', 'raposa'], pantano: ['sapo', 'medusa'], pico: ['ursinho', 'coruja'], cinzas: ['fenix', 'draquinho'] };
  /* v27 (B2): o Viveiro guarda todos os mascotes do reino (com dono, vagando na praça ou guardados): a regra de capacidade é a mesma de sempre e os vagantes contam */
  G.petCap = () => 8 + 2 * G.bLvl('estabulo');           // Viveiro
  G.petById = (id) => { if (!id) return null; const l = G.S.pets; for (let i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; };
  /* v27 (B2): até 3 mascotes por herói (h.pets = ids, do mais forte ao mais fraco; h.pet espelha o primeiro, para o que ainda lê o campo antigo).
     Retornos decrescentes: o 1º vale 100%, o 2º 50% e o 3º 25% dos bônus de atributo, da Fraqueza, da cura do Vigor e da capacidade de carga (mínimo 3 itens) */
  G.PET_MAX = 3;
  G.PET_DIM = [1, 0.5, 0.25];
  G.petsOf = (h) => { const o = []; if (!h || !h.pets) return o; for (let i = 0; i < h.pets.length; i++) { const p = G.petById(h.pets[i]); if (p) o.push(p); } return o; };
  G.petOf = (h) => { const a = G.petsOf(h); return a.length ? a[0] : null; };         // o principal (o mais forte)
  G.petSlots = (h) => G.PET_MAX - (h && h.pets ? h.pets.length : 0);
  G.petRank = (p) => { if (!p.hero) return -1; const hs = G.S.heroes; for (let i = 0; i < hs.length; i++) if (hs[i].id === p.hero) return hs[i].pets ? hs[i].pets.indexOf(p.id) : -1; return -1; };      // 0, 1 ou 2: o lugar na fila do dono (-1 sem dono)
  G.petDim = (p) => { const i = G.petRank(p); return i < 0 ? 1 : G.PET_DIM[Math.min(i, G.PET_DIM.length - 1)]; };
  /* ordem do mais forte ao mais fraco: raridade, depois a espécie mais rara, depois o mais antigo */
  const petSort = (h) => { h.pets.sort((a, b) => { const x = G.petById(a), y = G.petById(b); if (!x || !y) return 0; return y.rar - x.rar || G.PETS[y.k].r0 - G.PETS[x.k].r0 || x.id - y.id; }); h.pet = h.pets[0] || 0; };
  G.petSort = petSort;
  G.petLoadCap = (p) => Math.max(3, Math.round(G.PET_CAP[p.rar] * (G.PETS[p.k].role === 'carga' ? 1.5 : 1) * G.petDim(p)));
  G.petLoad = (h) => { let n = 0; for (const p of G.petsOf(h)) n += p.bagN; return n; };
  G.petBonus = (p) => { const d = G.PETS[p.k], f = G.PET_POW[p.rar], o = {}; for (const k in d.p) o[k] = d.p[k] * f; if (d.role === 'vigor') o.hp = (o.hp || 0) + G.vigHp(p); return o; };
  /* os bônus que o herói realmente recebe de um mascote (já com o retorno decrescente do lugar dele na fila) */
  G.petBonusEff = (p) => { const o = G.petBonus(p), f = G.petDim(p); for (const k in o) o[k] *= f; return o; };
  G.petFree = () => G.S.pets.filter((p) => !p.hero && !p.out);          // guardados no Viveiro (os que vagam pela praça não entram em fusão)
  G.petStrays = () => G.S.pets.filter((p) => !p.hero && p.out);
  G.petMaxRar = () => G.S.pets.reduce((a, p) => Math.max(a, p.rar), -1);
  /* espécie de um ovo: nativas da zona pesam 6×; espécies muito acima da raridade do ovo aparecem menos */
  G.petRoll = (zid, rar) => { const nat = (zid && G.ZPETS[zid]) || []; return G.wpick(G.PET_IDS.map((k) => [k, (nat.indexOf(k) >= 0 ? 6 : 1) * (G.PETS[k].r0 > rar + 1 ? 0.25 : 1)])); };
  /* v27 (B2): temperamento = o critério com que o mascote escolhe dono: 'v' Valente (o herói mais forte) ou 'd' Dengoso (o mais cativante). Cada espécie tem o seu jeito, com 25% de exceções */
  G.PET_TEMP = { v: { name: 'Valente', short: 'admira quem é forte', crit: 'o mais forte' }, d: { name: 'Dengoso', short: 'segue quem tem carisma', crit: 'o mais cativante' } };
  G.petTempRoll = (k) => { const ro = G.PETS[k].role, base = ro === 'fraqueza' || ro === 'carga' ? 'v' : ro === 'vigor' ? 'd' : (G.hash(k) % 2 ? 'v' : 'd'); return Math.random() < 0.25 ? (base === 'v' ? 'd' : 'v') : base; };
  G.petNew = (k, rar) => { const S = G.S, p = { id: G.uid(), k, rar: G.clamp(rar | 0, 0, 5), hero: 0, bag: {}, bagN: 0, out: 0, tp: G.petTempRoll(k) }; S.pets.push(p); S.stats.petsGot = (S.stats.petsGot || 0) + 1; return p; };
  /* choca um ovo; com o Viveiro cheio ele vira Pó Estelar e Cristal de Alma */
  G.petHatch = (k, rar, why) => {
    const S = G.S;
    if (S.pets.length >= G.petCap()) {
      const po = 4 + 6 * rar, al = 1 + Math.floor(rar / 2); G.addRes('po_estelar', po); G.addRes('alma', al);
      G.log('O Viveiro está cheio: o ovo ' + G.RAR[rar].toLowerCase() + ' virou ' + po + ' Pó Estelar e ' + al + ' Cristal(is) de Alma.', 'info');
      G.emit('pets', null); return null;
    }
    const p = G.petNew(k, rar);
    G.log((why ? why + ': ' : '') + 'um ovo chocou — ' + G.PETS[k].name + ' ' + G.RAR[p.rar] + ' apareceu na praça à procura de um dono.', p.rar >= 3 ? 'epic' : 'good');
    G.toast('Novo mascote na praça: ' + G.PETS[k].name + ' (' + G.RAR[p.rar] + ')', p.rar >= 3 ? 'epic' : 'good', 'paw');
    G.sfx('rare'); G.emit('pets', p);
    return p;
  };
  /* a carga do mascote vai para o Armazém e conta como espólio recebido */
  G.petStore = (p) => {
    const S = G.S; let n = 0;
    for (const k in p.bag) { const v = p.bag[k]; if (!(v > 0)) continue; G.addRes(k, v); n += v; S.rep.today.mats = (S.rep.today.mats || 0) + v; G.questEvent('mat', v, k); }
    p.bag = {}; p.bagN = 0; return n;
  };
  G.petUnload = (h) => { let n = 0; for (const p of G.petsOf(h)) n += G.petStore(p); return n; };
  G.petRt = new Map();      // posição e alvo de cada mascote: não é salvo
  const rtDrop = (r) => { if (r.d) { if (r.d.pet) r.d.pet = 0; r.d = null; } };
  G.petRtOf = (p, h) => {
    let r = G.petRt.get(p.id);
    if (!r) { const i = Math.max(0, G.petRank(p)); r = { x: h.x - 0.8 - 0.7 * i, y: h.y + 0.2, dir: h.dir || 1, moving: false, path: null, st: 'follow', d: null, tW: 2 + i * 1.3, tV: 3 + i * 1.7, tS: i * 0.6, cast: 0, ck: '' }; G.petRt.set(p.id, r); }
    return r;
  };
  /* tira o mascote do dono atual (a carga vai para o Armazém); não mexe em p.out */
  const petDetach = (p) => {
    const S = G.S;
    for (const x of S.heroes) if (x.pets && x.pets.indexOf(p.id) >= 0) { x.pets = x.pets.filter((id) => id !== p.id); petSort(x); x._dirty = true; }
    for (const x of S.heroes) if (x.pet === p.id) { x.pet = 0; x._dirty = true; }
    p.hero = 0;
    const r = G.petRt.get(p.id); if (r) rtDrop(r);
  };
  /* h = null: dispensa (o mascote volta ao Viveiro e a carga vai para o Armazém). v27 (B2): com herói, só se ele tiver vaga (devolve false se já leva 3) */
  G.petAssign = (p, h) => {
    const S = G.S; if (!p || S.pets.indexOf(p) < 0) return false;
    if (h && h.pets && h.pets.indexOf(p.id) < 0 && h.pets.length >= G.PET_MAX) return false;
    const was = p.hero;
    if (h && was === h.id) return true;
    petDetach(p); p.out = 0;
    if (h) {
      if (!h.pets) h.pets = [];
      h.pets.push(p.id); p.hero = h.id; petSort(h); h._dirty = true; h.animo = Math.min(100, h.animo + 6);
      const r = G.petRt.get(p.id); if (r) { r.x = h.x - 0.8; r.y = h.y + 0.2; r.path = null; r.st = 'follow'; }
    } else { G.petRt.delete(p.id); G.petStore(p); }
    G.emit('pets', p); G.emit('heroes');
    return true;
  };
  G.petRelease = (p) => {
    const S = G.S, i = S.pets.indexOf(p); if (i < 0 || p.hero) return false;      // v27 (B2): vale para guardados e para vagantes
    G.petStore(p); S.pets.splice(i, 1); G.petRt.delete(p.id);
    const po = 2 * (p.rar + 1); G.addRes('po_estelar', po);
    G.log(G.PETS[p.k].name + ' voltou para a natureza e deixou ' + po + ' Pó Estelar no Viveiro.', 'info'); G.emit('pets', null);
    return true;
  };
  /* fusão: três mascotes livres da mesma raridade viram um da raridade seguinte (espécie sorteada entre os três) */
  G.petCanFuse = (ps) => !!ps && ps.length === 3 && new Set(ps).size === 3 && ps.every((p) => p && G.S.pets.indexOf(p) >= 0 && !p.hero && !p.out && p.rar === ps[0].rar) && ps[0].rar < 5;
  G.petFuse = (ps) => {
    const S = G.S; if (!G.petCanFuse(ps)) return null;
    const rar = ps[0].rar + 1, k = G.pick(ps).k;
    for (const p of ps) { G.petStore(p); S.pets.splice(S.pets.indexOf(p), 1); G.petRt.delete(p.id); }
    const n = G.petNew(k, rar); S.stats.fusions = (S.stats.fusions || 0) + 1;
    G.log('Fusão no Viveiro: três mascotes ' + G.RAR[rar - 1].toLowerCase() + 's viraram ' + G.PETS[k].name + ' ' + G.RAR[rar] + '.', rar >= 3 ? 'epic' : 'good');
    G.sfx('rare'); G.gainRealm(10 + 12 * rar, 'obra'); G.emit('pets', n);
    return n;
  };
  /* os bônus do mascote entram na soma do herói (passivo × raridade; Vigor soma vida) */
  const hb0 = G.heroBonus;
  G.heroBonus = (h) => {
    const b = hb0(h), ps = G.petsOf(h);
    for (let i = 0; i < ps.length; i++) { const f = G.PET_DIM[Math.min(i, G.PET_DIM.length - 1)], o = G.petBonus(ps[i]); for (const k in o) if (b[k] !== undefined) b[k] += o[k] * f; }      // v27 (B2): retornos decrescentes (100% / 50% / 25%)
    return b;
  };
  G.petWeaken = (p, h, m, r) => {
    const S = G.S, F = G.weakF(p) * G.petDim(p) * (m.boss ? 0.5 : 1), dur = G.WEAK_DUR * (m.boss ? 0.6 : 1);
    if (!(m.weak > S.t) || (m.weakF || 0) <= F) m.weakF = F;
    m.weak = Math.max(m.weak || 0, S.t + dur);
    if (r) { r.cast = 0.6; r.ck = 'weak'; r.dir = m.x >= r.x ? 1 : -1; }
    G.addFx({ t: 'weak', x: m.x, y: m.y - 0.5 * (m.size || 1), fx: r ? r.x : h.x, fy: r ? r.y - 0.4 : h.y - 0.5 });
    G.addFx({ t: 'text', x: m.x, y: m.y - 1.3 * (m.size || 1), s: 'Fraqueza', c: '#c9a4ff' }); G.sfx('weak', m.x, m.y);
    S.stats.weak = (S.stats.weak || 0) + 1;
  };
  G.petHeal = (p, h, r) => {
    const st = G.heroStats(h), v = st.hp * G.vigHeal(p) * G.petDim(p);
    h.hp = Math.min(st.hp, h.hp + v);
    if (r) { r.cast = 0.6; r.ck = 'heal'; }
    G.addFx({ t: 'dmg', x: h.x, y: h.y - 0.9, n: Math.round(v), c: '#7df09a', heal: 1 }); G.addFx({ t: 'healring', x: h.x, y: h.y - 0.3 }); G.sfx('heal', h.x, h.y);
    return v;
  };
  const FIELD = { hunt: 1, travel: 1, return: 1, flee: 1, defend: 1, rift: 1, inc: 1 };
  const FIGHT = { hunt: 1, defend: 1, rift: 1, inc: 1 };
  /* comportamento simulado: segue o dono, busca o espólio no raio, recolhe o que couber e volta */
  /* v27 (B2): lugares na fila atrás do dono (atrás e para os lados, para ninguém ficar em cima de ninguém) */
  const TRAIL = [[0.9, 0.15], [1.55, 0.6], [1.7, -0.3]], WAIT = [[0.7, 0.35], [1.25, 0.75], [1.3, -0.05]];
  G.PET_TRAIL = TRAIL;
  const petTick = (dt) => {
    const S = G.S, hs = S.heroes;
    for (const p of S.pets) {
      if (!p.hero) continue;
      let r = G.petRt.get(p.id), h = r && r.h;
      if (!h || h.id !== p.hero) { h = null; for (let i = 0; i < hs.length; i++) if (hs[i].id === p.hero) { h = hs[i]; break; } }
      const idx = h && h.pets ? h.pets.indexOf(p.id) : -1;
      if (!h || idx < 0) { p.hero = 0; G.petRt.delete(p.id); continue; }
      if (!r) r = G.petRtOf(p, h); r.h = h;
      const tr = TRAIL[Math.min(idx, 2)], wt = WAIT[Math.min(idx, 2)];
      if (r.cast > 0) r.cast -= dt;
      /* dentro de construções ou caído o dono: espera ao lado */
      if (h.inside || h.state === 'fallen' || h.state === 'recover') {
        if (r.st !== 'wait') { rtDrop(r); r.st = 'wait'; }
        const wx = h.x - wt[0], wy = h.y + wt[1], dw = Math.abs(wx - r.x) + Math.abs(wy - r.y);
        if (dw > 14) { r.x = wx; r.y = wy; r.path = null; }
        if (dw > 0.6) G.chase(r, wx, wy, dt, Math.max(3.1, G.heroStats(h).spd * G.PET_SPD), 0.3); else r.moving = false;
        continue;
      }
      const d = G.PETS[p.k], role = d.role;
      const spd = Math.max(3.1, G.heroStats(h).spd * G.PET_SPD) * (role === 'faro' ? 1.35 : 1);
      if (Math.abs(h.x - r.x) + Math.abs(h.y - r.y) > 16) { r.x = h.x - tr[0]; r.y = h.y + tr[1]; r.path = null; rtDrop(r); r.st = 'follow'; }
      /* papéis de combate */
      if (FIGHT[h.state]) {
        if (role === 'fraqueza') { r.tW -= dt; const m = h.tgt; if (r.tW <= 0 && m && !m.dead && !m.gone && m.hp > 0 && Math.hypot(m.x - r.x, m.y - r.y) < 8) { r.tW = G.WEAK_CD; G.petWeaken(p, h, m, r); } }
        if (role === 'vigor') { r.tV -= dt; if (r.tV <= 0) { const st = G.heroStats(h); if (h.hp > 0 && h.hp < st.hp * 0.85) { r.tV = G.VIG_CD; G.petHeal(p, h, r); } else r.tV = 1; } }
      }
      const field = FIELD[h.state] && h.state !== 'flee', cap = G.petLoadCap(p);
      if (r.st === 'fetch') {
        const t = r.d;
        if (!t || !(t.n > 0) || !field || p.bagN >= cap) { rtDrop(r); r.st = 'follow'; }
        else if (G.chase(r, t.x, t.y, dt, spd, 0.3)) {
          const n = Math.min(cap - p.bagN, t.n);
          p.bag[t.k] = (p.bag[t.k] || 0) + n; p.bagN += n; t.n -= n; t.pet = 0;
          G.addFx({ t: 'pick', x: t.x, y: t.y - 0.3, pet: 1 }); G.addFx({ t: 'text', x: r.x, y: r.y - 0.9, s: '+' + n, c: '#ffe9a0' });
          if (t.n <= 0) dropRemove(t);
          r.d = null; r.st = 'back';
        }
        if (r.st === 'fetch') continue;
      }
      /* depois de recolher, volta para perto do dono antes de buscar o próximo */
      if (r.st === 'back') { if (Math.hypot(h.x - r.x, h.y - r.y) > 1.3 && field) { G.chase(r, h.x, h.y, dt, spd, 1); continue; } r.st = 'follow'; }
      r.st = 'follow';
      if (field && p.bagN < cap) {
        r.tS -= dt;
        if (r.tS <= 0) {
          r.tS = G.PET_SCAN;
          const rad = role === 'faro' ? G.PET_R_FARO : G.PET_R; let best = null, bd = 1e9;
          for (const o of G.drops) { if (!(o.n > 0) || (o.pet && o.pet !== p.id)) continue; if (Math.abs(o.x - h.x) > rad || Math.abs(o.y - h.y) > rad || Math.hypot(o.x - h.x, o.y - h.y) > rad) continue; const dp = Math.hypot(o.x - r.x, o.y - r.y); if (dp < bd) { bd = dp; best = o; } }
          if (best) { best.pet = p.id; r.d = best; r.st = 'fetch'; continue; }
        }
      }
      const gx = h.x - (h.dir || 1) * tr[0], gy = h.y + tr[1];
      if (Math.abs(gx - r.x) + Math.abs(gy - r.y) > 0.7) G.chase(r, gx, gy, dt, spd, 0.25); else { r.moving = false; r.path = null; r.dir = h.dir || 1; }
    }
    /* ninguém na fila fica em cima de outro: afasta os que ficaram a menos de 0,45 passo */
    for (const h of hs) { const ps = h.pets; if (!ps || ps.length < 2 || h.inside) continue; for (let i = 0; i < ps.length; i++) { const a = G.petRt.get(ps[i]); if (!a) continue; for (let j = i + 1; j < ps.length; j++) { const b = G.petRt.get(ps[j]); if (!b) continue; const dx = b.x - a.x, dy = b.y - a.y, dd = Math.hypot(dx, dy); if (dd < 0.45) { const k = (0.45 - dd) * 0.5 / (dd || 1), ux = dd ? dx : 1, uy = dd ? dy : 0; b.x += ux * k; b.y += uy * k; a.x -= ux * k; a.y -= uy * k; } } } }
  };

  /* ================= Incursões ================= */
  G.INC_GRADES = 10;
  /* chance de cada raridade do ovo por Grau: Comum, Incomum, Raro, Épico, Lendário, Mítico */
  G.INC_ODDS = [
    [72, 25, 3, 0, 0, 0],
    [56, 34, 9, 1, 0, 0],
    [40, 40, 16, 4, 0, 0],
    [27, 40, 24, 8, 1, 0],
    [16, 35, 32, 14, 3, 0],
    [8, 27, 35, 22, 7.5, 0.5],
    [3, 18, 34, 31, 13, 1],
    [0, 10, 30, 38, 20, 2],
    [0, 4, 22, 42, 29, 3],
    [0, 0, 14, 44, 37, 5],
  ];
  G.INC_LIMIT = 240;   // segundos de combate (ondas + Alfa)
  G.incOpen = () => G.S.realm.lvl >= 6;
  G.incBest = (zid) => (G.S.inc.best[zid] || 0);
  G.incMax = (zid) => Math.min(G.INC_GRADES, G.incBest(zid) + 1);
  G.incLvl = (zid, g) => G.ZONE[zid].lvl + 6 + 4 * g;        // nível do Alfa, sem a dificuldade do reino
  G.incCost = () => 3;                                       // Núcleos por tentativa extra no mesmo dia
  G.incFree = () => G.S.inc.dayDone !== G.S.day;
  G.incBusy = () => !!(G.S && G.S.inc && G.S.inc.run);
  G.incRar = (g) => G.wpick(G.INC_ODDS[G.clamp(g, 1, G.INC_GRADES) - 1].map((w, i) => [i, w]));
  G.incCanStart = (zid, g) => {
    const S = G.S, z = G.ZONE[zid];
    if (!G.incOpen()) return { ok: false, why: 'Abre no Nível de Reino 6' };
    if (!z || !G.zoneUnlocked(z)) return { ok: false, why: 'Zona ainda fechada' };
    if (!(g >= 1) || g > G.incMax(zid)) return { ok: false, why: 'Vença o Grau anterior nesta zona' };
    if (S.inc.run) return { ok: false, why: 'Já há uma Incursão em andamento' };
    if (S.rift.run) return { ok: false, why: 'A expedição da Fenda ainda não voltou' };
    if (S.mare.active) return { ok: false, why: 'A Maré está nas muralhas' };
    if (!G.incFree() && S.nucleos < G.incCost()) return { ok: false, why: 'Faltam Núcleos' };
    return { ok: true };
  };
  G.incStart = (zid, g, ids) => {
    const S = G.S; if (!G.incCanStart(zid, g).ok) return false;
    const party = S.heroes.filter((h) => ids.indexOf(h.id) >= 0 && h.state !== 'fallen' && h.state !== 'recover' && h.state !== 'rift').slice(0, 5);
    if (!party.length) return false;
    if (!G.incFree()) S.nucleos -= G.incCost();
    S.inc.dayDone = S.day;
    const z = G.ZONE[zid];
    S.inc.run = { z: zid, g, ids: party.map((h) => h.id), phase: 'walk', t: 0, ft: 0, wt: 0, limit: G.INC_LIMIT, lvl: G.incLvl(zid, g), n: party.length, alfa: 0 };
    for (const h of party) {
      if (h.inside && h.act === 'train') S._training = Math.max(0, (S._training || 0) - 1);
      h.state = 'inc'; h.inside = null; h.tgt = null; h.zone = zid; h.tThink = 0;
      G.go(h, z.lair[0] + G.rnd(-2, 2), z.lair[1] + G.rnd(-1.5, 1.5));
    }
    G.log('Uma Incursão de ' + party.length + ' heróis partiu para o covil de ' + z.name + ' (Grau ' + G.roman(g) + ').', 'boss'); G.emit('inc', { start: 1 });
    return true;
  };
  const lair = (z) => Wd.nearestWalk(z.lair[0], z.lair[1]);
  const spawnWave = (r, w) => {
    const z = G.ZONE[r.z], c = lair(z), n = (w === 1 ? 2 : 3) + Math.floor(r.n / 2);
    const up = G.S.heroes.filter((h) => h.state === 'inc');
    for (let i = 0; i < n; i++) {
      const p = Wd.nearestWalk(c[0] + G.rnd(-3, 3), c[1] + G.rnd(-2.5, 2.5));
      const m = G.makeMon(G.wpick(z.mons), r.lvl - (w === 1 ? 4 : 3), p[0], p[1], { rift: 1, elite: 1 });
      m.inc = 1; m.wave = w; if (up.length) { m.tgt = G.pick(up); m.state = 'chase'; }
      G.mons.push(m);
    }
    r.phase = 'w' + w; r.wt = 0;
    G.addFx({ t: 'boom', x: c[0], y: c[1], c: z.color, r: 3 }); G.sfx('boss');
    G.toast((w === 1 ? '1ª' : '2ª') + ' onda de elites em ' + z.name + '!', 'boss', 'skull'); G.emit('inc', { phase: r.phase });
  };
  const spawnAlfa = (r) => {
    const z = G.ZONE[r.z], c = lair(z);
    const m = G.makeMon(z.boss, r.lvl, c[0], c[1] - 1, { rift: 1, hpMult: 0.9 + 0.25 * r.n, atkMult: 1.1 });
    m.inc = 1; m.alfa = 1; m.elite = 1;
    const up = G.S.heroes.filter((h) => h.state === 'inc'); if (up.length) { m.tgt = G.pick(up); m.state = 'chase'; }
    G.mons.push(m); r.alfa = m.id; r.phase = 'alfa'; r.wt = 0;
    G.addFx({ t: 'boom', x: c[0], y: c[1] - 1, c: '#ffd35a', r: 3.6 }); G.addFx({ t: 'shake', n: 8 }); G.sfx('boss');
    G.log('O Alfa de ' + z.name + ' surgiu: ' + G.MON[z.boss].name + ', nível ' + r.lvl + '.', 'boss');
    G.toast('O Alfa surgiu!', 'boss', 'crown'); G.emit('inc', { phase: 'alfa' });
  };
  const incEnd = (win, why) => {
    const S = G.S, r = S.inc.run; if (!r) return;
    for (const m of G.mons) if (m.inc) m.gone = true;
    for (const h of S.heroes) if (h.state === 'inc') G.heroGoHome(h, false);
    const z = G.ZONE[r.z];
    if (!win) { G.log('A Incursão ao covil de ' + z.name + ' (Grau ' + G.roman(r.g) + ') fracassou: ' + (why === 'time' ? 'o tempo acabou' : 'todos caíram') + '.', 'bad'); G.toast('A Incursão fracassou.', 'bad', 'skull'); }
    S.inc.last = { z: r.z, g: r.g, win: win ? 1 : 0, why: why || '', day: S.day, pet: r.res ? r.res.pet : null, rar: r.res ? r.res.rar : -1, k: r.res ? r.res.k : null };
    S.inc.run = null; G.emit('inc', { end: 1, win: !!win, last: S.inc.last });
  };
  G.incEnd = incEnd;
  G.incWin = () => {
    const S = G.S, r = S.inc.run; if (!r) return;
    const z = G.ZONE[r.z], g = r.g, zm = G.ZMATS[z.n];
    const rar = G.incRar(g), k = G.petRoll(r.z, rar);
    const pet = G.petHatch(k, rar, 'Incursão vencida');
    const a = 4 + 2 * g, b = 4 + 2 * g, rr = 1 + Math.floor(g / 3), tomos = 1 + Math.floor(g / 3);
    G.addRes(zm.a, a); G.addRes(zm.b, b); G.addRes(zm.r, rr); G.addRes('tomo', tomos);
    for (const h of S.heroes) if (h.state === 'inc') { G.giveXp(h, G.xpNeed(h.lvl) * (0.08 + 0.012 * g)); G.artGain(h, 1); }
    G.gainRealm(60 + 25 * g + 2 * r.lvl, 'incursao');
    if (g > G.incBest(r.z)) S.inc.best[r.z] = g;
    S.inc.wins = (S.inc.wins || 0) + 1; S.stats.incWins = (S.stats.incWins || 0) + 1;
    r.res = { pet: pet ? pet.id : null, rar, k };
    G.log('Incursão vencida em ' + z.name + ' (Grau ' + G.roman(g) + ')! +' + a + ' ' + G.RES[zm.a].name + ', +' + b + ' ' + G.RES[zm.b].name + ', +' + rr + ' ' + G.RES[zm.r].name + ', +' + tomos + ' Tomo(s).' + (g < G.INC_GRADES && G.incBest(r.z) === g ? ' O Grau ' + G.roman(g + 1) + ' foi aberto.' : ''), 'epic');
    G.toast('Incursão vencida!', 'epic', 'crown'); G.sfx('victory');
    incEnd(true);
  };
  const incTick = (dt) => {
    const S = G.S, r = S.inc.run;
    /* a Maré que chegaria durante a Incursão espera ela acabar */
    if (!r && S.mare.held === S.day && !S.mare.active && S.clock >= 1230) { S.mare.held = 0; G.mareStart(); }
    if (!r) return;
    r.t += dt;
    let up = 0, there = 0; const z = G.ZONE[r.z], c = z.lair;
    for (const h of S.heroes) if (h.state === 'inc' && r.ids.indexOf(h.id) >= 0) { up++; if (Math.hypot(h.x - c[0], h.y - c[1]) < 6) there++; }
    if (!up) return incEnd(false, 'fell');
    if (r.phase === 'walk') { if (there >= up || (there > 0 && r.t > 70) || r.t > 110) spawnWave(r, 1); return; }
    r.ft += dt; r.wt += dt;
    if (r.ft > r.limit) return incEnd(false, 'time');
    if (r.phase === 'w1' || r.phase === 'w2') {
      const w = r.phase === 'w1' ? 1 : 2; let alive = 0;
      for (const m of G.mons) if (m.inc && m.wave === w && !m.dead && !m.gone) alive++;
      if (!alive || r.wt > 55) { if (w === 1) spawnWave(r, 2); else spawnAlfa(r); }
    }
  };
  /* herói em Incursão: ninguém recua; luta contra o que é da Incursão e contra quem o atacar */
  G.incHero = (h, dt, st, mons) => {
    const S = G.S, r = S.inc.run;
    if (!r) { G.heroGoHome(h, false); return; }
    const frac = h.hp / st.hp;
    if (frac < 0.4 && h.potions > 0 && h.tPot <= 0) G.heroDrink(h, st);
    let m = h.tgt; if (m && (m.dead || m.gone || (!m.inc && m.tgt !== h))) m = h.tgt = null;
    h.tThink -= dt;
    if (h.tThink <= 0) {
      h.tThink = 0.45; let best = null, bd = 1e9;
      for (const o of mons) {
        if (o.dead || o.gone) continue; const d = Math.hypot(o.x - h.x, o.y - h.y);
        if (o.inc) { const s = d + (o.alfa ? 2.5 : 0); if (s < bd) { bd = s; best = o; } }
        else if (o.tgt === h && d < 3.5 && d - 1 < bd) { bd = d - 1; best = o; }
      }
      if (best) m = h.tgt = best;
    }
    if (m) { if (G.chase(h, m.x, m.y, dt, st.spd, st.rng + (m.size || 1) * 0.35)) G.heroAct(h, m, mons, frac); return; }
    const c = G.ZONE[r.z].lair;
    if (Math.hypot(h.x - c[0], h.y - c[1]) > 2.5) { if (!h.path || !h.path.length || Math.hypot((h._gx || 0) - c[0], (h._gy || 0) - c[1]) > 4) G.go(h, c[0] + G.rnd(-2, 2), c[1] + G.rnd(-1.5, 1.5)); G.step(h, dt, st.spd); } else h.moving = false;
  };
  const km0 = G.killMon;
  G.killMon = (m, h) => { const was = m.dead; km0(m, h); if (!was && m.inc && m.alfa && G.S.inc.run) G.incWin(); };

  /* ================= Caminhos da v22 ================= */
  const vi = G.PATHS.find((d) => d.id === 'vestir'); if (vi) { vi.t = 'Vista um traje ou asas'; vi.p = (S) => (S.heroes.some((h) => h.cos && (h.cos.traje || h.cos.asas)) ? 1 : 0); }
  G.PATHS.splice(1, 0, { id: 'adotar', t: 'Adote o primeiro mascote', h: 'Abata 25 monstros: um filhote curioso segue os caçadores até a cidade.', p: (S) => S.stats.kills, n: 25, r: { pet: 'gato', gold: 150 } });
  G.PATHS.push(
    { id: 'toque10', t: 'Recolha 10 itens do chão com um toque', h: 'Toque no brilho do espólio no mapa: vai direto para o Armazém.', p: (S) => S.stats.picked || 0, n: 10, r: { po_estelar: 6, gold: 300 } },
    { id: 'incursao', t: 'Vença uma Incursão', h: 'Missões › Incursões, a partir do Nível de Reino 6.', p: (S) => S.stats.incWins || 0, n: 1, r: { alma: 2, selos: 2 } },
    { id: 'pet_raro', t: 'Tenha um mascote Raro', h: 'Graus mais altos das Incursões, ou a fusão de três Incomuns.', p: () => (G.petMaxRar() >= 2 ? 1 : 0), n: 1, r: { tomo: 3, nucleos: 2 } },
    { id: 'fusao', t: 'Funda três mascotes', h: 'Armazém › Ateliê › Viveiro: três da mesma raridade viram um melhor.', p: (S) => S.stats.fusions || 0, n: 1, r: { po_estelar: 15, selos: 2 } },
  );
  /* recompensa "pet": um mascote Comum que já vai para o primeiro herói sem companhia */
  const gr0 = G.giveReward;
  G.giveReward = (r, why) => {
    if (!r || !r.pet) return gr0(r, why);
    const o = Object.assign({}, r); delete o.pet;
    const txt = gr0(o, why), p = G.petHatch(r.pet, 0, 'Caminho');
    /* v27 (B2): o filhote do Caminho também chega como vagante e escolhe sozinho um dono */
    return (p ? G.PETS[r.pet].name + ' (' + G.RAR[0] + ')' : 'Pó Estelar e Cristal de Alma') + (txt ? ', ' + txt : '');
  };

  /* ================= Mascate: às vezes, um ovo Comum ou Incomum ================= */
  const mr0 = G.mascateRoll;
  G.mascateRoll = () => {
    const S = G.S, ms = S.mascate, fresh = ms.day !== S.day; mr0();
    if (fresh && S.realm.lvl >= 3 && ms.offers.length && Math.random() < 0.3) {
      const rar = Math.random() < 0.25 ? 1 : 0;
      ms.offers[ms.offers.length - 1] = { id: 'ovo', rar, n: 1, gold: Math.round((rar ? 6000 : 2400) * (1 + 0.12 * (S.realm.lvl - 1))), sold: 0 };
    }
  };
  const mb1 = G.mascateBuy;
  G.mascateBuy = (i) => {
    const S = G.S, o = S.mascate.offers[i];
    if (!o || o.id !== 'ovo') return mb1(i);
    if (o.sold || !G.bOk('mercado') || S.pets.length >= G.petCap()) return false;
    if (!G.spend(o.gold, 'mercado')) return false;
    o.sold = 1; S.stats.mascate = (S.stats.mascate || 0) + 1;
    G.petHatch(G.petRoll(null, o.rar), o.rar, 'Ovo do Mascate'); G.emit('inv');
    return true;
  };

  /* ================= ganchos ================= */
  const ds0 = G.dismiss;
  G.dismiss = (h) => { for (const p of G.petsOf(h).slice()) G.petAssign(p, null); ds0(h); };      // v27 (B2): todos voltam ao Viveiro
  const ue0 = G.updateEncounters;
  G.updateEncounters = (dt) => { ue0(dt); incTick(dt); petTick(dt); dropsTick(dt); };
  /* migração: cada cópia de mascote do guarda-roupa da v21 vira um indivíduo com a raridade-base da espécie */
  const V21 = {}; for (const k of G.PET_IDS) if (G.PETS[k].v21) V21[G.PETS[k].v21] = k;
  G.PET_V21 = V21;
  const vm1 = G.vocMigrate;
  G.vocMigrate = () => {
    const S = G.S;
    if (!Array.isArray(S.pets)) S.pets = [];
    if (!S.inc || typeof S.inc !== 'object') S.inc = {};
    if (!S.inc.best || typeof S.inc.best !== 'object') S.inc.best = {};
    if (!(S.inc.wins >= 0)) S.inc.wins = 0; if (S.inc.dayDone == null) S.inc.dayDone = 0; S.inc.run = null;
    for (const k of ['picked', 'incWins', 'fusions', 'petsGot', 'weak']) if (S.stats[k] == null) S.stats[k] = 0;
    if (S.cos) for (const old in V21) {
      const n = S.cos[old] || 0; if (!n) { delete S.cos[old]; continue; }
      const k = V21[old], wear = S.heroes.filter((h) => h.cos && h.cos.pet === old);
      for (let i = 0; i < n; i++) { const p = G.petNew(k, G.PETS[k].r0), h = wear[i]; p.out = 0; if (h && !h.pet && !(h.pets && h.pets.length)) { h.pet = p.id; p.hero = h.id; } }
      delete S.cos[old];
    }
    for (const h of S.heroes) { if (h.cos && 'pet' in h.cos) delete h.cos.pet; if (!(h.pet > 0)) h.pet = 0; h._dirty = true; }
    for (const p of S.pets) {
      if (!G.PETS[p.k]) p.k = 'gato'; p.rar = G.clamp(p.rar | 0, 0, 5); if (!p.bag || typeof p.bag !== 'object') p.bag = {};
      let n = 0; for (const k in p.bag) { if (!G.RES[k] || !(p.bag[k] > 0)) delete p.bag[k]; else n += p.bag[k]; } p.bagN = n; p.hero = 0; p.out = p.out ? 1 : 0;
    }
    /* v27 (B2): um herói pode ter até 3 mascotes (h.pets). Saves da v26/v27-A só têm h.pet (um): vira uma lista de um; a lista nova é validada contra os mascotes que existem */
    for (const h of S.heroes) {
      const ids = Array.isArray(h.pets) ? h.pets.slice() : []; if (h.pet > 0 && ids.indexOf(h.pet) < 0) ids.unshift(h.pet);
      h.pets = [];
      for (const id of ids) { const p = G.petById(id); if (p && !p.hero && h.pets.length < G.PET_MAX) { p.hero = h.id; p.out = 0; h.pets.push(id); } }
      G.petSort(h);
    }
    G.drops.length = 0; G.petRt.clear();
    vm1();
  };
  /* o guarda-roupa perde o espaço de mascote: agora mascote é sistema próprio */
  for (const id of Object.keys(G.COS)) if (G.COS[id].slot === 'pet') delete G.COS[id];
  G.COS_IDS = Object.keys(G.COS);
  G.COS_SLOTS = ['traje', 'asas', 'reliquia'];
})();

;
