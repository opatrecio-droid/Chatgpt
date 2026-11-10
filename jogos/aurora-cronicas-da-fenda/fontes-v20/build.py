#!/usr/bin/env python3
"""Monta a v20 a partir da v19: aplica os patches e insere os módulos novos."""
import sys, importlib.util, pathlib
W = pathlib.Path(__file__).parent
def load(n):
    sp = importlib.util.spec_from_file_location(n, W / (n + '.py')); m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m); return m.P
src = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')
out = pathlib.Path(sys.argv[2])
bad = 0
for old, new in load('patches_core') + load('patches_ui'):
    n = src.count(old)
    if n != 1:
        bad += 1; print('PATCH %s (x%d): %r' % ('AUSENTE' if n == 0 else 'AMBIGUO', n, old[:110]))
        continue
    src = src.replace(old, new)
def rd(n): return (W / 'mod' / n).read_text(encoding='utf-8')
def ins_before(marker, text):
    global src, bad
    if src.count(marker) != 1: bad += 1; print('MARCADOR', marker); return
    src = src.replace(marker, text + marker)
ins_before('/* ===== 40-art.js ===== */', rd('34-vocacoes.js'))
ins_before('/* ===== 60-ui.js ===== */', rd('51-voc-art.js'))
# a seção HERÓIS da 61 é trocada inteira pela nova ficha
a = src.index('  /* ================= HERÓIS ================= */'); b = src.index('  /* ================= FORJA ================= */')
src = src[:a] + rd('61b-ui-vocacoes.js') + src[b:]
# a antiga Vitrine da Forja dá lugar à lista do Armazém
a = src.index("      if (tab === 'arsenal') {"); b = src.index("      const mt = G.forgeMaxTier(); if (!forgeTier")
src = src[:a] + "      if (tab === 'arsenal') return whEquip();\n" + src[b:]
ins_before('\n</style>\n</head>', rd('voc.css'))
if bad: sys.exit('falhou: %d patch(es)' % bad)
out.write_text(src, encoding='utf-8')
print('ok', out, len(src))
