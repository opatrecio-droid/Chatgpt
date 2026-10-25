# Ecos do Horizonte — Vale Ilustrado 2D 3.2

RPG solo em português para jogar no celular, com cenário, personagens, criaturas, retratos e equipamentos em **2D ilustrado**. O jogo inteiro fica em **um único HTML de aproximadamente 17,5 MB**, incluindo imagens, animações, efeitos e áudio. Não precisa de pastas adicionais para jogar offline.

- [Baixar diretamente o HTML 2D 3.2](https://github.com/opatrecio-droid/Chatgpt/releases/download/ecos-do-horizonte-v3.2.0/ecos-do-horizonte-v3.2.html).
- [Jogar no navegador](https://ecos-horizonte-mobile.patrecio.chatgpt.site) — hospedagem da conta proprietária.
- [Versão anterior 3.1](https://github.com/opatrecio-droid/Chatgpt/releases/download/ecos-do-horizonte-v3.1.0/ecos-do-horizonte-v3.1.html).

## Jornada Viva · v3.2

A revisão foi orientada por referências da Riot Games, Game Accessibility Guidelines, MDN, web.dev e Ian Schreiber, com pesquisa, diagnóstico e critérios de aceite registrados no [plano detalhado e resultados](plano-evolucao-v3.2.md).

- **Treino de combate:** acessível pelo menu nos povoados, com alvo, contador de dano e ataques opcionais para praticar aparos. Não dá recompensas e preserva local e recursos ao sair ou recarregar.
- **Combate mais claro:** selecionar um inimigo por toque não desloca o herói; a mira exige alvo visível, e habilidades de projétil não gastam energia sem alvo válido. Avisos de ataque têm contorno e indicação do tipo de perigo.
- **Jornada com direção:** campanha em etapas, próximos marcos, pedidos acompanháveis, recursos e torres como destinos e atividades de preparação antes dos guardiões.
- **Equipamentos:** comparação de dano por golpe e de dano por segundo estimado, levando em conta a velocidade da família de arma e a sequência de três golpes.
- **Saque protegido:** a mochila cheia preserva equipamento e reserva de todos os heróis. Últimos achados mostra peças guardadas ou convertidas em fragmentos.
- **Fronteiras:** ameaças em controles grandes, três rotas, escala aplicada às salas e ao chefe, recordes e recompensa única de conclusão.
- **Conforto:** cache limitado de imagens e luz, fundo estático nos menus e ajustes de contraste e números de combate.

O plano inclui os resultados completos, as fórmulas e as limitações de desempenho. Os testes usam Chromium com toque simulado, sem aparelho físico. Sob CPU bastante reduzida, o combate continua sendo o principal limite de fluidez; não há garantia de 60 FPS em celulares.

## Painel do herói · preservado da v3.1

Toque no retrato de Ari no canto superior esquerdo para abrir o painel **Herói**. A aba **Equipamentos** exibe o personagem em corpo inteiro, seis espaços de armadura ao redor dele, arma principal, reserva, atributos e conjuntos. Toque em uma peça para comparar, equipar, melhorar ou remover. A **Mochila** reúne busca por nome, tipo ou conjunto, filtros e ordenação.

Na aba **Heróis**, selecione Guardião, Errante, Tecelão ou Pactário e toque em **Jogar com…**. O botão permanece visível no celular. A seleção inicial também funciona ao continuar uma jornada salva. A campanha, nível, recursos e descobertas continuam; cada herói guarda sua especialização, modificadores, talentos, equipamentos e reserva. A troca exige sair de combate e preserva a proporção de vida e energia.

Um herói ainda não usado recebe uma arma inicial de sua família quando necessário, mesmo com a mochila cheia. Essas armas ficam vinculadas e não ocupam os 36 espaços normais. A reciclagem preserva equipamentos e reservas de todos os heróis.

## Vale Ilustrado 2D

A vila recebe casas, mercado, oficina, árvores, flores, ruínas e cristais desenhados. Os nove biomas têm vegetação e rochas próprias: palmeiras no deserto, mangues nas raízes, pinheiros da costa, árvores de cinzas na Forja e copas violetas no Eclipse. Os materiais de grama, terra, areia e pedra seguem a mesma pintura.

Ari tem desenhos direcionais de caminhada, repouso e ataque para as seis famílias de armas. Há visuais de cavaleiro, lâmina longa, montante, adagas, besta, cajado e Pactário. Os inimigos terrestres têm animações e silhuetas próprias: cão de raízes, orc, arqueiro ossário, guardião de pedra, escaravelho de cristal, cogumelo e draco. Espíritos, invocações e guardiões completam o bestiário. Mira, Taren, Dália e Iara têm desenhos próprios, incluindo retratos nas conversas.

As 16 habilidades preservam seus efeitos de classe: cortes e lâminas celestes, flechas e folhas, fogo e tempestades, marcas e correntes espectrais. Ícones de habilidades e equipamentos, barras de vida e menus acompanham a interface em azul-petróleo e dourado.

## Jogar no celular

Mova com o direcional à esquerda. Segure **Atacar** para repetir golpes. As quatro habilidades ficam em arco ao redor do ataque no canto inferior direito, junto à defesa, esquiva e golpe pesado. A cura fica acima do direcional esquerdo. Perto de uma pessoa, baú ou recurso, o botão de interação ocupa o lugar do golpe pesado.

É possível mover e usar habilidades ao mesmo tempo. **Menu → Ajustes → Controles por toque** oferece os tamanhos Menores, Padrão e Maiores. A câmera pode ser ajustada pelos botões − / + do minimapa. O jogo se adapta ao celular deitado ou em pé; deitado oferece mais espaço para os dois polegares. Os menus pausam o combate.

Comece conversando com Mira. Liberte o acampamento, abra o primeiro tesouro e equipe a arma rara recebida. O painel de objetivo e o rastro dourado indicam o próximo passo. As habilidades despertam nos níveis **1, 2, 4 e 6**.

## Mundo, combate e progressão

O mundo tem 240 × 240 células, nove regiões, nove povoados, 64 acampamentos e nove entradas de masmorras. O atlas permite ampliar, arrastar, marcar destinos e viajar entre Âncoras restauradas. Masmorras têm salas conectadas, tesouros, interruptores e um guardião.

Quatro classes recebem especializações no nível 8, modificadores no 15 e bônus de Mestre no 24. Há talentos, seis famílias de armas, sete espaços de equipamento, quatro conjuntos, atributos adicionais, melhorias, forja e mercado. O combate inclui sequências de três golpes, ataques pesados, vigor, esquiva, defesa, aparo, postura e reações elementais.

Ari e Nimbo precisam restaurar três Âncoras e interromper a máquina de Veyr, que apaga aldeias para sustentar outras. Após a campanha, expedições podem ser repetidas indefinidamente. Depois do nível 60, o Legado continua; os bônus de combate têm limite para preservar o equilíbrio.

## Seu progresso

O jogo salva neste navegador. Use **Ajustes → Exportar** para guardar uma cópia JSON e **Importar** para mudar de aparelho, navegador ou arquivo. **O progresso das versões 2.x, 3.0 e 3.1 continua compatível.** Ao trocar de arquivo, exporte o progresso na versão antiga e importe na nova se o navegador não compartilhar o salvamento local. Masmorras e expedições retomam na entrada do mundo ao reabrir.

Se o visualizador de arquivos do aparelho não executar JavaScript, use o link de jogo no navegador.

## Validação

Verificações em Chromium com toque simulado: controles em sete tamanhos de tela e três perfis, movimento com habilidades simultâneas nas quatro classes, poses em oito direções, 16 habilidades, nove biomas, sequência inicial, menus, equipamentos, forja, mercado, campanha, masmorras, Legado, importação e funcionamento offline. Na v3.1, foram verificados ainda o painel do retrato, quatro heróis, evolução e equipamentos individuais, seleção ao continuar, mochila cheia, reciclagem protegida e migração de um salvamento real da v3.0. Sem teste em aparelho físico.

## Arte e áudio

As ilustrações 2D foram criadas para este projeto com a ferramenta de geração de imagens da OpenAI. Os desenhos foram organizados em atlas de sprites e integrados às animações do jogo. Esta edição usa os novos sprites ilustrados no lugar dos modelos renderizados das versões 2.x.

Áudio: [Kenney — RPG Audio](https://kenney.nl/assets/rpg-audio), sob [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/). Os créditos também ficam em **Ajustes → Arte, áudio e bibliotecas**.
