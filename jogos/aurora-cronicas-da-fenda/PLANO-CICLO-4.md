# Ciclo 4 — "Nenhum minuto vazio"

Notas de entrada (v25.0): **Diversão 9,5 · Viciante 9,9**. Faltam D2, D4, D8, D9, D10 e V3.
Decisão do usuário: **um agente por vez**, direto na branch principal, push por item.

## Visão do líder
O Aurora já tem sistemas de sobra. Este ciclo não adiciona sistema grande: preenche os trechos calmos com
pequenas decisões vivas, dá à cidade cenas próprias, mostra cada sistema só quando ele faz sentido, e cria
sinergias entre o que já existe.

## Lote 4-A — Pedidos dos moradores e vida na cidade (D2, D4, V3)
- 4A.1 **Pedidos dos moradores**: a cada 2–4 min de jogo, um morador do elenco (Joca, Alda, Fábio, Quim…) faz um
  pedido curto com prazo (ex.: "Alda precisa de 12 Trigo até o anoitecer"; "Fábio quer ver uma peça Rara forjada
  hoje"; "Quim pede 3 Ervas raras"), com balão sobre o morador no mapa e cartão compacto na próxima recompensa;
  aceitar/entregar com 1 toque; prêmio pequeno e variado (moedas, Pó, Núcleo raro, ânimo, desconto); máximo 2 ativos.
  Meta medida no simulador: maior vazio entre momentos ≤ 180 s.
- 4A.2 **Cenas da cidade**: à noite e nos dias de folga, heróis que estão na cidade se reúnem (fogueira na praça,
  mesa da taverna, treino amistoso no Campo de Treino) com falas que usam laços, títulos e feitos ("Brindemos ao
  Vingador!"); o visitante rival entra nessas cenas. Garantir que exista quase sempre algo vivo na praça à noite.

## Lote 4-B — Sinergias (D9)
- 4B.1 **Ressonância de inscrições**: 2/3/4 peças do mesmo herói com inscrições da mesma família (ex.: Fúria+Ruína =
  família "Fúria") ativam bônus de conjunto visível na ficha, com barra "2/3".
- 4B.2 **Formação × classes** na Arena e no Colosso: combinações (ex.: Cavaleiro na frente + Mago atrás = "Muralha
  Arcana") dão bônus pequeno e nome próprio; tela de equipe mostra as combinações ativas e sugere uma.

## Lote 4-C — Clareza progressiva e polimento final (D8, D10)
- 4C.1 Abas, painéis e chips aparecem só quando o sistema é liberado; ao liberar, selo "Novo!" e uma dica de uma linha.
- 4C.2 "Livro do Reino": ajuda curta, com uma página por sistema (o que é, como avançar), acessível pelo "?" em cada painel.
- 4C.3 Passada de desempenho para celular modesto (orçamento de quadro, partículas sob `lowFx`, reduzir trabalho fora da
  tela) com medição; versão 26.0.

## Critérios de aceite
Simulador 3 h sem erros (2 sementes) e maior vazio ≤ 180 s ao fim do 4-A; jogo novo e saves v22/v24/v25 sem
`pageerror`; capturas em `capturas/ciclo4-x/`; push a cada item.
