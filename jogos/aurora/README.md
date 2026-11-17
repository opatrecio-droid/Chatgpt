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

- **Janela de retorno em abas** (Achados, Resumo, Diário) com cartas por raridade, brilhos e revelação 3D.
- **Portal de Aurora** no eixo da cidade (portão norte → fonte), com arco gótico animado, vórtice em espiral,
  runas, círculo rúnico no chão e explosão ao chamar um herói.
- **Ferraria animada**: forja acesa e fumaça na chaminé; os moradores Fábio (martela na bigorna) e Gilda (aviva o fogo) trabalham ali no expediente (descansam à noite;
  acelera quando uma peça é forjada).
- **Fazenda animada**: celeiro em 2× com galo cata-vento, fumaça e galinhas ciscando; plantação em 2× com trigo e
  ervas em todos os estágios, vento em ondas, rajada dourada, borboletas, abelhas, pássaros e vagalumes à noite.
- **Todos os 16 prédios de serviço em 2× e animados**, com os próprios moradores trabalhando (Heitor serve canecas, Alda tira
  o pão do forno, Quim mexe o caldeirão, Vasco golpeia o boneco, Tomé escova o cavalo…), moinho, bandeiras, fumaça,
  serra, guindaste, sino; janelas apagadas de dia e acesas à noite em todos (`capturas/predios-dia-noite.png`).
- **Cidade viva**: portas das casas abrem quando o morador chega e ele entra pela soleira; janelas das casas acendem
  uma a uma ao anoitecer (mais luz com gente em casa) e apagam de madrugada; postes acendem em sequência a partir
  da praça, com poça de luz, névoa, mariposas e vagalumes.
- **Colisão** nos objetos da cidade (bancos, postes, barris, caixotes, canteiros, barracas…): ninguém atravessa.
- **HUD mais limpo**: sem o cartão "herói em perigo" (Reunir/Curar) e sem a barra de vida do chefe no topo; a vida
  do chefe aparece só sobre ele, no mapa.
- **Guardas vivos**: ronda ao longo do muro, olham para os lados, ficam em alerta e saúdam quando um herói passa,
  falas ociosas, tocha à noite e troca de turno às 6h.
- **Bosque de caça (Lenharia)**: a mata inteira a leste do rio; 1/3 das árvores dá frutos que amadurecem e caem;
  16 animais (cervos, javalis, coelhos, pássaros), cada um com seu território espalhado pela mata, comem os frutos,
  fogem de gente e do barulho do tiro e se reproduzem com fartura. Zeno caça com arco (6h–17h),
  nunca abate o último de uma espécie e entrega na Lenharia: cervo +2 couro +3 refeição; javali +2 couro +1 presa
  +4 refeição; coelho +1 refeição.

## Estrutura
| Arquivo | Papel |
|---|---|
| `aurora-045-original.html` | versão de origem, intocada |
| `build.py` | gera o 046: aplica `src/patch_*.py` e injeta os módulos de `src/` antes de `</body>` |
| `src/skill-fx-core.js` | núcleo: registro das animações, kit de desenho, eventos no mapa |
| `src/skill-fx-esp-cav-arq.js`, `src/skill-fx-mag-pal-lad.js` | arte das animações por classe |
| `src/skill-preview-ui.js`, `src/skill-preview.css` | Grimório e prévias |
| `src/patch_ferreiro.py`, `src/ferreiro.css` | Ferreiro com todas as armas |
| `src/return-cards.js`, `src/return-cards.css` | janela de retorno com abas e cartas |
| `src/portal.js`, `src/portal-art.js` | posição e arte animada do portal |
| `src/buildings-anim.js`, `src/buildings-art.js` | integração dos prédios animados; Ferraria e Fazenda |
| `src/art/comercio.js`, `src/art/civico.js`, `src/art/natureza.js` | arte animada dos outros 14 prédios |
| `src/hd/*.js` (gerados por `tools/ferraria-hd.py <id>` + `tools/hd_rules/<id>.py`) | prédios em 2×, mesma densidade dos moradores |
| `src/cidade-viva.js` | portas, janelas das casas e postes |
| `src/guardas.js` | guardas dos portões com ronda e vida |
| `src/bosque-caca.js` | frutos, animais e a caça de Zeno |
| `src/farm-crops.js` | plantação da Fazenda em 2× com vento e vida |
| `src/BRIEF-FX.md` | contrato para criar novas animações |
| `tools/` | testes visuais (Playwright): `fx-sheet.js`, `shots.js`, `building-shots.js`, `cidade-shots.js`, `guardas-shots.js`, `bosque-shots.js`, … |

## Regerar e testar
```bash
python3 build.py
node tools/fx-sheet.js aurora-046-animacoes.html /tmp/fx.png esp,cav 6   # quadros das animações
node tools/shots.js aurora-046-animacoes.html /tmp/aurora habil job ferreiro
```
