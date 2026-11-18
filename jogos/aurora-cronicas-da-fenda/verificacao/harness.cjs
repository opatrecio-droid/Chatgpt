/* Harness determinístico: relógio virtual (vclock.js) + Math.random com semente. Saída: JSON de "capturas" comparáveis.
   Uso: node verificacao/harness.cjs file:///caminho/www/index.html saida.json [completo|rapido]
   Cada captura guarda hash do estado do jogo (ser), do texto da tela, de erros, do layout (fp) e, de forma "leve", de cores (fpc) e pixels (shot). */
const { chromium } = require('playwright');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const sha = (b) => createHash('sha256').update(b).digest('hex').slice(0, 16);
const [url, out, modo = 'completo'] = process.argv.slice(2);
const SHEETS = [['reino', 'geral'], ['reino', 'obras'], ['reino', 'publicas'], ['herois', 'lista'], ['forja', 'forjar'], ['armazem', 'equip'], ['armazem', 'materiais'], ['armazem', 'atelie'], ['mais', 'bencaos'], ['mais', 'codex'], ['mais', 'cronicas'], ['mais', 'recordes'], ['mais', 'opcoes'], ['mais', 'bestiario'], ['missoes', 'jornada'], ['missoes', 'arena'], ['missoes', 'caminhos'], ['missoes', 'colosso'], ['missoes', 'contratos'], ['missoes', 'fenda'], ['missoes', 'incursoes']];
const PULAR = /exit|wipe|import|reset|apag|delete|erase|sair|quit|restor|recover|rebirth|renasc|errors|debug|sbexit|sbstart|sbnew|t-new|t-continue|uxexit/i;

(async () => {
  const b = await chromium.launch();
  const vps = modo === 'rapido' ? [{ w: 844, h: 390, mobile: true }] : [{ w: 1280, h: 720 }, { w: 844, h: 390, mobile: true }, { w: 390, h: 844, mobile: true }];
  const snaps = [];
  for (const vp of vps) {
    const ctx = await b.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1, hasTouch: !!vp.mobile, isMobile: !!vp.mobile });
    await ctx.addInitScript({ path: __dirname + '/vclock.js' });
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message.slice(0, 160)));
    const adv = async (ms) => { for (let left = ms; left > 0; left -= 16) await p.evaluate((s) => __advance(s), Math.min(16, left)); };
    const tag = vp.w + 'x' + vp.h;
    const snap = async (label, shot = true) => {
      const d = await p.evaluate(() => {
        const t = document.body.innerText;
        let st = null, ser = null;
        try { if (G.S) { ser = G.serialize(); st = ser.length; } } catch (e) { st = 'serr:' + e.message.slice(0, 60); }
        let er = null; try { er = (G.errorReport ? G.errorReport() : '').toString(); } catch (e) { er = 'err?'; }
        return { text: t, ser, st, modal: !!(G.UI && G.UI.modalOpen), er };
      });
      const fps = await p.evaluate(() => {
        const L = ['display', 'position', 'fontSize', 'fontFamily', 'fontWeight', 'marginTop', 'marginLeft', 'paddingTop', 'paddingLeft', 'borderTopWidth', 'zIndex', 'overflowX', 'overflowY', 'visibility', 'flexDirection', 'gridTemplateColumns', 'lineHeight', 'letterSpacing', 'gap', 'whiteSpace', 'textAlign'];
        const C = ['color', 'backgroundColor', 'backgroundImage', 'opacity', 'transform', 'boxShadow', 'textShadow', 'borderTopColor', 'borderRadius'];
        const hash = (list, geo) => {
          let h = 2166136261, n = 0; const mix = (str) => { for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } };
          for (const e of document.querySelectorAll('body *')) {
            if (e.tagName === 'SCRIPT' || e.tagName === 'STYLE') continue;
            const cs = getComputedStyle(e); n++;
            mix(e.tagName + '|' + (typeof e.className === 'string' ? e.className : '') + (geo ? '|' + e.offsetLeft + ',' + e.offsetTop + ',' + e.offsetWidth + ',' + e.offsetHeight : ''));
            for (const k of list) { const v = cs[k]; mix(k === 'backgroundImage' && v.length > 200 ? 'img' + v.length : v); }
          }
          return n + ':' + (h >>> 0).toString(16);
        };
        return { fp: hash(L, true), fpc: hash(C, false) };
      });
      const fp = fps.fp, fpc = fps.fpc;
      const rec = { tag, label, fp, fpc, text: sha(d.text), textHead: d.text.slice(0, 160).replace(/\s+/g, ' '), ser: d.ser ? sha(d.ser) : null, modal: d.modal, errs: sha(d.er), errHead: d.er.slice(0, 200) };
      if (shot) { await p.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => 0)))); await p.waitForTimeout(250); let ult = null; for (let t = 0; t < 6; t++) { const h1 = sha(await p.screenshot({ animations: 'disabled' })); if (h1 === ult) break; ult = h1; await p.waitForTimeout(200); } rec.shot = ult; }
      snaps.push(rec);
    };
    await p.goto(url);
    await p.evaluate(() => document.fonts.ready);
    await adv(9000);
    await p.waitForTimeout(500);
    await snap('titulo', false);
    if (modo !== 'rapido' || true) {
      await p.click('[data-a="am-config"]').catch(() => {}); await adv(400); await snap('ajustes');
      await p.keyboard.press('Escape'); await adv(300);
    }
    await p.evaluate(() => __reseed(1)); await p.click('[data-a="t-new"]'); await p.evaluate(() => __reseed(2)); await adv(4000); await snap('inicio');
    await p.evaluate(() => { G.UI.closeAll(); G.UI.closeModal(); }); await adv(500);
    await p.keyboard.press('3'); 
    for (const s of [5, 15, 30]) { await p.evaluate((s) => __reseed(10 + s), s); await adv(s * 1000); await snap('sim+' + s + 's'); }
    for (const [n, t] of SHEETS) {
      await p.evaluate(([n, t]) => { try { G.UI.closeAll(); G.UI.open(n, t); } catch (e) { window.__e = String(e).slice(0, 100); } }, [n, t]);
      await adv(700); await snap('sheet:' + n + ':' + t);
    }
    await p.evaluate(() => G.UI.closeAll()); await adv(300);
    await p.evaluate(() => { try { G.UI.ACT.map(); } catch (e) { } }); await adv(500); await snap('mapa');
    await p.evaluate(() => G.UI.closeAll()); await adv(300);
    if (vp.w === 1280) {
      // todas as ações públicas da interface, chamadas sem argumento
      const nomes = await p.evaluate(() => Object.keys(G.UI.ACT).sort());
      let i = 0;
      for (const nm of nomes) {
        if (PULAR.test(nm)) continue;
        const r = await p.evaluate((nm) => { let m = 'ok'; try { G.UI.act(nm, [], null, null); } catch (e) { m = 'EXC ' + String(e).slice(0, 80); } return m; }, nm);
        await adv(120);
        if (i++ % 4 === 0) await snap('act:' + nm + ':' + r, false); else snaps.push({ tag, label: 'act:' + nm, r });
        await p.evaluate(() => { try { G.UI.closeAll(); } catch (e) { } });
        if (!(await p.evaluate(() => G.M.running))) { snaps.push({ tag, label: 'SAIU-DO-JOGO após ' + nm }); break; }
      }
      await adv(2000); await snap('pos-acoes');
      // salvar, recarregar, continuar
      await p.evaluate(() => G.M.save());
      await p.reload(); await p.evaluate(() => document.fonts.ready); await adv(9000); await snap('titulo-com-save', false);
      await p.click('[data-a="t-continue"]'); await adv(4000); await snap('continuar');
      await adv(20000); await snap('continuar+20s');
    }
    snaps.push({ tag, label: 'PAGEERRS', errs: errs.slice(0, 20) });
    await ctx.close();
  }
  await b.close();
  fs.writeFileSync(out, JSON.stringify(snaps, null, 1));
  console.log('snaps:', snaps.length, '→', out);
})().catch((e) => { console.error('FALHA', e); process.exit(1); });
