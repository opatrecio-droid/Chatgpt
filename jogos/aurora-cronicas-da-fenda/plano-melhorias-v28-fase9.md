# Aurora — Crônicas da Fenda · Plano de melhorias (base: v28 fase 9)

Documento para ser entregue a outra IA (ChatGPT) junto com o arquivo `aurora-v28-fase9.html`.
Tudo o que está marcado como medido ou observado saiu de testes reais no arquivo; o que é suposição está marcado como hipótese.

---

## 0. Instruções para a IA que vai executar

**Seu papel.** Você é o engenheiro e designer responsável por evoluir este jogo. O dono do jogo não programa: ele joga no celular e repassa arquivos. Explique o que fez em português simples.

**O arquivo.** Um único HTML de 1.837.702 bytes e 20.302 linhas. Não tem dependências externas: arte gerada em canvas, áudio sintetizado, três fontes de pixel embutidas em base64.

**Regra de trabalho mais importante: nunca reescreva o arquivo inteiro na conversa.** Ele não cabe em uma resposta e qualquer cópia manual corrompe as fontes em base64. Trabalhe assim:

1. Abra o arquivo enviado com a ferramenta de execução de código.
2. Aplique cada mudança como substituição exata de texto (âncora → novo texto), verificando que a âncora existe uma única vez antes de trocar.
3. Depois de cada tarefa, confira que o arquivo ainda abre: os blocos `<script>` e `<style>` continuam balanceados e o tamanho mudou só o esperado.
4. Entregue o arquivo final como download, com nome novo (`aurora-v29-faseN.html`), nunca por cima do original.
5. Faça uma fase por entrega. Não comece a fase seguinte antes de o dono confirmar que testou.

**Regras que não podem ser quebradas.**

- Um arquivo só, sem rede, sem bibliotecas externas.
- Saves antigos continuam abrindo. A chave é `aurora.v19.save`; todo campo novo precisa de valor padrão em `G.newState` e de tratamento em `G.repairState`.
- A simulação roda sem tela em dois modos (`G.HEADLESS` e `G.OFFLINE`). Código de simulação não pode tocar em DOM.
- Extensão nova entra por `G.hook(...)`, não redefinindo função existente (ver tarefa C1).
- Botões com no mínimo 44×44 px e texto com no mínimo 11 px. Hoje o jogo cumpre isso; não regrida.
- Todo texto do jogo em português do Brasil.
- Não crie sistema de jogo novo nas fases 1 e 2. O jogo já tem sistemas demais para a quantidade de tela que tem.

**Formato da resposta em cada entrega.**

1. O que mudou, em frases curtas, por tarefa (use os códigos deste plano: B1, U3…).
2. Como o dono testa no celular, passo a passo.
3. O que não foi feito e por quê.
4. O arquivo para baixar.

Se uma âncora deste plano não for encontrada, pare e avise. Não adivinhe outro lugar.

---

## 1. Como o jogo é montado

O `<script>` principal começa perto da linha 753 e contém 62 módulos concatenados, cada um aberto por um comentário `/* ===== NN-nome.js ===== */`. Use esses comentários como mapa.

| Faixa | Módulos | Conteúdo |
|---|---|---|
| Núcleo | `00-core`, `10-data`, `20-world` | utilitários, eventos, estado, save, tabelas de classes, monstros, zonas, itens, prédios |
| Simulação | `30-heroes`, `31-monsters`, `32-town`, `33-meta`, `34` a `3N` | IA dos heróis, monstros, cidade, jornada, vocações, mascotes, arena, colosso, rivais, renascer, pedidos |
| Arte | `40-art` a `54-vida-art` | sprites e terreno gerados em canvas |
| Desenho | `50-render` | câmera, mundo, luz da noite, partículas |
| Interface | `56` a `6L` | ícones, HUD, painéis, janelas, guia, livro, limpeza visual |
| Áudio | `70-audio` | efeitos e música sintetizados |
| Laço | `90-main` | boot, laço principal, salvar, tempo ausente |

Objeto global `G`. Estado do jogo em `G.S`. Interface em `G.UI`, desenho em `G.R`, arte em `G.A`, laço em `G.M`.
Versão `28.0`, build `Aurora_ciclo_049_reino_afinando`.

O CSS tem três camadas, nesta ordem: o estilo base de pixel art (começa na linha 13), `<style id="fase1-layout">` (linha 629) e `<style id="visual-referencia">` (linha 694). A terceira sobrescreve a primeira em muitos pontos (ver A1).

Tamanho do conteúdo, lido do jogo em execução: 6 classes, 36 vocações, 6 zonas, 7 chefes, 38 recursos, 16 inscrições, 23 Caminhos, 15 mascotes, 6 montarias, 22 cosméticos e 4 dificuldades (Fácil −3, Normal 0, Difícil +4, Pesadelo +7 níveis).

---

## 2. Como os testes foram feitos

- Jogo aberto em Chromium sem tela, em 390×844 (celular em pé), 360×640, 844×390 (celular deitado) e 1280×800.
- Um jogador automático dentro da página, chamando `G.tick(0.033)` em laço e, a cada 2 s de jogo, as mesmas funções que os botões chamam.
- Regras do jogador automático: resgata jornada, contratos, baú diário e conquistas; escolhe a opção 0 nos eventos; contrata quando tem 1,2× o custo; promove quem pode; constrói primeiro o prédio pedido pela jornada e depois o que custar menos de 60% do ouro; forja o que os heróis querem e podem pagar; compra bênçãos por igual; compra obras públicas quando tem 3× o custo; conserta prédios.
- O jogador automático **não usa** Fenda Infinita, Arena, Incursões, vocações, Artes Secretas, mascotes, montarias, decoração, reforja nem Obra-prima. Tudo o que depende desses sistemas ficou sem teste.

Três partidas simuladas:

| Partida | Dias | Reino | Nível dos heróis | Quedas | Marés | Chefes |
|---|---|---|---|---|---|---|
| Normal, jogador automático | 46 | 13 | até 50 | 6 | 8 vencidas, 0 perdidas | 46 |
| Pesadelo, jogador automático | 21 | 7 | até 30 | 17 | 1 vencida, 2 perdidas | 8 |
| Normal, sem tocar em nada | 21 | 4 | parados em 10 | 7 | 0 vencidas, 3 perdidas | 0 |

Marcas de evidência usadas abaixo:

- **[MEDIDO]** número saído de simulação ou medição.
- **[VISTO]** aparece em captura de tela.
- **[CÓDIGO]** lido no código.
- **[HIPÓTESE]** suspeita que precisa ser confirmada antes de mexer.

---

## 3. O que está bom e deve ser preservado

- Nenhum erro registrado em 46 dias de jogo simulados. [MEDIDO]
- Simulação leve: 0,05 a 0,22 ms por passo, pior passo perto de 7 ms. [MEDIDO]
- Desenho a 60 quadros por segundo, cerca de 1,8 ms por quadro, sem limitação de processador. [MEDIDO]
- Nas 20 telas de painel auditadas em 390×844: nenhum botão menor que 40 px, nenhum texto cortado, nenhuma fonte abaixo de 11 px. [MEDIDO]
- Save com reparo de campos, duas cópias de segurança e bloqueio de gravação quando a carga falha. [CÓDIGO]
- IA dos heróis por pontuação de necessidades, com o motivo exibido na ficha ("Por quê?"). [CÓDIGO]
- Monstros com comportamentos distintos, avisos de ataque no chão e chefes com fases. [CÓDIGO]
- Cartão de prédio comparando "agora" com "próximo nível". [VISTO]
- Opções de conforto já existentes: tamanho do texto, alto contraste, símbolos de raridade, reduzir movimento, mão esquerda, economia de bateria. [VISTO]
- Chances reais do Portal exibidas na janela de contratação. [VISTO]

Não refaça nada disso.

---

## 4. Fase 0 — Rede de segurança (fazer antes de qualquer mudança)

### T0. Jogador automático dentro do jogo

**O quê.** Adicionar `G.debugBot(dias, modo)`, que roda as regras da seção 2 sem tela e devolve uma tabela por dia: nível do reino, ouro do tesouro, soma do ouro dos heróis, níveis, quedas, Marés vencidas e perdidas, chefes, passo da jornada, `G.errorCount`.

**Onde.** Módulo novo antes de `90-main.js`. Acesso por um botão escondido em Mais › Opções (por exemplo, sete toques no número da versão) que mostra a tabela numa janela com botão "Copiar".

**Por quê.** As fases 3 e 4 mudam equilíbrio. Sem esse medidor, ninguém sabe se melhorou ou piorou.

**Aceite.**
- `G.debugBot(46, 'normal')` termina sem erro e a tabela pode ser copiada no celular.
- Os números da versão atual ficam registrados como linha de base, perto dos da tabela da seção 2.
- O jogador automático não grava no save real: roda sobre uma cópia do estado e restaura no fim.

### T1. Lista de verificação manual

Entregar junto com cada fase uma lista curta de toques para o dono repetir no celular: novo jogo até contratar o quarto herói, construir Enfermaria e Ferraria, forjar duas peças, abrir cada aba, girar o aparelho, sair por 2 minutos e voltar.

---

## 5. Fase 1 — Erros confirmados

### B1. Mão-guia aponta para botão escondido

- **Problema.** No primeiro passo da jornada, com o painel Reino, Heróis ou Missões aberto, o guia diz "Toque no + para chamar um herói" e a mão fica em cima do título do painel. O "+" está atrás do painel. [MEDIDO: mão em (48, 87) com painel aberto]
- **Onde.** Módulo `67-ui-clareza.js`, função `guideTarget`, ramo `if (st === 0)`. Âncora: `const b = $('#roster .hc.add'); return vis(b) ?`
- **Causa.** Esse ramo usa `vis(b)` mas não `covered(b)`. O ramo de missão cumprida, logo acima, já usa `covered`. [CÓDIGO]
- **Fazer.** Se o painel Heróis estiver aberto, apontar para o botão "Abrir" do Portal dentro dele. Se outro painel estiver aberto, apontar para o ✕ do painel com o texto "Feche o painel e toque no Portal". Só apontar para o "+" quando ele não estiver coberto.
- **Aceite.** Em jogo novo, abrir cada um dos quatro painéis: a mão nunca fica sobre um elemento que não seja o alvo real.

### B2. Selo de Artes cobre o nome da classe no cartão do herói

- **Problema.** Na lista de Heróis, o selo com o livro e o número fica por cima do nome da classe: lê-se "Espadach", "Arqueir", "Cavalein". Acontece em 390 px e em 1280 px. [VISTO]
- **Onde.** Elemento `.pill.hc-up` dentro de `button.hc-top`, sobre `.hc-sub`. Montado em `61-ui-sheets.js`, seção `HERÓIS`.
- **Fazer.** Tirar o selo de cima do texto: colocá-lo no canto do retrato ou numa linha própria. Em 1280 px, o rótulo "Curar" também aparece cortado ("Cura"): dar largura mínima ao botão.
- **Aceite.** Com um herói de classe "Espadachim" e 9+ pontos de Artes, nome da classe e selo aparecem inteiros em 360, 390 e 1280 px.

### B3. Tela larga: painel cobre o botão MAIS

- **Problema.** Em 1280×800, com um painel aberto, a barra de navegação fica parcialmente atrás do painel lateral e o botão MAIS some. [VISTO]
- **Onde.** Regras de `#nav` e `#sheet` para largura a partir de 860 px (o código usa `window.innerWidth < 860` como corte).
- **Fazer.** Em tela larga, a navegação termina onde o painel começa, ou o painel passa a ter a navegação dentro dele.
- **Aceite.** Em 1280×800 e 1024×768, os seis botões ficam visíveis e tocáveis com qualquer painel aberto.

### B4. Celular deitado

- **Problema.** Em 844×390, HUD e rodapé ocupam cerca de 220 dos 390 px. Sobra perto de 170 px de mapa. O botão flutuante "Decretos" fica por cima do "Pronto" da faixa de objetivo. Um painel aberto cobre a tela toda. [VISTO]
- **Fazer.** Escolher uma das duas saídas e dizer qual escolheu:
  - Barata: quando a altura for menor que 480 px, mostrar um aviso "Gire o aparelho" sobre o jogo pausado.
  - Completa: layout deitado com o HUD numa coluna à esquerda e o painel numa coluna à direita.
- **Aceite.** Em 844×390 nenhum botão cobre outro, e o mapa fica com pelo menos 60% da altura, ou o aviso de girar aparece.

### B5. Dicas da Rosa por cima de painéis e em dobro

- **Problema.** As dicas contextuais ("A peça fica à venda no Armazém…", "Use a velocidade…") disparam por tempo, mesmo com painel aberto. A mão aponta para um botão da navegação e o balão cobre conteúdo, incluindo o botão "Resgatar" em Missões. O mesmo texto aparece ao mesmo tempo no aviso do topo e no balão. [VISTO]
- **Onde.** Último bloco antes de `90-main.js`. Âncora: `const show=(key,text,selector)=>`
- **Fazer.** Só disparar com o mapa visível (`!UI.sheet && !UI.modalOpen`). Mostrar em um lugar só: o balão com a mão. Deixar o registro guardar o texto sem aviso no topo.
- **Aceite.** Com um painel aberto, nenhuma dica aparece; ela espera o painel fechar. Nenhuma dica aparece duplicada.

### B6. Quadrado amarelo em todos os botões da navegação

- **Problema.** Depois do começo do jogo, um quadrado amarelo de 8×8 px aparece no canto de todos os botões da navegação ao mesmo tempo, sem número. Ele não é o contador (`.dot`), que continua funcionando ao lado. [MEDIDO: `#nav button::after`, 8×8, cor `rgb(246,213,122)`, presente em `#nav-reino` com contador zerado]
- **Fazer.** Achar a regra que cria o `::after` e a condição que a liga. Se for marca de "novidade", ligar só no botão que tem novidade e apagar quando o painel for aberto. Se for sobra de estilo, remover.
- **Aceite.** Num save do dia 46 sem nada pendente, nenhum botão mostra marca. Com um contrato pronto, só Missões mostra.

### B7. Avisos repetidos no começo do jogo

- **Problema.** Nos primeiros 5 minutos de um jogo novo, sem o jogador fazer nada, o aviso "Novidades disponíveis no registro" apareceu como "×4" com mais "+10" na fila. [VISTO]
- **Fazer.** Achar quem emite esse aviso. Em jogo novo ele não deve aparecer: não há novidade para quem acabou de chegar. No resto do jogo, no máximo uma vez por abertura do registro.
- **Aceite.** Jogo novo parado por 5 minutos: zero avisos de "Novidades".

### B8. Cartão de prédio passa por baixo do rodapé

- **Problema.** Em 390×844 o cartão da Ferraria nível 8 vai de 387 a 792 px de altura na tela, e a faixa de objetivo começa em 752. A lista "Lá dentro agora" e os botões do fim ficam cortados. [MEDIDO]
- **Onde.** `6H-ui-predio.js`, elemento `#bcard`.
- **Fazer.** Limitar a altura do cartão ao espaço entre o HUD e a faixa de objetivo, com rolagem interna, ou esconder a faixa enquanto o cartão está aberto.
- **Aceite.** Em 360×640 e 390×844, o botão "Evoluir" do cartão fica sempre visível sem rolar a página.

### B9. Rótulos no mapa batendo uns nos outros

- **Problema.** Placas de prédios se sobrepõem ("Treino 6" por cima de outra placa) e balões de fala cobrem placas. Nomes de elite ficam longos demais: "Alfa errante · Elite Gélido · Goblin Batedor Nv 19" sai pela borda da tela. [VISTO]
- **Fazer.**
  - Elite: mostrar só o nome curto e o nível sobre o monstro; os modificadores viram ícones pequenos e o texto completo fica no painel de inspeção.
  - Placas: quando duas se cruzam, mostrar só a do prédio mais perto do centro da tela.
  - Balão de fala: prioridade menor que placa.
- **Aceite.** Em zoom padrão sobre a praça no dia 46, nenhuma placa cobre outra, e nenhum rótulo de monstro passa de 60% da largura da tela.

---

## 6. Fase 2 — HUD e interface

### U1. Um estilo só

- **Problema.** O jogo tem duas linguagens visuais ao mesmo tempo. O comentário no topo do CSS base declara a regra da casa: contorno duro, sem degradê, sem sombra borrada, três fontes de pixel. A camada `<style id="visual-referencia">` usa fonte Georgia com serifa, degradês, `drop-shadow`, brilho borrado e cantos arredondados no HUD, na navegação, nos botões e nas abas. O resultado é botão em Georgia ao lado de texto em pixel na mesma tela. [CÓDIGO e VISTO]
- **Fazer.** Perguntar ao dono qual das duas direções ele quer, mostrando duas capturas. Depois aplicar a escolhida em tudo e apagar a outra:
  - Direção pixel: remover Georgia e degradês; refazer molduras do HUD com as molduras de 9 fatias que já existem em `56-ui-pixel.js`.
  - Direção pergaminho e bronze: assumir Georgia para títulos e botões, manter pixel só para o mundo e os números, e atualizar o comentário da regra da casa.
- **Aceite.** Uma regra escrita no topo do CSS e nenhuma tela que a contrarie. Nenhuma tela mistura duas famílias de fonte no mesmo tipo de elemento.

### U2. Densidade de pixel

- **Problema.** O terreno aparece em blocos grandes e irregulares, os sprites em outro tamanho de pixel e a interface em um terceiro. Perto das muralhas a diferença fica visível. [VISTO]
- **Fazer.** Medir quantos pixels de tela vale um pixel de arte no terreno, nos sprites e nos ícones em zoom padrão. Alinhar o terreno ao mesmo valor dos sprites.
- **Aceite.** Em zoom padrão, terreno e personagens têm o mesmo tamanho de pixel.

### U3. Painéis longos demais

- **Problema.** Com área útil de 696 px, alguns painéis rolam muito: Ateliê 3.286 px, Forjar 2.787, Cidade 2.111, Livro 2.081, Equipamento 2.053. [MEDIDO]
- **Fazer.**
  - Forjar: cada peça vira uma linha compacta (ícone, nome, custo, um botão). "Obra-prima" vira segunda ação dentro da linha expandida.
  - Ateliê e Equipamento: grade de duas colunas.
  - Cidade: prédios já no máximo permitido vão para um grupo recolhido no fim.
- **Aceite.** Nenhum painel principal passa de 3 telas de rolagem num save do dia 46.

### U4. Mesma lista em dois lugares

- **Problema.** A lista de equipamentos aparece em Forja › Armazém e em Armazém › Equipamento, com a mesma altura de conteúdo (2.053 px). [MEDIDO; confirmar se o conteúdo é idêntico]
- **Fazer.** Manter só Armazém › Equipamento. Em Forja, deixar um atalho de uma linha.
- **Aceite.** Um caminho só para vender, desmontar e aprimorar.

### U5. Ação perigosa em destaque

- **Problema.** "Desmontar tudo" por raridade fica logo abaixo dos filtros, com seis botões grandes, antes da própria lista. [VISTO]
- **Fazer.** Mover para o fim da lista ou para um menu. Confirmar sempre, mostrando quantas peças somem e o que volta.
- **Aceite.** Nenhum toque único desmonta mais de uma peça.

### U6. Mapa do mundo de verdade

- **Problema.** O zoom vai de 1 a 5 e no mínimo ainda mostra só a cidade. A visão geral é uma janela com uma miniatura pequena e uma lista de zonas com três botões cada. [MEDIDO e VISTO]
- **Fazer.** Mapa do mundo ocupando a janela, com as seis zonas tocáveis, posição dos heróis, chefes acordados e bandeiras. Tocar numa zona abre o cartão dela com as mesmas três ações de hoje.
- **Aceite.** Dá para mandar todos para uma zona com dois toques a partir do mapa.

### U7. HUD em repouso

- **Problema.** O botão de dificuldade (caveira) ocupa lugar fixo na primeira linha, embora se use raramente. "Atividades" e "Decretos" flutuam sobre o lado direito do mapa. As quatro fichas de moeda não têm rótulo. [VISTO]
- **Fazer.**
  - Dificuldade vai para o painel Reino.
  - "Decretos" entra dentro de "Atividades", que já lista Decretos.
  - Primeiro toque numa ficha de moeda mostra o nome e para que serve.
- **Aceite.** Com o jogo em repouso em 390×844, só um botão flutua sobre o mapa além dos dois da esquerda.

### U8. Barras do cartão de herói

- **Problema.** Quatro barras finas sem rótulo (vida, saciedade, ânimo, vigor). A legenda só aparece no fim da lista. [VISTO]
- **Fazer.** Ícone pequeno à esquerda de cada barra, como já existe na ficha.
- **Aceite.** Dá para saber qual barra é qual sem rolar.

### U9. Fila de heróis no topo

- **Problema.** Com 11 heróis, o topo mostra 7 e um "+4". A ordem muda por alerta e nível, então um herói conhecido some para dentro do "+4". [VISTO]
- **Fazer.** Deixar o jogador fixar até três heróis na frente da fila. O resto continua na ordem automática.
- **Aceite.** Um herói fixado nunca vai para o "+N".

---

## 7. Fase 3 — Economia e progressão

Antes de mexer em qualquer número desta fase, rodar `G.debugBot` e guardar a linha de base. Depois de mexer, rodar de novo e mostrar as duas tabelas lado a lado.

### E1. Ouro parado na carteira dos heróis

- **Problema.** No dia 46 os heróis somavam 162.637 moedas e o tesouro tinha 10.694. Uma heroína sozinha tinha 63.629. No dia 13 a relação já era 13.422 contra 508. [MEDIDO]
- **Causa provável.** O jogador só recebe quando o herói gasta na cidade. As saídas do herói não acompanham a renda dele:
  - Equipamento: compra cada peça uma vez por grau, e o grau máximo depende do nível da Ferraria.
  - Treino: só para quem está abaixo do teto do Rank (`h.lvl<G.RANK_CAP[h.rank]` em `G.heroOptions`), e é a maior fonte do tesouro: 12.632 de 30.689 moedas no dia 45. Herói no teto para de pagar. [CÓDIGO e MEDIDO]
  - Refeição, descanso, cura e poção custam pouco.
- **Fazer.** Dar ao herói rico onde gastar, usando o que já existe:
  - Herói paga para aprimorar (+N) a própria peça na Ferraria quando tem ouro sobrando.
  - Herói no teto do Rank ajuda a pagar a própria promoção.
  - Refeição de luxo na Taverna com preço proporcional à carteira (o campo `h.lux` já existe em `arrive`).
  - Doação para Obras públicas quando o ânimo está alto.
- **Aceite.** No jogador automático, dia 45: soma das carteiras no máximo 3× o tesouro, sem o tesouro passar de 2× a linha de base. Confirmar esse alvo com o dono.

### E2. Materiais das primeiras zonas sem uso

- **Problema.** No dia 46: 3.280 de Couro, 3.100 de Gosma, 3.418 de Pó de Ocre, 1.789 de Tendão. Os cinco recursos básicos estavam todos no teto do armazém (1.694). [MEDIDO]
- **Limite do teste.** O jogador automático não usa reforja, decoração nem Obra-prima, que consomem parte disso.
- **Fazer.** Conversão no Mercado: N unidades do material de uma zona viram 1 da zona seguinte, com taxa ruim de propósito. Venda de material de zona no Mercado.
- **Aceite.** No dia 45 do jogador automático, nenhum material comum passa de 1.000 sem ter um uso oferecido na tela.

### E3. Núcleos acumulando

- **Problema.** 295 Núcleos no dia 46. [MEDIDO]
- **Limite do teste.** O jogador automático só gasta Núcleo para invocar quando há cama livre; não faz Obra-prima.
- **Fazer.** Primeiro medir com um jogador automático que também faz Obra-prima. Se ainda sobrar, criar uma saída de valor alto e repetível.
- **Aceite.** Decisão registrada com o número medido.

### E4. Jornada em fila única

- **Problema.** A jornada tem 35 passos em sequência (`G.QUESTS`). Um passo lento segura todos os seguintes. No jogador automático, "Tenha 8 heróis" ficou ativo do dia 5 ao dia 19. Parte disso vem das prioridades do próprio jogador automático. [MEDIDO, com ressalva]
- **Fazer.** Mostrar dois ou três passos ativos ao mesmo tempo quando um deles depende de espera longa. Não mudar os índices dos passos: saves antigos guardam `S.quest.step`.
- **Aceite.** Nenhum passo fica como único objetivo por mais de 5 dias de jogo no jogador automático.

### E5. Zonas com o mesmo nível

- **Problema.** No dia 46: Bosque nível 49, Ruínas 51, Ermos 48, Pântano 46. A corrupção sobe a cada chefe e iguala tudo. [VISTO]
- **Pergunta ao dono.** É intencional que a primeira zona acompanhe a última? Se não for, limitar a corrupção de cada zona a um teto relativo à zona seguinte.

### E6. Retorno do tempo ausente

- **Observado.** Três horas fora renderam 13 dias simulados, 246 mil moedas, 22 níveis de herói, 3 Marés repelidas e 4 decisões tomadas sozinhas. [MEDIDO]
- **Fazer.** Só conferir, depois de E1, que o retorno não rende mais por hora do que jogar presente. Não mudar a regra de 50% e 30% sem pedir.

---

## 8. Fase 4 — Dificuldade e peso das decisões

### D1. Normal não oferece risco

- **Problema.** Um jogador automático que diz sim para tudo venceu as 8 Marés, não perdeu nenhuma e teve 6 quedas em 12.635 abates. No Pesadelo, o mesmo jogador teve 17 quedas e perdeu 2 de 3 Marés em 21 dias. Sem tocar em nada, o reino trava no nível 10 e perde todas as Marés. [MEDIDO]
- **Leitura.** O jogador precisa agir, mas no Normal quase toda ação certa é "tocar quando o selo acende". Não há escolha que custe algo.
- **Cuidado.** O código tem uma intenção declarada de "quedas raras e dramáticas" (módulo `3F-atrito.js`). Não aumente quedas sem perguntar. O alvo é dar peso às decisões, não punir.
- **Fazer, em ordem de preferência.**
  1. Escolhas com custo real: a preparação da Maré (portão, poções, chamar todos) hoje é gratuita. Cada opção deve tirar algo: chamar todos interrompe a caçada, poções saem do estoque de venda.
  2. Maré com alvo: avisar qual prédio os sapadores vão atacar, para o jogador decidir se defende.
  3. Só depois, se o dono quiser, apertar o Normal.
- **Aceite.** No Normal, o jogador automático que diz sim para tudo perde pelo menos 1 Maré em 8. Um segundo jogador automático que escolhe a preparação pela situação não perde nenhuma. Confirmar o alvo com o dono.

### D2. Eventos da cidade com opção sempre melhor

- **Problema.** Vários eventos têm uma opção gratuita e boa, e o próprio jogo a escolhe sozinho quando o prazo vence (`e.auto`). [CÓDIGO]
- **Fazer.** Revisar os oito eventos de `G.EVENTS`: cada um precisa de duas opções que um jogador sensato escolheria em situações diferentes.
- **Aceite.** Para cada evento, uma frase dizendo quando escolher cada opção.

---

## 9. Fase 5 — Inteligência dos heróis e dos monstros

O que foi lido: `G.heroOptions`, `G.heroDecide`, `G.pickZone`, `findTarget`, `hunt`, `defend`, `G.heroAct`, `G.dodgeZone`, `G.MBEH`, `G.BOSS`, `G.bossThink`, `G.raidRole`. Não foram lidos `G.roleMove`, `G.groupMove`, `G.huntGroup`, `G.engageRisk` nem `G.retreatThr`. Leia esses antes de mexer nesta fase.

### I1. Herói não sabe gastar (ligado a E1)

- **[CÓDIGO]** `G.wantItem` só compra peça melhor que a atual. Não há decisão de gasto para quem já tem tudo.
- **Fazer.** As novas saídas de E1 entram como opções em `G.heroOptions`, com pontuação que cresce com a carteira. O motivo aparece no "Por quê?".

### I2. Escolha de alvo só por distância e bônus fixos

- **[CÓDIGO]** Em `findTarget`, a pontuação é a distância menos bônus fixos: alvo marcado, xamã, atirador, quem ataca aliado frágil.
- **[HIPÓTESE]** Não entra a vida restante do monstro, então dois heróis podem gastar golpes num alvo quase morto enquanto outro alvo fica livre.
- **Fazer.** Confirmar com um registro de combate antes de mudar. Se for verdade, somar um termo pequeno para alvo que morre no próximo golpe e descontar alvo que já tem dano suficiente a caminho.

### I3. Tornar a IA visível no mapa

- **Problema.** O motivo de cada decisão existe, mas só aparece dentro da ficha. No mapa, o jogador vê o herói indo embora sem saber por quê.
- **Fazer.** Ao mudar de intenção, um ícone curto sobre o herói por 2 segundos (bolsa cheia, fome, fuga, compra).
- **Aceite.** Seguindo um herói por um dia de jogo, toda ida à cidade tem um ícone de motivo.

### I4. Monstros

- **[CÓDIGO]** Nove comportamentos e sete chefes com golpes próprios. Nenhum erro encontrado na leitura.
- **[HIPÓTESE]** O jogador não percebe a diferença entre eles em jogo normal, porque as lutas comuns terminam rápido.
- **Fazer.** Só depois de D1. Medir quanto dura uma luta comum e quantos avisos de ataque chegam a aparecer.

---

## 10. Fase 6 — Arte e sensação de jogo

- **A1.** É a tarefa U1. Fazer primeiro.
- **A2.** É a tarefa U2.
- **A3. Noite pouco legível.** Às 23h, de perto, a praça parece dia com lampiões acesos; a noite só se nota com o zoom afastado. [VISTO] Fazer: escurecer mais o chão fora do alcance dos lampiões no zoom padrão, mantendo personagens legíveis.
- **A4. Variedade de monstros.** No Pântano, seis vespas idênticas na mesma tela. [VISTO] Fazer: variação pequena de tom e tamanho por indivíduo, usando o identificador do monstro como semente.
- **A5. Tela de título.** Simples e boa. Não mexer.
- **A6. Impacto dos golpes.** O código já tem tremor de tela, vibração e recuo. Não foi possível avaliar a sensação num navegador sem tela. Pedir ao dono um vídeo curto de um combate antes de mudar qualquer coisa.

---

## 11. Fase 7 — Desempenho e código

### C1. Funções redefinidas em cadeia

- **Problema.** Módulos posteriores guardam a função antiga e colocam outra por cima. Contagem de atribuições à mesma função: `UI.build` 11, `G.killMon` 8, `G.heroFall` 6, `G.heroBonus` 6, `G.nextReward` 6, `UI.open` 6, `G.updateHero` 4, `G.dmgToMon` 4, `UI.itemModal` 4, `UI.inspect` 4, `UI.closeModal` 4. O sistema de ganchos (`G.hook`, 101 usos) já existe para isso. [MEDIDO]
- **Risco.** O comportamento depende da ordem dos módulos, e um erro numa camada derruba as outras.
- **Fazer.** Uma função por entrega, começando por `G.killMon`: juntar as camadas num corpo só com ganchos nomeados (`monsterKilled` etc.). Rodar `G.debugBot` antes e depois; os números devem ficar dentro da variação normal entre duas execuções.
- **Aceite.** Cada função da lista com uma definição só.

### C2. Tamanho de fonte forçado elemento por elemento

- **Problema.** `UI.q8Scale` percorre todos os elementos com texto, lê o estilo calculado de cada um e grava `font-size … !important` direto no elemento. Isso roda sobre o painel inteiro e impede o CSS de mandar no tamanho. Âncora: `UI.q8Scale=root=>`. [CÓDIGO]
- **Fazer.** Trocar por uma variável CSS de escala na raiz (`--ts`) e tamanhos escritos como `calc(Npx * var(--ts))`, com `max(11px, …)`.
- **Aceite.** Nenhum elemento com `data-q8-font`. A opção "Tamanho do texto" continua funcionando em todas as telas.

### C3. Modo leve automático não percebe lentidão fora do desenho

- **Problema.** `fxWatch` só reage quando o desenho pesa pelo menos 22% do quadro e 5 ms. Âncora: `FX.bad = avg > 20 && dw > 5 && dw > 0.22 * avg`. Com o processador limitado a um quarto, o jogo ficou em 24 quadros por segundo com o desenho em 7 ms de 38 ms (18,5%), e o modo leve não ligou. [MEDIDO]
- **Ressalva.** Medido em navegador sem placa de vídeo, que exagera o custo de compor a página. Confirmar num celular de entrada antes de mudar.
- **Fazer.** Se confirmar: quando o quadro passa de 28 ms por 6 segundos, reduzir primeiro o que custa fora do canvas (sombras e filtros do HUD, frequência do guia), depois a resolução.
- **Aceite.** Num celular de entrada real, o jogo fica acima de 30 quadros por segundo no dia 46 ou liga o modo leve sozinho.

### C4. CSS com 72 `!important`

- **Fazer.** Depois de U1, quando sobrar uma camada visual só, remover os `!important` que existiam para uma camada vencer a outra.

### C5. Código em linhas únicas

- **Problema.** Os módulos das fases mais novas estão em linhas de mais de 1.000 caracteres, o que torna a substituição por âncora frágil.
- **Fazer.** Ao tocar numa função dessas, reformatá-la em várias linhas na mesma entrega. Não reformatar o arquivo inteiro de uma vez.

---

## 12. Fase 8 — O que não foi analisado

Nada abaixo foi testado. Não assuma que funciona nem que está quebrado.

- Fenda Infinita, Arena, Incursões e a luta do Colosso com tela.
- Vocações, Artes Secretas, Despertar, Renascer.
- Mascotes, montarias, decoração, guarda-roupa.
- Reforja, inscrições, ressonância, Obra-prima.
- Calendário de 7 dias, criatura da sorte, semana temática.
- Áudio: só o cabeçalho do módulo foi lido. Sabe-se que é sintetizado, com limite de 32 vozes. Ninguém ouviu.
- Safari do iPhone, celulares de entrada reais, teclado e leitor de tela.
- Partidas além do dia 46: zonas 5 e 6, Rank S em diante, renascimento.

**Fazer.** Estender `G.debugBot` para usar um sistema por vez (primeiro Fenda, depois Arena, depois vocações) e repetir a tabela. Para cada sistema, entregar a mesma auditoria desta seção 2: erros, números, capturas.

---

## 13. Ordem recomendada e tamanho de cada entrega

| Entrega | Conteúdo | Risco |
|---|---|---|
| 1 | T0, T1 | baixo |
| 2 | B1, B2, B5, B6, B7 | baixo |
| 3 | B3, B4, B8, B9 | médio |
| 4 | U1 (decisão do dono) e U2 | médio, muda a cara do jogo |
| 5 | U3, U4, U5, U8 | baixo |
| 6 | U6, U7, U9 | médio |
| 7 | E1 e I1, com tabela antes e depois | alto, muda equilíbrio |
| 8 | E2, E3, E4 | médio |
| 9 | D1, D2 | alto, muda equilíbrio |
| 10 | C1 (uma função por vez), C2 | médio |
| 11 | C3, C4, I2, I3, A3, A4 | baixo |
| 12 | Fase 8, um sistema por vez | — |

## 14. Perguntas para o dono antes de começar

1. Estilo visual: pixel art puro ou pergaminho e bronze com fonte serifada? (U1)
2. Celular deitado: aviso "gire o aparelho" ou layout próprio? (B4)
3. O Normal deve continuar sem derrotas para quem só aceita tudo? (D1)
4. A primeira zona deve acompanhar o nível da última? (E5)
5. Qual a relação aceitável entre o ouro dos heróis e o do tesouro? (E1)
