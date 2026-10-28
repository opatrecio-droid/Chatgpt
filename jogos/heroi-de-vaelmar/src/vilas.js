/* ===== Vilas com construções oficiais, moradores e animais (v3.27.3) =====
   Cada cidade passa a ter várias construções do catálogo (as mesmas artes do "Construa sua cidade de origem"),
   que bloqueiam o caminho, e moradores e animais que circulam pela praça. Referência: ESPECIFICACAO-TELAS.md. */
(() => {
  /* caixa útil (x0, y0, x1, y1) de cada sprite 128 × 128, medida no catálogo */
  const BB = {"adventureguild":[0,0,127,128],"alchemist":[22,36,103,103],"ascension":[28,19,105,103],"appraiser":[45,59,86,107],"bazaar":[0,4,128,127],"bestiary":[25,49,107,112],"blacksmith":[22,36,107,112],"bladesguild":[19,27,109,101],"castle":[0,0,128,128],"anguish":[1,4,127,126],"citadel":[20,0,108,114],"coliseum":[6,16,123,108],"conquerorguild":[4,13,121,123],"demonologist":[16,26,111,116],"fishinghut":[28,59,82,107],"fortress":[1,24,128,105],"market":[9,21,121,101],"herbalist":[23,45,106,112],"inn":[3,18,126,121],"jeweller":[20,31,104,112],"keep":[21,44,121,100],"kingsguard":[0,0,128,120],"monumentguild":[6,3,124,128],"oracle":[17,37,119,104],"outpost":[10,17,124,116],"refinery":[13,13,105,112],"residence":[45,49,86,107],"shop":[23,38,104,112],"spelunkingguild":[27,42,101,97],"titanworkshop":[23,0,105,107],"townhall":[12,37,116,107],"travelerguild":[0,14,127,125],"wayvessel":[34,38,93,90]};
  const SC = 1.15; /* escala em pixels do mundo */
  const SERVICE = { shop: 'shop', town_hall: 'townhall', blacksmith: 'blacksmith', bestiary: 'bestiary', inn: 'inn', alchemist: 'alchemist', jeweller: 'jeweller',
    temple: 'oracle', spell_shop: 'oracle', herbalist: 'herbalist', bazaar: 'market', coliseum: 'townhall', demonforge: 'demonologist' };

  /* ---------- sprites ---------- */
  const cache = new Map();
  function buildingCanvas(id) {
    if (cache.has(id)) return cache.get(id);
    const b = BB[id], row = Catalog.byKey['buildings_' + id], w = Math.round((b[2] - b[0]) * SC), h = Math.round((b[3] - b[1]) * SC);
    const c = document.createElement('canvas'); c.width = w; c.height = h; cache.set(id, c);
    const file = row && AETHRIC_DATA.assets[row.sprite];
    if (file) { const im = new Image(); im.onload = () => { const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(im, b[0], b[1], b[2] - b[0], b[3] - b[1], 0, 0, w, h); }; im.src = file; }
    return c;
  }
  const baseSpr = spr;
  spr = function (key, pal, flip) {
    if (typeof key === 'string') {
      if (key.startsWith('b:')) return buildingCanvas(key.slice(2));
      if (key.startsWith('n:')) { const row = Catalog.byKey[key.slice(2)]; if (row) return Catalog.sprite(row.sprite, key.startsWith('n:p_') ? 22 : 26, flip); }
    }
    return baseSpr(key, pal, flip);
  };

  /* ---------- layouts: construções por cidade, em tiles a partir do centro ---------- */
  const SLOTS = [[0, -2.2], [-3.4, -.6], [3.4, -.6], [-2.6, 1.6], [2.6, 1.6]]; /* fundo, esquerda, direita, frente */
  const wide = id => (BB[id][2] - BB[id][0]) * SC;
  function layoutFor(p) {
    const ids = [];
    for (const s of p.services || []) if (SERVICE[s] && !ids.includes(SERVICE[s])) ids.push(SERVICE[s]);
    if (ids.length < 3) for (const extra of ['residence', 'residence', 'appraiser']) if (ids.length < 3) ids.push(extra);
    const picked = ids.sort((a, b) => wide(b) - wide(a)).slice(0, 4);
    return picked.map((id, i) => ({ id, dx: SLOTS[i][0], dy: SLOTS[i][1] }));
  }
  const VILLAGERS = ['c_1', 'c_2', 'c_0', 'c_4', 'c_86', 'c_92', 'c_93', 'c_5'];

  /* ---------- obstáculos ---------- */
  const BLOCK = new Set();
  const baseWalk = walkTile;
  walkTile = (tx, ty) => !BLOCK.has(ty * WW + tx) && baseWalk(tx, ty);
  function blockFootprint(x, y, w, h) { /* x, y = centro da base */
    const x0 = Math.floor((x - w * .46) / TILE), x1 = Math.floor((x + w * .46) / TILE), y0 = Math.floor((y - h * .38) / TILE), y1 = Math.floor((y - 2) / TILE);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) BLOCK.add(ty * WW + tx);
  }

  /* ---------- clareira maior em volta das cidades ---------- */
  const baseGen = genWorld;
  genWorld = () => {
    baseGen();
    for (const p of POIS) if (p.kind === 'town') for (let y = p.ty - 6; y <= p.ty + 5; y++) for (let x = p.tx - 6; x <= p.tx + 6; x++) {
      if (Math.hypot(x - p.tx, (y - p.ty) * 1.1) > 6.2) continue;
      const t = tAt(x, y); if (t === T.FOREST || t === T.DFOREST || t === T.CLIFF || t === T.ROCKY) setT(x, y, T.GRASS);
    }
    CHUNKS.clear();
  };

  /* ---------- entidades ---------- */
  const NPCS = new Map();
  function villagers(p) {
    if (NPCS.has(p.id)) return NPCS.get(p.id);
    const c = poiPx(p), n = p.tier >= 4 ? 4 : 3, list = [];
    for (let i = 0; i < n; i++) {
      const key = VILLAGERS[Math.floor(hn(p.tx, p.ty, 200 + i) * VILLAGERS.length)];
      list.push({ k: 'n:' + key, x: c.x + (hn(i, p.tx, 210) - .5) * 96, y: c.y + 30 + hn(i, p.ty, 211) * 40, hx: c.x, hy: c.y + 50, t: hn(i, p.id.length, 212) * 3, tx: null, ty: null, npc: true, flip: false, poi: p });
    }
    if (p.tier <= 2) list.push({ k: 'n:p_dog', x: c.x - 20, y: c.y + 48, hx: c.x, hy: c.y + 50, t: 1, tx: null, ty: null, npc: true, flip: false, poi: p, fast: true });
    NPCS.set(p.id, list); return list;
  }
  const baseBuild = buildPoiEnts;
  buildPoiEnts = () => {
    baseBuild(); BLOCK.clear();
    EX.ents = EX.ents.filter(e => !(e.poi && e.poi.kind === 'town' && /^(house|hut)/.test(e.k)));
    for (const p of POIS) {
      if (p.kind !== 'town') continue;
      const c = poiPx(p);
      for (const b of layoutFor(p)) {
        const w = Math.round((BB[b.id][2] - BB[b.id][0]) * SC), h = Math.round((BB[b.id][3] - BB[b.id][1]) * SC), x = c.x + b.dx * TILE, y = c.y + b.dy * TILE + h * .5;
        EX.ents.push({ k: 'b:' + b.id, x, y, poi: p, bid: b.id }); blockFootprint(x, y, w, h);
      }
      for (const n of villagers(p)) EX.ents.push(n);
    }
  };

  /* ---------- moradores circulando ---------- */
  const baseTick = exTick;
  exTick = now => {
    if (cur === 'world' && S && !busy) {
      const dt = Math.min(.05, (now - (EX.last || now)) / 1000);
      for (const list of NPCS.values()) for (const n of list) {
        if (Math.hypot(n.x - H.x, n.y - H.y) > 420) continue;
        n.t -= dt;
        if (n.tx == null) {
          if (n.t > 0) continue;
          const a = hn(Math.floor(now / 700), n.x | 0, 220) * 6.283, d = 20 + hn(n.y | 0, Math.floor(now / 900), 221) * 50;
          const tx = n.hx + Math.cos(a) * d * 1.3, ty = n.hy + Math.sin(a) * d * .7, [wx, wy] = tileOf(tx, ty);
          if (walkTile(wx, wy) && !BLOCK.has(wy * WW + wx)) { n.tx = tx; n.ty = ty; } else n.t = .5;
        } else {
          const dx = n.tx - n.x, dy = n.ty - n.y, dist = Math.hypot(dx, dy), s = (n.fast ? 34 : 17) * dt;
          if (dist <= s) { n.x = n.tx; n.y = n.ty; n.tx = n.ty = null; n.t = 1 + hn(n.x | 0, n.y | 0, 230) * 3.5; }
          else {
            const nx = n.x + dx / dist * s, ny = n.y + dy / dist * s, [wx, wy] = tileOf(nx, ny);
            if (walkTile(wx, wy)) { n.x = nx; n.y = ny; if (Math.abs(dx) > .4) n.flip = dx < 0; } else { n.tx = n.ty = null; n.t = 1; }
          }
        }
      }
    }
    baseTick(now);
  };
})();
