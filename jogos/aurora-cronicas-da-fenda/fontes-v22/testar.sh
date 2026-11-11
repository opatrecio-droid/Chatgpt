#!/bin/sh
# Monta a v22 a partir da v21 e roda as verificações sem tela.
# Uso: sh fontes-v22/testar.sh        (a partir de jogos/aurora-cronicas-da-fenda)
set -e
cd "$(dirname "$0")/.."
T=$(mktemp -d)
python3 -B fontes-v22/build.py aurora-cidade-viva-21.html "$T/v22.html"
cmp "$T/v22.html" aurora-cidade-viva-22.html && echo "HTML publicado confere com as fontes"
python3 -B fontes-v20/testes/extrair-nucleo.py aurora-cidade-viva-19.html "$T/core19.js"
python3 -B fontes-v20/testes/extrair-nucleo.py aurora-cidade-viva-21.html "$T/core21.js"
python3 -B fontes-v20/testes/extrair-nucleo.py "$T/v22.html" "$T/core22.js" "$T/all22.js"
node --check "$T/all22.js" && echo "sintaxe ok"
node fontes-v20/testes/save19.js "$T/core19.js" "$T/save19.json"
node fontes-v22/testes/save21.js "$T/core21.js" "$T/save21.json"
node fontes-v21/testes/sistemas-v20.js "$T/core22.js" "$T/save19.json"
node fontes-v22/testes/sistemas-v21.js "$T/core22.js"
node fontes-v22/testes/sistemas-v22.js "$T/core22.js" "$T/save21.json" "$T/save19.json"
echo "--- campanha de 60 dias, semente 21: v21 e v22 ---"
node fontes-v22/testes/campanha.js "$T/core21.js" 60 21 | tail -1
node fontes-v22/testes/campanha.js "$T/core22.js" 60 21
echo "--- v22 sem mascote (só a regra dos 50%) ---"
node fontes-v22/testes/campanha.js "$T/core22.js" 60 21 sempet | tail -1
# opcional, com Playwright:  node fontes-v22/testes/navegador.js aurora-cidade-viva-22.html /tmp/telas
rm -rf "$T"
