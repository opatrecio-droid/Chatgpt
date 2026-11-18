/* Testes do modo 3D. Uso: node verificacao/teste-3d.cjs [file:///caminho/www/index.html]
   Precisa de Playwright (npm i -D playwright). Sai com código 1 se algum teste falhar.
   O ambiente sem GPU roda WebGL por software: aqui se testa CORREÇÃO, não velocidade. */
const { chromium } = require('playwright');
const path = require('node:path');
const URL = process.argv[2] || 'file://' + path.resolve(__dirname, '../www/index.html');
let falhas = 0;
const ok = (c, m) => { if (!c) falhas++; console.log((c ? 'PASS ' : 'FAIL ') + m); };

async function novoJogo(b, vp) {
  const p = await (await b.newContext(vp)).newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
  await p.goto(URL);
  await p.waitForSelector('.am-root', { timeout: 30000 });
  await p.click('[data-a="t-new"]');
  await p.waitForFunction(() => window.G && G.M && G.M.running, null, { timeout: 60000 });
  await p.waitForTimeout(4000);
  await p.evaluate(() => { G.S.tut.done = true; G.UI.closeAll(); G.UI.closeModal(); });
  await p.waitForTimeout(300);
  return { p, errs };
}
const entrar3D = (p) => p.evaluate(() => G.UI.act('vista3d'))
  .then(() => p.waitForFunction(() => G.RENDER.modo === '3d' && G.R3D.estado().ang === G.R3D.estado().angAlvo, null, { timeout: 60000 }));
const sair3D = (p) => p.evaluate(() => G.UI.act('vista3d'))
  .then(() => p.waitForFunction(() => G.RENDER.modo === '2d', null, { timeout: 30000 }));

(async () => {
  const b = await chromium.launch();
  const { p, errs } = await novoJogo(b, { viewport: { width: 1280, height: 720 } });

  console.log('— carga sob demanda');
  ok(await p.evaluate(() => G.RENDER.modo === '2d' && G.RENDER.lista().length === 1), 'o jogo começa no 2D, só com o 2D carregado');
  ok(await p.evaluate(() => !document.getElementById('aurora-render3d')), 'o código 3D ainda não foi executado');
  ok(await p.evaluate(() => !!document.getElementById('fab-vista')), 'o botão 3D/2D existe em #fabs-l');

  console.log('— fidelidade: a 90° o 3D põe cada ponto no mesmo pixel do 2D');
  const pts = [[44, 53], [20, 20], [70, 95], [44.5, 60]];
  const em2D = await p.evaluate((pts) => pts.map(([x, y]) => G.R.worldToScreen(x, y)), pts);
  await entrar3D(p);
  await p.evaluate(() => G.R3D.definirAngulo(90));
  await p.waitForFunction(() => G.R3D.estado().ang === 90, null, { timeout: 15000 });
  const em3D = await p.evaluate((pts) => pts.map(([x, y]) => G.R.worldToScreen(x, y)), pts);
  let pior = 0; em2D.forEach((a, i) => { pior = Math.max(pior, Math.abs(a[0] - em3D[i][0]), Math.abs(a[1] - em3D[i][1])); });
  ok(pior < 0.5, `erro máximo a 90°: ${pior.toFixed(2)} px (tem de ficar em 0,00)`);
  const ida = await p.evaluate(() => [[200, 200], [640, 360], [1100, 650]].map(([x, y]) => { const w = G.R.screenToWorld(x, y), s = G.R.worldToScreen(w[0], w[1]); return Math.max(Math.abs(s[0] - x), Math.abs(s[1] - y)); }));
  ok(Math.max(...ida) < 0.5, `tela → mundo → tela fecha (erro ${Math.max(...ida).toFixed(3)} px)`);

  console.log('— toque: o canvas 2D continua recebendo a entrada');
  await p.evaluate(() => G.R3D.definirAngulo(55));
  await p.waitForFunction(() => G.R3D.estado().ang === 55, null, { timeout: 15000 });
  ok(await p.evaluate(() => getComputedStyle(document.getElementById('view3d')).pointerEvents === 'none'), 'o canvas 3D não intercepta ponteiro');
  const c0 = await p.evaluate(() => ({ x: G.R.cam.x, y: G.R.cam.y }));
  await p.mouse.move(640, 400); await p.mouse.down();
  for (let i = 1; i <= 10; i++) await p.mouse.move(640 - i * 10, 400 - i * 6);
  await p.mouse.up(); await p.waitForTimeout(300);
  const c1 = await p.evaluate(() => ({ x: G.R.cam.x, y: G.R.cam.y }));
  ok(Math.abs(c1.x - c0.x) > 10 && Math.abs(c1.y - c0.y) > 10, 'arrastar move a câmera nos dois eixos');
  const z0 = await p.evaluate(() => G.R.cam.z);
  await p.mouse.move(640, 360); await p.mouse.wheel(0, -200); await p.waitForTimeout(400);
  ok(await p.evaluate((z0) => G.R.cam.z !== z0, z0), 'a roda muda o zoom');
  const tile = await p.evaluate(() => { const a = G.W.plots.ferraria, wx = a.x + 3, wy = a.y + 2; G.R.focus(wx, wy); return [wx, wy]; });
  await p.waitForTimeout(800);
  const erroTile = await p.evaluate(([wx, wy]) => { const s = G.R.worldToScreen(wx, wy), v = G.R.screenToWorld(s[0], s[1]); return Math.max(Math.abs(v[0] - wx), Math.abs(v[1] - wy)); }, tile);
  ok(erroTile < 0.01, `o toque cai no tile certo (erro ${erroTile.toFixed(4)} tile)`);

  console.log('— entidades: nenhum sprite fica com a arte de outra (o bug "NPC vira monstro")');
  const churn = await p.evaluate(() => new Promise((res) => {
    const erros = []; let volta = 0; const orig = (G.npcs || []).map((n) => n.inside);
    const passo = () => {
      volta++;
      (G.npcs || []).forEach((n, i) => { if ((volta + i) % 3 === 0) n.inside = !n.inside; });
      requestAnimationFrame(() => requestAnimationFrame(() => {
        for (const s of G.R3D.slots()) {
          if (!s.dono) { erros.push('slot sem dono'); continue; }
          if (s.tipo !== s.dono[0]) erros.push(`arte '${s.tipo}' em dono ${s.dono}`);
        }
        if (volta < 40) passo(); else { (G.npcs || []).forEach((n, i) => { n.inside = orig[i]; }); res(erros); }
      }));
    };
    passo();
  }));
  ok(churn.length === 0, '40 rodadas de entra-e-sai sem sprite trocado' + (churn.length ? ': ' + churn.slice(0, 3).join(' | ') : ''));

  console.log('— qualidade e rede de segurança');
  const r0 = await p.evaluate(() => G.R3D.estado());
  await p.evaluate(() => AuroraPlatform.Config.set('tela.economiaBateria', true)); await p.waitForTimeout(800);
  const r1 = await p.evaluate(() => G.R3D.estado());
  ok(r1.cw < r0.cw, `Econômica reduz a resolução do 3D (${r0.cw}×${r0.ch} → ${r1.cw}×${r1.ch})`);
  await p.evaluate(() => AuroraPlatform.Config.set('tela.economiaBateria', false)); await p.waitForTimeout(600);
  ok((await p.evaluate(() => G.R3D.estado())).cw === r0.cw, 'desligando, a resolução volta');
  ok(await p.evaluate(() => typeof G.R3D.engasgos === 'function' && G.R3D.engasgos() < 45), 'o contador da rede de segurança existe e não disparou');

  console.log('— volta ao 2D');
  const antes = await p.evaluate(() => [G.R.cam.x, G.R.cam.y, G.R.cam.z]);
  await sair3D(p); await p.waitForTimeout(400);
  const depois = await p.evaluate(() => [G.R.cam.x, G.R.cam.y, G.R.cam.z]);
  ok(Math.abs(antes[0] - depois[0]) < 1 && Math.abs(antes[1] - depois[1]) < 1 && antes[2] === depois[2], 'a troca mantém o centro e o zoom da câmera');
  ok(await p.evaluate(() => getComputedStyle(document.getElementById('view3d')).display === 'none'), 'o canvas 3D some ao voltar');
  ok(await p.evaluate(() => !G.S.paused), 'a simulação não pausa com a troca');

  ok(errs.length === 0, 'nenhum erro de página' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await b.close();
  console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo.');
  process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('ERRO NO TESTE', e); process.exit(1); });
