/* 56-ui-pixel: v27 (fase C) — a pele de pixel art da interface. Tudo é gerado em canvas uma vez, na inicialização:
   • molduras 9-slice (painel, placa, cartão, botões, encaixe, pergaminho) viram variáveis CSS (--f-*) usadas em border-image;
   • ícones 16×16 de grades de texto (um contorno escuro de 1 px é acrescentado sozinho) viram classes .i-nome;
   • esprites grandes (24×24) dos atalhos do mapa.
   Escala: a moldura é desenhada com FK pixels do aparelho por "texel" (≈ 2 px de CSS) e o ícone com IK pixels do aparelho por pixel do desenho
   (≈ 1 px de CSS); assim nada cai em fração de pixel do aparelho, nem com devicePixelRatio 1,5 ou 2,625. Os tamanhos em CSS saem de --u e --ip. */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const dpr = window.devicePixelRatio || 1;
  const FK = Math.max(2, Math.round(2 * dpr));          // pixels do aparelho por texel de moldura
  const IK = Math.max(1, Math.round(dpr));              // pixels do aparelho por pixel de ícone
  const U = FK / dpr, IP = IK / dpr;                    // tamanho em px de CSS
  const PX = (G.PX = { dpr, FK, IK, U, IP, icons: {}, mono: {}, big: {}, url: {} });

  /* ---------- paleta das molduras (a mesma da prancha de estilo) ---------- */
  const FP = { o: '#140c0a', a: '#2b1a12', b: '#3d2618', c: '#5a3a22', d: '#7d5430', e: '#a3743f', f: '#24160f', g: '#2e1d14', p: '#ead9ae', q: '#cdb682', r: '#fff6d8', B: '#d9a441', L: '#f6d57a', D: '#8a5f1c', k: '#0d0806', s: '#4a3e34', t: '#6e5f4e', u: '#2e261f', v: '#2e261f' };
  /* ---------- paleta dos ícones: uma letra por cor, rampas de 3 a 5 tons (luz vem de cima, à esquerda) ---------- */
  const IPAL = {
    k: '#140c0a',
    W: '#ffffff', S: '#e6edf5', s: '#b4c0d0', t: '#7c8aa0', T: '#4c586c',
    Y: '#fff3b0', y: '#f6d57a', a: '#d9a441', A: '#a8741f', Z: '#6e4a12',
    e: '#d49a58', E: '#a3743f', d: '#7d5430', D: '#5a3a22', c: '#3d2618',
    R: '#ff9a80', r: '#e05a40', q: '#b03a28', Q: '#6e1f18',
    G: '#c0ee94', g: '#7cc454', h: '#4c8a34', H: '#2a5a22',
    B: '#c0e2ff', b: '#7cb4e8', n: '#4a82c0', N: '#2a4a80',
    P: '#ecd4ff', p: '#c098f0', o: '#8a5ac8', O: '#55308a',
    K: '#ffc8dc', j: '#f08ab0', J: '#c04c7c',
    M: '#fff6d8', m: '#ead9ae', l: '#cdb682', L: '#9c8450',
    F: '#ffc070', f: '#e88030', u: '#a84c18',
    C: '#b8f4f0', i: '#5cc8c8', I: '#2e8a94',
    x: '#3a2820', X: '#1a100c', w: '#fff6d8',
  };
  PX.IPAL = IPAL;

  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  /* ---------- molduras ---------- */
  const frameURL = (rows, pal, k) => {
    const h = rows.length, w = Math.max(...rows.map((r) => r.length)), c = cv(w * k, h * k), x = c.getContext('2d');
    rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const col = pal[r[i]]; if (col) { x.fillStyle = col; x.fillRect(i * k, j * k, k, k); } } });
    return c.toDataURL();
  };
  /* cada moldura é { rows, pal }: a mesma grade pode sair em outras cores trocando só a paleta (as letras ficam as mesmas) */
  FP.A = '#b5822f';
  const V = (rows, ov) => ({ rows, pal: Object.assign({}, FP, ov || {}) });
  const BASE = {
    panel: ['ooooooooooooo', 'oLBDeeeeeDBLo', 'oBLBddddDBLBo', 'oDBocccccoBDo', 'oedcobbbocdeo', 'oedcbokobcdeo', 'oedcbkfkbcdeo', 'oedcbokobcdeo', 'oedcobbbocdeo', 'oDBocccccoBDo', 'oBLBddddDBLBo', 'oLBDaaaaaDBLo', 'ooooooooooooo'],
    plaque: ['ooooooo', 'oeddddo', 'odbbbao', 'odbbbao', 'odbbbao', 'odaaaao', 'ooooooo'],
    btn: ['ooooooo', 'orLLLLo', 'oLBBBDo', 'oLBBBDo', 'oLBBBDo', 'oDDDDDo', 'ooooooo'],
    btnp: ['ooooooo', 'oDDDDDo', 'oDAAABo', 'oDAAABo', 'oDAAABo', 'oBBBBBo', 'ooooooo'],
    btnw: ['ooooooo', 'oeeeedo', 'oecccbo', 'oecccbo', 'oecccbo', 'odbbbbo', 'ooooooo'],
    btnwp: ['ooooooo', 'odbbbbo', 'odbbbco', 'odbbbco', 'odbbbco', 'oeeeeeo', 'ooooooo'],
    btnd: ['ooooooo', 'otssssu', 'otsssuv', 'otsssuv', 'otsssuv', 'ouvvvvo', 'ooooooo'],
    slot: ['kkkkk', 'kaaac', 'kafgd', 'kagfd', 'kcddd'],
    parch: ['oooo oooo', ' orrrrro ', 'orppppqo ', 'orpppppqo', 'orpppppqo', 'orpppppqo', ' orppppqo', 'oqqqqqqo ', 'oooo oooo'].map((r) => r.padEnd(9, ' ')),
    card: ['ooooooo', 'ocbbbbo', 'obgggfo', 'obgggfo', 'obgggfo', 'oaffffo', 'ooooooo'],
    cardhl: ['ooooooo', 'oLBBBBo', 'oBgggDo', 'oBgggDo', 'oBgggDo', 'oDDDDDo', 'ooooooo'],
    cardred: ['ooooooo', 'oRrrrro', 'orgggQo', 'orgggQo', 'orgggQo', 'oQQQQQo', 'ooooooo'],
    cardvio: ['ooooooo', 'oPppppo', 'opgggOo', 'opgggOo', 'opgggOo', 'oOOOOOo', 'ooooooo'],
    cardgrn: ['ooooooo', 'oGhhhho', 'ohgggHo', 'ohgggHo', 'ohgggHo', 'oHHHHHo', 'ooooooo'],
  };
  const COL = { r: { r: '#ffd0c0', L: '#ff9a80', B: '#c2452f', D: '#7a2418', A: '#a83a28' }, v: { r: '#f0e0ff', L: '#d2b0f5', B: '#a877e0', D: '#5a3590', A: '#8a5cc0' }, g: { r: '#e0f8c8', L: '#b4e68a', B: '#6aa544', D: '#3d7a2a', A: '#558c36' } };
  const OV = { cardred: { R: '#ff9a80', r: '#e05a40', Q: '#6e1f18' }, cardvio: { P: '#ecd4ff', p: '#c098f0', O: '#55308a' }, cardgrn: { G: '#c0ee94', h: '#4c8a34', H: '#2a5a22' } };
  const F = {};
  for (const k in BASE) F[k] = V(BASE[k], OV[k]);
  for (const c in COL) { F['btn' + c] = V(BASE.btn, COL[c]); F['btn' + c + 'p'] = V(BASE.btnp, COL[c]); }

  /* ---------- ícones ---------- */
  /* grade de texto → canvas 16×16 (ou maior), com contorno automático de 1 px ao redor de tudo que é opaco.
     `big`: contorno duplo (o segundo anel semitransparente) e sombra de 1 px para baixo, para ler sobre qualquer terreno. */
  const spriteCanvas = (rows, o) => {
    o = o || {};
    const w0 = Math.max(...rows.map((r) => r.length)), h0 = rows.length;
    const pad = o.big ? 3 : 1, S = o.size || Math.max(o.big ? 24 : 16, Math.max(w0, h0) + pad * 2);
    const ox = Math.floor((S - w0) / 2), oy = Math.floor((S - h0) / 2) - (o.big ? 0 : 0);
    const g = []; for (let j = 0; j < S; j++) g.push(new Array(S).fill(null));
    rows.forEach((r, j) => { for (let i = 0; i < w0; i++) { const ch = r[i]; if (ch && ch !== '.' && ch !== ' ') { const c = IPAL[ch]; if (c) g[oy + j][ox + i] = c; } } });
    const has = (x, y) => x >= 0 && y >= 0 && x < S && y < S && g[y][x];
    const c = cv(S, S), x = c.getContext('2d');
    /* sombra / anel externo semitransparente (só nos grandes) */
    if (o.big) {
      x.fillStyle = 'rgba(20,12,10,.38)';
      for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) if (!g[j][i]) { let hit = false; for (let dj = -2; dj <= 2 && !hit; dj++) for (let di = -2; di <= 2; di++) if (Math.abs(di) + Math.abs(dj) <= 2 && has(i + di, j + dj - 1) && (di || dj)) { hit = true; break; } if (hit) x.fillRect(i, j, 1, 1); }
    }
    const ol = IPAL.k;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      if (g[j][i]) { x.fillStyle = g[j][i]; x.fillRect(i, j, 1, 1); }
      else if (has(i - 1, j) || has(i + 1, j) || has(i, j - 1) || has(i, j + 1)) { x.fillStyle = ol; x.fillRect(i, j, 1, 1); }
    }
    return c;
  };
  /* ícone de uma cor só (setas, fechar...): máscara; recebe a cor de `color` */
  const monoCanvas = (rows) => {
    const w0 = Math.max(...rows.map((r) => r.length)), h0 = rows.length, S = Math.max(16, w0, h0), c = cv(S, S), x = c.getContext('2d');
    const ox = Math.floor((S - w0) / 2), oy = Math.floor((S - h0) / 2); x.fillStyle = '#fff';
    rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== '.' && r[i] !== ' ') x.fillRect(ox + i, oy + j, 1, 1); });
    return c;
  };
  PX.addIcons = (o) => { for (const k in o) PX.icons[k] = o[k].split('\n').map((s) => s.replace(/\s+$/, '')).filter((s) => s.length); };
  PX.addMono = (o) => { for (const k in o) PX.mono[k] = o[k].split('\n').filter((s) => s.trim() !== ''); };
  PX.addBig = (o) => { for (const k in o) PX.big[k] = o[k].split('\n').filter((s) => s.trim() !== ''); };
  PX.canvas = (name, big) => spriteCanvas(big ? PX.big[name] : PX.icons[name], { big: !!big });
  PX.dataURL = (name, big) => { const k = (big ? 'B:' : '') + name; return PX.url[k] || (PX.url[k] = PX.canvas(name, big).toDataURL()); };
  /* uma imagem de qualquer grade de texto (para o que o jogo ainda desenhar de última hora) */
  PX.fromRows = (rows, o) => spriteCanvas(rows, o).toDataURL();

  /* o HTML do ícone: <i class="i" data-i="nome">. (A classe fica só "i" para os chamadores que ainda fazem .replace('class="i"', ...).) */
  PX.ic = (n) => '<i class="i" data-i="' + (PX.mono[n] || PX.icons[n] ? n : 'info') + '"' + (PX.mono[n] ? ' data-m' : '') + '></i>';
  /* para dentro de um SVG (brasões da Arena): a imagem do ícone em 24×24 unidades */
  PX.svgInner = (n) => '<image href="' + PX.dataURL(PX.icons[n] ? n : 'info') + '" x="0" y="0" width="24" height="24" style="image-rendering:pixelated"/>';

  /* ---------- na inicialização: variáveis CSS e a folha dos ícones ---------- */
  PX.init = () => {
    if (PX.ready) return; PX.ready = true;
    const root = document.documentElement.style;
    root.setProperty('--u', U + 'px'); root.setProperty('--ip', IP + 'px');
    for (const k in F) root.setProperty('--f-' + k, 'url(' + frameURL(F[k].rows, F[k].pal, FK) + ')');
    /* fatias em pixels da imagem (texels × FK) */
    for (const n of [2, 3, 4, 6]) { root.setProperty('--k' + n, String(n * FK)); root.setProperty('--b' + n, 'calc(var(--u) * ' + n + ')'); }
    let css = '';
    for (const k in PX.icons) css += '.i[data-i="' + k + '"]{--ib:url(' + PX.dataURL(k) + ')}';
    for (const k in PX.mono) css += '.i[data-i="' + k + '"]{--ib:url(' + monoCanvas(PX.mono[k]).toDataURL() + ')}';
    for (const k in PX.big) css += '.bx[data-s="' + k + '"]{--ib:url(' + PX.dataURL(k, true) + ')}';
    const st = document.createElement('style'); st.id = 'px-icons'; st.textContent = css; document.head.appendChild(st);
  };
})();

;
