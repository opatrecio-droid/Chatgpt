/* ===== Números calibrados com o vídeo do original (v3.27.3) =====
   Cada valor abaixo foi lido na tela de Status e no combate do vídeo; ver ESPECIFICACAO-TELAS.md.
   - Guerreiro nível 12 com Espada Enferrujada e Jaqueta de Couro: HP 220, mana 27, ataque 25, defesa 21,
     magia 6, resistência 18, destreza 16, iniciativa 24. Nível 1 (capturas anteriores): 110/20/15/15/5/12/10.
   - Iniciativa = 1,5 × destreza (16 → 24).
   - Lorde Goblin nível 8: 170 de HP.
   - Total de XP do nível 12: 10.241 (+65 para o próximo) = tabela comunitária já embutida. */
(() => {
  /* crescimento por nível do herói até o nível 24; acima disso mantém o ritmo anterior, para não
     desequilibrar masmorra automática, arena e economia, que foram ajustadas em cima dele */
  const V1 = { hp: 110, mp: 20, atk: 10, mag: 5, def: 10, res: 10, dex: 10 };
  const G = { hp: 10, mp: .64, atk: .91, mag: .09, def: .55, res: .55, dex: .55 };
  const BREAK = 24;
  const real = L => Object.fromEntries(Object.keys(V1).map(k => [k, V1[k] + G[k] * (L - 1)]));
  const oldBase = baseStats;
  baseStats = L => {
    if (L <= BREAK) return real(L);
    const o = oldBase(L), o0 = oldBase(BREAK), r0 = real(BREAK);
    return Object.fromEntries(Object.keys(V1).map(k => [k, r0[k] + (o[k] - o0[k])]));
  };

  const oldStats = stats;
  stats = set => { const st = oldStats(set); st.init = Math.round(st.dex * 1.5); return st; };

  /* chefes de tier 1: HP = base + delta × (nível − 1) / 3, que dá 170 para o Lorde Goblin nível 8 */
  const oldMon = monStats;
  monStats = (k, L) => {
    const st = oldMon(k, L), row = Catalog.byKey[k], n = row && Numeric.monsters[normalizeName(row.nameEn)];
    if (row && !row.hp && n && n.kind === 'Boss' && n.tier === 1 && n.hpBase != null && n.hpDelta != null) st.hp = Math.round(n.hpBase + n.hpDelta * (L - 1) / 3);
    return st;
  };

  /* nome inicial gerado, no formato do original: AdjetivoAdjetivoSubstantivo + número */
  const ADJ = ['Wild', 'Vicious', 'Brave', 'Swift', 'Silent', 'Grim', 'Lucky', 'Mighty', 'Crimson', 'Shadow', 'Iron', 'Golden', 'Fierce', 'Noble', 'Rogue', 'Stormy', 'Clever', 'Bold'];
  const NOUN = ['Maverick', 'Wanderer', 'Falcon', 'Wolf', 'Raven', 'Knight', 'Ranger', 'Drifter', 'Viking', 'Phoenix', 'Hawk', 'Bear', 'Tiger', 'Dragon', 'Sage', 'Fox'];
  const pick1 = a => a[Math.floor(Math.random() * a.length)];
  const baseTitle = initTitle;
  initTitle = () => {
    baseTitle();
    const f = document.getElementById('hero-name');
    if (f && (f.value === 'Aren' || !f.value)) f.value = pick1(ADJ) + pick1(ADJ) + pick1(NOUN) + (100 + Math.floor(Math.random() * 900));
  };
})();
