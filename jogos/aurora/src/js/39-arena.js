/* 39-arena: v25 — Arena das Duas Luas. Quarenta reinos rivais, duelo determinístico com semente, tíquetes diários,
   temporada semanal com ligas e ranking, Loja de Insígnias e sumidouro de moedas. Só simulação, sem DOM:
   as telas ficam em 65-ui-arena.js. Estado em S.arena (inicialização preguiçosa: saves antigos continuam valendo). */
'use strict';
(function () {
  const dayNum = G.dayNum, DAY = 86400000;
  /* relógio da Arena: o do aparelho. O simulador sem tela troca esta função por um relógio virtual (1 dia de jogo = 1 dia da Arena). */
  G.arenaNow = () => Date.now();

  /* ajustes de equilíbrio num só lugar */
  G.ARENA = {
    tickets: 5,                       // tíquetes grátis por dia real
    coreCost: [2, 3, 5, 8, 12],       // Núcleos por tíquete extra comprado no dia (1º, 2º, …)
    K: 1.0,                           // escala geral dos rivais (calibrada no simulador)
    pday: 88,                         // pontos diários de um rival médio
    growth: 0.012,                    // crescimento do poder dos rivais por dia da temporada
    enrage: 40,                       // segundos de duelo até a Lua Rubra enfurecer os dois lados
    cap: 90,                          // duração máxima do duelo (segundos)
    dt: 0.2,                          // passo da simulação (s)
    healF: 0.5,                       // com a vida multiplicada, curas e escudos valem uma fração (para os curandeiros não travarem o duelo)
    form: [0.36, 0.24],               // "forma do dia": variação sorteada de ataque e de vida de cada combatente (±18% e ±12%)
    hpMul: 2.2,                       // "luz das duas luas": a vida de todos é multiplicada, para o duelo durar o bastante para as habilidades brilharem
  };
  G.ARENA_LEAGUES = [
    { id: 'bronze',   name: 'Bronze',          min: 0,   col: '#c98a5a', ins: 8,  selos: 1,  nuc: 1,  po: 3 },
    { id: 'prata',    name: 'Prata',           min: 90,  col: '#cfd6e4', ins: 15, selos: 2,  nuc: 2,  po: 5 },
    { id: 'ouro',     name: 'Ouro',            min: 230, col: '#f5c84a', ins: 25, selos: 3,  nuc: 3,  po: 8 },
    { id: 'platina',  name: 'Platina',         min: 400, col: '#7fe3d6', ins: 40, selos: 5,  nuc: 5,  po: 12 },
    { id: 'diamante', name: 'Diamante',        min: 580, col: '#8ac4ff', ins: 60, selos: 8,  nuc: 8,  po: 18 },
    { id: 'lenda',    name: 'Lenda das Luas',  min: 780, col: '#e6b0ff', ins: 90, selos: 12, nuc: 12, po: 28 },
  ];
  G.ARENA_SEA_NAMES = ['Lua do Corvo', 'Lua da Colheita', 'Lua do Lobo', 'Lua de Cobre', 'Lua da Névoa', 'Lua do Falcão', 'Lua de Âmbar', 'Lua do Cervo'];

  /* ================= estado ================= */
  const defaults = () => ({
    v: 1, open: 0, sea: 0, sn: 0, pts: 0, sw: 0, sl: 0, wins: 0, losses: 0, duels: 0, streak: 0, best: 0,
    ins: 0, xt: 0, ctr: 0, ctrC: null, team: [], rd: { d: 0, p: 0 }, off: null, flag: 0, last: null, pend: null, hist: [], titulos: [],
    tk: { d: 0, n: 0, b: 0, t: 0 },        // dia, grátis usados, comprados com Núcleos, duelos do dia
    shop: { w: 0, b: {} },                 // semana e quanto já foi comprado de cada item de Insígnias
    cs: { d: 0, b: {} },                   // dia e quanto já foi comprado na fileira de moedas
  });
  G.arena = () => {
    const S = G.S, a = S.arena || (S.arena = {}), d = defaults();
    for (const k in d) if (a[k] === undefined) a[k] = d[k];
    return a;
  };
  const nowMs = () => G.arenaNow();
  const today = () => dayNum(nowMs());

  /* semana ISO real (segunda a domingo, relógio do aparelho): idx = número da semana desde 1970; dis = dias (com fração) desde segunda */
  const seasonOf = (ms) => {
    const dn = dayNum(ms), idx = Math.floor((dn + 3) / 7), dow = (dn + 3) % 7;
    const d0 = new Date(ms); d0.setHours(0, 0, 0, 0);
    const e = new Date(d0.getTime()); e.setDate(e.getDate() + 7 - dow);
    const frac = G.clamp((ms - d0.getTime()) / DAY, 0, 1);
    return { idx, dow, dn, frac, dis: dow + frac, endsAt: e.getTime(), left: Math.max(0, e.getTime() - ms), name: G.ARENA_SEA_NAMES[idx % G.ARENA_SEA_NAMES.length] };
  };
  G.arenaSeason = () => seasonOf(nowMs());
  G.arenaOpen = () => { const S = G.S; return !!S && (G.bLvl('cidadela') >= 3 || S.realm.lvl >= 6); };

  /* ================= 2A.1 reinos rivais ================= */
  const NAMES_F = ['Adélia', 'Alícia', 'Branca', 'Cacilda', 'Cássia', 'Celeste', 'Clarice', 'Dalila', 'Diná', 'Estela', 'Eudora', 'Fátima', 'Genoveva', 'Helena', 'Iara', 'Inês', 'Jandira', 'Kátia', 'Lídia', 'Luzia', 'Mafalda', 'Matilde', 'Nair', 'Odete', 'Paulina', 'Quitéria', 'Rafaela', 'Rita', 'Rosália', 'Sabina', 'Tereza', 'Valéria', 'Vera', 'Yara', 'Zélia', 'Zulmira'];
  const NAMES_M = ['Abel', 'Aldo', 'Aurélio', 'Benício', 'Brás', 'Caetano', 'Celso', 'Clóvis', 'Dário', 'Dionísio', 'Eliseu', 'Fabrício', 'Firmino', 'Gaspar', 'Gil', 'Heitor', 'Ícaro', 'Inácio', 'Jerônimo', 'Leandro', 'Lourenço', 'Marcelo', 'Maurício', 'Nelson', 'Olavo', 'Otávio', 'Percival', 'Raul', 'Rômulo', 'Saulo', 'Sílvio', 'Tadeu', 'Ubirajara', 'Vasco', 'Vítor', 'Xavier'];
  /* título do líder por tipo de reino: [masculino, feminino] */
  const TITLES = { baronia: ['Barão', 'Baronesa'], marca: ['Marquês', 'Marquesa'], condado: ['Conde', 'Condessa'], ducado: ['Duque', 'Duquesa'], senhorio: ['Senhor', 'Senhora'], reino: ['Rei', 'Rainha'], ordem: ['Grão-Mestre', 'Grã-Mestra'], cla: ['Patriarca', 'Matriarca'], coroa: ['Soberano', 'Soberana'], protetorado: ['Protetor', 'Protetora'], liga: ['Presidente', 'Presidenta'], cidadela: ['Castelão', 'Castelã'], irmandade: ['Irmão-Maior', 'Irmã-Maior'], principado: ['Príncipe', 'Princesa'], guilda: ['Mestre-Guildeiro', 'Mestra-Guildeira'] };
  const MOTTOS = ['Honra antes do ouro.', 'Quem recua, aprende; quem foge, esquece.', 'Duas luas, uma só palavra.', 'O ferro responde por nós.', 'Cada derrota é um degrau.', 'Nunca apague a lanterna.', 'Passo firme, mão leve.', 'A Arena não perdoa o descuido.', 'Juntos até o último gongo.', 'Quem vence hoje, treina amanhã.', 'O vento muda, a bandeira fica.', 'Paciência é a lâmina mais afiada.', 'Corajoso é quem treme e entra.', 'Aqui se ganha nome.', 'Primeiro o escudo, depois a glória.', 'Pequenos passos, grandes brasões.', 'A sorte favorece o bem treinado.', 'Sob a lua cheia, ninguém se esconde.', 'Do trigal ao trono.', 'A cinza também sabe brilhar.'];
  /* [nome, tipo, símbolo] — o símbolo é um ícone do jogo (desenhado no brasão pela interface) */
  const R_DEF = [
    ['Baronia de Vale-Cinza', 'baronia', 'flag'], ['Marca do Corvo Rubro', 'marca', 'wing'], ['Condado das Três Pontes', 'condado', 'castle'], ['Ducado de Pedra-Funda', 'ducado', 'hammer'],
    ['Senhorio do Lago Dourado', 'senhorio', 'wave'], ['Reino de Alvorada Alta', 'reino', 'sun'], ['Ordem do Facho Azul', 'ordem', 'spark'], ['Clã do Lobo de Ferro', 'cla', 'paw'],
    ['Coroa de Cinza-Alta', 'coroa', 'castle'], ['Protetorado de Marfim', 'protetorado', 'horn'], ['Liga das Seis Marés', 'liga', 'wave'], ['Cidadela de Torre-Branca', 'cidadela', 'castle'],
    ['Irmandade do Trigal', 'irmandade', 'wheat'], ['Principado de Névoa-Fria', 'principado', 'moon'], ['Guilda do Sino Partido', 'guilda', 'horn'], ['Condado de Rio-Manso', 'condado', 'wave'],
    ['Baronia do Espinheiro', 'baronia', 'flower'], ['Marca de Areia-Viva', 'marca', 'sun'], ['Reino de Cervo-Branco', 'reino', 'paw'], ['Ducado de Lume-Antigo', 'ducado', 'spark'],
    ['Clã da Raposa Cinzenta', 'cla', 'paw'], ['Senhorio de Fonte-Escura', 'senhorio', 'eye'], ['Ordem da Rosa Negra', 'ordem', 'flower'], ['Liga do Pântano Doce', 'liga', 'flower'],
    ['Coroa do Sol Cansado', 'coroa', 'sun'], ['Protetorado de Mar-Quieto', 'protetorado', 'wave'], ['Cidadela do Penhasco', 'cidadela', 'shield'], ['Condado de Musgo-Velho', 'condado', 'flower'],
    ['Baronia de Ponte-Alta', 'baronia', 'crown'], ['Irmandade do Orvalho', 'irmandade', 'star'], ['Marca do Falcão Pálido', 'marca', 'wing'], ['Reino de Vento-Sul', 'reino', 'wing'],
    ['Ducado de Brasa-Mansa', 'ducado', 'bolt'], ['Clã do Urso Dourado', 'cla', 'paw'], ['Senhorio de Vau-Largo', 'senhorio', 'wave'], ['Ordem da Lanterna', 'ordem', 'spark'],
    ['Liga do Cobre', 'liga', 'hammer'], ['Coroa de Pico-Torto', 'coroa', 'sword'], ['Protetorado do Carvalho', 'protetorado', 'shield'], ['Principado de Âmbar', 'principado', 'star'],
  ];
  const PAL1 = ['#7a2230', '#2a4f8f', '#2f6b4a', '#6a3a8f', '#8f5a1f', '#1f6f7a', '#7f1f5a', '#4a4f58', '#a0372a', '#355f2a', '#2a3f6a', '#8a6a1a', '#5a2a6a', '#1a5f5a', '#6a2a2a', '#3a4a7a'];
  const PAL2 = ['#f2e3b0', '#ffffff', '#ffd35a', '#cfe6ff', '#ffc0a0', '#d8ffd0', '#ffd0ec', '#e6d4ff'];
  const PATS = ['plain', 'half', 'chief', 'bend', 'cross'];
  const FRONT = ['cav', 'pal', 'esp'], RANGED = ['arq', 'mag'];

  const withRng = (seed, fn) => { const old = Math.random; Math.random = G.seeded(seed); try { return fn(); } finally { Math.random = old; } };

  const buildRivals = () => {
    const out = [], n = R_DEF.length, r0s = [];
    for (let i = 0; i < n; i++) r0s.push(0.70 + 0.66 * (i / (n - 1)));
    const sh = G.seeded(0xA17A2C), perm = r0s.map((_, i) => i);
    for (let i = perm.length - 1; i > 0; i--) { const j = Math.floor(sh() * (i + 1)); const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
    for (let i = 0; i < n; i++) {
      const rng = G.seeded(G.hash('rival|' + i)), ri = (a, b) => Math.floor(a + rng() * (b - a + 1)), pk = (arr) => arr[Math.floor(rng() * arr.length)];
      const [name, type, sym] = R_DEF[i];
      const r0 = Math.round((r0s[perm[i]] + (rng() - 0.5) * 0.02) * 1000) / 1000;
      const size = rng() < 0.25 ? 3 : rng() < 0.55 ? 4 : 5, jit = [];
      for (let k = 0; k < 5; k++) jit.push(Math.round((0.94 + rng() * 0.12) * 1000) / 1000);
      const used = {}, roster = [];
      /* classes: garante um da linha de frente e (com 4+) um de longe */
      const classes = [pk(FRONT)];
      if (size >= 4) classes.push(pk(RANGED));
      while (classes.length < size) classes.push(pk(G.CLASS_IDS));
      for (let k = classes.length - 1; k > 0; k--) { const j = ri(0, k); const t = classes[k]; classes[k] = classes[j]; classes[j] = t; }
      for (let k = 0; k < size; k++) {
        const fem = rng() < 0.5, pool = fem ? NAMES_F : NAMES_M; let nm = pk(pool); while (used[nm]) nm = pk(pool); used[nm] = 1;
        const lead = k === 0;
        const rar = lead ? G.wpickR(rng, [[2, 30], [3, 45], [4, 22], [5, 3]]) : G.wpickR(rng, [[0, 20], [1, 35], [2, 30], [3, 15]]);
        const traits = []; const tp = G.TRAIT_POOL.slice(); const want = rar >= 3 ? 3 : 2;
        while (traits.length < want && tp.length) { const t = tp.splice(Math.floor(rng() * tp.length), 1)[0]; if ((t === 'corajoso' && traits.includes('medroso')) || (t === 'medroso' && traits.includes('corajoso'))) continue; traits.push(t); }
        const cls = classes[k];
        /* equipamento estimado: raridade e inscrições de cada espaço sorteadas uma vez (o nível só muda o tier) */
        const gp = {}; for (const slot of G.SLOT_IDS) { const gr = G.clamp(Math.round(rar * 0.75 + (rng() - 0.5) * 1.6), 0, 5); gp[slot] = { rar: gr, ins: withRng(G.hash('gp|' + i + '|' + k + '|' + slot), () => G.rollIns(gr, 1)) }; }
        const j2s = G.jobBranches(cls, 2), j2 = j2s.length ? pk(j2s) : null, j3s = j2 ? G.jobBranches(cls, 3, j2) : [], j3 = j3s.length ? pk(j3s) : null;
        const pet = rng() < 0.35 ? { role: pk(['fraqueza', 'vigor', 'carga', 'faro']), rar: G.clamp(Math.round(rar * 0.6 + rng()), 0, 4) } : null;
        roster.push({ name: nm, fem, cls, rar, traits, gp, j2, j3, pet, w: lead ? 1.25 : 0.9 + rng() * 0.2, look: { skin: ri(0, 4), hair: ri(0, 9), style: ri(0, 5), seed: ri(1, 99999) } });
      }
      const cnt = {}; for (const s of roster) cnt[s.cls] = (cnt[s.cls] || 0) + 1;
      const style = (cnt.cav || 0) + (cnt.pal || 0) >= 3 ? 'Muralha' : (cnt.arq || 0) + (cnt.mag || 0) >= 3 ? 'Artilharia' : (cnt.lad || 0) >= 2 ? 'Sombras' : (cnt.esp || 0) >= 2 ? 'Lâminas' : 'Equilibrado';
      const u = rng();
      out.push({
        i, id: 'riv' + i, name, type, sym, c1: PAL1[(i * 5 + Math.floor(i / 16) * 3) % PAL1.length], c2: PAL2[(i * 3 + 1) % PAL2.length], pat: PATS[(i * 3 + Math.floor(i / 5)) % PATS.length],
        r0, jit, act: Math.round((0.5 + 0.75 * (0.5 * u + 0.5 * (r0 - 0.7) / 0.66)) * 1000) / 1000, size, style, motto: MOTTOS[G.hash('motto|' + i) % MOTTOS.length],
        lead: { name: roster[0].name, title: TITLES[type][roster[0].fem ? 1 : 0] }, roster,
      });
    }
    return out;
  };
  /* sorteio ponderado com um RNG qualquer (G.wpick usa Math.random) */
  G.wpickR = (rng, pairs) => { let tot = 0; for (const p of pairs) tot += p[1]; let r = rng() * tot; for (const p of pairs) { r -= p[1]; if (r <= 0) return p[0]; } return pairs[pairs.length - 1][0]; };
  const RIVALS = (G.ARENA_RIVALS = buildRivals());
  G.arenaRival = (i) => RIVALS[i];

  /* a temporada faz os rivais crescerem: o poder relativo sobe um pouco a cada dia (limite de 140%) */
  G.arenaRatio = (i, sea) => { sea = sea || seasonOf(nowMs()); return Math.min(1.4, RIVALS[i].r0 * (1 + G.ARENA.growth * Math.floor(sea.dis))); };

  /* ================= poder de um herói e referência do jogador ================= */
  const heroPow = (st) => {
    const dps = st.atk * (1 + st.crit * (st.critDmg - 1)) / st.int;
    const ehp = st.hp * (1 + st.def / Math.max(1, st.atk)) / (1 - Math.min(0.6, st.eva));
    return Math.sqrt(dps * ehp);
  };
  G.arenaHeroPow = (h) => heroPow(G.heroStats(h));
  /* poder de referência: os 5 melhores heróis, do mais forte ao mais fraco. Cada herói rival espelha o do jogador na mesma posição. */
  G.arenaRef = () => {
    const hs = G.S.heroes.map((h) => ({ h, p: G.arenaHeroPow(h) })).sort((x, y) => y.p - x.p), top = hs.slice(0, 5);
    return { ps: top.map((x) => x.p), jt: top.map((x) => G.jobTier(x.h)), sk: top.map((x) => (x.h.sk || [1, 1, 1]).slice(0, 3)), count: hs.length };
  };

  /* realiza um rival: cria os heróis com G.makeHero (fora de S.heroes), procura o nível cujo poder bate com o alvo e acerta o resto por escala */
  const SLOT_AT = { arma: 1, armadura: 6, elmo: 12, botas: 16, luvas: 20, cinto: 26, acessorio: 32, anel: 42 };
  const tierFor = (L) => { let t = 1; while (t < 16 && G.TIER_LVL(t + 1) <= L - 2) t++; return t; };
  const setLevel = (h, sp, L, mir) => {
    h.lvl = L; h.rank = G.rankForLevel(L); h.stars = 0; h.xp = 0;
    const tier = tierFor(L), plus = Math.min(6, Math.floor(L / 16));
    for (const [slot, type] of G.heroSlots(h)) h.gear[slot] = L >= SLOT_AT[slot] ? { id: 0, type, tier, rar: sp.gp[slot].rar, plus, forSale: false, ins: sp.gp[slot].ins } : null;
    /* vocações e nível das habilidades espelham as do herói do jogador na mesma posição (a Arena não premia quem ainda não tem vocação) */
    h.j2 = mir.jt >= 2 ? sp.j2 : null; h.j3 = mir.jt >= 3 && h.j2 ? sp.j3 : null;
    h.sk = mir.sk.slice();
    h._dirty = true;
  };
  const rcache = new Map();
  /* o herói j do rival tem o poder do j-ésimo melhor herói do jogador × razão × pequena variação do rival */
  const realize = (riv, ratio, ref) => {
    const S = G.S, n = riv.size, ps = ref.ps, pj = (j) => ratio * G.ARENA.K * ps[Math.min(j, ps.length - 1)] * riv.jit[j];
    const key = riv.i + '|' + Math.round(Math.log(Math.max(1, pj(0))) * 120) + '|' + Math.round(Math.log(Math.max(1, pj(n - 1))) * 120) + '|' + ref.jt.slice(0, n).join('') + ref.sk.slice(0, n).map((x) => x[0]).join('.');
    let r = rcache.get(key); if (r) return r;
    const heroes = [];
    riv.roster.slice(0, n).forEach((sp, k) => {
      const Pk = pj(k), nid = S.nextId, mir = { jt: ref.jt[Math.min(k, ref.jt.length - 1)], sk: ref.sk[Math.min(k, ref.sk.length - 1)] };
      const h = withRng(G.hash('rv|' + riv.i + '|' + k), () => G.makeHero({ name: sp.name, cls: sp.cls, rar: sp.rar, lvl: 1, traits: sp.traits.slice(), potions: 0, weapon: false }));
      S.nextId = nid;
      h.id = -(riv.i * 10 + k + 1); h.look = sp.look; h.cos = { traje: null, asas: null, reliquia: null }; h.pet = 0; h.mount = 0; h.arts = {}; h.wake = 0;
      const ev = (L) => { setLevel(h, sp, L, mir); return heroPow(G.heroStats(h)); };
      let lo = 1, hi = 170;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (ev(mid) < Pk) lo = mid + 1; else hi = mid; }
      let L = lo; if (L > 1) { const p1 = ev(L - 1), p2 = ev(L); L = Math.abs(p1 - Pk) < Math.abs(p2 - Pk) ? L - 1 : L; }
      setLevel(h, sp, L, mir);
      const st0 = G.heroStats(h), kk = Pk / heroPow(st0);
      const st = Object.assign({}, st0, { hp: Math.max(1, Math.round(st0.hp * kk)), atk: st0.atk * kk, def: st0.def * kk });
      heroes.push({ h, st, L, P: Pk, pet: sp.pet });
    });
    /* linha de frente: os mais parrudos (vida × defesa) */
    const tank = (x) => x.st.hp * (1 + x.st.def / Math.max(1, x.st.atk));
    heroes.slice().sort((a, b) => tank(b) - tank(a)).forEach((x, k) => { x.row = k < Math.ceil(heroes.length / 2) ? 0 : 1; });
    r = { riv, heroes };
    if (rcache.size > 200) rcache.clear();
    rcache.set(key, r);
    return r;
  };
  /* o rival i para o poder do jogador agora, na razão dada (padrão: a da temporada) */
  G.arenaRealize = (i, ratio, ref) => {
    ref = ref || G.arenaRef(); ratio = ratio || G.arenaRatio(i);
    return Object.assign({ ratio }, realize(RIVALS[i], ratio, ref));
  };

  /* ================= 2A.2 o duelo ================= */
  /* habilidades de classe em forma de "operações" (as de vocação já vêm assim em G.JOBS) */
  const CLASS_OPS = {
    esp: [{ o: 'aoe', m: 1.5, r: 2.1, at: 'self' }],
    cav: [{ o: 'buff', k: 'wall', v: 0.55, d: 5 }, { o: 'taunt', d: 5 }, { o: 'hit', m: 1.1 }],
    arq: [{ o: 'hit', m: 0.9, n: 3 }],
    mag: [{ o: 'aoe', m: 2.1, r: 2.2, at: 'tgt' }],
    pal: [{ o: 'heal', pct: 0.24, r: 4 }],
    lad: [{ o: 'hit', m: 2.6, crit: 1 }],
  };
  /* "planta" imutável de um combatente, a partir dos atributos reais (G.heroStats) */
  const bpOf = (h, st, side, row, pet) => {
    const skills = [];
    G.heroSkills(h).forEach((s, i) => {
      if (!s) return;
      const ops = i === 0 ? CLASS_OPS[h.cls] : s.ops; if (!ops) return;
      const pow = i === 0 ? (1 + (h.rank >= 2 ? 0.15 : 0) + (h.rank >= 4 ? 0.2 : 0)) * G.skillPow(h, 0) : G.skillPow(h, i);
      skills.push({ n: s.name, cd: Math.max(3, s.cd * (h.rank >= 4 ? 0.8 : 1) * (1 - st.cdr)), ops, pow, sup: !!s.sup, heal: ops.every((o) => o.o === 'heal') });
    });
    return { hid: h.id, name: h.name, cls: h.cls, side, row, rank: h.rank, lvl: h.lvl, rar: h.rar, mhp: st.hp * G.ARENA.hpMul, atk: st.atk, def: st.def, crit: st.crit, cd: st.critDmg, eva: st.eva, int: st.int,
      ls: st.ls || 0, regen: st.regen || 0, thorns: st.thorns || 0, heal: st.healF || 0, ranged: G.CLASSES[h.cls].rng >= 4, skills, pet: pet || null };
  };
  const petOfHero = (h) => { const p = G.petOf(h); return p ? { role: G.PETS[p.k].role, rar: p.rar } : null; };

  /* linha de frente automática: os mais parrudos */
  const autoRows = (items) => {
    const tank = (x) => x.st.hp * (1 + x.st.def / Math.max(1, x.st.atk)), rows = {};
    items.slice().sort((a, b) => tank(b) - tank(a)).forEach((x, k) => { rows[x.h.id] = k < Math.ceil(items.length / 2) ? 0 : 1; });
    return rows;
  };
  G.arenaAutoRows = (ids) => { const its = ids.map((id) => G.S.heroes.find((h) => h.id === id)).filter(Boolean).map((h) => ({ h, st: G.heroStats(h) })); return autoRows(its); };
  /* os n melhores heróis pelo poder (de 3 a 5) */
  G.arenaAutoTeam = (n) => {
    const hs = G.S.heroes.map((h) => ({ h, p: G.arenaHeroPow(h) })).sort((a, b) => b.p - a.p).slice(0, G.clamp(n || 5, 3, 5));
    const ids = hs.map((x) => x.h.id), rows = G.arenaAutoRows(ids);
    return ids.map((id) => ({ id, r: rows[id] }));
  };
  /* equipe salva (válida: n heróis existentes, sem repetição) ou a automática de n */
  G.arenaTeam = (n) => {
    const a = G.arena(), S = G.S, seen = {}; n = G.clamp(n || 5, 3, 5);
    let t = (a.team || []).filter((x) => S.heroes.some((h) => h.id === x.id) && !seen[x.id] && (seen[x.id] = 1));
    if (t.length !== n) {
      const auto = G.arenaAutoTeam(n), keep = t.slice(0, n);
      for (const x of auto) if (keep.length < n && !keep.some((k) => k.id === x.id)) keep.push(x);
      t = keep;
    }
    return t.slice(0, n).map((x) => ({ id: x.id, r: x.r ? 1 : 0 }));
  };
  G.arenaTeamSave = (t) => { G.arena().team = t.map((x) => ({ id: x.id, r: x.r ? 1 : 0 })); };
  G.arenaMyBps = (team) => team.map((x) => { const h = G.S.heroes.find((y) => y.id === x.id); return h ? bpOf(h, G.heroStats(h), 0, x.r ? 1 : 0, petOfHero(h)) : null; }).filter(Boolean);
  G.arenaRivalBps = (rz) => rz.heroes.map((x) => bpOf(x.h, x.st, 1, x.row, x.pet));

  /* ---------- o laço do duelo (passos de 0,1 s) ---------- */
  let DT = 0.2;
  G.arenaSim = (bpA, bpB, seed, o) => {
    DT = G.ARENA.dt; const rec = !!(o && o.rec), ev = rec ? [] : null, rng = G.seeded(seed >>> 0);
    const F = [];
    for (const bp of bpA.concat(bpB)) {
      const fa = 1 + (rng() - 0.5) * G.ARENA.form[0], fh = 1 + (rng() - 0.5) * G.ARENA.form[1];
      F.push({
        id: F.length, bp, side: bp.side, row: bp.row, name: bp.name, cls: bp.cls, mhp: bp.mhp * fh, hp: bp.mhp * fh, atk: bp.atk * fa, def: bp.def, crit: bp.crit, cd: bp.cd, eva: bp.eva, int: bp.int, ls: bp.ls, regen: bp.regen, thorns: bp.thorns, heal: bp.heal, ranged: bp.ranged,
        tA: 0.25 + rng() * 0.8, sk: bp.skills.map((s) => ({ s, left: s.cd * (0.3 + rng() * 0.35) })), pet: bp.pet ? { role: bp.pet.role, rar: bp.pet.rar, left: bp.pet.role === 'fraqueza' ? 4 + rng() * 3 : 5 + rng() * 2 } : null,
        b: {}, stun: 0, taunt: 0, wall: 0, slow: null, vuln: null, weak: null, dots: [], sh: null, dmg: 0, heald: 0, kills: 0,
      });
    }
    let t = 0;
    const cnt = [0, 0]; for (const f of F) cnt[f.side]++;
    const E = (k, a, b, v, c, hp, n) => { if (ev && ev.length < 2500) ev.push({ t: Math.round(t * 100) / 100, k, a, b, v, c, hp, n }); };
    const bf = (f, k) => { const x = f.b[k]; return x && x.u > t ? x.v : 0; };
    const liveOf = (side) => { const r = []; for (const f of F) if (f.side === side && f.hp > 0) r.push(f); return r; };
    const rpick = (arr) => arr[Math.floor(rng() * arr.length)];
    const enr = () => (t > G.ARENA.enrage ? 1 + 0.05 * (t - G.ARENA.enrage) : 1);
    /* escolha de alvo: provocação, linha de frente primeiro (ladino mira o fundo; quem ataca de longe escolhe) */
    const pick = (f) => {
      const foes = liveOf(1 - f.side); if (!foes.length) return null;
      const tn = foes.filter((x) => x.taunt > t); if (tn.length && rng() < 0.75) return rpick(tn);
      const fr = foes.filter((x) => x.row === 0), bk = foes.filter((x) => x.row === 1);
      if (f.cls === 'lad' && bk.length && rng() < 0.6) return rpick(bk);
      if (f.ranged) return rpick(foes);
      return fr.length ? rpick(fr) : rpick(bk);
    };
    const grp = (f, tg, op) => {
      const foes = liveOf(1 - f.side);
      if (op.r >= 2.8) return foes;
      if (op.at === 'self') { const fr = foes.filter((x) => x.row === 0); return fr.length ? fr : foes; }
      return foes.filter((x) => x.row === tg.row);
    };
    const kill = (b, a) => { b.hp = 0; cnt[b.side]--; if (a) a.kills++; E('ko', b.id, a ? a.id : -1); };
    /* dano que já passou por todas as defesas */
    const hurt = (a, b, d, crit, kind) => {
      d = Math.max(1, Math.round(d));
      if (b.sh && b.sh.u > t && b.sh.v > 0) { const ab = Math.min(b.sh.v, d); b.sh.v -= ab; d -= ab; if (d <= 0) { E('shield', a ? a.id : -1, b.id, ab); return 0; } }
      b.hp -= d; if (a) { a.dmg += d; if (a.ls > 0 && kind !== 'thorn' && a.hp > 0) { const hv = d * a.ls; a.hp = Math.min(a.mhp, a.hp + hv); a.heald += hv; } }
      E(kind || 'hit', a ? a.id : -1, b.id, d, crit ? 1 : 0, Math.max(0, Math.round(b.hp)));
      if (b.hp <= 0) { kill(b, a); return d; }
      const th = b.thorns + bf(b, 'thorns');
      if (th > 0 && a && a.hp > 0 && kind !== 'thorn' && kind !== 'dot') hurt(b, a, Math.max(1, d * Math.min(0.6, th)), false, 'thorn');
      return d;
    };
    const strike = (a, b, m, op) => {
      op = op || {};
      if (b.hp <= 0) return 0;
      if (rng() < Math.min(0.6, b.eva + bf(b, 'eva'))) { E('miss', a.id, b.id); return 0; }
      const atk = a.atk * (1 + bf(a, 'atk')) * (a.weak && a.weak.u > t ? 1 - a.weak.f : 1);
      const crit = !!op.crit || rng() < a.crit;
      let d = atk * atk / (atk + b.def * (1 - (op.pierce || 0))) * m * (0.9 + 0.2 * rng());
      if (crit) d *= a.cd;
      if (op.exec && b.hp / b.mhp < op.exec[0]) d *= op.exec[1];
      if (b.wall > t) d *= 0.45;
      const df = bf(b, 'def'); if (df) d *= 1 - Math.min(0.6, df);
      if (b.vuln && b.vuln.u > t) d *= 1 + b.vuln.f;
      return hurt(a, b, d * enr(), crit, 'hit');
    };
    const healTo = (a, x, v) => { v = Math.min(x.mhp - x.hp, v * G.ARENA.healF); if (v <= 0) return; x.hp += v; a.heald += v; E('heal', a.id, x.id, Math.round(v), 0, Math.round(x.hp)); };
    const cast = (f, k) => {
      const s = k.s; E('skill', f.id, -1, 0, 0, 0, s.n);
      let tg = null;
      const need = () => { if (!tg || tg.hp <= 0) tg = pick(f); return tg; };
      for (const op of s.ops) {
        switch (op.o) {
          case 'hit': { const n = op.n || 1; for (let j = 0; j < n; j++) { if (!need()) break; strike(f, tg, op.m * s.pow, { crit: op.crit, pierce: op.pierce, exec: op.exec }); } break; }
          case 'multi': { for (let j = 0; j < (op.n || 1); j++) { const x = pick(f); if (!x) break; strike(f, x, op.m * s.pow); } break; }
          case 'aoe': { if (!need()) break; const g = grp(f, tg, op); for (let j = 0; j < (op.n || 1); j++) for (const x of g) if (x.hp > 0) strike(f, x, op.m * s.pow); break; }
          case 'buff': {
            const al = op.r ? liveOf(f.side) : [f];
            for (const x of al) { if (op.k === 'wall') x.wall = Math.max(x.wall, t + op.d); else if (!x.b[op.k] || x.b[op.k].v <= op.v || x.b[op.k].u <= t) x.b[op.k] = { v: op.v, u: t + op.d }; }
            E('buff', f.id, -1, 0, 0, 0, op.k === 'wall' ? 'Muralha' : op.k === 'def' ? 'Defesa' : op.k === 'atk' ? 'Ataque' : op.k === 'aspd' ? 'Velocidade' : op.k === 'eva' ? 'Esquiva' : op.k === 'thorns' ? 'Espinhos' : 'Regeneração'); break;
          }
          case 'heal': { const al = op.r ? liveOf(f.side) : [f]; for (const x of al) healTo(f, x, x.mhp * op.pct * s.pow * (1 + f.heal)); break; }
          case 'shield': { const al = op.r ? liveOf(f.side) : [f]; for (const x of al) { x.sh = { v: x.mhp * op.pct * s.pow * G.ARENA.healF, u: t + op.d }; E('buff', f.id, x.id, 0, 0, 0, 'Escudo'); } break; }
          case 'stun': { const g = op.r ? (need() ? grp(f, tg, op) : []) : (need() ? [tg] : []); for (const x of g) { x.stun = Math.max(x.stun, t + Math.min(2.5, op.d)); E('stun', f.id, x.id); } break; }
          case 'slow': { const g = op.r ? (need() ? grp(f, tg, op) : []) : (need() ? [tg] : []); for (const x of g) x.slow = { f: op.f, u: t + op.d }; break; }
          case 'vuln': { if (need()) tg.vuln = { f: op.f, u: t + op.d }; break; }
          case 'dot': { const g = op.r ? (need() ? grp(f, tg, op) : []) : (need() ? [tg] : []); for (const x of g) { if (x.dots.length >= 3) x.dots.shift(); x.dots.push({ dps: op.m * f.atk * s.pow, u: t + op.d, next: t + 1, by: f.id }); } break; }
          case 'taunt': f.taunt = t + (op.d || 5); break;
          case 'cleanse': for (const x of liveOf(f.side)) x.dots.length = 0; break;
          default: break;
        }
      }
    };
    const wounded = (f) => liveOf(f.side).some((x) => x.hp / x.mhp < 0.8);
    const act = (f) => {
      for (let i = f.sk.length - 1; i >= 0; i--) {
        const k = f.sk[i]; if (k.left > 0) continue;
        if (k.s.heal && !wounded(f)) continue;
        cast(f, k); k.left = k.s.cd; f.tA += 0.45; return;
      }
      const tg = pick(f); if (!tg) return;
      strike(f, tg, 1);
      f.tA += f.int;
    };

    let tick = 0, end = 0;
    while (t < G.ARENA.cap && !end) {
      t += DT; tick++;
      const n = F.length;
      for (let q = 0; q < n && !end; q++) {
        const f = F[(tick & 1) ? q : n - 1 - q]; if (f.hp <= 0) continue;
        /* efeitos contínuos */
        for (let d = f.dots.length - 1; d >= 0 && f.hp > 0; d--) { const o2 = f.dots[d]; if (t >= o2.next) { o2.next += 1; hurt(F[o2.by], f, o2.dps * enr(), false, 'dot'); } if (t >= o2.u) f.dots.splice(d, 1); }
        if (f.hp <= 0) continue;
        const rg = f.regen + bf(f, 'regen'); if (rg > 0 && f.hp < f.mhp) f.hp = Math.min(f.mhp, f.hp + f.mhp * rg * DT);
        if (f.pet) {
          f.pet.left -= DT;
          if (f.pet.left <= 0) {
            if (f.pet.role === 'fraqueza') { const foes = liveOf(1 - f.side); if (foes.length) { const x = rpick(foes); x.weak = { f: G.weakF({ rar: f.pet.rar }), u: t + G.WEAK_DUR }; E('pet', f.id, x.id, 0, 0, 0, 'Fraqueza'); } f.pet.left = G.WEAK_CD; }
            else if (f.pet.role === 'vigor') { healTo(f, f, f.mhp * G.vigHeal({ rar: f.pet.rar })); E('pet', f.id, f.id, 0, 0, 0, 'Vigor'); f.pet.left = G.VIG_CD; }
            else f.pet.left = 99;
          }
        }
        if (f.stun > t) continue;
        const sp = (1 + bf(f, 'aspd')) * (f.slow && f.slow.u > t ? 1 - f.slow.f : 1);
        f.tA -= DT * sp;
        for (const k of f.sk) k.left -= DT;
        if (f.tA <= 0) act(f);
        if (cnt[0] <= 0 || cnt[1] <= 0) end = 1;
      }
      if (cnt[0] <= 0 || cnt[1] <= 0) end = 1;
    }
    const a0 = liveOf(0), b0 = liveOf(1);
    const fr = (side) => { let h = 0, m = 0; for (const f of F) if (f.side === side) { h += Math.max(0, f.hp); m += f.mhp; } return h / m; };
    const win = a0.length && !b0.length ? true : b0.length && !a0.length ? false : fr(0) > fr(1);
    E('end', win ? 0 : 1);
    return { win, t: Math.round(t * 10) / 10, ev, hpA: fr(0), hpB: fr(1), F: F.map((f) => ({ id: f.id, hid: f.bp.hid, name: f.name, cls: f.cls, side: f.side, row: f.row, mhp: f.mhp, hp: Math.max(0, Math.round(f.hp)), dmg: Math.round(f.dmg), heal: Math.round(f.heald), kills: f.kills })) };
  };
  /* chance estimada de vitória (simula o mesmo confronto com outras sementes) */
  G.arenaChance = (bpA, bpB, key, n) => {
    n = n || 16; let w = 0;
    for (let j = 0; j < n; j++) if (G.arenaSim(bpA, bpB, G.hash(key + '#' + j)).win) w++;
    return w / n;
  };
  G.arenaLabel = (ch) => (ch >= 0.72 ? { t: 'Fácil', c: '#5fcf7c' } : ch >= 0.46 ? { t: 'Justo', c: '#e2b659' } : { t: 'Difícil', c: '#ee8a4a' });

  /* ================= tíquetes ================= */
  /* só avança: voltar o relógio do aparelho não devolve tíquetes */
  const tkRoll = (a) => { const d = today(); if (d > a.tk.d) a.tk = { d, n: 0, b: 0, t: 0 }; return a.tk; };
  G.arenaTickets = () => {
    const a = G.arena(), tk = tkRoll(a), max = G.ARENA.tickets, free = Math.max(0, max - tk.n);
    return { free, xt: a.xt, total: free + a.xt, max, used: tk.n, bought: tk.b, buyCost: tk.b < G.ARENA.coreCost.length ? G.ARENA.coreCost[tk.b] : 0, canBuy: tk.b < G.ARENA.coreCost.length, today: tk.t };
  };
  G.arenaBuyTicket = () => {
    const S = G.S, a = G.arena(), t = G.arenaTickets();
    if (!t.canBuy) return { ok: false, why: 'Limite de tíquetes comprados hoje' };
    if (S.nucleos < t.buyCost) return { ok: false, why: 'Faltam Núcleos' };
    S.nucleos -= t.buyCost; tkRoll(a).b++; a.xt++;
    G.emit('arena', { t: 'ticket' });
    return { ok: true, cost: t.buyCost };
  };

  /* ================= pontos, ligas e ranking ================= */
  G.arenaLeague = (pts) => { let k = 0; for (let i = 0; i < G.ARENA_LEAGUES.length; i++) if (pts >= G.ARENA_LEAGUES[i].min) k = i; return k; };
  /* pontos e Insígnias de uma vitória crescem com a dificuldade (1 − chance de vencer) */
  G.arenaWinPts = (ch) => Math.round(14 + 30 * Math.pow(1 - G.clamp(ch, 0.05, 0.95), 1.2));
  G.arenaLossPts = 4;
  G.arenaWinIns = (ch) => Math.round(3 + 3 * (1 - G.clamp(ch, 0, 1)));
  const H01 = (s) => G.hash(s) / 4294967296;
  const rivDay = (i, sea, d) => Math.round(G.ARENA.pday * RIVALS[i].act * (0.55 + 0.9 * H01('rd|' + i + '|' + sea + '|' + d)));
  /* pontos de um rival na semana sea, dis dias depois da segunda (fracionário; 7 = semana toda) */
  G.arenaRivalPts = (i, sea, dis) => {
    let s = 0, d = 0;
    for (; d + 1 <= dis && d < 7; d++) s += rivDay(i, sea, d);
    if (d < 7 && dis > d) s += rivDay(i, sea, d) * (dis - d);
    return Math.round(s);
  };
  /* tabela completa (40 rivais e o jogador). me = posição do jogador */
  G.arenaStanding = (sea, pts) => {
    sea = sea || seasonOf(nowMs()); const a = G.arena();
    const list = RIVALS.map((r) => ({ i: r.i, pts: G.arenaRivalPts(r.i, sea.idx, sea.dis) }));
    const me = { i: -1, pts: pts == null ? a.pts : pts }; list.push(me);
    list.sort((x, y) => y.pts - x.pts || (x.i === -1 ? -1 : y.i === -1 ? 1 : x.i - y.i));
    list.forEach((x, k) => { x.pos = k + 1; });
    return { list, me: me.pos, sea };
  };

  /* ================= adversários do momento ================= */
  const offerKey = () => { const a = G.arena(), tk = tkRoll(a), sea = seasonOf(nowMs()); return sea.idx + '|' + tk.d + '|' + tk.t + '|' + Math.floor(sea.dis); };
  /* ajusta a razão de poder do rival i (70% a 140%) até a melhor equipe automática ter a chance-alvo contra ele. Como a composição
     (curandeiros, magos, linha de frente) pesa tanto quanto o poder, é a simulação que diz quanto cada rival vale hoje. */
  const calibrate = (i, ref, tg) => {
    const riv = RIVALS[i], mine = G.arenaMyBps(G.arenaAutoTeam(riv.size)), key = 'cb|' + i + '|' + Math.round(Math.log(ref.ps[0]) * 50);
    const at = (r) => G.arenaChance(mine, G.arenaRivalBps(G.arenaRealize(i, r, ref)), key, 8);
    let lo = 0.70, hi = 1.40, cl = at(lo), ch = at(hi);
    if (cl <= tg) return { ratio: lo, ch: cl };
    if (ch >= tg) return { ratio: hi, ch };
    let best = { ratio: (lo + hi) / 2, ch: -9 };
    for (let k = 0; k < 4; k++) {
      const mid = (lo + hi) / 2, c = at(mid);
      if (Math.abs(c - tg) <= Math.abs(best.ch - tg)) best = { ratio: mid, ch: c };
      if (c >= tg) lo = mid; else hi = mid;
    }
    return best;
  };
  /* três rivais, do mais fácil ao mais difícil (chances-alvo 82%, 62% e 38%), estáveis até o próximo duelo */
  /* v24 (2C.6): o cálculo (60–190 ms) é feito em três passos, um rival por passo, para a interface poder espalhá-lo em tarefas curtas
     (UI.arenaWarm) em vez de travar um quadro. G.arenaOffers() continua síncrona (simulador, janela de equipe) e dá o mesmo resultado. */
  let offWork = null;
  G.arenaOffersReady = () => { const a = G.arena(); return !!a.off && a.off.k === offerKey(); };
  G.arenaOffersStep = () => {
    const a = G.arena(), k = offerKey();
    if (a.off && a.off.k === k) return true;
    if (!offWork || offWork.k !== k) {
      const ref = G.arenaRef(), sea = seasonOf(nowMs()), rng = G.seeded(G.hash('off|' + k));
      const pool = RIVALS.filter((r) => r.size <= ref.count).map((r) => ({ r, d: Math.abs(G.arenaRatio(r.i, sea) - 0.98) + rng() * 0.25 })).sort((x, y) => x.d - y.d).slice(0, 9).sort(() => rng() - 0.5);
      offWork = { k, ref, pool, out: [], q: 0 };
    }
    const w = offWork, tg = [0.82, 0.62, 0.38][w.q], c = w.pool[w.q];
    if (c) {
      const r = calibrate(c.r.i, w.ref, tg), ratio = Math.round(r.ratio * 1000) / 1000;
      /* a chance mostrada vem de uma simulação maior, a mesma que a janela de equipe usa para a equipe automática */
      const pv = G.arenaPreview(c.r.i, G.arenaAutoTeam(c.r.size), ratio);
      w.out.push({ i: c.r.i, ratio, ch: Math.round(pv.chance * 100) / 100 });
    }
    if (++w.q < 3) return false;
    w.out.sort((x, y) => y.ch - x.ch);
    a.off = { k, l: w.out }; offWork = null;
    return true;
  };
  G.arenaOffers = () => {
    let n = 0; while (!G.arenaOffersStep() && ++n < 8);
    const a = G.arena();
    return a.off.l.map((x) => ({ i: x.i, ch: x.ch, ratio: x.ratio, label: G.arenaLabel(x.ch), pts: G.arenaWinPts(x.ch), ins: G.arenaWinIns(x.ch) }));
  };
  /* tudo o que a tela precisa para uma equipe contra o rival i: realização, chance (com esta equipe) e rótulo */
  G.arenaPreview = (i, team, ratio) => {
    const ref = G.arenaRef(); ratio = ratio || G.arenaRatio(i); const rz = G.arenaRealize(i, ratio, ref);
    const mine = G.arenaMyBps(team), ch = G.arenaChance(mine, G.arenaRivalBps(rz), 'pv|' + i + '|' + team.map((x) => x.id + ':' + x.r).join(','), 16);
    return { i, riv: RIVALS[i], ratio, rz, chance: ch, label: G.arenaLabel(ch) };
  };

  /* ================= o duelo valendo ================= */
  /* o.off = qual dos três (0..2); o.ids = os heróis (tantos quanto o rival envia); o.rows = { id: 0|1 }; o.rec = guardar os eventos para a animação.
     Gasta um tíquete, simula, aplica pontos, Insígnias e sequência, e avisa o jogo (evento 'duelo'). Devolve o resultado ou { err }. */
  G.arenaDuel = (o) => {
    const S = G.S, a = G.arena(); if (!G.arenaOpen()) return { err: 'A Arena ainda está fechada.' };
    const tk = G.arenaTickets(); if (tk.total < 1) return { err: 'Sem tíquetes.' };
    const offers = G.arenaOffers(), of = offers[o.off == null ? 1 : o.off]; if (!of) return { err: 'Adversário inválido.' };
    const ri = of.i, riv = RIVALS[ri];
    const ids = (o.ids || []).filter((id, k, arr) => arr.indexOf(id) === k && S.heroes.some((h) => h.id === id));
    if (ids.length !== riv.size) return { err: riv.name + ' envia ' + riv.size + ' heróis: escolha ' + riv.size + '.' };
    const auto = G.arenaAutoRows(ids), team = ids.map((id) => ({ id, r: o.rows && o.rows[id] != null ? (o.rows[id] ? 1 : 0) : auto[id] }));
    const ref = G.arenaRef(), ratio = of.ratio, rz = G.arenaRealize(ri, ratio, ref);
    const seed = G.hash('duel|' + a.sn + '|' + a.sea + '|' + a.duels + '|' + ri + '|' + ids.join(','));
    const sim = G.arenaSim(G.arenaMyBps(team), G.arenaRivalBps(rz), seed, { rec: !!o.rec });
    /* gasta o tíquete grátis do dia; só então os extras guardados */
    const t2 = tkRoll(a); if (t2.n < G.ARENA.tickets) t2.n++; else a.xt--;
    t2.t++;
    const before = G.arenaStanding().me, win = sim.win;
    a.duels++; a.streak = win ? a.streak + 1 : 0; a.best = Math.max(a.best, a.streak);
    const pts = win ? of.pts + Math.min(5, a.streak - 1) * 2 : G.arenaLossPts, ins = win ? of.ins : 1;
    a.pts += pts; a.ins += ins; if (win) { a.wins++; a.sw++; } else { a.losses++; a.sl++; }
    S.stats.duels = (S.stats.duels || 0) + 1; if (win) S.stats.duelWins = (S.stats.duelWins || 0) + 1;
    const after = G.arenaStanding().me;
    const mine = sim.F.filter((f) => f.side === 0).sort((x, y) => y.dmg - x.dmg)[0];
    a.team = team; a.off = null;
    const res = { win, ids, team, rival: { i: ri, name: riv.name, ratio, size: rz.heroes.length, ch: of.ch, label: of.label.t }, rz, pts, ins, streak: a.streak, rank0: before, rank1: after, mvp: mine ? { name: mine.name, dmg: mine.dmg, cls: mine.cls } : null, sim, ev: sim.ev, t: sim.t, seed };
    a.last = { win, rival: riv.name, pts, ins, streak: a.streak, at: nowMs() };
    G.log('Arena das Duas Luas: ' + (win ? 'vitória' : 'derrota') + ' diante de ' + riv.name + ' (+' + pts + ' pontos, +' + ins + (ins > 1 ? ' Insígnias' : ' Insígnia') + ').', win ? 'good' : 'info');
    G.emit('duelo', { win, ids, rival: res.rival, pts, streak: a.streak, ins, mvp: res.mvp, t: sim.t });
    G.emit('arena', { t: 'duel', res });
    return res;
  };

  /* ================= fim de temporada ================= */
  const matBox = (mult) => {
    const zs = G.ZONES.filter(G.zoneUnlocked), z = G.wpick(zs.map((x, i) => [x, i + 1])), zm = G.ZMATS[z.n];
    const base = (6 + G.S.realm.lvl) * mult * G.rnd(0.9, 1.1), o = {};
    o[zm.a] = Math.max(2, Math.round(base)); o[zm.b] = Math.max(1, Math.round(base * 0.7));
    return o;
  };
  G.arenaChestOf = (lg, pos) => {
    const L = G.ARENA_LEAGUES[lg], R = G.S.realm.lvl, pm = G.PM(G.avgHeroLvl());
    const ins = L.ins + (pos === 1 ? 25 : pos === 2 ? 15 : pos === 3 ? 10 : 0);
    return { selos: L.selos, nucleos: L.nuc, ins, gold: Math.round((60 + 40 * lg) * pm * (1 + 0.04 * R)), res: { po_reforja: L.po + Math.floor(R / 6) } };
  };
  G.ARENA_TITLES = { diamante: 'Campeão de Diamante', lenda: 'Lenda das Duas Luas' };
  /* fecha a temporada guardada (a.sea) e abre a de agora. Os prêmios saem na hora; a cerimônia (S.arena.pend) é só para mostrar. */
  const closeSeason = (a, sea) => {
    const S = G.S, old = a.sea;
    if (a.sw + a.sl > 0) {
      const st = G.arenaStanding({ idx: old, dis: 7 }, a.pts), lg = G.arenaLeague(a.pts), pos = st.me, chest = G.arenaChestOf(lg, pos);
      a.sn++;
      a.ins += chest.ins; S.selos += chest.selos; S.nucleos += chest.nucleos; if (chest.gold) { S.gold += chest.gold; S.stats.goldIn += chest.gold; } G.addRes('po_reforja', chest.res.po_reforja);
      let titulo = null; const L = G.ARENA_LEAGUES[lg];
      if (G.ARENA_TITLES[L.id]) {
        titulo = a.titulos.find((x) => x.id === 'arena_' + L.id);
        if (!titulo) { titulo = { id: 'arena_' + L.id, name: G.ARENA_TITLES[L.id], liga: lg, sea: old, n: 0 }; a.titulos.push(titulo); }
        titulo.n++; titulo.sea = old;
      }
      const rec = { sea: old, n: a.sn, name: G.ARENA_SEA_NAMES[old % G.ARENA_SEA_NAMES.length], pts: a.pts, liga: lg, pos, w: a.sw, l: a.sl, chest, titulo: titulo ? titulo.name : null };
      a.hist.push(rec); if (a.hist.length > 8) a.hist.shift();
      a.pend = rec;
      G.log('Temporada da Arena encerrada: Liga ' + L.name + ', ' + pos + 'º lugar. O baú chegou.', 'epic');
      G.emit('arena', { t: 'season', rec });
    }
    a.sea = sea.idx; a.pts = 0; a.sw = 0; a.sl = 0; a.off = null;
  };
  /* chamado a cada poucos segundos de jogo, ao carregar e ao abrir a Arena */
  G.arenaSync = () => {
    const S = G.S; if (!S) return false;
    const a = G.arena();
    if (!a.open) {
      if (!G.arenaOpen()) return false;
      a.open = 1; a.sea = seasonOf(nowMs()).idx;
      G.log('A Arena das Duas Luas abriu suas portas! Missões › Arena.', 'epic'); G.emit('arena', { t: 'open' });
    }
    const sea = seasonOf(nowMs());
    if (sea.idx > a.sea) closeSeason(a, sea);
    if (sea.dn > a.rd.d) a.rd = { d: sea.dn, p: G.arenaStanding(sea).me };       // posição de hoje cedo, para "subiu N posições hoje"
    return true;
  };

  /* ================= 2A.4 Loja de Insígnias (estoque semanal) e fileira de moedas ================= */
  G.ARENA_SHOP = [
    { id: 'traje', name: 'Armadura do Gladiador Lunar', cost: 220, stock: 1, icon: 'shirt', cos: 't_arena', desc: 'Traje exclusivo da Arena: aço índigo, capa rubra e brilho das duas luas. Bônus de ataque, defesa e crítico.' },
    { id: 'asas', name: 'Asas das Duas Luas', cost: 260, stock: 1, icon: 'wing', cos: 'a_arena', desc: 'Asas exclusivas: uma lua pálida e uma violeta, uma em cada asa. Bônus de velocidade, esquiva e ataque.' },
    { id: 'ovo', name: 'Ovo Lunar', cost: 110, stock: 1, icon: 'paw', desc: 'Um ovo Épico (às vezes Lendário) de espécie surpresa. Choca no Viveiro na hora.' },
    { id: 'contrato', name: 'Contrato Épico', cost: 140, stock: 1, icon: 'scroll', desc: 'Três candidatos Épicos: você escolhe quem veste a farda de Aurora. Precisa de cama livre na Hospedaria.' },
    { id: 'po', name: 'Pó de Reforja ×10', cost: 30, stock: 3, icon: 'hammer', res: { po_reforja: 10 }, desc: 'Para reforjar as inscrições das peças.' },
    { id: 'tomo', name: 'Tomos de Técnica ×3', cost: 36, stock: 3, icon: 'book', res: { tomo: 3 }, desc: 'Sobem o nível das habilidades e pagam mudanças de classe.' },
  ];
  G.arenaShopState = () => { const a = G.arena(), w = seasonOf(nowMs()).idx; if (w > a.shop.w) a.shop = { w, b: {} }; return a.shop; };
  G.arenaShopLeft = (it) => it.stock - (G.arenaShopState().b[it.id] || 0);
  G.arenaShopBuy = (id) => {
    const a = G.arena(), it = G.ARENA_SHOP.find((x) => x.id === id), S = G.S; if (!it) return { ok: false, why: 'Item inexistente' };
    if (G.arenaShopLeft(it) < 1) return { ok: false, why: 'Esgotado nesta semana' };
    if (a.ins < it.cost) return { ok: false, why: 'Faltam Insígnias' };
    if (id === 'contrato' && S.heroes.length >= G.heroCap() && !a.ctr) { /* pode comprar: o contrato espera cama livre */ }
    a.ins -= it.cost; G.arenaShopState().b[id] = (G.arenaShopState().b[id] || 0) + 1;
    let msg = it.name;
    if (it.cos) { G.cosGrant(it.cos); }
    else if (id === 'ovo') { const rar = Math.random() < 0.85 ? 3 : 4; G.petHatch(G.petRoll(null, rar), rar, 'Arena'); }
    else if (id === 'contrato') { a.ctr++; }
    else if (it.res) { for (const k in it.res) G.addRes(k, it.res[k]); }
    G.log('Loja da Arena: ' + msg + '.', 'good'); G.sfx('buy'); G.emit('arena', { t: 'shop', id });
    return { ok: true, it };
  };
  /* contrato Épico: 3 candidatos guardados (reabrir mostra os mesmos); escolher um contrata de graça */
  G.arenaContractRoll = () => {
    const a = G.arena(); if (a.ctrC) return a.ctrC;
    const c = G.rollCandidates('nucleo');
    for (const x of c) { if (x.rar < 3) { x.rar = 3; x.traits = G.rollTraits(3); } }
    a.ctrC = c; return c;
  };
  G.arenaContractHire = (i) => {
    const a = G.arena(), c = a.ctrC && a.ctrC[i]; if (!c || !(a.ctr > 0)) return null;
    if (G.S.heroes.length >= G.heroCap()) return null;
    const h = G.hire(c); if (!h) return null;
    a.ctr--; a.ctrC = null; return h;
  };

  /* fileira de moedas: o preço acompanha o progresso (nível médio dos heróis e do reino) e cada compra do dia encarece a seguinte */
  G.arenaCoinUnit = () => Math.round(60 * G.PM(G.avgHeroLvl()) * (1 + 0.06 * G.S.realm.lvl));
  G.ARENA_COIN = [
    { id: 'bau', name: 'Baú de materiais', u: 4, grow: 1.25, icon: 'bag', desc: 'Materiais das zonas abertas, direto para o Armazém.' },
    { id: 'po', name: 'Saco de Pó de Reforja', u: 8, grow: 1.3, icon: 'hammer', desc: 'Dez pós para a reforja. O preço sobe a cada compra do dia.' },
    { id: 'tiq', name: 'Tíquete extra', u: 6, grow: 1.5, max: 5, icon: 'scroll', desc: 'Mais um duelo hoje, sem gastar Núcleos.' },
    { id: 'bandeira', name: 'Bandeira da Arena', u: 12, grow: 1, max: 1, icon: 'flag', desc: '+30% de moedas dos abates por 3 dias de Aurora (15 minutos de jogo).' },
  ];
  G.arenaCoinState = () => { const a = G.arena(), d = today(); if (d > a.cs.d) a.cs = { d, b: {} }; return a.cs; };
  G.arenaCoinPrice = (it) => Math.round(G.arenaCoinUnit() * it.u * Math.pow(it.grow, G.arenaCoinState().b[it.id] || 0));
  G.arenaCoinBuy = (id) => {
    const S = G.S, a = G.arena(), it = G.ARENA_COIN.find((x) => x.id === id), cs = G.arenaCoinState(); if (!it) return { ok: false, why: 'Item inexistente' };
    const n = cs.b[id] || 0; if (it.max && n >= it.max) return { ok: false, why: it.max === 1 ? 'Só uma por dia' : 'Limite de hoje' };
    if (id === 'bandeira' && a.flag > S.t) return { ok: false, why: 'A Bandeira ainda está hasteada' };
    const price = G.arenaCoinPrice(it); if (S.gold < price) return { ok: false, why: 'Faltam moedas' };
    G.spend(price, 'arena'); cs.b[id] = n + 1;
    let got = it.name;
    if (id === 'bau') { const r = matBox(3); for (const k in r) G.addRes(k, r[k]); got = G.prizeText({ res: r }); }
    else if (id === 'po') G.addRes('po_reforja', 10);
    else if (id === 'tiq') { a.xt++; }
    else if (id === 'bandeira') { a.flag = S.t + G.DAY_SEC * 3; }
    G.log('Arena (moedas): ' + it.name + ' por ' + G.fmt(price) + ' moedas.', 'info'); G.sfx('buy'); G.emit('arena', { t: 'coin', id });
    return { ok: true, it, price, got };
  };
  G.arenaFlagLeft = () => { const S = G.S, a = S && S.arena; return a && a.flag > S.t ? a.flag - S.t : 0; };
  const gm0 = G.goldMult;
  G.goldMult = () => gm0() * (G.arenaFlagLeft() > 0 ? 1.3 : 1);

  /* ================= cosméticos exclusivos (trajes e asas só da Loja de Insígnias) ================= */
  G.COS.t_arena = { slot: 'traje', name: 'Armadura do Gladiador Lunar', rar: 4, req: 1, cost: null, arena: 1, p: { atk: 0.06, def: 0.04, crit: 0.02 }, look: { body: '#3a3f6a', cape: '#c8473d', trim: '#bfe9ff', legs: '#23264a' }, desc: 'Aço índigo, capa rubra e o brilho das duas luas. Só se compra na Loja da Arena.' };
  G.COS.a_arena = { slot: 'asas', name: 'Asas das Duas Luas', rar: 4, req: 1, cost: null, arena: 1, p: { spd: 0.04, eva: 0.04, atk: 0.04 }, c: ['#d8c8ff', '#6a58c8', '#ffe9a0'], moon: 1, desc: 'Uma lua pálida numa asa, uma lua violeta na outra. Só se compra na Loja da Arena.' };
  G.COS_IDS = Object.keys(G.COS);
  const cc0 = G.cosCan;
  G.cosCan = (id) => (G.COS[id] && G.COS[id].arena && !G.COS[id].cost ? { ok: false, why: 'Vem da Loja da Arena (Missões › Arena)' } : cc0(id));

  /* ================= 2A.5 Jornada: "Vença um duelo na Arena" ================= */
  /* passo inserido sem mexer em G.QUESTS (S.quest.step é um índice): aparece uma vez, depois do passo 22, assim que a Arena está aberta */
  const ARENA_AT = 22;
  const qc1 = G.questCur;
  G.questCur = () => {
    const S = G.S, q = S.quest;
    if (!q.arena && q.step >= ARENA_AT && G.arenaOpen()) {
      const w = Math.min(1, S.stats.duelWins || 0), pm = G.PM(G.avgHeroLvl());
      return { t: 'Vença um duelo na Arena', h: 'Missões › Arena. Escolha de 3 a 5 heróis e um dos três adversários.', cur: w, n: 1, r: { gold: Math.round(120 * pm), selos: 2, nucleos: 2 }, done: w >= 1, idx: q.step + 1, tag: 'CAPÍTULO ESPECIAL · ARENA', arena: 1 };
    }
    return qc1();
  };
  const qcl0 = G.questClaim;
  G.questClaim = () => {
    const S = G.S, c = G.questCur();
    if (c.arena) {
      if (!c.done) return false;
      const txt = G.giveReward(c.r, 'missoes');
      G.log('Jornada: "' + c.t + '" concluída. Recompensa: ' + txt + '.', 'good');
      S.quest.arena = 1; G.gainRealm(60); G.sfx('quest'); G.emit('quest');
      return true;
    }
    return qcl0();
  };

  /* ================= ganchos do laço do jogo ================= */
  let syncT = 0;
  const tk0 = G.tick;
  G.tick = (dt) => { tk0(dt); syncT -= dt; if (syncT <= 0) { syncT = 3; G.arenaSync(); } };
  const ng1 = G.newGame; G.newGame = () => { const S = ng1(); syncT = 0; return S; };
  const al1 = G.afterLoad; G.afterLoad = () => { al1(); rcache.clear(); syncT = 0; G.arenaSync(); };
})();

;
