/* 3K-decisoes: v27 (A2) — nada pausa o jogo nem interrompe o jogador para pedir uma escolha. Eventos de cidade viram DECISÕES PENDENTES com
   prazo (S.ev.pending + S.ev.until, em segundos de jogo); a interface as mostra num pequeno atalho do HUD (6G-ui-decisoes). Se ninguém decidir
   até o prazo, a opção padrão do evento (e.auto, em 33-meta) é aplicada e o registro ganha uma linha dizendo o que Aurora decidiu.
   Só simulação, sem DOM. Saves da v26 com um evento pendente e sem prazo ganham o prazo do tipo ao carregar. */
'use strict';
(function () {
  G.eventNow = () => { const S = G.S; return S && S.ev.pending ? G.EVENTS.find((x) => x.id === S.ev.pending) || null : null; };
  /* segundos de jogo até a decisão automática (0 se não há decisão) */
  G.eventLeft = () => { const S = G.S, e = G.eventNow(); return e && S.ev.until ? Math.max(0, S.ev.until - S.t) : 0; };
  /* a opção que vale se ninguém decidir (índice) */
  G.eventAutoIdx = (e) => (e.auto != null ? e.auto : e.opts.length - 1);
  const arm = () => {
    const S = G.S; if (!S || !S.ev.pending) return;
    const e = G.eventNow();
    if (!e) { S.ev.pending = null; S.ev.until = 0; return; }       // evento que não existe mais: não trava as próximas rolagens
    if (!S.ev.until) { S.ev.at = S.ev.at || S.t; S.ev.until = S.t + (e.ttl || 1) * G.DAY_SEC; }
  };
  /* resolve a decisão pendente pela opção padrão (devolve o texto do resultado ou null) */
  G.eventAuto = () => {
    const e = G.eventNow(); if (!e) { arm(); return null; }
    const r = G.eventChoose(G.eventAutoIdx(e), true);
    if (r == null) { G.S.ev.pending = null; G.S.ev.until = 0; }   // nem a opção de reserva coube: encerra sem efeito, o próximo evento segue
    return r;
  };
  let t1 = 0;
  const tk0 = G.tick;
  G.tick = (dt) => {
    tk0(dt);
    t1 -= dt; if (t1 > 0) return; t1 = 1;
    const S = G.S; if (!S || !S.ev.pending) return;
    arm();
    if (S.ev.pending && S.t >= S.ev.until) G.eventAuto();
  };
  const al0 = G.afterLoad;
  G.afterLoad = () => { al0(); t1 = 0; arm(); };
})();

;
