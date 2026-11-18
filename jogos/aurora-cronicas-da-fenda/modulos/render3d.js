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
    passoProf: 0.002,    // separação de profundidade entre sprites, em unidades
    distCam: 400,        // a câmera é ortográfica: a distância não muda o tamanho, só a ordem
  };

  const EIXO_X = new THREE.Vector3(1, 0, 0);
  let ren = null, cena = null, cam = null, cv3 = null, cv2 = null;
  let chao = null, texChao = null, lotes = [], materiais = [], geo = null;
  let ang = 90, angAlvo = CFG.angulo, angVel = 0, cwA = 0, chA = 0, escuroAplicado = -1;
  let precisaMatrizes = true, resolverRecolher = null;
  const raycaster = new THREE.Raycaster(), planoChao = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const vTmp = new THREE.Vector3(), mTmp = new THREE.Matrix4(), qTmp = new THREE.Quaternion();
  const pTmp = new THREE.Vector3(), sTmp = new THREE.Vector3(), alvoTmp = new THREE.Vector3();

  const dpr = () => R.dpr || 1;
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
  }

  function textura(cv) {
    const t = new THREE.CanvasTexture(cv);
    t.magFilter = THREE.NearestFilter;                 // pixel art: nada de borrar ao ampliar
    t.minFilter = THREE.LinearMipmapLinearFilter;      // mipmap evita o chuvisco ao afastar
    t.generateMipmaps = true;
    t.anisotropy = Math.min(8, ren.capabilities.getMaxAnisotropy());
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
    itens.sort((a, b) => a.y - b.y);                    // mesma ordem de pintura do 2D
    itens.forEach((it, i) => { it.rank = i + 1; });
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

  /* A posição de cada sprite é deslocada na direção da câmera por rank × passo.
     Em projeção ortográfica isso NÃO muda nada na tela — só a ordem de profundidade.
     Assim o 3D respeita exatamente a ordem de pintura do 2D e ainda usa o z-buffer. */
  function atualizarMatrizes() {
    const a = ang * GRAU, nx = 0, ny = Math.sin(a), nz = Math.cos(a);
    qTmp.setFromAxisAngle(EIXO_X, -a);
    for (const lote of lotes) {
      const { mesh, lista } = lote;
      for (let i = 0; i < lista.length; i++) {
        const it = lista[i], d = it.rank * CFG.passoProf;
        pTmp.set(it.x + nx * d, ny * d, it.y + nz * d);
        sTmp.set(it.w / TS, it.h / TS, 1);
        mTmp.compose(pTmp, qTmp, sTmp);
        mesh.setMatrixAt(i, mTmp);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
    precisaMatrizes = false;
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

  function conferirTamanho() {
    const w = cv2.width, h = cv2.height;
    if (w === cwA && h === chA) return;
    cwA = w; chA = h;
    cv3.width = w; cv3.height = h;
    cv3.style.width = (w / dpr()) + 'px'; cv3.style.height = (h / dpr()) + 'px';
    ren.setSize(w, h, false);
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
      if (ren) { cv3.style.display = 'block'; CFG.angulo = G.clamp(prefAngulo(), CFG.minAngulo, CFG.maxAngulo); ang = 90; mirarAngulo(CFG.angulo); precisaMatrizes = true; return; }
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
      R.t += dt;
      moverCamera(dt);
      if (ang !== angAlvo) {
        const passo = Math.max(0.0001, angVel * dt);
        ang = angAlvo > ang ? Math.min(angAlvo, ang + passo) : Math.max(angAlvo, ang - passo);
        precisaMatrizes = true;
        if (ang === angAlvo && resolverRecolher) { const f = resolverRecolher; resolverRecolher = null; f(); }
      }
      if (precisaMatrizes) atualizarMatrizes();
      aplicarNoite(G.S ? G.darkness(G.S.clock) : 0);
      ajustarCamera();
      ren.render(cena, cam);
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

    dispose() { if (cv3) cv3.style.display = 'none'; },

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
