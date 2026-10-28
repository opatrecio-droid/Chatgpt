/* ===== Opções, controles e menu principal no estilo do original (v3.27.3) =====
   Abas Jogabilidade / Gráficos / Personagem / Notificações; controles Simples ou Joystick; modo canhoto;
   contador de FPS; entrada Patreon no menu principal. Referência: ESPECIFICACAO-TELAS.md. */
(() => {
  const KEY = 'vaelmar-opts-v1';
  const O = { control: 'simples', lefty: false, fps: false, noBattleMusic: false };
  try { Object.assign(O, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch {}
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(O)); } catch {} };
  window.OPCOES = O;

  /* ---------- aplicação das opções ---------- */
  const joy = document.createElement('div'); joy.id = 'joy'; joy.hidden = true; joy.innerHTML = '<i></i>';
  document.getElementById('s-world').appendChild(joy);
  const fpsEl = document.createElement('div'); fpsEl.id = 'fps'; fpsEl.hidden = true; document.body.appendChild(fpsEl);
  function aplicar() {
    document.body.classList.toggle('lefty', !!O.lefty);
    fpsEl.hidden = !O.fps;
    joy.hidden = !(O.control === 'joystick' && cur === 'world' && !!S);
  }

  /* ---------- joystick ---------- */
  const J = { x: 0, y: 0, on: false };
  const knob = joy.querySelector('i');
  const mover = e => {
    const r = joy.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, R = r.width / 2;
    let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / R);
    J.x = dx / d * k; J.y = dy / d * k; J.on = k > .18; knob.style.transform = 'translate(' + J.x * R * .55 + 'px,' + J.y * R * .55 + 'px)';
  };
  joy.addEventListener('pointerdown', e => { joy.setPointerCapture(e.pointerId); mover(e); e.preventDefault(); });
  joy.addEventListener('pointermove', e => { if (joy.hasPointerCapture(e.pointerId)) mover(e); });
  const soltar = e => { J.x = J.y = 0; J.on = false; knob.style.transform = ''; if (H && !H.goal) H.path = []; };
  joy.addEventListener('pointerup', soltar); joy.addEventListener('pointercancel', soltar);
  const livre = (x, y) => [[-8, -6], [8, -6], [-8, 6], [8, 6]].every(([ox, oy]) => walkTile(...tileOf(x + ox, y + oy)));
  const baseTick = exTick; let frames = 0, t0 = 0;
  exTick = now => {
    aplicar();
    if (O.control === 'joystick' && J.on && cur === 'world' && S && !busy && overlayClosed()) {
      const passo = 36; let x = H.x + J.x * passo, y = H.y + J.y * passo;
      if (!livre(x, y)) { if (livre(x, H.y)) y = H.y; else if (livre(H.x, y)) x = H.x; else { x = H.x; y = H.y; } }
      H.goal = { type: 'move' }; H.path = (x !== H.x || y !== H.y) ? [[x, y]] : []; EX.mark = null;
    }
    baseTick(now);
    if (O.fps) { frames++; if (now - t0 >= 1000) { fpsEl.textContent = Math.round(frames * 1000 / (now - t0)) + ' FPS'; frames = 0; t0 = now; } }
  };

  /* música de batalha pode ser desligada */
  setInterval(() => { if (O.noBattleMusic && cur === 'battle') { try { GameAudio.player.pause(); } catch {} } }, 400);
  let ultimo = ''; setInterval(() => { if (cur !== ultimo) { if (ultimo === 'battle' && O.noBattleMusic) GameAudio.sync(true); ultimo = cur; } }, 500);

  /* ---------- tela de Opções ---------- */
  const TABS = [['jogo', 'Jogabilidade'], ['graficos', 'Gráficos'], ['personagem', 'Personagem'], ['notif', 'Notificações']];
  const check = (id, on, label, desc, extra = '') => '<label class="op ' + extra + '"><input type="checkbox" data-op="' + id + '" ' + (on ? 'checked' : '') + '><span><b>' + label + '</b><small>' + desc + '</small></span></label>';
  const radio = (id, val, on, label, desc) => '<label class="op"><input type="radio" name="' + id + '" data-op="' + id + '" value="' + val + '" ' + (on ? 'checked' : '') + '><span><b>' + label + '</b><small>' + desc + '</small></span></label>';
  function vOpcoes() {
    const tab = TABS.some(([k]) => k === P.tab) ? P.tab : 'jogo';
    let h = '<h2 class="dec sheet-h">Opções</h2>' + '<div class="tabs op-tabs" role="tablist">' + TABS.map(([k, l]) => '<button class="btn ' + (k === tab ? 'sel' : '') + '" role="tab" aria-selected="' + (k === tab) + '" data-act="tab" data-tab="' + k + '">' + l + '</button>').join('') + '</div>';
    if (tab === 'jogo') {
      h += '<div class="op-lang"><span class="lbl">Língua</span><select aria-label="Língua"><option>Português do Brasil</option></select></div>' +
        check('sfx', SND, 'Efeitos sonoros', 'Ativar ou desativar efeitos sonoros') +
        check('music', GameAudio.prefs.enabled, 'Música', 'Ativar ou desativar música (as faixas ficam no aparelho)') +
        check('nobattle', O.noBattleMusic, 'Desativar música de batalha', 'Curta a trilha sonora principal sem interrupções.', 'op-sub') +
        '<h3 class="op-h">Controles de jogo</h3>' +
        radio('control', 'simples', O.control === 'simples', 'Simples', 'Toque no mapa para se mover para o local.') +
        radio('control', 'joystick', O.control === 'joystick', 'Joystick', 'Use o direcional na tela para mover seu personagem.') +
        check('lefty', O.lefty, 'Modo canhoto', 'Muda alguns elementos da interface para o lado esquerdo da tela') + audioSettings();
    } else if (tab === 'graficos') {
      h += check('fps', O.fps, 'FPS', 'Exibir contador de FPS') + check('motion', !!S.reduceMotion, 'Animações reduzidas', 'Reduz movimentos e transições');
    } else if (tab === 'personagem') {
      h += '<div class="settings-actions">' + btn('exportsave', 'Exportar save') + btn('importsave', 'Importar save') + btn('title', 'Voltar ao título') + '</div><p class="fine">O progresso é salvo neste aparelho. Exporte um backup antes de trocar de aparelho. Para levar o save de outra versão, importe o arquivo .json.</p>' +
        (S.lvl >= 10 ? box('Facção', Object.entries({ fogo: 'Cavaleiros do Inferno', agua: 'Guarda Gélida', terra: 'Legião da Terra', raio: 'Tempestade' }).map(([k, n]) => btn('faction', n, 'data-k="' + k + '"', S.faction === k ? 'sm sel' : 'sm')).join('') + '<p class="fine">Sua facção concede afinidade com um elemento.</p>') : '');
    } else {
      h += '<p class="fine" style="padding:18px 4px">Sem notificações no modo offline.</p>';
    }
    return h + '<p class="fine" style="text-align:center;margin-top:18px">Herói de Vaelmar 5.0 · adaptação independente, sem afiliação com a Northern Forge Studios</p>';
  }
  vSettings = vOpcoes; VIEWS.settings = { r: vOpcoes };

  document.addEventListener('change', e => {
    const el = e.target.closest('[data-op]'); if (!el) return; const op = el.dataset.op;
    if (op === 'sfx') { if (SND !== el.checked) ACT.snd(); }
    else if (op === 'music') { if (GameAudio.prefs.enabled !== el.checked) GameAudio.toggle(); }
    else if (op === 'nobattle') O.noBattleMusic = el.checked;
    else if (op === 'control') O.control = el.value;
    else if (op === 'lefty') O.lefty = el.checked;
    else if (op === 'fps') O.fps = el.checked;
    else if (op === 'motion') { if (!!S.reduceMotion !== el.checked) ACT.togglemotion(); }
    persist(); aplicar();
  });

  /* ---------- menu principal: Patreon ---------- */
  const baseMain = vMainMenu;
  vMainMenu = () => baseMain().replace(/(<button data-act="community"[\s\S]*?<\/button>)/, '$1<button data-act="patreon">' + mainMenuIcon('patreon') + '<span>Patreon</span></button>');
  VIEWS.main = { r: vMainMenu };
  ACT.patreon = () => openModal(() => '<h3>Patreon</h3><p>O apoio ao estúdio original precisa de conexão à internet. O jogo e seu progresso funcionam neste aparelho sem conexão.</p>' + btn('closemodal', 'Fechar'));
  const baseIcon = mainMenuIcon;
  mainMenuIcon = k => k === 'patreon' ? '<span class="mm-ic patreon" aria-hidden="true"></span>' : baseIcon(k);
})();
