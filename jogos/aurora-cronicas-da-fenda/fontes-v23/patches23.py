# v23: trocas pontuais sobre o HTML da v22. Cada troca confere o número de ocorrências.
P = []
def add(old, new, n=1):
    P.append((old, new, n))

# ---------- versão ----------
add("G.VERSION = '22.0';", "G.VERSION = '23.0';")
add("Aurora_ciclo_033_companheiros", "Aurora_ciclo_034_oficios", 2)
add("""· v22 "Companheiros\"""", """· v23 "Ofícios\"""")
add("' · Companheiros · salva sozinho", "' · Ofícios · salva sozinho")
add("""v' + G.VERSION + ' "Companheiros"<br>""", """v' + G.VERSION + ' "Ofícios"<br>""")
add("UI.modal('<div class=\"eyebrow\">Aurora v' + G.VERSION + ' · Companheiros</div>", "UI.modal('<div class=\"eyebrow\">Aurora · Companheiros</div>")

# ---------- estado: escolha do degrau servido e encomendas da caravana ----------
add("  inc: { best: {}, dayDone: 0, wins: 0, run: null, last: null },   // Incursões: maior Grau vencido por zona",
    "  inc: { best: {}, dayDone: 0, wins: 0, run: null, last: null },   // Incursões: maior Grau vencido por zona\n"
    "  svc: { taverna: 0, hospedaria: 0, enfermaria: 0 },   // v23: degrau mais alto servido (0 = o melhor liberado)\n"
    "  orders: [],       // v23: encomendas da caravana { id, k, n, gold, day }")

# ---------- heróis: cardápios, lotação, efeitos e reerguer ----------
# a chegada à Taverna, à Hospedaria e à Enfermaria passa pelo cardápio e pela lotação (37-oficios)
add("""      case 'eat': if (S.res.refeicao >= 1) { G.addRes('refeicao', -1); S.stats.meals++; pay(h, 'meal'); if (h.lux) { h.lux = 0; const p = Math.round(h.gold * 0.12); h.gold -= p; G.earn(p, 'servicos'); h.animo = 100; } enter(h, 'eat', 5 / (1 + 0.08 * G.bLvl('taverna'))); } else { h.state = 'town'; G.bark(h, 'hungry', 0.6); } break;
      case 'rest': pay(h, 'rest'); enter(h, 'rest', 60); break;
      case 'heal': pay(h, 'heal', 0.4 + 1.2 * (1 - h.hp / st.hp)); enter(h, 'heal', 60); break;
""", """      case 'eat': case 'rest': case 'heal': G.svcArrive(h, st, pay, enter); break;
""")
# o ritmo lá dentro depende do degrau servido
add("h.energia = Math.min(100, h.energia + dt * 3.2 * (1 + 0.12 * G.bLvl('hospedaria')));\n      h.hp = Math.min(st.hp, h.hp + st.hp * 0.02 * dt);",
    "h.energia = Math.min(100, h.energia + dt * 3.2 * (1 + 0.12 * G.bLvl('hospedaria')) * (h._svcR || 1));\n      h.hp = Math.min(st.hp, h.hp + st.hp * 0.02 * dt * (h._svcH || 1));")
add("h.hp = Math.min(st.hp, h.hp + st.hp * dt * 0.07 * (1 + 0.2 * G.bLvl('enfermaria')));",
    "h.hp = Math.min(st.hp, h.hp + st.hp * dt * 0.07 * (1 + 0.2 * G.bLvl('enfermaria')) * (h._svcR || 1));")
add("h.fome = Math.min(100, h.fome + dt * 22); h.animo = Math.min(100, h.animo + dt * 4 * (1 + 0.1 * G.bLvl('taverna')));",
    "h.fome = Math.min(100, h.fome + dt * 22 * (h._svcR || 1)); h.animo = Math.min(100, h.animo + dt * 4 * (1 + 0.1 * G.bLvl('taverna')) * (h._svcA || 1));")
# fim do serviço: deixa o efeito do degrau (bem alimentado, descansado)
add("      h.state = 'town'; h.inside = null; h.tThink = 0.2; G.bark(h, 'town', 0.12);",
    "      if (h._svcB) G.svcDone(h);\n      h.state = 'town'; h.inside = null; h.tThink = 0.2; G.bark(h, 'town', 0.12);")
# bem alimentado: ataque e experiência; descansado: cansa mais devagar
add("    if (G.hasTrait(h, 'notivago') && G.isNight(S.clock)) a *= 1.12;\n    return { a, d };",
    "    if (G.hasTrait(h, 'notivago') && G.isNight(S.clock)) a *= 1.12;\n    if (h.fedT > S.t) a *= 1 + (h.fedA || 0); // v23: bem alimentado\n    return { a, d };")
add("n *= (1 + G.traitSum(h, 'xp') + G.heroStats(h).xpF)", "n *= (1 + G.traitSum(h, 'xp') + G.heroStats(h).xpF + (h.fedT > S.t ? h.fedX || 0 : 0))")
add("Math.max(0.3, 1 + G.traitSum(h, 'tire') + st.tireF));", "Math.max(0.3, 1 + G.traitSum(h, 'tire') + st.tireF) * (h.restT > S.t ? 1 - (h.restF || 0) : 1));")
# ferido procura a Enfermaria quando ela sabe tirar o ferimento
add("if (h.hp < st.hp * 0.85 && G.bOk('enfermaria') && h.gold >= G.price(h, 'heal')) return gotoB(h, 'enfermaria', 'heal');",
    "if ((h.hp < st.hp * 0.85 || (h.wound > S.t && G.svcCures(h))) && G.bOk('enfermaria') && h.gold >= G.price(h, 'heal')) return gotoB(h, 'enfermaria', 'heal');")
# reerguer: custo pela dificuldade; volta com mais vida conforme o nível da Enfermaria
add("const c = G.price(h, 'revive') * 2; if (!G.spend(c, 'cura')) return false;", "const c = G.reviveCost(h); if (!G.spend(c, 'cura')) return false;")
add("if (h.state === 'recover' || h.state === 'fallen') return G.price(h, 'revive') * 2;", "if (h.state === 'recover' || h.state === 'fallen') return G.reviveCost(h);")
add("h.state = 'town'; h.inside = null; h.hp = st.hp * 0.6; h.wound = S.t + 150;", "h.state = 'town'; h.inside = null; h.hp = st.hp * G.reviveHp(); h.wound = S.t + 150;")
