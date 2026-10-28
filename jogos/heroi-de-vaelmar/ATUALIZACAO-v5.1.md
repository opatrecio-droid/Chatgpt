# Herói de Vaelmar 5.1 — classes como no segundo vídeo

**5.4.0:** o começo da aventura, três regras do guia que não dependiam de você e as classes que faltavam.
- **Começo do jogo.** Uma aventura nova agora começa na **Cidade de Origem** (a oeste de Loton), como no mapa do vídeo 1, e a primeira linha de missão é «Encontre Escudeiro Samson em Loton.» (antes o herói nascia na porta de Loton e a linha mostrava «The Unfelled · Derrotar Rato»). Perder uma luta te acorda na cidade de origem até você visitar outra cidade. **Saves antigos não mudam**: para ver o novo começo, toque em **Começar aventura** (isso substitui o save atual; use *Exportar* em Opções antes, se quiser guardá-lo).
- **Elementos no equipamento.** Peça de armadura, mão secundária ou acessório com elemento (o Codex traz 288 itens assim) resiste àquele elemento (metade do dano). O elemento da arma **não** protege. O ataque básico e as habilidades físicas sem elemento passam a usar o elemento da arma, que também tem uma chance de causar o status dele (5%, número meu: o guia não diz qual é). Feitiço de dois ou mais elementos acerta o elemento a que o alvo é fraco.
- **Feitiços arcanos** (e os outros «Híbrido dinâmico») usam o maior entre magia e ataque.
- **Frascos de Mana e de Sangue em combate**, para as 18 classes que os têm: medidor azul/vermelho sob a barra de mana, botão **Frascos** no menu de batalha, carga por feitiço elemental (mais rápida na fraqueza e nos feitiços de dois elementos), 10 feitiços de frasco (Raio de Mana, Aumento de Mana, Tempestade Elemental, Inflexão, Repetição, Chamado da Natureza, Omniflask, Raio de Sangue, Necromancia, Banimento) e as 3 infusões. O turno extra (que esses feitiços e a Avidez dão) agora existe.
- **Classes que estavam borradas** no vídeo 2 foram relidas: 38 classes têm agora texto, armas, slots e linha de bônus do jogo.
- O que ficou fora e por quê: Marca Alinhada, Tempestade de Marca, Gotejamento de Mana e Perda de Sangue (sem texto ou dependem de Marcas), e as cargas exatas (aproximação marcada em [REGRAS-OBSERVADAS.md](REGRAS-OBSERVADAS.md)).

**5.3.0:** regras tiradas de cinco vídeos-guia da comunidade (detalhes e o que ficou pendente em [REGRAS-OBSERVADAS.md](REGRAS-OBSERVADAS.md)): fraqueza passa a dobrar o dano (era ×1,5); o dano recebido do seu elemento de facção cai 25% (era 20%); números **azuis** na fraqueza e **vermelhos** no dano resistido; **+5% de ataque e magia** com arma do tipo preferido da classe; a linha de bônus do detalhe da classe agora compara com a classe que você está usando. Mudam um pouco o equilíbrio das lutas: monstros fracos ao seu elemento morrem mais rápido.

**5.2.0:** o quarto caminho, **Valhala** (Caminho do Adestrador), existe: Treinador → Adestrador de Lobos → Adestrador de Espíritos → Dragão → Grande Dragão → Frei → Bahamute → Beowulf, do nível 50 ao 225. Os caminhos agora formam uma fila como no original (Bravura › Omnimancia › Magia das Sombras › Valhala), com a seta apagada nas pontas.

**5.1.2:** todo o texto em inglês das telas de classe foi traduzido para o português (descrições de habilidades e passivas, rótulos de bônus, nomes de status e de passivas). Ficam como o jogo escreve só os nomes próprios de feitiços (Infernus Mire, Tidal Stormflare, Gale Volcanis, Ultima…). Os nomes de passivas que não apareceram no vídeo (Passo de EXP, Caminho de Valhalla, Invocador Novato…) são tradução minha, sem texto de descrição.

**5.1.1:** as páginas de habilidades, passivas e frascos agora mostram **o texto do próprio jogo**, lido nos quadros do vídeo (301 habilidades e 62 passivas, incluindo os textos que o jogo deixa em inglês). Também entraram o texto, as armas, os slots e os bônus de mais 8 classes (Escudeiro, Templário, Paladino, Magistrado, Mago-Espadachim, Dragão, Frei, Gatuno e Guerreiro).

Esta versão usa o **segundo vídeo** do jogo original (v3.27.3, caminhos de classe e telas de detalhe). Detalhes: [ESPECIFICACAO-TELAS.md](ESPECIFICACAO-TELAS.md). O que ainda é aproximação está em [AUDITORIA-FIDELIDADE.md](AUDITORIA-FIDELIDADE.md). A 5.0 continua descrita em [ATUALIZACAO-v5.0.md](ATUALIZACAO-v5.0.md).

## O que mudou

**Caminhos de classe — agora sem inferência**
- Mago e Ladrão completos, tiers 1–10, com os nomes e a ordem do jogo: Mago → … → Tecelão de Feitiços → **Arquidruida | Paladino** → Necromante → Ominimante → Herege. Ladrão (Magia das Sombras) → Gatuno → Ladino → Feiticeiro das Sombras → **Místico | Adepto** → Majestoso → Feiticeiro das Sombras → **Magistrado | Arquidruida** → Arcânico → Nyx → Viajante de Domínios.
- As descrições dos cartões e as contagens de feitiços/habilidades conferem com o vídeo em todos os cartões.

**Detalhe da classe (novo)**
- Tocar num cartão abre a tela cheia do original: estrelas, nome grande, sprite, descrição, armas preferidas, slots, **linha de bônus de atributos** (`HP −105 Mana +81 …`), botões `HABILIDADES/FEITIÇOS`, `PASSIVAS` e `FRASCOS DE MANA`.
- Páginas internas com a lista de habilidades (descrição do jogo, nível, mana, «Poder» calculado com os seus atributos), passivas (com os bônus do Codex) e frascos de mana.
- Classe disponível: botão verde **SEGURE PARA DESBLOQUEAR** (a barra enche em 1 s) e `Custos: N orns`. Classe já sua: `USAR CLASSE`. Classe bloqueada: `Requer nível N`.

**Números**
- 11 classes (Mago, Místico, Druida, Lanceiro/Adepto, Tecelão, Arquidruida, Ominimante, Feiticeiro das Sombras, Adestrador de Lobos, Grande Dragão, Beowulf) passaram a ter os bônus de atributos que o vídeo mostrou, para um herói de nível 17. O Soldado de Infantaria ficou sem bônus, como no vídeo. As demais continuam com o multiplicador genérico do clone.

## O que continua diferente

- Habilidades e passivas que **não** apareceram no vídeo (cerca de 70 das classes dos três caminhos e quase todas as de Valhalla por dentro) usam um texto montado a partir dos dados do Codex. O «Poder» é uma estimativa (ataque ou magia × poder / 1000 × 1,16).
- Texto longo, armas e slots da classe: só para as classes que o vídeo mostrou com nitidez; as outras usam um texto curto gerado.
- Continuam valendo as diferenças da 5.0 (menu principal incompleto, câmera livre, abas de opções, combate em grupo, servidor).

## Instalação

Igual à 5.0: pacote `com.vaelmar.offline5`, instala ao lado da 4.4.0 e **atualiza a 5.0** por cima (mesma chave de assinatura de teste, versão 5.1.0). O progresso é mantido.
