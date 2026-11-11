# Ciclo 3 — "O mundo reage a você"

Notas de entrada (v24.0): **Diversão 8,7 · Viciante 9,2** (ver `AVALIACAO.md`). Este ciclo mira os critérios
que ainda não estão em 10.

## Visão do líder
O Aurora já prende pelo bolso (forja-loteria), pelo hábito (retorno, calendário, temporada) e pelo orgulho
(Arena, lendas, poder). Falta o mundo **reagir**: rivais com rosto que voltam para a revanche, um colosso que
ameaça todo mundo na mesma semana, heróis que criam laços entre si, e um renascimento que dá vontade de
recomeçar. E limpar o último atrito.

## Lote 3-A — Colosso da Semana (V9, D6)
- 3A.1 Evento semanal (semana ISO real): de sexta a domingo, um **Colosso** (chefe gigante original, arte própria em
  canvas, 3 tipos em rotação) desperta na Cratera. A vida dele é enorme e **persiste entre sessões e dias**; todos os
  heróis podem atacá-lo; avisos antecipados de quinta-feira em diante.
- 3A.2 **Ranking de dano** do jogador contra os 40 reinos rivais da Arena (que também batem no Colosso de forma
  determinística); marcos de dano pessoais com prêmio; derrotar o Colosso até domingo dá baú especial e uma relíquia/traje
  exclusivo da rotação.
- 3A.3 Funciona sem tela (simulador mede dano por semana e prêmios) e respeita a fila de janelas.

## Lote 3-B — Nêmesis, visitantes e laços (V8, D2, D5)
- 3B.1 **Nêmesis**: o reino rival que mais derrotou você vira Nêmesis (brasão destacado, fala provocativa); vencer o
  Nêmesis dá bônus de pontos e prêmio de revanche; o retorno conta "enquanto você esteve fora, a Marca do Corvo subiu 3
  posições" (V4).
- 3B.2 **Visitantes**: campeões rivais visitam Aurora de vez em quando (caminham pela praça, bebem na taverna, falam
  com seus heróis; tocar mostra o brasão e oferece duelo amistoso sem tíquete 1×/dia).
- 3B.3 **Laços**: heróis que caçam/duelam juntos criam laços (amizade, rivalidade amistosa) com níveis; laço dá
  pequenos bônus quando estão juntos e falas próprias no mapa; aparece no Livro de Feitos.

## Lote 3-C — Renascimento que dá vontade (V7)
- 3C.1 **Pontos de Renascimento**: ao renascer, o herói ganha pontos para **comprar/subir traços** (inclusive traços
  raros exclusivos de renascidos), moldando o herói ideal; janela própria.
- 3C.2 **Prévia e caminho**: desde o Rank A, a ficha mostra o que o renascimento dará; cerimônia própria
  de renascimento (a maior do jogo); conquista e título.
- 3C.3 Ajustar o ritmo para o primeiro renascimento acontecer em ~6–10 h de jogo (medir no simulador com o robô
  renascendo) sem tornar o meio do jogo mais lento.

## Lote 3-D — Último atrito (D1, D3, D8, D10, V1, V2)
- 3D.1 Guia (mão pulsante) em todos os passos da Jornada até o Mercado; missões com pré-requisito escondido
  (ex.: Campo de Treino → Cidadela 3) mostram o pré-requisito e apontam para ele.
- 3D.2 HUD em 360×640: nada truncado; chips recolhíveis; o mapa precisa ocupar pelo menos ~55% da tela.
- 3D.3 Quedas: medir com 10 sementes; se a variação vier da IA de recuo/poções, ajustar para quedas serem raras e
  dramáticas, não rotina; aviso claro de "herói em perigo".
- 3D.4 Elites e chefes às vezes deixam **peça inscrita no chão** (V1); aprimoramento +N mostra chance e oferece
  "Pergaminho de Proteção" (V2) obtido na loja da Arena/Colosso.
- 3D.5 Vibração (`navigator.vibrate`, se existir e com opção para desligar) e tremor de tela curto nos picos (Lendário,
  Colosso derrotado, vitória Lenda); sugerir Obras públicas na próxima recompensa quando houver moedas paradas.

## Critérios de aceite
Os de sempre (simulador 3 h sem erros e sem piora de ritmo, jogo novo e save v22 sem `pageerror`, capturas em
`capturas/ciclo3-x/`, push a cada item). Versão 25.0 no último item do ciclo.
