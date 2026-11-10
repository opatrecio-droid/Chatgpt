/* ===== Ciclo 029 — AURORA: ASCENSÃO (núcleo) =====
   Progressão infinita e dificuldade gradual, sem escolha de dificuldade:
   - Nível do Reino (Renome): cresce com abates, contratos e chefes; a ameaça sobe junto.
   - Ajuste dinâmico: se os heróis caem demais, a ameaça alivia um pouco sozinha.
   - Maestria (por herói, infinita) e Bênçãos do Reino (permanentes, compradas com Selos).
   - Fenda Infinita: escada de chefes por andar, sem teto.
   - Contratos do dia: 3 objetivos novos a cada amanhecer, com sequência de dias.
   - Mercado vivo: preço reage ao estoque; drops dos heróis, compras e caravanas giram o ouro. */
(function () {
  'use strict';
  const P = window.P;
  if (!P || P.asc) return;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hash = (s) => (P.util && P.util.hash ? P.util.hash(String(s)) >>> 0 : 1);
  const SLOT_KEY = () => 'aurora.asc.v1' + (P.SAVE_SLOT > 1 ? '.slot' + P.SAVE_SLOT : '');

  const THREAT_NAMES = [
    [1, 'Calmaria'], [4, 'Inquietação'], [8, 'Vigília'], [12, 'Perigo'], [16, 'Calamidade'],
    [20, 'Tormento'], [28, 'Abismo'], [38, 'Cataclismo'], [50, 'Fim das Eras'],
  ];

  const BLESSINGS = [
    { id: 'lamina', name: 'Bênção da Lâmina', desc: '+3% de ataque para todos os heróis', per: 3, unit: '% ataque', icon: 'sword' },
    { id: 'vigor', name: 'Bênção do Vigor', desc: '+4% de vida máxima para todos os heróis', per: 4, unit: '% vida', icon: 'heart' },
    { id: 'sabedoria', name: 'Bênção da Sabedoria', desc: '+5% de experiência em cada abate', per: 5, unit: '% XP', icon: 'star' },
    { id: 'fortuna', name: 'Bênção da Fortuna', desc: '+5% de moedas em abates e vendas de espólio', per: 5, unit: '% moedas', icon: 'coin' },
    { id: 'comercio', name: 'Bênção do Comércio', desc: '+4% no valor das exportações do Mercado', per: 4, unit: '% exportação', icon: 'scale' },
  ];

  const ZONE_NAME = (id) => { const z = (P.ZONES || []).find((q) => q.id === id); return z ? z.name : id; };

  const A = (P.asc = {
    BLESSINGS,
    listeners: [],
    emit(type, data) { for (const fn of this.listeners) { try { fn(type, data || {}); } catch (e) { /* ui opcional */ } } },

    /* ------------------------------ estado ------------------------------ */
    fresh() {
      return {
        v: 1, xp: 0, lvl: 1, selos: 0, kills: 0, bossKills: 0, adj: 0, winsSinceLoss: 0, bestKills: 0,
        rift: { floor: 1, best: 0 },
        bless: { lamina: 0, vigor: 0, sabedoria: 0, fortuna: 0, comercio: 0 },
        mastery: {},
        bounties: { day: 0, list: [], streak: 0, chest: false, defeats: 0 },
        flow: { day: 0, loot: 0, spend: 0, exportG: 0, importG: 0, kills: 0, cargo: 0 },
        flowHist: [],
        hist: {},
        coinsInit: false,
        stats: { goldEarned: 0, bounties: 0, defeats: 0 },
      };
    },
    normalize(s) {
      const f = this.fresh();
      for (const k of Object.keys(f)) if (s[k] == null) s[k] = f[k];
      for (const k of Object.keys(f.rift)) if (!Number.isFinite(s.rift[k])) s.rift[k] = f.rift[k];
      for (const k of Object.keys(f.bless)) if (!Number.isFinite(s.bless[k])) s.bless[k] = 0;
      for (const k of Object.keys(f.bounties)) if (s.bounties[k] == null) s.bounties[k] = f.bounties[k];
      for (const k of Object.keys(f.flow)) if (!Number.isFinite(s.flow[k])) s.flow[k] = 0;
      for (const k of Object.keys(f.stats)) if (!Number.isFinite(s.stats[k])) s.stats[k] = 0;
      s.lvl = Math.max(1, Math.floor(Number(s.lvl) || 1));
      s.xp = Math.max(0, Number(s.xp) || 0);
      s.selos = Math.max(0, Math.floor(Number(s.selos) || 0));
      s.adj = clamp(Number(s.adj) || 0, -0.3, 0);
      if (!Array.isArray(s.flowHist)) s.flowHist = [];
      if (!Array.isArray(s.bounties.list)) s.bounties.list = [];
      return s;
    },
    st() {
      const s = P.state;
      if (!s) return this._tmp || (this._tmp = this.fresh());
      if (!s.asc || typeof s.asc !== 'object') s.asc = this.fresh();
      if (!s.asc._ok) { this.normalize(s.asc); Object.defineProperty(s.asc, '_ok', { value: true, enumerable: false }); }
      return s.asc;
    },
    persist() { try { if (P.state && P.state.asc && !P._noSave) localStorage.setItem(SLOT_KEY(), JSON.stringify(P.state.asc)); } catch (e) { /* sem storage */ } },
    restore() {
      try {
        const hasMain = !!localStorage.getItem(P.SAVE_KEY);
        const raw = hasMain ? localStorage.getItem(SLOT_KEY()) : null;
        if (raw && P.state) { const d = JSON.parse(raw); if (d && typeof d === 'object') { P.state.asc = d; return true; } }
        if (!hasMain) localStorage.removeItem(SLOT_KEY());
      } catch (e) { /* sem storage */ }
      return false;
    },

    /* ------------------------- nível do reino ------------------------- */
    need(l) { return Math.round(120 * Math.pow(l, 1.8)); },
    threatName(l) {
      let name = THREAT_NAMES[0][1], idx = 0;
      for (let i = 0; i < THREAT_NAMES.length; i++) if (l >= THREAT_NAMES[i][0]) { name = THREAT_NAMES[i][1]; idx = i; }
      const start = THREAT_NAMES[idx][0], next = THREAT_NAMES[idx + 1] ? THREAT_NAMES[idx + 1][0] : start + 12;
      const step = Math.max(1, Math.floor((next - start) / 3));
      const grade = idx === 0 ? '' : ' ' + ['I', 'II', 'III', 'IV', 'V', 'VI'][clamp(Math.floor((l - start) / step), 0, 5)];
      return name + grade;
    },
    rawMult(l) { return 0.75 + 0.06 * (l - 1); },
    mult() { const s = this.st(); return this.rawMult(s.lvl) * (1 + s.adj); },
    xpMult() { const s = this.st(); return 1 + 0.03 * (s.lvl - 1); },
    dropMult() { const s = this.st(); return 1 + 0.025 * (s.lvl - 1); },
    difficulty() {
      const s = this.st();
      return {
        id: 'dinamica', label: this.threatName(s.lvl),
        monMult: +this.mult().toFixed(3), xpMult: +this.xpMult().toFixed(2), dropMult: +this.dropMult().toFixed(2),
      };
    },

    gain(n, why) {
      if (P._testMode || !(n > 0)) return;
      const s = this.st();
      s.xp += n;
      let ups = 0;
      while (s.xp >= this.need(s.lvl) && ups < 20) { s.xp -= this.need(s.lvl); s.lvl++; ups++; this.onLevelUp(s); }
      if (ups) { this.applyDifficulty(true); this.raiseBands(true); this.persist(); }
      this.emit('xp', { n, why });
    },
    onLevelUp(s) {
      const selos = s.lvl % 5 === 0 ? 3 : 1;
      const gold = 20 + 15 * s.lvl;
      s.selos += selos;
      P.state.treasury = (P.state.treasury || 0) + gold;
      const pct = Math.round((this.rawMult(s.lvl) / this.rawMult(s.lvl - 1) - 1) * 100);
      P.log('✦ Aurora alcançou o Nível de Reino ' + s.lvl + ' (' + this.threatName(s.lvl) + '). +' + gold + ' moedas, +' + selos + ' Selo(s). Os monstros ficaram ' + pct + '% mais fortes.', 'good');
      if (P.audio && P.audio.play) try { P.audio.play('levelup'); } catch (e) { /* ok */ }
      this.emit('levelup', { lvl: s.lvl, gold, selos, pct });
    },

    /* --------------------- dificuldade gradual --------------------- */
    applyDifficulty(force) {
      const s = this.st();
      const l = s.lvl;
      if (P.r11 && P.r11.DIFF) {
        P.r11.DIFF.dinamica = {
          label: 'Gradual', desc: 'a ameaça acompanha o seu reino',
          bandXp: clamp(0.6 + 0.04 * (l - 1), 0.6, 1.8) * (1 + s.adj),
          mareFeed: clamp(0.5 + 0.04 * (l - 1), 0.5, 1.7),
          mareDays: l < 6 ? 12 : l < 15 ? 10 : 8,
          wage: clamp(0.85 + 0.012 * (l - 1), 0.85, 1.2),
        };
        try { P.r11.apply('dinamica'); } catch (e) { /* ok */ }
      }
      const key = Math.round(this.mult() * 100);
      if (force || key !== this._multKey) { this._multKey = key; this.scaleMonsters(false); }
    },

    monsterBase(m) {
      const rk = Math.max(1, Number(m.rank) || 1);
      if (m.role === 'general') return { hp: 165 + rk * 85, atk: 18 + rk * 7 };
      return { hp: 82 + rk * 42, atk: 12 + rk * 4.5 };
    },
    scaleMonsters(all) {
      if (P._testMode || !P.heroes || !Array.isArray(P.heroes.monsters)) return;
      const mult = this.mult();
      for (const m of P.heroes.monsters) {
        if (!m || m.dead || m.role === 'lider' || m._ehtFieldBoss || m.trialFor || m._manualEvo) continue;
        const b = this.monsterBase(m);
        const hp = Math.max(20, Math.round(b.hp * mult)), atk = Math.max(3, Math.round(b.atk * mult));
        if (m.hpMax === hp && m.atk === atk) continue;   // compara valores: o renascimento devolve o monstro à base
        if (!all && m.hp < m.hpMax) continue;            // não mexe no meio de uma luta
        const ratio = m.hpMax > 0 ? clamp(m.hp / m.hpMax, 0.15, 1) : 1;
        m.hpMax = hp;
        m.hp = Math.max(1, Math.round(hp * ratio));
        m.atk = atk;
        m._c26Balanced = true;
      }
    },

    /* Válvula de segurança: a ameaça segue o Nível do Reino, mas alivia (até −30%) quando heróis caem
       ou quando a caçada do dia despenca, e volta ao normal aos poucos conforme eles vencem. */
    onDefeatDDA(mon) {
      const s = this.st();
      s.stats.defeats++;
      s.bounties.defeats = (s.bounties.defeats || 0) + 1;
      if (mon && mon._ehtFieldBoss) return;          // cair para um Guardião não muda a fronteira
      s.adj = clamp(s.adj - 0.05, -0.3, 0);
      s.winsSinceLoss = 0;
      this.applyDifficulty();
    },
    onWinDDA() {
      const s = this.st();
      s.winsSinceLoss++;
      if (s.adj < 0 && s.winsSinceLoss % 40 === 0) { s.adj = clamp(s.adj + 0.01, -0.3, 0); this.applyDifficulty(); }
    },
    dailyDDA(killsYesterday) {
      const s = this.st();
      if (s.bestKills > 60 && killsYesterday < s.bestKills * 0.45) {
        s.adj = clamp(s.adj - 0.06, -0.3, 0);
        P.log('A fronteira cedeu um pouco: com a caçada fraca de ontem, os bandos recuaram (ameaça ' + Math.round(s.adj * 100) + '%).', 'info');
        this.applyDifficulty();
      }
      s.bestKills = Math.max(Math.round(s.bestKills * 0.9), killsYesterday);
    },

    /* Os bandos da fronteira amadurecem com o reino: cada zona sobe de rank em níveis diferentes,
       então sempre há uma área mais branda e outra mais perigosa. */
    raiseBands(announce) {
      if (P._testMode || !P.territory || !Array.isArray(P.SECTORS)) return;
      const lvl = this.st().lvl;
      const maxIdx = P.rankIndex((P.BAND_XP && P.BAND_XP.maxRank) || 'SS');
      P.SECTORS.filter((d) => d.ring === 2 && d.zone).forEach((d, i) => {
        const sec = P.territory.get(d.id);
        if (!sec || !sec.band) return;
        const min = Math.min(maxIdx, Math.floor((lvl - 1 + i * 2) / 6));
        if (P.rankIndex(sec.band) >= min) return;
        sec.band = P.RANKS[min];
        try { P.territory.rebuildZone(d.zone, sec.band, false); } catch (e) { /* ok */ }
        if (announce) P.log('Os monstros de ' + d.name + ' amadureceram: o bando agora é rank ' + sec.band + ' — mais perigo, mais experiência e saque melhor.', 'warn');
      });
    },

    /* Prova de ascensão: o desafiante mantém o rank exigido e luta como um mini-chefe. */
    keepTrials() {
      for (const m of P.heroes.monsters) {
        if (!m || m.dead || !m.trialFor) continue;
        const hero = P.heroes.list().find((h) => h.id === m.trialFor);
        if (!hero) continue;
        const need = P.rankIndex(hero.rank || 'E') + 2;
        if ((Number(m.rank) || 1) < need) { m.rank = need; m.letter = P.rankLetter(need); }
        m._manualEvo = true;
        if (m._ascTrial !== need) {
          m._ascTrial = need;
          const mult = this.mult() * 0.8;
          m.hpMax = Math.round((165 + need * 85) * mult); m.hp = m.hpMax;
          m.atk = Math.round((18 + need * 7) * mult);
          m._c26Balanced = true;
        }
      }
    },
    passTrial(npc, mon) {
      const next = P.heroes.nextRank ? P.heroes.nextRank(npc) : null;
      if (!next || !P.HERO_XP || (npc.xp || 0) < P.HERO_XP[next]) return;
      const strong = mon.trialFor === npc.id || mon.role === 'general' || mon.role === 'lider';
      if (!strong) return;
      const r0 = npc.rank;
      npc._lastWinTier = Math.max(npc._lastWinTier || 0, P.rankIndex(next) + 1);
      P.heroes.checkRankUp(npc);
      if (npc.rank !== r0) this.emit('rankup', { npc, rank: npc.rank });
    },

    /* ---------------------------- maestria ---------------------------- */
    masteryKills(npc) { const s = this.st(); return (s.mastery[npc.id] && s.mastery[npc.id].k) || 0; },
    masteryLevel(k) { return Math.floor(Math.sqrt(Math.max(0, k) / 4)); },
    masteryOf(npc) { return npc ? this.masteryLevel(this.masteryKills(npc)) : 0; },
    masteryProgress(npc) {
      const k = this.masteryKills(npc), l = this.masteryLevel(k);
      const a = 4 * l * l, b = 4 * (l + 1) * (l + 1);
      return { lvl: l, cur: k - a, need: b - a, pct: clamp((k - a) / (b - a) * 100, 0, 100) };
    },
    heroBonus(npc) {
      const s = this.st(), m = this.masteryOf(npc);
      return { atkPct: m * 1.5 + s.bless.lamina * 3, hpPct: m * 1.5 + s.bless.vigor * 4, mastery: m };
    },

    /* Campo de Treino: o cofre vira força. Cada sessão sobe 1 nível de Maestria; o preço cresce sem teto. */
    trainCost(npc) { const m = this.masteryOf(npc); return Math.round(120 * Math.pow(m + 1, 1.6)); },
    trainHero(id) {
      const npc = P.heroes.list().find((h) => String(h.id) === String(id));
      if (!npc) return { ok: false, reason: 'Herói não encontrado.' };
      const cost = this.trainCost(npc);
      if ((P.state.treasury || 0) < cost) return { ok: false, reason: 'Cofre insuficiente (' + cost + ' moedas).' };
      const s = this.st(), m = s.mastery[npc.id] || (s.mastery[npc.id] = { k: 0 });
      const lvl = this.masteryLevel(m.k) + 1;
      P.state.treasury -= cost;
      m.k = Math.max(m.k, 4 * lvl * lvl);
      const h = P.eht && P.eht.heroData ? P.eht.heroData(npc) : null;
      if (h) h.statsCacheKey = '';
      try { if (P.r57 && P.r57.syncHp) { npc._r57hp = null; P.r57.syncHp(npc); } } catch (e) { /* ok */ }
      this.flowAdd('train', cost);
      P.log(npc.name + ' treinou no Campo de Treino: Maestria ' + lvl + ' (−' + cost + ' moedas).', 'info');
      this.persist();
      this.emit('mastery', { npc, lvl, trained: true });
      return { ok: true, lvl, cost };
    },

    /* ---------------------------- bênçãos ---------------------------- */
    blessCost(id) { const l = this.st().bless[id] || 0; return 1 + Math.floor(l / 2); },
    buyBless(id) {
      const s = this.st(), def = BLESSINGS.find((b) => b.id === id);
      if (!def) return { ok: false, reason: 'Bênção desconhecida.' };
      const cost = this.blessCost(id);
      if (s.selos < cost) return { ok: false, reason: 'Faltam Selos de Renome (' + s.selos + '/' + cost + ').' };
      s.selos -= cost; s.bless[id] = (s.bless[id] || 0) + 1;
      this.invalidateHeroes();
      if (P.audio && P.audio.play) try { P.audio.play('levelup'); } catch (e) { /* ok */ }
      P.log('✦ ' + def.name + ' subiu para o nível ' + s.bless[id] + '.', 'good');
      this.persist(); this.emit('bless', { id });
      return { ok: true };
    },
    invalidateHeroes() {
      try {
        for (const n of P.heroes.list()) {
          const h = P.eht && P.eht.heroData ? P.eht.heroData(n) : null;
          if (h) h.statsCacheKey = '';
          if (P.r57 && P.r57.syncHp) { n._r57hp = null; P.r57.syncHp(n); }
        }
      } catch (e) { /* ok */ }
    },

    /* ------------------------- fenda infinita ------------------------- */
    riftBoss() { return P.heroes && Array.isArray(P.heroes.monsters) ? P.heroes.monsters.find((m) => m && !m.dead && m._ehtFieldBoss) || null : null; },
    riftZone(floor) { const ids = (P.ZONES || []).map((z) => z.id); return ids.length ? ids[(floor - 1) % ids.length] : 'ermos'; },
    riftReward(floor) { return { gold: 80 + 40 * floor, xp: 60 + 30 * floor, selos: floor % 5 === 0 ? 3 : 1 }; },
    riftScale(boss) {
      if (!boss || boss._ascRift) return;
      const s = this.st(), f = s.rift.floor;
      boss._ascRift = f;
      boss.hpMax = Math.round(boss.hpMax * (1 + 0.28 * (f - 1)));
      boss.hp = boss.hpMax;
      boss.atk = Math.round((boss.atk || 30) * (1 + 0.09 * (f - 1)));
      boss._ehtTitle = '👑 Guardião da Fenda · Andar ' + f;
    },
    riftSummon() {
      if (!P.eht || !P.eht.summonFieldBoss) return { ok: false, reason: 'A Fenda ainda não despertou.' };
      const s = this.st();
      const res = P.eht.summonFieldBoss(this.riftZone(s.rift.floor));
      if (res && res.ok) {
        P.log('👑 A Fenda se abriu no ' + ZONE_NAME(this.riftZone(s.rift.floor)) + ': Guardião do Andar ' + s.rift.floor + ' convocado.', 'warn');
        this.emit('rift', { floor: s.rift.floor, summon: true });
      }
      return res || { ok: false, reason: 'Não foi possível abrir a Fenda.' };
    },
    riftDismiss() {
      const boss = this.riftBoss();
      if (!boss) return false;
      boss.dead = true; boss.hp = 0; boss.respawnAt = Infinity;
      for (const n of P.heroes.list()) if (n.exp && n.exp.targetId === boss.id) { n.exp.targetId = null; n.exp.combat = null; }
      P.log('A Fenda foi selada: o Guardião recuou. O andar ' + this.st().rift.floor + ' continua à espera.', 'info');
      this.emit('rift', { dismissed: true });
      return true;
    },
    onRiftKill(npc, mon) {
      const s = this.st(), f = mon._ascRift || s.rift.floor, r = this.riftReward(f);
      s.rift.best = Math.max(s.rift.best, f);
      s.rift.floor = f + 1;
      s.bossKills++;
      s.selos += r.selos;
      P.state.treasury = (P.state.treasury || 0) + r.gold;
      this.flowAdd('loot', 0);
      this.bountyProgress('rift', 1);
      P.log('👑 Andar ' + f + ' da Fenda vencido por ' + npc.name + '! +' + r.gold + ' moedas, +' + r.selos + ' Selo(s) de Renome.', 'good');
      this.gain(r.xp, 'rift');
      this.persist();
      this.emit('riftkill', { floor: f, reward: r, x: mon.x, y: mon.y, hero: npc.name });
    },

    /* --------------------------- contratos --------------------------- */
    bountyText(b) {
      if (b.t === 'kill') return 'Abata ' + b.need + ' monstros em ' + ZONE_NAME(b.zone);
      if (b.t === 'any') return 'Abata ' + b.need + ' monstros na fronteira';
      if (b.t === 'elite') return 'Derrote ' + b.need + ' Mini-Chefe' + (b.need > 1 ? 's' : '');
      if (b.t === 'sell') return 'Heróis vendem ' + b.need + ' moedas em espólios';
      if (b.t === 'rift') return 'Vença um Guardião da Fenda';
      if (b.t === 'export') return 'Exporte ' + b.need + ' moedas pelo Mercado';
      return 'Contrato';
    },
    rollBounties(day) {
      const s = this.st(), l = s.lvl, bs = s.bounties;
      if (bs.day && bs.day !== day) {
        // fecha o dia anterior: paga o que ficou pronto e decide a sequência
        for (const b of bs.list) if (b.prog >= b.need && !b.claimed) this.claimBounty(b.id, true);
        if (!bs.chest) bs.streak = 0;
      }
      const rng = P.makeRng(hash('asc:bounty:' + (P.state.seed || 1) + ':' + day));
      const zones = (P.ZONES || []).map((z) => z.id);
      const pool = [
        { t: 'kill', zone: zones[rng.int(0, Math.max(0, zones.length - 1))] || 'ermos', need: 30 + Math.min(120, 5 * l) },
        { t: 'any', need: 70 + Math.min(300, 10 * l) },
        { t: 'elite', need: 2 + Math.min(8, Math.floor(l / 3)), rich: true },
        { t: 'sell', need: 300 + 60 * l },
      ];
      if (l >= 2) pool.push({ t: 'export', need: 60 + 20 * l });
      if (l >= 3) pool.push({ t: 'rift', need: 1, rich: true });
      const list = [];
      while (list.length < 3 && pool.length) {
        const b = pool.splice(rng.int(0, pool.length - 1), 1)[0];
        const k = b.rich ? 1.6 : 1;
        list.push(Object.assign(b, { id: 'b' + day + '_' + list.length, prog: 0, claimed: false, gold: Math.round((50 + 14 * l) * k), xp: Math.round((30 + 8 * l) * k) }));
      }
      bs.day = day; bs.list = list; bs.chest = false; bs.defeats = 0;
      this.emit('bounties', {});
    },
    bountyProgress(type, n, zone) {
      if (P._testMode || !(n > 0)) return;
      const bs = this.st().bounties;
      for (const b of bs.list) {
        if (b.claimed || b.prog >= b.need || b.t !== type) continue;
        if (b.t === 'kill' && b.zone !== zone) continue;
        b.prog = Math.min(b.need, b.prog + n);
        if (b.prog >= b.need) {
          if (P.audio && P.audio.play) try { P.audio.play('coin'); } catch (e) { /* ok */ }
          this.emit('bountyready', { b });
        }
      }
    },
    streakBonus() { return 1 + Math.min(1, 0.1 * (this.st().bounties.streak || 0)); },
    claimBounty(id, silent) {
      const s = this.st(), bs = s.bounties, b = bs.list.find((x) => x.id === id);
      if (!b || b.claimed || b.prog < b.need) return { ok: false };
      b.claimed = true;
      const gold = Math.round(b.gold * this.streakBonus());
      P.state.treasury = (P.state.treasury || 0) + gold;
      s.stats.bounties++;
      if (!silent && P.audio && P.audio.play) try { P.audio.play('coin'); } catch (e) { /* ok */ }
      P.log('📜 Contrato cumprido: ' + this.bountyText(b) + '. +' + gold + ' moedas.', 'good');
      this.gain(b.xp, 'bounty');
      let chest = null;
      if (bs.list.every((x) => x.claimed) && !bs.chest) chest = this.openChest();
      this.persist();
      this.emit('claim', { b, gold, chest, silent: !!silent });
      return { ok: true, gold, chest };
    },
    openChest() {
      const s = this.st(), bs = s.bounties;
      bs.chest = true; bs.streak = (bs.streak || 0) + 1;
      s.selos += 1;
      let item = null;
      try {
        if (P.eht && P.eht.makeItem) {
          const tier = clamp(1 + Math.floor(s.lvl / 4), 1, 10);
          const slots = ['arma', 'armadura', 'elmo', 'luvas', 'botas', 'anel', 'amuleto'];
          item = P.eht.makeItem(slots[hash('chest' + bs.day) % slots.length], tier, s.lvl >= 12 ? 'lendario' : 'epico', 'asc:chest:' + bs.day);
          const est = P.eht.st();
          est.bag.unshift(item);
          if (est.autoEquip && P.eht.autoEquipAll) P.eht.autoEquipAll(true);
        }
      } catch (e) { item = null; }
      P.log('🎁 Baú do dia aberto (sequência de ' + bs.streak + ' dia' + (bs.streak > 1 ? 's' : '') + '): +1 Selo de Renome' + (item ? ' e ' + item.name : '') + '.', 'good');
      return { selos: 1, item: item ? item.name : null, streak: bs.streak };
    },

    /* ----------------------------- mercado ----------------------------- */
    LOOT_GOODS: ['couro', 'presa', 'pena', 'erva', 'minerio', 'reliquia', 'carne'],
    flowAdd(k, v) {
      const f = this.st().flow;
      if (f.day !== P.state.day) this.flowRoll();
      this.st().flow[k] = (this.st().flow[k] || 0) + v;
    },
    flowRoll() {
      const s = this.st();
      if (s.flow.day) { s.flowHist.push(Object.assign({}, s.flow)); if (s.flowHist.length > 7) s.flowHist.shift(); }
      s.flow = { day: P.state.day, loot: 0, spend: 0, exportG: 0, importG: 0, kills: 0, cargo: 0 };
    },
    price(id) { return P.economy && P.economy.priceOf ? P.economy.priceOf(id) : 0; },
    priceRatio(id) { const g = P.GOODS[id]; return g ? this.price(id) / g.base : 1; },
    sampleHistory() {
      const s = this.st();
      for (const id of Object.keys(P.GOODS || {})) {
        const h = s.hist[id] || (s.hist[id] = []);
        h.push(+this.price(id).toFixed(1));
        if (h.length > 24) h.shift();
      }
    },
    exportPrice(id) { return this.price(id) * 0.72 * (1 + 0.04 * (this.st().bless.comercio || 0)); },
    cargoMax() { return 30 + 5 * this.st().lvl; },
    cargoLeft() { const s = this.st(); if (s.flow.day !== P.state.day) this.flowRoll(); return Math.max(0, this.cargoMax() - (this.st().flow.cargo || 0)); },
    importPrice(id) { return this.price(id) * 1.3; },
    exportGood(id, qty) {
      const eco = P.economy, g = P.GOODS[id];
      if (!eco || !g) return { ok: false, reason: 'Mercado indisponível.' };
      const have = Math.floor(eco.stock[id] || 0);
      const left = this.cargoLeft();
      if (left <= 0) return { ok: false, reason: 'As caravanas de hoje já partiram cheias. Voltam ao amanhecer.' };
      const n = Math.min(qty, have, left);
      if (n <= 0) return { ok: false, reason: 'Sem estoque de ' + g.name + '.' };
      let total = 0;
      for (let i = 0; i < n; i++) { total += this.exportPrice(id); eco.stock[id] -= 1; }
      total = Math.round(total);
      P.state.treasury = (P.state.treasury || 0) + total;
      eco.cash = (eco.cash || 0) + total * 0.3;          // a caravana também deixa moedas na praça
      this.flowAdd('exportG', total);
      this.flowAdd('cargo', n);
      this.bountyProgress('export', total);
      if (P.audio && P.audio.play) try { P.audio.play('coin'); } catch (e) { /* ok */ }
      this.emit('trade', { id, n, total, dir: 'export' });
      return { ok: true, n, total };
    },
    importGood(id, qty) {
      const eco = P.economy, g = P.GOODS[id];
      if (!eco || !g) return { ok: false, reason: 'Mercado indisponível.' };
      const cap = g.capacity || g.target * 2;
      const n = Math.min(qty, Math.floor(cap - (eco.stock[id] || 0)));
      if (n <= 0) return { ok: false, reason: 'Armazém de ' + g.name + ' cheio.' };
      let total = 0, got = 0;
      for (let i = 0; i < n; i++) {
        const c = this.importPrice(id);
        if ((P.state.treasury || 0) - total < c) break;
        total += c; eco.stock[id] = (eco.stock[id] || 0) + 1; got++;
      }
      if (!got) return { ok: false, reason: 'Cofre insuficiente.' };
      total = Math.round(total);
      P.state.treasury -= total;
      this.flowAdd('importG', total);
      this.emit('trade', { id, n: got, total, dir: 'import' });
      return { ok: true, n: got, total };
    },

    /* ------------------------------ ganchos ------------------------------ */
    onKill(npc, mon, x0, c0) {
      if (P._testMode || !npc || !mon) return;
      const s = this.st(), tier = Math.max(1, Number(mon.rank) || 1);
      s.kills++;
      this.flowAdd('kills', 1);
      // sabedoria + bônus de nível do reino
      // ritmo de RPG longo: a experiência rende menos a cada rank; Sabedoria e a ameaça devolvem parte
      const dx = (npc.xp || 0) - x0;
      if (dx > 0) {
        const ri = P.rankIndex(npc.rank || 'E');
        const pace = 0.08 / (1 + 0.45 * ri);
        const gained = Math.max(1, Math.round(dx * pace * (1 + (this.xpMult() - 1) * 0.5 + 0.05 * s.bless.sabedoria)));
        npc.xp = Math.max((P.HERO_XP && P.HERO_XP[npc.rank || 'E']) || 0, x0 + gained);
      }
      // a bolsa do herói enche pelos espólios vendidos, não só pelo abate
      const dc = (npc.coins || 0) - c0;
      if (dc > 0) npc.coins = c0 + dc * 0.25 * (1 + 0.05 * s.bless.fortuna);
      // maestria
      const m = s.mastery[npc.id] || (s.mastery[npc.id] = { k: 0 });
      const before = this.masteryLevel(m.k);
      m.k += mon.role === 'lider' ? 12 : mon.role === 'general' ? 4 : 1;
      const after = this.masteryLevel(m.k);
      if (after > before) {
        const h = P.eht && P.eht.heroData ? P.eht.heroData(npc) : null;
        if (h) h.statsCacheKey = '';
        this.emit('mastery', { npc, lvl: after });
      }
      this.onWinDDA();
      try { this.passTrial(npc, mon); } catch (e) { /* ok */ }
      this.bountyProgress('any', 1);
      this.bountyProgress('kill', 1, mon.zone);
      if (mon.role === 'general') this.bountyProgress('elite', 1);
      if (mon._ehtFieldBoss) this.onRiftKill(npc, mon);
      this.gain(Math.round((1 + tier) * (mon.role === 'lider' ? 12 : mon.role === 'general' ? 4 : 1)), 'kill');
      this.emit('kill', { npc, mon });
    },
    onSale(npc, res) {
      if (P._testMode || !res || !(res.revenue > 0)) return;
      const s = this.st();
      let rev = res.revenue;
      if (s.bless.fortuna) { const extra = rev * 0.05 * s.bless.fortuna; npc.coins = (npc.coins || 0) + extra; rev += extra; }
      s.stats.goldEarned += rev;
      this.flowAdd('loot', Math.round(rev));
      this.bountyProgress('sell', Math.round(rev));
      this._coins[npc.id] = npc.coins;
      this.emit('sale', { npc, revenue: Math.round(rev), sold: res.sold });
    },

    /* dízimo da guilda: a cada amanhecer os heróis repassam parte do que acumularam ao cofre */
    tithe() {
      if (P._testMode) return;
      let total = 0;
      for (const n of P.heroes.list()) {
        const extra = (n.coins || 0) - 500;
        if (extra <= 0) continue;
        const pay = Math.round(extra * 0.08);
        n.coins -= pay; total += pay;
        this._coins[n.id] = n.coins;
      }
      if (total > 0) {
        P.state.treasury = (P.state.treasury || 0) + total;
        this.st().flow.tithe = total;
        P.log('A guilda recolheu ' + total + ' moedas de dízimo dos heróis para o cofre do reino.', 'econ');
      }
    },

    _coins: {},
    _acc: 0, _hourKey: -1,
    step() {
      if (P._testMode || !P.state) return;
      this.scaleMonsters(false);
      const now = performance.now();
      if (now - this._acc < 700) return;
      this._acc = now;
      const s = this.st();
      if (s.bounties.day !== P.state.day) this.rollBounties(P.state.day);
      if (s.flow.day !== P.state.day) this.flowRoll();
      try { this.keepTrials(); } catch (e) { /* ok */ }
      const boss = this.riftBoss();
      if (boss) this.riftScale(boss);
      // gasto dos heróis (poções, forja, taverna): vira giro para o mercado
      for (const n of P.heroes.list()) {
        const c = n.coins || 0, last = this._coins[n.id];
        if (last != null && c < last - 0.5) {
          const spent = last - c;
          s.flow.spend += spent;
          if (P.economy) P.economy.cash = (P.economy.cash || 0) + spent * 0.35;
        }
        this._coins[n.id] = c;
      }
      const hk = P.state.day * 24 + Math.floor(P.state.minute / 60);
      if (hk !== this._hourKey) { this._hourKey = hk; this.sampleHistory(); if (hk % 6 === 0) this.persist(); }
    },

    /* ------------------------------ instalação ------------------------------ */
    wrap() {
      const self = this;
      if (P.heroes && P.heroes.win && !P.heroes.win._asc) {
        const W = P.heroes.win;
        P.heroes.win = function (npc, mon) {
          const x0 = (npc && npc.xp) || 0, c0 = (npc && npc.coins) || 0;
          const out = W.apply(this, arguments);
          try { self.onKill(npc, mon, x0, c0); } catch (e) { /* ok */ }
          return out;
        };
        P.heroes.win._asc = true;
      }
      if (P.heroes && P.heroes.defeat && !P.heroes.defeat._asc) {
        const D = P.heroes.defeat;
        P.heroes.defeat = function (npc, mon) {
          const out = D.apply(this, arguments);
          try { if (!P._testMode) { self.onDefeatDDA(mon); self.emit('defeat', { npc, mon }); } } catch (e) { /* ok */ }
          return out;
        };
        P.heroes.defeat._asc = true;
      }
      if (P.economy && P.economy.sell && !P.economy.sell._asc) {
        const S = P.economy.sell;
        P.economy.sell = function (npc) {
          const out = S.apply(this, arguments);
          try { self.onSale(npc, out); } catch (e) { /* ok */ }
          return out;
        };
        P.economy.sell._asc = true;
      }
      if (P.loot && P.loot.sellExtra && !P.loot.sellExtra._asc) {
        // o bônus de raridade vinha cunhando moedas demais: a guilda paga 12% do antigo valor
        const SE = P.loot.sellExtra;
        P.loot.sellExtra = function (npc) {
          const c0 = (npc && npc.coins) || 0;
          const out = SE.apply(this, arguments);
          try { const g = (npc.coins || 0) - c0; if (g > 0 && !P._testMode) npc.coins = c0 + g * 0.12; } catch (e) { /* ok */ }
          return P._testMode ? out : out * 0.12;
        };
        P.loot.sellExtra._asc = true;
      }
      if (P.economy && P.economy.priceOf && !P.economy.priceOf._asc) {
        // preço mais vivo: escassez encarece até +90%, excesso derruba até −55%
        const PO = P.economy.priceOf;
        P.economy.priceOf = function (id) {
          const base = PO.apply(this, arguments);
          const g = P.GOODS[id];
          if (!g || P._testMode) return base;
          const stock = this.stock[id] || 0;
          const f0 = clamp(1 + ((g.target - stock) / g.target) * 0.2, 0.8, 1.2);
          const f1 = clamp(1 + ((g.target - stock) / g.target) * 0.75, 0.45, 1.9);
          return Math.round(base / f0 * f1 * 10) / 10;
        };
        P.economy.priceOf._asc = true;
      }
      if (P.eht && P.eht.totalsOf && !P.eht.totalsOf._asc) {
        const TO = P.eht.totalsOf;
        P.eht.totalsOf = function (npc) {
          const t = TO.apply(this, arguments);
          if (!t || !npc || npc.group !== 'cacador' || P._testMode) return t;
          const b = self.heroBonus(npc);
          if (!b.atkPct && !b.hpPct) return t;
          const o = Object.assign({}, t);
          o.atkPct = (t.atkPct || 0) + b.atkPct;
          o.hpPct = (t.hpPct || 0) + b.hpPct;
          return o;
        };
        P.eht.totalsOf._asc = true;
      }
      if (P.eht && !P.eht.difficultyOf._asc) {
        P.eht.difficultyOf = function () { return self.difficulty(); };
        P.eht.difficultyOf._asc = true;
        P.eht.DIFFICULTIES = [];
      }
      if (P.eht && P.eht.summonFieldBoss && !P.eht.summonFieldBoss._asc) {
        const SF = P.eht.summonFieldBoss;
        P.eht.summonFieldBoss = function () {
          const res = SF.apply(this, arguments);
          try { if (res && res.ok) self.riftScale(res.boss || self.riftBoss()); } catch (e) { /* ok */ }
          return res;
        };
        P.eht.summonFieldBoss._asc = true;
      }
      if (P.aiHero && P.aiHero.chooseZone && !P.aiHero.chooseZone._asc) {
        // a guilda se espalha: ninguém lota uma única zona enquanto outra de mesmo nível está vazia
        const CZ = P.aiHero.chooseZone;
        P.aiHero.chooseZone = function (npc) {
          const pick = CZ.apply(this, arguments);
          try {
            if (P._testMode || !pick || !pick.id || !npc || !Array.isArray(P.ZONES) || !P.ZONES.some((z) => z.id === pick.id)) return pick;
            const tier = (id) => { const sec = P.state.sectors && P.state.sectors[id]; return P.rankIndex((sec && sec.band) || 'E'); };
            const count = {};
            for (const z of P.ZONES) count[z.id] = 0;
            const hs = P.heroes.list();
            for (const h of hs) if (h !== npc && h.exp && h.exp.zone && count[h.exp.zone] != null && h.exp.mode !== 'voltando' && h.exp.mode !== 'caido') count[h.exp.zone]++;
            const cap = Math.max(2, Math.ceil(hs.length / P.ZONES.length));
            if (count[pick.id] < cap) return pick;
            const alt = P.ZONES.filter((z) => z.id !== pick.id && tier(z.id) <= tier(pick.id) && count[z.id] < count[pick.id]).sort((x, y) => count[x.id] - count[y.id])[0];
            return alt ? Object.assign({}, pick, { id: alt.id, name: alt.name }) : pick;
          } catch (e) { return pick; }
        };
        P.aiHero.chooseZone._asc = true;
      }
      if (P.r11 && !P.r11._asc) {
        P.r11._asc = true;
        P.r11.pref = function () { return 'dinamica'; };
        P.r11.rowHtml = function () { return ''; };
        P.r11.set = function () { /* dificuldade agora é gradual */ };
      }
    },

    install() {
      if (!P.state || !P.heroes || !P.heroes.list || !P.eht) return false;
      if (!this._installed) {
        this._installed = true;
        this.restore();
        const s = this.st();
        const self = this;
        if (P.save && !P.save._asc) {
          const SV = P.save;
          P.save = function () { const ok = SV.apply(this, arguments); self.persist(); return ok; };
          P.save._asc = true;
        }
        if (P.load && !P.load._asc) {
          const LD = P.load;
          P.load = function () { const ok = LD.apply(this, arguments); try { self.restore(); self.st(); self.applyDifficulty(true); self.emit('load', {}); } catch (e) { /* ok */ } return ok; };
          P.load._asc = true;
        }
        if (P.resetGame && !P.resetGame._asc) {
          const RG = P.resetGame;
          P.resetGame = function () {
            try { localStorage.removeItem(SLOT_KEY()); localStorage.removeItem('aurora.eht.state'); localStorage.removeItem('aurora.rpg.cityEvo'); } catch (e) { /* ok */ }
            return RG.apply(this, arguments);
          };
          P.resetGame._asc = true;
        }
        if (P.hooks && P.hooks.step) P.hooks.step.push(() => self.step());
        if (P.hooks && P.hooks.newDay) P.hooks.newDay.push((day) => { try { const kills = self.st().flow.kills || 0; self.rollBounties(day); self.flowRoll(); self.dailyDDA(kills); self.tithe(); self.gain(10 + 2 * self.st().lvl, 'day'); self.persist(); } catch (e) { /* ok */ } });
        // jornada nova: heróis começam com bolsa modesta — o ouro vem dos espólios
        if (!s.coinsInit) {
          s.coinsInit = true;
          if (P.state.day <= 1 && !P._testMode) {
            for (const n of P.heroes.list()) {
              try { P.eht.heroData(n); } catch (e) { /* ok */ }
              n.coins = 90 + (hash(n.id + ':bolsa') % 90);
            }
          }
        }
        if (s.bounties.day !== P.state.day) this.rollBounties(P.state.day);
      }
      this.wrap();
      this.applyDifficulty(true);
      this.raiseBands(false);
      return true;
    },
  });

  function tryInstall() {
    try { if (A.install() && P.ascUI && P.ascUI.install) P.ascUI.install(); } catch (e) { console.warn('Aurora Ascensão:', e); }
  }
  const prevInit = P.init;
  P.init = function () { const out = prevInit ? prevInit.apply(this, arguments) : undefined; tryInstall(); return out; };
  window.addEventListener('DOMContentLoaded', () => setTimeout(tryInstall, 0));
  for (const ms of [400, 1200, 2500, 5000]) setTimeout(tryInstall, ms);
  setInterval(() => { if (A._installed) A.wrap(); }, 4000);
})();
