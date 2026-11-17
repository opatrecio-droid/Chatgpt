# Aurora 046 · Ferreiro: mostra todos os graus (inclusive bloqueados, com cadeado)
# e uma seção "Armas de classe" com as armas da Oficina de Classes.
# Cada âncora precisa ocorrer exatamente uma vez no arquivo de origem.

HELPERS = r"""  const lockSvg = '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="#e2c27a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5.2 7V5.3a2.8 2.8 0 0 1 5.6 0V7"/><rect x="3.6" y="7" width="8.8" height="6.6" rx="1.4" fill="#e2c27a" fill-opacity=".22"/></svg>';
  const lockBadge = '<span class="e2-lock" aria-hidden="true">' + lockSvg + '</span>';
  const inlineLock = '<span class="e2-lock-inline" aria-hidden="true">' + lockSvg + '</span>';
  const cardHtml = d => {
    const q = quote(d, 1), locked = G.bLvl('ferraria') < (d.minLevel || 1);
    return '<button class="e2-gear-card' + (locked ? ' e2-locked' : '') + '" data-a="e2craftopen:' + esc(d.id) + '" data-e2-gear="' + esc(d.id) + '" style="--e2-rarity:' + (rarColors[d.rar] || rarColors[0]) + '" aria-label="Ver receita de ' + esc(d.name) + (locked ? ' (bloqueado)' : '') + '">' + lockBadge + art(d) + '<b>' + esc(d.name) + '</b><small>' + esc(rarityLabel(d.rar)) + '</small><span class="e2-craft-state' + (q.ok ? ' ready' : '') + '">' + (locked ? 'Ferraria Nv.' + d.minLevel : q.ok ? 'Fabricar' : 'Ver receita') + '</span></button>';
  };
  const gridHtml = rows => {
    let last = -1;
    return rows.map(d => {
      const g = gradeOf(d);
      let head = '';
      if (grade === 'all' && g !== last) {
        last = g;
        const locked = G.bLvl('ferraria') < g + 1;
        head = '<div class="e2-grade-head"><span>' + esc(grades[g] || grades[0]) + '</span>' + (locked ? '<em>' + inlineLock + ' Ferraria Nv.' + (g + 1) + '</em>' : '') + '</div>';
      }
      return head + cardHtml(d);
    }).join('');
  };
  const classGear = () => {
    if (!G.HUNTER_GEAR || !G.EQUIPMENT) return [];
    return (G.HUNTER_GEAR.catalog || []).filter(d => d && G.GEAR[d.type] && G.GEAR[d.type].kind === 'arma' && (!craftableOnly || G.EQUIPMENT.craftQuote(d.id).ok));
  };
  const classCardHtml = d => {
    const q = G.EQUIPMENT.craftQuote(d.id), locked = !q.ok && !/^(Faltam|O tesouro|Armazém)/.test(q.why || '');
    const info = G.HUNTER_GEAR.classes[d.hunterClass] || {};
    return '<button class="e2-gear-card e2-class-card' + (locked ? ' e2-locked' : '') + '" data-a="hgopen:' + esc(d.hunterClass) + '" data-e2-class-gear="' + esc(d.id) + '" style="--e2-rarity:' + (rarColors[d.rar] || rarColors[0]) + ';--e2-class:' + esc(info.color || '#c4a769') + '" aria-label="' + esc(d.name) + (locked ? ' (bloqueado)' : '') + '">' + (locked ? lockBadge : '') + '<span class="e2-art" style="--e2-rarity:' + (rarColors[d.rar] || rarColors[0]) + '">' + UI.gi({id: 0, type: d.type, tier: d.tier || 1, rar: d.rar, rank: d.rank, rankOrigin: 0, plus: 0, eqCatalog: d.id}) + '</span><b>' + esc(d.name) + '</b><small>Etapa ' + esc(String(d.hunterStage || 1)) + '</small><span class="e2-craft-state">' + esc(locked ? (q.why || 'Bloqueada') : 'Abrir Oficina') + '</span></button>';
  };
  const classSection = items => {
    if (!items.length) return '';
    const H = G.HUNTER_GEAR;
    const groups = Object.keys(H.classes).map(cls => {
      const list = items.filter(d => d.hunterClass === cls);
      if (!list.length) return '';
      const info = H.classes[cls];
      return '<div class="e2-class-group"><h4 class="e2-class-head" style="--e2-class:' + esc(info.color) + '">' + esc(info.name) + '</h4><div class="e2-forge-grid">' + list.map(classCardHtml).join('') + '</div></div>';
    }).join('');
    return '<section class="e2-class-gear" data-e2-class-section><h3 class="e2-class-title">Armas de classe</h3>' + groups + '</section>';
  };

"""

PATCHES = [
    # Começa em "Todos os graus" (valor 'all')
    ("let grade = '0', kind = 'all'",
     "let grade = 'all', kind = 'all'"),
    # Insere os helpers antes do método principal
    ("  UI.e2Forge = () => {",
     HELPERS + "  UI.e2Forge = () => {"),
    # Linhas: 'all' ordena por grau (sort estável); armas de classe contam no total
    ("    const rows = list().filter(d => (gradeOf(d) === Number(grade)) && (kind === 'all' || typeKind(d) === kind) && (!craftableOnly || quote(d, 1).ok));",
     "    const isAll = grade === 'all';\n"
     "    const rows = list().filter(d => (isAll || gradeOf(d) === Number(grade)) && (kind === 'all' || typeKind(d) === kind) && (!craftableOnly || quote(d, 1).ok));\n"
     "    if (isAll) rows.sort((a, b) => gradeOf(a) - gradeOf(b));\n"
     "    const classRows = (kind === 'all' || kind === 'arma') ? classGear() : [];\n"
     "    const shownCount = rows.length + classRows.length;"),
    # Opção "Todos os graus" e remoção do disabled dos graus bloqueados
    ("aria-label=\"Filtrar grau do equipamento\">' + options.map(o =>",
     "aria-label=\"Filtrar grau do equipamento\"><option value=\"all\"' + (grade === 'all' ? ' selected' : '') + '>Todos os graus</option>' + options.map(o =>"),
    ("(G.bLvl('ferraria') < o.minLevel ? ' disabled' : '') + '>' + esc(o.name)",
     "'>' + esc(o.name)"),
    # Contador
    ("<small data-e2-catalog-count>' + rows.length + ' receitas</small>",
     "<small data-e2-catalog-count>' + shownCount + ' receitas</small>"),
    # Grade de cards com cabeçalhos de grau + seção de armas de classe
    ("      '<div class=\"e2-forge-grid\">' + rows.map(d => {\n"
     "        const q = quote(d, 1), locked = G.bLvl('ferraria') < (d.minLevel || 1);\n"
     "        return '<button class=\"e2-gear-card\" data-a=\"e2craftopen:' + esc(d.id) + '\" data-e2-gear=\"' + esc(d.id) + '\" style=\"--e2-rarity:' + (rarColors[d.rar] || rarColors[0]) + '\" aria-label=\"Ver receita de ' + esc(d.name) + '\">' + art(d) + '<b>' + esc(d.name) + '</b><small>' + esc(rarityLabel(d.rar)) + '</small><span class=\"e2-craft-state' + (q.ok ? ' ready' : '') + '\">' + (locked ? 'Ferraria Nv.' + d.minLevel : q.ok ? 'Fabricar' : 'Ver receita') + '</span></button>';\n"
     "      }).join('') + '</div>' + (rows.length ? '' : ",
     "      '<div class=\"e2-forge-grid\">' + gridHtml(rows) + '</div>' + classSection(classRows) + (shownCount ? '' : "),
    # Tick: alterna e2-locked e aria-label conforme o nível atual
    ("        state.classList.toggle('ready', q.ok);",
     "        const lockedNow = G.bLvl('ferraria') < (d.minLevel || 1);\n"
     "        button.classList.toggle('e2-locked', lockedNow);\n"
     "        button.setAttribute('aria-label', 'Ver receita de ' + d.name + (lockedNow ? ' (bloqueado)' : ''));\n"
     "        state.classList.toggle('ready', q.ok);"),
]


def apply(html: str) -> str:
    for old, new in PATCHES:
        n = html.count(old)
        if n != 1:
            raise SystemExit('patch_ferreiro: âncora encontrada %d vezes: %s' % (n, old[:80]))
        html = html.replace(old, new)
    return html
