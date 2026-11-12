#!/usr/bin/env python3
"""Monta src/ num único HTML. Uso: python3 tools/build.py [saida.html]"""
import sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'src'
rd = lambda p: (src / p).read_text(encoding='utf-8')
out = rd('head.html') + '<style>\n'
if (src / 'css-pre.css').exists(): out += rd('css-pre.css')
out += rd('fonts.css') + rd('style.css') + '</style>\n' + rd('body.html') + '<script>\n'
for name in rd('order.txt').split():
    out += '/* ===== %s ===== */\n' % name + rd('js/' + name)
out += '</script>\n' + rd('tail.html')
dest = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'aurora.html'
dest.write_text(out, encoding='utf-8')
print('ok', dest, len(out.encode('utf-8')), 'bytes')
