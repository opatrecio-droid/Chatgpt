# Especificação das telas do Hero of Aethric (versão atual)

Fonte: gravação de tela enviada pelo usuário, `Screen_Recording_20261028_155327_Aethric.mp4` (6 min 24 s, 1080×2408, jogo em português do Brasil, versão **v3.27.3**, personagem Guerreiro nível 12 chamado `WildViciousMaverick239`). Os tempos entre parênteses são aproximados. O vídeo não está no repositório.

Tudo abaixo foi **visto no vídeo**, salvo onde marcado como *(inferido)*. Medidas são proporções da largura da tela.

## Combate (1:20 e 5:10–5:40)

De cima para baixo:

1. **Fundo pintado de tela cheia** (campo de grama, estrada de terra, céu). Sem moldura.
2. Canto superior esquerdo: botão **Bate-papo** (balão + texto, caixa escura pequena).
3. Canto superior direito: **fila de iniciativa**, seis retratos redondos em linha (o do ator da vez em destaque, amarelo), e à direita um botão redondo com setas ↑↓ que abre/fecha a lista.
4. **Barra de HP do inimigo** em largura total, vermelha, com o texto `170 / 170` no centro. Em chefes é a barra principal; nos monstros comuns a barra fica sob o sprite.
5. Abaixo: nome do inimigo em versalete (`LORDE GOBLIN`), `Nível 8` e link `Codex` com ícone de livro.
6. **Registro de combate** no canto superior direito, texto alinhado à direita, sem caixa, com sombra. A linha mais recente é branca e em negrito; as anteriores ficam esmaecidas. Falhas em laranja/vermelho. Frases vistas:
   - `<jogador> atacou!` · `<jogador> usou Envestida!` · `<jogador> usou Poção Pequena de Mana!`
   - `Lorde Goblin usou Geada!` · `… usou Faísca!` · `… usou Terremoto… Mas errou!`
   - `<jogador> não pode atacar!` · `<jogador> está mais atordoado!` · `<jogador> atacou… Golpe crítico!`
7. **Caixa de ação**: cartão escuro com borda clara, duas linhas (`Lorde Goblin` / `Geada`), aparece sob o nome do inimigo quando ele age e some depois.
8. Meio da tela: **herói à esquerda, inimigos à direita**, sprites pequenos (cerca de 15% da largura). Sob o herói, duas barras com moldura metálica: HP (vermelha, número dentro, ex. `220`) e mana (azul, ex. `7`). Rótulo de estado ao lado do herói (`Atordoado`, com ícone). O sprite ganha brilho azulado quando congelado/atordoado.
9. **Números de dano** em amarelo, flutuando no centro (`22`, `29`, `8`).
10. **Atalho de poção**: caixa pequena acima da grade, à direita, com ícone e nome (`POÇÃO PEQUENA DE MANA`).
11. **Grade de comandos 2 × 3**, ocupando o quarto inferior, botões marrom-escuros translúcidos com borda clara e texto em versalete:

    | | |
    |---|---|
    | `ENVESTIDA` (habilidade equipada; mostra `20 MANA` no canto, esmaecida se faltar mana) | `ATAQUE` (ícone de espada) |
    | `DEFENDER` | `HABILIDADE` (abre as demais habilidades) |
    | `FUGIR` (ícone) | `ITEM` (ícone de poção) |

A tela de encontro (0:56, 1:20, 6:08) já existe no clone: escurecida, `Rato / Nível 4`, sprite com barra vermelha, botão verde `BATALHA`, `Drops` (`???` ou o item conhecido), `Codex`, `Você está pronto para a batalha.`, botão ✕ redondo embaixo.

## Mundo (0:00, 4:56–6:16)

- Terreno de tiles: floresta densa verde-escura com contorno, caminhos bege sinuosos, grama clara, árvores mortas, casebres. Escurece à noite (o mostrador no canto mostra estrelas).
- **Canto superior esquerdo**: botão redondo com contador (`0`) e, abaixo, **Bate-papo** (balão). Depois de liberar a Árvore Astral surge um terceiro, `Árvore Astral` com o contador `5`.
- **Topo centro**: nome da área (`BOSQUES DE LOTON`) ou, perto de algo interativo, o nome do objeto (`PLACA`).
- Abaixo do nome, uma linha de missão com ícone do NPC: `Encontre Escudeiro Samson em Loton.`
- **Canto superior direito**: mostrador circular do dia/noite, e à esquerda dele ícones de buffs.
- Dicas ao chegar perto: caixa escura `PLACA / Aperte para ler`; placa direcional `Svarga →`.
- Avisos em faixa no topo: `Aproxime-se para desafiar este monstro` (faixa marrom-avermelhada) e `Você não está pronto para se aventurar.` (faixa escura).
- **Barra inferior**: CODEX · MISSÕES · retrato do herói com barras de HP/mana · ITENS · MAPA. (O clone já tem.)
- Modais de progressão: `THE ASTRALTREE` (painel marrom-escuro, imagem, texto, botão verde `CONTINUAR`), `Missão Concluída` com recompensas (`400 ouro`, `150 orns`, `510 experiência`, `Astralseed`). Toasts de conquista: `Conquista desbloqueada!`, `Monster Slayer I · Rara · 500 XP`.

## Mapa-múndi (0:08–0:20)

Fundo cinza-escuro. **Só o que você já explorou aparece**, em bege hachurado; o resto é cinza liso. Rótulos em versalete espaçado (`BOSQUES DE LOTON`, `CIDADE DE ORIGEM`, `LOTON`, `LOCAL DE DESCANSO`), com um cartão `Cidade` + nome ao enquadrar uma cidade. Pontos de evento (`GIANT PUMPKIN`, `HAUNTED HOUSE`, `REFÚGIO DO DULLAHAN`) aparecem como halos brancos difusos. Pode ser arrastado. Controles: ✕ e um botão de centralizar, embaixo; aba com seta `›` na borda esquerda.

## Menu principal (0:24, 3:44)

Lista no alto: `Menu Principal`, `Discord`, `Patreon`, `Codex`, `Obter ajuda`, `Opções`, `Centro de Eventos`; botão `CAIXA DE ENTRADA` no canto; moedas no topo (`4.333` orns, `4.572` ouro); contadores de eventos com cronômetro.
Embaixo, círculos em arco (de cima para baixo, esquerda para direita):

1. `Aparência` · `Loja de Runas` · `Caminhos Arcanos` · `Feitos`
2. `Mudar Classe` · `Inventário`
3. `Habilidades` · `Status` (com `Nível 12 ★`) · `Equipamento`

## Status (2:56–3:20)

Cabeçalho com moedas e quatro abas (`Status`, `Inventário`, `Equipamento`, `Loja de Runas`) sobre paisagem pintada. Faixa com o sprite do herói, o nome grande em versalete e `Guerreiro · ★`. Quatro ícones: `Mudar Classe`, `Mudar Equipamentos`, `Trocar habilidades`, `Seguidor` (esmaecido).
Caixa `Atributos` (título sobre a borda): `EXPERIÊNCIA` (XP total) `10.241` · `PRÓXIMO NÍVEL` (XP que falta) `65` · `HP` 220 · `MANA` 27 · `ATAQUE` `(+1)` 25 · `DEFESA` 21 · `MAGIA` 6 · `RESISTÊNCIA` 18 · `DESTREZA` 16 · `INICIATIVA` 24 · `CHANCE DE ACERTO CRÍTICO` 5% · `DISTÂNCIA DE VISÃO` 180 metros, cada um com botão `?`. Abas `Mundo | PvP`.
Caixa `Efeitos passivos`: `Dano Colateral` (Chance +10% / Dano +15%), `Proficiência em Armas` (Poder da Arma +5%), e efeitos de evento com cronômetro. Depois, `Equipamento`.

**Números reais (Guerreiro nível 12, Espada Enferrujada e Jaqueta de Couro):** HP 220, mana 27, ataque 25, defesa 21, magia 6, resistência 18, destreza 16, iniciativa 24, crítico 5%, visão 180 m. O XP confere com a tabela embutida (`nextTotal` do nível 12 = 10.306).

## Classes — «Caminhos» (3:04–3:20)

Cabeçalho: `Caminho do Guerreiro` + nome do caminho com emblema (`BRAVURA`); setas `‹ ›` com o caminho vizinho embaixo do ícone (`Omnimancia`). Ordem: **Bravura (Guerreiro) ‹ Omnimancia (Mago) › Magia das Sombras (Ladrão)**.
Cada tier: estrelas à esquerda e `NÍVEL N` à direita, depois cartão(ões). Cartão: sprite (silhueta se bloqueada), nome em versalete, descrição, e em baixo `[espada] Habilidades: N` + `[faísca] Habilidades: M` (para conjuradores, `[cajado] Feitiços: N`). Ramificações mostram dois cartões lado a lado, só com sprite e nome, e dois ícones pequenos no canto. A classe atual tem borda azul; a selecionada na lista, borda vermelha. Entre tiers, uma seta dupla `︾`.
Tiers: nível 1, 25, 50, 75, 100, 125, 150, 175, 200, 225. Estrelas: 1–4 brancas/douradas; 5 verde, 6 azul, 7 roxa, 8 vermelha, 9 rosa, 10 laranja.

**Caminho do Guerreiro (visto):** Guerreiro (1) · Soldado de Infantaria (25) · Escudeiro (50) · **Adepto | Mago-Espadachim** (75) · Cavalaria (100) · Templário (125) · **Paladino | Magistrado** (150) · Vanguarda do Atlas (175) · Guarda Titânico (200) · Gilgamés (225).
**Caminho do Mago (visto até o nível 100):** Mago (1) · Arquimago (25) · Mago da Corte (50) · **Mago-Espadachim | Místico** (75) · Druida (100).
O caminho do Ladrão e o final do caminho do Mago **não apareceram** no vídeo.

Os números dos cartões batem com o catálogo: Guerreiro 3/1, Soldado de Infantaria 6/2, Escudeiro 6/2, Cavalaria 7/3, Templário 5/3, Vanguarda do Atlas 11/5, Guarda Titânico 9/5, Mago 9/1, Arquimago 8/2, Mago da Corte 8/2, Druida 11/4.

## Inventário e equipamento (3:28–3:52, 2:40)

Inventário: busca `Procurar…`, ordenação `Padrão ▾`, botão verde `MAIS`, alternância grade/lista. Barra lateral: Novo, Curativos, Itens, Armas, Cabeça, Armadura, Secundário, Pernas, Acessórios, Relíquias, Materiais, Adornos, Moedas, Peixe, Outros, Lixo. Itens: ícone com cadeado se bloqueado, nome abaixo. Detalhe do item: nome na cor da qualidade, descrição, linha de atributos com diferença (`Mana: 12 (+12) · Atq: 0 (−5) · Mag: 29 (+29)`), `TIPO`, `ADQUIRIDO`, `CATEGORIA`, `UTILIZÁVEL POR`, `MATERIAIS`, botões `RENOMEAR`, `BLOQUEAR`, `MARCAR COMO LIXO`, `ENVIAR PARA ARMAZÉM`, `SOLTAR`, `DESMANTELAR`, `ABRIR EQUIPAMENTO`.
Equipamento: abas `Padrão | Masmorra | PvP | Incursões`; slots `CABEÇA`, `ARMA`, `TRONCO`, `ACESSÓRIO #1`, `PERNAS`, `ACESSÓRIO #2` ao redor do herói; `Espada Enferrujada · Atq: 5`, `Jaqueta de Couro · Def: 5 Res: 2`.

## Codex, opções, título e outros

- **Codex**: cartões com ícone, título e descrição: Informações básicas e tutoriais · Tópicos avançados · Modos de jogo e atividades · Monstros · Seguidores · Construções · Guildas · Efeitos de status (buffs e debuffs) · Incursões · … e NPCs (grade de silhuetas `???` com estrelas de tier).
- **Opções**: abas `Jogabilidade | Gráficos | Personagem | Notificações`; idioma; `Efeitos sonoros`, `Música`, `Desativar música de batalha`; controles `Simples` (toque no mapa) ou `Joystick`; câmera `Normal` / `Invertida` / `Livre`; `Modo canhoto`; `FPS`; vibração.
- **Título**: cartões `JOGAR`, `REINOS`, `LOJA DE RUNAS`, `RECRUTAMENTO DOS LIBERTOS`, `OPÇÕES`, `MENU DE TÍTULO`, rodapé `© Northern Forge Studios Inc, 2026 · v3.27.3`.
- **Masmorra (1:04)**: `★★★ REFÚGIO DO DULLAHAN`, descrição, `Dificuldade: Normal`, `Chave do Labirinto (5)`, botão `SEGURE PARA ENTRAR`, `+ Opções de Batalha`.
- **Loja de Runas** e **Aparência** (auras, sprites, flairs, títulos): existem, mas vendem pacotes por dinheiro real. Não serão reproduzidos como compra; só a estrutura de abas.
- Nome padrão do personagem: gerado, no formato `AdjetivoAdjetivoSubstantivo` + número (`WildViciousMaverick239`).

## O que o vídeo não mostrou

Caminho do Ladrão; Mago a partir do nível 100; Guerreiro no nível 225; seguidores; guildas; arena; torres; incursões; vila de origem em construção; interior de Loton; combate com habilidades abertas; combate em grupo; menu de itens do combate.
