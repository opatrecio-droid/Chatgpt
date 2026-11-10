#!/bin/sh
# Monta a v21 a partir da v20 e roda as verificações sem tela.
# Uso: sh fontes-v21/testar.sh        (a partir de jogos/aurora-cronicas-da-fenda)
set -e
cd "$(dirname "$0")/.."
T=$(mktemp -d)
python3 fontes-v21/build.py aurora-cidade-viva-20.html "$T/v21.html"
cmp "$T/v21.html" aurora-cidade-viva-21.html && echo "HTML publicado confere com as fontes"
python3 fontes-v20/testes/extrair-nucleo.py aurora-cidade-viva-19.html "$T/core19.js"
python3 fontes-v20/testes/extrair-nucleo.py "$T/v21.html" "$T/core21.js" "$T/all21.js"
node --check "$T/all21.js" && echo "sintaxe ok"
node fontes-v20/testes/save19.js "$T/core19.js" "$T/save19.json"
node fontes-v21/testes/sistemas-v20.js "$T/core21.js" "$T/save19.json"
node fontes-v21/testes/sistemas-v21.js "$T/core21.js"
node fontes-v21/testes/campanha.js "$T/core21.js" 60 21
# opcional, com Playwright:  node fontes-v21/testes/navegador.js aurora-cidade-viva-21.html /tmp/telas
rm -rf "$T"
