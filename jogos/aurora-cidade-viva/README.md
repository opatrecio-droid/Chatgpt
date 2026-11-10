# Aurora — Crônicas da Fenda (v18)

RPG de cidade com heróis autônomos, inspirado em jogos de gestão de caçadores e em animes isekai.

- **Jogar:** abra `aurora-cidade-viva-18.html` no navegador (arquivo único, funciona offline).
- **Base:** protótipo v17 + camada "Ascensão" em `src/`.

## O que a v18 acrescenta

| Área | Mudança |
| --- | --- |
| Dificuldade | Sem escolha inicial. A ameaça segue o **Nível do Reino** (Renome ganho com abates, contratos, Fenda e amanheceres) e alivia sozinha se os heróis caem ou a caçada despenca. Os bandos da fronteira sobem de rank com o reino. |
| HUD | Barra única: nível e ameaça, relógio e velocidade, cofre, Selos, moradores, aprovação, fronteira. Objetivos à esquerda, grupo de heróis à direita, ações rápidas e feed de eventos. Layout próprio para celular. |
| Salão do Reino | Cinco abas: Reino, Contratos, Fenda, Bênçãos, Mercado. |
| Progressão sem teto | Maestria por herói, Campo de Treino (ouro vira força), Bênçãos permanentes (Selos) e Fenda Infinita (um guardião por andar). |
| Contratos do dia | Três objetivos por amanhecer, baú ao cumprir os três e bônus por dias seguidos. |
| Economia | Preço reage ao estoque (−55% a +90%), heróis vendem espólios e gastam em poções e forja, dízimo da guilda ao amanhecer, exportação por caravanas com cota diária. |
| Correções | Heróis não ficam mais presos no Rank E (a Prova de ascensão voltou a funcionar); jornada nova não herda equipamentos da anterior; heróis se espalham pelas zonas; menos texto sobreposto no combate. |
| Ambiente | Sombras de nuvens, pássaros, folhas e vaga-lumes. |

## Remontar

```
node src/build.js <base-v17.html> aurora-cidade-viva-18.html
```

`build.js` injeta `asc.css`, `asc-core.js`, `asc-ui.js` e `asc-fx.js` antes de `</body>`; rodar de novo sobre a v18 substitui o bloco.
