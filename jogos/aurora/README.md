# Aurora — Crônicas da Fenda

RPG de gestão/idle em um único HTML (celular, retrato).

- `aurora-v26.html` — versão de referência recebida (não editar).
- `src/` — código-fonte dividido em módulos (`head.html`, `fonts.css`, `style.css`, `body.html`, `js/*.js` na ordem de `order.txt`).
- `tools/build.py [saida.html]` — monta `src/` num único HTML.
- `tools/sim.js [segundos] [dt]` — roda a simulação sem DOM no Node (teste rápido de regras e desempenho).

Nunca abra `src/fonts.css` num editor/leitor de contexto: são duas linhas de ~200 KB (fontes em base64).
