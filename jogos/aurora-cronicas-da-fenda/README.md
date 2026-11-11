# Aurora — Crônicas da Fenda

Cidade viva de caçadores em um único arquivo HTML: os heróis caçam sozinhos, você ergue a cidade,
forja o equipamento e enfrenta a Fenda. Funciona offline, no celular ou no computador.

## v22 "Companheiros" — versão mais recente

**Arquivo:** [aurora-cidade-viva-22.html](aurora-cidade-viva-22.html) (baixe e abra no navegador)

Os monstros deixam espólio no chão: o herói fica com metade e o mascote dele busca o resto. Mascotes
têm raridade, carga e papéis (Faro, Carga, Fraqueza, Vigor), podem ser fundidos e vêm de Incursões em
dez Graus de dificuldade. Saves antigos continuam valendo.
[O que mudou e a campanha de teste](melhorias-v22.md) · [Verificação](verificacao-v22.json)

| | | | |
|---|---|---|---|
| ![Espólio no chão](telas-v22/01-espolio-no-chao.png) | ![Mascote buscando](telas-v22/02-mascote-buscando.png) | ![Escolha de mascote](telas-v22/03-escolha-mascote.png) | ![Bolsa e carga](telas-v22/04-bolsa-e-carga.png) |
| ![Viveiro](telas-v22/05-viveiro.png) | ![Incursões](telas-v22/06-incursoes.png) | ![Alfa](telas-v22/07-alfa.png) | ![Ovo chocado](telas-v22/08-ovo-chocado.png) |

## Versões anteriores

- [aurora-cidade-viva-21.html](aurora-cidade-viva-21.html) — v21 "Legado": trajes, asas, relíquias,
  dificuldade, enfeites móveis e Caminhos. [O que mudou](melhorias-v21.md) ·
  [Verificação](verificacao-v21.json) · capturas em `telas-v21/`.
- [aurora-cidade-viva-20.html](aurora-cidade-viva-20.html) — v20 "Vocações": árvore de vocações, Artes
  Secretas, Despertar, montarias, oito peças de equipamento, Armazém e decoração.
  [Mecânicas e árvores](melhorias-v20.md) · [Verificação](verificacao-v20.json) · capturas em `telas-v20/`.
- [aurora-cidade-viva-19.html](aurora-cidade-viva-19.html) — v19 "Reforjada", base desta versão.

## Fontes

Cada versão é montada a partir da anterior por um script: `fontes-v20/build.py` leva a v19 à v20 e
`fontes-v21/build.py` leva a v20 à v21 e `fontes-v22/build.py` leva a v21 à v22. Cada pasta tem a lista de trocas pontuais no código existente,
os arquivos novos em `mod/` (lógica, arte, interface e estilos) e um `testar.sh` que remonta e verifica.
