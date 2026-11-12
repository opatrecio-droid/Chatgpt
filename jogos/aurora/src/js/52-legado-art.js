/* 52-legado-art: arte da v21 — asas e mascotes (dois quadros cada) e ícones do guarda-roupa. */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const A = G.A, Pix = A.Pix, INK = '#1a1422';

  /* asas: 30×22, presas às costas do herói (ele olha para a direita) */
  const wingPix = (id, f) => {
    const d = G.COS[id], [b, s, l] = d.c, p = new Pix(30, 22), up = f ? 0 : 2;
    if (d.bat) {
      p.tri(15, 12, 2, 3 + up, 6, 15, b); p.tri(15, 12, 6, 15, 11, 17, b); p.line(15, 12, 2, 3 + up, s); p.line(15, 12, 5, 9 + up, s); p.line(15, 12, 8, 15, s);
      p.tri(15, 12, 24, 4 + up, 21, 14, s); p.line(15, 12, 24, 4 + up, b); p.set(2, 3 + up, l); p.set(24, 4 + up, l);
    } else if (id === 'a_fada') {
      p.ell(8, 8 + up, 6, 4.2, b); p.ell(9, 15, 4.5, 3, b); p.ell(8, 8 + up, 3.5, 2.2, l); p.ell(9, 15, 2.4, 1.4, l);
      p.ell(21, 9 + up, 4, 3, s); p.ell(20, 15, 3, 2, s); p.set(4, 6 + up, '#ffffff'); p.set(12, 16, '#ffffff');
    } else {
      p.ell(8, 9 + up, 6.5, 4, b); p.tri(2, 9 + up, 14, 10, 4, 18, b); for (let i = 0; i < 4; i++) { p.line(4 + i * 3, 11 + up, 3 + i * 3, 17 - i, s); p.set(3 + i * 3, 18 - i, l); }
      p.row(4, 12, 6 + up, l); p.ell(21, 10 + up, 4, 3, s); p.tri(18, 10 + up, 25, 10, 23, 16, s);
    }
    return p.outline(INK);
  };
  /* mascotes: 14×12, olhando para a direita */
  const petPix = (id, f) => {
    const d = G.COS[id], [b, s, l] = d.c, p = new Pix(14, 12), hop = f ? 1 : 0;
    switch (d.kind) {
      case 'ave': p.ell(7, 6 - hop, 3.6, 3.8, b); p.ell(7, 7 - hop, 2, 2.4, l); p.set(6, 4 - hop, INK); p.set(9, 4 - hop, INK); p.set(8, 5 - hop, '#e2b659'); p.tri(3, 5 - hop, 1, 8 - hop * 3, 5, 8 - hop, s); p.tri(11, 5 - hop, 13, 8 - hop * 3, 9, 8 - hop, s); p.set(5, 2 - hop, s); p.set(9, 2 - hop, s); break;
      case 'fada': p.ell(7, 6 - hop, 2.2, 2.6, b); p.set(7, 3 - hop, l); p.ell(3.5, 5 - hop * 2, 2.6, 2, l); p.ell(10.5, 5 - hop * 2, 2.6, 2, l); p.set(8, 5 - hop, INK); p.set(7, 9 - hop, s); p.set(2, 9, '#fff0a0'); p.set(12, 2, '#fff0a0'); break;
      case 'draco': p.ell(6, 8, 3.8, 2.6, b); p.ell(10, 5, 2.6, 2.2, b); p.set(11, 4, INK); p.set(13, 6, l); p.tri(5, 6, 2, 1 + hop * 2, 8, 5, s); p.line(2, 9, 0, 7, b); p.rect(4, 10, 2, 2 - hop, s); p.rect(8, 10, 2, 1 + hop, s); p.set(9, 2, l); break;
      default: { // gato e raposa
        p.ell(6, 8, 4, 2.6, b); p.ell(10, 5, 2.8, 2.4, b); p.tri(8, 1, 9, 4, 10, 4, b); p.tri(12, 1, 11, 4, 12, 4, b); p.set(11, 5, INK); p.set(13, 6, d.kind === 'raposa' ? INK : '#f0a0a0'); p.row(5, 8, 9, l);
        p.rect(3, 10, 2, 2 - hop, s); p.rect(8, 10, 2, 1 + hop, s);
        if (d.kind === 'raposa') { p.line(2, 8, 0, 4 + hop, b); p.line(1, 8, 0, 5 + hop, b); p.set(0, 4 + hop, l); p.set(12, 7, l); } else { p.line(2, 7, 1, 3 + hop, b); p.set(1, 3 + hop, s); }
      }
    }
    return p.outline(INK);
  };
  const sheets = new Map();
  const two = (key, w, h, fn, id) => { let s = sheets.get(key); if (s) return s; s = A.mk(w * 2, h); const x = s.getContext('2d'); x.drawImage(fn(id, 0).canvas(), 0, 0); x.drawImage(fn(id, 1).canvas(), w, 0); sheets.set(key, s); return s; };
  A.wingSheet = (id) => (G.COS[id] && G.COS[id].slot === 'asas' ? two('w' + id, 30, 22, wingPix, id) : null);
  A.petSheet = (id) => (G.COS[id] && G.COS[id].slot === 'pet' ? two('p' + id, 14, 12, petPix, id) : null);
  /* miniatura de qualquer peça do guarda-roupa, para os painéis */
  const urls = {};
  A.cosURL = (id, h) => {
    const d = G.COS[id], k = id + (d.slot === 'traje' && h ? '|' + h.cls + '|' + (h.look ? h.look.skin + '.' + h.look.hair + '.' + h.look.style : '') : '');
    if (urls[k]) return urls[k];
    let cv;
    if (d.slot === 'asas') { cv = A.mk(30, 22); cv.getContext('2d').drawImage(A.wingSheet(id), 0, 0, 30, 22, 0, 0, 30, 22); }
    else if (d.slot === 'pet') { cv = A.mk(14, 12); cv.getContext('2d').drawImage(A.petSheet(id), 0, 0, 14, 12, 0, 0, 14, 12); }
    else if (d.slot === 'traje') { const fake = Object.assign({}, h || { cls: 'esp', rank: 0, gear: {}, look: { skin: 1, hair: 2, style: 1, seed: 1 } }, { cos: { traje: id } }); return (urls[k] = A.fullBody(A.heroLook(fake))); }
    else { // relíquia: um emblema com a cor da zona
      const p = new Pix(16, 16), z = d.boss ? G.ZONE[d.boss] : null, c = z ? z.color : '#b06ae8';
      p.tri(8, 1, 2, 7, 14, 7, c); p.tri(2, 7, 14, 7, 8, 15, c); p.tri(8, 1, 8, 15, 14, 7, A.shade(c, 0.7)); p.line(8, 2, 8, 13, A.mix(c, '#ffffff', 0.6)); p.set(5, 6, '#ffffff'); p.set(6, 5, '#ffffff'); p.rect(6, 0, 4, 1, '#e2b659'); p.set(8, 15, '#e2b659');
      cv = p.outline(INK).canvas();
    }
    return (urls[k] = cv.toDataURL());
  };
})();

;
