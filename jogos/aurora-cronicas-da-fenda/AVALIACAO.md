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
