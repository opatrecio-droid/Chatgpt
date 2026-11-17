/* Aurora · janela "Enquanto você esteve fora": abas, cartas de achados por raridade e efeitos de revelação. */
(function () {
  'use strict';
  if (typeof G === 'undefined' || G.HEADLESS || !G.UI) return;
  if (!G.UI.offlineModal || G.UI.offlineModal.__rc) return;

  var THEME = [
    { c: '#b4b9c2', d: '#6d7078' }, { c: '#8be05a', d: '#4f8a2e' }, { c: '#5db8ff', d: '#2a6fc4' },
    { c: '#c07bff', d: '#7a34c8' }, { c: '#ffae3d', d: '#d4541a' }, { c: '#62f4ff', d: '#8a62ff' }
  ];
  var BANNER = ['', '', '', '', 'LENDÁRIO!', 'MÍTICO!'];

  function rmOn() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches || !!(G.S && G.S.opts && G.S.opts.reduceMotion); } catch (e) { return false; } }
  function lowOn() { try { return !!(G.S && G.S.opts && G.S.opts.lowFx); } catch (e) { return false; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function mk(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  /* ---------- SVG compartilhado (gradientes + motivos) ---------- */
  function stops(arr) { return arr.map(function (c, i) { return '<stop offset="' + (i / (arr.length - 1)).toFixed(2) + '" stop-color="' + c + '"/>'; }).join(''); }
  function lg(id, arr, x2, y2) { return '<linearGradient id="rcg-' + id + '" x1="0" y1="0" x2="' + (x2 || 0) + '" y2="' + (y2 == null ? 1 : y2) + '">' + stops(arr) + '</linearGradient>'; }
  function rg(id, arr) { return '<radialGradient id="rcg-' + id + '" cx=".4" cy=".35" r=".75">' + stops(arr) + '</radialGradient>'; }
  function rune(seed) {
    var s = seed, rnd = function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }, d = 'M1.5 0V5';
    var n = 1 + Math.floor(rnd() * 3);
    for (var i = 0; i < n; i++) { var y = rnd() * 4, dx = rnd() > .5 ? 2.2 : -2.2; d += 'M1.5 ' + y.toFixed(1) + 'l' + dx + ' ' + (rnd() > .5 ? 1.6 : -1.6); }
    return d;
  }
  function runeRing() {
    var out = '', k = 0, a, x, y, rot;
    for (a = 0; a <= 180; a += 14) {
      x = 50 + 43.5 * Math.cos(a * Math.PI / 180); y = 46 - 39.5 * Math.sin(a * Math.PI / 180); rot = 90 - a;
      out += '<path d="' + rune(++k * 7) + '" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + rot + ') translate(-1.5 -2.5)"/>';
    }
    for (var yy = 54; yy <= 128; yy += 7.5) {
      out += '<path d="' + rune(++k * 7) + '" transform="translate(6.6 ' + yy + ') translate(-1.5 -2.5)"/><path d="' + rune(++k * 7) + '" transform="translate(93.4 ' + yy + ') translate(-1.5 -2.5)"/>';
    }
    return out;
  }
  function sharedDefs() {
    var d = '';
    d += lg('m0', ['#9a9da3', '#5d6065', '#2c2e32', '#1b1c1f']);
    d += lg('m1', ['#d79a56', '#9a6430', '#5a3818', '#35200c']);
    d += lg('m2', ['#ffffff', '#c3ccda', '#7b8698', '#454d5e']);
    d += lg('m3', ['#d6a0ff', '#8744cc', '#46207c', '#1f0c3e']);
    d += lg('m4', ['#fff6bd', '#ffc83c', '#c6730f', '#6a3406']);
    d += lg('m5', ['#dff8ff', '#7fd8ff', '#6a5fe0', '#26286e']);
    d += lg('pl', ['#272a31', '#14161a', '#0a0b0d']);
    d += '<linearGradient id="rcg-sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>';
    d += rg('gB', ['#d9ecff', '#3f8dff', '#0b2a8a']) + rg('gP', ['#f1d6ff', '#a24dff', '#3a0f7a']) + rg('gR', ['#ffd4c8', '#ff3b2a', '#6e0808']) + rg('gC', ['#f0ffff', '#37e6ff', '#0a4f8a']) + rg('gG', ['#e9ffd0', '#6fd14a', '#1c5a14']) + rg('gA', ['#fff4c0', '#ffb62e', '#8a4a06']);
    d += rg('rv', ['#fff', '#aaa', '#444']);
    d += '<g id="rcm-fil" fill="none" stroke-linecap="round"><path d="M13 44C13 28 22 19 34 18C42 17.5 48 21 48 26C48 31 43 33 40 31C37 29 38 25 41 25"/><path d="M13 24C16 18 21 15 27 14.5"/><path d="M24 40C24 34 28 31 33 32C36 33 36 37 33 38"/><path d="M13 60C17 56 22 56 25 59"/></g>';
    d += '<g id="rcm-fil3" fill="none" stroke-linecap="round"><path d="M13.5 30C13.5 20 20 15 28 14.5"/><path d="M16 22C16 18 19 16.5 22 17C24 17.5 24.5 20 22.5 21"/></g>';
    d += '<g id="rcm-run" fill="none" stroke-linecap="round" stroke-linejoin="round">' + runeRing() + '</g>';
    return '<svg class="rcx-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>' + d + '</defs></svg>';
  }

  /* ---------- molduras por raridade (viewBox 100x140) ---------- */
  var OUT = 'M8 2H92Q98 2 98 8V132Q98 138 92 138H8Q2 138 2 132V8Q2 2 8 2Z';
  var OUT5 = 'M6 138Q2 138 2 134V46C2 20 24 2 50 2C76 2 98 20 98 46V134Q98 138 94 138Z';
  var HOLE = 'M14 11H86Q89 11 89 14V114Q89 117 86 117H14Q11 117 11 114V14Q11 11 14 11Z';
  var HOLE5 = 'M11 117V46C11 25 28 11 50 11C72 11 89 25 89 46V117Z';
  function gem(cx, cy, r, g, m) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r + 1.1) + '" fill="url(#rcg-m' + m + ')" stroke="#000" stroke-opacity=".6" stroke-width=".5"/><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="url(#rcg-g' + g + ')"/><circle cx="' + (cx - r * .35) + '" cy="' + (cy - r * .4) + '" r="' + (r * .3).toFixed(2) + '" fill="#fff" opacity=".9"/>';
  }
  function dia(cx, cy, w, h, g, m) {
    var p = 'M' + cx + ' ' + (cy - h) + 'L' + (cx + w) + ' ' + cy + 'L' + cx + ' ' + (cy + h) + 'L' + (cx - w) + ' ' + cy + 'Z';
    return '<path d="' + p + '" fill="url(#rcg-m' + m + ')" stroke="#000" stroke-opacity=".65" stroke-width="1.6" stroke-linejoin="round"/><path d="' + p.replace(/Z$/, '') + 'Z" transform="translate(' + cx + ' ' + cy + ') scale(.62) translate(' + (-cx) + ' ' + (-cy) + ')" fill="url(#rcg-g' + g + ')"/><path d="M' + cx + ' ' + (cy - h * .55) + 'L' + (cx + w * .3) + ' ' + (cy - h * .1) + 'L' + cx + ' ' + (cy + h * .1) + 'Z" fill="#fff" opacity=".55"/>';
  }
  function quad(id, stroke, sw, ex) {
    var u = function (t) { return '<use href="#' + id + '" ' + (t ? 'transform="' + t + '" ' : '') + ex + '/>'; };
    var a = [''], s = ['translate(100 0) scale(-1 1)', 'translate(0 128) scale(1 -1)', 'translate(100 128) scale(-1 -1)'];
    return a.concat(s).map(u).join('');
  }
  function tint(id, color, sw, op) { return '<g stroke="#000" stroke-opacity=".7" stroke-width="' + (sw + 1.5) + '">' + quad(id, '', 0, '') + '</g><g stroke="' + color + '" stroke-width="' + sw + '" opacity="' + (op || 1) + '">' + quad(id, '', 0, '') + '</g>'; }
  function dragon() {
    var half = '<path d="M48 11C41 1 29 -2 12 -1C21 1 25 4 27 7C21 5 16 6 10 9C19 9 24 11 27 15C33 13 40 13 48 15Z" fill="url(#rcg-m4)" stroke="#5a2c04" stroke-width=".9" stroke-linejoin="round"/><path d="M44 8C38 3 30 1 20 1.5M44 11C37 7 29 6 22 8" fill="none" stroke="#fff3b0" stroke-opacity=".6" stroke-width=".6"/><path d="M47 1L41 -9L48 -3Z" fill="url(#rcg-m4)" stroke="#5a2c04" stroke-width=".7"/>';
    return '<g>' + half + '<g transform="translate(100 0) scale(-1 1)">' + half + '</g><path d="M50 -7L45 -1L43 4L47 9L50 12L53 9L57 4L55 -1Z" fill="url(#rcg-m4)" stroke="#5a2c04" stroke-width=".9" stroke-linejoin="round"/><path d="M50 -4L47 1L50 3L53 1Z" fill="#fff4b8" opacity=".55"/><circle cx="46.8" cy="1.6" r="1" fill="#ff4020"/><circle cx="53.2" cy="1.6" r="1" fill="#ff4020"/>' + gem(50, 7.4, 2.4, 'R', 4) + '</g>';
  }
  function frame(r) {
    var arch = r === 5, out = arch ? OUT5 : OUT, hole = arch ? HOLE5 : HOLE, s = '';
    s += '<path d="' + out + ' ' + hole + '" fill-rule="evenodd" fill="url(#rcg-m' + r + ')"/>';
    if (r === 1) s += '<g stroke="#2a1608" stroke-opacity=".35" stroke-width=".5" fill="none"><path d="M4.5 12V128M7.2 12V128M92.8 12V128M95.5 12V128M16 4.5H84M16 7.2H84"/></g>';
    if (r === 0) s += '<g fill="none" stroke="#0b0b0d" stroke-opacity=".7" stroke-width=".7" stroke-linejoin="round"><path d="M8 38l4 5-3 6 5 6"/><path d="M91 80l-4 5 3 7-3 5"/><path d="M30 5l3 3-2 3"/><path d="M70 133l3-2-1-4"/></g>';
    s += '<path d="' + out + ' ' + hole + '" fill-rule="evenodd" fill="url(#rcg-sheen)"/>';
    s += '<path d="' + out + '" fill="none" stroke="#000" stroke-opacity=".7" stroke-width="1.1"/>';
    if (!arch) s += '<rect x="3.4" y="3.4" width="93.2" height="133.2" rx="5" fill="none" stroke="#fff" stroke-opacity=".32" stroke-width=".7"/>';
    s += '<path d="' + hole + '" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="3"/><path d="' + hole + '" fill="none" stroke="#000" stroke-opacity=".75" stroke-width="1.5"/>';
    if (r === 0) {
      [[6.5, 6.5], [93.5, 6.5], [6.5, 131.5], [93.5, 131.5]].forEach(function (p) { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.1" fill="url(#rcg-m0)" stroke="#000" stroke-opacity=".7" stroke-width=".6"/><circle cx="' + (p[0] - .5) + '" cy="' + (p[1] - .6) + '" r=".6" fill="#fff" opacity=".6"/>'; });
    }
    if (r === 1) {
      var y, a;
      for (y = 18, a = 0; y < 112; y += 9, a++) {
        s += '<path d="M0 0C3 -3.2 7 -3.2 9 0C7 3.2 3 3.2 0 0Z" transform="translate(3.6 ' + y + ') rotate(' + (a % 2 ? 38 : -38) + ')" fill="url(#rcg-gG)" stroke="#12300c" stroke-width=".5" stroke-opacity=".8"/>';
        s += '<path d="M0 0C3 -3.2 7 -3.2 9 0C7 3.2 3 3.2 0 0Z" transform="translate(96.4 ' + y + ') scale(-1 1) rotate(' + (a % 2 ? 38 : -38) + ')" fill="url(#rcg-gG)" stroke="#12300c" stroke-width=".5" stroke-opacity=".8"/>';
      }
      s += gem(50, 6.4, 2.2, 'G', 1) + gem(6.4, 64, 2, 'G', 1) + gem(93.6, 64, 2, 'G', 1);
    }
    if (r === 2) {
      s += tint('rcm-fil', '#e6edf9', 1.1, .95);
      [[6.6, 6.6], [93.4, 6.6], [6.6, 131.4], [93.4, 131.4], [6.6, 64], [93.4, 64]].forEach(function (p) { s += gem(p[0], p[1], 2.5, 'B', 2); });
      s += '<path d="M42 3.8Q50 7.6 58 3.8" fill="none" stroke="#2a6fc4" stroke-width="1"/>';
    }
    if (r === 3) {
      s += '<path d="' + hole.replace(/^M11 /, 'M11 ') + '" fill="none" stroke="#f0c878" stroke-opacity=".9" stroke-width=".7" transform="translate(50 64) scale(.955) translate(-50 -64)"/>';
      s += tint('rcm-fil3', '#f3d28a', .9, .95);
      s += '<path d="M40 6Q50 -3 60 6L55 9H45Z" fill="url(#rcg-m3)" stroke="#000" stroke-opacity=".6" stroke-width=".8"/>';
      s += dia(50, 5.6, 4.6, 6.2, 'P', 3) + dia(6.6, 64, 2.8, 4.4, 'P', 3) + dia(93.4, 64, 2.8, 4.4, 'P', 3) + gem(6.6, 6.8, 2.3, 'P', 3) + gem(93.4, 6.8, 2.3, 'P', 3) + gem(6.6, 131.4, 2.3, 'P', 3) + gem(93.4, 131.4, 2.3, 'P', 3);
    }
    if (r === 4) {
      s += '<path d="' + hole + '" fill="none" stroke="#ffe08a" stroke-opacity=".9" stroke-width=".6" transform="translate(50 64) scale(.96) translate(-50 -64)"/>';
      s += dragon();
      [[6.6, 12], [93.4, 12], [6.6, 131.4], [93.4, 131.4]].forEach(function (p, i) { s += gem(p[0], p[1], 2.3, i % 3 === 0 ? 'R' : 'R', 4); });
      s += gem(6.6, 64, 2.2, 'A', 4) + gem(93.4, 64, 2.2, 'A', 4);
    }
    if (r === 5) {
      s += '<g stroke="#bff6ff" stroke-width=".7" opacity=".95"><use href="#rcm-run"/></g>';
      s += '<path d="' + hole + '" fill="none" stroke="#c9f8ff" stroke-opacity=".8" stroke-width=".6" transform="translate(50 64) scale(.965) translate(-50 -64)"/>';
      s += '<circle cx="50" cy="3.6" r="7.5" fill="#62f4ff" opacity=".28"/>' + gem(50, 3.6, 4, 'C', 5) + '<path d="M50 -4L51.2 2.4L57 3.6L51.2 4.8L50 11.2L48.8 4.8L43 3.6L48.8 2.4Z" fill="#fff" opacity=".9"/>';
      s += gem(6.6, 132, 2.2, 'C', 5) + gem(93.4, 132, 2.2, 'C', 5) + gem(6.6, 64, 2, 'P', 5) + gem(93.4, 64, 2, 'P', 5);
    }
    s += '<path d="M17 119H83L87 126.5L83 134H17L13 126.5Z" fill="url(#rcg-pl)" stroke="url(#rcg-m' + r + ')" stroke-width="1.7" stroke-linejoin="round"/><path d="M17 119H83L87 126.5L83 134H17L13 126.5Z" fill="none" stroke="#000" stroke-opacity=".7" stroke-width=".5"/>';
    return '<svg class="rcx-svg" viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true" focusable="false">' + s + '</svg>';
  }
  var FR = {};
  function frameOf(r) { return FR[r] || (FR[r] = frame(r)); }

  /* ---------- camadas de campo ---------- */
  function fieldHTML(r) {
    var f = '<div class="rcx-field f' + r + '">';
    if (r === 0) f += '<i class="rcx-cracks"></i>';
    if (r === 1) f += '<i class="rcx-leaves"></i>';
    if (r === 2) f += '<i class="rcx-stars s1"></i><i class="rcx-stars s2"></i>';
    if (r === 3) f += '<i class="rcx-spin a"></i><i class="rcx-ring3"></i><i class="rcx-stars s1"></i>';
    if (r === 4) f += '<i class="rcx-spin a"></i><i class="rcx-ring4"></i><i class="rcx-lava"></i>';
    if (r === 5) f += '<i class="rcx-spin a"></i><i class="rcx-spin b"></i><i class="rcx-stars s1"></i><i class="rcx-stars s2"></i><i class="rcx-core"></i>';
    return f + '</div>';
  }
  function layersHTML(r) {
    var h = '<div class="rcx-clip">';
    if (r >= 3) h += '<i class="rcx-holo"></i>';
    h += '<i class="rcx-shine"></i></div>';
    return h;
  }

  /* ---------- dados da carta ---------- */
  function cardTitle(c) { var t; try { if (c.k === 'gear' && c.p && c.p.it) t = G.itemName(c.p.it); } catch (e) {} t = t || (G.RET_TITLE && G.RET_TITLE[c.k]) || c.k; return t.length > 26 ? t.slice(0, 25) + '…' : t; }
  function cardIcon(c) {
    var p = c.p || {};
    try {
      if (c.k === 'gear' && p.it) return G.UI.gi(p.it);
      if (c.k === 'gold') return G.UI.ic('coin');
      if (c.k === 'nuc') return G.UI.ic('core');
      if (c.k === 'selo') return G.UI.ic('seal');
      var pt = (G.prizeParts(p) || [])[0];
      if (pt && pt.id) return '<i class="px ri-' + esc(pt.id) + '"></i>';
      if (pt && pt.i === 'core') return G.UI.ic('core');
    } catch (e) {}
    try { return G.UI.ic('coin'); } catch (e2) { return ''; }
  }
  function cardValue(c) {
    if (c.k === 'gear') return (G.RAR && G.RAR[c.r]) || '';
    try {
      var parts = G.prizeParts(c.p || {}) || [];
      if (parts.length) return parts.slice(0, 2).map(function (x) { return x.t; }).join(' · ');
    } catch (e) {}
    return (G.RAR && G.RAR[c.r]) || '';
  }
  function backHTML(r, name) {
    return '<div class="rcx-f rcx-back">' + '<i class="rcx-aura-in"></i>' + fieldHTML(r).replace('</div>', '<i class="rcx-sigil">' + (r >= 3 ? '' : '?') + '</i></div>') + frameOf(r) + layersHTML(r) + '<div class="rcx-plate"><span>' + esc(name) + '</span></div></div>';
  }
  function frontHTML(r, c) {
    return '<div class="rcx-f rcx-front">' + fieldHTML(r).replace('</div>', '<i class="rcx-bloom"></i></div>') +
      '<div class="rcx-fc"><span class="rcx-rar">' + esc(G.RAR[r]) + '</span><span class="rcx-ico">' + cardIcon(c) + '</span><span class="rcx-nm">' + esc(cardTitle(c)) + '</span></div>' +
      frameOf(r) + layersHTML(r) + '<div class="rcx-plate rcx-val"><span>' + esc(cardValue(c)) + '</span></div></div>';
  }

  /* ---------- ícones de UI ---------- */
  var IC = {
    cards: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="11" height="15" rx="2" transform="rotate(-10 8 12)"/><rect x="10" y="4" width="11" height="15" rx="2" transform="rotate(8 15 11)"/><path d="M15.5 9l1 2 2 .3-1.5 1.4.4 2-1.9-1-1.8 1 .4-2-1.5-1.4 2-.3z" fill="currentColor" stroke="none"/></svg>',
    sum: '<svg viewBox="0 0 24 24"><path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/></svg>',
    book: '<svg viewBox="0 0 24 24"><path d="M4 5c3-1.5 6-1.5 8 .5 2-2 5-2 8-.5v14c-3-1.5-6-1.5-8 .5-2-2-5-2-8-.5z"/><path d="M12 5.5V19.5"/></svg>',
    coin: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 7v10M9.5 9.5c.5-1 4.5-1 5 0s-1 1.8-2.5 2.2-3 1.3-2.5 2.3 4.5 1 5 0"/></svg>',
    sword: '<svg viewBox="0 0 24 24"><path d="M5 19L18 6l1-3 3 0-1 3-13 13M5 19l-2 2M7 14l4 4M3 17l4 4"/></svg>',
    lvl: '<svg viewBox="0 0 24 24"><path d="M12 3l7 8h-4v10H9V11H5z"/></svg>',
    day: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><path d="M4 18h16l-2-5H8l-1-3H4zM8 13V9h8v4M12 18v3"/></svg>',
    fall: '<svg viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/><path d="M12 8l-2 4 3 1-2 4"/></svg>'
  };

  /* ---------- tempo ---------- */
  function fmtDur(s) {
    s = Math.max(0, Math.round(s)); var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
    if (!h && !m) return '<1 min'; return h ? (m ? h + ' h ' + m + ' min' : h + ' h') : m + ' min';
  }

  /* ---------- montagem ---------- */
  function setup(win, o) {
    var scroll = win.querySelector('.aurora-return-scroll'), footer = win.querySelector('.aurora-return-footer'), header = win.querySelector('.aurora-return-header');
    if (!scroll || !header) return;
    var rm = rmOn(), low = lowOn();
    win.classList.add('rcx-on'); if (rm) win.classList.add('rcx-rm'); if (low) win.classList.add('rcx-low');
    var q = function (s) { return scroll.querySelector(s); };
    var art = q('.art'), lead = q('p.lead'), rtr = q('p.rtr'), news = q('.rvnews'), costs = q('.costs'), rtl = q('ul.rtl');
    var rcdh = q('.rcd-h'), rcds = q('.rcd-s'), rcdg = q('.rcdg'), rtc = q('#rtc');
    var stats = [].slice.call(scroll.querySelectorAll('.stat'));
    var secs = [].slice.call(scroll.querySelectorAll(':scope > .sec'));
    var off = (G.ret && G.ret() && G.ret().off) || {};
    var cards = (off.cards && off.cards.length ? off.cards : (o && o.cards)) || [];
    var hasCards = !!(rcdg && cards.length);

    /* decoração da moldura */
    win.insertBefore(mk('div', 'rcx-defs-wrap', sharedDefs()), win.firstChild);
    ['tl', 'tr', 'bl', 'br'].forEach(function (k) {
      win.appendChild(mk('i', 'rcx-corner ' + k, '<svg viewBox="0 0 40 40"><path d="M2 40V11Q2 2 11 2H40" fill="none" stroke="#7a5018" stroke-width="5"/><path d="M2 40V11Q2 2 11 2H40" fill="none" stroke="#f1c868" stroke-width="2.4"/><path d="M5 40V12Q5 5 12 5H40" fill="none" stroke="#fff3c4" stroke-opacity=".55" stroke-width=".8"/><circle cx="10" cy="10" r="6.4" fill="#4a2c0c" stroke="#f1c868" stroke-width="1.2"/><circle cx="10" cy="10" r="4.4" fill="var(--gem)"/><circle cx="8.4" cy="8.4" r="1.4" fill="#fff" opacity=".85"/></svg>'));
    });
    win.appendChild(mk('i', 'rcx-crest', '<svg viewBox="0 0 120 22"><path d="M60 3L68 11L60 19L52 11Z" fill="#ffb62e" stroke="#f1c868" stroke-width="1.6"/><path d="M60 6L64 11L60 14Z" fill="#fff" opacity=".55"/><path d="M50 11H22C16 11 12 8 4 8M70 11H98C104 11 108 8 116 8" fill="none" stroke="#f1c868" stroke-width="2" stroke-linecap="round"/><path d="M44 11C40 4 30 3 24 5M76 11C80 4 90 3 96 5" fill="none" stroke="#a8742a" stroke-width="1.6" stroke-linecap="round"/></svg>'));

    /* abas */
    var tabsEl = mk('div', 'rcx-tabs'); tabsEl.setAttribute('role', 'tablist'); tabsEl.setAttribute('aria-label', 'Seções do relatório');
    var defs = [];
    if (hasCards) defs.push(['achados', 'Achados', IC.cards]);
    defs.push(['resumo', 'Resumo', IC.sum], ['diario', 'Diário', IC.book]);
    var tabEls = {}, panels = {};
    defs.forEach(function (d) {
      var b = mk('button', 'rcx-tab', '<span class="rcx-ti">' + d[2] + '</span><span class="rcx-tl">' + d[1] + '</span>' + (d[0] === 'achados' ? '<b class="rcx-badge"></b>' : ''));
      b.type = 'button'; b.setAttribute('role', 'tab'); b.id = 'rcx-tab-' + d[0]; b.setAttribute('aria-controls', 'rcx-p-' + d[0]); b.dataset.rcTab = d[0];
      tabsEl.appendChild(b); tabEls[d[0]] = b;
      var p = mk('section', 'rcx-panel rcx-p-' + d[0]); p.id = 'rcx-p-' + d[0]; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); p.hidden = true; p.dataset.rcPanel = d[0];
      panels[d[0]] = p;
    });
    win.insertBefore(tabsEl, scroll);
    scroll.removeAttribute('tabindex'); scroll.removeAttribute('role'); scroll.removeAttribute('aria-label'); scroll.classList.add('rcx-body');

    /* Resumo */
    var P = panels.resumo, hero = mk('div', 'rcx-hero');
    if (art && art.style.backgroundImage) hero.style.backgroundImage = art.style.backgroundImage;
    var leadTxt = lead ? lead.textContent : '', m1 = /fora\s+([^.]*?)\.(?:\s|$)/.exec(leadTxt);
    var big = (o && o.raw != null) ? fmtDur(o.raw) : (m1 ? m1[1] : '');
    var sub;
    if (o && o.eff != null) {
      sub = 'Aurora viveu <b>' + fmtDur(o.eff) + '</b> de reino sem você';
      var bits = []; if (o.sim) bits.push(fmtDur(o.sim) + ' simulados' + (o.days ? ' (' + o.days + ' d)' : '')); if (o.est) bits.push(fmtDur(o.est) + ' estimados');
      if (bits.length) sub += '<small>' + bits.join(' · ') + '</small>';
    } else sub = esc(leadTxt.replace(/^[^.]*\.\s*/, ''));
    hero.innerHTML = '<div class="rcx-hero-t"><small>Você ficou fora</small><strong>' + esc(big) + '</strong></div>';
    P.appendChild(hero);
    P.appendChild(mk('p', 'rcx-sub', sub));
    var rt = rtr ? rtr.textContent : '', m2 = /primeiras\s+(\d+)\s*h[^;]*?(\d+)%[^;]*?;\s*as\s+(\d+)\s*h\s+seguintes,\s*(\d+)%[^.]*?(\d+)\s*h/.exec(rt);
    P.appendChild(mk('p', 'rcx-rule', '<span>' + (m2 ? 'Regra: ' + m2[1] + ' h a ' + m2[2] + '% · ' + m2[3] + ' h a ' + m2[4] + '% · máx. ' + m2[5] + ' h' : esc(rt)) + '</span>'));
    var sg = mk('div', 'rcx-stats'), icons = [IC.coin, IC.sword, IC.lvl, IC.day, IC.gear, IC.fall];
    stats.forEach(function (s, i) { s.classList.add('rcx-stat'); s.insertBefore(mk('span', 'rcx-si', icons[i] || IC.coin), s.firstChild); sg.appendChild(s); });
    if (stats.length) P.appendChild(sg);
    if (costs) { P.appendChild(mk('div', 'rcx-h', '<span>Armazém</span>')); costs.classList.add('rcx-costs'); costs.removeAttribute('style'); P.appendChild(costs); }

    /* Diário */
    var D = panels.diario;
    if (news) { news.classList.add('rcx-news'); D.appendChild(news); }
    if (rtl) { D.appendChild(mk('div', 'rcx-h', '<span>O que aconteceu</span>')); rtl.removeAttribute('style'); D.appendChild(rtl); }
    if (!news && !rtl) D.appendChild(mk('p', 'rcx-sub', 'Nada de especial aconteceu.'));

    /* Achados */
    var stage, grid, cv, ctx, cardEls = [], pips = [], badge;
    if (hasCards) {
      var A = panels.achados;
      var head = mk('div', 'rcx-head');
      if (rcdh) head.appendChild(rcdh); if (rcds) head.appendChild(rcds);
      A.appendChild(head);
      stage = mk('div', 'rcx-stage');
      grid = rcdg; grid.removeAttribute('style'); grid.classList.add('rcx-grid');
      stage.appendChild(grid);
      cv = mk('canvas', 'rcx-cv'); stage.appendChild(cv);
      stage.appendChild(mk('div', 'rcx-sflash'));
      stage.appendChild(mk('div', 'rcx-banner', '<span></span>'));
      A.appendChild(stage);
      var cnt = mk('div', 'rcx-count'); if (rtc) cnt.appendChild(rtc);
      var pp = mk('div', 'rcx-pips'); cnt.appendChild(pp);
      A.appendChild(cnt);
      badge = tabEls.achados.querySelector('.rcx-badge');
      cards.forEach(function (c, i) {
        var el = grid.querySelector('#rc' + i);
        if (!el) { el = mk('div', 'rcd' + (c.st ? ' on nf' : '')); el.id = 'rc' + i; el.setAttribute('data-a', 'rtflip:' + i); grid.appendChild(el); }
        var r = Math.max(0, Math.min(5, c.r | 0)), th = THEME[r];
        el.className = el.className.replace(/\brar\d\b/g, '') + ' rar' + r + ' rcx-card';
        el.style.cssText = '--c:' + th.c + ';--d:' + th.d + ';--i:' + i;
        el.setAttribute('role', 'button'); el.tabIndex = 0;
        el.innerHTML = '<i class="rcx-aura"></i>' + (r === 4 ? '<i class="rcx-fl l"></i><i class="rcx-fl r"></i>' : '') + '<div class="rcx-lift"><div class="rcx-in">' + backHTML(r, G.RAR[r]) + frontHTML(r, c) + '</div></div>';
        pips.push(pp.appendChild(mk('i', 'rcx-pip', '')));
        cardEls.push(el);
        el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } });
      });
    }
    scroll.textContent = '';
    defs.forEach(function (d) { scroll.appendChild(panels[d[0]]); });

    /* rótulo do botão "Virar todas" */
    var all = footer && footer.querySelector('#rtall');
    if (all) {
      var tw = document.createTreeWalker(all, 4), tn; while ((tn = tw.nextNode())) tn.nodeValue = tn.nodeValue.replace(/[\u2726\u2727\u2728\u2736]\s*/g, '');
      all.insertAdjacentHTML('afterbegin', '<span class="rcx-bi" aria-hidden="true">' + IC.cards + '</span>');
    }

    /* abas: troca */
    var order = defs.map(function (d) { return d[0]; }), cur = null;
    function unflipped() { var n = 0; cardEls.forEach(function (e) { if (!e.classList.contains('on')) n++; }); return n; }
    function show(name, focus) {
      cur = name;
      order.forEach(function (k) { var on = k === name; tabEls[k].setAttribute('aria-selected', on ? 'true' : 'false'); tabEls[k].tabIndex = on ? 0 : -1; panels[k].hidden = !on; });
      if (focus) tabEls[name].focus();
      if (name === 'achados') requestAnimationFrame(layout);
    }
    tabsEl.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('.rcx-tab'); if (b) show(b.dataset.rcTab); });
    tabsEl.addEventListener('keydown', function (e) {
      var i = order.indexOf(cur), d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); show(order[(i + d + order.length) % order.length], true); }
      else if (e.key === 'Home') { e.preventDefault(); show(order[0], true); } else if (e.key === 'End') { e.preventDefault(); show(order[order.length - 1], true); }
    });

    function sync() {
      var n = unflipped();
      if (badge) { badge.textContent = n; badge.hidden = !n; }
      cardEls.forEach(function (e, i) { pips[i].classList.toggle('on', e.classList.contains('on')); e.setAttribute('aria-label', 'Carta ' + G.RAR[cards[i].r | 0] + (e.classList.contains('on') ? ': ' + cardTitle(cards[i]) + ', ' + cardValue(cards[i]) : ', fechada')); });
    }
    show(hasCards && unflipped() > 0 ? 'achados' : 'resumo');
    if (!hasCards) { sync(); return; }
    sync();

    /* layout das cartas */
    var rects = [], lastKey = '';
    function layout() {
      if (!win.isConnected || !stage.offsetParent) return;
      var cs = getComputedStyle(stage), W = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), Hh = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      if (W < 40 || Hh < 40) return;
      var n = cards.length, best = null, g = Math.max(10, Math.round(W * .035));
      for (var cols = 1; cols <= Math.min(4, n); cols++) {
        var rows = Math.ceil(n / cols), cw = Math.min((W - (cols - 1) * g) / cols, (Hh - (rows - 1) * g) / rows / 1.4, 172);
        if (!best || cw > best.cw + .5) best = { cols: cols, cw: cw };
      }
      var cw2 = Math.floor(best.cw), key = cw2 + '/' + best.cols + '/' + g + '/' + W + '/' + Hh;
      if (key === lastKey) return; lastKey = key;
      stage.style.setProperty('--cw', cw2 + 'px'); stage.style.setProperty('--ch', Math.round(cw2 * 1.4) + 'px'); stage.style.setProperty('--g', g + 'px');
      grid.style.width = (best.cols * cw2 + (best.cols - 1) * g) + 'px';
      cv.width = Math.round(stage.clientWidth * dpr); cv.height = Math.round(stage.clientHeight * dpr);
      requestAnimationFrame(measure);
    }
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    function measure() {
      if (!win.isConnected) return;
      rects = cardEls.map(function (e) { return { x: grid.offsetLeft + e.offsetLeft, y: grid.offsetTop + e.offsetTop, w: e.offsetWidth, h: e.offsetHeight }; });
    }
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { requestAnimationFrame(layout); }); ro.observe(stage); }
    else window.addEventListener('resize', layout);
    setTimeout(function () { if (win.isConnected) grid.classList.add('rcx-entered'); }, 1900);

    /* partículas */
    var P_ = [], ctx2 = cv.getContext('2d'), CAP = low ? 36 : 90, last = 0, acc = 0;
    var SP = [[1.1, 'ember', ['#ff9a4a', '#ff6a2a']], [.6, 'mote', ['#a4ec74']], [1.8, 'tw', ['#cfe9ff', '#6cc0ff']], [2.2, 'wisp', ['#e0b0ff', '#a35cff']], [6, 'ember', ['#ffd27a', '#ff8a2a', '#ffb347']], [4.5, 'tw', ['#b4fcff', '#d6b6ff', '#fff']]];
    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
    function spawn(i, kind, cols) {
      var rc = rects[i]; if (!rc || P_.length >= CAP) return;
      var p = { t: 0, col: pick(cols), k: kind };
      if (kind === 'ember' || kind === 'mote' || kind === 'wisp') {
        p.x = rc.x + Math.random() * rc.w; p.y = rc.y + rc.h * (.55 + Math.random() * .45); p.vx = (Math.random() - .5) * 14; p.vy = -(kind === 'mote' ? 8 : 16 + Math.random() * 28); p.life = .9 + Math.random() * 1.2; p.s = kind === 'wisp' ? 2.4 : 1 + Math.random() * 1.6;
      } else { p.x = rc.x + rc.w * (.08 + Math.random() * .84); p.y = rc.y + rc.h * (.06 + Math.random() * .8); p.vx = p.vy = 0; p.life = .8 + Math.random() * 1.1; p.s = 1.6 + Math.random() * 1.8; }
      P_.push(p);
    }
    function burst(i, r) {
      var rc = rects[i]; if (!rc) return; var n = (r >= 4 ? 34 : r >= 2 ? 20 : 9) * (low ? .5 : 1), cx = rc.x + rc.w / 2, cy = rc.y + rc.h / 2, cols = r === 5 ? ['#62f4ff', '#c9a0ff', '#fff'] : r === 4 ? ['#ffd27a', '#ff8a2a', '#fff2b0'] : [THEME[r].c, '#fff'];
      for (var k = 0; k < n && P_.length < CAP + 40; k++) { var a = Math.random() * 6.283, sp = 70 + Math.random() * (r >= 4 ? 260 : 170); P_.push({ t: 0, k: 'b', x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: .5 + Math.random() * .6, s: 1.6 + Math.random() * 2.2, col: pick(cols) }); }
    }
    function frameLoop(ts) {
      if (!win.isConnected) { if (ro) ro.disconnect(); mo.disconnect(); window.removeEventListener('resize', layout); return; }
      requestAnimationFrame(frameLoop);
      if (rm || document.hidden || !stage.offsetParent) return;
      if (ts - last < 32) return; var dt = Math.min(.08, (ts - last) / 1000); last = ts;
      var W = cv.width, Hc = cv.height; ctx2.setTransform(1, 0, 0, 1, 0, 0); ctx2.clearRect(0, 0, W, Hc); ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
      cardEls.forEach(function (e, i) { var sp = SP[cards[i].r | 0], rate = sp[0] * dt * (e.classList.contains('on') ? .55 : 1) * (low ? .5 : 1); if (Math.random() < rate) spawn(i, sp[1], sp[2]); });
      ctx2.globalCompositeOperation = 'lighter';
      for (var j = P_.length - 1; j >= 0; j--) {
        var p = P_[j]; p.t += dt; if (p.t >= p.life) { P_.splice(j, 1); continue; }
        var u = p.t / p.life, al = p.k === 'tw' ? Math.sin(u * 3.1416) : p.k === 'b' ? 1 - u : Math.sin(u * 3.1416) * .9;
        if (p.k === 'b') { p.vx *= .93; p.vy *= .93; }
        p.x += p.vx * dt + (p.k === 'ember' ? Math.sin(p.t * 6 + j) * .25 : 0); p.y += p.vy * dt;
        ctx2.globalAlpha = Math.max(0, al); ctx2.fillStyle = p.col;
        if (p.k === 'tw') { var s = p.s * (.6 + al * .6); ctx2.fillRect(p.x - s * 1.4, p.y - .5, s * 2.8, 1); ctx2.fillRect(p.x - .5, p.y - s * 1.4, 1, s * 2.8); ctx2.fillRect(p.x - s * .35, p.y - s * .35, s * .7, s * .7); }
        else { ctx2.beginPath(); ctx2.arc(p.x, p.y, p.s * (p.k === 'b' ? 1 - u * .5 : 1), 0, 6.283); ctx2.fill(); }
      }
      ctx2.globalAlpha = 1;
    }

    /* revelação */
    var banner = stage.querySelector('.rcx-banner'), sflash = stage.querySelector('.rcx-sflash'), seen = cardEls.map(function (e) { return e.classList.contains('on'); });
    function restart(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
    function reveal(i) {
      var el = cardEls[i], r = cards[i].r | 0; if (!el) return;
      if (rm) return;
      el.classList.add('rcx-up'); restart(el, 'rcx-popping');
      var b = mk('div', 'rcx-burst', '<i class="rcx-flash"></i><i class="rcx-ring"></i><i class="rcx-rays"></i>'); el.appendChild(b);
      setTimeout(function () { b.remove(); el.classList.remove('rcx-up'); el.classList.remove('rcx-popping'); }, 1700);
      setTimeout(function () { if (win.isConnected) burst(i, r); }, 260);
      if (r >= 4) {
        banner.className = 'rcx-banner r' + r; banner.firstChild.textContent = BANNER[r]; restart(banner, 'go');
        sflash.className = 'rcx-sflash r' + r; restart(sflash, 'go');
      }
    }
    var mo = new MutationObserver(function (muts) {
      if (!win.isConnected) { mo.disconnect(); return; }
      muts.forEach(function (m) { var i = cardEls.indexOf(m.target); if (i < 0) return; var on = m.target.classList.contains('on'); if (on && !seen[i]) reveal(i); seen[i] = on; });
      sync();
    });
    cardEls.forEach(function (e) { mo.observe(e, { attributes: true, attributeFilter: ['class'] }); });
    requestAnimationFrame(function () { layout(); requestAnimationFrame(frameLoop); });
  }

  var prev = G.UI.offlineModal;
  G.UI.offlineModal = function () {
    var r = prev.apply(this, arguments), a = arguments;
    try { var w = document.querySelector('#modal .mbox.aurora-return-window'); if (w && !w.classList.contains('rcx-on')) setup(w, a[0]); }
    catch (e) { try { console.warn('return-cards', e); } catch (e2) {} }
    return r;
  };
  G.UI.offlineModal.__rc = 1;
})();
