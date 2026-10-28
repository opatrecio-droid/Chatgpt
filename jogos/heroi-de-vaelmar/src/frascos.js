/* ===== Frascos de Mana e de Sangue em combate =====
   Texto do jogo (passivas e feitiços de frasco, lidos do vídeo 2):
   - Feitiços elementais carregam os Frascos de Mana; explorar uma fraqueza carrega mais rápido; os feitiços de dois ou mais
     elementos carregam mais rápido que os outros. Feitiços (de qualquer tipo) carregam os Frascos de Sangue.
   - A capacidade vem do Codex ("Manaflasks: +N / Bloodflasks: +N"). "Frascos de Mana III" começa a batalha com meio frasco de
     mana; "Frascos de Sangue" com meio de mana e meio de sangue; "Frascos de Sangue II" com um de mana e meio de sangue.
   - Só se libera um feitiço de frasco quando há frasco cheio. Feitiços que "dependem da carga" gastam todos os frascos cheios.
   O texto não dá números de carga, de poder por frasco nem de duração: ficam como aproximações (CARGA_*), marcadas aqui.
   Fora desta lista: Marca Alinhada / Tempestade de Marca (precisam do sistema de Marcas) e Gotejamento de Mana / Perda de
   Sangue (o jogo não tem texto para eles). */
(() => {
  const CARGA_FEITICO = .25;      /* cada feitiço elemental: um quarto de frasco (aproximação) */
  const CARGA_SANGUE = .2;        /* cada feitiço: um quinto de frasco de sangue (aproximação) */
  const MULT_FRAQUEZA = 2, MULT_MISTO = 2;
  const BONUS_EXTRA = .5;         /* Omniflask: +50% de poder por frasco adicional gasto (aproximação) */

  /* [chave, tipo de frasco, precisa de alvo] */
  const LISTA = [['s_mana-ray-flask', 'm', true], ['s_mana-surge-flask', 'm'], ['s_elemental-stormflask', 'm'], ['s_inflection-flask', 'm'], ['s_repetition-flask', 'm'],
    ['s_nature-call-flask', 'm'], ['s_omniflask', 'm', true], ['s_blood-ray-flask', 'b', true], ['s_nekromancer-flask', 'b'], ['s_banishment-flask', 'b']];
  const DEF = Object.fromEntries(LISTA.map(([k, tipo, alvo]) => [k, { tipo, alvo: !!alvo }]));
  const INFUSAO = new Set(['s_bloodflask-infusion', 's_manaflask-infusion', 's_ward-flask-infusion']);
  const ESQUELETOS = ['m_skeleton', 'm_skeleton-warrior', 'm_skeleton-rogue'], ANIMAIS = ['m_wild-wolf', 'm_bear', 'm_hawk'];
  const STATUS_TEMPESTADE = ['Frozen', 'Paralyzed', 'Rot', 'Burning'];

  /* ---------- estado ---------- */
  function novos() {
    const hab = (Catalog.byKey[CLASSES[S.cls]?.original]?.abilities || []).find(a => /^(Mana|Blood)flasks/.test(a));
    if (!hab) return null;
    const capM = passiveValue('Manaflasks'), capB = passiveValue('Bloodflasks');
    if (!capM && !capB) return null;
    let m = 0, b = 0;
    if (/^Manaflasks (III|IV)$/.test(hab)) m = .5;
    else if (hab === 'Bloodflasks') { m = .5; b = .5; }
    else if (hab === 'Bloodflasks II') { m = 1; b = .5; }
    return { capM, capB, m: Math.min(m, capM), b: Math.min(b, capB) };
  }
  const estado = () => { if (!B) return null; if (B.frascos === undefined) B.frascos = novos(); return B.frascos; };
  const cheios = (F, t) => Math.floor(F[t] + 1e-9);
  const cap = (F, t) => t === 'm' ? F.capM : F.capB;
  const carregar = (F, t, x) => { F[t] = Math.min(cap(F, t), F[t] + x); };
  const gastar = (F, t, n) => { F[t] = Math.max(0, F[t] - n); };
  window.frascosEstado = estado;

  /* feitiços liberados pela classe: os de frasco até o tier dela (como na página «Frascos de Mana») */
  function disponiveis() {
    const F = estado(); if (!F) return [];
    const t = CLASSES[S.cls].tier;
    return LISTA.filter(([k, tipo]) => cap(F, tipo === 'm' ? 'm' : 'b') > 0 && (Catalog.byKey[k]?.tier || 99) <= t && SKILLS[k]);
  }
  window.Frascos = { ativos: () => disponiveis().length > 0, escolher: null, resumo: null };

  /* ---------- carga ---------- */
  const elementosDoFeitico = row => (window.elementosDe ? window.elementosDe({ catalogKey: row.key }) : []).filter(e => e !== 'fis');
  const hitBase = hitTarget;
  hitTarget = async (a, t, o = {}) => {
    const r = await hitBase(a, t, o);
    if (a && a.hero && B && B.cast) { B.cast.golpes++; if (r && r.note === 'Fraqueza') B.cast.fraco = true; }
    return r;
  };
  const performBase = performSkill;
  performSkill = async (actor, s, target, opt = {}) => {
    if (!actor || !actor.hero || !B || opt.frasco) return performBase(actor, s, target, opt);
    if (s && INFUSAO.has(s.original)) return infusao(actor, s);
    B.cast = { golpes: 0, fraco: false };
    const r = await performBase(actor, s, target, opt), c = B.cast; B.cast = null;
    const F = estado(), row = s && s.row;
    if (F && r !== 'retry' && c.golpes > 0 && row && row.type !== 'fis') {
      const els = elementosDoFeitico(row), alvo = target && target.hp > 0 ? target : null;
      if (F.capM && els.length) carregar(F, 'm', CARGA_FEITICO * (c.fraco ? MULT_FRAQUEZA : 1) * (els.length > 1 ? MULT_MISTO : 1));
      if (F.capB) carregar(F, 'b', CARGA_SANGUE);
      B.ultimo = { id: s.original, tid: alvo ? alvo.id : null };
    }
    return r;
  };
  const supportedBase = supportedSkill;
  supportedSkill = s => !!(s && INFUSAO.has(s.original)) || supportedBase(s);

  /* ---------- infusões (habilidades comuns de classe, 120 de mana) ---------- */
  function infusao(h, s) {
    const F = estado();
    if (!F) { say('Você não tem Frascos.'); return 'retry'; }
    if (h.mp < s.mp) { say('Mana insuficiente.'); return 'retry'; }
    h.mp -= s.mp; say(h.n + ' usou ' + s.n + '!');
    if (s.original === 's_bloodflask-infusion') { F.capB += F.capM; F.b = Math.min(F.capB, F.b + F.m); F.capM = 0; F.m = 0; say('Os Frascos de Mana viraram Frascos de Sangue.', 'good'); }
    else if (s.original === 's_manaflask-infusion') { F.capM += F.capB; F.m = Math.min(F.capM, F.m + F.b); F.capB = 0; F.b = 0; say('Os Frascos de Sangue viraram Frascos de Mana.', 'good'); }
    else {
      const total = (h.ward || 0) / Math.max(1, h.maxWard || h.maxhp) * (F.capM + F.capB);
      let sobra = total; for (const t of ['m', 'b']) { const x = Math.min(sobra, cap(F, t) - F[t]); F[t] += x; sobra -= x; }
      h.ward = 0; say('A Guarda carregou os Frascos.', 'good');
    }
    renderParty(); return undefined;
  }

  /* ---------- menu ---------- */
  const num = x => (Math.round(x * 10) / 10).toString().replace('.', ',');
  window.Frascos.resumo = () => {
    const F = estado(); if (!F) return '';
    return (F.capM ? 'Mana ' + num(F.m) + '/' + F.capM : '') + (F.capM && F.capB ? ' · ' : '') + (F.capB ? 'Sangue ' + num(F.b) + '/' + F.capB : '');
  };
  window.Frascos.escolher = async () => {
    const F = estado(), lista = disponiveis();
    const itens = lista.map(([k, tipo]) => {
      const n = cheios(F, tipo), s = SKILLS[k];
      return { v: k, l: s.n, ic: skIcon(k, 22), s: n ? (n + (n > 1 ? ' cheios' : ' cheio')) : 'sem frasco cheio', dis: n < 1 };
    }).concat([{ v: 'back', l: 'Voltar' }]);
    const k = await choose(itens, 'list');
    if (k === 'back') return null;
    let t = null;
    if (DEF[k].alvo) { t = await pickTarget(); if (!t) return null; }
    return { k: 'flask', id: k, t };
  };

  /* ---------- efeitos ---------- */
  const vivos = () => B.foes.filter(f => f.hp > 0);
  const forcar = (alvo, nome, turnos = -1) => { Rules.init(alvo); const d = Rules.effectDef(nome); alvo.effects[d.id] = { name: nome, remaining: turnos, age: 0, fresh: true }; };
  function invocar(chaves, n) {
    let ok = 0; for (let i = 0; i < n; i++) { if (!summonActor({ summons: chaves.map(key => ({ key })) }, B.hero)) break; ok++; }
    return ok;
  }
  async function raio(h, k, a, copia) {
    const alvo = a.t && a.t.hp > 0 ? a.t : vivos()[0], res = alvo.res;
    if (k !== 's_omniflask') alvo.res = Math.round(res * .5);    /* os raios "perfuram a Resistência" */
    try { await performBase(h, Object.assign({}, SKILLS[k], { neverMiss: true }, copia || {}), alvo, { free: true, frasco: true }); }
    finally { alvo.res = res; }
  }
  const doBase = doHeroAct;
  doHeroAct = async a => {
    if (!a || a.k !== 'flask') return doBase(a);
    const F = estado(), h = B.hero, k = a.id, def = DEF[k], s = SKILLS[k], tipo = def.tipo;
    if (!F || cheios(F, tipo) < 1) { say('Sem Frasco cheio.'); return 'retry'; }
    const inimigos = vivos(), n = cheios(F, tipo);
    if (k === 's_mana-ray-flask' || k === 's_blood-ray-flask') { gastar(F, tipo, 1); await raio(h, k, a); }
    else if (k === 's_mana-surge-flask') {
      gastar(F, tipo, n); say(h.n + ' usou ' + s.n + '!');
      await performBase(h, Object.assign({}, s, { all: true, powerRange: [s.powerRange[0] * n], pow: s.powerRange[0] * n / 1000 }), inimigos[0], { free: true, frasco: true });
      if (inimigos.length > 1) B.extraTurn = true;
    } else if (k === 's_elemental-stormflask') {
      gastar(F, tipo, n); say(h.n + ' usou ' + s.n + '!');
      for (const alvo of inimigos.slice().sort(() => Math.random() - .5).slice(0, n)) { const st = pick(STATUS_TEMPESTADE); forcar(alvo, st); say(alvo.n + ': ' + Rules.effectDef(st).name + '!'); }
    } else if (k === 's_inflection-flask') {
      gastar(F, tipo, n); say(h.n + ' usou ' + s.n + '!');
      for (const nome of ['T. Def ↑', 'T. Res ↑']) forcar(h, nome, 1 + n);
      say(h.n + ': Defesa e Resistência em alta por ' + (1 + n) + ' turnos.', 'good');
    } else if (k === 's_repetition-flask') {
      const u = B.ultimo, alvo = u && B.foes.find(f => f.id === u.tid && f.hp > 0) || inimigos[0];
      if (!u || !SKILLS[u.id]) { say('Nenhum feitiço para repetir.'); return 'retry'; }
      gastar(F, tipo, 1); say(h.n + ' usou ' + s.n + '!');
      await performBase(h, SKILLS[u.id], alvo, { free: true, complete: true, frasco: true });
    } else if (k === 's_nature-call-flask') {
      if (B.summons.filter(f => f.hp > 0).length >= 5) { say('Não há espaço para outra invocação.'); return 'retry'; }
      gastar(F, tipo, 1); say(h.n + ' usou ' + s.n + '!'); invocar(ANIMAIS, 2);
    } else if (k === 's_omniflask') {
      let extra = 0; gastar(F, 'm', 1);
      if (cheios(F, 'm') >= 1) { gastar(F, 'm', 1); extra++; }
      if (F.capB && cheios(F, 'b') >= 1) { gastar(F, 'b', 1); extra++; }
      const pot = 2500 * (1 + BONUS_EXTRA * extra);
      await raio(h, k, a, { powerRange: [pot], pow: pot / 1000, neverMiss: false });
    } else if (k === 's_nekromancer-flask') {
      if (B.summons.filter(f => f.hp > 0).length >= 5) { say('Não há espaço para outra invocação.'); return 'retry'; }
      gastar(F, tipo, n); say(h.n + ' usou ' + s.n + '!'); invocar(ESQUELETOS, n);
    } else if (k === 's_banishment-flask') {
      const invocados = inimigos.filter(f => f.enemySummon);
      if (!invocados.length) { say('Não há invocações para banir.'); return 'retry'; }
      gastar(F, tipo, n); say(h.n + ' usou ' + s.n + '!');
      for (const f of invocados.slice(0, n)) { f.hp = 0; f.alpha = 0; say(f.n + ' foi banido.'); }
    }
    renderParty();
  };

  /* ---------- medidor sob a barra de mana do herói ---------- */
  const desenhoBase = drawBattle;
  drawBattle = function (now) {
    desenhoBase(now);
    const F = B && B.frascos; if (!F || !BS.u || B.hero.alpha <= 0) return;
    const g = gB, u = BS.u, f = B.hero, bw = 34 * u, bh = 4.6 * u;
    const bx = Math.round((f.x + f.ox) * u - bw / 2), y = Math.round(f.y * u + 3.2 * u + 2 * (bh + 1.8 * u)) + 1.2 * u;
    const w = 5 * u, h = 5.6 * u, gap = 1.4 * u;
    let i = 0;
    for (const [t, c1, c2] of [['m', '#7fb0ff', '#3158c8'], ['b', '#ff7a6a', '#a3201a']]) {
      for (let j = 0; j < cap(F, t); j++, i++) {
        const x = bx + i * (w + gap), fr = Math.max(0, Math.min(1, F[t] - j));
        g.fillStyle = '#1b1212'; g.fillRect(x - .5 * u, y - .5 * u, w + u, h + u);
        g.fillStyle = '#2b0e0e'; g.fillRect(x, y, w, h);
        if (fr > 0) { const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(x, y + h * (1 - fr), w, h * fr); }
        g.strokeStyle = fr >= 1 ? '#ffe9a6' : '#d9d2c6'; g.lineWidth = Math.max(1, u * .4); g.strokeRect(x - .4 * u, y - .4 * u, w + .8 * u, h + .8 * u);
      }
    }
  };

  /* ---------- salvar e retomar a batalha ---------- */
  const captureBase = BattleState.capture, restoreBase = BattleState.restore;
  BattleState.capture = b => { const r = captureBase(b); if (b.frascos) r.frascos = JSON.parse(JSON.stringify(b.frascos)); return r; };
  BattleState.restore = (b, r) => { restoreBase(b, r); if (r.frascos) b.frascos = r.frascos; };

  /* ---------- turno extra: frascos de captura múltipla e Avidez ---------- */
  const doAvidez = doHeroAct;
  doHeroAct = async a => {
    const r = await doAvidez(a);
    if (r !== 'retry' && r !== 'flee' && a && a.k !== 'flask' && Math.random() < passiveValue('Avidity Chance') / 100) B.extraTurn = true;
    return r;
  };
})();
