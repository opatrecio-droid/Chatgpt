# Aurora — Crônicas da Fenda · v19 "Reforjada" — progresso

Arquivo de controle para retomar o trabalho entre sessões.

## Decisão
A v18 (`versoes/aurora-cidade-viva-18.html`, 13 MB) acumulava ~100 camadas de patch
que reescreviam o HUD umas 30 vezes por segundo (causa do pisca-pisca no celular).
A v19 é uma reconstrução limpa do mesmo mundo (Aurora, Portal, Fenda, Selos, Núcleos,
ranks E→SSS, elenco de moradores), com arte procedural própria e um único HUD.

## Estrutura
- `src/*.js`, `src/style.css`, `src/fonts.css` — fonte do jogo, em módulos numerados.
- `tools/build.js` — junta tudo em `aurora-cidade-viva-19.html` (arquivo único, offline).
- `tools/sim.js` — simulação sem tela para medir ritmo, economia e quedas de heróis.
- `tools/shot.js` — capturas de tela no celular/desktop para revisar a arte.

## Etapas
- [x] 1. Núcleo, dados e simulação (heróis, monstros, cidade, economia)
- [x] 2. Arte procedural (personagens, monstros, construções, terreno) e renderização
- [x] 3. HUD e telas (Reino, Heróis, Forja, Missões, Mais)
- [x] 4. Áudio, tutorial, eventos, progresso offline
- [x] 5. Balanceamento medido por simulação + teste de pisca-pisca no celular
- [x] 6. README e entrega
- [ ] 7. Polimento extra (opcional): praça, arena da Cratera, mais variedade visual

## Notas de retomada
- Tudo acima está no ar na branch. `node tools/build.js` regenera o HTML.
- Testes: `node tools/sim.js 60`, `node tools/play.js <pasta>`, `node tools/play2.js <pasta>`.
- Última medição (robô ativo, 60 dias): Rank D dia 3, C dia 11, B dia ~20, A dia ~35-40;
  ~1,5 queda/dia; Maré vencida por quem joga bem, perdida por quem negligencia.
