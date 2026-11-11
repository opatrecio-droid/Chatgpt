# v22: trocas pontuais sobre o HTML da v21. Cada troca confere o número de ocorrências.
P = []
def add(old, new, n=1):
    P.append((old, new, n))

# ---------- versão ----------
add("G.VERSION = '21.0';", "G.VERSION = '22.0';")
add("Aurora_ciclo_032_legado", "Aurora_ciclo_033_companheiros", 2)
add("""· v21 "Legado\"""", """· v22 "Companheiros\"""")
add("' · Legado · salva sozinho", "' · Companheiros · salva sozinho")
add("""v' + G.VERSION + ' "Legado"<br>""", """v' + G.VERSION + ' "Companheiros"<br>""")
add("UI.modal('<div class=\"eyebrow\">Aurora v' + G.VERSION + ' · Legado</div>", "UI.modal('<div class=\"eyebrow\">Aurora · Legado</div>")

# ---------- estado ----------
add("  decorPos: {},     // enfeites movidos: id -> posições",
    "  decorPos: {},     // enfeites movidos: id -> posições\n  pets: [],         // mascotes: { id, k, rar, hero, bag, bagN }\n  inc: { best: {}, dayDone: 0, wins: 0, run: null, last: null },   // Incursões: maior Grau vencido por zona")
add("cos: { traje: null, asas: null, pet: null, reliquia: null }, autoArt: 0,", "cos: { traje: null, asas: null, reliquia: null }, autoArt: 0, pet: 0,")
add("{ traje: null, asas: null, pet: null, reliquia: null }", "{ traje: null, asas: null, reliquia: null }", 2)

# ---------- heróis: Incursão, Fraqueza, entrega da carga do mascote ----------
add("      if (m.dead) continue;\n      const d = Math.hypot(m.x - h.x, m.y - h.y); if (d > bd) continue;",
    "      if (m.dead || m.inc) continue;\n      const d = Math.hypot(m.x - h.x, m.y - h.y); if (d > bd) continue;")
add("let dmg = (atk * atk) / (atk + m.def * (1 - ((o && o.pierce) || 0)))",
    "let dmg = (atk * atk) / (atk + m.def * (1 - ((o && o.pierce) || 0)) * (m.weak > S.t ? 1 - (m.weakF || 0) : 1))")
add("    let dmg = (m.atk * m.atk) / (m.atk + def) * G.rnd(0.88, 1.12) * (mult || 1);",
    "    const ma = m.weak > S.t ? m.atk * (1 - (m.weakF || 0)) : m.atk; // v22: Fraqueza do mascote\n    let dmg = (ma * ma) / (ma + def) * G.rnd(0.88, 1.12) * (mult || 1);")
add("h.state = h.state === 'rift' || h.state === 'defend' ? h.state : 'flee';", "h.state = h.state === 'rift' || h.state === 'defend' || h.state === 'inc' ? h.state : 'flee';")
add("|| h.state === 'return' || h.state === 'defend' || h.state === 'rift';", "|| h.state === 'return' || h.state === 'defend' || h.state === 'rift' || h.state === 'inc';")
add("      case 'rift': G.riftHero(h, dt, st, mons); break;", "      case 'rift': G.riftHero(h, dt, st, mons); break;\n      case 'inc': G.incHero(h, dt, st, mons); break;")
add("      case 'rift': return 'Na Fenda Infinita';", "      case 'rift': return 'Na Fenda Infinita';\n      case 'inc': return 'Em Incursão';")
add("if (h.bagN > 0 && G.bOk('guilda')) return gotoB(h, 'guilda', 'deliver');", "if ((h.bagN > 0 || G.petLoad(h) > 0) && G.bOk('guilda')) return gotoB(h, 'guilda', 'deliver');")
add("h.bag = {}; h.bagN = 0; if (n) { G.addFx({ t: 'text', x: h.x, y: h.y - 1.2, s: '+' + n + ' espólio'",
    "h.bag = {}; h.bagN = 0; n += G.petUnload(h); if (n) { G.addFx({ t: 'text', x: h.x, y: h.y - 1.2, s: '+' + n + ' espólio'")

# ---------- monstros: metade do espólio cai no chão; Incursão isolada; Maré espera a Incursão ----------
add("      const zm = G.ZMATS[z.n];\n      if (m.boss) {",
    "      const zm = G.ZMATS[z.n], addBag = (hh, id, n) => G.lootGive(hh, m, id, n); // v22: metade na bolsa, metade no chão\n      if (m.boss) {")
add("      if (h.inside || h.state === 'fallen' || h.state === 'recover') continue;\n      if (!m.raid && Wd.inTown(h.x, h.y)) continue;",
    "      if (h.inside || h.state === 'fallen' || h.state === 'recover') continue;\n      if (m.inc && h.state !== 'inc') continue;\n      if (!m.raid && Wd.inTown(h.x, h.y)) continue;")
add("if (t && (t.inside || t.state === 'fallen' || t.state === 'recover' || (!m.raid && Wd.inTown(t.x, t.y)))) t = m.tgt = null;",
    "if (t && (t.inside || t.state === 'fallen' || t.state === 'recover' || (m.inc && t.state !== 'inc') || (!m.raid && Wd.inTown(t.x, t.y)))) t = m.tgt = null;")
add("return G.riftOpen() && !S.rift.run && !S.mare.active && (S.rift.dayDone", "return G.riftOpen() && !S.rift.run && !S.mare.active && !(S.inc && S.inc.run) && (S.rift.dayDone")
add("S.clock >= 1230) G.mareStart();", "S.clock >= 1230) { if (S.inc && S.inc.run) S.mare.held = S.day; else G.mareStart(); }")
add("h.state === 'hunt' || h.state === 'defend' || h.state === 'rift' ? 1 :", "h.state === 'hunt' || h.state === 'defend' || h.state === 'rift' || h.state === 'inc' ? 1 :")

# ---------- som: coleta e Fraqueza ----------
add("    click: (t) => tone(880, t, 0.05, 'triangle', 0.12, 1320),",
    "    click: (t) => tone(880, t, 0.05, 'triangle', 0.12, 1320),\n    pick: (t) => { tone(1319, t, 0.06, 'triangle', 0.1); tone(1760, t + 0.05, 0.09, 'triangle', 0.09); },\n    weak: (t) => { tone(520, t, 0.28, 'sine', 0.1, 170); noise(t, 0.12, 0.12, 900, 2); },")
add("const GAP = { hit: 0.07,", "const GAP = { pick: 0.08, weak: 0.25, hit: 0.07,")

# ---------- arte e render: espólio e mascote na lista ordenada, toque no espólio, efeitos ----------
add("  A.resURL = {};", "  A.resURL = {}; A.resIcon = resIcon;")
add("    cv = canvas; ctx = cv.getContext('2d', { alpha: false });", "    cv = canvas; ctx = R.ctx = cv.getContext('2d', { alpha: false });")
add("    for (const m of G.mons) if (!m.dead && m.x > vx0 && m.x < vx1 && m.y > vy0 && m.y < vy1 + 2) dyn.push({ y: m.y, k: 'm', e: m });",
    "    for (const m of G.mons) if (!m.dead && m.x > vx0 && m.x < vx1 && m.y > vy0 && m.y < vy1 + 2) dyn.push({ y: m.y, k: 'm', e: m });\n    if (R.dynMore) R.dynMore(dyn, vx0, vx1, vy0, vy1);")
add("else if (d.k === 'm') drawMon(d.e, X, Y, z, over); else drawChar(", "else if (d.k === 'm') drawMon(d.e, X, Y, z, over); else if (d.k === 'x') d.f(d.e, X, Y, z, over, dt); else drawChar(")
add("    if (best) return best;\n    for (const m of G.mons) { if (m.dead) continue;", "    if (best) return best;\n    if (R.pickMore) { const o = R.pickMore(wx, wy); if (o) return o; }\n    for (const m of G.mons) { if (m.dead) continue;")
add("        case 'shake': R.shake = Math.max(R.shake, f.n); break;\n      }", "        case 'shake': R.shake = Math.max(R.shake, f.n); break;\n        default: if (R.fxMore) R.fxMore(f);\n      }")
add("    for (const f of R.fxs) if (f.t === 'ring' || f.t === 'pillar') hole(f.x, f.y, 3, 0.7);", "    for (const f of R.fxs) if (f.t === 'ring' || f.t === 'pillar') hole(f.x, f.y, 3, 0.7);\n    if (R.nightMore) R.nightMore(hole);")
add("    ctx.restore();\n    if (m.hp < m.hpMax || m.elite || m.boss) over.push(() => {", "    ctx.restore();\n    if (m.weak > G.S.t && R.weakMark) R.weakMark(m, px, py - fly, zz, sp);\n    if (m.hp < m.hpMax || m.elite || m.boss) over.push(() => {")
add("const t = (m.elite ? 'Elite · ' : '') + d.name + ' Nv ' + m.lvl;", "const t = (m.alfa ? 'Alfa · ' : m.elite ? 'Elite · ' : '') + d.name + ' Nv ' + m.lvl;")
add("e.state === 'rift')) { const f = e.hp / st.hp;", "e.state === 'rift' || e.state === 'inc')) { const f = e.hp / st.hp;")
# o mascote da v21 era só enfeite de render atrás do dono; agora tem posição simulada (53-companheiros-art)
add("""    /* v21: o mascote segue o dono com um pequeno atraso */
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
    shadow(px, py, mSheet ? 9 : 6.5, z);""", "    shadow(px, py, mSheet ? 9 : 6.5, z);")

# ---------- interface ----------
add("rift: 'portal', inside:", "rift: 'portal', inc: 'paw', inside:")
add("    else if (r.type === 'mon' || r.type === 'npc') { R.follow = 0; UI.inspect(r); }", "    else if (r.type === 'drop') { if (UI.dropTap) UI.dropTap(r.ref); }\n    else if (r.type === 'mon' || r.type === 'npc') { R.follow = 0; UI.inspect(r); }")
add("else if (!G.S.tut.seen.v21 && UI.legGuide) UI.legGuide(); }", "else if (!G.S.tut.seen.v21 && UI.legGuide) UI.legGuide(); else if (!G.S.tut.seen.v22 && UI.compGuide) UI.compGuide(); }")
add("'hour', 'stable', 'decor', 'cos', 'diff'])", "'hour', 'stable', 'decor', 'cos', 'diff', 'pets', 'inc'])")
add("$('#bb-n').textContent = d.name + ' · Nv ' + boss.lvl;", "$('#bb-n').textContent = (boss.alfa ? 'Alfa · ' : '') + d.name + ' · Nv ' + boss.lvl;")
add("A.monPortrait(m.k) + ')\"></i><span class=\"it\"><b>' + (m.elite ? 'Elite · ' : '') + d.name", "A.monPortrait(m.k) + ')\"></i><span class=\"it\"><b>' + (m.alfa ? 'Alfa · ' : m.elite ? 'Elite · ' : '') + d.name")
add("'<button class=\"btn wide\" data-a=\"recall:' + x.id + '\" '", "petBagSec(x) + '<button class=\"btn wide\" style=\"margin-top:10px\" data-a=\"recall:' + x.id + '\" '")
add("const nm = o.id === 'nucleos' ? 'Núcleo' : G.RES[o.id].name, icn = o.id === 'nucleos' ? ",
    "const nm = o.id === 'ovo' ? 'Ovo de mascote ' + G.RAR[o.rar] : o.id === 'nucleos' ? 'Núcleo' : G.RES[o.id].name, icn = o.id === 'ovo' ? '<i class=\"px\" style=\"width:28px;height:28px;background-image:url(' + A.eggURL(o.rar) + ')\"></i>' : o.id === 'nucleos' ? ")
add("cosSlot(x, 'traje') + cosSlot(x, 'pet')", "cosSlot(x, 'traje') + petSlot(x)")
add("<h3>Ateliê de Aurora</h3><p>Trajes, asas e mascotes mudam o visual do herói e dão um bônus. Cada cópia veste um herói por vez: para vestir, toque nos espaços roxos da ficha.</p>",
    "<h3>Ateliê de Aurora</h3><p>Trajes e asas mudam o visual do herói e dão um bônus. Cada cópia veste um herói por vez: para vestir, toque nos espaços roxos da ficha. Os mascotes vivem no Viveiro, mais abaixo.</p>")
add("for (const slot of G.COS_SLOTS) { h += '<div class=\"sec\">'", "for (const slot of G.COS_SLOTS) { if (slot === 'reliquia') h += viveiroSec(); h += '<div class=\"sec\">'")
add("['fenda', 'Fenda']],", "['fenda', 'Fenda'], ['incursoes', 'Incursões']],")
add("      if (tab === 'caminhos') return tabCaminhos();", "      if (tab === 'caminhos') return tabCaminhos();\n      if (tab === 'incursoes') return tabIncursoes();")
add("const rwChips = (r) => Object.keys(r).map((k) => '<span class=\"cost\">' + (k === 'gold'",
    "const rwChips = (r) => Object.keys(r).map((k) => '<span class=\"cost\">' + (k === 'pet' ? petImg(r.pet, 20) + ' ' + G.PETS[r.pet].name : k === 'gold'")
add("['shirt', 'Trajes, asas e mascotes', 'Os espaços roxos ao lado do herói abrem o Ateliê. Cada peça muda o visual e dá um bônus.']",
    "['shirt', 'Trajes e asas', 'Os espaços roxos ao lado do herói abrem o Ateliê. Cada peça muda o visual e dá um bônus.']")
add("Missões › Caminhos: 18 objetivos livres com recompensas.", "Missões › Caminhos: objetivos livres com recompensas.")
# a barra de abas rola até a aba ativa (Missões ganhou a sétima aba)
add("(sh.badge && sh.badge[id] ? tabsV.Badge(sh.badge[id]) : '') + '</button>').join('');",
    "(sh.badge && sh.badge[id] ? tabsV.Badge(sh.badge[id]) : '') + '</button>').join('');\n    { const on = tb.querySelector('button.on'); if (on && on.offsetLeft + on.offsetWidth > tb.clientWidth + tb.scrollLeft) tb.scrollLeft = on.offsetLeft + on.offsetWidth - tb.clientWidth + 12; }")
