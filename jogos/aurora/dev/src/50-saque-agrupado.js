/* Aurora 043 · espólio agrupado (simulação, sem DOM).
   Cada abate largava uma pilha nova no chão e, numa caçada movimentada, dezenas de ícones cobriam o
   campo. Agora o material que cai perto de uma pilha igual se junta a ela. Nada se perde: o toque já
   recolhia as pilhas vizinhas de uma vez, e a pilha unida vale a soma das duas. */
(function () {
  'use strict';
  if (!G.dropAdd) return;
  const add0 = G.dropAdd;
  G.DROP_MERGE = 1.7;            // casas: mesma ordem do raio que um toque já recolhe (1,3)
  G.DROP_LABEL_MIN = 6;          // o "×N" só aparece em pilhas grandes (ver 50-saque.patch.txt)
  G.dropAdd = (x, y, k, n, by) => {
    let best = null, bd = G.DROP_MERGE;
    for (const d of G.drops) {
      if (d.k !== k || !(d.n > 0) || d.pet) continue;          // pilha já reservada por um mascote fica como está
      const dist = Math.hypot(d.x - x, d.y - y);
      if (dist < bd) { bd = dist; best = d; }
    }
    if (!best) return add0(x, y, k, n, by);
    best.n += n; best.t = G.S.t; if (by) best.by = by;
    return best;
  };
})();
