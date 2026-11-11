#!/bin/sh
# Monta a v23 a partir da v22 e roda as verificações sem tela.
# Uso: sh fontes-v23/testar.sh        (a partir de jogos/aurora-cronicas-da-fenda)
set -e
cd "$(dirname "$0")/.."
T=$(mktemp -d)
python3 -B fontes-v23/build.py aurora-cidade-viva-22.html "$T/v23.html"
cmp "$T/v23.html" aurora-cidade-viva-23.html && echo "HTML publicado confere com as fontes"
python3 -B fontes-v20/testes/extrair-nucleo.py aurora-cidade-viva-19.html "$T/core19.js"
python3 -B fontes-v20/testes/extrair-nucleo.py aurora-cidade-viva-21.html "$T/core21.js"
python3 -B fontes-v20/testes/extrair-nucleo.py aurora-cidade-viva-22.html "$T/core22.js"
python3 -B fontes-v20/testes/extrair-nucleo.py "$T/v23.html" "$T/core23.js" "$T/all23.js"
node --check "$T/all23.js" && echo "sintaxe ok"
node fontes-v20/testes/save19.js "$T/core19.js" "$T/save19.json"
node fontes-v22/testes/save21.js "$T/core21.js" "$T/save21.json"
node fontes-v23/testes/save22.js "$T/core22.js" "$T/save22.json"
echo "--- testes antigos no núcleo da v23 ---"
node fontes-v21/testes/sistemas-v20.js "$T/core23.js" "$T/save19.json"
node fontes-v22/testes/sistemas-v21.js "$T/core23.js"
node fontes-v22/testes/sistemas-v22.js "$T/core23.js" "$T/save21.json" "$T/save19.json"
echo "--- testes da v23 ---"
node fontes-v23/testes/sistemas-v23.js "$T/core23.js" "$T/save22.json" "$T/save21.json" "$T/save19.json"
echo "--- campanha de 60 dias, semente 21: v22 e v23 (mesmo roteiro) ---"
node fontes-v23/testes/campanha.js "$T/core22.js" 60 21 | tail -1
node fontes-v23/testes/campanha.js "$T/core23.js" 60 21
# comparação em várias sementes (demora alguns minutos):
#   node fontes-v23/testes/comparar.js "$T/core22.js" "$T/core23.js" 60 21,22,23,24,25,26,27,28,29,30,31,32 "" 1
# opcional, com Playwright:  node fontes-v23/testes/navegador.js aurora-cidade-viva-23.html /tmp/telas save22.json
rm -rf "$T"
