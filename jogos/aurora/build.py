#!/usr/bin/env python3
"""Aurora 046 · gera o jogo final a partir do original 045 e dos módulos em src/.

Uso: python3 build.py   ->  aurora-046-animacoes.html
     python3 build.py --out /caminho/teste.html --only skill-fx-core.js,skill-fx-esp-cav-arq.js
       (--only limita os módulos e patches incluídos; útil para testar um módulo isolado.
        Pastas: 'hd/' inclui todos os src/hd/*.js; 'art/' todos os src/art/*.js)
"""
import importlib.util
import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
ORIGINAL = os.path.join(ROOT, 'aurora-045-original.html')
OUTPUT = os.path.join(ROOT, 'aurora-046-animacoes.html')

# Ordem de injeção antes de </body>. Arquivos ausentes são ignorados com aviso (permite builds parciais).
MODULES = [
    ('style', 'aurora-skill-preview-style', 'skill-preview.css'),
    ('style', 'aurora-ferreiro-arsenal-style', 'ferreiro.css'),
    ('script', 'aurora-skill-fx-core', 'skill-fx-core.js'),
    ('script', 'aurora-skill-fx-vanguarda', 'skill-fx-esp-cav-arq.js'),
    ('script', 'aurora-skill-fx-arcano', 'skill-fx-mag-pal-lad.js'),
    ('script', 'aurora-skill-preview-ui', 'skill-preview-ui.js'),
    ('style', 'aurora-return-cards-style', 'return-cards.css'),
    ('script', 'aurora-return-cards', 'return-cards.js'),
    ('script', 'aurora-portal-art', 'portal-art.js'),
    ('script', 'aurora-portal', 'portal.js'),
    ('glob', 'aurora-hd', 'hd'),
    ('script', 'aurora-buildings-art', 'buildings-art.js'),
    ('glob', 'aurora-art', 'art'),
    ('script', 'aurora-buildings-anim', 'buildings-anim.js'),
    ('script', 'aurora-farm-crops', 'farm-crops.js'),
    ('script', 'aurora-cidade-viva', 'cidade-viva.js'),
    ('script', 'aurora-guardas', 'guardas.js'),
    ('script', 'aurora-bosque-caca', 'bosque-caca.js'),
]
PY_PATCHES = ['patch_core.py', 'patch_ferreiro.py']


def load_patch(name):
    path = os.path.join(SRC, name)
    if not os.path.exists(path):
        print('aviso: patch ausente', name)
        return None
    spec = importlib.util.spec_from_file_location(name[:-3], path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def main():
    args = sys.argv[1:]
    out = OUTPUT
    only = None
    if '--out' in args:
        out = os.path.abspath(args[args.index('--out') + 1])
    if '--only' in args:
        only = set(args[args.index('--only') + 1].split(','))
    html = open(ORIGINAL, encoding='utf-8').read()
    for name in PY_PATCHES:
        if only is not None and name != 'patch_core.py' and name not in only:
            continue
        mod = load_patch(name)
        if mod:
            html = mod.apply(html)
            print('patch aplicado:', name)
    blocks = []
    expanded = []
    for kind, ident, name in MODULES:
        if kind == 'glob':   # todos os .js da pasta src/<name>/, em ordem alfabética
            folder = os.path.join(SRC, name)
            for f in sorted(os.listdir(folder)) if os.path.isdir(folder) else []:
                if f.endswith('.js'):
                    expanded.append(('script', ident + '-' + f[:-3], name + '/' + f))
        else:
            expanded.append((kind, ident, name))
    for kind, ident, name in expanded:
        if only is not None and name not in only and name.split('/')[0] + '/' not in only:
            continue
        path = os.path.join(SRC, name)
        if not os.path.exists(path):
            print('aviso: módulo ausente', name)
            continue
        code = open(path, encoding='utf-8').read()
        if '</script' in code.lower() or '</style' in code.lower():
            sys.exit('erro: %s contém um fechamento de tag proibido' % name)
        blocks.append('<%s id="%s">\n%s\n</%s>' % (kind, ident, code, kind))
        print('módulo:', name, len(code), 'bytes')
    if html.count('</body>') != 1:
        sys.exit('erro: </body> não é único')
    html = html.replace('</body>', '\n'.join(blocks) + '\n</body>')
    html = html.replace('content="Aurora_045_arqueiro_agil"', 'content="Aurora_046_animacoes"')
    open(out, 'w', encoding='utf-8').write(html)
    print('gerado:', out, len(html), 'bytes')


if __name__ == '__main__':
    main()
