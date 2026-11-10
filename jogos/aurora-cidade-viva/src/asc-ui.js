/* ===== Ciclo 029 — AURORA: ASCENSÃO (interface) =====
   HUD único: nível do reino, relógio, recursos, objetivos, grupo de heróis, ações rápidas
   e o Salão do Reino (contratos, bênçãos, Fenda e Mercado). */
(function () {
  'use strict';
  const P = window.P;
  if (!P || !P.asc || P.ascUI) return;
  const A = P.asc;
  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt = (n) => {
    n = Math.round(Number(n) || 0);
    const a = Math.abs(n);
    if (a >= 1e9) return (n / 1e9).toFixed(1).replace('.0', '') + 'B';
    if (a >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '') + 'M';
    if (a >= 1e5) return Math.round(n / 1e3) + 'k';
    return n.toLocaleString('pt-BR');
  };

  const PATHS = {
    coin: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5v9M9.6 9.6c.4-1 1.3-1.4 2.4-1.4 1.4 0 2.5.7 2.5 1.9 0 2.6-5 1.3-5 4 0 1.2 1.1 1.9 2.5 1.9 1.2 0 2.1-.5 2.5-1.5"/>',
    people: '<circle cx="9" cy="8.5" r="3"/><path d="M3 19c.5-3.5 2.8-5.5 6-5.500s5.5 2 6 5.5"/><circle cx="17" cy="9.5" r="2.3"/><path d="M16.5 14c2.5.2 4 1.8 4.5 4.5"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10.200A4.3 4.3 0 0 1 12 7.300a4.3 4.3 0 0 1 7.5 2.500C19.5 15.4 12 20 12 20Z"/>',
    swords: '<path d="m5 4 9.5 9.500M5 4v3.500L13 15.500M19 4 9.5 13.500M19 4v3.500L11 15.500M7 15l-3 3 2 2 3-3M17 15l3 3-2 2-3-3"/>',
    seal: '<path d="m12 3 2.3 2.1 3.1-.3.7 3 2.6 1.7-1.3 2.8 1.3 2.8-2.6 1.7-.7 3-3.1-.3L12 21.600l-2.3-2.1-3.1.3-.7-3-2.6-1.7 1.3-2.8-1.3-2.800L5.9 7.800l.7-3 3.1.3Z"/><path d="m9 12.3 2.1 2.1 4-4.3"/>',
    pause: '<path d="M8.5 5.500v13M15.5 5.500v13"/>',
    play: '<path d="M8 5.500v13l10.5-6.500Z"/>',
    moon: '<path d="M19.5 14.500A8 8 0 0 1 9.5 4.500a8 8 0 1 0 10 10Z"/>',
    menu: '<path d="M4.5 7h15M4.5 12h15M4.5 17h15"/>',
    sound: '<path d="M4.5 9.500v5h3.500l4.5 4v-13l-4.5 4ZM16 9c1 .8 1.5 1.8 1.5 3s-.5 2.2-1.5 3M18.5 6.500c1.7 1.5 2.5 3.3 2.5 5.500s-.8 4-2.5 5.5"/>',
    mute: '<path d="M4.5 9.500v5h3.500l4.5 4v-13l-4.5 4ZM16.5 9.500l5 5M21.5 9.500l-5 5"/>',
    portal: '<path d="M6 21V10a6 6 0 0 1 12 0v11"/><path d="M9.5 21v-10.500a2.5 2.5 0 0 1 5 0V21M4 21h16"/>',
    castle: '<path d="M4 21V9l2.5 1.500V7l2.5 1.500V5l3-2 3 2v3.500L17.5 7v3.500L20 9v12Z"/><path d="M10 21v-4.500a2 2 0 0 1 4 0V21"/>',
    flask: '<path d="M9.5 3.500h5M10.5 3.500v5.500L5.5 18a2 2 0 0 0 1.8 3h9.400a2 2 0 0 0 1.8-3l-5-9V3.5"/><path d="M8 15.500h8"/>',
    anvil: '<path d="M3.5 8h13.500a3.5 3.5 0 0 0 3.5-2.500H7M7 5.500v2.500M9 8c0 3 1.5 4.5 3.5 5.500v2.500h-5l-1 3.500h11l-1-3.500h-1.500V13.500c1.5-1 2.5-2.5 2.8-5.5"/>',
    scale: '<path d="M12 4v16M7 20h10M5 7.500h14M5 7.5 2.5 13.500a2.9 2.9 0 0 0 5 0ZM19 7.500l-2.5 6a2.9 2.9 0 0 0 5 0Z"/>',
    crown: '<path d="m3.5 8 4 3.500L12 5l4.5 6.5 4-3.5-1.5 10.500h-14Z"/><path d="M5.5 18.500h13"/>',
    star: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1.1 5.900L12 16.900l-5.3 2.8 1.1-5.900L3.5 9.700l5.9-.8Z"/>',
    scroll: '<path d="M7 4.500h10.500a2 2 0 0 1 2 2V8H16M7 4.500a2 2 0 0 0-2 2V17a2.5 2.5 0 0 0 2.5 2.500H16a2.5 2.5 0 0 0 2.5-2.500V16H9v1a1.5 1.5 0 0 1-3 0"/><path d="M9 9h5M9 12h5"/>',
    sword: '<path d="M19.5 4.5 9 15M19.5 4.500h-4L7.5 12.500M19.5 4.500v4L11.5 16.500M6 14l4 4M4.5 19.500l3-3"/>',
    skull: '<path d="M12 3.500a7.5 7.5 0 0 0-4.5 13.500v3h9v-3A7.5 7.5 0 0 0 12 3.500Z"/><circle cx="9" cy="11.5" r="1.6"/><circle cx="15" cy="11.5" r="1.6"/><path d="M10.5 20v-2M13.5 20v-2"/>',
    home: '<path d="M4 11.5 12 4.500l8 7M6 10v9.500h12V10"/>',
    zzz: '<path d="M5 7h6l-6 6h6M13.5 12.500h5l-5 5h5"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    chest: '<path d="M4 11V8.500a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4V11M4 11h16v8.500H4ZM4 11h16"/><path d="M10.5 11v3h3v-3"/>',
    bolt: '<path d="M13 3 5.5 13.500h5L10 21l8-11h-5.500Z"/>',
    up: '<path d="m6 14 6-6 6 6"/>',
    down: '<path d="m6 10 6 6 6-6"/>',
    eye: '<path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.500S2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>',
  };
  const ico = (name, cls) => '<svg class="asc-ico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (PATHS[name] || '') + '</svg>';

  const CLASS_COLORS = { guerreiro: '#e2a23b', ladino: '#a474e8', cacadora: '#5fc66a', arqueiro: '#59c5d8', mago: '#8f7cf0', cavaleiro: '#5a9bea', paladino: '#f0d264' };

  const UI = (P.ascUI = {
    tab: 'reino',
    open: false,
    gold: { shown: null, last: null },
    feed: [],

    /* ------------------------------ montagem ------------------------------ */
    install() {
      if (this._installed) return;
      if (!document.body || !P.state) return;
      this._installed = true;
      document.body.classList.add('asc-on');

      const hud = document.createElement('div');
      hud.id = 'asc-hud';
      hud.innerHTML =
        '<div class="asc-top">' +
          '<button class="asc-realm" data-asc="hub:reino" title="Nível do Reino — a ameaça cresce com a sua glória">' +
            '<span class="asc-lvl"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="19" class="t"/><circle cx="22" cy="22" r="19" class="p" id="asc-ring"/></svg><b id="asc-lvl">1</b></span>' +
            '<span class="asc-realm-txt"><strong>Aurora</strong><em id="asc-threat">Calmaria</em><span class="asc-xpbar"><i id="asc-xpfill"></i></span></span>' +
          '</button>' +
          '<div class="asc-clock">' +
            '<button class="asc-ib" data-asc="pause" id="asc-pause" title="Pausar ou seguir (espaço)">' + ico('pause') + '</button>' +
            '<div class="asc-time"><b id="asc-time">06:00</b><span id="asc-day">Dia 1</span></div>' +
            '<div class="asc-speeds" role="group" aria-label="Velocidade do tempo">' +
              '<button data-asc="speed:1">1×</button><button data-asc="speed:2">2×</button><button data-asc="speed:3">3×</button>' +
            '</div>' +
            '<button class="asc-ib" data-asc="sleep" title="Dormir até o amanhecer (N)">' + ico('moon') + '</button>' +
          '</div>' +
          '<div class="asc-res">' +
            '<button class="asc-chip gold" data-asc="hub:mercado" id="asc-chip-gold" title="Cofre do reino">' + ico('coin') + '<b id="asc-gold">0</b></button>' +
            '<button class="asc-chip seal" data-asc="hub:bencaos" id="asc-chip-selos" title="Selos de Renome — compram Bênçãos permanentes">' + ico('seal') + '<b id="asc-selos">0</b></button>' +
            '<span class="asc-chip" title="Moradores">' + ico('people') + '<b id="asc-pop">0</b></span>' +
            '<span class="asc-chip" title="Aprovação do povo">' + ico('heart') + '<b id="asc-appr">0</b></span>' +
            '<span class="asc-chip" id="asc-chip-front" title="Controle médio da Fronteira">' + ico('swords') + '<b id="asc-front">0%</b></span>' +
          '</div>' +
          '<div class="asc-sys">' +
            '<button class="asc-ib" data-asc="sound" id="asc-sound" title="Som">' + ico('sound') + '</button>' +
            '<button class="asc-ib" data-asc="menu" title="Menu (Esc)">' + ico('menu') + '</button>' +
          '</div>' +
        '</div>' +
        '<aside class="asc-track" id="asc-track"></aside>' +
        '<aside class="asc-party" id="asc-party" aria-label="Heróis"></aside>' +
        '<nav class="asc-rail" id="asc-rail" aria-label="Ações rápidas">' +
          this.railBtn('hub:contratos', 'scroll', 'Contratos', 'asc-b-contratos') +
          this.railBtn('hub:fenda', 'crown', 'Fenda', 'asc-b-fenda') +
          this.railBtn('hub:mercado', 'scale', 'Mercado', '') +
          this.railBtn('hub:bencaos', 'star', 'Bênçãos', 'asc-b-bencaos') +
          this.railBtn('old:portal', 'portal', 'Portal', '') +
          this.railBtn('old:evoluir', 'castle', 'Evoluir', '') +
          this.railBtn('old:enfermaria', 'flask', 'Enfermaria', '') +
          this.railBtn('old:pedidos', 'anvil', 'Pedidos', 'asc-b-pedidos') +
        '</nav>' +
        '<div class="asc-feed" id="asc-feed" aria-live="polite"></div>';
      document.body.appendChild(hud);

      const modal = document.createElement('div');
      modal.id = 'asc-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-label', 'Salão do Reino');
      document.body.appendChild(modal);

      const cer = document.createElement('div');
      cer.id = 'asc-ceremony';
      document.body.appendChild(cer);

      document.addEventListener('click', (e) => this.onClick(e), true);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.open) { e.stopPropagation(); e.preventDefault(); this.close(); }
      }, true);
      A.listeners.push((t, d) => this.onEvent(t, d));

      if (P.log && !P.log._asc) {
        const L = P.log, self = this;
        P.log = function (text, kind) { const out = L.apply(this, arguments); try { self.onLog(text, kind); } catch (e) { /* ok */ } return out; };
        P.log._asc = true;
      }
      if (P.eht && P.eht.render && !P.eht.render._asc) {
        const R = P.eht.render, self = this;
        P.eht.render = function () { const out = R.apply(this, arguments); try { self.patchEhtPanel(); } catch (e) { /* ok */ } return out; };
        P.eht.render._asc = true;
      }

      this.buildParty();
      this.renderTrack();
      this.tick();
      setInterval(() => this.tick(), 250);
      setInterval(() => { this.updateParty(); }, 500);
      setInterval(() => { this.renderTrack(); this.drawPortraits(); if (this.open) this.softRefresh(); }, 1500);
      requestAnimationFrame(() => hud.classList.add('in'));
      if (!A.st().introSeen && P.state.day <= 1) setTimeout(() => this.intro(), 2600);
    },
    railBtn(act, icon, label, badgeId) {
      return '<button class="asc-rb" data-asc="' + act + '" title="' + label + '">' + ico(icon) + '<span>' + label + '</span>' + (badgeId ? '<i class="asc-badge" id="' + badgeId + '"></i>' : '') + '</button>';
    },

    /* ------------------------------ eventos ------------------------------ */
    onClick(e) {
      const t = e.target && e.target.closest ? e.target.closest('[data-asc]') : null;
      if (!t) {
        if (this.open && e.target && e.target.id === 'asc-modal') this.close();
        return;
      }
      const [act, arg] = String(t.dataset.asc).split(':');
      e.preventDefault(); e.stopPropagation();
      const blip = () => { if (P.audio && P.audio.play) try { P.audio.play('click'); } catch (er) { /* ok */ } };
      if (act === 'hub') { blip(); this.show(arg); }
      else if (act === 'close') this.close();
      else if (act === 'tab') { blip(); this.tab = arg; this.render(); }
      else if (act === 'pause') { if (P.togglePause) P.togglePause(); this.tick(); }
      else if (act === 'speed') { if (P.state.paused && P.togglePause) P.togglePause(); if (P.setSpeed) P.setSpeed(Number(arg)); this.tick(); }
      else if (act === 'sleep') { if (P.ui && P.ui.sleepNow) P.ui.sleepNow(); }
      else if (act === 'menu') { if (P.menu && P.menu.show) P.menu.show(); else { const b = $('btn-menu'); if (b) b.click(); } }
      else if (act === 'sound') { const b = $('rpg-audio-btn'); if (b) b.click(); else if (P.audio && P.audio.toggleMute) P.audio.toggleMute(); this.tick(); }
      else if (act === 'old') this.oldAction(arg);
      else if (act === 'hero') this.focusHero(arg);
      else if (act === 'chapter') { if (P.r10 && P.r10.open) P.r10.open(); }
      else if (act === 'claim') { const r = A.claimBounty(arg); if (r.ok) this.coinsFrom(t, 8); this.renderTrack(); if (this.open) this.render(); }
      else if (act === 'bless') { const r = A.buyBless(arg); if (!r.ok) this.toast(r.reason); this.render(); }
      else if (act === 'train') { const r = A.trainHero(arg); if (!r.ok) this.toast(r.reason); this.render(); }
      else if (act === 'summon') { const r = A.riftSummon(); if (!r.ok) this.toast(r.reason); else { this.close(); this.focusBoss(); } }
      else if (act === 'focusboss') { this.close(); this.focusBoss(); }
      else if (act === 'dismiss') { A.riftDismiss(); this.render(); }
      else if (act === 'export' || act === 'import') {
        const [id, q] = arg.split('|');
        const r = act === 'export' ? A.exportGood(id, Number(q)) : A.importGood(id, Number(q));
        if (!r.ok) this.toast(r.reason); else if (act === 'export') this.coinsFrom(t, 5);
        this.render();
      }
      else if (act === 'intro') { A.st().introSeen = true; A.persist(); $('asc-ceremony').innerHTML = ''; $('asc-ceremony').classList.remove('block'); }
    },
    oldAction(which) {
      const find = (txt) => Array.from(document.querySelectorAll('#rpg-speed-bar button')).find((b) => b.textContent.indexOf(txt) >= 0);
      let b = null;
      if (which === 'portal') b = find('Portal');
      else if (which === 'evoluir') b = find('Evoluir');
      else if (which === 'enfermaria') b = $('c26-btn-infirmary');
      else if (which === 'pedidos') b = $('c26-btn-forge-orders');
      if (b) b.click();
      else if (which === 'portal' && P.portal && P.portal.open) P.portal.open();
    },
    onEvent(type, d) {
      if (type === 'levelup') this.ceremony('Nível de Reino ' + d.lvl, A.threatName(d.lvl), '+' + d.gold + ' moedas · +' + d.selos + ' Selo' + (d.selos > 1 ? 's' : '') + ' de Renome · monstros +' + d.pct + '%', 'gold');
      else if (type === 'riftkill') {
        this.ceremony('Andar ' + d.floor + ' vencido', d.hero + ' derrubou o Guardião da Fenda', '+' + d.reward.gold + ' moedas · +' + d.reward.selos + ' Selo' + (d.reward.selos > 1 ? 's' : ''), 'violet');
        this.coinsWorld(d.x, d.y, 14);
        if (P.fx && P.fx.shake) P.fx.shake(380, 9);
      }
      else if (type === 'bountyready') { this.push('scroll', 'Contrato pronto: ' + A.bountyText(d.b), 'good'); this.renderTrack(); }
      else if (type === 'claim') { if (d.chest) this.ceremony('Baú do dia', 'Sequência de ' + d.chest.streak + ' dia' + (d.chest.streak > 1 ? 's' : ''), '+1 Selo de Renome' + (d.chest.item ? ' · ' + d.chest.item : ''), 'gold'); }
      else if (type === 'mastery') {
        if (P.fx && P.fx.float) P.fx.float(d.npc.x, d.npc.y - 26, 'Maestria ' + d.lvl, '#9fe8ff', true);
        if (P.fx && P.fx.burst) P.fx.burst(d.npc.x, d.npc.y, '#9fe8ff', 18);
        if (!d.trained) this.push('star', d.npc.name + ' alcançou Maestria ' + d.lvl, 'good');
      }
      else if (type === 'sale') {
        if (P.fx && P.fx.float && d.revenue >= 1) P.fx.float(d.npc.x, d.npc.y - 20, '+' + d.revenue + ' moedas', '#ffd978', false);
        if (d.revenue >= 25) this.push('coin', d.npc.name + ' vendeu espólios por ' + d.revenue + ' moedas', 'econ');
      }
      else if (type === 'defeat') this.flashFrame(d.npc && d.npc.id);
      else if (type === 'rankup') {
        if (P.fx && P.fx.burst) P.fx.burst(d.npc.x, d.npc.y, '#ffd978', 30);
        if (P.fx && P.fx.float) P.fx.float(d.npc.x, d.npc.y - 30, 'Rank ' + d.rank + '!', '#ffd978', true);
        if (P.audio && P.audio.play) try { P.audio.play('levelup'); } catch (e) { /* ok */ }
        this.ceremony(d.npc.name + ' · Rank ' + d.rank, 'Prova de ascensão vencida', 'Mais vida, mais espaço na mochila e monstros maiores no horizonte', 'gold');
      }
      else if (type === 'bounties' || type === 'load') { this.renderTrack(); this.buildParty(); }
      if (this.open && (type === 'trade' || type === 'bless' || type === 'rift' || type === 'levelup')) this.render();
    },
    onLog(text, kind) {
      if (!text || P._testMode) return;
      const s = String(text);
      if (/^✦ Aurora alcançou|^📜 Contrato|Andar \d+ da Fenda vencido|^🎁|^✦ Bênção/.test(s)) return;   // já têm cerimônia própria
      let icon = null;
      if (kind === 'warn') { if (/foi derrotad|Maré|invad|saque|fugiu|A Fenda se abriu|perdeu/.test(s)) icon = 'skull'; }
      else if (kind === 'hero') { if (/subiu|promovid|rank [A-Z]+!|forjou|refinou|LENDÁRI|Lendári|PRIMORDIAL|ÉPIC|Prova|CHEFE|Mini-Boss|REENCARNAÇÃO|despert/i.test(s) && !/deixou no chão/.test(s)) icon = 'sword'; }
      else if (kind === 'good') icon = 'star';
      else if (kind === 'econ') { if (/Caravana|Mercado|imposto|festival|dízimo/i.test(s)) icon = 'coin'; }
      if (!icon) return;
      this.push(icon, s.replace(/^[^\wÀ-ÿ]+/, ''), kind);
    },

    /* ------------------------------ HUD ------------------------------ */
    txt(id, v) { const el = $(id); if (el && el.textContent !== String(v)) el.textContent = v; },
    tick() {
      const s = P.state; if (!s) return;
      const a = A.st();
      const hud = $('asc-hud');
      if (hud) {
        const vis = (el) => el && el.offsetParent !== null;
        const modal = Array.from(document.querySelectorAll('#ui-layer.on, .r10-layer.on, #eht-layer.on, #screen-layer.on, #cv9-layer.on, #c10-layer.on, #r13-layer.on, #r38-layer.on, #character-lab')).some(vis);
        hud.classList.toggle('behind', modal);
        const panel = $('panel');
        hud.classList.toggle('panel-open', !!panel && !panel.classList.contains('is-hidden') && vis(panel));
      }
      this.txt('asc-lvl', a.lvl);
      this.txt('asc-threat', A.threatName(a.lvl));
      const pct = clamp(a.xp / A.need(a.lvl), 0, 1);
      const ring = $('asc-ring'); if (ring) ring.style.strokeDashoffset = String(119.4 * (1 - pct));
      const xf = $('asc-xpfill'); if (xf) xf.style.width = (pct * 100).toFixed(1) + '%';
      this.txt('asc-time', P.hhmm ? P.hhmm(s.minute) : '');
      const wd = P.weekday ? P.weekday() : '';
      const phase = P.phaseOfDay ? P.phaseOfDay(s.minute) : '';
      this.txt('asc-day', 'Dia ' + s.day + (wd ? ' · ' + String(wd).slice(0, 3) : '') + (phase ? ' · ' + (phase.label || phase.name || phase) : ''));
      const pb = $('asc-pause');
      if (pb) { const want = s.paused ? 'play' : 'pause'; if (pb.dataset.i !== want) { pb.dataset.i = want; pb.innerHTML = ico(want); pb.classList.toggle('warn', !!s.paused); } }
      document.querySelectorAll('.asc-speeds button').forEach((b) => b.classList.toggle('on', !s.paused && String(s.speed) === b.dataset.asc.split(':')[1]));
      // cofre com contagem animada
      const g = Math.round(s.treasury || 0);
      if (this.gold.shown == null) this.gold.shown = g;
      if (this.gold.last != null && g - this.gold.last >= 20) this.delta('asc-chip-gold', '+' + fmt(g - this.gold.last), 'up');
      else if (this.gold.last != null && this.gold.last - g >= 20) this.delta('asc-chip-gold', '−' + fmt(this.gold.last - g), 'down');
      this.gold.last = g;
      this.gold.shown += (g - this.gold.shown) * 0.35;
      if (Math.abs(g - this.gold.shown) < 1) this.gold.shown = g;
      this.txt('asc-gold', fmt(this.gold.shown));
      this.txt('asc-selos', a.selos);
      const cs = $('asc-chip-selos'); if (cs) cs.classList.toggle('glow', a.selos > 0 && A.BLESSINGS.some((b) => A.blessCost(b.id) <= a.selos));
      const old = (id) => { const el = $(id); return el ? el.textContent.trim() : ''; };
      this.txt('asc-pop', old('hud-pop') || (s.population || 0));
      this.txt('asc-appr', old('hud-approval') || Math.round(s.approval || 0));
      const fr = this.frontier();
      this.txt('asc-front', fr + '%');
      const cf = $('asc-chip-front'); if (cf) cf.classList.toggle('danger', fr < 35);
      const sb = $('asc-sound');
      if (sb) { const m = !!(P.audio && P.audio.muted); const want = m ? 'mute' : 'sound'; if (sb.dataset.i !== want) { sb.dataset.i = want; sb.innerHTML = ico(want); } }
      // emblemas
      const ready = a.bounties.list.filter((b) => b.prog >= b.need && !b.claimed).length;
      this.badge('asc-b-contratos', ready || '');
      this.badge('asc-b-bencaos', a.selos > 0 && A.BLESSINGS.some((b) => A.blessCost(b.id) <= a.selos) ? '!' : '');
      this.badge('asc-b-fenda', A.riftBoss() ? '⚔' : '');
      const ob = $('c26-btn-forge-orders'); const m2 = ob ? ob.textContent.match(/\d+/) : null;
      this.badge('asc-b-pedidos', m2 ? m2[0] : '');
    },
    badge(id, v) { const el = $(id); if (!el) return; const s = String(v || ''); if (el.textContent !== s) el.textContent = s; el.classList.toggle('on', !!s); },
    frontier() {
      try {
        const r = (P.SECTORS || []).filter((d) => d.ring === 2).map((d) => P.territory.get(d.id)).filter(Boolean);
        if (r.length) return Math.round(r.reduce((x, y) => x + (y.control || 0), 0) / r.length);
      } catch (e) { /* ok */ }
      const el = $('hud-threat'); return el ? parseInt(el.textContent, 10) || 0 : 0;
    },
    delta(chipId, text, dir) {
      const chip = $(chipId); if (!chip) return;
      const el = document.createElement('i');
      el.className = 'asc-delta ' + dir; el.textContent = text;
      chip.appendChild(el);
      chip.classList.remove('pop'); void chip.offsetWidth; chip.classList.add('pop');
      setTimeout(() => el.remove(), 1500);
    },

    /* ------------------------------ objetivos ------------------------------ */
    renderTrack() {
      const el = $('asc-track'); if (!el) return;
      const a = A.st(), bs = a.bounties;
      let chapter = '';
      try {
        const ch = P.r10 && P.r10.current ? P.r10.current() : null, c = P.r10 ? P.r10.st() : null;
        if (ch) chapter = '<button class="asc-obj" data-asc="chapter"><small>Capítulo ' + (c.ch + 1) + ' · ' + esc(ch.title) + '</small><span>' + esc(ch.goal) + '</span><em>' + esc(ch.reward) + '</em></button>';
      } catch (e) { chapter = ''; }
      const rows = bs.list.map((b) => {
        const done = b.prog >= b.need, pct = clamp(b.prog / b.need * 100, 0, 100);
        return '<div class="asc-bty' + (b.claimed ? ' claimed' : done ? ' ready' : '') + '">' +
          '<div class="asc-bty-t"><span>' + esc(A.bountyText(b)) + '</span><b>' + (b.claimed ? '✓' : fmt(b.prog) + '/' + fmt(b.need)) + '</b></div>' +
          (done && !b.claimed
            ? '<button class="asc-claim" data-asc="claim:' + b.id + '">Receber ' + fmt(Math.round(b.gold * A.streakBonus())) + ' moedas</button>'
            : '<div class="asc-pbar"><i style="width:' + pct.toFixed(0) + '%"></i></div>') +
          '</div>';
      }).join('');
      const html = chapter +
        '<div class="asc-btys"><header><button data-asc="hub:contratos">' + ico('scroll') + 'Contratos do dia</button>' +
        (bs.streak ? '<em title="Sequência de dias com os 3 contratos cumpridos">' + ico('bolt') + bs.streak + '</em>' : '') + '</header>' + rows + '</div>';
      if (el._html !== html) { el._html = html; el.innerHTML = html; }
    },

    /* ------------------------------ grupo ------------------------------ */
    heroes() { try { return P.heroes.list().slice().sort((a, b) => P.rankIndex(b.rank || 'E') - P.rankIndex(a.rank || 'E')); } catch (e) { return []; } },
    klass(n) { try { return (P.aiHero && P.aiHero.klassIdOf && P.aiHero.klassIdOf(n)) || 'guerreiro'; } catch (e) { return 'guerreiro'; } },
    buildParty() {
      const el = $('asc-party'); if (!el) return;
      const hs = this.heroes();
      this._partyKey = hs.map((h) => h.id).join('|');
      el.innerHTML = hs.map((n) =>
        '<button class="asc-pf" data-asc="hero:' + esc(n.id) + '" id="asc-pf-' + esc(n.id) + '" style="--kc:' + (CLASS_COLORS[this.klass(n)] || '#d9b25f') + '">' +
          '<span class="asc-pf-pic"><canvas width="40" height="40"></canvas><i class="asc-pf-rank"></i></span>' +
          '<span class="asc-pf-main"><span class="asc-pf-name"><b></b><em></em></span><span class="asc-pf-hp"><i></i></span><span class="asc-pf-st"></span></span>' +
        '</button>').join('');
      this._portraitAt = 0;
      this.updateParty();
      this.drawPortraits(true);
    },
    stateOf(n) {
      const ex = n.exp || {};
      if (ex.mode === 'caido' || n.activity === 'caído') return ['skull', 'caído', 'down'];
      if (ex.combat) return ['swords', 'em combate', 'fight'];
      if (n.asleep) return ['zzz', 'dormindo', 'rest'];
      if (n.injuredUntil && n.injuredUntil >= P.state.day && (n.hp || 0) < (n.hpMax || 1) * 0.5) return ['flask', 'ferido', 'down'];
      const act = String(n.activity || '').trim();
      if (/caçando|viajando|expedi/.test(act)) return ['sword', act, 'hunt'];
      return ['home', act || 'na cidade', 'town'];
    },
    updateParty() {
      const hs = this.heroes();
      if (hs.map((h) => h.id).join('|') !== this._partyKey) return this.buildParty();
      for (const n of hs) {
        const el = $('asc-pf-' + n.id); if (!el) continue;
        const st = this.stateOf(n);
        const hp = clamp((n.hp || 0) / Math.max(1, n.hpMax || 1), 0, 1);
        let lv = 1; try { lv = P.eht.heroLevelAndExp(n).lv; } catch (e) { /* ok */ }
        const q = (c) => el.querySelector(c);
        const nm = q('.asc-pf-name b'); if (nm.textContent !== n.name) nm.textContent = n.name;
        const lvE = q('.asc-pf-name em'); const lt = 'Nv ' + lv; if (lvE.textContent !== lt) lvE.textContent = lt;
        const rk = q('.asc-pf-rank'); if (rk.textContent !== (n.rank || 'E')) { rk.textContent = n.rank || 'E'; rk.style.background = (P.RANK_COLORS && P.RANK_COLORS[n.rank || 'E']) || '#6d7b63'; }
        const bar = q('.asc-pf-hp i'); bar.style.width = (hp * 100).toFixed(0) + '%'; bar.className = hp < 0.3 ? 'low' : hp < 0.6 ? 'mid' : '';
        const stE = q('.asc-pf-st'); const key = st[0] + st[1];
        if (stE.dataset.k !== key) { stE.dataset.k = key; stE.innerHTML = ico(st[0]) + '<span>' + esc(st[1]) + '</span>'; }
        if (el.dataset.s !== st[2]) { el.dataset.s = st[2]; }
      }
    },
    drawPortraits(force) {
      const now = performance.now();
      if (!force && now - (this._portraitAt || 0) < 9000) return;
      this._portraitAt = now;
      const tmp = this._tmpCv || (this._tmpCv = document.createElement('canvas'));
      for (const n of this.heroes()) {
        const el = $('asc-pf-' + n.id); if (!el) continue;
        const cv = el.querySelector('canvas'); const g = cv.getContext('2d');
        g.imageSmoothingEnabled = false;
        g.clearRect(0, 0, 40, 40);
        let ok = false;
        try {
          if (P.eht && P.eht.drawHeroDollCanvas) {
            P.eht.drawHeroDollCanvas(tmp, n);
            g.drawImage(tmp, 30, 14, 68, 68, 0, 0, 40, 40);
            ok = true;
          }
        } catch (e) { ok = false; }
        if (!ok) {
          g.fillStyle = CLASS_COLORS[this.klass(n)] || '#d9b25f';
          g.font = '700 20px Georgia,serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText(String(n.name || '?').charAt(0), 20, 21);
        }
      }
    },
    focusHero(id) {
      const n = P.heroes.list().find((h) => String(h.id) === String(id)); if (!n) return;
      const now = performance.now();
      if (this._lastFocus === id && now - (this._lastFocusAt || 0) < 1600 && P.eht && P.eht.openHeroModal) { P.eht.openHeroModal(n.id); this._lastFocus = null; return; }
      this._lastFocus = id; this._lastFocusAt = now;
      if (P.camera) { P.camera.x = n.x; P.camera.y = n.y; P.camera.zoom = Math.max(P.camera.zoom, 0.95); }
      try { if (P.ui && P.ui.selectNpc) P.ui.selectNpc(n.id); } catch (e) { /* ok */ }
      if (P.render && P.render.draw) try { P.render.draw(); } catch (e) { /* ok */ }
    },
    focusBoss() {
      const b = A.riftBoss(); if (!b || !P.camera) return;
      P.camera.x = b.x; P.camera.y = b.y; P.camera.zoom = Math.max(P.camera.zoom, 0.9);
    },
    flashFrame(id) { const el = $('asc-pf-' + id); if (!el) return; el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); },

    /* ------------------------------ feed e efeitos ------------------------------ */
    push(icon, text, kind) {
      const box = $('asc-feed'); if (!box) return;
      const now = performance.now();
      if (now - (this._feedAt || 0) < 350 && box.children.length >= 4) return;
      this._feedAt = now;
      const el = document.createElement('div');
      el.className = 'asc-fi ' + (kind || '');
      el.innerHTML = ico(icon) + '<span>' + esc(String(text).slice(0, 120)) + '</span>';
      box.appendChild(el);
      while (box.children.length > 4) box.firstChild.remove();
      setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 500); }, 6500);
    },
    toast(msg) { if (P.ui && P.ui.toast) P.ui.toast(msg); },
    coinsFrom(el, n) { const r = el.getBoundingClientRect(); this.coins(r.left + r.width / 2, r.top + r.height / 2, n); },
    coinsWorld(x, y, n) { try { const s = P.render.worldToScreen(x, y); this.coins(s.x, s.y, n); } catch (e) { /* ok */ } },
    coins(x, y, n) {
      if (P.menu && P.menu.prefs && P.menu.prefs.fx === false) return;
      const target = $('asc-chip-gold'); if (!target) return;
      const tr = target.getBoundingClientRect(), tx = tr.left + 14, ty = tr.top + tr.height / 2;
      for (let i = 0; i < n; i++) {
        const c = document.createElement('i');
        c.className = 'asc-coin';
        const ox = x + (Math.random() * 60 - 30), oy = y + (Math.random() * 40 - 20);
        c.style.left = x + 'px'; c.style.top = y + 'px';
        document.body.appendChild(c);
        const a = c.animate([
          { transform: 'translate(0,0) scale(.6)', opacity: 0 },
          { transform: 'translate(' + (ox - x) + 'px,' + (oy - y) + 'px) scale(1)', opacity: 1, offset: 0.25 },
          { transform: 'translate(' + (tx - x) + 'px,' + (ty - y) + 'px) scale(.5)', opacity: 0.9 },
        ], { duration: 700 + i * 45, easing: 'cubic-bezier(.5,0,.3,1)' });
        a.onfinish = () => { c.remove(); target.classList.remove('pop'); void target.offsetWidth; target.classList.add('pop'); };
      }
    },
    ceremony(title, sub, reward, tone) {
      const box = $('asc-ceremony'); if (!box || box.classList.contains('block')) return;
      const el = document.createElement('div');
      el.className = 'asc-cer ' + (tone || 'gold');
      el.innerHTML = '<span class="asc-cer-rays"></span><small>' + esc(sub) + '</small><h2>' + esc(title) + '</h2><p>' + esc(reward) + '</p>';
      box.innerHTML = ''; box.appendChild(el);
      setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 700); }, 3400);
    },
    intro() {
      const box = $('asc-ceremony'); if (!box || !P.state || (P.menu && P.menu.open)) { setTimeout(() => this.intro(), 3000); return; }
      const busy = Array.from(document.querySelectorAll('button.skip, #ui-layer, .r10-layer.on, #main-menu')).some((el) => el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden');
      const prefs = (P.menu && P.menu.prefs) || {};
      const tutoring = prefs.tips !== false && !prefs.coachDone && (this._introTries = (this._introTries || 0) + 1) < 60;
      if (busy || tutoring) { setTimeout(() => this.intro(), 2500); return; }
      box.classList.add('block');
      box.innerHTML =
        '<div class="asc-intro"><small>Crônicas da Fenda</small><h2>O reino cresce com você</h2>' +
        '<ul>' +
          '<li>' + ico('crown') + '<span><b>Sem escolha de dificuldade.</b> A ameaça começa branda e sobe a cada Nível de Reino — conquistado com abates, contratos e chefes.</span></li>' +
          '<li>' + ico('scroll') + '<span><b>Contratos do dia.</b> Três objetivos a cada amanhecer; cumpra os três e abra o baú. Dias seguidos aumentam o prêmio.</span></li>' +
          '<li>' + ico('scale') + '<span><b>O ouro vem dos espólios.</b> Heróis vendem drops no Mercado, compram poções e forja; o preço reage ao estoque.</span></li>' +
          '<li>' + ico('star') + '<span><b>Sem teto.</b> Maestria dos heróis, Bênçãos permanentes e a Fenda Infinita continuam enquanto você quiser jogar.</span></li>' +
        '</ul><button class="asc-btn primary" data-asc="intro">Assumir o trono</button></div>';
    },

    /* ------------------------------ salão do reino ------------------------------ */
    show(tab) {
      if (tab) this.tab = tab;
      if (P.closeAllModals) try { P.closeAllModals('asc-modal'); } catch (e) { /* ok */ }
      this.open = true;
      $('asc-modal').classList.add('on');
      this.render();
    },
    close() { this.open = false; const m = $('asc-modal'); if (m) m.classList.remove('on'); },
    softRefresh() {
      const body = document.querySelector('#asc-modal .asc-hub-body'); if (!body) return;
      const top = body.scrollTop;
      this.render();
      const b2 = document.querySelector('#asc-modal .asc-hub-body'); if (b2) b2.scrollTop = top;
    },
    render() {
      const m = $('asc-modal'); if (!m || !this.open) return;
      const a = A.st();
      const tabs = [['reino', 'crown', 'Reino'], ['contratos', 'scroll', 'Contratos'], ['fenda', 'skull', 'Fenda'], ['bencaos', 'star', 'Bênçãos'], ['mercado', 'scale', 'Mercado']];
      const body = this.tab === 'contratos' ? this.tabContratos(a) : this.tab === 'fenda' ? this.tabFenda(a) : this.tab === 'bencaos' ? this.tabBencaos(a) : this.tab === 'mercado' ? this.tabMercado(a) : this.tabReino(a);
      const prev = m.querySelector('.asc-hub-body'); const top = prev && m._tab === this.tab ? prev.scrollTop : 0;
      m._tab = this.tab;
      m.innerHTML =
        '<div class="asc-hub">' +
          '<header class="asc-hub-head"><div><small>Salão do Reino</small><h2>' + esc(tabs.find((t) => t[0] === this.tab)[2]) + '</h2></div>' +
            '<div class="asc-hub-wallet"><span>' + ico('coin') + '<b>' + fmt(P.state.treasury) + '</b></span><span>' + ico('seal') + '<b>' + a.selos + '</b></span></div>' +
            '<button class="asc-ib" data-asc="close" title="Fechar (Esc)">' + ico('close') + '</button></header>' +
          '<nav class="asc-hub-tabs">' + tabs.map((t) => '<button class="' + (t[0] === this.tab ? 'on' : '') + '" data-asc="tab:' + t[0] + '">' + ico(t[1]) + '<span>' + t[2] + '</span></button>').join('') + '</nav>' +
          '<div class="asc-hub-body">' + body + '</div>' +
        '</div>';
      const nb = m.querySelector('.asc-hub-body'); if (nb) nb.scrollTop = top;
    },
    stat(label, value, note) { return '<div class="asc-stat"><small>' + label + '</small><b>' + value + '</b>' + (note ? '<em>' + note + '</em>' : '') + '</div>'; },

    tabReino(a) {
      const need = A.need(a.lvl), pct = clamp(a.xp / need * 100, 0, 100), d = A.difficulty();
      const nextNames = [];
      for (let l = a.lvl + 1; l <= a.lvl + 60 && nextNames.length < 3; l++) if (A.threatName(l) !== A.threatName(l - 1)) nextNames.push([l, A.threatName(l)]);
      return '<section class="asc-hero-card">' +
          '<div class="asc-biglvl"><b>' + a.lvl + '</b><small>Nível de Reino</small></div>' +
          '<div class="asc-hero-main"><h3>' + esc(A.threatName(a.lvl)) + '</h3>' +
            '<div class="asc-pbar big"><i style="width:' + pct.toFixed(1) + '%"></i></div>' +
            '<p>Renome ' + fmt(a.xp) + ' / ' + fmt(need) + ' — o próximo nível rende ' + fmt(20 + 15 * (a.lvl + 1)) + ' moedas e ' + ((a.lvl + 1) % 5 === 0 ? '3 Selos' : '1 Selo') + '.</p></div>' +
        '</section>' +
        '<div class="asc-stats">' +
          this.stat('Força dos monstros', '×' + d.monMult.toFixed(2), a.adj < -0.005 ? 'alívio de ' + Math.round(-a.adj * 100) + '% ativo' : 'no ritmo do reino') +
          this.stat('Experiência', '×' + (1 + (d.xpMult - 1) * 0.5 + 0.05 * a.bless.sabedoria).toFixed(2), 'cresce com a ameaça') +
          this.stat('Abates', fmt(a.kills), fmt(a.bossKills) + ' guardiões') +
          this.stat('Recorde na Fenda', 'Andar ' + a.rift.best, 'próximo: ' + a.rift.floor) +
        '</div>' +
        '<section class="asc-note"><h4>Como a dificuldade funciona</h4>' +
          '<p>Não há escolha de dificuldade. Aurora começa em <b>Calmaria</b> e cada Nível de Reino deixa os monstros um pouco mais fortes, amadurece os bandos da fronteira e melhora os prêmios. ' +
          'Se os heróis caírem ou a caçada despencar, a ameaça <b>alivia sozinha</b> (até 30%) e volta ao normal conforme eles vencem. Você dita o ritmo — Renome vem de abates, contratos, andares da Fenda e de cada amanhecer.</p></section>' +
        (nextNames.length ? '<section class="asc-note"><h4>Próximos marcos</h4><div class="asc-miles">' + nextNames.map((n) => '<span><b>Nv ' + n[0] + '</b>' + esc(n[1]) + '</span>').join('') + '</div></section>' : '');
    },

    tabContratos(a) {
      const bs = a.bounties, bonus = Math.round((A.streakBonus() - 1) * 100);
      const rows = bs.list.map((b) => {
        const done = b.prog >= b.need, pct = clamp(b.prog / b.need * 100, 0, 100);
        return '<div class="asc-card' + (b.claimed ? ' claimed' : done ? ' ready' : '') + '">' +
          '<div class="asc-card-main"><h4>' + esc(A.bountyText(b)) + '</h4><div class="asc-pbar"><i style="width:' + pct.toFixed(0) + '%"></i></div>' +
          '<small>' + fmt(b.prog) + ' / ' + fmt(b.need) + ' · ' + fmt(Math.round(b.gold * A.streakBonus())) + ' moedas · ' + b.xp + ' de Renome</small></div>' +
          (b.claimed ? '<span class="asc-tag ok">Recebido</span>' : done ? '<button class="asc-btn primary" data-asc="claim:' + b.id + '">Receber</button>' : '<span class="asc-tag">Em curso</span>') +
          '</div>';
      }).join('');
      const all = bs.list.length && bs.list.every((b) => b.claimed);
      return '<div class="asc-stats">' +
          this.stat('Sequência', bs.streak + ' dia' + (bs.streak === 1 ? '' : 's'), bonus ? '+' + bonus + '% de moedas' : 'cumpra os 3 para começar') +
          this.stat('Contratos cumpridos', fmt(a.stats.bounties), 'desde o início') +
          this.stat('Baú do dia', bs.chest ? 'Aberto' : all ? 'Pronto' : 'Fechado', '1 Selo + equipamento') +
        '</div>' + rows +
        '<section class="asc-note"><p>Os contratos mudam a cada amanhecer. Recompensas não recebidas são pagas automaticamente na virada do dia; a sequência só continua se os três forem cumpridos.</p></section>';
    },

    tabFenda(a) {
      const boss = A.riftBoss(), f = a.rift.floor, r = A.riftReward(f), zone = A.riftZone(f);
      const zname = ((P.ZONES || []).find((z) => z.id === zone) || {}).name || zone;
      const hp = boss ? clamp(boss.hp / Math.max(1, boss.hpMax), 0, 1) : 0;
      return '<section class="asc-rift"><div class="asc-rift-floor"><small>Andar</small><b>' + (boss ? boss._ascRift || f : f) + '</b></div>' +
          '<div class="asc-rift-main"><h3>' + (boss ? esc(boss._ehtTitle || 'Guardião da Fenda') : 'Guardião do Andar ' + f) + '</h3>' +
          (boss
            ? '<div class="asc-pbar big red"><i style="width:' + (hp * 100).toFixed(1) + '%"></i></div><p>Vida ' + fmt(boss.hp) + ' / ' + fmt(boss.hpMax) + ' · seus heróis atacam quando estão em campo.</p>' +
              '<div class="asc-row"><button class="asc-btn primary" data-asc="focusboss">' + ico('eye') + 'Ver a batalha</button><button class="asc-btn" data-asc="dismiss">Selar a Fenda</button></div>'
            : '<p>Surge em <b>' + esc(zname) + '</b>. Cada andar vencido torna o próximo guardião 28% mais resistente — não existe último andar.</p>' +
              '<div class="asc-row"><button class="asc-btn primary" data-asc="summon">' + ico('crown') + 'Abrir a Fenda</button></div>') +
          '</div></section>' +
        '<div class="asc-stats">' +
          this.stat('Prêmio deste andar', fmt(r.gold) + ' moedas', '+' + r.selos + ' Selo' + (r.selos > 1 ? 's' : '') + ' · ' + r.xp + ' Renome') +
          this.stat('Recorde', 'Andar ' + a.rift.best, fmt(a.bossKills) + ' guardiões caídos') +
          this.stat('A cada 5 andares', '3 Selos', 'e equipamento primordial') +
        '</div>' +
        '<section class="asc-note"><p>Se o guardião for forte demais, sele a Fenda sem perder o andar, fortaleça os heróis (forja, Bênçãos, Maestria) e volte depois.</p></section>';
    },

    tabBencaos(a) {
      const cards = A.BLESSINGS.map((b) => {
        const l = a.bless[b.id] || 0, cost = A.blessCost(b.id), can = a.selos >= cost;
        return '<div class="asc-card"><span class="asc-card-ico">' + ico(b.icon) + '</span><div class="asc-card-main"><h4>' + esc(b.name) + ' <em>Nv ' + l + '</em></h4>' +
          '<small>' + esc(b.desc) + ' · total atual +' + (l * b.per) + b.unit + '</small></div>' +
          '<button class="asc-btn' + (can ? ' primary' : '') + '" data-asc="bless:' + b.id + '"' + (can ? '' : ' disabled') + '>' + ico('seal') + cost + '</button></div>';
      }).join('');
      const heroes = this.heroes().map((n) => {
        const m = A.masteryProgress(n), cost = A.trainCost(n), can = (P.state.treasury || 0) >= cost;
        return '<div class="asc-mrow"><b>' + esc(n.name) + '</b><span class="asc-tag">Maestria ' + m.lvl + '</span><div class="asc-pbar"><i style="width:' + m.pct.toFixed(0) + '%"></i></div><small>+' + (m.lvl * 1.5).toFixed(1).replace('.0', '') + '% ataque e vida</small>' +
          '<button class="asc-btn sm' + (can ? ' primary' : '') + '" data-asc="train:' + esc(n.id) + '"' + (can ? '' : ' disabled') + ' title="Treinar: +1 nível de Maestria">' + ico('coin') + fmt(cost) + '</button></div>';
      }).join('');
      return '<div class="asc-stats">' + this.stat('Selos de Renome', a.selos, 'de níveis, baús e guardiões') + this.stat('Bênçãos compradas', Object.values(a.bless).reduce((x, y) => x + y, 0), 'sem limite de nível') + '</div>' +
        cards + '<section class="asc-note"><h4>Maestria e Campo de Treino</h4><p>Cada herói ganha Maestria abatendo monstros — ou treinando com o ouro do cofre. Não tem teto: o reino investe, o herói fica mais forte.</p>' + heroes + '</section>';
    },

    spark(h) {
      if (!h || h.length < 2) return '<svg class="asc-spark" viewBox="0 0 60 18"></svg>';
      const mn = Math.min.apply(null, h), mx = Math.max.apply(null, h), span = Math.max(0.01, mx - mn);
      const pts = h.map((v, i) => (i / (h.length - 1) * 58 + 1).toFixed(1) + ',' + (16 - (v - mn) / span * 14).toFixed(1)).join(' ');
      return '<svg class="asc-spark ' + (h[h.length - 1] >= h[0] ? 'up' : 'down') + '" viewBox="0 0 60 18"><polyline points="' + pts + '" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
    },
    goodRow(id, a) {
      const g = P.GOODS[id], eco = P.economy; if (!g) return '';
      const stock = Math.floor(eco.stock[id] || 0), cap = g.capacity || g.target * 2;
      const ratio = A.priceRatio(id), d = Math.round((ratio - 1) * 100);
      const tag = d >= 8 ? '<span class="asc-tag hot">' + ico('up') + '+' + d + '%</span>' : d <= -8 ? '<span class="asc-tag cold">' + ico('down') + d + '%</span>' : '<span class="asc-tag">estável</span>';
      return '<tr><td><b>' + esc(g.name) + '</b></td>' +
        '<td><div class="asc-pbar stock"><i style="width:' + clamp(stock / cap * 100, 0, 100).toFixed(0) + '%"></i><u style="left:' + clamp(g.target / cap * 100, 0, 100).toFixed(0) + '%"></u></div><small>' + stock + ' / ' + cap + '</small></td>' +
        '<td class="num"><b>' + A.price(id).toFixed(1) + '</b>' + tag + '</td><td>' + this.spark(a.hist[id]) + '</td>' +
        '<td class="act"><button class="asc-btn sm" data-asc="export:' + id + '|5"' + (stock < 1 || A.cargoLeft() < 1 ? ' disabled' : '') + ' title="Vender 5 para caravanas">Exportar +' + fmt(A.exportPrice(id) * Math.min(5, stock, A.cargoLeft())) + '</button>' +
        '<button class="asc-btn sm ghost" data-asc="import:' + id + '|5" title="Comprar 5 de caravanas">Importar −' + fmt(A.importPrice(id) * 5) + '</button></td></tr>';
    },
    tabMercado(a) {
      const eco = P.economy; if (!eco) return '<p>Mercado indisponível.</p>';
      const f = a.flow;
      const loot = A.LOOT_GOODS.filter((id) => P.GOODS[id]);
      const city = Object.keys(P.GOODS).filter((id) => loot.indexOf(id) < 0);
      const head = '<thead><tr><th>Mercadoria</th><th>Estoque (marca = procura)</th><th class="num">Preço</th><th>24h</th><th></th></tr></thead>';
      const hist = a.flowHist.concat([f]).slice(-7);
      const mx = Math.max(1, ...hist.map((x) => (x.loot || 0) + (x.exportG || 0)));
      return '<div class="asc-stats">' +
          this.stat('Espólios vendidos hoje', fmt(f.loot), 'heróis → mercado') +
          this.stat('Gasto dos heróis', fmt(f.spend), 'poções, forja, taverna') +
          this.stat('Dízimo da guilda', fmt(f.tithe || 0), 'heróis → cofre, ao amanhecer') +
          this.stat('Exportado hoje', fmt(f.exportG), 'mercado → cofre') +
          this.stat('Caravanas de hoje', A.cargoLeft() + ' / ' + A.cargoMax(), 'cargas para exportar') +
          this.stat('Caixa do mercado', fmt(eco.cash), 'paga os espólios') +
        '</div>' +
        '<section class="asc-flow"><span>' + ico('sword') + 'Heróis caçam</span><i></i><span>' + ico('scale') + 'Vendem espólios</span><i></i><span>' + ico('anvil') + 'Oficinas produzem</span><i></i><span>' + ico('flask') + 'Heróis compram</span><i></i><span>' + ico('coin') + 'Impostos e exportação</span></section>' +
        '<h4 class="asc-h4">Espólios dos heróis</h4><div class="asc-tablewrap"><table class="asc-table">' + head + '<tbody>' + loot.map((id) => this.goodRow(id, a)).join('') + '</tbody></table></div>' +
        '<h4 class="asc-h4">Produção da cidade</h4><div class="asc-tablewrap"><table class="asc-table">' + head + '<tbody>' + city.map((id) => this.goodRow(id, a)).join('') + '</tbody></table></div>' +
        '<section class="asc-note"><h4>Giro dos últimos dias</h4><div class="asc-bars">' + hist.map((x) => '<div title="Dia ' + x.day + '"><i style="height:' + Math.max(4, ((x.loot || 0) + (x.exportG || 0)) / mx * 100).toFixed(0) + '%"></i><small>D' + x.day + '</small></div>').join('') + '</div>' +
        '<p>O preço sobe quando falta estoque e cai quando sobra. Quando o armazém enche, os heróis não conseguem vender: exporte o excedente para abrir espaço e encher o cofre.</p></section>';
    },

    /* a antiga escolha de Tormento vira um resumo da ameaça gradual */
    patchEhtPanel() {
      const layer = $('eht-layer'); if (!layer) return;
      for (const h3 of layer.querySelectorAll('.eht-detail-card h3')) {
        if (h3.textContent.indexOf('Dificuldade do Reino') < 0) continue;
        const d = A.difficulty(), a = A.st();
        h3.textContent = 'Ameaça do Reino — ' + d.label;
        const p = h3.nextElementSibling;
        if (p && p.tagName === 'P') p.innerHTML = 'A dificuldade é <b>gradual</b>: acompanha o Nível de Reino (' + a.lvl + '). Monstros ×' + d.monMult.toFixed(2) + ' · XP ×' + d.xpMult.toFixed(2) + ' · saque ×' + d.dropMult.toFixed(2) + '. Abra o Salão do Reino para ver os detalhes.';
        const grid = p && p.nextElementSibling;
        if (grid && !grid.querySelector('button')) grid.style.display = 'none';
      }
    },
  });
})();
