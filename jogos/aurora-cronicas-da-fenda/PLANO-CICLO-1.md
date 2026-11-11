# Ciclo 1 — "Cada forja é uma aposta, cada retorno é um presente"

## Visão do líder
O Aurora já tem a cidade viva e os sistemas largos do gênero. O que falta para virar vício é o que o
Evil Hunter Tycoon faz com a **incerteza** e com o **hábito**:

1. **A forja vira loteria** — cada peça sai com inscrições aleatórias de qualidade variável, e o jogador
   pode reforjar com a escolha "manter ou aceitar". Lendário e Mítico ganham cerimônia.
2. **O primeiro minuto respira** — jogador novo não vê novidades de versões antigas.
3. **Voltar é um presente** — tela de retorno com cartas para virar, calendário de 7 dias, criatura da sorte
   para tocar, semana temática com prazo real.
4. (Ciclo 2) **Rivalidade** — Arena contra reinos rivais simulados, com temporada semanal.

Regras para todos: inspiração de mecânica, nunca nomes, textos ou arte do EHT. Tudo em português do Brasil,
com a voz do jogo (Rosa, Fábio, Gilda, Quim…). Saves antigos precisam continuar abrindo.

## Lote 1-A (Sonnet) — Forja-loteria e primeiro minuto
Código novo em um bloco próprio `/* ===== 37-forja-sorte.js ===== */` inserido **antes** de
`/* ===== 40-art.js ===== */`, e UI própria em `/* ===== 63-ui-forja-sorte.js ===== */` inserida **antes** de
`/* ===== 70-audio.js ===== */`. Mexer no código existente só para ganchos mínimos.

1. **Jogo novo sem "novidades"**: as janelas "Novos caminhos" (v20), "O que há de novo" (v21) e
   "Companheiros" (v22) só aparecem para saves de versões anteriores.
2. **Inscrições**: Comum 0, Incomum 1, Raro 1–2, Épico 2, Lendário 3, Mítico 4 inscrições, sorteadas de
   um conjunto de pelo menos 14 (ataque %, vida %, defesa %, crítico, dano crítico, velocidade de ataque,
   roubo de vida, regeneração, esquiva, ouro %, espólio %, experiência %, dano contra chefes/elites,
   espinhos…), cada uma com qualidade de 1 a 5 (5 = perfeita, com brilho). Entram em `heroStats`,
   `itemScore`, `itemPrice` e na escolha de compra do herói. Itens antigos continuam válidos sem inscrições.
3. **Reforja** na Ferraria (nível 2+): sorteia de novo as inscrições de uma peça; o jogador vê o antes e o
   depois lado a lado e escolhe **Manter** ou **Aceitar**. Custo crescente por peça, pago com moedas e um
   material novo, **Pó de Reforja**, que vem do desmonte.
4. **Cerimônia de raridade**: forjar Épico+ dispara revelação (clarão na cor da raridade, feixe de luz na
   Ferraria, som próprio, carta com nome e inscrições). Lendário e Mítico com versão maior.
5. **Garantia do Portal**: a cada 10 recrutamentos sem Épico+, o próximo sorteio garante um candidato
   Épico; contador visível no Portal.
6. Subir `G.VERSION` para `23.0` e `G.BUILD` para `Aurora_ciclo_034_forja_sorte` (só este lote mexe nisso).

## Lote 1-B (Sonnet) — Voltar todo dia
Código novo em `/* ===== 38-retorno.js ===== */` e `/* ===== 64-ui-retorno.js ===== */`, os dois inseridos
**antes** de `/* ===== 90-main.js ===== */`. Mexer no código existente só para ganchos mínimos.
Não mexer em `G.VERSION`/`G.BUILD`.

1. **Tela de retorno com cartas**: além dos números atuais, o tempo fora rende "achados" (uma carta por
   hora, até 8): saco de moedas, caixa de materiais, Núcleo, poções, e às vezes uma peça forjada pela Gilda.
   O jogador toca para virar cada carta (borda na cor da raridade) ou "Virar todas".
2. **Calendário de 7 dias** (dias reais, pelo relógio do aparelho): prêmios crescentes; o 7º dia é um
   Baú Lendário. Perder um dia não zera o ciclo, só pausa (sem punição). Abre uma vez por dia, depois da tela de retorno.
3. **Criatura da sorte tocável**: a cada 3–6 min de jogo, uma criatura brilhante atravessa a cidade por
   ~20 s; tocar nela dá prêmio aleatório (moedas, 60 s de "Sorte" com +50% de espólio, Núcleo, materiais)
   com efeito e aviso. Arte em canvas no estilo do jogo. Nada disso roda no modo sem tela.
4. **Semana temática** (semana real, ISO): Forja (+raridade), Caçada (+30% espólio), Portal (recrutas
   melhores), Ouro (+25% moedas) — faixa no HUD com contagem "termina em 3d 4h".

## Critérios de aceite (os dois lotes)
- `node ferramentas/sim.js --min=120` sem erros, e ritmo igual ou melhor que o da base.
- Jogo abre no Chromium sem erros no console; capturas das telas novas em 412×860.
- Um save da v22 (gerado pela base) abre e continua jogável.
- Commits pequenos e descritivos.
