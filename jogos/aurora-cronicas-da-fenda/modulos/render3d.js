/* Aurora — renderizador 3D (Fase 1 do plano "modo 3D/2D")
   -----------------------------------------------------------------------------
   HD-2D: o chão é 3D, o resto continua sendo a MESMA arte 2D do jogo, em pé e
   virada para a câmera. Não existe mapa novo, regra nova nem campo novo no save:
   este arquivo só lê G.S / G.W / G.R e pinta.

   Fidelidade: 1 tile = 1 unidade 3D. Com a câmera de cima (90°) o resultado é a
   mesma moldura do 2D — é isso que os testes comparam.

   Carregado sob demanda por modulos/render-modos.js (não roda no início do jogo).

   O que esta fase desenha: chão + estáticos (árvores, muralha, casas, portal) +
   prédios da cidade. Heróis, monstros e NPCs são a Fase 2. */
(function () {
  'use strict';
  const G = window.G, THREE = window.THREE;
  if (!G || !G.R || !G.RENDER || !THREE || G.RENDER.tem('3d')) return;
  const R = G.R, Wd = G.W, A = G.A, TS = 16, GRAU = Math.PI / 180;

  const prefAngulo = () => {
    try { const v = window.AuroraPlatform && window.AuroraPlatform.Config.get('tela.angulo3d'); return Number.isFinite(+v) ? +v : 55; }
    catch (e) { return 55; }
  };
  const CFG = {
    angulo: prefAngulo(),  // graus a partir do chão: 90 = de cima (igual ao 2D), 45–60 = inclinada
    minAngulo: 20, maxAngulo: 90,
    transicao: 0.5,      // segundos da descida da câmera
    passoProf: 0.02,     // profundidade por tile de y (invisível em ortográfica; só ordena)
    distCam: 400,        // a câmera é ortográfica: a distância não muda o tamanho, só a ordem
    msRuim: 120,         // quadro acima disso conta como engasgo (~8 por segundo)
    engasgosParaDesistir: 45,
  };

  const EIXO_X = new THREE.Vector3(1, 0, 0);
  let ren = null, cena = null, cam = null, cv3 = null, cv2 = null;
  let chao = null, texChao = null, lotes = [], materiais = [], geo = null;
  let ang = 90, angAlvo = CFG.angulo, angVel = 0, cwA = 0, chA = 0, escuroAplicado = -1;
  let engasgos = 0, desdeQueEntrou = 0, desistindo = false;
  let precisaMatrizes = true, resolverRecolher = null;
  const raycaster = new THREE.Raycaster(), planoChao = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const vTmp = new THREE.Vector3(), mTmp = new THREE.Matrix4(), qTmp = new THREE.Quaternion();
  const pTmp = new THREE.Vector3(), sTmp = new THREE.Vector3(), alvoTmp = new THREE.Vector3();

  const dpr = () => R.dpr || 1;
  /* Medidor: R3D.medir(true) liga; R3D.medida() devolve o tempo médio de cada etapa.
     Desligado por padrão e sem custo quando desligado. */
  const MED = { on: false, n: 0, t: {} };
  const cronometro = (nome, fn) => {
    if (!MED.on) return fn();
    const t0 = performance.now(); const r = fn();
    MED.t[nome] = (MED.t[nome] || 0) + (performance.now() - t0);
    return r;
  };
  /* Arrastar: na vista inclinada o chão aparece comprimido na vertical (× sen θ),
     então um dedo que anda N pixels precisa mover a câmera N/sen θ para o mapa
     acompanhar o dedo. O R.pan original é do 2D; aqui ele ganha essa correção. */
  const panOriginal = R.pan;
  R.pan = (dx, dy) => (G.RENDER.modo === '3d' && ang < 89.5)
    ? panOriginal(dx, dy / Math.max(0.2, Math.sin(ang * GRAU)))
    : panOriginal(dx, dy);
  /* Mira um ângulo novo com velocidade constante: a transição leva CFG.transicao
     segundos, seja qual for o tamanho do caminho. */
  const mirarAngulo = (graus) => {
    angAlvo = G.clamp(graus, CFG.minAngulo, CFG.maxAngulo);
    angVel = Math.abs(angAlvo - ang) / Math.max(0.05, CFG.transicao);
  };
  const suportaWebGL2 = () => {
    try { const c = document.createElement('canvas'); return !!c.getContext('webgl2'); } catch (e) { return false; }
  };

  /* ---------- peças da cena ---------- */

  function montarCanvas() {
    cv2 = document.getElementById('view');
    if (!cv2) throw new Error('canvas 2D não encontrado');
    cv3 = document.createElement('canvas');
    cv3.id = 'view3d';
    cv3.setAttribute('aria-hidden', 'true');
    /* Fica exatamente sobre o canvas 2D, mas sem receber ponteiro: toque, arrasto,
       pinça e roda continuam chegando ao canvas 2D, que é quem escuta esses eventos.
       Como R.screenToWorld já aponta para o renderizador ativo, a seleção acerta o
       lugar certo no 3D sem mexer em nada da interface. */
    cv3.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;z-index:1;display:block;pointer-events:none';
    cv2.parentElement.insertBefore(cv3, cv2.nextSibling);
    ren = new THREE.WebGLRenderer({ canvas: cv3, antialias: false, alpha: false, powerPreference: 'low-power', stencil: false });
    ren.setPixelRatio(1);
    ren.setClearColor(0x39464e, 1);     // mesma cor de fora do mapa usada pelo 2D
    montarCamadaUI();
  }

  function textura(cv) {
    const t = new THREE.CanvasTexture(cv);
    t.magFilter = THREE.NearestFilter;                 // pixel art: nada de borrar ao ampliar
    t.minFilter = THREE.LinearMipmapLinearFilter;      // mipmap evita o chuvisco ao afastar
    t.generateMipmaps = true;
    t.anisotropy = Math.min(2, ren.capabilities.getMaxAnisotropy());   // mais que isso pesa em GPU de celular
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function montarChao() {
    const terreno = R.terrainPreview;
    if (!terreno) throw new Error('terreno ainda não foi desenhado');
    texChao = textura(terreno);
    const g = new THREE.PlaneGeometry(Wd.w, Wd.h);
    g.rotateX(-Math.PI / 2);                            // deitado no plano XZ
    g.translate(Wd.w / 2, 0, Wd.h / 2);                 // tile (0,0) na origem
    const mat = new THREE.MeshBasicMaterial({ map: texChao });
    materiais.push(mat);
    chao = new THREE.Mesh(g, mat);
    chao.frustumCulled = false;
    cena.add(chao);
  }

  /* Tudo que é sprite vira um quadrilátero com o pé no chão, virado para a câmera.
     Agrupado por imagem: 1470 estáticos usam só ~104 imagens diferentes, então
     cada imagem vira um InstancedMesh (poucas chamadas de desenho). */
  function coletarSprites() {
    const itens = [];
    for (const e of R.statics || []) {
      const s = e.s; if (!s || !s.cv) continue;
      const sp = e.kind === 'house' && A.cityHouse && G.S ? A.cityHouse(s, G.S.realm.lvl) : s;
      itens.push({ cv: sp.cv, w: sp.w, h: sp.h, x: e.x, y: e.y });
    }
    const plots = (G.W && G.W.plots) || {};
    for (const id of G.BLD_IDS || []) {
      const p = plots[id]; if (!p) continue;
      const b = G.S && G.S.b[id];
      const sp = A.building(id, G.bLvl ? G.bLvl(id) : (b ? b.lvl : 0), !!(b && b.dmg));
      if (!sp || !sp.cv) continue;
      /* Mesma âncora do 2D: canto em (p.x*TS - 4, (p.y+4)*TS - (h-4)). */
      itens.push({ cv: sp.cv, w: sp.w, h: sp.h, x: (p.x * TS - 4 + sp.w / 2) / TS, y: ((p.y + 4) * TS + 4) / TS });
    }
    return itens;
  }

  function montarSprites() {
    const itens = coletarSprites();
    const porImagem = new Map();
    for (const it of itens) {
      let g = porImagem.get(it.cv);
      if (!g) porImagem.set(it.cv, g = []);
      g.push(it);
    }
    geo = new THREE.PlaneGeometry(1, 1);
    geo.translate(0, 0.5, 0);                           // origem no pé do sprite
    for (const [cv, lista] of porImagem) {
      const mat = new THREE.MeshBasicMaterial({ map: textura(cv), transparent: false, alphaTest: 0.5, side: THREE.DoubleSide });
      materiais.push(mat);
      const mesh = new THREE.InstancedMesh(geo, mat, lista.length);
      mesh.frustumCulled = false;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage || 35048);
      cena.add(mesh);
      lotes.push({ mesh, lista });
    }
    precisaMatrizes = true;
  }

  /* Cada sprite é deslocado na direção da câmera por (y do mundo) × passo.
     Em projeção ortográfica isso NÃO muda nada na tela — só a profundidade. Assim
     estáticos e entidades se intercalam exatamente na ordem de pintura do 2D
     (que também é por y), e ainda ganhamos o z-buffer. */
  /* Só entram na lista de desenho os sprites dentro da janela da câmera — é o mesmo
     recorte que o 2D faz com vx0..vx1 / vy0..vy1. Sem isso, os 1.486 estáticos do
     mapa inteiro iriam para a GPU a cada quadro, com o mapa mostrando uns 26×15 tiles. */
  let janela = null;
  function janelaAtual() {
    const c = R.cam, z = c.z, mx = 6 / Math.max(0.35, Math.sin(ang * GRAU));
    return {
      x0: Math.floor((c.x - cwA / 2 / z) / TS) - 4, x1: Math.ceil((c.x + cwA / 2 / z) / TS) + 4,
      y0: Math.floor((c.y - chA / 2 / z) / TS - mx), y1: Math.ceil((c.y + chA / 2 / z) / TS + mx),
    };
  }
  function mudouJanela() {
    const j = janelaAtual();
    if (janela && j.x0 === janela.x0 && j.x1 === janela.x1 && j.y0 === janela.y0 && j.y1 === janela.y1) return false;
    janela = j; return true;
  }

  function atualizarMatrizes() {
    const a = ang * GRAU, nx = 0, ny = Math.sin(a), nz = Math.cos(a), j = janela || (janela = janelaAtual());
    qTmp.setFromAxisAngle(EIXO_X, -a);
    for (const lote of lotes) {
      const { mesh, lista } = lote;
      let n = 0;
      for (let i = 0; i < lista.length; i++) {
        const it = lista[i];
        if (it.x < j.x0 || it.x > j.x1 || it.y < j.y0 || it.y > j.y1) continue;
        const d = it.y * CFG.passoProf;
        pTmp.set(it.x + nx * d, ny * d, it.y + nz * d);
        sTmp.set(it.w / TS, it.h / TS, 1);
        mTmp.compose(pTmp, qTmp, sTmp);
        mesh.setMatrixAt(n++, mTmp);
      }
      mesh.count = n;
      mesh.visible = n > 0;            // grupo sem nada à vista nem chega à GPU
      mesh.instanceMatrix.needsUpdate = true;
    }
    precisaMatrizes = false;
  }

  /* ---------- camada dinâmica (Fase 2): heróis, NPCs e monstros ----------
     Cada entidade vira um quadrilátero em pé com a MESMA imagem que o 2D usaria:
     a folha de sprites é a do jogo (A.charSheet / A.monSheet), o quadro é o que o
     jogo escolheu (A.visualPose / A.charFrame) e o recorte é copiado para um
     canvas pequeno só dessa entidade. Nada de arte nova. */
  const SOMBRA = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(8,10,18,.55)'); g.addColorStop(0.6, 'rgba(8,10,18,.28)'); g.addColorStop(1, 'rgba(8,10,18,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); return c;
  })();

  let poolVivos = [], poolSombras = [], geoSombra = null, matSombra = null;
  /* O slot é amarrado à entidade, nunca à posição na lista: quando alguém entra
     num prédio ou um monstro morre, a lista encurta e os índices escorregam. Se o
     slot fosse por índice, um NPC herdaria a textura já desenhada de um monstro. */
  const slotDe = new Map();

  function pegarVivo(i) {
    for (const s of poolVivos) if (s.vivoEm !== quadroAtual && (!s.dono || s.vivoEm < quadroAtual - 1)) { s.dono = null; return s; }
    i = poolVivos.length;
    const cv = document.createElement('canvas'); cv.width = cv.height = 8;
    const tex = new THREE.CanvasTexture(cv);
    tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false; tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.04, depthWrite: true, side: THREE.DoubleSide });
    const m = new THREE.Mesh(geo, mat);
    m.frustumCulled = false; m.visible = false; cena.add(m);
    return poolVivos[i] = { mesh: m, cv, ctx: cv.getContext('2d'), tex, mat, assin: '', dono: null, vivoEm: -1 };
  }

  function pegarSombra(i) {
    if (poolSombras[i]) return poolSombras[i];
    if (!geoSombra) {
      geoSombra = new THREE.PlaneGeometry(1, 1); geoSombra.rotateX(-Math.PI / 2);
      const t = new THREE.CanvasTexture(SOMBRA); t.colorSpace = THREE.SRGBColorSpace;
      matSombra = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false });
    }
    const m = new THREE.Mesh(geoSombra, matSombra);
    m.frustumCulled = false; m.visible = false; m.renderOrder = -1; cena.add(m);
    return poolSombras[i] = m;
  }

  /* Monta a descrição de desenho de uma entidade, nas mesmas contas do 2D.
     Devolve null quando a arte ainda não existe (a entidade some, nada quebra). */
  function descrever(e, tipo) {
    if (tipo === 'm') {
      const d = G.MON[e.k]; if (!d) return null;
      const sp = A.monSheet(e.k, e.elite, e.visualStage || 0); if (!sp || !sp.cv) return null;
      const k = (d.boss ? 1.6 : (d.size || 1) > 1.2 ? 1.15 : 1) * (e.elite ? 1.2 : 1);
      const quadros = sp.frames === 8
        ? (e.flash > 0 ? 5 : e.swing > 0 ? 4 : e._cast ? 1 : Math.floor(R.t * (e.state === 'chase' || e.state === 'march' ? 8 : 4) + e.id) % 4) : 0;
      const sw = sp.sw || sp.w, sh = sp.sh || sp.h;
      const voa = (d.fly && !(e._groundUntil > G.S.t) || e._airUntil > G.S.t) ? 4 + Math.sin(R.t * 3 + e.id) * 1.5 : 0;
      return { cv: sp.cv, sx: quadros * sw, sy: 0, sw, sh, lp: -sp.w / 2 * k, tp: -(sp.h - 2) * k,
        w: sp.w * k, h: sp.h * k, flip: e.dir < 0, alto: voa, raio: sp.w * 0.3 * k,
        assin: 'm' + e.k + (e.elite ? 'e' : '') + (e.visualStage || 0) + ':' + quadros + ':' + (e.dir < 0 ? 1 : 0) + ':' + (e.flash > 0 ? 1 : 0) };
    }
    const heroi = tipo === 'h';
    /* Trabalhadores têm uma aparência própria guardada em _wlook (o 2D os desenha
       por R.npcDraw). Usar A.npcLook neles trocaria a pessoa. */
    const look = heroi ? A.heroLook(e) : (e._wk && e._wlook ? e._wlook : A.npcLook(e)); if (!look) return null;
    const folha = A.charSheet(look); if (!folha || !folha.cv) return null;
    const fr = A.visualPose ? A.visualPose(e, R.t) : A.charFrame(e, R.t);
    if (folha.need) folha.need(fr);
    let idx = folha.idx && folha.idx[fr];
    if (idx == null) { for (const alt of ['idle0', 'idle', 'stand', 'walk0']) { if (folha.idx && folha.idx[alt] != null) { idx = folha.idx[alt]; break; } } }
    if (idx == null) return null;
    const fw = folha.fw || 26, fh = folha.fh || 30, fs = folha.scale || 1;
    const ax = folha.ax == null ? 13 : folha.ax, ay = folha.ay == null ? 27 : folha.ay;
    return { cv: folha.cv, sx: idx * fw, sy: 0, sw: fw, sh: fh, lp: -ax * fs, tp: -ay * fs,
      w: fw * fs, h: fh * fs, flip: e.dir < 0, alto: 0, raio: 6.5,
      assin: (heroi ? 'h' : 'n') + (e.id || e.name) + ':' + fr + ':' + (e.dir < 0 ? 1 : 0) + ':' + (e.flash > 0 ? 1 : 0) + ':' + (e._lk || '') };
  }

  let quadroAtual = 0;
  function desenharVivos() {
    const S = G.S; if (!S) return;
    quadroAtual++;
    const lista = [];
    for (const h of S.heroes) if (!h.inside && h.state !== 'recover') lista.push([h, 'h']);
    for (const n of G.npcs || []) if (!n.inside) lista.push([n, 'n']);
    for (const n of G.guards || []) lista.push([n, 'n']);
    for (const m of G.mons || []) if (!m.dead && !m.nodraw) lista.push([m, 'm']);

    const a = ang * GRAU, ux = 0, uy = Math.cos(a), uz = -Math.sin(a);   // "para cima" na tela
    const nx = 0, ny = Math.sin(a), nz = Math.cos(a);                     // direção da câmera
    qTmp.setFromAxisAngle(EIXO_X, -a);
    let usados = 0;
    for (const [e, tipo] of lista) {
      let d = null;
      try { d = descrever(e, tipo); } catch (err) { d = null; }
      if (!d) continue;
      let slot = slotDe.get(e);
      if (!slot || slot.dono !== e) { slot = pegarVivo(usados); slot.dono = e; slot.assin = ''; slotDe.set(e, slot); }
      slot.vivoEm = quadroAtual;
      const prof = e.y * CFG.passoProf;
      if (slot.assin !== d.assin || slot.cv.width !== d.sw || slot.cv.height !== d.sh) {
        if (slot.cv.width !== d.sw || slot.cv.height !== d.sh) { slot.cv.width = d.sw; slot.cv.height = d.sh; }
        const c = slot.ctx;
        c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, d.sw, d.sh); c.imageSmoothingEnabled = false;
        if (d.flip) { c.translate(d.sw, 0); c.scale(-1, 1); }
        try { c.drawImage(d.cv, d.sx, d.sy, d.sw, d.sh, 0, 0, d.sw, d.sh); } catch (err) { continue; }
        if (e.flash > 0 && A.flashOf) { try { c.globalAlpha = 0.75; c.drawImage(A.flashOf(d.cv), d.sx, d.sy, d.sw, d.sh, 0, 0, d.sw, d.sh); c.globalAlpha = 1; } catch (err) { /* sem brilho */ } }
        slot.tex.needsUpdate = true; slot.assin = d.assin;
      }
      /* Mesma âncora do 2D: o ponto do chão fica em (ax, ay) dentro do sprite. */
      const L = d.w / TS, Al = d.h / TS;
      const cx = (d.lp + d.w / 2) / TS;                  // centro horizontal em relação ao pé
      const cy = -(d.tp + d.h) / TS + d.alto / TS;       // base do sprite (negativo = abaixo do ponto)
      pTmp.set(e.x + cx + ux * cy + nx * prof, uy * cy + ny * prof, e.y + uz * cy + nz * prof);
      sTmp.set(L, Al, 1);
      mTmp.compose(pTmp, qTmp, sTmp);
      slot.mesh.matrix.copy(mTmp); slot.mesh.matrixAutoUpdate = false; slot.mesh.matrixWorldNeedsUpdate = true;
      slot.mesh.visible = true;

      const som = pegarSombra(usados), r = d.raio / TS;
      som.position.set(e.x + nx * (prof - CFG.passoProf * 0.4), 0.004 + ny * (prof - CFG.passoProf * 0.4), e.y + nz * (prof - CFG.passoProf * 0.4));
      som.scale.set(r * 2.3, 1, r * 1.1);
      som.visible = true;
      usados++;
    }
    for (const s of poolVivos) if (s.vivoEm !== quadroAtual) { s.mesh.visible = false; if (s.dono) { slotDe.delete(s.dono); s.dono = null; } }
    for (let i = usados; i < poolSombras.length; i++) poolSombras[i].visible = false;
  }

  /* ---------- itens 2D avulsos no 3D (portal, criatura da sorte, ...) ----------
     Vários módulos registram itens dinâmicos do tipo 'x': funções que pintam num
     contexto 2D em coordenadas de tela. Em vez de reescrever cada uma, elas pintam
     numa camada transparente por cima do 3D, usando a projeção da câmera 3D — então
     caem no lugar certo sem código novo. É também onde rótulos e números de dano
     vão entrar na Fase 4.
     Limite conhecido: esta camada fica sempre na frente, sem se misturar na
     profundidade com os sprites 3D. */
  let cvUI = null, ctxUI = null;

  function montarCamadaUI() {
    cvUI = document.createElement('canvas');
    cvUI.id = 'view3d-ui';
    cvUI.setAttribute('aria-hidden', 'true');
    cvUI.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;z-index:2;display:block;pointer-events:none';
    cv3.parentElement.insertBefore(cvUI, cv3.nextSibling);
    ctxUI = cvUI.getContext('2d');
  }

  function desenharExtras(dt) {
    if (!ctxUI) return;
    ctxUI.setTransform(1, 0, 0, 1, 0, 0);
    ctxUI.clearRect(0, 0, cwA, chA);
    const c = R.cam, z = c.z;
    const vx0 = (c.x - cwA / 2 / z) / TS - 3, vx1 = (c.x + cwA / 2 / z) / TS + 3;
    const vy0 = (c.y - chA / 2 / z) / TS - 1, vy1 = (c.y + chA / 2 / z) / TS + 5;
    const dyn = [];
    try { if (R.dynMore) R.dynMore(dyn, vx0, vx1, vy0, vy1); } catch (e) { /* módulo ausente */ }
    try { G.runHooks('renderItems', dyn, ctxUI, { x0: vx0, x1: vx1, y0: vy0, y1: vy1 }); } catch (e) { /* idem */ }
    const itens = dyn.filter((d) => d && d.k === 'x' && typeof d.f === 'function');
    if (!itens.length) return;
    /* Sem giro lateral, a coluna da tela depende só do x do mundo e a linha só do y,
       então dá para entregar X e Y separados, como o desenho 2D espera. */
    const proj = (wx, wy) => { vTmp.set(wx, 0, wy).project(cam); return [(vTmp.x + 1) / 2 * cwA, (1 - vTmp.y) / 2 * chA]; };
    const ctxAntigo = R.ctx;
    for (const d of itens) {
      try {
        R.ctx = ctxUI;
        ctxUI.save(); ctxUI.imageSmoothingEnabled = false;
        d.f(d.e, (wx) => proj(wx, d.y || 0)[0], (wy) => proj(d.e ? d.e.x : 0, wy)[1], z, [], dt);
        ctxUI.restore();
      } catch (err) { try { ctxUI.restore(); } catch (e2) { /* nada */ } }
      R.ctx = ctxAntigo;
    }
    R.ctx = ctxAntigo;
  }

  function aplicarNoite(escuro) {
    const q = Math.round(escuro * 64) / 64;
    if (q === escuroAplicado) return;
    escuroAplicado = q;
    /* Mesma ideia do 2D: um véu azulado por cima. Aqui vira multiplicação de cor. */
    const k = 1 - q * 0.55, r = k, g = k * (1 - q * 0.05), b = Math.min(1, k * (1 + q * 0.18));
    for (const m of materiais) m.color.setRGB(r, g, b);
  }

  /* ---------- câmera ---------- */

  /* Repete, sem desvios, o que o R.frame do 2D faz com a câmera: seguir herói,
     deslizar até R.tx/R.ty e prender nas bordas do mapa. */
  function moverCamera(dt) {
    const S = G.S, c = R.cam;
    if (R.follow) {
      const h = S.heroes.find((x) => x.id === R.follow);
      if (h && !h.inside) { R.tx = h.x * TS; R.ty = (h.y - 0.6) * TS; } else if (!h) R.follow = 0;
    }
    if (R.tx != null) {
      c.x += (R.tx - c.x) * Math.min(1, dt * 6); c.y += (R.ty - c.y) * Math.min(1, dt * 6);
      if (!R.follow && Math.abs(R.tx - c.x) < 0.5 && Math.abs(R.ty - c.y) < 0.5) R.tx = null;
    }
    const z = c.z, hw = cwA / 2 / z, hh = chA / 2 / z;
    const mw = Wd.w * TS, mh = Wd.h * TS, fog = R.fogMargin ? R.fogMargin(hw, hh) : { x: 0, top: 0, bottom: 0 };
    c.x = G.clamp(c.x, Math.min(hw - fog.x, mw / 2), Math.max(mw - hw + fog.x, mw / 2));
    c.y = G.clamp(c.y, Math.min(hh - fog.top, mh / 2), Math.max(mh - hh + fog.bottom, mh / 2));
  }

  function ajustarCamera() {
    const c = R.cam, a = ang * GRAU, z = c.z;
    /* Mesma área visível do 2D: largura em tiles = pixels do canvas / (zoom × 16). */
    const lv = cwA / (z * TS), av = chA / (z * TS);
    cam.left = -lv / 2; cam.right = lv / 2; cam.top = av / 2; cam.bottom = -av / 2;
    cam.near = 1; cam.far = CFG.distCam * 2;
    alvoTmp.set(c.x / TS, 0, c.y / TS);
    cam.position.set(alvoTmp.x, Math.sin(a) * CFG.distCam, alvoTmp.z + Math.cos(a) * CFG.distCam);
    cam.up.set(0, Math.cos(a), -Math.sin(a));           // sempre perpendicular, inclusive a 90°
    cam.lookAt(alvoTmp);
    cam.updateProjectionMatrix();
  }

  /* Em "Econômica" ou com economia de bateria, o 3D desenha com metade da largura
     e da altura (um quarto dos pixels) e a tela estica. É o botão mais eficaz que
     o jogador tem se o aparelho não der conta. */
  function escala() {
    try {
      const C = window.AuroraPlatform && window.AuroraPlatform.Config;
      if (C && (C.get('tela.qualidade') === 'baixa' || C.get('tela.economiaBateria'))) return 0.5;
    } catch (e) { /* sem configuração */ }
    if (G.S && G.S.opts && (G.S.opts.lowFx || G.S.opts.battery)) return 0.5;
    return 1;
  }
  let escalaAtual = 1;
  function conferirTamanho() {
    const k = escala(), w = Math.max(2, Math.round(cv2.width * k)), h = Math.max(2, Math.round(cv2.height * k));
    if (w === cwA && h === chA && k === escalaAtual) return;
    escalaAtual = k;
    cwA = w; chA = h;
    cv3.width = w; cv3.height = h;
    const larguraCSS = (cv2.width / dpr()) + 'px', alturaCSS = (cv2.height / dpr()) + 'px';
    cv3.style.width = larguraCSS; cv3.style.height = alturaCSS;
    if (cvUI) { cvUI.width = w; cvUI.height = h; cvUI.style.width = larguraCSS; cvUI.style.height = alturaCSS; }
    ren.setSize(w, h, false);
    janela = null;
  }

  /* ---------- interface do renderizador ---------- */

  const R3D = {
    id: '3d', nome: 'Aurora em 3D',

    disponivel() {
      if (!suportaWebGL2()) return 'Este aparelho não tem WebGL, então a vista 3D não roda aqui.';
      if (!R.terrainPreview) return 'Abra o reino antes de trocar a vista.';
      return true;
    },

    init() {
      engasgos = 0; desdeQueEntrou = 0; desistindo = false;
      if (ren) { cv3.style.display = 'block'; if (cvUI) cvUI.style.display = 'block'; CFG.angulo = G.clamp(prefAngulo(), CFG.minAngulo, CFG.maxAngulo); ang = 90; mirarAngulo(CFG.angulo); precisaMatrizes = true; return; }
      cena = new THREE.Scene();
      cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 1000);
      montarCanvas();
      montarChao();
      montarSprites();
      cena.add(cam);
      CFG.angulo = G.clamp(prefAngulo(), CFG.minAngulo, CFG.maxAngulo);
      ang = 90; mirarAngulo(CFG.angulo);
      conferirTamanho(); ajustarCamera();
    },

    frame(dt) {
      conferirTamanho();
      if (!cwA || !chA) return;
      /* Rede de segurança: se o aparelho não estiver dando conta, volta para o 2D
         em vez de deixar o jogador preso numa vista travada. */
      if (desdeQueEntrou > 2.5) { if (dt * 1000 > CFG.msRuim) engasgos++; else engasgos = Math.max(0, engasgos - 0.5); }
      desdeQueEntrou += dt;
      if (engasgos >= CFG.engasgosParaDesistir && !desistindo) {
        desistindo = true;
        try { G.UI.toast('A vista 3D está pesada neste aparelho; voltei para a clássica. Em Ajustes → Gráficos dá para tentar a qualidade Econômica.', 'bad', null, 7000); } catch (e) { /* sem aviso */ }
        G.RENDER.trocar('2d');
        return;
      }
      R.t += dt;
      moverCamera(dt);
      if (ang !== angAlvo) {
        const passo = Math.max(0.0001, angVel * dt);
        ang = angAlvo > ang ? Math.min(angAlvo, ang + passo) : Math.max(angAlvo, ang - passo);
        precisaMatrizes = true;
        if (ang === angAlvo && resolverRecolher) { const f = resolverRecolher; resolverRecolher = null; f(); }
      }
      if (mudouJanela()) precisaMatrizes = true;
      if (precisaMatrizes) cronometro('matrizes', atualizarMatrizes);
      cronometro('vivos', desenharVivos);
      cronometro('extras', () => desenharExtras(dt));
      cronometro('noite', () => aplicarNoite(G.S ? G.darkness(G.S.clock) : 0));
      cronometro('camera', ajustarCamera);
      cronometro('gpu', () => ren.render(cena, cam));
      if (MED.on) MED.n++;
    },

    screenToWorld(px, py) {
      if (!cam || !cwA) return [R.cam.x / TS, R.cam.y / TS];
      raycaster.setFromCamera({ x: (px * dpr() / cwA) * 2 - 1, y: -((py * dpr() / chA) * 2 - 1) }, cam);
      const p = raycaster.ray.intersectPlane(planoChao, vTmp);
      return p ? [p.x, p.z] : [R.cam.x / TS, R.cam.y / TS];
    },

    worldToScreen(wx, wy) {
      if (!cam || !cwA) return [0, 0];
      vTmp.set(wx, 0, wy).project(cam);
      return [(vTmp.x + 1) / 2 * cwA / dpr(), (1 - vTmp.y) / 2 * chA / dpr()];
    },

    dispose() { if (cv3) cv3.style.display = 'none'; if (cvUI) { cvUI.style.display = 'none'; ctxUI && ctxUI.clearRect(0, 0, cwA, chA); } },

    /* Sobe a câmera de volta a 90° antes de devolver a vista ao 2D (transição de saída). */
    recolher() {
      if (!ren || ang === 90) return Promise.resolve();
      mirarAngulo(90);
      return new Promise((ok) => { resolverRecolher = ok; setTimeout(() => { if (resolverRecolher === ok) { resolverRecolher = null; ok(); } }, CFG.transicao * 1000 + 400); });
    },

    /* Ajustes vindos da interface (ângulo da câmera). */
    cfg: CFG,
    anguloAtual: () => ang,
    definirAngulo(graus) {
      CFG.angulo = G.clamp(Number(graus) || CFG.angulo, CFG.minAngulo, CFG.maxAngulo);
      if (ren && G.RENDER.modo === '3d') mirarAngulo(CFG.angulo);
      return CFG.angulo;
    },
    /* Usado pelos testes: números para comparar com o 2D. */
    medir(lig) { MED.on = !!lig; MED.n = 0; MED.t = {}; },
    engasgos: () => engasgos,
    /* Para os testes: quem é o dono de cada sprite em uso e que arte está nele. */
    slots: () => poolVivos.filter((x) => x.mesh.visible).map((x) => ({
      assin: x.assin, tipo: x.assin ? x.assin[0] : '?',
      dono: x.dono ? (x.dono.k ? 'm:' + x.dono.k : (x.dono.cls ? 'h:' + x.dono.id : 'n:' + (x.dono.id || x.dono.name))) : null,
    })),
    medida: () => ({ quadros: MED.n, ms: Object.fromEntries(Object.entries(MED.t).map(([k, v]) => [k, +(v / Math.max(1, MED.n)).toFixed(2)])) }),
    estado: () => ({ ang, angAlvo, cw: cwA, ch: chA, lotes: lotes.length,
      sprites: lotes.reduce((n, l) => n + l.lista.length, 0),
      camZ: R.cam.z, frustum: cam ? [cam.left, cam.right, cam.top, cam.bottom] : null }),
  };

  /* Prédios mudam de arte ao subir de nível ou quebrar: refaz os lotes. */
  G.on('bld', () => {
    if (!ren) return;
    for (const l of lotes) { cena.remove(l.mesh); l.mesh.dispose(); }
    for (const m of materiais.slice(1)) { if (m.map) m.map.dispose(); m.dispose(); }
    materiais.length = 1; lotes = [];
    montarSprites(); escuroAplicado = -1;
  });

  G.RENDER.registrar(R3D);
  G.R3D = R3D;
})();
