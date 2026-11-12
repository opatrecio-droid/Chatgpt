/* 6J-ui-adocao: v27 (B2) — as telas dos mascotes que procuram dono: o cartão do vagante (toque no bichinho na praça: espécie, raridade, o que dá, temperamento,
   quanto falta para escolher e quem é o favorito), a escolha manual do dono e o cartão "Carisma" da ficha do herói (de onde vem a nota que atrai os Dengosos).
   Reaproveita as classes do cartão de prédio (6H) e as peças dos cartões de mascote (61, via UI.petUI). */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const UI = G.UI, A = G.A, R = G.R, W = G.W, ic = UI.ic, esc = UI.esc, $ = UI.$, D = UI.dock, HOUR = G.DAY_SEC / 24;
  const P = () => UI.petUI;
  const num = (x) => String(Math.round(x * 10) / 10).replace('.', ',');

  /* ---------- ficha do herói: Carisma ---------- */
  UI.charmCard = (x, v) => {
    const parts = G.heroCharmParts(x), total = G.heroCharm(x), hs = G.S.heroes.slice().sort((a, b) => G.heroCharm(b) - G.heroCharm(a)), pos = hs.indexOf(x) + 1;
    let h = '<div class="sec">Carisma</div><div class="card"><div class="row"><div class="gr"><h3>Carisma <span class="lvl">' + (v ? v.T(() => G.heroCharm(x)) : total) + '</span></h3><p>É o que atrai os mascotes Dengosos: eles escolhem o herói mais cativante com vaga (os Valentes escolhem o mais forte). ' + esc(x.name) + ' é o ' + pos + 'º de ' + hs.length + '.</p></div></div>';
    for (const p of parts) h += '<div class="kv"><span>' + p.n + ' <small class="mut" style="font-weight:600">· ' + p.d + '</small></span><b>+' + num(p.v) + '</b></div>';
    return h + '</div>';
  };

  /* ---------- cartão do vagante ---------- */
  const facts = (p) => {
    const I = G.petStrayInfo(p), T = G.PET_TEMP[I.temp], U = P();
    let left;
    if (I.noHeroes) left = 'sem heróis na cidade';
    else if (I.due && I.noRoom) left = 'esperando uma vaga';
    else if (I.due) left = 'escolhendo agora';
    else left = 'cerca de ' + Math.max(1, Math.round(I.leftHours)) + ' h do reino (' + num(I.leftSec / G.DAY_SEC) + ' dia)';
    let fav;
    if (I.fav) fav = esc(I.fav.name) + ' <small>· ' + (I.temp === 'v' ? 'poder ' + G.fmt(G.arenaHeroPow(I.fav)) : 'carisma ' + G.heroCharm(I.fav)) + (I.favInTown ? ' · segue o favorito na cidade' : '') + '</small>';
    else fav = '<span class="mut">ninguém: ' + (I.noHeroes ? 'não há heróis' : 'todos já levam ' + G.PET_MAX + ' mascotes') + '</span>';
    return '<span class="lb">Dá</span><span class="nw" style="grid-column:2/4">' + U.bonusText(G.petBonus(p)) + '</span>' +
      '<span class="lb">Papel</span><span class="nw" style="grid-column:2/4;font-weight:700">' + U.roleLine(p) + '</span>' +
      '<span class="lb">Temperamento</span><span class="nw" style="grid-column:2/4">' + T.name + ' <small class="mut">· ' + T.short + '</small></span>' +
      '<span class="lb">Escolhe em</span><span class="nw" style="grid-column:2/4">' + left + '</span>' +
      '<span class="lb">Prefere agora</span><span class="nw" style="grid-column:2/4">' + fav + '</span>';
  };
  UI.petTap = (p) => {
    if (!p) return;
    if (D.kind === 'pet' && D.key === 'pet' + p.id) { D.close(); return; }
    const d = G.PETS[p.k], U = P(), I = G.petStrayInfo(p);
    G.sfx('click');
    const t = '<div class="bk"><div class="bk-h"><i class="th px" style="background-image:url(' + A.petURL(p.k) + ');background-size:contain;background-repeat:no-repeat;background-position:center;border-color:' + G.RAR_COLOR[p.rar] + '"></i><div class="gr"><h3>' + esc(d.name) + '</h3><div class="lv">' + U.rarTxt(p.rar) + '<span class="pill gold">procurando dono</span></div></div></div>' +
      '<p class="bk-d">' + esc(d.desc) + '</p><div class="bk-t" id="pt-facts" style="grid-template-columns:minmax(0,.9fr) minmax(0,1fr) minmax(0,1fr)">' + facts(p) + '</div>' +
      '<div class="bk-d" id="pt-why" style="margin:0 0 6px"></div></div>';
    const foot = '<div class="bk-up"><div class="row" style="gap:8px"><button class="btn pri sm" data-a="petown:' + p.id + '">' + ic('paw') + 'Escolher o dono</button><button class="btn sm" data-a="petrec:' + p.id + '">Recolher ao Viveiro</button></div></div>';
    D.open('pet', t, { key: 'pet' + p.id, foot });
    const why = () => { const el = $('#pt-why'); if (!el) return; const i = G.petStrayInfo(p); el.innerHTML = i.noRoom && !i.noHeroes ? '<span class="bad" style="font-weight:800">Sem vaga: todos os heróis já levam ' + G.PET_MAX + ' mascotes. O bichinho fica vagando até abrir uma vaga — ou escolha o dono e troque um mascote por ele.</span>' : '<span class="mut">Ele anda pela praça, fareja os heróis que estão na cidade e segue o favorito. Quando o tempo acaba, escolhe sozinho — sempre dá para escolher por ele.</span>'; };
    why();
    let last = facts(p);
    D.tick = () => { if (G.S.pets.indexOf(p) < 0 || p.hero || !p.out) { D.close(); return; } const f = facts(p); if (f !== last) { last = f; const el = $('#pt-facts'); if (el) el.innerHTML = f; why(); } };
    void I;
    /* mostra o bichinho na faixa livre acima do cartão */
    const r = G.petRt.get(p.id), card = D.el(), hud = $('#hud');
    if (r && card && hud) { const top = hud.getBoundingClientRect().bottom, bot = card.getBoundingClientRect().top, shift = innerHeight / 2 - (top + bot) / 2; const a = R.screenToWorld(0, 0), b = R.screenToWorld(0, 100); R.follow = 0; R.focus(r.x, r.y - 0.5 + shift * ((b[1] - a[1]) / 100)); }
  };

  /* ---------- escolher o dono à mão ---------- */
  UI.petOwnerModal = (p) => {
    const d = G.PETS[p.k], U = P();
    let h = '<div class="eyebrow">' + esc(d.name) + ' · ' + G.RAR[p.rar] + '</div><h2>Quem fica com ele?</h2><p class="lead" style="font-size:12.5px">Cada herói leva até ' + G.PET_MAX + ' mascotes. ' + U.roleLine(p) + '</p>';
    for (const x of G.S.heroes.slice().sort((a, b) => G.arenaHeroPow(b) - G.arenaHeroPow(a))) {
      const free = G.petSlots(x), cur = G.petsOf(x);
      h += '<button class="opt" data-a="petgive:' + p.id + ':' + x.id + '"' + (free > 0 ? '' : ' disabled') + '><b>' + esc(x.name) + ' <span class="mut" style="font-weight:700">Nv ' + x.lvl + ' · poder ' + G.fmt(G.arenaHeroPow(x)) + ' · carisma ' + G.heroCharm(x) + '</span></b><span>' + (free > 0 ? 'Leva ' + cur.length + ' de ' + G.PET_MAX + ' mascotes' + (cur.length ? ' (' + cur.map((q) => G.PETS[q.k].name).join(', ') + ')' : '') + ' — este seria o ' + (cur.length + 1) + 'º' : 'Já leva ' + G.PET_MAX + ' mascotes') + '</span></button>';
    }
    UI.modal(h + '<div class="acts"><button class="btn" data-a="mclose">Cancelar</button></div>', { pause: false });
  };
})();

;
