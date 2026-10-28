// Utilitários de teste visual: abrem o game.html montado no Chromium (sem rede) e levam o jogo a cada tela.
const { chromium } = require('playwright');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const HTML_PADRAO = path.join(RAIZ, 'dist', 'game.html');

/** Abre o jogo, cria uma partida nova e fecha o painel de recompensas diárias. */
async function abrir({ arquivo = HTML_PADRAO, largura = 393, altura = 851, hora = '2026-10-28T12:05:00Z', classe = null } = {}) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: largura, height: altura }, deviceScaleFactor: 2, isMobile: largura < 700, hasTouch: largura < 700 });
  const page = await ctx.newPage();
  const erros = [], rede = [];
  page.on('pageerror', e => erros.push(String(e)));
  page.on('request', r => { const u = r.url(); if (!u.startsWith('file:') && !u.startsWith('data:') && !u.startsWith('blob:')) rede.push(u); });
  // minuto 5 da hora = dia; minutos 25–45 = noite (ciclo do jogo)
  await page.clock.install({ time: new Date(hora) });
  await page.goto('file://' + arquivo);
  await page.clock.resume();
  await page.waitForTimeout(2500);
  if (classe) await page.getByText(classe, { exact: true }).first().click();
  await page.getByText('Começar aventura').click();
  await page.waitForTimeout(2500);
  const ok = page.locator('button:visible', { hasText: 'Continuar' }).first();
  if (await ok.count()) await ok.tap();
  await page.waitForTimeout(800);
  return { browser, page, erros, rede };
}

const foto = (page, destino) => page.screenshot({ path: destino });
const painel = async (page, nome) => { await page.locator(`[data-open="${nome}"]`).first().tap(); await page.waitForTimeout(900); };
const fecharPainel = async page => { await page.evaluate(() => closePanel()); await page.waitForTimeout(300); };
/** Inicia o combate contra o primeiro monstro visível e aceita a tela de encontro. */
async function batalha(page, indice = 0) {
  await page.evaluate(i => { window.__b = startMapBattle(EX.mons[i]); }, indice);
  await page.waitForTimeout(2200);
  await page.evaluate(() => ACT.encounterfight());
  await page.waitForTimeout(3200);
}

module.exports = { abrir, foto, painel, fecharPainel, batalha, RAIZ };
