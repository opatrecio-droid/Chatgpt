(() => {
  const FRAME = 16, T0 = Date.UTC(2026, 10, 18, 12, 0, 0), RealDate = Date;
  let now = 1000, seq = 1, rseq = 1; const timers = new Map(), rafs = new Map();
  let a = 0x9e3779b9; Math.random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  window.__reseed = (n) => { a = (0x9e3779b9 ^ (n * 2654435761)) | 0; };
  try { Object.defineProperty(performance, 'now', { value: () => now, configurable: true }); } catch (e) { performance.now = () => now; }
  class FakeDate extends RealDate { constructor(...x) { if (x.length === 0) super(T0 + now); else super(...x); } static now() { return T0 + now; } }
  window.Date = FakeDate;
  window.setTimeout = (fn, ms = 0, ...args) => { const id = seq++; timers.set(id, { t: now + Math.max(0, +ms || 0), fn, args }); return id; };
  window.setInterval = (fn, ms = 0, ...args) => { const id = seq++, e = Math.max(1, +ms || 1); timers.set(id, { t: now + e, fn, args, every: e }); return id; };
  window.clearTimeout = window.clearInterval = (id) => { timers.delete(id); };
  window.requestAnimationFrame = (cb) => { const id = rseq++; rafs.set(id, cb); return id; };
  window.cancelAnimationFrame = (id) => { rafs.delete(id); };
  window.requestIdleCallback = (cb) => window.setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 8 }), 1);
  window.cancelIdleCallback = window.clearTimeout;
  window.__advance = (ms) => {
    const end = now + ms;
    for (;;) {
      let nt = Infinity, nid = 0;
      for (const [id, t] of timers) if (t.t < nt || (t.t === nt && id < nid)) { nt = t.t; nid = id; }
      const nf = (Math.floor(now / FRAME) + 1) * FRAME, nx = Math.min(nt, nf);
      if (nx > end) { now = end; return; }
      now = nx;
      if (nt <= nx) {
        const t = timers.get(nid); if (t.every) t.t += t.every; else timers.delete(nid);
        try { typeof t.fn === 'function' ? t.fn(...t.args) : 0; } catch (e) { console.error('timer', e && e.message); }
      } else {
        const q = [...rafs.values()]; rafs.clear();
        for (const cb of q) { try { cb(now); } catch (e) { console.error('raf', e && e.message); } }
      }
    }
  };
  window.__now = () => now;
})();
