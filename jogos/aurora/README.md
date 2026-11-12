# Aurora — Crônicas da Fenda

RPG de gestão/idle em um único HTML (celular, retrato).

- `aurora-v26.html` — versão de referência recebida (não editar).
- `aurora-v27.html` — build da v27 (`python3 tools/build.py aurora-v27.html`).
- `src/` — código-fonte dividido em módulos (`head.html`, `fonts.css`, `style.css`, `body.html`, `js/*.js` na ordem de `order.txt`).
- `tools/build.py [saida.html]` — monta `src/` num único HTML.
- `tools/sim.js [segundos] [dt]` — roda a simulação sem DOM no Node (teste rápido de regras e desempenho).
- `tools/test-offline.js [--study]` — testes sem DOM: progresso offline, decisões pendentes, cartão de prédio (`--study` mede passo e erro da estimativa).
- `tools/smoke.js [--file x.html] [--out pasta] [--hours 2,20]` — fumaça no Chromium (Playwright, viewport de celular): jogo novo, prédios, decisão, ausências, save antigo; capturas em `--out`.

Nunca abra `src/fonts.css` num editor/leitor de contexto: são duas linhas de ~200 KB (fontes em base64).
