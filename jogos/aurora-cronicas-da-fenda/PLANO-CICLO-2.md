# Ciclo 2 — "Rivalidade, lendas pessoais e clareza"

Notas de entrada (v23.0): **Diversão 8,0 · Viciante 7,7** (ver `AVALIACAO.md`).

## Visão do líder
O ciclo 1 deu ao Aurora a incerteza (forja-loteria) e o hábito (retorno, calendário, semana). Agora faltam:
1. **Com quem se comparar** — V8 está em 2: não existe rival. É a maior lacuna.
2. **Por quem torcer** — D5 e V10: cada herói precisa de uma história, e o reino de um número que sobe.
3. **Clareza e coleção** — D8, D1, V6, V3: menos ruído, tutorial que aponta em vez de explicar, um códex
   para perseguir, a próxima recompensa sempre à vista, e algo que valha as moedas que sobram no meio do jogo.

Regras de sempre: mecânicas inspiradas, nunca nomes/textos/arte do EHT; português do Brasil com a voz do
jogo; saves antigos abrem; push a cada item.

## Lote 2-A — Arena das Duas Luas
Blocos `/* ===== 39-arena.js ===== */` e `/* ===== 65-ui-arena.js ===== */`, IMEDIATAMENTE ANTES de `/* ===== 90-main.js ===== */`
(depois dos blocos 38/64 do ciclo 1).
- 2A.1 **Rivais**: 40 reinos rivais gerados de forma determinística (semente fixa): nome, brasão (cor + símbolo
  desenhado), líder e equipe de 3–5 heróis com classes/raridades/traços/equipamento do próprio jogo. O poder de cada rival
  acompanha o do jogador (faixa 70%–140%) e cresce durante a temporada.
- 2A.2 **Duelo**: o jogador escolhe 3–5 heróis (frente/fundo) e um de 3 adversários sorteados perto do seu poder
  (mais forte = mais pontos). Resultado calculado a partir de `heroStats` reais por simulação determinística com semente
  (funciona sem tela — o simulador precisa conseguir duelar). Na UI, uma janela animada de 20–40 s: retratos com barras
  de vida, números de dano, críticos, habilidades de classe, mascotes; botão "Pular". Heróis em caçada podem duelar
  (o duelo é uma exibição, não tira o herói do mapa) — ou, se preferir, só heróis na cidade; justifique.
- 2A.3 **Tíquetes e temporada**: 5 tíquetes por dia real, extras com Núcleos (custo crescente). Temporada = semana ISO
  real: pontos → ligas Bronze, Prata, Ouro, Platina, Diamante, Lenda das Luas; ranking com os 40 rivais (que também
  pontuam ao longo da semana) e o jogador. Ao virar a semana: baú da liga (Selos, Núcleos, Pó de Reforja, Insígnias) e
  título exclusivo para Diamante+.
- 2A.4 **Loja de Insígnias + sumidouro de moedas**: itens que não se acham em outro lugar (traje/asa exclusiva via
  sistema de trajes existente, ovo de mascote, contrato de recruta Épico, Pó de Reforja, Tomo) e uma fileira paga em
  **moedas** com preço que escala (para dar destino às moedas que sobram no meio do jogo).
- 2A.5 **Acesso**: abre com Cidadela 3 ou Nível de Reino 6 (o que vier primeiro); entrada pela aba Missões com arte
  própria e um passo novo da Jornada ("Vença um duelo na Arena"); vitórias/derrotas emitem eventos para o lote 2-B.
- 2A.6 **Robô do simulador** duela (até 5 por dia de jogo, escolhendo o adversário do meio). Meta: taxa de vitória
  55%–70% ao longo de 6 h simuladas; ajuste até chegar lá e relate.

## Lote 2-B — Lendas pessoais e Poder do Reino
Blocos `/* ===== 3A-lendas.js ===== */` e `/* ===== 66-ui-lendas.js ===== */`, IMEDIATAMENTE ANTES de `/* ===== 90-main.js ===== */`.
- 2B.1 **Livro de Feitos** na ficha do herói: dias a serviço, abates, elites, chefes, maior golpe, quedas, relíquias,
  duelos vencidos, andar da Fenda; linha do tempo com os 10 marcos pessoais mais recentes ("Dia 12: derrubou a Hidra").
- 2B.2 **Títulos** por feitos (pelo menos 16: "Matador de Hidras", "Sobrevivente", "Mão de Ouro", "Lâmina da Arena"…),
  com pequeno bônus; o jogador escolhe qual exibir sob o nome. Desbloqueio com aviso e som.
- 2B.3 **Herói do Dia** no relatório da virada do dia, com fala própria e um pequeno prêmio.
- 2B.4 **Poder do Reino** no HUD (soma ponderada do poder dos heróis + construções + bênçãos), animado quando sobe;
  **Recordes** (maior golpe, mais moedas em um dia, andar da Fenda, maior sequência de duelos, peça mais forte) com aviso
  "Novo recorde!"; **marcos** de poder (1k, 2,5k, 5k, 10k…) com pequena cerimônia e prêmio.

## Lote 2-C — Clareza, coleção e "próxima recompensa"
- 2C.1 **Tutorial que aponta**: as 5 falas da Rosa viram 2 curtas; depois, uma seta/pulso indica o próximo toque das
  primeiras missões da Jornada (Portal, Enfermaria, Ferraria, Forja). Primeira decisão em menos de 30 s.
- 2C.2 **Fila de janelas**: em saves antigos, as 3 janelas de novidades viram uma só ("O que mudou desde a sua última
  visita", com as seções), e retorno → novidades → calendário respeitam uma fila única com espaço entre elas. Nenhuma janela
  abre por cima de outra.
- 2C.3 **Poder da peça correto**: a comparação da reforja (e de qualquer troca) precisa pesar todas as inscrições;
  "igual" só quando for igual de verdade.
- 2C.4 **Códex de Inscrições**: coleção das 16 inscrições × qualidades (1 a 5) e das peças por tier/raridade; marcos
  ("todas as inscrições vistas", "5 perfeitas", "primeiro Mítico") com prêmio; aba no painel existente de coleção
  (bestiário/conquistas) ou em Mais.
- 2C.5 **Próxima recompensa**: um indicador compacto no HUD mostra a recompensa mais próxima de qualquer sistema
  (contrato, conquista, promoção, marco de poder, calendário) com barra de progresso; tocar leva até ela.
- 2C.6 **HUD mais limpo**: revisar a faixa superior em 360×640 e 412×860: nada sobreposto, nada cortado, áreas de toque ≥ 40 px.

## Critérios de aceite (todos os lotes)
`node ferramentas/sim.js --min=180` sem erros e sem piora de ritmo; jogo novo e save v22 sem `pageerror`;
capturas em `capturas/ciclo2-x/`; push a cada item com o item marcado em `PROGRESSO.md`.
