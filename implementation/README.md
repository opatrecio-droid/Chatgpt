# PolyForge Studio — coleção cumulativa

**1035 modelos no mesmo HTML: 35 iniciais + 1000 novos**, de Kenney e Quaternius, com licença CC0.

O arquivo `index.html` inclui os GLBs originais, texturas, miniaturas e dependências. Abra-o no Chrome ou Edge atualizado, com WebGL e DecompressionStream. Não há downloads externos em execução. O catálogo maior carrega a geometria ao selecionar um modelo.

A biblioteca inclui animais, personagens, natureza, veículos, objetos, construções e peças modulares. Existem variantes geométricas de uma mesma família. Mudanças apenas de nome, cor, posição, escala uniforme ou rotação entre eixos não foram contadas como novos modelos. A auditoria não mede semelhança artística ou semântica.

Busca em português e pelos nomes originais, filtros por categoria/autor/coleção, materiais originais editáveis, clipes reais quando presentes, animal companheiro, cena, exportação de GLB original, OBJ estático, PNG e cena jogável em HTML.

Contagem técnica por categoria: `{"characters": 20, "items": 38, "nature": 211, "pets": 38, "props": 655, "vehicles": 73}`.

## Fontes

Veja `assets/SOURCES.md`, `assets/catalog.json` e `assets/licenses/`. Cada modelo registra origem, nome original, licença, tamanho e SHA-256. Os avisos de Three.js, Tailwind e Font Awesome estão em `assets/vendor/` e incluídos no HTML.

## Desenvolvimento

```sh
python3 scripts/build-web-studio.py
```

O build verifica todos os hashes. A cópia publicada em `implementation/` recupera os GLBs e miniaturas do HTML portátil com:

```sh
python3 scripts/extract-portable-assets.py ../polyforge.html
python3 scripts/build-web-studio.py
```

A validação usa Playwright/Chromium. Os incrementos foram renderizados, verificando uso das malhas originais, dimensões finitas, ausência de erro WebGL e de requisições externas. O teste final da coleção completa verifica carregamento inicial, seleção concorrente, filtro de coleção, companheiro, combo, cenário, download GLB por SHA-256 e painéis móveis sem sobreposição.

`assets/deliveries/baseline.json` mantém os 35 iniciais. O histórico preserva a sequência de 10 em 10 e a posterior mudança solicitada para blocos de 200 novos, chegando a 435, 635, 835 e 1035 modelos.
