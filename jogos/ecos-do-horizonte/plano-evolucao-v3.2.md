# Ecos do Horizonte — plano de evolução 3.2

## Proposta viável

Um RPG de ação 2D ilustrado, solo, em português, feito para sessões no celular, com exploração livre de nove regiões, quatro classes, seis famílias de armas e expedições repetíveis. O jogo continua em um único HTML com imagens e áudio incorporados. Sem servidor, conta obrigatória ou dependência de conexão para jogar o arquivo baixado.

“Perfeito” não é um critério verificável. A meta desta entrega é tornar o jogo mais claro, responsivo e consistente, com resultados que possam ser medidos. O estilo gráfico e os salvamentos existentes serão preservados. O mundo já é grande; a prioridade é tornar seus encontros, caminhos e recompensas mais interessantes.

## Pesquisa consultada na web em 25/10/2026

1. [Riot Games — Clarity in League](https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/): informação de combate, hierarquia visual, silhuetas, ruído e correspondência entre efeitos e áreas de acerto. Aplicação: perigos com contornos legíveis, seleção de alvo e efeitos secundários mais discretos.
2. [Game Accessibility Guidelines — lista completa](https://gameaccessibilityguidelines.com/full-list/): controles espaçosos, lembrete de objetivos, ajuda contextual, prática sem fracasso, legibilidade e informação que não dependa apenas da cor. Aplicação: treino, instruções curtas, acompanhamento de pedidos e rótulos nos avisos.
3. [MDN — Optimizing canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas): pré-renderização, reutilização de imagens e redução de trabalho repetido. Aplicação: cache limitado de ilustrações no tamanho de exibição e redução de filtros recalculados a cada quadro.
4. [web.dev — Optimize long tasks](https://web.dev/articles/optimize-long-tasks): evitar trabalho prolongado na thread principal. Aplicação: evitar reconstruir o mundo ao abrir menus, medir atualização e desenho e manter caches limitados.
5. [Ian Schreiber — Numeric Relationships](https://gamebalanceconcepts.wordpress.com/2010/07/14/level-2-numeric-relationships/): relações lineares, retornos crescentes e decrescentes. Aplicação: fórmulas explícitas de ameaça, recompensas limitadas e Legado infinito com bônus ativos limitados.

As recomendações abaixo são decisões para este jogo, não afirmações de que essas fontes prescrevem uma implementação específica.

## Diagnóstico

| Problema observado no código ou na execução | Efeito para quem joga | Prioridade |
| --- | --- | --- |
| A reciclagem automática da mochila cheia protege somente o herói atual | Pode apagar equipamento salvo por outra classe | P0 |
| A ameaça das expedições afeta apenas o chefe | As salas não refletem a dificuldade anunciada | P0 |
| Habilidades de projétil consomem energia mesmo sem alvo | Toques parecem desperdiçados | P1 |
| Comparação usa dano bruto e omite o ritmo da arma | Uma arma rápida pode parecer pior sem ser | P1 |
| Diário não permite acompanhar pedidos secundários | Exploração perde direção entre marcos da história | P1 |
| Após o tutorial, o objetivo pode enviar direto a um chefe acima do nível | A progressão parece abrupta | P1 |
| Não há local de treino acessível pelo menu | Combate e habilidades são difíceis de aprender | P1 |
| Muitas ilustrações e filtros são reprocessados no desenho | Travamentos em aparelhos com menos recursos | P1 |
| A ameaça é escolhida em dez botões apertados e não informa a preparação | Pouca clareza sobre risco e recompensa | P1 |

## Implementação desta entrega

### 1. Integridade do progresso e economia

- Usar a mesma proteção de itens na coleta automática e na reciclagem manual: equipamentos e reservas de todos os heróis e armas iniciais vinculadas.
- Reciclar automaticamente somente uma peça livre inferior; converter o novo saque em fragmentos quando não houver substituição segura.
- Mostrar um histórico curto do saque recebido ou convertido, com acesso direto ao item disponível.
- Preservar nível, campanha, mapas, equipamentos, talentos e Legado ao carregar arquivos antigos.

### 2. Combate claro e aprendizagem

- Dar prioridade a alvos visíveis e sem obstáculo entre o jogador e o inimigo.
- Exibir o alvo selecionado com um marcador e permitir seleção por toque sem deslocamento involuntário.
- Evitar gasto de energia e recarga de projéteis que exigem um alvo quando não existe alvo válido.
- Melhorar avisos de ataques com contorno, preenchimento de preparação e símbolos que reforcem a cor.
- Adicionar um treino no Refúgio, acessível no menu, com alvo de prática sem recompensas e restauração dos recursos ao sair.
- Manter a posição dos controles de toque e a possibilidade de mover e atacar simultaneamente.

### 3. Jornada, exploração e equipamentos

- Exibir etapas da campanha e o próximo marco de evolução.
- Permitir acompanhar pedidos de ervas, minério e torres com contador e destino apropriado.
- Sugerir atividades próximas quando o herói estiver abaixo do nível recomendado do próximo guardião, preservando a liberdade de enfrentá-lo.
- Comparar dano por golpe e dano médio de uma sequência, além do alcance e intervalo de cada família de arma; identificar a estimativa e suas limitações.
- Facilitar retorno à campanha após cumprir um pedido ou chegar ao destino.

### 4. Expedições repetíveis e equilíbrio

- Reformular o painel de entrada com escolha de ameaça em controles grandes, preparação, condição da rota e recompensas previstas.
- Aplicar a ameaça a todos os inimigos, com crescimento linear e limitado de vida, dano e resistência de postura.
- Oferecer três rotas claras: padrão, pressão maior por mais experiência, ou inimigos mais resistentes à postura por mais fragmentos.
- Garantir recompensa de conclusão apenas uma vez por expedição; registrar melhor ameaça e total de conclusões.
- Manter níveis até 60, Legado acumulável e limite de vinte pontos ativos. A repetição é infinita; não há promessa de conteúdo narrativo infinito nem de dificuldade numérica sem limite.

### 5. Desempenho, conforto e acabamento

- Criar cache de ilustrações no tamanho de uso, com limite de memória e invalidação ao mudar escala.
- Evitar redesenhos e alterações de DOM redundantes em retratos e elementos estáticos.
- Reduzir efeitos decorativos no modo leve, preservando inimigos, projéteis e avisos de perigo.
- Expor ajustes de contraste dos perigos e quantidade de números de combate com rótulos compreensíveis.
- Publicar o plano, os resultados e a nova versão com download direto no GitHub e no site existente.

## Critérios de aceite

- Nenhum item atribuído a outro herói removido por coleta ou reciclagem.
- Controles novos com alvo de toque de pelo menos 44 × 44 pixels nos tamanhos testados.
- Treino sem ouro, experiência, fragmentos ou avanço de missão; saída sem perder o local e os recursos originais.
- Recompensa de expedição concedida uma única vez; ameaça aplicada às salas e ao chefe.
- Seleção das quatro classes, campanha, masmorras e progressão continuam funcionando.
- Compatibilidade com salvamento real da v3.1 e com os formatos anteriores já suportados.
- HTML único funciona sem requisições externas; sem erros de execução no navegador de teste.
- Medir cenas antes/depois com o mesmo navegador, resolução e redução simulada de CPU. Relatar separadamente taxa de desenho e taxa de callbacks; não apresentar isso como teste em aparelho físico ou de bateria.

## Verificação e limites

Será usado Chromium com toque simulado em telas de 320 × 568, 390 × 844, 568 × 320, 700 × 350, 844 × 390 e computador. Serão exercitados os fluxos reais de menus e toque, importação/exportação, expedições, treino, economia e seleção de classe. Aparelhos físicos e Safari/iOS não estão disponíveis nesta execução; aprovação nesses ambientes exige teste posterior.

Situação: implementação desta entrega concluída e validada. O teste em aparelhos físicos permanece uma etapa posterior.


## Fórmulas e limites aplicados

Para uma ameaça `t` entre 1 e 10, use `n = t − 1`:

- Vida dos inimigos das salas: `vida_base × (1 + 0,10 × n)`.
- Dano dos inimigos das salas: `dano_base × (1 + 0,06 × n)`.
- Vida do guardião da expedição: `(900 + 50 × nível_do_herói) × (1 + 0,14 × n)`.
- Dano do guardião: `dano_base × (1 + 0,08 × n)`.
- Resistência de postura: `postura_base × min(1,45; 1 + 0,025 × n)`.
- Rota Pressão multiplica o dano inimigo por `1,08` e a experiência por `1,15`.
- Rota Fortaleza multiplica a postura por `1,25` e os fragmentos de conclusão por `1,20`.
- Conclusão: `150 × t` ouro, `12 × t` fragmentos e `350 × t` experiência, com o modificador da rota quando aplicável e arredondamento inteiro. A recompensa ocorre uma única vez ao vencer o guardião.

O nível dos inimigos fica limitado a 60. O Legado continua acumulando, mas somente vinte pontos influenciam os atributos. Permanecem os tetos de 60% de proteção, 50% de chance crítica, 35% de redução de recarga e 8% de roubo de vida.

A estimativa de dano por segundo usa `dano × multiplicador_da_arma × (3,7 ÷ 3) × (1 + 0,65 × crítico) ÷ [intervalo_da_arma × (1 − 0,4 × redução_de_recarga)]`. Ela representa a média da sequência básica de três golpes contra um alvo parado, sem habilidades, efeitos de estado, área ou reposicionamento.

## Resultado da implementação

| Área | Entrega aplicada | Verificação |
| --- | --- | --- |
| Progresso e saque | Coleta automática protege todos os heróis; histórico de achados e conversões | Mochila cheia, equipamento de herói inativo e consulta do item pela interface |
| Combate | Mira sem obstáculos, seleção por toque sem movimento, habilidade de projétil sem gasto quando não há alvo, avisos reforçados | Toque real simulado, obstáculo entre alvo e jogador e consumo de energia/recarga |
| Treino | Pátio isolado com guardião, estatísticas, ataques opcionais e prática de aparo | Ataques e aparo pelos botões; nenhuma recompensa; saída e recarga preservam recursos e local |
| Jornada | Campanha em etapas, próximo marco, pedidos acompanháveis e sugestões de preparação | Coleta, contador, entrega real a Iara e retorno à campanha |
| Equipamentos | Dano por golpe e estimativa de dano por segundo da sequência, com alcance e intervalo | Comparação pela mochila; indicação explícita das limitações da estimativa |
| Expedições | Dez ameaças em controle amplo, três rotas, escala em todas as salas, recorde e conclusão única | 30 combinações de ameaça/rota, recompensa concedida uma vez e separação dos chefes da campanha |
| Evolução | Níveis 1–60 e Legado com poder ativo limitado | 24 combinações de nível/classe; atributos finitos e poder estável com Legado muito alto |
| Conforto e desempenho | Cache limitado de ilustrações e luz, fundo pausado nos menus, contraste e números configuráveis | Limites explícitos no cache, funcionamento offline e preferências preservadas |
| Compatibilidade | Salvamentos das versões anteriores e o painel do herói preservados | Migração de salvamento real da v3.1; regressão dos quatro heróis, campanha, morte e importação |

O teste de toque cobriu 23 combinações de tamanho/configuração e 16 usos de habilidades durante movimento. Os quatro painéis novos foram conferidos em seis resoluções (24 combinações), com controles de pelo menos 44 pixels e sem vazamento horizontal. Nenhuma requisição externa foi necessária para iniciar ou jogar o arquivo; nenhum erro de execução ocorreu nos testes concluídos.

## Medição de desempenho

Navegador Chromium, 390 × 844, escala de pixel 1, caches aquecidos e CPU reduzida a um quarto da velocidade pelo protocolo do navegador. A comparação usa a v3.1 preservada e o HTML final da v3.2. É uma amostra curta de aproximadamente 4,2 segundos por cena, sujeita a variação do ambiente; não mede bateria nem representa um modelo específico de celular.

| Cena com CPU reduzida | v3.1 | v3.2 final |
| --- | ---: | ---: |
| Vila parada | 13 FPS | 13 FPS |
| Caminhada | 8 FPS | 10 FPS |
| Combate | 13 FPS | 12 FPS |

Nessas cenas com CPU reduzida, cada callback de animação efetuou um desenho. Sem redução de CPU, o jogo mantém o limite planejado de cerca de 30 desenhos por segundo no modo automático: a taxa de callbacks foi de 51 para 60, e o tempo médio de JavaScript gasto por chamada de desenho na vila passou de aproximadamente 3,8 para 2,0 ms.

Uma medição intermediária chegou a 16 FPS na caminhada; a repetição final ficou em 10. Por isso, não se promete ganho uniforme nem 60 FPS no celular. O trabalho repetido de desenho diminuiu, mas o combate em hardware lento continua sendo a principal limitação técnica identificada. O projeto é viável como RPG solo offline; a validação de fluidez em aparelhos reais, inclusive Safari/iOS, precisa de uma rodada de testes nesses dispositivos.

## Uso da versão

- Toque no retrato para equipamentos, mochila e seleção de heróis.
- Abra **Menu → Treino de combate** em um povoado. **Ativar golpes** permite praticar defesa e aparo; **Sair** devolve os recursos originais.
- Abra **Diário → Pedidos** para acompanhar uma tarefa ou **Região** para encontrar atividades próximas.
- No portal das Fronteiras, escolha a ameaça e a rota antes de entrar.
- Em **Ajustes → Leitura do combate**, configure os contornos de perigo e os números de dano.
- Exporte o progresso na versão antiga e importe na nova quando o navegador não compartilhar o salvamento entre arquivos.
