/* Aurora 046 · Colisão dos objetos da cidade.
   No 045 só árvores, poço, fardos de feno e barracas bloqueavam o chão; bancos, barris, caixotes, postes, canteiros,
   cercas vivas, estandartes, lenha e carrinho eram atravessados por heróis e moradores. Aqui cada objeto sólido
   bloqueia os tiles que a sua arte ocupa (pela largura real do desenho). Uma checagem de conectividade desfaz
   qualquer bloqueio que isolaria uma parte do mapa, e nenhum ponto de destino (portas, lugares de espera, boca do
   portal, quadro de contratos) é bloqueado. Só mexe na grade de caminhada (W.walk), depois de W.init. */
(function () {
  'use strict';
  if (typeof G === 'undefined' || !G.W || typeof G.W.init !== 'function') return;
  const W = G.W;
  /* meia largura (em tiles) da base sólida de cada tipo de objeto; a profundidade é a linha do pé */
  const SOLID = { bench: 0.72, barrel: 0.3, crate: 0.36, lamp: 0.16, banner: 0.16, flowerbed: 0.55, bush: 0.42, hedge: 0.62,
    woodpile: 0.8, minecart: 0.62, rockpile: 0.6, stall: 0.95, well: 0.6, haystack: 0.6, scarecrow: 0 };

  const apply = () => {
    const w = W.w, h = W.h || Math.floor(W.walk.length / w), walk = W.walk, I = (x, y) => y * w + x;
    const inb = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
    /* tiles que nunca podem ser bloqueados: destinos de quem anda pela cidade */
    const keep = new Set(), keepPt = (p) => { if (p && isFinite(p[0]) && isFinite(p[1])) for (let dy = -0.3; dy <= 0.3; dy += 0.3) for (let dx = -0.3; dx <= 0.3; dx += 0.3) keep.add(I(Math.floor(p[0] + dx), Math.floor(p[1] + dy))); };
    for (const id in W.plots || {}) keepPt(W.plots[id].door);
    for (const hs of W.houses || []) keepPt(hs.door);
    for (const p of W.idle || []) keepPt(p);
    if (W.portal) keepPt(W.portal.mouth);
    if (W.board) keepPt(W.board.at);
    /* conectividade: tiles alcançáveis a partir da praça */
    const c = W.plaza ? [Math.floor(W.plaza.cx), Math.floor(W.plaza.cy) + 2] : [44, 56];
    const start = (() => { for (let r = 0; r < 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (inb(c[0] + dx, c[1] + dy) && walk[I(c[0] + dx, c[1] + dy)]) return I(c[0] + dx, c[1] + dy); return -1; })();
    if (start < 0) return 0;
    const seen = new Uint8Array(walk.length), q = new Int32Array(walk.length);
    const reach = () => {
      seen.fill(0); let a = 0, b = 0, n = 0; q[b++] = start; seen[start] = 1;
      while (a < b) { const i = q[a++], x = i % w, y = (i / w) | 0; n++;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (!inb(nx, ny)) continue; const j = I(nx, ny); if (!seen[j] && walk[j]) { seen[j] = 1; q[b++] = j; } } }
      return n;
    };
    let total = reach(), blocked = 0;
    for (const p of W.props || []) {
      const hw = SOLID[p.t]; if (hw == null || hw <= 0) continue;
      const ty = Math.floor(p.y - 0.05), tiles = [];
      for (let tx = Math.floor(p.x - hw + 0.18); tx <= Math.floor(p.x + hw - 0.18); tx++) {
        if (!inb(tx, ty)) continue; const i = I(tx, ty);
        if (walk[i] && seen[i] && !keep.has(i)) tiles.push(i);
      }
      if (!tiles.length) continue;
      for (const i of tiles) walk[i] = 0;
      const n = reach();
      if (n === total - tiles.length) { total = n; blocked += tiles.length; }
      else { for (const i of tiles) walk[i] = 1; reach(); }      // isolaria alguém: desfaz este objeto
    }
    if (W._pcache) W._pcache.clear(); if (W._pcacheN) W._pcacheN.clear();
    W._colisao = blocked;
    return blocked;
  };
  /* quem estiver em cima de um objeto (save antigo) é empurrado para o chão livre mais próximo */
  const unstick = () => {
    if (!W.walkable || !W.nearestWalk) return;
    for (const e of [...((G.S && G.S.heroes) || []), ...(G.npcs || [])]) {
      if (!e || e.inside || W.walkable(e.x, e.y)) continue;
      const p = W.nearestWalk(e.x, e.y); e.x = p[0]; e.y = p[1]; e.path = null;
    }
  };
  const init0 = W.init;
  W.init = function () { const r = init0.apply(this, arguments); try { apply(); } catch (e) { console.error('colisão', e); } return r; };
  if (G.hook) { G.hook('afterLoad', unstick); G.hook('newGame', unstick); }
})();
