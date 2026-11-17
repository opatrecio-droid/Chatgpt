# Aurora 046 · marcações de dados na aba Habilidades para as prévias animadas.
# Cada substituição precisa ocorrer exatamente uma vez no arquivo de origem.

PATCHES = [
    # Ficha de habilidade aprendida (básica, 2ª ou 3ª)
    ("return '<div class=\"sk\"><div class=\"row\"><span class=\"ski\" style=\"background:' + col + '\">'",
     "return '<div class=\"sk\" data-skill=\"' + (i === 0 ? 'base:' + x.cls : i === 1 ? x.j2 : x.j3) + '\" data-hero=\"' + x.id + '\"><div class=\"row\"><span class=\"ski\" style=\"background:' + col + '\">'"),
    # Opção de vocação (inclusive bloqueada)
    ("'<button class=\"sk opt2' + (pickable ? ' can' : ' off') + '\" data-a=\"job:' + x.id + ':' + id + '\"><div",
     "'<button class=\"sk opt2' + (pickable ? ' can' : ' off') + '\" data-a=\"job:' + x.id + ':' + id + '\" data-skill=\"' + id + '\" data-hero=\"' + x.id + '\"><div"),
    # Nós da árvore de vocação
    ("return '<button class=\"node' + (on ? ' on' : '') + (dim ? ' dim' : '') + '\"' + (id ? ' data-a=\"job:' + x.id + ':' + id + '\"' : '')",
     "return '<button class=\"node' + (on ? ' on' : '') + (dim ? ' dim' : '') + '\" data-skill=\"' + (id || 'base:' + x.cls) + '\" data-hero=\"' + x.id + '\"' + (id ? ' data-a=\"job:' + x.id + ':' + id + '\"' : '')"),
    # Janela de vocação: hospedeiro da prévia grande
    ("'</div><h2>' + j.name + '</h2><p class=\"lead\">' + j.desc + '</p>",
     "'</div><h2>' + j.name + '</h2><div class=\"sfx-prev-host\" data-skill-preview=\"' + id + '\" data-hero=\"' + x.id + '\"></div><p class=\"lead\">' + j.desc + '</p>"),
]


def apply(html: str) -> str:
    for old, new in PATCHES:
        n = html.count(old)
        if n != 1:
            raise SystemExit('patch_core: âncora encontrada %d vezes: %s' % (n, old[:80]))
        html = html.replace(old, new)
    return html
