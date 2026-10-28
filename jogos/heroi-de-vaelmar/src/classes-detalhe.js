/* ===== Detalhe da classe no estilo do original (v3.27.3) =====
   Tela cheia escurecida com estrelas, nome, sprite, descrição, armas preferidas, slots, linha de bônus
   de atributos e botões Habilidades/Feitiços, Passivas e Frascos de Mana; desbloqueio segurando o botão.
   Referência: segundo vídeo do usuário (ESPECIFICACAO-TELAS.md, "Detalhe da classe").
   Textos longos só existem para as classes vistas no vídeo; as demais usam um texto montado a partir do
   catálogo. A lista de habilidades e o "Poder" são calculados com os dados e os atributos do clone. */
(() => {
  const rowOf = k => Catalog.byKey[CLASSES[k].original] || {};
  const caster = k => CLASSES[k].gear[0] === 'mago';
  const GEAR_PT = { guerreiro: 'guerreiro', ladino: 'ladino', mago: 'mago' };

  /* textos lidos nas telas de detalhe do vídeo (chave do catálogo) */
  const LONGA = {
    c_0: 'Uma classe corpo a corpo que favorece ataques físicos e força bruta em vez de magia. Pode usar armas e armaduras mais pesadas.',
    c_2: 'Uma classe de luta astuta, que favorece a velocidade e o dano à defesa. Pode usar armaduras leves, adagas e arcos.',
    c_97: 'Um novato no manejo de grandes feras nórdicas. Pode empunhar o equipamento do guerreiro ou do ladino.',
    c_92: 'Um soldado Lyonesse que pode imbuir seus ataques com propriedades elementares. Pode empunhar o equipamento do guerreiro.',
    c_93: 'Um guerreiro treinado na arte defensiva da esgrima. Pode empunhar o equipamento do guerreiro.',
    c_95: 'Um cavaleiro graduado de Lyonesse armado até os dentes em mythril. Ele aprende artes com armas mais complexas e pode manejar o equipamento do guerreiro.',
    c_96: 'Uma força de elite do reino de Lyonesse, habilidosa em ataques elementais. É naturalmente forte contra as forças das trevas e da luz e pode manejar equipamentos tanto do guerreiro quanto do mago.',
    c_31: 'Uma força de elite do reino de Annwn, habilidoso em ofensas elementais. É naturalmente forte contra Magia arcana, e pode utilizar os equipamentos de guerreiro e ladino.',
    c_10: 'Uma classe híbrida que mistura Defesa e Magia. Ele pode usar equipamentos de guerreiro e de mago.',
    c_101: 'Um guerreiro que domina a arte de domesticar dragões. Pode empunhar o equipamento do guerreiro ou de ladino.',
    c_39: 'Uma das ordens mais altas de guerreiros e valquírias nórdicos. É imune à magia de Dragão, possui vínculos especiais com animais e pode usar o equipamento do guerreiro ou mago.',
    c_36: 'Um guerreiro sagrado e corajoso de Lyonesse, versado em métodos de guarda e sobrevivência. É imune à magia sagrada e pode usar o equipamento do guerreiro.',
    c_38: 'Um ladino disposto a se arriscar em técnicas arcanas perdidas. É imune à magia Arcana e pode usar equipamentos do ladino.',
    c_24: 'Uma classe híbrida que favorece tudo, menos magia. Ele pode empunhar equipamentos tanto de ladinos quanto de cavaleiros.',
    c_1: 'Um indivíduo habilidoso que prefere a magia à força. Pode usar cajados e mantos.',
    c_4: 'Um mago de Avalon que aprendeu o básico da conjuração mágica. Pode empunhar o equipamento do mago.',
    c_11: 'Uma classe híbrida que mistura destreza e magia. Pode empunhar equipamentos tanto de ladino quanto de mago.',
    c_87: 'Um mago habilidoso na arte de canalizar os poderes das feras em batalha. Pode empunhar equipamentos do mago.',
    c_88: 'Um usuário de magia muito habilidoso que pode lançar feitiços repetidamente. Tem uma boa chance de lançar feitiços de graça e pode empunhar equipamentos do mago.',
    c_29: 'Um poderoso mago habilidoso na arte de canalizar os poderes das feras em batalha. É naturalmente forte contra os poderes da luz e das trevas e pode manejar equipamentos de ladino e mago.',
    c_52: 'Um mago não ortodoxo de Avalon que alcançou verdadeira afinidade com todos os quatro elementos básicos. Ele pode lançar feitiços multi-elementais e ocasionalmente pode resistir ao dano de qualquer elemento básico. Ele pode usar o equipamento do mago.',
    c_90: 'Um lutador místico de Annwn que mistura magia e destreza. Ele pode desviar dos ataques de maneira mais eficaz à medida que os danos são causados e pode usar equipamentos do ladino e do mago.',
    c_98: 'Um manipulador novato de grandes feras nórdicas. Pode empunhar o equipamento do guerreiro ou do ladino.',
    c_30: 'Aquele que cavalga com o mais poderoso dos Dragões. É naturalmente forte contra a magia de Dragão e pode usar equipamentos do guerreiro e do mago.',
    c_57: 'Uma classe histórica daqueles alinhados aos Dragões, esta classe traz contos, poemas e canções de guerra para a batalha e favorece armas não convencionais. O ataque deles é determinado pelos atributos de Ataque e Magia, é imune à magia de Dragão e pode empunhar qualquer peça de equipamento encontrada.',
  };
  const ARMAS = {
    c_0: 'Espadas', c_2: 'Adagas', c_97: 'Machados e martelos, Varas', c_93: 'Espadas, Varas', c_95: 'Espadas, Varas', c_96: 'Espadas, Varas, Machados e martelos', c_31: 'Espadas, Espadas curvas, Varas, Machados e martelos',
    c_10: 'Cajado, Espadas', c_101: 'Machados e martelos, Instrumentos', c_39: 'Varas, Machados e martelos, Instrumentos', c_36: 'Espadas, Machados e martelos',
    c_92: 'Espadas, Varas', c_24: 'Varas, Espadas curvas, Espadas, Machados e martelos, Adagas', c_1: 'Cajado', c_4: 'Cajado, Arquicajados', c_11: 'Cajado, Espadas curvas',
    c_87: 'Arquicajados, Espadas curvas', c_88: 'Cajado, Arquicajados', c_29: 'Cajado, Arquicajados, Varas, Espadas curvas', c_52: 'Cajado, Arquicajados',
    c_90: 'Adagas, Espadas, Espadas curvas', c_98: 'Machados e martelos, Varas', c_30: 'Cajado, Arquicajados, Espadas, Machados e martelos',
    c_57: 'Instrumentos, Arquicajados, Machados e martelos, Varas',
  };
  const SLOTS = { c_0: 2, c_2: 2, c_97: 4, c_93: 4, c_95: 7, c_96: 9, c_31: 8, c_10: 6, c_101: 7, c_39: 10, c_36: 8, c_92: 3, c_24: 4, c_1: 4, c_4: 5, c_11: 5, c_87: 8, c_88: 8, c_29: 10, c_52: 14, c_90: 9, c_98: 5, c_30: 9, c_57: 14 };

  /* bônus de atributos lidos no vídeo (herói de nível 17). Viram multiplicadores sobre os atributos base
     do nível 17 e depois valem em qualquer nível; classes sem medição continuam com o multiplicador genérico */
  const DELTA17 = {
    c_2:  { hp: -68, mp: 7, mag: 3, def: -2, res: -2, dex: 10 },
    c_1:  { hp: -105, mp: 81, atk: -5, mag: 19, def: -9, res: 8 },
    c_11: { hp: -68, mp: 103, mag: 19, def: -2, res: -2, dex: 13 },
    c_87: { hp: -72, mp: 136, atk: -5, mag: 27, def: -9, res: 8 },
    c_24: { mp: 15, atk: 6, mag: -1, dex: 4 },
    c_88: { hp: 27, mp: 136, atk: -1, mag: 33, def: -7, res: 13 },
    c_29: { hp: 176, mp: 209, atk: -1, mag: 54, def: -5, res: 19, dex: 17 },
    c_52: { hp: 733, mp: 315, atk: 1, mag: 122, def: 1, res: 36, dex: 32 },
    c_90: { hp: 70, mp: 133, atk: 12, mag: 27, def: -7, res: 8, dex: 11 },
    c_98: { hp: 40, atk: 2 },
    c_95: { hp: 118, mp: 51, atk: 20, mag: -4, def: 2, res: 2, dex: 4 },
    c_96: { hp: 313, mp: 92, atk: 28, mag: -4, def: 4, res: 4, dex: 4 },
    c_31: { hp: 313, mp: 51, atk: 28, mag: -4, def: 4, res: 4, dex: 4 },
    c_39: { hp: 265, mp: 136, atk: 31, mag: 47, def: -3, res: 27 },
    c_101: { hp: 13, mp: 19, atk: 13, def: 2, res: 2, dex: 4 },
    c_10: { mp: 81, mag: 19 },
    c_30: { hp: 176, mp: 136, atk: 3, mag: 42, def: -5, res: 19 },
    c_57: { hp: 1078, mp: 236, atk: 107, mag: 123, def: 24, res: 101 },
  };
  const STATS = ['hp', 'mp', 'atk', 'mag', 'def', 'res', 'dex'], STAT_LBL = { hp: 'HP', mp: 'Mana', atk: 'Atq', mag: 'Mag', def: 'Def', res: 'Res', dex: 'Des' };
  const REF = baseStats(17);
  for (const [key, d] of Object.entries(DELTA17)) {
    const k = Catalog.canonicalClass(key), c = CLASSES[k]; if (!c) continue;
    for (const s of STATS) c.m[s] = 1 + (d[s] || 0) / REF[s];
  }
  if (CLASSES.c_92) for (const s of STATS) CLASSES.c_92.m[s] = 1; /* o Soldado de Infantaria não tem bônus no vídeo */

  const delta = k => { const c = CLASSES[k], b = baseStats(S.lvl); return STATS.map(s => [s, Math.round(b[s] * (c.m[s] || 1) - b[s])]).filter(([, v]) => v); };
  const signed = v => (v > 0 ? '+' : '−') + fmt(Math.abs(v));
  const deltaHtml = k => {
    const d = delta(k); if (!d.length) return '';
    return '<p class="cd-st">' + d.map(([s, v]) => '<span class="' + (v > 0 ? 'up' : 'dn') + '">' + STAT_LBL[s] + ' ' + signed(v) + '</span>').join(' ') + '</p>';
  };

  /* ---------- texto das habilidades ---------- */
  const EL_PT = { fogo: 'Fogo', agua: 'Água', terra: 'Terra', raio: 'Raio', sagrado: 'Sagrado', sombrio: 'Sombrio', arcano: 'Arcano', dragao: 'Dragão' };
  /* textos do jogo lidos no vídeo (src/textos-habilidades.js); sem entrada, usa-se o texto montado dos dados */
  const chave = t => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const TXT_HAB = window.TEXTO_HAB || {}, TXT_PASS = window.TEXTO_PASSIVA || {};
  const ST_PT = { Rot: 'Podridão', Blight: 'Praga', Frozen: 'Congelado', Paralyzed: 'Paralisado', Burning: 'Em chamas', Blind: 'Cego', Poisoned: 'Envenenado', Stunned: 'Atordoado', Asleep: 'Adormecido', Lulled: 'Adormecido',
    Bleeding: 'Sangrando', Petrified: 'Petrificado', Tempered: 'Temperamento', Frenzy: 'Frenesi', 'Iron Pauldrons': 'Ombreiras de Ferro', 'Iron Greaves': 'Grevas de Ferro', 'Mythril Pauldrons': 'Ombreiras de Mythril',
    'Mythril Greaves': 'Grevas de Mythril', 'Spiked Pauldrons': 'Ombreiras Cravadas', 'Spiked Greaves': 'Grevas Cravadas', Fire: 'Fogo', Water: 'Água', Earth: 'Terra', Lightning: 'Raio', Holy: 'Sagrado', Dark: 'Sombrio', Wind: 'Vento',
    Dragon: 'Dragão', Drake: 'Dragão', Aligned: 'Alinhado', Sigil: 'Sigilo', Immune: 'Imune', Target: 'Alvo', Dmg: 'Dano', Att: 'Atq', Atk: 'Atq', Dex: 'Des', Crit: 'Crít', All: 'Tudo' };
  /* nome de status em português: tabela do motor, depois a tabela acima, palavra por palavra */
  const efeito = n => {
    const d = Rules.effectDef(n); if (d && d.name && d.name !== n) return d.name;
    if (ST_PT[n]) return ST_PT[n];
    return n.replace(/^T\. /, 'Temp. ').replace(/([A-Za-z]+?)(blight)\b/i, (m, a) => 'Praga ' + (ST_PT[a[0].toUpperCase() + a.slice(1)] || a)).replace(/\b[A-Za-z]+\b/g, w => ST_PT[w] || w);
  };
  const STAT_ART = { Att: 'o Ataque', Atk: 'o Ataque', Mag: 'a Magia', Def: 'a Defesa', Res: 'a Resistência', Dex: 'a Destreza', Crit: 'o Crítico', All: 'todos os atributos' };
  const parteStat = n => { const m = /^(?:T\. )?(Att|Atk|Mag|Def|Res|Dex|Crit|All) (↑+|↓+)$/.exec(n); return m && { art: STAT_ART[m[1]], up: m[2][0] === '↑', forte: m[2].length > 1 }; };
  function descSpell(r) {
    if (TXT_HAB[chave(r.name)]) return TXT_HAB[chave(r.name)];
    const pw = r.power || [], temP = pw.length && pw[0] > 0, out = [], el = EL_PT[r.element];
    if (temP) {
      let s = r.type === 'mag' ? 'Causa dano mágico' + (el ? ' de ' + el : '') : 'Ataque físico' + (el ? ' de ' + el : '');
      if (r.hits > 1) s += ' ' + r.hits + ' vezes';
      if (r.all) s += ' em todos os oponentes';
      out.push(s + '.');
    }
    for (const x of r.causes || []) { const p = parteStat(x.name), ch = x.meta ? ' (' + x.meta + ')' : ''; out.push(p ? (p.up ? 'Aumenta ' : 'Diminui ') + p.art + ' do oponente' + ch + '.' : 'Chance de causar ' + efeito(x.name) + ch + '.'); }
    for (const x of r.gives || []) { const p = parteStat(x.name), ch = x.meta && x.meta !== '100%' ? ' (' + x.meta + ')' : ''; out.push(p ? (p.up ? 'Aumenta ' : 'Diminui ') + (p.forte ? 'muito ' : '') + p.art + ch + '.' : 'Concede ' + efeito(x.name) + ch + '.'); }
    if ((r.cures || []).length) out.push('Remove ' + r.cures.map(x => efeito(x.name)).join(', ') + '.');
    if (r.heal) out.push(r.heal.stat === 'mp' ? 'Recupera ' + fmt(r.heal.flat) + ' de mana.' : 'Recupera ' + fmt(r.heal.flat) + ' pontos de vida.');
    if ((r.summons || []).length) out.push('Invoca ' + r.summons.map(x => x.name).join(', ') + '.');
    if (r.castTurns > 1) out.push('Requer ' + r.castTurns + ' rodadas em batalha.');
    if (!out.length) out.push(r.self ? 'Uso em si mesmo.' : 'Efeito especial.');
    return out.join(' ');
  }
  /* "Poder" como o jogo mostra: dano esperado com os atributos atuais (ataque nas habilidades, magia nos feitiços) */
  function poder(r) {
    const pw = r.power || []; if (!pw.length || !(pw[0] > 0)) return '0';
    const st = stats(), v = x => Math.floor((r.type === 'mag' ? st.mag : st.atk) * x / 1000 * 1.16);
    const a = v(pw[0]), b = pw.length > 1 ? v(pw[pw.length - 1]) : null;
    return (b != null && b !== a ? a + '-' + b : String(a)) + (r.hits > 1 ? ' (x' + r.hits + ')' : '');
  }
  const spellIcon = r => { const u = AETHRIC_DATA.assets[r.sprite]; return u ? '<img class="pix" src="' + u + '" width="16" height="16" alt="">' : '<span class="cd-dot"></span>'; };
  const spellHtml = (r, lv) => '<div class="cd-it"><b>' + spellIcon(r) + esc(r.name) + (lv ? ' <small>(Nível ' + lv + ')</small>' : '') + '</b><p>' + esc(descSpell(r)) + '</p><span class="cd-meta">' + (r.mp ? r.mp + ' mana' : '0 mana') + ' • Poder: ' + poder(r) + '</span></div>';

  /* ---------- passivas ---------- */
  const EFX = { 'Collateral Chance': 'Chance Colateral', 'Collateral Damage': 'Dano Colateral', 'Ward Start': 'Início da Guarda', 'Ward Recovery': 'Recuperação da Guarda', 'Second Chance': 'Segunda Chance',
    'Status Protection': 'Proteção contra Status', 'Bestial Bond': 'Vínculo Bestial', Manaflasks: 'Frascos de Mana', Bloodflasks: 'Frascos de Sangue', 'Mana Siphon': 'Sifão de Mana',
    'Avidity Chance': 'Chance de Avidez', Healing: 'Cura', 'Follower Act': 'Ação do Seguidor', 'Follower Stats': 'Atributos do Seguidor', 'Recharge HP on Crit': 'Recarregar HP com o Crítico',
    'Life Siphon': 'Sifão da Vida', 'Follower/Summon AI': 'IA do Seguidor/Invocações', 'Mana Rush': 'Carga de Mana', 'Valhalla Power': 'Poder de Valhalla', 'Follower Protect': 'Proteção do Seguidor',
    'Hybrid Damage': 'Dano Híbrido', 'Elemental Weaknesses': 'Fraquezas Elementais', 'Max Dodge Chance': 'Chance Máxima de Esquiva', 'View Distance': 'Alcance de Interação',
    'Mana-Ward Recovery': 'Recuperação de Mana-Guarda', 'Ward Power': 'Poder da Guarda', 'Damage to Ward': 'Danos à Guarda', 'Self Damage Reduction': 'Redução de Auto Dano', Causes: 'Causa', Gives: 'Concede',
    'Crit Chance': 'Chance de Crítico', 'Spell Casting Damage': 'Dano ao Lançar Feitiço', 'Elemental Immunity Damage': 'Dano de Imunidade Elemental', 'Low HP → Stats': 'HP Baixo → Atributos',
    'Low Mana → Stats': 'Mana Baixa → Atributos', '+High Ward → Stats': '+Guarda Alta → Atributos', 'Follower Ascension Level': 'Nível de Ascensão do Seguidor', 'Debuff Fade': 'Dissipação de Debuff',
    'Buff Duration': 'Duração de Buff', 'Summon Spell Start': 'Início de Feitiço de Invocação', 'Summon Stats': 'Atributos da Invocação', '+Guidelight': '+Luz-Guia', 'Summon Protection': 'Proteção da Invocação',
    'EXP Walk': 'EXP ao Andar', 'Mana Walk': 'Mana ao Andar', 'Summon Pact Power': 'Poder do Pacto de Invocação', '+Second Chance': '+Segunda Chance', '+Weaved Elements': '+Elementos Entrelaçados',
    'Charon Ritual Chance': 'Chance do Ritual de Caronte', 'Souls Collected → Stats': 'Almas Coletadas → Atributos', 'Sacrifice Effects': 'Efeitos de Sacrifício', 'Apex Rate': 'Taxa de Ápice',
    'Apex Start': 'Início do Ápice', 'Apex Effect': 'Efeito do Ápice', 'Apex Used → Stats': 'Ápice Usado → Atributos', 'Apex Power': 'Poder do Ápice', 'Gold Bonus': 'Bônus de Ouro',
    'Follower Turn Chance': 'Chance de Turno do Seguidor', 'Turn Chance': 'Chance de Turno', 'Effect Chance': 'Chance de Efeito', 'Off-hands': 'Mãos Secundárias', 'Two-handed Power': 'Poder de Duas Mãos',
    'Counter Chance (PvE)': 'Chance de Contra-ataque (PvE)', 'Collateral Damage HP Recovery': 'Recuperação de HP por Dano Colateral', Ward: 'Guarda', 'Dark Damage': 'Dano Sombrio', 'Holy Damage': 'Dano Sagrado',
    'Mana Reduction': 'Redução de Mana', 'Damage Limit Break': 'Quebra do Limite de Dano', Sigils: 'Sigilos', 'Crit Damage': 'Dano Crítico', 'Critical Chain': 'Corrente Crítica',
    'Settlement/Area Defense': 'Defesa de Assentamento/Área', 'Crit Status Fade Chance': 'Chance de Dissipar Status com Crítico' };
  const efxPt = line => line.split(' / ').map(p => {
    const i = p.indexOf(':'); if (i < 0) return p;
    const lab = p.slice(0, i); let val = p.slice(i + 1).replace('Level', 'Nível').replace(/\bturns?\b/, 'turnos');
    if (lab === 'Causes' || lab === 'Gives') val = val.split(',').map(x => x.replace(/^(\s*)(.*?)(\s*\(.*)?$/, (m, a, nome, pct) => a + efeito(nome) + (pct || ''))).join(',');
    return (EFX[lab] || lab) + ':' + val;
  }).join(' / ');
  /* [nome, descrição, prefixos dos bônus do catálogo]. Sem entrada: o nome do catálogo */
  const PASSIVA = {
    'Mana Siphon': ['Sifão de Mana', 'Há uma grande chance de que uma habilidade ou feitiço não consuma mana.', ['Mana Siphon']],
    Avidity: ['Avidez', 'Em batalha, ocasionalmente você receberá um turno adicional após performar uma ação.', ['Avidity Chance']],
    Apothecarist: ['Boticário', 'Você é um mestre em poções eficazes. Itens de cura recuperarão 25% a mais de HP e mana.', ['Healing']],
    Manaflasks: ['Frasco de Mana', 'Utilizar feitiços elementais em batalha carregará Frascos de Mana, permitindo que você libere habilidades do Frasco de Mana quando estiverem totalmente carregados. Explorar fraquezas elementais em batalha fará com que os Frascos de Mana carreguem mais rápido.', ['Manaflasks']],
    Bloodflasks: ['Frasco de Sangue', 'Utilizar feitiços em batalha carregará Frascos de Sangue, permitindo que você libere habilidades do Frasco de Sangue quando estiverem totalmente carregados.', ['Bloodflasks']],
    'Collateral Damage': ['Dano Colateral', 'Você balança sua arma de forma imprudente. Os ataques têm uma chance adicional de causar dano extra a qualquer oponente em batalha.', ['Collateral Chance', 'Collateral Damage']],
    "Knight's Ward": ['Guarda do Cavaleiro', 'A Guarda é ativada automaticamente na batalha e se recupera um pouco a cada rodada.', ['Ward Start', 'Ward Recovery']],
    'Shoulders of Giants': ['Ombros dos Gigantes', 'Sua Guarda é fortalecida pelo poder dos gigantes. A Guarda é ativada automaticamente na batalha e recupera cada rodada.', ['Ward Start', 'Ward Recovery']],
    'Second Chance': ['Segunda Chance', 'Você tem uma chance de escapar de ser derrotado na batalha.', ['Second Chance']],
    Steadfast: ['Inabalável', 'É menos provável que você seja afetado por uma condição de status.', ['Status Protection']],
    'Life Siphon': ['Sifão da Vida', 'Você geralmente recupera HP ao causar dano a um oponente.', ['Life Siphon']],
    'Mana Rush': ['Carga de Mana', 'Você pode canalizar mana para escapar de ser derrotado na batalha.', ['Mana Rush']],
    'Beast Mode': ['Modo Fera', 'Seus atributos aumentam à medida que você derrota animais selvagens.', []],
    'Crest of Lyonesse': ['Emblema de Lyonesse', 'Seus atributos aumentam à medida que você derrota os inimigos fanáticos ou ressurgidos.', []],
    Recharge: ['Recarga', 'Conseguir um acerto crítico restaurará HP e mana.', ['Recharge HP on Crit']],
    'Dragon Slayer': ['Matador de Dragões', 'Seus atributos aumentam à medida que você derrota Dragões.', []],
    'Hybrid Monster': ['Monstro Híbrido', 'Você tem conexão com os grandes Dragões. Seu atributo de Ataque aumenta um pouco sua Magia, enquanto a Magia aumenta o Ataque.', ['Hybrid Damage']],
    'Valhallan Training': ['Treinamento de Valhalla', 'Seu seguidor tem mais chances de fazer boas escolhas em batalha.', ['Follower/Summon AI']],
    'Bestial Bond': ['Vínculo Bestial', 'Você ganha acesso aos efeitos de Vínculo Bestial com seu seguidor.', ['Bestial Bond']],
    'Valhallan Strength': ['Força de Valhalla', 'Seus ataques podem causar praga e danos críticos com mais frequência. Seu Seguidor também é mais forte e pode atacar com mais frequência.', ['Crit Chance', 'Follower Stats', 'Follower Act']],
    'Valhallan Dissonance': ['Dissonância de Valhalla', 'Seu seguidor é um pouco mais forte e deve atacar mais frequentemente. Adicionalmente, você e seu seguidor ficarão ambos mais poderosos à medida que seu HP diminui em batalha.', ['Valhalla Power', 'Low HP', 'Follower Stats', 'Follower Act']],
    'Valhallan Protection': ['Proteção de Valhalla', 'Qualquer Seguidor tem a chance de te proteger em batalha.', ['Follower Protect']],
    /* abaixo, nomes e bônus vistos no segundo vídeo; a descrição vem de textos-habilidades.js */
    'Critical Hits': ['Danos Críticos', '', ['Crit Chance']], 'Siphon Ward': ['Guarda Sifonada', '', ['Mana-Ward Recovery']],
    Bastille: ['Bastilha', '', ['Ward Start', 'Ward Recovery', '+High Ward', 'Ward Power']], 'Eternal Light': ['Luz Eterna', '', ['View Distance']],
    'Mystic Feather': ['Pena Mística', '', ['Max Dodge Chance']], 'Crest of Annwn': ['Emblema de Annwn', '', []], 'Arcane Mastery': ['Maestria Arcana', '', ['Causes']],
    'Dungeon Crawler': ['Explorador de Masmorras', '', []], Resurgence: ['Ressurgimento', '', ['Low HP']], 'High Tenacity': ['Alta Tenacidade', '', ['Self Damage Reduction']],
    Saboteur: ['Sabotador', '', ['Damage to Ward']], "Realm's Light": ['Luz do Reino', '', ['View Distance', 'Causes']], Iconoclast: ['Iconoclasta', '', ['Low Mana']],
    Omnimancy: ['Onimancia', '', []], 'School of Avalon': ['Escola de Avalon', '', []], Nekromancy: ['Necromancia', '', []], 'Weaved Elements': ['Elementos Entrelaçados', '', ['+Weaved Elements']],
    'Ascension Synergy': ['Sinergia de Ascensão', '', ['Follower Ascension Level']],
    /* nomes exatos que o jogo escreve de outro jeito que "nome + algarismo" */
    Efficacious: ['Eficaz', '', ['Elemental Weaknesses', 'Spell Casting Damage', 'Elemental Immunity Damage']],
    /* nomes sem texto no vídeo: tradução minha, para não deixar inglês na tela */
    'Gold Bonus': ['Bônus de Ouro', '', ['Gold Bonus']], 'EXP Step': ['Passo de EXP', '', ['EXP Walk']], 'Mana Step': ['Passo de Mana', '', ['Mana Walk']], 'Valhallan Way': ['Caminho de Valhalla', '', ['Follower Act', 'Follower Stats']],
    Guardian: ['Guardião', '', ['Settlement/Area Defense']], 'Staying Power': ['Poder de Permanência', '', []], Apex: ['Ápice', '', ['Apex']], 'Power of the Gods': ['Poder dos Deuses', '', []],
    'Paired Essence': ['Essência Pareada', '', []], 'Novice Summoner': ['Invocador Novato', '', []], 'Adept Summoner': ['Invocador Adepto', '', []], 'Experienced Summoner': ['Invocador Experiente', '', []],
    'Summoner of Auriga': ['Invocador de Auriga', '', []], 'Summoner of Hydrus': ['Invocador de Hydrus', '', []], Battalions: ['Batalhões', '', []], 'Charon Ritual': ['Ritual de Caronte', '', ['Charon Ritual Chance']],
    'Apex (Ara)': ['Ápice (Ara)', '', ['Apex']], 'Apex (Ursa)': ['Ápice (Ursa)', '', ['Apex']], Ara: ['Ara', '', []], Ursa: ['Ursa', '', []], Hercules: ['Hércules', '', []], Dorado: ['Dorado', '', []],
    'Ascended Summons': ['Invocações Ascendidas', '', []], 'Critical Chain': ['Corrente Crítica', '', ['Critical Chain']], 'Critical Poise': ['Equilíbrio Crítico', '', []],
    Demigod: ['Semideus', '', []], 'Demigod (Ara)': ['Semideus (Ara)', '', []], 'Demigod (Ursa)': ['Semideus (Ursa)', '', []], "Dorado's Guard": ['Guarda de Dorado', '', []],
    'Elysian Balance': ['Equilíbrio Elísio', '', []], 'Enhanced Bestial Bonds': ['Vínculos Bestiais Aprimorados', '', []], 'Grand Summoner': ['Grande Invocador', '', []],
    'Grand Summoner of Auriga': ['Grande Invocador de Auriga', '', []], 'Grand Summoner of Hydrus': ['Grande Invocador de Hydrus', '', []], 'Mana Feather': ['Pena de Mana', '', []],
    'The Deity': ['A Divindade', '', []], 'The Deity (Ara)': ['A Divindade (Ara)', '', []], 'The Deity (Ursa)': ['A Divindade (Ursa)', '', []], 'Unstable Omnimancy': ['Onimancia Instável', '', []],
    Hydrus: ['Hydrus', '', []], Auriga: ['Auriga', '', []], 'Elysian Guidelight': ['Luz-Guia Elísia', '', ['+Guidelight']],
    'Manaflasks II': ['Frasco de Mana II', '', ['Manaflasks']], 'Manaflasks III': ['Frascos de Mana III', '', ['Manaflasks']], Bloodflasks: ['Frascos de Sangue', '', ['Manaflasks', 'Bloodflasks']],
    'Bloodflasks II': ['Frascos de Sangue II', '', ['Manaflasks', 'Bloodflasks']], 'Steadfast III': ['Inabalável III', '', ['Status Protection']],
  };
  const ROMANO = /^(.*?)(?: (I{1,3}|IV|VI{0,3}|IX|X))?$/;
  function passivas(k) {
    const row = rowOf(k), fx = (row.effects || []).slice(), usado = new Set();
    const itens = (row.abilities || []).map(nome => {
      const [, stem, num] = nome.match(ROMANO), exato = PASSIVA[nome], def = exato || PASSIVA[stem], pt = exato ? exato[0] : def ? def[0] + (num ? ' ' + num : '') : nome;
      const linhas = def ? fx.filter((e, i) => def[2].some(p => e.startsWith(p)) && !usado.has(i) && (usado.add(i), true)) : [];
      const texto = TXT_PASS[chave(pt)] || (def && def[1]);
      return '<div class="cd-it"><b>' + iconImg(['spark'], 16) + esc(pt) + '</b>' + (texto ? '<p>' + esc(texto) + '</p>' : '') + linhas.map(l => '<span class="cd-meta">' + esc(efxPt(l)) + '</span>').join('') + '</div>';
    });
    const sobra = fx.filter((e, i) => !usado.has(i));
    return itens.join('') + (sobra.length ? '<div class="cd-it"><span class="cd-meta">' + sobra.map(l => esc(efxPt(l))).join('<br>') + '</span></div>' : '');
  }
  const temFrascos = k => (rowOf(k).abilities || []).some(a => /^(Mana|Blood)flasks/.test(a));
  function frascos(k) {
    const t = CLASSES[k].tier, todos = Catalog.data.spells.filter(s => /flask/i.test(s.nameEn)).sort((a, b) => a.tier - b.tier), lista = todos.filter(s => (s.tier || 1) <= t);
    return lista.map(r => '<div class="cd-it"><b>' + spellIcon(r) + esc(r.name) + '</b><p>' + esc(descSpell(r)) + '</p></div>').join('') ||
      '<div class="cd-it"><p>Os primeiros frascos chegam no tier ' + todos[0].tier + '. Até lá os Frascos de Mana apenas carregam.</p></div>';
  }
  const habilidades = k => CLASSES[k].skills.map(([lv, key]) => [lv, Catalog.byKey[key]]).filter(([, r]) => r).map(([lv, r]) => spellHtml(r, lv)).join('') || '<p class="fine">Esta classe não tem habilidades próprias.</p>';

  /* ---------- tela ---------- */
  const labelH = k => caster(k) ? 'Feitiços' : 'Habilidades';
  const ICON_H = k => iconImg(caster(k) ? ['staff', { orb: '#6e8cff' }] : ['sword', { metal: '#d8e0ec' }], 16);
  const estrelas = t => (window.classStarsHtml ? window.classStarsHtml(t) : '★'.repeat(Math.min(t, 4)));
  const cabecalho = k => {
    const c = CLASSES[k], r = rowOf(k), nome = window.classNome(k), st = clState(k);
    const gear = c.gear.map(g => GEAR_PT[g]).join(' ou ');
    const longa = LONGA[r.key] || ((window.CLASS_DESC && window.CLASS_DESC[r.key]) ? window.CLASS_DESC[r.key] + ' ' : '') + 'Pode empunhar o equipamento do ' + gear + '.';
    return '<div class="cd-star">' + estrelas(c.tier) + '</div><h2>' + esc(nome) + '</h2><div class="cd-spr">' + sprImg(classSpr(k), 96) + '</div><p class="cd-desc">' + esc(longa) + '</p>' +
      (ARMAS[r.key] ? '<p class="cd-w">Armas preferidas: ' + esc(ARMAS[r.key]) + '</p>' : '') +
      (SLOTS[r.key] ? '<p class="cd-w">' + ICON_H(k) + ' Slots de ' + (caster(k) ? 'feitiço' : 'habilidade') + ': ' + SLOTS[r.key] + '</p>' : '') + deltaHtml(k);
  };
  const acao = k => {
    const c = CLASSES[k], st = clState(k);
    if (st === 'avail') return '<button class="cd-hold" data-k="' + k + '"><i></i><span>SEGURE PARA DESBLOQUEAR</span></button><p class="cd-cost">Custos: ' + iconImg(['ess'], 16) + ' ' + fmt(c.cost) + ' orns</p>';
    if (st === 'own') return btn('setcls', 'USAR CLASSE', 'data-k="' + k + '"', 'cd-use');
    if (st === 'cur') return '<p class="cd-cost">Classe atual</p>';
    if (st === 'lock') return '<p class="cd-cost dn">Requer nível ' + Math.max(1, TIER_CAP[c.tier - 1]) + '</p>';
    return '<p class="cd-cost">' + esc(CL_LBL[st] || st) + '</p>';
  };
  const botoes = k => '<div class="cd-btns"><button class="cd-b" data-act="clpage" data-k="' + k + '" data-p="skills">' + ICON_H(k) + ' ' + labelH(k).toUpperCase() + '</button>' +
    '<button class="cd-b" data-act="clpage" data-k="' + k + '" data-p="passives">' + iconImg(['spark'], 16) + ' PASSIVAS</button>' +
    (temFrascos(k) ? '<button class="cd-b wide" data-act="clpage" data-k="' + k + '" data-p="flasks">' + iconImg(['mana'], 16) + ' FRASCOS DE MANA</button>' : '') + '</div>';
  const abas = (k, p) => [['skills', ICON_H(k) + ' ' + labelH(k).toUpperCase()], ['passives', iconImg(['spark'], 16) + ' HABILIDADES PASSIVAS'], ...(temFrascos(k) ? [['flasks', iconImg(['mana'], 16) + ' FRASCOS DE MANA']] : [])]
    .map(([id, h]) => '<button class="cd-tab' + (id === p ? ' on' : '') + '" data-act="clpage" data-k="' + k + '" data-p="' + id + '">' + h + '</button>').join('');
  const fechar = '<button class="cd-x" data-act="closemodal" aria-label="Fechar">✕</button>';

  mClass = (k, p = 'info') => {
    if (p === 'info') return '<div class="cd">' + cabecalho(k) + botoes(k) + acao(k) + '</div>' + fechar;
    return '<div class="cd pg">' + '<div class="cd-tabs">' + abas(k, p) + '</div><div class="cd-list">' + ({ skills: habilidades, passives: passivas, flasks: frascos }[p](k)) + '</div></div>' + fechar;
  };
  ACT.clinfo = el => { openModal(mClass, el.dataset.k); modal.classList.add('cd-full'); };
  ACT.clpage = el => { M.args = [el.dataset.k, el.dataset.p]; mBody.innerHTML = mClass(el.dataset.k, el.dataset.p); mBody.scrollTop = 0; sfx.click(); };
  const fechaBase = closeModal;
  closeModal = () => { modal.classList.remove('cd-full'); fechaBase(); };

  /* segurar o botão para desbloquear: a barra enche em ~1 s (animação CSS) e então compra a classe */
  const soltar = () => document.querySelectorAll('.cd-hold.on').forEach(b => b.classList.remove('on'));
  modal.addEventListener('pointerdown', e => { const b = e.target.closest('.cd-hold'); if (b) { b.classList.add('on'); try { b.setPointerCapture(e.pointerId); } catch {} } });
  for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) modal.addEventListener(t, soltar);
  modal.addEventListener('keydown', e => { const b = e.target.closest?.('.cd-hold'); if (b && (e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); b.classList.add('on'); } });
  modal.addEventListener('keyup', e => { if (e.key === 'Enter' || e.key === ' ') soltar(); });
  modal.addEventListener('animationend', e => {
    const b = e.target.parentElement; if (!b || !b.classList.contains('cd-hold') || !b.classList.contains('on')) return;
    b.classList.remove('on');
    if (S.ess < CLASSES[b.dataset.k].cost) { toast('Orns insuficientes.'); sfx.click(); return; }
    ACT.unlock({ dataset: { k: b.dataset.k } });
  });
  modal.addEventListener('contextmenu', e => { if (e.target.closest('.cd-hold')) e.preventDefault(); });
})();
