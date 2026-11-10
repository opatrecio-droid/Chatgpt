/* 90-main: inicialização, laço principal, salvar/carregar e progresso offline. */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const M = (G.M = { running: false, last: 0, saveT: 0, uiT: 0, acc: 0 });

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
    M.running = true; M.last = performance.now();
    G.emit('start', { fresh: !!fresh || !off, off });
    M.save();
  };

  const loop = (now) => {
    requestAnimationFrame(loop);
    let dt = (now - M.last) / 1000; M.last = now;
    if (!(dt > 0)) return; if (dt > 0.25) dt = 0.25;
    if (M.running && G.S) {
      const S = G.S;
      if (!S.paused && !M.modalPause) {
        const total = dt * S.speed, n = Math.max(1, Math.ceil(total / 0.034));
        for (let i = 0; i < n; i++) G.tick(total / n);
      }
      G.R.frame(dt);
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
