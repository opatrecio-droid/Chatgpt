// Regras vistas nos guias da comunidade: fraqueza dobra o dano, facção ±25%, cor dos números, bônus de arma preferida e
// linha de bônus de classe comparada com a classe atual.
const { abrir } = require('./lib');
const afirma = (ok, msg) => { if (!ok) { console.log('FALHOU:', msg); process.exitCode = 1; } };
(async () => {
  const { browser, page, erros } = await abrir({});
  const r = await page.evaluate(() => {
    const mk = (extra = {}) => Object.assign({ hp: 1e6, maxhp: 1e6, atk: 1000, mag: 1000, def: 0, res: 0, dex: 1, effects: {}, crit: 0 }, extra);
    const dmg = (a, t, o) => Rules.damage(mk(a), mk(t), Object.assign({ neverMiss: true }, o), () => .5);
    const base = dmg({}, {}, { elem: 'fogo' }).d;
    const fraco = dmg({}, { weak: ['fogo'] }, { elem: 'fogo' });
    const resiste = dmg({}, { eres: ['fogo'] }, { elem: 'fogo' });
    const imune = dmg({}, { immune: ['fogo'] }, { elem: 'fogo' });
    const meu = dmg({ faction: 'fogo' }, {}, { elem: 'fogo' }).d, recebo = dmg({}, { faction: 'fogo' }, { elem: 'fogo' });
    // arma preferida
    const antes = equippedIn, espada = Catalog.data.items.find(i => i.facts?.Type === 'Swords').key, cajado = Catalog.data.items.find(i => i.facts?.Type === 'Staffs').key;
    const classeAntes = S.cls; S.cls = 'c_95';
    equippedIn = (set, sl) => sl === 'weapon' ? { catalogKey: espada } : null; const comEspada = armaPreferida('padrao');
    equippedIn = (set, sl) => sl === 'weapon' ? { catalogKey: cajado } : null; const comCajado = armaPreferida('padrao');
    equippedIn = antes; S.cls = classeAntes;
    // linha de bônus: comparada com a classe atual
    S.lvl = 17; const jogando = S.cls; S.cls = 'mago';
    const linhaMagoComoMago = (() => { const d = document.createElement('div'); d.innerHTML = mClass('mago', 'info'); return d.querySelector('.cd-st')?.textContent || ''; })();
    const linhaGuerreiroComoMago = (() => { const d = document.createElement('div'); d.innerHTML = mClass('guerreiro', 'info'); return d.querySelector('.cd-st')?.textContent || ''; })();
    S.cls = jogando;
    return { base, fraco: fraco.d, notaFraco: fraco.note, resiste: resiste.d, notaRes: resiste.note, imune: imune.d, meu, recebo: recebo.d, reduzido: recebo.reduced, comEspada, comCajado, linhaMagoComoMago, linhaGuerreiroComoMago };
  });
  console.log(JSON.stringify(r));
  afirma(Math.abs(r.fraco / r.base - 2) < .01 && r.notaFraco === 'Fraqueza', 'fraqueza deve dobrar o dano');
  afirma(Math.abs(r.resiste / r.base - .5) < .01 && r.notaRes === 'Resistiu', 'resistência deve cortar pela metade');
  afirma(r.imune === 0, 'imunidade zera o dano');
  afirma(Math.abs(r.meu / r.base - 1.25) < .01, 'dano da própria facção +25%');
  afirma(Math.abs(r.recebo / r.base - .75) < .01 && r.reduzido === true, 'dano recebido da própria facção −25% (e marcado para ficar vermelho)');
  afirma(r.comEspada === true && r.comCajado === false, 'arma preferida só vale para o tipo da classe');
  afirma(r.linhaMagoComoMago === '', 'a classe atual não mostra linha de bônus');
  afirma(/HP \+/.test(r.linhaGuerreiroComoMago), 'bônus é comparado com a classe atual: ' + r.linhaGuerreiroComoMago);
  console.log(JSON.stringify({ erros })); afirma(!erros.length, 'erros de página');
  await browser.close();
})();
