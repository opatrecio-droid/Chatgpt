/* 3C-colosso: v25 — Colosso da Semana. Em cada semana ISO real (relógio do aparelho, o mesmo da Arena) um Colosso desperta na
   Cratera de sexta 00:00 a domingo 23:59, com aviso desde quinta. A vida é enorme e fica guardada em S.colosso (sobrevive a
   sessões e dias). Os heróis que estão aptos vão lutar (uma fração, ou todos se o jogador convocar), os 40 reinos rivais da Arena
   batem no Colosso de forma determinística, e o dano total da semana vira ranking, marcos pessoais, baú e relíquia exclusiva.
   Só simulação, sem DOM: as telas e a arte ficam em 68-ui-colosso.js. Estado em S.colosso (inicialização preguiçosa). */
'use strict';
(function () {
  const Wd = G.W, DAY = 86400000, dayNum = G.dayNum, clamp = G.clamp;
  /* G.hash (FNV) mexe pouco nos bits altos quando só o fim do texto muda; este acabamento espalha melhor */
  const H01 = (s) => { let h = G.hash(s); h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15; return (h >>> 0) / 4294967296; };

  /* ---------- ajustes de equilíbrio num só lugar ---------- */
  G.COLOSSO = {
    open: 6,               // Nível de Reino para o Colosso acordar
    budgetMin: 48,         // minutos de fogo de TODOS os heróis, sem pausa, para derrubá-lo (a vida é calculada na 1ª vez que o jogador o vê na semana). Medido no simulador (laboratório): com todos convocados leva ~65 min de luta; no modo Livre, ~90 min
    k: 1.0,                // ajuste fino da estimativa de dano (habilidades, críticos) — calibrado no simulador
    defK: 0.5,             // defesa do Colosso = defK × ataque médio dos 5 melhores heróis
    hitK: 0.042,           // um golpe comum (×1) tira esta fração da vida média dos 5 melhores heróis
    share: 0.5,            // fração dos heróis aptos que vai por conta própria (modo Livre)
    at: [11.5, 95.5],      // onde ele dorme na Cratera
    pay: 1.0,              // soldo: quem luta recebe XP, moedas, materiais e renome na mesma taxa do que caçaria (o tempo no Colosso não pode ser tempo perdido)
    marks: [0.08, 0.2, 0.4, 0.65, 0.85],   // marcos pessoais de dano (fração da vida)
    bonus: 0.25,           // bônus de abate rápido (fração da vida, no máximo) contado no ranking
  };
  /* três Colossos em rotação pela semana do ano */
  G.COLOSSI = [
    { id: 'casco', mon: 'col_casco', name: 'Grão-Casco', kind: 'Tartaruga de Pedra-Vulcão', pal: ['#7a5a4a', '#3e2c28', '#ff8a3a'], glow: '#ff8a3a', relic: 'r_col_casco', size: 3.6,
      moves: { stomp: 'Pisão Vulcânico', rain: 'Chuva de Brasas', quake: 'Tremor do Casco' },
      lore: 'Dorme há mil invernos sob a cinza da Cratera. Quando acorda, o casco racha em veios de lava e a terra inteira ouve.' },
    { id: 'cristal', mon: 'col_cristal', name: 'Cristalão', kind: 'Golem de Cristal da Fenda', pal: ['#b06ae8', '#5a2ac8', '#f0d0ff'], glow: '#d070ff', relic: 'r_col_cristal', size: 3.4,
      moves: { stomp: 'Punho de Cristal', rain: 'Chuva de Estilhaços', quake: 'Nova da Fenda' },
      lore: 'A própria Fenda o lapidou: um gigante de cristal violeta com um coração que pulsa no ritmo da rachadura do mundo.' },
    { id: 'nevoa', mon: 'col_nevoa', name: 'Nevoeirão', kind: 'Serpente de Névoa', pal: ['#9ab8c8', '#4a6a80', '#e8f8ff'], glow: '#bfe6ff', relic: 'r_col_nevoa', size: 3.4,
      moves: { stomp: 'Bote Gélido', rain: 'Cortina de Brumas', quake: 'Varredura da Cauda' },
      lore: 'Ninguém viu a cabeça e a cauda ao mesmo tempo. Dizem que a névoa dos pântanos é só o hálito dele, quando sonha.' },
  ];
  /* uma entrada de G.MON por Colosso: o resto do jogo (nome, dano em herói, inspetor) lê daqui; a arte é própria (68-ui-colosso) */
  for (const d of G.COLOSSI) G.MON[d.mon] = { name: d.name, fam: 'colosso', pal: d.pal, boss: 1, colosso: 1, hp: 1, atk: 1, def: 1, spd: 0, int: 2.2, rng: 4.2, size: d.size };
  /* relíquias exclusivas (uma por Colosso): não se compram */
  G.COS.r_col_casco = { slot: 'reliquia', name: 'Coração de Pedra-Vulcão', rar: 5, req: 1, cost: null, colosso: 'casco', p: { atk: 0.05, hp: 0.07, def: 0.05 }, c: '#ff8a3a', desc: 'Ainda quente. Pulsa uma vez por hora, como o Grão-Casco.' };
  G.COS.r_col_cristal = { slot: 'reliquia', name: 'Coração de Cristal da Fenda', rar: 5, req: 1, cost: null, colosso: 'cristal', p: { crit: 0.05, cdr: 0.06, atk: 0.05 }, c: '#d070ff', desc: 'Um caco do Cristalão. Brilha mais forte perto da Fenda.' };
  G.COS.r_col_nevoa = { slot: 'reliquia', name: 'Escama de Névoa', rar: 5, req: 1, cost: null, colosso: 'nevoa', p: { eva: 0.06, spd: 0.05, hp: 0.05 }, c: '#bfe6ff', desc: 'Fria e leve como o hálito do Nevoeirão.' };
  G.COS_IDS = Object.keys(G.COS);
  const cc0 = G.cosCan;
  G.cosCan = (id) => (G.COS[id] && G.COS[id].colosso ? { ok: false, why: 'Vem do Colosso da Semana (Missões › Colosso)' } : cc0(id));

  /* ================= estado ================= */
  const defaults = () => ({
    v: 1, wk: 0, id: 0, hpMax: 0, hp: 0, lvl: 0, dmg: 0, bonus: 0, mk: 0, win: 0, fl: 0, warned: 0, woke: 0, mode: 0,
    hero: {}, hn: {}, pend: [], hist: [], tot: { w: 0, win: 0, dmg: 0, best: 0 }, pr: { sel: 0, nuc: 0, po: 0 }, y: { x: 0, g: 0, mats: {}, r: 0, t: 0 },
  });
  G.colosso = () => {
    const S = G.S, c = S.colosso || (S.colosso = {}), d = defaults();
    for (const k in d) if (c[k] === undefined) c[k] = d[k];
    return c;
  };
  /* execução (não é salva): o monstro na Cratera, os golpes telegrafados e o relógio de ataques */
  const run = (G.colossoRun = { m: null, tele: [], tMove: 4, tStrike: 1.5, lastHp: 0, tune: 0, ck: 0, win: null, dying: null, cast: null, near: 0 });

  /* ================= semana, fases e relógio ================= */
  /* mesmo relógio da Arena (G.arenaNow); o simulador troca por um virtual. Semana de segunda a domingo: seg–qua descanso, qui aviso, sex–dom Colosso. */
  const winOf = (ms) => {
    const dn = dayNum(ms), wk = Math.floor((dn + 3) / 7), dow = (dn + 3) % 7;
    const d0 = new Date(ms); d0.setHours(0, 0, 0, 0);
    const at = (k) => { const x = new Date(d0.getTime()); x.setDate(x.getDate() + k - dow); return x.getTime(); };
    const warnAt = at(3), startAt = at(4), endAt = at(7);
    return { ms, wk, dow, idx: wk % 3, day0: d0.getTime(), phase: dow < 3 ? 'rest' : dow === 3 ? 'warn' : 'on', warnAt, startAt, endAt };
  };
  G.colossoWin = (ms) => winOf(ms == null ? G.arenaNow() : ms);
  G.colossoOpen = () => { const S = G.S; return !!S && S.realm.lvl >= G.COLOSSO.open && S.heroes.length >= 3; };

  /* ================= vida: calibrada pelo poder da equipe na primeira vez que o jogador o vê na semana ================= */
  const topHeroes = () => G.S.heroes.map((h) => ({ h, st: G.heroStats(h) })).sort((a, b) => b.st.atk * b.st.hp - a.st.atk * a.st.hp).slice(0, 5);
  const avgOf = (arr, f) => arr.reduce((s, x) => s + f(x), 0) / Math.max(1, arr.length);
  /* dano por segundo de um herói contra a defesa def do Colosso (golpes e críticos; habilidades entram em G.COLOSSO.k) */
  const heroDps = (h, def) => {
    const st = G.heroStats(h), md = G.heroMod(h), a = st.atk * md.a;
    return (a * a) / (a + def) * (1 + st.crit * (st.critDmg - 1)) * (1 + st.eliteF) / st.int;
  };
  G.colossoPower = () => {
    const tp = topHeroes(); if (!tp.length) return 0;
    const def = G.COLOSSO.defK * avgOf(tp, (x) => x.st.atk);
    let s = 0; for (const h of G.S.heroes) s += heroDps(h, def);
    return s * G.COLOSSO.k;
  };
  const calibrate = (c) => {
    c.hpMax = Math.max(1000, Math.round(G.colossoPower() * G.COLOSSO.budgetMin * 60));
    c.hp = c.hpMax; c.dmg = 0; c.mk = 0; c.win = 0; c.lvl = Math.max(1, Math.round(G.avgHeroLvl()) + 5);
  };

  /* ================= rivais: também batem no Colosso, de forma determinística ================= */
  /* força fixa de cada reino (0 = o mais fraco, 1 = o mais forte), pelo poder e pela atividade do reino rival */
  let qRank = null;
  const rivQ = () => {
    if (qRank) return qRank;
    const q = G.ARENA_RIVALS.map((r) => 0.55 * clamp((r.r0 - 0.7) / 0.66, 0, 1) + 0.45 * clamp((r.act - 0.5) / 0.75, 0, 1));
    const ord = q.map((v, i) => i).sort((a, b) => q[a] - q[b] || a - b); qRank = [];
    ord.forEach((i, k) => { qRank[i] = k / Math.max(1, ord.length - 1); });
    return qRank;
  };
  /* fração da vida do Colosso que o reino i derruba na semana wk: de ~10% (os mais fracos) a ~110% (os mais fortes o derrubam antes do fim) */
  const rivF = (i, wk) => 0.08 + 1.0 * Math.pow(clamp(rivQ()[i] * (0.82 + 0.36 * H01('cf|' + i + '|' + wk)), 0, 1.06), 1.1);
  const curve = (f) => 0.5 * f + 0.5 * f * f * (3 - 2 * f);
  /* fração do dano total de um rival já feita no instante w.ms (w = G.colossoWin) */
  const progress = (i, w) => {
    if (w.phase !== 'on') return w.phase === 'over' ? 1 : 0;
    const dd = w.dow - 4, sh = [0.26, 0.4, 0.34]; let tot = 0, cum = 0, cur = 0;
    for (let d = 0; d < 3; d++) { const v = sh[d] * (0.75 + 0.5 * H01('cw|' + i + '|' + w.wk + '|' + d)); tot += v; if (d < dd) cum += v; else if (d === dd) cur = v; }
    return (cum + cur * curve(clamp((w.ms - w.day0) / DAY, 0, 1))) / tot;
  };
  G.colossoRivalDmg = (i, wk, hpMax, w) => Math.round(rivF(i, wk) * hpMax * progress(i, w || { phase: 'over' }));
  /* tabela: os 40 reinos e o jogador. over = semana já terminada (dano final) */
  G.colossoStanding = (over) => {
    const c = G.colosso(), w = over ? { phase: 'over' } : G.colossoWin();
    const list = G.ARENA_RIVALS.map((r) => ({ i: r.i, dmg: G.colossoRivalDmg(r.i, c.wk, c.hpMax, w) }));
    const me = { i: -1, dmg: Math.round(c.dmg + (c.bonus || 0)) }; list.push(me);   // quem derruba o Colosso cedo ganha o bônus de abate
    list.sort((x, y) => y.dmg - x.dmg || (x.i === -1 ? -1 : y.i === -1 ? 1 : x.i - y.i));
    list.forEach((x, k) => { x.pos = k + 1; });
    return { list, me: me.pos, n: list.length };
  };

  /* ================= prêmios ================= */
  const pm = () => G.PM(G.avgHeroLvl());
  G.colossoMarkPrize = (i) => {
    const R = G.S.realm.lvl, po = Math.floor(R / 12);
    return [{ nucleos: 1, po_reforja: 5 + po }, { selos: 2, po_reforja: 8 + po }, { nucleos: 2, selos: 1, po_reforja: 12 + po, gold: Math.round(60 * pm()) },
      { nucleos: 3, selos: 2, po_reforja: 16 + po, tomo: 2 }, { nucleos: 4, selos: 3, po_reforja: 22 + po, alma: 2 }][i];
  };
  G.colossoChest = () => { const R = G.S.realm.lvl; return { nucleos: 8, selos: 6, po_reforja: 40 + Math.floor(R / 4), tomo: 4, alma: 4, gold: Math.round(320 * pm() * (1 + 0.04 * R)) }; };
  G.colossoRankPrize = (pos) => {
    const R = G.S.realm.lvl, po = Math.floor(R / 12);
    if (pos === 1) return { nucleos: 6, selos: 6, po_reforja: 30 + po, tomo: 2 };
    if (pos <= 3) return { nucleos: 4, selos: 4, po_reforja: 20 + po, tomo: 1 };
    if (pos <= 10) return { nucleos: 3, selos: 3, po_reforja: 14 + po };
    if (pos <= 20) return { nucleos: 2, selos: 2, po_reforja: 10 + po };
    if (pos <= 30) return { nucleos: 1, selos: 1, po_reforja: 6 + po };
    return { nucleos: 1, po_reforja: 3 };
  };
  /* entrega o prêmio (objeto com nucleos, selos, po_reforja, tomo, alma, gold) e devolve o texto */
  const give = (p) => {
    const S = G.S, c = G.colosso(), parts = [];
    if (p.nucleos) { S.nucleos += p.nucleos; c.pr.nuc += p.nucleos; parts.push(p.nucleos + ' Núcleo' + (p.nucleos > 1 ? 's' : '')); }
    if (p.selos) { S.selos += p.selos; c.pr.sel += p.selos; parts.push(p.selos + ' Selo' + (p.selos > 1 ? 's' : '')); }
    if (p.po_reforja) { G.addRes('po_reforja', p.po_reforja); c.pr.po += p.po_reforja; parts.push(p.po_reforja + ' Pó de Reforja'); }
    if (p.tomo) { G.addRes('tomo', p.tomo); parts.push(p.tomo + ' Tomo' + (p.tomo > 1 ? 's' : '') + ' de Técnica'); }
    if (p.alma) { G.addRes('alma', p.alma); parts.push(p.alma + ' Cristais de Alma'); }
    if (p.gold) { S.gold += p.gold; S.stats.goldIn += p.gold; parts.push(G.fmt(p.gold) + ' moedas'); }
    return parts.join(', ');
  };
  G.colossoMarkValue = (i) => Math.round(G.COLOSSO.marks[i] * G.colosso().hpMax);

  /* ================= o monstro na Cratera ================= */
  const live = () => { const c = G.S && G.S.colosso; return !!(c && run.m && !run.m.dead && !run.m.gone && c.hp > 0 && !c.win); };
  G.colossoLive = live;
  const spawn = (c) => {
    const d = G.COLOSSI[c.id], p = Wd.nearestWalk(G.COLOSSO.at[0], G.COLOSSO.at[1]);
    const m = G.makeMon(d.mon, c.lvl, p[0], p[1], {});
    m.hpMax = c.hpMax; m.hp = c.hp; m.size = d.size; m.colosso = 1; m.nodraw = 1; m.state = 'colosso'; m.tSlam = 1e9; m.zi = -1; m.eva = 0; m.dir = -1;
    m.until = 0; m.hx = m.x; m.hy = m.y;
    G.mons.push(m); run.m = m; run.lastHp = m.hp; run.tele.length = 0; run.tMove = 5; run.tStrike = 1.5; run.tune = 0; run.dying = null; run.cast = null;
    retune();
  };
  const despawn = () => { if (run.m) { run.m.gone = true; run.m = null; } run.tele.length = 0; };
  /* a defesa acompanha o ataque dos 5 melhores heróis e o golpe a vida média da equipe (reavaliado a cada poucos segundos) */
  const retune = () => {
    const m = run.m; if (!m) return;
    const tp = topHeroes(); if (!tp.length) return;
    m.def = G.COLOSSO.defK * avgOf(tp, (x) => x.st.atk);
    const all = G.S.heroes.map((h) => G.heroStats(h)), D = G.COLOSSO.hitK * avgOf(all, (st) => st.hp), df = avgOf(all, (st) => st.def);   // o golpe é medido pela vida média de todos (os mais fracos não caem em dois golpes)
    m.atk = (D + Math.sqrt(D * D + 4 * D * df)) / 2;
  };
  const fighters = () => { const out = [], m = run.m; if (!m) return out; for (const h of G.S.heroes) if (h.state === 'colosso' && !h.inside && Math.hypot(h.x - m.x, h.y - m.y) < 16) out.push(h); return out; };

  /* ---------- golpes telegrafados ---------- */
  const MOVES = {
    stomp: { tele: 1.5, r: 2.9, mult: 3.8 },
    rain: { tele: 1.9, r: 1.7, mult: 2.8 },
    quake: { tele: 2.6, r: 6.6, mult: 2.4 },
  };
  const telegraph = (kind, x, y, r) => {
    const mv = MOVES[kind]; run.tele.push({ kind, x, y, r: r || mv.r, t: mv.tele, dur: mv.tele, mult: mv.mult });
    G.addFx({ t: 'warn', x, y, r: r || mv.r, d: mv.tele });
  };
  const land = (t) => {
    const m = run.m, S = G.S;
    for (const h of S.heroes) { if (h.inside || h.state === 'fallen' || h.state === 'recover') continue; if (Math.hypot(h.x - t.x, h.y - t.y) < t.r) G.dmgToHero(m, h, t.mult); }
    G.addFx({ t: 'boom', x: t.x, y: t.y, c: G.COLOSSI[G.colosso().id].glow, r: t.r * 0.8 });
    G.addFx({ t: 'shake', n: t.kind === 'quake' ? 9 : 5 }); G.sfx('boom', t.x, t.y);
  };
  const chooseMove = (fs) => {
    const w = fs.length >= 2 ? [['stomp', 40], ['rain', 40], ['quake', 20]] : [['stomp', 60], ['rain', 40]];
    return G.wpick(w);
  };
  const cast = (fs) => {
    const m = run.m, kind = chooseMove(fs), mv = MOVES[kind];
    run.cast = { kind, t: mv.tele };
    if (kind === 'stomp') { const t = G.pick(fs); telegraph('stomp', t.x, t.y); }
    else if (kind === 'quake') telegraph('quake', m.x, m.y + 0.3);
    else { const n = Math.min(6, fs.length + 2); for (let i = 0; i < n; i++) { const t = fs[i % fs.length], jx = i < fs.length ? 0 : G.rnd(-2.4, 2.4), jy = i < fs.length ? 0 : G.rnd(-2.4, 2.4); telegraph('rain', t.x + jx, t.y + jy); } }
    G.sfx('boss', m.x, m.y);
  };
  const colTickFight = (dt) => {
    const m = run.m, c = G.S.colosso;
    m.state = 'colosso'; m.x = m.hx; m.y = m.hy; m.path = null; m.eva = 0; m.tSlam = 1e9;
    if (m.hp > run.lastHp) m.hp = run.lastHp;                     // nada cura o Colosso (nem o "recuar" dos monstros comuns)
    run.lastHp = m.hp; c.hp = Math.max(0, m.hp); c.dmg = c.hpMax - c.hp;
    if (m.swing > 0) m.swing -= dt; if (m.flash > 0) m.flash -= dt;
    run.tune -= dt; if (run.tune <= 0) { run.tune = 5; retune(); }
    /* golpes telegrafados que chegam ao fim */
    for (let i = run.tele.length - 1; i >= 0; i--) { const t = run.tele[i]; t.t -= dt; if (t.t <= 0) { run.tele.splice(i, 1); land(t); } }
    if (run.cast) { run.cast.t -= dt; if (run.cast.t <= 0) run.cast = null; }
    const fs = fighters(); run.near = fs.length;
    if (!fs.length) return;
    /* quem está mais perto leva o golpe comum */
    let tg = null, bd = 1e9; for (const h of fs) { const d = Math.hypot(h.x - m.x, h.y - m.y); if (d < bd) { bd = d; tg = h; } }
    m.tgt = tg; if (tg) m.dir = tg.x >= m.x ? 1 : -1;
    const rage = c.hp < c.hpMax * 0.35 ? 0.75 : 1;
    run.tStrike -= dt;
    if (run.tStrike <= 0 && tg && bd < m.rng + m.size * 0.45) { run.tStrike = m.int * rage; m.swing = 0.3; G.dmgToHero(m, tg, 1); G.sfx('hit', m.x, m.y); }
    run.tMove -= dt;
    if (run.tMove <= 0 && !run.cast) { run.tMove = G.rnd(3.4, 5.6) * rage; cast(fs); }
  };

  /* ================= heróis: quem vai, como luta, como se esquiva ================= */
  /* chamado no fim da decisão na cidade (leaveTown): devolve true se o herói foi para o Colosso */
  G.colossoPick = (h) => {
    const S = G.S, c = S.colosso, C = G.COLOSSO; if (!c || !live() || S.mare.active || c.mode === 2) return false;
    const st = G.heroStats(h);
    if (h.hp < st.hp * 0.85 || h.fome < 40 || h.energia < 35) return false;
    if (c.mode === 0) {   // Livre: a cada decisão, uma parte dos aptos vai (os ousados mais, os cautelosos menos); quem tem ordem de zona mantém a ordem
      if (h.order !== 'auto') return false;
      const share = clamp(C.share + 0.1 * (G.traitSum(h, 'brave') + (h.caution === 0 ? 1 : h.caution === 2 ? -2 : 0)), 0.1, 0.9);
      if (Math.random() >= share) return false;
    }
    /* Aurora entrega poções do estoque a quem vai (quem luta contra o Colosso não ganha moedas para comprar as suas) */
    if (h.potions < 2 && S.res.pocao >= 1) { const n = Math.min(G.potCap(h) - h.potions, 2, Math.floor(S.res.pocao)); if (n > 0) { h.potions += n; G.addRes('pocao', -n); } }
    if (h.potions < 1 && G.bOk('alquimista')) return false;
    h.state = 'colosso'; h.tgt = null; h.inside = null; h._dgU = 0; h._cn = G.rnd(0.25, 2.9);   // o ponto de combate fica no lado sul: a plateia vê os heróis de frente
    G.go(h, run.m.x + Math.cos(h._cn) * 4, run.m.y + Math.sin(h._cn) * 3 + 1);
    G.bark(h, 'boss', 0.5);
    return true;
  };
  G.colossoCall = (mode) => {
    const S = G.S, c = G.colosso(); c.mode = mode;
    if (mode === 1 && live()) for (const h of S.heroes) if ((h.state === 'hunt' || h.state === 'travel') && h.hp > G.heroStats(h).hp * 0.6) G.heroGoHome(h, false);   // quem caça volta, entrega o espólio e vai ao Colosso
    if (mode === 2) for (const h of S.heroes) if (h.state === 'colosso') { h.state = 'return'; G.heroGoHome(h, false); }
    G.emit('colosso', { t: 'mode', mode });
  };
  /* fugir dos círculos vermelhos: depois de um instante de reação, vai para fora do círculo */
  const dodge = (h) => {
    const S = G.S;
    for (const t of run.tele) {
      if (t.t < 0.4) continue;
      const d = Math.hypot(h.x - t.x, h.y - t.y); if (d >= t.r + 0.3) continue;
      if ((h._dgU || 0) > S.t) return true;
      if (t.dur - t.t < 0.3 + 0.5 * H01('rx|' + h.id)) return false;
      const a = d < 0.2 ? G.rnd(0, 6.28) : Math.atan2(h.y - t.y, h.x - t.x), q = Wd.nearestWalk(t.x + Math.cos(a) * (t.r + 1.1), t.y + Math.sin(a) * (t.r + 1.1));
      G.go(h, q[0], q[1]); h._dgU = S.t + Math.min(2, t.t); return true;
    }
    return false;
  };
  G.colossoHero = (h, dt, st, mons) => {
    const S = G.S, m = run.m, c = S.colosso;
    if (!m || m.dead || m.gone || !c || c.mode === 2 || S.mare.active) { h.state = 'return'; G.heroGoHome(h, false); return; }
    const frac = h.hp / st.hp;
    payHero(h, dt);
    if (frac < 0.4 && h.potions > 0 && h.tPot <= 0) G.heroDrink(h, st);
    h.tThink -= dt;
    if (h.tThink <= 0) {
      h.tThink = 0.5;
      if (h.fome < 10 || h.energia < 8) { h.state = 'return'; return G.heroGoHome(h, false); }
      const thr = clamp(G.CAUTION[h.caution].thr + G.traitSum(h, 'retreat'), 0.08, 0.7) * 0.7;
      if (frac < thr && (h.potions <= 0 || h.tPot > 0 && frac < thr * 0.6)) { if (h.potions <= 0) G.bark(h, 'hurt', 0.5); return G.heroGoHome(h, true); }
    }
    if (dodge(h)) { if (!G.step(h, dt, st.spd * 1.15)) return; }
    else if ((h._dgU || 0) > S.t && h.path && h.path.length) { G.step(h, dt, st.spd * 1.15); return; }
    /* posição de combate: um ponto do anel em volta do Colosso, conforme o alcance */
    const a = h._cn == null ? (h._cn = G.rnd(0.25, 2.9)) : h._cn;
    const rr = st.rng < 2.5 ? 1.6 : Math.min(st.rng, 5.6) + 0.8, tx = m.x + Math.cos(a) * rr, ty = m.y + 0.6 + Math.sin(a) * rr * 0.75;   // corpo a corpo cabe no alcance das habilidades em área (2,1)
    if (G.chase(h, tx, ty, dt, st.spd, 0.7)) G.heroAct(h, m, mons, frac);
  };
  /* ---------- soldo: o que a caçada rende por segundo (medido nos abates comuns) é pago a quem luta contra o Colosso ---------- */
  const km1 = G.killMon;
  G.killMon = (m, h) => {
    if (m.dead || !h || m.colosso) return km1(m, h);
    const c = G.colosso(), y = c.y, g0 = h.gold, b0 = Object.assign({}, h.bag);
    run.inKill = true; km1(m, h); run.inKill = false;
    y.g += Math.max(0, h.gold - g0) / G.PM(h.lvl);   // moedas e XP medidos em "frações" do nível de quem abateu: quem é mais fraco recebe proporcionalmente menos
    for (const id in h.bag) { const d = h.bag[id] - (b0[id] || 0); if (d > 0) y.mats[id] = (y.mats[id] || 0) + d; }   // o que veio na bolsa, por tipo (o que cai no chão depende de toque e não conta)
  };
  const gx0 = G.giveXp; G.giveXp = (h, n) => { if (run.inKill) G.colosso().y.x += n / G.xpNeed(h.lvl); return gx0(h, n); };
  const gr0 = G.gainRealm; G.gainRealm = (n, why) => { if (run.inKill && why === 'kill') G.colosso().y.r += n; return gr0(n, why); };
  const payHero = (h, dt) => {
    const c = G.S.colosso, y = c.y; if (y.t < 300) return;
    h._pT = (h._pT || 0) - dt; if (h._pT > 0) return;
    const d = 2 - h._pT; h._pT = 2;
    const k = G.COLOSSO.pay * d / y.t;
    G.giveXp(h, y.x * k * G.xpNeed(h.lvl)); h.gold += y.g * k * G.PM(h.lvl); G.gainRealm(y.r * k, 'colosso');
    let tot = 0; for (const id in y.mats) tot += y.mats[id];
    h._pm = (h._pm || 0) + tot * k;
    while (h._pm >= 1 && tot > 0) {   // os materiais saem na mesma proporção em que a caçada traz
      h._pm--; let r = Math.random() * tot, pick = null; for (const id in y.mats) { r -= y.mats[id]; pick = id; if (r <= 0) break; }
      if (pick) { G.addRes(pick, 1); G.S.rep.today.mats = (G.S.rep.today.mats || 0) + 1; }
    }
  };
  /* queda diante do Colosso é batalha honrosa: o espólio, as moedas e a experiência ficam com o herói (ele só volta pela Enfermaria) */
  const hf0 = G.heroFall;
  G.heroFall = (h, m) => {
    if (h.state !== 'colosso' && !(m && m.colosso)) return hf0(h, m);
    const S = G.S, keep = { gold: h.gold, bag: h.bag, bagN: h.bagN, xp: h.xp, animo: h.animo, falls: h.falls, sf: S.stats.falls, tf: S.rep.today.falls || 0 };
    h.bag = {}; h.bagN = 0;
    const r = hf0(h, m);
    h.bag = keep.bag; h.bagN = keep.bagN;
    if (r) {
      h.gold = keep.gold; h.xp = keep.xp; h.animo = Math.max(0, keep.animo - 10); h.falls = keep.falls; S.stats.falls = keep.sf; S.rep.today.falls = keep.tf;
      G.colosso().fl++;
      G.log(h.name + ' tombou com honra diante do Colosso. O espólio foi poupado.', 'info');
    }
    return r;
  };
  /* dano por herói (para o "destaque" do baú) */
  const dm0 = G.dmgToMon;
  G.dmgToMon = (h, m, mult, forceCrit, o) => {
    if (!m.colosso) return dm0(h, m, mult, forceCrit, o);
    const hp0 = m.hp, d = dm0(h, m, mult, forceCrit, o), c = G.S.colosso, dealt = Math.min(d, Math.max(0, hp0));
    if (c && dealt > 0) { c.hero[h.id] = (c.hero[h.id] || 0) + dealt; c.hn[h.id] = h.name; }
    return d;
  };

  /* ================= a queda do Colosso ================= */
  const topHero = (c) => { let best = null; for (const id in c.hero) if (!best || c.hero[id] > best.dmg) best = { id: +id, name: c.hn[id] || 'Herói', dmg: Math.round(c.hero[id]) }; return best; };
  const down = (m, h) => {
    const S = G.S, c = G.colosso(), d = G.COLOSSI[c.id];
    if (c.win) return;
    m.dead = true; m.hp = 0; c.hp = 0; c.dmg = c.hpMax; c.win = G.arenaNow();
    { const w = run.win || G.colossoWin(c.win); c.bonus = Math.round(c.hpMax * G.COLOSSO.bonus * clamp((w.endAt - c.win) / (w.endAt - w.startAt), 0, 1)); }   // bônus de abate rápido: até +25% de dano contado no ranking, em proporção ao tempo que sobrou
    markCheck(c);
    const chest = G.colossoChest(), txt = give(chest);
    G.cosGrant(d.relic);
    c.tot.win++;
    for (const hh of S.heroes) if (c.hero[hh.id]) { hh.animo = Math.min(100, hh.animo + 30); G.giveXp(hh, G.xpNeed(hh.lvl) * 0.5); G.artGain(hh, 3); }
    G.gainRealm(300 + 20 * S.realm.lvl, 'colosso');
    const mvp = topHero(c);
    c.pend.push({ k: 'win', wk: c.wk, id: c.id, chest, relic: d.relic, mvp, at: c.win });
    run.dying = { t: 0, x: m.x, y: m.y };
    for (let i = 0; i < 6; i++) G.addFx({ t: 'boom', x: m.x + G.rnd(-2.5, 2.5), y: m.y + G.rnd(-2, 1), c: d.glow, r: G.rnd(2, 3.6) });
    G.addFx({ t: 'shake', n: 16 }); G.sfx('victory', m.x, m.y); G.sfx('bossdie', m.x, m.y);
    G.log(d.name + ' tombou! A Cratera inteira ouviu. Baú do Colosso: ' + txt + ' e ' + G.COS[d.relic].name + '.', 'epic');
    G.toast(d.name + ' foi derrubado!', 'epic', 'crown');
    G.emit('colosso', { t: 'win', c, d, chest, mvp });
    for (const hh of S.heroes) if (hh.state === 'colosso') { hh.state = 'return'; G.heroGoHome(hh, false); }
  };
  const km0 = G.killMon;
  G.killMon = (m, h) => { if (m.colosso) { if (!m.dead && !G.colosso().win) down(m, h); return; } return km0(m, h); };

  /* ================= marcos pessoais de dano ================= */
  function markCheck(c) {
    const M = G.COLOSSO.marks;
    while (c.mk < M.length && c.dmg >= M[c.mk] * c.hpMax) {
      const i = c.mk++, p = G.colossoMarkPrize(i), txt = give(p);
      G.gainRealm(25 + 8 * i, 'colosso');
      G.log('Marco do Colosso (' + Math.round(M[i] * 100) + '% da vida): ' + txt + '.', 'good');
      G.toast('Marco do Colosso! ' + txt + '.', 'good', 'crown'); G.sfx('quest');
      G.emit('colosso', { t: 'mark', i, p, txt });
    }
  }

  /* ================= virada da semana: ranking final e prêmio de posição ================= */
  const settle = (c, nowWk) => {
    if (c.hpMax > 0) {
      const part = c.dmg > 0, d = G.COLOSSI[c.id];
      const st = G.colossoStanding(true), pos = st.me;
      c.tot.w++; c.tot.dmg += Math.round(c.dmg); if (!c.tot.best || pos < c.tot.best) c.tot.best = part ? pos : c.tot.best;
      const rec = { wk: c.wk, id: c.id, dmg: Math.round(c.dmg), bonus: c.bonus || 0, hpMax: c.hpMax, pct: c.dmg / c.hpMax, pos: part ? pos : 0, win: c.win ? 1 : 0, n: st.n, fl: c.fl };
      if (part) {
        const prize = G.colossoRankPrize(pos), txt = give(prize);
        rec.prize = prize;
        c.pend.push({ k: 'rank', wk: c.wk, id: c.id, pos, n: st.n, dmg: rec.dmg, bonus: rec.bonus, hpMax: c.hpMax, win: rec.win, prize, mvp: topHero(c), top: st.list.slice(0, 3).map((x) => ({ i: x.i, dmg: x.dmg })) });
        G.log('Semana do ' + d.name + ' encerrada: ' + pos + 'º lugar entre ' + st.n + ' reinos. Prêmio: ' + txt + '.', 'epic');
        G.emit('colosso', { t: 'rank', rec });
      } else G.log('O ' + d.name + ' voltou a dormir sem que Aurora o enfrentasse.', 'info');
      c.hist.push(rec); if (c.hist.length > 8) c.hist.shift();
    }
    despawn();
    const keepPend = c.pend, keepHist = c.hist, keepTot = c.tot, keepPr = c.pr, keepMode = c.mode, keepY = c.y;
    Object.assign(c, defaults(), { pend: keepPend, hist: keepHist, tot: keepTot, pr: keepPr, mode: keepMode, y: keepY, wk: nowWk });
  };

  /* ================= avisos ================= */
  const announce = (kind, c) => {
    const d = G.COLOSSI[c.id];
    if (kind === 'warn') {
      G.log('A terra treme na Cratera… Algo muito grande desperta na sexta-feira.', 'boss');
      G.toast('A terra treme na Cratera…', 'boss', 'skull'); G.sfx('boss');
    } else {
      G.log(d.name + ', ' + d.kind + ', despertou na Cratera! Todos os reinos o enfrentam até domingo à noite.', 'boss');
      G.toast(d.name + ' despertou na Cratera!', 'boss', 'skull'); G.sfx('boss'); G.addFx({ t: 'shake', n: 8 });
    }
    G.emit('colosso', { t: kind, c, d });
  };

  /* ================= laço ================= */
  const check = () => {
    const S = G.S, c = G.colosso(), w = (run.win = G.colossoWin());
    if (c.wk !== w.wk) settle(c, w.wk);
    c.id = c.hpMax ? c.id : w.idx;
    const open = G.colossoOpen();
    if (open && w.phase === 'warn' && c.warned !== w.wk) { c.warned = w.wk; announce('warn', c); }
    if (open && w.phase === 'on') {
      if (!c.hpMax) calibrate(c);
      if (c.woke !== w.wk) { c.woke = w.wk; announce('wake', c); }
      if (c.hp > 0 && !c.win && !(run.m && !run.m.dead && !run.m.gone)) spawn(c);
    } else if (run.m && !c.win) despawn();
    void S;
  };
  G.colossoCheck = () => { run.ck = 0; };
  const tk0 = G.tick;
  G.tick = (dt) => {
    tk0(dt);
    const S = G.S; if (!S) return;
    run.ck -= dt; if (run.ck <= 0) { run.ck = 1; check(); }
    { let nh = 0; for (const h of S.heroes) if (h.state === 'hunt' || h.state === 'travel') nh++; if (nh) { const y = G.colosso().y; y.t += nh * dt; if (y.t > 6000) { y.t *= 0.5; y.x *= 0.5; y.g *= 0.5; y.r *= 0.5; for (const id in y.mats) y.mats[id] *= 0.5; } } }   // segundos-herói caçando (janela móvel)
    if (run.m && !run.m.dead && !run.m.gone) { colTickFight(dt); markCheck(S.colosso); }
    else if (run.dying) { run.dying.t += dt; if (run.dying.t > 4) run.dying = null; }
  };
  const ng0 = G.newGame; G.newGame = () => { const r = ng0(); run.m = null; run.tele.length = 0; run.ck = 0; run.dying = null; return r; };
  const al0 = G.afterLoad; G.afterLoad = () => { al0(); run.m = null; run.tele.length = 0; run.ck = 0; run.dying = null; };

  /* ================= leitura para as telas ================= */
  G.colossoInfo = () => {
    const S = G.S, c = G.colosso(), w = run.win || (run.win = G.colossoWin()), d = G.COLOSSI[c.hpMax ? c.id : w.idx];
    const open = G.colossoOpen(), on = open && w.phase === 'on';
    return { c, w, d, open, on, live: live(), warn: open && w.phase === 'warn', pct: c.hpMax ? c.hp / c.hpMax : 1, left: on ? w.endAt - w.ms : w.phase === 'warn' ? w.startAt - w.ms : 0, fighters: run.near };
  };
  /* próximo marco de dano ainda não alcançado: { i, v, from, pct } */
  G.colossoNextMark = () => {
    const c = G.colosso(), M = G.COLOSSO.marks; if (!c.hpMax || c.win || c.mk >= M.length) return null;
    const v = M[c.mk] * c.hpMax, from = c.mk ? M[c.mk - 1] * c.hpMax : 0;
    return { i: c.mk, v: Math.round(v), from: Math.round(from), pct: clamp((c.dmg - from) / (v - from), 0, 1) };
  };
  /* "próxima recompensa" do HUD: entra o marco do Colosso quando ele está de pé */
  const nr0 = G.nextReward;
  G.nextReward = () => {
    const r = nr0(), c = G.S.colosso;
    if (c && live() && c.dmg > 0) {
      const nm = G.colossoNextMark();
      if (nm) { r.all.push({ id: 'col' + nm.i, k: 'Colosso', t: 'marco de ' + G.fmt(nm.v) + ' de dano', ic: 'skull', cur: Math.round(c.dmg), n: nm.v, pct: nm.pct, rk: nm.pct, ready: false, go: 'open:missoes:colosso', pr: 5 }); }
      else if (c.mk >= G.COLOSSO.marks.length) r.all.push({ id: 'colw', k: 'Colosso', t: 'derrube o ' + G.COLOSSI[c.id].name, ic: 'crown', cur: Math.round(c.dmg), n: c.hpMax, pct: c.dmg / c.hpMax, rk: c.dmg / c.hpMax, ready: false, go: 'open:missoes:colosso', pr: 5 });
      const ready = r.all.filter((o) => o.ready).sort((a, b) => a.pr - b.pr);
      r.best = ready.length ? ready[0] : r.all.slice().sort((a, b) => b.rk - a.rk || a.pr - b.pr)[0] || null;
    }
    return r;
  };
})();
;
