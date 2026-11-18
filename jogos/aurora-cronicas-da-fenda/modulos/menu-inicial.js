/* Aurora — menu inicial (v1)
   -----------------------------------------------------------------------------
   Substitui a tela de título do jogo por um menu completo, sem alterar nenhuma
   regra de jogo. Reaproveita as ações que já existem (t-continue, t-new,
   t-import, sbstart, sbnew) e acrescenta Configurações, Jornada salva,
   Como jogar e Sair.

   Depende de window.G (jogo) e window.AuroraPlatform (modulos/plataforma.js). */
(function () {
  'use strict';
  if (typeof document === 'undefined' || !window.G || !G.UI || !window.AuroraPlatform) return;
  const U = G.UI, P = window.AuroraPlatform, Cfg = P.Config;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = U.esc || ((s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));

  /* ---------- resumo do salvamento (para o cartão "Continuar") ---------- */
  const chaveCampanha = () => (G.TEST && G.TEST.CAMPAIGN_KEY) || G.SAVE_KEY;
  function resumoSave(chave) {
    try {
      const raw = localStorage.getItem(chave); if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || typeof s !== 'object') return null;
      return {
        nivel: s.realm && Number.isFinite(s.realm.lvl) ? s.realm.lvl : null,
        dia: Number.isFinite(s.day) ? s.day : null,
        herois: Array.isArray(s.heroes) ? s.heroes.length : null,
        salvo: Number.isFinite(s.saved) ? s.saved : null,
      };
    } catch (e) { return null; }
  }
  function haQuanto(ms) {
    if (!ms) return '';
    const s = Math.max(0, (Date.now() - ms) / 1000);
    if (s < 60) return 'agora há pouco';
    if (s < 3600) return 'há ' + Math.floor(s / 60) + ' min';
    if (s < 86400) return 'há ' + Math.floor(s / 3600) + ' h';
    const d = Math.floor(s / 86400);
    return 'há ' + d + (d === 1 ? ' dia' : ' dias');
  }
  const temSave = () => { try { return !!G.M.hasSave(); } catch (e) { return false; } };
  const temTeste = () => { try { return !!(G.TEST && G.TEST.hasSave && G.TEST.hasSave()); } catch (e) { return false; } };

  /* ---------- heróis da vitrine (mesma arte do jogo) ---------- */
  function campeoes() {
    const A = G.A;
    if (!A || !A.fullBody || !A.heroLook || !G.CLASSES) return '';
    try {
      return [['cav', 4, 6, 'Cavaleiro de Aurora'], ['mag', 5, 7, 'Maga da Fenda'], ['arq', 3, 5, 'Arqueira de Aurora']].map(([cls, rar, rank, nome], i) => {
        const c = G.CLASSES[cls];
        const h = { cls, rar, rank, look: { skin: i + 1, hair: 2 + i, style: i + 1, seed: 101 + i }, cos: {}, gear: { arma: { type: c.w, tier: 1, rank, rar, plus: 0 }, armadura: { type: c.a, tier: 1, rank, rar, plus: 0 } } };
        return '<img class="am-champ am-champ-' + i + '" src="' + A.fullBody(A.heroLook(h)) + '" alt="' + esc(nome) + '" draggable="false">';
      }).join('');
    } catch (e) { return ''; }
  }

  /* ---------- cena animada (pixel-art em 180 linhas, ampliada sem suavização) ---------- */
  function criarCena(cv, soBrilhos) {
    const ctx = cv.getContext('2d', { alpha: true });
    let H = 180, W = 320, S = 1;
    const rng = (G.seeded ? G.seeded(0xA0407A) : Math.random);
    const mov = matchMedia('(prefers-reduced-motion: reduce)').matches || Cfg.get('tela.reduzirMovimento');
    const leve = Cfg.get('tela.qualidade') === 'baixa' || Cfg.get('tela.economiaBateria');
    const fps = leve ? 15 : 30;
    let camadas = null, estrelas = [], vagalumes = [], rodando = false, raf = 0, ultimo = 0, t0 = performance.now();
    let alvo = { x: 0, y: 0 }, cam = { x: 0, y: 0 }, cometa = { t: 0, prox: 4 };
    const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; };

    function contorno(base, amp, escala, folga) {          // linha de montanhas em degraus de 2 px
      const fase = rng() * 100, out = [];
      for (let x = -folga; x < W + folga; x += 2) {
        const v = Math.sin((x + fase) * escala) * amp + Math.sin((x + fase) * escala * 2.7 + 1.3) * amp * .45 + Math.sin((x + fase) * escala * 6.1) * amp * .12;
        out.push([x, Math.round(base - v)]);
      }
      return out;
    }
    function camadaMontanha(base, amp, escala, cor, rim) {
      const folga = 24, [c, x] = mk(W + folga * 2, H), pts = contorno(base, amp, escala, folga);
      x.fillStyle = cor;
      for (const [px, py] of pts) x.fillRect(px + folga, py, 2, H - py);
      if (rim) { x.fillStyle = rim; for (const [px, py] of pts) x.fillRect(px + folga, py, 2, 1); }
      return { c, folga, pts };
    }
    function pinheiro(x, px, py, h, cor) {
      x.fillStyle = cor; x.fillRect(px, py - 2, 1, 3);
      for (let k = 0; k < 5; k++) { const w = 1 + k * Math.max(1, Math.round(h / 16)), yy = py - h + Math.round(k * h / 6); x.fillRect(px - w, yy + Math.round(h / 6), w * 2 + 1, Math.round(h / 5)); }
      x.fillRect(px, py - h - 2, 1, 3);
    }
    function castelo(x, cx, cy) {                           // silhueta do reino de Aurora, janelas acesas
      x.fillStyle = '#0b1130';
      x.fillRect(cx - 18, cy - 16, 36, 16);                 // muralha
      x.fillRect(cx - 6, cy - 30, 12, 30);                  // torre central
      x.fillRect(cx - 26, cy - 24, 8, 24); x.fillRect(cx + 18, cy - 24, 8, 24);   // torres laterais
      for (const tx of [cx - 26, cx - 6, cx + 18]) { const w = tx === cx - 6 ? 12 : 8, top = tx === cx - 6 ? cy - 30 : cy - 24; for (let i = 0; i < w; i += 4) x.fillRect(tx + i, top - 3, 2, 3); }
      x.fillRect(cx - 1, cy - 38, 1, 8); x.fillStyle = '#e2b659'; x.fillRect(cx, cy - 38, 4, 2);   // bandeira
      x.fillStyle = '#ffd98a';
      for (const [wx, wy] of [[cx - 2, cy - 24], [cx + 1, cy - 20], [cx - 23, cy - 17], [cx + 21, cy - 17], [cx - 12, cy - 9], [cx + 10, cy - 9], [cx - 2, cy - 10]]) x.fillRect(wx, wy, 2, 3);
    }

    function montar() {
      const r = cv.getBoundingClientRect(), cw = r.width || 1280, ch = r.height || 720;
      const px = Math.min(5, Math.max(2, Math.min(ch / 190, cw / 300)));        // tamanho do "pixel" em px de CSS: sempre quadrado
      W = Math.max(120, Math.round(cw / px)); H = Math.max(120, Math.round(ch / px)); S = H / 180;
      cv.width = W; cv.height = H;
      estrelas = []; vagalumes = [];
      const r2 = G.seeded ? G.seeded(0x5171) : Math.random;
      for (let i = 0; i < 130; i++) estrelas.push({ x: r2() * W, y: r2() * H * .56, f: r2() * 6.28, v: .6 + r2() * 1.8, g: r2() < .1 });
      for (let i = 0; i < (leve ? 10 : 26); i++) vagalumes.push({ x: r2() * W, y: H * .5 + r2() * H * .48, f: r2() * 6.28, v: .25 + r2() * .5, r: 6 + r2() * 14 });
      if (soBrilhos) { camadas = null; return; }
      const [ceu, cx] = mk(W, H), bandas = ['#070b17', '#0b1126', '#101833', '#161e41', '#1f2650', '#2d2b5a', '#443264', '#62406c'];
      bandas.forEach((c, i) => { cx.fillStyle = c; const y0 = Math.round(i * H * .72 / bandas.length), y1 = Math.round((i + 1) * H * .72 / bandas.length); cx.fillRect(0, y0, W, y1 - y0 + 1); });
      cx.fillStyle = bandas[bandas.length - 1]; cx.fillRect(0, Math.round(H * .72), W, H);
      const asp = W / H, ex = asp < 1 ? .62 : .575, dy = asp < 1 ? -.09 : 0;          // retrato: horizonte sobe para ficar acima do painel
      const m1 = camadaMontanha(H * (.6 + dy), 15 * S, .028 * (asp < 1 ? 2 : 1), '#262f62', '#4b5b98');
      const m2 = camadaMontanha(H * (.7 + dy), 12 * S, .036 * (asp < 1 ? 2 : 1), '#18214d', '#38467f');
      const m3 = camadaMontanha(H * (.81 + dy), 9 * S, .05 * (asp < 1 ? 2 : 1), '#0d1434', '#1d2a58');
      castelo(m2.c.getContext('2d'), Math.round(W * ex) + m2.folga, m2.pts.find((p) => p[0] >= Math.round(W * ex))[1] + 4);
      const [fg, fx] = mk(W + 48, H); fx.fillStyle = '#060913'; const base = Math.round(H * (.93 + dy * 2));
      for (let x = 0; x < W + 48; x += 2) fx.fillRect(x, base + Math.round(Math.sin(x * .04) * 2), 2, H);
      const r3 = G.seeded ? G.seeded(0x71E5) : Math.random;
      for (let i = 0; i < Math.round(W / 11); i++) { const px = Math.round(i * 11 + r3() * 8), alto = 22 + Math.round(r3() * 26); if (px > W * .5 && px < W * .86 && r3() < .5) continue; pinheiro(fx, px, base + 4, alto, '#060913'); }
      camadas = { ceu, m1, m2, m3, fg };
    }

    function desenhar(t) {
      ctx.clearRect(0, 0, W, H);
      ctx.imageSmoothingEnabled = false;
      cam.x += (alvo.x - cam.x) * .06; cam.y += (alvo.y - cam.y) * .06;
      if (camadas) {
        ctx.drawImage(camadas.ceu, 0, 0);
        for (const e of estrelas) {
          const b = mov ? .8 : .5 + .5 * Math.sin(t * e.v + e.f);
          ctx.fillStyle = b > .8 ? '#ffffff' : b > .45 ? '#b9c6f0' : '#5d6b9c'; ctx.fillRect(e.x | 0, e.y | 0, 1, 1);
          if (e.g && b > .7) { ctx.fillStyle = '#8fa0d8'; ctx.fillRect((e.x | 0) - 1, e.y | 0, 3, 1); ctx.fillRect(e.x | 0, (e.y | 0) - 1, 1, 3); }
        }
        // a aurora que dá nome ao jogo: fitas de luz sobre o céu
        const faixas = [[H * .19, '94,224,192', .22, .5], [H * .27, '181,140,242', .18, -.35], [H * .14, '226,182,89', .1, .22]];
        for (const [y, rgb, a, sp] of faixas) {
          for (let x = 0; x < W; x += 2) {
            const yy = y + Math.sin(x * .028 + t * sp) * 9 * S + Math.sin(x * .011 - t * sp * .6) * 12 * S;
            for (let k = 0; k < 5; k++) { ctx.fillStyle = 'rgba(' + rgb + ',' + (a * (1 - k / 5) * (.7 + .3 * Math.sin(x * .05 + t * .8))).toFixed(3) + ')'; ctx.fillRect(x, (yy + k * 4) | 0, 2, 4); }
          }
        }
        // duas luas
        const lx = W * .84, ly = H * .17 + (mov ? 0 : Math.sin(t * .05) * 2);
        for (const [r, a] of [[24, .05], [19, .08], [15, .12]]) { ctx.fillStyle = 'rgba(244,236,200,' + a + ')'; ctx.beginPath(); ctx.arc(lx, ly, r, 0, 6.283); ctx.fill(); }
        ctx.fillStyle = '#f4ecc8'; ctx.beginPath(); ctx.arc(lx, ly, 12, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#d8caa0'; ctx.fillRect((lx - 5) | 0, (ly - 3) | 0, 3, 3); ctx.fillRect((lx + 2) | 0, (ly + 3) | 0, 2, 2); ctx.fillRect((lx - 2) | 0, (ly + 5) | 0, 2, 2);
        const mx = W * .67, my = H * .17 + (mov ? 0 : Math.cos(t * .07) * 2);
        ctx.fillStyle = 'rgba(184,148,236,.14)'; ctx.beginPath(); ctx.arc(mx, my, 10, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#b894ec'; ctx.beginPath(); ctx.arc(mx, my, 5, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#8a64c8'; ctx.fillRect((mx + 1) | 0, (my + 1) | 0, 3, 3);
        // brilho da Fenda no horizonte
        const px = W * .34, py = H * (W < H ? .6 : .72), pulso = mov ? .7 : .6 + .4 * Math.sin(t * .9);
        const g = ctx.createRadialGradient(px, py, 0, px, py, 46); g.addColorStop(0, 'rgba(190,140,255,' + (.6 * pulso).toFixed(3) + ')'); g.addColorStop(1, 'rgba(190,140,255,0)');
        ctx.fillStyle = g; ctx.fillRect(px - 50, py - 50, 100, 100);
        // montanhas com paralaxe
        const cv2 = (l, k) => ctx.drawImage(l.c, Math.round(-l.folga + cam.x * k), Math.round(cam.y * k * .5));
        cv2(camadas.m1, 1.5); cv2(camadas.m2, 3); cv2(camadas.m3, 5);
        ctx.fillStyle = 'rgba(160,140,230,.07)';
        for (let i = 0; i < 3; i++) { const fx = ((i * W * .42 + (mov ? 0 : t * 4 * (1 + i * .3))) % (W * 1.4)) - W * .2; ctx.beginPath(); ctx.ellipse(fx, H * (.7 + i * .09), W * .3, 5 + i * 2, 0, 0, 6.283); ctx.fill(); }
        ctx.drawImage(camadas.fg, Math.round(-24 + cam.x * 9), Math.round(cam.y * 4));
      } else {
        ctx.fillStyle = 'rgba(217,229,197,.035)';
        for (let i = 0; i < 3; i++) { const fx = ((i * W * .4 + (mov ? 0 : t * 5)) % (W * 1.3)) - W * .15; ctx.beginPath(); ctx.ellipse(fx, H * (.3 + i * .22), W * .35, 5, 0, 0, 6.283); ctx.fill(); }
      }
      // vagalumes
      for (const v of vagalumes) {
        const x = v.x + (mov ? 0 : Math.sin(t * v.v + v.f) * v.r) + cam.x * 7, y = v.y + (mov ? 0 : Math.cos(t * v.v * .8 + v.f * 1.7) * v.r * .6);
        const br = mov ? .8 : .45 + .55 * Math.sin(t * 1.6 + v.f * 3);
        ctx.fillStyle = 'rgba(255,217,138,' + (.12 * br).toFixed(3) + ')'; ctx.fillRect((x | 0) - 2, (y | 0) - 2, 5, 5);
        ctx.fillStyle = 'rgba(255,236,170,' + (.9 * br).toFixed(3) + ')'; ctx.fillRect(x | 0, y | 0, 1, 1);
      }
      // estrela cadente
      if (!mov && camadas) {
        if (cometa.t === 0 && t > cometa.prox) { cometa = { t: t, prox: t + 7 + Math.random() * 8, x: W * (.2 + Math.random() * .6), y: 8 + Math.random() * 30 }; }
        if (cometa.t) {
          const k = (t - cometa.t) / .7;
          if (k >= 1) cometa.t = 0;
          else for (let i = 0; i < 12; i++) { const kk = Math.max(0, k - i * .012); ctx.fillStyle = 'rgba(255,255,255,' + ((1 - i / 12) * (1 - k)).toFixed(2) + ')'; ctx.fillRect((cometa.x - kk * 70) | 0, (cometa.y + kk * 34) | 0, 1, 1); }
        }
      }
    }

    function quadro(agora) {
      if (!rodando) return;
      raf = requestAnimationFrame(quadro);
      if (agora - ultimo < 1000 / fps) return;
      ultimo = agora;
      const t = (agora - t0) / 1000;
      try { desenhar(mov ? 0 : t); } catch (e) { rodando = false; }
    }
    return {
      iniciar() { if (rodando) return; montar(); desenhar(0); if (mov) return; rodando = true; raf = requestAnimationFrame(quadro); },
      parar() { rodando = false; cancelAnimationFrame(raf); },
      redimensionar() { montar(); desenhar((performance.now() - t0) / 1000); },
      olhar(nx, ny) { alvo.x = -nx * 2; alvo.y = -ny * 2; },
    };
  }

  /* ---------- tela ---------- */
  let cena = null, limpar = [];
  const tile = (acao, icone, rotulo) => '<button class="am-tile" data-a="' + acao + '"><span class="am-ico" aria-hidden="true">' + icone + '</span><b>' + rotulo + '</b></button>';

  function itemPrincipal(acao, icone, titulo, sub, extra, classe) {
    return '<button class="am-item ' + (classe || '') + '" data-a="' + acao + '"><span class="am-ico" aria-hidden="true">' + icone + '</span><span class="am-txt"><b>' + titulo + '</b><small>' + sub + '</small>' + (extra || '') + '</span><em aria-hidden="true">›</em></button>';
  }

  function montarHtml() {
    const tem = temSave(), r = tem ? resumoSave(chaveCampanha()) : null, teste = temTeste();
    const chips = r ? '<span class="am-stats">' +
      (r.nivel != null ? '<span>⚜ Reino Nv ' + r.nivel + '</span>' : '') + (r.dia != null ? '<span>☀ Dia ' + r.dia + '</span>' : '') +
      (r.herois != null ? '<span>⚔ ' + r.herois + (r.herois === 1 ? ' herói' : ' heróis') + '</span>' : '') +
      (r.salvo ? '<span class="am-quando">Salvo ' + haQuanto(r.salvo) + '</span>' : '') + '</span>' : '';
    const menu = [];
    let i = 0; const idx = () => ' style="--i:' + (i++) + '"';
    if (tem) menu.push('<div class="am-slot"' + idx() + '>' + itemPrincipal('t-continue', '▶', 'Continuar jornada', r ? 'Retome de onde parou' : 'Retome sua campanha salva', chips, 'am-primary') + '</div>');
    menu.push('<div class="am-slot"' + idx() + '>' + itemPrincipal('t-new', '⚔', tem ? 'Nova jornada' : 'Iniciar jornada', tem ? 'Recomeça do zero · pede confirmação' : 'Construa seu reino desde o início', '', tem ? '' : 'am-primary') + '</div>');
    menu.push('<div class="am-slot"' + idx() + '>' + itemPrincipal('sbstart:' + (teste ? '1' : '0'), '✧', teste ? 'Continuar ambiente de testes' : 'Ambiente de testes', 'Tudo liberado · editor de mundo · monstros', '', 'am-teal') + (teste ? '<button class="am-link" data-a="sbnew">Novo mundo de testes →</button>' : '') + '</div>');
    const ultimo = P.cfg.interface && P.cfg.interface.menuSair ? tile('am-sair', '⏻', 'Sair') : tile('am-sobre', 'ⓘ', 'Sobre');
    menu.push('<div class="am-tiles"' + idx() + '>' + tile('am-config', '⚙', 'Ajustes') + tile('am-jornada', '💾', 'Jornada') + tile('am-comojogar', '?', 'Como jogar') + ultimo + '</div>');
    const dica = P.suporta('gamepad') || P.suporta('teclado') ? '<span class="am-dica"><kbd>↑</kbd><kbd>↓</kbd> navegar · <kbd>Enter</kbd> escolher</span>' : '';
    return '<canvas class="am-fx" aria-hidden="true"></canvas><div class="am-veu"></div>' +
      '<header class="am-topo"><span class="am-marca"><i aria-hidden="true">✦</i> AURORA</span><span class="am-direita"><span class="am-selo">' + esc(P.cfg.rotulo || 'PC') + '</span><span class="am-selo am-versao">v' + esc(G.VERSION) + '</span>' +
      (!P.nativo && P.fullscreen.disponivel() && P.cfg.tela && P.cfg.tela.telaCheia ? '<button class="am-mini" data-a="am-fs" aria-label="Alternar tela cheia" title="Tela cheia">⛶</button>' : '') + '</span></header>' +
      '<main class="am-principal"><section class="am-heroi"><p class="am-kicker">SOB DUAS LUAS, NASCEM LENDAS</p><h1 class="am-logo" aria-label="Aurora">Aurora</h1><p class="am-sub">CRÔNICAS DA FENDA</p>' +
      '<p class="am-lema">Erga sua cidade. Equipe seus caçadores.<br>Escreva a próxima lenda da Fenda.</p><div class="am-campeoes" aria-hidden="false">' + campeoes() + '<div class="am-chao"></div></div></section>' +
      '<nav class="am-menu" aria-label="Menu principal">' + menu.join('') + '</nav></main>' +
      '<footer class="am-rodape"><span>UM REINO SE CONSTRÓI. UMA LENDA SE CONQUISTA.</span>' + dica + '</footer>';
  }

  function desenharMenu() {
    const title = $('#title');
    if (!title || title.classList.contains('recovering')) return;
    desfazer();
    for (const n of title.querySelectorAll('.inner,.am-root')) n.remove();
    title.classList.remove('sb-title'); title.classList.add('am-title');
    document.documentElement.style.setProperty('--ts', String((Cfg.get('interface.textScale') || 100) / 100));
    const root = document.createElement('div'); root.className = 'am-root'; root.innerHTML = montarHtml();
    title.appendChild(root);
    const cv = $('.am-fx', root);
    cena = criarCena(cv, title.classList.contains('has-city'));
    cena.iniciar();
    const aoMover = (e) => { if (cena) cena.olhar((e.clientX / innerWidth - .5) * 2, (e.clientY / innerHeight - .5) * 2); };
    const aoRedim = () => { if (cena) cena.redimensionar(); };
    if (P.cfg.entrada && P.cfg.entrada.mouse) window.addEventListener('pointermove', aoMover, { passive: true });
    window.addEventListener('resize', aoRedim);
    limpar.push(() => { window.removeEventListener('pointermove', aoMover); window.removeEventListener('resize', aoRedim); });
    requestAnimationFrame(() => { const a = document.activeElement; if (title.classList.contains('on') && !U.modalOpen && (!a || a === document.body || !a.matches('.am-item,.am-tile,.am-link'))) { const alvo = $('.am-item.am-primary', root) || $('.am-item', root); if (alvo) alvo.focus({ preventScroll: true }); } });
    const vigia = setInterval(() => { if (!title.classList.contains('on') || !root.isConnected) desfazer(); }, 700);   // o jogo começou ou a tela foi trocada
    limpar.push(() => clearInterval(vigia));
  }
  function desfazer() { if (cena) { cena.parar(); cena = null; } limpar.splice(0).forEach((f) => { try { f(); } catch (e) { /* já removido */ } }); }

  /* ---------- janelas ---------- */
  const modal = (corpo, fechar) => U.modal('<section class="am-modal">' + corpo + '</section>', fechar === false ? { lock: true } : undefined);
  const cab = (kicker, titulo) => '<header class="am-mcab"><div><span class="am-kicker">' + kicker + '</span><h2>' + titulo + '</h2></div><button class="am-x" data-a="mclose" aria-label="Fechar">×</button></header>';

  const pct = (v) => Math.round((Number(v) || 0) * 100);
  const slider = (chave, rotulo, extra) => '<label class="am-campo"><span>' + rotulo + '<output data-saida="' + chave + '">' + pct(Cfg.get(chave)) + '%</output></span><input type="range" min="0" max="100" step="5" value="' + pct(Cfg.get(chave)) + '" data-cfg="' + chave + '" data-tipo="pct"></label>' + (extra || '');
  const segmentado = (chave, rotulo, opcoes, dica) => {
    const atual = String(Cfg.get(chave));
    return '<div class="am-campo"><span>' + rotulo + '</span><div class="am-seg" role="radiogroup" aria-label="' + esc(rotulo) + '">' +
      opcoes.map(([v, t]) => '<button type="button" role="radio" aria-checked="' + (String(v) === atual) + '" class="' + (String(v) === atual ? 'on' : '') + '" data-a="am-set:' + chave + ':' + v + '">' + t + '</button>').join('') + '</div>' + (dica ? '<small>' + dica + '</small>' : '') + '</div>';
  };
  const alternador = (chave, rotulo, dica) => {
    const on = !!Cfg.get(chave);
    return '<button type="button" class="am-troca' + (on ? ' on' : '') + '" role="switch" aria-checked="' + on + '" data-a="am-flip:' + chave + '"><span><b>' + rotulo + '</b>' + (dica ? '<small>' + dica + '</small>' : '') + '</span><i aria-hidden="true"></i></button>';
  };

  const ABAS = [['audio', 'Áudio'], ['graficos', 'Gráficos'], ['controles', 'Controles'], ['acessibilidade', 'Acessibilidade'], ['sobre', 'Plataforma']];
  let abaAtual = 'audio';

  function abaAudio() {
    return '<p class="am-nota">Valem para a campanha e para o ambiente de testes. Dentro do jogo, mudar o volume em Opções atualiza estes mesmos valores.</p>' +
      slider('audio.sfx', 'Efeitos sonoros') + slider('audio.music', 'Música') + slider('audio.ambient', 'Som ambiente') +
      '<div class="am-acoes"><button class="am-btn" data-a="am-mudo">Silenciar tudo</button><button class="am-btn" data-a="am-padraoaudio">Voltar ao padrão</button></div>';
  }
  function abaGraficos() {
    return segmentado('tela.qualidade', 'Qualidade dos efeitos', [['auto', 'Automática'], ['alta', 'Alta'], ['baixa', 'Econômica']], 'Automática liga o modo leve sozinha se o aparelho engasgar.') +
      segmentado('tela.dprCap', 'Nitidez da imagem', [[1, 'Padrão'], [2, 'Alta'], [3, 'Máxima']], 'Máxima deixa os pixels mais finos, mas gasta mais bateria.') +
      alternador('tela.reduzirMovimento', 'Reduzir movimento', 'Menos tremores, brilhos e animações.') +
      alternador('tela.economiaBateria', 'Economia de bateria', 'Menos quadros por segundo nos efeitos.') +
      (P.nativo || 'wakeLock' in navigator ? alternador('sistema.manterTelaLigada', 'Manter a tela ligada', 'Evita que a tela apague enquanto você joga.') : '') +
      (!P.nativo && P.fullscreen.disponivel() ? '<div class="am-acoes"><button class="am-btn" data-a="am-fs">Alternar tela cheia (' + esc(P.Teclas.rotulo(P.Teclas.acoes().find((a) => a.id === 'telaCheia').atual)) + ')</button></div>' : '');
  }
  function abaControles() {
    const ac = P.Teclas.acoes();
    const linhas = ac.map((a) => '<div class="am-tecla"><span>' + esc(a.rotulo) + '</span>' +
      (a.remapeavel ? '<button class="am-kbd" data-a="am-tecla:' + a.id + '" aria-label="Alterar tecla de ' + esc(a.rotulo) + '">' + esc(a.rotuloAtual) + '</button>' : '<kbd class="am-kbd fixa">' + esc(a.rotuloAtual) + '</kbd>') + '</div>').join('');
    const C = P.controles, lista = (o) => Object.entries(o).filter(([k]) => k !== 'observacao').map(([k, v]) => '<li><b>' + esc(k.replace(/([A-Z])/g, ' $1').toLowerCase()) + '</b> ' + esc(v) + '</li>').join('');
    return '<p class="am-nota">Teclado de PC — vale em PC, no Android com teclado e em qualquer plataforma futura. Clique numa tecla e aperte a nova.</p><div class="am-teclas">' + linhas + '</div>' +
      '<div class="am-acoes"><button class="am-btn" data-a="am-teclas-padrao">Restaurar teclas</button></div>' +
      '<div class="am-duas"><section><h3>Mouse</h3><ul>' + lista(C.mouse || {}) + '</ul></section><section><h3>Toque</h3><ul>' + lista(C.toque || {}) + '</ul></section><section><h3>Controle</h3><ul>' + lista(C.gamepad || {}) + '</ul></section></div>';
  }
  function abaAcessibilidade() {
    return segmentado('interface.textScale', 'Tamanho do texto', [[100, '100%'], [115, '115%'], [130, '130%']]) +
      alternador('interface.altoContraste', 'Alto contraste', 'Texto claro sobre fundo escuro nos painéis.') +
      alternador('interface.canhoto', 'Modo canhoto', 'Move os controles principais para o outro lado da tela.');
  }
  function abaSobre() {
    const ordem = Object.keys(P.perfis);
    const cartoes = ordem.map((id) => { const p = P.perfis[id]; return '<li class="' + (id === P.perfil ? 'atual' : '') + '"><b>' + esc(p.rotulo) + '</b><em class="' + esc(p.estado) + '">' + (id === P.perfil ? 'você está aqui' : esc(p.estado)) + '</em><small>' + esc(p.descricao || '') + '</small></li>'; }).join('');
    return '<dl class="am-info"><div><dt>Jogo</dt><dd>Aurora — Crônicas da Fenda</dd></div><div><dt>Versão</dt><dd>' + esc(G.VERSION) + '</dd></div><div><dt>Build</dt><dd>' + esc(G.BUILD || '') + '</dd></div><div><dt>Plataforma</dt><dd>' + esc(P.cfg.rotulo) + (P.nativo ? ' (app nativo)' : ' (navegador)') + '</dd></div></dl>' +
      '<h3 class="am-h3">Perfis de plataforma</h3><p class="am-nota">O PC é a base: todos os outros herdam todos os controles e ajustes dele e só mudam o que for diferente.</p><ul class="am-perfis">' + cartoes + '</ul>' +
      '<div class="am-acoes"><button class="am-btn perigo" data-a="am-resetar">Restaurar todas as configurações</button></div>';
  }
  const CORPOS = { audio: abaAudio, graficos: abaGraficos, controles: abaControles, acessibilidade: abaAcessibilidade, sobre: abaSobre };

  function abrirConfig(aba) {
    abaAtual = CORPOS[aba] ? aba : abaAtual;
    const guia = ABAS.map(([id, t]) => '<button role="tab" aria-selected="' + (id === abaAtual) + '" class="' + (id === abaAtual ? 'on' : '') + '" data-a="am-aba:' + id + '">' + t + '</button>').join('');
    modal(cab('AJUSTES', 'Configurações') + '<div class="am-abas" role="tablist">' + guia + '</div><div class="am-corpo" role="tabpanel">' + CORPOS[abaAtual]() + '</div>');
    const corpo = $('#modal .am-corpo'); if (corpo) corpo.scrollTop = 0;
  }
  const reabrir = () => { const c = $('#modal .am-corpo'), y = c ? c.scrollTop : 0; abrirConfig(abaAtual); const n = $('#modal .am-corpo'); if (n) n.scrollTop = y; };

  U.ACT['am-config'] = () => abrirConfig();
  U.ACT['am-sobre'] = () => abrirConfig('sobre');
  U.ACT['am-aba'] = (a) => { P.pararCaptura(); abrirConfig(a[0]); };
  U.ACT['am-set'] = (a) => { const v = isNaN(Number(a[1])) ? a[1] : Number(a[1]); Cfg.set(a[0], v); reabrir(); };
  U.ACT['am-flip'] = (a) => { Cfg.set(a[0], !Cfg.get(a[0])); reabrir(); };
  U.ACT['am-mudo'] = () => { for (const k of ['audio.sfx', 'audio.music', 'audio.ambient']) Cfg.set(k, 0); reabrir(); };
  U.ACT['am-padraoaudio'] = () => { for (const k of ['audio.sfx', 'audio.music', 'audio.ambient']) Cfg.set(k, Cfg.padrao(k)); reabrir(); };
  U.ACT['am-teclas-padrao'] = () => { P.Teclas.restaurar(); reabrir(); };
  U.ACT['am-resetar'] = () => U.confirm('Restaurar configurações?', 'Áudio, gráficos, controles e acessibilidade voltam ao padrão desta plataforma. Seu jogo salvo não é afetado.', 'Restaurar', () => { Cfg.restaurar(); P.Teclas.restaurar(); desenharMenu(); abrirConfig('audio'); U.toast('Configurações restauradas.', 'good'); });
  U.ACT['am-fs'] = () => P.fullscreen.alternar();
  U.ACT['am-sair'] = () => U.confirm('Sair de Aurora?', 'O jogo salva sozinho; seu progresso continua aqui quando você voltar.', 'Sair', () => { P.Sistema.sair(); });
  U.ACT['am-tecla'] = (a, el) => {
    const id = a[0], botao = el || $('#modal [data-a="am-tecla:' + id + '"]'); if (!botao) return;
    botao.textContent = 'Aperte uma tecla…'; botao.classList.add('esperando');
    P.capturarProximaTecla((e) => {
      if (e.code === 'Escape') { reabrir(); return true; }
      const r = P.Teclas.definir(id, e.code);
      if (!r.ok) { U.toast(r.motivo, 'bad'); return false; }
      if (r.trocouCom) U.toast('Troquei com "' + (P.controles.teclado[r.trocouCom].rotulo) + '".', 'info');
      reabrir(); return true;
    });
  };
  // controles deslizantes
  document.addEventListener('input', (e) => {
    const el = e.target; if (!el || !el.dataset || !el.dataset.cfg) return;
    const v = el.dataset.tipo === 'pct' ? Number(el.value) / 100 : Number(el.value);
    Cfg.set(el.dataset.cfg, v);
    const saida = $('#modal output[data-saida="' + el.dataset.cfg + '"]'); if (saida) saida.textContent = el.dataset.tipo === 'pct' ? el.value + '%' : el.value;
  });

  U.ACT['am-jornada'] = () => {
    const tem = temSave(), r = tem ? resumoSave(chaveCampanha()) : null;
    modal(cab('SEU PROGRESSO', 'Jornada salva') +
      '<p class="am-nota">' + (tem ? 'Salva neste aparelho' + (r && r.salvo ? ' ' + haQuanto(r.salvo) : '') + '. Exporte para guardar uma cópia ou levar para outro aparelho.' : 'Ainda não há jornada salva neste aparelho. Você pode importar uma de outro aparelho.') + '</p>' +
      '<div class="am-lista">' +
      '<button class="am-linha" data-a="t-import"><span class="am-ico">⇪</span><span><b>Importar jornada</b><small>Colar um código exportado</small></span></button>' +
      (tem ? '<button class="am-linha" data-a="save-file"><span class="am-ico">⇩</span><span><b>' + (P.cfg.armazenamento && P.cfg.armazenamento.exportar === 'compartilhar' ? 'Compartilhar arquivo da jornada' : 'Baixar arquivo da jornada') + '</b><small>Cópia de segurança em .txt</small></span></button>' +
        '<button class="am-linha" data-a="am-codigo"><span class="am-ico">⎘</span><span><b>Copiar código da jornada</b><small>Texto único para colar em outro aparelho</small></span></button>' : '') + '</div>');
  };
  U.ACT['am-codigo'] = () => U.exportModal();

  U.ACT['am-comojogar'] = () => {
    const toque = !!(P.cfg.entrada && P.cfg.entrada.toque && P.cfg.entrada.toque !== false) && (P.nativo || matchMedia('(pointer:coarse)').matches);
    const T = P.controles.toque || {}, M = P.controles.mouse || {}, tec = (id) => P.Teclas.acoes().find((a) => a.id === id);
    const linhasTeclado = [
      [tec('pausar').rotuloAtual, 'Pausar / continuar'],
      [tec('velocidade1').rotuloAtual + ' · ' + tec('velocidade2').rotuloAtual + ' · ' + tec('velocidade3').rotuloAtual, 'Velocidade do reino'],
      [tec('mapa').rotuloAtual, 'Mapa do mundo'], ['Esc', 'Fechar janela / abrir o menu do jogo'],
      ['Roda', M.roda || ''], ['Arrastar', M.arrastar || ''],
    ];
    const teclado = '<section class="am-bloco"><h3>Teclado e mouse</h3><dl class="am-atalhos">' + linhasTeclado.map(([k, d]) => '<div><dt>' + esc(k) + '</dt><dd>' + esc(d) + '</dd></div>').join('') + '</dl></section>';
    const dedos = '<section class="am-bloco"><h3>Toque</h3><dl class="am-atalhos"><div><dt>Arrastar</dt><dd>' + esc(T.arrastar || '') + '</dd></div><div><dt>Pinça</dt><dd>' + esc(T.pinca || '') + '</dd></div><div><dt>Tocar</dt><dd>' + esc(T.toque || '') + '</dd></div><div><dt>Segurar</dt><dd>' + esc(T.segurarBotaoDeMelhoria || '') + '</dd></div>' + (P.cfg.sistema && P.cfg.sistema.voltarFechaJanelas ? '<div><dt>Voltar</dt><dd>Fecha a janela aberta ou abre o menu</dd></div>' : '') + '</dl></section>';
    modal(cab('COMECE SUA LENDA', 'Como jogar') +
      '<ol class="am-passos"><li><b>Cuide da cidade.</b> No painel Cidade, construa e melhore os serviços dos caçadores.</li><li><b>Prepare os heróis.</b> Recrute pelo Portal, acompanhe as necessidades e equipe as peças do Arsenal.</li><li><b>Conclua objetivos.</b> As Missões mostram o próximo passo e as recompensas prontas.</li><li><b>Explore o mundo.</b> Os caçadores agem por conta própria — você orienta o reino.</li></ol>' +
      (toque ? dedos + teclado : teclado + dedos) + '<p class="am-nota">Salvamento automático a cada 20 segundos neste aparelho.</p>');
  };

  /* ---------- ligação com o jogo ---------- */
  const anterior = U.showTitle;
  U.showTitle = function () {
    const r = anterior.apply(this, arguments);
    queueMicrotask(desenharMenu);      // depois dos redesenhos antigos da tela de título
    return r;
  };
  G.hook('titleShow', () => queueMicrotask(() => { const t = $('#title'); if (t && t.classList.contains('on') && !t.querySelector('.am-root')) desenharMenu(); }), 250000);
  G.on('start', desfazer);
  const t0 = $('#title'); if (t0 && t0.classList.contains('on')) queueMicrotask(desenharMenu);
  window.AuroraMenu = Object.freeze({ redesenhar: desenharMenu, abrirConfig });
})();
