/* Aurora — camada de plataforma (v1)
   -----------------------------------------------------------------------------
   Objetivo: o jogo continua sendo UM só HTML. Tudo que muda de uma plataforma
   para outra (PC, Android, iOS, desktop, console) fica aqui e em
   config/plataformas.json, nunca espalhado pelo código do jogo.

   Regra de ouro: o perfil "pc" é a base. Os outros perfis herdam dele ("extends")
   e só declaram o que muda — por isso nada do PC se perde ao empacotar o APK.

   Expõe window.AuroraPlatform. Não altera o jogo se algo aqui falhar: tudo que
   toca em APIs nativas é protegido por try/catch e tem alternativa web. */
(function () {
  'use strict';
  if (window.AuroraPlatform) return;

  /* ---------- configuração embutida ---------- */
  const lerJson = (id) => {
    try { return JSON.parse(document.getElementById(id).textContent); }
    catch (e) { return null; }
  };
  const CFG = lerJson('aurora-cfg-plataformas') || { perfis: { pc: {} }, deteccao: { padrao: 'pc' }, opcoesDoJogo: { mapa: [] } };
  const CTRL = lerJson('aurora-cfg-controles') || { teclado: {}, mouse: {}, toque: {}, gamepad: {} };

  const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
  const mesclar = (base, extra) => {
    const out = Object.assign({}, base);
    for (const k of Object.keys(extra || {})) out[k] = isObj(extra[k]) && isObj(out[k]) ? mesclar(out[k], extra[k]) : extra[k];
    return out;
  };
  const resolverPerfil = (nome, vistos) => {
    vistos = vistos || [];
    const p = CFG.perfis[nome];
    if (!p || vistos.includes(nome)) return {};
    return p.extends ? mesclar(resolverPerfil(p.extends, vistos.concat(nome)), p) : Object.assign({}, p);
  };

  /* ---------- detecção ---------- */
  const cap = window.Capacitor;
  const nativo = !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
  const detectar = () => {
    const d = CFG.deteccao || {};
    if (nativo) { const p = 'capacitor:' + (cap.getPlatform ? cap.getPlatform() : ''); if (d[p] && CFG.perfis[d[p]]) return d[p]; }
    try { if ((window.process && window.process.versions && window.process.versions.electron) || /Electron\//.test(navigator.userAgent)) return d.electron || 'desktop'; } catch (e) { /* segue */ }
    const forcado = new URLSearchParams(location.search).get('perfil');   // ?perfil=android para testar no PC
    if (forcado && CFG.perfis[forcado]) return forcado;
    return d.padrao || 'pc';
  };
  const perfil = detectar();
  const cfg = resolverPerfil(perfil);
  const plugin = (nome) => { try { return (cap && cap.Plugins && cap.Plugins[nome]) || null; } catch (e) { return null; } };

  /* ---------- preferências do usuário (valem antes de existir um jogo salvo) ---------- */
  const CHAVE = 'aurora.config.v1';
  let usuario = { v: 1, u: {}, teclas: {} };
  try { const raw = JSON.parse(localStorage.getItem(CHAVE) || 'null'); if (raw && raw.v === 1) usuario = { v: 1, u: raw.u || {}, teclas: raw.teclas || {} }; } catch (e) { /* storage indisponível */ }
  const ouvintes = new Set();
  const gravar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(usuario)); } catch (e) { /* sem storage */ } };
  const caminho = (chave) => chave.split('.').reduce((o, k) => (o == null ? undefined : o[k]), cfg);

  const Config = {
    padrao: (chave) => caminho(chave),
    get: (chave) => (Object.prototype.hasOwnProperty.call(usuario.u, chave) ? usuario.u[chave] : caminho(chave)),
    foiAlterada: (chave) => Object.prototype.hasOwnProperty.call(usuario.u, chave),
    set(chave, valor, silencioso) {
      if (valor === caminho(chave) && !Config.foiAlterada(chave)) return;
      usuario.u[chave] = valor; gravar();
      if (!silencioso) ouvintes.forEach((f) => { try { f(chave, valor); } catch (e) { /* ouvinte ruim não derruba */ } });
    },
    restaurar() { usuario = { v: 1, u: {}, teclas: {} }; gravar(); ouvintes.forEach((f) => { try { f(null, null); } catch (e) { /* idem */ } }); },
    aoMudar(f) { ouvintes.add(f); return () => ouvintes.delete(f); },
  };

  /* ---------- ponte com as opções do jogo (G.S.opts) ---------- */
  const PONTE = (CFG.opcoesDoJogo && CFG.opcoesDoJogo.mapa) || [];
  const paraJogo = (m, v) => (m.tipo === 'qualidade' ? (v === 'baixa' ? 1 : v === 'alta' ? 0 : undefined) : v);
  const doJogo = (m, v) => (m.tipo === 'qualidade' ? (v ? 'baixa' : 'alta') : v);
  let instantaneo = {};   // último valor que a ponte viu em G.S.opts, para detectar mudanças feitas dentro do jogo

  function aplicarNoJogo(novo) {
    const G = window.G; if (!G || !G.S || !G.S.opts) return;
    const o = G.S.opts; instantaneo = {};
    for (const m of PONTE) {
      const usado = Config.foiAlterada(m.chave) || novo;      // jogo novo recebe os padrões do perfil; save antigo só recebe o que o jogador escolheu
      if (usado) { const v = paraJogo(m, Config.get(m.chave)); if (v !== undefined) o[m.opcao] = v; }
      instantaneo[m.opcao] = o[m.opcao];
    }
    try { G.emit('opts'); } catch (e) { /* jogo ainda montando */ }
  }
  function espelharDoJogo() {
    const G = window.G; if (!G || !G.S || !G.S.opts) return;
    const o = G.S.opts;
    for (const m of PONTE) {
      if (o[m.opcao] === instantaneo[m.opcao]) continue;
      if (m.tipo === 'qualidade' && o.lowAuto) { instantaneo[m.opcao] = o[m.opcao]; continue; }   // modo leve automático não é escolha do jogador
      instantaneo[m.opcao] = o[m.opcao];
      Config.set(m.chave, doJogo(m, o[m.opcao]), true);
    }
  }

  /* ---------- teclado de PC: remapeamento sem tocar no código do jogo ---------- */
  const acoes = CTRL.teclado || {};
  const mapaAtual = () => {                    // acao -> code
    const m = {};
    for (const a of Object.keys(acoes)) m[a] = (acoes[a].remapeavel && usuario.teclas[a]) || acoes[a].padrao;
    return m;
  };
  const rotuloTecla = (code) => {
    if (!code) return '—';
    if (code === 'Space') return 'Espaço';
    if (/^Key[A-Z]$/.test(code)) return code.slice(3);
    if (/^Digit\d$/.test(code)) return code.slice(5);
    if (/^Numpad\d$/.test(code)) return 'Num ' + code.slice(6);
    const nomes = { Escape: 'Esc', Enter: 'Enter', Tab: 'Tab', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Backspace: '⌫', Backquote: '`', Minus: '-', Equal: '=', Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Quote: "'" };
    return nomes[code] || code;
  };
  const Teclas = {
    acoes: () => Object.keys(acoes).map((id) => Object.assign({ id, atual: mapaAtual()[id], rotuloAtual: rotuloTecla(mapaAtual()[id]) }, acoes[id])),
    rotulo: rotuloTecla,
    definir(acao, code) {
      const a = acoes[acao]; if (!a || !a.remapeavel) return { ok: false, motivo: 'Esta tecla é fixa.' };
      const reservadas = Object.keys(acoes).filter((k) => !acoes[k].remapeavel).map((k) => acoes[k].padrao);
      if (reservadas.includes(code)) return { ok: false, motivo: rotuloTecla(code) + ' é reservada.' };
      if (/^(Shift|Control|Alt|Meta)/.test(code)) return { ok: false, motivo: 'Use uma tecla comum, sem Ctrl, Alt ou Shift.' };
      let trocou = null; const m = mapaAtual();
      for (const k of Object.keys(m)) if (k !== acao && m[k] === code) {            // a outra ação fica com a tecla antiga desta
        usuario.teclas[k] = m[acao]; trocou = k;
      }
      usuario.teclas[acao] = code; gravar(); ouvintes.forEach((f) => f('teclas', acao));
      return { ok: true, trocouCom: trocou };
    },
    restaurar() { usuario.teclas = {}; gravar(); ouvintes.forEach((f) => f('teclas', null)); },
  };

  const digitando = (el) => !!el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);
  let capturando = null;                       // função que recebe a próxima tecla (tela de controles)
  const fullscreen = {
    ativo: () => !!(document.fullscreenElement || document.webkitFullscreenElement),
    disponivel: () => !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen),
    alternar() {
      try {
        if (fullscreen.ativo()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        else (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen).call(document.documentElement);
      } catch (e) { /* o navegador pode recusar sem gesto do usuário */ }
    },
  };
  const acaoTelaCheia = () => { if (cfg.tela && cfg.tela.telaCheia !== false && !nativo) fullscreen.alternar(); };

  window.addEventListener('keydown', (e) => {
    if (e.__aurora || e.isComposing) return;
    if (capturando) { e.preventDefault(); e.stopImmediatePropagation(); capturando(e); return; }
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (digitando(e.target)) return;
    const m = mapaAtual(), alvo = e.target && e.target.closest && e.target.closest('button,a[href],summary,[role="button"]');
    const acao = Object.keys(m).find((k) => acoes[k].remapeavel && m[k] === e.code);
    if (acao) {
      if (acoes[acao].tratadoPelaPlataforma) { e.preventDefault(); e.stopImmediatePropagation(); if (acao === 'telaCheia') acaoTelaCheia(); return; }
      if (acoes[acao].padrao === e.code) return;           // tecla original: o jogo já trata
      e.preventDefault(); e.stopImmediatePropagation();
      const g = acoes[acao].gera; if (!g) return;
      const ev = new KeyboardEvent('keydown', { key: g.key, code: g.code, bubbles: true, cancelable: true });
      ev.__aurora = true; document.body.dispatchEvent(ev);      // no body: o jogo ignora Espaço quando o foco está num botão, e uma tecla remapeada não é "Espaço no botão"
      return;
    }
    // tecla original que o jogador moveu para outra ação: o jogo não pode mais reagir a ela
    const deslocada = Object.keys(acoes).find((k) => acoes[k].remapeavel && acoes[k].gera && acoes[k].padrao === e.code && m[k] !== e.code);
    if (deslocada && !alvo) { e.stopImmediatePropagation(); }
  }, true);

  /* ---------- nativo: voltar, pausa, tela ligada, compartilhar arquivo ---------- */
  const ultimaVolta = { t: 0 };
  const sintetizarEsc = () => {
    const ev = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true });
    ev.__aurora = true; document.body.dispatchEvent(ev);
  };
  const noTitulo = () => { const t = document.getElementById('title'); return !!(t && t.classList.contains('on')); };
  const modalAberto = () => !!(window.G && G.UI && G.UI.modalOpen);

  const Sistema = {
    sair() {
      const App = plugin('App');
      if (App && App.exitApp) { try { App.exitApp(); return true; } catch (e) { /* tenta fechar a janela */ } }
      try { window.close(); } catch (e) { /* navegador pode negar */ }
      return false;
    },
    salvarAgora() { try { if (window.G && G.M && G.M.running && G.S && typeof G.M.save === 'function') G.M.save(); } catch (e) { /* melhor falhar calado do que travar o app */ } },
    async guardarArquivo(nome, texto) {
      const FS = plugin('Filesystem'), Share = plugin('Share');
      if (!nativo || !FS || !Share) throw new Error('indisponivel');
      const r = await FS.writeFile({ path: nome, data: texto, directory: 'CACHE', encoding: 'utf8' });
      await Share.share({ title: nome, text: 'Jornada de Aurora', url: r.uri, dialogTitle: 'Guardar jornada' });
    },
    vibrar(ms) { try { const H = plugin('Haptics'); if (H && H.vibrate) H.vibrate({ duration: ms || 20 }); else if (navigator.vibrate) navigator.vibrate(ms || 20); } catch (e) { /* sem vibração */ } },
  };

  let trava = null;
  async function telaLigada(ligar) {
    const nativoPlugin = plugin('Plataforma');
    if (nativoPlugin && nativoPlugin.manterTelaLigada) { try { await nativoPlugin.manterTelaLigada({ ligar: !!ligar }); } catch (e) { /* segue sem */ } return; }
    try {
      if (!('wakeLock' in navigator)) return;
      if (ligar && !trava && document.visibilityState === 'visible') { trava = await navigator.wakeLock.request('screen'); trava.addEventListener('release', () => { trava = null; }); }
      else if (!ligar && trava) { await trava.release(); trava = null; }
    } catch (e) { trava = null; }
  }

  function ligarNativo() {
    const App = plugin('App');
    if (App && App.addListener) {
      try {
        App.addListener('backButton', () => {
          if (modalAberto() || !noTitulo()) { sintetizarEsc(); return; }       // dentro do jogo ou de uma janela: igual ao Esc
          const agora = Date.now();
          if (agora - ultimaVolta.t < 2200) { Sistema.sair(); return; }
          ultimaVolta.t = agora;
          try { G.UI.toast('Toque em voltar de novo para sair.', 'info'); } catch (e) { /* sem toast */ }
        });
        App.addListener('appStateChange', (s) => { if (!s.isActive) Sistema.salvarAgora(); });
      } catch (e) { /* plugin parcial */ }
    }
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { if (cfg.sistema && cfg.sistema.salvarAoPausar) Sistema.salvarAgora(); if (!plugin('Plataforma')) telaLigada(false); }
    else if (Config.get('sistema.manterTelaLigada') && window.G && G.M && G.M.running && !plugin('Plataforma')) telaLigada(true);
  });

  /* ---------- controle (gamepad): navega pelos menus como o Tab faria ---------- */
  const Gamepad = (() => {
    let ativo = false, laco = 0, ultimo = {}, repeticao = 0;
    const visiveis = () => {
      const raiz = document.querySelector('#modal.on') || document.querySelector('#title.on') || document.body;
      return [...raiz.querySelectorAll('button:not(:disabled),[role="button"],a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')]
        .filter((n) => n.getClientRects().length && getComputedStyle(n).visibility !== 'hidden');
    };
    const mover = (d) => {
      const lista = visiveis(); if (!lista.length) return;
      let i = lista.indexOf(document.activeElement);
      i = i < 0 ? 0 : (i + d + lista.length) % lista.length;
      lista[i].focus({ preventScroll: false });
    };
    const passo = () => {
      const pads = (navigator.getGamepads && navigator.getGamepads()) || [];
      const p = [...pads].find((x) => x && x.connected);
      if (!p) { ativo = false; laco = 0; return; }
      const b = (i) => !!(p.buttons[i] && p.buttons[i].pressed);
      const eixoY = p.axes[1] || 0, eixoX = p.axes[0] || 0;
      const est = { cima: b(12) || eixoY < -0.6, baixo: b(13) || eixoY > 0.6, esq: b(14) || eixoX < -0.6, dir: b(15) || eixoX > 0.6, a: b(0), b: b(1), start: b(9) };
      const agora = performance.now();
      const borda = (k) => est[k] && !ultimo[k];
      const segura = (k) => est[k] && ultimo[k] && agora - repeticao > 220;
      if (borda('cima') || borda('esq') || (segura('cima') || segura('esq'))) { mover(-1); repeticao = agora; }
      else if (borda('baixo') || borda('dir') || (segura('baixo') || segura('dir'))) { mover(1); repeticao = agora; }
      if (borda('a') && document.activeElement && document.activeElement !== document.body) document.activeElement.click();
      if (borda('b') || borda('start')) sintetizarEsc();
      ultimo = est;
      laco = requestAnimationFrame(passo);
    };
    const ligar = () => { if (!ativo) { ativo = true; ultimo = {}; laco = requestAnimationFrame(passo); } };
    window.addEventListener('gamepadconnected', ligar);
    window.addEventListener('gamepaddisconnected', () => { ativo = false; cancelAnimationFrame(laco); });
    return { ligar };
  })();
  if (cfg.entrada && cfg.entrada.gamepad) { try { if (navigator.getGamepads && [...navigator.getGamepads()].some(Boolean)) Gamepad.ligar(); } catch (e) { /* sem gamepad */ } }

  /* ---------- aplicação ao jogo ---------- */
  function ligarAoJogo() {
    const G = window.G; if (!G || typeof G.on !== 'function') return;
    G.on('start', (d) => {
      aplicarNoJogo(!!(d && d.fresh));
      telaLigada(!!Config.get('sistema.manterTelaLigada'));
    });
    G.on('opts', espelharDoJogo);
    Config.aoMudar((chave, valor) => {
      if (chave === 'sistema.manterTelaLigada' && G.M && G.M.running) telaLigada(!!valor);
      else if (chave && chave !== 'teclas' && G.S && G.M && G.M.running) aplicarNoJogo(false);
    });
    if (typeof G.hook === 'function') G.hook('titleShow', () => telaLigada(false), 300000);   // de volta ao menu: a tela pode apagar
    // Exportar jornada em arquivo: no Android o <a download> não funciona; usa a folha de compartilhamento.
    if (G.UI && typeof G.UI.downloadText === 'function' && cfg.armazenamento && cfg.armazenamento.exportar === 'compartilhar') {
      const original = G.UI.downloadText;
      G.UI.downloadText = function (texto, nome) {
        Sistema.guardarArquivo(nome, texto).catch((err) => {
          if (err && /cancel/i.test(String(err.message || err))) return;
          try { original.call(G.UI, texto, nome); } catch (e) { /* último recurso: copiar o código na tela de exportar */ }
        });
      };
    }
  }

  document.documentElement.classList.add('plat-' + perfil);
  if (nativo) document.documentElement.classList.add('plat-nativo');
  if (cfg.sistema && cfg.sistema.voltarFechaJanelas) ligarNativo();
  if (nativo && cfg.tela && cfg.tela.imersivo === false) { const N = plugin('Plataforma'); if (N && N.imersivo) { try { N.imersivo({ ligar: false }); } catch (e) { /* segue com barras */ } } }
  ligarAoJogo();

  window.AuroraPlatform = Object.freeze({
    VERSAO: 1,
    perfil, nativo, cfg, perfis: CFG.perfis,
    controles: CTRL,
    Config, Teclas, Sistema, fullscreen, Gamepad,
    telaLigada,
    suporta: (recurso) => !!(cfg.entrada && cfg.entrada[recurso]),
    capturarProximaTecla(f) { capturando = f ? (e) => { const ok = f(e); if (ok !== false) capturando = null; } : null; },
    pararCaptura() { capturando = null; },
    sintetizarEsc,
  });
})();
