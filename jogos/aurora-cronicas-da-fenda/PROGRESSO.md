# Aurora — Crônicas da Fenda · Diário do ciclo de melhoria

Objetivo: levar o Aurora a **10/10 em diversão** e **10/10 em viciante**, usando o Evil Hunter Tycoon (EHT)
como referência de mecânicas (inspiração de mecânicas, nunca cópia de nome, arte, personagens ou textos).

## Papéis
- **Líder (Opus)**: análise, visão, definição das tarefas, avaliação final de cada ciclo.
- **Pesquisa (Haiku 5.5, esforço alto)**: tudo o que é público sobre o EHT e por que ele vicia.
- **Implementação (Sonnet 5.5, esforço extra alto)**: executa as tarefas definidas pelo líder.

## Retomada após limite de uso
Há um agendamento de hora em hora neste mesmo chat que relê este arquivo e retoma do próximo passo
pendente. Ele deve ser apagado quando as duas notas chegarem a 10/10.

## Arquivos
- `aurora.html` — versão de trabalho (sempre a mais nova).
- `versoes/aurora-v22-base.html` — versão enviada pelo usuário (ponto de partida, intocada).
- `pesquisa/` — relatórios da pesquisa sobre o EHT.
- `AVALIACAO.md` — rubrica de diversão/vício e notas de cada ciclo.

## Estado atual
- Ciclo 1 concluído (v23.0): Diversão 7,2 → 8,0 · Viciante 5,8 → 7,7. Ciclo 2 em andamento (`PLANO-CICLO-2.md`).
- Método (desde 16:30 UTC de 11/11): **um lote por vez, direto na branch `ccr-5878aa8d-eltmr3`**, com commit e
  push a cada item concluído e o item marcado abaixo. Assim nada se perde se o limite de uso pausar a sessão.
- Para retomar: o próximo item é o primeiro `[ ]` da lista. Relance um Sonnet (esforço extra alto) com o
  lote correspondente de `PLANO-CICLO-1.md`, dizendo quais itens já estão `[x]`.

### Lote 1-A — forja-loteria e primeiro minuto
- [x] 1A.1 Jogo novo sem janelas de novidades de versões antigas
- [x] 1A.2 Inscrições aleatórias nos equipamentos (efeitos reais)
- [x] 1A.3 Reforja "manter ou aceitar" + Pó de Reforja do desmonte
- [x] 1A.4 Cerimônia de raridade (Épico+, maior para Lendário/Mítico)
- [x] 1A.5 Garantia do Portal (10 sorteios)
- [x] 1A.6 Versão 23.0

### Lote 1-B — voltar é um presente
- [x] 1B.1 Tela de retorno com cartas para virar
- [x] 1B.2 Calendário de 7 dias
- [x] 1B.3 Criatura da sorte tocável
- [x] 1B.4 Semana temática com prazo real

### Depois do ciclo 1
- [x] Avaliação do líder (simulador + navegador) e notas novas em `AVALIACAO.md` → **Diversão 8,0 · Viciante 7,7**

### Lote 2-A — Arena das Duas Luas (`PLANO-CICLO-2.md`)
- [x] 2A.1 Reinos rivais
- [x] 2A.2 Duelo (determinístico, animado, funciona sem tela)
- [x] 2A.3 Tíquetes e temporada semanal com ligas
- [x] 2A.4 Loja de Insígnias + sumidouro de moedas
- [x] 2A.5 Acesso, passo da Jornada e eventos de duelo
- [x] 2A.6 Robô do simulador duela; taxa de vitória 55–70% (6 h, sementes 1/2/3: 61,3% / 62,8% / 62,5%)

Notas técnicas do lote 2-A (para os lotes 2-B/2-C):
- Código novo: `39-arena.js` (simulação, sem DOM) e `65-ui-arena.js` (telas), antes de `90-main.js`. Estado em `S.arena` (inicialização preguiçosa, `G.arena()`).
- Evento `G.emit('duelo', { win, ids, rival: { i, name, ratio, size, ch, label }, pts, streak, ins, mvp: { name, dmg, cls }, t })` a cada duelo; `G.emit('arena', { t: 'open'|'duel'|'season'|'shop'|'coin'|'ticket'|'result' })` para o resto.
- `S.arena.titulos = [{ id: 'arena_diamante'|'arena_lenda', name, liga, sea, n }]` (título exclusivo de Diamante+); `S.arena.hist` guarda as últimas 8 temporadas; `S.stats.duels`/`duelWins` contam duelos.
- Relógio próprio `G.arenaNow()` (padrão: `Date.now()`); o simulador o troca por um relógio virtual (1 dia de jogo = 1 dia da Arena).
- Equilíbrio num só lugar: `G.ARENA` (tíquetes, custo de Núcleos, K dos rivais, pontos diários dos rivais, vida ×2,2 e cura ×0,5 no duelo, passo 0,2 s) e `G.ARENA_LEAGUES` (pontos de cada liga e baú).
- Heróis em caçada **podem** duelar: o duelo é uma exibição de "ecos de luz" (usa os atributos reais, sem ânimo/ferimento) e não tira ninguém do mapa, então duelar nunca pune quem está caçando.
- O rival envia 3–5 heróis (fixo por reino) e o jogador monta equipe do mesmo tamanho; o poder de cada herói rival espelha o do herói do jogador na mesma posição (vocação e nível das habilidades incluídos) e a razão final (70%–140%) é calibrada por simulação para a chance-alvo de cada vaga (Fácil/Justo/Difícil).
- Passo da Jornada inserido sem mexer em `G.QUESTS`: `G.questCur` devolve "Vença um duelo na Arena" (`S.quest.arena = 1` ao resgatar) assim que `S.quest.step >= 22` e a Arena está aberta; saves antigos não pulam nem repetem passos.
- Ganchos mínimos no código antigo (61-ui-sheets): `UI.SHEETS = SHEETS`, `'-arena'` no relatório diário e `q.tag` no cartão da Jornada.

### Lote 2-B — Lendas pessoais e Poder do Reino
- [x] 2B.1 Livro de Feitos
- [x] 2B.2 Títulos
- [x] 2B.3 Herói do Dia
- [x] 2B.4 Poder do Reino, recordes e marcos

Notas técnicas do lote 2-B (para o lote 2-C):
- Código novo: `3A-lendas.js` (simulação, sem DOM) e `66-ui-lendas.js` (telas), antes de `90-main.js`, depois dos blocos 39/65. Estado: `h.feitos` em cada herói (salvo com o herói; `G.feitos(h)` cria sob demanda e, em herói de save antigo, estima elites/chefes/gasto pelos números que já existiam) e `S.lendas` (`G.lendas()`: `rec` recordes, `pw` poder e marcos, `hod` Herói do Dia, `hh` histórico).
- Tudo entra por wrappers e eventos, com contadores O(1): `G.killMon`, `G.dmgToMon`, `G.heroFall`, `G.promote`, `G.rebirth`, `G.relicRoll`, `G.riftWin`, `G.newDay`, `G.earn` (+ `G.updateHero` só para saber qual herói pagou), `G.heroBonus` (bônus do título exibido; troca marca `h._dirty`), `G.tick` (poder 1×/s, peça mais forte a cada 5 s), `G.afterLoad`/`G.newGame`. Eventos novos: `'titulo' {h,t,auto,set}`, `'hod'`, `'recorde' {key,r}`, `'pmark' {i,v,rw}`.
- Títulos: `G.TITLES` (31, dois deles da Arena concedidos à equipe quando a temporada fecha em Diamante/Lenda), só o título exibido (`h.feitos.ts`) dá bônus (≤ 5% por atributo). `G.titleSet(h,id)`, `G.titleOf(h)`, `G.titleProgress(h,t)`. Herói de save antigo ganha os títulos que já merecia em silêncio e um único aviso.
- Poder do Reino: `G.kingPower()` / `G.kingPowerParts()` (heróis = `G.arenaHeroPow` × 2,3; construções 18/nível, Cidadela ×3; bênçãos 22; obras 16). Pesos em `G.LENDAS`. Marcos em `G.POWER_MARKS` (1k, 2,5k, 5k, 7,5k, 10k, 15k, 20k, 25k, 30k, 40k, 50k… depois ×1,6); prêmio por marco em `G.powerPrize(i)` (Núcleo nos pares, Selo nos ímpares, Pó de Reforja sempre), concedido na hora na simulação; a cerimônia (carta curta) só abre com `!UI.modalOpen` e tutorial concluído. `G.nextPowerMark()` devolve `{ i, v, from, pct, rw }`: é o que a "próxima recompensa" do HUD (2C.5) deve ler.
- Recordes: `G.RECS` (golpe, abates/dia, moedas/dia, peça mais forte, andar da Fenda, sequência de duelos); aviso "Novo recorde!" só depois de aquecer (`warm`) e com intervalo mínimo por recorde (`cd`). Aba "Recordes" em Mais (também abre pelo chip de Poder no HUD).
- Ganchos mínimos no código antigo (61-ui-sheets): `HTABS` ganhou `['feitos','trophy','Feitos']`, `UI.feitosTab(x)` no `heroDetail`, `UI.hTitle(x)` no cabeçalho da ficha e `UI.hTitle(x,1)` no cartão da lista, e `UI.vw = () => v` (vínculos ao vivo para abas externas). O cartão do Herói do Dia entra no "Livro-caixa de ontem" por um wrapper de `SHEETS.reino.render`; o chip de Poder entra em `#hudx` (linha da semana temática) por um wrapper de `UI.build`.
- Simulador: `--save=arquivo.json` grava o estado final; o relatório ganhou as linhas "Lendas", "Poder do Reino" (com o minuto de cada marco) e "Recordes" (`--titles` mostra os minutos de cada título).

### Lote 2-C — Clareza, coleção e próxima recompensa
- [x] 2C.1 Tutorial que aponta
- [x] 2C.2 Fila única de janelas
- [x] 2C.3 Poder da peça correto
- [x] 2C.4 Códex de Inscrições
- [x] 2C.5 Próxima recompensa no HUD
- [x] 2C.6 HUD mais limpo
- [ ] 2C.7 Versão 24.0

### Depois do ciclo 2
- [ ] Avaliação do líder e notas novas em `AVALIACAO.md`

## Histórico
| Data | Ciclo | Etapa | Resultado |
|---|---|---|---|
| 2026-11-11 | 1 | Base v22 copiada para o repositório; pesquisa disparada | — |
| 2026-11-11 | 1 | Pesquisa (3 relatórios), simulador `ferramentas/sim.js`, rubrica e plano | Diversão 7,2 · Viciante 5,8 |
| 2026-11-11 | 1 | Lotes 1-A e 1-B em paralelo pararam no limite de 5 h; as worktrees se perderam no reinício do contêiner | Refeito em série, com push por item |
| 2026-11-11 | 1 | Lote 1-A concluído (v23.0): inscrições, reforja, cerimônia, garantia do Portal, jogo novo sem novidades | Capturas em `capturas/ciclo1-a/`; simulador sem erros |
| 2026-11-11 | 1 | Lote 1-B concluído: cartas de retorno, calendário de 7 dias, criatura da sorte, semana temática (módulos `38-retorno` e `64-ui-retorno`) | Capturas em `capturas/ciclo1-b/`; simulador sem erros e idêntico à base 23.0 quando nenhuma semana está ativa (`--week=none`) |
| 2026-11-11 | 1 | Lote 1-B concluído; avaliação do ciclo 1 | Diversão 8,0 · Viciante 7,7 |
| 2026-11-11 | 2 | Lote 2-B concluído: Livro de Feitos, 31 títulos, Herói do Dia, Poder do Reino, recordes e marcos (módulos `3A-lendas` e `66-ui-lendas`) | Capturas em `capturas/ciclo2-b/`; simulador sem erros (primeiro título 9 min, marcos de poder 1k@4m, 2,5k@26m, 5k@43m, 10k@79m, 25k@129m); ritmo igual ao de antes (3 sementes: 7.087 → 7.136 abates em 170 min) |
| 2026-11-11 | 2 | Lotes 2-A (Arena) e 2-B (lendas, Poder do Reino) concluídos; 2-C parou no limite de 5 h (renova 21:30 UTC) antes do 1º item | Retomada agendada para 21:32 UTC |
