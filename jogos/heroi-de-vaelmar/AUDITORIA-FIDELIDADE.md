# Herói de Vaelmar — auditoria de fidelidade (base: APK 4.4.0)

Comparação entre o APK 4.4.0 e o que é verificável do **Hero of Aethric** original. Cada linha diz de onde veio a informação do original e o que o clone faz hoje. Nada aqui vem do cliente comercial: ele não foi extraído e não será.

**Referências usadas até agora**

- Capturas oficiais da [App Store](https://apps.apple.com/us/app/hero-of-aethric-dungeon-mmorpg/id1645196122), de 2022–2023. Podem estar desatualizadas em relação à versão atual.
- Textos oficiais do [blog da Northern Forge](https://blog.ornarpg.com/introducing-northern-forge-studios-next-title/) e das [notas de versão](https://aethric.com/releases/).
- Os dados do Codex e as capturas que o usuário enviou em sessões anteriores, já incorporados ao APK.

Legenda de certeza: **A** = visto numa imagem/texto oficial · **B** = vem do APK ou de guia comunitário · **?** = não consegui confirmar.

## Mundo

| Tema | Original | Clone 4.4.0 | Certeza |
|---|---|---|---|
| Geração do mapa | Mundo aberto de pixel art desenhado à mão pela equipe | Grade 160×160 gerada por ruído (`genWorld`), com regiões traçadas à mão sobre um mapa comunitário (`world.regions`, `mask`) | A / B |
| Vilas | Exploráveis: em Loton há várias casas brancas de telhado vermelho, caminhos de terra, NPCs parados ou andando, cachorro, flores | Cada cidade é um único sprite; tocar abre um menu | A |
| Paleta e luz | Dia claro, verde saturado, contornos escuros nas árvores, caminhos bege com borda | Dia aceitável, mas a textura é de manchas de ruído; à noite escurece e aparece fogueira/lanterna | A |
| Ciclo dia/noite | O mostrador circular existe no canto superior direito. Se o mapa escurece à noite, **?** | Noite nos minutos 25–45 de cada hora do relógio real | ? |
| NPCs e animais | Pessoas e animais circulando nas vilas | Só monstros circulam | A |
| Mapa-múndi | Continente detalhado (neve ao norte, deserto ao sul, vulcão a sudoeste) | Mapa colorido grosseiro, derivado de polígonos | A |
| Origem (vila do jogador) | Construção com cursor "toque no mapa para posicionar" e diálogo do NPC | Há menu de construção, sem posicionamento no mapa | A |

## Interface do mundo

| Tema | Original (App Store, 2022–23) | Clone 4.4.0 | Certeza |
|---|---|---|---|
| Coluna esquerda | Quadrados pequenos: Sair da área, mochila (com contador), Chat, Missões, Redefinir câmera | Cinco botões redondos grandes: Recompensas, Origem, Portais, Desafio, Masmorra | A |
| Topo | Nome da área, pequeno, centralizado; barra fina de XP na borda superior | Nome grande com estrelas e faixa de nível, mais a linha da missão | A |
| Missões | Lista curta no canto superior direito ("Defeat Goblin (3)") | Uma linha sob o título | A |
| Barra inferior | Não aparece nas capturas antigas | Cinco botões redondos (Codex, Missões, herói, Itens, Mapa) | ? |
| Câmera | Botão "Redefinir câmera" sugere arrastar/girar | Câmera fixa seguindo o herói | A |

> A interface atual do original pode ser diferente da de 2022. As capturas enviadas pelo usuário em sessões anteriores guiaram a barra inferior do clone. **Preciso das capturas atuais para decidir qual dos dois layouts seguir.**

## Combate

| Tema | Original | Clone 4.4.0 | Certeza |
|---|---|---|---|
| Cabeçalho | Barra de HP larga do chefe, nome, dano total causado, nível e link para o Codex | Cartão pequeno com nome, nível e barra | A |
| Registro | Log de combate no canto superior direito, colorido por quem agiu | Caixa de histórico dentro do painel inferior | A |
| Ordem de turnos | Fila de retratos no topo | Não há | A |
| Tamanho e posição | Sprites grandes no centro da tela, grupo à esquerda e inimigos à direita, com barras de HP/mana individuais e setas de buff/debuff por atributo | Sprites pequenos sobre fundo pintado, uma ficha só do herói | A |
| Comandos | Grade de botões grandes com habilidades e poções | Cinco botões: Atacar, Habilidades, Itens, Defender, Fugir | A |
| Tela de encontro | **?** | Tela cheia "Monstro / Drops / Batalha / Codex" (veio de captura do usuário) | B |

## Menus

| Tema | Original | Clone 4.4.0 | Certeza |
|---|---|---|---|
| Abas do herói | Grupo, Inventário, Equipamento, Loja de Runas, Opções; Arena e Gauntlet também apareceram | Status, Inventário, Equipamento, Loja de Runas | A |
| Inventário | Barra lateral + grade de 3 colunas, ícone com anel de brilho conforme a qualidade, nome colorido, "Level N" embaixo, ouro e orns no topo | Barra lateral + grade de 2 colunas, ícone à esquerda do nome | A |
| Categorias | Novo, Curativos, Itens, Armas, Cabeça, Armadura, Secundário, Pernas, Acessórios, Amities, Materiais, Adornos, Outros | Já inclui essas e mais Relíquias, Moedas, Peixe, Lixo | A / B |
| Classes | Atual (vídeo do usuário, 28/10/2026): cabeçalho "Caminho do Mago · OMNIMANCIA" com setas para os caminhos vizinhos ("Bravura" à esquerda, "Magia das Sombras" à direita); linhas por tier com estrelas e "NÍVEL N"; silhueta nas classes bloqueadas; "Feitiços: N" e "Habilidades: N" em cada cartão; dois cartões lado a lado nas ramificações. Linha do Mago: Mago (1) → Arquimago (25) → Mago da Corte (50) → Mago-Espadachim ou Místico (75) → Druida (100) | O **layout** já copia o original, mas o **conteúdo é inventado**: 22 classes em 5 tiers (Soldado, Escudeiro, Aprendiz Arcano, Feiticeiro…), e os caminhos se chamam "Sabedoria" e "Astúcia" em vez de "Omnimancia" e "Magia das Sombras". O catálogo tem as 82 classes reais com tier, preço e habilidades, mas não diz quem leva a quem | A (vídeo) / B |
| Classes de 2022 | A grade de 3 colunas das capturas antigas não vale mais: o Druida estava no tier 3 e hoje está no 5 | A |

## Regras e progressão

O APK já registra suas lacunas em `FIDELIDADE.md` (HP de chefes, probabilidades de saque, afinidades, passivas, guildas, endgame, duplo empunhamento, ascensão). A maioria delas depende de dados que o original não publica. O que dá para melhorar vem de três fontes: o Codex, as notas de versão oficiais e capturas do jogo real. Sem isso, qualquer número novo seria invenção minha.

## O que não é possível

- **Mapa, tiles, arte de cenário e trilha sonora originais.** Estão no cliente comercial. Extraí-los para empacotar num clone seria copiar material protegido, e eu não faço isso. O que dá para fazer é recriar o *estilo* (paleta, proporções, tipo de vila, disposição da interface) com arte e layout próprios, guiado por capturas.
- **Fórmulas e probabilidades do servidor.** Não são públicas. Onde o clone usa um valor aproximado, ele deve continuar marcado como adaptação.
- **"100% idêntico".** Mesmo com todas as capturas, o limite é "muito parecido em aparência e comportamento", não cópia.

## Plano de trabalho (ordem proposta)

1. **Combate.** É a tela mais determinada pelas imagens oficiais e a que mais se repete no jogo.
2. **Inventário e demais menus.** Grade de 3 colunas com anéis de qualidade, tela de classes, cabeçalho com ouro/orns.
3. **Mundo.** Sistema de vilas desenhadas à mão (Loton primeiro): casas, caminhos, cercas, poço, lago, NPCs e animais circulando; paleta de tiles mais próxima da original.
4. **Regras.** Ajustes pontuais conforme as capturas e as notas de versão.

Cada etapa é validada com capturas lado a lado e com os testes de `tests/`.
