/* 67-ui-clareza: v24 — guia que aponta o próximo toque (2C.1), fila única de janelas (2C.2), códex de inscrições (2C.4),
   próxima recompensa (2C.5) e ajustes de legibilidade do HUD (2C.6). Só interface. */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const UI = G.UI, A = G.A, R = G.R, ic = UI.ic, esc = UI.esc, $ = UI.$;

  /* ---------- estilo ---------- */
  const css = document.createElement('style');
  css.textContent = [
    '#guide{position:absolute;inset:0;z-index:41;pointer-events:none;display:none}',
    '#guide.on{display:block}',
    '.gd-ring{position:absolute;border:2px solid #ffe08a;border-radius:14px;box-shadow:0 0 0 2px rgba(255,224,138,.22),0 0 18px rgba(255,214,110,.8),inset 0 0 12px rgba(255,214,110,.35)}',
    '.gd-ring.p{animation:gdr 1.25s ease-out infinite;box-shadow:none}',
    '@keyframes gdr{0%{opacity:.95;transform:scale(.97)}75%{opacity:.25;transform:scale(1.12)}100%{opacity:0;transform:scale(1.14)}}',
    '.gd-ring.rd,.gd-ring.rd.p{border-radius:50%}',
    '.gd-hand{position:absolute;width:40px;height:48px;animation:gdb .7s ease-in-out infinite alternate;filter:drop-shadow(0 3px 5px rgba(0,0,0,.65))}',
    '.gd-hand svg{display:block;width:100%;height:100%}',
    '.gd-hand.dn svg{transform:rotate(180deg)}',
    '@keyframes gdb{from{transform:translateY(0)}to{transform:translateY(calc(var(--bd,-1) * 9px))}}',
    '.gd-tip{position:absolute;display:flex;align-items:center;gap:2px;min-height:40px;padding:4px 2px 4px 12px;border-radius:14px;background:linear-gradient(180deg,#27315c,#171d3a);border:1.5px solid var(--gold2);box-shadow:0 8px 22px rgba(0,0,0,.55);font-size:12.5px;font-weight:700;line-height:1.3;color:#fff3d0;width:max-content;max-width:min(236px,calc(100vw - 16px))}',
    '.gd-x{pointer-events:auto;flex:none;width:36px;height:36px;border:0;background:transparent;color:var(--mut);display:grid;place-items:center;border-radius:10px;cursor:pointer}',
    '.gd-x svg{width:14px;height:14px;fill:currentColor}',
    '@media (prefers-reduced-motion:reduce){.gd-hand,.gd-ring.p{animation:none}}',
  ].join('\n');
  document.head.appendChild(css);

  /* ================= 2C.1 guia que aponta ================= */
  /* Depois das duas falas da Rosa, uma mão pulsante mostra o próximo toque das primeiras missões da Jornada
     (Portal, Reino › Prédios, Forja). Nunca bloqueia (só o ✕ recebe toque), some ao concluir e pode ser dispensada.
     Só aparece em jogo novo: S.tut.guide = 1 é gravado quando a apresentação termina; saves antigos nunca o têm. */
  const HAND = '<svg viewBox="0 0 28 34"><path d="M10.5 4.600a3.100 3.100 0 016.200 0V15l6.100 1.700c1.700.5 2.700 2 2.400 3.700l-.9 6.600a3.800 3.800 0 01-3.800 3.300h-6.500a4.300 4.300 0 01-3.500-1.800L3.400 21.200a2.200 2.200 0 013.500-2.600l3.600 3.300z" fill="#fff3c4" stroke="#1a1408" stroke-width="1.600" stroke-linejoin="round"/><path d="M14 17.500v5.500M18.300 18.600v4.800" stroke="#c9a24a" stroke-width="1.200" stroke-linecap="round"/></svg>';
  let gd = null, gdOn = false, gdKey = '', gdScrolled = '', gdInsp = 0;
  const vis = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return r.width < 4 || r.height < 4 ? null : r; };
  const covered = (el) => { const r = el.getBoundingClientRect(), e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !e || !(el === e || el.contains(e)); };
  const sheetOn = (name) => UI.sheet && UI.sheet.name === name && $('#sheet.on');
  const tabBtn = (id) => $('#sheet .tabs [data-a="tab:' + id + '"]');
  /* alvo do momento: { el | r, text, key, round } ou null */
  const guideTarget = () => {
    const S = G.S; if (!S || !S.tut || !S.tut.guide || !S.tut.done || !G.M.running) return null;
    if (UI.dock && UI.dock.kind) return null;          // v27: o cartão inferior (prédio, decisão) tem prioridade sobre a mão do guia
    const st = S.quest.step; if (st > (UI.GUIDE_LAST || 4)) { S.tut.guide = 0; return null; }
    const q = G.questCur(), modal = UI.modalOpen;
    if (q.done) {                                                    // missão cumprida: falta resgatar
      if (modal) return null;
      if (R.sel) {                                                   // a ficha do herói esconde a barra da Jornada: fecha sozinha depois de um instante
        if (!gdInsp) gdInsp = performance.now(); else if (performance.now() - gdInsp > 2200) { gdInsp = 0; UI.ACT.unsel(); }
        return null;
      }
      gdInsp = 0;
      const e = $('#quest'); if (!vis(e)) return null;
      if (covered(e)) { const x = $('#sheet.on .x'); return vis(x) ? { el: x, text: 'Feche o painel e receba o prêmio da Jornada.', key: 'claimx' + st } : null; }
      return { el: e, text: 'Missão cumprida! Toque na Jornada para receber o prêmio.', key: 'claim' + st };
    }
    if (st === 0) {
      if (modal) {
        const b = $('#modal [data-a="summon:gold"]:not([disabled])'); if (b) return { el: b, text: 'Toque para contratar.', key: 's0m', opp: 1 };
        const c = $('#modal .cand'); if (c) return { el: c, text: 'Escolha quem fica em Aurora.', key: 's0c', opp: 1 };
        return null;
      }
      if (!UI.sheet) {                                               // o Portal na praça, se estiver à vista
        const p = G.W.portal, [x, y] = R.worldToScreen(p.x, p.y - 1.1), hb = vis($('#hud')), qt = vis($('#quest'));
        if (hb && x > 30 && x < innerWidth - 30 && y > hb.bottom + 40 && y < (qt ? qt.top : innerHeight - 140) - 30) return { r: { left: x - 36, top: y - 36, width: 72, height: 72, bottom: y + 36 }, round: 1, text: 'Toque no Portal e chame um herói.', key: 's0p' };
      }
      const b = $('#roster .hc.add'); return vis(b) ? { el: b, text: 'Toque no + para chamar um herói.', key: 's0a' } : null;
    }
    if (modal) return null;
    if (UI.guideExtra && st !== 0 && st !== 2 && st !== 3 && st !== 4) return UI.guideExtra(q, st);
    if (st === 2 || st === 3) {
      const id = st === 2 ? 'enfermaria' : 'ferraria', nm = st === 2 ? 'a Enfermaria' : 'a Ferraria';
      if (sheetOn('reino')) {
        if (UI.sheet.tab !== 'obras') { const t = tabBtn('obras'); return vis(t) ? { el: t, text: 'Abra a aba Prédios.', key: 'r' + st + 't' } : null; }
        const b = $('#sheet [data-a="upg:' + id + '"]') || $('#bc-' + id);
        if (b) return { el: b, text: b.disabled ? 'Faltam moedas ou materiais: seus heróis vão juntar.' : 'Toque para construir ' + nm + '.', key: 'r' + st + 'b', scroll: 1 };
      }
      return { el: $('#nav-reino'), text: 'Abra o Reino e construa ' + nm + '.', key: 'r' + st + 'n' };
    }
    if (st === 4) {
      if (sheetOn('forja')) {
        if (UI.sheet.tab !== 'forjar') { const t = tabBtn('forjar'); return vis(t) ? { el: t, text: 'Abra a aba Forjar.', key: 'f4t' } : null; }
        const b = $('#sheet [data-a^="craft:"][data-a$=":0"]:not([disabled])') || $('#sheet [data-a^="craft:"][data-a$=":0"]');
        if (b) return { el: b, text: b.disabled ? 'Faltam materiais: seus heróis vão trazê-los.' : 'Toque em Forjar.', key: 'f4b', scroll: 1 };
      }
      return { el: $('#nav-forja'), text: 'Abra a Forja e crie equipamentos.', key: 'f4n' };
    }
    return null;
  };
  UI.guideTarget = guideTarget;
  UI.gd = { vis, covered, sheetOn, tabBtn }; UI.guideActive = () => gdOn;
  const guideHide = () => { if (gdOn) { gdOn = false; gd.classList.remove('on'); gdKey = ''; } };
  let gdSkip = 0;
  const guideFrame = () => {
    requestAnimationFrame(guideFrame);
    if (!gd || (++gdSkip & 1)) return;      // v26 (4C.3): 30 Hz bastam (cada passada lê o layout várias vezes)
    let t = null; try { t = guideTarget(); } catch (e) { t = null; }
    if (!t) return guideHide();
    let r = t.r || vis(t.el); if (!r) return guideHide();
    const vw = innerWidth, vh = innerHeight;
    /* dentro da lista rolável de um painel: rola uma vez até o alvo; fora da área visível, a mão se esconde */
    const bd = t.el && t.el.closest && t.el.closest('.sh-body');
    if (bd) {
      const b = bd.getBoundingClientRect();
      if (r.top < b.top + 4 || r.bottom > b.bottom - 4) { if (t.scroll && gdScrolled !== t.key) { gdScrolled = t.key; t.el.scrollIntoView({ block: 'center' }); r = t.el.getBoundingClientRect(); } if (r.top < b.top + 4 || r.bottom > b.bottom - 4) return guideHide(); }
    }
    if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) return guideHide();
    const x = (n) => Math.round(n) + 'px';
    const ring = gd.children[0], ring2 = gd.children[1], hand = gd.children[2], tip = gd.children[3];
    for (const e of [ring, ring2]) { e.style.left = x(r.left - 5); e.style.top = x(r.top - 5); e.style.width = x(r.width + 10); e.style.height = x(r.height + 10); e.classList.toggle('rd', !!t.round); }
    const below = r.top + r.height / 2 < vh * 0.45, cx = r.left + r.width / 2;
    hand.classList.toggle('dn', !below); hand.style.setProperty('--bd', below ? -1 : 1);
    hand.style.left = x(Math.max(4, Math.min(vw - 44, cx - 20))); hand.style.top = x(below ? r.bottom + 4 : r.top - 52);
    if (gdKey !== t.key) { gdKey = t.key; tip.firstChild.textContent = t.text; }
    else if (tip.firstChild.textContent !== t.text) tip.firstChild.textContent = t.text;
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    tip.style.left = x(Math.max(8, Math.min(vw - 8 - tw, cx - tw / 2)));
    const tipBelow = t.opp ? !below : below;
    tip.style.top = x(tipBelow ? (t.opp ? r.bottom + 6 : r.bottom + 52) : (t.opp ? r.top - th - 6 : r.top - 52 - th - 2));
    if (!gdOn) { gdOn = true; gd.classList.add('on'); }
  };
  UI.ACT.gdoff = () => { if (G.S) G.S.tut.guide = 0; guideHide(); UI.toast('Dicas dispensadas. A Jornada continua mostrando o próximo passo.', 'info', 'scroll'); };
  const bdG = UI.build;
  UI.build = () => {
    bdG();
    const app = $('#app');
    if (app && !$('#guide')) {
      app.insertAdjacentHTML('beforeend', '<div id="guide"><i class="gd-ring p"></i><i class="gd-ring"></i><div class="gd-hand">' + HAND + '</div><div class="gd-tip"><span></span><button class="gd-x" data-a="gdoff" title="Dispensar dicas">' + ic('close') + '</button></div></div>');
      gd = $('#guide'); requestAnimationFrame(guideFrame);
    }
  };

  /* ================= 2C.3 Poder da peça: +N% / −N% com cor ================= */
  UI.pctTxt = (x) => (x < 0 ? '−' : '+') + Math.round(Math.abs(x) * 100) + '%';
  UI.pctSpan = (x) => (Math.abs(x) < 0.01 ? '<b>igual</b>' : '<b class="' + (x > 0 ? 'good' : 'bad') + '">' + UI.pctTxt(x) + '</b>');
  /* linha da reforja: poder da peça (todas as inscrições pesam) e, abaixo, só o conjunto de inscrições */
  UI.cmpLine = (it) => {
    const c = G.pieceCmp(it, Object.assign({}, it, { ins: it.rfp }));
    return '<div class="rfdelta">Poder da peça: ' + UI.pctSpan(c.pct) + (c.same ? ' <small class="mut">(menos de 1%)</small>' : '') +
      (c.ins != null ? '<br><small class="mut">só as inscrições: ' + UI.pctSpan(c.ins) + '</small>' : '') + '</div>';
  };

  /* ================= 2C.2 fila única de janelas ================= */
  /* Nenhuma janela abre por cima de outra. Quem quer abrir uma janela sozinha (retorno, novidades, baú da Arena, calendário,
     cerimônias, eventos) chama UI.queueModal(prioridade, fn, chave); a fila abre uma de cada vez, a de menor prioridade
     primeiro, com ~600 ms de respiro depois de cada fechamento. fn() abre a janela (e devolve false se já não vale a pena).
     Janelas que o jogador abre com um toque continuam abrindo na hora. */
  const PRIO = (UI.PRIO = { tut: 0, retorno: 1, novidades: 2, arena: 3, calendario: 4, cerimonia: 5, evento: 6 });
  const GAP = 600;
  let QQ = [], lastCloseT = 0, qSeq = 0, qTimer = 0, showingKey = '';
  const qSoon = (ms) => { clearTimeout(qTimer); qTimer = setTimeout(qPump, Math.max(0, ms)); };
  UI.queueModal = (prio, fn, key) => {
    if (key && (showingKey === key || QQ.some((e) => e.key === key))) return;
    QQ.push({ prio, fn, key: key || '', seq: ++qSeq });
    qSoon(0);
  };
  UI.queueBusy = () => QQ.length > 0 || UI.modalOpen;
  UI.queueLog = [];                                                // para testes: { t, key } de cada janela aberta pela fila
  const qPump = () => {
    if (!QQ.length || !G.S || !G.M.running || UI.modalOpen) return;
    const wait = GAP - (performance.now() - lastCloseT);
    if (wait > 0) return qSoon(wait + 15);
    QQ.sort((a, b) => a.prio - b.prio || a.seq - b.seq);
    const i = QQ.findIndex((e) => e.prio <= PRIO.retorno || G.S.tut.done);
    if (i < 0) return;
    const e = QQ.splice(i, 1)[0];
    try { e.fn(); } catch (err) { console.error(err); }
    if (UI.modalOpen) { showingKey = e.key; UI.queueLog.push({ t: Math.round(performance.now()), key: e.key || ('p' + e.prio) }); if (UI.queueLog.length > 60) UI.queueLog.shift(); }
    else if (QQ.length) qSoon(40);                                 // não abriu nada: tenta a próxima
  };
  const cmQ = UI.closeModal;
  UI.closeModal = () => { const was = UI.modalOpen; lastCloseT = performance.now(); showingKey = ''; cmQ(); if (was && QQ.length) qSoon(GAP + 20); };
  G.on('start', () => { lastCloseT = performance.now() - 200; qSoon(420); });   // a primeira janela espera um instante depois do início

  /* ---------- novidades: UMA janela só, com seções recolhíveis das versões que o jogador ainda não viu ---------- */
  UI.NEWS = UI.NEWS || {};
  UI.NEWS.v24 = { t: 'Forja da Sorte, Arena e Lendas', n: 'Aurora v23 e v24', rows: [
    ['anvil', 'Inscrições e Reforja', 'Peças Incomuns ou melhores nascem com inscrições sorteadas (qualidade 1 a 5). Na Ferraria, reforje e escolha: manter ou aceitar. O Pó de Reforja sai do desmonte.'],
    ['spark', 'Cartas de raridade e Garantia', 'Peça Épica ou melhor revela uma carta. No Portal, a cada 10 sorteios sem Épico, o próximo é garantido.'],
    ['gift', 'Voltar é um presente', 'Cartas de retorno (uma por hora fora), calendário de 7 dias, criatura da sorte para tocar e uma semana temática com prazo.'],
    ['trophy', 'Arena das Duas Luas', 'Missões › Arena: duele contra reinos rivais, ganhe pontos e Insígnias e suba de liga a cada temporada semanal.'],
    ['crown', 'Lendas e Poder do Reino', 'Livro de Feitos e 31 títulos na ficha de cada herói, o Herói do Dia e o Poder do Reino (a coroa no alto da tela) com marcos e recordes.'],
  ] };
  UI.NEWS.v25 = { t: 'O mundo reage a você', n: 'Aurora v25', rows: [
    ['skull', 'Colosso da Semana', 'De sexta a domingo um Colosso desperta na Cratera. A vida dele não volta entre sessões: convoque os heróis, suba no ranking de dano contra os reinos rivais e leve a relíquia da semana.'],
    ['trophy', 'Nêmesis e visitantes', 'O reino que mais te derrota vira seu Nêmesis — vença a revanche por +50% de pontos. Campeões rivais passeiam pela praça e aceitam um duelo amistoso por dia.'],
    ['people', 'Laços entre heróis', 'Quem caça e duela junto vira Companheiro ou Irmão de Armas (ou Rival Amistoso) e luta melhor lado a lado. Veja na aba Feitos.'],
    ['star', 'Renascimento', 'Agora no Rank SS nível 70. Quem renasce ganha Pontos de Renascimento para comprar traços raros e subir traços no Altar. A ficha mostra a prévia desde o Rank A.'],
    ['shield', 'Menos tropeços', 'A mão do guia vai até o Mercado e a Jornada avisa os pré-requisitos. Heróis caem bem menos e você é avisado do perigo. Elites e chefes deixam peças inscritas no chão; o Pergaminho de Proteção devolve o custo de um +N que falhar.'],
  ] };
  UI.NEWS.v26 = { t: 'Nenhum minuto vazio', n: 'Aurora v26', rows: [
    ['scroll', 'Pedidos dos moradores', 'Alda, Fábio, Quim e os outros pedem coisas curtas, com prazo: um balão dourado aparece sobre eles. Toque para ver e para entregar. O prêmio varia a cada pedido.'],
    ['flag', 'A cidade tem cenas', 'À noite os heróis se reúnem na fogueira da praça, almoçam e jantam na mesa da Taverna e treinam de brincadeira no Campo de Treino, com falas que citam laços, títulos e feitos.'],
    ['spark', 'Ressonância de inscrições', 'Inscrições da mesma família (Fúria, Baluarte, Vento, Vida, Fortuna, Saber) em várias peças do mesmo herói ativam bônus de conjunto. A ficha mostra a barra e o próximo.'],
    ['people', 'Combinações de formação', 'Na Arena e no Colosso, classes na posição certa formam combinações com nome, como a Muralha Arcana. A tela de equipe mostra as ativas e sugere uma troca.'],
    ['book', 'Livro do Reino e menos barulho', 'O ? no alto de cada painel abre a página da Rosa sobre aquela aba; o índice fica em Mais › Livro. Abas e botões só aparecem quando o sistema abre, com um selo Novo! até o primeiro toque. O jogo também liga sozinho o Modo leve se o aparelho estiver pesado.'],
  ] };
  UI.NEWS.v27 = { t: 'Reino sem pausa', n: 'Aurora v27', rows: [
    ['moon', 'O reino não espera', 'Ao voltar, Aurora é simulada de verdade pelo tempo em que você esteve fora: metade do tempo nas primeiras 8 h, 30% nas 8 h seguintes, até 16 h. Um resumo mostra o que mudou.'],
    ['scroll', 'Nada pausa, nada interrompe', 'Janelas não pausam mais o jogo (só o botão de pausa). Eventos viram uma decisão no atalho do mapa, com contagem: sem resposta, Aurora escolhe a opção segura e anota no registro.'],
    ['castle', 'Toque num prédio', 'Um cartão mostra o que ele faz, o que dá agora e no próximo nível, quem está lá dentro e o botão Evoluir, sem sair do mapa.'],
    ['hammer', 'Lenharia e Pedreira prontas', 'Começam no nível 1. A Jornada agora pede o nível 2 de cada uma.'],
  ] };
  const NEWS_ORDER = ['v27', 'v26', 'v25', 'v24', 'v22', 'v21', 'v20'];
  const newsPending = () => { const s = (G.S && G.S.tut && G.S.tut.seen) || {}; return NEWS_ORDER.filter((k) => !s[k] && UI.NEWS[k]); };
  UI.newsPending = newsPending;
  UI.whatsNew = (keys) => {
    keys = (keys && keys.length ? keys : newsPending()).filter((k) => UI.NEWS[k]);
    if (!keys.length) return false;
    keys.sort((a, b) => NEWS_ORDER.indexOf(a) - NEWS_ORDER.indexOf(b));
    const seen = G.S.tut.seen || (G.S.tut.seen = {}); for (const k of keys) seen[k] = 1;
    const row = ([i, t, d]) => '<div class="row" style="margin-bottom:9px"><span class="thumb sm" style="display:grid;place-items:center;font-size:20px;color:var(--gold2)">' + ic(i) + '</span><div class="gr"><b style="font-size:13px">' + t + '</b><br><span class="mut" style="font-size:12px">' + d + '</span></div></div>';
    const sec = (k, i) => { const d = UI.NEWS[k]; return '<details class="nv"' + (i === 0 ? ' open' : '') + '><summary><b>' + d.t + '</b><small>' + d.rows.length + (d.rows.length === 1 ? ' novidade' : ' novidades') + '</small></summary><div class="nb">' + (d.lead ? '<p class="mut" style="font-size:12px;margin:2px 0 8px">' + d.lead + '</p>' : '') + d.rows.map(row).join('') + '</div></details>'; };
    UI.modal('<div class="eyebrow">Aurora v' + G.VERSION.replace(/\.0$/, '') + '</div><h2>O que mudou desde a sua última visita</h2><p class="lead" style="margin-bottom:6px">' + (keys.length > 1 ? 'Estas novidades chegaram enquanto você estava fora. Abra uma seção para ler.' : 'Esta novidade chegou enquanto você estava fora.') + '</p>' +
      keys.map(sec).join('') + '<div class="acts nv-acts"><button class="btn pri" data-a="mclose">Entendi</button></div>');
    return true;
  };
  css.textContent += '\n' + [
    '.nv{margin-top:8px;border:1px solid var(--line2);border-radius:12px;background:rgba(0,0,0,.2);overflow:hidden}',
    '.nv summary{display:flex;align-items:center;gap:8px;min-height:44px;padding:8px 12px;cursor:pointer;list-style:none;font-family:"Aurora Cinzel",serif;font-size:13px;letter-spacing:.03em;color:var(--gold2)}',
    '.nv summary::-webkit-details-marker{display:none}',
    '.nv summary small{margin-left:auto;white-space:nowrap;font-family:Manrope,system-ui,sans-serif;font-size:11px;font-weight:700;color:var(--mut);letter-spacing:0}',
    '.nv summary::after{content:"";flex:none;width:7px;height:7px;border-right:2px solid var(--gold2);border-bottom:2px solid var(--gold2);transform:rotate(45deg);margin:-3px 2px 0 6px;transition:transform .2s}',
    '.nv[open] summary::after{transform:rotate(-135deg);margin-top:3px}',
    '.nv .nb{padding:4px 12px 4px}',
    '.nv-acts{position:sticky;bottom:-16px;margin:8px -16px -16px!important;padding:12px 16px 16px;background:linear-gradient(180deg,rgba(16,21,42,0),#10152a 32%)}',
    '.toast{position:relative}.toast .tx{flex:none;margin-left:auto;padding:1px 7px;border-radius:9px;background:rgba(226,182,89,.2);color:var(--gold2);font-size:11px;font-weight:800}',
  ].join('\n');

  /* ---------- avisos (toasts): no máximo 3, repetidos agrupam com ×N, e sempre abaixo do HUD (nunca sobre o chip de Poder) ---------- */
  UI.toast = (m, k, icon, ms, act) => {          // v27 (A2): act = ação (data-a) que o toque no aviso executa, para o que antes abria janela sozinho
    const box = $('#toasts'); if (!box) return;
    k = k || '';
    for (const t of box.children) {
      if (t.dataset.m === m && t.dataset.k === k) {
        if (act) t.setAttribute('data-a', act);
        const n = (+t.dataset.n || 1) + 1; t.dataset.n = n;
        let b = t.querySelector('.tx'); if (!b) { b = document.createElement('b'); b.className = 'tx'; t.appendChild(b); }
        b.textContent = '×' + n;
        t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
        clearTimeout(t._to); t._to = setTimeout(() => t.remove(), ms || 3500);
        return;
      }
    }
    while (box.children.length >= 3) box.firstChild.remove();
    const t = document.createElement('div'); t.className = 'toast ' + k; t.dataset.m = m; t.dataset.k = k;
    t.innerHTML = ic(icon || (k === 'bad' ? 'skull' : k === 'good' ? 'check' : 'info')) + '<span>' + esc(m) + '</span>';
    if (act) t.setAttribute('data-a', act);
    box.appendChild(t); t._to = setTimeout(() => t.remove(), ms || 3500);
  };

  css.textContent += '\n' + [
    '@media (max-width:859px){#app #toasts{top:calc(var(--hudb,200px) + 8px)}}',
    '#app #toasts{z-index:16}',
  ].join('\n');
  const hudWatch = () => {
    const h = $('#hud'); if (!h) return;
    const set = () => document.documentElement.style.setProperty('--hudb', Math.ceil(h.getBoundingClientRect().bottom) + 'px');
    set(); if (window.ResizeObserver) new ResizeObserver(set).observe(h); window.addEventListener('resize', set);
  };
  const bdH = UI.build; UI.build = () => { bdH(); hudWatch(); };

  /* ---------- engate no laço de atualização (4×/s) ---------- */
  const rfQ = UI.refresh;
  UI.refresh = () => {
    rfQ();
    const S = G.S; if (!S || !G.M.running) return;
    /* v27 (A2): as novidades da versão e o evento pendente deixaram a fila de janelas: ficam na caixa de pendências (6G), com um aviso de toque */
    if (S.tut.done && newsPending().length) UI.inboxPing('novidades', 'Novidades da versão ' + G.VERSION.replace(/\.0$/, '') + ' no atalho de pendências', 'spark');
    if (QQ.length && !UI.modalOpen) qPump();
  };

  /* ================= 2C.4 Códex de Inscrições (Mais › Códex) ================= */
  css.textContent += '\n' + [
    '.cdxq,.cdxr{display:grid;grid-template-columns:minmax(0,1fr) repeat(5,38px);gap:4px;align-items:center}',
    '.cdxq{margin:2px 0 4px;font-size:9.5px;font-weight:800;text-align:center;color:var(--mut)}',
    '.cdxq b{font-weight:800}',
    '.cdxr{width:100%;margin:0 0 4px;padding:0;border:0;background:none;color:inherit;font:inherit;text-align:left}',
    'button.cdxr{cursor:pointer}',
    '.cdxr.g,.cdxq.g{grid-template-columns:minmax(0,1fr) repeat(6,36px)}',
    '.cdxr .nm{font-size:12.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}',
    '.cdxr.off .nm{color:var(--mut);letter-spacing:.2em}',
    '.cdxc{height:32px;border-radius:9px;display:grid;place-items:center;font-style:normal;font-size:12.5px;font-weight:800;border:1px solid var(--line2);background:rgba(255,255,255,.04);color:#58607a}',
    '.cdxc.on{color:var(--qc);border-color:var(--qc);background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.04));text-shadow:0 0 8px var(--qc)}',
    '.cdxc.on.q5{box-shadow:0 0 12px rgba(255,211,90,.55);animation:cdxg 2.4s ease-in-out infinite alternate}',
    '@keyframes cdxg{from{box-shadow:0 0 6px rgba(255,211,90,.35)}to{box-shadow:0 0 14px rgba(255,211,90,.75)}}',
    '.cdxs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}',
    '.cdxs small{display:flex;justify-content:space-between;font-size:11.5px;color:var(--mut);font-weight:700;margin-bottom:3px}',
    '.cdxs small b{color:var(--gold2)}',
    '.cdxm{display:flex;gap:10px;align-items:center;padding:8px 10px;margin-bottom:6px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid var(--line2)}',
    '.cdxm.done{border-color:rgba(95,207,124,.45);background:rgba(95,207,124,.07)}',
    '.cdxm .ck{flex:none;width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:rgba(226,182,89,.14);color:var(--gold2);font-size:16px}',
    '.cdxm.done .ck{background:rgba(95,207,124,.2);color:var(--good)}',
    '.cdxm .gr{min-width:0;flex:1}',
    '.cdxm b{display:block;font-size:12.5px}',
    '.cdxm small{display:block;font-size:11px;color:var(--mut);line-height:1.3}',
    '.cdxm .bar{margin-top:5px}',
    '.cdxm .rw{display:flex;flex-direction:column;gap:3px;align-items:flex-end;flex:none}',
    '.cdxm .rw span{display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:800;color:#e9edf8}',
    '.cdxm .rw svg{width:13px;height:13px}',
    '.cdxd{display:flex;align-items:center;gap:8px;padding:6px 9px;margin-top:5px;border-radius:10px;background:rgba(255,255,255,.05);border-left:3px solid var(--qc)}',
    '.cdxd i{flex:none;font-style:normal;font-size:9px;letter-spacing:1px;color:var(--qc);white-space:nowrap}',
    '.cdxd b{flex:none;color:var(--qc);font-size:12px}',
    '.cdxd em{font-style:normal;font-size:12px;color:#cfd5e4;min-width:0}',
    '.cdxd.no{opacity:.55;border-left-color:#556}',
  ].join('\n');
  const insShort = (id) => G.INS[id].name.replace(/^(da|do|dos|das|de) /, '');
  const tierShort = (t) => G.tierName(t).replace(/^(de|da|das|do|dos) /, '');
  const RARS3 = ['Com', 'Inc', 'Rar', 'Épi', 'Len', 'Mít'];
  const rwChips = (rw) => '<div class="rw">' + (rw.nucleos ? '<span>' + ic('core') + '+' + rw.nucleos + '</span>' : '') + (rw.selos ? '<span>' + ic('seal') + '+' + rw.selos + '</span>' : '') +
    (rw.po_reforja ? '<span><i class="px ri-po_reforja" style="width:14px;height:14px"></i>+' + rw.po_reforja + '</span>' : '') + (rw.gold ? '<span>' + ic('coin') + '+' + G.fmt(rw.gold) + '</span>' : '') + '</div>';
  const codexTab = () => {
    const c = G.codex(), s = G.codexStats(); c.fresh = 0;
    const pc = (a, b) => Math.round(100 * a / b);
    let h = '<div class="card hl"><div class="row"><span class="thumb sm" style="display:grid;place-items:center;font-size:22px;color:var(--gold2)">' + ic('book') + '</span><div class="gr"><h3>Códex de Inscrições</h3><p>Tudo o que você já viu em peças forjadas ou ganhas. As casas escuras esperam ser descobertas; completar a coleção rende prêmios.</p></div></div>' +
      '<div class="cdxs"><div><small>Inscrições <b>' + s.slots + '/' + s.slotsMax + '</b></small><div class="bar"><i style="width:' + pc(s.slots, s.slotsMax) + '%"></i></div></div><div><small>Peças <b>' + s.cells + '/' + s.cellsMax + '</b></small><div class="bar"><i style="width:' + pc(s.cells, s.cellsMax) + '%"></i></div></div></div></div>';
    h += '<div class="sec">Inscrições · 16 tipos × 5 qualidades</div><div class="cdxq">' + '<span></span>' + [1, 2, 3, 4, 5].map((q) => '<b style="color:' + G.INS_QCOL[q] + '">' + G.INS_Q[q] + '</b>').join('') + '</div>';
    for (const id of G.INS_IDS) {
      const m = c.ins[id] || 0, cells = [1, 2, 3, 4, 5].map((q) => (m & (1 << q) ? '<i class="cdxc on q' + q + '" style="--qc:' + G.INS_QCOL[q] + '">' + q + '</i>' : '<i class="cdxc">?</i>')).join('');
      h += m ? '<button class="cdxr" data-a="cdxi:' + id + '"><span class="nm">' + insShort(id) + '</span>' + cells + '</button>' : '<div class="cdxr off"><span class="nm">? ? ?</span>' + cells + '</div>';
    }
    let tmax = G.CODEX_TIERS; for (const t in c.gear) if (+t > tmax && c.gear[t]) tmax = Math.min(12, +t);
    h += '<div class="sec">Peças · tier × raridade</div><div class="cdxq g"><span></span>' + RARS3.map((n, r) => '<b style="color:' + G.RAR_COLOR[r] + '">' + n + '</b>').join('') + '</div>';
    for (let t = 1; t <= tmax; t++) {
      const m = c.gear[t] || 0;
      h += '<div class="cdxr g' + (m ? '' : ' off') + '"><span class="nm">' + (m || t <= 2 ? tierShort(t) : '? ? ?') + '</span>' + [0, 1, 2, 3, 4, 5].map((r) => (m & (1 << r) ? '<i class="cdxc on" style="--qc:' + G.RAR_COLOR[r] + '">✦</i>' : '<i class="cdxc">?</i>')).join('') + '</div>';
    }
    const left = G.CODEX_MS.filter((m) => !c.ms[m.id]).map((m) => ({ m, p: Math.min(m.t, m.v(s)) / m.t })).sort((a, b) => b.p - a.p), done = G.CODEX_MS.filter((m) => c.ms[m.id]);
    h += '<div class="sec">Marcos do Códex · ' + done.length + '/' + G.CODEX_MS.length + '</div>';
    for (const { m, p } of left) h += '<div class="cdxm"><span class="ck">' + ic(m.ic) + '</span><div class="gr"><b>' + m.n + '</b><small>' + m.d + '</small><div class="bar"><i style="width:' + Math.round(p * 100) + '%"></i></div></div>' + rwChips(m.rw) + '</div>';
    for (const m of done) h += '<div class="cdxm done"><span class="ck">' + ic('check') + '</span><div class="gr"><b>' + m.n + '</b><small>' + m.d + '</small></div>' + rwChips(m.rw) + '</div>';
    if (c.back) h += '<p class="mut" style="font-size:11.5px;text-align:center;margin-top:6px">' + c.back + (c.back === 1 ? ' marco já estava alcançado' : ' marcos já estavam alcançados') + ' quando o Códex foi criado.</p>';
    return h;
  };
  UI.ACT.cdxi = (a) => {
    const id = a[0], d = G.INS[id], m = G.codex().ins[id] || 0; if (!d || !m) return;
    UI.modal('<div class="eyebrow">Códex · Inscrição</div><h2>' + insShort(id) + '</h2>' +
      '<p class="mut" style="text-align:center;font-size:11.5px;margin:0 0 6px">Valores numa peça do tier 6 (a qualidade e o tier da peça mudam o valor).</p>' +
      [1, 2, 3, 4, 5].map((q) => '<div class="cdxd' + (m & (1 << q) ? '' : ' no') + '" style="--qc:' + G.INS_QCOL[q] + '"><i>' + '●'.repeat(q) + '○'.repeat(5 - q) + '</i><b>' + G.INS_Q[q] + '</b><em>' + (m & (1 << q) ? esc(G.insText({ tier: 6 }, id, q)) : 'Ainda não vista') + '</em></div>').join('') +
      '<div class="acts"><button class="btn pri" data-a="mclose">Fechar</button></div>', { pause: false });
  };
  const M1 = UI.SHEETS && UI.SHEETS.mais;
  if (M1) {
    const mr1 = M1.render;
    M1.render = function (tab, sub) { return tab === 'codex' ? codexTab() : mr1.call(M1, tab, sub); };
    const k = M1.tabs.findIndex((t) => t[0] === 'recordes');
    M1.tabs.splice(k < 0 ? M1.tabs.length : k, 0, ['codex', 'Códex']);
  }
  const mb1 = UI.badges.mais; UI.badges.mais = () => mb1() + (G.S && G.S.codex && G.S.codex.fresh > 0 && !(UI.sheet && UI.sheet.name === 'mais' && UI.sheet.tab === 'codex') ? 1 : 0);
  /* atalho na Forja (junto da nota sobre inscrições) */
  const fn1 = UI.forjaNote;
  UI.forjaNote = () => { const s = G.codexStats(); return (fn1 ? fn1() : '') + '<button class="btn sm wide" style="margin:0 0 10px" data-a="open:mais:codex">' + ic('book') + 'Códex de Inscrições · ' + s.slots + '/' + s.slotsMax + '</button>'; };
  /* avisos: registros novos se juntam num só aviso (no máximo um a cada ~6 s); marcos têm aviso próprio */
  let cdxQ = 0, cdxOne = null, cdxTm = 0, cdxLast = 0;
  const cdxFlush = () => {
    const n = cdxQ, one = cdxOne; cdxQ = 0; cdxOne = null; if (!n) return;
    cdxLast = performance.now();
    const msg = n === 1 && one ? (one.k === 'i' ? 'Códex: nova inscrição, ' + insShort(one.id) + ' (' + G.INS_Q[one.q] + ')' : 'Códex: nova peça, ' + tierShort(one.tier) + ' ' + G.RAR[one.rar]) : 'Códex: ' + n + ' registros novos';
    UI.toast(msg, one && one.k === 'i' && one.q === 5 ? 'epic' : 'info', 'book');
  };
  G.on('codex', (d) => {
    if (d.t === 'new') {
      cdxQ += d.news.length || d.n || 0; cdxOne = d.news.length === 1 ? d.news[0] : cdxQ === 1 ? cdxOne : null;
      clearTimeout(cdxTm); cdxTm = setTimeout(cdxFlush, Math.max(1500, 6000 - (performance.now() - cdxLast)));
      if (UI.sheet && UI.sheet.name === 'mais' && UI.sheet.tab === 'codex') UI.sheetDirty();
    } else if (d.t === 'ms') {
      UI.toast('Marco do Códex: ' + d.m.n + '! ' + d.txt, 'epic', 'book');
      if (d.m.big) UI.banner('Marco do Códex', d.m.n, d.txt);
      if (UI.sheet && UI.sheet.name === 'mais' && UI.sheet.tab === 'codex') UI.sheetDirty();
    }
  });

  /* ================= 2C.5 Próxima recompensa (uma linha acima da barra da Jornada) ================= */
  css.textContent += '\n' + [
    '#nrw{position:absolute;left:50%;padding-bottom:3px!important;transform:translateX(-50%);bottom:calc(var(--navh) + var(--sab) + 12px + var(--qh,46px) + 6px);width:min(calc(100vw - 124px),360px);z-index:6;display:none;align-items:center;gap:7px;min-height:40px;padding:0 10px;text-align:left;font:inherit;color:inherit}',
    '#nrw.on{display:flex}',
    '#nrw .ni{flex:none;width:20px;height:20px;color:var(--gold2)}#nrw .ni svg{width:100%;height:100%}',
    '#nrw .nt{flex:1;min-width:0;font-size:11.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '#nrw .nt b{color:var(--gold2);font-weight:800;margin-right:4px}',
    '#nrw .nbar{position:absolute;left:10px;right:10px;bottom:4px;height:3px;border-radius:2px;background:rgba(255,255,255,.14);overflow:hidden}',
    '#nrw .nbar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--gold),var(--gold2));transition:width .5s}',
    '#nrw .nv{flex:none;min-width:30px;text-align:right;font-size:11px;font-weight:800;color:var(--mut)}',
    '#nrw.rdy{border-color:var(--gold2);animation:glow 1.4s infinite}',
    '#nrw.rdy .nbar{display:none}',
    '#nrw.rdy .nv{color:#1a1408;background:linear-gradient(180deg,#f7dc92,#d8a544);padding:3px 7px;border-radius:8px}',
    '@media (min-width:860px){#nrw{bottom:calc(var(--navh) + 26px + var(--qh,46px) + 6px)}}',
  ].join('\n');
  UI.NEWS.v24.rows.push(['book', 'Códex de Inscrições', 'Mais › Códex guarda cada inscrição (16 tipos × 5 qualidades) e cada peça que você já viu, com marcos e prêmios. Há um atalho na Forja.'],
    ['target', 'Próxima recompensa', 'Uma linha acima da Jornada mostra o que está mais perto de render algo: contrato, conquista, promoção, calendário, marco de poder. Toque para ir até lá.']);
  const bdN = UI.build;
  UI.build = () => { bdN(); const q = $('#quest'); if (q && !$('#nrw')) q.insertAdjacentHTML('afterend', '<button id="nrw" class="glass" data-a="open:mais:codex"><span class="ni"></span><span class="nt"></span><span class="nbar"><i></i></span><span class="nv"></span></button>'); };
  let nrKey = '', nrPct = -1, nrAct = '', nrCur = null, nrSince = 0, nrT = 0, nrQh = 0;
  const nrwRefresh = () => {
    const el = $('#nrw'), q = $('#quest'); if (!el || !q) return;
    const S = G.S;
    if (!S.tut.done || (S.tut.guide && (S.quest.step <= 4 || (UI.guideActive && UI.guideActive()))) || q.style.display === 'none' || !q.offsetHeight) { el.classList.remove('on'); return; }
    if (q.offsetHeight !== nrQh) { nrQh = q.offsetHeight; document.documentElement.style.setProperty('--qh', nrQh + 'px'); }
    const r = G.nextReward(); let best = r.best;
    /* histerese: só troca de item se o novo for bem melhor, ou o atual sumiu, ou o novo já está pronto */
    if (best && nrCur) {
      const cur = r.all.find((o) => o.id === nrCur);
      if (cur && best.id !== cur.id && !(best.ready && !cur.ready) && (best.rk - cur.rk < 0.12 || performance.now() - nrSince < 8000) && !(cur.ready && best.ready && best.pr < cur.pr)) best = cur;
    }
    if (!best) { el.classList.remove('on'); nrCur = null; return; }
    if (best.id !== nrCur) { nrCur = best.id; nrSince = performance.now(); }
    el.classList.add('on');
    const key = best.id + '|' + best.t + '|' + best.ready;
    if (key !== nrKey) {
      nrKey = key;
      el.querySelector('.ni').innerHTML = ic(best.ic);
      el.querySelector('.nt').innerHTML = '<b>' + esc(best.k) + '</b>' + esc(best.t);
      el.classList.toggle('rdy', !!best.ready);
    }
    if (best.go !== nrAct) { nrAct = best.go; el.setAttribute('data-a', best.go); }
    const p = best.ready ? 100 : Math.round(best.pct * 100);
    if (p !== nrPct) { nrPct = p; el.querySelector('.nbar i').style.width = p + '%'; }
    const nv = best.ready ? 'Pronto' : best.id === 'ar' || best.n > 1 && best.n <= 99 && best.id.indexOf('pr') === 0 ? best.cur + '/' + best.n : p + '%';
    const nvEl = el.querySelector('.nv'); if (nvEl.textContent !== nv) nvEl.textContent = nv;
  };
  const rfN = UI.refresh;
  UI.refresh = () => { rfN(); const t = performance.now(); if (t - nrT > 900 && G.S && G.M.running) { nrT = t; nrwRefresh(); } };

  /* ================= 2C.6 HUD e legibilidade ================= */
  css.textContent += '\n' + [
    /* áreas de toque >= 40 px nos chips do HUD sem engordar o visual: a área sensível passa da borda (só na vertical) */
    '.chip{position:relative}',
    '.chip::after{content:"";position:absolute;left:-1px;right:-1px;top:-5px;bottom:-5px}',
    '.wk{position:relative;overflow:visible!important}.wk b{flex:none}.wk small{min-width:0;overflow:hidden;text-overflow:ellipsis}',
    '.sorte{position:relative;white-space:nowrap;flex:none}',
    '.pwr::after,.sorte::after,.wk::after{content:"";position:absolute;left:-1px;right:-1px;top:-8px;bottom:-8px}',
    /* duelo: o nome fica sob a barra de vida, os números sobem só até o topo do retrato e o palco não corta a 4ª coluna em 360 px */
    '.arft .nm{margin-top:2px;font-size:9.5px;line-height:1.15}',
    '@keyframes ardn{0%{opacity:0;margin-top:8px;scale:.6}12%{opacity:1;margin-top:0;scale:1.15}100%{opacity:0;margin-top:-26px;scale:1}}',
    '@media (max-width:420px){.ar-stage.bg .arft{width:62px}.ar-stage.bg .arft .arsp{width:54px;height:62px;background-size:54px 62px}.ar-stage.bg .arft .arhb{width:50px}.ar-stage.bg .arft .nm{max-width:60px}}',
  ].join('\n');

  /* @@fim67 */
})();

;
