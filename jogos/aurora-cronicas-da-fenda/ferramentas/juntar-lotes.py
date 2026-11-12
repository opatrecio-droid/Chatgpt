#!/usr/bin/env python3
"""Junta o aurora.html de um lote (branch) no aurora.html atual quando os dois lados inseriram módulos novos
no mesmo ponto (logo antes de /* ===== 90-main.js ===== */).

Uso (dentro de um `git merge --no-commit` com conflito):
  python3 ferramentas/juntar-lotes.py <commit-base> <ref-do-lote>

Como funciona:
  1. Lê as três versões do aurora.html: base (merge-base), nossa (HEAD) e a do lote.
  2. Em cada versão, separa os módulos que não existem na base (cabeçalhos "/* ===== NN-nome.js ===== */")
     — por regra, ficam contíguos antes do 90-main.
  3. Faz a junção de três vias do resto (código antigo + ganchos) com `git merge-file`.
  4. Recoloca antes do 90-main: primeiro os módulos novos nossos, depois os do lote, cada um inteiro.
Sai com código 1 se a junção do código antigo ainda tiver conflito (marcadores ficam no arquivo para resolver à mão).
"""
import re, subprocess, sys, tempfile, os

ARQ = 'jogos/aurora-cronicas-da-fenda/aurora.html'
HDR = re.compile(r'^/\* ===== ([0-9A-Za-z]+-[^ ]+\.js) ===== \*/$', re.M)
MAIN = '/* ===== 90-main.js ===== */'


def show(ref):
    return subprocess.run(['git', 'show', f'{ref}:{ARQ}'], capture_output=True, check=True).stdout.decode('utf-8')


def split(txt, base_mods):
    """Devolve (texto_sem_modulos_novos, bloco_dos_modulos_novos)."""
    heads = [(m.start(), m.group(1)) for m in HDR.finditer(txt)]
    novos = [(p, n) for p, n in heads if n not in base_mods]
    if not novos:
        return txt, ''
    ini = novos[0][0]
    fim = txt.index(MAIN)
    for p, n in novos:
        assert ini <= p < fim, f'módulo novo {n} fora da faixa antes do 90-main'
    return txt[:ini] + txt[fim:], txt[ini:fim]


def main():
    base_ref, lote_ref = sys.argv[1], sys.argv[2]
    raiz = subprocess.run(['git', 'rev-parse', '--show-toplevel'], capture_output=True, text=True).stdout.strip()
    os.chdir(raiz)
    base, nos, lote = show(base_ref), show('HEAD'), show(lote_ref)
    base_mods = {m.group(1) for m in HDR.finditer(base)}
    nos_r, nos_b = split(nos, base_mods)
    lote_r, lote_b = split(lote, base_mods)
    with tempfile.TemporaryDirectory() as d:
        pa, pb, pc = (os.path.join(d, x) for x in ('nos', 'base', 'lote'))
        open(pa, 'w', encoding='utf-8').write(nos_r)
        open(pb, 'w', encoding='utf-8').write(base)
        open(pc, 'w', encoding='utf-8').write(lote_r)
        r = subprocess.run(['git', 'merge-file', '-L', 'nos', '-L', 'base', '-L', 'lote', pa, pb, pc])
        junto = open(pa, encoding='utf-8').read()
    i = junto.index(MAIN)
    final = junto[:i] + nos_b + lote_b + junto[i:]
    open(ARQ, 'w', encoding='utf-8').write(final)
    print('módulos novos nossos:', [m.group(1) for m in HDR.finditer(nos_b)])
    print('módulos novos do lote:', [m.group(1) for m in HDR.finditer(lote_b)])
    print('conflitos no código antigo:', r.returncode)
    sys.exit(1 if r.returncode else 0)


if __name__ == '__main__':
    main()
