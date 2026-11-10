# Aurora — Crônicas da Fenda · v20 "Vocações"

Esta versão acrescenta ao Aurora v19 as mecânicas pedidas a partir das capturas de tela de referência
(ficha do caçador com abas, árvore de classes e habilidades, treino secreto, despertar, montaria e rancho,
bolsa, lista de caçadores com cura, prédios e decoração, armazém com desmonte). Tudo foi escrito com nomes,
arte e números próprios do Aurora — nenhuma classe, personagem ou imagem do jogo de referência foi copiada.

O save da v19 abre direto na v20 (mesma chave de save). Heróis antigos recebem os pontos de Arte que
teriam juntado na carreira.

## O que cada tela de referência virou

| Tela de referência | No Aurora v20 | Onde fica |
|---|---|---|
| Ficha com 8 peças em volta do personagem | Boneco com 8 slots: arma, armadura, elmo, manoplas, botas, cinturão, amuleto e anel | Heróis › herói |
| Aba de atributos (HP, saciedade, humor, vigor, ATQ, DEF, CRÍT, VEL ATQ, evasão, DPS) | Aba **Ficha**, com as mesmas leituras, dano crítico e "aguenta até o nível" | Heróis › herói › Ficha |
| "Despertar 0/4" | **Despertar** em 4 estágios | Heróis › herói › Ficha |
| Habilidade básica, 2ª e 3ª habilidade por mudança de classe | **Árvore de vocação**: 2 ramos na 2ª classe, 4 destinos na 3ª | Heróis › herói › Habilidades |
| 15 ícones 0/100 e "Pontos Secretos totais" | **Artes Secretas**: 15 artes de 0 a 100 | Heróis › herói › Artes |
| "Nenhum animal de montaria" / "Ir para o rancho" | **Montarias** e o prédio **Estábulo do Vale** | Heróis › herói › Montaria e Reino › Estábulo |
| Aba de materiais do caçador | **Bolsa** do herói, com "chamar de volta" | Heróis › herói › Bolsa |
| Lista de caçadores com Curar / Info / localizar, ordenar e terreno de caça | Cartões de caçadores com **Curar**, **Info**, **localizar**, ordenação e **campo de caça de todos** | Heróis |
| Construir: Prédios / Decoração | Abas **Prédios** e **Decoração** (10 enfeites que aparecem na praça) | Reino |
| Armazém da Cidade: filtros por peça, "Desmontar tudo" por raridade, capacidade | Painel **Armazém** com capacidade, filtros, reserva, desmonte unitário e em lote | Armazém (nova aba inferior) |
| Comerciante errante | **Mascate errante**: 4 ofertas novas a cada amanhecer | Reino › Mercado |

## Árvores de funcionamento

### 1. Vocações (mudança de classe)

- **1ª mudança** no Rank C: 600 moedas, 1 Emblema de Ocre, 2 Tomos de Técnica.
- **2ª mudança** no Rank A: 4.000 moedas, 1 Emblema das Brumas, 5 Tomos, 1 Cristal de Alma.
- Escolher um ramo fecha o outro. Trocar custa 3 Selos (os níveis das habilidades ficam guardados).
- Cada vocação dá uma passiva permanente e uma habilidade ativa nova. Renascer mantém a vocação.

| Classe (passiva básica) | 2ª classe → habilidade | 3ª classe → habilidade |
|---|---|---|
| **Espadachim** — Postura Firme (+5% ataque) | **Duelista** → Estocada Dupla | **Mestre de Lâminas** → Dança das Lâminas · **Espada Fantasma** → Corte Fantasma |
| | **Mercenário** → Brado de Guerra | **Senhor da Guerra** → Terremoto · **Santo da Espada** → Lâmina da Aurora |
| **Cavaleiro** — Couraça Viva (+6% defesa) | **Guardião de Aço** → Golpe de Escudo | **Baluarte Real** → Bastião · **Sentinela de Espinhos** → Carapaça de Espinhos |
| | **Lanceiro Errante** → Investida | **Lança-Dragão** → Salto do Dragão · **Marechal** → Estandarte |
| **Arqueiro** — Olho Treinado (+4% crítico) | **Atirador de Elite** → Tiro Perfurante | **Olho de Falcão** → Tiro Mortal · **Caçador de Feras** → Marca do Caçador |
| | **Patrulheiro** → Flecha Envenenada | **Guarda-Bosque** → Saraivada · **Vento Errante** → Passo do Vento |
| **Mago** — Mente Arcana (−8% recarga) | **Piromante** → Parede de Chamas | **Arquimago** → Meteoro · **Senhor das Cinzas** → Combustão |
| | **Criomante** → Lança de Gelo | **Sábio da Fenda** → Distorção · **Tecelão do Inverno** → Nevasca |
| **Paladino** — Fé Inabalável (+6% vida) | **Cruzado da Aurora** → Golpe Sagrado | **Avatar das Duas Luas** → Julgamento · **Inquisidor** → Sentença |
| | **Clérigo de Batalha** → Bênção | **Sumo Sacerdote** → Renovação · **Guardião da Luz** → Égide Sagrada |
| **Ladino** — Mãos Leves (+10% moedas) | **Sombra Veloz** → Emboscada | **Fantasma da Meia-Noite** → Mil Cortes · **Carrasco** → Execução |
| | **Trapaceiro** → Bomba de Fumaça | **Rei dos Ladrões** → Grande Golpe · **Envenenador** → Lâmina Tóxica |

As 36 habilidades usam um conjunto comum de efeitos: golpe único ou múltiplo, área, crítico garantido,
perfuração de defesa, execução, atordoamento, lentidão, veneno/queimadura, marca de vulnerabilidade,
provocação, bônus de grupo (ataque, defesa, velocidade, esquiva, espinhos, regeneração), cura, escudo e limpeza.

**Nível das habilidades (1–10):** treinado com moedas e Tomos de Técnica. O limite é 1 + 2 × nível do
Campo de Treino. Cada nível dá +6% de força à habilidade.

### 2. Artes Secretas (15 artes × 100 pontos)

| Arte | Por ponto | No máximo |
|---|---|---|
| Força · Vitalidade · Guarda | +0,4% ataque · vida · defesa | +40% |
| Precisão | +0,15% crítico | +15% |
| Letalidade | +0,5% dano crítico | +50% |
| Reflexos | +0,12% esquiva | +12% |
| Celeridade | +0,25% vel. de ataque | +25% |
| Passos Leves | +0,2% movimento | +20% |
| Foco | +0,2% recarga mais rápida | +20% |
| Caça-prêmios | +0,5% moedas dos monstros | +50% |
| Rapina · Estudo | +0,4% espólio · experiência | +40% |
| Frugalidade · Fôlego | −0,4% fome · cansaço | −40% |
| Serenidade | +0,4% ânimo natural | +40% |

**De onde vêm os pontos:** +1 por nível, +3 por promoção, +5 por mudança de classe, +2 por chefe de zona,
+1 por andar da Fenda, +15 por renascimento, e **meditação** paga no Campo de Treino (a partir de 150 moedas; sobe 10% a cada compra e com o nível do herói).
Há botão para distribuir pelos atributos da classe e para redistribuir tudo por 1 Selo.

### 3. Despertar (4 estágios)

| Estágio | Requer | Custo | Ganho (além de +8% em vida, ataque e defesa) |
|---|---|---|---|
| Centelha | Rank C | 1.500 moedas, 2 Cristais de Alma, 5 Pó Estelar | +1 poção na bolsa |
| Chama | Rank A | 6.000, 5 Cristais, 15 Pó | +15% de dano crítico |
| Fulgor | Rank S | 20.000, 10 Cristais, 40 Pó | habilidades 10% mais rápidas |
| Transcendência | Rank SSS ou um renascimento | 60.000, 20 Cristais, 100 Pó, 10 Essências | uma vez por dia, levanta da queda com metade da vida |

### 4. Montarias e o Estábulo do Vale

O Estábulo abre com a Cidadela no nível 3, ao norte das muralhas. Tem 1 + nível baias e transforma
2 trigo em 1 ração. Cada montaria em uso come 1 ração por dia; sem ração, rende a metade.
A ração também leva a montaria do nível 1 ao 10 (+10% do bônus por nível).

| Montaria | Estábulo | Bônus no nível 1 | Bolsa |
|---|---|---|---|
| Cavalo Malhado | 1 | +15% movimento | +4 |
| Javali de Sela | 2 | +10% movimento, +8% vida, +4% defesa | +6 |
| Lobo Prateado | 2 | +18% movimento, +6% ataque | +3 |
| Cervo Lunar | 3 | +20% movimento, +5% esquiva, +20% ânimo natural | +4 |
| Grifo Jovem | 5 | +25% movimento, +10% ataque, +3% crítico | +5 |
| Draco das Cinzas | 7 | +30% movimento, +12% ataque, +12% vida | +8 |

Fora das muralhas o herói aparece montado no mapa.

### 5. Equipamento em 8 peças

Além de arma, armadura e amuleto, a Ferraria passa a forjar: **elmo** e **botas** (Ferraria 2),
**manoplas** (3), **cinturão** (4) e **anel** (5). Os heróis compram sozinhos, a forja automática cobre as
peças novas e faz mais encomendas por hora conforme o nível da Ferraria.

### 6. Armazém da Cidade

Capacidade = 24 + 8 × Ferraria + 8 × Mercado + 4 × Cidadela (armazém cheio bloqueia a forja).
Filtro por tipo de peça, **reservar** (o herói não compra e o lote não desmonta), **desmontar**
(devolve metade da receita e Pó Estelar conforme a raridade) e **desmontar tudo** por raridade.
As abas Consumíveis, Materiais e Especiais mostram todo o resto do estoque.

### 7. Decoração e Encanto

Dez enfeites, três níveis cada, desenhados na praça: Canteiros de Flores, Estandartes de Aurora,
Jardim de Ervas, Fonte das Duas Luas, Poço dos Desejos, Estátua do Primeiro Caçador, Relógio de Sol,
Lampiões de Cristal, Altar dos Caídos e Arco do Triunfo. Cada um dá um bônus próprio (felicidade,
experiência, ervas, ânimo, moedas, ataque, velocidade de ataque, ataque noturno, recuperação dos caídos,
defesa) e pontos de **Encanto**: +1% de dízimo por ponto e +1 morador a cada 10.

### 8. Fluxo dos recursos novos

```
elites, chefes, Fenda, Maré ──► Tomo de Técnica ──► nível das habilidades, mudanças de classe
chefes, Maré, Fenda (a cada 5) ─► Cristal de Alma ──► Despertar, 2ª mudança de classe
desmonte de peças Incomuns+ ───► Pó Estelar ──────► Despertar
Fazenda (trigo) ─► Estábulo ───► Ração ───────────► sustento e nível das montarias
Mascate errante (Mercado) ─────► vende um pouco de tudo por moedas ou Selos
```

## O que não foi feito

- **Trajes, asas e mascote** (os slots roxos laterais da referência) não entraram.
- **Seletor de dificuldade**: o Aurora já regula a dificuldade pela corrupção de cada zona; não criei um modo global.
- **Decoração de posição livre**: os enfeites têm lugares fixos na praça.
- **Capítulos da Jornada** não foram alterados; a v20 apresenta as novidades em um guia de uma tela.
- O equilíbrio foi conferido em simulações de até 11 dias de jogo e em cenários forçados de fim de jogo,
  não em uma campanha longa jogada por uma pessoa. Os números dos sistemas novos podem pedir ajuste.

## Verificação

Resultados em [verificacao-v20.json](verificacao-v20.json). Para repetir:

```sh
cd jogos/aurora-cronicas-da-fenda
sh fontes-v20/testar.sh
```

O script remonta a v20 a partir da v19 com os arquivos de `fontes-v20/`, confere que o HTML publicado é
idêntico, e roda a migração de um save da v19, os testes dos sistemas e uma simulação de 8 dias.
