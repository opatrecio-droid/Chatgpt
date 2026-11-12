/* 6A-ui-renascer: v25 — telas do Renascimento (lote 3-C): prévia e progresso na ficha do herói (a partir do Rank A), cartão de renascer,
   confirmação, a cerimônia (a maior do jogo, pela fila de janelas), o Altar do Renascimento (comprar, subir e esquecer traços, com custo e
   efeito antes de confirmar) e a lista de traços com nível. A simulação mora em 3E-renascer.js. */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const UI = G.UI, A = G.A, R = G.R, ic = UI.ic, esc = UI.esc, $ = UI.$;
  const RB = G.REB;

  /* ---------- estilo ---------- */
  const css = document.createElement('style');
  css.textContent = `
.rbp{position:relative;overflow:hidden;border-color:rgba(201,164,255,.5);background:rgba(138,90,232,.16)}
.rbp h3{font-family:var(--fh);letter-spacing:.04em;font-size:15px}
.rbp .row{align-items:center;gap:8px}
.rbp .pr{flex:none;font-size:15px;font-weight:800;color:#d0a8ff;font-variant-numeric:tabular-nums}
.rbp .bar{margin:8px 0 5px;height:7px}
.rbp .bar i{background:linear-gradient(#e2c8ff 0 28%,#8a5ae8 28% 100%)}
.rbp .nd{font-size:15px;color:var(--mut);line-height:1.35;margin:0 0 2px}
.rbp-t{font-size:8px;font-family:var(--fc);font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#d0a8ff;margin:9px 0 5px}
.rbp-g{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.rbp-g div{display:flex;align-items:center;gap:7px;min-height:40px;padding:5px 8px;background:var(--inset);font-size:15px;font-weight:700;line-height:1.25}
.rbp-g div .i{flex:none;font-size:16px;color:#d0a8ff}
.rbp-g div b{color:var(--gold2);font-weight:800}
.rbp .keep{font-size:15px;color:var(--mut);margin:8px 0 0;line-height:1.35}
.rbp.rdy{animation:glow 1.6s infinite}
.rbp .btn.wide{margin-top:10px}
.rb-tr{position:relative}
.rb-tr.rare{border:var(--u) solid rgba(201,164,255,.5);background:rgba(138,90,232,.18)}
.rb-tr b{display:flex;align-items:center;gap:6px}
.rb-tr b .i{flex:none;font-size:15px;color:#d0a8ff}
.rb-tr .rt{font-size:8px;font-family:var(--fc);font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:1px 6px;background:linear-gradient(#c9a4ff 0 28%,#8a5ae8 28% 100%);color:#14082a}
.rb-tr .lv{margin-left:auto;display:inline-flex!important;align-items:center;gap:4px;font-size:8px;font-family:var(--fc)!important;font-weight:800;color:var(--gold2)!important}
.lvp,.rb-tr .lvp{display:inline-flex!important;gap:2px;font-size:0}.lvp i{width:7px;height:7px;background:var(--fill2)}.lvp i.on{background:var(--gold2);box-shadow:none}
.rb-alt{margin-top:8px}
.rb-lim{font-size:15px;color:var(--mut);margin:2px 2px 6px}
/* Altar */
.al-top{display:flex;gap:8px;margin:8px 0 2px}
.al-top div{flex:1;text-align:center;padding:7px 6px;background:var(--inset);border:var(--u) solid var(--line2)}
.al-top small{display:block;font-size:8px;font-family:var(--fc);font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--mut)}
.al-top b{display:block;font-family:var(--fh);font-size:24px;line-height:1.1;color:var(--gold2)}
.al-top .p b{color:#e2c8ff;text-shadow:var(--u) var(--u) 0 var(--ol);}
.al-lead{font-size:15px;color:#cfd5e4;text-align:center;margin:8px 2px 2px;line-height:1.4}
.al-r{display:flex;align-items:center;gap:9px;width:100%;min-height:52px;padding:7px 9px;margin-bottom:5px;border:var(--u) solid var(--line2);background:var(--fill2);color:inherit;font:inherit;text-align:left;cursor:pointer}
.al-r .ti{flex:none;width:32px;height:32px;display:grid;place-items:center;font-size:16px;background:var(--fill2);color:var(--mut)}
.al-r.rare .ti{background:linear-gradient(#c9a4ff 0 28%,#8a5ae8 28% 100%);color:#14082a}
.al-r.own .ti{color:var(--gold2)}
.al-r .gr{flex:1;min-width:0}
.al-r b{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:15px;line-height:1.2}
.al-r b .rt{font-size:8px;font-family:var(--fc);font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:1px 5px;background:linear-gradient(#c9a4ff 0 28%,#8a5ae8 28% 100%);color:#14082a}
.al-r b .ng{font-size:8px;font-family:var(--fc);font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:1px 5px;background:rgba(255,120,120,.22);color:#ff9a9a}
.al-r span.ds{display:block;font-size:15px;color:var(--mut);line-height:1.3;margin-top:1px}
.al-r .cc{flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:58px;white-space:nowrap;padding:4px 6px;background:var(--inset);font-size:8px;font-family:var(--fc);font-weight:800;color:var(--mut);line-height:1.15;text-align:center}
.al-r .cc b{display:block;font-size:15px;color:#e2c8ff}
.al-r .cc.no b{color:#ff9a9a}
.al-r.sel{border-color:var(--gold2);background:rgba(226,182,89,.2);box-shadow:none}
.al-r.dis{opacity:.62}
.al-r.got{animation:algot 1.1s ease-out}
@keyframes algot{0%{box-shadow:0 0 0 0 rgba(255,235,160,.9);background:rgba(255,235,160,.3)}100%{box-shadow:0 0 0 14px rgba(255,235,160,0)}}
.al-c{margin-top:6px;border:var(--u) solid var(--line2);background:var(--inset);overflow:hidden}
.al-c summary{display:flex;align-items:center;gap:8px;min-height:44px;padding:8px 12px;cursor:pointer;list-style:none;font-family:var(--fh);font-size:15px;letter-spacing:.03em;color:var(--gold2)}
.al-c summary::-webkit-details-marker{display:none}
.al-c summary small{margin-left:auto;font-family:var(--fb);font-size:15px;font-weight:700;color:var(--mut);letter-spacing:0}
.al-c .nb{padding:2px 8px 4px}
#al-ft{position:sticky;bottom:-2px;margin:10px -4px -2px;padding:22px 6px 14px;background:var(--fill)}
#al-ft .hint{font-size:15px;color:var(--mut);text-align:center;margin:4px 0 8px;line-height:1.35}
#al-ft .fx{font-size:15px;line-height:1.4;color:#e8ecf8}
#al-ft .fx b{display:block;font-family:var(--fh);font-size:15px;color:var(--gold2);margin-bottom:3px}
#al-ft .fx em{font-style:normal;color:var(--mut)}
#al-ft .fx .nw{color:#9be08a;font-weight:800}
#al-ft .cs{display:flex;align-items:center;justify-content:space-between;margin:7px 0 0;font-size:15px;font-weight:800;color:var(--mut)}
#al-ft .cs b{color:#e2c8ff;font-size:15px}
#al-ft .why{margin:7px 0 0;font-size:15px;font-weight:700;color:#ff9a9a;line-height:1.35}
#al-ft .acts{margin-top:9px}
/* cerimônia */
#rbflash{background:rgba(236,222,255,.92);position:absolute;inset:0;z-index:72;pointer-events:none;opacity:0;}
#rbflash.on{animation:rbfl 1.9s ease-out}
@keyframes rbfl{0%{opacity:0}9%{opacity:1}26%{opacity:.9}100%{opacity:0}}
.mbox.rbbox{background:#1a1636;border-color:#d8b8ff;box-shadow:none}
.rbx{position:relative;text-align:center}
.rbx-stage{position:relative;height:176px;margin:-6px -6px 0;overflow:hidden;-webkit-mask-image:#000;mask-image:#000}
.rbx-rays{position:absolute;left:50%;top:50%;width:420px;height:420px;margin:-210px 0 0 -210px;background:repeating-conic-gradient(from 0deg,rgba(255,240,190,.55) 0 5deg,transparent 5deg 15deg);-webkit-mask-image:radial-gradient(circle,#000 0,transparent 62%);mask-image:radial-gradient(circle,#000 0,transparent 62%);opacity:0;animation:rbray 9s linear infinite,rbin .9s ease-out .5s forwards}
@keyframes rbray{to{transform:rotate(360deg)}}
@keyframes rbin{to{opacity:.9}}
.rbx-core{background:rgba(255,236,170,.85);position:absolute;left:50%;top:50%;width:150px;height:150px;margin:-75px 0 0 -75px;opacity:0;transform:scale(.2);animation:rbcore 1.2s cubic-bezier(.2,1.2,.4,1) .85s forwards}
@keyframes rbcore{to{opacity:1;transform:scale(1)}}
.rbx-moon{position:absolute;top:50%;width:54px;height:54px;margin-top:-27px;opacity:0}
.rbx-moon.l{background:#cfe0ff;left:-60px;box-shadow:none;animation:rbml 1.1s cubic-bezier(.5,0,.3,1) .1s forwards}
.rbx-moon.r{background:#ffd878;right:-60px;box-shadow:none;animation:rbmr 1.1s cubic-bezier(.5,0,.3,1) .1s forwards}
@keyframes rbml{0%{opacity:1;left:-60px}78%{opacity:1;left:calc(50% - 30px)}100%{opacity:0;left:calc(50% - 30px);transform:scale(2.6)}}
@keyframes rbmr{0%{opacity:1;right:-60px}78%{opacity:1;right:calc(50% - 30px)}100%{opacity:0;right:calc(50% - 30px);transform:scale(2.6)}}
.rbx-pt{position:absolute;left:50%;top:50%;width:76px;height:76px;margin:-38px 0 0 -38px;background-size:68px 68px;background-position:center;background-repeat:no-repeat;border:var(--u) solid #fff3c4;background-color:rgba(20,12,40,.7);box-shadow:none;opacity:0;transform:translateY(40px) scale(.7);animation:rbpt 1s cubic-bezier(.2,1.3,.4,1) 1s forwards}
@keyframes rbpt{to{opacity:1;transform:translateY(0) scale(1)}}
.rbx-bs{position:absolute;left:50%;top:50%;font-size:48px;line-height:1;color:#fff3c4;text-shadow:var(--u) var(--u) 0 var(--ol);margin:-72px 0 0 -23px;opacity:0;animation:rbbs 1s cubic-bezier(.2,1.6,.4,1) 1.6s forwards}
@keyframes rbbs{0%{opacity:0;transform:scale(.2) rotate(-40deg)}60%{opacity:1;transform:scale(1.4) rotate(8deg)}100%{opacity:1;transform:scale(1) rotate(0)}}
.rbx-p{position:absolute;left:50%;top:62%;width:var(--s);height:var(--s);margin:-2px;background:#ffe9a0;box-shadow:none;opacity:0;animation:rbp 2.2s ease-out var(--d) forwards}
@keyframes rbp{0%{opacity:0;transform:translate(var(--x0),0) scale(1)}15%{opacity:1}100%{opacity:0;transform:translate(var(--x1),var(--y1)) scale(.3)}}
.rbx .eyebrow{opacity:0;animation:rbfade .8s ease-out 1.1s forwards}
.rbx-h{font-family:var(--fh);opacity:0;animation:rbfade .8s ease-out 1.5s forwards}
@keyframes rbfade{to{opacity:1}}
.rbx-st{display:flex;justify-content:center;gap:5px;margin:4px 0 2px;font-size:24px;line-height:1;opacity:0;animation:rbfade .6s ease-out 1.9s forwards}
.rbx-st i{font-style:normal;color:rgba(255,255,255,.2)}
.rbx-st i.on{color:#ffd878;text-shadow:var(--u) var(--u) 0 var(--ol);}
.rbx-st i.nw{color:#fff3c4;text-shadow:var(--u) var(--u) 0 var(--ol);animation:rbnew 1.2s ease-in-out 2.2s infinite alternate}
@keyframes rbnew{from{transform:scale(1)}to{transform:scale(1.28)}}
.rbx-fl{font-size:15px;color:#d8dcf0;font-style:italic;margin:6px 8px 0;line-height:1.4;opacity:0;animation:rbfade .8s ease-out 2.2s forwards}
.rbx-body{opacity:0;max-height:0;overflow:hidden;animation:rbfade .9s ease-out 2.7s forwards,rbopen 1.1s ease-out 2.6s forwards}
@keyframes rbopen{to{max-height:640px}}
.rbx-cmp{display:flex;align-items:stretch;gap:6px;margin:12px 0 2px}
.rbx-col{flex:1;min-width:0;padding:8px 6px 7px;background:var(--inset);border:var(--u) solid var(--line2)}
.rbx-col.nw{border-color:#ffd878;background:rgba(255,216,120,.18);box-shadow:none}
.rbx-col small{display:block;font-size:8px;font-family:var(--fc);font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--mut)}
.rbx-col.nw small{color:var(--gold2)}
.rbx-col .pt{display:block;width:44px;height:44px;margin:5px auto 3px;border:var(--u) solid var(--rk);background-size:38px 38px;background-position:center;background-repeat:no-repeat;background-color:var(--inset)}
.rbx-col.old .pt{filter:grayscale(.55) brightness(.85)}
.rbx-col.nw .pt{box-shadow:none}
.rbx-col b{display:block;font-size:15px;line-height:1.25}
.rbx-col span{display:block;font-size:15px;color:var(--mut);line-height:1.3}
.rbx-col span.g{color:var(--gold2);font-weight:800}
.rbx-ar{flex:none;align-self:center;font-size:20px;color:var(--gold2)}
.rbx-rw{display:flex;flex-wrap:wrap;justify-content:center;gap:5px;margin:10px 0 2px}
.rbx-rw .rc2{display:inline-flex;align-items:center;gap:5px;padding:5px 9px;background:rgba(138,90,232,.22);border:var(--u) solid rgba(201,164,255,.4);font-size:15px;font-weight:800;line-height:1.2}
.rbx-rw .rc2 .i{color:#d0a8ff}
.rbx-rw .rc2.big{background:linear-gradient(#c9a4ff 0 28%,#8a5ae8 28% 100%);color:#14082a;border-color:#e6d0ff;font-size:15px}
.rbx-rw .rc2.big .i{color:#14082a}
.rbx-g{font-size:15px;color:#cfd5e4;margin:8px 4px 0;line-height:1.4}
.rbx .acts{position:sticky;bottom:-2px;margin:12px -4px -2px;padding:16px 6px 16px;background:var(--fill)}
@media (max-height:700px){.rbx-stage{height:116px}.rbx-pt{width:62px;height:62px;margin:-31px 0 0 -31px;background-size:54px 54px}.rbx-rays{width:320px;height:320px;margin:-160px 0 0 -160px}.rbx-core{width:110px;height:110px;margin:-55px 0 0 -55px}.rbx-bs{font-size:32px;margin:-58px 0 0 -17px}.rbx-fl{display:none}.rbx-cmp{margin-top:8px}.rbx-col .pt{width:36px;height:36px;background-size:30px 30px;margin:3px auto 2px}.rbx-g{font-size:15px;margin-top:6px}.rbx-rw{margin-top:7px}.rbx-rw .rc2{padding:4px 8px;font-size:15px}}
@media (max-width:380px){.rbx-stage{height:160px}.rbx-col b{font-size:15px}}
@media (prefers-reduced-motion:reduce){.rbx *{animation-duration:.01s!important;animation-delay:0s!important}.rbx-rays{animation:none;opacity:.6}.rbx-body{max-height:none}}
`;
  document.head.appendChild(css);

  /* ---------- peças pequenas ---------- */
  const heroOf = (id) => G.S.heroes.find((x) => x.id === +id);
  const dirty = () => { if (UI.sheet) UI.sheetDirty(); };
  const ROM = ['I', 'II', 'III'];
  const stars = (n) => '★'.repeat(Math.min(6, n)) + (n > 6 ? '×' + n : '');
  const fx = (v) => '×' + String(Math.round(v * 100) / 100).replace('.', ',');
  const TIC = { corajoso: 'sword', medroso: 'run', guloso: 'meal', generoso: 'coin', ambicioso: 'up', preguicoso: 'zzz', notivago: 'moon', sortudo: 'spark', teimoso: 'shield', focado: 'target', impulsivo: 'bolt', robusto: 'shield', sociavel: 'people', cacador: 'skull', invocado: 'portal', imortal: 'heart', mao: 'coin', lince: 'eye', memoria: 'book', lunar: 'moon', eclipse: 'bolt' };
  const tIc = (id) => ic(TIC[id] || 'spark');
  const lvPips = (lv) => '<span class="lvp">' + [1, 2, 3].map((i) => '<i' + (i <= lv ? ' class="on"' : '') + '></i>').join('') + '</span>';
  const plural = (n, a, b) => n + ' ' + (n === 1 ? a : b);

  /* ---------- prévia e progresso (ficha, a partir do Rank A) ---------- */
  const chips = (x) => {
    const pv = G.rbPreview(x);
    return '<div class="rbp-t">Ao renascer</div><div class="rbp-g">' +
      '<div>' + ic('star') + '<span><b>★' + pv.stars + '</b> Estrela nova</span></div>' +
      '<div>' + ic('up') + '<span><b>+' + Math.round(pv.boost * 100) + '%</b> em tudo, para sempre</span></div>' +
      '<div>' + ic('spark') + '<span><b>' + pv.pts + '</b> Pontos de Renascimento</span></div>' +
      '<div>' + ic('crown') + '<span>' + (pv.rare ? 'Acesso a <b>traços raros</b>' : pv.newSlot ? '<b>+1</b> espaço de traço (' + pv.slots + ')' : 'Até <b>' + pv.slots + '</b> traços') + '</span></div></div>' +
      '<p class="keep">Volta ao nível 1, Rank E. Mantém equipamento, vocação, Artes e Despertar.</p>';
  };
  /* progresso até renascer: só enquanto não dá para renascer */
  UI.rebPrev = (x) => {
    if (G.canRebirth(x) || x.rank < RB.prevRank) return '';
    const V = UI.vw(), p = () => G.rbProgress(x), q = p();
    const need = [];
    if (q.lvlLeft) need.push(plural(q.lvlLeft, 'nível', 'níveis'));
    if (q.promoLeft) need.push(plural(q.promoLeft, 'promoção', 'promoções'));
    return '<div class="card rbp"><div class="row"><h3 class="gr">Renascimento</h3><span class="pr">' + V.T(() => 'Nv ' + x.lvl + ' / ' + RB.lvl) + '</span></div>' +
      '<div class="bar"><i ' + V.W(() => Math.round(100 * p().pct)) + '></i></div>' +
      '<p class="nd">' + (need.length ? 'Faltam ' + need.join(' e ') + ' · renasce no Rank ' + G.RANKS[RB.rank] + ', nível ' + RB.lvl + '.' : 'Falta só o último passo.') + '</p>' + chips(x) + '</div>';
  };
  /* cartão quando já dá para renascer */
  UI.rebCard = (x) => '<div class="card rbp rdy"><div class="row"><h3 class="gr">Renascimento</h3><span class="pill gold">' + ic('check') + 'Pronto</span></div>' +
    '<p class="nd" style="margin-top:6px"><b style="color:var(--gold2)">' + esc(x.name) + '</b> chegou ao topo. É hora de recomeçar mais forte.</p>' + chips(x) +
    '<button class="btn vio wide" data-a="rbask:' + x.id + '">' + ic('star') + 'Renascer sob as Duas Luas</button></div>';

  /* ---------- lista de traços da ficha, com nível e atalho para o Altar ---------- */
  UI.rebTraits = (x) => {
    const reb = x.stars > 0, r = reb ? G.rb(x) : null;
    let h = reb ? '<div class="rb-lim">Traços ' + x.traits.length + ' / ' + G.rbSlots(x) + ' · cada nível aumenta o efeito do traço</div>' : '';
    for (const t of x.traits) {
      const d = G.TRAITS[t], lv = G.traitLv(x, t);
      h += '<div class="trait rb-tr' + (d.rare ? ' rare' : '') + '"><b>' + (d.rare ? tIc(t) : '') + esc(d.name) + (d.rare ? ' <i class="rt">Raro</i>' : '') + (reb && G.traitLevelable(t) ? '<span class="lv">' + lvPips(lv) + ROM[lv - 1] + '</span>' : '') + '</b><span>' + esc(G.traitText(t, lv)) + '</span></div>';
    }
    if (reb) h += '<button class="btn vio wide rb-alt" data-a="altar:' + x.id + '">' + ic('spark') + 'Altar do Renascimento' + (r.p ? ' · ' + plural(r.p, 'ponto', 'pontos') : '') + '</button>';
    else if (x.rank >= RB.prevRank) h += '<p class="mut" style="font-size:15px;margin:6px 2px 0">Quem renasce ganha Pontos de Renascimento para aprender traços raros e subir o nível dos traços, no Altar.</p>';
    return h;
  };

  /* ---------- confirmação ---------- */
  UI.ACT.rbask = (a) => {
    const x = heroOf(a[0]); if (!x || !G.canRebirth(x)) return;
    UI.modal('<div class="eyebrow">Sob as Duas Luas</div><h2>Renascer ' + esc(x.name) + '?</h2><p class="lead" style="margin-bottom:4px">' + esc(x.name) + ' volta ao nível 1 e ao Rank E, e fica mais forte para sempre.</p>' + '<div class="rbp" style="border:0;background:none;padding:0">' + chips(x) + '</div>' +
      '<div class="acts"><button class="btn" data-a="mclose">Ainda não</button><button class="btn vio" data-a="rbgo:' + x.id + '">' + ic('star') + 'Renascer</button></div>');
  };
  UI.ACT.rebirth = UI.ACT.rbask;       // o antigo botão de renascer agora passa pela confirmação com a prévia
  UI.ACT.rbgo = (a) => {
    const x = heroOf(a[0]); UI.closeModal();
    if (x && G.rebirth(x)) dirty();
  };

  /* ================= a cerimônia ================= */
  const FLV = [
    'As Duas Luas se alinharam e o velho caminho se abriu de novo, mais largo do que antes.',
    'Pela segunda vez, a luz o chamou de volta. Desta vez, ele já conhece o caminho.',
    'Quem renasce três vezes deixa de ser herói: vira história que insiste em recomeçar.',
    'Nem o tempo sabe mais contar quantas vezes ele voltou. Aurora sabe, e agradece.',
  ];
  let Q = [], cur = null;
  const flash = () => { let f = $('#rbflash'); if (!f) { f = document.createElement('div'); f.id = 'rbflash'; ($('#app') || document.body).appendChild(f); } f.className = ''; void f.offsetWidth; f.className = 'on'; };
  const showCeremony = (d) => {
    const x = d.h; if (!x || !G.S.heroes.includes(x)) return false;
    cur = d;
    const col = (r) => G.RANK_COLOR[r] || '#fff', url = UI.portrait(x), n = d.to.stars;
    const parts = [];
    for (let i = 0; i < 26; i++) { const a = Math.random(), x0 = Math.round((a - 0.5) * 110), x1 = Math.round((a - 0.5) * 300 + (Math.random() - 0.5) * 80); parts.push('<i class="rbx-p" style="--x0:' + x0 + 'px;--x1:' + x1 + 'px;--y1:' + (-70 - Math.round(Math.random() * 110)) + 'px;--s:' + (3 + Math.floor(Math.random() * 4)) + 'px;--d:' + (1 + Math.random() * 1.8).toFixed(2) + 's"></i>'); }
    const rw = [];
    rw.push('<span class="rc2 big">' + ic('spark') + '+' + d.pts + ' Pontos de Renascimento</span>');
    rw.push('<span class="rc2">' + ic('up') + '+' + Math.round(RB.boost * 100) + '% em tudo, para sempre</span>');
    if (d.first) rw.push('<span class="rc2">' + ic('crown') + 'Traços raros liberados</span>');
    else if (d.newSlot) rw.push('<span class="rc2">' + ic('crown') + '+1 espaço de traço (' + d.slots + ')</span>');
    rw.push('<span class="rc2">' + ic('book') + '+15 pontos de Arte</span>');
    if (d.first && G.titleDef && G.titleDef('renascido')) rw.push('<span class="rc2">' + ic('trophy') + 'Título: Renascido</span>');
    const ach = G.ACH.find((q) => q.stat === 'rebirths'), rn = G.S.stats.rebirths;
    if (ach && ach.tiers.indexOf(rn) >= 0) rw.push('<span class="rc2">' + ic('trophy') + 'Conquista: ' + esc(ach.name) + ' ' + ROM[Math.min(2, ach.tiers.indexOf(rn))] + '</span>');
    const gain = Math.round((d.to.mult / d.from.mult - 1) * 100);
    UI.modal('<div class="rbx"><div class="rbx-stage"><i class="rbx-rays"></i><i class="rbx-core"></i><i class="rbx-moon l"></i><i class="rbx-moon r"></i>' + parts.join('') + '<i class="rbx-pt px" style="background-image:url(' + url + ')"></i><b class="rbx-bs">★</b></div>' +
      '<div class="eyebrow">Sob as Duas Luas</div><h2 class="rbx-h">' + esc(x.name) + ' renasceu</h2>' +
      '<div class="rbx-st">' + Array.from({ length: Math.min(6, n) }, (_, i) => '<i class="' + (i === n - 1 ? 'nw' : 'on') + '">★</i>').join('') + (n > 6 ? '<i class="on" style="font-size:15px;align-self:center">×' + n + '</i>' : '') + '</div>' +
      '<p class="rbx-fl">' + esc(FLV[Math.min(n, FLV.length) - 1]) + '</p>' +
      '<div class="rbx-body"><div class="rbx-cmp">' +
      '<div class="rbx-col old" style="--rk:' + col(d.from.rank) + '"><small>Antes</small><i class="pt px" style="background-image:url(' + url + ')"></i><b>Nv ' + d.from.lvl + ' · Rank ' + G.RANKS[d.from.rank] + '</b><span>' + stars(d.from.stars || 0) + (d.from.stars ? ' · ' : '') + 'atributos ' + fx(d.from.mult) + '</span></div>' +
      '<div class="rbx-ar">' + ic('up').replace('class="i"', 'class="i" style="transform:rotate(90deg)"') + '</div>' +
      '<div class="rbx-col nw" style="--rk:' + col(d.to.rank) + '"><small>Depois</small><i class="pt px" style="background-image:url(' + url + ')"></i><b>Nv ' + d.to.lvl + ' · Rank ' + G.RANKS[d.to.rank] + '</b><span class="g">' + stars(n) + ' · atributos ' + fx(d.to.mult) + '</span></div></div>' +
      '<div class="rbx-rw">' + rw.join('') + '</div>' +
      '<p class="rbx-g">Ao voltar ao topo, ' + esc(x.name) + ' será <b style="color:var(--gold2)">' + gain + '% mais forte</b> do que acabou de ser' + (Q.length ? ' · +' + Q.length + ' na fila' : '') + '.</p>' +
      '<div class="acts"><button class="btn" data-a="rbx:close">Depois</button><button class="btn vio" data-a="rbx:altar:' + x.id + '">' + ic('spark') + 'Abrir o Altar</button></div></div></div>',
    { pause: false, lock: true, onClose: () => { cur = null; setTimeout(pump, 450); } });
    const box = $('#modal .mbox'); if (box) box.classList.add('rbbox');
    flash(); R.shake = Math.max(R.shake || 0, 9);
    G.sfx('renascer');
    setTimeout(() => { if (cur === d) { G.sfx('rare'); R.shake = Math.max(R.shake || 0, 5); } }, 1700);
    return true;
  };
  const pump = () => {
    if (cur) { if ($('#modal .rbx')) return; Q.unshift(cur); cur = null; }
    if (Q.length) UI.queueModal(4.5, () => { if (!Q.length || !G.M.running) return false; return showCeremony(Q.shift()); }, 'renascer');
  };
  UI.ACT.rbx = (a) => { const k = a[0], id = a[1]; UI.closeModal(); if (k === 'altar' && id) setTimeout(() => openAltar(+id), 200); };
  G.on('rebirth', (d) => { Q.push(d); setTimeout(pump, 150); dirty(); });
  G.on('start', () => { Q = []; cur = null; });
  const rfC = UI.refresh; UI.refresh = () => { rfC(); pump(); };
  UI.rebirthTest = (x, o) => {   // para testes e capturas: mostra a cerimônia sem renascer de verdade
    const n = (x.stars || 0) + 1, pv = G.rbPreview(x);
    Q.push(Object.assign({ h: x, pts: RB.pts + n, first: !(x.stars > 0), from: { stars: x.stars || 0, lvl: Math.max(x.lvl, RB.lvl), rank: Math.max(x.rank, RB.rank), mult: 1 + RB.boost * (x.stars || 0) }, to: { stars: n, lvl: 1, rank: 0, mult: pv.mult }, slots: pv.slots, newSlot: pv.newSlot }, o || {})); pump();
  };

  /* ================= o Altar do Renascimento ================= */
  let al = null;       // { id, sel: { op, id } | null, got: id da última compra }
  const rowOp = (x, t) => {
    const d = G.TRAITS[t];
    if (d.neg) return 'forget';
    return G.traitLevelable(t) && G.traitLv(x, t) < 3 ? 'up' : '';
  };
  const row = (x, t, op, owned) => {
    const d = G.TRAITS[t], lv = owned ? G.traitLv(x, t) : 1, c = op ? G.rbCheck(x, op, t) : null;
    const sel = al.sel && al.sel.id === t && al.sel.op === op;
    let cc = '';
    if (op === 'up') cc = '<span class="cc' + (c.ok ? '' : ' no') + '">Subir a ' + ROM[lv] + '<b>' + c.cost + '</b></span>';
    else if (op === 'forget') cc = '<span class="cc' + (c.ok ? '' : ' no') + '">Esquecer<b>' + c.cost + '</b></span>';
    else if (op === 'buy') cc = '<span class="cc' + (c.ok ? '' : ' no') + '">Aprender<b>' + c.cost + '</b></span>';
    else if (owned) cc = '<span class="cc">' + (G.traitLevelable(t) ? 'Nível<b>máx.</b>' : 'Fixo') + '</span>';
    const tag = (d.rare ? '<i class="rt">Raro</i>' : '') + (d.neg ? '<i class="ng">Negativo</i>' : '') + (owned && G.traitLevelable(t) ? lvPips(lv) : '');
    return '<button class="al-r' + (d.rare ? ' rare' : '') + (owned ? ' own' : '') + (sel ? ' sel' : '') + (c && !c.ok ? ' dis' : '') + (al.got === t ? ' got' : '') + '" data-a="' + (op ? 'alsel:' + op + ':' + t : 'alsel') + '" data-k="' + (op || '') + ':' + t + '"><span class="ti">' + tIc(t) + '</span><span class="gr"><b>' + esc(d.name) + tag + '</b><span class="ds">' + esc(G.traitText(t, owned ? lv : 1)) + '</span></span>' + cc + '</button>';
  };
  const footHtml = () => {
    const x = heroOf(al.id), r = G.rb(x), s = al.sel;
    if (!s) return '<p class="hint">Toque num traço para ver o efeito e o custo antes de confirmar.</p><div class="acts"><button class="btn" data-a="mclose">Fechar o Altar</button></div>';
    const d = G.TRAITS[s.id], c = G.rbCheck(x, s.op, s.id), lv = G.traitLv(x, s.id);
    let head = '', body = '';
    if (s.op === 'buy') { head = 'Aprender ' + esc(d.name); body = '<em>Efeito (nível I):</em> <span class="nw">' + esc(G.traitText(s.id, 1)) + '</span>'; }
    else if (s.op === 'up') { head = esc(d.name) + ' · ' + ROM[lv - 1] + ' → ' + ROM[lv]; body = '<em>Agora:</em> ' + esc(G.traitText(s.id, lv)) + '<br><em>Depois:</em> <span class="nw">' + esc(G.traitText(s.id, lv + 1)) + '</span>'; }
    else { head = 'Esquecer ' + esc(d.name); body = '<em>Perde:</em> ' + esc(G.traitText(s.id, 1)) + '<br><em>Libera o espaço para outro traço.</em>'; }
    return '<div class="fx"><b>' + head + '</b>' + body + '</div><div class="cs"><span>Custo</span><span><b>' + c.cost + '</b> de ' + r.p + (r.p === 1 ? ' ponto' : ' pontos') + '</span></div>' + (c.ok ? '' : '<p class="why">' + esc(c.why) + '</p>') +
      '<div class="acts"><button class="btn" data-a="alno">Voltar</button><button class="btn pri" data-a="alok"' + (c.ok ? '' : ' disabled') + '>' + ic('check') + 'Confirmar</button></div>';
  };
  const altarHtml = () => {
    const x = heroOf(al.id), r = G.rb(x), slots = G.rbSlots(x), off = G.rbOffers(x);
    let h = '<div class="eyebrow">Altar do Renascimento</div><h2>' + esc(x.name) + ' <span style="color:var(--gold)">' + stars(x.stars) + '</span></h2>' +
      '<div class="al-top"><div class="p"><small>Pontos</small><b>' + r.p + '</b></div><div><small>Traços</small><b>' + x.traits.length + ' / ' + slots + '</b></div></div>' +
      '<p class="al-lead">Cada ponto vale um passo: aprender um traço, subir o nível (I a III) ou deixar para trás um traço negativo.' + (x.stars % RB.slotStars === 1 ? ' Na próxima estrela, o herói ganha um espaço de traço.' : '') + '</p>' +
      '<div class="sec">Traços de ' + esc(x.name) + '</div>';
    for (const t of x.traits) h += row(x, t, rowOp(x, t), true);
    h += '<div class="sec">Traços raros <small class="mut" style="letter-spacing:0;text-transform:none;font-family:inherit">· só para renascidos</small></div>';
    h += off.rare.length ? off.rare.map((t) => row(x, t, 'buy', false)).join('') : '<p class="mut" style="font-size:15px">Todos os traços raros já são dele.</p>';
    h += '<details class="al-c"><summary>Traços comuns <small>' + off.comum.length + ' disponíveis</small></summary><div class="nb">' + (off.comum.length ? off.comum.map((t) => row(x, t, 'buy', false)).join('') : '<p class="mut" style="font-size:15px">Ele já conhece todos.</p>') + '</div></details>';
    return h + '<div id="al-ft">' + footHtml() + '</div>';
  };
  const renderAltar = (keep) => {
    const box = $('#modal .mbox'); if (!box) return;
    const st = box.scrollTop, open = (box.querySelector('.al-c') || {}).open;
    box.innerHTML = altarHtml();
    if (open) { const d = box.querySelector('.al-c'); if (d) d.open = true; }
    if (keep) box.scrollTop = st;
  };
  const syncSel = () => {
    const box = $('#modal .mbox'); if (!box || !al) return;
    box.querySelectorAll('.al-r').forEach((b) => b.classList.toggle('sel', !!al.sel && b.dataset.k === al.sel.op + ':' + al.sel.id));
    const ft = $('#al-ft'); if (ft) ft.innerHTML = footHtml();
  };
  const openAltar = (id) => {
    const x = heroOf(id); if (!x) return;
    if (!(x.stars > 0)) return UI.toast('O Altar abre para quem já renasceu.', 'info', 'star');
    G.rbSeen(x);
    al = { id: x.id, sel: null, got: null };
    UI.modal('<div class="al-box"></div>', { pause: true });
    const box = $('#modal .mbox'); if (box) { box.classList.add('rbbox'); box.innerHTML = altarHtml(); }
  };
  UI.altar = openAltar;
  UI.ACT.altar = (a) => openAltar(+a[0]);
  UI.ACT.alsel = (a) => {
    if (!al || !a[0]) return;
    const same = al.sel && al.sel.op === a[0] && al.sel.id === a[1];
    al.sel = same ? null : { op: a[0], id: a[1] };
    syncSel();
    G.sfx('click');
  };
  UI.ACT.alno = () => { if (al) { al.sel = null; syncSel(); } };
  UI.ACT.alok = () => {
    const x = al && heroOf(al.id), s = al && al.sel; if (!x || !s) return;
    const d = G.TRAITS[s.id], c = G.rbDo(x, s.op, s.id);
    if (!c.ok) return UI.toast(c.why, 'bad');
    al.sel = null; al.got = s.id;
    renderAltar(true);
    G.sfx(d.rare && s.op === 'buy' ? 'altar2' : 'altar');
    if (d.rare && s.op === 'buy') { R.shake = Math.max(R.shake || 0, 3); flash(); }
    UI.toast(s.op === 'buy' ? x.name + ' aprendeu ' + d.name + '.' : s.op === 'up' ? d.name + ' agora é nível ' + ROM[G.traitLv(x, s.id) - 1] + '.' : x.name + ' deixou ' + d.name + ' para trás.', 'good', 'spark');
    dirty();
  };
  /* herói dispensado com o Altar aberto: fecha */
  G.on('heroes', () => { if (al && UI.modalOpen && $('#al-ft') && !heroOf(al.id)) UI.closeModal(); });

  /* ---------- engates na lista de heróis ---------- */
  G.on('altar', dirty);

  /* ---------- sons ---------- */
  const AU = G.AU;
  if (AU && AU.SFX) {
    const S = AU.SFX, tone = AU.tone, seq = AU.seq, noise = AU.noise;
    S.renascer = (t) => {
      tone(55, t, 2.6, 'sine', 0.26, 110);
      [262, 330, 392, 523].forEach((f) => tone(f, t + 0.1, 2.4, 'triangle', 0.09));
      noise(t + 0.9, 1.0, 0.22, 700, 0.6, 'bandpass');
      seq([523, 659, 784, 1047, 1319, 1568, 2093, 2637], 0.14, 'triangle', 0.14, 0.8);
      tone(98, t + 1.1, 1.6, 'sawtooth', 0.1, 196);
      tone(4186, t + 1.5, 1.4, 'sine', 0.05);
    };
    S.altar = (t) => { tone(1047, t, 0.25, 'triangle', 0.14); tone(1568, t + 0.07, 0.4, 'sine', 0.12); tone(2093, t + 0.16, 0.5, 'sine', 0.08); };
    S.altar2 = (t) => { tone(131, t, 0.8, 'sine', 0.2, 98); seq([784, 988, 1319, 1568, 1976], 0.08, 'triangle', 0.13, 0.5); tone(3136, t + 0.4, 0.7, 'sine', 0.05); };
  }
})();

;
