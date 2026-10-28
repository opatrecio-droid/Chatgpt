#!/usr/bin/env python3
"""Desmonta o game.html de um APK/HTML do Herói de Vaelmar em partes editáveis.

  src/    código (HTML, CSS, JS) -> versionado
  dados/  catálogo do Codex e imagens/fontes embutidas -> fora do git

As imagens em data: URI viram marcadores @@A:<sha1>@@ e são gravadas como arquivos
binários. `montar.py` desfaz a troca. A extração só termina se o HTML remontado
for idêntico, byte a byte, ao original.
"""
import argparse, base64, hashlib, json, re, sys, zipfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
URI = re.compile(r'data:([a-z]+/[a-z0-9.+\-]+);base64,([A-Za-z0-9+/=]{400,})')
BLOCO = re.compile(r'<(style|script)\b[^>]*>.*?</\1>', re.S)
EXT = {'image/png': 'png', 'image/webp': 'webp', 'image/jpeg': 'jpg', 'font/ttf': 'ttf', 'image/gif': 'gif', 'image/svg+xml': 'svg'}


def ler_html(origem: Path) -> str:
    if origem.suffix.lower() == '.apk':
        with zipfile.ZipFile(origem) as z:
            return z.read('assets/game.html').decode('utf-8')
    return origem.read_text(encoding='utf-8')


def nome_parte(i: int, tipo: str, corpo: str) -> tuple[str, str]:
    """Devolve (pasta, arquivo). Dados pesados vão para dados/, código para src/."""
    if tipo == 'script' and corpo.lstrip().startswith('const AETHRIC_DATA='):
        return 'dados', 'aethric-data.js'
    if tipo == 'script' and 'Motor de pixel art' in corpo[:400]:
        return 'src', 'jogo.js'
    if tipo == 'script' and 'boot-error' in corpo[:400]:
        return 'src', 'erros-de-boot.js'
    return 'src', f'{tipo}-{i:02d}.{"css" if tipo == "style" else "js"}'


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('origem', type=Path, help='APK (assets/game.html) ou HTML do Herói de Vaelmar')
    a = ap.parse_args()
    html = ler_html(a.origem)
    (RAIZ / 'src').mkdir(exist_ok=True); (RAIZ / 'dados' / 'assets').mkdir(parents=True, exist_ok=True)
    assets: dict[str, dict] = {}

    def tokenizar(texto: str) -> str:
        def sub(m):
            mime, b64 = m.group(1), m.group(2)
            raw = base64.b64decode(b64)
            if base64.b64encode(raw).decode() != b64:  # base64 não canônico: mantém inline
                return m.group(0)
            h = hashlib.sha1(raw).hexdigest()[:16]
            ext = EXT.get(mime, 'bin')
            arq = RAIZ / 'dados' / 'assets' / f'{h}.{ext}'
            if not arq.exists():
                arq.write_bytes(raw)
            assets[h] = {'mime': mime, 'ext': ext}
            return f'@@A:{h}@@'
        return URI.sub(sub, texto)

    partes, pos, n = [], 0, 0
    for m in BLOCO.finditer(html):
        if m.start() > pos:
            n += 1
            f = f'html-{n:02d}.html'
            (RAIZ / 'src' / f).write_text(tokenizar(html[pos:m.start()]), encoding='utf-8')
            partes.append({'pasta': 'src', 'arquivo': f})
        bloco = m.group(0)
        abre = bloco[:bloco.index('>') + 1]; tipo = m.group(1)
        corpo = bloco[len(abre):-len(f'</{tipo}>')]
        n += 1
        pasta, f = nome_parte(n, tipo, corpo)
        (RAIZ / pasta / f).write_text(tokenizar(corpo), encoding='utf-8')
        partes.append({'pasta': pasta, 'arquivo': f, 'abre': abre, 'fecha': f'</{tipo}>'})
        pos = m.end()
    if pos < len(html):
        n += 1
        f = f'html-{n:02d}.html'
        (RAIZ / 'src' / f).write_text(tokenizar(html[pos:]), encoding='utf-8')
        partes.append({'pasta': 'src', 'arquivo': f})

    (RAIZ / 'src' / 'manifesto.json').write_text(json.dumps(partes, indent=1, ensure_ascii=False), encoding='utf-8')
    (RAIZ / 'dados' / 'assets.json').write_text(json.dumps(assets, indent=0), encoding='utf-8')

    sys.path.insert(0, str(RAIZ / 'tools'))
    import montar
    refeito = montar.montar()
    if refeito != html:
        sys.exit('FALHA: o HTML remontado difere do original.')
    print(f'ok: {len(partes)} partes, {len(assets)} arquivos de imagem/fonte, remontagem idêntica ({len(html):,} bytes)')


if __name__ == '__main__':
    main()
