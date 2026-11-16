#!/usr/bin/env python3
"""Monta o jogo final a partir da base recebida (build 042) e das correções em dev/src.

Uso: python3 dev/build.py            (gera ../aurora-cronicas-da-fenda.html)

A base nunca é editada. Cada correção é uma troca exata (falha se o trecho original
não existir exatamente uma vez) ou um arquivo injetado antes de </body>.
"""
import pathlib
import re
import sys

DEV = pathlib.Path(__file__).resolve().parent
SRC = DEV / "src"
BASE = DEV / "base" / "aurora-042-base.html"
OUT = DEV.parent / "aurora-cronicas-da-fenda.html"

VERSION = "30.7"
BUILD = "Aurora_043_avisos_mapa_chefes_arte64"


def swap(html: str, old: str, new: str, label: str) -> str:
    n = html.count(old)
    if n != 1:
        sys.exit(f"[{label}] trecho original encontrado {n} vez(es); esperado 1")
    return html.replace(old, new)


def load_patches():
    """Cada dev/src/NN-nome.patch.txt guarda pares '<<<< rótulo' / '====' / '>>>>'."""
    patches = []
    for path in sorted(SRC.glob("*.patch.txt")):
        text = path.read_text(encoding="utf-8")
        for m in re.finditer(r"^<<<< (.+?)\n(.*?)\n====\n(.*?)\n>>>>$", text, re.S | re.M):
            patches.append((f"{path.name}: {m.group(1)}", m.group(2), m.group(3)))
    return patches


def main():
    html = BASE.read_text(encoding="utf-8")
    html = swap(html, "G.VERSION = '30.6';", f"G.VERSION = '{VERSION}';", "versão")
    html = swap(html, "G.BUILD = 'Aurora_Economia_040';", f"G.BUILD = '{BUILD}';", "build")
    html = swap(html, 'content="Aurora_042_saques_por_dificuldade"', f'content="{BUILD}"', "meta build")
    html = swap(html, "CRÔNICAS DA FENDA · v30.6", f"CRÔNICAS DA FENDA · v{VERSION}", "título") if "CRÔNICAS DA FENDA · v30.6" in html else html

    for label, old, new in load_patches():
        html = swap(html, old, new, label)

    blocks = []
    for path in sorted(SRC.glob("*")):
        if path.name.endswith(".patch.txt"):
            continue
        body = path.read_text(encoding="utf-8")
        ident = "aurora-043-" + re.sub(r"^\d+-", "", path.stem)
        if path.suffix == ".css":
            blocks.append(f'<style id="{ident}">\n{body}\n</style>')
        elif path.suffix == ".js":
            if "</script" in body.lower():
                sys.exit(f"{path.name}: contém </script")
            blocks.append(f'<script id="{ident}">\n{body}\n</script>')
    html = swap(html, "</body>\n</html>", "\n".join(blocks) + "\n</body>\n</html>", "injeção final")
    OUT.write_text(html, encoding="utf-8")
    print(f"ok: {OUT.name} · {len(html) / 1e6:.2f} MB · {len(blocks)} bloco(s) · v{VERSION} {BUILD}")


if __name__ == "__main__":
    main()
