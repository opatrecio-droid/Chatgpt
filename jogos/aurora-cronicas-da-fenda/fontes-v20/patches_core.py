# Patches de lógica (módulos 00–33). Cada item: (trecho original exato, substituto).
P = []
def add(old, new):
    P.append((old, new))

# ---------- 00-core ----------
add("G.VERSION = '19.0';", "G.VERSION = '20.0';")
add("G.BUILD = 'Aurora_ciclo_030_reforjada';", "G.BUILD = 'Aurora_ciclo_031_vocacoes';")
add("""/* Aurora — Crônicas da Fenda · v19 "Reforjada\"""", """/* Aurora — Crônicas da Fenda · v20 "Vocações\"""")
add("stats: { kills: 0, elites: 0, bosses: 0, falls: 0, crafted: 0, goldIn: 0, goldOut: 0, sold: 0, promos: 0, rebirths: 0, contracts: 0, maxLvl: 1, played: 0, recruits: 0, potions: 0, meals: 0 },",
    "stats: { kills: 0, elites: 0, bosses: 0, falls: 0, crafted: 0, goldIn: 0, goldOut: 0, sold: 0, promos: 0, rebirths: 0, contracts: 0, maxLvl: 1, played: 0, recruits: 0, potions: 0, meals: 0, jobs: 0, artes: 0, wakes: 0, mounts: 0, decor: 0, dismantled: 0 },\n  decor: {},        // enfeites da cidade: id -> nível\n  stable: { list: [], hungry: 0 },   // montarias do Estábulo\n  mascate: { day: 0, offers: [] },   // ofertas do comerciante errante")
add("opts: { sfx: 0.7, music: 0.35, follow: 0, autoSpeed: 1, lowFx: 0, autoForge: 1, autoSell: 1 },",
    "opts: { sfx: 0.7, music: 0.35, follow: 0, autoSpeed: 1, lowFx: 0, autoForge: 1, autoSell: 1, hsort: 'padrao' },")

# ---------- 10-data ----------
add("  essencia: { name: 'Essência da Fenda', shape: 'flame', c: ['#9a6af8', '#5a2ac8', '#e0c8ff'], rare: 1, base: 400 },\n};",
    "  essencia: { name: 'Essência da Fenda', shape: 'flame', c: ['#9a6af8', '#5a2ac8', '#e0c8ff'], rare: 1, base: 400 },\n"
    "  tomo:     { name: 'Tomo de Técnica', shape: 'tome', c: ['#3b6fb5', '#24477a', '#f2e6c0'], rare: 1, sp: 1, base: 90 },\n"
    "  alma:     { name: 'Cristal de Alma', shape: 'soul', c: ['#7ae0d0', '#2f9a8e', '#eafffb'], rare: 1, sp: 1, base: 600 },\n"
    "  po_estelar: { name: 'Pó Estelar', shape: 'dust', c: ['#f0d070', '#b08c30', '#fff8d0'], rare: 1, sp: 1, base: 25 },\n"
    "  racao:    { name: 'Ração', shape: 'feed', c: ['#b08a4a', '#7a5a2a', '#e0c080'], sp: 1, base: 3 },\n};")
add("""  espada:  { name: 'Espada', kind: 'arma', base: 'minerio' },
  lanca:   { name: 'Lança', kind: 'arma', base: 'minerio' },
  arco:    { name: 'Arco', kind: 'arma', base: 'madeira' },
  cajado:  { name: 'Cajado', kind: 'arma', base: 'madeira' },
  martelo: { name: 'Martelo', kind: 'arma', base: 'minerio' },
  adaga:   { name: 'Adagas', kind: 'arma', base: 'minerio' },
  pesada:  { name: 'Armadura Pesada', kind: 'armadura', base: 'minerio' },
  media:   { name: 'Couraça', kind: 'armadura', base: 'madeira' },
  leve:    { name: 'Manto', kind: 'armadura', base: 'ervas' },
  anel:    { name: 'Amuleto', kind: 'acessorio', base: 'pedra' },
};
G.GEAR_IDS = Object.keys(G.GEAR);
G.SLOT = { arma: 'Arma', armadura: 'Armadura', acessorio: 'Acessório' };""",
"""  espada:  { name: 'Espada', kind: 'arma', base: 'minerio' },
  lanca:   { name: 'Lança', kind: 'arma', base: 'minerio' },
  arco:    { name: 'Arco', kind: 'arma', base: 'madeira' },
  cajado:  { name: 'Cajado', kind: 'arma', base: 'madeira' },
  martelo: { name: 'Martelo', kind: 'arma', base: 'minerio' },
  adaga:   { name: 'Adagas', kind: 'arma', base: 'minerio' },
  pesada:  { name: 'Armadura Pesada', kind: 'armadura', base: 'minerio' },
  media:   { name: 'Couraça', kind: 'armadura', base: 'madeira' },
  leve:    { name: 'Manto', kind: 'armadura', base: 'ervas' },
  anel:    { name: 'Amuleto', kind: 'acessorio', base: 'pedra', k: 0.7, pk: 0.8 },
  /* v20: peças menores — k = fator de custo da receita, pk = fator de preço, req = nível da Ferraria */
  elmo:    { name: 'Elmo', kind: 'elmo', base: 'minerio', k: 0.75, pk: 0.6, req: 2 },
  botas:   { name: 'Botas', kind: 'botas', base: 'madeira', k: 0.7, pk: 0.6, req: 2 },
  luvas:   { name: 'Manoplas', kind: 'luvas', base: 'minerio', k: 0.7, pk: 0.6, req: 3 },
  cinto:   { name: 'Cinturão', kind: 'cinto', base: 'ervas', k: 0.65, pk: 0.55, req: 4 },
  sinete:  { name: 'Anel', kind: 'anel', base: 'pedra', k: 0.7, pk: 0.7, req: 5 },
};
G.GEAR_IDS = Object.keys(G.GEAR);
G.SLOT = { arma: 'Arma', armadura: 'Armadura', elmo: 'Elmo', luvas: 'Manoplas', botas: 'Botas', cinto: 'Cinturão', acessorio: 'Amuleto', anel: 'Anel' };
G.SLOT_IDS = ['arma', 'armadura', 'elmo', 'luvas', 'botas', 'cinto', 'acessorio', 'anel'];
G.SLOT_TYPE = { elmo: 'elmo', luvas: 'luvas', botas: 'botas', cinto: 'cinto', acessorio: 'anel', anel: 'sinete' };
G.slotType = (h, slot) => (slot === 'arma' ? G.CLASSES[h.cls].w : slot === 'armadura' ? G.CLASSES[h.cls].a : G.SLOT_TYPE[slot]);
G.heroSlots = (h) => G.SLOT_IDS.map((s) => [s, G.slotType(h, s)]);
G.gearUnlocked = (type) => G.bLvl('ferraria') >= (G.GEAR[type].req || 1);""")
add("""  return { atk: Math.round(2.5 * m), hp: Math.round(14 * m), crit: 0.02 + 0.012 * it.rar };
};
G.itemScore = (it) => { const s = G.itemStats(it); return (s.atk || 0) * 4 + (s.def || 0) * 4 + (s.hp || 0) + (s.crit || 0) * 200; };
G.itemPrice = (it) => Math.round(42 * G.PM(G.TIER_LVL(it.tier)) * Math.pow(1.1, it.tier - 1) * G.RAR_PRICE[it.rar] * (1 + 0.22 * it.plus) * (G.GEAR[it.type].kind === 'acessorio' ? 0.8 : 1));""",
"""  if (k === 'elmo') return { def: Math.round(3 * m), hp: Math.round(16 * m) };
  if (k === 'luvas') return { atk: Math.round(3 * m), aspd: 0.03 + 0.006 * it.rar };
  if (k === 'botas') return { def: Math.round(2 * m), hp: Math.round(8 * m), eva: 0.015 + 0.005 * it.rar, mspd: 0.04 };
  if (k === 'cinto') return { hp: Math.round(22 * m), def: Math.round(1.5 * m) };
  if (k === 'anel') return { atk: Math.round(3.5 * m), critDmg: 0.06 + 0.03 * it.rar };
  return { atk: Math.round(2.5 * m), hp: Math.round(14 * m), crit: 0.02 + 0.012 * it.rar };
};
G.itemScore = (it) => { const s = G.itemStats(it); return (s.atk || 0) * 4 + (s.def || 0) * 4 + (s.hp || 0) + (s.crit || 0) * 200 + (s.aspd || 0) * 300 + (s.eva || 0) * 300 + (s.critDmg || 0) * 100; };
G.itemPrice = (it) => Math.round(42 * G.PM(G.TIER_LVL(it.tier)) * Math.pow(1.1, it.tier - 1) * G.RAR_PRICE[it.rar] * (1 + 0.22 * it.plus) * (G.GEAR[it.type].pk || 1));""")
add("  const k = g.kind === 'acessorio' ? 0.7 : 1;\n  const cost = {};", "  const k = g.k || 1;\n  const cost = {};")
add("""    desc: 'Pedra para as obras e minério para a forja.' },
};""", """    desc: 'Pedra para as obras e minério para a forja.' },
  /* v20: erguido ao norte das muralhas; late = terreno aberto depois da vegetação (não altera o resto do mapa) */
  estabulo:   { name: 'Estábulo do Vale', short: 'Estábulo', plot: [55, 35], cost: 450, mat: 1.1, sign: 'shoe', roof: '#8a5a34', wall: 'barn', cid: 3, site: 1, late: 1, staff: ['Tomé'],
    desc: 'Doma e abriga montarias para os heróis e transforma trigo em ração.' },
};""")
add("  { name: 'Yara', job: 'Aprendiz', at: 'mercado', look: 23 }, { name: 'Zeno', job: 'Caçador de animais', at: 'fazenda', look: 24 },\n];",
    "  { name: 'Yara', job: 'Aprendiz', at: 'mercado', look: 23 }, { name: 'Zeno', job: 'Caçador de animais', at: 'fazenda', look: 24 },\n  { name: 'Tomé', job: 'Tratador', at: 'estabulo', look: 25 },\n];")
add("  { id: 'maxLvl', name: 'Lenda viva', stat: 'maxLvl', tiers: [10, 20, 30, 40, 50, 60, 70, 80], what: 'nível máximo de um herói' },\n];",
    "  { id: 'maxLvl', name: 'Lenda viva', stat: 'maxLvl', tiers: [10, 20, 30, 40, 50, 60, 70, 80], what: 'nível máximo de um herói' },\n"
    "  { id: 'jobs', name: 'Muitos caminhos', stat: 'jobs', tiers: [1, 3, 6, 12, 24], what: 'mudanças de vocação' },\n"
    "  { id: 'artes', name: 'Disciplina secreta', stat: 'artes', tiers: [10, 50, 150, 400, 1000, 3000], what: 'pontos em Artes Secretas' },\n"
    "  { id: 'wakes', name: 'Olhos abertos', stat: 'wakes', tiers: [1, 4, 8, 16, 32], what: 'despertares' },\n"
    "  { id: 'mounts', name: 'Mestre das rédeas', stat: 'mounts', tiers: [1, 3, 6, 10], what: 'montarias domadas' },\n"
    "  { id: 'decor', name: 'Cidade em flor', stat: 'decor', tiers: [1, 5, 10, 20, 30], what: 'níveis de decoração' },\n"
    "  { id: 'dismantled', name: 'Nada se perde', stat: 'dismantled', tiers: [5, 25, 100, 400, 1500], what: 'peças desmontadas' },\n];")

# ---------- 20-world: terreno tardio do Estábulo ----------
add("""      world.plots[id] = { x: px, y: py, door: [px + 3, py + 4.45], cx: px + 3, cy: py + 2 };
      if (d.site) { set(px + 2, py + 4, T.PATH, 1); set(px + 3, py + 4, T.PATH, 1); }
    }""", """      world.plots[id] = { x: px, y: py, door: [px + 3, py + 4.45], cx: px + 3, cy: py + 2 };
      if (d.site) { set(px + 2, py + 4, T.PATH, 1); set(px + 3, py + 4, T.PATH, 1); }
    }
    const latePlots = {}; for (const id of G.BLD_IDS) if (G.BLD[id].late) { latePlots[id] = world.plots[id]; delete world.plots[id]; }""")
add("""    for (const id of G.BLD_IDS) {
      const d = G.BLD[id], [px, py] = d.plot;
      for (let y = py; y < py + 4; y++)""", """    for (const id of G.BLD_IDS) {
      const d = G.BLD[id], [px, py] = d.plot;
      if (d.late) { world.plots[id] = { x: px, y: py, door: [px + 3, py + 4.45], cx: px + 3, cy: py + 2 }; continue; }
      for (let y = py; y < py + 4; y++)""")
add("""    world.blocked = blockedProp;
    world.ready = true;""", """    /* terrenos tardios (v20): limpa a vegetação do lote e abre a porta sem mexer no sorteio do resto do mapa */
    for (const id in latePlots) {
      const pl = latePlots[id], px = pl.x, py = pl.y; world.plots[id] = pl;
      world.props = world.props.filter((p) => !(p.x > px - 0.6 && p.x < px + 6.6 && p.y > py - 0.4 && p.y < py + 6.2));
      for (let y = py - 1; y <= py + 5; y++) for (let x = px - 1; x <= px + 6; x++) { if (!inb(x, y)) continue; const i = I(x, y); if (blockedProp[i]) { blockedProp[i] = 0; walk[i] = 1; } if (tile[i] === T.FOREST && walk[i]) tile[i] = T.GRASS; }
      for (let y = py; y < py + 4; y++) for (let x = px; x < px + 6; x++) set(x, y, T.GRASS, 0);
      for (let x = px; x < px + 6; x++) { if (!walk[I(x, py + 4)]) set(x, py + 4, T.GRASS, 1); if (inb(x, py + 5) && !walk[I(x, py + 5)] && tile[I(x, py + 5)] !== T.WALL && tile[I(x, py + 5)] !== T.WATER) set(x, py + 5, T.GRASS, 1); }
      set(px + 2, py + 4, T.PATH, 1); set(px + 3, py + 4, T.PATH, 1);
    }
    world.blocked = blockedProp;
    world.ready = true;""")

# ---------- 30-heroes ----------
add("gear: { arma: null, armadura: null, acessorio: null }, caution: 1, order: 'auto',",
    "gear: { arma: null, armadura: null, elmo: null, luvas: null, botas: null, cinto: null, acessorio: null, anel: null }, caution: 1, order: 'auto',\n      j2: null, j3: null, sk: [1, 1, 1], arts: {}, ap: 0, apB: 0, wake: 0, mount: 0, tS2: 5, tS3: 8, bv: {}, shield: 0,")
add("""    const c = G.CLASSES[h.cls];
    const m = G.HW(h.lvl) * G.RANK_MULT[h.rank] * G.HERO_RAR_MULT[h.rar] * (1 + 0.3 * h.stars);
    let hp = c.hp * m * (1 + G.traitSum(h, 'hp')) * G.bless('vigor');
    let atk = c.atk * m * (1 + G.traitSum(h, 'atk')) * G.bless('lamina');
    let def = c.def * m * (1 + G.traitSum(h, 'def')) * G.bless('egide');
    let crit = c.crit + G.traitSum(h, 'crit');
    for (const k in h.gear) { const it = h.gear[k]; if (!it) continue; const s = G.itemStats(it); atk += s.atk || 0; def += s.def || 0; hp += s.hp || 0; crit += s.crit || 0; }
    const st = { hp: Math.round(hp), atk, def, crit: Math.min(0.75, crit), eva: Math.min(0.6, c.eva + G.traitSum(h, 'eva')), int: c.int / (1 + G.traitSum(h, 'aspd')), rng: c.rng, spd: c.spd * G.work('estradas') };""",
"""    const c = G.CLASSES[h.cls], B = G.heroBonus(h);
    const m = G.HW(h.lvl) * G.RANK_MULT[h.rank] * G.HERO_RAR_MULT[h.rar] * (1 + 0.3 * h.stars);
    let hp = c.hp * m * (1 + G.traitSum(h, 'hp') + B.hp) * G.bless('vigor');
    let atk = c.atk * m * (1 + G.traitSum(h, 'atk') + B.atk) * G.bless('lamina');
    let def = c.def * m * (1 + G.traitSum(h, 'def') + B.def) * G.bless('egide');
    let crit = c.crit + G.traitSum(h, 'crit') + B.crit, eva = c.eva + G.traitSum(h, 'eva') + B.eva, aspd = G.traitSum(h, 'aspd') + B.aspd, critDmg = 1.75 + B.critDmg, mspd = B.spd;
    for (const k in h.gear) { const it = h.gear[k]; if (!it) continue; const s = G.itemStats(it); atk += s.atk || 0; def += s.def || 0; hp += s.hp || 0; crit += s.crit || 0; eva += s.eva || 0; aspd += s.aspd || 0; critDmg += s.critDmg || 0; mspd += s.mspd || 0; }
    const st = { hp: Math.round(hp), atk, def, crit: Math.min(0.75, crit), eva: Math.min(0.6, eva), int: c.int / (1 + Math.max(-0.5, aspd)), rng: c.rng + B.rng, spd: c.spd * G.work('estradas') * (1 + mspd),
      critDmg, cdr: Math.min(0.5, B.cdr), goldF: B.gold, dropF: B.drop, xpF: B.xp, hungerF: B.hunger, tireF: B.tire, moodB: B.mood, healF: B.heal, eliteF: B.elite, thorns: B.thorns, bagB: B.bag, potB: B.pot };""")
add("const dmg = (st.atk * st.atk) / (st.atk + mdef) * (1 + st.crit * 0.75);", "const dmg = (st.atk * st.atk) / (st.atk + mdef) * (1 + st.crit * ((st.critDmg || 1.75) - 1));")
add("    if (S.ev.buff.festival > S.t) a *= 1.08;\n", "    if (S.ev.buff.festival > S.t) a *= 1.08;\n    if (h.buff.atk > S.t) a *= 1 + ((h.bv && h.bv.atk) || 0);\n    if (G.isNight(S.clock) && G.decorLvl('lampioes')) a *= 1 + G.decorV('lampioes');\n")
add("""  G.bagCap = (h) => 14 + 3 * h.rank;
  G.potCap = (h) => Math.min(6, 2 + Math.ceil(h.rank / 2));
  G.heroTitle = (h) => { const c = G.CLASSES[h.cls]; return c.evo[h.rank >= 4 ? 2 : h.rank >= 2 ? 1 : 0]; };""",
"""  G.bagCap = (h) => 14 + 3 * h.rank + G.heroStats(h).bagB;
  G.potCap = (h) => Math.min(8, 2 + Math.ceil(h.rank / 2) + G.heroStats(h).potB);
  G.heroTitle = (h) => (h.j3 && G.JOBS[h.j3] ? G.JOBS[h.j3].name : h.j2 && G.JOBS[h.j2] ? G.JOBS[h.j2].name : G.CLASSES[h.cls].name);""")
add("    n *= (1 + G.traitSum(h, 'xp')) * G.bless('sabedoria') * G.work('academia') * (1 + 0.15 * h.stars);",
    "    n *= (1 + G.traitSum(h, 'xp') + G.heroStats(h).xpF) * G.bless('sabedoria') * G.work('academia') * (1 + 0.15 * h.stars);")
add("      h.xp -= G.xpNeed(h.lvl); h.lvl++; h._dirty = true;\n", "      h.xp -= G.xpNeed(h.lvl); h.lvl++; h._dirty = true; G.artGain(h, 1);\n")
add("    h.rank++; h.xp = 0; h._dirty = true; h.hp = G.heroStats(h).hp; h.animo = 100;\n    G.S.stats.promos++;",
    "    h.rank++; h.xp = 0; h._dirty = true; h.hp = G.heroStats(h).hp; h.animo = 100; G.artGain(h, 3);\n    G.S.stats.promos++;")
add("    h.stars++; h.lvl = 1; h.rank = 0; h.xp = 0; h._dirty = true; h.hp = G.heroStats(h).hp;\n    G.S.stats.rebirths++;",
    "    h.stars++; h.lvl = 1; h.rank = 0; h.xp = 0; h._dirty = true; h.hp = G.heroStats(h).hp; G.artGain(h, 15);\n    G.S.stats.rebirths++;")
add("    for (const k in h.gear) if (h.gear[k]) { h.gear[k].forSale = true; S.inv.push(h.gear[k]); }\n    S.heroes.splice(i, 1);",
    "    for (const k in h.gear) if (h.gear[k]) { h.gear[k].forSale = true; S.inv.push(h.gear[k]); }\n    if (h.mount) { const mt = G.mountOf(h); if (mt) mt.hero = 0; }\n    S.heroes.splice(i, 1);")
add("      if (!it.forSale) continue;\n      const g = G.GEAR[it.type];\n      if (g.kind === 'arma' && it.type !== c.w) continue;",
    "      if (!it.forSale || it.lock) continue;\n      const g = G.GEAR[it.type];\n      if (g.kind === 'arma' && it.type !== c.w) continue;")
# dano no monstro
add("""  G.dmgToMon = (h, m, mult, forceCrit) => {
    const S = G.S, st = G.heroStats(h), md = G.heroMod(h);
    const atk = st.atk * md.a;
    if (m.eva && Math.random() < m.eva) { G.addFx({ t: 'miss', x: m.x, y: m.y - 0.8 }); return 0; }
    let dmg = (atk * atk) / (atk + m.def) * G.rnd(0.88, 1.12) * (mult || 1);
    const crit = forceCrit || Math.random() < st.crit; if (crit) dmg *= 1.75;
    dmg *= 1 + G.bestBonus(G.MON[m.k].fam);
    if ((m.elite || m.boss) && G.hasTrait(h, 'cacador')) dmg *= 1.2;
    dmg = Math.max(1, Math.round(dmg));""",
"""  G.dmgToMon = (h, m, mult, forceCrit, o) => {
    const S = G.S, st = G.heroStats(h), md = G.heroMod(h);
    const atk = st.atk * md.a;
    if (m.dead) return 0;
    if (m.eva && !(m.stun > S.t) && Math.random() < m.eva) { G.addFx({ t: 'miss', x: m.x, y: m.y - 0.8 }); return 0; }
    let dmg = (atk * atk) / (atk + m.def * (1 - ((o && o.pierce) || 0))) * G.rnd(0.88, 1.12) * (mult || 1);
    const crit = forceCrit || Math.random() < st.crit; if (crit) dmg *= st.critDmg;
    dmg *= 1 + G.bestBonus(G.MON[m.k].fam);
    if (m.elite || m.boss) dmg *= 1 + (G.hasTrait(h, 'cacador') ? 0.2 : 0) + st.eliteF;
    if (m.vuln > S.t) dmg *= 1 + (m.vulnF || 0);
    dmg = Math.max(1, Math.round(dmg));""")
add("    h.tAtk = st.int / (G.S.ev.buff.furia > G.S.t ? 1.3 : 1);", "    h.tAtk = st.int / (G.S.ev.buff.furia > G.S.t ? 1.3 : 1) / (1 + (h.buff.aspd > G.S.t ? (h.bv && h.bv.aspd) || 0 : 0));")
add("""    h.tSkill = G.CLASSES[h.cls].skill.cd * (h.rank >= 4 ? 0.8 : 1);
    h.swing = 0.4; h.cast = 0.5;
    const pow = 1 + (h.rank >= 2 ? 0.15 : 0) + (h.rank >= 4 ? 0.2 : 0);""",
"""    h.tSkill = G.CLASSES[h.cls].skill.cd * (h.rank >= 4 ? 0.8 : 1) * (1 - st.cdr);
    h.swing = 0.4; h.cast = 0.5;
    const pow = (1 + (h.rank >= 2 ? 0.15 : 0) + (h.rank >= 4 ? 0.2 : 0)) * G.skillPow(h, 0);""")
add("const as = G.heroStats(a); const v = as.hp * 0.24 * pow; a.hp", "const as = G.heroStats(a); const v = as.hp * 0.24 * pow * (1 + st.healF); a.hp")
# dano no herói
add("""    if (Math.random() < st.eva) { G.addFx({ t: 'miss', x: h.x, y: h.y - 0.9 }); return false; }
    const d = G.MON[m.k], def = st.def * md.d * (1 - (d.pierce || 0));
    let dmg = (m.atk * m.atk) / (m.atk + def) * G.rnd(0.88, 1.12) * (mult || 1);
    if (h.buff.wall > S.t) dmg *= 0.45;
    dmg = Math.max(1, Math.round(dmg));
    h.hp -= dmg; h.lastHit = S.t; h.flash = 0.12;""",
"""    if (Math.random() < st.eva + (h.buff.eva > S.t ? (h.bv && h.bv.eva) || 0 : 0)) { G.addFx({ t: 'miss', x: h.x, y: h.y - 0.9 }); return false; }
    const d = G.MON[m.k], def = st.def * md.d * (1 - (d.pierce || 0));
    let dmg = (m.atk * m.atk) / (m.atk + def) * G.rnd(0.88, 1.12) * (mult || 1);
    if (h.buff.wall > S.t) dmg *= 0.45;
    if (h.buff.def > S.t) dmg *= 1 - Math.min(0.6, (h.bv && h.bv.def) || 0);
    dmg = Math.max(1, Math.round(dmg));
    /* espinhos devolvem parte do golpe; o escudo sagrado absorve antes da vida */
    const th = st.thorns + (h.buff.thorns > S.t ? (h.bv && h.bv.thorns) || 0 : 0);
    if (th > 0 && !m.dead) { const back = Math.max(1, Math.round(dmg * th)); m.hp -= back; m.hitBy[h.id] = 1; m.flash = 0.12; G.addFx({ t: 'dmg', x: m.x, y: m.y - 0.7 * (m.size || 1), n: back, c: '#c8e0ff' }); if (m.hp <= 0) G.killMon(m, h); }
    if (h.shield > 0 && h.buff.shield > S.t) { const ab = Math.min(h.shield, dmg); h.shield -= ab; dmg -= ab; if (dmg <= 0) { h.lastHit = S.t; G.addFx({ t: 'text', x: h.x, y: h.y - 1.1, s: 'escudo', c: '#8ab8ff' }); return false; } } else h.shield = 0;
    h.hp -= dmg; h.lastHit = S.t; h.flash = 0.12;""")
add("""      G.addFx({ t: 'healring', x: h.x, y: h.y - 0.3 }); G.log('A Graça das Duas Luas segurou ' + h.name + ' à beira da morte.', 'good'); return false;
    }""", """      G.addFx({ t: 'healring', x: h.x, y: h.y - 0.3 }); G.log('A Graça das Duas Luas segurou ' + h.name + ' à beira da morte.', 'good'); return false;
    }
    if ((h.wake || 0) >= 4 && h.wakeDay !== S.day) { // Transcendência: uma vez por dia
      h.wakeDay = S.day; h.hp = st.hp * 0.5; h.dot = null;
      G.addFx({ t: 'promo', x: h.x, y: h.y }); G.log(h.name + ' transcendeu a queda e voltou à luta.', 'epic'); return false;
    }""")
add("  G.reviveTime = (h) => (70 + 2.5 * h.lvl) / (1 + 0.3 * G.bLvl('enfermaria')) * (G.bOk('enfermaria') ? 1 : 2.4);",
    "  G.reviveTime = (h) => (70 + 2.5 * h.lvl) / (1 + 0.3 * G.bLvl('enfermaria')) * (G.bOk('enfermaria') ? 1 : 2.4) / (1 + G.decorV('altar'));")
add("    if (h.tAtk > 0) h.tAtk -= dt; if (h.tSkill > 0) h.tSkill -= dt; if (h.tPot > 0) h.tPot -= dt;",
    "    if (h.tAtk > 0) h.tAtk -= dt; if (h.tSkill > 0) h.tSkill -= dt; if (h.tPot > 0) h.tPot -= dt; if (h.tS2 > 0) h.tS2 -= dt; if (h.tS3 > 0) h.tS3 -= dt;")
add("""      h.fome = Math.max(0, h.fome - dt * (out ? 0.17 : 0.1) * (1 + G.traitSum(h, 'hunger')));
      h.energia = Math.max(0, h.energia - dt * (out ? 0.27 : 0.05) * (1 + G.traitSum(h, 'tire')));
      h.animo += (60 - h.animo) * dt * 0.004;""",
"""      h.fome = Math.max(0, h.fome - dt * (out ? 0.17 : 0.1) * Math.max(0.3, 1 + G.traitSum(h, 'hunger') + st.hungerF));
      h.energia = Math.max(0, h.energia - dt * (out ? 0.27 : 0.05) * Math.max(0.3, 1 + G.traitSum(h, 'tire') + st.tireF));
      h.animo += (Math.min(95, 60 + 60 * st.moodB) - h.animo) * dt * 0.004;
      if (h.buff.regen > S.t && h.hp < st.hp) h.hp = Math.min(st.hp, h.hp + st.hp * ((h.bv && h.bv.regen) || 0) * dt);""")
add("""        if (h.tSkill <= 0 && (h.cls !== 'pal' || frac < 0.7)) skill(h, m, mons);
        else if (h.tAtk <= 0) attack(h, m);
      }
    } else {""", """        G.heroAct(h, m, mons, frac);
      }
    } else {""")
add("      if (G.chase(h, m.x, m.y, dt, st.spd, st.rng + 0.3)) { if (h.tSkill <= 0 && (h.cls !== 'pal' || frac < 0.7)) skill(h, m, mons); else if (h.tAtk <= 0) attack(h, m); }",
    "      if (G.chase(h, m.x, m.y, dt, st.spd, st.rng + 0.3)) G.heroAct(h, m, mons, frac);")
add("  G.heroAttack = attack; G.heroSkill = skill;", """  G.heroAttack = attack; G.heroSkill = skill;
  /* uma ação por vez: habilidade da classe, habilidades de vocação, golpe comum */
  G.heroAct = (h, m, mons, frac) => {
    if (h.tSkill <= 0 && (h.cls !== 'pal' || frac < 0.7)) { skill(h, m, mons); return true; }
    if ((h.j2 || h.j3) && G.jobSkillTry(h, m, mons, frac)) return true;
    if (h.tAtk <= 0) { attack(h, m); return true; }
    return false;
  };""")

# ---------- 31-monsters ----------
add("    const gold = 2.4 * G.PM(m.lvl) * (d.gold || 1) * (m.boss ? 40 : m.elite ? 6 : 1) * G.rnd(0.8, 1.2) * G.bless('fortuna') * night;",
    "    const hst = G.heroStats(h);\n    const gold = 2.4 * G.PM(m.lvl) * (d.gold || 1) * (m.boss ? 40 : m.elite ? 6 : 1) * G.rnd(0.8, 1.2) * G.bless('fortuna') * night * (1 + hst.goldF);")
add("    const dropM = (1 + G.traitSum(h, 'drop')) * G.bless('colheita') * (1 + G.bestBonus(d.fam)) * red;",
    "    const dropM = (1 + G.traitSum(h, 'drop') + hst.dropF) * G.bless('colheita') * (1 + G.bestBonus(d.fam)) * red;")
add("        addBag(h, zm.e, 1 + (Math.random() < 0.25 * dropM ? 1 : 0)); addBag(h, zm.r, G.ri(2, 3)); addBag(h, zm.a, G.ri(5, 8)); addBag(h, zm.b, G.ri(5, 8));",
    "        addBag(h, zm.e, 1 + (Math.random() < 0.25 * dropM ? 1 : 0)); addBag(h, zm.r, G.ri(2, 3)); addBag(h, zm.a, G.ri(5, 8)); addBag(h, zm.b, G.ri(5, 8));\n        addBag(h, 'alma', 1); addBag(h, 'tomo', G.ri(1, 2));")
add("        if (m.elite && Math.random() < 0.12 * dropM) { S.nucleos++;", "        if (m.elite && Math.random() < 0.16 * dropM) addBag(h, 'tomo', 1);\n        if (m.elite && Math.random() < 0.12 * dropM) { S.nucleos++;")
add("      for (const hh of S.heroes) if (m.hitBy[hh.id]) hh.animo = Math.min(100, hh.animo + 25);", "      for (const hh of S.heroes) if (m.hitBy[hh.id]) { hh.animo = Math.min(100, hh.animo + 25); G.artGain(hh, 2); }")
add("""    m.tThink -= dt;
    const think = m.tThink <= 0; if (think) m.tThink = 0.3;
    let t = m.tgt;""", """    /* v20: efeitos das habilidades de vocação — veneno/queimadura, atordoamento e lentidão */
    if (m.dot && m.dot.until > S.t) {
      m.hp -= m.dot.dps * dt; m.dotT = (m.dotT || 0) - dt;
      if (m.dotT <= 0) { m.dotT = 0.7; G.addFx({ t: 'dmg', x: m.x, y: m.y - 0.7 * (m.size || 1), n: Math.max(1, Math.round(m.dot.dps * 0.7)), c: m.dot.c }); }
      if (m.hp <= 0) { const by = S.heroes.find((x) => x.id === m.dot.by) || S.heroes[0]; if (by) { m.hitBy[by.id] = 1; G.killMon(m, by); } else m.gone = true; return; }
    }
    if (m.stun > S.t) { m.moving = false; if (Math.random() < dt * 3) G.addFx({ t: 'text', x: m.x, y: m.y - 1.1 * (m.size || 1), s: '✦', c: '#ffe07a' }); return; }
    const mspd = m.slow > S.t ? m.spd * (m.slowF || 0.5) : m.spd;
    m.tThink -= dt;
    const think = m.tThink <= 0; if (think) m.tThink = 0.3;
    let t = m.tgt;""")
add("        if (G.chase(m, t.x, t.y, dt, m.spd, m.rng + 0.25 * m.size)) { if (m.tAtk <= 0) strike(m, t); }",
    "        if (G.chase(m, t.x, t.y, dt, mspd, m.rng + 0.25 * m.size)) { if (m.tAtk <= 0) strike(m, t); }")
add("        if (G.step(m, dt, m.spd * 0.7) || Math.hypot(m.x - Wd.plaza.cx, m.y - Wd.plaza.cy) < 2.6) G.mareBreach(m);",
    "        if (G.step(m, dt, mspd * 0.7) || Math.hypot(m.x - Wd.plaza.cx, m.y - Wd.plaza.cy) < 2.6) G.mareBreach(m);")
add("      G.earn(gold, 'mare'); S.selos += selos; S.nucleos += nuc; G.gainRealm(60 + 12 * S.realm.lvl, 'mare');\n      G.log('Aurora resistiu à Maré da Fenda! +' + G.fmt(gold) + ' moedas, +' + selos + ' Selo(s), +' + nuc + ' Núcleo(s).', 'epic');",
    "      G.earn(gold, 'mare'); S.selos += selos; S.nucleos += nuc; G.gainRealm(60 + 12 * S.realm.lvl, 'mare');\n      const almas = 1 + Math.floor(S.realm.lvl / 12); G.addRes('alma', almas); G.addRes('tomo', 1);\n      G.log('Aurora resistiu à Maré da Fenda! +' + G.fmt(gold) + ' moedas, +' + selos + ' Selo(s), +' + nuc + ' Núcleo(s), +' + almas + ' Cristal(is) de Alma e +1 Tomo de Técnica.', 'epic');")
add("    if (m && G.chase(h, m.x, m.y, dt, st.spd, st.rng + m.size * 0.35)) { if (h.tSkill <= 0 && (h.cls !== 'pal' || frac < 0.7)) G.heroSkill(h, m, mons); else if (h.tAtk <= 0) G.heroAttack(h, m); }",
    "    if (m && G.chase(h, m.x, m.y, dt, st.spd, st.rng + m.size * 0.35)) G.heroAct(h, m, mons, frac);")
add("    S.rift.best = Math.max(S.rift.best, f); S.rift.floor = f + 1;\n    G.log('Andar ' + f + ' da Fenda Infinita conquistado! +' + ess + ' Essência, +' + selos + ' Selo(s), +1 Núcleo, +' + G.fmt(gold) + ' moedas.', 'epic');",
    "    S.rift.best = Math.max(S.rift.best, f); S.rift.floor = f + 1;\n    const tomos = 1 + Math.floor(f / 4), almas = f % 5 === 0 ? 2 : 0; G.addRes('tomo', tomos); if (almas) G.addRes('alma', almas);\n    for (const h of S.heroes) if (h.state === 'rift') G.artGain(h, 1);\n    G.log('Andar ' + f + ' da Fenda Infinita conquistado! +' + ess + ' Essência, +' + selos + ' Selo(s), +1 Núcleo, +' + tomos + ' Tomo(s)' + (almas ? ', +' + almas + ' Cristais de Alma' : '') + ', +' + G.fmt(gold) + ' moedas.', 'epic');")

# ---------- 32-town ----------
add("    if (id === 'pocao') return 6 + 4 * G.bLvl('alquimista');\n", "    if (id === 'pocao') return 6 + 4 * G.bLvl('alquimista');\n    if (id === 'racao') return 10 + 10 * G.bLvl('estabulo');\n")
add("      ervas: L('fazenda') ? 0.9 * Math.pow(L('fazenda'), 1.15) * of : 0,", "      ervas: L('fazenda') ? 0.9 * Math.pow(L('fazenda'), 1.15) * of * (1 + G.decorV('jardim')) : 0,\n      racao: G.racaoRate(),")
add("""      n = Math.min(r.pocao, (S.res.ervas || 0) / 2, G.resCap('pocao') - (S.res.pocao || 0));
      if (n > 0) { G.addRes('ervas', -n * 2); G.addRes('pocao', n); }
    }""", """      n = Math.min(r.pocao, (S.res.ervas || 0) / 2, G.resCap('pocao') - (S.res.pocao || 0));
      if (n > 0) { G.addRes('ervas', -n * 2); G.addRes('pocao', n); }
      /* Estábulo: 2 trigo viram 1 ração, sem deixar a despensa dos moradores vazia */
      n = Math.min(r.racao, Math.max(0, (S.res.trigo || 0) - (S.pop || 12)) / 2, G.resCap('racao') - (S.res.racao || 0));
      if (n > 0) { G.addRes('trigo', -n * 2); G.addRes('racao', n); }
    }""")
add("    if (tier > G.forgeMaxTier()) return { ok: false, why: 'Requer Ferraria nível ' + ((tier - 1) * 2 + 1) };",
    "    if (tier > G.forgeMaxTier()) return { ok: false, why: 'Requer Ferraria nível ' + ((tier - 1) * 2 + 1) };\n    if (!G.gearUnlocked(type)) return { ok: false, why: 'Requer Ferraria nível ' + G.GEAR[type].req };\n    if (S.inv.length >= G.invCap()) return { ok: false, why: 'Armazém cheio — venda ou desmonte peças' };")
add("""      const c = G.CLASSES[h.cls];
      for (const [slot, type] of [['arma', c.w], ['armadura', c.a], ['acessorio', 'anel']]) {
        const cur = h.gear[slot];
        for (let t = mt; t >= 1; t--) {""", """      for (const [slot, type] of G.heroSlots(h)) {
        if (!G.gearUnlocked(type)) continue;
        const cur = h.gear[slot];
        for (let t = mt; t >= 1; t--) {""")
add("    pedreira: () => Wd.nearestWalk(23 + G.rnd(-3, 3.5), 76.6 + G.rnd(0, 1.2)),\n", "    pedreira: () => Wd.nearestWalk(23 + G.rnd(-3, 3.5), 76.6 + G.rnd(0, 1.2)),\n    estabulo: () => Wd.nearestWalk(58 + G.rnd(-3.4, 3.4), 39.6 + G.rnd(-0.3, 0.3)),\n")
add("  G.popCap = () => 8 + 4 * G.bLvl('cidadela') + G.builtCount();", "  G.popCap = () => 8 + 4 * G.bLvl('cidadela') + G.builtCount() + Math.floor(G.charm() / 10);")
add("* G.work('feira') * ((S.happy || 70) / 70) * (S.ev.buff.festival > S.t ? 2 : 1)); };", "* G.work('feira') * ((S.happy || 70) / 70) * (S.ev.buff.festival > S.t ? 2 : 1) * (1 + 0.01 * G.charm())); };")
add("    S.day++;\n    G.dailyRoll(); G.eventRoll(); G.mareSchedule(); G.checkAch();", "    S.day++;\n    G.dayHooks(); G.dailyRoll(); G.eventRoll(); G.mareSchedule(); G.checkAch();")

# ---------- 33-meta ----------
add("    G.mons.length = 0; G.npcs.length = 0; G.guards = null;\n    G.syncNpcs(); G.dailyRoll(); G.populate();\n    G.log('Bem-vindo a Aurora.",
    "    G.mons.length = 0; G.npcs.length = 0; G.guards = null;\n    G.vocMigrate(); G.syncNpcs(); G.dailyRoll(); G.populate();\n    G.log('Bem-vindo a Aurora.")
add("    S._stGen = (S._stGen || 0) + 1; S._training = 0;\n    if (S.pop == null) S.pop = 12; if (S.happy == null) S.happy = 70;",
    "    S._stGen = (S._stGen || 0) + 1; S._training = 0;\n    if (S.pop == null) S.pop = 12; if (S.happy == null) S.happy = 70;\n    G.vocMigrate();")

# forja automática: com 8 peças por herói, a Ferraria alta faz mais de uma encomenda por hora
add("    const S = G.S, mt = G.forgeMaxTier();\n    for (const h of S.heroes) {", "    const S = G.S, mt = G.forgeMaxTier();\n    let left = 1 + Math.floor(G.bLvl('ferraria') / 3);\n    for (const h of S.heroes) {")
add("          if (G.canCraft(type, t, false).ok && S.gold > G.recipe(type, t).gold * 3) { G.craft(type, t, false, true); return; }",
    "          if (G.canCraft(type, t, false).ok && S.gold > G.recipe(type, t).gold * 3) { G.craft(type, t, false, true); if (--left <= 0) return; break; }")
