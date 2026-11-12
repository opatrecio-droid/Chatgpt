/* 90-main: inicialização, laço principal, salvar/carregar e progresso offline. */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const M = (G.M = { running: false, last: 0, saveT: 0, uiT: 0, acc: 0, startAt: 0 });

  M.hasSave = () => { try { return !!localStorage.getItem(G.SAVE_KEY); } catch (e) { return false; } };
  M.save = () => { try { if (G.S) { localStorage.setItem(G.SAVE_KEY, G.serialize()); return true; } } catch (e) { /* armazenamento cheio ou bloqueado */ } return false; };
  M.load = () => { try { const raw = localStorage.getItem(G.SAVE_KEY); if (!raw) return false; G.S = G.deserialize(raw); G.afterLoad(); return true; } catch (e) { console.error('save ilegível', e); return false; } };
  M.wipe = () => { try { localStorage.removeItem(G.SAVE_KEY); } catch (e) { /* ok */ } };
  M.exportSave = () => { M.save(); try { return btoa(unescape(encodeURIComponent(G.serialize()))); } catch (e) { return ''; } };
  M.importSave = (code) => { try { const s = decodeURIComponent(escape(atob(code.trim()))); G.S = G.deserialize(s); G.afterLoad(); M.save(); return true; } catch (e) { return false; } };

  M.start = (fresh) => {
    let off = null;
    if (fresh || !M.load()) { G.newGame(); }
    else { const secs = (Date.now() - (G.S.saved || Date.now())) / 1000; off = G.offline(secs); }
    G.S.paused = false;
    if (G.R.cam && G.S.cam) { G.R.cam.x = G.S.cam.x; G.R.cam.y = G.S.cam.y; } else G.R.focus(44, 53, true);
    M.running = true; M.last = performance.now(); M.startAt = M.last;
    G.emit('start', { fresh: !!fresh || !off, off });
    M.save();
  };

  /* v26 (4C.3): efeitos leves automáticos. A cada 2 s olha o tempo médio entre quadros; se passar de 20 ms por 3 janelas seguidas (6 s) e o
     desenho for uma fatia real disso (≥ 22% e ≥ 5 ms: um aparelho travado em 30 fps mas folgado não conta), liga o Modo leve (G.fxAuto, em 6E). */
  const FX = { n: 0, dt: 0, draw: 0, bad: 0 };
  M.fxAvg = 0; M.fxDraw = 0;
  let fgAcc = 0, fgN = 0;
  const fxWatch = (raw, drawMs) => {
    if (raw > 0.2 || performance.now() - M.startAt < 8000) return;
    FX.n++; FX.dt += raw; FX.draw += drawMs;
    if (FX.dt < 2) return;
    const avg = (FX.dt / FX.n) * 1000, dw = FX.draw / FX.n; M.fxAvg = avg; M.fxDraw = dw;
    FX.bad = avg > 20 && dw > 5 && dw > 0.22 * avg ? FX.bad + 1 : 0;
    FX.n = 0; FX.dt = 0; FX.draw = 0;
    const o = G.S.opts;
    if (FX.bad >= 3 && !o.lowFx && !o.lowNo && G.fxAuto) { FX.bad = 0; G.fxAuto(); }
  };
  const loop = (now) => {
    requestAnimationFrame(loop);
    const raw = (now - M.last) / 1000; let dt = raw; M.last = now;
    if (!(dt > 0)) return; if (dt > 0.25) dt = 0.25;
    if (M.running && G.S) {
      const S = G.S;
      if (!S.paused && !M.modalPause) {
        const total = dt * S.speed, n = Math.max(1, Math.ceil(total / 0.034));
        for (let i = 0; i < n; i++) G.tick(total / n);
      }
      /* v26 (4C.3): o mapa só é redesenhado a cada N quadros quando quase ninguém olha para ele: janela aberta 15/s, painel aberto ou jogo pausado 30/s */
      fgAcc += dt; fgN++;
      const every = M.modalPause || (G.UI && G.UI.modalOpen) ? 4 : S.paused || (G.UI && G.UI.sheet) ? 2 : 1;
      if (fgN >= every) {
        const w0 = performance.now();
        G.R.frame(fgAcc); fgAcc = 0; fgN = 0;
        if (every === 1) fxWatch(raw, performance.now() - w0);
      }
      M.uiT -= dt; if (M.uiT <= 0) { M.uiT = 0.25; if (G.UI) G.UI.refresh(); }
      M.saveT -= dt; if (M.saveT <= 0) { M.saveT = 20; M.save(); }
    } else if (G.UI && G.UI.titleFrame) G.UI.titleFrame(dt);
  };

  M.boot = () => {
    const fill = document.getElementById('boot-fill'), tip = document.getElementById('boot-tip');
    const steps = [
      ['Traçando as ruas de Aurora…', () => G.W.init()],
      ['Pintando campos e florestas…', () => G.A.terrain()],
      ['Forjando ícones…', () => G.A.buildIcons()],
      ['Abrindo os portões…', () => { G.UI.build(); G.R.init(document.getElementById('view')); }],
    ];
    let i = 0;
    const next = () => {
      if (i >= steps.length) { document.getElementById('boot').classList.add('gone'); setTimeout(() => { const b = document.getElementById('boot'); if (b) b.remove(); }, 700); G.UI.showTitle(); requestAnimationFrame(loop); return; }
      tip.textContent = steps[i][0]; fill.style.width = Math.round(((i + 0.5) / steps.length) * 100) + '%';
      setTimeout(() => { try { steps[i][1](); } catch (e) { console.error(e); tip.textContent = 'Erro ao carregar: ' + e.message; return; } i++; next(); }, 30);
    };
    next();
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) M.save(); else M.last = performance.now(); });
  window.addEventListener('pagehide', () => M.save());
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', M.boot); else M.boot();
})();

