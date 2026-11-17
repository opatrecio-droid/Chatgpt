/* Aurora 046 · Portal de Aurora: novo lugar e arte animada.
   O portal sai da frente da Guilda e passa a ocupar o eixo da cidade (portão norte → estrada → portal → fonte),
   ladeado pelos dois estandartes. A arte animada mora em G.A.PortalArt (src/portal-art.js); aqui ficam a posição,
   a camada de desenho (ordenada por y), o chão rúnico e o gatilho de invocação. Não altera regras nem save. */
(function () {
  'use strict';
  if (typeof G === 'undefined' || !G.W || typeof G.W.init !== 'function') return;
  const W = G.W, POS = { x: 44, y: 50.8, mouth: [44, 52] };

  const relocate = () => {
    const I = (x, y) => y * W.w + x;
    for (const x of [39, 40, 41]) W.walk[I(x, 49)] = 1;          // libera o lugar antigo (bloqueado só pelo portal)
    for (const x of [43, 44, 45]) W.walk[I(x, 50)] = 0;          // base do portal novo
    W.portal = { x: POS.x, y: POS.y, mouth: POS.mouth.slice() };
    for (const p of W.props) {                                    // estandartes passam a emoldurar o portal
      if (p.t !== 'banner' || Math.abs(p.y - 49.2) > 0.3) continue;
      if (Math.abs(p.x - 42.1) < 0.3) { p.x = 41.5; p.y = 51.1; } else if (Math.abs(p.x - 44.9) < 0.3) { p.x = 46.5; p.y = 51.1; }
    }
    if (Array.isArray(W.idle)) W.idle = W.idle.map(([x, y]) => (x === 45.5 && y === 51 ? [47, 52.4] : x === 46 && y === 49.6 ? [40.6, 49.8] : [x, y]));
  };
  const init0 = W.init;
  W.init = function () { const r = init0.apply(this, arguments); try { relocate(); } catch (e) { console.error('portal', e); } return r; };

  if (G.HEADLESS || !G.A || !G.R) return;
  const A = G.A, R = G.R;
  const media = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const opts = () => ({ quiet: !!((G.S && G.S.opts && G.S.opts.reduceMotion) || media.matches), light: !!(G.S && G.S.opts && G.S.opts.lowFx), dark: G.S && G.darkness ? G.darkness(G.S.clock) : 0 });
  let burst = -99;                                               // instante (R.t) da última invocação

  /* tira o portal antigo dos estáticos; o novo é desenhado como item dinâmico (mesma ordenação por y) */
  const init1 = R.init;
  R.init = function () { const r = init1.apply(this, arguments); R.statics = R.statics.filter(s => s.kind !== 'portal'); return r; };

  const art = () => A.PortalArt || null;
  const draw = (e, X, Y, z) => {
    const ctx = R.ctx, a = art(); if (!ctx) return;
    const x = X(W.portal.x), y = Y(W.portal.y), o = opts(); o.burst = R.t - burst;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    try { if (a) a.draw(ctx, x, y, z, R.t, o); else { const s = A.portalSprite(); ctx.drawImage(s.cv, Math.round(x - s.w * z / 2), Math.round(y - s.h * z), s.w * z, s.h * z); } }
    catch (err) { if (!draw.warned) { draw.warned = 1; console.error('portal', err); } }
    ctx.restore();
  };
  G.hook('renderItems', (dyn, ctx, v) => {
    const p = W.portal; if (p.x < v.x0 - 4 || p.x > v.x1 + 4 || p.y < v.y0 - 2 || p.y > v.y1 + 6) return;
    dyn.push({ y: p.y + 0.2, k: 'x', e: null, f: draw });
  }, 50);
  /* chão rúnico (camada plana, abaixo de pessoas e prédios) */
  G.hook('groundDecor', (ctx, X, Y, z, v) => {
    const a = art(), p = W.portal; if (!a || !a.ground || p.x < v.x0 - 4 || p.x > v.x1 + 4 || p.y < v.y0 - 2 || p.y > v.y1 + 6) return;
    const o = opts(); o.burst = R.t - burst;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    try { a.ground(ctx, X(p.x), Y(p.y), z, R.t, o); } catch (err) { if (!draw.gw) { draw.gw = 1; console.error('portal chão', err); } }
    ctx.restore();
  }, 50);
  /* herói chegando pelo portal: explosão de invocação */
  G.hook('visualEvent', f => { if (f && f.t === 'summon') burst = R.t; }, 40);
  A.portalBurst = () => { burst = R.t; };
})();
