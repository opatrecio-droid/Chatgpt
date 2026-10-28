// Frascos de Mana e de Sangue em combate: capacidade pela classe, carga por feitiço elemental (fraqueza e dois elementos
// carregam mais rápido), menu «Frascos», os feitiços de frasco, as infusões, o turno extra e salvar/retomar.
const fs = require('fs'), path = require('path');
const { abrir, foto, RAIZ } = require('./lib');
const afirma = (ok, msg) => { if (!ok) { console.log('FALHOU:', msg); process.exitCode = 1; } };
(async () => {
  const saida = path.join(RAIZ, 'tests', 'saida'); fs.mkdirSync(saida, { recursive: true });
  const { browser, page, erros } = await abrir({});

  // ----- capacidade e carga (Mago da Corte, tier 3: Manaflasks II) -----
  const a = await page.evaluate(async () => {
    S.cls = 'c_86'; S.lvl = 60;
    window.__b = battle({ foes: [makeFoe('rat', 4), makeFoe('rat', 4)], bio: 'grass' });
    await new Promise(r => setTimeout(r, 1500));
    for (const f of B.foes) { f.hp = f.maxhp = 1e9; f.def = f.res = 0; f.weak = []; f.eres = []; f.immune = []; }
    const h = B.hero; h.mp = h.maxmp = 99999;
    const F = frascosEstado(), ini = { capM: F.capM, capB: F.capB, m: F.m };
    const feitico = Object.values(SKILLS).find(s => s.row && s.row.type === 'mag' && s.row.element === 'fogo' && s.row.power && !s.row.all && !(s.castTurns > 1) && !(s.row.causes || []).length);
    const misto = SKILLS['s_heat-lightning'];
    const fisica = Object.values(SKILLS).find(s => s.row && s.row.type === 'fis' && s.row.element === 'fogo' && s.row.power && !(s.castTurns > 1));
    const solta = async (s, t) => { const antes = F.m; await doHeroAct({ k: 'skill', s, t }); return Math.round((F.m - antes) * 100) / 100; };
    const alvo = B.foes[0];
    const normal = await solta(feitico, alvo);
    alvo.weak = ['fogo']; const fraco = await solta(feitico, alvo); alvo.weak = [];
    const dois = await solta(misto, alvo);
    const fis = fisica ? await solta(fisica, alvo) : null;
    return { ini, normal, fraco, dois, fis, nome: feitico.n, tem: !!misto, botao: window.Frascos.ativos(), resumo: window.Frascos.resumo() };
  });
  console.log(JSON.stringify(a));
  afirma(a.ini.capM === 2 && a.ini.capB === 0 && a.ini.m === 0, 'Mago da Corte: 2 frascos de mana, começa vazio: ' + JSON.stringify(a.ini));
  afirma(a.normal === .25, 'feitiço elemental carrega um quarto: ' + a.normal);
  afirma(a.fraco === .5, 'fraqueza carrega o dobro: ' + a.fraco);
  afirma(a.dois === .5, 'feitiço de dois elementos carrega o dobro: ' + a.dois);
  afirma(a.fis === null || a.fis === 0, 'habilidade física não carrega: ' + a.fis);
  afirma(a.botao && /Mana/.test(a.resumo), 'botão de frascos aparece no tier 3: ' + a.resumo);

  // ----- menu: botão «Frascos» e lista -----
  await page.waitForTimeout(300);
  const temBotao = await page.locator('#cmds .bt-cmd', { hasText: /frascos/i }).count();
  afirma(temBotao === 1, 'o menu de batalha tem o botão Frascos');
  await foto(page, path.join(saida, 'frascos-1-menu.png'));
  await page.locator('#cmds .bt-cmd', { hasText: /frascos/i }).first().tap(); await page.waitForTimeout(500);
  await foto(page, path.join(saida, 'frascos-2-lista.png'));
  const lista = await page.locator('#cmds .bt-cmd').allTextContents();
  console.log(JSON.stringify(lista));
  afirma(lista.some(t => /Raio de Mana/i.test(t)) && lista.some(t => /Voltar/i.test(t)), 'a lista traz os feitiços de frasco do tier: ' + lista);
  await page.locator('#cmds .back').first().tap(); await page.waitForTimeout(300);

  // ----- feitiços de frasco (Ominimante, tier 9: 2 de mana e 2 de sangue) -----
  const b = await page.evaluate(async () => {
    const out = {};
    B.frascos = null; S.cls = 'c_52'; B.frascos = undefined;
    const F = frascosEstado(); const h = B.hero; h.mp = h.maxmp = 99999;
    out.ini = { capM: F.capM, capB: F.capB, m: F.m, b: F.b };
    const [x, y] = B.foes; for (const f of B.foes) { f.hp = f.maxhp = 1e9; f.effects = {}; }
    const dano = async (id, t) => { const hp = t.hp; const r = await doHeroAct({ k: 'flask', id, t }); return { r, d: hp - t.hp }; };
    // sem frasco cheio: recusa
    out.vazio = (await dano('s_mana-ray-flask', x)).r;
    // raio de mana: gasta 1
    F.m = 2; F.b = 2; const r1 = await dano('s_mana-ray-flask', x); out.raio = { d: r1.d > 0, m: F.m };
    // raio de sangue: gasta 1 de sangue
    const r2 = await dano('s_blood-ray-flask', x); out.sangue = { d: r2.d > 0, b: F.b };
    // aumento de mana: gasta todos os cheios, atinge todos, dá turno extra
    F.m = 2; B.extraTurn = false; const hx = x.hp, hy = y.hp; await doHeroAct({ k: 'flask', id: 's_mana-surge-flask', t: x });
    out.surto = { m: F.m, ambos: x.hp < hx && y.hp < hy, extra: B.extraTurn }; B.extraTurn = false;
    // tempestade: um status por oponente afetado (a carga manda)
    F.m = 2; x.effects = {}; y.effects = {}; await doHeroAct({ k: 'flask', id: 's_elemental-stormflask', t: x });
    out.tempestade = { m: F.m, afetados: [x, y].filter(f => Object.keys(f.effects).length).length };
    F.m = 1; x.effects = {}; y.effects = {}; await doHeroAct({ k: 'flask', id: 's_elemental-stormflask', t: x });
    out.tempestade1 = [x, y].filter(f => Object.keys(f.effects).length).length;
    // inflexão
    F.m = 2; h.effects = {}; await doHeroAct({ k: 'flask', id: 's_inflection-flask', t: null });
    out.inflexao = Object.values(h.effects).map(e => e.name);
    // repetição
    F.m = 1; B.ultimo = null; out.repetirNada = await doHeroAct({ k: 'flask', id: 's_repetition-flask', t: x }); out.repetirMantem = F.m;
    const fogo = Object.values(SKILLS).find(s => s.row && s.row.type === 'mag' && s.row.element === 'fogo' && s.row.power && !s.row.all && !(s.castTurns > 1));
    await doHeroAct({ k: 'skill', s: fogo, t: x }); const hp = x.hp; F.m = 1; await doHeroAct({ k: 'flask', id: 's_repetition-flask', t: x });
    out.repetiu = x.hp < hp;
    // chamado da natureza
    F.m = 1; B.summons = []; await doHeroAct({ k: 'flask', id: 's_nature-call-flask', t: null }); out.animais = B.summons.length;
    // necromancia gasta o sangue e levanta esqueletos
    B.summons = []; F.b = 2; await doHeroAct({ k: 'flask', id: 's_nekromancer-flask', t: null }); out.esqueletos = B.summons.length; out.sangueDepois = F.b;
    // banimento: sem invocação inimiga recusa
    F.b = 2; out.banirNada = await doHeroAct({ k: 'flask', id: 's_banishment-flask', t: x }); out.sangueBanir = F.b;
    // Omniflask: com frasco extra e sangue cheio causa mais dano
    const dEsq = async (m, b) => { F.m = m; F.b = b; const hp0 = x.hp; Math.random = () => .5; await doHeroAct({ k: 'flask', id: 's_omniflask', t: x }); return hp0 - x.hp; };
    const rnd = Math.random; const d1 = await dEsq(1, 0), d3 = await dEsq(2, 1); Math.random = rnd;
    out.omni = { d1, d3, mais: d3 > d1 * 1.3 }; out.omniGasto = F.m + F.b;
    return out;
  });
  console.log(JSON.stringify(b));
  afirma(b.ini.capM === 2 && b.ini.capB === 2 && b.ini.m === .5 && b.ini.b === .5, 'Ominimante: 2+2 frascos e meio de cada no começo: ' + JSON.stringify(b.ini));
  afirma(b.vazio === 'retry', 'sem frasco cheio não libera: ' + b.vazio);
  afirma(b.raio.d && b.raio.m === 1, 'raio de mana gasta 1 frasco: ' + JSON.stringify(b.raio));
  afirma(b.sangue.d && b.sangue.b === 1, 'raio de sangue gasta 1 frasco de sangue: ' + JSON.stringify(b.sangue));
  afirma(b.surto.m === 0 && b.surto.ambos && b.surto.extra, 'aumento de mana: todos os cheios, todos os oponentes, turno extra: ' + JSON.stringify(b.surto));
  afirma(b.tempestade.m === 0 && b.tempestade.afetados === 2 && b.tempestade1 === 1, 'tempestade elemental: nº de alvos = frascos cheios: ' + JSON.stringify([b.tempestade, b.tempestade1]));
  afirma(b.inflexao.length === 2, 'inflexão: Def e Res em alta: ' + b.inflexao);
  afirma(b.repetirNada === 'retry' && b.repetirMantem === 1, 'repetição sem feitiço anterior recusa e não gasta: ' + [b.repetirNada, b.repetirMantem]);
  afirma(b.repetiu, 'repetição repete o último feitiço');
  afirma(b.animais === 2, 'chamado da natureza invoca animais: ' + b.animais);
  afirma(b.esqueletos === 2 && b.sangueDepois === 0, 'necromancia: esqueletos conforme o sangue: ' + [b.esqueletos, b.sangueDepois]);
  afirma(b.banirNada === 'retry' && b.sangueBanir === 2, 'banimento sem invocação não gasta: ' + [b.banirNada, b.sangueBanir]);
  afirma(b.omni.mais && b.omniGasto === 0, 'Omniflask gasta frasco extra e sangue e dá mais dano: ' + JSON.stringify([b.omni, b.omniGasto]));

  // ----- infusões e retomada -----
  const c = await page.evaluate(async () => {
    const out = {}; const F = frascosEstado(), h = B.hero; h.mp = h.maxmp = 99999;
    F.capM = 2; F.capB = 2; F.m = 1.5; F.b = .5;
    await performSkill(h, SKILLS['s_bloodflask-infusion'], null); out.paraSangue = { capM: F.capM, capB: F.capB, m: F.m, b: F.b };
    await performSkill(h, SKILLS['s_manaflask-infusion'], null); out.paraMana = { capM: F.capM, capB: F.capB, m: F.m, b: F.b };
    F.m = 0; F.b = 0; F.capM = 2; F.capB = 2; h.ward = h.maxWard = 400;
    await performSkill(h, SKILLS['s_ward-flask-infusion'], null); out.guarda = { m: F.m, b: F.b, ward: h.ward };
    const cap = BattleState.capture(B); out.salvo = cap.frascos && cap.frascos.capM;
    const b2 = { }; BattleState.restore.length; out.apto = typeof BattleState.restore === 'function';
    // Avidez: com 100% a ação seguinte dá turno extra
    const f0 = passiveValue; passiveValue = t => t === 'Avidity Chance' ? 100 : f0(t); B.extraTurn = false;
    await doHeroAct({ k: 'guard' }); passiveValue = f0; out.avidez = B.extraTurn;
    return out;
  });
  console.log(JSON.stringify(c));
  afirma(c.paraSangue.capM === 0 && c.paraSangue.capB === 4 && c.paraSangue.b === 2, 'infusão de sangue: mana vira sangue, quantia mantida: ' + JSON.stringify(c.paraSangue));
  afirma(c.paraMana.capB === 0 && c.paraMana.capM === 4 && c.paraMana.m === 2, 'infusão de mana: sangue vira mana: ' + JSON.stringify(c.paraMana));
  afirma(c.guarda.ward === 0 && c.guarda.m === 2 && c.guarda.b === 2, 'infusão de guarda carrega em ordem: ' + JSON.stringify(c.guarda));
  afirma(c.salvo === 4 || c.salvo === 2, 'a batalha salva os frascos');
  afirma(c.avidez === true, 'Avidez dá turno extra');

  // ----- classes sem frasco -----
  const d = await page.evaluate(() => { B.frascos = undefined; S.cls = 'guerreiro'; return { estado: frascosEstado(), botao: window.Frascos.ativos() }; });
  afirma(d.estado === null && d.botao === false, 'classe sem frascos não tem estado nem botão: ' + JSON.stringify(d));
  console.log(JSON.stringify({ erros })); afirma(!erros.length, 'erros de página');
  await browser.close();
})();
