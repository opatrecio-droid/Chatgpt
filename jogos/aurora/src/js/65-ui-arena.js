/* 65-ui-arena: v25 — telas da Arena das Duas Luas: aba em Missões, brasões, escolha de adversário e equipe, o duelo animado
   com cerimônia, ranking da temporada, Loja de Insígnias e o baú de fim de temporada. A simulação mora em 39-arena.js. */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const UI = G.UI, A = G.A, R = G.R, ic = UI.ic, esc = UI.esc, $ = UI.$;
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };

  /* ---------- estilo ---------- */
  const css = document.createElement('style');
  css.textContent = `
.arh{position:relative;overflow:hidden;border:var(--u) solid var(--line);margin-bottom:8px;background:#1b110c}
.arh svg.art{display:block;width:100%;height:128px}
.arh .ov{position:absolute;left:0;right:0;bottom:0;padding:26px 12px 10px;background:rgba(10,13,28,.94);display:flex;align-items:flex-end;gap:10px}
.arh .ov .emb{flex:none;}
.arh h3{font-family:var(--fh);font-size:16px;letter-spacing:.06em;color:var(--gold2);line-height:1.1}
.arh small{display:block;color:#c8d0e4;font-size:15px;font-weight:700;margin-top:2px}
.arlg{display:flex;align-items:center;gap:10px}
.lgb{display:inline-flex;align-items:center;gap:5px;height:24px;padding:0 10px 0 7px;font-weight:900;font-size:15px;color:#1b110c;background:var(--lc);box-shadow:none;white-space:nowrap}
.lgb 
.arpips{display:flex;gap:5px;align-items:center}
.arpips i{background:#e2b659;width:18px;height:18px;border:var(--u) solid rgba(226,182,89,.55);}
.arpips i.off{background:var(--fill2);border-color:rgba(255,255,255,.15)}
.arpips i.xt{background:#b98ff5;border-color:rgba(185,143,245,.8);}
.arseg{margin:8px 0}
.arof{position:relative;display:flex;gap:10px;align-items:center;padding:10px;border:var(--u) solid var(--line2);background:var(--fill2);margin-bottom:8px;width:100%;text-align:left}
.arof .emb{flex:none}
.arof .gr{flex:1;min-width:0}
.arof h4{font-size:15px;font-weight:800;line-height:1.2;margin:0}
.arof .sb{font-size:15px;color:var(--mut);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.arof .dif{display:inline-block;height:20px;line-height:20px;padding:0 8px;font-size:15px;font-weight:900;color:#1b110c;background:var(--dc)}
.arof .mini,.ar-tm .mini{display:flex;gap:3px;margin-top:6px}
.arof .mini i,.ar-tm .mini i{width:26px;height:26px;background-color:var(--inset);background-size:26px 26px;border:var(--u) solid var(--line2)}
.arof .rt{display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex:none}
.arof .rt .btn{min-height:34px}
.arof .rw{font-size:15px;color:var(--mut);font-weight:700;display:flex;gap:6px;align-items:center}
.arof .rw 
.ins-ic{display:inline-block;vertical-align:-2px;font-size:1em}
.ar-intro{font-size:15px;color:#cfd5e4;line-height:1.5}
.ar-intro b{color:var(--gold2)}
.ar-rk{display:flex;align-items:center;gap:8px;padding:6px 8px;margin-bottom:3px;background:var(--fill2);border-left:calc(var(--u)*2) solid var(--lc);width:100%;text-align:left}
.ar-rk .ps{width:26px;text-align:center;font-family:var(--fh);font-weight:700;font-size:15px;color:var(--mut)}
.ar-rk .nm{flex:1;min-width:0;font-weight:800;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ar-rk .nm small{display:block;font-weight:600;color:var(--mut);font-size:8px;font-family:var(--fc)}
.ar-rk .pt2{font-weight:900;font-size:15px;color:var(--gold2)}
.ar-rk.me{background:linear-gradient(#4e4020 0 28%,#3d2618 28% 100%);box-shadow:0 0 0 var(--u) var(--gold);position:sticky;top:0;bottom:0;z-index:2}
.ar-rk.me .ps{color:var(--gold2)}
.ar-rk .emb{flex:none}
.ar-sep{font-family:var(--fh);font-size:8px;font-family:var(--fc);letter-spacing:.18em;text-transform:uppercase;color:var(--lc);margin:10px 4px 4px;display:flex;align-items:center;gap:8px}
.ar-sep::after{content:"";flex:1;height:1px;background:var(--lc);opacity:.5}
.ar-shop{display:flex;gap:10px;align-items:center}
.ar-shop .ico{width:50px;height:50px;display:grid;place-items:center;font-size:24px;color:var(--gold2);background:var(--inset);border:var(--u) solid var(--line2);flex:none}
.ar-shop .ico i.px{width:44px;height:44px}
.ar-shop .gr h3{font-size:15px}
.ar-shop .gr p{font-size:15px}
.ar-shop .buy{flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:4px}
.ar-st{font-size:8px;font-family:var(--fc);color:var(--mut);font-weight:700}
/* equipe */
.ar-tm .rv{display:flex;gap:10px;align-items:center;margin:8px 0 4px}
.ar-tm .rv .gr{flex:1;min-width:0;font-size:15px;color:#cfd5e4}
.ar-tm .rv .gr b{display:block;font-size:15px;color:var(--gold2)}
.ar-hr{display:flex;align-items:center;gap:8px;padding:6px 8px;border:var(--u) solid transparent;background:var(--fill2);margin-bottom:5px;width:100%;text-align:left}
.ar-hr.on{border-color:var(--gold);background:rgba(226,182,89,.13)}
.ar-hr .pt{width:38px;height:38px;background-color:var(--inset);background-size:38px 38px;flex:none;border:var(--u) solid #4a557a}
.ar-hr .gr{flex:1;min-width:0}
.ar-hr .nm,.ar-hr .sb{display:block}
.ar-hr .nm{font-weight:800;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ar-hr .sb{font-size:8px;font-family:var(--fc);color:var(--mut);font-weight:700}
.ar-hr .pw{height:4px;background:var(--fill2);margin-top:3px;overflow:hidden}
.ar-hr .pw i{display:block;height:100%;background:linear-gradient(#f7dc92 0 28%,#d8a544 28% 100%)}
.ar-hr .fm{display:flex;gap:3px;flex:none}
.ar-hr .fm span{height:28px;min-width:44px;padding:0 6px;font-size:8px;font-family:var(--fc);font-weight:900;display:grid;place-items:center;background:var(--fill2);color:var(--mut)}
.ar-hr .fm span.on{background:linear-gradient(#f7dc92 0 28%,#d8a544 28% 100%);color:#1a1408}
.ar-hr .ck{width:22px;height:22px;border:var(--u) solid rgba(255,255,255,.25);flex:none;display:grid;place-items:center;color:#1a1408;font-size:15px}
.ar-hr.on .ck{background:var(--gold);border-color:var(--gold2)}
.ar-tm .tmf{position:sticky;bottom:-2px;margin:6px -4px -2px;padding:8px 6px 14px;background:var(--fill);z-index:3}
.ar-res .acts{position:sticky;bottom:-2px;margin:10px -4px -2px;padding:10px 6px 14px;background:var(--fill);z-index:3}
.ar-ch2{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.ar-ch2 b{font-family:var(--fh);font-size:16px}
.ar-ch2 .lb{font-size:15px;font-weight:900}
.ar-ch{margin:8px 0 2px;padding:9px 10px;background:var(--inset);text-align:center}
.ar-ch b{font-size:20px;font-family:var(--fh)}
.ar-ch .bar{margin-top:6px}
/* duelo */
.ar-vs{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:6px}
.ar-vs b{font-family:var(--fh);font-size:15px;color:var(--gold2);max-width:112px;text-align:center;line-height:1.15}
.ar-vs i{font-style:normal;font-family:var(--fh);color:#ff9a9a;font-size:16px}
.ar-stage{position:relative;height:262px;overflow:hidden;border:var(--u) solid var(--line);background:linear-gradient(180deg,#3d2618 0%,#3d2618 52%,#54366a 100%)}
.ar-stage .sk2{background:#14102a;position:absolute;inset:0;background-image:radial-gradient(1.3px 1.3px at 10% 14%,#fff 50%,transparent),radial-gradient(1px 1px at 26% 30%,#fff 50%,transparent),radial-gradient(1.2px 1.2px at 58% 12%,#cfe 50%,transparent),radial-gradient(1px 1px at 78% 38%,#fff 50%,transparent),radial-gradient(1.2px 1.2px at 92% 18%,#fff 50%,transparent),radial-gradient(1px 1px at 40% 8%,#fff 50%,transparent)}
.ar-stage .m1{background:#e8dcb8;position:absolute;right:8%;top:8px;width:48px;height:48px;box-shadow:none}
.ar-stage .m2{background:#a880e8;position:absolute;left:12%;top:20px;width:24px;height:24px;box-shadow:none}
.ar-stage .arfl{background:#b48f56;position:absolute;left:0;right:0;bottom:0;height:58%;}
.ar-stage .arfl::after{content:"";position:absolute;left:8%;right:8%;top:20%;height:2px;background:var(--fill2)}
.ar-stage .arc{position:absolute;left:0;right:0;bottom:48%;height:34px;display:flex;justify-content:space-around;opacity:.5}
.ar-stage .arc i{width:34px;height:34px;background:#0e1230}
.ar-cols{position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr 24px 1fr 1fr;align-items:center;padding:10px 4px 6px;z-index:2}
.ar-col{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
.arft{position:relative;width:60px;display:flex;flex-direction:column;align-items:center;transition:opacity .4s}
.arft .nm{font-size:8px;font-family:var(--fc);font-weight:800;color:#fff;text-shadow:var(--u) var(--u) 0 var(--ol);max-width:60px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.1}
.arft .arsp{width:52px;height:60px;background-size:52px 60px;transition:transform .16s ease-out,filter .2s}
.arft.r .arsp{transform:scaleX(-1)}
.arft .arhb{width:46px;height:5px;background:var(--inset);overflow:hidden;margin-top:1px;box-shadow:0 0 0 var(--u) rgba(0,0,0,.5)}
.arft .arhb i{display:block;height:100%;width:100%;background:linear-gradient(#7fe89a 0 28%,#3fae5f 28% 100%);transition:width .25s}
.arft.r .arhb i{background:linear-gradient(#ff8a8a 0 28%,#c84444 28% 100%)}
.ar-stage.bg .arft{width:74px}.ar-stage.bg .arft .arsp{width:64px;height:74px;background-size:64px 74px}.ar-stage.bg .arft .arhb{width:56px}.ar-stage.bg .arft .nm{max-width:72px;font-size:8px;font-family:var(--fc)}
.arft.atk .arsp{transform:translateX(14px)}
.arft.r.atk .arsp{transform:scaleX(-1) translateX(14px)}
.arft.hit .arsp{filter:brightness(2.2) saturate(.4)}
.arft.ko{opacity:.28}
.arft.ko .arsp{filter:grayscale(1) brightness(.6);transform:rotate(86deg) translate(0,12px)}
.arft.r.ko .arsp{transform:scaleX(-1) rotate(86deg) translate(0,12px)}
.arft.stn::after{content:"";position:absolute;top:-4px;left:50%;width:30px;height:10px;margin-left:-15px;border:2px dotted #ffe07a;animation:arspin .6s linear infinite}
@keyframes arspin{to{transform:rotate(360deg)}}
.ar-fx{position:absolute;inset:0;pointer-events:none;z-index:5;overflow:hidden}
.ar-fx b{position:absolute;font-weight:900;font-size:15px;color:#ffd0d0;text-shadow:var(--u) var(--u) 0 var(--ol);white-space:nowrap;animation:ardn .95s ease-out forwards;transform:translate(-50%,0)}
.ar-fx b.arcr{font-size:16px;color:#ffd35a}
.ar-fx b.arhl{color:#9af0b0}
.ar-fx b.arms{font-size:8px;font-family:var(--fc);color:#cfd5e4;font-weight:800}
.ar-fx b.arsg{font-size:15px;color:#bfe9ff;font-weight:800}
.ar-fx b.arsk{font-family:var(--fh);font-size:15px;letter-spacing:.04em;padding:2px 8px;color:#1b110c;background:var(--kc);box-shadow:none;animation:arsk 1.15s ease-out forwards}
@keyframes ardn{0%{opacity:0;margin-top:10px;scale:.6}12%{opacity:1;margin-top:0;scale:1.15}100%{opacity:0;margin-top:-38px;scale:1}}
@keyframes arsk{0%{opacity:0;margin-top:6px}10%{opacity:1;margin-top:0}80%{opacity:1}100%{opacity:0;margin-top:-16px}}
.ar-log{min-height:34px;margin-top:8px;text-align:center;font-size:15px;color:#cfd5e4;line-height:1.35}
.ar-log b{color:var(--gold2)}
.ar-prog{height:4px;background:var(--fill2);margin-top:6px;overflow:hidden}
.ar-prog i{display:block;height:100%;width:0;background:linear-gradient(#f7dc92 0 28%,#8a5ae8 28% 100%)}
.ar-res{margin-top:10px;text-align:center;animation:arpop .5s cubic-bezier(.3,1.4,.4,1)}
@keyframes arpop{from{opacity:0;transform:scale(.8)}}
.ar-res .big{font-family:var(--fh);font-size:32px;letter-spacing:.12em;font-weight:700;line-height:1;margin:2px 0 4px}
.ar-res.w .big{color:var(--brass2);}
.ar-res.l .big{color:#c9d2ea;}
.ar-res .sub{color:#cfd5e4;font-size:15px;margin-bottom:4px}
.ar-res .up{display:inline-flex;align-items:center;gap:5px;padding:4px 11px;font-weight:900;font-size:15px;margin:4px 0;background:rgba(95,207,124,.18);color:#b0f0c0;border:var(--u) solid rgba(95,207,124,.5)}
.ar-res .up.dn{background:rgba(238,100,100,.14);color:#ffb0b0;border-color:rgba(238,100,100,.45)}
.ar-res .costs{justify-content:center}
.ar-res .mvp{font-size:15px;color:var(--mut);margin-top:6px}
.ar-res .mvp b{color:var(--gold2)}
.ar-st2{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:8px 0}
.ar-bx{background:var(--fill2);position:relative;margin:10px auto;width:min(100%,260px);padding:12px;text-align:center;border:var(--u) solid var(--lc);box-shadow:none}
.ar-bx .lgb{font-size:15px;height:28px}
.ar-bx .ps{font-family:var(--fh);font-size:32px;font-weight:700;color:var(--gold2);line-height:1.1;margin:6px 0 0}
.ar-bx .ps small{font-size:15px;color:var(--mut);font-family:var(--fb)}
.ar-lk{text-align:center;padding:6px 4px}
.ar-lk .emb{margin:0 auto 6px;display:block;opacity:.8}
`;
  document.head.appendChild(css);

  /* ---------- peças de arte ---------- */
  let eid = 0;
  const symInner = (name) => G.PX.svgInner(name);
  const SHIELD = 'M16 1.5L29.5 5.5V18C29.5 27 23.5 33.5 16 36.5C8.5 33.5 2.5 27 2.5 18V5.5Z';
  /* brasão: escudo com a cor do reino, um padrão, um símbolo e uma borda dourada */
  const emblem = (e, px) => {
    const id = 'ae' + (++eid), dk = A.shade ? A.shade(e.c1, 0.68) : e.c1, h = Math.round(px * 38 / 32);
    let pat = '';
    switch (e.pat) {
      case 'half': pat = '<rect x="16" y="0" width="20" height="40" fill="' + dk + '"/>'; break;
      case 'chief': pat = '<rect x="0" y="0" width="40" height="12" fill="' + dk + '"/>'; break;
      case 'bend': pat = '<polygon points="0,4 9,0 36,30 27,38" fill="' + dk + '"/>'; break;
      case 'cross': pat = '<rect x="13" y="0" width="6" height="40" fill="' + dk + '"/><rect x="0" y="13" width="40" height="6" fill="' + dk + '"/>'; break;
      default: pat = '';
    }
    return '<svg class="emb" viewBox="0 0 32 38" width="' + px + '" height="' + h + '"><defs><clipPath id="' + id + '"><path d="' + SHIELD + '"/></clipPath></defs>' +
      '<path d="' + SHIELD + '" fill="' + e.c1 + '"/><g clip-path="url(#' + id + ')">' + pat + '</g>' +
      '<g transform="translate(8.2 8.4) scale(.66)">' + symInner(e.sym) + '</g>' +
      '<path d="' + SHIELD + '" fill="none" stroke="#f0d27a" stroke-width="1.7"/></svg>';
  };
  const AUR = { c1: '#1f2c66', c2: '#f7dc92', pat: 'chief', sym: 'moon' };
  const rivEmb = (i, px) => emblem(G.arenaRival(i), px);
  const insIc = (px) => '<svg class="i ins-ic" viewBox="0 0 24 24" style="color:#9ad0ff;width:' + (px || 14) + 'px;height:' + (px || 14) + 'px"><circle cx="12" cy="12" r="10"/><path d="M14.6 6.4a6.2 6.2 0 100 11.2 5 5 0 010-11.2z" fill="#0a1230" opacity=".7"/><circle cx="12" cy="12" r="10" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1"/></svg>';
  /* a cena da Arena: duas luas sobre um anfiteatro, com duas espadas cruzadas */
  const arenaArt = () => '<svg class="art" viewBox="0 0 360 128" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="ars1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d2618"/><stop offset=".65" stop-color="#3a2f6c"/><stop offset="1" stop-color="#6a4070"/></linearGradient>' +
    '<radialGradient id="ars2" cx=".35" cy=".35"><stop offset="0" stop-color="#fffbe8"/><stop offset=".6" stop-color="#e8dcb8"/><stop offset="1" stop-color="#b8a880"/></radialGradient><radialGradient id="ars3" cx=".35" cy=".35"><stop offset="0" stop-color="#f0dcff"/><stop offset=".6" stop-color="#a880e8"/><stop offset="1" stop-color="#6a48b0"/></radialGradient>' +
    '<radialGradient id="ars4" cx=".5" cy="1"><stop offset="0" stop-color="#e8cf94"/><stop offset="1" stop-color="#7a6040"/></radialGradient></defs>' +
    '<rect width="360" height="128" fill="url(#ars1)"/>' +
    [[20, 18], [54, 40], [96, 14], [150, 30], [188, 12], [232, 44], [292, 16], [330, 34], [12, 62], [120, 52], [312, 60]].map((p, i) => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i % 3 ? 0.9 : 1.4) + '" fill="#fff" opacity=".8"/>').join('') +
    '<circle cx="272" cy="40" r="46" fill="#fff0c0" opacity=".1"/><circle cx="272" cy="40" r="27" fill="url(#ars2)"/><circle cx="262" cy="34" r="4" fill="#b8a880" opacity=".5"/><circle cx="281" cy="48" r="5.5" fill="#b8a880" opacity=".4"/>' +
    '<circle cx="204" cy="30" r="22" fill="#c8a0ff" opacity=".12"/><circle cx="204" cy="30" r="11" fill="url(#ars3)"/>' +
    '<path d="M0 128V82h360v46z" fill="#1b110c"/><g fill="#3d2618">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => '<path d="M' + (k * 36 + 4) + ' 82v-26a14 14 0 0128 0v26z"/>').join('') + '</g>' +
    '<g fill="#1b110c">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => '<path d="M' + (k * 36 + 11) + ' 82v-18a7 7 0 0114 0v18z"/>').join('') + '</g>' +
    '<ellipse cx="180" cy="112" rx="190" ry="30" fill="url(#ars4)"/><ellipse cx="180" cy="104" rx="120" ry="14" fill="none" stroke="#fff" stroke-opacity=".2"/>' +
    '<g transform="translate(180 82)"><path d="M-30 -34L26 22" stroke="#e6eaf4" stroke-width="5" stroke-linecap="round"/><path d="M30 -34L-26 22" stroke="#e6eaf4" stroke-width="5" stroke-linecap="round"/><path d="M-30 -34L26 22" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/><path d="M30 -34L-26 22" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/><path d="M20 12l12 8M-20 12l-12 8" stroke="#e2b659" stroke-width="5" stroke-linecap="round"/><circle cx="-30" cy="-34" r="2.4" fill="#fff3b0"/><circle cx="30" cy="-34" r="2.4" fill="#fff3b0"/></g></svg>';

  /* herói rival com as cores do reino (cabo e capa no tom do brasão) */
  const rLook = (h, riv) => {
    const o = A.heroLook(h), mix = A.mix;
    o.body = mix(o.body || '#888888', riv.c1, 0.5); o.cape = mix(riv.c1, '#000000', 0.15); o.trim = riv.c2; if (o.scarf) o.scarf = riv.c2;
    o.key = 'rv|' + riv.i + '|' + h.id + '|' + h.rank + '|' + (h.gear.arma ? h.gear.arma.tier : 0);
    return o;
  };
  const myLook = (h) => A.heroLook(h);
  const sprite = (look) => A.fullBody(look), port = (look) => A.portrait(look);
  const heroById = (id) => G.S.heroes.find((h) => h.id === id);
  const lgBadge = (lg) => { const L = G.ARENA_LEAGUES[lg]; return '<span class="lgb" style="--lc:' + L.col + ';--lg:' + rgba(L.col, 0.5) + '">' + ic('trophy') + L.name + '</span>'; };
  const chips = (p) => '<div class="costs">' + p.map((x) => '<span class="cost">' + x.i + x.t + '</span>').join('') + '</div>';
  const cPts = (n) => '<span class="cost">' + ic('star') + '+' + n + ' pontos</span>';
  const cIns = (n) => '<span class="cost">' + insIc(14) + '+' + n + (n > 1 ? ' Insígnias' : ' Insígnia') + '</span>';
  const rarCol = (r) => G.RAR_COLOR[r];

  /* ---------- estado da tela ---------- */
  let view = 'duelo', tm = null;
  /* o painel só se redesenha quando não há janela por cima (os cálculos dos adversários pesam um pouco) */
  let late = false;
  const dirty = () => { if (!UI.sheet) return; if (UI.modalOpen) late = true; else UI.sheetDirty(); };
  const cm0 = UI.closeModal;
  UI.closeModal = () => { cm0(); if (late) { late = false; if (UI.sheet) UI.sheetDirty(); } };

  /* ================= a aba "Arena" ================= */
  const lockedHtml = () => '<div class="card hl ar-lk"><div style="opacity:.8">' + emblem({ c1: '#3d2618', c2: '#98a2ba', pat: 'plain', sym: 'moon' }, 54) + '</div><h3 class="cz" style="justify-content:center">Arena das Duas Luas</h3><p>Reinos rivais mandam seus campeões medir forças com os seus. Abre com <b class="gold">Cidadela nível 3</b> ou <b class="gold">Nível de Reino 6</b>, o que vier primeiro.</p></div>';
  const header = (a) => {
    const sea = G.arenaSeason(), lg = G.arenaLeague(a.pts), L = G.ARENA_LEAGUES[lg], nx = G.ARENA_LEAGUES[lg + 1], tk = G.arenaTickets();
    const pct = nx ? Math.round(100 * (a.pts - L.min) / (nx.min - L.min)) : 100;
    let pips = ''; for (let i = 0; i < tk.max; i++) pips += '<i class="' + (i < tk.free ? '' : 'off') + '"></i>'; for (let i = 0; i < Math.min(5, tk.xt); i++) pips += '<i class="xt"></i>';
    return '<div class="arh">' + arenaArt() + '<div class="ov">' + emblem(AUR, 40) + '<div class="gr" style="flex:1;min-width:0"><h3>Arena das Duas Luas</h3><small>Temporada ' + (a.sn + 1) + ' · ' + esc(sea.name) + ' · termina em ' + G.fmtLeft(sea.left) + '</small></div></div></div>' +
      '<div class="card"><div class="arlg">' + lgBadge(lg) + '<div class="gr" style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;font-size:15px;font-weight:800"><span>' + G.fmt(a.pts) + ' pontos</span><span class="mut">' + (nx ? 'faltam ' + (nx.min - a.pts) + ' para ' + nx.name : 'liga máxima') + '</span></div><div class="bar big" style="margin-top:5px"><i style="width:' + pct + '%"></i></div></div></div>' +
      '<div class="row" style="margin-top:10px"><div class="gr"><div class="arpips">' + pips + '</div><p style="margin-top:5px">' + (tk.total > 0 ? '<b class="gold">' + tk.total + '</b> tíquete' + (tk.total > 1 ? 's' : '') + ' para duelar hoje' : 'Sem tíquetes hoje: voltam amanhã') + '</p></div>' +
      (tk.canBuy ? '<button class="btn sm' + (G.S.nucleos >= tk.buyCost ? ' vio' : '') + '" data-a="arbuytk"' + (G.S.nucleos >= tk.buyCost ? '' : ' disabled') + '>' + ic('core') + '+1 · ' + tk.buyCost + '</button>' : '') + '</div></div>' +
      '<div class="seg arseg">' + [['duelo', 'Duelar'], ['ranking', 'Ranking'], ['loja', 'Loja']].map(([k, l]) => '<button data-a="arview:' + k + '" class="' + (view === k ? 'on' : '') + '">' + l + (k === 'loja' && a.ctr > 0 ? ' •' : '') + '</button>').join('') + '</div>';
  };
  const avgLv = (rz) => Math.round(rz.heroes.reduce((a, x) => a + x.L, 0) / Math.max(1, rz.heroes.length));
  const miniTeam = (rz, riv) => '<div class="mini">' + rz.heroes.map((x) => '<i class="px" title="' + esc(x.h.name) + '" style="background-image:url(' + port(rLook(x.h, riv)) + ');border-color:' + rarCol(x.h.rar) + '"></i>').join('') + '</div>';
  const tabDuelo = (a) => {
    const S = G.S; let h = '';
    if (S.heroes.length < 3) return h + '<div class="empty">A Arena exige pelo menos 3 heróis em Aurora.</div>';
    if (!G.arenaOffersReady()) { UI.arenaWarm(0); return h + '<div class="card"><p class="mut" style="text-align:center;margin:6px 0">Chamando os campeões rivais…</p></div>'; }   // o cálculo corre em tarefas curtas (2C.6)
    const offers = G.arenaOffers(), tk = G.arenaTickets();
    if (!S.tut.seen.arena) h += '<div class="card hl"><p class="ar-intro"><b>Como funciona.</b> Cada dia traz <b>5 tíquetes</b>. Escolha um dos três campeões rivais, monte a equipe (do tamanho que ele enviar) e a luta é decidida pelos atributos reais dos seus heróis, com formação de frente e fundo. Vitórias dão <b>pontos</b> (ligas semanais) e <b>Insígnias</b> (Loja). Os heróis lutam como ecos de luz: ninguém se fere e ninguém sai da caçada.</p></div>';
    h += '<div class="sec">Adversários de hoje</div>';
    if (!offers.length) return h + '<div class="empty">Nenhum rival à altura por enquanto. Volte quando tiver mais heróis.</div>';
    offers.forEach((o, k) => {
      const riv = G.arenaRival(o.i), rz = G.arenaRealize(o.i, o.ratio), dc = o.label.c;
      h += '<div class="arof">' + emblem(riv, 40) + '<div class="gr"><h4>' + esc(riv.name) + '</h4><div class="sb">' + esc(riv.lead.title) + ' ' + esc(riv.lead.name) + ' · ' + riv.size + ' heróis · ' + riv.style + '</div>' +
        '<div style="margin-top:5px;display:flex;gap:6px;align-items:center"><span class="dif" style="--dc:' + dc + '">' + o.label.t + ' · ' + Math.round(o.ch * 100) + '%</span><span class="mut" style="font-size:15px;font-weight:700">Nv médio ' + avgLv(rz) + '</span></div>' + miniTeam(rz, riv) + '</div>' +
        '<div class="rt"><div class="rw">' + ic('star') + '+' + o.pts + ' ' + insIc(12) + '+' + o.ins + '</div><button class="btn sm pri" data-a="arfight:' + k + '"' + (tk.total < 1 ? ' disabled' : '') + '>' + ic('sword') + 'Desafiar</button><button class="btn sm" data-a="arriv:' + o.i + '">Ver reino</button></div></div>';
    });
    if (tk.total < 1) h += '<p class="mut" style="text-align:center;font-size:15px">Os tíquetes voltam à meia-noite. Dá para comprar mais com Núcleos (botão acima) ou com moedas, na Loja.</p>';
    if (a.last) h += '<p class="mut" style="text-align:center;font-size:15px;margin-top:8px">Último duelo: ' + (a.last.win ? 'vitória' : 'derrota') + ' diante de ' + esc(a.last.rival) + ' · sequência atual: ' + a.streak + (a.best > 0 ? ' · recorde ' + a.best : '') + '</p>';
    return h;
  };
  const tabRanking = (a) => {
    const st = G.arenaStanding(), me = st.me, rd = a.rd && a.rd.d === st.sea.dn ? a.rd.p - me : 0;
    let h = '<div class="card hl"><div class="row"><div class="gr"><h3>Você está em ' + me + 'º de ' + st.list.length + '</h3><p>' + G.fmt(a.pts) + ' pontos · ' + a.sw + ' vitória' + (a.sw === 1 ? '' : 's') + ' e ' + a.sl + ' derrota' + (a.sl === 1 ? '' : 's') + ' nesta semana' + (rd > 0 ? '. Hoje você <b class="good">subiu ' + rd + ' posição' + (rd > 1 ? 'ões' : '') + '</b>.' : rd < 0 ? '. Hoje os rivais passaram ' + (-rd) + '.' : '.') + '</p></div></div></div>';
    let lastLg = -1;
    for (const x of st.list) {
      const lg = G.arenaLeague(x.pts), L = G.ARENA_LEAGUES[lg];
      if (lg !== lastLg) { lastLg = lg; h += '<div class="ar-sep" style="--lc:' + L.col + '">Liga ' + L.name + ' · a partir de ' + L.min + '</div>'; }
      if (x.i < 0) h += '<div class="ar-rk me" style="--lc:' + L.col + '"><span class="ps">' + x.pos + '</span>' + emblem(AUR, 26) + '<span class="nm">Aurora (você)<small>' + a.wins + ' vitórias no total</small></span><span class="pt2">' + G.fmt(x.pts) + '</span></div>';
      else { const r = G.arenaRival(x.i); h += '<button class="ar-rk" data-a="arriv:' + x.i + '" style="--lc:' + L.col + '"><span class="ps">' + x.pos + '</span>' + emblem(r, 26) + '<span class="nm">' + esc(r.name) + '<small>' + esc(r.lead.title) + ' ' + esc(r.lead.name) + '</small></span><span class="pt2">' + G.fmt(x.pts) + '</span></button>'; }
    }
    h += '<p class="mut" style="text-align:center;font-size:15px;margin-top:8px">A temporada vira na segunda-feira, à meia-noite, pelo relógio do aparelho. Os rivais também lutam todos os dias, então a tabela muda mesmo quando você não joga.</p>';
    if (a.hist.length) { h += '<div class="sec">Temporadas anteriores</div>'; for (const r of a.hist.slice().reverse()) h += '<div class="kv"><span>Temporada ' + r.n + ' · ' + esc(r.name) + '</span><b>' + G.ARENA_LEAGUES[r.liga].name + ' · ' + r.pos + 'º</b></div>'; }
    if (a.titulos.length) { h += '<div class="sec">Títulos</div>'; for (const t of a.titulos) h += '<div class="kv"><span>' + esc(t.name) + '</span><b>' + (t.n > 1 ? '×' + t.n : '1×') + '</b></div>'; }
    return h;
  };
  const shopItem = (it) => {
    const a = G.arena(), left = G.arenaShopLeft(it), can = left > 0 && a.ins >= it.cost, ico = it.cos ? '<i class="px" style="background-image:url(' + A.cosURL(it.cos) + ');background-size:contain"></i>' : ic(it.icon);
    return '<div class="card"><div class="ar-shop"><span class="ico">' + ico + '</span><div class="gr"><h3>' + esc(it.name) + '</h3><p>' + esc(it.desc) + '</p><div class="ar-st">' + (left > 0 ? 'Estoque da semana: ' + left + ' de ' + it.stock : 'Esgotado até a próxima segunda') + '</div></div>' +
      '<div class="buy"><span class="cost' + (a.ins < it.cost ? ' lack' : '') + '">' + insIc(14) + it.cost + '</span><button class="btn sm pri" data-a="arshop:' + it.id + '"' + (can ? '' : ' disabled') + '>Trocar</button></div></div></div>';
  };
  const tabLoja = (a) => {
    const S = G.S, unit = G.arenaCoinUnit(), tk = G.arenaTickets();
    let h = '<div class="card hl"><div class="row"><span class="thumb sm" style="display:grid;place-items:center;font-size:20px">' + insIc(26) + '</span><div class="gr"><h3>' + G.fmt(a.ins) + ' Insígnias</h3><p>Ganhas em duelos (vitórias valem mais) e no baú da temporada. O estoque renova toda segunda-feira.</p></div></div></div>';
    if (a.ctr > 0) h += '<div class="card hl"><div class="row"><span class="thumb sm" style="display:grid;place-items:center;font-size:20px;color:var(--gold2)">' + ic('scroll') + '</span><div class="gr"><h3>Contrato Épico guardado: ' + a.ctr + '</h3><p>Três candidatos Épicos esperam a sua escolha.</p></div><button class="btn sm pri" data-a="arctr">Usar</button></div></div>';
    h += '<div class="sec">Troca por Insígnias</div>';
    for (const it of G.ARENA_SHOP) h += shopItem(it);
    h += '<div class="sec">Mais um duelo, por moedas ou Núcleos</div>';
    h += '<p class="mut" style="font-size:15px;margin:-2px 2px 8px">Os preços acompanham o seu progresso (nível dos heróis e do reino) e cada compra do dia encarece a seguinte.</p>';
    for (const it of G.ARENA_COIN) {
      const n = G.arenaCoinState().b[it.id] || 0, price = G.arenaCoinPrice(it), off = (it.max && n >= it.max) || (it.id === 'bandeira' && G.arenaFlagLeft() > 0), can = !off && S.gold >= price;
      h += '<div class="card"><div class="ar-shop"><span class="ico">' + ic(it.icon) + '</span><div class="gr"><h3>' + esc(it.name) + '</h3><p>' + esc(it.desc) + (it.id === 'bandeira' && G.arenaFlagLeft() > 0 ? ' <b class="good">Hasteada: ' + Math.ceil(G.arenaFlagLeft() / G.DAY_SEC * 5) + ' min de jogo restantes.</b>' : '') + '</p><div class="ar-st">Hoje: ' + n + (it.max ? ' de ' + it.max : '') + ' comprado' + (n === 1 ? '' : 's') + '</div></div>' +
        '<div class="buy"><span class="cost' + (S.gold < price ? ' lack' : '') + '">' + ic('coin') + G.fmt(price) + '</span><button class="btn sm pri" data-a="arcoin:' + it.id + '"' + (can ? '' : ' disabled') + '>Comprar</button></div></div></div>';
    }
    h += '<div class="card"><div class="ar-shop"><span class="ico">' + ic('core') + '</span><div class="gr"><h3>Tíquete extra com Núcleos</h3><p>Hoje: ' + tk.bought + ' de ' + G.ARENA.coreCost.length + ' comprados.</p></div><div class="buy">' + (tk.canBuy ? '<span class="cost' + (S.nucleos < tk.buyCost ? ' lack' : '') + '">' + ic('core') + tk.buyCost + '</span><button class="btn sm vio" data-a="arbuytk"' + (S.nucleos >= tk.buyCost ? '' : ' disabled') + '>Comprar</button>' : '<span class="ar-st">Limite de hoje</span>') + '</div></div></div>';
    return h;
  };
  const arenaTab = () => {
    if (!G.arenaOpen()) return lockedHtml();
    G.arenaSync(); const a = G.arena();
    return header(a) + (view === 'ranking' ? tabRanking(a) : view === 'loja' ? tabLoja(a) : tabDuelo(a));
  };
  /* cartão no topo da aba Jornada */
  const arenaCard = () => {
    if (!G.S) return '';
    if (!G.arenaOpen()) return '<div class="card lock"><div class="row">' + emblem({ c1: '#3d2618', c2: '#98a2ba', pat: 'plain', sym: 'moon' }, 34) + '<div class="gr"><h3>Arena das Duas Luas</h3><p>Abre com Cidadela nível 3 ou Nível de Reino 6.</p></div></div></div>';
    const a = G.arena(), tk = G.arenaTickets(), lg = G.arenaLeague(a.pts);
    return '<div class="card hl" data-a="open:missoes:arena" style="cursor:pointer"><div class="row">' + emblem(AUR, 36) + '<div class="gr"><h3>Arena das Duas Luas <small>' + lgBadge(lg) + '</small></h3><p>' + (tk.total > 0 ? '<b class="gold">' + tk.total + ' tíquete' + (tk.total > 1 ? 's' : '') + '</b> para duelar hoje · ' + G.fmt(a.pts) + ' pontos na temporada' : 'Sem tíquetes hoje · ' + G.fmt(a.pts) + ' pontos na temporada') + '</p></div><button class="btn sm pri" data-a="open:missoes:arena">Entrar</button></div></div>';
  };

  /* ---------- liga a aba ao painel Missões ---------- */
  const M = UI.SHEETS && UI.SHEETS.missoes;
  if (M) {
    const render0 = M.render;
    M.render = function (tab, sub) {
      if (tab === 'arena') return arenaTab();
      const h = render0.call(M, tab, sub);
      return tab === 'jornada' ? arenaCard() + h : h;
    };
    M.badge.arena = () => arenaBadge();
    const syncTab = () => {
      const has = M.tabs.some((t) => t[0] === 'arena'), want = !!G.S && G.arenaOpen();
      if (want && !has) { const k = M.tabs.findIndex((t) => t[0] === 'contratos'); M.tabs.splice(k + 1, 0, ['arena', 'Arena']); }
      else if (!want && has) M.tabs.splice(M.tabs.findIndex((t) => t[0] === 'arena'), 1);
      return want && !has;
    };
    G.on('start', syncTab); G.on('arena', syncTab);
    UI.arenaSyncTab = syncTab;
    const open0 = UI.open;
    UI.open = (n, t, s) => { if (n === 'missoes') syncTab(); return open0(n, t, s); };
  }
  const arenaBadge = () => { if (!G.S || !G.arenaOpen()) return 0; const t = G.arenaTickets(); return t.total > 0 && G.S.heroes.length >= 3 ? 1 : 0; };
  const mb0 = UI.badges.missoes;
  UI.badges.missoes = () => mb0() + arenaBadge();

  /* ---------- ações das abas ---------- */
  Object.assign(UI.ACT, {
    arview: (a) => { view = a[0]; dirty(); },
    arbuytk: () => { const r = G.arenaBuyTicket(); if (!r.ok) return UI.toast(r.why + '.', 'bad'); G.sfx('buy'); UI.toast('+1 tíquete da Arena.', 'good', 'scroll'); dirty(); },
    arshop: (a) => {
      const id = a[0], it = G.ARENA_SHOP.find((x) => x.id === id), r = G.arenaShopBuy(id);
      if (!r.ok) return UI.toast(r.why + '.', 'bad');
      UI.toast(it.name + ' é seu!', 'epic', it.icon);
      if (id === 'contrato') return contractModal();
      dirty();
    },
    arcoin: (a) => { const r = G.arenaCoinBuy(a[0]); if (!r.ok) return UI.toast(r.why + '.', 'bad'); UI.toast(r.it.name + (r.got && r.it.id === 'bau' ? ': ' + r.got : '') + '.', 'good', r.it.icon); dirty(); },
    arctr: () => contractModal(),
    arriv: (a) => rivalModal(+a[0]),
  });

  /* ================= janelas: rival, contrato, equipe ================= */
  const rivalModal = (i) => {
    const riv = G.arenaRival(i), ref = G.arenaRef(), ratio = G.arenaRatio(i), rz = G.arenaRealize(i, ratio, ref), sea = G.arenaSeason();
    const pts = G.arenaRivalPts(i, sea.idx, sea.dis);
    let h = '<div class="eyebrow">' + esc(riv.type === 'cla' ? 'Clã' : riv.name.split(' ')[0]) + '</div><h2>' + esc(riv.name) + '</h2><div style="display:flex;justify-content:center;margin:8px 0">' + emblem(riv, 64) + '</div>' +
      '<p class="lead" style="margin:4px 0 8px"><b class="gold">' + esc(riv.lead.title) + ' ' + esc(riv.lead.name) + '</b><br>“' + esc(riv.motto) + '”</p>' +
      '<div class="ar-st2"><div class="stat"><small>Estilo</small><b style="font-size:15px">' + riv.style + '</b></div><div class="stat"><small>Pontos</small><b>' + G.fmt(pts) + '</b></div><div class="stat"><small>Heróis</small><b>' + riv.size + '</b></div></div>';
    h += '<div class="sec">Campeões (nível para o seu poder de hoje)</div>';
    for (const x of rz.heroes) {
      const look = rLook(x.h, riv), cl = G.CLASSES[x.h.cls];
      h += '<div class="ar-hr" style="cursor:default"><i class="pt px" style="background-image:url(' + sprite(look) + ');border-color:' + rarCol(x.h.rar) + '"></i><span class="gr"><span class="nm">' + esc(x.h.name) + ' <span style="color:' + rarCol(x.h.rar) + ';font-size:8px;font-family:var(--fc)">' + G.RAR[x.h.rar] + '</span></span><span class="sb">' + esc(G.heroTitle(x.h)) + ' · Nv ' + x.L + ' · ' + x.h.traits.map((t) => G.TRAITS[t].name).join(', ') + '</span></span></div>';
      void cl;
    }
    UI.modal(h + '<div class="acts"><button class="btn pri" data-a="mclose">Fechar</button></div>', { pause: false });
  };
  const contractModal = () => {
    const a = G.arena(); if (!(a.ctr > 0)) return;
    const cands = G.arenaContractRoll();
    if (G.S.heroes.length >= G.heroCap()) return UI.modal('<div class="eyebrow">Contrato Épico</div><h2>Sem camas livres</h2><p class="lead">A Hospedaria abriga ' + G.heroCap() + ' heróis. Melhore-a ou libere uma cama: o contrato espera por você.</p><div class="acts"><button class="btn" data-a="mclose">Fechar</button><button class="btn pri" data-a="mgo:reino:obras:hospedaria">Ver Hospedaria</button></div>');
    let h = '<div class="eyebrow">Contrato Épico</div><h2>Quem veste a farda de Aurora?</h2><div style="margin-top:12px">';
    cands.forEach((c, i) => { const fake = { cls: c.cls, look: c.look, rank: G.rankForLevel(c.lvl), gear: { arma: { tier: 1 }, armadura: null } }, cl = G.CLASSES[c.cls]; h += '<button class="cand rar' + c.rar + '" data-a="arhire:' + i + '"><i class="pt px" style="background-image:url(' + A.fullBody(A.heroLook(fake)) + ')"></i><span class="gr"><b style="font-size:15px;color:#fff">' + esc(c.name) + '</b> <span class="rar' + c.rar + '" style="font-weight:800;font-size:15px">' + G.RAR[c.rar] + '</span><br><span style="font-size:15px;color:var(--gold2);font-weight:800">' + cl.name + ' · Nv ' + c.lvl + '</span><br><span class="mut" style="font-size:15px">' + cl.desc + '</span><br><span style="font-size:15px">' + c.traits.map((t) => '<span class="pill">' + G.TRAITS[t].name + '</span>').join(' ') + '</span></span></button>'; });
    UI.modal(h + '</div><div class="acts"><button class="btn" data-a="mclose">Escolher depois</button></div>');
  };
  UI.ACT.arhire = (a) => { const h = G.arenaContractHire(+a[0]); UI.closeModal(); if (h) { UI.banner('Um novo juramento', h.name, G.CLASSES[h.cls].name + ' ' + G.RAR[h.rar]); dirty(); } else UI.toast('Não foi possível contratar agora.', 'bad'); };

  /* ---------- montar a equipe ---------- */
  const tmPower = () => { let m = 1; for (const h of G.S.heroes) m = Math.max(m, G.arenaHeroPow(h)); return m; };
  const tmFoot = () => {
    const o = tm.offer, riv = G.arenaRival(o.i), n = riv.size, ok = tm.sel.length === n, tk = G.arenaTickets();
    let ch = null, lb = null;
    if (ok) { const pv = G.arenaPreview(o.i, tm.sel, o.ratio); ch = pv.chance; lb = pv.label; }
    const pts = ok ? G.arenaWinPts(ch, o.rev) : o.pts, ins = ok ? G.arenaWinIns(ch) : o.ins;
    return '<div class="ar-ch2">' + (ok ? '<b style="color:' + lb.c + '">' + Math.round(ch * 100) + '%</b><span class="lb" style="color:' + lb.c + '">' + lb.t + '</span><div class="bar big" style="flex:1"><i style="width:' + Math.round(ch * 100) + '%;background:' + lb.c + '"></i></div>' : '<span class="mut" style="font-size:15px;flex:1">Escolha ' + n + ' heróis (' + tm.sel.length + ' de ' + n + ')</span>') +
      '<span class="cost">' + ic('star') + '+' + pts + '</span><span class="cost">' + insIc(14) + '+' + ins + '</span></div>' +
      '<div class="acts" style="margin-top:0"><button class="btn" data-a="mclose">Voltar</button><button class="btn" data-a="arauto">Sugerir</button><button class="btn pri" data-a="argo"' + (ok && tk.total > 0 ? '' : ' disabled') + '>' + ic('sword') + 'Lutar!</button></div>';
  };
  const tmList = () => {
    const S = G.S, riv = G.arenaRival(tm.offer.i), n = riv.size, mx = tmPower();
    return (UI.synTeam ? UI.synTeam(tm) : '') + S.heroes.slice().sort((a, b) => G.arenaHeroPow(b) - G.arenaHeroPow(a)).map((x) => {   // v26 (4B.2): combinações da formação no topo da lista
      const sel = tm.sel.find((y) => y.id === x.id), p = G.arenaHeroPow(x), cl = G.CLASSES[x.cls], full = !sel && tm.sel.length >= n;
      return '<div class="ar-hr' + (sel ? ' on' : '') + '" data-a="artog:' + x.id + '"' + (full ? ' style="opacity:.55"' : '') + '><i class="pt px" style="background-image:url(' + port(myLook(x)) + ');border-color:' + G.RANK_COLOR[x.rank] + '"></i><span class="gr"><span class="nm">' + esc(x.name) + '</span><span class="sb">' + esc(G.heroTitle(x)) + ' · Nv ' + x.lvl + '</span><span class="pw"><i style="width:' + Math.round(100 * p / mx) + '%"></i></span></span>' +
        (sel ? '<span class="fm"><span data-a="arrow:' + x.id + ':0" class="' + (sel.r ? '' : 'on') + '">Frente</span><span data-a="arrow:' + x.id + ':1" class="' + (sel.r ? 'on' : '') + '">Fundo</span></span>' : '<span class="ck"></span>') + '</div>';
      void cl;
    }).join('');
  };
  const tmRedraw = () => { const l = $('#tm-list'), f = $('#tm-foot'); if (l) l.innerHTML = tmList(); if (f) f.innerHTML = tmFoot(); };
  const teamModal = (k) => {
    const offers = G.arenaOffers(), o = offers[k]; if (!o) return;
    const riv = G.arenaRival(o.i), rz = G.arenaRealize(o.i, o.ratio), n = riv.size;
    tm = { k, offer: o, sel: G.arenaTeam(n) };
    UI.modal('<div class="ar-tm"><div class="eyebrow">Desafio na Arena</div><h2>' + esc(riv.name) + '</h2>' +
      '<div class="rv">' + emblem(riv, 44) + '<div class="gr"><b>' + esc(riv.lead.title) + ' ' + esc(riv.lead.name) + '</b>Envia <b style="display:inline;font-size:15px">' + n + ' heróis</b> · ' + riv.style + ' · Nv médio ' + avgLv(rz) + miniTeam(rz, riv) + '</div></div>' +
      '<p class="mut" style="font-size:15px;margin:4px 2px 8px;line-height:1.4">Escolha ' + n + ' heróis. <b>Frente</b> toma os golpes corpo a corpo; <b>Fundo</b> fica protegido, mas arqueiros e magos alcançam todos.</p>' +
      '<div id="tm-list">' + tmList() + '</div><div id="tm-foot" class="tmf">' + tmFoot() + '</div></div>', { pause: true, onClose: () => { tm = null; } });
  };
  Object.assign(UI.ACT, {
    arfight: (a) => teamModal(+a[0]),
    artog: (a) => {
      if (!tm) return; const id = +a[0], i = tm.sel.findIndex((x) => x.id === id), n = G.arenaRival(tm.offer.i).size;
      if (i >= 0) tm.sel.splice(i, 1); else if (tm.sel.length < n) { const rows = G.arenaAutoRows(tm.sel.map((x) => x.id).concat(id)); tm.sel.push({ id, r: rows[id] }); } else return UI.toast('Já são ' + n + ' heróis. Toque em um para tirar.', 'info', 'people');
      tmRedraw();
    },
    arrow: (a) => { if (!tm) return; const x = tm.sel.find((y) => y.id === +a[0]); if (x) { x.r = +a[1]; tmRedraw(); } },
    arauto: () => { if (!tm) return; tm.sel = G.arenaAutoTeam(G.arenaRival(tm.offer.i).size); tmRedraw(); },
    argo: () => {
      if (!tm) return; const k = tm.k, sel = tm.sel, rows = {}; for (const x of sel) rows[x.id] = x.r;
      const res = G.arenaDuel({ ids: sel.map((x) => x.id), rows, off: k, rec: true });
      if (res.err) return UI.toast(res.err, 'bad');
      tm = null; duelModal(res);
    },
  });

  /* ================= o duelo animado ================= */
  let duel = null;
  const stopDuel = () => { if (duel) { cancelAnimationFrame(duel.raf); clearTimeout(duel.to); duel = null; } };
  const ftHtml = (f, look) => '<div class="arft' + (f.side ? ' r' : '') + '" id="ft' + f.id + '"><i class="px arsp" style="background-image:url(' + sprite(look) + ')"></i><span class="arhb"><i id="hb' + f.id + '"></i></span><span class="nm">' + esc(f.name) + '</span></div>';
  const duelModal = (res) => {
    stopDuel();
    const F = res.sim.F, nA = res.team.length, riv = G.arenaRival(res.rival.i), cols = { '0-1': [], '0-0': [], '1-0': [], '1-1': [] };
    for (const f of F) {
      const look = f.side === 0 ? myLook(heroById(f.hid) || { cls: f.cls, rank: 0, gear: {}, look: { skin: 0, hair: 0, style: 0, seed: 1 } }) : rLook(res.rz.heroes[f.id - nA].h, riv);
      cols[f.side + '-' + f.row].push(ftHtml(f, look));
    }
    const col = (k) => '<div class="ar-col">' + cols[k].join('') + '</div>';
    UI.modal('<div class="eyebrow">Arena das Duas Luas</div><div class="ar-vs">' + emblem(AUR, 34) + '<b>Aurora</b><i>×</i><b>' + esc(riv.name) + '</b>' + emblem(riv, 34) + '</div>' +
      '<div class="ar-stage' + (Math.max(...Object.values(cols).map((c) => c.length)) <= 2 ? ' bg' : '') + '"><div class="sk2"></div><div class="m1"></div><div class="m2"></div><div class="arc"><i></i><i></i><i></i><i></i><i></i></div><div class="arfl"></div>' +
      '<div class="ar-cols">' + col('0-1') + col('0-0') + '<div></div>' + col('1-0') + col('1-1') + '</div><div class="ar-fx" id="ar-fx"></div></div>' +
      '<div class="ar-prog"><i id="ar-pg"></i></div><div class="ar-log" id="ar-log">As luas se erguem sobre a Arena…</div><div id="ar-res"></div>' +
      '<div class="acts" id="ar-acts"><button class="btn" data-a="arskip">' + ic('speed') + 'Pular</button></div>', { lock: true, pause: true, onClose: () => { stopDuel(); dirty(); } });
    G.sfx('horn'); if (UI.synDuel) UI.synDuel(res);   // v26 (4B.2)
    const ev = res.ev || [], dur = res.sim.t, rate = dur > 36 ? dur / 36 : dur < 20 ? Math.max(0.6, dur / 20) : 1;
    const mhp = {}; for (const f of F) mhp[f.id] = f.mhp;
    duel = { res, i: 0, t0: performance.now(), rate, raf: 0, to: 0, done: false, mhp, dur };
    const fxEl = $('#ar-fx'), logEl = $('#ar-log'), stage = $('.ar-stage');
    const pos = (id, dy) => { const el = $('#ft' + id + ' .arsp') || $('#ft' + id); if (!el || !stage) return { x: 100, y: 100 }; const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect(); return { x: r.left - s.left + r.width / 2, y: r.top - s.top + (dy == null ? 26 : dy) }; };   // 2C.6: a partir do retrato, longe do nome
    const pop = (id, txt, cls, extra) => { if (!fxEl) return; const p = pos(id, cls === 'arsk' ? 2 : null), b = document.createElement('b'); b.textContent = txt; b.className = cls || ''; b.style.left = (p.x + (Math.random() * 14 - 7)) + 'px'; b.style.top = p.y + 'px'; if (extra) for (const k in extra) b.style.setProperty(k, extra[k]); fxEl.appendChild(b); setTimeout(() => b.remove(), 1200); };
    const flash = (id, c, ms) => { const el = $('#ft' + id); if (!el) return; el.classList.add(c); setTimeout(() => el.classList.remove(c), ms || 170); };
    const setHp = (id, hp) => { const b = $('#hb' + id); if (b) b.style.width = Math.max(0, Math.min(100, 100 * hp / mhp[id])) + '%'; };
    const nameOf = (id) => (F[id] ? F[id].name : '');
    const say = (html) => { if (logEl) logEl.innerHTML = html; };
    const apply = (e) => {
      switch (e.k) {
        case 'hit': case 'thorn': case 'dot':
          setHp(e.b, e.hp); flash(e.b, 'hit'); if (e.k === 'hit' && e.a >= 0) flash(e.a, 'atk', 190);
          pop(e.b, G.fmt(e.v) + (e.c ? '!' : ''), e.c ? 'arcr' : e.k === 'thorn' ? 'arsg' : '', null);
          G.sfx(e.c ? 'crit' : 'hit'); break;
        case 'miss': pop(e.b, 'esquivou!', 'arms'); if (e.a >= 0) flash(e.a, 'atk', 190); break;
        case 'shield': pop(e.b, 'escudo', 'arsg'); break;
        case 'heal': setHp(e.b, e.hp); pop(e.b, '+' + G.fmt(e.v), 'arhl'); G.sfx('heal'); break;
        case 'skill': { const cl = G.CLASSES[F[e.a].cls]; pop(e.a, e.n, 'arsk', { '--kc': cl.color || '#e2b659' }); flash(e.a, 'atk', 260); say('<b>' + esc(nameOf(e.a)) + '</b> usa <b>' + esc(e.n) + '</b>!'); G.sfx('boom'); break; }
        case 'buff': pop(e.a, e.n === 'Escudo' ? 'escudo' : '↑ ' + e.n, 'arsg'); break;
        case 'stun': { const el = $('#ft' + e.b); if (el) { el.classList.add('stn'); setTimeout(() => el.classList.remove('stn'), 1800); } pop(e.b, 'atordoado', 'arms'); break; }
        case 'pet': pop(e.a, e.n, e.n === 'Vigor' ? 'arhl' : 'arsg'); break;
        case 'ko': { const el = $('#ft' + e.b); if (el) el.classList.add('ko'); setHp(e.b, 0); say('<b>' + esc(nameOf(e.b)) + '</b> caiu!'); G.sfx('die'); break; }
        default: break;
      }
    };
    const finish = (skipped) => {
      if (!duel || duel.done) return; duel.done = true; cancelAnimationFrame(duel.raf);
      if (skipped) for (const f of F) { setHp(f.id, f.hp); const el = $('#ft' + f.id); if (el) el.classList.toggle('ko', f.hp <= 0); }
      const pg = $('#ar-pg'); if (pg) pg.style.width = '100%';
      const acts = $('#ar-acts'); if (acts) acts.style.visibility = 'hidden';
      duel.to = setTimeout(() => showResult(res), skipped ? 80 : 650);
    };
    const step = (now) => {
      if (!duel || duel.done) return;
      const st = (now - duel.t0) / 1000 * duel.rate;
      while (duel.i < ev.length && ev[duel.i].t <= st) apply(ev[duel.i++]);
      const pg = $('#ar-pg'); if (pg) pg.style.width = Math.min(100, 100 * st / dur) + '%';
      if (duel.i >= ev.length || st > dur + 0.6) return finish(false);
      duel.raf = requestAnimationFrame(step);
    };
    duel.finish = finish;
    duel.raf = requestAnimationFrame(step);
  };
  UI.ACT.arskip = () => { if (duel && !duel.done) duel.finish(true); };
  const showResult = (res) => {
    const box = $('#ar-res'); if (!box) return; UI.modalLock = false;
    const a = G.arena(), win = res.win, lg = G.arenaLeague(a.pts), L = G.ARENA_LEAGUES[lg], nx = G.ARENA_LEAGUES[lg + 1], tk = G.arenaTickets(), dp = res.rank0 - res.rank1;
    const bonus = win ? Math.min(5, res.streak - 1) * 2 : 0;
    G.sfx(win ? 'victory' : 'fall'); if (win) R.shake = Math.max(R.shake || 0, 2);
    box.innerHTML = '<div class="ar-res ' + (win ? 'w' : 'l') + '"><div class="big">' + (win ? 'VITÓRIA' : 'DERROTA') + '</div>' +
      '<div class="sub">' + (win ? 'Aurora venceu ' + esc(res.rival.name) + (res.streak > 1 ? ' · sequência de ' + res.streak : '') + '!' : esc(res.rival.name) + ' levou a melhor. Tente outra formação.') + '</div>' +
      (dp > 0 ? '<div class="up">' + ic('up') + 'Você subiu ' + dp + ' posiç' + (dp > 1 ? 'ões' : 'ão') + '! ' + res.rank0 + 'º → ' + res.rank1 + 'º</div>' : dp < 0 ? '<div class="up dn">Você caiu ' + (-dp) + ' posiç' + (dp < -1 ? 'ões' : 'ão') + ' (' + res.rank1 + 'º)</div>' : '<div class="sub" style="margin:2px 0">Posição: ' + res.rank1 + 'º de 41</div>') +
      '<div class="costs">' + '<span class="cost">' + ic('star') + '+' + res.pts + ' pontos' + (bonus ? ' (sequência +' + bonus + ')' : '') + '</span><span class="cost">' + insIc(14) + '+' + res.ins + (res.ins > 1 ? ' Insígnias' : ' Insígnia') + '</span></div>' +
      '<div class="sub" style="margin-top:6px">' + lgBadge(lg) + ' ' + G.fmt(a.pts) + ' pts' + (nx ? ' · faltam ' + (nx.min - a.pts) + ' para ' + nx.name : '') + '</div>' +
      (res.mvp ? '<div class="mvp">Destaque: <b>' + esc(res.mvp.name) + '</b> · ' + G.fmt(res.mvp.dmg) + ' de dano · duração ' + Math.round(res.t) + ' s de luta</div>' : '') +
      '<div class="acts"><button class="btn" data-a="arback">Voltar à Arena</button>' + (tk.total > 0 ? '<button class="btn pri" data-a="aragain">Duelar de novo (' + tk.total + ')</button>' : '') + '</div></div>';
    void L; if (UI.synResult) UI.synResult(res, box);   // v26 (4B.2): combinação decisiva
    S0().tut.seen.arena = 1;
    UI.arenaWarm(500);                                                  // os próximos adversários ficam prontos, em tarefas curtas, enquanto a cerimônia aparece
    setTimeout(() => { const r = $('.ar-res'); if (r) r.scrollIntoView({ block: 'end', behavior: 'smooth' }); }, 120);
    G.emit('arena', { t: 'result' });
  };
  const S0 = () => G.S;
  /* prepara os adversários do momento sem travar o quadro: um rival por tarefa (≈25–60 ms cada, antes 60–190 ms de uma vez) */
  let warmT = 0;
  UI.arenaWarm = (delay) => {
    if (warmT || !G.S) return;
    const step = () => { warmT = 0; if (!G.S || !G.M.running) return; let done = true; try { done = G.arenaOffersStep(); } catch (e) { console.error(e); } if (done) dirty(); else warmT = setTimeout(step, 24); };
    warmT = setTimeout(step, delay == null ? 30 : delay + 30);
  };
  UI.ACT.arback = () => { UI.closeModal(); view = 'duelo'; UI.open('missoes', 'arena'); };
  UI.ACT.aragain = () => { UI.closeModal(); view = 'duelo'; UI.open('missoes', 'arena'); setTimeout(() => { const o = G.arenaOffers(); if (o.length) teamModal(Math.min(1, o.length - 1)); }, 30); };

  /* ================= fim de temporada ================= */
  const seasonModal = (rec) => {
    const L = G.ARENA_LEAGUES[rec.liga], c = rec.chest;
    const parts = [];
    parts.push({ i: ic('seal'), t: c.selos + (c.selos > 1 ? ' Selos' : ' Selo') }, { i: ic('core'), t: c.nucleos + (c.nucleos > 1 ? ' Núcleos' : ' Núcleo') }, { i: insIc(14), t: c.ins + ' Insígnias' }, { i: '<i class="px ri-po_reforja" style="width:16px;height:16px"></i>', t: c.res.po_reforja + ' Pó de Reforja' });
    if (c.gold) parts.unshift({ i: ic('coin'), t: G.fmt(c.gold) + ' moedas' });
    G.sfx(rec.liga >= 4 ? 'reveal2' : 'reveal');
    UI.modal('<div class="eyebrow">Temporada ' + rec.n + ' · ' + esc(rec.name) + '</div><h2>A temporada terminou</h2>' +
      '<div class="ar-bx" style="--lc:' + L.col + ';--lg:' + rgba(L.col, 0.5) + '">' + lgBadge(rec.liga) + '<div class="ps">' + rec.pos + 'º<small> de 41</small></div><div style="font-size:15px;color:#cfd5e4;margin-top:4px">' + G.fmt(rec.pts) + ' pontos · ' + rec.w + ' vitória' + (rec.w === 1 ? '' : 's') + ' e ' + rec.l + ' derrota' + (rec.l === 1 ? '' : 's') + '</div></div>' +
      '<p class="lead" style="margin:6px 4px 4px">O baú da Liga ' + L.name + ' foi aberto e já está no seu cofre:</p>' + chips(parts) +
      (rec.titulo ? '<div class="ar-res w" style="margin-top:10px"><div class="sub">Título conquistado</div><div class="big" style="font-size:16px;letter-spacing:.06em">' + esc(rec.titulo) + '</div></div>' : '') +
      '<p class="mut" style="text-align:center;font-size:15px;margin-top:8px">Uma nova temporada começou. Os pontos voltaram a zero e a Loja de Insígnias renovou o estoque.</p>' +
      '<div class="acts"><button class="btn pri" data-a="mclose">Para a próxima!</button></div>', { lock: true, onClose: () => { const a = G.arena(); a.pend = null; if (G.M && G.M.save) G.M.save(); } });
  };

  /* ================= fila, avisos e sons ================= */
  const startAt0 = { t: 0 };
  G.on('start', () => { startAt0.t = performance.now(); });
  /* v27 (A2): o fim de temporada não abre janela sozinho: o baú já está no cofre; a cerimônia fica na caixa de pendências (6G) e abre quando o jogador quiser */
  UI.arenaSeason = (rec) => seasonModal(rec);
  G.on('arena', (d) => {
    if (d.t === 'open') { UI.banner('Novidade em Aurora', 'A Arena abriu!', 'Arena das Duas Luas · Missões › Arena'); G.sfx('realm'); UI.arenaSyncTab && UI.arenaSyncTab(); }
    if (d.t === 'duel' || d.t === 'season' || d.t === 'shop' || d.t === 'coin' || d.t === 'ticket' || d.t === 'open') dirty();
  });
  /* asas exclusivas: uma lua pálida e uma lua violeta (desenho próprio) */
  const ws0 = A.wingSheet;
  let moonWings = null;
  A.wingSheet = (id) => {
    if (id !== 'a_arena') return ws0(id);
    if (moonWings) return moonWings;
    moonWings = A.mk(60, 22); const x = moonWings.getContext('2d');
    for (let f = 0; f < 2; f++) {
      const p = new A.Pix(30, 22), up = f ? 0 : 2, INK = '#1a1422';
      p.ell(8, 9 + up, 6.5, 4, '#d8c8ff'); p.tri(2, 9 + up, 14, 10, 4, 18, '#d8c8ff'); for (let i = 0; i < 4; i++) { p.line(4 + i * 3, 11 + up, 3 + i * 3, 17 - i, '#6a58c8'); p.set(3 + i * 3, 18 - i, '#ffe9a0'); }
      p.row(4, 12, 6 + up, '#ffffff'); p.ell(21, 10 + up, 4, 3, '#6a58c8'); p.tri(18, 10 + up, 25, 10, 23, 16, '#6a58c8');
      p.ell(7, 9 + up, 1.6, 1.6, '#fffbe8'); p.ell(21, 10 + up, 1.2, 1.2, '#e8d0ff'); p.set(10, 12 + up, '#ffe9a0'); p.set(5, 14 + up, '#ffe9a0');
      x.drawImage(p.outline(INK).canvas(), f * 30, 0);
    }
    return moonWings;
  };
  /* sons novos da Arena */
  const AU = G.AU;
  if (AU && AU.SFX) AU.SFX.arena = (t) => { AU.tone(147, t, 0.8, 'sawtooth', 0.12); AU.seq([392, 523, 659, 784], 0.1, 'triangle', 0.13, 0.4); };
  UI.arenaTm = () => tm; UI.arenaTmRedraw = () => { if (tm) tmRedraw(); };   // v26 (4B.2): a tela de equipe aceita sugestões da formação
  UI.arenaCard = arenaCard;
  UI.arenaEmblem = emblem; UI.arenaAUR = AUR; UI.arenaDuelModal = duelModal;   // v25: brasões no ranking do Colosso (3-A); duelo reutilizado por 69-ui-rivais (3-B)
})();

;
