# Ecos do Horizonte — Rumos 2.2

RPG solo 2.5D em português, com controles por toque e mundo aberto. Imagens, animações, áudio, estilos e código ficam incorporados em **um único HTML**.

- [Baixar diretamente o HTML 2.2](https://github.com/opatrecio-droid/Chatgpt/releases/download/ecos-do-horizonte-v2.2.0/ecos-do-horizonte-v2.2.html).
- [Jogar no celular pelo navegador](https://ecos-horizonte-mobile.patrecio.chatgpt.site) — hospedagem da conta proprietária.
- [Versão anterior 2.1](https://github.com/opatrecio-droid/Chatgpt/releases/download/ecos-do-horizonte-v2.1.0/ecos-do-horizonte-v2.1.html).

## Menus e movimento 2.2

A orientação das oito direções foi corrigida para todas as classes jogáveis, criaturas, NPCs e companheiros. O controle por toque considera a projeção do mapa, e as diagonais seguem a direção do dedo. A caminhada usa a distância realmente percorrida, incluindo desvio de obstáculos, recuo e investida. Ataques e habilidades preservam sua orientação durante a animação.

O menu tem navegação fixa, retrato do herói, objetivo atual e atalhos. A mochila permite filtrar por tipo e ordenar por raridade, nível ou espaço de equipamento. Ao selecionar uma peça, um painel compara os atributos totais que ela produzirá antes de equipar; fechar o painel preserva a posição da lista. A aba Equipado reúne as sete peças, atributos e conjuntos.

Ajustes de gráficos e dificuldade têm seleção direta. Telas de evolução, diário, forja, mercado, ajuda e créditos compartilham o estilo visual e a navegação. Imagens de itens não carregam suas animações completas na mochila; a arte de uma arma ainda não preparada é carregada ao equipar, com indicação de progresso.

## Arte e revisão visual

Heróis e inimigos usam modelos distintos: cães de raízes, carapaças, seres de esporos, máscaras espectrais, golens, esqueletos, orcs e demônios. Personagens, cenários, retratos e equipamentos usam artes renderizadas com a mesma câmera, iluminação e tratamento de cor. A resolução do modo automático permanece estável; a adaptação de desempenho reduz efeitos e frequência de desenho.

## Mundo e progressão

O mundo tem 240 × 240 células, nove regiões ligadas por estradas, nove povoados, 64 acampamentos e nove entradas para masmorras. O mapa permite ampliar, arrastar, marcar destinos e viajar entre Âncoras restauradas.

Quatro classes recebem especializações no nível 8, modificadores no 15 e bônus de Mestre no 24. Há talentos, seis famílias de armas, sete espaços de equipamento, quatro conjuntos, atributos adicionais, melhoria de peças, forja e mercado. O combate inclui sequências de três golpes, golpes pesados, vigor, esquiva, defesa, aparo, postura e combinações elementais.

Ari e Nimbo buscam três Âncoras protegidas por guardiões antes do confronto com Veyr. Masmorras têm salas conectadas, tesouros e interruptores. Expedições podem ser repetidas indefinidamente. Após o nível 60, o Legado continua; os bônus de combate têm limite para preservar o equilíbrio.

## Controles e progresso

No celular, mova com o controle à esquerda e segure **Atacar** à direita. É possível mover e atacar simultaneamente. O menu explica as mecânicas e reúne dificuldade, som e desempenho gráfico.

O progresso fica no armazenamento do navegador. Use **Ajustes → Exportar** para guardar uma cópia JSON e **Importar** para trocar de navegador ou arquivo. Progresso das versões 2.0 e 2.1 continua compatível. Masmorras e expedições retomam na entrada do mundo ao reabrir.

O HTML não exige downloads adicionais. Alguns visualizadores de arquivos do celular não executam JavaScript; nesses aparelhos, use o link de jogo no navegador. A validação foi feita em Chromium com toque e telas de 320 × 568 a 844 × 390, sem teste em aparelho físico.

## Arte e licenças

Bibliotecas gratuitas, todas sob **CC0 1.0 Universal**:

- [KayKit Adventurers](https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0)
- [KayKit Skeletons](https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Skeletons-1.0)
- [KayKit Medieval Hexagon](https://kaylousberg.itch.io/kaykit-medieval-hexagon)
- [KayKit Dungeon Remastered](https://kaylousberg.itch.io/kaykit-dungeon-remastered)
- [Quaternius Ultimate Monsters](https://quaternius.com/packs/ultimatemonsters.html)
- [RPG Audio — Kenney](https://kenney.nl/assets/rpg-audio)

Cão das Raízes, Carapaça de Vidro, Arauto dos Esporos, Máscaras do Véu e Colosso, além de vegetação e fogueiras, foram modelados e animados em 3D para este projeto. Créditos e licenças também estão em **Ajustes → Arte, áudio e bibliotecas**.
