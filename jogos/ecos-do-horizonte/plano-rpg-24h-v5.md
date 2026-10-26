# Ecos do Horizonte v5 — plano completo para uma jornada de 24 horas

**Data:** 26/10/2026. **Base:** versão 4.1.0. **Estado:** projeto e critérios de produção; os novos sistemas deste documento ainda não estão implementados. A versão 4.1 continua sendo a versão jogável publicada.

O objetivo é transformar o capítulo atual numa aventura de descoberta, escolhas de construção e reencontros. A complexidade deve aparecer nas decisões que o jogador toma: como lutar, quais atributos combinar, qual ameaça enfrentar primeiro e qual história investigar. O celular continua com quatro botões de habilidades e controles acessíveis.

**Contrato de duração:** 24 horas de primeira jornada em dificuldade Aventura, começando no nível 1: aproximadamente 16 horas de história principal, 5 de secundárias e caçadas, 3 de exploração. Pausa, inventário, AFK, carregamento, repetição obrigatória e busca de códice 100% não preenchem essa meta. A rota só de história terá outra duração, estimada inicialmente em 14–18 horas. A meta de 24 horas depende de observação humana; não é um resultado já medido.

## 1. Diagnóstico da versão atual

| Área | Evidência no código da v4.1 | Consequência | Prioridade |
|---|---|---|---|
| Pontos | `floor((nível-1)/2)` gera 29 pontos; três talentos com cinco ranks absorvem apenas 15 | Quatorze pontos não têm destino no nível 60 | P0 de sistemas |
| Talentos | Sangria do Errante não tem uma aplicação correspondente clara; Ressonância do Tecelão usa uma condição de primeiro rank | A descrição e o investimento podem prometer mais do que o efeito entrega | P0 de sistemas |
| Itens | Cinco tipos de afixo sorteados com reposição; raridade afeta principalmente a quantidade de afixos | Peças repetidas, decisões pobres e risco de combinações sem orçamento | P1 |
| Progressão | Recompensas frequentes, cura completa ao subir de nível e escalada de encontros pelo nível atual | Curva curta e recursos difíceis de equilibrar em campanha longa | P1 |
| Monstros | Três espécies comuns e um chefe compartilham uma estrutura de perseguição/ataque | Poucas prioridades e respostas táticas | P1 |
| Campanha | Um capítulo, cinco marcos principais e duas atividades opcionais | Repetir expedições não equivale a produzir 24 horas autorais | P1 |
| Coleções | Não há bestiário nem códice de itens persistente | Descobrir não gera conhecimento consultável | P1 |
| Arte | Há unidade de pixel art, quatro heróis, 36 imagens de equipamento e efeitos de classe | A base visual é reaproveitável; faltam novas silhuetas e efeitos específicos | P1 |
| Validação | Há testes funcionais e toque simulado; não há jornadas humanas de 24 horas nem aparelhos físicos validados | Não se deve anunciar duração ou fluidez universal como comprovadas | P1 |

Arquivos auditados: `core.js`, `combat.js`, `world.js`, `loot.js`, `ui.js`, `notifications.js` e relatórios em `rebuild/v41/qa`. São observações da implementação, não críticas baseadas apenas na aparência.

## 2. Escopo fechado da campanha

| Conteúdo | Quantidade | Regra de contagem |
|---|---:|---|
| Atos e regiões | 6 | Cada um com identidade, conflito, mecânica e consequência |
| Subzonas externas | 18 | Três áreas autorais por região; carregamento por área |
| Masmorras | 12 | Uma principal e uma opcional por região |
| Missões principais | 24 | Quatro por ato, com objetivos de múltiplas etapas |
| Secundárias | 18 | Três por ato, ligadas a pessoas e mudanças no mundo |
| Caçadas narrativas | 6 | Uma por ato; investigação e contrajogo, não contratos infinitos renomeados |
| Espécies comuns | 24 | Comportamento e silhueta próprios |
| Variantes de elite | 12 | Modificam espécies existentes; não contam como novas espécies |
| Minichefes | 6 | Um por masmorra opcional |
| Chefes de ato | 6 | Arenas e mudanças de fase próprias |
| Fichas de bestiário | 48 | 24 + 12 + 6 + 6, com categoria explícita |
| Bases de equipamento | 48 | Seis famílias de armas × quatro bases; seis slots de armadura × quatro bases |
| Lendários autorais | 24 | IDs próprios, assinaturas e fontes próprias |
| Relíquias | 6 | IDs próprios, recebidas na história e com função contextual |
| Entradas principais do códice de itens | 78 | 48 bases + 24 lendários + 6 relíquias |
| Conjuntos | 8 | Metadados e subfichas; não inflam as 78 entradas |
| Técnicas ativas | 24 | Seis por herói; quatro equipadas |
| Formas de técnica | 72 opções | Três opções por técnica; apenas uma forma escolhida por técnica |

Esses números são entregáveis do escopo, não uma prova de diversão. Um recolor de lobo não vira uma espécie nova. Uma nova rolagem do mesmo item não vira uma entrada nova. Eventos repetíveis depois do final ficam fora da contagem de missões autorais.

## 3. Estrutura das 24 horas e identidade dos atos

| Ato | Região | Horas de referência | Nível na rota completa | Questão central e nova mecânica |
|---|---|---|---|---|
| I | Refúgio e Bosque dos Sinos | 0–4 | 1–12 | Quem estamos esquecendo? Nimbo revela passagens e rastros |
| II | Costa das Marés | 4–8 | 12–22 | O que o mar devolve? Alternância de maré e faróis que mudam rotas |
| III | Jardins de Vidro | 8–12 | 22–32 | Uma lembrança pode mentir? Reflexos, pistas e identidade de alvos |
| IV | Arquivo das Vozes | 12–16 | 32–42 | Quem escolheu o que apagar? Camadas de testemunhos e mecanismos sonoros |
| V | Forja de Âmbar | 16–20 | 42–52 | O que pode ser reconstruído? Calor, válvulas e reparo do sino |
| VI | Eclipse do Horizonte | 20–24 | 52–60 | Quem tem o direito de decidir? Combinação das memórias e confronto com Veyr |

Orçamento editorial de cada ato: **160 minutos de principal + 50 de secundárias/caçada + 30 de exploração = 240 minutos**. A distribuição interna pode mudar após testes; a soma da campanha deve continuar identificável. Ato I precisa apresentar seu ciclo principal em 15–20 minutos, mesmo que toda a região ofereça quatro horas de conteúdo.

Cada missão principal combina três a cinco etapas reais: descoberta, encontro, diálogo, travessia, investigação, enigma ou confronto. Não se alonga uma missão com caminhadas sem acontecimento ou vinte repetições do mesmo grupo. A masmorra principal terá uma rota inicial de 35–60 minutos; a opcional, 20–35. Esses tempos fazem parte do orçamento das missões e não são somados novamente.

Marcos de ritmo a verificar: primeiro item útil em 5–10 minutos; primeiro ponto em até 15; primeira decisão entre duas melhorias em até 30; primeiro raro garantido em 45–60; primeiro épico no primeiro ato; primeiro lendário autoral até a primeira metade do ato II. Cada intervalo de 20–30 minutos deve oferecer uma novidade de comportamento, descoberta, construção ou história.

### História que amarra os sistemas

Mira e Lio continuam sendo o vínculo inicial. Nimbo aprende o significado de casa antes de descobrir a própria origem. Iara reconhece na costa uma canção da vila; Taren encontra lacunas na história da forja; os testemunhos do Arquivo revelam que Veyr preservou lugares sacrificando as lembranças de outros. Reconstruir o sino oferece uma alternativa, mas exige decidir quem participa dela.

O final admite soluções narrativas diferentes para a rede de memórias, com orçamento de recompensa equivalente. A escolha altera pessoas, serviços, caminhos e epílogo; não esconde um final obrigatório que concede o único equipamento capaz de vencer o pós-jogo.

## 4. Pontos de habilidade e construções

### 4.1 Duas reservas, dois propósitos

**Técnica:** modifica as habilidades usadas. São 24 pontos por herói ao longo da jornada, recebidos nos níveis `2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 45, 50, 55, 60`.

Cada herói tem seis ativas com três ranks. O primeiro rank da técnica inicial é gratuito. Cada ativa oferece três formas mutuamente exclusivas; a forma escolhida possui dois ranks: ativação e domínio. Assim, os ranks básicos pagos comportam 17 pontos; as seis formas escolhidas comportam 12; capacidade efetivamente investível **29**, para orçamento **24**. Não é possível comprar tudo.

As quatro técnicas atuais mantêm seus desbloqueios nos níveis **1/2/4/6**. As duas novas aparecem nos níveis **16/28**. Desbloquear significa poder investir: a suprema do nível 6 custa um ponto, não é uma concessão gratuita adicional. O jogador pode reservar seu terceiro ponto ou redistribuir gratuitamente na Âncora. Ranks básicos 2 e 3 exigem, inicialmente, níveis 8 e 24; formas exigem 12 e seu domínio, 36. Um ponto pode ser guardado, com o próximo requisito explicado. Guardar por escolha ou requisito futuro não é o mesmo que gerar pontos sem destino no fim do jogo.

**Talento:** define a construção. São **30 pontos**, um em cada nível par de 2 a 60. Cada classe tem três ramos; cada ramo contém quatro nós de três ranks e um talento final de dois ranks. São 42 ranks teóricos, ou **38 efetivamente investíveis**, porque apenas um talento final pode receber pontos. O orçamento máximo continua sendo 30.

Talento final: exige **nível 40 e dez pontos no próprio ramo**. Seu primeiro rank custa um ponto e o segundo custa mais um. Nenhum nó pago exige que todos os 30 pontos já tenham sido gastos. Uma distribuição válida no nível 60 é 14 pontos no ramo principal, 12 no secundário e 4 no terceiro.

| Nível | Pontos de técnica recebidos | Pontos de talento recebidos |
|---:|---:|---:|
| 1 | 0, além da inicial gratuita | 0 |
| 10 | 5 | 5 |
| 20 | 10 | 10 |
| 30 | 15 | 15 |
| 40 | 20 | 20 |
| 50 | 22 | 25 |
| 60 | 24 | 30 |

Os quatro heróis recebem orçamentos equivalentes, mas distribuem seus próprios pontos. Gastar no Guardião não reduz os pontos do Errante. Apenas o herói ativo produz atributos e efeitos; bônus de heróis inativos não se acumulam.

### 4.2 Classes e opções ativas

| Herói | Ativas preservadas | Novas opções | Três ramos de talento |
|---|---|---|---|
| Guardião | Corte de Âncora; Pele de Pedra; Avanço; Julgamento | Corrente do Guardião; Fenda de Terra | Bastião; Quebra-ferro; Arauto |
| Errante | Três Horizontes; Armadilha do Vigia; Passo do Vento; Horizonte Partido | Flecha de Retorno; Isca de Folhas | Caçador; Duelista; Vigia |
| Tecelão | Lança de Brasa; Manto das Marés; Dobra do Véu; Constelação | Orbe de Geada; Selo de Convergência | Elementalista; Cronista; Marés |
| Pactário | Marca do Crepúsculo; Pacto Vital; Eco Vinculado; Cortejo dos Ecos | Sutura da Alma; Colheita Silenciosa | Invocador; Ceifador; Guardador |

A HUD mantém **três técnicas normais escolhidas entre cinco e uma suprema**. O quarto botão conserva sua função e posição. A troca de técnicas, formas, especialização e talentos ocorre na Âncora, fora do combate. A especialização do nível 20 é uma escolha gratuita de foco de classe, com passiva declarada no orçamento de poder; não concede pontos extras nem fecha os nós básicos dos outros ramos.

Três construções de referência por classe: Guardião de aparo, ruptura e proteção; Errante de precisão, lâminas móveis e armadilhas; Tecelão de choque térmico, controle temporal e marés; Pactário de invocações, marcas e sustentação. São **12 construções de referência**, além de híbridos. Cada uma precisa mudar a rotação e ter uma desvantagem identificável.

Exemplo, Lança de Brasa: forma Cometa concentra impacto e reduz área; forma Cinzas prolonga queimadura e reduz explosão; forma Fornalha consome gelo para choque térmico, com recarga maior. O segundo rank aprofunda a função escolhida, em vez de apenas repetir a descrição. A interface mostra custo, alcance, recarga e a mudança exata do próximo rank.

### 4.3 Redistribuição e qualidade do grafo

Redistribuição gratuita nas Âncoras. Preview dos efeitos antes de confirmar. Remover um pré-requisito reembolsa, numa única operação, os nós que dependem dele; não deixa pontos escondidos em nós inativos. Ao trocar de ramo, o jogador vê o que será desativado. Opção de desfazer a última distribuição enquanto a tela estiver aberta.

Cada rank tem teste de efeito real; ranks 2/3 não podem ser cópias sem benefício. O catálogo define IDs, custos, requisitos, exclusividades, fórmulas e textos. Um validador verifica ciclos, nós inalcançáveis, saldo negativo, concessão duplicada, custo de cada construção de referência e limite de um talento final.

## 5. Itens com identidade e raridades distintas

### 5.1 Estrutura de uma peça

Toda peça registra: `instanceId`, `baseId`, slot/família, nível do item, raridade, propriedade implícita da base, afixos normalizados, grupo de afixos, conjunto opcional, assinatura opcional, melhoria, semente da geração, origem e chave de arte. O texto usa os mesmos valores do cálculo de combate.

As 48 bases têm uma propriedade implícita que cria escolha. Exemplos: espada de guarda favorece postura; espada de duelo favorece resposta após esquiva; arco recurvo favorece alcance; arco de vigília favorece tiro marcado. A base não muda apenas o nome ou acrescenta uma estatística sempre superior.

Sete slots de herói continuam: arma, elmo, peitoral, luvas, grevas, botas e manto. As seis famílias de arma continuam válidas para todas as classes. Reserva não produz atributos enquanto não estiver ativa. Mochila proposta: 60 vagas; baú de Âncora: 180; materiais, conhecimento do códice e objetos narrativos não consomem vagas de equipamento.

### 5.2 Contrato das seis raridades

| Raridade | Identificação | Afixos aleatórios | Orçamento de afixos no nível 60 | Função |
|---|---|---:|---:|---|
| Comum | Cinza, uma marca | 0 | 0 | Base simples, início e material de fabricação |
| Incomum | Verde, duas marcas | 1 | 10 | Primeira direção de atributo |
| Raro | Azul, três marcas | 2 | 20 | Construção eficiente e acessível |
| Épico | Violeta, quatro marcas | 3 | 30 | Atributos fortes e combinações de conjunto |
| Lendário | Âmbar, cinco marcas | 2 + assinatura | 20, mais orçamento próprio da assinatura | Comportamento autoral, com troca de atributos |
| Relíquia | Marfim/coral, selo próprio | 2 fixados + assinatura | 20, mais assinatura contextual | Memória da história, fonte garantida e uso opcional na construção |

Raridade, nível, qualidade da rolagem, conjunto e assinatura são eixos separados. **Conjunto não é uma sétima raridade.** Um épico adequado pode superar um lendário fora da construção. Relíquia é uma categoria narrativa especial, não uma promessa de dano maior que qualquer lendário.

No máximo **três equipamentos com assinatura** podem ficar equipados simultaneamente. A troca é validada sobre o equipamento resultante, permitindo substituir uma assinatura por outra quando já houver três. Mochila, baú e arma em reserva não contam. Não há quarta assinatura silenciosamente inativa.

### 5.3 Orçamento e limites de afixos

Escala inicial do orçamento por nível: `escala(L) = 0,25 + 0,75 × (L−1)/59`. O orçamento da raridade é multiplicado por essa escala. O gerador distribui o orçamento; não sorteia todos os afixos com valor máximo. Grupos exclusivos impedem duplicatas e combinações inválidas.

Exemplo de preços para calibrar: 1% de dano adicional custa 2 unidades; 1% de vida, 1; 1% de crítico, 3; 1% de redução de recarga, 4; 0,1% de drenagem, 2. Um épico de nível 60 poderia usar 12 unidades em 6% de dano, 9 em 9% de vida e 9 em 3% de crítico. Isso é uma especificação inicial para simular, não uma tabela já aprovada por jogadores.

Limites globais iniciais da construção: crítico 35%; redução de recarga 30%; velocidade de ataque 25%; drenagem 3%; resistência elemental 50%; proteção de armadura 55%; mitigação combinada fora de aparo/esquiva 75%. Atributos da mesma categoria se somam antes do limite. A interface informa o que está excedendo um teto.

Não haverá listas de dezenas de condições mínimas como requisito para entender uma melhoria. A inspiração de produção é concentrar a decisão na combinação e na fabricação, reduzindo o descarte repetitivo; a revisão oficial de itemização de [Diablo IV: Loot Reborn](https://news.blizzard.com/en-gb/article/24077223/galvanize-your-legend-in-season-4-loot-reborn) descreve essa separação entre leitura da queda e customização. Nossos números e sistemas abaixo são próprios.

### 5.4 Assinaturas, fabricação e conjuntos

Assinaturas não se disparam recursivamente. Um efeito marcado como `proc` não gera outro `proc`, salvo interação expressamente especificada. Cada efeito declara gatilho, alvos, duração, intervalo interno, teto de acumulação, custo e regra de invocação. O ganho de uma assinatura ofensiva isolada deve ficar inicialmente na faixa de até 10–15% do DPS sustentado da construção de referência; a combinação das três não deve ultrapassar 25% apenas por multiplicação de gatilhos. Efeitos de controle/defesa têm orçamento equivalente e testes próprios.

Fabricação utiliza ouro, fragmentos e receitas conhecidas; componentes narrativos são flags, não dezenas de moedas. Melhoria até +5 tem custo e resultado previsíveis. Reforjar eleva o nível de uma peça até o teto do capítulo, preservando identidade, assinatura e qualidade percentual dos afixos. Ajustar um afixo exige escolher qual propriedade substituir, mostra os possíveis resultados e nunca destrói a peça.

Oito conjuntos: Forja Peregrina; Vigia das Raízes; Coro das Marés; Vidro do Eclipse; Guardiões do Farol; Caminho de Cinzas; Vozes de Âmbar; Jardim Esquecido. Todos possuem bônus de duas e quatro peças e podem ser completados com peças **raras/épicas sem assinatura**. Portanto, o bônus de quatro peças não exige violar o limite de três assinaturas. Uma peça não recebe dois IDs de conjunto nem conta duas vezes.

O baú mostra favoritos, peças ligadas a qualquer herói e montagens salvas. Reciclagem em lote exige seleção explícita e preserva favoritos, relíquias protegidas, reservas e equipamento de todos os heróis. Mochila cheia mantém a queda recuperável; não substitui silenciosamente uma peça.

## 6. Quedas, fontes dirigidas e economia

### 6.1 Chance de queda e qualidade são sorteios separados

Ponto inicial: monstro comum tem 5% de chance de equipamento; elite, 35%; primeiro minichefe/chefe e baú autoral garantem uma peça. Os demais recursos podem ser agrupados e recolhidos por proximidade para reduzir ruído. A meta observada é **10–16 peças por hora**, com ajustes nos pesos e nas fontes após medir quantos encontros a rota realmente contém.

Quando uma peça aleatória cai, usar a tabela regional abaixo. Os valores de cada linha somam 100%. Relíquias ficam fora do sorteio: suas seis fontes são missões de história.

| Ato | Comum | Incomum | Raro | Épico | Lendário |
|---|---:|---:|---:|---:|---:|
| I | 45% | 35% | 18% | 2% | 0% |
| II | 30% | 36% | 27% | 6% | 1% |
| III | 18% | 28% | 40% | 12% | 2% |
| IV | 10% | 18% | 49% | 20% | 3% |
| V | 4% | 12% | 49% | 31% | 4% |
| VI | 0% | 8% | 48% | 39% | 5% |

Proteções iniciais: após 25 mortes comuns elegíveis sem equipamento, a próxima garante uma peça e zera o contador; após seis recompensas elegíveis de masmorra sem épico, a sétima garante épico ou melhor. Contadores são persistentes e separados por regra, não reiniciam ao recarregar. As frequências finais devem ser medidas incluindo essas proteções, e não anunciadas como iguais ao peso básico da tabela.

Lendários de construção têm fonte dirigida. Após cinco conclusões válidas de uma caçada/chefe indicado, uma receita permite escolher uma assinatura daquele grupo. O alvo inicial para obter uma peça dirigida no pós-jogo é 40–60 minutos. Isso serve à experimentação; a missão principal não exige farm de lendário. O primeiro lendário da campanha tem entrega autoral até cerca da sexta hora.

Rolagens são geradas uma vez com semente persistida. Baú, entrega e chefe têm IDs de recompensa idempotentes; morrer, trocar de herói ou recarregar não permite rerrolar a mesma recompensa infinitamente.

### 6.2 Economia de referência

| Faixa | Ouro por hora de rota | Fragmentos por hora | Intenção |
|---|---:|---:|---|
| Ato I | 400–650 | 20–35 | Experimentar uma melhoria e guardar peças úteis |
| Atos III–IV | 1.000–1.400 | 35–55 | Sustentar ajustes de construção e reforja |
| Ato VI | 2.000–2.800 | 55–80 | Melhorias avançadas opcionais e fontes dirigidas |

Exemplo de custo total de +0 a +5 em uma peça: nível 10, 500 ouro/23 fragmentos; nível 30, 2.000/69; nível 60, 5.000/138. O +5 não é requisito para terminar a história. A rota principal precisa pagar o equipamento esperado sem executar contratos repetidos. Valores são hipóteses iniciais de calibração.

Venda e reciclagem não podem gerar arbitragem positiva ao comprar, fabricar e revender a mesma peça. Redistribuição de habilidades não custa ouro. Não haverá perda de XP por morte nem destruição de equipamento; a penalidade será a repetição controlada do trecho e o reposicionamento no checkpoint.

## 7. Curva de experiência e balanceamento de combate

### 7.1 Curva inicial reproduzível

Nível máximo de combate: 60. Fórmula inicial de XP para o próximo nível: `round(80 + 22L + 3L^1,65)`, para L de 1 a 59. A soma calculada é **100.721 XP**. Esta curva é um ponto de partida; não foi aplicada à v4.1 nem validada como duração real.

| Ato, rota completa | Intervalo | XP do intervalo | Orçamento médio por hora |
|---|---|---:|---:|
| I | 1 → 12 | 3.064 | 766 |
| II | 12 → 22 | 7.542 | 1.886 |
| III | 22 → 32 | 13.363 | 3.341 |
| IV | 32 → 42 | 20.216 | 5.054 |
| V | 42 → 52 | 27.985 | 6.996 |
| VI | 52 → 60 | 28.551 | 7.138 |

Distribuir aproximadamente 60% desse orçamento em missões/marcos, 25% em encontros e 15% em descoberta/primeira conclusão. Valores de cada monstro e missão são derivados do orçamento regional e da contagem de eventos elegíveis, em vez de multiplicadores soltos. A rota exclusivamente principal deve chegar aproximadamente ao nível 52 e poder vencer o final sem completar as secundárias; a rota completa chega ao 60.

Regiões têm faixas de nível próprias. Voltar a uma área inicial deve mostrar o ganho de poder. Escalada integral pelo nível do jogador fica restrita às expedições e a uma opção declarada de sincronização, não ao mundo inteiro. Repetir um encontro já recompensado dá menos XP do que descobrir outro; invocações, treino e inimigos gerados infinitamente por uma mecânica de chefe não são fontes independentes de XP.

Subir de nível não restaura toda a vida durante a luta. Aumento de vida máxima acrescenta apenas o aumento correspondente à vida atual; energia mantém sua proporção. Cura é uma decisão de recurso, preservando as Âncoras e os frascos como parte do ciclo.

### 7.2 Orçamento de poder e tempos de combate

Modelo inicial: dano-base `18 + 2,2(L−1)`; contribuição básica de arma `6 + 0,9(L−1)`; multiplicador de base por raridade de 1,00 a no máximo 1,08; melhoria de arma até +15% dessa contribuição, não +15% de todo o personagem. Vida-base `120 + 18(L−1)`. São coeficientes candidatos para o simulador; não basta mudar a fórmula e declarar equilíbrio.

O DPS de referência considera arma, combo, crítico, tempo realmente atacando, custo de recursos, habilidades, controle e limites de afixos. Não é o número de uma pancada no boneco. Usar três construções por classe, três qualidades de equipamento e níveis 1/10/20/30/40/50/60: **252 casos-base**, antes das variações de inimigo. Cada construção é reduzida ao orçamento e aos desbloqueios daquele nível; no nível 1 algumas coincidem, o que não conta como comprovação de diversidade desde o início.

| Encontro | Meta inicial de tempo para vencer | Contrajogo |
|---|---|---|
| Comum isolado | 3–6 s; criatura frágil pode cair antes | Reconhecer papel e escolher ataque |
| Guarda/bruto | 7–11 s | Flanquear, romper postura ou interromper |
| Grupo misto | 20–45 s | Priorizar suporte/atirador e usar terreno |
| Elite | 14–24 s | Explorar janela e modificador anunciado |
| Minichefe | 45–90 s | Duas mecânicas e oportunidade de recuperação |
| Chefe de ato | 90–150 s | Mudança de fase, arena e pelo menos duas respostas táticas |

HP do inimigo deriva inicialmente de `DPS_ref × tempo vulnerável previsto`, com ajustes por postura e papel. Não aumentar somente a vida para fabricar duração. Ataque comum deveria exigir aproximadamente seis impactos não evitados para derrubar a construção de referência; golpe pesado anunciado, três; projétil leve, nove. Os valores são derivados da vida e proteção **de referência**, não recalculados contra a vida real do jogador a cada acerto.

Uma construção de campanha deve conseguir progredir com raros e melhorias moderadas. Diferença inicial aceitável de DPS sustentado entre as 12 construções: até 20%, considerando também sobrevivência, mobilidade e controle. Se uma escolha ganha em dano, segurança, alcance e custo ao mesmo tempo, ela precisa ser redesenhada, não apenas receber um tooltip maior.

### 7.3 Controle e dificuldade

Quebra de postura tem recuperação e resistência temporária. Chefes têm limite de atordoamento, com alvo inicial abaixo de 25% do tempo vulnerável; não entram em stun infinito. Lentidão, marca, queimadura e sangramento têm regras de acumulação declaradas. Projéteis refletem/encadeiam um número finito de vezes; invocações do jogador ficam limitadas a três.

História, Aventura e Desafio mudam exigência e dano, sem bloquear missões ou reservar lendários essenciais à dificuldade alta. Aventura é a referência de 24 horas. O jogador pode mudar a dificuldade fora de combate, sem penalizar sua coleção.

### 7.4 Depois das 24 horas

Dez ameaças e três rotas de expedição continuam, agora com encontros e modificadores controlados. Não são contabilizadas para preencher a campanha. O Legado continua numericamente, com os primeiros 20 investimentos dando poder limitado; depois disso, títulos, cosméticos, moedas e registro de jornada. Expedições devem recompensar domínio e fontes dirigidas, preservando o limite de poder e evitando números infinitos que quebrem as fórmulas.

## 8. Arte e funcionamento das habilidades no celular

Preservar a pixel art atual: contorno coerente, materiais legíveis, âmbar para proteção, verde para mobilidade/natureza, azul para água/gelo e violeta para vínculos/memórias. Elemento precisa também de forma, ritmo e som; cor sozinha não basta.

Toda técnica terá quatro entregáveis visuais: ícone próprio, antecipação/gesto, trajetória/área e impacto/resíduo. O tamanho do efeito deve corresponder à área que realmente causa dano. A hierarquia prioriza ataque perigoso, controle, suprema e por último efeitos cosméticos, em linha com os princípios de [clareza de jogo da Riot](https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/). Usaremos arte original e comportamento próprio.

| Classe | Assinatura visual | O que precisa ser distinguível |
|---|---|---|
| Guardião | Arcos pesados, placas de luz e marcas de ruptura | Aparo perfeito, golpe pesado, guarda e janela de postura |
| Errante | Trilhas finas, folhas, cabo de armadilha e chuva direcional | Tiro simples, alvo marcado, armadilha armada e disparo final |
| Tecelão | Geada angular, brasa pulsante e raios em segmentos | Gelo aplicado, choque térmico, teleporte e perigo residual |
| Pactário | Fios, selos e silhuetas de ecos | Marca, vínculo de drenagem, aliado e explosão que consome marcas |

Toque rápido usa mira assistida em alvo visível com caminho livre. Segurar e arrastar permite direcionar habilidades compatíveis; arrastar para a área de cancelamento cancela sem gastar recurso. Movimento e habilidade continuam funcionando com dois dedos. Não aumentar o número de botões da HUD.

Produção: 24 ícones básicos e 72 emblemas de forma, com identidade de classe e descrição acessível. As 72 formas não significam 72 efeitos gigantes independentes: reutilizam a linguagem e os componentes do efeito-base, mas precisam mostrar seu comportamento diferente. Registrar arte, duração, geometria e escala junto à definição da habilidade.

Orçamento inicial de efeitos: até 32 emissores relevantes/180 partículas no modo padrão e 16/60 no leve. Avisos de dano não podem desaparecer para cumprir esse limite; partículas decorativas cedem primeiro. Vibração e tremor são opcionais. Nomes de habilidades não ocupam o centro durante a luta. Os avisos compactos da v4.1 continuam.

## 9. Monstros com funções e decisões táticas

### 9.1 Catálogo proposto

| Região | Quatro espécies comuns e função principal | Duas variantes de elite | Minichefe | Chefe de ato |
|---|---|---|---|---|
| Refúgio/Bosque | Cão das Raízes: flanqueia; Sentinela de Musgo: guarda frontal; Eco sem Rosto: canaliza projéteis; Mariposa-lume: sustenta aliados | Matriarca das Raízes; Sentinela dos Espinhos | Tecelã dos Cipós | Sineiro Sem Nome |
| Costa | Caranguejo-torre: bloqueia passagem; Afogado de Sal: estocada atrasada; Sirênide do Sussurro: fortalece o grupo; Náutilo Vivo: projétil que ricocheteia | Guardião da Pérola; Afogado da Maré Negra | Contramestre Sem Rosto | Faroleira Cega |
| Jardins | Cervo de Prisma: investida reposicionada; Marionete de Vidro: cria engodo; Aranha de Vitral: restringe terreno; Escriba sem Tinta: desenha ataques | Prisma Caçador; Escriba Mudo | Cartógrafo Partido | Dama dos Mil Reflexos |
| Arquivo | Monge Oco: protege aliado; Carrilhão Andante: ataque em ritmo; Sanguessuga Etérea: drena energia em zona; Vigia de Pergaminho: cobre linhas de tiro | Abade da Sombra; Sentença Móvel | Bibliotecário de Cinzas | Coro Desfeito |
| Forja | Besouro de Escória: rolamento frontal; Ninho de Cinzas: cria unidades limitadas; Cavaleiro de Brasa: alterna guarda/calor; Nascente de Ferro: fixa feixe | Forjador Errante; Besouro do Crisol | Taren de Ontem, uma memória | Matriarca do Crisol |
| Eclipse | Ceifador de Ecos: golpe atrasado; Mariposa do Vazio: interrompível suporte; Cão de Memórias: persegue rastro; Arauto do Horizonte: alterna feixes | Ceifador sem Nome; Arauto Eclipsado | Primeiro Eco | Veyr, Guardião da Máquina |

Cada ficha tem estados de percepção, alerta, escolha, preparação, compromisso, recuperação, reposicionamento, retorno, controle e morte. A direção deve acompanhar corpo, arma e aviso de ataque. Dano não pode ser aplicado antes da antecipação correspondente.

Grupos têm orçamento de ameaça: inicialmente seis inimigos ativos no encontro padrão, até dez em situações especiais controladas. No máximo dois ataques pesados são comprometidos ao mesmo tempo; os demais reposicionam ou usam ações leves. Suporte, atirador e perseguidor usam posições diferentes. Elite não recebe simultaneamente modificadores incompatíveis como perseguição instantânea e área inevitável.

### 9.2 Chefes e respostas do jogador

- **Sineiro:** ondas, cone e interrupção por lanternas; a segunda fase muda o ritmo, não apenas o dano.
- **Faroleira:** feixe rotativo e zonas de sombra; Nimbo reconstitui abrigo, e o jogador escolhe quando se expor.
- **Dama:** reflexos com sinais verificáveis; identificar e interromper a cópia correta abre a janela de ataque.
- **Coro:** três vozes com funções diferentes; silenciar um canal altera os ataques dos outros.
- **Matriarca:** temperatura e válvulas; atravessar a arena exige controlar o calor e aproveitar recuperação.
- **Veyr:** fases ligadas às memórias restauradas; prioridades entre estruturas e guardião, com desfecho narrativo após a vitória.

Todas as classes têm contrajogo. Fraqueza elemental concede vantagem, não imunidade total que invalida uma classe. Invocações inimigas têm limite e não são uma fazenda infinita de XP/saques. Trocar de região ou abandonar a arena encerra corretamente os ataques e estados de combate.

## 10. Bestiário e códice de itens descobertos

### Bestiário

Quarenta e oito fichas, com categoria clara. Estados: desconhecido, encontrado, compreendido. Encontrado exige contato real visível ou interação, não apenas o monstro existir no mapa. Derrotar ou observar dois comportamentos distintos libera mais detalhes; executar um contrajogo pode completar o estudo. Chefes liberam os detalhes das fases após enfrentá-las.

Ficha: arte, silhueta, região conhecida, papel, ataques observados, fragilidades, defesa recomendada, fontes de saque conhecidas e notas de Nimbo. Contadores de derrotas existem para registro, sem exigir centenas para acessar uma dica básica. Entradas desconhecidas não revelam nome de chefe, solução ou coordenada secreta.

### Códice de equipamentos

Setenta e oito entradas principais. Descobrir uma base registra a família; obter um lendário registra sua assinatura; relíquias registram história e efeito. Rolagens aleatórias e variantes de conjunto ficam dentro da entrada correspondente. Os oito conjuntos têm páginas agregadoras e mostram peças vistas/obtidas.

Vender ou reciclar uma peça não apaga a descoberta. A ficha mostra arte, slot, efeito, faixa de atributos conhecida, receita e pista da fonte já descoberta. Permite marcar até três peças procuradas, sem despejar alertas no combate. Comparação separa dano, defesa, controle, recurso e sinergia; uma pontuação única não decide automaticamente o que equipar.

Os dois códices compartilham busca e filtros. Uma ficha conhecida deve ser acessível em até três interações a partir do hub. Descobertas concedem história, títulos e cosméticos; não dão bônus de dano necessários para terminar a campanha. A meta de 24 horas não exige completá-los.

## 11. Missões autorais e consequências

### Catálogo de 48 missões

| Ato | Quatro principais | Três secundárias | Caçada |
|---|---|---|---|
| I | O Sino sem Voz; A Ponte que Lembrava; O Moinho do Nome Perdido; O Primeiro Reencontro | As Ervas de Iara; A Carta sem Destinatário; A Gruta das Vozes | Pegadas entre os Sinos |
| II | As Luzes da Margem; A Maré que Não Volta; A Voz no Farol; Quando a Costa Responde | Redes sem Dono; A Carta de Iara; O Barco de Volta | Pérolas no Escuro |
| III | O Jardim sem Estação; Os Rostos do Espelho; O Mapa de Nimbo; A Dama dos Mil Reflexos | O Jardineiro das Últimas Flores; Canção entre Cacos; Um Retrato Inteiro | Rastro de Prisma |
| IV | A Biblioteca Apagada; Os Nomes Debaixo da Pedra; A Verdade de Veyr; O Coro Desfeito | O Livro sem Leitor; A Vigília do Monge; Testemunhas do Vento | A Sentença Errante |
| V | O Fogo que Lembra; O Ferreiro de Ontem; A Sutura do Sino; A Matriarca do Crisol | A Ferramenta de Taren; Trabalhadores de Cinza; Tempero de Casa | O Besouro Real |
| VI | O Caminho entre Ecos; O Preço de uma Vila; O Mundo que Resta; Quem Decide Lembrar | A Casa de Mira; O Último Faroleiro; A Primeira Palavra | Os Arautos do Fim |

Cada missão precisa de ID estável, contexto, pré-requisitos, etapas, condições de conclusão, destino, flags de mundo, recompensa e ramo alternativo. Coleta/extermínio simples pode existir, mas não deve superar um terço das etapas autorais. Escolta usa velocidade compatível e caminhos escolhidos pelo jogador; defesa tem preparação e poucas ondas significativas; investigação admite pistas e conclusão anterior à aceitação.

Consequências mínimas: uma secundária por ato altera permanentemente serviço, NPC, rota ou paisagem. Resgatar Lio devolve uma casa à vila; ajudar o barqueiro abre uma travessia; recuperar o retrato muda uma relação; reunir testemunhos altera o diálogo final; restaurar ferramentas muda a oficina. Escolhas mutuamente exclusivas têm encerramento coerente e recompensas de orçamento equivalente.

### Exemplo de especificação: O Moinho do Nome Perdido

ID `quest.refuge.mill_name`. Pré-requisito: pista da ponte conhecida. Etapas: investigar duas marcas; abrir uma rota de entrada; romper a defesa de um guarda com alternativas para quatro classes; revelar a sequência; acender as runas; falar com Lio. A ordem de investigação pode variar; falar com ele antes da porta não conclui a missão. Completar etapas cedo fica registrado. O retorno muda Mira, Lio e o próximo objetivo.

Recompensa única: XP do orçamento do ato, material de melhoria, peça dirigida que cai no chão e flag narrativa. Mochila cheia não impede a conclusão. Repetir diálogo, recarregar após resolver o puzzle ou voltar à masmorra não duplica a recompensa. Morrer antes de recolher a peça não a remove.

## 12. Direção de arte e tamanho da produção

Criar uma bíblia visual antes de ampliar o catálogo: paleta por região, tamanho lógico de personagens, espessura de contorno, luz, escala de armas e materiais. Usar uma única família de fontes/painéis e ícones. A arte existente é a referência, não uma biblioteca que será misturada com sprites de proporções diferentes.

Produção de equipamentos: 48 bases com três estágios visuais de fabricação (144 desenhos), 24 lendários com arte própria e seis relíquias: **174 desenhos de equipamento**, além de oito emblemas de conjunto e seis tratamentos de raridade. O códice continua com 78 entradas porque estágios visuais não são novos itens-base. Nenhuma promessa de uma ilustração inédita para cada ID aleatório; a identidade combina base, estágio, assinatura e sinais de raridade.

Produção de criaturas: 24 corpos comuns, seis minichefes, seis chefes; as 12 elites usam complementos reconhecíveis e comportamento próprio. Personagens terrestres precisam de direção e poses coerentes; criaturas flutuantes têm linguagem de orientação própria. Uma mudança de cor não substitui um corpo novo na contagem.

Produção regional: seis conjuntos de terreno, vegetação, arquitetura e pontos de memória, mantendo o mesmo acabamento. Arte do bestiário pode reutilizar o corpo da criatura com enquadramento apropriado; não precisa duplicar todos os atlas em resolução enorme. Retratos e personagem jogável devem concordar em roupa, cabelo, arma e direção.

## 13. Interface e formato técnico

O retrato superior continua abrindo o personagem. Organizar o hub em quatro destinos principais: **Personagem, Construção, Coleções e Missões**, com subtelas curtas. Equipamentos e mochila ficam em Personagem; técnicas/talentos em Construção; bestiário/códice em Coleções. Atlas permanece no topo. Não adicionar oito abas estreitas numa linha impossível de usar no celular.

Alvos de toque efetivos de pelo menos 44 × 44 px após a escala, incluindo modo canhoto e tela pequena. Animações de UI não deslocam botões sob o dedo. Uma notificação por vez, lote de recursos agrupado, perigo e personagem visíveis. O modo leve preserva toda informação necessária.

Entrega jogável continua em **um único HTML offline**, com imagens, sons e dados incorporados, sem CDN ou backend obrigatório. Meta inicial de arquivo: até 20 MiB; save exportado de uma jornada normal: até 6 MiB. Esses limites precisam ser medidos antes de produzir todos os atlas.

Separar o código de produção em catálogos e sistemas, mesmo que o build os una no HTML: `combat`, `abilities`, `talents`, `items`, `loot`, `quests`, `world`, `codex`, `save`, `ui`, `render`. Dados têm IDs e versão; não dependem da posição num array.

Só decodificar artes da região e telas necessárias. Cache de atlas com descarte; paginação de coleções; inimigos distantes adormecidos; terrenos em blocos; simulação fixa em 30 Hz. Meta inicial de cache gráfico decodificado: 96 MiB; memória total precisa ser medida em aparelhos, pois não equivale ao tamanho do HTML.

Persistência preferencial em IndexedDB quando disponível, com transações e duas gerações de backup; fallback compatível para os contextos de arquivo suportados. Os limites e a remoção de dados variam por navegador, como documenta a [MDN sobre armazenamento e quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria). Exportação/importação JSON permanece necessária para mudar de arquivo, navegador ou aparelho. Salvar IDs e estados, não cópias das artes ou do catálogo completo.

O transporte de um arquivo único não garante armazenamento permanente em qualquer visualizador Android. Validar o HTML baixado e o caminho de abertura real no aparelho. Testar a versão hospedada e preservar o acesso atual do Site.

## 14. Migração da v4.1

Criar envelope schema 4 e chave nova `ecos-horizonte-save-v5`. Guardar backup exato da v4.1 antes da primeira conversão; não sobrescrever sua chave. A migração precisa ser repetível sem duplicação.

Preservar nível, heróis, equipamento, reservas, moedas, Legado, itens no chão e conclusão do primeiro capítulo. A campanha já concluída aparece no diário como lembrança restaurada; não se exige repetir Mira/Lio para abrir o ato II. Mapear nomes/IDs antigos para bases novas, mantendo propriedades e uma explicação das conversões de atributos. Raridades migram por identidade: índice antigo 0 → Comum, 1 → Raro e 2 → Épico. A inserção de Incomum na nova lista não transforma um Raro antigo em Incomum por reaproveitar o índice.

Recalcular pontos pela nova tabela e mapear os investimentos compatíveis. Técnicas antigas conhecidas continuam conhecidas. Formas antigas de amplitude/potência têm mapeamento documentado para as novas opções; nós removidos são reembolsados. Quando houver excesso herdado, mostrar déficit e amortizar com pontos futuros ou redistribuição, sem retirar equipamento ou nível.

Identidade de saldo: `disponíveis=max(0,recebidos−investidos)`; `déficit=max(0,investidos−recebidos)`; portanto `recebidos+déficit=investidos+disponíveis`. Um herói com cinco recebidos e sete investidos tem zero disponível e dois de déficit. Um respec completo volta ao orçamento efetivamente recebido, não converte o déficit em pontos grátis.

Apresentar resumo antes de usar o perfil convertido, com cópia de segurança e acesso ao respec gratuito. Uma importação inválida deixa a jornada atual intacta. Os testes de duração usam uma partida nova; um herói importado de nível alto pode terminar mais rápido. Não retirar o progresso antigo para fabricar 24 horas de duração.

## 15. Entregas e ordem de implementação

| Marco | Trabalho | Evidência para avançar | Arquivo de conferência previsto |
|---|---|---|---|
| M0 — Contrato e modelos | IDs, fontes de XP/loot, grafo de pontos, save novo, orçamento de arte | Validador de dados e plano auditado; nenhuma perda de v4.1 | Documento/plano atual |
| M1 — Construção | Pontos, respec, afixos, raridades, quatro heróis e comparação | Testes de orçamento/efeitos/migração e montagens acessíveis | `v5-previa-01.html` |
| M2 — Combate representativo | Arte de habilidades, IA de papéis, bestiário básico e novo ciclo de encontros | Sessão de 45–60 min com combate, loot, decisão e retorno à vila | `v5-previa-02.html` |
| M3 — Um ato completo | Mapa, quatro principais, três secundárias, caçada e duas masmorras | Onboarding e medição humana de um ato, sem bloqueios | `v5-previa-03.html` |
| M4 — Atos II–III | Costa, Jardins, fontes dirigidas e novas formas | Auditoria de economia e identidade tática; cerca de 12 h de orçamento de conteúdo | `v5-previa-04.html` |
| M5 — Atos IV–VI | Arquivo, Forja, Eclipse, epílogo e restante dos catálogos | Todos os caminhos de missão e quatro classes chegam ao final | `v5-previa-05.html` |
| M6 — Campanha candidata | Balanceamento global, códices, desempenho, migração e offline | Relatórios reproduzíveis e aparelhos-alvo | `v5-candidata.html` |
| M7 — Validação de duração | Jornadas humanas, correções de ritmo e regressão final | Dados humanos suficientes e zero bloqueios de campanha | `v5.html`, somente então final |

Os nomes são planejamento de entregas, não arquivos de jogo já disponíveis. Cada prévia será um HTML independente, com versão clara e download direto; a 4.1 continua acessível. Não definir um prazo artificial antes de medir a fatia jogável, a produção de arte e a revisão das missões.

### Divisão de responsabilidade

O agente principal fica com arquitetura, construção do jogo, equilíbrio, integração de arte e publicação. Um agente separado foi delegado exclusivamente ao checklist e à revisão dos critérios. O checklist registra pendente/aprovado/reprovado, método, dependências e evidências; não implementa ou publica uma versão paralela do jogo.

## 16. Verificação e critérios de liberação

O [checklist delegado](checklist-rpg-24h-v5.md) contém os critérios detalhados. Eles continuam pendentes até a v5 correspondente existir e ser testada.

Automação: validar catálogos, grafos, reembolso, saldo e migração; simular pelo menos cem mil gerações por tabela de loot; executar as 252 construções-base contra papéis relevantes; verificar limites de controle e gatilhos; percorrer estados das 48 missões; testar oito conjuntos, 78 entradas de item e 48 de bestiário; forçar morte, troca de cena, falta de espaço, suspensão e importação inválida.

Toque e visual: seis tamanhos de tela, perfis normal/maior/canhoto, caminhada com habilidades e coleta simultâneas, troca de orientação, menus extensos e mira cancelada. Matriz mínima de dispositivo: um Android intermediário e um iPhone suportado; expandir conforme o público. No modo leve, objetivo inicial próximo de 30 FPS, p95 de quadro até 50 ms no encontro de referência, toque respondendo em até 100 ms e ausência de pausas recorrentes acima de 250 ms. Abertura e troca de região têm medição separada.

Jogadores: doze sessões de onboarding de 30 minutos; pelo menos seis jornadas completas, cobrindo quatro classes e pessoas com pouca experiência no gênero. Seis jornadas de 24 horas significam aproximadamente **144 horas de exposição humana**, além das sessões curtas. Bots e avanço de relógio ajudam na regressão, não substituem isso.

Medir a mediana alvo de **22–26 horas** na rota de referência, registrando separadamente menus, AFK, mortes, exploração, tentativas de chefe e repetição. Investigar trechos que provoquem abandono ou sejam descritos como preenchimento. Tempo sozinho não aprova uma missão; precisamos observar decisões compreendidas, novas estratégias e desejo de continuar.

Bloqueiam qualquer continuidade de save: perda/corrupção, duplicação de pontos/saques, controles presos e progresso impossível. Bloqueiam a versão anunciada como campanha final validada: atos ou sistemas prometidos incompletos, classe inviável, efeitos ilegíveis, ausência da validação física necessária ou falta de dados humanos para a duração. Prévia identificada não será chamada de campanha final de 24 horas comprovadas.

## 17. Riscos e respostas de produção

| Risco | Resposta |
|---|---|
| Conteúdo extenso sem diversão | Aprovar o ciclo de 45–60 minutos antes de multiplicar regiões |
| Complexidade que exige planilha para jogar | Aprofundar combinações; simplificar leitura, manter quatro botões e exemplos de construção |
| Lendários obrigatórios ou dominantes | Fontes dirigidas, perda de afixos em troca de assinatura e limites de interação |
| Muitos itens e pouco jogo | Reduzir volume de quedas, preservar valor e comparar sem abrir várias telas |
| Encontros viram sacos de HP | Mudar papéis, terreno, prioridade e fases; medir tempo vulnerável |
| Arte inconsistente ou borrada | Bíblia visual, revisão por atlas e comparação em escala real de celular |
| HTML grande ou memória crescente | Medir a fatia, carregar artes por região e manter caches descartáveis |
| Salvar demais ou perder dados | Transações, backups, exportação e teste de jornada longa com armazenamento limitado |
| Promessa de 24 h sem evidência | Separar orçamento editorial de medição humana e rotular prévias corretamente |

## 18. Referências e decisão final de projeto

Foram consultadas fontes primárias de clareza visual, itemização e armazenamento. Elas fundamentam princípios; não certificam a duração, as fórmulas ou a diversão do nosso jogo. As metas numéricas, catálogos e escolhas deste plano são decisões próprias que precisam ser implementadas e verificadas.

A recomendação é seguir os marcos M0–M7, começando pela correção dos pontos e por uma fatia representativa de combate/loot/IA. O objetivo completo permanece uma jornada de 24 horas com seis regiões, descobertas úteis, construções diferentes e uma história que muda o mundo.

## Apêndice A — catálogo das 48 bases

As quatro bases de uma linha têm orçamento equivalente e implicações diferentes; D não é automaticamente melhor que A. Cada entrada pode existir nos graus comuns de raridade permitidos. Nomes são direção de conteúdo para implementação, não itens que já caem na v4.1.

| Família/slot | Base A | Base B | Base C | Base D |
|---|---|---|---|---|
| Espada | Lâmina da Guarda: aparo | Espada do Duelista: resposta | Espada Peregrina: recurso | Lâmina Cerimonial: marca |
| Adagas | Gêmeas da Caça: alvo isolado | Dentes de Serra: sangramento | Agulhas do Vento: reposicionamento | Lâminas do Alquimista: elemento |
| Lâmina longa | Haste da Vigília: alcance | Lança do Barqueiro: empurrão | Agulha de Prisma: precisão | Haste das Raízes: controle |
| Montante | Ferro do Rompedor: postura | Lâmina do Crisol: golpe carregado | Espada da Sentinela: guarda | Pedra Cantante: impacto em área |
| Arco | Arco Recurvo: alcance | Arco de Freixo: cadência | Arco do Vigia: alvo marcado | Arco de Maré: tiro atravessante |
| Cajado | Cajado da Brasa: fogo | Cajado das Marés: gelo | Condutor de Vidro: choque | Cajado do Véu: vínculos |
| Elmo | Elmo da Guarda: proteção | Capuz do Batedor: crítico | Coroa do Tecelão: energia | Máscara do Guardador: sustentação |
| Peitoral | Cota de Placas: postura | Couro da Trilha: vigor | Túnica de Maré: resistência | Veste de Âmbar: barreira |
| Luvas | Manoplas da Forja: golpe pesado | Luvas do Caçador: precisão | Luvas do Condutor: elemento | Ataduras do Pacto: drenagem |
| Grevas | Grevas do Bastião: estabilidade | Calças do Errante: movimento | Trama do Cronista: recarga | Grevas do Eclipse: marcas |
| Botas | Passos da Vigília: recuperação | Botas do Vento: esquiva | Solas da Maré: terreno | Botas da Cinza: interrupção |
| Manto | Manto da Porta Aberta: defesa | Capa das Folhas: armadilha | Manto do Farol: barreira | Véu das Vozes: invocação |

## Apêndice B — as 24 assinaturas lendárias propostas

Cada linha corresponde a um ID de lendário próprio. Os intervalos abaixo são hipóteses iniciais e entram nos limites de gatilho e poder da seção 5. A fonte citada oferece pista/receita dirigida; não obriga o jogador a usar aquela classe ou peça para vencer.

| ID | Nome e slot/família | Comportamento autoral inicial | Fonte regional |
|---|---|---|---|
| L01 | Último Toque, espada | Final do combo marca até dois alvos; intervalo 6 s; a marca não dispara outra assinatura | Caçada do Bosque |
| L02 | Cajado do Sino Fendido | Interromper canalização emite um pulso curto de postura; intervalo 10 s | Sineiro |
| L03 | Manto da Porta Aberta | Esquiva bem-sucedida deixa um engodo breve; intervalo 12 s; chefes não são provocados compulsoriamente | Gruta das Vozes |
| L04 | Botas dos Passos de Lio | Aparar devolve parte do custo da próxima esquiva, sem vigor acima do máximo; intervalo 8 s | Memórias do Moinho |
| L05 | Arco do Último Farol | Disparo carregado deixa um ponto de luz que revela um alvo e fortalece um único tiro seguinte | Faroleira |
| L06 | Haste do Barqueiro, lâmina longa | Ataque pesado empurra alvos leves e aproxima o herói de alvos pesados, com limite de deslocamento | Caçada da Costa |
| L07 | Luvas da Maré de Retorno | Bloqueio bem-sucedido prepara um projétil de resposta não recursivo; intervalo 10 s | Contramestre |
| L08 | Manto do Porto Seguro | Ficar brevemente sem atacar prepara pequena barreira; ser atingido encerra a preparação | Barco de Volta |
| L09 | Agulhas de Prisma, adagas | Acerto direto após flanquear aplica uma única lasca que estilhaça na próxima técnica | Caçada de Prisma |
| L10 | Espelho Quebrado, cajado | Projétil que atinge alvo marcado gera um ricochete fraco para outro alvo; máximo um ricochete | Dama dos Reflexos |
| L11 | Coroa das Estações, elmo | Alternar dois elementos prepara bônus de controle, sem acrescentar dano multiplicativo permanente | Jardineiro |
| L12 | Botas do Jardim Invertido | Esquiva através de uma área hostil deixa uma rota curta de movimento; intervalo 12 s | Cartógrafo |
| L13 | Página Final, montante | Romper postura reduz o custo de um golpe carregado e muda seu arco; uma carga | Bibliotecário |
| L14 | Cajado das Vozes Reunidas | Invocações compartilham um alvo marcado, trocando parte da autonomia por foco; limite de três mantido | Coro Desfeito |
| L15 | Luvas da Sentença Interrompida | Interromper ataque pesado prepara um selo defensivo, com duração curta e intervalo 12 s | Caçada do Arquivo |
| L16 | Manto do Leitor Ausente | Após consumir uma marca, uma sombra repete apenas o deslocamento da última técnica, sem repetir dano/gatilhos | Livro sem Leitor |
| L17 | Dente do Crisol, lâmina longa | Golpe pesado abre uma fissura curta de calor; uma fissura por vez, com sinal de terreno claro | Matriarca |
| L18 | Martelo de Lâmina, montante | Dois ataques leves preparam um pesado mais rápido, mas consomem vigor adicional | Forjador Errante |
| L19 | Luvas do Primeiro Ferreiro | Técnica elemental aquece a arma por um ataque direto; alternância evita acúmulo infinito | Taren de Ontem |
| L20 | Peitoral de Âmbar Vivo | Uma barreira quebrada deixa pequena zona de recuperação de vigor; intervalo 15 s | Ferramenta de Taren |
| L21 | Arco das Memórias Cruzadas | Tiros em dois alvos diferentes preparam um tiro que os conecta; não funciona contra alvo único como dano grátis | Arautos do Fim |
| L22 | Gêmeas do Último Nome, adagas | Marcas consumidas pelo herói reduzem parcialmente uma recarga utilitária; teto por dez segundos | Primeiro Eco |
| L23 | Coroa do Horizonte, elmo | Suprema prepara uma escolha de curto prazo entre proteção e foco, conforme a técnica normal usada a seguir | Veyr |
| L24 | Manto de Quem Ficou | Aparar ou esquivar uma ameaça anunciada conserva uma memória defensiva; máximo duas; perder vida consome uma | Casa de Mira |

As assinaturas direcionam estilo e ritmo. Valores finais, duração e custo de cada uma serão congelados nos dados de M0/M1 e verificados em combinação. Um efeito de segurança também consome orçamento; não é dado de graça por não aparecer no DPS.

## Apêndice C — as seis relíquias

Relíquias ocupam slots existentes de armadura, não criam um oitavo slot. O desbloqueio narrativo pertence ao estado da missão/Nimbo e continua disponível se a relíquia for guardada. A primeira cópia fica protegida da reciclagem; pode ser reforjada para não se tornar inutilizável pelo nível baixo de aquisição.

| Relíquia | Slot | Assinatura inicial de combate | Desbloqueio de história independente |
|---|---|---|---|
| Sino do Reencontro | Manto | Aparo prepara uma pequena barreira de memória; intervalo 12 s | Restaurar as primeiras passagens permanentemente |
| Coração da Costa | Peitoral | Uma defesa bem-sucedida permite neutralizar um projétil leve seguinte; intervalo 15 s | Ativar mecanismos de maré |
| Mãos do Cartógrafo | Luvas | Esquiva prepara o próximo rompimento de postura, com teto e uma carga | Distinguir reflexos falsos |
| Passos da Vigília | Botas | Interrupção válida devolve vigor limitado; intervalo 8 s | Escutar camadas de testemunhos |
| Coroa de Âmbar | Elmo | Golpe pesado recebido prepara barreira curta, sem impedir o dano inicial; intervalo 15 s | Reparar os mecanismos do sino |
| Memória do Horizonte | Grevas | Suprema libera um eco parcial, marcado como `proc`, sem gerar outro eco | Preservar as rotas do epílogo |

Essas relíquias da v5 não convertem silenciosamente a arma Memória do Reencontro da v4.1 em uma peça de armadura. O item antigo mantém seu registro e recebe um mapeamento de assinatura compatível; a nova recompensa e sua condição de obtenção precisam ser idempotentes.
