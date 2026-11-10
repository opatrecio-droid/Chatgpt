#!/usr/bin/env python3
"""Monta a v21 a partir da v20: aplica os patches e insere os módulos novos."""
import sys, importlib.util, pathlib
W = pathlib.Path(__file__).parent
sp = importlib.util.spec_from_file_location('p', W / 'patches21.py'); m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m)
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
ins_before('/* ===== 40-art.js ===== */', rd('35-legado.js'))
ins_before('/* ===== 60-ui.js ===== */', rd('52-legado-art.js'))
ins_before("  document.addEventListener('input', (e) => { const k = e.target.getAttribute", rd('61c-ui-legado.js'))
ins_before('\n</style>\n</head>', rd('legado.css'))
if bad: sys.exit('falhou: %d' % bad)
pathlib.Path(sys.argv[2]).write_text(src, encoding='utf-8'); print('ok', sys.argv[2], len(src))
