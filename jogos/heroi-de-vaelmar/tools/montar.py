#!/usr/bin/env python3
"""Monta dist/game.html a partir de src/ + dados/ (veja extrair.py)."""
import base64, json, re, sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
TOKEN = re.compile(r'@@A:([0-9a-f]{16})@@')


def montar() -> str:
    partes = json.loads((RAIZ / 'src' / 'manifesto.json').read_text(encoding='utf-8'))
    assets = json.loads((RAIZ / 'dados' / 'assets.json').read_text(encoding='utf-8'))
    cache: dict[str, str] = {}

    def uri(m):
        h = m.group(1)
        if h not in cache:
            info = assets[h]
            raw = (RAIZ / 'dados' / 'assets' / f'{h}.{info["ext"]}').read_bytes()
            cache[h] = f'data:{info["mime"]};base64,' + base64.b64encode(raw).decode()
        return cache[h]

    saida = []
    for p in partes:
        texto = (RAIZ / p['pasta'] / p['arquivo']).read_text(encoding='utf-8')
        saida.append(p.get('abre', '') + TOKEN.sub(uri, texto) + p.get('fecha', ''))
    return ''.join(saida)


if __name__ == '__main__':
    destino = Path(sys.argv[1]) if len(sys.argv) > 1 else RAIZ / 'dist' / 'game.html'
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(montar(), encoding='utf-8')
    print(f'{destino} ({destino.stat().st_size:,} bytes)')
