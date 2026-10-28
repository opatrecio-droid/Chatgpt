/* ===== Mapa-múndi com névoa de exploração (v3.27.3) =====
   Fundo cinza; só o que o herói já viu aparece, em bege hachurado. Rótulos em versalete espaçado,
   cartão "Cidade" nas vilas, arrastar para mover, ✕ e ◇ (centralizar) embaixo e aba lateral com as
   viagens. Referência: ESPECIFICACAO-TELAS.md. */
(() => {
  const CELL = 6, VISION = 7; /* px por tile no mapa; raio de revelação em tiles */
  let EXPL = null, owner = null, dirty = false, lastX = -1e9, lastY = -1e9;

  /* ---------- exploração ---------- */
  const pack = a => { let s = ''; for (let i = 0; i < a.length; i += 6) { let v = 0; for (let k = 0; k < 6; k++) v = v * 2 + (a[i + k] || 0); s += String.fromCharCode(48 + v); } return s; };
  const unpack = (str, a) => { for (let i = 0, j = 0; i < str.length && j < a.length; i++, j += 6) { const v = str.charCodeAt(i) - 48; for (let k = 0; k < 6; k++) a[j + k] = (v >> (5 - k)) & 1; } };
  function reveal(tx, ty, r) {
    for (let dy = -r - 1; dy <= r + 1; dy++) for (let dx = -r - 1; dx <= r + 1; dx++) {
      const x = tx + dx, y = ty + dy; if (x < 0 || y < 0 || x >= WW || y >= WH) continue;
      if (Math.hypot(dx, dy) <= r + (hn(x, y, 300) - .5) * 2.2 && !EXPL[y * WW + x]) { EXPL[y * WW + x] = 1; dirty = true; }
    }
  }
  function ensure() {
    if (!S || S === owner) return;
    owner = S; EXPL = new Uint8Array(WW * WH);
    if (typeof S.explored === 'string' && S.explored.length) unpack(S.explored, EXPL);
    else { const [tx, ty] = tileOf(H.x, H.y); reveal(tx, ty, 9); for (const id of Object.keys(S.visited || {})) if (POI[id]) reveal(POI[id].tx, POI[id].ty, 7); reveal(POI.loton.tx, POI.loton.ty, 7); }
    lastX = lastY = -1e9;
  }
  const baseTick = exTick;
  exTick = now => {
    if (S && cur === 'world') { ensure(); if (Math.hypot(H.x - lastX, H.y - lastY) > 24) { lastX = H.x; lastY = H.y; const [tx, ty] = tileOf(H.x, H.y); reveal(tx, ty, VISION); } }
    baseTick(now);
  };
  const baseSave = save;
  save = () => { if (S && EXPL && owner === S && dirty) { S.explored = pack(EXPL); dirty = false; } return baseSave(); };
  window.explorado = (tx, ty) => { ensure(); return !!(EXPL && EXPL[ty * WW + tx]); };

  /* ---------- pintura do mapa ---------- */
  const COL = { [T.GRASS]: '#b5a784', [T.FOREST]: '#7f7560', [T.DFOREST]: '#6e6651', [T.DIRT]: '#d9cdb1', [T.WATER]: '#ccd5db', [T.SWAMP]: '#8f937b', [T.CLIFF]: '#5e5347',
    [T.ROCKY]: '#9b9280', [T.SAND]: '#d9c999', [T.BRIDGE]: '#a67f4d', [T.FLOOR]: '#9d988d' };
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  let terrainCanvas = null;
  function paintTerrain() {
    const W = WW * CELL, c = document.createElement('canvas'); c.width = c.height = W; const g = c.getContext('2d'), img = g.createImageData(W, W), buf = img.data;
    for (let ty = 0; ty < WH; ty++) for (let tx = 0; tx < WW; tx++) {
      if (!EXPL[ty * WW + tx]) continue;
      const t = TMAP[ty * WW + tx], base = rgb(COL[t] || COL[T.GRASS]);
      const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const x = tx + dx, y = ty + dy; return x < 0 || y < 0 || x >= WW || y >= WH || !EXPL[y * WW + x]; });
      for (let py = 0; py < CELL; py++) for (let px = 0; px < CELL; px++) {
        const X = tx * CELL + px, Y = ty * CELL + py, q = hn(X, Y, 310);
        if (edge && q < .22) continue;
        let k = 1; if (((X + Y) & 3) === 0) k = .86; else if (q > .93) k = 1.1; else if (q < .05) k = .8;
        const i = (Y * W + X) * 4; buf[i] = Math.min(255, base[0] * k); buf[i + 1] = Math.min(255, base[1] * k); buf[i + 2] = Math.min(255, base[2] * k); buf[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    g.strokeStyle = '#e6dcc4'; g.lineWidth = 3; g.lineCap = 'round'; g.lineJoin = 'round';
    for (const pts of (window.MAP_ROADS || [])) {
      g.beginPath(); let pen = false;
      for (const [x, y] of pts) { const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE); if (EXPL[ty * WW + tx] && TMAP[ty * WW + tx] !== T.WATER) { const X = x / TILE * CELL, Y = y / TILE * CELL; pen ? g.lineTo(X, Y) : g.moveTo(X, Y); pen = true; } else pen = false; }
      g.stroke();
    }
    return c;
  }

  /* ---------- rótulos no espaço da tela ---------- */
  const view = { x: 0, y: 0, z: 1 };
  const spaced = (g, text, x, y, sp) => { const ch = [...text], w = ch.reduce((a, c) => a + g.measureText(c).width + sp, -sp); let cx = x - w / 2; g.textAlign = 'left'; for (const c of ch) { g.strokeText(c, cx, y); g.fillText(c, cx, y); cx += g.measureText(c).width + sp; } };
  function drawLabels() {
    const cv = document.getElementById('mp-labels'); if (!cv) return; const g = cv.getContext('2d'), dpr = devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== w * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    const sx = tx => view.x + tx * CELL * view.z, sy = ty => view.y + ty * CELL * view.z;
    g.lineJoin = 'round'; g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowBlur = 3;
    /* regiões: centro dos tiles explorados */
    g.font = '600 ' + Math.round(10 + view.z) + 'px Cinzel, Georgia, serif'; g.strokeStyle = 'rgba(30,26,22,.9)'; g.lineWidth = 3; g.fillStyle = '#d9d0bd';
    const acc = {}; for (let y = 0; y < WH; y += 2) for (let x = 0; x < WW; x += 2) if (EXPL[y * WW + x]) { const z = ZGRID[y * WW + x]; if (z === '~') continue; const a = acc[z] || (acc[z] = [0, 0, 0]); a[0] += x; a[1] += y; a[2]++; }
    for (const z in acc) if (acc[z][2] > 14) spaced(g, ZONES[z].n.split(' / ')[0].toUpperCase(), sx(acc[z][0] / acc[z][2]), sy(acc[z][1] / acc[z][2]), 3);
    /* lugares */
    for (const p of POIS) {
      if (!EXPL[p.ty * WW + p.tx]) continue; const x = sx(p.tx + .5), y = sy(p.ty + .5);
      if (p.kind === 'town' || p.kind === 'origin') {
        g.fillStyle = '#c8483a'; g.fillRect(x - 6, y - 12, 12, 5); g.fillStyle = '#efe3c4'; g.fillRect(x - 5, y - 7, 10, 7);
        g.font = '500 10px Alegreya Sans, sans-serif'; g.fillStyle = '#e6dcc9'; g.lineWidth = 2.5; spaced(g, 'Cidade', x, y + 11, 2);
        g.font = '700 ' + Math.round(11 + 1.6 * view.z) + 'px Cinzel, Georgia, serif'; g.fillStyle = '#fbf3df'; g.lineWidth = 3; spaced(g, (p.kind === 'origin' ? 'Cidade de origem' : p.n).toUpperCase(), x, y + 28, 2);
      } else {
        g.fillStyle = p.kind === 'arena' ? '#f0b94a' : p.kind === 'waygate' ? '#5ab0f0' : '#d8423c'; g.beginPath(); g.moveTo(x, y - 8); g.lineTo(x + 7, y + 5); g.lineTo(x - 7, y + 5); g.fill();
        g.font = '600 10px Cinzel, Georgia, serif'; g.fillStyle = '#efe6d2'; g.lineWidth = 3; spaced(g, p.n.toUpperCase(), x, y + 19, 1);
      }
    }
    const hx = sx(H.x / TILE), hy = sy(H.y / TILE); g.shadowBlur = 0; g.fillStyle = '#1a120c'; g.beginPath(); g.arc(hx, hy, 7, 0, 7); g.fill(); g.fillStyle = '#f0b94a'; g.beginPath(); g.arc(hx, hy, 4.5, 0, 7); g.fill();
  }
  function apply() {
    const c = document.getElementById('mp-map'); if (!c) return;
    c.style.transform = 'translate(' + view.x + 'px,' + view.y + 'px) scale(' + view.z + ')'; drawLabels();
  }
  function center() {
    const wrap = document.getElementById('mp-wrap'); if (!wrap) return;
    view.x = wrap.clientWidth / 2 - H.x / TILE * CELL * view.z; view.y = wrap.clientHeight / 2 - H.y / TILE * CELL * view.z; apply();
  }

  /* ---------- tela ---------- */
  function vMapa() {
    return '<div class="mp-wrap" id="mp-wrap"><canvas id="mp-map"></canvas><canvas id="mp-labels"></canvas><div class="mp-card" id="mp-card" hidden></div>' +
      '<button class="mp-center" id="mp-center" type="button" aria-label="Centralizar no herói"><i></i></button><button class="mp-tab" id="mp-tab" type="button" aria-label="Viagens">›</button>' +
      '<div class="mp-list" id="mp-list" hidden><h3>Viajar</h3>' + POIS.filter(p => p.kind === 'town' || p.kind === 'origin').map(p => '<button class="btn" data-act="worldtravel" data-id="' + p.id + '" ' + (S.lvl < p.minLv || !S.visited?.[p.id] ? 'disabled' : '') + '><b>' + p.n + '</b><small>Nível ' + p.minLv + (S.visited?.[p.id] ? ' · visitado' : '') + '</small></button>').join('') + '</div></div>';
  }
  function afterMapa() {
    ensure(); const c = document.getElementById('mp-map'); if (!c) return;
    const t = paintTerrain(); c.width = t.width; c.height = t.height; c.getContext('2d').drawImage(t, 0, 0);
    const wrap = document.getElementById('mp-wrap'); view.z = 3; center();
    /* arrastar e pinçar */
    const ptr = new Map(); let start = null;
    wrap.addEventListener('pointerdown', e => { if (e.target.closest('button,.mp-list')) return; wrap.setPointerCapture(e.pointerId); ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); start = null; });
    wrap.addEventListener('pointermove', e => {
      if (!ptr.has(e.pointerId)) return; const p = ptr.get(e.pointerId);
      if (ptr.size === 1) { view.x += e.clientX - p.x; view.y += e.clientY - p.y; }
      else if (ptr.size === 2) { const [a, b] = [...ptr.values()], o = Math.hypot(a.x - b.x, a.y - b.y); ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); const [a2, b2] = [...ptr.values()], n = Math.hypot(a2.x - b2.x, a2.y - b2.y); zoom(n / (o || 1), (a2.x + b2.x) / 2, (a2.y + b2.y) / 2); return; }
      ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); apply();
    });
    const up = e => { ptr.delete(e.pointerId); }; wrap.addEventListener('pointerup', up); wrap.addEventListener('pointercancel', up);
    wrap.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY < 0 ? 1.15 : .87, e.clientX, e.clientY); }, { passive: false });
    function zoom(f, cx, cy) { const nz = clamp(view.z * f, 1.2, 5), k = nz / view.z, r = wrap.getBoundingClientRect(); view.x = cx - r.left - (cx - r.left - view.x) * k; view.y = cy - r.top - (cy - r.top - view.y) * k; view.z = nz; apply(); }
    document.getElementById('mp-center').addEventListener('click', center);
    document.getElementById('mp-tab').addEventListener('click', () => { const l = document.getElementById('mp-list'); l.hidden = !l.hidden; });
    addEventListener('resize', center);
  }
  VIEWS.map = { r: vMapa, after: afterMapa };
})();
