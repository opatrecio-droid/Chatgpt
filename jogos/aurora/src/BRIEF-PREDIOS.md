# Briefing · Prédios de serviço em 2× e animados (Aurora 046)

O dono aprovou a **Ferraria** e a **Fazenda**, que são o padrão de qualidade. Agora cada prédio de serviço precisa
de arte 2× e animação no mesmo nível. **Não leia o HTML do jogo (6 MB)**; use `sed -n 'A,Bp'` só em faixas citadas.

## Referências obrigatórias (leia antes)
- `src/buildings-anim.js`: integração, contrato `m`/`o`, `o.workers`, arte 2× (`G.A.BuildingHD`).
- `src/buildings-art.js`: Ferraria e Fazenda prontas. Copie o estilo, o cache de sprites, os helpers e o tratamento de quiet/light/noite.
- `tools/ferraria-hd.py <id>`: gerador da arte 2× (208×228, mesmo layout). Grava `src/hd/<id>-hd.js`.
- Capturas aprovadas: `/tmp/claude-0/-home-user-Chatgpt/c8be618d-f17e-5b4b-941f-9c65a9a54f27/scratchpad/hdf-cmp.png` (Ferraria) e `bzr-grid.png` (Fazenda).

## Para cada prédio do seu grupo
1. **Arte 2×:** rode `python3 tools/ferraria-hd.py <id>`. Se o resultado não ficar no nível da Ferraria
   (telhado com luz por fileira, madeira com veios, pedra com argamassa, contorno fino), **não edite o gerador**,
   porque outros agentes o usam ao mesmo tempo. Em vez disso, crie `tools/hd_rules/<id>.py`: ele roda no fim e recebe
   `res` (uint8 228×208×4), que pode alterar; também recebe `a` (o original 1×), `hsh` (ruído por hash) e `np`.
2. **Animação:** escreva `G.A.BuildingArt.<id> = function (ctx, m, t, o) {...}` no **seu arquivo** `src/art/<grupo>.js`
   (IIFE `'use strict'`, guarda `if (typeof G==='undefined'||G.HEADLESS||!G.A) return;`,
   `G.A.BuildingArt = G.A.BuildingArt || {}`, sem `</script>`).
   - **Moradores reais trabalhando:** se a equipe trabalha no prédio, marque `fn.staffInArt = true`. Assim
     `o.workers.main`/`o.workers.helper` trazem o sprite real (`draw(ctx, x, y, {pose, flip, alpha})`), e eles somem da porta.
     Equipes (o 1º nome é o `main`):
     - cidadela: Rosa (Escrivã), Soraia (Cobradora)
     - guilda: Bento (Mestre da Guilda)
     - hospedaria: Nina e Rui (Atendentes)
     - taverna: Heitor (Taverneiro), Iara (Ajudante)
     - enfermaria: Olívia (Curandeira)
     - alquimista: Quim (Alquimista)
     - mercado: Célia (Mercadora), Dário (Feirante); Elga (Caixa) não aparece no `o.workers`
     - padaria: Alda (Padeira), Breno (Moleiro)
     - treino: Vasco (Instrutor)
     - santuario: sem equipe
     - torre: Úrsula (Guarda)
     - lenharia: Nuno (Lenhador), mas ele trabalha na floresta pelo sistema de vida, então **não** marque staffInArt
     - pedreira: Pedro (Minerador), idem, **não** marque
     - estabulo: Tomé (Tratador)
   - **Pés no chão:** os pés ficam na linha onde a fundação encontra a rua, com sombra de contato (alpha ~0,35).
     Os personagens ficam no tamanho do `draw`, sem escala extra. Use `m.blit` para pôr peças da fachada na frente deles.
   - **Vida própria do prédio:** fumaça, luzes, bandeiras ao vento, letreiros balançando, animais, objetos de ofício
     (caldeirão borbulhando, moinho girando, alvos de treino sendo atingidos, sino, etc.). Algo bonito e legível no zoom normal.
   - **Luz à noite** (o jogo descartou a luz das janelas ao trocar para arte em imagem): à noite (`o.dark`), acenda
     **todas as janelas** do prédio com brilho quente, lanternas tremulando e um halo suave no chão em frente. As janelas
     ficam apagadas de dia e acendem gradualmente no fim da tarde. Com `o.damaged`, luzes fracas ou apagadas.
   - Regras de desempenho: sprites em cache (`G.A.mk`), no máximo ~70 primitivas por quadro, partículas
     determinísticas (nunca `Math.random` por quadro), `o.light` → 1/3 das partículas, `o.quiet` → sem movimento.

## Testar (tudo no scratchpad)
```bash
cd /home/user/Chatgpt/jogos/aurora; S=/tmp/claude-0/-home-user-Chatgpt/c8be618d-f17e-5b4b-941f-9c65a9a54f27/scratchpad
python3 build.py --out $S/<grupo>.html --only hd/,art/,buildings-art.js,buildings-anim.js
node tools/building-shots.js $S/<grupo>.html $S/<grupo>-<id> <id>
```
O prédio vai para o nível 1, às 10h, com a equipe no posto. São geradas estas capturas:
- `-cena`: zoom normal;
- `-dia-1..8`: close a cada 0,12 s;
- `-noite`: 23h, com a equipe em casa;
- `-forjando-1/2`: as duas últimas, ignore.

Amplie com PIL o recorte 100,150 → 700,820. A saída precisa terminar com `sem erros`.
Não edite arquivos de outros grupos, `build.py` ou `buildings-anim.js`. Não faça commit.
