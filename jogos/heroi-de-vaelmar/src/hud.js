/* ===== HUD do mundo no estilo do original (v3.27.3) =====
   Faixas de aviso no topo, áreas bloqueadas sem névoa (só o aviso ao tentar entrar) e alcance de
   interação com monstros. Referência: ESPECIFICACAO-TELAS.md. */
(() => {
  window.INTERACT_RANGE = 70; /* px do mundo; o original tem um bônus de alcance de interação */
  const el = document.createElement('div'); el.id = 'w-banner'; el.setAttribute('role', 'status'); el.hidden = true;
  document.getElementById('s-world').appendChild(el);
  let timer = 0;
  window.worldBanner = (text, kind = '') => {
    el.textContent = text; el.className = kind; el.hidden = false;
    clearTimeout(timer); timer = setTimeout(() => { el.hidden = true; }, 2600);
  };

  /* sem névoa nas áreas bloqueadas: o original só avisa ao tentar entrar */
  drawFog = () => {};
  const baseWalkTo = walkTo;
  walkTo = function (x, y, goal) {
    const [tx, ty] = tileOf(x, y);
    if (tx >= 0 && ty >= 0 && tx < WW && ty < WH && zoneLocked(ZGRID[ty * WW + tx])) { worldBanner('Você não está pronto para se aventurar.'); return false; }
    return baseWalkTo(x, y, goal);
  };
})();
