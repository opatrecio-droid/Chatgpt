# v21: trocas pontuais sobre o HTML da v20.
P = []
def add(old, new, n=1):
    P.append((old, new, n))

# ---------- versão ----------
add("G.VERSION = '20.0';", "G.VERSION = '21.0';")
add("Aurora_ciclo_031_vocacoes", "Aurora_ciclo_032_legado", 2)
add("""· v20 "Vocações\"""", """· v21 "Legado\"""")
add("' · Vocações · salva sozinho", "' · Legado · salva sozinho")
add("""v' + G.VERSION + ' "Vocações"<br>""", """v' + G.VERSION + ' "Legado"<br>""")
add("UI.modal('<div class=\"eyebrow\">Aurora v' + G.VERSION + ' · Vocações</div>", "UI.modal('<div class=\"eyebrow\">Aurora · Vocações</div>")

# ---------- estado ----------
add("  mascate: { day: 0, offers: [] },   // ofertas do comerciante errante",
    "  mascate: { day: 0, offers: [] },   // ofertas do comerciante errante\n  diff: 1,          // dificuldade do reino (0 Fácil … 3 Pesadelo)\n  cos: {},          // guarda-roupa: id -> cópias\n  paths: {},        // Caminhos já resgatados\n  decorPos: {},     // enfeites movidos: id -> posições")
add("j2: null, j3: null, sk: [1, 1, 1], arts: {}, ap: 0, apB: 0, wake: 0, mount: 0, tS2: 5, tS3: 8, bv: {}, shield: 0,",
    "j2: null, j3: null, sk: [1, 1, 1], arts: {}, ap: 0, apB: 0, wake: 0, mount: 0, tS2: 5, tS3: 8, bv: {}, shield: 0,\n      cos: { traje: null, asas: null, pet: null, reliquia: null }, autoArt: 0,")

# ---------- dificuldade ----------
add("      hpMax: Math.round(42 * p * d.hp * (el ? 3.2 : 1) * (o.hpMult || 1)), atk: 11.5 * p * d.atk * (el ? 1.45 : 1) * night * red * (o.atkMult || 1),",
    "      hpMax: Math.round(42 * p * d.hp * (el ? 3.2 : 1) * (o.hpMult || 1) * (o.rift ? 1 : G.diffCur().hp)), atk: 11.5 * p * d.atk * (el ? 1.45 : 1) * night * red * (o.atkMult || 1) * (o.rift ? 1 : G.diffCur().atk),")
add("* night * (m.raid ? 0.7 : 1);\n", "* night * (m.raid ? 0.7 : 1) * (m.rift ? 1 : G.diffCur().rw);\n")
add("* G.bless('fortuna') * night * (1 + hst.goldF);", "* G.bless('fortuna') * night * (1 + hst.goldF) * (m.rift ? 1 : G.diffCur().rw);")
add("* G.bless('colheita') * (1 + G.bestBonus(d.fam)) * red;", "* G.bless('colheita') * (1 + G.bestBonus(d.fam)) * red * (m.rift ? 1 : G.diffCur().drop);")
add("      const l = G.zoneLvl(z, S.zones[z.id].tier);\n      if (l < lowL)", "      const l = G.zoneLvl(z, S.zones[z.id].tier) + G.diffCur().shift;\n      if (l < lowL)")
add("    const zd = G.ZONE[z], l = G.zoneLvl(zd, G.S.zones[z].tier), st = G.heroStats(h);", "    const zd = G.ZONE[z], l = G.zoneLvl(zd, G.S.zones[z].tier) + G.diffCur().shift, st = G.heroStats(h);")
add("        const need = m.lvl + (h.caution === 0 ? -1 : 1) - Math.min(3, allies);", "        const need = m.lvl + (h.caution === 0 ? -1 : 1) - Math.min(3, allies) + (m.rift ? 0 : G.diffCur().shift);")

# ---------- relíquias ----------
add("      zs.boss = 0; zs.bossKills++; S.stats.bosses++;", "      zs.boss = 0; zs.bossKills++; S.stats.bosses++;\n      if (S.diff >= 2) S.stats.hardBoss = (S.stats.hardBoss || 0) + 1;\n      G.relicRoll(z.id, h);")
add("    const tomos = 1 + Math.floor(f / 4), almas = f % 5 === 0 ? 2 : 0; G.addRes('tomo', tomos); if (almas) G.addRes('alma', almas);",
    "    const tomos = 1 + Math.floor(f / 4), almas = f % 5 === 0 ? 2 : 0; G.addRes('tomo', tomos); if (almas) G.addRes('alma', almas);\n    if (f % 10 === 0) { G.cosGrant('r_arauto'); G.log('A Fenda cedeu uma relíquia: ' + G.COS.r_arauto.name + '.', 'epic'); }")

# ---------- enfeites móveis ----------
add("for (const s of d.spots) if (s[2])", "for (const s of G.decorSpots(d)) if (s[2])")
add("d.spots.forEach(", "G.decorSpots(d).forEach(")
add("G.addFx({ t: 'build', x: d.spots[0][0], y: d.spots[0][1] });", "G.addFx({ t: 'build', x: G.decorSpots(d)[0][0], y: G.decorSpots(d)[0][1] });")
add("data-a=\"goto:' + d.spots[0][0] + ':' + d.spots[0][1] + '\"'", "data-a=\"goto:' + G.decorSpots(d)[0][0] + ':' + G.decorSpots(d)[0][1] + '\"'")
add("+ '</div>';\n      void r;", "+ (l && G.decorMovable(d.id) ? '<div class=\"row\" style=\"margin-top:8px\"><span class=\"gr mut\" style=\"font-size:11.5px\">' + (G.S.decorPos[d.id] ? 'No lugar que você escolheu.' : 'No lugar original.') + '</span>' + (G.S.decorPos[d.id] ? '<button class=\"btn sm\" data-a=\"decreset:' + d.id + '\">Restaurar</button>' : '') + '<button class=\"btn sm\" data-a=\"decmove:' + d.id + '\">' + ic('map') + 'Mover</button></div>' : '') + '</div>';\n      void r;")
add("    if (!G.S || !G.M.running) return;\n    const r = R.pick(x, y);", "    if (!G.S || !G.M.running) return;\n    if (UI.placing && UI.placeTap) return UI.placeTap(x, y);\n    const r = R.pick(x, y);")

# ---------- arte: traje no boneco, asas e mascote no mapa ----------
add("    o.key = 'h|' + h.cls + '|'", "    const cz = h.cos && h.cos.traje && G.COS && G.COS[h.cos.traje];\n    if (cz) { const lk = cz.look; Object.assign(o, lk); if (o.hat) o.hat = sh(lk.body, 0.8); if (o.metal) o.metal = mix(lk.body, '#ffffff', 0.25); if (o.hoodC) o.hoodC = sh(lk.body, 0.75); if (o.plume) o.plume = lk.cape; if (o.shield) o.shield = lk.cape; if (o.scarf) o.scarf = lk.trim; }\n    o.key = 'h|' + (cz ? h.cos.traje : '') + '|' + h.cls + '|'")
add("  const gearKey = (h) => (h.gear.arma ? h.gear.arma.tier : 0) + '|' + (h.gear.armadura ? h.gear.armadura.tier : 0) + '|' + h.rank;",
    "  const gearKey = (h) => (h.gear.arma ? h.gear.arma.tier : 0) + '|' + (h.gear.armadura ? h.gear.armadura.tier : 0) + '|' + h.rank + '|' + ((h.cos && h.cos.traje) || '');")
add("    shadow(px, py, mSheet ? 9 : 6.5, z);", """    /* v21: o mascote segue o dono com um pequeno atraso */
    if (isHero && e.cos && e.cos.pet && A.petSheet) {
      const ps = A.petSheet(e.cos.pet);
      if (ps) {
        const gx = e.x - (e.dir || 1) * 0.95, gy = e.y + 0.14;
        if (e._ptx == null || Math.hypot(e._ptx - gx, e._pty - gy) > 6) { e._ptx = gx; e._pty = gy; }
        const k = Math.min(1, dt * 3.2), mv = Math.hypot(gx - e._ptx, gy - e._pty) > 0.08, left = mv ? gx < e._ptx : e.dir < 0;
        e._ptx += (gx - e._ptx) * k; e._pty += (gy - e._pty) * k;
        const qx = Math.round(X(e._ptx)), qy = Math.round(Y(e._pty));
        shadow(qx, qy, 3.2, z); ctx.save(); ctx.translate(qx, qy); if (left) ctx.scale(-1, 1);
        ctx.drawImage(ps, (mv ? Math.floor(R.t * 7) % 2 : Math.floor(R.t * 1.5 + e._ph) % 2) * 14, 0, 14, 12, -7 * z, -11 * z, 14 * z, 12 * z); ctx.restore();
      }
    }
    shadow(px, py, mSheet ? 9 : 6.5, z);""")
add("    ctx.drawImage(sheet.cv, sxp, 0, 26, 30, -13 * z, -27 * z - lift, 26 * z, 30 * z);\n",
    "    if (isHero && e.cos && e.cos.asas && !fallen && A.wingSheet) { const ws = A.wingSheet(e.cos.asas); if (ws) ctx.drawImage(ws, (Math.floor(R.t * (e.moving ? 7 : 2.5) + e._ph) % 2) * 30, 0, 30, 22, -19 * z, -24 * z - lift, 30 * z, 22 * z); }\n    ctx.drawImage(sheet.cv, sxp, 0, 26, 30, -13 * z, -27 * z - lift, 26 * z, 30 * z);\n")

# ---------- interface ----------
add("  const IC = {\n", """  const IC = {
    shirt: '<path d="M8 2.500l4 2.200 4-2.200 5.500 3.500-2.500 4.700-2.500-1.300V21.500h-9V9.400L5 10.700 2.500 6z"/>',
    wing: '<path d="M21.500 3C14 3 6.500 6.500 2.500 13.500l4.700-.600-2.700 4.100 5.200-1.100L8.200 20.500C15.200 18.500 20.500 11.500 21.500 3z"/>',
    paw: '<circle cx="5.800" cy="10.200" r="2.400"/><circle cx="9.800" cy="5.800" r="2.400"/><circle cx="14.600" cy="5.800" r="2.400"/><circle cx="18.600" cy="10.200" r="2.400"/><path d="M12.200 10.800c3 0 6 3.600 6 6.600 0 2-1.500 3.100-3.200 3.100-1.200 0-1.800-.700-2.800-.700s-1.600.700-2.800.700c-1.700 0-3.200-1.100-3.200-3.100 0-3 3-6.600 6-6.600z"/>',
""")
add("'<div class=\"ctl\"><button class=\"glass\" data-a=\"speed\" id=\"b-speed\">'",
    "'<div class=\"ctl\"><button class=\"glass dif\" data-a=\"diff\" ' + hud.St('color', () => (G.S ? G.diffCur().c : '#e2b659')) + '>' + ic('skull') + '<small>' + hud.T(() => (G.S ? G.diffCur().name : '')) + '</small></button><button class=\"glass\" data-a=\"speed\" id=\"b-speed\">'")
add("    missoes: () => (G.questCur().done ? 1 : 0) + ", "    missoes: () => G.pathsPending() + (G.questCur().done ? 1 : 0) + ")
add("'hour', 'stable', 'decor'])", "'hour', 'stable', 'decor', 'cos', 'diff'])")
add("    if (G.S.tut.done && !G.S.tut.seen.v20 && !UI.modalOpen && UI.vocGuide) UI.vocGuide();",
    "    if (G.S.tut.done && !UI.modalOpen) { if (!G.S.tut.seen.v20 && UI.vocGuide) UI.vocGuide(); else if (!G.S.tut.seen.v21 && UI.legGuide) UI.legGuide(); }")
add("'<div class=\"doll\">' + dollSlot(x, 'acessorio') + dollSlot(x, 'elmo') + dollSlot(x, 'armadura') + dollSlot(x, 'arma') + '<i class=\"px dfig\" style=\"background-image:url(' + A.fullBody(look) + ')\"></i>' + dollSlot(x, 'luvas') + dollSlot(x, 'anel') + dollSlot(x, 'cinto') + dollSlot(x, 'botas') + '</div>' +",
    "dollV21(x, look) +")
add("ic(i === 0 ? 'sword' : i === 1 ? 'bolt' : 'spark')", "ic(skIcon(sk, x.cls))")
add("ic(j.t === 2 ? 'bolt' : 'spark')", "ic(skIcon(j.skill, x.cls))")
add("'<button class=\"btn wide\" style=\"margin-top:8px\" data-a=\"artreset:' + x.id + '\" '",
    "'<button class=\"tog\" style=\"margin-top:4px\" data-a=\"artautotog:' + x.id + '\"><span>Distribuir sozinho<small>Cada ponto novo vai direto para as Artes da classe.</small></span><i class=\"sw' + (x.autoArt ? ' on' : '') + '\"></i></button>' + '<button class=\"btn wide\" style=\"margin-top:8px\" data-a=\"artreset:' + x.id + '\" '")
add("    title: 'Missões', tabs: [['jornada', 'Jornada'], ['contratos', 'Contratos'], ['zonas', 'Zonas'], ['fenda', 'Fenda']],",
    "    title: 'Missões', tabs: [['jornada', 'Jornada'], ['caminhos', 'Caminhos'], ['contratos', 'Contratos'], ['zonas', 'Zonas'], ['fenda', 'Fenda']],")
add("badge: { jornada: () => (G.questCur().done ? 1 : 0),", "badge: { caminhos: () => G.pathsPending(), jornada: () => (G.questCur().done ? 1 : 0),")
add("    render(tab) {\n      const S = G.S;\n      if (tab === 'jornada') {", "    render(tab) {\n      const S = G.S;\n      if (tab === 'caminhos') return tabCaminhos();\n      if (tab === 'jornada') {")

# ---------- Pó Estelar também cai em combate (a campanha de teste travava o Despertar sem desmonte) ----------
add("        addBag(h, 'alma', 1); addBag(h, 'tomo', G.ri(1, 2));", "        addBag(h, 'alma', 1); addBag(h, 'tomo', G.ri(1, 2)); addBag(h, 'po_estelar', G.ri(1, 3));")
add("        if (m.elite && Math.random() < 0.16 * dropM) addBag(h, 'tomo', 1);", "        if (m.elite && Math.random() < 0.16 * dropM) addBag(h, 'tomo', 1);\n        if (m.elite && Math.random() < 0.15 * dropM) addBag(h, 'po_estelar', 1);")
add("    if (f % 10 === 0) { G.cosGrant('r_arauto');", "    G.addRes('po_estelar', 2 + Math.floor(f / 5));\n    if (f % 10 === 0) { G.cosGrant('r_arauto');")
add("po_estelar: 'Sobra do desmonte de peças Incomuns ou melhores. Usado no Despertar.'", "po_estelar: 'Cai de elites, chefes e da Fenda, e sobra do desmonte de peças Incomuns ou melhores. Usado no Despertar.'")

# ---------- Ateliê no Armazém e marca do enfeite em movimento ----------
add("tabs: [['equip', 'Equipamento'], ['consumo', 'Consumíveis'], ['materiais', 'Materiais'], ['especiais', 'Especiais']],", "tabs: [['equip', 'Equipamento'], ['atelie', 'Ateliê'], ['consumo', 'Consumíveis'], ['materiais', 'Materiais'], ['especiais', 'Especiais']],")
add("      if (tab === 'equip') return whEquip();", "      if (tab === 'equip') return whEquip();\n      if (tab === 'atelie') return tabAtelie();")
add("    /* ---- lista ordenada ---- */", "    if (R.mark) { const k = 0.5 + 0.5 * Math.sin(R.t * 6); ctx.strokeStyle = 'rgba(255,224,122,' + (0.55 + 0.4 * k) + ')'; ctx.lineWidth = Math.max(2, z); ctx.beginPath(); ctx.ellipse(X(R.mark.x), Y(R.mark.y - 0.2), (17 + 3 * k) * z, (8 + 1.5 * k) * z, 0, 0, 6.283); ctx.stroke(); ctx.fillStyle = 'rgba(255,224,122,' + (0.1 + 0.1 * k) + ')'; ctx.fill(); }\n    /* ---- lista ordenada ---- */")
