# Aurora — Crônicas da Fenda · Plano de melhorias (v27 → v28)

> **Para quem é este documento:** para a IA (ChatGPT) que vai editar o jogo.
> **Arquivo base:** `aurora-v27-faseC.html` (v27.0, build `Aurora_ciclo_038_reino_sem_pausa`).
> **Como foi feito:** leitura do código, jogo rodado em navegador emulando celular (390×844 e 360×640), um robô jogando 8 horas simuladas em velocidade 1×, e testes de save. Tudo o que está em "Diagnóstico" foi medido ou visto; o que é só suspeita está marcado como **[verificar]**.
> **Capturas de tela:** pasta `evidencias/` ao lado deste arquivo.

---

## 0. Instruções para a IA que vai executar

**Seu papel:** engenheiro(a) de jogos sênior responsável por evoluir um jogo já maduro. Você **não** está criando um jogo novo e **não** deve reescrever o que funciona.

**Objetivo geral:** deixar o jogo melhor de jogar, e não maior. Hoje ele tem 34 sistemas e um núcleo raso. A prioridade é: (1) não perder o save do jogador, (2) limpar a tela, (3) dar profundidade ao combate e à inteligência de heróis e monstros, (4) acertar o ritmo, (5) polir arte e som.

**Regras que valem para todas as fases** (se uma tarefa conflitar com uma regra, a regra vence):

1. **Um arquivo só.** A entrega continua sendo um único `.html` que abre direto no navegador, sem internet, sem bibliotecas externas, sem imagens ou sons em arquivo. Toda arte e todo som continuam gerados por código.
2. **Save compatível.** Não mude `G.SAVE_KEY` (`aurora.v19.save`). Todo campo novo no estado nasce com valor padrão ao carregar um save antigo. Um save da v27 tem de abrir na v28 sem perder nada.
3. **Nenhum sistema novo** até as Fases 0 a 4 estarem entregues e aceitas. As únicas exceções estão escritas neste plano (bandeiras de recompensa, grupos de caça).
4. **Edite por trechos, nunca reescreva o arquivo inteiro.** O arquivo tem 1,6 MB e 19.099 linhas. Use uma ferramenta de código (Python ou Node) para aplicar substituições localizadas. Ache o lugar pelo cabeçalho do módulo (`/* ===== 30-heroes.js ===== */`) e pelo nome da função. Os números de linha deste plano são da v27 e servem só de referência.
5. **Simulação separada da tela.** Módulos `0x` a `3x` não tocam em DOM (rodam em Node com `G.HEADLESS`). Módulos `4x` a `6x` são arte e interface. Mantenha essa separação.
6. **Nada reconstruído por quadro na interface.** A regra do `60-ui.js` continua: a estrutura só é refeita quando um evento muda, e os números são atualizados nó a nó.
7. **Não adicione novos "embrulhos" de função.** Hoje módulos posteriores redefinem funções anteriores (`const tk0 = G.tick; G.tick = ...`). Código novo usa o registro de ganchos da tarefa F0.5.
8. **Textos em português do Brasil**, no mesmo tom do jogo. Sem palavras em inglês na interface.
9. **Uma fase por entrega.** Não misture fases. Cada entrega segue o formato da seção 6.
10. **Não afirme que testou o que não testou.** Se não conseguiu rodar um teste, escreva "não testado" e por quê.
11. Ao subir de versão: `G.VERSION = '28.0'`, novo `G.BUILD`, e uma seção nova na janela de novidades (`67-ui-clareza.js`, "novidades").

---

## 1. Retrato do jogo (para você não precisar redescobrir)

**Gênero:** reino ocioso com heróis autônomos (no estilo de *Majesty* e dos jogos da Kairosoft). Os heróis caçam sozinhos; o jogador constrói a cidade, forja equipamento, recruta pelo Portal e usa quatro poderes (Decretos).

**Estrutura do arquivo**

| Parte | Onde | Observação |
|---|---|---|
| CSS | linhas 13–613 | três fontes de pixel embutidas em base64 (44 KB) |
| Script único | linhas 618–19097 | 64 módulos concatenados, cada um com cabeçalho `/* ===== NN-nome.js ===== */` |
| Espaço global | `G` | estado em `G.S`, interface em `G.UI`, desenho em `G.R`, arte em `G.A`, laço em `G.M` |

**Ordem dos módulos:** `00-core`, `10-data`, `20-world`, `30-heroes`, `31-monsters`, `32-town`, `33-meta`, `3J-ausencia`, `3K-decisoes`, `3L-predios`, `3M-vida`, `34-vocacoes`, `35-legado`, `36-companheiros`, `3N-adocao`, `37-forja-sorte`, `40-art`, `41-art-mon`, `42-art-world`, `50-render`, `51-voc-art`, `52-legado-art`, `53-companheiros-art`, `54-vida-art`, `56-ui-pixel`, `57-ui-icons`, `58-ui-sprites`, `60-ui`, `61-ui-sheets`, `62-ui-modals`, `63-ui-forja-sorte`, `70-audio`, `38-retorno`, `64-ui-retorno`, `39-arena`, `65-ui-arena`, `3A-lendas`, `66-ui-lendas`, `3B-clareza`, `67-ui-clareza`, `3C-colosso`, `68-ui-colosso`, `3D-rivais`, `69-ui-rivais`, `3E-renascer`, `6A-ui-renascer`, `3F-atrito`, `6B-ui-atrito`, `3G-cidade`, `6C-ui-cidade`, `3H-sinergias`, `6D-ui-sinergias`, `3I-progressivo`, `6E-ui-progressivo`, `6F-ui-livro`, `6G-ui-decisoes`, `6H-ui-predio`, `6I-ui-ausencia`, `6J-ui-adocao`, `6K-ui-atalhos`, `6L-ui-limpeza`, `90-main`.

**Funcionamento**

- Laço em `90-main.js`: `requestAnimationFrame`, passo de simulação de no máximo 0,034 s, velocidade 1× a 3×, interface atualizada 4 vezes por segundo, salvamento automático a cada 20 s em `localStorage`.
- Tempo ausente é simulado de verdade (`3J-ausencia.js`): 50% do tempo nas primeiras 8 h, 30% nas 8 h seguintes, teto de 16 h, orçamento de 6 s de processamento.
- Desenho em Canvas 2D (`50-render.js`): ladrilho de 16 px, zoom inteiro, densidade de pixels até 3.
- Personagens de 26×30 px com 11 quadros (parado 2, andando 4, ataque 3, inclinado 2), sempre de perfil e espelhados.
- Monstros: 34 entradas em `G.MON` desenhadas com **14 moldes** (`fam`), 4 quadros cada.
- Som (`70-audio.js`): 45 efeitos sintetizados e **uma** trilha (4 acordes em ré dórico com notas soltas; fica mais grave à noite e mais rápida na Maré).
- Padrão de extensão: função redefinida por módulos posteriores. Contagem na v27: `G.tick` 14 vezes, `G.newGame` 13, `G.afterLoad` 13, `UI.refresh` 13, `G.killMon` 8, `G.heroBonus` 6.

**Conteúdo**

| Item | Quantidade |
|---|---|
| Classes / vocações | 6 / 36 |
| Traços de herói | 21 |
| Ranks | 8 (E a SSS), nível máximo 80, depois renascimento |
| Zonas de caça | 6 (abrem no Nível de Reino 1, 3, 7, 12, 18 e 25) + Cratera |
| Chefes / Colossos | 7 (6 de zona + Arauto da Fenda Infinita) / 3 |
| Construções | 16 |
| Espaços de equipamento | 8 |
| Eventos aleatórios | 8 |
| Decretos (poderes do jogador) | 4 |
| Missões da Jornada | 35, depois decretos reais sem fim |
| Sistemas no catálogo `G.SYSTEMS` | 34 |
| Barra inferior | 6 botões; Missões tem 8 abas, Mais 7, Reino 6, Armazém 5 |

**O que o jogador controla hoje:** construir e melhorar, forjar, recrutar, promover, escolher vocação, ordenar zona por herói (`order`), nível de cautela (`caution`), chamar de volta (`recall`), curar pagando, marcar um monstro como alvo (`mark`), 4 Decretos, decisões de eventos, dificuldade.

---

## 2. Diagnóstico

### 2.1 O que está bom e deve ser preservado

- Arte de pixel procedural coerente: cidade, prédios que mudam com o nível, luz da noite, retratos.
- Simulação separada da interface, com modo sem tela para testes.
- Progresso offline simulado de verdade e resumo de retorno claro (`evidencias/06`).
- Abertura progressiva dos sistemas (`3I-progressivo.js`) e Livro do Reino.
- Eventos que não pausam o jogo (`3K-decisoes.js`).
- Desempenho no computador: com 16 heróis e 75 monstros, 0,3 ms por passo de simulação e 1,4 ms por quadro desenhado. Nenhum erro no console em 8 h simuladas.

### 2.2 Problemas encontrados, por gravidade

**Crítico — perda de save (confirmado em dois testes)**

- Teste A: save com JSON cortado (como numa gravação interrompida). O botão "Continuar jornada" aparece; ao tocar, o jogo começa do zero em silêncio e **grava por cima** do save (97 dias de reino viraram 6 KB de jogo novo).
- Teste B: save válido com um único campo inesperado (`heroes[0].gear = null`). `G.vocMigrate` lança exceção dentro de `G.afterLoad`, e o resultado é o mesmo: jogo novo gravado por cima.
- Causa: em `M.start` (`90-main.js`), `if (fresh || !M.load()) G.newGame();` seguido de `M.save()`. Qualquer exceção em qualquer uma das 13 camadas de `G.afterLoad` cai nesse caminho. Não há cópia de segurança.

**Alto — tela poluída** (`evidencias/01`, `04`, `05`)

- Em 360×640, a faixa de cima ocupa cerca de 200 px e a de baixo cerca de 110 px. Somando o trilho de 6 a 7 ícones grandes à direita, sobra pouco mais da metade da altura para o mapa.
- Com 16 heróis, a fileira de retratos mede 768 px de conteúdo em 378 px de largura: transborda para fora da tela.
- Balões de fala: a mesma frase aparece duas e três vezes ao mesmo tempo ("Valeu, Ícaro! Te devo uma." ×3), por cima do HUD e uns dos outros.
- Placas de prédio e balões ficam cortados na borda da tela ("spedaria 4", "averna 4") e escondidos sob o trilho da direita.
- A faixa "Um chefe despertou" cobre o centro do mapa.
- Painéis abrem só nos dois terços de baixo; o terço de cima fica ocupado pelo HUD escurecido, sem uso.
- Abas cortadas na horizontal sem indicação de rolagem ("Mate", "Códe", "Aren"). Missões tem 8 abas.
- Ficha do herói: o boneco com os espaços de equipamento fica fixo e ocupa cerca de 370 px; o conteúdo da aba escolhida fica com 70 a 100 px visíveis (`evidencias/02`).
- Texto pequeno: 65 ocorrências de `font-size:8px` (rótulos da barra, dos espaços de equipamento).
- No fim de jogo os selos da barra inferior marcam 10, 14 e 2 pendências ao mesmo tempo.
- Números de dano se sobrepõem ("2.217" sobre "1.837").
- Mapa do mundo pequeno, com rótulos cortados ("Reino nv 1…") e sem informação útil por zona (`evidencias/03`).
- Opções: só volume de efeitos, volume de música, modo leve e vibração.
- Acessibilidade: 3 atributos `aria-` no arquivo inteiro; raridade indicada só por cor.

**Alto — núcleo raso (combate e inteligência)**

- Todos os monstros comuns usam a mesma máquina de estados (`updateMon` em `31-monsters.js`): vagar, perseguir, voltar. As diferenças são só números e marcas (`ranged`, `pack`, `poison`, `burn`, `eva`). A marca `fly` não tem efeito nenhum na simulação.
- Os 7 chefes (6 de zona e o Arauto) compartilham **um** golpe em área avisado (raio 2,6, aviso de 1,3 s, mais frequente abaixo de 30% de vida). Fora o tamanho e os números, são iguais.
- O laço de caça do herói (`hunt` em `30-heroes.js`) é: achar alvo, andar até o alcance, bater, usar a habilidade quando recarrega, beber poção ou fugir abaixo de um limite. Arqueiros e magos não mantêm distância. Não há grupo nem formação na caça em campo aberto (a formação só existe na Arena e no Colosso).
- Durante a luta o jogador quase não tem o que fazer: 4 Decretos de tempo de recarga longo (240 a 600 s) e marcar alvo.
- 14 moldes de desenho para 34 monstros: Homem-Lagarto, Salamandra, Cultista e Xamã usam o molde do goblin; Quimera usa o do javali; Yeti o do orc; Treant e Golem de Magma o do golem; Vespa e Harpia o do morcego; Elemental o do espectro. Entre os chefes, Arauto repete o Lich, Mãe das Brumas repete a Hidra, Dragão repete o Wyrm.

**Alto — heróis parados no meio e no fim de jogo (medido)**

Amostra de 20 minutos de jogo, por estágio, com o robô jogando:

| Estágio | Caçando | Ocioso | "Sem zona segura" | Caído ou se recuperando | Abates/min | Quedas/h |
|---|---|---|---|---|---|---|
| 0–20 min | 54% | 2% | 0% | 0% | 32 | 0 |
| 60–80 min | 33% (+8% na Fenda) | 3% | 0% | 8% | 35 | 30 |
| 4 h | 26% (+6% na Fenda) | **24%** | **23%** | 7% | 60 | 51 |

Às 4 h, quase um quarto do tempo dos heróis é gasto parado na praça com `h.noZone = true`. Em `leaveTown` (`30-heroes.js`), se a zona mais fraca está mais de 8 níveis acima do herói, ele fica ocioso. Como a corrupção das zonas sobe a cada chefe vencido (opção ligada por padrão na aba Zonas) e os novatos chegam com 60% do nível médio (e os renascidos voltam ao nível 1), os mais fracos ficam sem onde caçar.

**Médio — ritmo e tensão** (uma partida do robô em 1×; os valores variam de partida para partida)

| Tempo de jogo | Dia | Nível do Reino | Maior nível | Heróis | Quedas (total) | Chefes | Maré (vitórias/derrotas) |
|---|---|---|---|---|---|---|---|
| 5 min | 2 | 2 | 6 | 4 | 0 | 1 | 0/0 |
| 30 min | 7 | 4 | 16 | 5 | 0 | 5 | 1/0 |
| 1 h | 13 | 7 | 28 | 7 | 1 | 14 | 2/0 |
| 2 h | 25 | 11 | 40 | 8 | 35 | 26 | 4/0 |
| 4 h | 49 | 18 | 54 | 12 | 119 | 57 | 8/0 |
| 8 h | 97 | 33 | 60 | 16 | 471 | 90 | 16/0 |

- O primeiro chefe cai antes dos 5 minutos, e nenhum herói cai nos primeiros 30: o começo não tem risco.
- A Maré da Fenda nunca foi perdida (16 a 0): não é ameaça.
- A última zona (Reino 25) abre entre 4 h e 8 h em 1×, ou seja, em menos de 3 h em 3×. Depois disso o conteúdo novo acaba e sobram só números maiores.
- Moedas e Núcleos sobraram muito no robô (612 mil moedas e 1.060 Núcleos às 8 h). O robô não gasta Núcleos e gasta moedas de forma conservadora, então isso é **[verificar]** com um robô que gaste tudo antes de mexer em preços.

**Médio — som**

- Uma trilha só para cidade, seis biomas, noite, chefe e Maré. Sem sons de ambiente. Sem compressor na saída (risco de estouro quando muitos efeitos tocam juntos).

**Médio — técnica**

- `Math.random` é usado direto na simulação: não dá para repetir uma partida com a mesma semente em teste.
- `G.emit` engole exceções dos ouvintes (só mostra com `G.DEBUG`): erros somem sem deixar rastro.
- Em densidade 3 a tela de desenho tem 1170×2532 px. Em emulação sem placa de vídeo e com processador 4× mais lento, caiu para cerca de 11 quadros por segundo. Essa emulação é pessimista; **[verificar]** em aparelho real.

### 2.3 Conclusão do diagnóstico

O jogo cresceu para os lados (34 sistemas) e a interface paga o preço. O centro da experiência, que é olhar os heróis e decidir, tem pouca variedade e pouca participação do jogador. Melhorar de verdade significa aprofundar o centro e limpar a tela, e não acrescentar mais uma aba.

---

## 3. Ordem das fases

| Fase | Tema | Por que nesta ordem |
|---|---|---|
| 0 | Save seguro, testes, base técnica | Sem isso, qualquer mudança pode destruir o progresso de alguém e não há como medir nada |
| 1 | HUD e interface | Maior ganho visível com menor risco |
| 2 | Combate: monstros e chefes | O coração do jogo |
| 3 | Inteligência dos heróis e participação do jogador | Depende dos comportamentos da Fase 2 |
| 4 | Ritmo e equilíbrio | Só faz sentido depois que o combate mudou |
| 5 | Arte e animação | Acompanha os comportamentos novos |
| 6 | Som | Idem |
| 7 | Conteúdo e história | Preenche o fim de jogo usando o que as fases anteriores criaram |
| 8 | Primeiros minutos, acessibilidade, opções | Polimento |
| 9 | Desempenho e limpeza de código | Contínuo; fechar no fim |

Cada tarefa abaixo tem: **Problema**, **O que fazer**, **Onde**, **Aceite**.

---

## 4. Tarefas

### FASE 0 — Fundamentos

**F0.1 Save à prova de perda**
- Problema: seção 2.2, "Crítico".
- O que fazer:
  1. `M.load` passa a devolver três resultados: `ok`, `vazio`, `falhou`. Só `vazio` leva a jogo novo.
  2. Em `falhou`, **nunca** chamar `G.newGame` nem `M.save`. Abrir uma tela de recuperação com: "Tentar a cópia de segurança", "Exportar o save bruto" (copia o texto cru para o jogador guardar) e "Começar do zero" (com confirmação).
  3. Cópias de segurança: a cada 10 minutos de jogo e na primeira carga de cada versão nova, copiar o save atual para `aurora.v19.save.bak1` e o `.bak1` anterior para `.bak2`. Só substituir uma cópia depois de confirmar que o texto novo passa em `JSON.parse`.
  4. Criar `G.repairState(d)`, chamada em `G.deserialize` antes de qualquer migração: garante tipo e valor padrão de cada campo usado (por exemplo `h.gear` objeto, `h.buff` objeto, `h.traits` lista, `S.zones[id]` completo, números finitos). Um campo ruim é consertado, e o save abre.
  5. Cada camada de `G.afterLoad` roda dentro de `try/catch` próprio. Se uma falhar, registrar o erro (F0.3), aplicar os padrões daquele sistema e continuar.
  6. Tratar `localStorage` cheio ou bloqueado com aviso visível uma vez por sessão, em vez do `catch` mudo.
  7. Em Opções: "Exportar para arquivo" (baixa um `.txt`) e "Importar de arquivo", além do código que já existe.
- Onde: `90-main.js` (`M.load`, `M.save`, `M.start`, `M.importSave`), `00-core.js` (`G.deserialize`), todas as redefinições de `G.afterLoad`, `60-ui.js` (`UI.showTitle`), `61-ui-sheets.js` (Opções).
- Aceite:
  - Teste A (JSON cortado em 70%): tela de recuperação aparece; o conteúdo de `aurora.v19.save` não muda até o jogador escolher.
  - Teste B (`heroes[0].gear = null`): o save abre, o herói aparece sem equipamento, nenhum progresso perdido.
  - Com `.bak1` válido e save principal corrompido, "Tentar a cópia de segurança" restaura o reino.
  - Save real da v27 abre na v28 com os mesmos dia, heróis, moedas e construções.

**F0.2 Rede de testes automáticos**
- Problema: não há como saber se uma mudança quebrou o equilíbrio ou a interface.
- O que fazer:
  1. `tools/sim.js` (Node): extrai o `<script>` do HTML, roda em `vm` com `G.HEADLESS`, joga com um robô e imprime um JSON de indicadores. O robô, a cada 10 s de jogo: resgata missões, contratos, conquistas e caminhos; escolhe a opção 0 dos eventos; recruta quando há vaga e moedas; promove, troca vocação, desperta e renasce quando pode; melhora prédios (prioridade: Enfermaria, Ferraria, Alquimista, Hospedaria, Cidadela, produção, resto); forja o que os heróis pedem; compra Bênçãos e Obras; entra na Fenda uma vez por dia. Fazer uma segunda variante do robô que também gasta Núcleos e duela na Arena.
  2. Indicadores por marco (5 min, 30 min, 1 h, 2 h, 4 h, 8 h): dia, Nível do Reino, maior nível, número de heróis, quedas, chefes, Maré vencida e perdida, passo da Jornada, moedas ganhas e gastas, % do tempo dos heróis em cada estado, % com `noZone`, abates por minuto.
  3. Rodar 10 sementes e guardar média e faixa. As tabelas da seção 2.2 são a linha de base da v27.
  4. `tools/ui-smoke.js` (Playwright ou equivalente): abre o jogo em 360×640 e 390×844, inicia jornada, pula a apresentação, abre os 6 painéis e todas as abas, a ficha de um herói, o mapa e o Portal; falha se houver erro no console ou elemento saindo da largura da tela; salva capturas.
  5. Testes de save da F0.1 automatizados.
- Aceite: os três comandos rodam do zero e a saída é anexada a cada entrega.

**F0.3 Erros visíveis**
- O que fazer: `G.emit` guarda toda exceção de ouvinte num anel de 50 registros em memória (mensagem, evento, pilha, dia e hora de jogo), sem interromper. `window.onerror` e `unhandledrejection` alimentam o mesmo anel. Em Opções, "Relatório de erros" mostra a contagem e copia o texto. Sem janela que interrompa o jogo.
- Onde: `00-core.js` (`G.emit`), `90-main.js`, Opções.
- Aceite: uma exceção forçada num ouvinte aparece no relatório e o jogo segue rodando.

**F0.4 Sorteio com semente na simulação**
- O que fazer: criar `G.rng` (por padrão `Math.random`) e fazer `G.rnd`, `G.ri`, `G.chance`, `G.pick`, `G.shuffle`, `G.wpick` usarem `G.rng`. Trocar os `Math.random()` diretos dos módulos de simulação (`30` a `3N`) por `G.rng()`. Arte e efeitos visuais continuam com `Math.random`. No Node, `tools/sim.js` define `G.rng = G.seeded(semente)`.
- Aceite: duas execuções com a mesma semente produzem os mesmos indicadores.

**F0.5 Registro de ganchos**
- O que fazer: `G.hook(nome, fn, ordem)` e `G.runHooks(nome, ...args)` em `00-core.js`, para `tick`, `newGame`, `afterLoad`, `newDay`, `uiRefresh`. As funções base chamam `G.runHooks` no fim. Código novo usa só isso. Os embrulhos antigos **não** precisam ser migrados agora (isso é a tarefa T9.2).
- Aceite: nenhuma redefinição nova de `G.tick`, `G.newGame`, `G.afterLoad` ou `UI.refresh` na v28 (conferir contando as ocorrências: 14, 13, 13, 13).

---

### FASE 1 — HUD e interface

**Meta da fase:** em 360×640, com o jogo no estado de 4 h (11 ou mais heróis), pelo menos **60% da altura** da tela é mapa livre, e nada fica cortado ou sobreposto.

**H1.1 Faixa de cima em duas linhas fixas**
- O que fazer: linha 1 = nível do Reino, dia e hora, dificuldade, velocidade, pausa. Linha 2 = moedas, Selos, Núcleos, Poder do Reino, botão de expandir recursos. O que hoje é a terceira e a quarta linha (fichas de poder e faixa "Herói do Dia"/"Novos:"/"achados") vira um aviso de uma linha que some sozinho em 6 s e fica acessível pelo registro.
- Onde: `60-ui.js` (`buildHud`), `66-ui-lendas.js` (Poder do Reino no HUD), `6L-ui-limpeza.js`, CSS "HUD superior".
- Aceite: altura total da faixa de cima ≤ 132 px em 360×640 com a fileira de heróis incluída.

**H1.2 Fileira de heróis que não transborda**
- O que fazer: uma linha só, sempre. Até 7 heróis, retratos atuais. Com 8 ou mais, retratos menores (28 px). Se ainda não couber, mostrar primeiro os que pedem atenção (caído, fugindo, vida baixa, promoção disponível) e um botão "+N" que abre a lista completa. A ordem por urgência já existe (`heroScore`).
- Onde: `60-ui.js` (`buildRoster`, `refreshRosterIcons`), CSS `#roster`.
- Aceite: com 16 heróis em 360 px de largura, `scrollWidth` da fileira ≤ `clientWidth`.

**H1.3 Trilho da direita vira um botão**
- O que fazer: os atalhos Decisões, Incursão, Colosso, Arena, Fenda, Viveiro e Decretos saem do mapa. Fica um botão "Atividades" com o número de coisas que rendem algo agora; ao tocar, abre uma gaveta com os atalhos. No mapa ficam no máximo **dois** atalhos, e só enquanto pedem ação: Decisões com prazo correndo e Decretos.
- Onde: `60-ui.js` (`buildFabs`), `6K-ui-atalhos.js`, `6G-ui-decisoes.js`.
- Aceite: no máximo 3 botões flutuantes de cada lado em qualquer estado do jogo.

**H1.4 Balões de fala com orçamento**
- O que fazer: no máximo 3 balões na tela; nunca dois com o mesmo texto ao mesmo tempo; tempo mínimo de 20 s entre falas do mesmo personagem; falas de enfeite não aparecem com o zoom afastado nem quando há painel aberto; nenhum balão é desenhado na área do HUD (recorte) e o texto é sempre reposicionado para caber inteiro na tela. Prioridade: fala ligada a pedido ou perigo vence fala de enfeite.
- Onde: `50-render.js` (`bubble`), `30-heroes.js` (`G.bark`), `3G-cidade.js` (cenas e conversas), `3D-rivais.js` (laços).
- Aceite: em 2 minutos na cidade às 4 h de jogo, nunca mais de 3 balões e nenhum repetido na mesma captura.

**H1.5 Placas de prédio**
- O que fazer: a placa com nome e nível só aparece em zoom próximo ou quando há ação (▲ melhorar, ! problema, + construir). Com zoom afastado, só o marcador. Placas nunca cortadas na borda nem embaixo de botões.
- Onde: `50-render.js` (`drawBuilding`, `plaque`).

**H1.6 Aviso de chefe**
- O que fazer: a faixa central dura 2,5 s e encolhe para a barra de chefe do HUD (`#bossbar`). Tocar na barra leva a câmera ao chefe.
- Onde: `60-ui.js` (`#banner`, `#bossbar`).

**H1.7 Painéis em tela cheia e abas legíveis**
- O que fazer: o painel ocupa a altura toda (mantendo só a linha de moedas no topo). Abas: no máximo 5 por painel, com rolagem horizontal sinalizada por sombra nas bordas. Reorganizar **só a navegação**, sem apagar nada do save:
  - Missões: "Objetivos" (Jornada, Caminhos, Contratos e Pedidos), "Desafios" (Arena, Colosso, Fenda, Incursões), "Zonas".
  - Mais: "Lendas" (Conquistas, Recordes, Códex, Bestiário), "Bênçãos", "Livro", "Opções".
  - Dentro de cada grupo, os itens são seções ou um seletor, e não abas de primeiro nível.
- Onde: `61-ui-sheets.js` (`SHEETS`, `UI.open`, `draw`), `6E-ui-progressivo.js` (`UI.tabsFor`), `65`, `68`, `66`, `67`.
- Aceite: nenhum rótulo de aba cortado em 360 px; todo conteúdo de antes continua alcançável em até 2 toques a partir do painel.

**H1.8 Ficha do herói**
- O que fazer: cabeçalho compacto (retrato, nome, classe, nível, barra de experiência, estado, botão Seguir) com no máximo 96 px. O boneco com os espaços de equipamento vira a aba "Equipamento". O conteúdo da aba escolhida ocupa o resto.
- Onde: `61-ui-sheets.js` (seção HERÓIS, abas `htab`).
- Aceite: em 360×640, pelo menos 380 px de altura para o conteúdo da aba.

**H1.9 Texto e toque**
- O que fazer: nenhum texto abaixo de 11 px (trocar as 65 ocorrências de 8 px); contraste mínimo de 4,5:1 no corpo; alvos de toque de pelo menos 44×44 px. Blocos de explicação longos (Arena, Colosso, Forja) viram uma linha de resumo com "?" que abre o texto, aproveitando o Livro.
- Onde: CSS geral e estilos injetados pelos módulos `6x`.

**H1.10 Pendências com critério**
- O que fazer: selo só para "há recompensa para pegar agora" ou "há ação com prazo". Botão "Resgatar tudo" em Objetivos. O número mostrado satura em "9+".
- Onde: `60-ui.js` (`UI.badges`), `6L-ui-limpeza.js`.

**H1.11 Mapa do mundo de verdade**
- O que fazer: mapa em tela cheia. Cada zona mostra nome, nível atual, corrupção, barra do chefe, quantos heróis estão lá e se há chefe vivo. Zona trancada mostra o requisito por extenso. Tocar numa zona abre: "Ver", "Mandar todos para cá", "Pôr bandeira" (Fase 3).
- Onde: `62-ui-modals.js` (`UI.mapModal`).

**H1.12 Números de dano**
- O que fazer: números do mesmo alvo no mesmo instante se empilham na vertical; crítico maior e amarelo; golpes pequenos em sequência rápida se somam num número só.
- Onde: `50-render.js` (efeito `dmg`).

---

### FASE 2 — Combate: monstros e chefes

**Meta da fase:** olhar uma luta por 30 segundos e conseguir dizer que tipo de monstro é pelo jeito que ele age, e reconhecer cada chefe pelo que ele faz.

**C2.1 Comportamentos de monstro guiados por dados**
- O que fazer: campo `beh` em `G.MON[k]` e uma tabela `G.MBEH` com um objeto por comportamento (`think`, `onHit`, `onDeath`). `updateMon` despacha para o comportamento e mantém o atual como padrão. Comportamentos:

| `beh` | Quem | O que faz |
|---|---|---|
| `matilha` | lobos, aranhas, vespas, cães | cerca o alvo por lados diferentes; foge com menos de 25% de vida se estiver sozinho |
| `investida` | javali, quimera | para, avisa uma linha no chão por 0,8 s e corre em linha reta; quem fica na linha leva dano dobrado; erra se o alvo sair |
| `atirador` | xamã, espectro, elemental, cultista | mantém distância; recua quando um herói chega a menos de 2 casas; mira o herói de menor defesa |
| `guardiao` | golem, treant, golem de magma | lento; fica entre os heróis e os atiradores do grupo; reduz o dano dos monstros vizinhos |
| `voador` | morcego, vespa, harpia | ignora quem está na frente e mergulha no herói de trás; só pode ser atingido corpo a corpo logo depois do mergulho (dar função à marca `fly`) |
| `emboscada` | aranha, lodo | teia ou poça que deixa lento ou envenena quem pisa |
| `xama` | xamã, cultista | fortalece ou cura monstros vizinhos; deve ser o alvo prioritário |
| `divide` | slime, lodo | ao morrer vira dois menores (uma vez só) |
| `explode` | salamandra, cão infernal | ao morrer deixa chão queimando por 3 s |

- Regras: todo ataque especial tem aviso visual antes (reaproveitar o efeito `warn`, com formas novas: linha e cone). O ajuste de vida e ataque deve manter o ganho por minuto dentro de ±10% da linha de base; conferir com `tools/sim.js`.
- Onde: `10-data.js` (`G.MON`), `31-monsters.js` (`updateMon`, `strike`, `G.killMon`), `50-render.js` (avisos).
- Aceite: cada comportamento com um teste de simulação que prova que ele acontece (por exemplo: o atirador termina a luta a mais de 2 casas do alvo em 70% das vezes).

**C2.2 Elites com modificador**
- O que fazer: cada elite nasce com 1 modificador (2 a partir da corrupção X): Blindado, Veloz, Vampírico, Explosivo, Invocador, Gélido, Venenoso. O nome aparece na placa ("Elite Blindado · Orc da Fenda") e cada um tem um sinal visual. Espólio um pouco melhor.
- Onde: `31-monsters.js` (`G.makeMon`), `41-art-mon.js`.

**C2.3 Chefes únicos**
- O que fazer: cada chefe ganha 2 ou 3 golpes próprios e fases em 66% e 33% de vida. Tudo com aviso.

| Chefe | Golpes |
|---|---|
| Ancião da Matilha | uivo que chama 3 lobos; salto no herói mais distante; fúria abaixo de 33% |
| Lich de Ocre | ergue esqueletos; prisão de ossos em um herói (os outros quebram batendo); raio em linha |
| Hidra da Fenda | mordidas em cone de três cabeças; abaixo de 66% cospe poças; regenera se ninguém bater por 4 s |
| Mãe das Brumas | névoa que encurta o alcance dos atiradores; poças de veneno; afunda e reaparece |
| Wyrm Glacial | sopro de gelo em cone que deixa lento; estacas no chão; voo rasante |
| Dragão das Cinzas | sopro de fogo em linha; fase no ar com chuva de brasas; chão em chamas |
| Arauto da Fenda | abre portais que soltam monstros; troca de lugar; pulso que empurra |

- Reaproveitar a esquiva que os heróis já têm no Colosso (`3C-colosso.js`, "como se esquiva") para os chefes de zona.
- Onde: `31-monsters.js` (bloco `if (m.boss)` de `updateMon`), novo bloco `G.BOSS[k]`.
- Aceite: taxa de vitória contra cada chefe na primeira tentativa entre 55% e 80% no robô; cada golpe ocorre pelo menos uma vez por luta em teste.

**C2.4 Estados alterados unificados**
- O que fazer: hoje há campos soltos (`m.dot`, `m.stun`, `m.slow`, `m.weak`, `m.vuln`, `h.dot`, `h.buff.*`). Criar uma lista pequena de estados por entidade (`{ k, until, v, by }`) com funções `G.stAdd`, `G.stHas`, `G.stTick`, e um ícone pequeno sobre a cabeça para cada estado ativo. Manter os campos antigos funcionando durante a transição.
- Onde: `30-heroes.js`, `31-monsters.js`, `34-vocacoes.js`, `36-companheiros.js`, `50-render.js`.

**C2.5 Peso e leitura dos golpes** (só visual, sem mudar a simulação)
- O que fazer: pausa de 40 a 60 ms no desenho em crítico e em abate de elite ou chefe; pequeno recuo do alvo; quadro de preparação antes do golpe; animação de morte (monstro some em poeira com a cor da paleta); projéteis em arco; barra de vida só em quem levou dano; placa de nome para elite e chefe; limite de tremor de tela por segundo. Respeitar o Modo leve e a opção de reduzir movimento.
- Onde: `50-render.js`, `40-art.js`, `41-art-mon.js`.

---

### FASE 3 — Inteligência dos heróis e participação do jogador

**A3.1 Fim do herói parado (prioridade máxima da fase)**
- Problema: 23% do tempo de herói "sem zona segura" às 4 h de jogo.
- O que fazer, nesta ordem de preferência para o herói sem zona:
  1. ir treinar no Campo de Treino se houver vaga e moedas;
  2. acompanhar um herói mais forte como aprendiz (ganha experiência reduzida, fica atrás);
  3. caçar na borda da zona mais fraca só monstros comuns isolados, com recuo antecipado;
  4. só então ficar ocioso, e nesse caso mostrar o motivo no retrato.
  Além disso: cada zona mantém uma faixa de entrada com monstros no nível base, não afetada pela corrupção, e o jogo avisa uma vez: "Fulano não tem onde caçar: baixe a corrupção de uma zona ou construa o Campo de Treino".
- Onde: `30-heroes.js` (`leaveTown`, `G.pickZone`, `G.heroDecide`), `31-monsters.js` (`spawnZone`).
- Aceite: `noZone` < 3% do tempo de herói em todos os marcos; tempo ocioso total < 8%.

**A3.2 Papéis em combate**
- O que fazer:
  - Arqueiro e Mago mantêm distância: se um inimigo corpo a corpo chega a menos de 1,5 casa e há um aliado de frente por perto, recuam 2 casas antes de voltar a atirar.
  - Cavaleiro e Paladino ficam entre os monstros e os aliados frágeis.
  - Paladino cura quem tem menos vida, não só quando ele mesmo está abaixo de 70%.
  - Ladino ataca pelas costas o alvo do tanque e prioriza `xama` e `atirador`.
  - Todos saem da área de um aviso de golpe (com atraso de reação que depende do traço: Impulsivo demora, Focado é rápido).
  - Prioridade de alvo: marcado pelo jogador > `xama` > `atirador` > quem ataca um aliado frágil > o mais próximo.
- Onde: `30-heroes.js` (`hunt`, `findTarget`, `G.heroAct`).
- Aceite: testes de simulação por papel (por exemplo: o Mago leva menos de 30% do dano corpo a corpo que levava na linha de base em lutas com Cavaleiro presente).

**A3.3 Grupos de caça** (exceção permitida à regra 3)
- O que fazer: heróis na mesma zona formam grupos de 2 a 4 com alvo comum, que andam juntos e recuam juntos. Quem tem laço de amizade (`3D-rivais.js`, laços) tende a formar grupo; rivais disputam abates. As sinergias de formação que hoje só valem na Arena e no Colosso (`3H-sinergias.js`) passam a valer no grupo. Quando um cai, um aliado do grupo pode carregá-lo de volta, reduzindo a penalidade da queda.
- Onde: `30-heroes.js`, `3H-sinergias.js`, `3D-rivais.js`.
- Aceite: às 2 h de jogo, mais de 50% do tempo de caça acontece em grupo; quedas por hora não aumentam em relação à linha de base.

**A3.4 Decisão por pontuação, com personalidade visível**
- O que fazer: `G.heroDecide` hoje é uma escada fixa de prioridades. Trocar por pontuação: cada opção (entregar espólio, curar, comer, descansar, comprar, treinar, caçar) recebe uma nota a partir das necessidades e dos traços, e vence a maior. Os traços passam a mudar o comportamento, e não só os números: Guloso come antes, Sociável prefere caçar em grupo e frequenta a Taverna, Ambicioso escolhe zona mais dura, Medroso evita elite, Preguiçoso dorme mais, Notívago inverte o horário. Usar `G.rng` para desempates.
- Onde: `30-heroes.js` (`G.heroDecide`, `G.pickZone`).
- Aceite: num teste de 60 min, um herói Guloso faz pelo menos 25% mais refeições que um sem o traço; equivalente para cada traço de comportamento.

**A3.5 "Por quê?" no herói**
- O que fazer: ao tocar num herói, além do estado, mostrar o motivo e a próxima intenção: "Voltando: bolsa cheia. Depois: Ferraria (quer Arco de Ocre)". Guardar os 5 últimos motivos.
- Onde: `30-heroes.js` (gravar `h.why`), `60-ui.js` (`UI.inspect`), `G.stateLabel`.

**A3.6 Bandeiras de recompensa** (exceção permitida à regra 3)
- O que fazer: o jogador toca num monstro, chefe ou ponto do mapa e põe uma bandeira com uma quantia em moedas (três valores sugeridos conforme o nível). Tipos: **Caçar** (alvo), **Explorar/Reunir** (ponto), **Defender** (prédio ou portão). Os heróis somam a recompensa à pontuação da A3.4, pesando distância, risco e personalidade (o Ambicioso corre, o Medroso ignora chefe). A recompensa é paga a quem cumprir, dividida no grupo. No máximo 3 bandeiras ativas. É a forma de o jogador conduzir sem comandar diretamente.
- Onde: novo bloco em `30-heroes.js` e `33-meta.js` (estado `S.flags`), toque no mapa em `60-ui.js` (`tap`), mapa do mundo (H1.11), desenho em `50-render.js`.
- Aceite: com uma bandeira de Caçar num chefe, o tempo médio até o primeiro herói engajar cai pela metade em relação a sem bandeira.

**A3.7 Postura geral e Decretos que pedem alvo**
- O que fazer: seletor de postura do reino (Ousada, Equilibrada, Cautelosa) que aplica a cautela a todos, mantendo o ajuste por herói. Revisar os 4 Decretos: recargas menores para os gratuitos, e pelo menos um que o jogador mira no mapa (por exemplo, Luz da Aurora cura numa área escolhida em vez de em todos).
- Onde: `10-data.js` (`G.DECREES`), `33-meta.js` (`G.useDecree`), `61-ui-sheets.js`.

**A3.8 Ecologia das zonas**
- O que fazer: monstros nascem em acampamentos e ninhos (grupos com um líder), não espalhados ao acaso; patrulhas entre acampamentos; monstros só da noite; um elite errante anunciado por zona ("Um Alfa ronda o Bosque"). Limpar um acampamento dá um bônus pequeno e ele renasce depois de um tempo.
- Onde: `31-monsters.js` (`spawnZone`, `G.populate`), `20-world.js`.

**A3.9 Maré da Fenda com perigo real**
- O que fazer: hoje os invasores marcham em linha reta até a praça. Dar papéis: sapadores atacam prédios, voadores passam por cima da muralha, atiradores ficam fora do alcance da Torre, e a última onda traz um chefe de Maré. Em níveis altos, dois portões ao mesmo tempo. Antes da Maré, o jogador escolhe uma preparação (reforçar um portão, distribuir poções, chamar todos). A derrota tem custo claro e recuperável (prédios danificados, que já existe).
- Onde: `31-monsters.js` (bloco "Maré da Fenda", `G.mareStart`, estado `march`, `G.mareBreach`).
- Aceite: taxa de vitória do robô entre 70% e 85% (hoje 100%).

---

### FASE 4 — Ritmo e equilíbrio

Só começar depois das Fases 2 e 3, e sempre medindo com `tools/sim.js` em 10 sementes.

**B4.1 Alvos de ritmo**

| Indicador | v27 medido | Alvo v28 |
|---|---|---|
| Primeiro chefe derrotado | antes de 5 min | entre 8 e 12 min, com aviso e preparo visíveis |
| Primeira queda de herói | depois de 30 min | entre 12 e 20 min, logo após a Enfermaria ser apresentada |
| Quedas por hora às 4 h | 51 | 20 a 35 |
| Maré vencida | 100% | 70% a 85% |
| Herói ocioso às 4 h | 24% | menos de 8% |
| Última zona aberta (1×) | entre 4 h e 8 h | entre 8 h e 12 h, com conteúdo novo a cada zona (Fase 7) |
| Passos da Jornada na 1ª hora | 19 de 35 | 12 a 15 |

**B4.2 Torneiras e ralos**
- O que fazer: com o robô que gasta tudo, medir moedas e Núcleos ganhos e gastos por hora em cada marco. Se o saldo parado passar de 2 horas de renda, ajustar. Antes de mexer em preço, conferir se o ralo existente (Obras públicas, `G.workCost`) está visível para o jogador.
- Onde: `10-data.js` (curvas `G.PW`, `G.HW`, `G.PM`, `G.xpNeed`, `G.realmNeed`, `G.bCost`), `G.DANGER` em `3F-atrito.js`, `G.mareLevel`.

**B4.3 Penalidade de queda**
- O que fazer: revisar a soma atual (25% das moedas do herói, toda a bolsa, 12% da experiência do nível, 35 de ânimo, tempo de recuperação). Com grupos (A3.3), o resgate reduz a perda. A queda tem de doer sem parecer injusta.

**B4.4 Transparência nas chances**
- O que fazer: conferir que o Portal, a Forja e a Reforja mostram as chances reais e a garantia (`G.pity`) antes de o jogador gastar.

---

### FASE 5 — Arte e animação

Manter o estilo atual. Tudo continua desenhado por código. Antes de começar, criar uma **galeria de depuração** (`?galeria=1` na URL): uma página que desenha todos os personagens, monstros, chefes, prédios, ícones e efeitos lado a lado, em todos os quadros. Toda entrega desta fase anexa capturas da galeria.

**AR5.1 Personagens**
- Três direções de caminhada: lado (atual), frente e costas. Hoje, andando para cima ou para baixo, o herói anda de lado.
- Respiração parado; quadro de preparação e de retorno no ataque; pose de conjuração para a habilidade; quadro de "levou golpe"; pose de caído (hoje usa o quadro parado); pose de vitória após chefe; sentado e dormindo.
- Equipamento visível: armas e armaduras de cada nível com cor e forma próprias (o `gearKey` já existe), raridade alta com brilho discreto.

**AR5.2 Monstros**
- Molde próprio para os dez que hoje reaproveitam outro: Homem-Lagarto, Salamandra, Cultista da Brasa, Quimera Menor, Yeti, Treant Podre, Harpia, Vespa Gigante, Elemental de Gelo, Cão Infernal. Critério: reconhecer cada um só pela silhueta preta.
- Quadros novos em todos: ataque, levou golpe, morte.
- Sinais visuais para os comportamentos da Fase 2 (linha de investida, teia, aura do xamã, mergulho do voador) e para os modificadores de elite.

**AR5.3 Chefes**
- Molde próprio para Arauto da Fenda, Mãe das Brumas e Dragão das Cinzas (hoje repetem Lich, Hidra e Wyrm).
- Um quadro ou efeito para cada golpe da C2.3 e uma sequência de morte.

**AR5.4 Mundo**
- Cada zona com 2 ou 3 marcos próprios (arco em ruínas, crânio gigante, lago congelado, rio de lava, árvore-mãe).
- Vida ambiente: folhas, areia, brasas, neve e névoa por bioma; pássaros e borboletas de dia, vaga-lumes à noite; copas balançando.
- Clima ligado aos eventos (chuva, nevasca, névoa, Lua Rubra tingindo a tela).
- Amanhecer e entardecer com cor quente, em vez de só escurecer.
- A cidade cresce à vista com o Nível do Reino: ruas calçadas, mais casas, bandeiras, feira maior.

**AR5.5 Efeitos**
- Efeito próprio para cada habilidade de vocação (36); subida de nível; promoção; espólio no chão com cor de raridade; morte de chefe.

**AR5.6 Interface**
- Menos molduras empilhadas (hoje há caixa dentro de caixa dentro de caixa nos painéis); ícones com o mesmo peso de traço; raridade indicada por cor **e** por forma (losango, estrela, coroa), para quem não distingue cores.
- Tela de título com vida: se há save, mostrar a cidade do jogador ao fundo.

**Aceite da fase:** capturas da galeria antes e depois; nenhum quadro passa de 4 ms de desenho no teste de desempenho (T9.1); Modo leve desliga os efeitos novos.

---

### FASE 6 — Som

**S6.1 Música adaptativa**
- O que fazer: um sequenciador simples por padrões (baixo, acompanhamento, melodia) com temas para: cidade de dia, cidade à noite, cada um dos 6 biomas (escala, andamento e timbre diferentes), combate (camada que entra quando o herói seguido ou a tela mostra luta), chefe, Maré, Colosso. Vinhetas curtas de vitória, derrota, subida de Reino. Transição suave de 2 s entre temas, escolhida pelo que a câmera mostra.
- Onde: `70-audio.js` (`music`, `CH`, `PENTA`).

**S6.2 Ambiente**
- O que fazer: pássaros de dia, grilos à noite, vento na neve, borbulhar no pântano, crepitar nas cinzas, martelo perto da Ferraria, burburinho na praça, água na fonte. Volume pela distância da câmera e lado pelo `StereoPannerNode`.

**S6.3 Efeitos e mixagem**
- O que fazer: variação de altura de ±5% em sons repetidos; som de golpe diferente por tipo de arma; limite de vozes simultâneas; `DynamicsCompressorNode` na saída; a música abaixa durante vinhetas; eco curto para dar espaço. Controles separados: efeitos, música, ambiente; silenciar ao perder o foco (já existe).
- Aceite: 2 minutos de Maré em 3× sem estouro audível; nenhuma camada toca com o volume correspondente em zero.

---

### FASE 7 — Conteúdo e história

Usar os sistemas que já existem. Nada de aba nova.

**N7.1 Jornada em capítulos**
- As 35 missões viram 6 capítulos (um por zona), cada um com título, uma abertura de 2 linhas e um cartão de fechamento com arte ao derrotar o chefe pela primeira vez. Um fio de história simples sobre a origem da Fenda, contado nesses cartões e nas falas da Rosa.

**N7.2 Eventos**
- De 8 para pelo menos 24: eventos por zona, eventos em cadeia (a escolha de hoje volta em três dias), eventos que usam os comportamentos novos (uma matilha cerca a Fazenda; um Alfa ronda). São dados em `G.EVENTS`, baratos de fazer.

**N7.3 Variedade por zona**
- De 4 para 6 tipos de monstro por zona, mais um minichefe e uma aparição rara. Modificadores de zona por nível de corrupção (por exemplo: "Névoa", "Enxame", "Terra queimada"), para a corrupção mudar a luta, e não só os números.

**N7.4 Pedidos em cadeia**
- Os Pedidos dos moradores (`3G-cidade.js`) ganham pequenas histórias em 3 passos por morador, com um desfecho.

**N7.5 Fim de jogo legível**
- Uma tela única "E agora?" para quem terminou a Jornada, mostrando as metas longas que já existem (Fenda Infinita, Incursões, Colosso, Arena, Renascimento, Códex) com o progresso de cada uma.

---

### FASE 8 — Primeiros minutos, acessibilidade e opções

**Q8.1 Primeiros 10 minutos**
- A apresentação tem 2 falas e uma mão que aponta: manter curto. Garantir os três momentos: primeiro recrutamento, primeira peça forjada e vendida, primeiro chefe. No primeiro chefe, a câmera vai até ele uma vez e a Rosa explica o aviso de golpe em uma linha. Ensinar velocidade, mapa, Decretos e bandeira no momento em que cada um passa a ser útil.

**Q8.2 Opções novas**
- Tamanho do texto (100%, 115%, 130%); alto contraste; símbolos de raridade; reduzir movimento (hoje só segue a preferência do sistema); ocultar balões de fala; economia de bateria (30 quadros por segundo); qualidade do desenho (limite de densidade 1, 2 ou 3); velocidade ao abrir o jogo; confirmar gastos acima de um valor; trilho de botões do lado esquerdo (canhotos); volume do ambiente.

**Q8.3 Conforto**
- Botão Voltar do Android fecha painel e janela (tratar `popstate`); "Resgatar tudo"; segurar o botão para repetir Melhorar e Aprimorar; busca e ordenação no Armazém; fixar um objetivo no rodapé; toque duplo no mapa aproxima.

**Q8.4 Acessibilidade**
- `aria-label` em todos os botões só com ícone; foco visível com teclado; ordem de foco coerente nos painéis.

---

### FASE 9 — Desempenho e limpeza

**T9.1 Orçamento de desempenho**
- Medir em aparelho real de entrada, se houver. Alvos com 16 heróis e 75 monstros: passo de simulação ≤ 0,5 ms no computador; desenho ≤ 4 ms num celular médio; sem pausa maior que 50 ms em jogo normal.
- Densidade de pixels: limite padrão 2 em celulares; se o tempo médio de quadro passar de 20 ms (o vigia `fxWatch` já existe em `90-main.js`), baixar a densidade antes de desligar efeitos.
- Se a contagem de entidades crescer com as Fases 2 e 3, usar uma grade espacial para as buscas de alvo (`findTarget`, `pickHero`), que hoje percorrem todas as entidades.

**T9.2 Migrar os embrulhos para ganchos**
- Trocar as redefinições antigas de `G.tick`, `G.newGame`, `G.afterLoad` e `UI.refresh` pelo registro da F0.5, um módulo por vez, com os testes da F0.2 passando a cada passo.

**T9.3 Tamanho**
- Manter o arquivo abaixo de 2,2 MB.

---

## 5. O que NÃO fazer

- Não reescrever o motor, não trocar Canvas 2D por outra tecnologia, não introduzir bibliotecas.
- Não criar moeda, loja, aba ou sistema novo fora das exceções escritas (bandeiras, grupos de caça).
- Não remover nenhum sistema existente nem apagar campos do save. Reorganizar a navegação é permitido; apagar conteúdo não é.
- Não mudar os números de equilíbrio sem rodar o simulador antes e depois.
- Não usar imagens, sons ou fontes externas.
- Não entregar várias fases de uma vez.

---

## 6. Formato de cada entrega

1. O arquivo `.html` novo.
2. **Resumo** em até 10 linhas: o que mudou para o jogador.
3. **Tarefas:** cada ID da fase com situação (feita, parcial, não feita) e o motivo quando não for "feita".
4. **Funções tocadas**, por módulo.
5. **Testes rodados**, com a saída:
   - `node --check` no script extraído;
   - `tools/sim.js` em 10 sementes, tabela de indicadores ao lado da linha de base;
   - `tools/ui-smoke.js` em 360×640 e 390×844, com as capturas;
   - testes de save (A, B, cópia de segurança, save da v27).
6. **Critérios de aceite** de cada tarefa: passou ou não, com o número medido.
7. **Limites conhecidos** e o que ficou para depois.

Lista de conferência final de qualquer entrega:

- [ ] Abre direto do arquivo, sem internet, sem erro no console.
- [ ] Save da v27 abre sem perda.
- [ ] Nada cortado ou transbordando em 360×640.
- [ ] Indicadores do simulador dentro das faixas-alvo, ou desvio explicado.
- [ ] Modo leve e reduzir movimento continuam funcionando.
- [ ] `G.VERSION`, `G.BUILD` e a janela de novidades atualizados.

---

## 7. Mensagem de abertura para colar no ChatGPT

```
Você vai evoluir um jogo existente: "Aurora — Crônicas da Fenda", um único arquivo HTML
(1,6 MB, 19 mil linhas, JavaScript puro, Canvas 2D, sem bibliotecas). Anexei o arquivo
aurora-v27-faseC.html e o documento plano-melhorias-aurora-v28.md.

Leia o plano inteiro antes de qualquer coisa. Ele traz o retrato do código, o diagnóstico
medido, as regras e as tarefas com critérios de aceite.

Como trabalhar:
1. Siga as regras da seção 0 do plano. Em especial: edite o arquivo por trechos com uma
   ferramenta de código (não reescreva o arquivo inteiro na conversa), não mude a chave
   do save, não crie sistemas novos, uma fase por entrega.
2. Comece pela FASE 0 e só por ela. Antes de editar, me mostre em até 15 linhas como vai
   fazer cada tarefa da fase e quais funções vai tocar.
3. Depois de editar, rode os testes pedidos e entregue no formato da seção 6. Se não
   conseguir rodar algum teste, diga "não testado" e explique.
4. Não passe para a fase seguinte até eu confirmar.

Se algo no plano conflitar com o que você encontrar no código, pare e me avise com o
trecho do código, em vez de adivinhar.
```
