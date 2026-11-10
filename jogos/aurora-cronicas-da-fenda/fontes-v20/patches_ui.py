# Patches de arte, render e interface (módulos 40–90 e cabeçalho).
P = []
def add(old, new):
    P.append((old, new))

# ---------- cabeçalho ----------
add('<meta name="cidade-viva-build" content="Aurora_ciclo_030_reforjada">', '<meta name="cidade-viva-build" content="Aurora_ciclo_031_vocacoes">')
add("/* Aurora v19 — interface. Um único HUD, celular primeiro. */", "/* Aurora v20 — interface. Um único HUD, celular primeiro. */")

# ---------- 40-art: ícones ----------
add("      case 'emblem': p.rect(3, 2, 10, 8, b);", """      case 'tome': p.rect(3, 2, 10, 12, b); p.col(3, 2, 13, s); p.col(4, 2, 13, s); p.col(12, 3, 12, l); p.row(5, 12, 13, s); p.rect(6, 5, 5, 1, l); p.rect(6, 7, 5, 1, l); p.set(8, 10, l); p.set(9, 10, l); break;
      case 'soul': p.tri(8, 1, 3, 7, 13, 7, b); p.tri(3, 7, 13, 7, 8, 15, b); p.tri(8, 1, 8, 15, 13, 7, s); p.line(8, 2, 8, 13, l); p.set(6, 5, l); p.set(5, 7, '#ffffff'); p.set(6, 6, '#ffffff'); p.set(2, 3, l); p.set(13, 12, l); break;
      case 'dust': p.ell(8, 12, 5.5, 2.6, b); p.row(4, 12, 13, s); p.set(6, 11, l); p.set(9, 12, l); p.col(8, 3, 7, l); p.row(6, 10, 5, l); p.set(8, 5, '#ffffff'); p.set(3, 7, l); p.set(12, 8, l); p.set(12, 2, l); p.set(4, 3, b); break;
      case 'feed': p.ell(8, 10, 5.2, 4.6, b); p.rect(6, 3, 4, 4, b); p.row(5, 10, 6, s); p.row(4, 12, 13, s); p.col(12, 8, 12, s); p.set(6, 9, l); p.set(7, 8, l); p.col(9, 9, 11, l); p.set(8, 9, l); p.set(10, 10, l); p.set(6, 2, l); p.set(9, 2, l); break;
      case 'emblem': p.rect(3, 2, 10, 8, b);""")
add("    const gear = (type) => { const p = new Pix(16, 16); const st = '#c8d0dc'; if (G.GEAR[type].kind === 'arma')",
    "    const gear = (type) => { const p = new Pix(16, 16); const st = '#c8d0dc'; if (A.GEAR_DRAW && A.GEAR_DRAW[type]) A.GEAR_DRAW[type](p); else if (G.GEAR[type].kind === 'arma')")

# ---------- 42-art-world: placa e fachada do Estábulo ----------
add("  const SIGN = {\n", "  const SIGN = {\n    shoe: (p, x, y) => { p.ell(x + 5, y + 4, 4.6, 4.6, '#7a8090'); p.ell(x + 5, y + 4, 2.4, 2.6, '#f0e2c0'); p.rect(x + 3, y + 6, 4, 4, '#f0e2c0'); p.rect(x, y + 5, 3, 4, '#7a8090'); p.rect(x + 7, y + 5, 3, 4, '#7a8090'); p.set(x + 1, y + 3, '#3a3a44'); p.set(x + 8, y + 3, '#3a3a44'); p.set(x + 5, y, '#3a3a44'); },\n")
add("    lenharia: (d, tier) => { const r = house(96,", """    estabulo: (d, tier) => { const r = house(96, { wall: 'barn', roof: d.roof, tier, door: '#6b4424', doorW: 22, chimney: false, dormer: false, sign: 'shoe', roofH: 46, inset: 15, noUpper: 1 }); const p = r.p; p.rect(r.dx, r.wy + 22, 22, 2, '#4a3220'); p.rect(49, r.ry + 14, 10, 9, '#4a3220'); p.rect(50, r.ry + 15, 8, 7, '#e0b84a'); p.row(50, 57, r.ry + 18, '#b08a2a'); p.rect(8, r.wy + 26, 12, 8, '#e0b84a'); p.row(8, 19, r.wy + 26, '#f7de8a'); p.row(8, 19, r.wy + 30, '#b08a2a'); p.col(14, r.wy + 26, r.wy + 33, '#b08a2a'); return r; },
    lenharia: (d, tier) => { const r = house(96,""")

# ---------- 50-render: montaria sob o herói ----------
add("""    const sxp = sheet.idx[fr] * 26;
    shadow(px, py, 6.5, z);
    ctx.save(); ctx.translate(px, py);""", """    const sxp = sheet.idx[fr] * 26;
    /* v20: fora das muralhas o herói cavalga; a montaria é desenhada por baixo e ele sobe alguns pixels */
    let lift = 0, mSheet = null;
    if (isHero && e.mount && !fallen && !Wd.inTown(e.x, e.y)) { const mt = G.mountOf(e); mSheet = mt ? A.mountSheet(mt.k) : null; if (mSheet) lift = 8 * z; }
    shadow(px, py, mSheet ? 9 : 6.5, z);
    ctx.save(); ctx.translate(px, py);""")
add("    ctx.drawImage(sheet.cv, sxp, 0, 26, 30, -13 * z, -27 * z, 26 * z, 30 * z);\n    if (e.flash > 0) { ctx.globalAlpha = 0.75; ctx.drawImage(A.flashOf(sheet.cv), sxp, 0, 26, 30, -13 * z, -27 * z, 26 * z, 30 * z); ctx.globalAlpha = 1; }",
    "    if (mSheet) ctx.drawImage(mSheet, (e.moving ? Math.floor(R.t * 8 + e._ph) % 2 : 0) * 30, 0, 30, 22, -15 * z, -20 * z, 30 * z, 22 * z);\n    ctx.drawImage(sheet.cv, sxp, 0, 26, 30, -13 * z, -27 * z - lift, 26 * z, 30 * z);\n    if (e.flash > 0) { ctx.globalAlpha = 0.75; ctx.drawImage(A.flashOf(sheet.cv), sxp, 0, 26, 30, -13 * z, -27 * z - lift, 26 * z, 30 * z); ctx.globalAlpha = 1; }")
add("        const top = py - 29 * z;\n        ctx.font = fontS; ctx.textAlign = 'center';\n        const nm = e.name;", "        const top = py - 29 * z - lift;\n        ctx.font = fontS; ctx.textAlign = 'center';\n        const nm = e.name;")

# ---------- 60-ui ----------
add("  const IC = {\n", """  const IC = {
    shoe: '<path d="M4.5 2.5h5v9.300a2.500 2.500 0 005 0V2.500h5v9.300a7.500 7.500 0 01-15 0zM4.500 18.500h5V22h-5zM14.500 18.500h5V22h-5z"/>',
    sort: '<path d="M3 5h18v2.800H3zM3 10.600h12.500v2.800H3zM3 16.200h7v2.800H3z"/>',
    spark: '<path d="M12 1.500l2.700 7.800 7.800 2.700-7.800 2.700L12 22.500l-2.700-7.800L1.500 12l7.800-2.700z"/>',
    flower: '<circle cx="12" cy="6.500" r="3.400"/><circle cx="6.700" cy="10.400" r="3.400"/><circle cx="17.300" cy="10.400" r="3.400"/><circle cx="8.700" cy="16.600" r="3.400"/><circle cx="15.300" cy="16.600" r="3.400"/><circle cx="12" cy="12" r="2.600" fill="#0005"/>',
    unlock: '<path fill-rule="evenodd" d="M7 10V7a5 5 0 019.600-2l-2 .900A2.800 2.800 0 009.200 7v3h9.300c.800 0 1.500.700 1.500 1.500v9c0 .800-.700 1.500-1.500 1.500h-13c-.800 0-1.500-.700-1.500-1.500v-9c0-.800.700-1.500 1.500-1.500z"/>',
""")
add("  const NAV = [['reino', 'castle', 'Reino'], ['herois', 'people', 'Heróis'], ['forja', 'anvil', 'Forja'], ['missoes', 'scroll', 'Missões'], ['mais', 'grid', 'Mais']];",
    "  const NAV = [['reino', 'castle', 'Reino'], ['herois', 'people', 'Heróis'], ['forja', 'anvil', 'Forja'], ['armazem', 'chest', 'Armazém'], ['missoes', 'scroll', 'Missões'], ['mais', 'grid', 'Mais']];")
add("    herois: () => G.S.heroes.filter((h) => G.canPromote(h) || G.canRebirth(h)).length,",
    "    herois: () => G.S.heroes.filter((h) => G.canPromote(h) || G.canRebirth(h) || G.canJob(h) || G.canWake(h)).length,\n    armazem: () => 0,")
add("'<i ' + rosterV.At('class', () => (G.canPromote(x) || G.canRebirth(x) ? 'upm on' : 'upm')) + '></i></button>';",
    "'<i ' + rosterV.At('class', () => (G.canPromote(x) || G.canRebirth(x) || G.canJob(x) || G.canWake(x) ? 'upm on' : 'upm')) + '></i></button>';")
add("    if (mt > 0) for (const h of S.heroes) { const c = G.CLASSES[h.cls]; for (const [slot, type] of [['arma', c.w], ['armadura', c.a], ['acessorio', 'anel']]) { const cur = h.gear[slot];",
    "    if (mt > 0) for (const h of S.heroes) { for (const [slot, type] of G.heroSlots(h)) { if (!G.gearUnlocked(type)) continue; const cur = h.gear[slot];")
add("    for (const ev of ['bld', 'inv', 'heroes', 'daily', 'quest', 'bless', 'works', 'realm', 'rift', 'mare', 'ach', 'newday', 'promo', 'bosskill', 'boss', 'eventdone', 'hour'])",
    "    for (const ev of ['bld', 'inv', 'heroes', 'daily', 'quest', 'bless', 'works', 'realm', 'rift', 'mare', 'ach', 'newday', 'promo', 'bosskill', 'boss', 'eventdone', 'hour', 'stable', 'decor'])")
add("    if (UI.sheet) UI.sheetRefresh();\n    /* barra de chefe */", "    if (UI.sheet) UI.sheetRefresh();\n    if (G.S.tut.done && !G.S.tut.seen.v20 && !UI.modalOpen && UI.vocGuide) UI.vocGuide();\n    /* barra de chefe */")
add("<div class=\"ver\">v' + G.VERSION + ' · Reforjada · salva sozinho neste aparelho</div></div>';", "<div class=\"ver\">v' + G.VERSION + ' · Vocações · salva sozinho neste aparelho</div></div>';")

# ---------- 61-ui-sheets ----------
add("""        case 'pedreira': t = r.pedra.toFixed(1).replace('.', ',') + ' pedra/h · ' + r.minerio.toFixed(1).replace('.', ',') + ' minério/h'; break;""",
    """        case 'pedreira': t = r.pedra.toFixed(1).replace('.', ',') + ' pedra/h · ' + r.minerio.toFixed(1).replace('.', ',') + ' minério/h'; break;
        case 'estabulo': t = (1 + l) + ' baias · ' + r.racao.toFixed(1).replace('.', ',') + ' ração/h · estoque ' + G.resCap('racao') + ' · doma até ' + G.MOUNT_IDS.filter((k) => G.MOUNTS[k].est <= l).map((k) => G.MOUNTS[k].name.split(' ')[0]).pop(); break;""")
add("    title: 'Reino', tabs: [['geral', 'Visão geral'], ['obras', 'Construções'], ['publicas', 'Obras públicas'], ['mercado', 'Mercado']],\n    render(tab, sub) {\n      const S = G.S;",
    "    title: 'Reino', tabs: [['geral', 'Visão geral'], ['obras', 'Prédios'], ['decor', 'Decoração'], ['estabulo', 'Estábulo'], ['publicas', 'Obras públicas'], ['mercado', 'Mercado']],\n    badge: { decor: () => G.DECOR.filter((d) => G.decorLvl(d.id) === 0 && G.canDecor(d.id).ok).length },\n    render(tab, sub) {\n      const S = G.S;\n      if (tab === 'decor') return tabDecor();\n      if (tab === 'estabulo') return tabEstabulo();")
# espólio do reino: esconder recursos especiais (ficam no Armazém)
add("        const mats = Object.keys(S.res).filter((k) => G.BASE_RES.indexOf(k) < 0 && S.res[k] >= 1);\n        if (mats.length) { h += '<div class=\"sec\">Espólio dos heróis</div>",
    "        const mats = Object.keys(S.res).filter((k) => G.RES[k] && G.BASE_RES.indexOf(k) < 0 && !G.RES[k].sp && S.res[k] >= 1);\n        if (mats.length) { h += '<div class=\"sec\">Espólio dos heróis</div>")
add("        let h = S.ev.caravan === S.day ? '<div class=\"card hl\"><h3>' + ic('gift') + ' Caravana do Leste na cidade</h3><p>Tudo o que você vender hoje rende o dobro.</p></div>' : '';",
    "        let h = S.ev.caravan === S.day ? '<div class=\"card hl\"><h3>' + ic('gift') + ' Caravana do Leste na cidade</h3><p>Tudo o que você vender hoje rende o dobro.</p></div>' : '';\n        h += mascateCard();")
add("        const mats = Object.keys(S.res).filter((k) => G.BASE_RES.indexOf(k) < 0 && S.res[k] >= 1);\n        h += '<div class=\"sec\">Espólio</div>';",
    "        const mats = Object.keys(S.res).filter((k) => G.RES[k] && G.BASE_RES.indexOf(k) < 0 && !G.RES[k].sp && S.res[k] >= 1);\n        h += '<div class=\"sec\">Espólio</div>';")
# forja: a vitrine virou o Armazém
add("    title: 'Forja', tabs: [['forjar', 'Forjar'], ['arsenal', 'Vitrine']],", "    title: 'Forja', tabs: [['forjar', 'Forjar'], ['arsenal', 'Armazém']],")
add("""      for (const type of G.GEAR_IDS) {
        const g = G.GEAR[type], r = G.recipe(type, forgeTier),""", """      for (const type of G.GEAR_IDS) {
        if (!G.gearUnlocked(type)) { h += '<div class="card lock"><div class="row"><i class="gi px gi-' + type + '"></i><div class="gr"><h3>' + G.GEAR[type].name + ' ' + ic('lock') + '</h3><p>Requer Ferraria nível ' + G.GEAR[type].req + '. Todos os heróis usam.</p></div></div></div>'; continue; }
        const g = G.GEAR[type], r = G.recipe(type, forgeTier),""")
add("        const users = g.kind === 'acessorio' ? 'Todos' : G.CLASS_IDS", "        const users = g.kind !== 'arma' && g.kind !== 'armadura' ? 'Todos' : G.CLASS_IDS")
add("  const SHEETS = { reino, herois, forja, missoes, mais };", "  const SHEETS = { reino, herois, forja, armazem, missoes, mais };")
add("    rebirth: (a) => { const h = hero(a[0]); if (h) UI.confirm('Renascer ' + h.name + '?', 'Volta ao nível 1 e ao Rank E, com +30% permanentes em todos os atributos. O equipamento fica.', 'Renascer',",
    "    rebirth: (a) => { const h = hero(a[0]); if (h) UI.confirm('Renascer ' + h.name + '?', 'Volta ao nível 1 e ao Rank E, com +30% permanentes em todos os atributos. Equipamento, vocação, Artes e Despertar ficam.', 'Renascer',")
add("'O herói deixa Aurora para sempre. O equipamento dele volta para a vitrine.'", "'O herói deixa Aurora para sempre. O equipamento dele volta para o Armazém e a montaria, para o Estábulo.'")
add("Aurora — Crônicas da Fenda · v' + G.VERSION + ' \"Reforjada\"<br>", "Aurora — Crônicas da Fenda · v' + G.VERSION + ' \"Vocações\"<br>")

# ---------- 62-ui-modals ----------
add("const ok = S.heroes.filter((h) => { const c = G.CLASSES[h.cls]; return g.kind === 'acessorio' || c.w === it.type || c.a === it.type; });",
    "const ok = S.heroes.filter((h) => { const c = G.CLASSES[h.cls]; return (g.kind !== 'arma' && g.kind !== 'armadura') || c.w === it.type || c.a === it.type; });")
add("O equipamento antigo volta para a vitrine.</p>';", "O equipamento antigo volta para o Armazém.</p>';")
add("G.emit('start', { fresh: false }); } else { G.emit('heroes'); }", "G.emit('start', { fresh: false }); } else { G.emit('heroes'); G.emit('decor'); }")
