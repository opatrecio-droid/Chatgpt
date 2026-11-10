#!/usr/bin/env python3
"""Separa do HTML o núcleo sem tela (módulos 00–34) para rodar no Node."""
import sys, pathlib
s = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')
js = s[s.index('<script>') + 8:s.rindex('</script>')]
pathlib.Path(sys.argv[2]).write_text(js[:js.index('/* ===== 40-art.js ===== */')], encoding='utf-8')
if len(sys.argv) > 3: pathlib.Path(sys.argv[3]).write_text(js, encoding='utf-8')
