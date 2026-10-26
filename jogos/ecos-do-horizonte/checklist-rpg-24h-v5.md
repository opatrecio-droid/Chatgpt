# Checklist de aceite — Ecos do Horizonte v5, campanha de 24 horas

Data: 26/10/2026. Base auditada: `/workspace/rebuild/v41`, versão 4.1.0. Este documento é um checklist de trabalho: **nenhum item abaixo foi aprovado ou executado como validação da v5**. Os números descrevem o escopo recomendado para o plano, não funcionalidades já entregues.

Legenda: **A** = verificável por dados, testes automatizados ou inspeção técnica; **H** = exige observação de pessoas jogando; **A+H** = precisa dos dois. Uma simulação de 86.400 segundos não comprova uma campanha divertida de 24 horas.

## 1. Base observada e contrato do novo escopo

| Sistema | Situação encontrada na v4.1 | Escopo a verificar na v5 |
|---|---|---|
| Campanha | Um capítulo, cinco etapas principais e duas atividades opcionais | Seis atos/regiões; 48 missões e 12 masmorras |
| Duração | A meta anterior de 15–20 minutos não foi aferida com jogadores humanos | Meta de primeira jornada: 16 h de rota principal + 5 h de secundárias/caçadas + 3 h de exploração |
| Monstros | Três tipos comuns e um chefe | 24 espécies comuns, 12 variantes de elite, seis minichefes e seis chefes de ato: 48 fichas |
| Equipamentos | Seis famílias de armas, seis slots de armadura, três raridades e 36 imagens de tipo/raridade | 78 entradas principais: 48 bases + 24 IDs lendários + seis IDs relicários; oito conjuntos e seis raridades |
| Técnicas | Quatro habilidades por classe, desbloqueadas nos níveis 1/2/4/6; modificadores genéricos | Seis ativas por classe, quatro equipadas; ranks, formas e orçamento próprio de técnica |
| Talentos | Três nós de cinco ranks por classe; orçamento calculado de 29 pontos no nível 60 para capacidade de 15 | Três ramos por classe, 30 pontos e requisitos alcançáveis |
| Raridade | Comum/Raro/Épico; quantidade de afixos acompanha a raridade; sorteio permite afixos repetidos | Tabelas por fonte, grupos de afixos, efeitos autorais, fontes dirigidas e limites explícitos |
| Coleções | Não foi encontrado bestiário nem códice de itens | Dois registros persistentes de descoberta, separados da mochila |
| Persistência | HTML offline, schema 3, chave `ecos-horizonte-save-v4`, exportação JSON e saques no chão | Migração da v4.1 com backup, novos registros, identificadores estáveis e recuperação |

- [ ] **ESC-01 · A** Fixar o catálogo: seis atos/regiões, 18 subzonas externas (três por região); 24 missões principais (quatro por ato), 18 secundárias (três por ato), seis caçadas (uma por ato); 12 masmorras (uma principal e uma opcional por região).
- [ ] **ESC-02 · A** Registrar 48 fichas de inimigos sem anunciar 48 espécies: 24 comuns, 12 variantes de elite identificadas como variantes, seis minichefes e seis chefes de ato.
- [ ] **ESC-03 · A** Registrar 48 bases de equipamento: 24 armas (seis famílias × quatro bases) e 24 armaduras (seis slots × quatro bases); listar separadamente 24 lendários, seis relíquias e oito conjuntos.
- [ ] **ESC-04 · A** Fixar exatamente 78 entradas principais no códice de itens: 48 bases + 24 IDs lendários próprios + seis IDs relicários próprios. Variantes de conjunto, rolagem e melhoria ficam como metadados/subfichas, não como novas entradas para inflar o total.
- [ ] **ESC-05 · A** Congelar uma tabela de IDs e versões dos catálogos. Nenhuma missão, arte, tradução, receita ou salvamento pode depender da posição do elemento num array.
- [ ] **ESC-06 · A+H** Definir a jornada de referência de 24 h: partida nova no nível 1 em Aventura, quatro heróis disponíveis, seleção significativa de conteúdo opcional, sem exigir códice 100%, espera artificial ou repetição obrigatória de expedições. Saves importados preservam sua progressão, podem concluir mais rápido e não entram na amostra de duração de uma jornada nova.

## 2. Duração, ritmo e progressão

- [ ] **TEM-01 · A** A planilha de conteúdo soma aproximadamente 24 h distribuídas em seis atos de aproximadamente quatro horas. Cada estimativa informa combate, navegação, diálogo, enigma e exploração; não multiplica a duração de um encontro pelo número de variantes para declarar conteúdo novo.
- [ ] **TEM-02 · A** Os 16 h principais, 5 h de secundárias/caçadas e 3 h de exploração são orçamento editorial. Pausa, inventário, AFK, carregamento e farm repetido ficam registrados à parte e não preenchem esse orçamento.
- [ ] **TEM-03 · H** Fazer 12 sessões de onboarding de 30 minutos antes da expansão completa, cobrindo as quatro classes e diferentes níveis de experiência. Pelo menos 10 de 12 pessoas devem conseguir iniciar a primeira missão, gastar um ponto e recolher/equipar uma melhoria sem instrução do observador.
- [ ] **TEM-04 · H** Completar no mínimo seis jornadas humanas novas, iniciadas no nível 1, cobrindo as quatro classes e pelo menos dois participantes pouco familiarizados com ARPGs. Usar dados completos das seis jornadas, incluindo abandonos e dificuldades; não selecionar apenas os tempos que se aproximam da meta.
- [ ] **TEM-05 · H** Medir o alvo P50 de 22–26 h para a jornada de referência. Registrar rota principal, conteúdo opcional, mortes, menus e pausas separadamente. Seis jornadas de 24 h representam cerca de **144 h de exposição humana**, além do onboarding; automação não substitui essa exposição.
- [ ] **TEM-06 · H** Nenhum trecho da rota principal exige farm de XP, ouro, material raro ou queda aleatória para continuar. Um participante abaixo da curva encontra uma atividade contextual, com recompensa conhecida, em vez de um bloqueio silencioso de nível.
- [ ] **TEM-07 · H** Auditar todo intervalo superior a 20 minutos sem nova descoberta, decisão de construção, situação de combate, revelação narrativa ou mudança de cenário. Marcar o trecho e a causa; caminhada e aumento de números não bastam como novidade.
- [ ] **TEM-08 · A+H** Permitir sessões móveis de 15–30 minutos com um objetivo concluível e retomada clara. Distância típica entre pontos seguros de retomada: no máximo 10 minutos de jogo, sem obrigar encerramento de masmorra para salvar.
- [ ] **PRO-01 · A** Publicar curva de XP, faixa de nível e orçamento de poder de cada ato, encontro e chefe. A curva candidata `round(80 + 22L + 3L^1,65)` soma 100.721 XP do nível 1 ao 60; conferir os orçamentos de intervalo 3.064/7.542/13.363/20.216/27.985/28.551. A rota principal isolada precisa ter orçamento elegível para chegar aproximadamente ao nível 52 (72.170 XP), enquanto a rota completa mira 60; não aplicar uniformemente o mesmo XP a todas as missões e pressupor esse resultado. Os níveis 1/10/20/30/40/50/60 têm equipamentos, recursos e construções de referência explícitos.
- [ ] **PRO-02 · A+H** Nos seis percursos humanos, verificar os checkpoints de nível planejados por tipo de rota (principal isolada versus referência completa) e investigar desvios maiores que dois níveis antes de um chefe. O jogo deve continuar viável com recompensas garantidas e itens adequados comuns/raros, sem depender de um lendário específico.
- [ ] **PRO-03 · A** Não usar escalonamento integral que faça todo inimigo sempre igualar o jogador. Registrar pisos/tetos por região, regras de retorno e regras de expedição; uma melhoria legítima precisa produzir ganho observável em uma área anterior.
- [ ] **PRO-04 · A+H** Testar a rota mínima, a rota de referência e uma rota de alta exploração. A primeira não termina travada; a segunda acompanha a curva; a terceira não trivializa atos inteiros por acumular recompensas de baixo risco.
- [ ] **PRO-05 · A** Separar progressão da campanha e Legado. Após o nível 60, recompensas continuam possíveis, mas os limites de poder são explícitos e não tornam a campanha irrelevante nem fazem os inimigos crescerem exponencialmente.

## 3. Pontos, técnicas, formas e talentos

### Orçamento a usar nos testes

Técnica: 24 pontos por herói, concedidos nos níveis **2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 45, 50, 55 e 60**. Seis habilidades, ranks 1–3; o primeiro rank da habilidade inicial é gratuito. Uma entre três formas por habilidade, mutuamente exclusivas, com dois ranks por forma: 72 opções de forma no total das quatro classes. Ranks básicos 2/3 exigem níveis 8/24; forma e domínio exigem níveis 12/36. Capacidade efetivamente investível: 17 pontos de ranks + 12 de formas = 29; orçamento: 24. A HUD comporta três técnicas normais escolhidas entre cinco e uma suprema por classe: quatro botões. As quatro técnicas originais preservam os desbloqueios 1/2/4/6 da v4.1 (a suprema no 6); as duas novas técnicas normais entram nos níveis 16 e 28. Distinguir desbloquear a compra da técnica e investir seu primeiro rank: apenas o primeiro rank da habilidade inicial é gratuito.

Talentos: 30 pontos por herói, um por nível par de 2 a 60. Cada um dos três ramos tem quatro nós de três ranks e um capstone de dois ranks. Capacidade teórica 42; com apenas um capstone recebendo pontos, capacidade efetivamente investível 38. Capstone exige nível 40 e dez pontos no próprio ramo. Especialização gratuita no nível 20; afinidade não gera pontos extras. Respec gratuito em Âncora.

| Nível | Técnica recebida acumulada | Talentos recebidos acumulados |
|---|---:|---:|
| 1 | 0 | 0 |
| 2 | 1 | 1 |
| 10 | 5 | 5 |
| 20 | 10 | 10 |
| 25 | 12 | 12 |
| 30 | 15 | 15 |
| 40 | 20 | 20 |
| 45 | 21 | 22 |
| 50 | 22 | 25 |
| 55 | 23 | 27 |
| 60 | 24 | 30 |

- [ ] **PON-01 · A** Para cada herói e nível 1–60, conferir a tabela de concessões e as identidades `disponíveis = max(0, recebidos − investidos)`, `déficit legado = max(0, investidos − recebidos)` e `recebidos + déficit = investidos + disponíveis`. Pontos futuros reduzem primeiro o déficit; não descontá-lo duas vezes. O rank inicial gratuito não consome ponto e não gera reembolso pago.
- [ ] **PON-02 · A** Subir vários níveis de uma vez, carregar um save e alternar de herói não concede pontos duas vezes. Os quatro heróis guardam seus investimentos, mas nenhum herda indevidamente o total investido por outro.
- [ ] **PON-03 · A** Validar o grafo de todos os nós automaticamente: referências existentes, ausência de ciclos impossíveis, ranks legais, forma exclusiva e alcance de cada nó dentro do orçamento de pontos e do nível exigido.
- [ ] **PON-04 · A** Demonstrar pelo menos uma sequência válida que atinja cada capstone no nível 40 ou posterior. Nenhum nó pago exige 30 pontos previamente gastos quando só há 30 disponíveis.
- [ ] **PON-05 · A** Reprovar compra com saldo insuficiente, segundo capstone, duas formas simultâneas, rank acima do limite, pré-requisito ausente ou técnica ainda bloqueada. Testar ranks básicos nos gates 8/24, formas/domínio nos gates 12/36, capstone no nível 40 com dez pontos no ramo e os marcos 1/2/4/6/16/28 e a regra de equipar três normais entre cinco + uma suprema, sem ocupar a vaga suprema com uma quarta normal. A rejeição não altera pontos, ouro, ranks ou equipamentos.
- [ ] **PON-06 · A** Remover pré-requisito reembolsa ou remove os dependentes na mesma transação. Não existe estado salvo intermediário com forma ativa sem habilidade, capstone sem dez pontos no ramo ou saldo inflado.
- [ ] **PON-07 · A** Respec em Âncora é gratuito e devolve exatamente os pontos pagos válidos. Executar cem ciclos de investir/reembolsar/carregar não cria pontos nem elimina a habilidade inicial gratuita.
- [ ] **PON-08 · A** Preservar recarga, proporção de vida/energia e limites de combate ao trocar habilidades, formas ou herói. Troca/respec não funciona como cura gratuita ou reinício de recarga durante uma luta.
- [ ] **PON-09 · A+H** Mostrar custo, nível, pré-requisito, resultado atual e próximo rank antes da compra. Uma técnica liberada por nível, mas ainda sem primeiro rank pago, aparece como disponível para investir, não como já utilizável; mostrar a solução por respec gratuito quando o jogador gastou o saldo em outros ranks. Exibir saldo de técnica e talentos separadamente, sem exigir que a pessoa deduza a fórmula.
- [ ] **PON-10 · A+H** As três formas de cada habilidade mudam uso, área, comportamento, risco ou sinergia de maneira identificável. Uma opção não pode ser simultaneamente melhor em dano, alcance, custo, controle e recarga.
- [ ] **PON-11 · A+H** Cada classe tem pelo menos três construções de referência com decisões e rotação diferentes. Híbridos continuam viáveis; especialização não significa simplesmente comprar todos os nós até o final.
- [ ] **PON-12 · H** Depois de uma sessão de experimentação, pelo menos cinco dos seis participantes completos conseguem explicar uma escolha de forma ou talento e sua desvantagem. Respostas apenas de cor ou número indicam falta de identidade da decisão.

## 4. Complexidade de itens, raridade, conjuntos e economia

- [ ] **ITE-01 · A** Cada equipamento define ID de instância, base, slot, família, nível de item, raridade, rolagens, efeito autoral, conjunto opcional e melhoria. Texto de comparação e cálculo usam os mesmos valores normalizados.
- [ ] **ITE-02 · A** Comum, Incomum, Raro, Épico, Lendário e Relíquia têm contratos distintos de geração, função e apresentação. Relíquia só pode ser um dos seis IDs narrativos permitidos em seu slot de armadura específico, nunca uma arma genérica sorteada nessa raridade. Conjunto é atributo independente, não uma sétima raridade; a interface mostra as duas informações sem ambiguidade.
- [ ] **ITE-03 · A** Validar cem mil gerações por tabela de fonte/faixa usando sementes reprodutíveis: probabilidades somam 100%, pesos negativos/inexistentes são rejeitados e a frequência observada é compatível com o intervalo estatístico esperado. Verificar separadamente a chance de cair algo e a raridade condicionada à queda. Testar os pesos-base sem proteção e a máquina de estado com proteções: 26ª morte comum elegível após 25 falhas e sétima recompensa de masmorra após seis sem épico. Não comparar a frequência final protegida diretamente com os pesos-base como se fossem eventos independentes.
- [ ] **ITE-04 · A** Proibir afixos duplicados ou mutuamente exclusivos salvo regra expressa. Prefixos, sufixos, elemento e efeito autoral respeitam os grupos e orçamentos do catálogo; um item não recebe mais afixos do que sua raridade permite.
- [ ] **ITE-05 · A** Os 24 itens lendários e seis itens relicários possuem IDs próprios, especificação, teste de interação e identidade próprias. Verificar orçamento inicial de até 10–15% de DPS sustentado por assinatura ofensiva isolada e até 25% na combinação das três; defesa/controle têm teste equivalente, e gatilhos não se disparam recursivamente. Recolorir, renomear ou adicionar dano genérico não conta como novo efeito autoral.
- [ ] **ITE-06 · A+H** Raridade não substitui avaliação da construção. Um item de nível adequado e bons atributos pode ser uma escolha contextual melhor que uma raridade superior inadequada; a comparação explica esse caso.
- [ ] **ITE-07 · A** Cobrir os extremos de rolagem, melhoria e combinações de conjuntos. Uma melhoria não remove afixo, muda raridade indevidamente, altera a arte para outro tipo ou ultrapassa os limites declarados.
- [ ] **ITE-08 · A** Para oito conjuntos, conferir peças válidas, bônus de duas/quatro peças, ativação/desativação, reserva, uso por outro herói e persistência. Demonstrar uma combinação legal de quatro peças para cada conjunto respeitando o máximo de três assinaturas; nenhum bônus de quatro exige quatro itens exclusivamente lendários/relicários. Não somar bônus da mesma peça duas vezes nem manter bônus após removê-la.
- [ ] **ITE-09 · A+H** Disponibilizar fontes dirigidas para os materiais e itens-chave de construção. Conferir a meta de 10–16 equipamentos/h incluindo proteções; primeiro raro garantido em 45–60 min, primeiro épico no ato I e primeiro lendário autoral até cerca da sexta hora. No pós-jogo, testar a receita após cinco conclusões válidas da fonte indicada e a meta de 40–60 min para peça dirigida. Garantir oportunidades de melhoria autoral em cada ato; não exigir uma queda lendária aleatória para vencer a missão principal.
- [ ] **ITE-10 · A** Relíquias únicas da história e equipamentos favoritos/vinculados ficam protegidos de reciclagem, venda em lote e substituição automática. As seis relíquias equipáveis usam slots específicos entre os seis slots de armadura existentes; não existe slot extra. Poderes narrativos de Nimbo ficam em flags de missão e não dependem de vestir a relíquia. Materiais e conhecimento do códice não ocupam vagas de equipamento desnecessariamente.
- [ ] **ITE-11 · A** Testar mochila cheia, cem itens no chão, masmorra abandonada, morte, troca de ato e recarga. O item permanece recuperável ou é transferido segundo regra declarada; nunca desaparece por exceder silenciosamente um limite de array.
- [ ] **ITE-12 · A+H** A peça mantém arte, nome, raridade e rolagens ao cair, ser recolhida, equipada, armazenada, melhorada, comparada e exportada. Imagens lendárias/relicárias são reconhecíveis em tamanho de celular, não só pela moldura.
- [ ] **ITE-13 · A** Identificar, por fórmula, qual operação salva ouro, materiais e item na mesma transação. Compra/forja sem espaço ou sem recurso suficiente não debita nada; repetir um evento não duplica recompensa.
- [ ] **ITE-14 · A** Aplicar o máximo visível de três peças com assinatura equipadas ao mesmo tempo, somando lendários e relíquias. Computar o equipamento projetado depois da troca: substituir uma assinatura por outra é permitido se o total permanecer três. Reserva, mochila, baú e equipamento de herói inativo não contam para o herói ativo.
- [ ] **ITE-15 · A** Cobrir a restrição de assinatura na troca de arma, carregamento de construção, troca de herói, respec, importação e tentativa de equipar uma quarta peça. Rejeitar uma combinação inválida não apaga o item nem muda moedas; a interface explica a restrição antes da ação. Retirar a relíquia não fecha pontes, missões ou poderes narrativos de Nimbo já desbloqueados.
- [ ] **ECO-01 · A** Tabela de fontes e gastos em cada ato: missões, monstros, baús, venda, reciclagem, forja e melhorias. Testar loops compra → reciclagem → forja → venda; nenhum loop sem risco/limite gera lucro infinito.
- [ ] **ECO-02 · A+H** A rota de referência paga as melhorias esperadas e mantém escolhas de gasto. Registrar saldo ao final de cada ato; investigar tanto déficit que exige farm quanto sobra que torna todos os custos irrelevantes.
- [ ] **ECO-03 · A** Limitar a inflação no Legado e expedições. Números permanecem finitos; resultados não excedem os limites de precisão nem transformam preços da campanha em zero prático após poucos ciclos.

## 5. Balanceamento de combate

- [ ] **BAL-01 · A** Fixar uma ordem de cálculo para base, ranks, afixos, conjuntos, formas, crítico, vulnerabilidade, defesa e resistências. Diferenciar adição de multiplicação e publicar caps/retornos decrescentes no documento de equilíbrio.
- [ ] **BAL-02 · A** Aplicar os caps candidatos do plano v5, em vez de reaproveitar silenciosamente os da v4.1: crítico 35%, redução de recarga 30%, velocidade de ataque 25%, drenagem 3%, resistência elemental 50%, proteção de armadura 55% e mitigação combinada 75% fora de aparo/esquiva. O Legado mantém no máximo 20 investimentos de poder. Atributos da mesma categoria somam antes do teto, e a interface informa excedentes.
- [ ] **BAL-03 · A** Executar ao menos dez mil construções válidas por classe, com busca dos extremos e casos autorais. Detectar recarga zero, vida/energia infinitas, invulnerabilidade sustentada, números não finitos, loops de eco e dano recursivo sem limite.
- [ ] **BAL-04 · A** Medir quatro classes × três construções × três qualidades de equipamento × sete níveis (1/10/20/30/40/50/60): 252 casos-base, antes das variações contra alvo único, grupo, inimigo móvel, guarda/armadura e controle. Reduzir cada construção aos pontos e desbloqueios válidos naquele nível; coincidências no nível 1 não comprovam diversidade de construções. Investigar vantagem agregada superior a 20% sem custo ou compensação de função; não equilibrar tudo apenas no boneco parado.
- [ ] **BAL-05 · A+H** Faixas iniciais do plano, com itens adequados: comum isolado 3–6 s; guarda/bruto 7–11 s; grupo misto 20–45 s; elite 14–24 s; minichefe 45–90 s; chefe de ato 90–150 s. Criaturas frágeis podem cair antes. Registrar transições, invulnerabilidade e tempo correndo separados; aumentar HP não conta sozinho como complexidade.
- [ ] **BAL-06 · A+H** Cada ataque perigoso tem leitura e reação possível. Referência inicial em Aventura: pelo menos 0,45 s para ameaças comuns aprendidas e 0,7 s na apresentação de ameaças de chefe; ajustes menores exigem contraste, contexto e teste humano.
- [ ] **BAL-07 · A** Testar simultaneidade de ameaças, dano ao longo do tempo, parry, esquiva, escudo, quebra de postura e resistências. Conferir até seis inimigos ativos no encontro padrão, até dez em situações especiais controladas, no máximo dois ataques pesados comprometidos ao mesmo tempo, até três invocações do jogador e controle de chefe abaixo de 25% do tempo vulnerável como alvo inicial. Não permitir cadeia inevitável de controle que mate o jogador sem uma decisão defensiva disponível.
- [ ] **BAL-08 · H** Medir tentativas e causas de morte por chefe e classe. Após feedback e aprendizado, todos os quatro heróis devem progredir com recompensas garantidas. Registrar problemas por perfil; não corrigir uma classe fraca exigindo que a pessoa troque de herói.
- [ ] **BAL-09 · A+H** História, Aventura e Desafio mantêm as mecânicas essenciais, mas oferecem tolerâncias distintas. A menor dificuldade não exige reação de jogador experiente nem execução perfeita para concluir a narrativa.

## 6. Arte das habilidades e experiência móvel

- [ ] **ART-01 · A** Montar uma ficha por habilidade e forma: ícone, silhueta, paleta, direção, preparação, impacto, recuperação, área real, áudio e variantes reduzidas. Todas seguem a mesma escala de pixels e direção de arte dos heróis e monstros.
- [ ] **ART-02 · A+H** A área de perigo coincide com a área de dano no instante correto, com margem visual declarada. Gravar ataques em oito direções e conferir alcance, ponto de origem, arma e orientação do personagem.
- [ ] **ART-03 · H** Ao ver um efeito novo, a pessoa identifica origem, perigo/benefício e ação provável sem ler um texto no meio da luta. Cor não é o único sinal: forma, contorno, movimento e som se complementam.
- [ ] **ART-04 · A** A HUD mantém três habilidades normais escolhidas entre cinco + uma suprema por classe, ataque, defesa/esquiva e recursos necessários. As seis técnicas e suas formas ficam no hub; não criar um segundo conjunto de botões minúsculos no campo.
- [ ] **ART-05 · A+H** Alvos de toque úteis têm pelo menos 44 × 44 CSS px depois das escalas, sem sobreposição, nos tamanhos 320×568, 360×640, 390×844, 568×320 e 844×390, e nos perfis normal/maior/canhoto.
- [ ] **ART-06 · A** Preservar movimento + habilidade com dois dedos, cancelamento de toque, rotação da tela, abertura de menu, suspensão e retomada. Um gesto não lança duas vezes nem deixa movimento/aparo preso.
- [ ] **ART-07 · A+H** Manter um aviso compacto por vez e impedir que explosões, nomes de habilidades ou notificações escondam o herói, o alvo ou a próxima ameaça. Informações secundárias continuam disponíveis no diário.
- [ ] **ART-08 · A+H** Medir os orçamentos iniciais: até 32 emissores/180 partículas no padrão e 16/60 no leve. O modo leve conserva telegráficos, identificação de elementos, raridades e confirmação de acerto. Ele pode reduzir partículas, luz e resolução de efeitos, mas não retirar a informação necessária para reagir.
- [ ] **ART-09 · A** Conferir a produção prometida: 144 desenhos de bases (48 × três estágios) + 24 lendários + seis relíquias = 174 desenhos de equipamento, oito emblemas de conjunto, seis tratamentos de raridade, 24 ícones básicos e 72 emblemas de forma. Esses desenhos não viram novas entradas principais do códice. Imagens, sons e fontes necessários ficam incorporados ao HTML, com licença/proveniência registradas. Arquivo gerado não usa CDN, API externa, imagem remota ou importação de módulo para iniciar ou concluir o jogo.

## 7. Monstros, elites e chefes

- [ ] **MON-01 · A** Cada uma das 24 espécies comuns tem pelo menos um comportamento tático que a distingue, além de aparência/atributos. Catalogar função de perseguidor, atirador, suporte, guarda, controlador, emboscador ou outra função definida.
- [ ] **MON-02 · A** Validar os estados de percepção, alerta, preparação, compromisso do ataque, recuperação, reposicionamento, retorno, atordoamento e morte. Um inimigo morto não ataca, solta outro item ou registra outra recompensa.
- [ ] **MON-03 · A** Cobrir paredes, portas, água, pontes temporárias, curvas, saída de arena e mudança de cena. Monstros não atravessam obstáculos nem ficam inacessíveis mantendo o jogador permanentemente em combate.
- [ ] **MON-04 · A+H** Os grupos combinam papéis de maneira intencional. Cada região apresenta uma combinação nova ou um uso novo do terreno, e não somente quantidades e níveis maiores dos mesmos perseguidores.
- [ ] **MON-05 · A** As 12 variantes de elite informam seus modificadores e usam orçamento de combinação. Modificadores incompatíveis são proibidos; resistência e controle têm limites; recompensa adicional ocorre uma única vez.
- [ ] **MON-06 · A+H** Os seis minichefes e seis chefes de ato têm identidade e arena próprias. Chefes apresentam mudança de fase e pelo menos duas decisões táticas além de causar dano; registrar contrajogo para cada uma das quatro classes.
- [ ] **MON-07 · A** Remover imunidade obrigatória que invalide uma classe inteira. Fraquezas oferecem vantagem e informação, mas uma história principal não exige uma arma lendária ou elemento de queda aleatória.
- [ ] **MON-08 · A** Confirmar arte de corpo, animação, retrato/ficha, telegráfico e som por espécie. Recolorizações de elite são identificadas como variantes e não inflacionam a contagem de espécies autorais.

## 8. Bestiário e códice de itens descobertos

- [ ] **COD-01 · A** Os catálogos usam IDs estáveis e estados de descoberta explícitos. Ver, derrotar, examinar e possuir não são tratados como o mesmo evento por acidente.
- [ ] **COD-02 · A** Testar os 48 registros do bestiário: encontrado libera identificação básica; observação/derrota libera comportamento e pistas conforme a regra; entradas ainda desconhecidas não revelam chefe, solução ou local secreto.
- [ ] **COD-03 · A+H** A ficha do monstro mostra ilustração, função, região, ameaças e contrajogo úteis. A pessoa encontra um inimigo conhecido em até três interações a partir do hub, com filtro por região/tipo/descoberto.
- [ ] **COD-04 · A** O códice de itens tem exatamente 78 entradas principais (48 bases, 24 lendários e seis relíquias); distingue essas categorias e mantém conjuntos como metadados/subfichas, sem criar nova descoberta para cada rolagem aleatória. Vender, reciclar ou perder a peça física não apaga o conhecimento adquirido.
- [ ] **COD-05 · A+H** A ficha do item indica slots/família, efeito, faixa de rolagem conhecida e pista de fonte apropriada. Uma fonte dirigida já descoberta é localizável; uma fonte secreta ainda não encontrada não é revelada por completo.
- [ ] **COD-06 · A** Descobertas e contadores persistem em exportar/importar, mudar de ato e trocar de herói. Cem repetições do mesmo evento não geram cem entradas nem cem recompensas.
- [ ] **COD-07 · A** Completar os códices não concede bônus de combate obrigatório para a curva da campanha. Recompensas cosméticas, história e títulos não entram no orçamento necessário para vencer o ato final.
- [ ] **COD-08 · H** Pelo menos cinco dos seis participantes completos conseguem consultar uma fraqueza de monstro e a origem de uma peça conhecida sem ajuda. Registrar tempo de busca e termos que causaram confusão.

## 9. Missões, masmorras e retorno ao mundo

- [ ] **MIS-01 · A** Validar todas as 48 missões como máquinas de estado: não iniciada, ativa, objetivo cumprido, recompensa reclamada e encerrada/ramificada. Nenhuma recompensa ou alteração de mundo depende apenas de exibir um diálogo.
- [ ] **MIS-02 · A** Cada missão tem objetivo, contexto, região, pré-requisito, pista, condição de conclusão, consequência e recompensa. Variantes de texto de um mesmo contrato repetido não entram como missões autorais distintas.
- [ ] **MIS-03 · A+H** Cada ato tem pelo menos uma secundária com consequência visível no mundo, rota, personagem ou serviço. Auditar a proporção de objetivos: coleta/extermínio simples não deve superar um terço das etapas autorais, medindo etapas e não apenas nomes das 18 secundárias e seis caçadas.
- [ ] **MIS-04 · A** Cobrir conclusão de objetivo antes da aceitação, chefe já derrotado, item guardado/vendido, NPC deslocado, mochila cheia, inventário de outro herói, morte e recarga durante entrega.
- [ ] **MIS-05 · A** Para escolhas exclusivas, o estado alternativo tem encerramento coerente e recompensa equivalente em orçamento. Não deixar missão impossível, NPC sem diálogo ou contagem de conclusão inacessível.
- [ ] **MIS-06 · A** Nas 12 masmorras, entrada, saída, puzzle, chefe, baú e itens no chão retomam em estado coerente. Sair ou recarregar não duplica tesouro nem destrói saques não recolhidos.
- [ ] **MIS-07 · A+H** O diário aponta uma ação atual e um destino plausível. Depois de uma interrupção de pelo menos um dia, o participante retoma a próxima etapa em até dois minutos sem orientação externa.
- [ ] **MIS-08 · A** Cenas, fases e capítulos dependem de flags versionadas e recompensas idempotentes. Repetir o evento de conclusão dez vezes não acrescenta XP, item, pontos, moeda ou desbloqueio adicionais.
- [ ] **MIS-09 · H** Concluir os seis atos em uma jornada de referência demonstra começo, escalada, escolhas e desfecho. Revisar trechos que os participantes descrevem como preenchimento, mesmo que atinjam a meta de horas.

## 10. HTML único, desempenho, salvamento e migração

- [ ] **TEC-01 · A** O build gera um único HTML reproduzível com manifesto de versão e hash. Baixar o anexo, extrair os metadados e conferir que o conteúdo é o mesmo testado e publicado.
- [ ] **TEC-02 · A** Registrar orçamento de tamanho antes da produção de artes: teto provisório de 20 MiB para o HTML e de 6 MiB para um save exportado de 24 h. Rever esses tetos com evidência antes de ultrapassá-los, sem cortar silenciosamente dados de jogador.
- [ ] **TEC-03 · A+H** Decodificar somente os atlas necessários, paginar catálogos e descarregar caches de regiões, respeitando a meta inicial de 96 MiB de cache gráfico decodificado. Medir memória total separadamente do tamanho do HTML/cache. Não carregar os seis atos inteiros como imagens grandes simultâneas apenas porque os bytes estão no mesmo HTML.
- [ ] **TEC-04 · A** Medir dados e memória em uma jornada longa, inclusive 200 mudanças de cena, dez mil eventos de descoberta/recompensa e mil itens persistidos. Detectar arrays sem limite, imagens duplicadas, crescimento contínuo de listeners e queda de desempenho após horas.
- [ ] **TEC-05 · A+H** Definir os aparelhos-alvo e verificar ao menos um Android intermediário e um iPhone suportado. Referência de aceite: combate no modo leve próximo de 30 FPS, p95 de quadro até 50 ms em encontro de referência e ausência de pausas recorrentes acima de 250 ms, com exceções medidas de carga de região.
- [ ] **TEC-06 · A+H** Medir início, troca de região, autosave e consulta aos códices nos aparelhos-alvo. Metas provisórias: primeira interação em até oito segundos após abrir o arquivo, troca de região até dois segundos e confirmação de toque até 100 ms; documentar qualquer ajuste de alvo.
- [ ] **TEC-07 · A** Testar a cópia baixada com rede desligada. Quando o ambiente bloquear `file://`, registrar a limitação e não declarar esse caminho aprovado; testar abertura real do arquivo no aparelho-alvo antes da entrega final móvel.
- [ ] **TEC-08 · A+H** Testar IndexedDB indisponível/bloqueado e o fallback no caminho de arquivo real. Quota de fallback menor que o save de 6 MiB não permite truncar a jornada: preservar a cópia anterior e oferecer recuperação/exportação clara. Testar os limites reais por navegador em vez de pressupor que localStorage comporta 6 MiB.
- [ ] **SAL-01 · A** Guardar backup byte a byte do save v4.1 antes de migrar e usar envelope schema 4 com chave nova `ecos-horizonte-save-v5`, sem sobrescrever `ecos-horizonte-save-v4`. IndexedDB é preferencial, com transações e duas gerações de backup. A migração só substitui o save ativo depois de validar e persistir o resultado completo.
- [ ] **SAL-02 · A** Migrar fixtures reais da v4.1: início, campanha concluída, quatro heróis, talentos, modificadores, Legado, itens em reserva, mochila cheia, saques no chão e interior aberto. Preservar nível, itens, moedas e flags relevantes; não recomeçar a campanha anterior silenciosamente.
- [ ] **SAL-03 · A** Mapear os IDs antigos e modificadores para técnicas/formas novas explicitamente. Preservar as quatro técnicas originais nos mesmos marcos 1/2/4/6 da v4.1 e suas descobertas; não atrasá-las para os gates antes cogitados de 6/12, nem liberar automaticamente as novas técnicas normais dos níveis 16/28. Preservar a suprema na quarta vaga e a seleção de três normais nas demais.
- [ ] **SAL-04 · A** Reconstruir os novos orçamentos pela tabela de níveis, não pelo saldo antigo. Preservar investimentos compatíveis; quando excederem o orçamento, registrar déficit visível e política de compensação por pontos futuros/respec, sem confiscar equipamento ou nível.
- [ ] **SAL-05 · A+H** Mostrar resumo da migração: conteúdo preservado, habilidades herdadas, pontos disponíveis/déficit e acesso ao respec gratuito. O jogador consegue corrigir uma construção herdada sem ficar sem uma habilidade inicial utilizável.
- [ ] **SAL-06 · A** Morte, suspensão de aba, perda de foco, bateria simulada/interrupção, save incompleto, storage cheio e importação inválida não corrompem a cópia anterior. Importação rejeitada deixa o progresso em memória e no disco intacto.
- [ ] **SAL-07 · A** Testar exportar → importar → exportar, recompensas repetidas e migração executada duas vezes. Não duplicar IDs, pontos, relíquias, descobertas nem recompensas da campanha.
- [ ] **SAL-08 · A** Evitar persistir o catálogo completo em cada save. Salvar IDs de descobertas e estados do jogador, com limites explícitos de validação que comportem 24 h; itens no chão, inventário e códices não podem ultrapassar limites menores do que a campanha produz legitimamente.
- [ ] **SAL-09 · A** Migrar raridade por versão e ID semântico, nunca copiando o índice: v4.1 `0/1/2 = Comum/Raro/Épico` deve virar v5 `common/rare/epic` (ou `0/2/3` se a serialização nova também usar números). Testar todos os slots, reservas, equipamentos de quatro heróis, baú/itens no chão e códice. Raro antigo não vira Incomum; Épico antigo não vira Raro; nomes/arte/afixos não mudam por deslocamento do enum. Conversões excepcionais têm tabela explícita. Incluir a arma legada Memória do Reencontro em suas famílias originais: não a converter no manto relicário Sino do Reencontro nem em outra família apenas por semelhança de nome.

## 11. Ordem de dependências e evidências

| Etapa | Depende de | Evidência para avançar |
|---|---|---|
| Contrato de sistemas | ESC-01 a ESC-06 | Catálogos, IDs, curva e orçamento editorial fixados |
| Migração e pontos | Contrato e modelo de save | Testes de concessão, alcançabilidade, reembolso e fixtures v4.1 |
| Fatia jogável de um ato | Pontos, itens, IA e arte representativos | Uma sessão humana de 45–60 min com fluxo completo; problemas documentados |
| Expansão para seis atos | Fatia aprovada e orçamento técnico medido | Seis atos implementados e percursos automáticos sem bloqueio |
| Balanceamento e coleções | Conteúdo e tabelas completos | Matrizes de combate, economia, loot e descobertas reproduzíveis |
| Candidato final | Regressão técnica e aparelhos-alvo | Arquivo/hash final, testes offline, saves e toque aprovados |
| Alegação de campanha de 24 h | Conteúdo final + jornadas humanas | Dados das seis jornadas completas e onboarding; mediana e causas de variação |

- [ ] **EVI-01 · A** Cada resultado indica versão, hash do HTML, caso, aparelho/navegador, dados iniciais e resultado. Um relatório da v4.1 não é apresentado como prova da v5.
- [ ] **EVI-02 · A** Classificar falhas por gravidade e manter reprovação visível. Não marcar um requisito como concluído porque existe uma função com o mesmo nome ou porque um bot chegou ao final.
- [ ] **EVI-03 · H** Registrar consentimento e observações dos testes humanos de forma local e mínima. Não adicionar telemetria externa obrigatória ao HTML offline para viabilizar as medições.

## 12. Bloqueios objetivos de entrega

**P0 — bloqueia qualquer build destinado a substituir a jornada existente:** corrupção/perda de save, duplicação repetível de pontos ou recompensas, remoção involuntária de equipamento, progressão principal impossível, controles presos, importação inválida que altera o progresso, ou dependência externa que impede iniciar offline.

**P1 — bloqueia a entrega descrita como campanha completa de 24 h:** algum ato, missão principal, chefe, arte indispensável, migração, códice prometido ou sistema de pontos ainda incompleto; árvore com nós pagos inalcançáveis; classe sem rota viável; falta de validação no aparelho-alvo; ou inexistência dos dados humanos necessários para sustentar a alegação de duração.

**P2 — pode permanecer em prévia identificada:** ajustes cosméticos menores, variação de duração ainda sendo calibrada e melhorias opcionais de conveniência, desde que não ocultem P0/P1 e estejam listadas.

- [ ] **ENT-01 · A** Zero P0 aberto antes de distribuir um HTML para continuidade de saves.
- [ ] **ENT-02 · A+H** Zero P1 aberto antes de chamar a entrega de campanha final validada; enquanto houver P1, identificar o build como prévia e a duração como meta de projeto.
- [ ] **ENT-03 · A** Conferir download direto com `Content-Disposition: attachment`, resposta 200 e hash igual ao arquivo aprovado. Preservar os links anteriores e verificar a mesma versão no Site.
- [ ] **ENT-04 · A** Entregar ao usuário o HTML, plano, checklist atualizado, relatório de testes e limitações restantes. Critérios de qualidade deste checklist não criam um novo pedido de autorização para ações que o usuário já autorizou.

## Lacunas prioritárias encontradas na v4.1

1. Há um capítulo curto como base; os seis atos e a validação de 24 h ainda precisam ser produzidos e medidos.
2. O orçamento antigo permite 29 pontos de talento no nível 60, mas três nós de cinco ranks só absorvem 15; a nova árvore precisa substituir esse desequilíbrio, não apenas adicionar texto ao menu.
3. Os modificadores atuais são opções genéricas, e alguns talentos têm efeito apenas no primeiro rank ou efeito pouco diferenciado; cada novo rank deve corresponder ao que a descrição promete.
4. O sorteio atual permite afixos iguais no mesmo item; raridade, qualidade de rolagem, conjunto, efeito autoral e nível ainda não têm orçamentos suficientemente separados para uma campanha longa.
5. Os quatro inimigos atuais não sustentam a variedade tática prometida. As 12 elites precisam ser declaradas como variantes, e os novos chefes precisam de mecânicas, não somente mais HP.
6. Bestiário, códice de itens, máquinas de missão de múltiplos atos, novas árvores e migração para esse modelo não existem como sistemas completos na base auditada.
7. Os relatórios atuais comprovam fluxos técnicos e toque simulado, com variação de desempenho sob CPU reduzida; não comprovam duração, diversão, memória em 24 h nem funcionamento em aparelho físico.
