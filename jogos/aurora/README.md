# Aurora — Crônicas da Fenda · 046 (animações)

**Jogar:** abra `aurora-046-animacoes.html` no navegador (arquivo único, funciona offline).

## Novidades do 046
- **42 animações de habilidade** (6 básicas + 36 de vocação), cada uma com antecipação, impacto e rescaldo,
  tremor de tela nos golpes fortes. Aparecem no mapa durante o combate e respeitam “Efeitos leves” e “Reduzir movimento”.
- **Grimório de habilidades** na aba Habilidades: as 7 habilidades da classe com prévia animada em loop,
  inclusive as bloqueadas (cadeado pequeno + motivo: Rank, ramo anterior ou ramo fechado).
- **Prévia grande** ao tocar em qualquer habilidade e na janela de cada vocação, com botão Repetir.
- **Ferreiro mostra todas as armas**: todos os graus visíveis por padrão (bloqueados com cadeado pequeno e
  “Ferraria Nv.X”) e nova seção **Armas de classe**, que abre a Oficina de Classes.

## Estrutura
| Arquivo | Papel |
|---|---|
| `aurora-045-original.html` | versão de origem, intocada |
| `build.py` | gera o 046: aplica `src/patch_*.py` e injeta os módulos de `src/` antes de `</body>` |
| `src/skill-fx-core.js` | núcleo: registro das animações, kit de desenho, eventos no mapa |
| `src/skill-fx-esp-cav-arq.js`, `src/skill-fx-mag-pal-lad.js` | arte das animações por classe |
| `src/skill-preview-ui.js`, `src/skill-preview.css` | Grimório e prévias |
| `src/patch_ferreiro.py`, `src/ferreiro.css` | Ferreiro com todas as armas |
| `src/BRIEF-FX.md` | contrato para criar novas animações |
| `tools/` | testes visuais (Playwright): `fx-sheet.js`, `shots.js`, `world-fx.js` |

## Regerar e testar
```bash
python3 build.py
node tools/fx-sheet.js aurora-046-animacoes.html /tmp/fx.png esp,cav 6   # quadros das animações
node tools/shots.js aurora-046-animacoes.html /tmp/aurora habil job ferreiro
```
