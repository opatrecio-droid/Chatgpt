/* 34-vocacoes: v20 — árvore de vocações e habilidades, Artes Secretas, Despertar, montarias e Estábulo,
   decoração da cidade, Armazém (capacidade, desmonte, reserva), ordens em massa, cura paga e o Mascate. Sem DOM. */
'use strict';
(function () {
  const Wd = G.W;

  /* ================= vocações ================= */
  /* habilidade passiva de cada classe-base (a "segunda habilidade básica") */
  G.PASSIVES = {
    esp: { name: 'Postura Firme', desc: '+5% de ataque.', p: { atk: 0.05 } },
    cav: { name: 'Couraça Viva', desc: '+6% de defesa.', p: { def: 0.06 } },
    arq: { name: 'Olho Treinado', desc: '+4% de chance de crítico.', p: { crit: 0.04 } },
    mag: { name: 'Mente Arcana', desc: 'Habilidades recarregam 8% mais rápido.', p: { cdr: 0.08 } },
    pal: { name: 'Fé Inabalável', desc: '+6% de vida.', p: { hp: 0.06 } },
    lad: { name: 'Mãos Leves', desc: '+10% de moedas dos monstros.', p: { gold: 0.1 } },
  };
  /* ops de habilidade: hit (alvo), aoe (área), multi (vários alvos), stun, slow, dot, vuln, buff, heal, shield, cleanse */
  const J = (base, t, from, name, desc, p, skill) => ({ base, t, from, name, desc, p, skill });
  G.JOBS = {
    /* ---- Espadachim ---- */
    duelista: J('esp', 2, null, 'Duelista', 'Velocidade e precisão: vence no detalhe.', { crit: 0.06, aspd: 0.08 },
      { name: 'Estocada Dupla', cd: 8, desc: 'Dois golpes seguidos de 130% no alvo.', ops: [{ o: 'hit', m: 1.3, n: 2 }] }),
    mercenario: J('esp', 2, null, 'Mercenário', 'Luta por ouro — e luta bem.', { hp: 0.1, gold: 0.1 },
      { name: 'Brado de Guerra', cd: 16, desc: 'Ele e os aliados próximos ganham +22% de ataque por 8 s.', ops: [{ o: 'buff', k: 'atk', v: 0.22, d: 8, r: 4.5 }] }),
    mestre_laminas: J('esp', 3, 'duelista', 'Mestre de Lâminas', 'Um redemoinho de aço.', { atk: 0.1, aspd: 0.06 },
      { name: 'Dança das Lâminas', cd: 13, desc: 'Cinco cortes de 85% distribuídos entre os inimigos próximos.', ops: [{ o: 'multi', m: 0.85, n: 5, r: 2.6 }] }),
    espada_fantasma: J('esp', 3, 'duelista', 'Espada Fantasma', 'O golpe chega antes do som.', { critDmg: 0.2, eva: 0.06 },
      { name: 'Corte Fantasma', cd: 14, desc: 'Crítico garantido de 300% que ignora metade da defesa.', ops: [{ o: 'hit', m: 3.0, crit: 1, pierce: 0.5 }] }),
    senhor_guerra: J('esp', 3, 'mercenario', 'Senhor da Guerra', 'Onde ele pisa, o chão treme.', { hp: 0.12, atk: 0.06 },
      { name: 'Terremoto', cd: 15, desc: '200% em área ampla e atordoa por 2 s.', ops: [{ o: 'aoe', m: 2.0, r: 2.8, at: 'self' }, { o: 'stun', d: 2, r: 2.8, at: 'self' }] }),
    santo_espada: J('esp', 3, 'mercenario', 'Santo da Espada', 'A lâmina que protege quem a empunha.', { atk: 0.08, hp: 0.08, def: 0.08 },
      { name: 'Lâmina da Aurora', cd: 14, desc: '250% ao redor do alvo e cura 12% da própria vida.', ops: [{ o: 'aoe', m: 2.5, r: 2.2, at: 'tgt' }, { o: 'heal', pct: 0.12 }] }),
    /* ---- Cavaleiro ---- */
    guardiao_aco: J('cav', 2, null, 'Guardião de Aço', 'Uma parede que anda.', { def: 0.12 },
      { name: 'Golpe de Escudo', cd: 10, desc: '140% no alvo e atordoa por 2,5 s.', ops: [{ o: 'hit', m: 1.4 }, { o: 'stun', d: 2.5 }] }),
    lanceiro: J('cav', 2, null, 'Lanceiro Errante', 'Troca o escudo pelo ímpeto.', { atk: 0.1, spd: 0.08 },
      { name: 'Investida', cd: 9, desc: 'Atravessa o alvo: 190% nele e em quem estiver ao redor.', ops: [{ o: 'aoe', m: 1.9, r: 1.8, at: 'tgt' }] }),
    baluarte: J('cav', 3, 'guardiao_aco', 'Baluarte Real', 'Enquanto ele estiver de pé, ninguém cai.', { hp: 0.15 },
      { name: 'Bastião', cd: 18, desc: 'Ele e os aliados próximos recebem 35% menos dano por 6 s.', ops: [{ o: 'buff', k: 'def', v: 0.35, d: 6, r: 4.5 }] }),
    sentinela: J('cav', 3, 'guardiao_aco', 'Sentinela de Espinhos', 'Bater nele dói.', { def: 0.08, thorns: 0.1 },
      { name: 'Carapaça de Espinhos', cd: 16, desc: 'Por 8 s devolve 45% do dano recebido e provoca os inimigos.', ops: [{ o: 'buff', k: 'thorns', v: 0.45, d: 8 }, { o: 'taunt', r: 4.5 }] }),
    lanca_dragao: J('cav', 3, 'lanceiro', 'Lança-Dragão', 'Cai do céu sobre a presa.', { atk: 0.12 },
      { name: 'Salto do Dragão', cd: 13, desc: '300% no alvo e 140% ao redor dele.', ops: [{ o: 'hit', m: 3.0 }, { o: 'aoe', m: 1.4, r: 2.2, at: 'tgt' }] }),
    marechal: J('cav', 3, 'lanceiro', 'Marechal', 'Comanda pelo exemplo.', { hp: 0.08, def: 0.08 },
      { name: 'Estandarte', cd: 18, desc: 'Aliados próximos: +18% de ataque e de velocidade de ataque por 8 s.', ops: [{ o: 'buff', k: 'atk', v: 0.18, d: 8, r: 5 }, { o: 'buff', k: 'aspd', v: 0.18, d: 8, r: 5 }] }),
    /* ---- Arqueiro ---- */
    atirador: J('arq', 2, null, 'Atirador de Elite', 'Um tiro, um alvo.', { crit: 0.08, rng: 0.6 },
      { name: 'Tiro Perfurante', cd: 9, desc: '240% no alvo, ignorando 60% da defesa.', ops: [{ o: 'hit', m: 2.4, pierce: 0.6 }] }),
    patrulheiro: J('arq', 2, null, 'Patrulheiro', 'Conhece cada trilha e cada veneno.', { eva: 0.08, spd: 0.08 },
      { name: 'Flecha Envenenada', cd: 9, desc: '120% e veneno: 40% do ataque por segundo durante 5 s.', ops: [{ o: 'hit', m: 1.2 }, { o: 'dot', m: 0.4, d: 5, c: '#9be08a' }] }),
    olho_falcao: J('arq', 3, 'atirador', 'Olho de Falcão', 'Enxerga a fraqueza de longe.', { crit: 0.1 },
      { name: 'Tiro Mortal', cd: 14, desc: '400% no alvo; 50% a mais se ele estiver abaixo de 35% de vida.', ops: [{ o: 'hit', m: 4.0, exec: [0.35, 1.5] }] }),
    cacador_feras: J('arq', 3, 'atirador', 'Caçador de Feras', 'Especialista em presas grandes.', { elite: 0.2 },
      { name: 'Marca do Caçador', cd: 15, desc: '150% e marca o alvo: ele sofre 30% a mais de dano por 8 s.', ops: [{ o: 'hit', m: 1.5 }, { o: 'vuln', f: 0.3, d: 8 }] }),
    guarda_bosque: J('arq', 3, 'patrulheiro', 'Guarda-Bosque', 'Cobre a clareira de flechas.', { aspd: 0.1 },
      { name: 'Saraivada', cd: 13, desc: 'Duas salvas de 110% em todos ao redor do alvo.', ops: [{ o: 'aoe', m: 1.1, r: 2.6, at: 'tgt', n: 2 }] }),
    vento_errante: J('arq', 3, 'patrulheiro', 'Vento Errante', 'Difícil de ver, impossível de acertar.', { eva: 0.08 },
      { name: 'Passo do Vento', cd: 16, desc: '+30% de esquiva e de velocidade de ataque por 7 s.', ops: [{ o: 'buff', k: 'eva', v: 0.3, d: 7 }, { o: 'buff', k: 'aspd', v: 0.3, d: 7 }] }),
    /* ---- Mago ---- */
    piromante: J('mag', 2, null, 'Piromante', 'Tudo queima, cedo ou tarde.', { atk: 0.1 },
      { name: 'Parede de Chamas', cd: 11, desc: '120% em área e queimadura de 35% por segundo durante 5 s.', ops: [{ o: 'aoe', m: 1.2, r: 2.4, at: 'tgt' }, { o: 'dot', m: 0.35, d: 5, r: 2.4, at: 'tgt', c: '#ff8a3a' }] }),
    criomante: J('mag', 2, null, 'Criomante', 'O frio protege quem o domina.', { hp: 0.1, def: 0.05 },
      { name: 'Lança de Gelo', cd: 10, desc: '200% no alvo e o congela por 2,5 s.', ops: [{ o: 'hit', m: 2.0 }, { o: 'stun', d: 2.5 }] }),
    arquimago: J('mag', 3, 'piromante', 'Arquimago', 'Chama o céu para a briga.', { atk: 0.12 },
      { name: 'Meteoro', cd: 16, desc: '360% em uma área enorme.', ops: [{ o: 'aoe', m: 3.6, r: 3.0, at: 'tgt' }] }),
    senhor_cinzas: J('mag', 3, 'piromante', 'Senhor das Cinzas', 'O fogo que não apaga.', { atk: 0.08, crit: 0.06 },
      { name: 'Combustão', cd: 15, desc: 'Incendeia todos ao redor do alvo: 60% por segundo durante 6 s.', ops: [{ o: 'dot', m: 0.6, d: 6, r: 3.5, at: 'tgt', c: '#ff8a3a' }] }),
    sabio_fenda: J('mag', 3, 'criomante', 'Sábio da Fenda', 'Dobra o espaço como papel.', { cdr: 0.12 },
      { name: 'Distorção', cd: 14, desc: '240% em área e lentidão de 50% por 5 s.', ops: [{ o: 'aoe', m: 2.4, r: 2.8, at: 'tgt' }, { o: 'slow', f: 0.5, d: 5, r: 2.8, at: 'tgt' }] }),
    tecelao: J('mag', 3, 'criomante', 'Tecelão do Inverno', 'Costura a nevasca no ar.', { hp: 0.1, def: 0.1 },
      { name: 'Nevasca', cd: 16, desc: 'Quatro rajadas de 90% em área e congela por 1,5 s.', ops: [{ o: 'aoe', m: 0.9, r: 2.8, at: 'tgt', n: 4 }, { o: 'stun', d: 1.5, r: 2.8, at: 'tgt' }] }),
    /* ---- Paladino ---- */
    cruzado: J('pal', 2, null, 'Cruzado da Aurora', 'A fé na ponta do martelo.', { atk: 0.1 },
      { name: 'Golpe Sagrado', cd: 9, desc: '220% no alvo e cura 8% da própria vida.', ops: [{ o: 'hit', m: 2.2 }, { o: 'heal', pct: 0.08 }] }),
    clerigo: J('pal', 2, null, 'Clérigo de Batalha', 'Reza de armadura.', { heal: 0.25 },
      { name: 'Bênção', cd: 16, sup: 1, desc: 'Aliados próximos: 18% menos dano e regeneram 3% da vida por segundo por 6 s.', ops: [{ o: 'buff', k: 'def', v: 0.18, d: 6, r: 4.5 }, { o: 'buff', k: 'regen', v: 0.03, d: 6, r: 4.5 }] }),
    avatar: J('pal', 3, 'cruzado', 'Avatar das Duas Luas', 'As luas lutam através dele.', { atk: 0.08, hp: 0.08 },
      { name: 'Julgamento', cd: 15, desc: '280% em todos ao redor e cura 10% da vida dos aliados próximos.', ops: [{ o: 'aoe', m: 2.8, r: 2.5, at: 'self' }, { o: 'heal', pct: 0.1, r: 4 }] }),
    inquisidor: J('pal', 3, 'cruzado', 'Inquisidor', 'Sentencia e executa.', { crit: 0.1 },
      { name: 'Sentença', cd: 14, desc: '340% no alvo e atordoa por 2 s.', ops: [{ o: 'hit', m: 3.4 }, { o: 'stun', d: 2 }] }),
    sumo_sacerdote: J('pal', 3, 'clerigo', 'Sumo Sacerdote', 'Ninguém cai no turno dele.', { heal: 0.25, hp: 0.06 },
      { name: 'Renovação', cd: 18, sup: 1, desc: 'Cura 40% da vida dos aliados próximos e limpa venenos e queimaduras.', ops: [{ o: 'heal', pct: 0.4, r: 4.5 }, { o: 'cleanse', r: 4.5 }] }),
    guardiao_luz: J('pal', 3, 'clerigo', 'Guardião da Luz', 'Um escudo para cada aliado.', { def: 0.12 },
      { name: 'Égide Sagrada', cd: 18, sup: 1, desc: 'Aliados próximos ganham um escudo de 30% da vida máxima por 8 s.', ops: [{ o: 'shield', pct: 0.3, d: 8, r: 4.5 }] }),
    /* ---- Ladino ---- */
    sombra: J('lad', 2, null, 'Sombra Veloz', 'Você só vê quando já acabou.', { crit: 0.08, eva: 0.06 },
      { name: 'Emboscada', cd: 9, desc: 'Crítico garantido de 280%.', ops: [{ o: 'hit', m: 2.8, crit: 1 }] }),
    trapaceiro: J('lad', 2, null, 'Trapaceiro', 'A sorte ajuda quem a rouba.', { gold: 0.2, drop: 0.1 },
      { name: 'Bomba de Fumaça', cd: 14, desc: 'Atordoa os inimigos próximos por 3 s e dá +30% de esquiva por 5 s.', ops: [{ o: 'stun', d: 3, r: 2.5, at: 'self' }, { o: 'buff', k: 'eva', v: 0.3, d: 5 }] }),
    fantasma: J('lad', 3, 'sombra', 'Fantasma da Meia-Noite', 'Mil cortes num piscar.', { aspd: 0.12 },
      { name: 'Mil Cortes', cd: 12, desc: 'Seis golpes de 70% no alvo.', ops: [{ o: 'hit', m: 0.7, n: 6 }] }),
    carrasco: J('lad', 3, 'sombra', 'Carrasco', 'Termina o que os outros começam.', { crit: 0.12 },
      { name: 'Execução', cd: 13, desc: '300% no alvo; dano dobrado se ele estiver abaixo de 30% de vida.', ops: [{ o: 'hit', m: 3.0, exec: [0.3, 2] }] }),
    rei_ladroes: J('lad', 3, 'trapaceiro', 'Rei dos Ladrões', 'Sai da caçada mais rico que entrou.', { gold: 0.25, drop: 0.15 },
      { name: 'Grande Golpe', cd: 13, desc: '240% e arranca uma bolsa cheia de moedas do alvo.', ops: [{ o: 'hit', m: 2.4, gold: 6 }] }),
    envenenador: J('lad', 3, 'trapaceiro', 'Envenenador', 'Uma gota basta.', { atk: 0.08 },
      { name: 'Lâmina Tóxica', cd: 11, desc: '150% e veneno forte: 70% do ataque por segundo durante 6 s.', ops: [{ o: 'hit', m: 1.5 }, { o: 'dot', m: 0.7, d: 6, c: '#9be08a' }] }),
  };
  G.JOB_IDS = Object.keys(G.JOBS);
  G.jobTier = (h) => (h.j3 ? 3 : h.j2 ? 2 : 1);
  G.heroPeak = (h) => (h.stars > 0 ? 7 : h.rank);
  G.jobBranches = (cls, t, from) => G.JOB_IDS.filter((id) => { const j = G.JOBS[id]; return j.base === cls && j.t === t && (t === 2 || !from || j.from === from); });
  G.jobOptions = (h) => { const t = G.jobTier(h); return t >= 3 ? [] : G.jobBranches(h.cls, t + 1, h.j2); };
  G.jobReq = (t) => (t === 2 ? { rank: 2, gold: 600, cost: { emb2: 1, tomo: 2 } } : { rank: 4, gold: 4000, cost: { emb4: 1, tomo: 5, alma: 1 } });
  G.jobReady = (h) => { const t = G.jobTier(h) + 1; return t <= 3 && G.heroPeak(h) >= G.jobReq(t).rank; };
  G.canJob = (h) => { if (!G.jobReady(h)) return false; const q = G.jobReq(G.jobTier(h) + 1); return G.S.gold >= q.gold && G.hasRes(q.cost); };
  G.changeJob = (h, id) => {
    const j = G.JOBS[id]; if (!j || !G.canJob(h) || G.jobOptions(h).indexOf(id) < 0) return false;
    const q = G.jobReq(j.t);
    G.spend(q.gold, 'promocao'); G.payRes(q.cost);
    if (j.t === 2) { h.j2 = id; h.tS2 = 2; } else { h.j3 = id; h.tS3 = 3; }
    h._dirty = true; h.hp = G.heroStats(h).hp; h.animo = 100; G.artGain(h, 5);
    G.S.stats.jobs = (G.S.stats.jobs || 0) + 1;
    G.log(h.name + ' abraçou a vocação de ' + j.name + ' e aprendeu ' + j.skill.name + '.', 'epic');
    G.addFx({ t: 'promo', x: h.x, y: h.y }); G.sfx('promo'); G.gainRealm(40 * j.t, 'promo'); G.emit('promo', h);
    return true;
  };
  G.jobResetCost = () => 3;
  G.jobReset = (h) => {
    const S = G.S; if (!h.j2 || S.selos < G.jobResetCost()) return false;
    S.selos -= G.jobResetCost(); h.j2 = null; h.j3 = null; h._dirty = true;
    G.log(h.name + ' abandonou a antiga vocação e pode escolher outro caminho.', 'info'); G.emit('promo', h);
    return true;
  };

  /* nível das habilidades (1–10), treinado com Tomos de Técnica no Campo de Treino */
  G.heroSkills = (h) => [G.CLASSES[h.cls].skill, h.j2 && G.JOBS[h.j2] ? G.JOBS[h.j2].skill : null, h.j3 && G.JOBS[h.j3] ? G.JOBS[h.j3].skill : null];
  G.skillLvl = (h, i) => (h.sk && h.sk[i]) || 1;
  G.skillPow = (h, i) => 1 + 0.06 * (G.skillLvl(h, i) - 1);
  G.skillCap = () => Math.min(10, 1 + 2 * G.bLvl('treino'));
  G.skillUpCost = (h, i) => { const l = G.skillLvl(h, i); return { gold: Math.round(70 * G.PM(h.lvl) * l * (1 + 0.5 * i)), cost: { tomo: l * (i === 2 ? 2 : 1) } }; };
  G.canSkillUp = (h, i) => {
    if (!G.heroSkills(h)[i]) return { ok: false, why: 'Habilidade ainda não aprendida' };
    if (!G.bOk('treino')) return { ok: false, why: 'Requer o Campo de Treino' };
    if (G.skillLvl(h, i) >= G.skillCap()) return { ok: false, why: G.skillCap() >= 10 ? 'Nível máximo' : 'Melhore o Campo de Treino' };
    const c = G.skillUpCost(h, i);
    if (G.S.gold < c.gold) return { ok: false, why: 'Faltam moedas', c };
    if (!G.hasRes(c.cost)) return { ok: false, why: 'Faltam Tomos de Técnica', c };
    return { ok: true, c };
  };
  G.skillUp = (h, i) => {
    const r = G.canSkillUp(h, i); if (!r.ok) return false;
    G.spend(r.c.gold, 'treino'); G.payRes(r.c.cost);
    if (!h.sk) h.sk = [1, 1, 1]; h.sk[i] = G.skillLvl(h, i) + 1;
    G.sfx('rare'); G.emit('heroes'); return true;
  };

  /* ---------- execução das habilidades de vocação ---------- */
  const around = (mons, x, y, r) => { const out = []; for (const o of mons) if (!o.dead && !o.gone && Math.hypot(o.x - x, o.y - y) < r) out.push(o); return out; };
  const allies = (h, r) => { const out = []; for (const a of G.S.heroes) if (a.state !== 'fallen' && a.state !== 'recover' && !a.inside && (a === h || (r && G.dist(a, h) < r))) out.push(a); return out; };
  const setBuff = (a, k, v, d) => { const S = G.S; if (!a.bv) a.bv = {}; if (!(a.buff[k] > S.t) || (a.bv[k] || 0) <= v) a.bv[k] = v; a.buff[k] = Math.max(a.buff[k] || 0, S.t + d); };
  G.stunMon = (o, d) => { o.stun = Math.max(o.stun || 0, G.S.t + d * (o.boss ? 0.35 : o.elite ? 0.7 : 1)); };
  const runOps = (h, m, mons, sk, pow) => {
    const S = G.S, st = G.heroStats(h), c = G.CLASSES[h.cls], ranged = c.rng > 2;
    const tx = m.x, ty = m.y;
    for (const op of sk.ops) {
      const cx = op.at === 'self' ? h.x : tx, cy = op.at === 'self' ? h.y : ty;
      switch (op.o) {
        case 'hit':
          for (let i = 0; i < (op.n || 1); i++) {
            if (m.dead) break;
            let mult = op.m * pow; if (op.exec && m.hp < m.hpMax * op.exec[0]) mult *= op.exec[1];
            if (ranged) G.addFx({ t: 'proj', x: h.x, y: h.y - 0.55, tx: m.x + G.rnd(-0.15, 0.15), ty: m.y - 0.5, k: h.cls === 'mag' ? 'orb' : 'arrow', c: '#fff0a0', d: i * 0.07 });
            else G.addFx({ t: 'slash', x: m.x, y: m.y - 0.5, dir: h.dir, c: c.color, big: 1 });
            if (op.gold) { const g = Math.round(op.gold * 2 * G.PM(m.lvl)); h.gold += g; G.addFx({ t: 'coin', x: m.x, y: m.y - 0.4, n: g, tx: h.x, ty: h.y }); }
            G.dmgToMon(h, m, mult, !!op.crit, op.pierce ? { pierce: op.pierce } : null);
          }
          break;
        case 'aoe':
          for (let i = 0; i < (op.n || 1); i++) {
            G.addFx({ t: op.at === 'self' && !ranged ? 'spin' : 'boom', x: cx, y: cy - 0.3, c: h.cls === 'mag' ? '#b58cf2' : c.color, r: op.r, d: i * 0.12 });
            for (const o of around(mons, cx, cy, op.r)) G.dmgToMon(h, o, op.m * pow);
          }
          G.sfx('boom', cx, cy);
          break;
        case 'multi': {
          for (let i = 0; i < op.n; i++) { const l = around(mons, h.x, h.y, op.r); if (!l.length) break; const o = G.pick(l); G.addFx({ t: 'slash', x: o.x, y: o.y - 0.5, dir: i % 2 ? 1 : -1, c: c.color }); G.dmgToMon(h, o, op.m * pow); }
          break;
        }
        case 'stun': if (op.r) { for (const o of around(mons, cx, cy, op.r)) G.stunMon(o, op.d); } else if (!m.dead) G.stunMon(m, op.d); break;
        case 'slow': for (const o of op.r ? around(mons, cx, cy, op.r) : m.dead ? [] : [m]) { o.slow = S.t + op.d; o.slowF = 1 - op.f; } break;
        case 'dot': for (const o of op.r ? around(mons, cx, cy, op.r) : m.dead ? [] : [m]) o.dot = { dps: st.atk * op.m * pow, until: S.t + op.d, c: op.c || '#9be08a', by: h.id }; break;
        case 'vuln': if (!m.dead) { m.vuln = S.t + op.d; m.vulnF = op.f; } break;
        case 'taunt': for (const o of around(mons, h.x, h.y, op.r)) if (!o.boss) { o.tgt = h; if (o.state !== 'march') o.state = 'chase'; } break;
        case 'buff': for (const a of allies(h, op.r)) setBuff(a, op.k, op.v, op.d); G.addFx({ t: op.k === 'regen' ? 'healring' : 'shield', x: h.x, y: h.y - 0.5 }); break;
        case 'heal': { G.addFx({ t: 'healring', x: h.x, y: h.y - 0.3 }); G.sfx('heal', h.x, h.y); for (const a of allies(h, op.r)) { const as = G.heroStats(a), v = as.hp * op.pct * pow * (1 + st.healF); a.hp = Math.min(as.hp, a.hp + v); G.addFx({ t: 'dmg', x: a.x, y: a.y - 0.9, n: Math.round(v), c: '#7df09a', heal: 1 }); } break; }
        case 'shield': for (const a of allies(h, op.r)) { a.shield = G.heroStats(a).hp * op.pct * pow; a.buff.shield = S.t + op.d; G.addFx({ t: 'shield', x: a.x, y: a.y - 0.5 }); } break;
        case 'cleanse': for (const a of allies(h, op.r)) a.dot = null; break;
      }
    }
  };
  /* tenta usar a 2ª ou a 3ª habilidade; devolve true se usou */
  G.jobSkillTry = (h, m, mons, frac) => {
    for (let i = 1; i <= 2; i++) {
      const id = i === 1 ? h.j2 : h.j3; if (!id) continue;
      const key = i === 1 ? 'tS2' : 'tS3'; if (h[key] > 0) continue;
      const j = G.JOBS[id]; if (!j) continue;
      const sk = j.skill;
      if (sk.sup) { let need = frac < 0.75; if (!need) for (const a of G.S.heroes) if (a !== h && !a.inside && a.state !== 'fallen' && a.state !== 'recover' && G.dist(a, h) < 4.5 && a.hp < G.heroStats(a).hp * 0.7) { need = true; break; } if (!need) continue; }
      const st = G.heroStats(h);
      h[key] = sk.cd * (h.rank >= 4 || h.stars > 0 ? 0.9 : 1) * (1 - st.cdr);
      h.swing = 0.4; h.cast = 0.5; h.dir = m.x >= h.x ? 1 : -1;
      G.addFx({ t: 'text', x: h.x, y: h.y - 1.5, s: sk.name, c: '#ffe07a' });
      runOps(h, m, mons, sk, G.skillPow(h, i));
      return true;
    }
    return false;
  };

  /* ================= Artes Secretas ================= */
  G.ART_MAX = 100;
  G.ARTS = [
    { id: 'forca', name: 'Força', icon: 'sword', key: 'atk', per: 0.004, what: 'de ataque' },
    { id: 'vitalidade', name: 'Vitalidade', icon: 'heart', key: 'hp', per: 0.004, what: 'de vida' },
    { id: 'guarda', name: 'Guarda', icon: 'shield', key: 'def', per: 0.004, what: 'de defesa' },
    { id: 'precisao', name: 'Precisão', icon: 'target', key: 'crit', per: 0.0015, what: 'de chance de crítico' },
    { id: 'letalidade', name: 'Letalidade', icon: 'skull', key: 'critDmg', per: 0.005, what: 'de dano crítico' },
    { id: 'reflexos', name: 'Reflexos', icon: 'eye', key: 'eva', per: 0.0012, what: 'de esquiva' },
    { id: 'celeridade', name: 'Celeridade', icon: 'bolt', key: 'aspd', per: 0.0025, what: 'de velocidade de ataque' },
    { id: 'passos', name: 'Passos Leves', icon: 'run', key: 'spd', per: 0.002, what: 'de velocidade de movimento' },
    { id: 'foco', name: 'Foco', icon: 'spark', key: 'cdr', per: 0.002, what: 'de recarga mais rápida' },
    { id: 'premios', name: 'Caça-prêmios', icon: 'coin', key: 'gold', per: 0.005, what: 'de moedas dos monstros' },
    { id: 'rapina', name: 'Rapina', icon: 'bag', key: 'drop', per: 0.004, what: 'de espólio' },
    { id: 'estudo', name: 'Estudo', icon: 'book', key: 'xp', per: 0.004, what: 'de experiência' },
    { id: 'frugal', name: 'Frugalidade', icon: 'meal', key: 'hunger', per: -0.004, what: 'de fome mais lenta' },
    { id: 'folego', name: 'Fôlego', icon: 'zzz', key: 'tire', per: -0.004, what: 'de cansaço mais lento' },
    { id: 'serenidade', name: 'Serenidade', icon: 'smile', key: 'mood', per: 0.004, what: 'de ânimo natural' },
  ];
  G.ART = {}; for (const a of G.ARTS) G.ART[a.id] = a;
  G.ART_PRESET = { esp: ['forca', 'precisao', 'vitalidade', 'celeridade'], cav: ['guarda', 'vitalidade', 'forca', 'folego'], arq: ['forca', 'precisao', 'letalidade', 'celeridade'], mag: ['forca', 'foco', 'letalidade', 'vitalidade'], pal: ['vitalidade', 'guarda', 'foco', 'forca'], lad: ['precisao', 'letalidade', 'reflexos', 'premios'] };
  G.artLvl = (h, id) => (h.arts && h.arts[id]) || 0;
  G.artSpent = (h) => { let n = 0; for (const k in h.arts || {}) n += h.arts[k]; return n; };
  G.artGain = (h, n) => { h.ap = (h.ap || 0) + n; };
  G.artAdd = (h, id, n) => {
    if (!G.ART[id]) return 0; if (!h.arts) h.arts = {};
    n = Math.min(n, h.ap || 0, G.ART_MAX - G.artLvl(h, id)); if (!(n > 0)) return 0;
    h.arts[id] = G.artLvl(h, id) + n; h.ap -= n; h._dirty = true;
    G.S.stats.artes = (G.S.stats.artes || 0) + n;
    return n;
  };
  G.artAuto = (h) => {
    const pre = G.ART_PRESET[h.cls]; let tot = 0, guard = 0;
    while ((h.ap || 0) > 0 && guard++ < 2000) {
      let best = null, bl = 1e9;
      for (const id of pre) { const l = G.artLvl(h, id); if (l < G.ART_MAX && l < bl) { bl = l; best = id; } }
      if (!best) for (const a of G.ARTS) { const l = G.artLvl(h, a.id); if (l < G.ART_MAX && l < bl) { bl = l; best = a.id; } }
      if (!best) break;
      tot += G.artAdd(h, best, 1);
    }
    return tot;
  };
  G.artBuyCost = (h) => Math.round(150 * Math.pow(1.1, h.apB || 0) * (1 + 0.02 * h.lvl));
  G.artBuy = (h) => { if (!G.bOk('treino')) return false; if (!G.spend(G.artBuyCost(h), 'treino')) return false; h.apB = (h.apB || 0) + 1; G.artGain(h, 1); G.sfx('buy'); return true; };
  G.artResetCost = () => 1;
  G.artReset = (h) => { const S = G.S, n = G.artSpent(h); if (!n || S.selos < G.artResetCost()) return false; S.selos -= G.artResetCost(); h.arts = {}; h.ap = (h.ap || 0) + n; h._dirty = true; return true; };

  /* ================= Despertar ================= */
  G.WAKES = [
    { name: 'Centelha', rank: 2, gold: 1500, cost: { alma: 2, po_estelar: 5 }, perk: '+1 poção na bolsa' },
    { name: 'Chama', rank: 4, gold: 6000, cost: { alma: 5, po_estelar: 15 }, perk: '+15% de dano crítico' },
    { name: 'Fulgor', rank: 5, gold: 20000, cost: { alma: 10, po_estelar: 40 }, perk: 'habilidades recarregam 10% mais rápido' },
    { name: 'Transcendência', rank: 7, gold: 60000, cost: { alma: 20, po_estelar: 100, essencia: 10 }, perk: 'uma vez por dia, levanta da queda com metade da vida' },
  ];
  G.wakeNext = (h) => G.WAKES[h.wake || 0] || null;
  G.wakeReady = (h) => { const w = G.wakeNext(h); return !!w && G.heroPeak(h) >= w.rank; };
  G.canWake = (h) => { const w = G.wakeNext(h); return G.wakeReady(h) && G.S.gold >= w.gold && G.hasRes(w.cost); };
  G.wake = (h) => {
    if (!G.canWake(h)) return false; const w = G.wakeNext(h);
    G.spend(w.gold, 'promocao'); G.payRes(w.cost);
    h.wake = (h.wake || 0) + 1; h._dirty = true; h.hp = G.heroStats(h).hp; h.animo = 100;
    G.S.stats.wakes = (G.S.stats.wakes || 0) + 1;
    G.log(h.name + ' despertou: ' + w.name + ' (' + h.wake + '/4). +8% em todos os atributos e ' + w.perk + '.', 'epic');
    G.addFx({ t: 'promo', x: h.x, y: h.y }); G.sfx('promo'); G.gainRealm(60 * h.wake, 'promo'); G.emit('promo', h);
    return true;
  };

  /* ================= montarias e Estábulo ================= */
  G.MOUNTS = {
    cavalo: { name: 'Cavalo Malhado', rar: 0, est: 1, gold: 400, cost: { trigo: 30, couro: 6 }, bag: 4, p: { spd: 0.15 }, desc: 'Manso e resistente. O primeiro companheiro de estrada.' },
    javali: { name: 'Javali de Sela', rar: 1, est: 2, gold: 900, cost: { couro: 15, presa: 1 }, bag: 6, p: { spd: 0.1, hp: 0.08, def: 0.04 }, desc: 'Teimoso, mas aguenta pancada como ninguém.' },
    lobo: { name: 'Lobo Prateado', rar: 1, est: 2, gold: 1200, cost: { couro: 20, presa: 2 }, bag: 3, p: { spd: 0.18, atk: 0.06 }, desc: 'Criado desde filhote. Caça junto com o dono.' },
    cervo: { name: 'Cervo Lunar', rar: 2, est: 3, gold: 2500, cost: { musgo: 15, runa: 2 }, bag: 4, p: { spd: 0.2, eva: 0.05, mood: 0.2 }, desc: 'Leve como a névoa. Acalma quem o monta.' },
    grifo: { name: 'Grifo Jovem', rar: 3, est: 5, gold: 8000, cost: { pelagem: 20, cristal: 3 }, bag: 5, p: { spd: 0.25, atk: 0.1, crit: 0.03 }, desc: 'Ainda não voa alto, mas já mergulha sobre a presa.' },
    draco: { name: 'Draco das Cinzas', rar: 4, est: 7, gold: 30000, cost: { escdrac: 25, brasa: 2 }, bag: 8, p: { spd: 0.3, atk: 0.12, hp: 0.12 }, desc: 'Um parente menor dos dragões. Só obedece a quem respeita.' },
  };
  G.MOUNT_IDS = Object.keys(G.MOUNTS);
  G.MOUNT_MAX = 10;
  G.stallCap = () => (G.bLvl('estabulo') > 0 ? 1 + G.bLvl('estabulo') : 0);
  G.mountOf = (h) => { if (!h.mount) return null; const l = G.S.stable.list; for (let i = 0; i < l.length; i++) if (l[i].id === h.mount) return l[i]; return null; };
  G.mountF = (mt) => (1 + 0.1 * (mt.lvl - 1)) * (G.S.stable.hungry ? 0.5 : 1);
  G.mountNeed = (mt) => 4 + 4 * mt.lvl;
  G.canTame = (k) => {
    const S = G.S, d = G.MOUNTS[k];
    if (!G.bOk('estabulo')) return { ok: false, why: G.bLvl('estabulo') ? 'Estábulo fechado para conserto' : 'Construa o Estábulo' };
    if (G.bLvl('estabulo') < d.est) return { ok: false, why: 'Requer Estábulo nível ' + d.est };
    if (S.stable.list.length >= G.stallCap()) return { ok: false, why: 'Sem baias livres' };
    if (S.gold < d.gold) return { ok: false, why: 'Faltam moedas' };
    if (!G.hasRes(d.cost)) return { ok: false, why: 'Faltam materiais' };
    return { ok: true };
  };
  G.tame = (k) => {
    const S = G.S, d = G.MOUNTS[k]; if (!G.canTame(k).ok) return null;
    G.spend(d.gold, 'obras'); G.payRes(d.cost);
    const mt = { id: G.uid(), k, lvl: 1, xp: 0, hero: 0 };
    S.stable.list.push(mt); S.stats.mounts = (S.stats.mounts || 0) + 1;
    G.log('O Estábulo recebeu um novo companheiro: ' + d.name + '.', 'good'); G.sfx('rare'); G.gainRealm(20 + 15 * d.rar, 'obra'); G.emit('stable');
    return mt;
  };
  G.mountAssign = (mt, h) => {
    const S = G.S;
    for (const x of S.heroes) if (x.mount === mt.id) { x.mount = 0; x._dirty = true; }
    mt.hero = 0;
    if (h) { const old = G.mountOf(h); if (old) old.hero = 0; h.mount = mt.id; mt.hero = h.id; h._dirty = true; h.animo = Math.min(100, h.animo + 10); }
    G.emit('stable'); return true;
  };
  G.mountFeed = (mt, n) => {
    const S = G.S; let used = 0;
    n = Math.min(n, Math.floor(S.res.racao || 0));
    while (n > 0 && mt.lvl < G.MOUNT_MAX) { const need = G.mountNeed(mt) - mt.xp, give = Math.min(n, need); mt.xp += give; n -= give; used += give; if (mt.xp >= G.mountNeed(mt)) { mt.xp = 0; mt.lvl++; G.sfx('lvl'); } }
    if (used) { G.addRes('racao', -used); const h = S.heroes.find((x) => x.mount === mt.id); if (h) h._dirty = true; G.emit('stable'); }
    return used;
  };
  G.mountRelease = (mt) => { const S = G.S, i = S.stable.list.indexOf(mt); if (i < 0) return false; G.mountAssign(mt, null); S.stable.list.splice(i, 1); G.emit('stable'); return true; };
  G.racaoRate = () => (G.bOk('estabulo') ? 0.5 * Math.pow(G.bLvl('estabulo'), 1.1) * G.bless('oficio') : 0);

  /* ================= decoração ================= */
  /* spots = [x, y, bloqueia]; spr = adereço desenhado em 43-art-vocacoes */
  G.DECOR = [
    { id: 'canteiros', name: 'Canteiros de Flores', icon: 'flower', charm: 3, per: 1, unit: ' de felicidade por dia', cid: 1, gold: 120, cost: { madeira: 10, ervas: 8 }, spr: 'dec_canteiro', spots: [[37.6, 48.8], [50.4, 48.8], [37.6, 56.8], [50.5, 56.8]], desc: 'Cor nas ruas. Os moradores acordam mais felizes.' },
    { id: 'estandartes', name: 'Estandartes de Aurora', icon: 'flag', charm: 4, per: 0.03, pct: 1, unit: ' de experiência', cid: 1, gold: 260, cost: { madeira: 16, couro: 6 }, spr: 'dec_estandarte', spots: [[41.4, 43.0], [46.6, 43.0], [41.4, 65.3], [46.6, 65.3]], desc: 'As cores do reino nos portões. Quem passa por eles luta com mais vontade de aprender.' },
    { id: 'jardim', name: 'Jardim de Ervas', icon: 'wheat', charm: 3, per: 0.08, pct: 1, unit: ' de ervas da fazenda', cid: 2, gold: 320, cost: { madeira: 14, ervas: 20 }, spr: 'dec_jardim', spots: [[50.5, 58.2], [51.6, 59.2], [37.0, 59.4]], desc: 'Canteiros medicinais cuidados pelo Alquimista.' },
    { id: 'fonte', name: 'Fonte das Duas Luas', icon: 'moon', charm: 5, per: 0.06, pct: 1, unit: ' de ânimo natural dos heróis', cid: 2, gold: 500, cost: { pedra: 30, runa: 1 }, spr: 'dec_fonte', spots: [[44, 54.92]], desc: 'Duas luas de pedra coroam a fonte da praça. Sentar ali acalma qualquer um.' },
    { id: 'poco', name: 'Poço dos Desejos', icon: 'coin', charm: 4, per: 0.03, pct: 1, unit: ' de moedas dos monstros', cid: 2, gold: 650, cost: { pedra: 24, minerio: 10 }, spr: 'dec_poco', spots: [[38.5, 58.85, 1]], desc: 'Uma moeda jogada, um desejo de bolsa cheia.' },
    { id: 'estatua', name: 'Estátua do Primeiro Caçador', icon: 'sword', charm: 6, per: 0.02, pct: 1, unit: ' de ataque', cid: 3, gold: 1200, cost: { pedra: 40, osso: 15 }, spr: 'dec_estatua', spots: [[38.5, 51.85, 1]], desc: 'Quem fundou a Guilda olha a praça de cima. Ninguém quer decepcioná-lo.' },
    { id: 'relogio', name: 'Relógio de Sol', icon: 'sun', charm: 4, per: 0.02, pct: 1, unit: ' de velocidade de ataque', cid: 3, gold: 1500, cost: { pedra: 30, po_ocre: 15 }, spr: 'dec_relogio', spots: [[49.5, 51.85, 1]], desc: 'Tempo medido, golpe medido.' },
    { id: 'lampioes', name: 'Lampiões de Cristal', icon: 'spark', charm: 4, per: 0.03, pct: 1, unit: ' de ataque à noite', cid: 4, gold: 2400, cost: { minerio: 30, cristal: 2 }, spr: 'dec_lampiao', light: 1, spots: [[41.2, 47.7], [46.8, 47.7], [41.2, 60.6], [46.8, 60.6]], desc: 'Luz roxa da Fenda, domada em vidro. A noite deixa de assustar.' },
    { id: 'altar', name: 'Altar dos Caídos', icon: 'heart', charm: 5, per: 0.1, pct: 1, unit: ' de recuperação mais rápida dos caídos', cid: 4, gold: 3200, cost: { pedra: 50, perola: 1 }, spr: 'dec_altar', spots: [[49.5, 58.85, 1]], desc: 'Velas que nunca apagam. Os feridos voltam antes para a luta.' },
    { id: 'arco', name: 'Arco do Triunfo', icon: 'crown', charm: 8, per: 0.02, pct: 1, unit: ' de defesa', cid: 5, gold: 6000, cost: { pedra: 80, minerio: 40, emb3: 1 }, spr: 'dec_arco', spots: [[44, 47.45]], desc: 'Todo herói que volta da caçada passa por baixo dele.' },
  ];
  G.DECOR_MAX = 3;
  G.DEC = {}; for (const d of G.DECOR) G.DEC[d.id] = d;
  G.decorLvl = (id) => (G.S && G.S.decor && G.S.decor[id]) || 0;
  G.decorV = (id) => G.DEC[id].per * G.decorLvl(id);
  G.charm = () => { let n = 0; for (const d of G.DECOR) n += d.charm * G.decorLvl(d.id); return n; };
  G.decorCost = (id, l) => { const d = G.DEC[id], cost = {}; for (const k in d.cost) cost[k] = Math.round(d.cost[k] * (1 + 1.2 * (l - 1))); return { gold: Math.round(d.gold * Math.pow(2.6, l - 1)), cost }; };
  G.canDecor = (id) => {
    const S = G.S, d = G.DEC[id], l = G.decorLvl(id) + 1;
    if (G.bLvl('cidadela') < d.cid) return { ok: false, why: 'Requer Cidadela nível ' + d.cid };
    if (l > G.DECOR_MAX) return { ok: false, why: 'Nível máximo' };
    const c = G.decorCost(id, l);
    if (S.gold < c.gold) return { ok: false, why: 'Faltam moedas', c };
    if (!G.hasRes(c.cost)) return { ok: false, why: 'Faltam materiais', c };
    return { ok: true, c };
  };
  G.buyDecor = (id) => {
    const S = G.S, r = G.canDecor(id); if (!r.ok) return false;
    G.spend(r.c.gold, 'obras'); G.payRes(r.c.cost);
    S.decor[id] = G.decorLvl(id) + 1; S.stats.decor = (S.stats.decor || 0) + 1;
    const d = G.DEC[id];
    G.log(S.decor[id] === 1 ? d.name + ' agora enfeita Aurora.' : d.name + ' foi ampliada para o nível ' + S.decor[id] + '.', 'good');
    G.addFx({ t: 'build', x: G.decorSpots(d)[0][0], y: G.decorSpots(d)[0][1] }); G.sfx('build'); G.gainRealm(15 + 10 * S.decor[id], 'obra');
    G.applyDecor(); G.dirtyAll(); G.emit('decor', id);
    return true;
  };
  /* enfeites que ocupam um ladrilho bloqueiam a passagem (refeito a cada carga) */
  let decBlk = [];
  G.applyDecor = () => {
    if (!Wd.ready) return;
    for (const i of decBlk) Wd.walk[i] = 1; decBlk = [];
    for (const d of G.DECOR) if (G.decorLvl(d.id) > 0) for (const s of G.decorSpots(d)) if (s[2]) { const i = Math.floor(s[1]) * Wd.w + Math.floor(s[0]); if (Wd.walk[i]) { Wd.walk[i] = 0; decBlk.push(i); } }
    if (Wd._pcache) Wd._pcache.clear();
  };

  /* ================= soma de todos os bônus novos de um herói ================= */
  /* frações somadas (0,05 = +5%); hunger e tire ficam negativos quando reduzem o desgaste */
  G.heroBonus = (h) => {
    const b = { hp: 0, atk: 0, def: 0, crit: 0, eva: 0, aspd: 0, spd: 0, cdr: 0, critDmg: 0, gold: 0, drop: 0, xp: 0, hunger: 0, tire: 0, mood: 0, heal: 0, elite: 0, thorns: 0, rng: 0, bag: 0, pot: 0 };
    const add = (p, f) => { for (const k in p) if (b[k] !== undefined) b[k] += p[k] * (f || 1); };
    add(G.PASSIVES[h.cls].p);
    if (h.j2 && G.JOBS[h.j2]) add(G.JOBS[h.j2].p);
    if (h.j3 && G.JOBS[h.j3]) add(G.JOBS[h.j3].p);
    if (h.arts) for (const id in h.arts) { const a = G.ART[id]; if (a) b[a.key] += a.per * h.arts[id]; }
    const w = h.wake || 0;
    if (w) { b.hp += 0.08 * w; b.atk += 0.08 * w; b.def += 0.08 * w; b.pot += 1; if (w >= 2) b.critDmg += 0.15; if (w >= 3) b.cdr += 0.1; }
    const mt = G.mountOf(h); if (mt) { const d = G.MOUNTS[mt.k]; add(d.p, G.mountF(mt)); b.bag += d.bag; }
    b.atk += G.decorV('estatua'); b.aspd += G.decorV('relogio'); b.gold += G.decorV('poco'); b.def += G.decorV('arco'); b.xp += G.decorV('estandartes'); b.mood += G.decorV('fonte');
    return b;
  };

  /* ================= Armazém da Cidade ================= */
  G.invCap = () => 24 + 8 * G.bLvl('ferraria') + 8 * G.bLvl('mercado') + 4 * G.bLvl('cidadela');
  G.STAR_DUST = [0, 1, 3, 8, 20, 50];
  G.dismantleYield = (it) => {
    const r = G.recipe(it.type, it.tier), out = {};
    for (const k in r.cost) { const n = Math.floor(r.cost[k] * 0.5); if (n > 0) out[k] = n; }
    const dust = Math.round(G.STAR_DUST[it.rar] * (1 + 0.25 * it.plus) * (1 + 0.15 * (it.tier - 1)));
    if (dust > 0) out.po_estelar = dust;
    return out;
  };
  G.dismantle = (it, silent) => {
    const S = G.S, i = S.inv.indexOf(it); if (i < 0 || it.lock) return null;
    const y = G.dismantleYield(it);
    S.inv.splice(i, 1); for (const k in y) G.addRes(k, y[k]);
    S.stats.dismantled = (S.stats.dismantled || 0) + 1;
    if (!silent) { G.sfx('forge'); G.emit('inv'); }
    return y;
  };
  G.dismantleAll = (rar) => {
    const S = G.S, tot = {}; let n = 0;
    for (const it of S.inv.slice()) { if (it.lock || it.rar !== rar) continue; const y = G.dismantle(it, true); if (!y) continue; n++; for (const k in y) tot[k] = (tot[k] || 0) + y[k]; }
    if (n) { G.sfx('forge'); G.emit('inv'); G.log('Desmonte em lote: ' + n + ' peça(s) ' + G.RAR[rar].toLowerCase() + '(s) viraram material.', 'info'); }
    return { n, tot };
  };
  G.toggleLock = (it) => { it.lock = it.lock ? 0 : 1; G.emit('inv'); return it.lock; };

  /* ================= ordens, cura e chamado ================= */
  G.healCost = (h) => {
    if (h.state === 'recover' || h.state === 'fallen') return G.price(h, 'revive') * 2;
    const st = G.heroStats(h), miss = 1 - Math.max(0, h.hp) / st.hp; if (miss < 0.01) return 0;
    return Math.max(1, Math.ceil(G.price(h, 'heal') * 3 * miss * (G.bOk('enfermaria') ? 1 : 2)));
  };
  G.healNow = (h) => {
    if (h.state === 'recover' || h.state === 'fallen') return G.reviveNow(h);
    const c = G.healCost(h); if (!c) return false; if (!G.spend(c, 'cura')) return false;
    const st = G.heroStats(h); const v = st.hp - h.hp; h.hp = st.hp; h.dot = null; h.wound = 0;
    G.addFx({ t: 'healring', x: h.x, y: h.y - 0.3 }); G.addFx({ t: 'dmg', x: h.x, y: h.y - 0.9, n: Math.round(v), c: '#7df09a', heal: 1 }); G.sfx('heal', h.x, h.y);
    return true;
  };
  G.healAllCost = () => { let c = 0; for (const h of G.S.heroes) if (h.state !== 'recover' && h.state !== 'fallen') c += G.healCost(h); return c; };
  G.healAll = () => { const c = G.healAllCost(); if (!c || G.S.gold < c) return 0; let n = 0; for (const h of G.S.heroes) if (h.state !== 'recover' && h.state !== 'fallen' && G.healCost(h) > 0 && G.healNow(h)) n++; return n; };
  G.recall = (h) => { if (h.state !== 'hunt' && h.state !== 'travel') return false; G.heroGoHome(h, false); return true; };
  G.orderAll = (z) => { for (const h of G.S.heroes) h.order = z; G.emit('heroes'); };
  G.HSORT = [['padrao', 'Chegada'], ['nivel', 'Nível'], ['poder', 'Poder'], ['estado', 'Situação']];
  G.sortedHeroes = () => {
    const S = G.S, k = S.opts.hsort || 'padrao', l = S.heroes.slice();
    const out = (h) => (h.state === 'fallen' || h.state === 'recover' ? 0 : h.state === 'hunt' || h.state === 'defend' || h.state === 'rift' || h.state === 'inc' || h.state === 'colosso' ? 1 : h.state === 'travel' || h.state === 'flee' || h.state === 'return' ? 2 : 3);
    if (k === 'nivel') l.sort((a, b) => b.stars - a.stars || b.rank - a.rank || b.lvl - a.lvl);
    else if (k === 'poder') l.sort((a, b) => G.heroStats(b).eff - G.heroStats(a).eff);
    else if (k === 'estado') l.sort((a, b) => out(a) - out(b) || a.hp / G.heroStats(a).hp - b.hp / G.heroStats(b).hp);
    return l;
  };
  G.heroDps = (h) => { const st = G.heroStats(h); return st.atk * (1 + st.crit * (st.critDmg - 1)) / st.int; };

  /* ================= Mascate (comerciante errante) ================= */
  G.mascateRoll = () => {
    const S = G.S, ms = S.mascate; if (ms.day === S.day) return;
    ms.day = S.day; ms.offers = [];
    const f = 1 + 0.12 * (S.realm.lvl - 1), zs = G.ZONES.filter(G.zoneUnlocked), z = G.pick(zs), zm = G.ZMATS[z.n];
    const pool = [
      [{ id: 'tomo', n: 2, gold: Math.round(320 * f) }, 3], [{ id: 'tomo', n: 1, selos: 1 }, 2],
      [{ id: 'racao', n: 12, gold: Math.round(110 * f) }, 2], [{ id: 'po_estelar', n: 5, gold: Math.round(380 * f) }, 2],
      [{ id: zm.r, n: 2, gold: Math.round(G.RES[zm.r].base * 9) }, 3], [{ id: zm.a, n: 20, gold: Math.round(G.RES[zm.a].base * 20 * 4) }, 2],
      [{ id: 'pocao', n: 6, gold: Math.round(95 * f) }, 2], [{ id: 'refeicao', n: 10, gold: Math.round(70 * f) }, 2],
      [{ id: 'nucleos', n: 1, gold: Math.round(900 * f) }, 1.5],
    ];
    if (S.realm.lvl >= 4) { pool.push([{ id: 'alma', n: 1, selos: 2 }, 2]); pool.push([{ id: 'alma', n: 1, gold: Math.round(2200 * f) }, 1.5]); }
    if (S.realm.lvl >= 5) pool.push([{ id: 'essencia', n: 2, selos: 1 }, 1.5]);
    while (ms.offers.length < 4 && pool.length) { const o = G.wpick(pool); pool.splice(pool.findIndex((p) => p[0] === o), 1); o.sold = 0; ms.offers.push(o); }
  };
  G.mascateBuy = (i) => {
    const S = G.S, o = S.mascate.offers[i]; if (!o || o.sold || !G.bOk('mercado')) return false;
    if (o.selos) { if (S.selos < o.selos) return false; S.selos -= o.selos; } else if (!G.spend(o.gold, 'mercado')) return false;
    if (o.id === 'nucleos') S.nucleos += o.n; else G.addRes(o.id, o.n);
    o.sold = 1; G.sfx('buy'); G.emit('inv'); return true;
  };

  /* ================= ganchos diários e de carga ================= */
  /* chamado na virada do dia, antes dos contratos */
  G.dayHooks = () => {
    const S = G.S;
    const fl = G.decorLvl('canteiros'); if (fl) S.happy = Math.min(100, (S.happy || 70) + fl);
    let riders = 0; for (const h of S.heroes) if (h.mount && G.mountOf(h)) riders++;
    const was = S.stable.hungry;
    if (riders) {
      const have = Math.floor(S.res.racao || 0);
      if (have >= riders) { G.addRes('racao', -riders); S.stable.hungry = 0; }
      else { G.addRes('racao', -have); S.stable.hungry = 1; if (!was) { G.log('Faltou ração no Estábulo. As montarias rendem a metade até serem alimentadas.', 'bad'); G.toast('Faltou ração para as montarias!', 'bad'); } }
    } else S.stable.hungry = 0;
    if (was !== S.stable.hungry) G.dirtyAll();
    G.mascateRoll();
  };
  /* garante os campos novos em saves da v19 e em heróis recém-criados */
  G.vocMigrate = () => {
    const S = G.S;
    if (!S.decor) S.decor = {}; if (!S.stable) S.stable = { list: [], hungry: 0 }; if (!S.stable.list) S.stable.list = [];
    if (!S.mascate) S.mascate = { day: 0, offers: [] };
    for (const k of ['jobs', 'artes', 'wakes', 'mounts', 'decor', 'dismantled']) if (S.stats[k] == null) S.stats[k] = 0;
    for (const h of S.heroes) {
      for (const s of G.SLOT_IDS) if (h.gear[s] === undefined) h.gear[s] = null;
      if (h.j2 === undefined) h.j2 = null; if (h.j3 === undefined) h.j3 = null;
      if (h.j2 && !G.JOBS[h.j2]) h.j2 = null; if (h.j3 && (!G.JOBS[h.j3] || !h.j2)) h.j3 = null;
      if (!Array.isArray(h.sk)) h.sk = [1, 1, 1];
      if (!h.arts) h.arts = {};
      /* heróis vindos da v19 recebem os pontos de Arte que teriam juntado na carreira */
      if (h.ap == null) h.ap = Math.max(0, h.lvl - 1) + 3 * h.rank + 15 * (h.stars || 0) + (h.stars ? 100 : 0);
      if (h.apB == null) h.apB = 0; if (h.wake == null) h.wake = 0;
      if (h.mount == null) h.mount = 0; if (h.mount && !G.mountOf(h)) h.mount = 0;
      if (!(h.tS2 >= 0)) h.tS2 = 3; if (!(h.tS3 >= 0)) h.tS3 = 5;
      if (!h.bv) h.bv = {}; h.shield = 0;
    }
    for (const mt of S.stable.list) { const h = S.heroes.find((x) => x.mount === mt.id); mt.hero = h ? h.id : 0; }
    G.applyDecor(); G.mascateRoll();
  };
})();

;
