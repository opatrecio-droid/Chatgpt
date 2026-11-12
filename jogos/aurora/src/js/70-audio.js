/* 70-audio: efeitos e música ambiente sintetizados (sem arquivos de som). */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const AU = (G.AU = { ctx: null, on: false });
  let ctx, master, sfxG, musG, noiseBuf, lastPlay = {}, musT = 0, musStep = 0;
  const vol = () => (G.S ? G.S.opts : { sfx: 0.7, music: 0.35 });
  const unlock = () => {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try {
      ctx = AU.ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
      sfxG = ctx.createGain(); sfxG.connect(master); musG = ctx.createGain(); musG.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      AU.on = true; setVol(); setInterval(music, 250);
    } catch (e) { /* sem áudio neste aparelho */ }
  };
  const setVol = () => { if (!ctx) return; const o = vol(); sfxG.gain.value = o.sfx * 0.6; musG.gain.value = o.music * 0.22; };
  G.on('audio-unlock', unlock); G.on('opts', setVol); G.on('start', () => { unlock(); setVol(); });
  window.addEventListener('pointerdown', unlock, { once: false, passive: true });
  document.addEventListener('visibilitychange', () => { if (ctx) { if (document.hidden) ctx.suspend(); else ctx.resume(); } });

  const tone = (f, t0, dur, type, g, f2, dest) => { const o = ctx.createOscillator(), a = ctx.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + dur); a.gain.setValueAtTime(0.0001, t0); a.gain.exponentialRampToValueAtTime(g, t0 + 0.008); a.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); o.connect(a); a.connect(dest || sfxG); o.start(t0); o.stop(t0 + dur + 0.02); };
  const noise = (t0, dur, g, freq, q, type) => { const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), a = ctx.createGain(); s.buffer = noiseBuf; f.type = type || 'bandpass'; f.frequency.value = freq; f.Q.value = q || 1; a.gain.setValueAtTime(g, t0); a.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); s.connect(f); f.connect(a); a.connect(sfxG); s.start(t0); s.stop(t0 + dur + 0.02); };
  const seq = (notes, step, type, g, dur) => { const t = ctx.currentTime; notes.forEach((n, i) => tone(n, t + i * step, dur || step * 1.8, type, g)); };
  const SFX = {
    click: (t) => tone(880, t, 0.05, 'triangle', 0.12, 1320),
    pick: (t) => { tone(1319, t, 0.06, 'triangle', 0.1); tone(1760, t + 0.05, 0.09, 'triangle', 0.09); },
    weak: (t) => { tone(520, t, 0.28, 'sine', 0.1, 170); noise(t, 0.12, 0.12, 900, 2); },
    hit: (t) => { noise(t, 0.07, 0.35, 1800 + Math.random() * 600, 0.8); tone(180, t, 0.06, 'square', 0.08, 90); },
    crit: (t) => { noise(t, 0.1, 0.45, 2600, 0.7); tone(990, t, 0.12, 'triangle', 0.16, 1480); },
    hurt: (t) => { tone(140, t, 0.12, 'sawtooth', 0.14, 70); noise(t, 0.06, 0.2, 500, 1); },
    die: (t) => { tone(320, t, 0.18, 'square', 0.1, 60); noise(t, 0.14, 0.25, 900, 0.6); },
    bossdie: (t) => { tone(160, t, 0.9, 'sawtooth', 0.25, 30); noise(t, 0.8, 0.5, 300, 0.5, 'lowpass'); seq([523, 659, 784, 1047], 0.09, 'triangle', 0.16, 0.4); },
    fall: (t) => { tone(392, t, 0.25, 'triangle', 0.2, 196); tone(294, t + 0.2, 0.45, 'triangle', 0.2, 110); },
    coin: (t) => { tone(1568, t, 0.07, 'square', 0.06); tone(2093, t + 0.06, 0.12, 'square', 0.06); },
    buy: (t) => { tone(1175, t, 0.07, 'triangle', 0.14); tone(1568, t + 0.07, 0.1, 'triangle', 0.14); tone(2093, t + 0.14, 0.16, 'triangle', 0.12); },
    deliver: (t) => { tone(660, t, 0.06, 'triangle', 0.1); tone(880, t + 0.06, 0.1, 'triangle', 0.1); },
    potion: (t) => { tone(500, t, 0.22, 'sine', 0.14, 1100); },
    heal: (t) => seq([659, 784, 988, 1319], 0.07, 'sine', 0.12, 0.3),
    lvl: (t) => seq([523, 659, 784, 1047, 1319], 0.06, 'triangle', 0.15, 0.25),
    promo: (t) => { seq([392, 523, 659, 784, 1047, 1319, 1568], 0.08, 'triangle', 0.17, 0.5); tone(196, t, 0.9, 'sine', 0.2); },
    summon: (t) => { tone(200, t, 0.7, 'sine', 0.2, 1400); seq([784, 988, 1175, 1568], 0.1, 'sine', 0.1, 0.4); },
    build: (t) => { for (let i = 0; i < 3; i++) { noise(t + i * 0.13, 0.08, 0.4, 700, 1.5); tone(220, t + i * 0.13, 0.08, 'square', 0.08, 110); } tone(784, t + 0.42, 0.3, 'triangle', 0.14); tone(1175, t + 0.5, 0.4, 'triangle', 0.12); },
    forge: (t) => { for (let i = 0; i < 2; i++) { tone(2400, t + i * 0.16, 0.14, 'square', 0.07, 1900); tone(3300, t + i * 0.16, 0.2, 'sine', 0.06); noise(t + i * 0.16, 0.04, 0.3, 4000, 0.5); } },
    rare: (t) => seq([988, 1319, 1568, 1976, 2637], 0.07, 'sine', 0.14, 0.5),
    fail: (t) => { tone(300, t, 0.2, 'sawtooth', 0.12, 150); tone(200, t + 0.15, 0.3, 'sawtooth', 0.12, 90); },
    quest: (t) => seq([784, 988, 1175, 1568], 0.09, 'triangle', 0.15, 0.35),
    realm: (t) => { [262, 330, 392, 523].forEach((f) => tone(f, t, 1.2, 'triangle', 0.1)); seq([523, 659, 784, 1047, 1319], 0.12, 'triangle', 0.14, 0.6); },
    boss: (t) => { tone(70, t, 1.1, 'sawtooth', 0.28, 45); tone(105, t, 1.1, 'sawtooth', 0.16, 60); noise(t, 0.9, 0.3, 200, 0.6, 'lowpass'); },
    horn: (t) => { tone(196, t, 0.9, 'sawtooth', 0.14); tone(294, t + 0.05, 0.9, 'sawtooth', 0.1); tone(196, t + 1.0, 1.2, 'sawtooth', 0.14); },
    victory: (t) => { seq([523, 523, 523, 659, 784, 659, 784, 1047], 0.11, 'triangle', 0.16, 0.3); [262, 392].forEach((f) => tone(f, t + 0.8, 1, 'triangle', 0.1)); },
    boom: (t) => { noise(t, 0.35, 0.6, 180, 0.5, 'lowpass'); tone(110, t, 0.3, 'sine', 0.25, 40); },
    /* v23: inscrição perfeita e revelação de peças raras */
    perfect: (t) => { seq([1319, 1760, 2349, 3136], 0.06, 'sine', 0.13, 0.5); tone(4186, t + 0.22, 0.55, 'sine', 0.06); },
    reveal: (t) => { tone(130, t, 0.5, 'sine', 0.25, 65); [392, 494, 587].forEach((f) => tone(f, t + 0.05, 0.9, 'triangle', 0.1)); seq([784, 988, 1175, 1568], 0.08, 'sine', 0.12, 0.5); },
    reveal2: (t) => { tone(90, t, 0.9, 'sawtooth', 0.2, 40); noise(t, 0.5, 0.35, 300, 0.6, 'lowpass'); [262, 330, 392, 523].forEach((f) => tone(f, t + 0.1, 1.6, 'triangle', 0.1)); seq([523, 659, 784, 1047, 1319, 1568, 2093], 0.07, 'triangle', 0.15, 0.6); },
  };
  AU.SFX = SFX; AU.tone = tone; AU.noise = noise; AU.seq = seq;   // v24: 64-ui-retorno acrescenta sons novos
  const GAP = { pick: 0.08, weak: 0.25, hit: 0.07, crit: 0.1, hurt: 0.12, die: 0.1, coin: 0.12, click: 0.03, boom: 0.15, heal: 0.2, potion: 0.2, deliver: 0.2, buy: 0.15 };
  G.on('sfx', (d) => {
    if (!ctx || ctx.state !== 'running' || !vol().sfx) return;
    const f = SFX[d.name]; if (!f) return;
    const now = ctx.currentTime; if (now - (lastPlay[d.name] || -9) < (GAP[d.name] || 0.05)) return;
    /* sons do mundo só tocam se estiverem na tela */
    if (d.x != null) { const [sx, sy] = G.R.worldToScreen(d.x, d.y); if (sx < -60 || sy < -60 || sx > window.innerWidth + 60 || sy > window.innerHeight + 60) return; }
    lastPlay[d.name] = now;
    try { f(now); } catch (e) { /* ok */ }
  });

  /* música: acordes lentos em ré dórico e notas soltas; mais grave e esparsa à noite */
  const CH = [[146.83, 220, 261.63, 349.23], [130.81, 196, 246.94, 329.63], [174.61, 220, 261.63, 329.63], [110, 164.81, 220, 293.66]];
  const PENTA = [293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99];
  const music = () => {
    if (!ctx || ctx.state !== 'running' || !G.S || !G.M.running || !vol().music || G.S.paused) return;
    const now = ctx.currentTime; if (now < musT) return;
    const night = G.isNight(G.S.clock), danger = !!G.S.mare.active;
    const ch = CH[musStep % 4]; musStep++;
    const len = danger ? 2.4 : 4.8; musT = now + len;
    ch.forEach((f, i) => { const o = ctx.createOscillator(), a = ctx.createGain(), fl = ctx.createBiquadFilter(); o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = f * (night ? 0.5 : 1) * (danger ? 0.94 : 1); o.detune.value = (i - 1.5) * 4; fl.type = 'lowpass'; fl.frequency.value = night ? 700 : 1300; a.gain.setValueAtTime(0.0001, now); a.gain.linearRampToValueAtTime(0.16, now + len * 0.35); a.gain.linearRampToValueAtTime(0.0001, now + len + 0.6); o.connect(fl); fl.connect(a); a.connect(musG); o.start(now); o.stop(now + len + 0.7); });
    const n = night ? 2 : 4;
    for (let i = 0; i < n; i++) if (Math.random() < 0.75) { const t = now + (i + Math.random() * 0.4) * (len / n); tone(G.pick(PENTA) * (night ? 0.5 : 1), t, 1.4, 'sine', 0.22, null, musG); }
    if (danger) for (let i = 0; i < 4; i++) tone(73.4, now + i * 0.6, 0.25, 'triangle', 0.5, 50, musG);
  };
})();

;
