# Aurora — Crônicas da Fenda

Jogo em um único arquivo: abra **`aurora-cronicas-da-fenda.html`** no navegador (celular ou computador).
O salvamento fica no próprio aparelho e é o mesmo da versão anterior — a jornada continua de onde parou.

Versão atual: **v30.7** (build `Aurora_043_avisos_mapa_chefes_arte64`), feita sobre a v30.6 recebida
(`dev/base/aurora-042-base.html`, guardada sem alterações).

## O que mudou na v30.7

### Avisos em uma faixa só
- Tudo o que é passageiro — aviso, manchete de chefe/Maré/nível de reino, nome da zona — aparece no mesmo
  lugar, **uma mensagem por vez**, logo abaixo dos retratos. Nada mais atravessa o centro da tela.
- A faixa tem prioridade (chefe e perigo passam na frente), junta mensagens repetidas (`×N`) e manda o que
  não coube para um contador discreto (`+N avisos`), que abre os últimos avisos ao toque.
- "Seguir herói", a barra de chefe e a do Colosso viraram linhas fixas da mesma faixa: antes ficavam
  empilhadas umas sobre as outras.
- A dica da guia (mão que aponta) perdeu a caixa marrom grande e usa o mesmo visual limpo.
- O HUD limpo foi mantido como estava.

### Mapa com borda de neblina
- A câmera agora passa da borda do mapa e entra numa margem de bruma. Com isso os cantos e as beiradas
  saem de baixo do HUD e podem ser vistos por inteiro ao arrastar.
- A bruma invade as últimas casas do mapa e fecha aos poucos por fora, com mechas à deriva.

### Chefes: convocação e avaliação oculta
- Quando um chefe de zona desperta, os heróis aptos são **convocados**: reúnem-se a uma distância segura do
  covil e atacam juntos, em vez de ignorá-lo ou esbarrar nele um a um.
- Cada investida que termina sem derrubar o chefe conta uma derrota seguida. **Na terceira, a companhia para
  de insistir** e passa a estudar o chefe.
- Em estudo, um avaliador oculto simula a luta com todos atacando juntos. A companhia **só volta a investir
  quando a chance estimada de vitória passa de 80%**. Se ainda assim perder, o avaliador fica mais
  desconfiado daquele chefe.
- O jogador não vê números: só o motivo do herói ("Reunindo a companhia…") e linhas na crônica.
- Respeita ordens manuais (herói mandado para outra zona não é convocado) e a Maré tem prioridade.

### Arte: heróis e moradores em 64×64
- Os heróis saíram de 26×30 para **64×64 pixels**, mostrados em meia escala no mapa (mesmo tamanho na tela,
  o dobro de detalhe): rosto legível, oito cortes de cabelo, luz e sombra, contorno.
- Cada classe tem roupa própria; armadura, elmo, botas, manoplas, cinturão e amuleto aparecem no corpo.
  O elmo muda conforme a classe (chapéu de mago, capuz de arqueiro e ladino, elmo alado de paladino…).
- **Armas deixam de ser genéricas**: cada tipo tem quatro silhuetas, uma a cada dois ranks, e a raridade
  colore fio, guarda e gema. Machados têm desenho próprio.
- Os moradores (ferreiro, padeira, guardas, fazendeiros…) usam o mesmo desenho, para não destoar.
- Retratos do HUD, ficha, lista de heróis e tela de título usam a arte nova, com figuras maiores.

### Espólio agrupado
- Materiais iguais que caem perto um do outro se juntam numa pilha só. O campo de caça fica bem menos
  poluído e nada se perde: o toque já recolhia as pilhas vizinhas de uma vez.

## Balanceamento: o que foi medido

O jogo roda sem tela no Node (`dev/tests/headless.js`), com o robô de testes do próprio jogo.

- **Avaliador de chefe** (`dev/tests/calibra-chefe.js`, 161 investidas em 10 sementes): com previsão
  ≥ 80% a companhia venceu 84 de 89 investidas; com previsão < 20%, 7 de 55.
- **Investidas comuns** (antes do modo de estudo): cerca de metade termina em recuo, quase sempre sem
  quedas — quem fica sem poção repõe antes de ir e o grupo recua antes de cair. Em 6 dias simulados o
  primeiro chefe derrubou de 0 a 3 heróis por partida.
- **Não alterado**: a primeira Maré costuma ser perdida pelo robô (3 de 4 sementes). Ela já tem ajuste
  próprio (a seguinte vem mais fraca) e depende de preparo e decretos que o robô não usa, então ficou
  como estava.
- **Limite da medição**: o robô não administra a cadeia de suprimentos nem os pedidos do Posto Comercial.
  A partir do dia 9–10 os heróis ficam parados por falta de estoque, então o meio e o fim de jogo não
  foram avaliados automaticamente.

## Desenvolvimento

```
dev/
  base/aurora-042-base.html   versão recebida, nunca editada
  src/                        correções desta versão
    NN-nome.js|css            blocos injetados antes de </body>
    NN-nome.patch.txt         trocas exatas no código da base
  build.py                    base + src → ../aurora-cronicas-da-fenda.html
  tests/                      simulações sem tela e teste no navegador
```

```bash
python3 dev/build.py                 # gera o jogo (falha se alguma troca não casar exatamente uma vez)
node dev/tests/navegador.js          # avisos, neblina, convocação, arte, quadros por segundo, erros
node dev/tests/sim-chefe.js "" 8     # crônica das investidas em 8 dias simulados
node dev/tests/calibra-chefe.js 8    # previsão do avaliador × resultado real
node dev/tests/sim-balanco.js 14     # ritmo em várias sementes
```

`navegador.js` precisa do Playwright com Chromium; os demais só do Node.
