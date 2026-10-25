# Ecos do Horizonte v4 — plano aplicado

## Direção e escopo

Primeiro capítulo: **A Vila que Esqueceu**. Ari e Nimbo chegam ao Refúgio das Lanternas quando o sino perde a voz e a vila começa a esquecer as pessoas. Mira deixou a porta aberta para alguém cujo nome já não consegue lembrar. Resgatar Lio e trazer o sino para casa muda o lugar onde a aventura começou.

A entrega é uma aventura 2D superior em pixel art, para celular, contida em um único HTML. O capítulo tem começo, desfecho, uma missão opcional de ervas, uma gruta com outro enigma e expedições repetíveis após a conclusão. A duração de 15–20 minutos era uma meta de projeto; depende da leitura, exploração e familiaridade com o combate e não foi medida com jogadores humanos.

## Mudanças executadas

1. **Identidade visual.** Paleta de telhados âmbar, vegetação verde, água azul-esverdeada e memórias violetas. Terrenos, árvores, construções, objetos, quatro heróis, inimigos, chefe, NPCs, retratos e ícones seguem a mesma direção. Artes originais preparadas em atlas; retratos conferidos com a aparência dos sprites. A arte pintada da versão 3.2 fica no HTML anterior.
2. **Animação e leitura.** Caminhada em oito direções, com cinco direções desenhadas e espelhamento para oeste. Poses de repouso, preparação, golpe, conjuração e queda. Armas acompanham o movimento e o ataque. Inimigos têm silhuetas diferentes: cão de raízes, sentinela de musgo, eco encapuzado e Sineiro.
3. **Mundo com percurso.** Mapa de 80 × 80 células com cinco lugares desenhados: Refúgio, Bosque dos Sinos, Moinho Afundado, Santuário do Reencontro e Gruta das Vozes. Estradas, margens, clareiras, tesouros e encontros são posicionados de propósito. Colisões, caminhos alternativos, interiores, atlas e marcador de destino funcionam.
4. **Companheiro com função.** Nimbo revela uma ponte ou atalho por oito segundos. Só existe uma memória temporária por vez. Se ela desaparecer sob o herói, ele volta a uma margem segura. A relíquia do chefe permite restaurar essas passagens permanentemente.
5. **História que altera o mundo.** Mira aponta o caminho; as runas do moinho guardam Lio; o Sineiro toma o som da vila. Ao devolver o sino, uma casa volta a acender, Lio retorna, a oficina reabre, uma arma recebe um efeito próprio e os Ecos instáveis ficam disponíveis.
6. **Quatro estilos de combate.** Guardião: aparo, ruptura e proteção. Errante: disparos, armadilha e mobilidade. Tecelão: gelo, fogo e choque térmico. Pactário: marcas, aliados e drenagem. Habilidades liberadas nos níveis 1, 2, 4 e 6; ramos no 10; modificadores no 8; bônus de classe no 24.
7. **Chefe legível.** Áreas de ataque anunciadas antes do dano, ondas na segunda fase e três lanternas que Nimbo pode acender para interromper e expor o Sineiro. A vida do chefe foi ajustada após simulações de combate com as quatro classes.
8. **Equipamento e evolução.** Sete espaços, seis famílias de armas, reserva, combos, golpe pesado, três raridades, afixos, elementos, melhorias até +5 e quatro conjuntos com bônus de duas e quatro peças. Mochila com busca, filtros, ordenação, comparação e proteção das peças vinculadas a outros heróis.
9. **Interface móvel.** O retrato superior abre todo o hub: equipamentos, mochila, habilidades, evolução e heróis. Seleção de retrato seguida de confirmação efetua a troca. Ataque e quatro habilidades ficam em arco no lado direito; movimento à esquerda. Perfis normal, maior e canhoto; pausas, atlas e livro de objetivos.
10. **Progressão contínua limitada em poder.** Nível 60 e níveis de Legado sem um fim narrativo obrigatório. Até 20 pontos de Legado dão poder. Os seguintes continuam registrando progressão e concedendo recursos. Dez ameaças × três rotas nas expedições, sem multiplicar acidentalmente a escala nem repetir a recompensa da mesma conclusão.
11. **Salvamento preservado.** Novo formato schema 3 e chave `ecos-horizonte-save-v4`. Importa formatos 1, 2 e 3; o estado do mundo antigo fica em `legacyWorld`, enquanto o novo capítulo começa no Refúgio. A chave da versão 3.2 permanece intacta. Exportação e importação por JSON, com validação antes de substituir a jornada.
12. **Entrega técnica.** HTML independente, imagens e sons incluídos, sem CDN ou pedidos externos para jogar. Simulação fixa em 30 Hz, desenhos por proximidade, terreno em blocos armazenados, minimapa em cache e opção de efeitos leves. Som CC0 de Kenney e sino sintetizado no navegador.

## Verificação e limites

Os relatórios acompanham o código de construção em `rebuild/v4/qa` no workspace. A verificação usa Chromium e Playwright: sequência de história, runas, retorno seguro de memórias, todos os heróis, combate real por ataques/habilidades, trinta combinações de expedição, proteção de inventário, salvamento legado real e recarga, operação sem pedidos externos e interfaces em seis tamanhos de tela. Gestos de dois dedos são enviados pelo protocolo de toque do Chromium.

O desempenho é medido no navegador do ambiente com CPU reduzida artificialmente. Isso não substitui testes em aparelhos Android e iPhone físicos. A abertura literal por `file://` é bloqueada pela política do Chromium deste ambiente; a independência do HTML é conferida com a rede desligada e todos os pedidos externos bloqueados.

## Entregas progressivas

- Prévia 01: direção de arte, câmera, movimento e hub dos heróis.
- Prévia 02: mapa, combate, memórias e moinho.
- Prévia 03: primeiro capítulo completo, Sineiro, vila restaurada e expedições.

A versão 3.2 permanece disponível como edição anterior. Não há servidor de jogo, multijogador ou salvamento em nuvem nesta entrega.
