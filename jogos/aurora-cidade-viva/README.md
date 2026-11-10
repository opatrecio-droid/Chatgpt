# Aurora — Crônicas da Fenda

RPG de gestão de cidade com heróis autônomos, inspirado em *Evil Hunter Tycoon* e em animes
de isekai. Um arquivo HTML só, sem instalação e sem internet.

## Jogar

Abra **`aurora-cidade-viva-19.html`** no navegador do celular ou do computador.
No GitHub: botão *Download raw file* e depois abra o arquivo baixado.

- Arraste para mover o mapa, pinça (ou roda do mouse) para zoom, toque em tudo.
- O jogo salva sozinho no aparelho. Em **Mais › Opções** dá para exportar e importar o save.

## Versões

| Arquivo | O que é |
|---|---|
| `aurora-cidade-viva-19.html` | **v19 "Reforjada"** — versão atual (0,8 MB) |
| `versoes/aurora-cidade-viva-18.html` | v18, o protótipo anterior, guardado como estava (13 MB) |

## O que mudou da v18 para a v19

A v18 acumulava cerca de cem camadas de correção, cada uma redesenhando o HUD por cima da
outra, umas 30 vezes por segundo. Era essa disputa que fazia as abas piscarem no celular.
A v19 é uma reconstrução do mesmo mundo sobre uma base limpa.

**Pisca-pisca das abas** — existe um único HUD. Nada é reconstruído por quadro: a estrutura
só é refeita quando um evento do jogo a muda, e os números são atualizados nó a nó. Medido
com o painel aberto em 3×: de ~1.000 reconstruções para ~50 trocas de texto a cada 3 s.

**Arte** — toda a arte é desenhada por código, num estilo só: 6 classes de herói com 9 quadros
de animação e aparência que muda com o equipamento, 31 monstros, 15 construções com 4 estágios
visuais, 6 biomas, árvores, ruínas, cristais, muralha, postes que acendem à noite, fumaça,
vaga-lumes, neve, brasas. Sem imagens embutidas, o arquivo caiu de 13 MB para 0,8 MB.

**Sem escolha de dificuldade** — a dificuldade é gradual e vem do próprio jogo:
- cada zona tem um chefe; vencê-lo aumenta a *corrupção* da zona (monstros mais fortes, mais espólio);
- o Nível de Reino abre zonas novas e fortalece a Maré da Fenda;
- o jogador pode baixar a corrupção de uma zona a qualquer momento para treinar novatos.

**Perigo real** — herói cai. Perde o espólio da bolsa, 25% do ouro, parte da experiência e
fica em recuperação. Recuar não é garantido: monstros rápidos perseguem. Poções são limitadas
ao que o Alquimista produziu. Na simulação com jogo ativo acontece cerca de 1,5 queda por dia.

**Ritmo** — um dia dura 5 minutos em 1× (antes, 1 minuto em 3×). Com jogo ativo e ótimo, o
primeiro Rank A sai por volta do dia 35–40, o Rank S perto do dia 60. Depois vêm Rank SSS,
renascimentos, corrupção sem teto, Fenda Infinita e equipamentos Ascendentes.

**Economia** — o ouro nasce nas bolsas dos heróis (abates) e só chega ao cofre quando eles
gastam na cidade: refeições, descanso, cura, poções, treino e o equipamento que o jogador
forja com o espólio. Moradores produzem trigo, ervas, madeira, pedra e minério; padaria e
alquimista transformam isso em refeições e poções; salários e dízimo fecham a conta.
Para o cofre nunca ficar sem destino: construções sem teto de nível, obras públicas
infinitas, recrutamento, forja, aprimoramento e eventos.

**Interface** — HUD único (reino, relógio, moedas, heróis), jornada guiada sempre visível,
cinco abas, janelas no mesmo estilo, mapa do mundo, decretos reais (poderes do jogador),
relatório diário, progresso offline, sons e música ambiente sintetizados.

## Sistemas

- **Heróis**: 6 classes, 14 traços de personalidade, 5 raridades, ranks E → SSS, renascimento.
  Cada um tem vida, fome, energia e ânimo, bolsa própria e decide sozinho o que fazer.
- **Zonas**: Bosque Sussurrante, Ruínas de Ocre, Ermos da Fenda, Pântano das Brumas,
  Pico Gélido e Cinzas do Dragão, cada uma com quatro monstros, elites e um chefe.
- **Cidade**: 15 construções do elenco original (Taverna do Cervo, Hospedaria do Viajante,
  Casa do Alquimista…), 24 moradores com rotina de trabalho, almoço, lazer e sono.
- **Forja**: 10 tipos de equipamento, tiers por zona, 6 raridades, aprimoramento até +15,
  obra-prima com Núcleo, encomendas automáticas.
- **Maré da Fenda**: invasão noturna periódica que escala com o reino.
- **Fenda Infinita**: escada de guardiões sem fim, uma tentativa grátis por dia.
- **Metas**: jornada de 35 capítulos + decretos sem fim, 3 contratos por dia com sequência,
  conquistas, bestiário com bônus permanentes, bênçãos compradas com Selos de Renome.

## Para quem for mexer no código

```
src/00-core.js … 90-main.js   módulos do jogo, em ordem de carga
src/style.css, src/fonts.css   interface e fontes (Cinzel e Manrope embutidas)
tools/build.js                 junta tudo em aurora-cidade-viva-19.html
tools/sim.js                   simulação sem tela: ritmo, economia, quedas
tools/play.js, play2.js        roteiros de teste no navegador (capturas + erros)
tools/preview.js               folhas de prévia da arte
```

```
node tools/build.js            # gera o HTML
node tools/sim.js 60           # joga 60 dias com um robô e imprime a tabela
node tools/play.js /tmp/saida  # percorre as telas num celular emulado
```

A simulação (`00`–`33`) não toca no DOM e roda em Node; por isso o balanceamento pode ser
medido em segundos antes de qualquer mudança chegar ao jogo.
