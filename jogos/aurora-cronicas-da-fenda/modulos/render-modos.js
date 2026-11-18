/* Aurora — modos de renderização (Fase 0 do plano 3D/2D)
   -----------------------------------------------------------------------------
   Um estado, dois pintores. Este módulo NÃO muda o desenho: ele só põe o
   renderizador atual atrás de uma interface, para que um segundo renderizador
   (o 3D) possa entrar no lugar sem reescrever o laço nem os ~50 scripts que
   encadeiam R.dynMore / R.fxMore / R.groundMore.

   Interface de um renderizador:
     id, nome, init(), frame(dt), screenToWorld(px,py), worldToScreen(wx,wy), dispose()
     opcional: disponivel() -> bool | string (motivo), aoTrocar(de, para)

   O 2D é registrado como adaptador do G.R que já existe — nenhuma linha do
   desenho atual foi movida, logo o modo 2D é, por construção, idêntico ao de antes.

   Expõe G.RENDER. Se algo aqui falhar, o jogo continua no 2D. */
(function () {
  'use strict';
  const G = window.G;
  if (!G || G.HEADLESS || !G.R || G.RENDER) return;
  const R = G.R;

  /* As funções originais do 2D, guardadas antes de qualquer desvio. */
  const base2D = { frame: R.frame, screenToWorld: R.screenToWorld, worldToScreen: R.worldToScreen };
  if (typeof base2D.frame !== 'function') return;

  const modos = new Map();
  let atual = '2d', trocando = false;

  const RENDER = G.RENDER = {
    PADRAO: '2d',
    get modo() { return atual; },
    lista: () => [...modos.values()].map((m) => ({ id: m.id, nome: m.nome, ativo: m.id === atual })),
    registrar(impl) {
      if (!impl || !impl.id || typeof impl.frame !== 'function') throw new TypeError('Renderizador inválido.');
      modos.set(impl.id, impl);
      G.runHooks('renderRegistrado', impl.id);
      return impl.id;
    },
    tem: (id) => modos.has(id),
    ativo: () => modos.get(atual) || modos.get('2d'),
    /* Por que um modo não pode ser usado agora: string com o motivo, ou null se pode. */
    motivoIndisponivel(id) {
      const m = modos.get(id);
      if (!m) return 'Este modo não está disponível neste aparelho.';
      if (typeof m.disponivel !== 'function') return null;
      try { const r = m.disponivel(); return r === true ? null : (typeof r === 'string' ? r : 'Este modo não está disponível neste aparelho.'); }
      catch (e) { return 'Não foi possível verificar este modo.'; }
    },
    /* Troca o pintor. Não toca em G.S: a simulação não pausa nem muda. */
    async trocar(id) {
      if (trocando) return { ok: false, why: 'Já estou trocando a vista.' };
      if (id === atual) return { ok: true, igual: true };
      const alvo = modos.get(id);
      if (!alvo) return { ok: false, why: 'Modo de vista desconhecido.' };
      const motivo = RENDER.motivoIndisponivel(id);
      if (motivo) return { ok: false, why: motivo };
      trocando = true;
      const antes = atual;
      try {
        if (typeof alvo.init === 'function') await alvo.init();
        atual = id;
        const velho = modos.get(antes);
        try { if (velho && typeof velho.dispose === 'function') velho.dispose(); } catch (e) { G.recordError(e, 'render:dispose:' + antes); }
        try { if (typeof alvo.aoTrocar === 'function') alvo.aoTrocar(antes, id); } catch (e) { G.recordError(e, 'render:aoTrocar'); }
        G.runHooks('renderTrocou', id, antes);
        G.emit('render', { modo: id, antes });
        return { ok: true, antes };
      } catch (e) {
        atual = antes;
        G.recordError(e, 'render:trocar:' + id);
        return { ok: false, why: 'Não foi possível abrir essa vista.' };
      } finally { trocando = false; }
    },
  };

  /* O 2D é o G.R de sempre, apenas embrulhado. */
  RENDER.registrar({
    id: '2d', nome: 'Clássico (2D)',
    init() {}, dispose() {},
    frame: (dt) => base2D.frame.call(R, dt),
    screenToWorld: (px, py) => base2D.screenToWorld.call(R, px, py),
    worldToScreen: (wx, wy) => base2D.worldToScreen.call(R, wx, wy),
  });

  /* Os pontos de entrada do jogo passam a perguntar quem está pintando.
     São os três únicos desvios: o laço chama G.R.frame e a interface chama
     R.screenToWorld / R.worldToScreen — todos por busca dinâmica em R. */
  R.frame = (dt) => RENDER.ativo().frame(dt);
  R.screenToWorld = (px, py) => RENDER.ativo().screenToWorld(px, py);
  R.worldToScreen = (wx, wy) => RENDER.ativo().worldToScreen(wx, wy);

  /* ---------- 3D sob demanda ----------
     O código do 3D (Three.js + render3d) fica no HTML dentro de um
     <script type="text/plain">: o navegador não analisa nem executa nada dele
     até alguém chamar carregar3D(). Assim o início do jogo não paga por ele. */
  let promessa3D = null;
  RENDER.carregar3D = () => {
    if (modos.has('3d')) return Promise.resolve(true);
    if (promessa3D) return promessa3D;
    return promessa3D = new Promise((ok, falhou) => {
      const fonte = document.getElementById('aurora-render3d-fonte');
      if (!fonte || !fonte.textContent.trim()) return falhou(new Error('A vista 3D não veio nesta versão.'));
      const s = document.createElement('script');
      s.id = 'aurora-render3d';
      s.textContent = fonte.textContent;
      try { document.head.appendChild(s); } catch (e) { return falhou(e); }
      fonte.textContent = '';                       // libera a cópia em texto
      modos.has('3d') ? ok(true) : falhou(new Error('A vista 3D não pôde ser preparada.'));
    }).catch((e) => { promessa3D = null; throw e; });
  };

  /* ---------- botão 3D/2D ----------
     Provisório: a arte do ícone e o lugar definitivo são a Fase 3 do plano.
     (O plano cita #av-camera, mas esse elemento não existe no jogo — só sobrou
     o CSS dele. O botão entra na coluna de atalhos #fabs-l, que é real.) */
  const ICONE = {
    '2d': '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 2 2 7.5 12 13l10-5.5L12 2Zm0 2.3 5.8 3.2L12 10.7 6.2 7.5 12 4.3ZM2 16.5 12 22l10-5.5-2.1-1.2L12 19.6l-7.9-4.3L2 16.5Zm0-4.5L12 17.5 22 12l-2.1-1.2L12 15.1 4.1 10.8 2 12Z"/></svg>',
    '3d': '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M4 5h16v2H4V5Zm0 6h16v2H4v-2Zm0 6h16v2H4v-2Z"/></svg>',
  };
  let ocupado = false;

  function desenharBotao() {
    const b = document.getElementById('fab-vista'); if (!b) return;
    const tresD = atual === '3d';
    b.innerHTML = ICONE[tresD ? '3d' : '2d'];
    b.title = tresD ? 'Voltar para a vista clássica (2D)' : 'Ver Aurora em 3D';
    b.setAttribute('aria-label', b.title);
    b.setAttribute('aria-pressed', String(tresD));
    b.disabled = ocupado;
  }

  function criarBotao() {
    const col = document.getElementById('fabs-l');
    if (!col || document.getElementById('fab-vista')) return;
    if (!suporta3D()) return;                      // sem WebGL o ícone nem aparece
    const b = document.createElement('button');
    b.className = 'fab glass'; b.id = 'fab-vista'; b.dataset.a = 'vista3d';
    col.appendChild(b); desenharBotao();
  }
  const suporta3D = () => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; } };

  if (G.UI) G.UI.ACT.vista3d = async () => {
    if (ocupado) return;
    ocupado = true; desenharBotao();
    try {
      if (atual === '3d') {
        const r3 = modos.get('3d');
        if (r3 && typeof r3.recolher === 'function') await r3.recolher();
        const r = await RENDER.trocar('2d');
        if (!r.ok) G.UI.toast(r.why, 'bad');
      } else {
        await RENDER.carregar3D();
        const motivo = RENDER.motivoIndisponivel('3d');
        if (motivo) { G.UI.toast(motivo, 'bad'); return; }
        const r = await RENDER.trocar('3d');
        if (!r.ok) G.UI.toast(r.why, 'bad');
        else G.UI.toast('Vista 3D (prévia): cidade e cenário em 3D; heróis e monstros ainda só no 2D. Toque de novo para voltar.', 'info', null, 6000);
      }
    } catch (e) {
      G.recordError(e, 'vista3d');
      G.UI.toast('Não foi possível abrir a vista 3D neste aparelho.', 'bad');
    } finally { ocupado = false; desenharBotao(); }
  };

  G.hook('renderTrocou', desenharBotao, 100);
  G.hook('uiBuild', criarBotao, 100);

  /* Uma partida nova ou carregada sempre começa no 2D até o jogador pedir outra vista. */
  G.on('start', () => { if (atual !== '2d') RENDER.trocar('2d'); criarBotao(); });
})();
