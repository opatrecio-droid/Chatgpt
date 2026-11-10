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
- [ ] 1. Núcleo, dados e simulação (heróis, monstros, cidade, economia)
- [ ] 2. Arte procedural (personagens, monstros, construções, terreno) e renderização
- [ ] 3. HUD e telas (Reino, Heróis, Forja, Missões, Mais)
- [ ] 4. Áudio, tutorial, eventos, progresso offline
- [ ] 5. Balanceamento medido por simulação + teste de pisca-pisca no celular
- [ ] 6. README e entrega

## Notas de retomada
(atualizado a cada etapa concluída)
