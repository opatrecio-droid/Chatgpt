/* 20-world: mapa fixo de Aurora (tiles), adereços e busca de caminho. Sem DOM. */
'use strict';
(function () {
  const W = 88, H = 108;
  const T = { GRASS: 0, FOREST: 1, PATH: 2, COBBLE: 3, WATER: 4, RUIN: 5, WASTE: 6, SWAMP: 7, SNOW: 8, ASH: 9, FIELD: 10, WALL: 11, BRIDGE: 12, LAVA: 13, MATA: 14, CRATER: 15, POOL: 16, GARDEN: 17, ICE: 18 };
  const world = (G.W = { w: W, h: H, T, tile: new Uint8Array(W * H), walk: new Uint8Array(W * H), zone: new Int8Array(W * H).fill(-1), props: [], lamps: [], houses: [], fields: [] });
  const I = (x, y) => y * W + x;
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const TOWN = (world.town = { x0: 28, y0: 40, x1: 59, y1: 67 });
  const MEADOW = { x0: 22, y0: 34, x1: 72, y1: 75 };
  const MATA = (world.mata = { rect: [67, 6, 85, 33] });
  const ZTILE = { forest: T.FOREST, ruin: T.RUIN, waste: T.WASTE, swamp: T.SWAMP, snow: T.SNOW, ash: T.ASH };

  /* ruído de valor 2D determinístico (bordas orgânicas) */
  const nz = (x, y, s) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const h = (a, b) => { let n = Math.imul(a + s * 131, 374761393) ^ Math.imul(b + s * 17, 668265263); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return G.lerp(G.lerp(h(xi, yi), h(xi + 1, yi), u), G.lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v);
  };
  world.noise = nz;

  world.init = () => {
    const R = G.seeded(20260611);
    const tile = world.tile, walk = world.walk, zone = world.zone;
    tile.fill(T.FOREST); walk.fill(0); zone.fill(-1);
    world.props.length = 0; world.lamps.length = 0; world.houses.length = 0; world.fields.length = 0;
    const blockedProp = new Uint8Array(W * H);
    const set = (x, y, t, w) => { if (inb(x, y)) { tile[I(x, y)] = t; walk[I(x, y)] = w ? 1 : 0; } };
    const rect = (x0, y0, x1, y1, t, w) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, t, w); };
    const prop = (t, x, y, block, v) => { world.props.push({ t, x, y, v: v == null ? Math.floor(R() * 4) : v }); if (block && inb(Math.floor(x), Math.floor(y))) { walk[I(Math.floor(x), Math.floor(y))] = 0; blockedProp[I(Math.floor(x), Math.floor(y))] = 1; } };

    /* campina em volta da cidade */
    for (let y = MEADOW.y0; y <= MEADOW.y1; y++) for (let x = MEADOW.x0; x <= MEADOW.x1; x++) set(x, y, T.GRASS, 1);

    /* zonas de caça: bordas onduladas */
    const fillZone = (r, t, zi) => {
      for (let y = r[1] - 1; y <= r[3] + 1; y++) for (let x = r[0] - 1; x <= r[2] + 1; x++) {
        if (!inb(x, y) || x < 2 || y < 2 || x > W - 3 || y > H - 3) continue;
        const dEdge = Math.min(x - r[0], r[2] - x, y - r[1], r[3] - y);
        const wob = (nz(x * 0.35, y * 0.35, zi + 3) - 0.5) * 2.6;
        if (dEdge + wob >= -0.4) { set(x, y, t, 1); if (dEdge >= 0) zone[I(x, y)] = zi; }
      }
    };
    G.ZONES.forEach((z, i) => fillZone(z.rect, ZTILE[z.tile], i));
    fillZone(G.CRATER.rect, T.CRATER, 7);
    fillZone(MATA.rect, T.MATA, 9);

    /* rio: desce do norte e vira para leste */
    for (let y = 0; y <= 36; y++) { const wx = 65 + Math.round((nz(y * 0.22, 3, 9) - 0.5) * 1.2); set(wx, y, T.WATER, 0); set(wx + 1, y, T.WATER, 0); if (y > 33) set(wx - 1, y, T.GRASS, 1); }
    for (let x = 65; x < W; x++) { const wy = 35 + Math.round((nz(x * 0.22, 7, 9) - 0.5) * 1.0); set(x, wy, T.WATER, 0); set(x, wy + 1, T.WATER, 0); }
    /* lagoa do bosque, poças do pântano, lava e gelo */
    const blob = (cx, cy, rx, ry, t, w, s) => { for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) { const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + (nz(x * 0.5, y * 0.5, s) - 0.5) * 0.5; if (d < 1 && inb(x, y)) set(x, y, t, w); } };
    blob(55, 25, 3.4, 2.4, T.WATER, 0, 21); blob(31, 14, 2.4, 1.8, T.WATER, 0, 22);
    blob(77, 46, 2.2, 1.8, T.POOL, 0, 23); blob(82, 57, 2.0, 2.6, T.POOL, 0, 24); blob(76, 62, 1.8, 1.5, T.POOL, 0, 25);
    blob(72, 84, 2.0, 1.6, T.LAVA, 0, 26); blob(81, 88, 2.4, 1.8, T.LAVA, 0, 27); blob(74, 98, 1.8, 1.4, T.LAVA, 0, 28);
    blob(14, 24, 3.2, 2.2, T.ICE, 1, 29); blob(7, 17, 1.8, 1.5, T.ICE, 1, 30);
    blob(12, 90, 3.0, 2.2, T.CRATER, 1, 31);

    /* corredores entre zonas e estradas */
    const road = (pts, t, wide) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
        const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
        for (let k = 0; k <= n; k++) {
          const x = Math.round(ax + ((bx - ax) * k) / (n || 1)), y = Math.round(ay + ((by - ay) * k) / (n || 1));
          for (let dy = 0; dy < wide; dy++) for (let dx = 0; dx < wide; dx++) {
            const xx = x + dx, yy = y + dy; if (!inb(xx, yy)) continue;
            const cur = tile[I(xx, yy)];
            if (cur === T.WATER) set(xx, yy, T.BRIDGE, 1); else if (cur !== T.COBBLE && cur !== T.WALL) set(xx, yy, t, 1);
          }
        }
      }
    };
    road([[43, 30], [43, 39]], T.PATH, 2);           // norte -> Bosque
    road([[43, 68], [43, 78]], T.PATH, 2);           // sul -> Ermos
    road([[19, 53], [27, 53]], T.PATH, 2);           // oeste -> Ruínas
    road([[60, 53], [74, 53]], T.PATH, 2);           // leste -> Pântano
    road([[69, 53], [69, 28]], T.PATH, 2);           // fazenda -> ponte -> Mata
    road([[66, 49], [66, 52]], T.PATH, 1);           // porta da fazenda
    road([[25, 55], [25, 76], [11, 76]], T.PATH, 2); // pedreira e cratera
    road([[21, 19], [25, 19]], T.PATH, 2);           // Pico <-> Bosque
    road([[11, 33], [11, 39]], T.PATH, 2);           // Pico <-> Ruínas
    road([[11, 69], [11, 78]], T.PATH, 2);           // Ruínas <-> Cratera
    road([[20, 88], [25, 88]], T.PATH, 2);           // Cratera <-> Ermos
    road([[62, 88], [68, 88]], T.PATH, 2);           // Ermos <-> Cinzas
    road([[79, 71], [79, 78]], T.PATH, 2);           // Pântano <-> Cinzas
    /* trilhas internas até o covil do chefe */
    road([[43, 30], [43, 13]], T.PATH, 1); road([[19, 54], [9, 54]], T.PATH, 1); road([[43, 78], [43, 96]], T.PATH, 1);
    road([[74, 54], [80, 54], [80, 65]], T.PATH, 1); road([[21, 20], [10, 20], [10, 12]], T.PATH, 1); road([[68, 89], [78, 89], [78, 95]], T.PATH, 1);

    /* cidade */
    rect(TOWN.x0 + 1, TOWN.y0 + 1, TOWN.x1 - 1, TOWN.y1 - 1, T.COBBLE, 1);
    for (let x = TOWN.x0; x <= TOWN.x1; x++) { set(x, TOWN.y0, T.WALL, 0); set(x, TOWN.y1, T.WALL, 0); }
    for (let y = TOWN.y0; y <= TOWN.y1; y++) { set(TOWN.x0, y, T.WALL, 0); set(TOWN.x1, y, T.WALL, 0); }
    [[43, 40], [44, 40], [43, 67], [44, 67], [28, 53], [28, 54], [59, 53], [59, 54]].forEach(([x, y]) => set(x, y, T.COBBLE, 1));
    for (let y = TOWN.y0 + 1; y < TOWN.y1; y++) for (let x = TOWN.x0 + 1; x < TOWN.x1; x++) zone[I(x, y)] = 8;
    /* jardins */
    [[36, 48, 37, 51], [50, 48, 51, 51], [36, 56, 37, 59], [50, 56, 51, 59], [29, 41, 58, 41]].forEach((g) => rect(g[0], g[1], g[2], g[3], T.GARDEN, 1));
    rect(43, 41, 44, 41, T.COBBLE, 1);
    /* construções: base 6×4 bloqueada */
    world.plots = {};
    for (const id of G.BLD_IDS) {
      const d = G.BLD[id], [px, py] = d.plot;
      if (d.late) { world.plots[id] = { x: px, y: py, door: [px + 3, py + 4.45], cx: px + 3, cy: py + 2 }; continue; }
      for (let y = py; y < py + 4; y++) for (let x = px; x < px + 6; x++) { if (d.site) set(x, y, T.GRASS, 0); else walk[I(x, y)] = 0; }
      world.plots[id] = { x: px, y: py, door: [px + 3, py + 4.45], cx: px + 3, cy: py + 2 };
      if (d.site) { set(px + 2, py + 4, T.PATH, 1); set(px + 3, py + 4, T.PATH, 1); }
    }
    const latePlots = {}; for (const id of G.BLD_IDS) if (G.BLD[id].late) { latePlots[id] = world.plots[id]; delete world.plots[id]; }
    road([[23, 76], [23, 76]], T.PATH, 1);
    /* praça: fonte, portal, quadro de contratos, barracas */
    for (const [x, y] of [[43, 53], [44, 53], [43, 54], [44, 54]]) walk[I(x, y)] = 0;
    world.fountain = { x: 44, y: 54 };
    for (const [x, y] of [[39, 49], [40, 49], [41, 49]]) walk[I(x, y)] = 0;
    world.portal = { x: 40.5, y: 50, mouth: [40.5, 51.2] };
    world.board = { x: 47.5, y: 49.6, at: [47.5, 50.6] }; walk[I(47, 49)] = 0;
    prop('stall', 40.5, 58, false, 0); walk[I(40, 57)] = 0; walk[I(41, 57)] = 0;
    prop('stall', 47.5, 58, false, 1); walk[I(47, 57)] = 0; walk[I(48, 57)] = 0;
    world.plaza = { x0: 38, y0: 48, x1: 49, y1: 59, cx: 44, cy: 54 };
    world.idle = [[39.5, 53.5], [48.5, 53.5], [42, 56.5], [46, 56.5], [41, 52], [47, 52], [45.5, 51], [42.5, 58.6], [45.5, 58.6], [38.6, 56], [49.4, 56], [46, 49.6]];
    /* postes, bancos, barris */
    const lamp = (x, y) => { world.lamps.push({ x, y }); prop('lamp', x, y, false, 0); };
    [[38.3, 48.3], [49.7, 48.3], [38.3, 59.7], [49.7, 59.7], [42.4, 46.5], [45.6, 46.5], [42.4, 60.5], [45.6, 60.5], [36.5, 53], [51.5, 53], [29.6, 46.5], [58.4, 46.5], [29.6, 60.5], [58.4, 60.5], [42.4, 41.6], [45.6, 41.6], [42.4, 66.4], [45.6, 66.4], [29.6, 52.6], [58.4, 52.6]].forEach((p) => lamp(p[0], p[1]));
    [[41.8, 55.6, 'bench'], [46.2, 55.6, 'bench'], [36.5, 49.5, 'tree_town'], [36.5, 51.2, 'bush'], [51.5, 49.5, 'tree_town'], [50.6, 51.2, 'bush'], [36.5, 57.5, 'tree_town'], [51.5, 57.5, 'tree_town'], [37.3, 58.8, 'bush'], [50.4, 59, 'flowerbed'], [36.4, 55.6, 'flowerbed'],
      [35.8, 46.2, 'barrel'], [36.3, 46.6, 'crate'], [51.2, 52.4, 'crate'], [57.9, 52.3, 'barrel'], [29.4, 55.4, 'barrel'], [36.2, 60.2, 'crate'], [58.2, 60.3, 'barrel'], [51.3, 66.2, 'crate'], [44.9, 49.2, 'banner'], [42.1, 49.2, 'banner']].forEach((p) => prop(p[2], p[0], p[1], p[2].startsWith('tree'), null));
    for (let x = 29.5; x < 58.6; x += 1.45) { if (Math.abs(x - 44) < 1.6) continue; prop(R() < 0.5 ? 'hedge' : 'flowerbed', x, 41.7, false); }

    /* vila dos lavradores, plantações */
    [[62, 38], [62, 65], [67, 65], [54, 70], [31, 70], [50, 36], [35, 36], [36, 70]].forEach(([hx, hy], i) => {
      world.houses.push({ x: hx, y: hy, i, door: [hx + 2, hy + 3.4] });
      for (let y = hy; y < hy + 3; y++) for (let x = hx; x < hx + 4; x++) set(x, y, T.GRASS, 0);
      set(hx + 1, hy + 3, T.PATH, 1); set(hx + 2, hy + 3, T.PATH, 1);
    });
    [[63, 57, 66, 59], [68, 57, 71, 59], [63, 61, 66, 63], [68, 61, 71, 63]].forEach((f, i) => { rect(f[0], f[1], f[2], f[3], T.FIELD, 1); world.fields.push({ x0: f[0], y0: f[1], x1: f[2], y1: f[3], crop: i % 2 }); });
    prop('scarecrow', 67.5, 60.6, false, 0); prop('well', 65.5, 43.4, true, 0); prop('haystack', 70.4, 47.2, true, 0); prop('haystack', 61.6, 50.4, true, 0);
    prop('woodpile', 75, 26.5, true, 0); prop('woodpile', 66.9, 28.6, false, 0); prop('minecart', 27, 73.6, true, 0); prop('rockpile', 19.2, 77, true, 0);

    /* vegetação e obstáculos por terreno */
    const free = (x, y) => inb(x, y) && walk[I(x, y)] === 1 && !blockedProp[I(x, y)];
    const near = (x, y, pts, r) => { for (const p of pts) if (Math.hypot(p[0] - x, p[1] - y) < r) return true; return false; };
    const keepClear = [];
    for (const z of G.ZONES) keepClear.push(z.lair);
    keepClear.push(G.CRATER.center);
    const DECO = {
      [T.GRASS]: [['tree_oak', 0.022, 1], ['bush', 0.02, 0], ['rock', 0.006, 1], ['flowers', 0.05, 0], ['tuft', 0.06, 0]],
      [T.FOREST]: [['tree_oak', 0.07, 1], ['tree_pine', 0.035, 1], ['bush', 0.035, 0], ['rock', 0.012, 1], ['mushroom', 0.02, 0], ['stump', 0.012, 1], ['tuft', 0.07, 0], ['flowers', 0.02, 0]],
      [T.MATA]: [['tree_oak', 0.08, 1], ['tree_pine', 0.05, 1], ['stump', 0.05, 1], ['bush', 0.03, 0], ['tuft', 0.06, 0]],
      [T.RUIN]: [['pillar', 0.035, 1], ['ruinwall', 0.025, 1], ['bones', 0.03, 0], ['tree_dead', 0.012, 1], ['rock', 0.02, 1], ['urn', 0.015, 0], ['tombstone', 0.018, 1]],
      [T.WASTE]: [['tree_dead', 0.03, 1], ['crystal', 0.03, 1], ['rock', 0.03, 1], ['bones', 0.03, 0], ['crack', 0.04, 0], ['web', 0.012, 0]],
      [T.SWAMP]: [['tree_willow', 0.055, 1], ['cattail', 0.06, 0], ['mushroom', 0.04, 0], ['rock', 0.012, 1], ['stump', 0.02, 1], ['lilypad', 0.02, 0]],
      [T.SNOW]: [['tree_snow', 0.06, 1], ['icespike', 0.03, 1], ['rock_snow', 0.025, 1], ['snowdrift', 0.05, 0]],
      [T.ASH]: [['tree_burnt', 0.04, 1], ['rock_ash', 0.035, 1], ['ember', 0.05, 0], ['bones', 0.03, 0], ['crack_lava', 0.035, 0]],
      [T.CRATER]: [['crystal', 0.06, 1], ['rock_ash', 0.03, 1], ['crack', 0.05, 0], ['riftshard', 0.02, 1]],
      [T.ICE]: [['icespike', 0.02, 1]],
    };
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
      if (!free(x, y)) continue;
      const t = tile[I(x, y)], list = DECO[t]; if (!list) continue;
      if (near(x, y, keepClear, 4.5)) continue;
      // manter livres os acessos às portas e aos portões
      let nearDoor = false;
      for (const id in world.plots) { const d = world.plots[id].door; if (Math.abs(d[0] - x) < 2.5 && Math.abs(d[1] - y) < 2.5) nearDoor = true; }
      for (const g in G.GATES) { const o = G.GATES[g]; if (Math.abs(o.x - x) < 3 && Math.abs(o.y - y) < 4) nearDoor = true; }
      for (const h of world.houses) if (Math.abs(h.door[0] - x) < 2 && Math.abs(h.door[1] - y) < 2) nearDoor = true;
      const r = R();
      let acc = 0;
      for (const [name, p, block] of list) {
        acc += p;
        if (r < acc) {
          if (block && nearDoor) break;
          // não fechar passagens estreitas: bloqueios só com vizinhos livres
          if (block) { let fr = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (free(x + dx, y + dy)) fr++; if (fr < 8) break; }
          prop(name, x + 0.5 + (block ? 0 : (R() - 0.5) * 0.6), y + 0.75 + (block ? 0 : (R() - 0.5) * 0.4), !!block);
          break;
        }
      }
    }
    /* mata fechada (intransitável): só a fileira de borda vira adereço; o miolo é pintado no terreno */
    world.dense = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (tile[I(x, y)] !== T.FOREST || walk[I(x, y)]) continue;
      if (blockedProp[I(x, y)]) continue;
      // terreno do miolo acompanha a zona vizinha (neve, cinza...)
      let kind = 'tree_oak', best = 99;
      for (const z of G.ZONES) { const r = z.rect; const d = Math.max(r[0] - x, x - r[2], r[1] - y, y - r[3], 0); if (d < best) { best = d; kind = { forest: 'tree_oak', ruin: 'tree_dead', waste: 'tree_dead', swamp: 'tree_willow', snow: 'tree_snow', ash: 'tree_burnt' }[z.tile]; if (d < 5) world.dense[I(x, y)] = ZTILE[z.tile]; } }
      if (best >= 5) kind = R() < 0.3 ? 'tree_pine' : 'tree_oak';
      let edge = false;
      for (let dy = -1; dy <= 2 && !edge; dy++) for (let dx = -1; dx <= 1; dx++) if (inb(x + dx, y + dy) && (walk[I(x + dx, y + dy)] || tile[I(x + dx, y + dy)] !== T.FOREST)) { edge = true; break; }
      if (edge) { if (R() < 0.8) world.props.push({ t: kind, x: x + 0.5 + (R() - 0.5) * 0.5, y: y + 0.8 + (R() - 0.5) * 0.3, v: Math.floor(R() * 4) }); }
      else world.dense[I(x, y)] = world.dense[I(x, y)] || 255;
    }
    /* terrenos tardios (v20): limpa a vegetação do lote e abre a porta sem mexer no sorteio do resto do mapa */
    for (const id in latePlots) {
      const pl = latePlots[id], px = pl.x, py = pl.y; world.plots[id] = pl;
      world.props = world.props.filter((p) => !(p.x > px - 0.6 && p.x < px + 6.6 && p.y > py - 0.4 && p.y < py + 6.2));
      for (let y = py - 1; y <= py + 5; y++) for (let x = px - 1; x <= px + 6; x++) { if (!inb(x, y)) continue; const i = I(x, y); if (blockedProp[i]) { blockedProp[i] = 0; walk[i] = 1; } if (tile[i] === T.FOREST && walk[i]) tile[i] = T.GRASS; }
      for (let y = py; y < py + 4; y++) for (let x = px; x < px + 6; x++) set(x, y, T.GRASS, 0);
      for (let x = px; x < px + 6; x++) { if (!walk[I(x, py + 4)]) set(x, py + 4, T.GRASS, 1); if (inb(x, py + 5) && !walk[I(x, py + 5)] && tile[I(x, py + 5)] !== T.WALL && tile[I(x, py + 5)] !== T.WATER) set(x, py + 5, T.GRASS, 1); }
      set(px + 2, py + 4, T.PATH, 1); set(px + 3, py + 4, T.PATH, 1);
    }
    world.blocked = blockedProp;
    world.ready = true;
    world._pcache = new Map();
  };

  /* ---------- consultas ---------- */
  world.walkable = (x, y) => { x = Math.floor(x); y = Math.floor(y); return x >= 0 && y >= 0 && x < W && y < H && world.walk[y * W + x] === 1; };
  world.zoneAt = (x, y) => { x = Math.floor(x); y = Math.floor(y); return inb(x, y) ? world.zone[y * W + x] : -1; };
  world.inTown = (x, y) => x > TOWN.x0 && x < TOWN.x1 + 1 && y > TOWN.y0 && y < TOWN.y1 + 1;
  world.nearestWalk = (x, y) => {
    if (world.walkable(x, y)) return [x, y];
    const fx = Math.floor(x), fy = Math.floor(y);
    for (let r = 1; r < 8; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      if (world.walkable(fx + dx, fy + dy)) return [fx + dx + 0.5, fy + dy + 0.5];
    }
    return [x, y];
  };
  world.randIn = (r, tries) => {
    for (let i = 0; i < (tries || 30); i++) {
      const x = G.rnd(r[0] + 1, r[2]), y = G.rnd(r[1] + 1, r[3]);
      if (world.walkable(x, y)) return [x, y];
    }
    return world.nearestWalk((r[0] + r[2]) / 2, (r[1] + r[3]) / 2);
  };
  world.los = (x0, y0, x1, y1) => {
    const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d * 3);
    for (let i = 1; i < n; i++) { const t = i / n; const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; if (!world.walkable(x, y) || !world.walkable(x + 0.28, y) || !world.walkable(x - 0.28, y) || !world.walkable(x, y + 0.28) || !world.walkable(x, y - 0.28)) return false; }
    return true;
  };

  /* ---------- A* em grade (8 direções, sem cortar quinas) ---------- */
  const N = W * H;
  const gScore = new Float32Array(N), came = new Int32Array(N), stamp = new Uint32Array(N), closed = new Uint32Array(N);
  let gen = 0;
  const heap = [];
  const hpush = (i, f) => { heap.push([f, i]); let c = heap.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (heap[p][0] <= heap[c][0]) break; const t = heap[p]; heap[p] = heap[c]; heap[c] = t; c = p; } };
  const hpop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let p = 0; for (;;) { const l = p * 2 + 1, r = l + 1; let m = p; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === p) break; const t = heap[p]; heap[p] = heap[m]; heap[m] = t; p = m; } } return top; };
  const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];

  world.path = (sx, sy, tx, ty) => {
    const walk = world.walk;
    let s = world.nearestWalk(sx, sy), t = world.nearestWalk(tx, ty);
    const si = Math.floor(s[1]) * W + Math.floor(s[0]), ti = Math.floor(t[1]) * W + Math.floor(t[0]);
    if (si === ti) return [[t[0], t[1]]];
    if (world.los(s[0], s[1], t[0], t[1])) return [[t[0], t[1]]];
    const key = si * N + ti;
    const hit = world._pcache.get(key);
    if (hit) return hit.map((p) => [p[0], p[1]]);
    gen++; heap.length = 0;
    const txi = ti % W, tyi = Math.floor(ti / W);
    gScore[si] = 0; stamp[si] = gen; came[si] = -1; hpush(si, 0);
    let found = false, guard = 0;
    while (heap.length && guard++ < 12000) {
      const cur = hpop()[1];
      if (cur === ti) { found = true; break; }
      if (closed[cur] === gen) continue; closed[cur] = gen;
      const cx = cur % W, cy = (cur / W) | 0;
      for (let d = 0; d < 8; d++) {
        const nx = cx + DIRS[d][0], ny = cy + DIRS[d][1];
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const ni = ny * W + nx;
        if (!walk[ni] || closed[ni] === gen) continue;
        if (d > 3 && (!walk[cy * W + nx] || !walk[ny * W + cx])) continue;
        const tt = world.tile[ni];
        const ng = gScore[cur] + DIRS[d][2] * (tt === T.PATH || tt === T.COBBLE || tt === T.BRIDGE ? 0.85 : 1.1);
        if (stamp[ni] !== gen || ng < gScore[ni]) {
          gScore[ni] = ng; stamp[ni] = gen; came[ni] = cur;
          const dx = Math.abs(nx - txi), dy = Math.abs(ny - tyi);
          hpush(ni, ng + (dx + dy - 0.59 * Math.min(dx, dy)) * 0.86);
        }
      }
    }
    if (!found) return [[t[0], t[1]]];
    const raw = [];
    for (let c = ti; c !== -1; c = came[c]) raw.push([(c % W) + 0.5, ((c / W) | 0) + 0.5]);
    raw.reverse(); raw[raw.length - 1] = [t[0], t[1]];
    /* alisamento por linha de visão */
    const out = []; let a = 0;
    let px = s[0], py = s[1];
    while (a < raw.length - 1) {
      let b = Math.min(raw.length - 1, a + 14);
      while (b > a + 1 && !world.los(px, py, raw[b][0], raw[b][1])) b--;
      out.push(raw[b]); px = raw[b][0]; py = raw[b][1]; a = b;
    }
    if (!out.length) out.push(raw[raw.length - 1]);
    if (world._pcache.size > 1500) world._pcache.clear();
    world._pcache.set(key, out);
    return out.map((p) => [p[0], p[1]]);
  };

  world.door = (id) => world.plots[id].door;
  world.gateFor = (zoneId) => G.GATES[G.ZONE[zoneId] ? G.ZONE[zoneId].gate : 's'];
})();

;
