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
    G.M.modalPause = o.pause !== false;
  };
  UI.closeModal = () => { const m = $('#modal'); m.classList.remove('on'); m.innerHTML = ''; UI.modalOpen = false; G.M.modalPause = false; clearInterval(mapTimer); const f = onClose; onClose = null; if (f) f(); };
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
  UI.ACT.summon = (a) => {
    const S = G.S;
    if (a[0] === 'gold') { if (!G.spend(G.recruitCost(), 'recrutas')) return; } else { const n = G.nucleoCost(); if (S.nucleos < n) return; S.nucleos -= n; }
    cands = G.rollCandidates(a[0]); G.sfx('summon');
    let h = '<div class="eyebrow">O Portal se abre</div><h2>Quem fica em Aurora?</h2><div style="margin-top:12px">';
    cands.forEach((c, i) => { const fake = { cls: c.cls, look: c.look, rank: G.rankForLevel(c.lvl), gear: { arma: { tier: 1 }, armadura: null } }; const cl = G.CLASSES[c.cls]; h += '<button class="cand rar' + c.rar + '" data-a="hire:' + i + '"><i class="pt px" style="background-image:url(' + A.fullBody(A.heroLook(fake)) + ')"></i><span class="gr"><b style="font-size:14.5px;color:#fff">' + esc(c.name) + '</b> <span class="rar' + c.rar + '" style="font-weight:800;font-size:12px">' + G.RAR[c.rar] + '</span><br><span style="font-size:12.5px;color:var(--gold2);font-weight:800">' + cl.name + ' · Nv ' + c.lvl + '</span><br><span class="mut" style="font-size:11.5px">' + cl.desc + '</span><br><span style="font-size:11.5px">' + c.traits.map((t) => '<span class="pill">' + G.TRAITS[t].name + '</span>').join(' ') + '</span></span></button>'; });
    UI.modal(h + '</div>', { lock: true });
  };
  UI.ACT.hire = (a) => { const c = cands && cands[+a[0]]; if (!c) return; cands = null; const h = G.hire(c); UI.closeModal(); if (h) { R.follow = h.id; UI.banner('Um novo juramento', h.name, G.CLASSES[h.cls].name + ' ' + G.RAR[h.rar]); UI.inspect({ type: 'hero', ref: h }); if (UI.sheet && window.innerWidth < 860) UI.close(); } };
  UI.ACT.mgo = (a) => { UI.closeModal(); UI.open(a[0], a[1], a[2] ? { bld: a[2] } : null); };

  /* ---------- eventos ---------- */
  const ART = { portal: ['linear-gradient(180deg,#2a1450,#120a28)', [[50, 55, 70, '#7a34c8'], [50, 55, 44, '#b06af0'], [50, 55, 20, '#ffffff']]], caravan: ['linear-gradient(180deg,#f0b860,#c8843a)', [[80, 30, 34, '#fff3c0'], [20, 110, 120, '#a86a2a'], [70, 105, 90, '#8a5220']]], festival: ['linear-gradient(180deg,#3a2a6a,#1a1438)', [[20, 40, 12, '#ffd070'], [40, 28, 12, '#ff9a70'], [60, 42, 12, '#ffd070'], [80, 30, 12, '#ff70a0']]], redmoon: ['linear-gradient(180deg,#3a0a14,#14060c)', [[62, 46, 50, '#e83a4a'], [30, 30, 16, '#f0e0c0']]], blight: ['linear-gradient(180deg,#6a7a3a,#3a4420)', [[30, 70, 30, '#3a3020'], [60, 80, 40, '#2a2418'], [80, 60, 22, '#4a3a28']]], forge: ['linear-gradient(180deg,#3a2018,#1a0e0a)', [[50, 80, 60, '#ff8a2a'], [50, 80, 34, '#ffd070'], [50, 80, 14, '#ffffff']]], stars: ['linear-gradient(180deg,#141c48,#080c20)', [[20, 20, 4, '#fff'], [44, 44, 3, '#fff'], [70, 24, 5, '#cfe'], [86, 60, 3, '#fff'], [60, 70, 26, '#b0c8ff']]], tourney: ['linear-gradient(180deg,#2a4a8a,#14244a)', [[30, 50, 30, '#e2b659'], [70, 50, 30, '#c8473d'], [50, 50, 10, '#ffffff']]] };
  const artBox = (k) => { const a = ART[k] || ART.stars; return '<div class="art" style="background:' + a[0] + '">' + a[1].map(([x, y, r, c]) => '<i style="left:calc(' + x + '% - ' + r / 2 + 'px);top:calc(' + y + '% - ' + r / 2 + 'px);width:' + r + 'px;height:' + r + 'px;background:' + c + ';box-shadow:0 0 ' + r / 2 + 'px ' + c + '"></i>').join('') + '</div>'; };
  UI.eventModal = (e) => {
    const S = G.S; let h = '<div class="eyebrow">Acontece em Aurora</div><h2>' + esc(e.title) + '</h2>' + artBox(e.art) + '<p class="lead">' + esc(e.text) + '</p>';
    e.opts.forEach((o, i) => { const c = o.c ? o.c() : 0, dis = (o.can && !o.can(S)) || (c && S.gold < c); h += '<button class="opt" data-a="evopt:' + i + '"' + (dis ? ' disabled' : '') + '><b>' + esc(o.l) + '</b><span>' + esc(typeof o.d === 'function' ? o.d() : o.d) + '</span></button>'; });
    UI.modal(h, { lock: true });
  };
  UI.ACT.evopt = (a) => { const r = G.eventChoose(+a[0]); UI.closeModal(); if (r) UI.toast(r, 'info', 'scroll'); };
  UI.mareModal = (d) => {
    const a = d.a;
    UI.modal('<div class="eyebrow">Maré da Fenda</div><h2>' + (d.win ? 'Aurora resistiu!' : 'A Maré passou…') + '</h2>' + artBox(d.win ? 'festival' : 'redmoon') + '<div class="grid3"><div class="stat"><small>Invasores</small><b>' + a.total + '</b></div><div class="stat"><small>Abatidos</small><b class="good">' + a.killed + '</b></div><div class="stat"><small>Na praça</small><b class="' + (a.breach ? 'bad' : 'good') + '">' + a.breach + '</b></div></div>' +
      (d.win ? '<p class="lead">Os sinos tocam. Recompensa do reino: <b class="gold">+' + G.fmt(d.gold) + ' moedas, +' + d.selos + ' Selo(s), +' + d.nuc + ' Núcleo(s)</b>.</p>' : '<p class="lead">Invasores chegaram ao coração da cidade, saquearam o cofre e danificaram construções. A próxima Maré virá um pouco mais fraca — use o tempo para forjar, curar e estocar poções.</p>') + '<div class="acts"><button class="btn pri" data-a="mclose">Continuar</button></div>');
  };
  UI.offlineModal = (o) => {
    const m = Math.floor(o.secs / 60);
    UI.modal('<div class="eyebrow">Enquanto você esteve fora</div><h2>Aurora não parou</h2>' + artBox('stars') + '<p class="lead">' + (m >= 60 ? Math.floor(m / 60) + 'h ' + (m % 60) + 'min' : m + ' min') + ' se passaram. Seus heróis seguiram caçando em ritmo mais calmo.</p><div class="grid3"><div class="stat"><small>Moedas</small><b class="gold">+' + G.fmt(o.gold) + '</b></div><div class="stat"><small>Abates</small><b>' + G.fmt(o.kills) + '</b></div><div class="stat"><small>Espólio</small><b>+' + G.fmt(o.mats) + '</b></div></div><div class="acts"><button class="btn pri" data-a="mclose">Voltar ao trono</button></div>');
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
    UI.modal('<div class="eyebrow">Reino de Aurora</div><h2>Mapa</h2><canvas id="mapc" style="width:100%;border-radius:12px;margin-top:10px;display:block;image-rendering:auto;touch-action:none"></canvas><p class="lead" style="margin-bottom:0">Toque em um ponto para levar a câmera até lá.</p><div class="acts"><button class="btn" data-a="mclose">Fechar</button></div>', { pause: false });
    const cv = $('#mapc'), sc = 4; cv.width = W.w * sc; cv.height = W.h * sc; const x = cv.getContext('2d');
    const paint = () => {
      const S = G.S; x.drawImage(mc, 0, 0);
      x.font = '700 13px "Aurora Cinzel",serif'; x.textAlign = 'center'; x.lineWidth = 3; x.strokeStyle = 'rgba(10,12,24,.85)';
      const label = (t, wx, wy, c) => { x.strokeText(t, wx * sc, wy * sc); x.fillStyle = c; x.fillText(t, wx * sc, wy * sc); };
      for (const z of G.ZONES) { const r = z.rect, open = G.zoneUnlocked(z); if (!open) { x.fillStyle = 'rgba(8,10,20,.6)'; x.fillRect(r[0] * sc, r[1] * sc, (r[2] - r[0] + 1) * sc, (r[3] - r[1] + 1) * sc); } label(open ? z.name.split(' ')[0] + ' ' + G.zoneLvl(z, S.zones[z.id].tier) : 'Reino nv ' + z.unlock, (r[0] + r[2]) / 2 + 0.5, (r[1] + r[3]) / 2, open ? '#fff3c4' : '#9aa3b8'); }
      label('Aurora', 44, 54.5, '#fff3c4'); label(G.riftOpen() ? 'Fenda ' + S.rift.floor : 'Cratera', 12.5, 90, '#e6b0ff');
      for (const m of G.mons) if (m.boss && !m.dead) { x.fillStyle = '#d070ff'; x.beginPath(); x.arc(m.x * sc, m.y * sc, 7, 0, 6.283); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 2; x.stroke(); x.strokeStyle = 'rgba(10,12,24,.85)'; x.lineWidth = 3; }
      for (const h of S.heroes) { if (h.state === 'recover') continue; x.fillStyle = h.state === 'fallen' ? '#ff5050' : '#ffffff'; x.beginPath(); x.arc(h.x * sc, h.y * sc, 6, 0, 6.283); x.fill(); x.lineWidth = 3; x.strokeStyle = G.RANK_COLOR[h.rank]; x.stroke(); x.lineWidth = 1; x.strokeStyle = '#10141f'; x.beginPath(); x.arc(h.x * sc, h.y * sc, 8, 0, 6.283); x.stroke(); x.lineWidth = 3; x.strokeStyle = 'rgba(10,12,24,.85)'; }
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
