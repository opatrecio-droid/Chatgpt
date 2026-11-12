/* 6L-ui-limpeza: v27 (fase C, C3) — o HUD em repouso fica limpo. Só reorganiza; nada que o jogador precisa some.
   • Uma faixa de objetivo só no rodapé: a Jornada (#quest) e a Próxima recompensa (#nrw) se revezam; recompensa pronta passa na frente.
     O que está para resgatar também aparece como número no botão Missões e faz o ícone dele pular.
   • Fichas de estado (Semana, Colosso, Sorte): só o ícone; um toque abre o texto, outro toque abre a tela (ou o toque some depois de uns segundos).
   • O aviso único (fila de 1) e a bandeja do registro vivem em 60-ui; a bandeja de recursos também (toque na linha de moedas). */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const UI = G.UI, $ = UI.$;

  /* ---------- faixa de objetivo: quem aparece agora ---------- */
  let rot = false, since = 0;
  const arbitrate = () => {
    const app = $('#app'), q = $('#quest'), n = $('#nrw'); if (!app || !q || !n || !G.S) return;
    const qDone = q.classList.contains('done'), nOn = n.classList.contains('on'), nRdy = n.classList.contains('rdy'), qHidden = q.style.display === 'none';
    const now = performance.now(); let useN;
    if (!nOn || qDone) useN = false;                  // só a Jornada, ou a Jornada pronta para resgatar (vem primeiro)
    else if (nRdy || qHidden) useN = true;            // recompensa pronta passa na frente
    else { if (now - since > 9000) { rot = !rot; since = now; } useN = rot; }      // nenhuma pronta: revezam de 9 em 9 s
    app.classList.toggle('obj-n', useN);
  };

  /* ---------- selo de recompensa no botão Missões ---------- */
  let lastPulse = null;
  const pulse = () => {
    const b = $('#nav-missoes'); if (!b) return; const on = !!b.querySelector('.dot.on');
    if (on !== lastPulse) { lastPulse = on; b.classList.toggle('has', on); }
  };

  /* ---------- fichas de estado: um toque abre o texto ---------- */
  let openEl = null, openT = 0;
  const closeChip = () => { if (openEl) openEl.classList.remove('open'); openEl = null; clearTimeout(openT); };
  document.addEventListener('click', (e) => {
    const c = e.target.closest && e.target.closest('#hudx .wk, #hudx .col, #hudx .sorte'); 
    if (!c) { if (openEl && !(e.target.closest && e.target.closest('#hudx'))) closeChip(); return; }
    if (c === openEl) { closeChip(); return; }               // segundo toque: segue para a ação (janela da semana etc.)
    closeChip(); c.classList.add('open'); openEl = c; openT = setTimeout(closeChip, 4500);
    e.stopPropagation(); e.preventDefault();
  }, true);

  const rf0 = UI.refresh; let acc = 0;
  UI.refresh = () => { rf0(); if (!G.S || !G.M.running) return; const t = performance.now(); if (t - acc > 500) { acc = t; arbitrate(); pulse(); } };
  G.on('start', () => { rot = false; since = performance.now(); closeChip(); });
})();

;
