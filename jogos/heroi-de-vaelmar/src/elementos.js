/* ===== Elementos no equipamento (regras vistas em guias da comunidade; ver REGRAS-OBSERVADAS.md) =====
   - Peça de armadura (cabeça, tronco, pernas, secundária, acessório) com elemento: 50% de resistência àquele elemento.
     O elemento da arma NÃO protege.
   - Arma com elemento: vale para o ataque básico e para habilidades físicas sem etiqueta de elemento. Habilidade com elemento
     próprio ignora a arma; habilidade "física" (etiqueta Físico) continua física; feitiço sem elemento continua sem elemento.
   - Dano de um elemento tem uma chance pequena de causar o status daquele elemento (a arma também sorteia o dela, mesmo que
     a habilidade seja de outro elemento). A chance (5%) é suposição minha: o guia não dá o número.
   - Feitiço de vários elementos ("dano misto"): ver elementoDoGolpe. */
(() => {
  const EL = { Dragon: 'dragao', Arcane: 'arcano', Dark: 'sombrio', Water: 'agua', Fire: 'fogo', Earthen: 'terra', Lightning: 'raio', Holy: 'sagrado', Physical: 'fis' };
  const STATUS_ELEMENTO = { fogo: 'Burning', agua: 'Frozen', terra: 'Rot', raio: 'Paralyzed', dragao: 'Blight' };
  const CHANCE = .05;
  window.STATUS_ELEMENTO = STATUS_ELEMENTO;

  const elementosDe = it => {
    const row = it && Catalog.byKey[it.catalogKey], e = row && row.facts && row.facts.Element;
    return e ? String(e).split(/,\s*/).map(x => EL[x]).filter(Boolean) : [];
  };
  window.elementosDe = elementosDe;

  const heroBase = heroFighter;
  heroFighter = mode => {
    const f = heroBase(mode), set = setOfMode(mode);
    const arma = elementosDe(equippedIn(set, 'weapon')).find(e => e !== 'fis');
    f.weaponEl = arma || null;
    const res = new Set(f.eres || []);
    for (const sl of ['offhand', 'head', 'chest', 'legs', 'acc1', 'acc2']) for (const e of elementosDe(equippedIn(set, sl))) if (e !== 'fis') res.add(e);
    f.eres = [...res];
    return f;
  };

  /* elemento que um golpe realmente usa. Feitiço de vários elementos («dano misto»): causa dano extra a quem é fraco contra
     qualquer um deles; sem fraqueza, usa o primeiro que o alvo não resiste. */
  window.elementoDoGolpe = (a, o = {}, t = null) => {
    if (a && a.weaponEl && o.row && o.row.type === 'fis' && o.elem === 'neutro') return a.weaponEl;
    const misto = o.elem === 'neutro' && o.row ? elementosDe({ catalogKey: o.row.key }) : [];
    if (misto.length > 1 && t) {
      return misto.find(e => (t.weak || []).includes(e)) || misto.find(e => !(t.immune || []).includes(e) && !(t.eres || []).includes(e)) || misto[0];
    }
    return o.elem;
  };

  const hitBase = hitTarget;
  hitTarget = async (a, t, o = {}) => {
    const el = window.elementoDoGolpe(a, o, t);
    const r = await hitBase(a, t, el === o.elem ? o : Object.assign({}, o, { elem: el }));
    if (a && a.hero && r && !r.miss && r.d > 0 && t && t.hp > 0) {
      for (const e of new Set([r.el, a.weaponEl])) {
        const st = STATUS_ELEMENTO[e];
        if (st && Rules.applyEffect(t, st, CHANCE)) say(t.n + ': ' + Rules.effectDef(st).name + '!');
      }
    }
    return r;
  };
})();
