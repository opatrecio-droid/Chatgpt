# Briefing · Animações de habilidades (Aurora 046)

Jogo: RPG/idle em pixel art (tiles de 16 px de arte, escala `z` px de tela por pixel de arte), HTML único de 6 MB.
**Não leia o HTML original** — tudo o que você precisa está aqui e em `src/skill-fx-core.js` (leia esse arquivo, ~200 linhas).

## Objetivo
Animações **incríveis, de jogo de verdade**, uma diferente para cada habilidade: antecipação → impacto → rescaldo.
Leitura clara a distância (silhuetas fortes, 2–4 cores por efeito + branco quente no núcleo), estilo pixel art
(partículas quadradas `K.px`, sem anti-aliasing exagerado), com brilho aditivo (`K.glow`) só nos pontos de energia.
Impactos grandes pedem `sc.shake(2..4)` e um clarão breve (`K.flash`, alpha ≤ .2). Cada habilidade deve ser
reconhecível sem texto: Terremoto racha o chão, Meteoro cai do céu, Nevasca neva, Mil Cortes = seis cortes rápidos etc.

## Contrato (ver `src/skill-fx-core.js`)
```js
(function(){ 'use strict';
  if (typeof G === 'undefined' || G.HEADLESS || !G.A || !G.A.SkillFX) return;
  const FX = G.A.SkillFX, K = FX.kit;
  FX.register('duelista', { dur: 1.0, hits: [0.18, 0.34], draw(ctx, t, sc, K, info) { ... } });
})();
```
- `t` = segundos desde o início (0..dur). `hits` = instantes (s) dos impactos visuais — a prévia usa isso para piscar o
  alvo e mostrar números de dano. Primeiro impacto ≤ 0,35 s (o dano real já acontece no instante do lançamento).
- `dur`: 0,9–1,8 s (auras/bênçãos até 2,2 s).
- `sc`: `x,y` pés do conjurador · `tx,ty` pés do alvo · corpo ≈ `y - 0.6*sc.tile`, cabeça ≈ `y - 1.1*sc.tile` ·
  `sc.tile` = px por unidade do mundo (raio `r` das regras → `r*sc.tile`) · `sc.z` = px por pixel de arte ·
  `sc.dir` 1 = alvo à direita (espelhe movimentos horizontais) · `sc.others` inimigos perto do alvo `[{x,y}]` ·
  `sc.allies` aliados perto do conjurador · `sc.quiet` (movimento reduzido: sem tremor/clarão, movimento mínimo) ·
  `sc.light` (modo leve: ≤ 1/3 das partículas) · `sc.world` (true no mapa, false na prévia) · `sc.seed` ·
  `sc.shake(px)` · `sc.drawCaster(ctx, x, y, {alpha, pose, flip, tint})` desenha o sprite do próprio herói
  (poses `idle0`, `walk0-3`, `atk0-2`, `cast0-2`; `tint` = silhueta de cor sólida, ótimo para ecos/sombras).
- Kit `K`: `clamp, lerp, seg(t,a,b)→0..1, ease.{out,in,inOut,back,elastic,pulse}, rng(seed)→()=>0..1,
  px(ctx,x,y,s,cor,alpha), glow(ctx,x,y,r,cor,alpha), ring(ctx,x,y,r,cor,larg,alpha,achatamento=.42),
  disc(ctx,x,y,r,cor,alpha,achat), burst(ctx,x,y,{n,r,size,colors,seed,u,up,fall,squash,alpha}),
  slash(ctx,x,y,r,a0,a1,larg,cor,alpha,u), bolt(ctx,x1,y1,x2,y2,{seed,segments,jag,color,width,alpha}),
  streak(ctx,x1,y1,x2,y2,larg,cor,alpha), poly(ctx,pts,cor,alpha), diamond(ctx,x,y,s,cor,alpha,fill), flash(ctx,sc,cor,alpha)`.
  Pode escrever helpers próprios no seu arquivo (dentro do IIFE).

## Regras
- **Aleatoriedade determinística**: use `K.rng(sc.seed + n)` — nunca `Math.random()` (o quadro seguinte precisa
  repetir as mesmas partículas, senão pisca). Não use `G.rng` (é da simulação).
- Desempenho: ~60 primitivas por quadro no normal, ≤ 1/3 com `sc.light`; sem `shadowBlur`/`filter`; nada de criar
  canvas por quadro (se precisar de sprite pré-renderizado, crie uma vez com `G.A.mk(w,h)` e guarde em cache).
- Sempre `ctx.save()/restore()` ao mudar composição/alpha nos seus helpers (o núcleo já envolve o draw).
- `sc.quiet`: mostre o efeito de forma estática/esmaecida (sem tremor, sem clarão, sem voos longos).
- Sem DOM, sem string `</script>`. Comentários curtos em português.
- **Não edite** arquivos que não são seus (núcleo, ferramentas, build). Se precisar de algo no núcleo, diga no relatório.

## Efeitos que o jogo já desenha no mapa (quando `sc.world === true`, não duplique)
- `base:esp` Dança dos Ecos: o jogo já desenha 2 ecos translúcidos do herói (caçam o alvo por 6 s) e um giro genérico.
  Você: redemoinho de cortes ao redor do herói (raio 2,1) + clarão de surgimento dos ecos em `x ± 0.7*tile, y + 0.5*tile`.
  Na prévia (`!sc.world`) desenhe também os 2 ecos (`sc.drawCaster` com `tint`/alpha) avançando e cortando o alvo.
- `base:arq` Fênix Ardente: o jogo já desenha a fênix voando herói→alvo (voo 0,12–0,28 s). Você: clarão no arco,
  rastro de fogo, explosão flamejante no alvo e chamas residuais (queimadura). Na prévia desenhe também a ave:
  `G.A.phoenixSkillSprite(frame 0..3)` (canvas 96×64 desenhado com `drawImage(cv, -19*z, -13*z, 38*z, 26*z)` em
  torno do ponto, espelhado por `dir`), voando em ~0,25 s na altura do corpo.
- `base:mag` Legião Arcana: o jogo já desenha explosão genérica no alvo e 2 esqueletos aliados em `x ± 0.7*tile, y + 0.5*tile`.
  Você: círculo rúnico + explosão arcana no alvo, círculos de invocação com estilhaços de osso. Na prévia desenhe os
  esqueletos surgindo do chão: `const s = G.A.monSheet('esqueleto',0,0)` → `ctx.drawImage(s.cv, 0,0, s.sw||s.w, s.sh||s.h, x - s.w*z/2, y - (s.h-2)*z, s.w*z, s.h*z)` (recorte subindo).
- `base:pal` Luz da Concórdia: o jogo já desenha um anel de cura e um selo dourado sobre o inimigo dominado (5 s).
  Você: coluna de luz sagrada no herói, onda de cura alcançando `sc.allies`, correntes/auréola dourada prendendo o alvo.
- `base:cav` Muralha e `base:lad` Golpe Sombrio: só efeitos genéricos — faça tudo.
- Vocações: o jogo só desenha cortes/explosões/flechas genéricos; desenhe o efeito completo por cima.

## Lista de habilidades (chave · nome · regra)
Básicas: `base:esp` Dança dos Ecos — golpeia ao redor (r 2,1) e cria 2 ecos · `base:cav` Muralha — provoca inimigos
(r 4,5) e reduz dano em 55% por 5 s · `base:arq` Fênix Ardente — fênix atinge o alvo e o deixa em chamas ·
`base:mag` Legião Arcana — explode no alvo (r 2,2) e invoca 2 esqueletos · `base:pal` Luz da Concórdia — cura aliados
(r 4) e domina um inimigo · `base:lad` Golpe Sombrio — crítico de 260% e rouba moedas.

Espadachim (#c8473d): `duelista` Estocada Dupla — 2 estocadas 130% · `mercenario` Brado de Guerra — +22% ataque aliados
r 4,5 por 8 s · `mestre_laminas` Dança das Lâminas — 5 cortes 85% entre inimigos próximos (r 2,6) · `espada_fantasma`
Corte Fantasma — crítico 300% que ignora defesa · `senhor_guerra` Terremoto — 200% área r 2,8 em volta de si + atordoa 2 s ·
`santo_espada` Lâmina da Aurora — 250% área r 2,2 no alvo + cura 12%.
Cavaleiro (#5b7fb5): `guardiao_aco` Golpe de Escudo — 140% + atordoa 2,5 s · `lanceiro` Investida — atravessa o alvo
190% em área r 1,8 · `baluarte` Bastião — aliados r 4,5 recebem 35% menos dano 6 s · `sentinela` Carapaça de Espinhos —
devolve 45% do dano 8 s e provoca r 4,5 · `lanca_dragao` Salto do Dragão — cai do céu: 300% + 140% área r 2,2 ·
`marechal` Estandarte — aliados r 5 +18% ataque e velocidade 8 s.
Arqueiro (#4f9d5d): `atirador` Tiro Perfurante — 240% ignora 60% da defesa · `patrulheiro` Flecha Envenenada — 120% +
veneno 5 s · `olho_falcao` Tiro Mortal — 400% (+50% se alvo < 35%) · `cacador_feras` Marca do Caçador — 150% + marca
(+30% dano sofrido 8 s) · `guarda_bosque` Saraivada — 2 salvas de 110% em área r 2,6 no alvo · `vento_errante` Passo do
Vento — +30% esquiva e velocidade de ataque 7 s.
Mago (#8a62c9): `piromante` Parede de Chamas — 120% área r 2,4 + queimadura 5 s · `criomante` Lança de Gelo — 200% e
congela 2,5 s · `arquimago` Meteoro — 360% área enorme r 3 · `senhor_cinzas` Combustão — incendeia todos r 3,5 por 6 s ·
`sabio_fenda` Distorção — 240% área r 2,8 + lentidão 50% · `tecelao` Nevasca — 4 rajadas de 90% área r 2,8 + congela 1,5 s.
Paladino (#d9b24a): `cruzado` Golpe Sagrado — 220% + cura 8% · `clerigo` Bênção — aliados r 4,5: −18% dano e regeneração
3%/s por 6 s · `avatar` Julgamento — 280% ao redor de si r 2,5 + cura 10% aliados · `inquisidor` Sentença — 340% + atordoa
2 s · `sumo_sacerdote` Renovação — cura 40% aliados r 4,5 e limpa venenos · `guardiao_luz` Égide Sagrada — escudo de 30%
da vida aos aliados r 4,5 por 8 s.
Ladino (#4b5563, efeitos em roxo-sombra #c8a0ff): `sombra` Emboscada — crítico 280% · `trapaceiro` Bomba de Fumaça —
atordoa r 2,5 por 3 s e +30% esquiva · `fantasma` Mil Cortes — 6 golpes de 70% · `carrasco` Execução — 300% (dobro se
alvo < 30%) · `rei_ladroes` Grande Golpe — 240% e arranca bolsa de moedas · `envenenador` Lâmina Tóxica — 150% + veneno forte 6 s.

## Testar (gere tudo em `$SCRATCH`, nunca no repositório)
```bash
cd /home/user/Chatgpt/jogos/aurora
SCRATCH=/tmp/claude-0/-home-user-Chatgpt/c8be618d-f17e-5b4b-941f-9c65a9a54f27/scratchpad
python3 build.py --out $SCRATCH/<nome>.html --only skill-fx-core.js,<seu-arquivo>.js
node tools/fx-sheet.js $SCRATCH/<nome>.html $SCRATCH/<nome>.png esp,cav 6   # 1 linha por habilidade, 6 quadros
```
Depois leia o PNG (Read) e itere. A ferramenta imprime erros de página — precisa terminar com `sem erros` e
`"missing":[]` para as suas chaves. Use `quadros` maior (8–10) para conferir impactos rápidos.
