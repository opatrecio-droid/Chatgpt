/* ===== Ciclo 029 — AURORA: ASCENSÃO (vida ambiente) =====
   Sombras de nuvens que cruzam o mapa, bandos de pássaros de dia, vaga-lumes à noite
   e folhas ao vento. Tudo leve, desenhado sobre o mundo e desligável em Opções (efeitos). */
(function () {
  'use strict';
  const P = window.P;
  if (!P || P.ascFx) return;

  const FX = (P.ascFx = {
    clouds: [], birds: [], flies: [], leaves: [],
    nextFlock: 0, last: 0,
    on() {
      if (P.menu && P.menu.prefs && (P.menu.prefs.fx === false || P.menu.prefs.battery)) return false;
      return !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    },
    seed() {
      const W = P.CONFIG.worldW * P.CONFIG.tile, H = P.CONFIG.worldH * P.CONFIG.tile;
      for (let i = 0; i < 7; i++) this.clouds.push({ x: Math.random() * W, y: Math.random() * H, r: 380 + Math.random() * 420, v: 9 + Math.random() * 9, k: 0.55 + Math.random() * 0.3 });
      for (let i = 0; i < 26; i++) this.flies.push({ x: Math.random(), y: Math.random(), p: Math.random() * 6.28, s: 0.5 + Math.random() });
      for (let i = 0; i < 12; i++) this.leaves.push({ x: Math.random(), y: Math.random(), p: Math.random() * 6.28, s: 0.6 + Math.random() * 0.8, c: ['#d9a441', '#c96f3a', '#8fb86a'][i % 3] });
    },
    light() {
      const m = P.state ? P.state.minute : 720;
      if (m >= 420 && m <= 1020) return 1;
      if (m > 1020 && m < 1170) return 1 - (m - 1020) / 150;
      if (m > 300 && m < 420) return (m - 300) / 120;
      return 0;
    },
    draw(ctx) {
      if (!this.on() || !P.render || !P.camera || !P.state) return;
      if (!this.clouds.length) this.seed();
      const now = performance.now();
      const dt = Math.min(0.1, (now - (this.last || now)) / 1000) * (P.state.paused ? 0 : 1);
      this.last = now;
      const w = P.render.w || ctx.canvas.clientWidth, h = P.render.h || ctx.canvas.clientHeight;
      const z = P.camera.zoom, day = this.light();
      const W = P.CONFIG.worldW * P.CONFIG.tile, H = P.CONFIG.worldH * P.CONFIG.tile;
      ctx.save();

      // sombras de nuvem
      if (day > 0.05) {
        for (const c of this.clouds) {
          c.x += c.v * dt; c.y += c.v * 0.18 * dt;
          if (c.x - c.r > W) { c.x = -c.r; c.y = Math.random() * H; }
          const s = P.render.worldToScreen(c.x, c.y), r = c.r * z;
          if (s.x + r < 0 || s.x - r > w || s.y + r < 0 || s.y - r > h) continue;
          const g = ctx.createRadialGradient(s.x, s.y, r * 0.15, s.x, s.y, r);
          g.addColorStop(0, 'rgba(12,18,34,' + (0.13 * day).toFixed(3) + ')');
          g.addColorStop(1, 'rgba(12,18,34,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.ellipse(s.x, s.y, r, r * c.k, 0, 0, Math.PI * 2); ctx.fill();
        }
      }

      // folhas ao vento (de dia)
      if (day > 0.4 && z > 0.45) {
        for (const l of this.leaves) {
          l.x += 0.035 * l.s * dt; l.y += 0.02 * l.s * dt; l.p += 2.2 * dt;
          if (l.x > 1.05) { l.x = -0.05; l.y = Math.random(); }
          if (l.y > 1.05) l.y = -0.05;
          const x = l.x * w + Math.sin(l.p) * 14, y = l.y * h + Math.cos(l.p * 0.7) * 8;
          ctx.globalAlpha = 0.55 * day;
          ctx.fillStyle = l.c;
          ctx.save(); ctx.translate(x, y); ctx.rotate(l.p); ctx.fillRect(-3, -1.5, 6, 3); ctx.restore();
        }
        ctx.globalAlpha = 1;
      }

      // pássaros
      if (day > 0.6) {
        if (now > this.nextFlock && this.birds.length === 0) {
          this.nextFlock = now + 22000 + Math.random() * 30000;
          const dir = Math.random() < 0.5 ? 1 : -1, y0 = h * (0.15 + Math.random() * 0.5), n = 3 + Math.floor(Math.random() * 5);
          for (let i = 0; i < n; i++) this.birds.push({ x: dir > 0 ? -30 - i * 26 : w + 30 + i * 26, y: y0 + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 15, v: dir * (95 + Math.random() * 12), p: Math.random() * 6 });
        }
        ctx.lineWidth = 1.6; ctx.lineCap = 'round';
        for (const b of this.birds) {
          b.x += b.v * dt; b.y -= 6 * dt; b.p += 11 * dt;
          const flap = Math.sin(b.p) * 4;
          ctx.strokeStyle = 'rgba(10,14,24,.22)';
          ctx.beginPath(); ctx.moveTo(b.x - 6 + 14, b.y + 38 + flap * 0.5); ctx.lineTo(b.x + 14, b.y + 40); ctx.lineTo(b.x + 6 + 14, b.y + 38 + flap * 0.5); ctx.stroke();
          ctx.strokeStyle = 'rgba(28,24,34,.85)';
          ctx.beginPath(); ctx.moveTo(b.x - 6, b.y - flap); ctx.lineTo(b.x, b.y); ctx.lineTo(b.x + 6, b.y - flap); ctx.stroke();
        }
        this.birds = this.birds.filter((b) => b.x > -80 && b.x < w + 80);
      } else if (this.birds.length) this.birds.length = 0;

      // vaga-lumes
      if (day < 0.35 && z > 0.4) {
        const night = 1 - day / 0.35;
        const cx = (P.camera.x * z) % w, cy = (P.camera.y * z) % h;
        for (const f of this.flies) {
          f.p += dt * f.s * 1.6;
          const x = (((f.x * w - cx + Math.sin(f.p) * 26) % w) + w) % w;
          const y = (((f.y * h - cy + Math.cos(f.p * 0.8) * 18) % h) + h) % h;
          const a = (0.35 + 0.65 * Math.max(0, Math.sin(f.p * 2.3))) * night;
          ctx.globalAlpha = a * 0.28; ctx.fillStyle = '#d9ff9a';
          ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = a; ctx.fillStyle = '#f4ffcf';
          ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
        }
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    },
    /* menos poluição no combate: rótulos de coleta ("+Couro") passam um por vez */
    calm(obj, key, idx) {
      if (!obj || !obj[key] || obj[key]._asc) return;
      const F = obj[key], self = this;
      obj[key] = function () {
        const t = arguments[idx];
        if (typeof t === 'string' && /^\+\s?[A-Za-zÀ-ÿ]/.test(t)) {
          const now = performance.now();
          if (now - (self._labelAt || 0) < 520) return;
          self._labelAt = now;
        }
        return F.apply(this, arguments);
      };
      obj[key]._asc = true;
    },
    install() {
      this.calm(P.fx, 'float', 2);
      this.calm(P.r51, 'num', 2);
      if (this._on || !P.fx || !P.fx.draw) return;
      this._on = true;
      const D = P.fx.draw, self = this;
      P.fx.draw = function (ctx) {
        try { self.draw(ctx); } catch (e) { /* ambiente é opcional */ }
        return D.apply(this, arguments);
      };
    },
  });

  const go = () => { try { FX.install(); } catch (e) { /* ok */ } };
  window.addEventListener('DOMContentLoaded', () => setTimeout(go, 600));
  for (const ms of [800, 2500]) setTimeout(go, ms);
})();
