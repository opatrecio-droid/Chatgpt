/* ===== Começo da aventura (vídeo 1) =====
   No mapa-múndi do vídeo a «Cidade de Origem» é a cidade do herói e «Escudeiro Samson» espera em Loton: a primeira linha de
   missão diz «Encontre Escudeiro Samson em Loton.». Por isso uma aventura nova começa na Cidade de Origem (a oeste de Loton) e
   a primeira missão é ir até Loton. Saves antigos continuam de onde pararam. */
(() => {
  POI.origin.n = 'Cidade de Origem';
  KIND_LBL.origin = 'Cidade';

  const novoEstado = newState;
  newState = (cls, name) => {
    const s = novoEstado(cls, name), c = poiPx(POI.origin);
    s.pos = { x: c.x, y: c.y + 24 }; s.lastTown = 'origin'; s.visited = { origin: true };
    return s;
  };

  /* entrar na cidade de origem também vira o ponto de despertar depois de uma derrota */
  const entrar = enterPoi;
  enterPoi = p => { if (S && p && p.kind === 'origin') S.lastTown = p.id; entrar(p); };

  /* enquanto Samson não for visitado, a linha de missão é a do vídeo */
  const painel = updateHUD;
  updateHUD = () => {
    painel();
    if (S && S.questFlags && S.questFlags.samsonIntroduction === false) $('#world-quest').textContent = 'Encontre Escudeiro Samson em Loton.';
  };
})();
