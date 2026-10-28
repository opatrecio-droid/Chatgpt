# Herói de Vaelmar 5.0 — fidelidade ao Hero of Aethric v3.27.3

Esta versão foi refeita a partir de uma **gravação de tela do jogo original** (v3.27.3, 28/10/2026) enviada pelo usuário. Tudo que está aqui foi visto no vídeo, medido nele, ou vem dos dados do Codex já embutidos. O que foi **inferido** vem marcado. Detalhes das telas: [ESPECIFICACAO-TELAS.md](ESPECIFICACAO-TELAS.md).

## O que mudou

**Combate**
- Tela refeita: fila de iniciativa no topo, barra larga do chefe com `170 / 170`, nome em versalete, nível e atalho para o Codex, registro de combate no canto superior direito, faixa com a ação do ator, atalho de poção quando falta mana ou vida, grade de comandos 2 × 3 (habilidade rápida, Ataque, Defender, Habilidade, Fugir, Item).
- Barras de HP e mana sob cada sprite, números de dano amarelos, rótulos de status em português (`Atordoado`, `Envenenado`…).
- Frases do registro como no original: `… atacou!`, `… usou Envestida!`, `… Mas errou!`, `… Golpe crítico!`, `… não pode atacar!`.

**Classes**
- Telas de Caminhos como no vídeo: **Bravura**, **Omnimancia** e **Magia das Sombras**, com uma classe por tier e dois cartões nas ramificações, silhuetas das classes bloqueadas, estrelas coloridas, "NÍVEL N" e as contagens reais de feitiços/habilidades do catálogo.
- Verificado no vídeo: Guerreiro (tiers 1–10) e Mago (tiers 1–5). **Inferido** pelo campo de equipamentos do catálogo: o restante do Mago e todo o Ladrão. A classe "Adepto" do Guerreiro (tier 4) foi associada ao Lanceiro do catálogo.

**Mundo**
- Terreno redesenhado: grama lisa com tufos e flores, massas densas de pinheiros em grade alternada com fileira de troncos, trilhas bege estreitas com contorno. Acabaram as manchas de terra.
- Vilas com construções oficiais do catálogo (loja, prefeitura, ferreiro, estalagem, residências…), que bloqueiam o caminho, praça com fogueira, moradores e cachorro circulando.
- Tocar num monstro longe mostra `Aproxime-se para desafiar este monstro`. Tentar entrar numa área de nível alto mostra `Você não está pronto para se aventurar.` Sem névoa preta.
- Nome da área pequeno no topo e linha de missão centralizada.

**Mapa e opções**
- Mapa-múndi com névoa de exploração: fundo cinza, só o que você já viu aparece em bege hachurado, rótulos em versalete espaçado, cartão "Cidade" nas vilas, arrastar e pinçar, botões ✕ e ◇ (centralizar) e aba lateral com as viagens. A exploração fica no save.
- Opções com as abas Jogabilidade, Gráficos, Personagem e Notificações. Funcionam: efeitos sonoros, música, desativar música de batalha, controles **Simples** ou **Joystick**, modo canhoto (joystick passa para o lado esquerdo), contador de FPS, animações reduzidas.
- Menu principal com a entrada Patreon (abre um aviso: precisa de internet).

**Números (lidos no vídeo)**
- Guerreiro nível 12: HP 220, mana 27, ataque 25, defesa 21, magia 6, resistência 18, destreza 16, iniciativa 24. O crescimento até o nível 24 segue esses pontos; acima disso mantém o ritmo anterior para não desequilibrar a masmorra automática, a arena e a economia.
- Iniciativa = 1,5 × destreza.
- Lorde Goblin nível 8: 170 de HP.
- A tabela de XP comunitária bate exatamente com o vídeo (nível 12: 10.241 de XP total, 65 para o próximo).
- Nome inicial gerado no formato do original (`WildViciousMaverick239`).

## O que continua diferente

- Menu principal: faltam `Aparência`, `Caminhos Arcanos` (função desconhecida) e `Feitos`. Opções: não há câmera livre nem câmera invertida (o vídeo não mostrou o efeito), vibração, nem as abas Gráficos/Personagem/Notificações com o conteúdo do original (só a aba Jogabilidade foi vista).
- Caminho do Ladrão e Mago acima do nível 100: precisam de um vídeo desses trechos para sair da inferência.
- Combate: a ordem de turnos mostra a ordem real do motor (herói, aliados, inimigos); o original ordena por iniciativa. Habilidades de grupo e combate em grupo não foram vistos no vídeo.
- Arte do terreno, das construções e dos sprites: usa as imagens do Codex já embutidas e arte própria; não é o mapa nem os tiles do cliente comercial.
- Tudo que depende de servidor (chat, reinos, loja com dinheiro real, aparências pagas) não existe no modo offline.

## Instalação

O APK novo usa **outro identificador de pacote** (`com.vaelmar.offline5`, nome "Herói de Vaelmar 5") e uma chave de assinatura nova. Ele **instala ao lado** da versão 4.4.0, sem apagar o progresso dela.

Para levar o progresso: na versão antiga, Opções → Exportar save; na nova, Opções → Importar save. Os saves são compatíveis.

A chave de assinatura é uma chave de teste, incluída em `tools/chave-debug/` só para que as próximas versões possam atualizar esta por cima. Não proteja nada importante com ela.
