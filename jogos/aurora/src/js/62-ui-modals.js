/* 62-ui-modals: janelas — Portal, eventos, Maré, itens, mapa, save e apresentação. */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const UI = G.UI, A = G.A, R = G.R, ic = UI.ic, esc = UI.esc, $ = UI.$;
  let onClose = null, mapTimer = 0;
  UI.modal = (html, o) => {
    o = o || {}; const m = $('#modal');
    m.innerHTML = '<div class="mbox">' + html + '</div>'; m.classList.add('on');
    UI.modalOpen = true; UI.modalLock = !!o.lock; onClose = o.onClose || null;
    /* v27 (A2): nenhuma janela pausa o jogo (o antigo G.M.modalPause foi removido): só o botão de pausa pausa. A opção { pause } segue aceita e ignorada. */
  };
  UI.closeModal = () => { const m = $('#modal'); m.classList.remove('on'); m.innerHTML = ''; UI.modalOpen = false; clearInterval(mapTimer); const f = onClose; onClose = null; if (f) f(); };
  $('#app') && 0;
  document.addEventListener('click', (e) => { if (e.target.id === 'modal' && UI.modalOpen && !UI.modalLock) UI.closeModal(); });
  let confirmFn = null;
  UI.confirm = (title, text, yes, fn) => { confirmFn = fn; UI.modal('<h2>' + esc(title) + '</h2><p class="lead">' + esc(text) + '</p><div class="acts"><button class="btn" data-a="mclose">Cancelar</button><button class="btn red" data-a="myes">' + esc(yes) + '</button></div>'); };
  UI.ACT.mclose = () => UI.closeModal();
  UI.ACT.myes = () => { const f = confirmFn; confirmFn = null; UI.closeModal(); if (f) f(); };

  /* ---------- Portal ---------- */
  let cands = null;
  UI.recruitModal = () => {
    const S = G.S;
    if (S.heroes.length >= G.heroCap()) return UI.modal('<div class="eyebrow">Portal de Aurora</div><h2>Sem camas livres</h2><p class="lead">A Hospedaria abriga ' + G.heroCap() + ' heróis. Melhore-a para receber mais caçadores.</p><div class="acts"><button class="btn" data-a="mclose">Fechar</button><button class="btn pri" data-a="mgo:reino:obras:hospedaria">Ver Hospedaria</button></div>');
    const c = G.recruitCost(), n = G.nucleoCost();
    UI.modal('<div class="eyebrow">Portal de Aurora</div><h2>Chamar um herói</h2>' + artBox('portal') + '<p class="lead">O Portal revela três viajantes de cada vez. Você escolhe quem fica.</p>' +
      '<button class="opt" data-a="summon:gold"' + (S.gold < c ? ' disabled' : '') + '><b>' + ic('coin').replace('class="i"', 'class="i" style="display:inline;vertical-align:-2px"') + ' Contratar · ' + G.fmt(c) + ' moedas</b><span>Aventureiros comuns e incomuns; às vezes, alguém raro.</span></button>' +
      '<button class="opt" data-a="summon:nucleo"' + (S.nucleos < n ? ' disabled' : '') + '><b class="epic">' + ic('core').replace('class="i"', 'class="i" style="display:inline;vertical-align:-2px"') + ' Invocar · ' + n + ' Núcleos</b><span>Garante Raro ou melhor. Épicos e Lendários só vêm por aqui (ou por pura sorte).</span></button>' +
      '<div class="acts"><button class="btn" data-a="mclose">Agora não</button></div>');
  };
  let paid = null;      // v27 (A2): o que o sorteio custou, para devolver se a última cama for ocupada enquanto a janela está aberta (o jogo não pausa mais)
  UI.ACT.summon = (a) => {
    const S = G.S;
    if (a[0] === 'gold') { const c = G.recruitCost(); if (!G.spend(c, 'recrutas')) return; paid = { k: 'gold', n: c }; } else { const n = G.nucleoCost(); if (S.nucleos < n) return; S.nucleos -= n; paid = { k: 'nucleos', n }; }
    cands = G.rollCandidates(a[0]); G.sfx('summon');
    let h = '<div class="eyebrow">O Portal se abre</div><h2>Quem fica em Aurora?</h2><div style="margin-top:12px">';
    cands.forEach((c, i) => { const fake = { cls: c.cls, look: c.look, rank: G.rankForLevel(c.lvl), gear: { arma: { tier: 1 }, armadura: null } }; const cl = G.CLASSES[c.cls]; h += '<button class="cand rar' + c.rar + '" data-a="hire:' + i + '"><i class="pt px" style="background-image:url(' + A.fullBody(A.heroLook(fake)) + ')"></i><span class="gr"><b style="font-size:15px;color:#fff">' + esc(c.name) + '</b> <span class="rar' + c.rar + '" style="font-weight:800;font-size:15px">' + G.RAR[c.rar] + '</span><br><span style="font-size:15px;color:var(--gold2);font-weight:800">' + cl.name + ' · Nv ' + c.lvl + '</span><br><span class="mut" style="font-size:15px">' + cl.desc + '</span><br><span style="font-size:15px">' + c.traits.map((t) => '<span class="pill">' + G.TRAITS[t].name + '</span>').join(' ') + '</span></span></button>'; });
    UI.modal(h + '</div>', { lock: true });
  };
  UI.ACT.hire = (a) => { const c = cands && cands[+a[0]]; if (!c) return; cands = null; const h = G.hire(c); UI.closeModal();
    if (!h && paid) { if (paid.k === 'gold') G.earn(paid.n, 'recrutas'); else G.S.nucleos += paid.n; UI.toast('A última cama foi ocupada enquanto você escolhia: o valor foi devolvido.', 'info', 'coin'); }
    paid = null;
    if (h) { R.follow = h.id; UI.banner('Um novo juramento', h.name, G.CLASSES[h.cls].name + ' ' + G.RAR[h.rar]); UI.inspect({ type: 'hero', ref: h }); if (UI.sheet && window.innerWidth < 860) UI.close(); } };
  UI.ACT.mgo = (a) => { UI.closeModal(); UI.open(a[0], a[1], a[2] ? { bld: a[2] } : null); };

  /* ---------- eventos ---------- */
  const ART = { portal: ['linear-gradient(#2a1450 0 28%,#120a28 28% 100%)', [[50, 55, 70, '#7a34c8'], [50, 55, 44, '#b06af0'], [50, 55, 20, '#ffffff']]], caravan: ['linear-gradient(#f0b860 0 28%,#c8843a 28% 100%)', [[80, 30, 34, '#fff3c0'], [20, 110, 120, '#a86a2a'], [70, 105, 90, '#8a5220']]], festival: ['linear-gradient(#3a2a6a 0 28%,#1a1438 28% 100%)', [[20, 40, 12, '#ffd070'], [40, 28, 12, '#ff9a70'], [60, 42, 12, '#ffd070'], [80, 30, 12, '#ff70a0']]], redmoon: ['linear-gradient(#3a0a14 0 28%,#14060c 28% 100%)', [[62, 46, 50, '#e83a4a'], [30, 30, 16, '#f0e0c0']]], blight: ['linear-gradient(#6a7a3a 0 28%,#3a4420 28% 100%)', [[30, 70, 30, '#3a3020'], [60, 80, 40, '#2a2418'], [80, 60, 22, '#4a3a28']]], forge: ['linear-gradient(#3a2018 0 28%,#1a0e0a 28% 100%)', [[50, 80, 60, '#ff8a2a'], [50, 80, 34, '#ffd070'], [50, 80, 14, '#ffffff']]], stars: ['linear-gradient(#3d2618 0 28%,#1b110c 28% 100%)', [[20, 20, 4, '#fff'], [44, 44, 3, '#fff'], [70, 24, 5, '#cfe'], [86, 60, 3, '#fff'], [60, 70, 26, '#b0c8ff']]], tourney: ['linear-gradient(#2a4a8a 0 28%,#3d2618 28% 100%)', [[30, 50, 30, '#e2b659'], [70, 50, 30, '#c8473d'], [50, 50, 10, '#ffffff']]] };
  /* v27 (C): cena em pixel art gerada em canvas (uma vez por tipo): céu em faixas com trama, astros em discos de 3 tons com contorno,
     colinas e casinhas em silhueta. Desenhada em 220×36 pixels e mostrada a 2× (nítida em qualquer largura: o que sobra dos lados é cortado). */
  const artCache = {};
  const artURL = (k) => {
    if (artCache[k]) return artCache[k];
    const a = ART[k] || ART.stars, W = 220, H = 36, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    const hexes = a[0].match(/#[0-9a-fA-F]{3,6}/g) || ['#2a1450', '#120a28'];
    const rgb = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((q) => q + q).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
    const c0 = rgb(hexes[0]), c1 = rgb(hexes[1] || hexes[0]), mixc = (t) => 'rgb(' + c0.map((v, i) => Math.round(v + (c1[i] - v) * t)).join(',') + ')';
    const BAYER = [[0, 2], [3, 1]];
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const t = j / (H - 1) * 5, band = Math.floor(t), f = t - band; const up = f * 4 > BAYER[j & 1][i & 1]; x.fillStyle = mixc(Math.min(1, (band + (up ? 1 : 0)) / 5)); x.fillRect(i, j, 1, 1); }
    const dark = c1[0] + c1[1] + c1[2] < 300;
    if (dark) { let r = 7 + k.length; for (let n = 0; n < 26; n++) { r = (r * 9301 + 49297) % 233280; const sx = r % W; r = (r * 9301 + 49297) % 233280; const sy = r % Math.floor(H * 0.6); x.fillStyle = n % 5 ? '#c8c0e0' : '#fff6d8'; x.fillRect(sx, sy, 1, 1); } }
    const shade = (col, d) => { const m = rgb(col.length === 4 || col.length === 7 ? col : '#888888'); return 'rgb(' + m.map((v) => Math.max(0, Math.min(255, v + d))).join(',') + ')'; };
    const disc = (cx, cy, rad, col) => {
      for (let j = -rad - 1; j <= rad + 1; j++) for (let i = -rad - 1; i <= rad + 1; i++) {
        const d = Math.hypot(i, j); if (d > rad + 1) continue;
        const px = Math.round(cx + i), py = Math.round(cy + j); if (px < 0 || py < 0 || px >= W || py >= H) continue;
        if (d > rad) { x.fillStyle = '#140c0a'; } else { const lit = (i + j) / (rad * 1.4); x.fillStyle = lit < -0.45 ? shade(col, 60) : lit > 0.35 ? shade(col, -50) : col; }
        x.fillRect(px, py, 1, 1);
      }
    };
    for (const [px, py, r, col] of a[1]) { const rad = Math.max(2, Math.round(r / 4)); if (r >= 90) { /* colina grande: só o topo aparece */ disc(W * px / 100, H + rad * 0.2 + 2, rad, col); } else disc(W * px / 100, H * py / 100, rad, col); }
    /* horizonte: colinas e casinhas em silhueta */
    const hz = shade('#' + ((c1[0] << 16 | c1[1] << 8 | c1[2]) >>> 0).toString(16).padStart(6, '0'), -45);
    x.fillStyle = hz; for (let i = 0; i < W; i++) { const h2 = 3 + Math.round(1.6 * Math.sin(i / 11) + 1.2 * Math.sin(i / 5.3)); x.fillRect(i, H - h2, 1, h2); }
    let r2 = 11 + k.charCodeAt(0); for (let n = 0; n < 6; n++) { r2 = (r2 * 9301 + 49297) % 233280; const hx = 8 + (r2 % (W - 24)), hw = 5 + (r2 % 4); x.fillStyle = hz; x.fillRect(hx, H - 9, hw, 7); for (let q = 0; q < hw / 2 + 1; q++) x.fillRect(hx + q, H - 10 - q, hw - 2 * q, 1); x.fillStyle = '#ffd070'; x.fillRect(hx + 2, H - 7, 1, 1); }
    return (artCache[k] = c.toDataURL());
  };
  const artBox = (k) => '<div class="art" style="background-image:url(' + artURL(k) + ')"></div>';
  UI.artBox = artBox; UI.ART = ART;
  /* v27 (A2): o evento de cidade não abre mais janela sozinho nem pausa o jogo; vira uma decisão pendente no atalho do HUD (6G-ui-decisoes: UI.eventModal, UI.ACT.evopt) */
  UI.mareModal = (d) => {
    const a = d.a;
    UI.modal('<div class="eyebrow">Maré da Fenda</div><h2>' + (d.win ? 'Aurora resistiu!' : 'A Maré passou…') + '</h2>' + artBox(d.win ? 'festival' : 'redmoon') + '<div class="grid3"><div class="stat"><small>Invasores</small><b>' + a.total + '</b></div><div class="stat"><small>Abatidos</small><b class="good">' + a.killed + '</b></div><div class="stat"><small>Na praça</small><b class="' + (a.breach ? 'bad' : 'good') + '">' + a.breach + '</b></div></div>' +
      (d.win ? '<p class="lead">Os sinos tocam. Recompensa do reino: <b class="gold">+' + G.fmt(d.gold) + ' moedas, +' + d.selos + ' Selo(s), +' + d.nuc + ' Núcleo(s)</b>.</p>' : '<p class="lead">Invasores chegaram ao coração da cidade, saquearam o cofre e danificaram construções. A próxima Maré virá um pouco mais fraca — use o tempo para forjar, curar e estocar poções.</p>') + '<div class="acts"><button class="btn pri" data-a="mclose">Continuar</button></div>');
  };
  /* v27 (A1): resumo do retorno. UMA janela, sem pausar o jogo: tempo fora, tempo vivido (e a regra de 50%/30% numa linha), o que mudou de verdade
     (medido antes e depois da simulação) e as linhas notáveis. 64-ui-retorno acrescenta as cartas (antes do último .acts) e 69-ui-rivais as notícias
     (depois do primeiro p.lead): a ordem do HTML abaixo precisa continuar assim. */
  const hm = (s) => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h > 0 ? h + ' h' + (m ? ' ' + (m < 10 ? '0' : '') + m + ' min' : '') : m > 0 ? m + ' min' : s + ' s'; };
  UI.hm = hm;
  const sg = (n) => (n > 0 ? '+' : n < 0 ? '−' : '') + G.fmt(Math.abs(n));
  UI.offlineModal = (o) => {
    const eff = o.eff != null ? o.eff : o.secs * 0.4, capped = o.raw && o.raw > o.secs + 60;
    const rule = o.eff != null ? 'Regra: as primeiras 8 h fora valem 50% do tempo; as 8 h seguintes, 30%' + (capped ? '; contamos no máximo 16 h' : '') + '.' : '';
    const dias = (n) => n + (n === 1 ? ' dia' : ' dias');
    const lead = 'Você ficou fora ' + hm(o.raw || o.secs) + '. Aurora viveu ' + hm(eff) + ' de reino sem você' +
      (o.est > 60 ? ': simulamos ' + hm(o.sim) + (o.days ? ' (' + dias(o.days) + ')' : '') + ' e estimamos os outros ' + hm(o.est) + ' pelo ritmo medido, só em moedas, recursos, experiência e abates (o calendário não avança nesse trecho).' : (o.days ? ' (' + dias(o.days) + ').' : '.'));
    const cell = (l, v, c) => '<div class="stat"><small>' + l + '</small><b' + (c ? ' class="' + c + '"' : '') + '>' + v + '</b></div>';
    let h = '<div class="eyebrow">Enquanto você esteve fora</div><h2>Aurora não parou</h2>' + artBox('stars') + '<p class="lead" style="margin-bottom:4px">' + esc(lead) + '</p>' + (rule ? '<p class="rtr">' + esc(rule) + '</p>' : '') +
      '<div class="grid3">' + cell('Moedas', sg(o.gold), o.gold >= 0 ? 'gold' : 'bad') + cell('Abates', G.fmt(o.kills || 0)) + cell('Níveis de herói', o.lvls ? '+' + o.lvls : '0', o.lvls ? 'good' : '') + '</div>' +
      '<div class="grid3" style="margin-top:6px">' + cell(o.est > 60 ? 'Dias simulados' : 'Dias', o.days != null ? '+' + o.days : '—') + cell('Peças', G.fmt(o.items || 0)) + cell('Quedas', G.fmt(o.falls || 0), o.falls ? 'bad' : '') + '</div>';
    const res = (o.res || []).filter((x) => G.RES[x.id]);
    if (res.length) h += '<div class="sec" style="margin-top:12px">Armazém</div><div class="costs" style="margin-top:0">' + res.map((x) => '<span class="cost"><i class="px ri-' + x.id + '"></i>' + sg(x.n) + ' <span class="mut">' + esc(G.RES[x.id].name.split(' ')[0]) + '</span></span>').join('') + '</div>';
    const ex = [];
    if (o.heroes && o.heroes.length) ex.push(o.heroes.map((x) => x.n + ' +' + x.up + ' (nv ' + x.lvl + ')').join(' · '));
    if (o.mw || o.ml) ex.push((o.mw ? 'Maré repelida ×' + o.mw : '') + (o.mw && o.ml ? ' · ' : '') + (o.ml ? 'Maré perdida ×' + o.ml : ''));
    if (o.realm > 0) ex.push('Nível de Reino +' + o.realm);
    if (o.contr) ex.push(o.contr + (o.contr === 1 ? ' contrato pronto' : ' contratos prontos') + ' para receber');
    if (o.sys && o.sys.length) ex.push('Novo: ' + o.sys.join(', '));
    if (o.autoDec) ex.push(o.autoDec + (o.autoDec === 1 ? ' decisão tomada' : ' decisões tomadas') + ' por Aurora (a opção segura)');
    for (const l of o.notable || []) ex.push(l);
    if (ex.length) h += '<div class="sec" style="margin-top:12px">O que aconteceu</div><ul class="rtl">' + ex.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>';
    UI.modal(h + '<div class="acts"><button class="btn pri" data-a="mclose">Voltar ao trono</button></div>', { pause: false });
    const bx = $('#modal .mbox'); if (bx) bx.classList.add('rt');
  };

  /* ---------- itens ---------- */
  const findItem = (id, hid) => { const S = G.S; if (hid) { const h = S.heroes.find((x) => x.id === hid); if (h) for (const k in h.gear) if (h.gear[k] && h.gear[k].id === id) return h.gear[k]; } return S.inv.find((i) => i.id === id); };
  UI.itemModal = (id, hid, msg) => {
    const it = findItem(id, hid); if (!it) return;
    const c = G.upgradeCost(it), max = Math.min(15, 4 + G.bLvl('ferraria')), S = G.S;
    const nxt = Object.assign({}, it, { plus: it.plus + 1 });
    const can = G.bOk('ferraria') && it.plus < max && S.gold >= c.gold && G.hasRes(c.cost);
    UI.modal('<div class="eyebrow">' + G.RAR[it.rar] + '</div><h2 class="rar' + it.rar + '">' + G.itemName(it) + '</h2><div style="display:flex;justify-content:center;margin:12px 0">' + UI.gi(it).replace('class="gi', 'style="width:64px;height:64px;background-size:52px 52px" class="gi') + '</div><p class="lead">' + UI.itemLine(it) + (it.plus < max ? '<br><span class="good">+' + (it.plus + 1) + ': ' + UI.itemLine(nxt) + '</span>' : '<br>No limite da Ferraria (+' + max + ').') + '</p>' + (msg ? '<p class="lead ' + (msg.win ? 'good' : 'bad') + '" style="font-weight:800">' + (msg.win ? 'Aprimorado!' : 'A têmpera falhou. Os materiais se perderam.') + '</p>' : '') +
      (it.plus < max ? UI.cost(c.gold, c.cost, '<span class="cost">chance ' + Math.round(c.chance * 100) + '%</span>') : '') + '<div class="acts"><button class="btn" data-a="mclose">Fechar</button><button class="btn pri" data-a="mupg:' + id + ':' + (hid || 0) + '"' + (can ? '' : ' disabled') + '>' + ic('up') + 'Aprimorar</button></div>', { pause: false });
  };
  UI.ACT.mupg = (a) => { const it = findItem(+a[0], +a[1]); if (!it) return; const r = G.upgradeItem(it); if (!r.ok) return UI.toast(r.why, 'bad'); UI.itemModal(+a[0], +a[1], r); UI.sheetDirty(); };
  UI.giftModal = (id) => {
    const S = G.S, it = S.inv.find((i) => i.id === id); if (!it) return; const g = G.GEAR[it.type];
    const ok = S.heroes.filter((h) => { const c = G.CLASSES[h.cls]; return (g.kind !== 'arma' && g.kind !== 'armadura') || c.w === it.type || c.a === it.type; });
    let h = '<div class="eyebrow">Presente do trono</div><h2>' + G.itemName(it) + '</h2><p class="lead">O herói recebe de graça (você abre mão da venda) e ganha ânimo. O equipamento antigo volta para o Armazém.</p>';
    if (!ok.length) h += '<div class="empty">Nenhum herói usa este tipo de equipamento.</div>';
    for (const x of ok) { const cur = x.gear[g.kind]; const cm = cur ? G.pieceCmp(cur, it) : null, better = !cur || cm.pct > 0; h += '<button class="opt" data-a="mgift:' + id + ':' + x.id + '"><b>' + UI.rank(x.rank) + ' ' + esc(x.name) + ' <span class="mut" style="font-weight:700">Nv ' + x.lvl + '</span></b><span class="' + (cm && cm.same ? '' : better ? 'good' : 'bad') + '">' + (cur ? 'Usa ' + G.itemName(cur) + ' — ' + (cm.same ? 'poder igual (menos de 1%)' : (better ? 'esta é melhor: ' : 'a atual é melhor: ') + UI.pctSpan(cm.pct) + ' de poder') : 'Sem ' + G.SLOT[g.kind].toLowerCase()) + '</span></button>'; }
    UI.modal(h + '<div class="acts"><button class="btn" data-a="mclose">Cancelar</button></div>', { pause: false });
  };
  UI.ACT.mgift = (a) => { const S = G.S, it = S.inv.find((i) => i.id === +a[0]), h = S.heroes.find((x) => x.id === +a[1]); if (it && h && G.equip(h, it)) { UI.toast(h.name + ' recebeu ' + G.itemName(it) + '.', 'good', 'gift'); G.emit('heroes'); } UI.closeModal(); };

  /* ---------- save ---------- */
  UI.exportModal = () => { const code = G.M.exportSave(); UI.modal('<h2>Exportar jornada</h2><p class="lead">Copie este código e guarde. Para carregar em outro aparelho, use Importar.</p><textarea id="sv" readonly>' + code + '</textarea><div class="acts"><button class="btn" data-a="mclose">Fechar</button><button class="btn pri" data-a="mcopy">Copiar</button></div>', { pause: false }); };
  UI.ACT.mcopy = () => { const t = $('#sv'); t.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) { /* sem permissão */ } if (navigator.clipboard) navigator.clipboard.writeText(t.value).then(() => UI.toast('Código copiado.', 'good'), () => {}); else UI.toast(ok ? 'Código copiado.' : 'Selecione e copie manualmente.', ok ? 'good' : 'info'); };
  UI.importModal = () => UI.modal('<h2>Importar jornada</h2><p class="lead">Cole abaixo o código exportado. Isso substitui a jornada salva neste aparelho.</p><textarea id="sv" placeholder="Cole o código aqui"></textarea><div class="acts"><button class="btn" data-a="mclose">Cancelar</button><button class="btn pri" data-a="mimport">Carregar</button></div>', { pause: false });
  UI.ACT.mimport = () => { const code = $('#sv').value; if (!code.trim()) return; if (G.M.importSave(code)) { UI.closeModal(); if (!G.M.running) { G.R.focus(44, 53, true); G.M.running = true; G.M.last = performance.now(); G.emit('start', { fresh: false }); } else { G.emit('heroes'); G.emit('decor'); } UI.toast('Jornada carregada.', 'good'); } else UI.toast('Código inválido.', 'bad'); };

  /* ---------- mapa do mundo ---------- */
  UI.mapModal = () => {
    const W = G.W, mc = R.mapCanvas();
    UI.modal('<div class="eyebrow">Reino de Aurora</div><h2>Mapa</h2><canvas id="mapc" style="width:100%;margin-top:10px;display:block;image-rendering:auto;touch-action:none"></canvas><p class="lead" style="margin-bottom:0">Toque em um ponto para levar a câmera até lá.</p><div class="acts"><button class="btn" data-a="mclose">Fechar</button></div>', { pause: false });
    const cv = $('#mapc'), sc = 4; cv.width = W.w * sc; cv.height = W.h * sc; const x = cv.getContext('2d');
    const paint = () => {
      const S = G.S; x.drawImage(mc, 0, 0);
      x.font = '700 16px "Aurora Pixel Head",monospace'; x.textAlign = 'center'; x.lineWidth = 3; x.strokeStyle = 'rgba(10,12,24,.85)';
      const label = (t, wx, wy, c) => { x.strokeText(t, wx * sc, wy * sc); x.fillStyle = c; x.fillText(t, wx * sc, wy * sc); };
      for (const z of G.ZONES) { const r = z.rect, open = G.zoneUnlocked(z); if (!open) { x.fillStyle = 'rgba(8,10,20,.6)'; x.fillRect(r[0] * sc, r[1] * sc, (r[2] - r[0] + 1) * sc, (r[3] - r[1] + 1) * sc); } label(open ? z.name.split(' ')[0] + ' ' + G.zoneLvl(z, S.zones[z.id].tier) : 'Reino nv ' + z.unlock, (r[0] + r[2]) / 2 + 0.5, (r[1] + r[3]) / 2, open ? '#fff3c4' : '#9aa3b8'); }
      label('Aurora', 44, 54.5, '#fff3c4'); label(G.riftOpen() ? 'Fenda ' + S.rift.floor : 'Cratera', 12.5, 90, '#e6b0ff');
      for (const m of G.mons) if (m.boss && !m.dead) { x.fillStyle = '#d070ff'; x.beginPath(); x.arc(m.x * sc, m.y * sc, 7, 0, 6.283); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 2; x.stroke(); x.strokeStyle = 'rgba(10,12,24,.85)'; x.lineWidth = 3; }
      for (const h of S.heroes) { if (h.state === 'recover') continue; x.fillStyle = h.state === 'fallen' ? '#ff5050' : '#ffffff'; x.beginPath(); x.arc(h.x * sc, h.y * sc, 6, 0, 6.283); x.fill(); x.lineWidth = 3; x.strokeStyle = G.RANK_COLOR[h.rank]; x.stroke(); x.lineWidth = 1; x.strokeStyle = '#1b110c'; x.beginPath(); x.arc(h.x * sc, h.y * sc, 8, 0, 6.283); x.stroke(); x.lineWidth = 3; x.strokeStyle = 'rgba(10,12,24,.85)'; }
      const [a, b] = R.screenToWorld(0, 0), [c, d] = R.screenToWorld(window.innerWidth, window.innerHeight); x.strokeStyle = '#ffffff'; x.lineWidth = 2; x.strokeRect(a * sc, b * sc, (c - a) * sc, (d - b) * sc);
    };
    paint(); clearInterval(mapTimer); mapTimer = setInterval(() => { if ($('#mapc')) paint(); else clearInterval(mapTimer); }, 600);
    cv.addEventListener('click', (e) => { const r = cv.getBoundingClientRect(); R.follow = 0; R.focus(((e.clientX - r.left) / r.width) * W.w, ((e.clientY - r.top) / r.height) * W.h, true); UI.closeModal(); if (UI.sheet && window.innerWidth < 860) UI.close(); });
  };

  /* ---------- apresentação (Rosa, a escrivã) ---------- */
  const TUT = [
    ['Bem-vindo a Aurora, majestade. Sou <b>Rosa</b>, escrivã da Cidadela. Seus heróis <b>caçam sozinhos</b>; a você cabe erguer a cidade, forjar o equipamento deles e chamar mais gente pelo Portal.', null],
    ['A <b>Jornada</b>, aqui embaixo, mostra sempre o próximo passo. Eu aponto onde tocar: é só seguir a mão dourada.', '#quest'],
  ];
  let tutI = 0, tutEl = null;
  UI.tutorial = (again) => { tutI = 0; if (again) G.S.tut.done = false; tutStep(); };
  const tutStep = () => {
    if (tutEl) { tutEl.classList.remove('tut-glow'); tutEl = null; }
    if (tutI >= TUT.length) { G.S.tut.done = true; G.S.tut.guide = 1; UI.closeModal(); R.focus(G.W.portal.x, G.W.portal.y - 0.5); return; }
    const [t, sel] = TUT[tutI];
    const rosa = A.portrait(A.npcLook({ name: 'Rosa', job: 'Escrivã', look: 3 }));
    UI.modal('<div class="eyebrow">Rosa, escrivã da Cidadela · ' + (tutI + 1) + '/' + TUT.length + '</div><div class="rosa" style="margin-top:10px"><i class="pt px" style="background-image:url(' + rosa + ')"></i><div class="tx">' + t + '</div></div><div class="acts"><button class="btn" data-a="tskip">Pular</button><button class="btn pri" data-a="tnext">' + (tutI === TUT.length - 1 ? 'Começar' : 'Continuar') + '</button></div>', { lock: true });
    const box = $('#modal'); box.style.alignItems = 'flex-end'; box.style.background = 'rgba(4,6,14,.45)'; box.style.paddingBottom = 'calc(var(--navh) + var(--sab) + 70px)';
    onCloseReset();
    if (sel) { tutEl = $(sel); if (tutEl) tutEl.classList.add('tut-glow'); }
  };
  const onCloseReset = () => { const prev = UI.closeModal; void prev; };
  UI.ACT.tnext = () => { tutI++; resetBox(); tutStep(); };
  UI.ACT.tskip = () => { tutI = TUT.length; resetBox(); tutStep(); };
  const resetBox = () => { const box = $('#modal'); box.style.alignItems = ''; box.style.background = ''; box.style.paddingBottom = ''; };
})();

;
