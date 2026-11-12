/* 66-ui-lendas: v26 — telas das lendas pessoais: aba Feitos na ficha (Livro de Feitos, linha do tempo e escolha de título), título sob
   o nome, cartão do Herói do Dia no relatório, Poder do Reino no HUD (número que rola), aba Recordes em Mais e a cerimônia dos marcos
   de poder. A simulação mora em 3A-lendas.js. */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const UI = G.UI, A = G.A, R = G.R, ic = UI.ic, esc = UI.esc, $ = UI.$;

  /* ---------- estilo ---------- */
  const css = document.createElement('style');
  css.textContent = `
.ttl{display:inline-flex;align-items:center;gap:4px;max-width:100%;font-family:"Aurora Cinzel",serif;font-size:11.5px;font-weight:700;letter-spacing:.05em;color:var(--gold2);line-height:1.2;vertical-align:middle}
.ttl svg{font-size:12px;color:var(--gold);flex:none}
.ttl em{font-style:normal;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.ttl.sm{display:flex;justify-content:center;font-size:10px;letter-spacing:.03em;margin-top:1px}
.ttl.none{font-family:inherit;font-style:italic;font-weight:700;letter-spacing:0;color:var(--mut);font-size:11px}
.ttl.none svg{color:var(--mut)}
button.ttl{padding:4px 0 0;text-align:left;font-size:12px}
.ttl-bn{display:block;margin-top:4px}
.fe-cur{display:flex;align-items:center;gap:10px}.fe-cur .btn{flex:none}
.fe-cur .ti{flex:none;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;font-size:21px;color:#1a1408;background:linear-gradient(180deg,#f7dc92,#d8a544);box-shadow:0 0 14px rgba(247,220,146,.35)}
.fe-cur.none .ti{color:var(--mut);background:rgba(255,255,255,.07);box-shadow:none}
.fe-cur h3{font-family:"Aurora Cinzel",serif;letter-spacing:.04em;font-size:15px}
.fe-cur .bn{color:var(--good);font-weight:800;font-size:11.5px;margin-top:2px}
.fe-g .stat{padding:6px 9px}.fe-g .stat b{font-size:15px;display:block;margin-top:1px}
.fe-g .stat.hi{box-shadow:inset 0 0 0 1px rgba(226,182,89,.4);background:rgba(226,182,89,.09)}
.tll{position:relative;margin:4px 0 0 7px;padding-left:15px;border-left:2px solid var(--line)}
.tll .e{position:relative;padding:4px 0 6px;font-size:12.5px;line-height:1.35;color:#dfe4f2}
.tll .e::before{content:"";position:absolute;left:-21px;top:9px;width:9px;height:9px;border-radius:50%;background:var(--gold);box-shadow:0 0 0 3px rgba(226,182,89,.18)}
.tll .e:first-child::before{background:#fff3c4;box-shadow:0 0 0 3px rgba(247,220,146,.35),0 0 10px rgba(247,220,146,.7)}
.tll .e b{color:var(--gold);font-weight:800;margin-right:3px;white-space:nowrap}
.tll .e.t b{color:#fff3c4}
.tt{display:flex;align-items:center;gap:10px;padding:9px 10px;margin-bottom:6px;border-radius:13px;border:1px solid var(--line2);background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02))}
.tt .ti{flex:none;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;font-size:17px;background:rgba(255,255,255,.07);color:var(--mut)}
.tt.has .ti{background:linear-gradient(180deg,#f7dc92,#d8a544);color:#1a1408}
.tt.on{border-color:var(--gold);background:linear-gradient(180deg,rgba(226,182,89,.16),rgba(226,182,89,.04));box-shadow:0 0 14px rgba(226,182,89,.18)}
.tt .gr{flex:1;min-width:0}
.tt b{display:block;font-family:"Aurora Cinzel",serif;font-size:13px;letter-spacing:.03em;line-height:1.2}
.tt .bn{display:block;color:var(--good);font-weight:800;font-size:11px;margin-top:1px}
.tt:not(.has) .bn{color:#7e8aa6}
.tt p{margin:2px 0 0;font-size:11.5px;color:var(--mut);line-height:1.3}
.tt .bar{height:4px;margin-top:5px}
.tt .pr{display:flex;justify-content:space-between;gap:6px;font-size:10.5px;font-weight:800;color:var(--mut);margin-top:3px}
.tt .btn{flex:none;min-width:68px;min-height:36px}
.fe-more{width:100%;margin-top:2px}
.hod{position:relative;overflow:hidden;border-color:var(--gold);background:linear-gradient(180deg,rgba(226,182,89,.2),rgba(226,182,89,.04) 70%)}
.hod::after{content:"";position:absolute;top:0;bottom:0;width:36%;left:-50%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.14),transparent);animation:hodsh 4.5s ease-in-out infinite;pointer-events:none}
@keyframes hodsh{0%,60%{left:-50%}100%{left:130%}}
.hod .row{align-items:center;gap:10px}
.hod .hp{flex:none;width:58px;height:58px;border-radius:14px;border:2px solid var(--gold);background-color:rgba(0,0,0,.3);background-size:50px 50px;box-shadow:0 0 14px rgba(226,182,89,.4)}
.hod .k{font-family:"Aurora Cinzel",serif;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--gold)}
.hod h3{font-size:16px;margin-top:1px}
.hod .why{color:#e8ecf8;font-size:12.5px;margin-top:8px}
.hod .q{margin-top:6px;padding:6px 10px;border-left:3px solid var(--gold);background:rgba(0,0,0,.2);border-radius:0 10px 10px 0;color:#f3e6bd;font-style:italic;font-size:12.5px;line-height:1.4}
.hod .st{font-size:11px;color:var(--mut);margin-top:6px}
.toast.hodt{align-items:flex-start;animation:tin .25s ease-out,tout .4s ease-in 5.2s forwards}
.toast.hodt .hodp{width:38px;height:38px;border-radius:10px;border:2px solid var(--gold);background-color:rgba(0,0,0,.3);background-size:32px 32px;flex:none}
.toast.hodt span{display:block;line-height:1.3}.toast.hodt small{color:#cfd5e4;font-weight:700;font-size:11.5px}
.toast.hodt b{color:var(--gold2)}
/* Poder do Reino no HUD */
@media (max-height:640px) and (max-width:859px){#toasts{top:calc(var(--sat) + 206px)}}
.pwr{position:relative;display:inline-flex;align-items:center;gap:5px;flex:none;height:26px;padding:0 9px 0 7px;border-radius:13px;font-size:12px;font-weight:900;color:#ffe9a0;border-color:rgba(226,182,89,.5);overflow:visible}
.pwr svg{font-size:13px;color:var(--gold)}
.pwr b{font-variant-numeric:tabular-nums;letter-spacing:.01em;min-width:2ch}
.pwr .pb{position:absolute;left:9px;right:9px;bottom:2px;height:2px;border-radius:2px;background:rgba(255,255,255,.12);overflow:hidden}
.pwr .pb i{display:block;height:100%;width:0;background:linear-gradient(90deg,#d8a544,#fff3c4);transition:width .4s}
.pwr::after{content:"";position:absolute;inset:-7px -3px}
.pwr.up{animation:pwup .9s ease-out}
.pwr.big{animation:pwbig 1.8s ease-out}
@keyframes pwup{0%{box-shadow:0 0 0 rgba(255,233,160,0);color:#fff}25%{box-shadow:0 0 16px rgba(255,233,160,.85);color:#fff;transform:scale(1.07)}100%{box-shadow:0 6px 18px rgba(0,0,0,.35)}}
@keyframes pwbig{0%{transform:scale(1)}12%{transform:scale(1.28);box-shadow:0 0 26px rgba(255,233,160,1)}30%{transform:scale(1.1);box-shadow:0 0 22px rgba(255,233,160,.8)}100%{transform:scale(1);box-shadow:0 6px 18px rgba(0,0,0,.35)}}
.pwd{position:absolute;left:50%;top:100%;transform:translateX(-50%);font-size:11px;font-weight:900;color:#fff3c4;text-shadow:0 0 8px rgba(255,211,90,.9),0 1px 2px #000;pointer-events:none;opacity:0;white-space:nowrap}
.pwd.go{animation:pwd 1.3s ease-out}
@keyframes pwd{0%{opacity:0;transform:translate(-50%,-4px)}15%{opacity:1}100%{opacity:0;transform:translate(-50%,14px)}}
/* tela de recordes */
.pw-card{text-align:center;padding-bottom:12px}
.pw-card .k{font-family:"Aurora Cinzel",serif;font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--gold)}
.pw-card .v{font-family:"Aurora Cinzel",serif;font-size:36px;font-weight:700;line-height:1.1;margin:2px 0 6px;background:linear-gradient(180deg,#fff7d0,#e2b659 70%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 12px rgba(226,182,89,.4))}
.pw-card .pp{display:flex;flex-wrap:wrap;gap:5px;justify-content:center}
.pw-card .nx{margin-top:10px;text-align:left}
.pw-card .nx .r{display:flex;justify-content:space-between;gap:8px;font-size:12px;font-weight:800;margin-bottom:4px}
.pw-card .nx .r span{color:var(--mut)}
.rc-row{display:flex;align-items:center;gap:10px;padding:9px 10px;margin-bottom:6px;border-radius:13px;border:1px solid var(--line2);background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02))}
.rc-row .ti{flex:none;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;font-size:17px;background:linear-gradient(180deg,#f7dc92,#d8a544);color:#1a1408}
.rc-row.none .ti{background:rgba(255,255,255,.07);color:var(--mut)}
.rc-row .gr{flex:1;min-width:0}
.rc-row small{display:block;color:var(--mut);font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
.rc-row b{display:block;font-size:14px;line-height:1.25;overflow:hidden;text-overflow:ellipsis}
.rc-row .wh{flex:none;text-align:right;font-size:11px;color:var(--mut);font-weight:700;max-width:38%;line-height:1.3}
.rc-row .wh em{display:block;font-style:normal;color:#cfd5e4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mk{display:flex;align-items:center;gap:9px;padding:7px 10px;margin-bottom:5px;border-radius:11px;background:rgba(255,255,255,.04);font-size:12.5px}
.mk .ck{flex:none;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:13px;background:linear-gradient(180deg,#f7dc92,#d8a544);color:#1a1408}
.mk.nx .ck{background:rgba(255,255,255,.08);color:var(--mut)}
.mk b{flex:1;font-variant-numeric:tabular-nums}
.mk small{color:var(--mut);font-weight:700;font-size:11px}
.mk .costs{margin:0}
/* cerimônia do marco */
#pflash{position:absolute;inset:0;z-index:70;pointer-events:none;opacity:0;background:radial-gradient(circle at 50% 40%,rgba(255,247,208,.95) 0%,rgba(226,182,89,.55) 34%,transparent 78%)}
#pflash.on{animation:pfl 1.2s ease-out}
@keyframes pfl{0%{opacity:0}12%{opacity:.85}100%{opacity:0}}
.pm{text-align:center;position:relative}
.pm .crown{display:grid;place-items:center;margin:6px auto 0;width:84px;height:84px;font-size:54px;color:#fff3c4;filter:drop-shadow(0 0 16px rgba(255,211,90,.9));animation:pmc 1.4s ease-in-out infinite alternate}
@keyframes pmc{from{transform:scale(.94) rotate(-2deg)}to{transform:scale(1.08) rotate(2deg)}}
.pm .num{font-family:"Aurora Cinzel",serif;font-size:42px;font-weight:700;line-height:1.1;background:linear-gradient(180deg,#fff7d0,#e2b659 70%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 14px rgba(226,182,89,.55));font-variant-numeric:tabular-nums}
.pm .costs{justify-content:center;margin:10px 0 4px}
.pm .nx{color:var(--mut);font-size:11.5px;margin-top:8px}
.pm .sp{position:absolute;left:50%;top:92px;width:var(--s);height:var(--s);margin:-2px;border-radius:50%;background:#ffe9a0;box-shadow:0 0 9px #ffd35a;opacity:0;pointer-events:none;animation:pms 1.7s ease-out var(--d) forwards}
@keyframes pms{0%{opacity:1;transform:translate(0,0) scale(1.2)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.2)}}
`;
  document.head.appendChild(css);

  /* ---------- peças pequenas ---------- */
  const LBL = { hp: 'vida', atk: 'ataque', def: 'defesa', crit: 'crítico', eva: 'esquiva', aspd: 'vel. de ataque', spd: 'movimento', cdr: 'recarga mais rápida', critDmg: 'dano crítico', gold: 'moedas', drop: 'espólio', xp: 'experiência', heal: 'cura', elite: 'dano em elites e chefes', thorns: 'dano devolvido', mood: 'ânimo natural' };
  const bonusTxt = (p) => { const a = []; for (const k in p) a.push('+' + Math.round(p[k] * 100) + '% ' + (LBL[k] || k)); return a.join(' · '); };
  UI.titleBonus = bonusTxt;
  const heroOf = (id) => G.S.heroes.find((x) => x.id === +id);
  const dirty = () => { if (UI.sheet) UI.sheetDirty(); };

  /* título sob o nome. mini: versão de uma linha (cartão da lista de heróis); sem mini, vira atalho para a aba Feitos */
  UI.hTitle = (x, mini) => {
    const t = G.titleOf(x);
    if (mini) return t ? '<span class="ttl sm">' + ic('trophy') + '<em>' + esc(t.name) + '</em></span>' : '';
    if (t) return '<button class="ttl" data-a="htab:feitos" title="Trocar de título">' + ic('trophy') + '<em>' + esc(t.name) + '</em></button>';
    return '<button class="ttl none" data-a="htab:feitos">' + ic('trophy') + '<em>Sem título · veja o Livro de Feitos</em></button>';
  };

  /* ---------- aba Feitos (Livro de Feitos) ---------- */
  let showAll = false;
  const tile = (V, label, fn, hi) => '<div class="stat' + (hi ? ' hi' : '') + '"><small>' + label + '</small><b>' + V.T(fn) + '</b></div>';
  UI.feitosTab = (x) => {
    const V = UI.vw(), f = G.feitos(x), cur = G.titleOf(x), n = G.TITLES.length, have = G.titleCount(x);
    let h = '';
    /* título exibido */
    h += '<div class="card hl"><div class="fe-cur' + (cur ? '' : ' none') + '"><span class="ti">' + ic('trophy') + '</span><div class="gr"><small class="mut" style="font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase">Título exibido</small>' +
      (cur ? '<h3>' + esc(cur.name) + '</h3><div class="bn">' + bonusTxt(cur.p) + '</div>' : '<h3 style="color:var(--mut)">Sem título</h3><div class="mut" style="font-size:11.5px">' + (have ? 'Escolha um dos ' + have + ' títulos abaixo.' : 'Os feitos de ' + esc(x.name) + ' viram títulos.') + '</div>') +
      '</div>' + (cur ? '<button class="btn sm" data-a="ttl:' + x.id + ':">Tirar</button>' : '') + '</div></div>';
    /* números */
    h += '<div class="sec">Livro de Feitos</div><div class="grid2 fe-g">' +
      tile(V, 'Dias a serviço', () => G.heroDays(x)) + tile(V, 'Abates', () => G.fmt(x.kills)) +
      tile(V, 'Elites', () => G.fmt(f.el)) + tile(V, 'Chefes', () => G.fmt(f.bs)) +
      tile(V, 'Maior golpe', () => (f.mh ? G.fmt(f.mh) : '—')) + tile(V, 'Quedas', () => G.fmt(x.falls)) +
      tile(V, 'Relíquias', () => G.fmt(f.rl)) + tile(V, 'Vitórias / duelos', () => f.dw + ' / ' + f.dp) +
      tile(V, 'Maior andar da Fenda', () => (f.fl ? 'Andar ' + f.fl : '—')) + tile(V, 'Moedas gastas na cidade', () => G.fmt(f.sp)) + '</div>';
    /* linha do tempo */
    h += '<div class="sec">Linha do tempo</div>';
    const tl = f.tl.slice(-10).reverse();
    h += tl.length ? '<div class="card"><div class="tll">' + tl.map((e) => '<div class="e' + (/título/.test(e.t) ? ' t' : '') + '"><b>Dia ' + e.d + ' —</b>' + esc(e.t) + '</div>').join('') + '</div></div>' : '<div class="empty">Os marcos de ' + esc(x.name) + ' aparecem aqui.</div>';
    /* títulos */
    h += '<div class="sec">Títulos · ' + have + ' de ' + n + '</div>';
    const all = G.TITLES.map((t) => ({ t, p: G.titleProgress(x, t) }));
    const mine = all.filter((q) => q.p.have).sort((a, b) => (b.t.id === f.ts) - (a.t.id === f.ts) || f.ti[b.t.id] - f.ti[a.t.id]);
    const locked = all.filter((q) => !q.p.have).sort((a, b) => (a.t.manual ? 1 : 0) - (b.t.manual ? 1 : 0) || b.p.pct - a.p.pct);
    const shown = showAll ? locked : locked.slice(0, 4);
    for (const q of mine) {
      const t = q.t, on = f.ts === t.id;
      h += '<div class="tt has' + (on ? ' on' : '') + '"><span class="ti">' + ic('trophy') + '</span><div class="gr"><b>' + esc(t.name) + '</b><span class="bn">' + bonusTxt(t.p) + '</span><p>' + t.d + '</p></div>' +
        (on ? '<span class="pill gold">' + ic('check') + 'Exibido</span>' : '<button class="btn sm pri" data-a="ttl:' + x.id + ':' + t.id + '">Exibir</button>') + '</div>';
    }
    for (const q of shown) {
      const t = q.t;
      h += '<div class="tt"><span class="ti">' + ic('lock') + '</span><div class="gr"><b>' + esc(t.name) + '</b><span class="bn">' + bonusTxt(t.p) + '</span><p>' + t.d + '</p>' +
        (t.manual ? '' : '<div class="bar"><i ' + V.W(() => G.titleProgress(x, t).pct) + '></i></div><div class="pr"><span>' + V.T(() => G.fmt(G.titleProgress(x, t).cur) + ' / ' + G.fmt(t.need)) + '</span></div>') + '</div></div>';
    }
    if (locked.length > 4) h += '<button class="btn sm fe-more" data-a="ttlall">' + (showAll ? 'Mostrar só os mais próximos' : 'Ver todos os títulos (' + (locked.length - 4) + ' a mais)') + '</button>';
    h += '<p class="mut" style="font-size:11.5px;text-align:center;margin-top:8px">Só o título exibido dá bônus. Toque em Exibir para trocar quando quiser.</p>';
    return h;
  };
  Object.assign(UI.ACT, {
    ttl: (a) => {
      const x = heroOf(a[0]); if (!x) return;
      const id = a[1] || ''; if (!G.titleSet(x, id)) return UI.toast('Esse título ainda não é dele.', 'bad');
      if (id) { UI.toast(x.name + ' agora é «' + G.titleDef(id).name + '».', 'good', 'trophy'); G.sfx('buy'); }
      dirty();
    },
    ttlall: () => { showAll = !showAll; dirty(); },
  });
  /* a lista muda sozinha: títulos, marcos e recordes pedem redesenho do painel aberto */
  for (const ev of ['titulo', 'hod', 'recorde', 'pmark']) G.on(ev, dirty);

  /* ---------- cartão do Herói do Dia (dentro do Livro-caixa do Reino) ---------- */
  UI.hodCard = () => {
    const L = G.lendas(), d = L.hod; if (!d) return '';
    const live = heroOf(d.id), look = A.heroLook(live || d.lk), url = A.portrait(look), t = live ? G.titleOf(live) : d.ti ? G.titleDef(d.ti) : null;
    const st = d.st, bits = [st.k + (st.k === 1 ? ' abate' : ' abates')]; if (st.el) bits.push(st.el + (st.el === 1 ? ' elite' : ' elites')); if (st.bs) bits.push(st.bs + (st.bs === 1 ? ' chefe' : ' chefes')); if (st.dw) bits.push(st.dw + (st.dw === 1 ? ' duelo vencido' : ' duelos vencidos')); if (st.g) bits.push(G.fmt(st.g) + ' moedas');
    return '<div class="card hod"><div class="row"><i class="hp px" style="background-image:url(' + url + ')"></i><div class="gr"><div class="k">Herói do Dia · Dia ' + d.d + '</div><h3>' + esc(d.name) + '</h3>' + (t ? '<span class="ttl sm" style="justify-content:flex-start">' + ic('trophy') + '<em>' + esc(t.name) + '</em></span>' : '') + '</div></div>' +
      '<p class="why">' + esc(d.name) + ' ' + esc(d.txt) + '.</p><div class="q">“' + esc(d.q) + '”</div><div class="st">' + bits.join(' · ') + '</div>' +
      '<div class="costs"><span class="cost">' + ic('star') + '+' + G.fmt(d.xp) + ' de experiência</span><span class="cost">' + ic('smile') + 'Ânimo cheio</span></div></div>';
  };
  const R0 = UI.SHEETS && UI.SHEETS.reino;
  if (R0) {
    const rr0 = R0.render;
    R0.render = function (tab, sub) {
      const h = rr0.call(R0, tab, sub);
      if (tab !== 'geral') return h;
      const k = '<div class="sec">Livro-caixa de ontem</div>', card = UI.hodCard();
      return card ? h.replace(k, k + card) : h;
    };
  }
  /* aviso com retrato: entra na mesma pilha dos outros avisos, nunca como janela */
  G.on('hod', (d) => {
    const box = $('#toasts'); if (!box) return;
    while (box.children.length >= 3) box.firstChild.remove();
    const t = document.createElement('div'); t.className = 'toast epic hodt';
    t.innerHTML = '<i class="hodp px" style="background-image:url(' + A.portrait(A.heroLook(d.lk)) + ')"></i><span><b>Herói do Dia: ' + esc(d.name) + '</b><br><small>' + esc(d.name) + ' ' + esc(d.txt) + '. Ânimo cheio e experiência de prêmio.</small></span>';
    box.appendChild(t); setTimeout(() => t.remove(), 5700); G.sfx('heroi');
  });

  /* ---------- Poder do Reino no HUD ---------- */
  const bd1 = UI.build;
  UI.build = () => {
    bd1();
    const row = $('#hudx');
    if (row && !$('#pwr')) row.insertAdjacentHTML('afterbegin', '<button class="pwr glass" id="pwr" data-a="open:mais:recordes" title="Poder do Reino">' + ic('crown') + '<b id="pwv">0</b><span class="pwd" id="pwd"></span><span class="pb"><i id="pwb"></i></span></button>');
    shown = target = 0;
  };
  let shown = 0, target = 0, tw = null, lastUp = 0;
  const paint = () => { const el = $('#pwv'); if (el) el.textContent = G.fmt(Math.round(shown)); };
  const step = (ts) => {
    if (!tw) return;
    const k = Math.min(1, (ts - tw.t0) / tw.dur), e = 1 - Math.pow(1 - k, 3);
    shown = tw.a + (tw.b - tw.a) * e; paint();
    if (k < 1) requestAnimationFrame(step); else { shown = tw.b; tw = null; paint(); }
  };
  const setPower = (P) => {
    const chip = $('#pwr'); if (!chip) return;
    if (!target) { shown = target = P; paint(); return; }
    if (P === target) return;
    const from = shown, delta = P - target; target = P;
    if (P < from) { tw = null; shown = P; paint(); return; }
    const now = performance.now();
    tw = { a: from, b: P, t0: now, dur: Math.min(1400, 520 + Math.sqrt(delta) * 14) };
    requestAnimationFrame(step);
    if (delta >= Math.max(15, P * 0.006) && now - lastUp > 1800) {
      lastUp = now; chip.classList.remove('up'); void chip.offsetWidth; chip.classList.add('up');
      const d = $('#pwd'); if (d) { d.textContent = '+' + G.fmt(delta); d.classList.remove('go'); void d.offsetWidth; d.classList.add('go'); }
    }
  };
  const refreshHud = () => {
    if (!G.S || !G.S.lendas) return;
    setPower(G.kingPower());
    const b = $('#pwb'); if (b) { const nx = G.nextPowerMark(), w = Math.round(nx.pct * 100) + '%'; if (b.style.width !== w) b.style.width = w; }
  };
  G.on('start', () => { shown = target = 0; });

  /* ---------- aba Recordes (Mais) ---------- */
  const recTab = () => {
    const V = UI.vw(), S = G.S, L = G.lendas(), pw = L.pw, nx = G.nextPowerMark();
    const P = G.kingPowerParts(true);
    const rw = (r) => '<div class="costs" style="margin-top:4px">' + (r.nucleos ? '<span class="cost">' + ic('core') + r.nucleos + '</span>' : '') + (r.selos ? '<span class="cost">' + ic('seal') + r.selos + '</span>' : '') + '<span class="cost"><i class="px ri-po_reforja" style="width:16px;height:16px"></i>' + r.po + '</span></div>';
    let h = '<div class="card hl pw-card"><div class="k">Poder do Reino</div><div class="v">' + V.T(() => G.fmtFull(G.kingPower())) + '</div>' +
      '<div class="pp"><span class="pill">' + ic('people') + 'Heróis <b>' + V.T(() => G.fmt(G.kingPowerParts().h)) + '</b></span><span class="pill">' + ic('castle') + 'Construções <b>' + V.T(() => G.fmt(G.kingPowerParts().b)) + '</b></span><span class="pill">' + ic('seal') + 'Bênçãos <b>' + V.T(() => G.fmt(G.kingPowerParts().s)) + '</b></span>' + (P.w ? '<span class="pill">' + ic('hammer') + 'Obras <b>' + V.T(() => G.fmt(G.kingPowerParts().w)) + '</b></span>' : '') + '</div>' +
      '<div class="nx"><div class="r"><b>Próximo marco: ' + G.fmtFull(nx.v) + '</b><span>' + V.T(() => 'faltam ' + G.fmt(Math.max(0, nx.v - G.kingPower()))) + '</span></div><div class="bar big"><i ' + V.W(() => Math.round(G.nextPowerMark().pct * 100)) + '></i></div>' + rw(nx.rw) + '</div></div>';
    h += '<div class="sec">Recordes</div>';
    for (const k of G.RECS_ORDER) {
      const d = G.RECS[k], r = L.rec[k];
      h += '<div class="rc-row' + (r ? '' : ' none') + '"><span class="ti">' + ic(d.icon) + '</span><div class="gr"><small>' + d.name + '</small><b' + (k === 'item' && r && r.rar != null ? ' class="rar' + r.rar + '"' : '') + '>' + (r ? esc(G.recText(k, r)) : 'Ainda sem marca') + '</b></div>' + (r ? '<div class="wh">' + (r.w ? '<em>' + esc(r.w) + '</em>' : '') + 'Dia ' + r.d + '</div>' : '') + '</div>';
    }
    h += '<div class="sec">Marcos de poder</div>';
    const done = pw.at.slice(-5).reverse();
    for (let i = nx.i; i < nx.i + 3; i++) h += '<div class="mk nx"><span class="ck">' + ic('lock') + '</span><b>' + G.fmtFull(G.powerMark(i)) + '</b>' + rw(G.powerPrize(i)).replace('margin-top:4px', 'margin-top:0') + '</div>';
    for (const [i, d] of done) h += '<div class="mk"><span class="ck">' + ic('check') + '</span><b>' + G.fmtFull(G.powerMark(i)) + '</b><small>Dia ' + d + '</small></div>';
    if (pw.back) h += '<p class="mut" style="font-size:11.5px;text-align:center;margin-top:6px">' + pw.back + (pw.back === 1 ? ' marco já estava alcançado' : ' marcos já estavam alcançados') + ' quando o Poder do Reino foi criado.</p>';
    return h;
  };
  const M0 = UI.SHEETS && UI.SHEETS.mais;
  if (M0) {
    const mr0 = M0.render;
    M0.render = function (tab, sub) { return tab === 'recordes' ? recTab() : mr0.call(M0, tab, sub); };
    const k = M0.tabs.findIndex((t) => t[0] === 'opcoes');
    M0.tabs.splice(k < 0 ? M0.tabs.length : k, 0, ['recordes', 'Recordes']);
  }

  /* ---------- cerimônia dos marcos de poder ---------- */
  const FLV = ['Aurora é mais forte do que ontem, e muito mais do que no primeiro dia.', 'Nas muralhas, os guardas já falam do reino em voz alta.', 'As Duas Luas parecem mais perto de quem não desiste.', 'Os viajantes que passam pela estrada reparam: este reino não dorme.', 'Cada herói, cada pedra, cada bênção: tudo soma, e a soma cresce.', 'A Fenda ouviu. Está calada, o que é raro.'];
  let Q = [], cur = null;
  const flash = () => { let f = $('#pflash'); if (!f) { f = document.createElement('div'); f.id = 'pflash'; ($('#app') || document.body).appendChild(f); } f.className = ''; void f.offsetWidth; f.className = 'on'; };
  const roll = (el, to, ms) => { const t0 = performance.now(); const st = (ts) => { const k = Math.min(1, (ts - t0) / ms); if (!el.isConnected) return; el.textContent = G.fmtFull(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(st); }; requestAnimationFrame(st); };
  const showMark = (d) => {
    const nx = G.nextPowerMark(), rw = d.rw, parts = [];
    for (let i = 0; i < 16; i++) { const a = Math.random() * 6.283, r = 70 + Math.random() * 120; parts.push('<i class="sp" style="--dx:' + Math.round(Math.cos(a) * r) + 'px;--dy:' + Math.round(Math.sin(a) * r * 0.8) + 'px;--s:' + (3 + Math.floor(Math.random() * 4)) + 'px;--d:' + (Math.random() * 0.4).toFixed(2) + 's"></i>'); }
    cur = d;
    flash(); if (R) R.shake = Math.max(R.shake || 0, 3);
    UI.modal('<div class="pm"><div class="eyebrow">Marco de poder</div><div class="crown">' + ic('crown') + '</div>' + parts.join('') + '<h2>Poder do Reino</h2><div class="num" id="pm-n">0</div>' +
      '<p class="lead" style="margin:6px 6px 0">' + esc(FLV[d.i % FLV.length]) + '</p>' +
      '<div class="costs">' + (rw.nucleos ? '<span class="cost">' + ic('core') + '+' + rw.nucleos + (rw.nucleos > 1 ? ' Núcleos' : ' Núcleo') + '</span>' : '') + (rw.selos ? '<span class="cost">' + ic('seal') + '+' + rw.selos + (rw.selos > 1 ? ' Selos' : ' Selo') + '</span>' : '') + '<span class="cost"><i class="px ri-po_reforja" style="width:16px;height:16px"></i>+' + rw.po + ' Pó de Reforja</span></div>' +
      '<div class="nx">Próximo marco: <b style="color:var(--gold2)">' + G.fmtFull(nx.v) + '</b>' + (Q.length ? ' · +' + Q.length + ' na fila' : '') + '</div>' +
      '<div class="acts"><button class="btn pri" data-a="mclose">Continuar</button></div></div>', { pause: false, onClose: () => { cur = null; setTimeout(pump, 400); } });
    const n = $('#pm-n'); if (n) roll(n, d.v, 1100);
  };
  const pump = () => {
    if (Q.length) UI.queueModal(UI.PRIO.cerimonia, () => { if (!Q.length) return false; showMark(Q.shift()); }, 'marcos');
  };
  G.on('pmark', (d) => { Q.push(d); const chip = $('#pwr'); if (chip) { chip.classList.remove('big', 'up'); void chip.offsetWidth; chip.classList.add('big'); } setTimeout(pump, 500); });
  G.on('start', () => { Q = []; cur = null; });
  UI.markTest = (i) => { Q.push({ i: i || 0, v: G.powerMark(i || 0), rw: G.powerPrize(i || 0) }); pump(); };   // para testes e capturas

  /* a lista de Feitos aberta se atualiza sozinha (marcos novos chegam sem evento) */
  let feSig = '';
  const feitosWatch = () => {
    const s = UI.sheet; if (!s || s.name !== 'herois' || !s.sub || s.sub.ht !== 'feitos') { feSig = ''; return; }
    const x = heroOf(s.sub.hero); if (!x || !x.feitos) return;
    const sig = x.feitos.tl.length + '|' + Object.keys(x.feitos.ti).length + '|' + x.feitos.ts;
    if (feSig && sig !== feSig) UI.sheetDirty();
    feSig = sig;
  };

  const rf1 = UI.refresh;
  UI.refresh = () => { rf1(); refreshHud(); pump(); feitosWatch(); };

  /* sons */
  const AU = G.AU;
  if (AU && AU.SFX) {
    const S = AU.SFX, tone = AU.tone, seq = AU.seq;
    S.titulo = (t) => { seq([784, 988, 1319], 0.08, 'triangle', 0.14, 0.4); tone(2093, t + 0.22, 0.4, 'sine', 0.07); };
    S.recorde = () => seq([659, 880, 1175, 1568], 0.055, 'square', 0.06, 0.22);
    S.heroi = (t) => { seq([523, 659, 784, 1047], 0.1, 'triangle', 0.15, 0.45); tone(262, t, 0.9, 'sine', 0.12); };
    S.marco = (t) => { [262, 330, 392, 523].forEach((f) => tone(f, t, 1.3, 'triangle', 0.09)); seq([523, 659, 784, 1047, 1319, 1568], 0.09, 'triangle', 0.14, 0.55); };
  }
})();

;
