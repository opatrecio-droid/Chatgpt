#!/usr/bin/env python3
"""Monta a v23 a partir da v22: aplica os patches e insere os módulos novos.
Uso: python3 -B fontes-v23/build.py aurora-cidade-viva-22.html aurora-cidade-viva-23.html"""
import sys, importlib.util, pathlib
sys.dont_write_bytecode = True
W = pathlib.Path(__file__).parent
sp = importlib.util.spec_from_file_location('p', W / 'patches23.py'); m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m)
src = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8'); bad = 0
for old, new, n in m.P:
    c = src.count(old)
    if c != n: bad += 1; print('PATCH (esperado %d, achei %d): %r' % (n, c, old[:110])); continue
    src = src.replace(old, new)
def rd(n): return (W / 'mod' / n).read_text(encoding='utf-8')
def ins_before(marker, text):
    global src, bad
    if src.count(marker) != 1: bad += 1; print('MARCADOR', marker[:80]); return
    src = src.replace(marker, text + marker)
ins_before('/* ===== 40-art.js ===== */', rd('37-oficios.js'))
ins_before("  document.addEventListener('input', (e) => { const k = e.target.getAttribute", rd('61e-ui-oficios.js'))
ins_before('\n</style>\n</head>', rd('oficios.css'))
if bad: sys.exit('falhou: %d' % bad)
pathlib.Path(sys.argv[2]).write_text(src, encoding='utf-8'); print('ok', sys.argv[2], len(src))
