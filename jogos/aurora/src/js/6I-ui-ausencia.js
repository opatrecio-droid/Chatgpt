/* 6I-ui-ausencia: v27 (A1) — a tela de espera do tempo ausente ("Enquanto você esteve fora…", com barra de progresso e o dia do reino avançando) e a
   limpeza de tudo o que está aberto antes de simular. A simulação mora em 3J-ausencia.js; o laço de quadros em 90-main.js (M.runAway).
   O resumo do retorno (UI.offlineModal) é a janela de 62-ui-modals, com as cartas (64) e as notícias dos rivais (69) no mesmo fluxo. */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const UI = G.UI, $ = UI.$;

  const css = document.createElement('style');
  css.textContent = [
    '#away{position:absolute;inset:0;z-index:60;display:none;flex-direction:column;align-items:center;justify-content:center;padding:24px;background:radial-gradient(130% 90% at 50% 12%,#243066 0%,#121836 42%,#080b18 100%);overflow:hidden;opacity:1;transition:opacity .45s}',
    '#away.on{display:flex}#away.out{opacity:0;pointer-events:none}',
    '#away .aw-st{position:absolute;inset:0;background-image:radial-gradient(1.5px 1.5px at 12% 18%,#fff 50%,transparent),radial-gradient(1px 1px at 28% 40%,#fff 50%,transparent),radial-gradient(1.5px 1.5px at 44% 12%,#cfe 50%,transparent),radial-gradient(1px 1px at 62% 30%,#fff 50%,transparent),radial-gradient(1px 1px at 78% 52%,#fff 50%,transparent),radial-gradient(1.5px 1.5px at 88% 34%,#fdf 50%,transparent),radial-gradient(1px 1px at 20% 70%,#fff 50%,transparent),radial-gradient(1.5px 1.5px at 70% 78%,#cfe 50%,transparent);animation:tw 3.2s ease-in-out infinite alternate}',
    '#away .aw-m{position:absolute;border-radius:50%}',
    '#away .aw-m1{width:96px;height:96px;right:10%;top:9%;background:radial-gradient(circle at 35% 35%,#fffbe8,#e8dcb8 60%,#b8a880);box-shadow:0 0 60px rgba(255,240,190,.35)}',
    '#away .aw-m2{width:42px;height:42px;right:36%;top:17%;background:radial-gradient(circle at 35% 35%,#e8d0ff,#a880e8 60%,#6a48b0);box-shadow:0 0 40px rgba(180,130,255,.4)}',
    '#away .aw-hill{position:absolute;left:-60%;right:-60%;bottom:-4%;height:20%;background:#060914;border-radius:50% 50% 0 0/100% 100% 0 0}',
    '#away .aw-in{position:relative;z-index:2;width:min(100%,340px);display:flex;flex-direction:column;align-items:center;text-align:center}',
    '#away .aw-eb{font-family:"Aurora Cinzel",serif;color:var(--gold);letter-spacing:.26em;font-size:11px;text-transform:uppercase}',
    '#away h2{font-family:"Aurora Cinzel",serif;font-size:28px;letter-spacing:.05em;margin:8px 0 18px;background:linear-gradient(180deg,#fffbe0,#e2b659 60%,#a87a2a);-webkit-background-clip:text;background-clip:text;color:transparent}',
    '#away .aw-day{display:flex;align-items:baseline;justify-content:center;gap:8px;margin-bottom:12px;color:#c8d0e4}',
    '#away .aw-day small{font-family:"Aurora Cinzel",serif;letter-spacing:.2em;text-transform:uppercase;font-size:11px;color:var(--gold)}',
    '#away .aw-day b{font-family:"Aurora Cinzel",serif;font-size:44px;line-height:1;color:var(--gold2);min-width:1.4em;text-shadow:0 0 22px rgba(247,220,146,.45)}',
    '#away .aw-day span{font-size:14px;font-weight:800;color:var(--mut);min-width:3.4em;text-align:left}',
    '#away .aw-bar{width:100%;height:8px;border-radius:5px;background:rgba(255,255,255,.1);overflow:hidden}',
    '#away .aw-bar i{display:block;height:100%;width:0;border-radius:5px;background:linear-gradient(90deg,#d8a544,#fff3c4)}',
    '#away p{color:#c8d0e4;font-size:13px;line-height:1.45;margin:14px 0 4px;min-height:2.9em}',
    '#away .aw-n{color:#7e89a6;font-size:11.5px;font-weight:700}',
    '.mbox.rt .acts{position:sticky;bottom:-16px;margin:8px -16px -16px;padding:12px 16px 16px;background:linear-gradient(180deg,rgba(16,21,42,0),#10152a 32%);z-index:3}',
    '.rtr{text-align:center;color:var(--mut);font-size:11px;line-height:1.4;margin:0 6px 12px}',
    '.rtl{margin:0;padding:0 0 0 2px;list-style:none;font-size:12.5px;line-height:1.4;color:#d8deec}',
    '.rtl li{position:relative;padding:3px 0 3px 14px}.rtl li::before{content:"";position:absolute;left:2px;top:.75em;width:6px;height:6px;border-radius:50%;background:var(--gold)}',
  ].join('\n');
  document.head.appendChild(css);

  const TIPS = ['Os heróis caçam nas zonas abertas e voltam para entregar o espólio.', 'As fazendas, a lenharia e a pedreira trabalham no expediente.', 'Os moradores vivem os dias e as noites da cidade.', 'As decisões simples são tomadas pelo caminho seguro.', 'A Maré da Fenda, se vier, encontra os heróis de prontidão.'];
  let el = null, lastTip = -1;
  const ensure = () => {
    if (el && el.isConnected) return el;
    el = document.createElement('div'); el.id = 'away';
    el.innerHTML = '<div class="aw-st"></div><div class="aw-m aw-m1"></div><div class="aw-m aw-m2"></div><div class="aw-hill"></div><div class="aw-in"><div class="aw-eb">Enquanto você esteve fora…</div><h2>Aurora segue em frente</h2>' +
      '<div class="aw-day"><small>Dia</small><b id="aw-d">1</b><span id="aw-c">06:00</span></div><div class="aw-bar"><i id="aw-f"></i></div><p id="aw-s"></p><div class="aw-n" id="aw-n"></div></div>';
    ($('#app') || document.body).appendChild(el);
    return el;
  };
  UI.awayShow = (job) => {
    const a = ensure(); a.classList.remove('out'); a.classList.add('on'); lastTip = -1;
    UI.awayUpdate(job);
  };
  UI.awayUpdate = (job) => {
    if (!el) return;
    const S = G.S, f = job.eff > 0 ? Math.min(1, job.done / job.eff) : 1;
    $('#aw-f').style.width = (job.finished ? 100 : Math.round(f * 1000) / 10) + '%';
    $('#aw-d').textContent = S.day; $('#aw-c').textContent = G.clockStr(S.clock);
    const tip = Math.floor(job.done / 1800) % TIPS.length; if (tip !== lastTip) { lastTip = tip; $('#aw-s').textContent = TIPS[tip]; }
    $('#aw-n').textContent = job.finished ? (job.cut ? 'Estimando o restante pelo ritmo medido…' : 'Pronto.') : 'Reino vivido: ' + UI.hm(job.done) + ' de ' + UI.hm(job.eff) + ' (' + Math.round(f * 100) + '%)';
  };
  UI.awayHide = () => { if (!el) return; el.classList.add('out'); const e = el; setTimeout(() => { if (e.classList.contains('out')) e.classList.remove('on'); }, 480); };

  /* antes de simular a partir da aba escondida: fecha tudo o que está aberto (janela, painel, cartão, seleção) para o estado ficar limpo */
  UI.closeAll = () => {
    try { if (UI.modalOpen) UI.closeModal(); } catch (e) { console.error(e); }
    try { UI.close(); if (UI.dock) UI.dock.close(); UI.inspect(null); } catch (e) { console.error(e); }
  };
})();

;
