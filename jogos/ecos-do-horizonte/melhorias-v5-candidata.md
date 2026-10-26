# Ecos do Horizonte v5 — candidata de campanha 1

Atualizada em 26/10/2026. Arquivo único: `ecos-do-horizonte-v5-candidata.html` (7,311,157 bytes, aproximadamente 7.31 MB). SHA-256: `7227f5f56e8afade31a8cd8498ec1871edc4c706f432e6f19e4ce08111cec4fb`.

[Baixar o HTML diretamente](https://github.com/opatrecio-droid/Chatgpt/releases/download/ecos-do-horizonte-v5.0.0-candidate.1/ecos-do-horizonte-v5-candidata.html) · [Jogar no Site do proprietário](https://ecos-horizonte-mobile.patrecio.chatgpt.site)

Esta candidata reúne a expansão funcional da campanha em um único arquivo. O plano de 24 horas continua como meta editorial. Não há medição humana que permita anunciar essa duração, diversão aprovada ou conclusão de 100% do checklist.

## O que foi aplicado

- Seis regiões/atos e 12 masmorras, com 24 missões principais, 18 secundárias e seis caçadas. As principais têm de três a quatro etapas registradas; chefes deixam uma lembrança consultável antes da entrega final. Os cinco mecanismos regionais alteram a passagem, e seu estado persiste.
- Quatro heróis trocáveis pelo retrato superior. O hub tem Personagem, Construção, Coleções e Missões; equipamentos, mochila, baú, troca de herói, habilidades, talentos e códices ficam em seus submenus.
- 24 técnicas ativas e 72 escolhas de forma, ranks, três ramos de talentos e especializações. Cada herói tem orçamento próprio de 24 pontos de técnica e 30 de talento; redistribuição gratuita na Âncora. Vida/energia proporcionais e recargas por habilidade são preservadas nas edições.
- 48 bases de equipamento, 24 IDs lendários e seis relíquias de história: 78 entradas de códice. Seis raridades, afixos sem grupos repetidos, oito conjuntos com bônus de duas/quatro peças e no máximo três assinaturas equipadas. Afixos, conjuntos, base e assinatura são informações separadas.
- Mochila com 60 vagas, baú com 180, favoritos, reciclagem com seleção explícita, fabricação por família/conjunto, receitas dirigidas, reforja de nível e troca de um afixo preservando orçamento.
- Saques físicos com imagem própria, marcas de raridade e recolhimento por proximidade/linha livre. Mochila cheia mantém a peça no chão. Sair de masmorra ou salvar nela conserva seus achados junto da entrada correta, na mesma região.
- Bestiário com 48 fichas: 24 espécies comuns, 12 variantes de elite, seis minichefes e seis chefes. Observação depende de contato visível. Monge, Ninho, ataques rítmicos, investidas, canais, calor, abrigo e estruturas têm consumidores no combate.
- Três finais, com objetos e pessoas diferentes no mundo, conservando poder e recursos equivalentes. Secundárias podem restaurar uma passagem, uma memória consultável ou um desconto de serviço.
- Níveis até 60, Legado com poder limitado e expedições repetíveis. Ameaça e rota alteram os atributos e recompensas anunciados. A lista de recompensas de expedições antigas é descartada ao iniciar a seguinte para evitar crescimento por um histórico desnecessário.
- Artes incorporadas: 48 bases em três estados visuais, 24 lendários e seis relíquias (174 renderizações), 24 ícones de habilidades, emblemas de formas e atlas de criaturas. Os três estados das bases reutilizam a mesma ilustração com marcas de melhoria; não são 144 ilustrações totalmente independentes.

## Correções que impediram considerar as prévias concluídas

Foram corrigidos débito sem entrega na fabricação, escolha de save antigo em vez da geração nova, gravação de IndexedDB adiada antes do fechamento, recuperação que não consultava backups, controles e efeitos divergentes das descrições, quarta assinatura pela troca de arma, saques deslocados para coordenadas do mapa antigo e a oficina regional abrindo diálogo em vez da forja.

A revisão final corrigiu o objetivo que podia mandar sair antes de ouvir a lembrança do chefe, o relógio avançando com o jogo pausado, efeitos atrasados atravessando troca de cena, multiplicadores de ameaça sobrescritos, recompensa de rota ausente e mensagem de salvamento positiva quando nenhum armazenamento estava disponível. Avisos de cruz/calor/estruturas foram ajustados à área aplicada; projéteis respeitam a direção anunciada. Os rótulos das estruturas dos chefes agora descrevem sua função regional. Também foram removidas árvores geradas sobre a água e revisados o piso das passarelas e o espaço dos submenus.

## Verificação executada e seus limites

- As 48 missões foram concluídas em fixtures usando produtores reais: diálogos/botões de NPC, objetos, runas e morte de inimigos. Os seis encerramentos de ato preservaram a lembrança após salvar/reentrar, entregaram uma relíquia e não duplicaram as recompensas em dez atualizações repetidas. Os três finais foram acionados por seus botões e persistiram. Teleporte, nível elevado e morte direta são atalhos de teste: não comprovam percurso natural ou duração.
- 600 mil sorteios de raridade e seis mil orçamentos de afixos; fabricação das 48 bases e 24 lendários; consumidores de 30 assinaturas e seu intervalo interno; contagem/retirada/persistência de oito conjuntos. Essas verificações não aprovam automaticamente o equilíbrio de todas as combinações ofensivas.
- 40 mil montagens legais geradas com semente conferiram pontos, caps e números finitos. Foram feitos 400 ciclos de investir, redistribuir e carregar, cobrindo os quatro heróis. Isso é verificação estrutural, não 40 mil combates.
- 200 expedições completas com retorno exercitaram persistência e limites dos registros. Mira com dois dedos, cancelamento sem custo e 60 combinações de menu/tamanho de tela foram verificadas em Chromium com emulação de toque.
- Migração de v4.1, backup literal, importação inválida atômica, fechamento imediato com quota, recuperação de cópias corrompidas e exportação com armazenamento indisponível foram exercitados. O caso de quota conservou a geração de 777 ouro em IndexedDB apesar de 111 no localStorage.
- O mesmo HTML iniciou e permitiu trocar os três heróis seguintes em contexto sem rede, com zero pedidos de recursos externos. O Chromium gerenciado bloqueou `file://` por política do ambiente; abrir o arquivo diretamente no visualizador/navegador Android e iOS continua pendente de aparelho.
- Os 25 atlas decodificam aproximadamente 20,7 MiB de RGBA. O cache de terreno tem limite configurado de 16 MiB (8 MiB no modo leve), e o cache de ícones tem até 256 entradas. Esses valores não medem GPU, memória do processo ou desempenho de celular.
- A calibração anterior cobriu 252 rotações de 60 segundos em alvo parado, com quatro classes, três construções, três qualidades e sete níveis. Depois dos ajustes, a razão entre maior e menor DPS no nível 60 com raros ficou em aproximadamente 1,46. Sobrevivência, alvo móvel, grupo e conforto exigem mais cobertura; essa diferença continua merecendo investigação. As referências de vida dos monstros usam tabelas fixas por nível, sem copiar os atributos do herói.

## Pendências para o aceite integral do plano

1. Duração e diversão: onboarding com pessoas e seis jornadas novas, cobrindo quatro classes. A meta P50 de 22–26 horas e os intervalos de descoberta ainda não foram medidos. Não preencher essa meta com espera artificial ou repetição obrigatória.
2. Aparelhos: Android e iPhone físicos, abertura por arquivo/visualizador, gestos, rotação, suspensão, armazenamento, FPS e memória. A emulação não resolve essas perguntas.
3. Identidade de formas e itens: há 72 escolhas funcionais com nomes e emblemas; parte compartilha perfis de amplitude, potência e cadência. O plano pede formas autorais mais distintas. Da mesma maneira, as 30 assinaturas combinam eventos e efeitos de uma biblioteca compartilhada; a revisão de identidade e das sinergias ainda não está integralmente aprovada.
4. Combate e conteúdo: ampliar os ensaios de alvo móvel/grupo/guarda/controle, completar cobertura de contrajogo de todas as fichas, ajustar os extremos das construções e revisar a repetição das estruturas de missões/mapas. Existência, contagem e conclusão técnica não aprovam variedade ou ritmo.
5. Checklist: os 116 critérios globais permanecem uma matriz de aceite com evidências parciais. Não foram todos marcados como concluídos. O relatório do auditor registra os retestes independentes até seu último hash; os testes finais posteriores foram executados pelo agente principal.

## Jogar e preservar a jornada

Baixe o `.html` pelo link de download e abra com um navegador que execute JavaScript/Canvas, ou use o Site do proprietário. O arquivo contém imagens, sons, animações, dados e código; não depende de pastas auxiliares. O Site conserva seu público anterior.

Para mudar de versão, navegador ou aparelho, use **Pausa → Salvar e importar → Baixar jornada .json** e importe a cópia no destino. A versão v5 usa esquema e catálogo identificados e preserva a chave antiga ao migrar. Diferentes aplicativos de visualização podem tratar armazenamento de arquivos de modo diferente.

## Créditos

História, código, mapas e direção visual preparados para este projeto. Ilustrações originais geradas com ferramentas OpenAI e organizadas em atlas, preservadas no HTML. Efeitos sonoros: [Kenney RPG Audio](https://kenney.nl/assets/rpg-audio), licença [CC0](https://creativecommons.org/publicdomain/zero/1.0/); sino sintetizado em Web Audio. Esta versão não usa os modelos KayKit das primeiras experiências 2.5D.
