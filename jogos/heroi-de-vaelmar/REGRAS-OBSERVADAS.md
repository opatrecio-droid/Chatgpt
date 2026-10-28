# Regras de jogo observadas em guias da comunidade

Fonte: cinco vídeos de guia de um criador da comunidade que você enviou (classes, elementos, seguidores, invocador e PvP), lidos pelo áudio e por quadros. São resumos **em palavras minhas**, só com as regras de jogo. Nada do vídeo (imagem, texto ou fala) está no projeto.

**Cuidado com a data.** Os vídeos são mais antigos que o seu cliente (v3.27.3): a interface é a antiga (aba "Class" com Stats/Skills/Abilities, combate em paisagem) e alguns números já mudaram. Onde o Codex atual (catálogo do clone) ou as suas gravações dão outro valor, valem os deles. Cada regra abaixo diz se **já está no clone**, se foi **aplicada agora** ou se **fica pendente**.

## Classes e progressão

| Regra | Estado |
|---|---|
| Um tier a cada 25 níveis; tier 10 no nível 225; o nível máximo é 250 ("tier 11" não tem classes novas). Depois disso, poder extra vem dos níveis de ascensão | já no clone (nível máximo 250) |
| Não há pontos de atributo para distribuir: cada classe tem atributos base que sobem a cada nível | já no clone |
| Ao olhar uma classe, o jogo mostra a diferença de atributos **em relação à classe que você usa agora** (verde sobe, vermelho desce) | **aplicado**: a linha do detalhe da classe agora compara com a classe atual; na atual não aparece linha |
| Comprar uma classe custa orns; depois de comprada, trocar é grátis | já no clone |
| Habilidades aprendidas numa classe valem em **qualquer** classe; passivas só valem com a classe equipada | já no clone |
| Arma preferida da classe (ou da especialização): +5% de ataque e magia, uma vez só, na arma da mão principal (a da esquerda na tela de equipamento) | **aplicado** para as classes cuja lista foi vista (22). O Guerreiro mantém o bônus próprio do motor |
| Para liberar uma classe é preciso ter uma classe do caminho anterior (no começo, até duas opções por tier; híbridos misturam dois arquétipos; deuses do tier 8 aceitam qualquer classe do tier 7) | **pendente**: falta ver a lista de pré-requisitos de cada classe |
| Algumas passivas "carregam": matar certos monstros dá bônus de atributos por 36 horas (Arquidruida com animais, Dragão com dragões) | **pendente** (o clone tem as passivas só como texto) |
| Classes de deuses (tier 8+) podem usar qualquer equipamento; o primeiro deus depende da facção | pendente |
| Especializações: grupo à parte das classes, a primeira é grátis, trocar custa orns, disponíveis a partir do tier 3 e uma nova a cada dois tiers; o bônus percentual vale só para os atributos **base** (não para o equipamento); habilidades e passivas da especialização só funcionam com ela ativa | **pendente**: as especializações do clone são as da versão antiga e não batem. Falta a aba "Especialização" do seu cliente |
| Invocadores: para liberar a primeira classe é preciso entregar um equipamento de invocador a um NPC (Horus), sem custo em orns. Têm menos slots de habilidade e menos HP, e mais destreza que as outras classes do tier | pendente |

## Elementos e dano

| Regra | Estado |
|---|---|
| Quatro elementos básicos (fogo, água, terra, raio), quatro secundários (sagrado, sombrio, arcano, dragão) e o físico, que na prática se comporta como um elemento | já no clone |
| Você escolhe uma facção no nível 10. Dano do **seu** elemento: +25%. Dano recebido do seu elemento: −25% | **aplicado**: o recebido era −20%, agora −25% |
| Fraqueza do inimigo = **dano dobrado**; resistência = metade; imunidade = zero | **aplicado**: a fraqueza era ×1,5, agora ×2 |
| Cor dos números: amarelo é normal, **vermelho** é resistido (ou facção reduzida), **azul** é fraqueza | **aplicado** (azul e vermelho são novos) |
| Equipamento com elemento dá 50% de redução contra aquele elemento (depois da penetração). Só armas podem ter o elemento trocado (alquimista: fogo, água, terra, raio; forja demoníaca: sagrado, sombrio, dragão); o elemento da arma **não** protege | **aplicado** (5.4.0): peça de armadura, mão secundária ou acessório com elemento no Codex resiste a esse elemento (×0,5); o elemento da arma não protege. Ainda **pendente**: trocar o elemento da arma no alquimista / forja demoníaca (o clone não tem essas estações) |
| Habilidade com elemento no nome ignora o elemento da arma. Habilidade sem elemento usa o elemento da arma da mão principal; sem elemento na arma, é físico. O físico não pode ser resistido; feitiços "sem elemento" também não | **aplicado** (5.4.0): o ataque básico e as habilidades físicas sem elemento usam o elemento da arma; habilidade com elemento próprio, habilidade «Físico» e feitiço sem elemento não. Feitiço de dois ou mais elementos («dano misto») acerta o elemento a que o alvo é fraco, se houver |
| Dano de um elemento tem chance de causar o status daquele elemento; o elemento da arma também sorteia o seu status mesmo que a habilidade seja de outro elemento | **aplicado** (5.4.0) com chance de 5% por golpe — **número meu**, o guia não diz qual é. Fogo→Em chamas, água→Congelado, terra→Putrefação, raio→Paralisado, dragão→Praga (sagrado, sombrio e arcano não têm status próprio visto) |
| Feitiços arcanos usam o **maior** entre magia e ataque (confirmado no blog oficial) | **aplicado** (5.4.0): os feitiços «Híbrido dinâmico» do Codex usam o maior dos dois (e a resistência como defesa); os híbridos comuns continuam com a média |
| Chefes e monstros têm fraquezas, resistências e imunidades, que o Codex lista | pendente (o catálogo do clone não traz esses campos) |

## Frascos de Mana e de Sangue

Fonte: textos das passivas e dos feitiços de frasco lidos no vídeo 2 (301 habilidades) e a capacidade de cada classe no Codex. **Aplicado em 5.4.0**, com os números de carga como aproximação.

| Regra | Estado |
|---|---|
| A capacidade vem da classe (Codex: «Manaflasks: +N / Bloodflasks: +N»). «Frascos de Mana III» começa com meio frasco de mana; «Frascos de Sangue», com meio de mana e meio de sangue; «Frascos de Sangue II», com um de mana e meio de sangue | **aplicado** |
| Feitiços elementais carregam os Frascos de Mana; explorar fraqueza carrega mais rápido; feitiços de vários elementos («Raio de Calor», «Terra Congelada»…) carregam mais rápido que os outros | **aplicado**: ¼ de frasco por feitiço, ×2 na fraqueza, ×2 em feitiço de dois ou mais elementos — **números meus** |
| Feitiços (de qualquer tipo) carregam os Frascos de Sangue | **aplicado**: ⅕ de frasco por feitiço — **número meu** |
| Só se libera um feitiço de frasco com frasco cheio. Feitiços que «dependem da carga» (Aumento de Mana, Tempestade Elemental, Inflexão, Necromancia, Banimento) gastam todos os frascos cheios | **aplicado** |
| Raio de Mana e Raio de Sangue: nunca erram e perfuram a Resistência (clone: a metade). Raio de Sangue pode dar crítico. Aumento de Mana atinge todos (poder 500 × frascos) e pode dar turno extra se pegar mais de um alvo. Tempestade Elemental põe Congelado, Paralisado, Putrefação ou Em chamas, ignorando imunidades, em tantos alvos quantos frascos. Inflexão dá Defesa e Resistência por (1 + frascos) turnos. Repetição repete o último feitiço da batalha. Chamado da Natureza invoca animais (2). Necromancia invoca esqueletos (um por frasco de sangue). Banimento remove invocações inimigas. Omniflask: poder 2500, todos os elementos, +50% por frasco extra gasto (mana cheio adicional e sangue cheio) — **os +50% são meus** | **aplicado** |
| Infusões (120 de mana): Sangue converte frascos de mana em frascos de sangue, Mana faz o contrário, Guarda esvazia a barra de Guarda para carregar os frascos em ordem | **aplicado** |
| Marca Alinhada e Tempestade de Marca (Marcas), Gotejamento de Mana e Perda de Sangue (sem texto) | **pendente**: ficam fora do menu de combate |
| Turno extra: Avidez («Avidity Chance» das classes) dá um turno adicional depois da ação | **aplicado** com a chance do Codex |

## Seguidores (pets)

Números de 2023–2024; o Codex atual e a sua gravação mostram valores diferentes (por exemplo, Proteção de Valhala: 8% no vídeo, 12% no seu cliente). Vale a **estrutura**:

- O poder do seguidor cresce com o **nível do personagem**.
- Os bônus de Valhala (da classe) e do Adestrador/Domador (especialização) **se somam**, o que quase dobra o poder do seguidor.
- Cada seguidor tem seis taxas de ação: atacar, curar, buff, debuff, feitiço e proteger. Elas somam, valem para cada habilidade separadamente (14% de chance de cada feitiço, não de "algum feitiço"), e o seguidor não repete um buff que já está ativo nem cura quem está com a vida cheia.
- Você pode usar os mesmos itens de classe do guerreiro e do mago até o tier 9; no tier 10 qualquer equipamento.
- Estratégia dos builds: o seguidor causa o dano e o herói busca sobreviver, com guarda alta e vida baixa (a passiva do Beowulf cresce quando a vida cai).
- Itens aumentam poder e taxa de ação do seguidor (amuletos, conjuntos de equipamento de chefes de evento).
- Os "portões" do Beowulf são posturas que dão +50% num atributo e −90% em outros; só uma por vez.

Estado: **pendente**. O clone tem seguidores, mas sem as seis taxas de ação.

## Invocadores

Resumo: até 5 invocações ao mesmo tempo em solo (menos em grupo); não usam seguidores; a primeira invocação equipada entra sozinha no começo da batalha, e nos tiers altos a segunda também; invocações têm chance de proteger o invocador de dano; invocações multi-turno são melhores no primeiro slot e as de 1 turno servem de tapa-buraco; a especialização Bardo/Encantador dá buffs que se aplicam às invocações. Estado: **pendente** (a classe existe como dado, sem o ciclo de invocação).

## Interface vista (versão antiga)

Combate em paisagem com grade [habilidade rápida | Ataque | habilidade rápida | Habilidade/Feitiço] e Fugir em linha cheia; as habilidades equipadas aparecem numa fileira acima; tela de vitória com experiência, ouro, orns e itens, botões Revanche/Sair; na Arena, "carga de habilidades" separada para PvP. Não foi copiada: a sua versão 3.27.3 tem outra interface (já refeita no clone).

## O que continua faltando para fechar estes pontos

1. Gravação da aba **Especialização** e da lista de **pré-requisitos** das classes, no seu cliente.
2. Gravação do combate com o menu de habilidades e de itens abertos (continua sendo o maior buraco).
3. Uma tela de seguidor (Status → Seguidor) com as taxas de ação.
4. Uma gravação de combate com uma classe de frascos (Mago da Corte em diante) para conferir quanto cada feitiço carrega e quanto cada frasco rende.
