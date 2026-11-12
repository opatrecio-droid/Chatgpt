# Aurora — Crônicas da Fenda

RPG de gestão/idle em um único HTML (celular, retrato).

- `aurora-v26.html` — versão de referência recebida (não editar).
- `aurora-v27.html` — build da v27 (`python3 tools/build.py aurora-v27.html`).
- `src/` — código-fonte dividido em módulos (`head.html`, `fonts.css`, `style.css`, `body.html`, `js/*.js` na ordem de `order.txt`).
- `tools/build.py [saida.html]` — monta `src/` num único HTML.
- `tools/sim.js [segundos] [dt]` — roda a simulação sem DOM no Node (teste rápido de regras e desempenho).
- `tools/test-offline.js [--study]` — testes sem DOM: progresso offline, decisões pendentes, cartão de prédio (`--study` mede passo e erro da estimativa).
- `tools/smoke.js [--file x.html] [--out pasta] [--hours 2,20]` — fumaça no Chromium (Playwright, viewport de celular): jogo novo, prédios, decisão, ausências, save antigo; capturas em `--out`.

- `tools/test-vida.js` — testes sem DOM da Fase B (v27): produção idêntica com e sem o vai-e-vem da equipe de campo, equipe por nível, entregas honestas, vagantes que escolhem dono (poder/carisma), teto de 3 mascotes, migração de save, retornos decrescentes.
- `tools/smoke-vida.js [--file x.html] [--out pasta] [--base anterior.html] [--perf-only]` — fumaça da Fase B no Chromium: os três laços de trabalho em tela, cartão do prédio ao vivo, vagantes, 3 mascotes por herói, ficha com Carisma, saves; mede o custo do quadro (com `--base` compara com outra versão).

- `tools/smoke-ui.js [--file x.html] [--out pasta] [--only 412x915-d2] [--quick]` — fumaça da interface (Fase C): abre todas as telas (título, apresentação, mapa em repouso, bandejas do HUD, trilho de atalhos, cada aba dos painéis, ficha do herói, janelas, cartões, pendências, ausência) em 412×915 (dpr 2), 360×640 (dpr 1) e dpr 2,625; confere erros de console, rolamento horizontal, `border-image` renderizado e registra texto cortado; capturas por tela.
- `src/js/56-ui-pixel.js`, `57-ui-icons.js`, `58-ui-sprites.js` — molduras 9-slice, ícones 16×16 e esprites 24×24 dos atalhos, todos gerados em canvas a partir de grades de texto; `6K-ui-atalhos.js` (trilho de atalhos) e `6L-ui-limpeza.js` (HUD limpo). Referência de estilo: `design/style-tile.html`.

Nunca abra `src/fonts.css` num editor/leitor de contexto: são três linhas de ~15 KB (as fontes de pixel em base64).
