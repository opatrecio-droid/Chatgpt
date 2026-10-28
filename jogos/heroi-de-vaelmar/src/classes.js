/* ===== Caminhos de classe no estilo do original (v3.27.3) =====
   Árvore por caminho (Bravura · Omnimancia · Magia das Sombras), cartões como no vídeo do usuário
   e contagens reais de feitiços/habilidades do catálogo. Referência: ESPECIFICACAO-TELAS.md.

   VERIFICADO nos dois vídeos: Guerreiro, Mago e Ladrão, tiers 1–10. As contagens de habilidades do
   catálogo batem com as do jogo em todos os cartões (por isso Peregrino = "Ladino", Criador de sombras =
   "Feiticeiro das Sombras", Feiticeiro = "Tecelão de Feitiços", Arcano = "Arcânico"). Híbridos do tier 4:
   Mago-Espadachim (guerreiro+mago), Místico (mago+ladrão) e Lanceiro, que o jogo chama de "Adepto"
   (guerreiro+ladrão); no tier 7: Paladino, Arquidruida e Magistrado. */
(() => {
  const c = Catalog.canonicalClass;
  /* [tier 1, …, tier 10]; cada tier é uma lista de chaves do catálogo */
  const TREE = {
    guerreiro: [['c_0'], ['c_92'], ['c_93'], ['c_24', 'c_10'], ['c_94'], ['c_95'], ['c_96', 'c_31'], ['c_36'], ['c_50'], ['c_54']],
    mago:      [['c_1'], ['c_4'], ['c_86'], ['c_10', 'c_11'], ['c_87'], ['c_88'], ['c_29', 'c_96'], ['c_37'], ['c_52'], ['c_55']],
    ladino:    [['c_2'], ['c_5'], ['c_89'], ['c_11', 'c_24'], ['c_91'], ['c_90'], ['c_31', 'c_29'], ['c_38'], ['c_51'], ['c_56']],
    /* quarto caminho, visto no segundo vídeo: começa no nível 50 (tier 3) e não tem ramificações */
    valhala:   [['c_97'], ['c_98'], ['c_100'], ['c_101'], ['c_30'], ['c_39'], ['c_53'], ['c_57']],
  };
  PATHS.valhala = { tiers: [] };
  /* tiers cujo conteúdo não foi visto no vídeo (índice 0 = tier 1); hoje não resta nenhum */
  const INFERIDO = { guerreiro: [], mago: [], ladino: [] };
  window.CLASS_INFERIDO = INFERIDO;

  const PATH_META = {
    guerreiro: { n: 'Caminho do Guerreiro', v: 'Bravura', emblem: '#2f7fd8' },
    mago:      { n: 'Caminho do Mago', v: 'Omnimancia', emblem: '#b05ae8' },
    ladino:    { n: 'Caminho do Ladrão', v: 'Magia das Sombras', emblem: '#7a4ad0' },
    valhala:   { n: 'Caminho do Adestrador', v: 'Valhala', emblem: '#5fae3a' },
  };
  /* nomes do jogo que diferem do Codex; descrições vistas nos vídeos */
  const NOME = { c_97: 'Treinador', c_2: 'Gatuno', c_5: 'Ladino', c_24: 'Adepto', c_38: 'Arcânico', c_88: 'Tecelão de Feitiços', c_89: 'Feiticeiro das Sombras' };
  const DESC = {
    c_0: 'Um lutador com a Cavalaria em seu futuro.', c_92: 'Um novato no campo de batalha.', c_93: 'Em caminho para Aspirante a Cavaleiro.', c_94: 'Temido no campo de batalha.',
    c_95: 'Com poder de mythril.', c_36: 'Com espada e poder divino.', c_50: 'Temperado e robusto.',
    c_1: 'Um jovem aprendiz de magos de Avalon.', c_4: 'Um mago graduado.', c_86: 'Um mago reconhecido pela realeza.', c_87: 'Praticando magia de feras e da natureza.',
    c_88: 'Lançar e lançar novamente.', c_37: 'Uma das magias proibidas.', c_52: 'Mestre dos elementos.',
    c_2: 'Um ladino despreparado.', c_5: 'Um ladino com treinamento.', c_89: 'Um com as sombras.', c_91: 'Treinado nas artes arcanas de Annwn.', c_90: 'Mais habilidoso nas sombras.',
    c_38: 'Um assassino de Annwn.', c_51: 'Assassino elusivo de Annwn.', c_56: 'Mestre dos ocultos.',
    c_97: 'Um aprendiz de manipulador de bestas.', c_98: 'Um novato no manejo de feras.', c_100: 'Um habilidoso manipulador de grandes feras.', c_101: 'Aquele que é reconhecido pelos anciãos Nórdicos.',
    c_30: 'Cavaleiro de grandes dragões.', c_39: 'Guardião de grandes dragões.', c_53: 'O filho de grandes dragões.', c_57: 'Ele próprio um grande dragão.',
  };
  /* classes de Valhalla que o jogo trata como conjuradoras (Feitiços) apesar de começarem pelo equipamento do guerreiro */
  const CONJURADORAS = new Set(['c_30', 'c_39', 'c_53', 'c_57']);
  window.classeConjuradora = k => CLASSES[k].gear[0] === 'mago' || CONJURADORAS.has(CLASSES[k].original);
  const keyOf = k => c(k);

  for (const [pk, tiers] of Object.entries(TREE)) {
    Object.assign(PATHS[pk], PATH_META[pk]);
    PATHS[pk].tiers = tiers.map(list => list.map(keyOf).filter(k => CLASSES[k]));
  }
  const ORDER = ['guerreiro', 'mago', 'ladino', 'valhala'];
  const STAR_COL = ['#fff', '#fff', '#fff', '#f5d76e', '#6fd25a', '#4f9cf0', '#a15cf0', '#ef5a5a', '#f07ab8', '#f0963c'];
  const starsHtml = t => t <= 4 ? '<span style="color:' + STAR_COL[t - 1] + '">' + '★'.repeat(t) + '</span>' : '<span style="color:' + STAR_COL[t - 1] + '">★</span> <small>' + t + '</small>';

  window.classStarsHtml = starsHtml;
  window.CLASS_DESC = DESC;
  const emblem = (pk, size = 26) => '<svg class="cp-emblem" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" aria-hidden="true">' + ({
    guerreiro: '<path d="M12 2 20 5v7c0 5-3.6 8.6-8 10-4.4-1.4-8-5-8-10V5z" fill="#2a63b4" stroke="#bcd6ff" stroke-width="1.4"/><path d="M12 6l4 2v4c0 2.8-1.8 4.8-4 5.8-2.2-1-4-3-4-5.8V8z" fill="#4fa0f0"/>',
    mago: '<circle cx="12" cy="12" r="9.5" fill="#2b1f4a" stroke="#d9c8ff" stroke-width="1.2"/><path d="M12 3l2 7 7 2-7 2-2 7-2-7-7-2 7-2z" fill="#f0a63c"/><circle cx="12" cy="12" r="2.4" fill="#7ad0ff"/>',
    valhala: '<circle cx="12" cy="12" r="9.5" fill="#1d3a16" stroke="#9bd37a" stroke-width="1.2"/><path d="M12 5v14M12 12 7.5 7.5M12 12l4.5-4.5M12 16.5 8.5 13M12 16.5l3.5-3.5" stroke="#d8f5b8" stroke-width="1.7" fill="none" stroke-linecap="round"/>',
    ladino: '<circle cx="12" cy="12" r="9.5" fill="#241040" stroke="#c9b0ff" stroke-width="1.2"/><path d="M12 4a8 8 0 1 0 8 8 5.5 5.5 0 0 1-8-8z" fill="#9a62f0"/><circle cx="16" cy="8" r="1.6" fill="#e9dcff"/>',
  }[pk]) + '</svg>';

  const counts = k => {
    const row = Catalog.byKey[CLASSES[k].original] || {}, sk = row.sections?.Skills || [], ab = row.sections?.Abilities || [];
    const caster = window.classeConjuradora(k);
    return '<span class="cp-n">' + iconImg(caster ? ['staff', { orb: '#6e8cff' }] : ['sword', { metal: '#d8e0ec' }], 16) + (caster ? 'Feitiços' : 'Habilidades') + ': ' + sk.length + '</span>' +
      '<span class="cp-n">' + iconImg(['spark'], 16) + 'Habilidades: ' + ab.length + '</span>';
  };
  const nameOf = k => NOME[CLASSES[k].original] || CLASSES[k].n.split(' / ')[0];
  window.classNome = nameOf;
  const descOf = k => DESC[CLASSES[k].original] || '';
  const showSprite = st => st === 'cur' || st === 'own' || st === 'avail';
  /* silhueta por CSS: silhouette() congelaria um sprite do catálogo que ainda não carregou */
  const spriteHtml = (k, st, size) => showSprite(st) ? sprImg(classSpr(k), size) : '<span class="cp-sil">' + sprImg(classSpr(k), size) + '</span>';
  function card(k, two) {
    const st = clState(k);
    const cls = 'cp-card' + (two ? ' two' : '') + ' st-' + st;
    if (two) {
      const paths = ORDER.filter(p => CLASSES[k].gear.includes(p));
      return '<button class="' + cls + '" data-act="clinfo" data-k="' + k + '">' + spriteHtml(k, st, 64) + '<b>' + esc(nameOf(k)) + '</b><span class="cp-paths">' + paths.map(p => emblem(p, 14)).join('') + '</span></button>';
    }
    return '<button class="' + cls + '" data-act="clinfo" data-k="' + k + '">' + spriteHtml(k, st, 56) + '<span class="cp-body"><b>' + esc(nameOf(k)) + '</b><span class="cp-desc">' + esc(descOf(k)) + '</span><span class="cp-counts">' + counts(k) + '</span></span></button>';
  }
  function specials() {
    const used = new Set(ORDER.flatMap(p => PATHS[p].tiers.flat()));
    const rest = Object.keys(CLASSES).filter(k => !used.has(k) && CLASSES[k].tier <= 7).sort((a, b) => CLASSES[a].tier - CLASSES[b].tier);
    if (!rest.length) return '';
    return '<h3 class="cp-sec">Classes especiais</h3><p class="fine" style="text-align:center">Prêmios de desafio, missões e eventos. Não fazem parte dos caminhos.</p><div class="cp-grid">' + rest.map(k => card(k, true)).join('') + '</div>';
  }

  vClasses = () => {
    const pk = ORDER.includes(P.path) ? P.path : ORDER.includes(pathOf()) ? pathOf() : 'guerreiro', i = ORDER.indexOf(pk), PA = PATHS[pk];
    /* os caminhos formam uma fila (Bravura › Omnimancia › Magia das Sombras › Valhala): nas pontas a seta fica apagada */
    const pPrev = ORDER[i - 1], pNext = ORDER[i + 1];
    const lado = (p, d) => p ? '<button data-act="path" data-d="' + d + '" aria-label="' + (d < 0 ? 'Caminho anterior' : 'Próximo caminho') + '">' + (d < 0 ? '<span class="ar">‹</span>' + emblem(p, 28) : emblem(p, 28) + '<span class="ar">›</span>') + '<small>' + esc(PATHS[p].v) + '</small></button>'
      : '<button disabled class="off" aria-hidden="true"><span class="ar" style="' + (d < 0 ? 'left:0' : 'right:0') + '">' + (d < 0 ? '‹' : '›') + '</span></button>';
    let h = '<div class="cp-bar">' + lado(pPrev, -1) +
      '<div class="cp-title"><small>' + esc(PA.n) + '</small><b>' + emblem(pk, 22) + esc(PA.v.toUpperCase()) + '</b></div>' + lado(pNext, 1) + '</div>';
    PA.tiers.forEach((list, ti) => {
      const t = CLASSES[list[0]].tier; /* Valhala começa no tier 3 */
      if (ti) h += '<div class="cp-chev" aria-hidden="true">︾</div>';
      h += '<div class="cp-tier"><span class="st">' + starsHtml(t) + '</span><span class="lv">NÍVEL ' + Math.max(1, TIER_CAP[t - 1]) + '</span></div>';
      h += list.length > 1 ? '<div class="cp-duo">' + list.map(k => card(k, true)).join('') + '</div>' : list.map(k => card(k, false)).join('');
    });
    h += box('Especialização', '<p class="fine">A partir do nível 20. Vale para qualquer classe. A primeira escolha é grátis; trocar custa 2.000 orns.</p>' + Object.keys(SPECS).map(k => {
      const sp = SPECS[k], cost = S.specUsed ? 2000 : 0, on = S.spec === k;
      return '<div class="srow"><span style="min-width:0"><b>' + sp.n + '</b><br><span class="fine">' + sp.d + '</span></span>' + (on ? '<span class="badge y">Ativa</span>' : S.lvl < 20 ? '<span class="badge">Nível 20</span>' : btn('spec', cost ? 'Trocar · ' + fmt(cost) : 'Escolher', 'data-k="' + k + '"' + (S.ess < cost ? ' disabled' : ''))) + '</div>';
    }).join(''));
    return h + specials();
  };
  VIEWS.classes.r = vClasses;
  ACT.path = el => { const i = ORDER.indexOf(ORDER.includes(P.path) ? P.path : ORDER.includes(pathOf()) ? pathOf() : 'guerreiro'), j = Math.max(0, Math.min(ORDER.length - 1, i + +el.dataset.d)); if (j === i) return; P.path = ORDER[j]; renderPanel(); scrollEl.scrollTop = 0; sfx.click(); };
})();
