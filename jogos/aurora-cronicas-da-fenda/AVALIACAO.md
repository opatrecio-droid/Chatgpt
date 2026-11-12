# Rubrica de diversão e vício — Aurora

Cada critério vale de 0 a 10 e precisa de **evidência** (captura, saída do simulador `ferramentas/sim.js`
ou trecho de código). A nota final de cada eixo é a **média**, e o eixo só conta como **10/10** quando
**todos** os critérios estão em 10. A referência é o que a pesquisa do EHT mostrou (pasta `pesquisa/`).

## Diversão
| # | Critério | O que é 10 |
|---|---|---|
| D1 | Primeiro minuto | Sem paredes de texto; primeira recompensa visível em menos de 30 s; primeira decisão em menos de 60 s |
| D2 | Cidade viva (aquário) | Dá vontade de só olhar: heróis com falas, rotinas e estados legíveis no mapa |
| D3 | Sensação (juice) | Toda recompensa tem som, partícula e número; raridade alta tem cerimônia própria |
| D4 | Decisões frequentes | Uma decisão significativa a cada 1–3 min de sessão |
| D5 | Apego aos heróis | Nome, história, feitos pessoais e perda que dói |
| D6 | Picos de emoção | Chefes, Maré, drops raros e duelos criam momentos memoráveis |
| D7 | Metas visíveis | Sempre há 2–3 metas de médio prazo na tela, com progresso |
| D8 | Clareza | O jogador sabe o que fazer e por que algo falhou |
| D9 | Profundidade de build | Classe × traços × equipamento × mascote geram builds distintas que valem otimizar |
| D10 | Sem atrito ruim | Sem erros, perda de progresso, esperas mortas ou telas que travam |

## Viciante
| # | Critério | O que é 10 |
|---|---|---|
| V1 | Recompensa variável | Forja, drops e recrutamento com raridade, atributos aleatórios e garantia (pity) |
| V2 | Quase-acerto | Aprimoramento/reforja com chance visível e escolha "manter ou aceitar" |
| V3 | "Só mais um" | Sempre há uma barra quase cheia a menos de 2 min |
| V4 | Retorno | Tela "enquanto você esteve fora" com revelação de cartas e baú |
| V5 | Hábito diário | Calendário de retorno, contratos, sequência e baú semanal |
| V6 | Coleção | Bestiário, códex de equipamento, trajes, mascotes e conquistas com marcos |
| V7 | Prestígio | Renascimento, dificuldades e recompensas que mudam o jogo |
| V8 | Competição | Arena/ranking contra rivais simulados, com temporada e prêmios |
| V9 | Urgência | Eventos com prazo (semana temática, Lua Rubra, chefe da semana) |
| V10 | Números subindo | Poder do reino, recordes, relatório do dia e marcos comemorados |

---

## Ciclo 1 — avaliação da base v22 (2026-11-11)

Evidência: jogo aberto no Chromium (412×860), tutorial percorrido, 2 min a 1× com observação; simulador
`node ferramentas/sim.js --min=120` (semente 1): 156 momentos em 2 h, mediana de 25 s entre momentos,
maior vazio 408 s (minutos 3–10), primeira promoção aos 13 min, nenhum erro.

| # | Nota | Evidência / lacuna |
|---|---|---|
| D1 | 5 | Jogo novo abre 5 falas da Rosa **e mais 3 janelas de "novidades" das versões 20, 21 e 22** (Vocações, Artes Secretas, Despertar, Montarias, Legado, Mascotes) — excesso de informação no minuto 1 |
| D2 | 8 | Mapa vivo, moradores com falas, heróis com rotina; muito bom |
| D3 | 7 | Efeitos existem (faíscas, promoção, invocação); falta cerimônia para Lendário/Mítico |
| D4 | 7 | Bom com a Jornada; vazio de ~7 min nos minutos 3–10 |
| D5 | 7 | Nomes, traços, visual e queda real; falta história pessoal e memorial |
| D6 | 8 | Chefes, Maré, Fenda e Incursões |
| D7 | 8 | Jornada + contratos + caminhos |
| D8 | 7 | Jornada clara; sistemas demais apresentados de uma vez |
| D9 | 7 | Itens são fixos por tier/raridade/+N: sem atributos aleatórios, todo item igual é idêntico |
| D10 | 8 | Sem erros no simulador; não testado em saves antigos |
| **Diversão** | **7,2** | |
| V1 | 5 | Raridade na forja e no Portal, mas **sem atributos aleatórios** e **sem garantia (pity)** no recrutamento |
| V2 | 5 | Aprimoramento +N com chance; não existe reforja nem "manter ou aceitar" |
| V3 | 7 | Barras de caça/zona e Jornada |
| V4 | 5 | Tela de retorno só com números (ouro, abates, materiais) |
| V5 | 6 | Contratos diários com sequência e baú; **sem calendário de retorno** |
| V6 | 8 | Bestiário, conquistas, trajes, mascotes, relíquias |
| V7 | 8 | Renascimento, despertar, dificuldades |
| V8 | 2 | **Nenhuma competição** (sem arena, ranking ou rivais) |
| V9 | 5 | Eventos aleatórios e Lua Rubra; **nada com prazo real** |
| V10 | 7 | Relatório do dia e Nível de Reino; falta "Poder do Reino" e recordes |
| **Viciante** | **5,8** | |

---

## Ciclo 1 — avaliação da v23.0 (lotes 1-A e 1-B) · 2026-11-11

Evidência: jogo novo no Chromium (412×860) por 100 s registrando cada janela — só o tutorial da Rosa no
início e o calendário aos 81 s; capturas de `capturas/ciclo1-a/` e `capturas/ciclo1-b/`; simulador 3 h
(sementes 1 e 2): 256/224 momentos (base: 223/210), mediana 19/25 s entre momentos (base 27/28 s),
maior vazio 315/319 s (base 408/319 s), zero erros; save da v22 abre sem erros.

| # | Antes | Agora | Evidência / o que falta para 10 |
|---|---|---|---|
| D1 | 5 | 8 | Início limpo. Falta: tutorial mais curto e interativo (seta/pulso no próximo toque), primeira decisão < 30 s |
| D2 | 8 | 8 | A criatura da sorte dá vida. Falta: heróis comentarem feitos e rivais |
| D3 | 7 | 9 | Feixe, clarão, carta que vira, cartas de retorno. Falta: comemorar recordes/marcos de poder |
| D4 | 7 | 8 | Reforja e cartas criam decisões; maior vazio caiu de 408 s para ~315 s |
| D5 | 7 | 7 | Sem mudança: falta história e feitos pessoais |
| D6 | 8 | 8 | Falta duelo contra rivais |
| D7 | 8 | 8 | Falta meta semanal competitiva |
| D8 | 7 | 7 | HUD mais cheio (faixa da semana, chip de buff); reforja mostra "Poder da peça: igual" mesmo mudando muito; save antigo empilha retorno + 3 novidades + calendário |
| D9 | 7 | 9 | Inscrições criam builds; falta códex para perseguir conjuntos perfeitos |
| D10 | 8 | 8 | Sem erros; moedas acumulam (90k–156k às 3 h no robô) sem nada que valha comprar no meio do jogo |
| **Diversão** | **7,2** | **8,0** | |
| V1 | 5 | 9 | Inscrições + garantia do Portal + semana do Portal |
| V2 | 5 | 9 | Reforja Manter/Aceitar + aprimoramento +N |
| V3 | 7 | 8 | Falta "próxima recompensa" sempre visível |
| V4 | 5 | 9 | Cartas de retorno |
| V5 | 6 | 9 | Calendário de 7 dias + contratos + sequência |
| V6 | 8 | 8 | Falta códex de inscrições/peças |
| V7 | 8 | 8 | — |
| V8 | 2 | 2 | **Ainda sem competição** |
| V9 | 5 | 8 | Semana temática com prazo; falta chefe da semana |
| V10 | 7 | 7 | Falta Poder do Reino e recordes |
| **Viciante** | **5,8** | **7,7** | |

---

## Ciclo 2 — avaliação da v24.0 (lotes 2-A, 2-B, 2-C) · 2026-11-11

Evidência: jogo novo no Chromium (412×860) por 100 s — só 2 falas da Rosa e a mão pulsante no Portal;
capturas de `capturas/ciclo2-a/`, `ciclo2-b/`, `ciclo2-c/`; simulador 3 h com o robô **agora seguindo a
Jornada** (sementes 1–3): 267/251/256 momentos, mediana 24–26 s, maior vazio 237/280/351 s, zero erros;
Arena 58–64% de vitórias, ligas Platina/Diamante; marcos de poder a cada ~18 min; Códex 60–77/80.
Observação de método: o vazio de ~11 min no começo que aparecia antes era do robô (construía o mais barato,
não o que a Jornada pedia); corrigido em `ferramentas/sim.js` (`--questless` mantém o robô antigo).

| # | C1 | C2 | Evidência / o que falta para 10 |
|---|---|---|---|
| D1 | 8 | 9 | Rosa em 2 falas, mão no próximo toque, primeira decisão ~13 s. Falta: guia em todos os passos iniciais; a missão "Construa o Campo de Treino" não avisa que exige Cidadela 3 (o robô travou nela) |
| D2 | 8 | 8 | Falta: rivais e heróis "vivendo" no mapa — visitantes, falas sobre feitos, laços entre heróis |
| D3 | 9 | 9 | Marcos, recordes, cerimônias. Falta: vibração no celular e tremor de tela nos picos; sons conferidos só por script |
| D4 | 8 | 9 | Duelo, reforja, Códex, próxima recompensa |
| D5 | 7 | 9 | Livro de Feitos, 31 títulos, Herói do Dia. Falta: laços (amizade/rivalidade) entre heróis |
| D6 | 8 | 9 | Arena e marcos. Falta: um evento-espetáculo semanal (chefe colossal) |
| D7 | 8 | 9 | Próxima recompensa + Jornada + liga |
| D8 | 7 | 8 | Fila única de janelas, toasts agrupados, poder da peça certo. Falta: HUD em 360×640 ainda corta a faixa da semana e ocupa muita tela; pré-requisitos escondidos nas missões |
| D9 | 9 | 9 | Falta: sinergias (conjuntos de inscrições, formação × classes) |
| D10 | 8 | 8 | Sem erros. Quedas variam muito (16–62 em 3 h); moedas acumulam (70k–200k) quando o jogador não usa as Obras |
| **Diversão** | **8,0** | **8,7** | |
| V1 | 9 | 9 | Falta: peças inscritas caindo de elites/chefes (hoje só material) |
| V2 | 9 | 9 | Falta: proteção/garantia visível no aprimoramento +N |
| V3 | 8 | 9 | Próxima recompensa sempre visível; maior vazio ainda 4–6 min |
| V4 | 9 | 9 | Falta: o retorno mencionar o que rivais/Arena fizeram enquanto você esteve fora |
| V5 | 9 | 10 | Calendário + contratos + tíquetes diários + temporada semanal |
| V6 | 8 | 10 | Códex 80 + 36, bestiário, conquistas, 31 títulos, trajes, mascotes |
| V7 | 8 | 8 | Renascimento só em SSS nível 80 (muito longe, sem prévia); falta pontos de renascimento para moldar traços |
| V8 | 2 | 9 | Arena com 40 rivais, ligas e loja. Falta: rival pessoal (nêmesis) e revanche |
| V9 | 8 | 9 | Temporada e semana temática. Falta: evento-chefe com prazo |
| V10 | 7 | 10 | Poder do Reino, recordes, marcos, relatório, Herói do Dia |
| **Viciante** | **7,7** | **9,2** | |

---

## Ciclo 3 — avaliação da v25.0 "O Mundo Reage" (lotes 3-A a 3-D, juntados) · 2026-11-12

Evidência: jogo novo no Chromium (412×860) por 100 s — 2 falas da Rosa e a mão no Portal, nenhuma outra janela;
saves da v22 e da v24 abrem na v25 com zero `pageerror` e veem só as novidades que faltavam; teste de fumaça em
412×860 e 360×640 (todas as abas, ~40 min de jogo) sem erros; simulador 3 h (sementes 1 e 2) sem erros: 321/284
momentos, mediana 12/18 s, maior vazio 353/403 s; quedas 9/9 em 3 h (antes: média 29, 12–62), Colosso derrotado
na maioria das semanas com o robô convocando; primeiro renascimento ~6,3–6,5 h (robô do lote 3-C); capturas de
`capturas/ciclo3-a/` a `ciclo3-d/` (Colosso, cerimônia de renascimento, HUD 360×640 com 56% de mapa).

| # | C2 | C3 | Evidência / o que falta para 10 |
|---|---|---|---|
| D1 | 9 | 10 | 2 falas, mão do guia até o Mercado, pré-requisitos na Jornada, primeira decisão ~13 s |
| D2 | 8 | 9 | Visitantes rivais, falas de laço, Colosso. Falta: a cidade ter cenas próprias (heróis quase nunca ficam na praça; o visitante só cumprimenta quem passa) |
| D3 | 9 | 10 | Tremor/vibração nos picos, cerimônia de renascimento, Colosso, cartas |
| D4 | 9 | 9 | Altar, revanche, modo do Colosso. Falta: decisões pequenas nos trechos calmos (maior vazio ainda 5–7 min) |
| D5 | 9 | 10 | Feitos, títulos, laços, Herói do Dia, renascimento pessoal |
| D6 | 9 | 10 | Colosso semanal, revanche do Nêmesis, renascimento |
| D7 | 9 | 10 | Próxima recompensa, marcos do Colosso, liga, Jornada com pré-requisitos |
| D8 | 8 | 9 | HUD 360×640 resolvido. Falta: muitos sistemas visíveis de uma vez — abas e painéis deveriam aparecer só quando liberados, com uma dica de uma linha |
| D9 | 9 | 9 | Traços raros e níveis no Altar somam profundidade. Falta: sinergias (conjuntos de inscrições, formação × classes) |
| D10 | 8 | 9 | Quedas raras, sem erros, moedas paradas sugerem Obras. Falta: confirmação num celular real (desempenho e sons só medidos no Chromium) |
| **Diversão** | **8,7** | **9,5** | |
| V1 | 9 | 10 | Forja-loteria + garantia + peças inscritas caindo de elites/chefes |
| V2 | 9 | 10 | Reforja Manter/Aceitar + chance clara no +N + Pergaminho de Proteção |
| V3 | 9 | 9 | Barra da próxima recompensa sempre visível; mas há trechos de 5–7 min sem nenhum momento |
| V4 | 9 | 10 | Cartas de retorno + notícias dos rivais |
| V5 | 10 | 10 | — |
| V6 | 10 | 10 | — |
| V7 | 8 | 10 | Pontos de Renascimento, traços raros, prévia desde o Rank A, primeiro renascimento ~6,5 h |
| V8 | 9 | 10 | Arena + Nêmesis + revanche + visitantes |
| V9 | 9 | 10 | Colosso de sexta a domingo + temporada + semana temática |
| V10 | 10 | 10 | — |
| **Viciante** | **9,2** | **9,9** | |

---

## Ciclo 4 — avaliação da v26.0 "Nenhum Minuto Vazio" (lotes 4-A, 4-B, 4-C) · 2026-11-12

Evidência (conferida pelo líder, independente dos relatórios dos agentes):
- Simulador 3 h em sementes novas (3 e 4) **sem erros**: 375/360 momentos, mediana 15/18 s, **maior vazio 156/151 s**
  (era 353–551 s no fim do ciclo 3); 120 pedidos de moradores por 3 h (≈90% entregues); quedas 3/2; Arena 52–63%.
  Os lotes registraram o mesmo em 8+ sementes (maior vazio ≤ 156 s em todas).
- Jogo novo no Chromium (412×860) por 100 s: só 2 falas da Rosa, mão no Portal, barra com Reino/Heróis/Missões/Mais e
  HUD enxuto (selos, núcleos, poder, semana e decretos ocultos até liberar); zero `pageerror`.
- Saves gerados nas versões v22, v24 e v25 abrem na v26 com zero `pageerror` e veem só as novidades que faltavam.
- Desempenho (lote 4-C, CPU 4× mais lenta, 360×640): painel aberto 33,8 → 19,5 ms por quadro; praça à noite
  28,9 → 25,1 ms (20,6 no modo leve, que liga sozinho se o aparelho sofrer).
- Capturas: `capturas/ciclo4-a/` (pedidos, fogueira, taverna, treino, visitante na roda), `ciclo4-b/` (ressonância,
  combinações com sugestão "Aplicar", combinação decisiva), `ciclo4-c/` (primeiro minuto, selo Novo!, Livro do Reino).

| # | C3 | C4 | Evidência |
|---|---|---|---|
| D1 | 10 | 10 | Primeiro minuto ainda mais limpo (sistemas aparecem quando liberam) |
| D2 | 9 | 10 | Fogueira com heróis, moradores e vigia; mesa da taverna; treino; visitante entra na roda; moradores conversam |
| D3 | 10 | 10 | — |
| D4 | 9 | 10 | Pedidos dos moradores a cada ~1,5–3 min, entrega em 1 toque; Altar, revanche, formação, Colosso |
| D5 | 10 | 10 | — |
| D6 | 10 | 10 | — |
| D7 | 10 | 10 | — |
| D8 | 9 | 10 | Abas/chips só quando liberados, selo Novo! com dica única, cadeado só para o próximo, Livro do Reino com 36 páginas |
| D9 | 9 | 10 | 6 famílias de ressonância, 13 combinações de formação, traços raros com níveis, laços |
| D10 | 9 | 10 | Sem erros em simulador e navegador, saves migram, passada de desempenho com modo leve automático |
| **Diversão** | **9,5** | **10** | |
| V1 | 10 | 10 | — |
| V2 | 10 | 10 | — |
| V3 | 9 | 10 | Maior vazio ≤ 156 s em todas as sementes medidas; próxima recompensa sempre visível |
| V4–V10 | 10 | 10 | — |
| **Viciante** | **9,9** | **10** | |

### Limites desta avaliação (honestidade)
- A nota é da rubrica do líder, com evidência de simulador, navegador headless e capturas. **Não houve teste com
  jogadores reais nem num celular físico**; desempenho e sons foram medidos só no Chromium.
- Pontos a observar no teste humano: frequência dos pedidos (≈1 a cada 1,5 min pode cansar — é um número em
  `3G-cidade.js`), quantidade de sistemas no meio do jogo, e a tensão das quedas (hoje raras: 2–12 em 3 h).
- Recomendação: jogar a v26 por alguns dias e trazer o que incomodou; isso vale mais que um ciclo 5 às cegas.
