/* ===== Tela de combate no estilo do original (v3.27.3) =====
   Camada visual por cima do motor de jogo.js: o que se decide em combate continua no motor
   (Rules, performSkill, battle...). Aqui ficam o HUD, o registro, a fila de iniciativa, as barras
   sob os sprites e a grade de comandos 2 × 3. Referência: ESPECIFICACAO-TELAS.md. */
(() => {
  const $bt = id => document.getElementById(id);
  const fmtN = n => { n = Math.max(0, Math.round(n)); return n >= 10000 ? fmt(n) : String(n); };

  /* ---------- nomes em português dos efeitos ---------- */
  const EFFECT_PT = { Defending: 'Defendendo', Confused: 'Confuso', Cursed: 'Amaldiçoado', Brittle: 'Frágil', Toxic: 'Tóxico', Frenzy: 'Frenesi', Drenched: 'Encharcado',
    Starstruck: 'Deslumbrado', Stasis: 'Estase', Reraise: 'Renascimento', Darkveil: 'Véu Sombrio', Shadowveil: 'Véu das Sombras', Windswept: 'Ventania', Manaseep: 'Mana Drenada', Elementless: 'Sem elemento' };
  const STAT_PT = { Att: 'Atq', Atk: 'Atq', Mag: 'Mag', Def: 'Def', Res: 'Res', Dex: 'Des', Crit: 'Crít', All: 'Tudo', Ward: 'Proteção', Accuracy: 'Precisão' };
  function effectName(e) {
    const d = Rules.effectDef(e.name);
    if (d.name !== e.name) return d.name;
    if (EFFECT_PT[e.name]) return EFFECT_PT[e.name];
    return e.name.replace(/\b(Att|Atk|Mag|Def|Res|Dex|Crit|All|Ward|Accuracy)\b/g, m => STAT_PT[m]);
  }
  const effectsOf = f => Object.values(f.effects || {}).map(effectName);

  /* ---------- principal inimigo, fila de turnos ---------- */
  const alive = f => f && f.hp > 0;
  function mainFoe() {
    if (!B) return null;
    const live = B.foes.filter(alive);
    return live.find(f => f.boss && !f.enemySummon) || live[0] || B.foes[0] || null;
  }
  function turnOrder(n = 6) {
    const allies = [B.hero, ...(B.pet && alive(B.pet) ? [B.pet] : []), ...(B.summons || []).filter(alive)];
    const foes = B.foes.filter(alive);
    const seq = [...allies, ...foes];
    if (!seq.length) return [];
    let start = 0;
    if (B.phase === 'allies') start = Math.min(1, seq.length - 1);
    else if (B.phase === 'enemies') { const id = B.enemyTurnIds?.[B.enemyIndex], k = foes.findIndex(f => f.id === id); start = allies.length + Math.max(0, k); }
    return Array.from({ length: n }, (_, i) => seq[(start + i) % seq.length]);
  }
  const face = f => (f.hero ? heroMini(false) : f.spr).toDataURL(); /* sem o cache de sprUrl: o sprite do catálogo pode carregar depois */

  function renderQueue() {
    if (!B) return;
    $bt('bt-queue').innerHTML = turnOrder().map((f, i) =>
      '<div class="bt-q ' + (f.hero || f.pet || f.summon ? 'ally' : 'foe') + (i === 0 ? ' now' : '') + '" title="' + esc(f.n) + '"><img src="' + face(f) + '" alt=""></div>').join('');
    const panel = $bt('bt-order');
    if (!panel.hidden) panel.innerHTML = orderHtml();
  }
  function orderHtml() {
    const rows = [B.hero, ...(B.pet ? [B.pet] : []), ...(B.summons || []).filter(alive), ...B.foes.filter(alive)];
    return '<h3>Combatentes</h3>' + rows.map(f => '<div class="row ' + (f.hero || f.pet || f.summon ? 'ally' : 'foe') + '"><img src="' + face(f) + '" alt=""><b>' + esc(f.n) + (f.lv ? ' · Nv ' + f.lv : '') + '</b>' +
      '<div class="m"><i style="width:' + clamp(f.hp / Math.max(1, f.maxhp) * 100, 0, 100) + '%"></i></div></div>').join('');
  }

  /* ---------- cabeçalho do inimigo ---------- */
  function renderFoeBlock() {
    const el = $bt('bt-foe'); if (!B) { el.innerHTML = ''; return; }
    const f = mainFoe(); if (!f) { el.innerHTML = ''; return; }
    const bar = f.boss ? '<div class="bar-boss"><i style="width:' + clamp(f.hp / Math.max(1, f.maxhp) * 100, 0, 100) + '%"></i><b>' + fmtN(f.hp) + ' / ' + fmtN(f.maxhp) + '</b></div>' : '';
    const codex = f.rival ? '' : '<button class="cdx" type="button" data-codex="' + esc(f.key) + '">' + icon('ic_codex', 18) + 'Codex</button>';
    el.innerHTML = bar + '<div class="who"><h2>' + esc(f.n) + '</h2><p>Nível ' + f.lv + '</p>' + codex + '</div>';
  }
  $bt('bt-foe').addEventListener('click', e => {
    const b = e.target.closest('[data-codex]'); if (!b) return;
    const r = Catalog.byKey[b.dataset.codex]; openPanel('codex'); if (r) openModal(discoveryDetails, r);
  });

  /* ---------- atalho de poção ---------- */
  function recoveryOf(k) {
    const row = Catalog.byKey[k], d = ITEMS[k] || {};
    const r = row?.recovery || (row?.heal ? { [row.heal.stat]: row.heal.flat } : { hp: d.hp || 0, mp: d.mp || 0 });
    return { hp: r.hp || 0, mp: r.mp || 0 };
  }
  const itemName = k => ITEMS[k]?.n || Catalog.byKey[k]?.name || k;
  function quickPotion() {
    if (!B || !S || B.mode === 'arena') return null;
    const h = B.hero, needMp = h.mp < h.maxmp * .5, needHp = h.hp < h.maxhp * .6;
    const own = Object.keys(S.inv).filter(k => qty(k) > 0 && usableConsumable(k));
    const pick1 = stat => own.map(k => [k, recoveryOf(k)]).filter(([, r]) => r[stat] > 0 && (stat === 'mp' ? r.hp === 0 : true)).sort((a, b) => a[1][stat] - b[1][stat])[0]?.[0];
    return (needMp && pick1('mp')) || (needHp && pick1('hp')) || null;
  }
  function renderQuick() {
    const el = $bt('bt-quick'), k = CM.res && !cmdEl.classList.contains('list') ? quickPotion() : null;
    if (!k) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    el.innerHTML = '<button type="button" data-quick="' + esc(k) + '">' + ((Catalog.byKey[k] ? catalogImage(Catalog.byKey[k], 20) : '') || iconImg(ITEM_ICON[k] ? k : 'pocao_p', 20)) + '<span>' + esc(itemName(k)) + '</span></button>';
  }
  $bt('bt-quick').addEventListener('click', e => { const b = e.target.closest('[data-quick]'); if (b && CM.res) resolveCmd({ __quick: b.dataset.quick }); });

  /* ---------- registro e faixa de ação ---------- */
  let bannerTimer = 0;
  function showAction(who, what) {
    const el = $bt('bt-action');
    el.innerHTML = '<small>' + esc(who) + '</small><b>' + esc(what) + '</b>'; el.hidden = false;
    clearTimeout(bannerTimer); bannerTimer = setTimeout(() => { el.hidden = true; }, 1500);
  }
  say = function (text, cls = '') {
    text = String(text);
    const p = document.createElement('p'); if (cls) p.className = cls; p.textContent = text; logEl.appendChild(p);
    while (logEl.children.length > 7) logEl.firstChild.remove();
    if (B) (B.logAll || (B.logAll = [])).push({ text, cls });
    let m;
    if ((m = text.match(/^(.+?) usou (.+?)!$/))) showAction(m[1], m[2]);
    else if ((m = text.match(/^(.+?) atacou!$/))) showAction(m[1], 'Ataque');
  };
  /* complementa a última linha ("… Golpe crítico!", "… Mas errou!") */
  window.sayMore = function (extra, cls = '') {
    const last = logEl.lastElementChild; if (!last) return say(extra, cls);
    last.textContent = last.textContent.replace(/[!.…]+$/, '') + '… ' + extra; if (cls) last.className = cls;
    if (B?.logAll?.length) B.logAll[B.logAll.length - 1].text = last.textContent;
  };
  $bt('bt-chat').addEventListener('click', () => {
    const rows = (B?.logAll || []).slice(-80).map(l => '<p class="' + esc(l.cls) + '">' + esc(l.text) + '</p>').join('') || '<p class="fine">Nada registrado ainda.</p>';
    openModal(() => '<h3 class="dec">Registro de combate</h3><div class="bt-fulllog" style="max-height:55dvh;overflow:auto;display:grid;gap:4px">' + rows + '</div><div class="row">' + btn('closemodal', 'Fechar') + '</div>');
  });
  $bt('bt-qbtn').addEventListener('click', () => {
    const panel = $bt('bt-order'); panel.hidden = !panel.hidden;
    $bt('bt-qbtn').setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden && B) panel.innerHTML = orderHtml();
  });

  /* números de dano em amarelo, como no original */
  const baseFloat = floatText;
  floatText = (x, y, txt, col) => baseFloat(x, y, txt, ['#ffffff', '#ff9988', '#ff9a8a'].includes(col) ? '#ffd23f' : col);

  /* ---------- comandos ---------- */
  const cmdBtn = (o, i) => '<button type="button" class="bt-cmd ' + (o.cls || '') + '" data-i="' + i + '"' + (o.dis ? ' disabled' : '') + '>' +
    (o.mp != null ? '<em>' + o.mp + ' mana</em>' : '') + (o.ic || '') + '<b>' + esc(o.l) + '</b>' + (o.s ? '<small>' + esc(o.s) + '</small>' : '') + '</button>';
  choose = function (opts, cls = '') {
    return new Promise(res => {
      CM.res = res; CM.opts = opts; cmdEl.className = 'cmds' + (cls ? ' ' + cls : '');
      cmdEl.innerHTML = opts.map((o, i) => cmdBtn(Object.assign({}, o, o.v === 'back' ? { cls: 'back' } : {}), i)).join('');
      renderQuick();
    });
  };
  const resolve0 = resolveCmd;
  resolveCmd = v => { $bt('bt-quick').hidden = true; resolve0(v); };

  async function skillAction(id) {
    const h = B.hero, s = SKILLS[id]; let t = null;
    if (!s.row?.self && !s.all) {
      if (/party/i.test(s.row?.target || '')) {
        const allies = [h, ...B.summons.filter(alive)];
        if (allies.length === 1) t = h;
        else { const pid = await choose(allies.map(f => ({ v: f.id, l: f.n })).concat([{ v: 'back', l: 'Voltar' }]), 'list'); if (pid === 'back') return null; t = allies.find(f => f.id === pid); }
      } else { t = await pickTarget(); if (!t) return null; }
    }
    return { k: 'skill', id, s, t };
  }
  heroChoose = async () => {
    const h = B.hero;
    for (;;) {
      const quickId = S.equipped.find(k => SKILLS[k]), qs = quickId && SKILLS[quickId];
      const v = await choose([
        qs ? { v: 'quick', l: qs.n, mp: qs.mp, ic: skIcon(quickId, 22), dis: h.mp < qs.mp || !supportedSkill(qs) } : { v: 'none', l: '—', dis: true },
        { v: 'atk', l: 'Ataque', ic: iconImg(['sword', { metal: '#d8e0ec' }], 22) },
        { v: 'guard', l: 'Defender' },
        { v: 'skill', l: 'Habilidade', ic: iconImg(['sword', { metal: '#b9c6e6' }], 22) },
        { v: 'flee', l: 'Fugir', ic: iconImg('boots', 22), dis: !B.canFlee },
        { v: 'item', l: 'Item', ic: iconImg('pocao_p', 22), dis: B.mode === 'arena' },
      ]);
      if (v && v.__quick) return { k: 'item', key: v.__quick };
      if (v === 'atk') { const t = await pickTarget(); if (t) return { k: 'atk', t }; }
      else if (v === 'quick') { const a = await skillAction(S.equipped.find(k => SKILLS[k])); if (a) return a; }
      else if (v === 'skill') {
        const id = await choose(S.equipped.filter(k => SKILLS[k]).map(k => ({ v: k, l: SKILLS[k].n, ic: skIcon(k, 22), mp: SKILLS[k].mp, s: SKILLS[k].castTurns > 1 ? SKILLS[k].castTurns + ' turnos' : '', dis: h.mp < SKILLS[k].mp || !supportedSkill(SKILLS[k]) })).concat([{ v: 'back', l: 'Voltar' }]), 'list');
        if (id === 'back') continue;
        const a = await skillAction(id); if (a) return a;
      } else if (v === 'item') {
        const own = Object.keys(S.inv).filter(k => qty(k) > 0 && usableConsumable(k));
        if (!own.length) { say('Sem poções.'); continue; }
        const key = await choose(own.map(k => ({ v: k, l: itemName(k) + ' ×' + qty(k), s: ITEMS[k]?.d || '' })).concat([{ v: 'back', l: 'Voltar' }]), 'list');
        if (key !== 'back') return { k: 'item', key };
      } else if (v === 'guard' || v === 'flee') return { k: v };
    }
  };

  /* esconde o HUD do combate quando uma tela cheia (vitória, derrota) cobre a batalha */
  new MutationObserver(() => {
    const m = document.getElementById('modal');
    $bt('s-battle').classList.toggle('bt-covered', !m.hidden && m.classList.contains('reference-fullscreen'));
  }).observe(document.getElementById('modal'), { attributes: true, attributeFilter: ['hidden', 'class'] });

  /* ---------- HUD ---------- */
  renderFoes = () => { if (B) { renderFoeBlock(); renderQueue(); } };
  renderParty = () => { if (!B) return; renderFoeBlock(); renderQueue(); renderQuick(); };

  /* ---------- canvas: sprites, barras e rótulos ---------- */
  function drawBar(g, x, y, w, h, frac, c1, c2, label, u) {
    g.fillStyle = '#1b1212'; g.fillRect(x - 1.5 * u / 2, y - 1.5 * u / 2, w + 1.5 * u, h + 1.5 * u);
    g.strokeStyle = '#d9d2c6'; g.lineWidth = Math.max(1, u * .55); g.strokeRect(x - .4 * u, y - .4 * u, w + .8 * u, h + .8 * u);
    g.fillStyle = '#2b0e0e'; g.fillRect(x, y, w, h);
    const fw = Math.round(w * clamp(frac, 0, 1)); if (fw > 0) { const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(x, y, fw, h); }
    let fs = Math.round(h * .82); g.font = '700 ' + fs + 'px "Alegreya Sans", system-ui, sans-serif';
    while (g.measureText(label).width > w - 4 && fs > 7) { fs--; g.font = '700 ' + fs + 'px "Alegreya Sans", system-ui, sans-serif'; }
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = Math.max(2, u * .6); g.strokeStyle = '#000'; g.strokeText(label, x + w / 2, y + h / 2 + 1); g.fillStyle = '#fff'; g.fillText(label, x + w / 2, y + h / 2 + 1); g.textBaseline = 'alphabetic';
  }
  function drawLabels(g, f, cx, base, w, h, u) {
    const names = effectsOf(f).slice(0, 3); if (!names.length) return;
    const fs = Math.round(3.6 * u); g.font = '500 ' + fs + 'px "Alegreya Sans", system-ui, sans-serif'; g.textAlign = 'left';
    names.forEach((n, i) => {
      const x = cx + w / 2 + 2 * u, y = base - h * .45 + i * (fs + 3);
      g.fillStyle = '#ffd23f'; g.fillRect(x - 3.2 * u, y - fs * .62, 1.6 * u, fs * .5); g.fillRect(x - 3.2 * u, y - fs * .05, 1.6 * u, 1.6 * u);
      g.lineWidth = Math.max(2, u * .5); g.strokeStyle = '#000'; g.strokeText(n, x, y); g.fillStyle = '#f4ecdc'; g.fillText(n, x, y);
    });
  }
  let lastQueue = 0;
  drawBattle = function (now) {
    if (!B || !BS.u) return; const g = gB, u = BS.u, W = BS.W, H = BS.H;
    if (now - lastQueue > 600) { lastQueue = now; renderQueue(); }
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (typeof PaintedScene !== 'undefined' && PaintedScene.has(B.bio)) PaintedScene.draw(g, W, H, B.bio);
    else {
      const bg = getBG(B.bio), bw = Math.round(192 * u), bh = Math.round(120 * u), x0 = Math.round((W - bw) / 2), y0 = Math.round(H - bh);
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      if (y0 > 0) g.drawImage(bg, 0, 0, bg.width, 3, x0, 0, bw, y0 + 3);
      g.drawImage(bg, x0, y0, bw, bh);
      if (x0 > 0) { g.save(); g.scale(-1, 1); g.drawImage(bg, -x0, y0, bw, bh); g.drawImage(bg, -(x0 + 2 * bw), y0, bw, bh); g.restore(); }
    }
    g.imageSmoothingEnabled = false;
    const list = [B.hero].concat(B.pet ? [B.pet] : [], B.summons || [], B.foes).filter(f => f.alpha > 0).sort((a, b) => a.y - b.y);
    for (const f of list) {
      const s = f.flash ? flashOf(f.spr) : f.spr, w = s.width * f.k, h = s.height * f.k, bob = Math.sin(now / 380 + (f.x || 0)) * (f.hero || f.pet ? .5 : 1);
      const cx = (f.x + f.ox) * u, base = f.y * u;
      g.globalAlpha = .3 * f.alpha; g.fillStyle = '#000'; g.beginPath(); g.ellipse(cx, base, w * .32, 2.5 * u, 0, 0, 7); g.fill();
      g.globalAlpha = f.alpha; g.drawImage(s, 0, 0, s.width, s.height, Math.round(cx - w / 2), Math.round(base - h + (bob + f.oy) * u), w, h); g.globalAlpha = 1;
      if (f.hp > 0) {
        const mine = f.hero || f.pet || f.summon, bw = (f.hero ? 34 : mine ? 26 : 30) * u, bh = 4.6 * u, bx = Math.round(cx - bw / 2);
        let by = Math.round(base + 3.2 * u);
        if (!f.boss || f.enemySummon) {
          if (f.ward > 0) { g.fillStyle = '#cfeeff'; g.fillRect(bx, by - 1.6 * u, Math.round(bw * Math.min(1, f.ward / Math.max(1, f.maxWard || f.maxhp))), 1.1 * u); }
          drawBar(g, bx, by, bw, bh, f.hp / Math.max(1, f.maxhp), '#e23a32', '#9a1612', fmtN(f.hp), u); by += bh + 1.8 * u;
          if (f.hero) drawBar(g, bx, by, bw, bh, f.mp / Math.max(1, f.maxmp), '#4f8cf0', '#2748a8', fmtN(f.mp), u);
        } else if (f.ward > 0) { g.fillStyle = '#cfeeff'; g.fillRect(bx, by, Math.round(bw * Math.min(1, f.ward / Math.max(1, f.maxWard || f.maxhp))), 1.4 * u); }
        drawLabels(g, f, cx, base, w, h, u);
        if (f.charging) { g.fillStyle = '#ffe14a'; g.fillRect(Math.round(cx - u), base - h - 9 * u, 2 * u, 5 * u); g.fillRect(Math.round(cx - u), base - h - 3 * u, 2 * u, u); }
        if (BS.target && !mine) { const ty = base - h - 9 * u + Math.sin(now / 120) * 1.5 * u; g.fillStyle = '#f5c451'; g.beginPath(); g.moveTo(cx - 4 * u, ty); g.lineTo(cx + 4 * u, ty); g.lineTo(cx, ty + 4 * u); g.fill(); }
      }
    }
    BS.fx = BS.fx.filter(f => now - f.t0 < f.life);
    for (const f of BS.fx) {
      const p = (now - f.t0) / f.life, t = (now - f.t0) / 1000, z = Math.max(2, Math.round(f.s * u * .8));
      if (f.k === 'p') { g.globalAlpha = 1 - p * p; g.fillStyle = f.col; g.fillRect(Math.round((f.x + f.vx * t) * u), Math.round((f.y + f.vy * t + .5 * f.g * t * t) * u), z, z); }
      else if (f.k === 'slash') { const len = 26 * Math.min(1, p * 2.4), dir = f.flip ? -1 : 1; g.globalAlpha = 1 - p * .6; g.strokeStyle = '#fff'; g.lineWidth = 2.2 * u; g.lineCap = 'round'; g.beginPath(); g.moveTo((f.x - 12 * dir) * u, (f.y - 12) * u); g.lineTo((f.x - 12 * dir + len * dir * .8) * u, (f.y - 12 + len * .95) * u); g.stroke(); g.strokeStyle = '#ffe9a0'; g.lineWidth = 1 * u; g.stroke(); }
      else if (f.k === 'bolt') { g.globalAlpha = p < .5 ? 1 : 1 - (p - .5) * 2; g.strokeStyle = '#ffe14a'; g.lineWidth = 3 * u; g.beginPath(); g.moveTo(f.x * u, 0); for (let i = 1; i <= 7; i++) g.lineTo((i === 7 ? f.x : f.x + (hn(i, f.seed, 5) - .5) * 18) * u, f.y * i / 7 * u); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 1.2 * u; g.stroke(); }
      g.globalAlpha = 1;
    }
    g.textAlign = 'center'; g.font = '800 ' + Math.round(11 * u) + 'px "Alegreya Sans", system-ui, sans-serif';
    BS.floats = BS.floats.filter(f => now - f.t0 < 1000);
    for (const f of BS.floats) { const p = (now - f.t0) / 1000, y = (f.y - p * 16) * u; g.globalAlpha = p > .7 ? 1 - (p - .7) / .3 : 1; g.lineWidth = 2.4 * u; g.strokeStyle = '#2a1a05'; g.strokeText(f.txt, f.x * u, y); g.fillStyle = f.col; g.fillText(f.txt, f.x * u, y); g.globalAlpha = 1; }
  };
})();
