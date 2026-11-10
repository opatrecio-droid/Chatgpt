#!/bin/sh
# Monta a v20 a partir da v19 e roda as verificações sem tela.
# Uso: sh fontes-v20/testar.sh        (a partir de jogos/aurora-cronicas-da-fenda)
set -e
cd "$(dirname "$0")/.."
T=$(mktemp -d)
python3 fontes-v20/build.py aurora-cidade-viva-19.html "$T/v20.html"
cmp "$T/v20.html" aurora-cidade-viva-20.html && echo "HTML publicado confere com as fontes"
python3 fontes-v20/testes/extrair-nucleo.py aurora-cidade-viva-19.html "$T/core19.js"
python3 fontes-v20/testes/extrair-nucleo.py "$T/v20.html" "$T/core20.js" "$T/all20.js"
node --check "$T/all20.js" && echo "sintaxe ok"
node fontes-v20/testes/save19.js "$T/core19.js" "$T/save19.json"
node fontes-v20/testes/sistemas.js "$T/core20.js" "$T/save19.json"
node fontes-v20/testes/simulacao.js "$T/core20.js" 8 7
# opcional, com Playwright instalado:  node fontes-v20/testes/navegador.js aurora-cidade-viva-20.html /tmp/telas
rm -rf "$T"
