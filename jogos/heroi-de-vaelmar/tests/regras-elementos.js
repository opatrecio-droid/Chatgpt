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
    // feitiços arcanos ("híbrido dinâmico") usam o maior entre ataque e magia; híbridos comuns usam os dois juntos
    const forte = { atk: 2000, mag: 1000 }, alvo = { res: 1000 };
    const arcano = dmg(forte, alvo, { stat: 'max' }).d, soMagia = dmg(forte, alvo, { stat: 'mag' }).d;
    const tipos = [SKILLS.s_arcana.stat, SKILLS.s_arcanus.stat, SKILLS['s_arcanus-ii'].stat, SKILLS.s_verse.stat];
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
    // elementos no equipamento: arma com elemento, peça de armadura com elemento
    const comEl = (el, slot) => Catalog.data.items.find(i => i.slot === slot && i.facts?.Element === el), armaFogo = comEl('Fire', 'weapon'), peitoAgua = comEl('Water', 'chest'), armaAgua = comEl('Water', 'weapon');
    const lutador = (arma, peito) => { equippedIn = (set, sl) => sl === 'weapon' ? (arma && { catalogKey: arma.key }) : sl === 'chest' ? (peito && { catalogKey: peito.key }) : null; const f = heroFighter('map'); equippedIn = antes; return f; };
    const fA = lutador(armaFogo, peitoAgua), fB = lutador(armaAgua, null), fC = lutador(null, null);
    const golpe = { fisico: elementoDoGolpe({ weaponEl: 'fogo' }, { elem: 'neutro', row: { type: 'fis' } }), etiqueta: elementoDoGolpe({ weaponEl: 'fogo' }, { elem: 'fis', row: { type: 'fis' } }), feitico: elementoDoGolpe({ weaponEl: 'fogo' }, { elem: 'neutro', row: { type: 'mag' } }), proprio: elementoDoGolpe({ weaponEl: 'fogo' }, { elem: 'agua', row: { type: 'fis' } }), semArma: elementoDoGolpe({ weaponEl: null }, { elem: 'neutro', row: { type: 'fis' } }) };
    const armadura = { armaFogo: !!armaFogo, peitoAgua: !!peitoAgua, weaponEl: fA.weaponEl, eresA: fA.eres, weaponElB: fB.weaponEl, eresB: fB.eres, semNada: [fC.weaponEl, fC.eres.length] };
    return { armadura, golpe, status: STATUS_ELEMENTO, base, fraco: fraco.d, notaFraco: fraco.note, resiste: resiste.d, notaRes: resiste.note, imune: imune.d, meu, recebo: recebo.d, reduzido: recebo.reduced, comEspada, comCajado, arcano, soMagia, tipos, linhaMagoComoMago, linhaGuerreiroComoMago };
  });
  console.log(JSON.stringify(r));
  afirma(Math.abs(r.fraco / r.base - 2) < .01 && r.notaFraco === 'Fraqueza', 'fraqueza deve dobrar o dano');
  afirma(Math.abs(r.resiste / r.base - .5) < .01 && r.notaRes === 'Resistiu', 'resistência deve cortar pela metade');
  afirma(r.imune === 0, 'imunidade zera o dano');
  afirma(Math.abs(r.meu / r.base - 1.25) < .01, 'dano da própria facção +25%');
  afirma(Math.abs(r.recebo / r.base - .75) < .01 && r.reduzido === true, 'dano recebido da própria facção −25% (e marcado para ficar vermelho)');
  afirma(r.armadura.armaFogo && r.armadura.peitoAgua, 'o catálogo deve ter arma de fogo e peitoral de água');
  afirma(r.armadura.weaponEl === 'fogo' && r.armadura.eresA.includes('agua') && !r.armadura.eresA.includes('fogo'), 'armadura de água resiste a água; arma de fogo não protege contra fogo: ' + JSON.stringify(r.armadura));
  afirma(r.armadura.weaponElB === 'agua' && !r.armadura.eresB.includes('agua'), 'elemento da arma não protege: ' + JSON.stringify(r.armadura));
  afirma(r.armadura.semNada[0] === null && r.armadura.semNada[1] === 0, 'sem equipamento elemental não há elemento nem resistência');
  afirma(r.golpe.fisico === 'fogo' && r.golpe.etiqueta === 'fis' && r.golpe.feitico === 'neutro' && r.golpe.proprio === 'agua' && r.golpe.semArma === 'neutro', 'elemento do golpe: ' + JSON.stringify(r.golpe));
  afirma(r.status.fogo === 'Burning' && r.status.agua === 'Frozen' && r.status.terra === 'Rot' && r.status.raio === 'Paralyzed' && r.status.dragao === 'Blight', 'status por elemento');
  afirma(r.arcano > r.soMagia * 2.5, 'arcano usa o maior atributo: ' + r.arcano + ' vs ' + r.soMagia);
  afirma(r.tipos.join() === 'max,max,mag,both', 'tipos de feitiço: ' + r.tipos);
  afirma(r.comEspada === true && r.comCajado === false, 'arma preferida só vale para o tipo da classe');
  afirma(r.linhaMagoComoMago === '', 'a classe atual não mostra linha de bônus');
  afirma(/HP \+/.test(r.linhaGuerreiroComoMago), 'bônus é comparado com a classe atual: ' + r.linhaGuerreiroComoMago);
  // golpe de verdade: herói com arma de fogo bate num alvo e o status do elemento pode pegar
  const real = await page.evaluate(async () => {
    const antes = equippedIn, arma = Catalog.data.items.find(i => i.slot === 'weapon' && i.facts?.Element === 'Fire').key;
    equippedIn = (set, sl) => sl === 'weapon' ? { catalogKey: arma } : null;
    const h = heroFighter('map'); h.crit = 0; h.acc = 1e6;
    const alvo = makeFoe('rat', 3); alvo.hp = alvo.maxhp = 1e9; alvo.def = 0;
    const antesRand = Math.random; Math.random = () => 0;   // chance sempre sorteada
    window.__b = battle({ foes: [alvo], bio: 'grass' });
    await new Promise(r => setTimeout(r, 1500));
    const t = B.foes[0]; t.hp = t.maxhp = 1e9;
    const r = await hitTarget(h, t, { stat: 'atk', pow: 1, elem: 'neutro', row: { type: 'fis' }, neverMiss: true });
    Math.random = antesRand; equippedIn = antes;
    return { el: r.el, queimando: Object.values(t.effects || {}).map(e => e.name) };
  });
  console.log(JSON.stringify(real));
  afirma(real.el === 'fogo', 'golpe físico sem etiqueta usa o elemento da arma: ' + JSON.stringify(real));
  afirma(real.queimando.includes('Burning'), 'dano de fogo pode queimar o alvo: ' + JSON.stringify(real));
  console.log(JSON.stringify({ erros })); afirma(!erros.length, 'erros de página');
  await browser.close();
})();
