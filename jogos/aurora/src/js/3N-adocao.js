/* 3N-adocao: v27 (B2) — mascotes procuram dono sozinhos. Todo mascote que o jogador ganha daqui em diante (ovo chocado de Incursão, Mascate, Arena, Caminho)
   nasce como VAGANTE: anda pelas ruas e pela praça, fareja os heróis que estão na cidade e, depois de cerca de um dia do reino (um pouco mais para os mais
   raros), escolhe um dono sozinho. O temperamento decide o critério: o Valente vai para o herói mais forte (a conta de poder da Arena, G.arenaHeroPow) e o
   Dengoso para o mais cativante (G.heroCharm, definido aqui). Um sorteio fixo por par (mascote, herói) de ±10% evita que seja sempre o mesmo herói. Antes de
   escolher o vagante já "segue" o favorito sempre que ele está na cidade. Só concorre quem tem vaga (cada herói leva até 3 mascotes; ver 36-companheiros).
   O jogador manda em tudo: pode dar o vagante a um herói, recolhê-lo ao Viveiro ou soltar um mascote do Viveiro na praça. Só simulação, sem DOM. Durante
   o avanço do tempo ausente (G.OFFLINE) o relógio do vagante corre e ele escolhe, mas ninguém anda. Nada aqui mexe em recursos ou combate. */
'use strict';
(function () {
  const Wd = G.W;
  const HOUR = G.DAY_SEC / 24;

  /* ================= carisma do herói ================= */
  /* O jogo não tinha "carisma": o que ele tem de mais próximo é a personalidade (traços), o ânimo, a fama (títulos do Livro de Feitos), os laços com outros heróis,
     a aparência (trajes e asas) e o posto na Guilda. G.heroCharm soma tudo numa nota de 0 a ~100 e G.heroCharmParts mostra de onde vem cada ponto. */
  G.CHARM = {
    trait: { sociavel: 12, generoso: 8, corajoso: 5, sortudo: 4, invocado: 4, focado: 3, ambicioso: 3, robusto: 2, guloso: 2, cacador: 1, notivago: 1, impulsivo: 0, preguicoso: 0, medroso: -2, teimoso: -3 },
    traitCap: [-5, 22], mood: 0.18, titles: 2.5, titlesCap: 20, bonds: 2.5, bondsCap: 15, hod: 2, hodCap: 6, look: { traje: 4, asas: 4, reliquia: 2 }, rank: 1.2, rankCap: 9,
  };
  G.heroCharmParts = (h) => {
    const C = G.CHARM, out = [];
    let t = 0; for (const k of h.traits || []) t += C.trait[k] || 0;
    out.push({ id: 'traits', n: 'Personalidade', v: G.clamp(t, C.traitCap[0], C.traitCap[1]), d: 'os traços do herói (Sociável e Generoso atraem mais)' });
    out.push({ id: 'mood', n: 'Ânimo', v: G.clamp(h.animo || 0, 0, 100) * C.mood, d: 'quem anda de bem com a vida atrai mais' });
    let ti = 0, hd = 0; if (G.feitos) { const f = G.feitos(h); ti = Object.keys(f.ti || {}).length; hd = f.hd || 0; }
    out.push({ id: 'fame', n: 'Fama', v: Math.min(C.titlesCap, ti * C.titles) + Math.min(C.hodCap, hd * C.hod), d: 'títulos e dias de Herói do Dia' });
    let lc = 0; if (G.lacosOf) for (const l of G.lacosOf(h)) lc += l.lv || 0;
    out.push({ id: 'bonds', n: 'Laços', v: Math.min(C.bondsCap, lc * C.bonds), d: 'laços de amizade com outros heróis' });
    const cz = h.cos || {}; out.push({ id: 'look', n: 'Aparência', v: (cz.traje ? C.look.traje : 0) + (cz.asas ? C.look.asas : 0) + (cz.reliquia ? C.look.reliquia : 0), d: 'trajes, asas e relíquias' });
    out.push({ id: 'rank', n: 'Posto', v: Math.min(C.rankCap, (h.rank || 0) * C.rank + (h.stars || 0) * 0.5), d: 'o rank na Guilda' });
    return out;
  };
  G.heroCharm = (h) => { let s = 0; for (const p of G.heroCharmParts(h)) s += p.v; return Math.max(0, Math.round(s)); };

  /* ================= vagantes ================= */
  G.STRAY = { wait: 0.8, waitPerRar: 0.1, jitter: 0.3, noise: 0.2, scan: 1.5, spd: 2.1 };
  const ST = G.STRAY;
  G.petTemp = (p) => { if (!p.tp) p.tp = G.hash('tp' + p.id + p.k) % 2 ? 'v' : 'd'; return p.tp; };
  const waitFor = (p) => G.DAY_SEC * (ST.wait + ST.waitPerRar * p.rar) * (1 - ST.jitter / 2 + Math.random() * ST.jitter);
  const spot = () => { const r = Math.random(); if (r < 0.7) { const q = G.pick(Wd.idle); return Wd.nearestWalk(q[0] + G.rnd(-1.2, 1.2), q[1] + G.rnd(-0.8, 0.8)); } return Wd.nearestWalk(G.rnd(31, 56), G.pick([46.5, 53.6, 60.5])); };
  G.strayRt = (p) => {
    let r = G.petRt.get(p.id);
    if (!r || r.st !== 'stray') { const q = spot(); r = { x: q[0], y: q[1], dir: Math.random() < 0.5 ? 1 : -1, moving: false, path: null, st: 'stray', mode: 'idle', t: G.rnd(0.5, 2.5), d: null, tW: 9, tV: 9, tS: 0, cast: 0, ck: '', fav: 0, sc: 0 }; G.petRt.set(p.id, r); }
    return r;
  };
  /* vira vagante na praça */
  G.petStrayOn = (p) => {
    const S = G.S; p.hero = 0; p.out = 1; p.at = S.t + waitFor(p); p.noRoom = 0; G.petTemp(p);
    G.petRt.delete(p.id); if (!G.OFFLINE) G.strayRt(p);
    return p;
  };
  /* mascote do Viveiro solto na praça para procurar dono ("Soltar na praça") */
  G.petToSquare = (p) => {
    if (!p || G.S.pets.indexOf(p) < 0 || p.out) return false;
    if (p.hero) G.petAssign(p, null);
    G.petStrayOn(p); G.log(G.PETS[p.k].name + ' saiu do Viveiro e foi para a praça procurar um dono.', 'info'); G.emit('pets', p); return true;
  };
  /* recolhe um vagante ao Viveiro */
  G.petToViveiro = (p) => {
    if (!p || G.S.pets.indexOf(p) < 0 || p.hero) return false;
    p.out = 0; G.petRt.delete(p.id); G.log(G.PETS[p.k].name + ' foi recolhido ao Viveiro.', 'info'); G.emit('pets', p); return true;
  };

  /* quem concorre e quanto cada um vale para este mascote */
  const noise = (p, h) => 1 - ST.noise / 2 + ST.noise * ((G.hash(p.id + '|' + h.id) % 1000) / 1000);
  const score = (p, h) => (G.petTemp(p) === 'v' ? G.arenaHeroPow(h) : G.heroCharm(h) + 5) * noise(p, h);
  G.petCandidates = (p) => G.S.heroes.filter((h) => G.petSlots(h) > 0 && h.pets.indexOf(p.id) < 0);
  /* o favorito de agora (null se ninguém tem vaga) e o "porquê" */
  G.petFavorite = (p) => {
    const c = G.petCandidates(p); if (!c.length) return null;
    let best = null, bs = -1; for (const h of c) { const s = score(p, h); if (s > bs) { bs = s; best = h; } }
    return best;
  };
  const isTopOverall = (p, h) => {
    const v = G.petTemp(p) === 'v'; let top = null, bs = -1;
    for (const x of G.S.heroes) { const s = v ? G.arenaHeroPow(x) : G.heroCharm(x); if (s > bs) { bs = s; top = x; } }
    return top === h;
  };
  G.petChoose = (p) => {
    const h = G.petFavorite(p); if (!h) return null;
    const v = G.petTemp(p) === 'v', crit = isTopOverall(p, h) ? (v ? 'o mais forte de Aurora' : 'o mais cativante de Aurora') : (v ? 'o mais forte entre os que têm vaga' : 'o mais cativante entre os que têm vaga');
    const nm = G.PETS[p.k].name;
    G.petAssign(p, h);
    const r = G.petRt.get(p.id); if (r) { r.st = 'follow'; r.path = null; r.mode = null; }
    G.log(nm + ' escolheu ' + h.name + ' — ' + crit + '.', 'good');
    G.toast(nm + ' escolheu ' + h.name + ' — ' + crit, 'good', 'paw'); G.sfx('rare');
    G.S.stats.petsChose = (G.S.stats.petsChose || 0) + 1;
    return h;
  };
  /* dados para o cartão do vagante */
  G.petStrayInfo = (p) => {
    const S = G.S, fav = G.petFavorite(p), left = Math.max(0, p.at - S.t), full = !S.heroes.some((h) => G.petSlots(h) > 0);
    return { temp: G.petTemp(p), fav, leftSec: left, leftHours: left / HOUR, due: left <= 0, noRoom: full, noHeroes: !S.heroes.length, favInTown: !!(fav && Wd.inTown(fav.x, fav.y) && !fav.inside) };
  };

  /* ---------- o andar do vagante (só com tela; offline ele só conta o tempo) ---------- */
  const inTown = (h) => !h.inside && Wd.inTown(h.x, h.y) && h.state !== 'fallen' && h.state !== 'recover';
  const stray = (p, r, dt) => {
    const S = G.S;
    if (r.cast > 0) r.cast -= dt;
    r.t -= dt;
    const fav = r.fav ? S.heroes.find((x) => x.id === r.fav) : null;
    /* sempre que o favorito está na cidade, o vagante vai atrás dele */
    if (fav && inTown(fav) && r.mode !== 'sniff') {
      r.mode = 'trail';
      const tx = fav.x - (fav.dir || 1) * 1.7 + Math.sin(p.id) * 0.5, ty = fav.y + 0.55;
      if (Math.hypot(tx - r.x, ty - r.y) > 0.6) G.chase(r, tx, ty, dt, ST.spd * 1.25, 0.35); else { r.moving = false; r.path = null; r.dir = fav.x >= r.x ? 1 : -1; }
      return;
    }
    if (r.mode === 'trail') { r.mode = 'idle'; r.t = G.rnd(0.5, 1.5); r.moving = false; r.path = null; }
    switch (r.mode) {
      case 'walk': case 'sniff': {
        if (r.mode === 'sniff' && r.sc > 0) { r.sc -= dt; r.moving = false; if (r.sc <= 0) { r.mode = 'idle'; r.t = G.rnd(1, 3); } break; }
        const done = G.step(r, dt, ST.spd);
        if (done) { r.moving = false; if (r.mode === 'sniff') { r.sc = G.rnd(1.2, 2.2); const h = S.heroes.find((x) => x.id === r.sn); if (h) r.dir = h.x >= r.x ? 1 : -1; } else { r.mode = 'idle'; r.t = G.rnd(1.5, 5); } }
        break;
      }
      default:
        r.moving = false;
        if (r.t <= 0) {
          const near = S.heroes.filter(inTown);
          if (near.length && Math.random() < 0.4) { const h = G.pick(near); r.mode = 'sniff'; r.sn = h.id; const q = Wd.nearestWalk(h.x - 0.9 * (h.dir || 1), h.y + 0.3); G.go(r, q[0], q[1]); }
          else { const q = spot(); r.mode = 'walk'; G.go(r, q[0], q[1]); }
          r.t = 99;
        }
    }
  };
  let scanT = 0;
  const strayRng = G.seeded(0x57A7);
  /* o andar dos vagantes usa sorteio e cache de caminhos próprios (nada visual muda a sequência do combate) */
  const strayTick = (dt) => {
    const S = G.S; if (!S || !S.pets.length) return;
    const r0 = Math.random; Math.random = strayRng; Wd._npc = true;
    try { strayTick2(dt); } finally { Math.random = r0; Wd._npc = false; }
  };
  const strayTick2 = (dt) => {
    const S = G.S;
    let any = false; for (const p of S.pets) if (p.out && !p.hero) { any = true; break; }
    if (!any) return;
    scanT -= dt; const scan = scanT <= 0; if (scan) scanT = ST.scan;
    for (const p of S.pets) {
      if (!p.out || p.hero) continue;
      let r = null;
      if (!G.OFFLINE) { r = G.strayRt(p); stray(p, r, dt); }
      if (scan) {
        const fav = G.petFavorite(p);
        if (r) r.fav = fav ? fav.id : 0;
        p.noRoom = fav ? 0 : 1;
        if (S.t >= p.at && fav) G.petChoose(p);
      }
    }
  };
  const ue0 = G.updateEncounters;
  G.updateEncounters = (dt) => { ue0(dt); strayTick(dt); };
  /* todo mascote novo (Incursão, Mascate, Arena, Caminho) chega como vagante; a fusão no Viveiro continua guardando o resultado lá */
  const ph0 = G.petHatch;
  G.petHatch = (k, rar, why) => { const p = ph0(k, rar, why); if (p) G.petStrayOn(p); return p; };

  /* vagantes do save carregado: a posição não é salva; reaparecem na praça (o relógio de escolha continua de onde parou) */
  const vm1 = G.vocMigrate;
  G.vocMigrate = () => { vm1(); const S = G.S; for (const p of S.pets) { if (p.out && !(p.at >= 0)) p.at = S.t + waitFor(p); if (!p.tp) G.petTemp(p); } };
})();

;
