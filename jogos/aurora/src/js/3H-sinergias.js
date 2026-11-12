/* 3H-sinergias: v26 — o que se combina rende mais.
   4B.1 Ressonância de inscrições: as 16 inscrições se agrupam em 6 famílias; 2/3/4 inscrições da mesma família num herói
        (somando todas as peças equipadas) ativam bônus de conjunto crescentes e próprios de cada família.
   4B.2 Formação × classes: combinações nomeadas de classes e posições (Muralha Arcana, Luz Compartilhada…) dão bônus
        pequenos na Arena (entram em G.arenaSim, os rivais também usam) e no grupo que luta contra o Colosso.
   Só simulação, sem DOM (as telas ficam em 6D-ui-sinergias.js). Nenhum estado novo é salvo: tudo é derivado das peças
   equipadas, das classes e das posições; os campos novos dos heróis começam com "_" (cache, não vão para o save). */
'use strict';
(function () {
  const clamp = G.clamp;

  /* ================= 4B.1 Ressonância de inscrições ================= */
  /* fx: frações somadas (0,03 = +3%) aplicadas uma vez a cada recálculo dos atributos (cache _dirty de G.heroStats).
     bleed/dbl/xp2/sw são efeitos de campo lidos de h._st: sangramento dos críticos, moeda dupla, experiência dupla, segundo fôlego. */
  G.RES_TIERS = [2, 3, 4];                       // inscrições da família para cada nível de ressonância
  G.RES_FAMS = [
    { id: 'furia', name: 'Fúria', icon: 'sword', col: '#e4574a', ins: ['furia', 'ruina', 'algoz'], lore: 'O ímpeto de quem não recua.',
      tiers: [
        { n: 'Ímpeto', txt: '+3% de ataque', fx: { atk: 0.03 } },
        { n: 'Golpe de Mestre', txt: '+10% de dano crítico', fx: { critDmg: 0.10 } },
        { n: 'Sangria', txt: 'críticos abrem uma ferida que sangra por 3 s', fx: { bleed: 0.12 } },
      ] },
    { id: 'baluarte', name: 'Baluarte', icon: 'shield', col: '#6f95d8', ins: ['colosso', 'muralha', 'espinhos'], lore: 'Pedra sobre pedra, ninguém passa.',
      tiers: [
        { n: 'Fundação', txt: '+3% de vida', fx: { hp: 0.03 } },
        { n: 'Parede Viva', txt: '+4% de defesa', fx: { def: 0.04 } },
        { n: 'Pele de Pedra', txt: '+5% de espinhos e +2% de vida', fx: { thorns: 0.05, hp: 0.02 } },
      ] },
    { id: 'vento', name: 'Vento', icon: 'wing', col: '#4fcfa4', ins: ['vendaval', 'falcao', 'nevoa'], lore: 'Leve como o primeiro sopro da manhã.',
      tiers: [
        { n: 'Brisa', txt: '+2,5% de velocidade de ataque', fx: { aspd: 0.025 } },
        { n: 'Passo Leve', txt: '+3% de esquiva', fx: { eva: 0.03 } },
        { n: 'Olho da Tempestade', txt: '+4% de chance crítica e +3% de movimento', fx: { crit: 0.04, spd: 0.03 } },
      ] },
    { id: 'vida', name: 'Vida', icon: 'heart', col: '#ee7a96', ins: ['fonte', 'sanguessuga'], lore: 'O corpo lembra como se cura.',
      tiers: [
        { n: 'Fôlego', txt: 'regenera +0,15% da vida por segundo', fx: { regen: 0.0015 } },
        { n: 'Sede Boa', txt: 'rouba +1% do dano como vida', fx: { ls: 0.01 } },
        { n: 'Segundo Fôlego', txt: 'ao cair, volta com 15% da vida (1× por dia)', fx: { sw: 0.15 } },
      ] },
    { id: 'fortuna', name: 'Fortuna', icon: 'coin', col: '#e8bb4a', ins: ['mercador', 'garimpo'], lore: 'Onde há ouro, há quem o encontre.',
      tiers: [
        { n: 'Bolso Fundo', txt: '+4% de moedas dos abates', fx: { gold: 0.04 } },
        { n: 'Faro de Garimpeiro', txt: '+4% de espólio', fx: { drop: 0.04 } },
        { n: 'Mão Cheia', txt: '12% de chance de dobrar as moedas de um abate', fx: { dbl: 0.12 } },
      ] },
    { id: 'saber', name: 'Saber', icon: 'book', col: '#a984ec', ins: ['sabio', 'mestria', 'peregrino'], lore: 'Quem anota, aprende em dobro.',
      tiers: [
        { n: 'Caderno de Campo', txt: '+4% de experiência', fx: { xp: 0.04 } },
        { n: 'Mão Treinada', txt: '-3% de recarga das habilidades', fx: { cdr: 0.03 } },
        { n: 'Lição Aprendida', txt: '10% de chance de dobrar a experiência de um abate', fx: { xp2: 0.10 } },
      ] },
  ];
  G.RES_FAM = {}; G.RES_OF = {};
  for (const f of G.RES_FAMS) { G.RES_FAM[f.id] = f; for (const i of f.ins) G.RES_OF[i] = f.id; }
  G.insFam = (id) => G.RES_FAM[G.RES_OF[id]] || null;
  G.resTier = (n) => (n >= 4 ? 3 : n >= 3 ? 2 : n >= 2 ? 1 : 0);

  /* inscrições por família (lista [[id, q], ...] ou várias listas) */
  const addCounts = (c, list, sgn) => { if (list) for (const e of list) { const f = G.RES_OF[e[0]]; if (f) c[f] = (c[f] || 0) + (sgn || 1); } return c; };
  const countsOf = (h) => { const c = {}; if (h.gear) for (const k in h.gear) { const it = h.gear[k]; if (it) addCounts(c, it.ins); } return c; };
  /* o herói com a peça do espaço `kind` trocada por uma lista de inscrições (null = sem peça) */
  G.resWith = (h, kind, ins) => { const c = countsOf(h), cur = h.gear && h.gear[kind]; if (cur) addCounts(c, cur.ins, -1); addCounts(c, ins); return c; };
  /* estado das famílias de um herói: só as que têm ao menos 1 inscrição, da maior contagem para a menor */
  G.resList = (c) => {
    const out = [];
    for (const f of G.RES_FAMS) {
      const n = c[f.id] || 0; if (n < 1) continue;
      const t = G.resTier(n);
      out.push({ f, n, t, need: t < 3 ? G.RES_TIERS[t] : 0, next: t < 3 ? f.tiers[t] : null, cur: t ? f.tiers[t - 1] : null });
    }
    return out.sort((a, b) => b.t - a.t || b.n - a.n);
  };
  /* contagens do herói (cache h._rc, recalculado junto com os atributos: nada por quadro) */
  G.resOf = (h) => { G.heroStats(h); return h._rc || (h._rc = countsOf(h)); };
  G.resTotalTiers = (c) => { let s = 0; for (const id in c) s += G.resTier(c[id]); return s; };

  const FXN = ['atk', 'def', 'hp', 'crit', 'eva', 'critDmg', 'aspd', 'spd', 'cdr', 'gold', 'drop', 'xp', 'thorns', 'ls', 'regen', 'heal'];
  const hs0 = G.heroStats;
  G.heroStats = (h) => {
    const prev = h._st, st = hs0(h);
    if (st === prev) return st;                       // veio do cache, já com ressonância e sinergia de grupo
    const rc = (h._rc = countsOf(h));
    /* despertou uma ressonância? (só heróis da cidade; a primeira leitura é silenciosa, por isso carregar um save não avisa nada) */
    const rt = {}, pt = h._rt;
    for (const f of G.RES_FAMS) rt[f.id] = G.resTier(rc[f.id] || 0);
    h._rt = rt;
    if (pt && h.id > 0) for (const f of G.RES_FAMS) if (rt[f.id] > pt[f.id]) {
      G.log('Ressonância ' + f.name + ': ' + f.tiers[rt[f.id] - 1].n + ' despertou em ' + h.name + ' (' + f.tiers[rt[f.id] - 1].txt + ').', 'good');
      G.emit('resonancia', { h, f, t: rt[f.id] });
    }
    let fx = null;
    const add = (f) => { if (!fx) fx = {}; for (const k in f) fx[k] = (fx[k] || 0) + f[k]; };
    for (const f of G.RES_FAMS) { const t = G.resTier(rc[f.id] || 0); for (let i = 0; i < t; i++) add(f.tiers[i].fx); }
    if (h._cs && h.state === 'colosso') add(h._cs);   // sinergia do grupo que luta contra o Colosso (4B.2)
    st.bleed = 0; st.dbl = 0; st.xp2 = 0; st.sw = 0;
    if (!fx) return st;
    let touch = false;
    for (const k of FXN) if (fx[k]) { touch = true; break; }
    if (fx.atk) st.atk *= 1 + fx.atk;
    if (fx.def) st.def *= 1 + fx.def;
    if (fx.hp) st.hp = Math.round(st.hp * (1 + fx.hp));
    if (fx.crit) st.crit = Math.min(0.75, st.crit + fx.crit);
    if (fx.eva) st.eva = Math.min(0.6, st.eva + fx.eva);
    if (fx.critDmg) st.critDmg += fx.critDmg;
    if (fx.aspd) st.int /= 1 + fx.aspd;
    if (fx.spd) st.spd *= 1 + fx.spd;
    if (fx.cdr) st.cdr = Math.min(0.5, st.cdr + fx.cdr);
    if (fx.gold) st.goldF += fx.gold;
    if (fx.drop) st.dropF += fx.drop;
    if (fx.xp) st.xpF += fx.xp;
    if (fx.thorns) st.thorns = Math.min(0.5, st.thorns + fx.thorns);
    if (fx.ls) st.ls = Math.min(0.25, (st.ls || 0) + fx.ls);
    if (fx.regen) st.regen = Math.min(0.02, (st.regen || 0) + fx.regen);
    if (fx.heal) st.healF += fx.heal;
    st.bleed = fx.bleed || 0; st.dbl = fx.dbl || 0; st.xp2 = fx.xp2 || 0; st.sw = fx.sw || 0;
    if (touch) st.eff = G.effLevel(st);
    return st;
  };

  /* Sangria (Fúria 4): um crítico deixa o alvo sangrando por 3 s, com 12% do golpe por segundo. Chamado de G.dmgToMon (gancho de 30-heroes). */
  G.bleedHit = (h, m, dmg) => {
    if (m.colosso || m.dead) return;
    const dps = dmg * (h._st ? h._st.bleed : 0.12), S = G.S;
    if (!m.dot || m.dot.until <= S.t || m.dot.dps < dps) m.dot = { dps, until: S.t + 3, c: '#e05a5a', by: h.id };
  };
  /* moeda dupla (Fortuna 4) e experiência dupla (Saber 4), só em abates */
  const km0 = G.killMon, gx0 = G.giveXp;
  let inKill = 0;
  G.killMon = (m, h) => {
    if (m.dead || !h || m.colosso) return km0(m, h);
    const g0 = h.gold, dbl = h._st ? h._st.dbl : 0;
    inKill++;
    try { km0(m, h); } finally { inKill--; }
    if (dbl > 0 && h.gold > g0 && Math.random() < dbl) {
      h.gold += h.gold - g0;
      G.addFx({ t: 'text', x: h.x, y: h.y - 1.2, s: 'moeda em dobro!', c: '#ffd35a' });
    }
  };
  G.giveXp = (h, n) => {
    const st = h._st;
    if (inKill > 0 && st && st.xp2 > 0 && Math.random() < st.xp2) { n *= 2; G.addFx({ t: 'text', x: h.x, y: h.y - 1.3, s: 'lição aprendida!', c: '#c8a0ff' }); }
    return gx0(h, n);
  };
  /* Segundo Fôlego (Vida 4): no golpe que seria fatal, o herói se agarra à vida (1× por dia) */
  const hf0 = G.heroFall;
  G.heroFall = (h, m) => {
    const st = h._st, S = G.S;
    if (st && st.sw > 0 && h._swD !== S.day) {
      h._swD = S.day; h.hp = Math.max(1, st.hp * st.sw); h.dot = null;
      if (h.state !== 'rift' && h.state !== 'defend' && h.state !== 'inc' && h.state !== 'colosso') { h.state = 'flee'; G.go(h, G.W.plaza.cx, G.W.plaza.cy); }
      G.addFx({ t: 'healring', x: h.x, y: h.y - 0.3 });
      G.log('O Segundo Fôlego de ' + h.name + ' (ressonância da Vida) o trouxe de volta da beira da queda.', 'good');
      return false;
    }
    return hf0(h, m);
  };

  /* escolha de peças dos heróis: quanto a troca sobe os níveis de ressonância do herói (peso pequeno: 4% do valor da peça por nível).
     Chamado de G.wantItem (gancho de 30-heroes). */
  G.RES_AI = 0.04;
  G.resGain = (h, it, cur) => {
    if (!it.ins || !it.ins.length) { if (!cur || !cur.ins || !cur.ins.length) return 0; }
    const base = G.resOf(h), kind = G.GEAR[it.type].kind, after = G.resWith(h, kind, it.ins);
    const d = G.resTotalTiers(after) - G.resTotalTiers(base);
    return d ? d * G.RES_AI * G.itemScore(it) : 0;
  };
  /* o que uma peça (do estoque ou equipada) faria pela ressonância dos heróis que a usam: [{ h, fam, from, to }] do melhor para o pior */
  G.resHelp = (it, only) => {
    const S = G.S, out = [];
    if (!it || !it.ins || !it.ins.length || !S) return out;
    const g = G.GEAR[it.type], kind = g.kind;
    for (const h of S.heroes) {
      if (only && h.id !== only) continue;
      const c = G.CLASSES[h.cls];
      if ((kind === 'arma' && it.type !== c.w) || (kind === 'armadura' && it.type !== c.a)) continue;
      const base = G.resOf(h), cur = h.gear[kind];
      if (cur === it) continue;
      const after = G.resWith(h, kind, it.ins);
      for (const f of G.RES_FAMS) {
        const a = base[f.id] || 0, b = after[f.id] || 0;
        if (b > a && G.resTier(b) > G.resTier(a)) out.push({ h, f, from: a, to: b, tier: G.resTier(b) });
      }
    }
    return out.sort((x, y) => (y.tier - G.resTier(y.from)) - (x.tier - G.resTier(x.from)) || y.to - x.to);
  };

  /* ================= 4B.2 Formação × classes ================= */
  /* Cada combinação diz quem entra (need: classe(s), posição 0 = frente / 1 = fundo, n = quantos) e o que cada papel ganha.
     others: bônus dos demais; distinct: de quantas classes diferentes; colo: 0 = não vale no Colosso (lá a posição é o alcance da classe).
     Efeitos (frações): atk def mhp crit cd(dano crítico) aspd eva ls regen heal cdr thorns. val = peso para sugerir e para a IA dos rivais. */
  G.SYN = [
    { id: 'muralha_arcana', name: 'Muralha Arcana', icon: 'shield', col: '#8f78e0', val: 0.06,
      req: 'Cavaleiro na frente + Mago no fundo', txt: 'Mago +7% de ataque · Cavaleiro +6% de defesa',
      need: [{ cls: 'cav', row: 0, fx: { def: 0.06 } }, { cls: 'mag', row: 1, fx: { atk: 0.07 } }] },
    { id: 'luz_compartilhada', name: 'Luz Compartilhada', icon: 'sun', col: '#f0cf63', val: 0.05, min: 2,
      req: 'Paladino + qualquer aliado', txt: 'Paladino cura +20% · todos regeneram +0,05% da vida por segundo',
      need: [{ cls: 'pal', fx: { heal: 0.2, regen: 0.0005 } }], others: { regen: 0.0005 } },
    { id: 'sombras_gemeas', name: 'Sombras Gêmeas', icon: 'eye', col: '#9a8fc2', val: 0.05,
      req: '2 Ladinos', txt: 'Ladinos +4% de chance crítica e +6% de dano crítico',
      need: [{ cls: 'lad', n: 2, fx: { crit: 0.04, cd: 0.06 } }] },
    { id: 'chuva_cruzada', name: 'Chuva Cruzada', icon: 'wing', col: '#6fc385', val: 0.05,
      req: '2 Arqueiros no fundo', txt: 'Arqueiros +6% de velocidade de ataque',
      need: [{ cls: 'arq', row: 1, n: 2, fx: { aspd: 0.06 } }] },
    { id: 'gume_duplo', name: 'Gume Duplo', icon: 'sword', col: '#e0705a', val: 0.05,
      req: '2 Espadachins na frente', txt: 'Espadachins +3% de ataque e +4% de velocidade de ataque',
      need: [{ cls: 'esp', row: 0, n: 2, fx: { atk: 0.03, aspd: 0.04 } }] },
    { id: 'escudo_da_fe', name: 'Escudo da Fé', icon: 'shield', col: '#e6c25a', val: 0.05,
      req: 'Cavaleiro + Paladino na frente', txt: 'Os dois +12% de defesa',
      need: [{ cls: 'cav', row: 0, fx: { def: 0.12 } }, { cls: 'pal', row: 0, fx: { def: 0.12 } }] },
    { id: 'fogo_cruzado', name: 'Fogo Cruzado', icon: 'bolt', col: '#f09a4a', val: 0.05,
      req: 'Arqueiro + Mago no fundo', txt: 'Os dois +4% de ataque e -4% de recarga das habilidades',
      need: [{ cls: 'arq', row: 1, fx: { atk: 0.04, cdr: 0.04 } }, { cls: 'mag', row: 1, fx: { atk: 0.04, cdr: 0.04 } }] },
    { id: 'sombra_do_escudo', name: 'Sombra do Escudo', icon: 'moon', col: '#8aa0c8', val: 0.04, colo: 0,
      req: 'Ladino no fundo + Cavaleiro, Espadachim ou Paladino na frente', txt: 'Ladino +25% de dano crítico e +8% de esquiva',
      need: [{ cls: 'lad', row: 1, fx: { cd: 0.25, eva: 0.08 } }, { cls: ['cav', 'esp', 'pal'], row: 0, fx: {} }] },
    { id: 'lamina_abencoada', name: 'Lâmina Abençoada', icon: 'spark', col: '#f2d98a', val: 0.04,
      req: 'Espadachim na frente + Paladino', txt: 'Espadachim +7% de ataque e +2% de roubo de vida',
      need: [{ cls: 'esp', row: 0, fx: { atk: 0.07, ls: 0.02 } }, { cls: 'pal', fx: {} }] },
    { id: 'flecha_sob_escudo', name: 'Flecha sob o Escudo', icon: 'target', col: '#7fb4d6', val: 0.04,
      req: 'Cavaleiro na frente + Arqueiro no fundo', txt: 'Arqueiro +6% de chance crítica e +5% de velocidade de ataque · Cavaleiro +5% de defesa',
      need: [{ cls: 'cav', row: 0, fx: { def: 0.05 } }, { cls: 'arq', row: 1, fx: { crit: 0.06, aspd: 0.05 } }] },
    { id: 'tempestade_dupla', name: 'Tempestade Dupla', icon: 'star', col: '#b390f0', val: 0.05,
      req: '2 Magos no fundo', txt: 'Magos +6% de ataque e -6% de recarga das habilidades',
      need: [{ cls: 'mag', row: 1, n: 2, fx: { atk: 0.06, cdr: 0.06 } }] },
    { id: 'companhia_variada', name: 'Companhia Variada', icon: 'people', col: '#d0b88a', val: 0.04,
      req: '3 ou 4 heróis, todos de classes diferentes', txt: 'Todos +1,5% de ataque e +1,5% de vida',
      distinct: [3, 4], alldiff: 1, all: { atk: 0.015, mhp: 0.015 } },
    { id: 'companhia_completa', name: 'Companhia Completa', icon: 'crown', col: '#ffd35a', val: 0.07,
      req: '5 classes diferentes', txt: 'Todos +2% de ataque e +1,5% de defesa e de vida',
      distinct: [5, 9], all: { atk: 0.02, def: 0.015, mhp: 0.015 } },
  ];
  G.SYN_BY = {}; for (const c of G.SYN) G.SYN_BY[c.id] = c;

  /* quais combinações estão ativas para uma lista de membros [{ cls, row }]; devolve { act: [{ id, who }], fx: [efeitos de cada membro] }.
     o.off = ids desligados · o.col = regras do Colosso (a posição vem do alcance da classe) */
  G.synFind = (mem, o) => {
    o = o || {};
    const n = mem.length, fx = mem.map(() => ({})), act = [];
    const add = (i, f) => { const t = fx[i]; for (const k in f) t[k] = (t[k] || 0) + f[k]; };
    for (const c of G.SYN) {
      if ((c.min && n < c.min) || (o.off && o.off.indexOf(c.id) >= 0) || (o.col && c.colo === 0)) continue;
      let who = null;
      if (c.need) {
        const used = {}, got = [];
        let ok = true;
        for (const r of c.need) {
          const cs = Array.isArray(r.cls) ? r.cls : [r.cls], g = [];
          for (let i = 0; i < n; i++) if (!used[i] && cs.indexOf(mem[i].cls) >= 0 && (r.row == null || mem[i].row === r.row)) g.push(i);
          if (g.length < (r.n || 1)) { ok = false; break; }
          for (const i of g) used[i] = 1;
          got.push(g);
        }
        if (!ok) continue;
        who = [];
        c.need.forEach((r, k) => { for (const i of got[k]) { add(i, r.fx); who.push(i); } });
        if (c.others) for (let i = 0; i < n; i++) if (!used[i]) add(i, c.others);
      } else if (c.distinct) {
        const d = Object.keys(mem.reduce((a, m) => { a[m.cls] = 1; return a; }, {})).length;
        if (d < c.distinct[0] || d > c.distinct[1] || (c.alldiff && d !== n)) continue;
        who = mem.map((_, i) => i);
        for (const i of who) add(i, c.all);
      }
      if (who) act.push({ id: c.id, who });
    }
    return { act, fx };
  };
  /* valor de uma formação (para sugerir e para os rivais escolherem a posição): soma dos pesos, pelo alcance de cada combinação */
  G.synValue = (mem, o) => {
    const r = G.synFind(mem, o); let v = 0;
    for (const a of r.act) v += G.SYN_BY[a.id].val * (0.6 + 0.4 * a.who.length / mem.length);
    return v;
  };
  /* membros de uma equipe da Arena: [{ id, r }] → [{ cls, row }] */
  const memOfTeam = (team) => team.map((x) => { const h = G.S.heroes.find((y) => y.id === x.id); return { cls: h ? h.cls : 'esp', row: x.r ? 1 : 0 }; });
  G.synTeam = (team) => { const mem = memOfTeam(team), r = G.synFind(mem); return r.act.map((a) => ({ id: a.id, who: a.who.map((i) => team[i].id) })); };

  /* aplica os efeitos de um membro à "planta" imutável de um combatente (cópia) */
  const applyFx = (bp, f) => {
    let any = false; for (const k in f) { any = true; break; }
    if (!any) return bp;
    const b = Object.assign({}, bp);
    if (f.atk) b.atk *= 1 + f.atk;
    if (f.def) b.def *= 1 + f.def;
    if (f.mhp) b.mhp *= 1 + f.mhp;
    if (f.crit) b.crit = Math.min(0.75, b.crit + f.crit);
    if (f.cd) b.cd += f.cd;
    if (f.aspd) b.int /= 1 + f.aspd;
    if (f.eva) b.eva = Math.min(0.6, b.eva + f.eva);
    if (f.ls) b.ls += f.ls;
    if (f.regen) b.regen += f.regen;
    if (f.heal) b.heal += f.heal;
    if (f.thorns) b.thorns += f.thorns;
    if (f.cdr) b.skills = b.skills.map((s) => Object.assign({}, s, { cd: Math.max(3, s.cd * (1 - f.cdr)) }));
    return b;
  };
  const synCache = new WeakMap();
  const synOf = (bps, off) => {
    const key = off && off.length ? off.join('|') : '';
    let m = synCache.get(bps); if (!m) synCache.set(bps, (m = {}));
    if (m[key]) return m[key];
    const r = G.synFind(bps.map((b) => ({ cls: b.cls, row: b.row })), { off });
    return (m[key] = { bps: bps.map((b, i) => applyFx(b, r.fx[i])), act: r.act.map((a) => ({ id: a.id, who: a.who, names: a.who.map((i) => bps[i].name) })) });
  };
  /* o duelo da Arena: as combinações de cada lado entram nas plantas antes de simular (determinístico, rivais incluídos).
     o.noSyn desliga tudo; o.synOff = { 0: [ids], 1: [ids] } desliga combinações de um lado (para achar a decisiva). O resultado traz sim.syn = [lado 0, lado 1]. */
  const as0 = G.arenaSim;
  G.arenaSim = (bpA, bpB, seed, o) => {
    o = o || {};
    const so = o.synOff || {};
    const a = o.noSyn ? { bps: bpA, act: [] } : synOf(bpA, so[0]), b = o.noSyn ? { bps: bpB, act: [] } : synOf(bpB, so[1]);
    const r = as0(a.bps, b.bps, seed, o);
    r.syn = [a.act, b.act];
    return r;
  };
  /* os rivais também escolhem a posição pela formação: entre as divisões com a mesma quantidade na frente, a de maior valor de
     combinações vence; sem combinação possível, vale a de sempre (os mais parrudos na frente) */
  /* divisão em frente/fundo (a mesma quantidade na frente de sempre: metade, arredondada para cima) que mais valoriza as combinações;
     empata-se pelos mais parrudos na frente. Devolve uma máscara (bit i = frente) para os n membros [{ cls, tank }] */
  const bestMask = (ms) => {
    const n = ms.length, front = Math.ceil(n / 2), tot = ms.reduce((a, m) => a + m.tank, 0) || 1;
    let best = null;
    for (let mask = 0; mask < (1 << n); mask++) {
      let pc = 0, tk = 0; for (let i = 0; i < n; i++) if (mask >> i & 1) { pc++; tk += ms[i].tank; }
      if (pc !== front) continue;
      const sc = G.synValue(ms.map((m, i) => ({ cls: m.cls, row: mask >> i & 1 ? 0 : 1 }))) + 0.03 * tk / tot;
      if (!best || sc > best.sc + 1e-9) best = { sc, mask };
    }
    return best ? best.mask : 0;
  };
  const tankOf = (st) => st.hp * (1 + st.def / Math.max(1, st.atk));
  const rbp0 = G.arenaRivalBps;
  G.arenaRivalBps = (rz) => {
    const hs = rz.heroes;
    if (!hs._syn) {
      hs._syn = 1;
      const mask = bestMask(hs.map((x) => ({ cls: x.h.cls, tank: tankOf(x.st) })));
      hs.forEach((x, i) => { x.row = mask >> i & 1 ? 0 : 1; });
    }
    return rbp0(rz);
  };
  /* a equipe automática do jogador (botão Sugerir, duelo sem posições escolhidas, robô do simulador) também escolhe pela formação */
  const ar0 = G.arenaAutoRows;
  G.arenaAutoRows = (ids) => {
    const hs = ids.map((id) => G.S.heroes.find((h) => h.id === id)).filter(Boolean);
    if (hs.length < 2 || hs.length !== ids.length) return ar0(ids);
    const mask = bestMask(hs.map((h) => ({ cls: h.cls, tank: tankOf(G.heroStats(h)) }))), rows = {};
    hs.forEach((h, i) => { rows[h.id] = mask >> i & 1 ? 0 : 1; });
    return rows;
  };
  /* a combinação decisiva: tira, uma a uma, as combinações do lado vencedor e refaz o mesmo duelo (mesma semente); se o resultado vira,
     confirma com 10 outras sementes que a chance do vencedor cai de verdade (pelo menos 12 pontos): luta equilibrada vira com qualquer
     pitada de sorte, e isso não é mérito de combinação nenhuma. Se só a ausência de todas vira, vale a de maior peso. */
  const ad0 = G.arenaDuel;
  G.arenaDuel = (o) => {
    const res = ad0(o);
    if (!res || res.err || !res.sim || !res.sim.syn) return res;
    const A = res.sim.syn[0], B = res.sim.syn[1];
    res.syn = { me: A, rv: B, dec: null };
    const ws = res.win ? 0 : 1, wl = res.sim.syn[ws];
    if (!wl.length) return res;
    const bpA = G.arenaMyBps(res.team), bpB = G.arenaRivalBps(res.rz), off = (ids) => ({ [ws]: ids });
    const flip = (ids) => G.arenaSim(bpA, bpB, res.seed, { synOff: off(ids) }).win !== res.win;
    const chance = (ids) => { let w = 0; for (let k = 0; k < 10; k++) if ((G.arenaSim(bpA, bpB, G.hash('dc|' + res.seed + '#' + k), { synOff: off(ids) }).win ? 0 : 1) === ws) w++; return w / 10; };
    const ord = wl.slice().sort((x, y) => G.SYN_BY[y.id].val - G.SYN_BY[x.id].val).slice(0, 3);
    let hit = ord.find((a) => flip([a.id])), ids = hit && [hit.id];
    if (!hit && wl.length > 1 && flip(wl.map((a) => a.id))) { hit = ord[0]; ids = wl.map((a) => a.id); }
    if (hit) {
      const p0 = chance([]), p1 = chance(ids);
      if (p0 - p1 >= 0.12) res.syn.dec = { side: ws, id: hit.id, names: hit.names, p0, p1 };
    }
    return res;
  };

  /* sugestão para a tela de equipe: a melhor troca simples (mudar um herói de posição ou trocá-lo por outro do banco) que ativa
     uma combinação nova. Devolve { kind: 'row'|'swap', id, r, out, inn, combo, text } ou null. */
  const POS = ['a frente', 'o fundo'];
  G.synSuggest = (team) => {
    const S = G.S, n = team.length;
    const hs = team.map((x) => S.heroes.find((h) => h.id === x.id));
    if (hs.some((h) => !h) || n < 2) return null;
    const val = (t) => G.synValue(memOfTeam(t)), idsOf = (t) => G.synFind(memOfTeam(t)).act.map((a) => a.id);
    const base = val(team), baseIds = idsOf(team);
    const first = (t) => { const ids = idsOf(t).filter((i) => baseIds.indexOf(i) < 0); return ids.length ? G.SYN_BY[ids[0]] : null; };
    let best = null;
    const consider = (t, kind, o) => {
      const v = val(t), combo = first(t); if (!combo || v <= base + 1e-6) return;
      const sc = v - base - (o.loss || 0);
      if (sc > 1e-6 && (!best || sc > best.sc)) best = Object.assign({ sc, kind, combo, team: t }, o);
    };
    team.forEach((x, i) => {                                            // 1) só mudar de posição
      const t = team.map((y) => ({ id: y.id, r: y.r })); t[i].r = x.r ? 0 : 1;
      consider(t, 'row', { id: x.id, r: t[i].r, text: 'Troque ' + hs[i].name + ' para ' + POS[t[i].r] + ' e ative ' });
    });
    const bench = S.heroes.filter((h) => !team.some((x) => x.id === h.id)).map((h) => ({ h, p: G.arenaHeroPow(h) })).sort((a, b) => b.p - a.p).slice(0, 6);
    team.forEach((x, i) => {                                            // 2) chamar alguém do banco no lugar de um da equipe
      const pOut = G.arenaHeroPow(hs[i]);
      for (const b of bench) {
        if (b.p < pOut * 0.72) continue;
        for (const r of [0, 1]) {
          const t = team.map((y) => ({ id: y.id, r: y.r })); t[i] = { id: b.h.id, r };
          const loss = Math.max(0, pOut - b.p) / pOut / n * 0.9;
          consider(t, 'swap', { out: x.id, inn: b.h.id, r, loss, text: 'Chame ' + b.h.name + ' (' + G.CLASSES[b.h.cls].name + ') para ' + POS[r] + ', no lugar de ' + hs[i].name + ', e ative ' });
        }
      }
    });
    return best;
  };

  /* ---------- sinergia do grupo no Colosso ---------- */
  /* quem está em estado 'colosso' (a caminho ou lutando) forma um grupo; a posição de cada um é o alcance da classe
     (alcance < 2,5: frente; senão fundo). A cada segundo vê se o grupo mudou; os efeitos entram nos atributos pelo fluxo normal (h._cs + _dirty). */
  G.SYN_COL = 0.6;   // o grupo do Colosso tem até 10 heróis e empilha várias combinações: lá os bônus valem 60%
  const rowOfCls = (cls) => (G.CLASSES[cls].rng >= 2.5 ? 1 : 0);
  let cT = 0, cKey = '', cPrev = [], cIds = '', cLog = 0;
  G.colSyn = { act: [], n: 0 };
  const colUpdate = () => {
    const S = G.S; if (!S || !S.heroes) return;
    let key = ''; const g = [];
    for (const h of S.heroes) if (h.state === 'colosso') { g.push(h); key += h.id + ','; }
    if (key === cKey) return;
    cKey = key;
    for (const h of cPrev) if (h._cs) { h._cs = null; h._dirty = true; }
    cPrev = g;
    if (!g.length) { G.colSyn = { act: [], n: 0 }; cIds = ''; return; }
    const r = G.synFind(g.map((h) => ({ cls: h.cls, row: rowOfCls(h.cls) })), { col: 1 });
    r.fx.forEach((f, i) => {                          // os efeitos da formação usam os nomes da Arena (mhp, cd); os atributos do herói, hp e critDmg
      let any = false; const o = {};
      for (const k in f) { any = true; o[k === 'mhp' ? 'hp' : k === 'cd' ? 'critDmg' : k] = f[k] * G.SYN_COL; }
      if (any) { g[i]._cs = o; g[i]._dirty = true; }
    });
    G.colSyn = { act: r.act.map((a) => ({ id: a.id, names: a.who.map((i) => g[i].name) })), n: g.length };
    const ids = r.act.map((a) => a.id).join(',');
    if (ids && ids !== cIds && S.t - cLog > 20) { cLog = S.t; G.log('Formação no Colosso: ' + r.act.map((a) => G.SYN_BY[a.id].name).join(', ') + '.', 'good'); }
    cIds = ids;
  };
  /* o que aconteceria se todos os heróis fossem ao Colosso (para a aba do Colosso sugerir a convocação) */
  G.colSynAll = () => {
    const hs = G.S.heroes.slice().sort((a, b) => G.arenaHeroPow(b) - G.arenaHeroPow(a)), r = G.synFind(hs.map((h) => ({ cls: h.cls, row: rowOfCls(h.cls) })), { col: 1 });
    return { n: hs.length, act: r.act.map((a) => ({ id: a.id, names: a.who.map((i) => hs[i].name) })) };
  };
  const tk0 = G.tick;
  G.tick = (dt) => { tk0(dt); cT -= dt; if (cT <= 0) { cT = 1; colUpdate(); } };
  const al0 = G.afterLoad; G.afterLoad = () => { al0(); cKey = ''; cPrev = []; cIds = ''; cT = 0; for (const h of G.S.heroes) h._cs = null; };
  const ng0 = G.newGame; G.newGame = () => { const S = ng0(); cKey = ''; cPrev = []; cIds = ''; cT = 0; G.colSyn = { act: [], n: 0 }; return S; };
})();
;
