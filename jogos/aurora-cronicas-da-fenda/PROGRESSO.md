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
- Ciclo 1 (v23.0): Diversão 7,2 → 8,0 · Viciante 5,8 → 7,7. Ciclo 2 (v24.0): Diversão 8,7 · Viciante 9,2. Ciclo 3 (v25.0): Diversão 9,5 · Viciante 9,9. Ciclo 4 em andamento (`PLANO-CICLO-4.md`, um agente por vez).
- Método (desde 16:30 UTC de 11/11): **um lote por vez, direto na branch `ccr-5878aa8d-eltmr3`**, com commit e
  push a cada item concluído e o item marcado abaixo. Assim nada se perde se o limite de uso pausar a sessão.
- **Ciclo 3 em paralelo (autorizado pelo usuário em 11/11, 20:3x UTC)**: 3-A roda na branch principal; 3-B, 3-C e
  3-D rodam em worktrees e enviam para `ccr-5878aa8d-eltmr3-lote-3b`, `-lote-3c`, `-lote-3d`, com o andamento em
  `lotes/3b.md`, `lotes/3c.md`, `lotes/3d.md` (dentro de cada branch auxiliar). Se pausar: relançar cada lote numa
  worktree a partir da sua branch auxiliar (o prompt manda `git reset --hard origin/<branch>` e seguir do primeiro `[ ]`).
  Quando os quatro terminarem: juntar as três branches na principal (blocos novos ficam todos antes de `90-main.js`;
  conflitos ali = manter os dois lados), marcar a lista abaixo, subir a versão para 25.0 e avaliar.
- **Decisão do usuário (12/11): depois do ciclo 3, só UM agente por vez** (volta ao método em série, direto na
  branch principal, push por item). O paralelismo vale apenas para os lotes 3-A a 3-D já em andamento.
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
- [x] 2C.7 Versão 24.0

Notas técnicas do lote 2-C:
- Código novo: `3B-clareza.js` (simulação, sem DOM: poder da peça, Códex e próxima recompensa) e `67-ui-clareza.js` (guia, fila de janelas, novidades, abas e linha de recompensa, ajustes de HUD), antes de `90-main.js`. Ferramentas novas em `ferramentas/`: `ed.js` (aplica edições exatas no aurora.html, que tem linhas enormes) e `teste-lib.js` (carrega o jogo sem tela e dirige o Chromium: `load`, `open`, `watch`, `mkSave`).
- Guia que aponta (2C.1): a apresentação da Rosa tem 2 falas; ao terminar grava `S.tut.guide = 1` e `UI.guideTarget()` decide, a cada quadro, o próximo toque dos passos 0, 2, 3 e 4 da Jornada (Portal → Contratar → candidato; Reino › Prédios › Construir; Forja › Forjar; resgate). A mão só recebe toque no ✕ (`S.tut.guide = 0`). Saves antigos não têm `guide`: nunca veem a seta. O passo 5 em diante desliga o guia.
- Fila única (2C.2): `UI.queueModal(prio, fn, chave)`, `UI.PRIO` = tut 0 · retorno 1 · novidades 2 · baú da Arena 3 · calendário 4 · cerimônias 5 · eventos 6; ~600 ms entre janelas; a chave evita duplicatas. `fn()` revalida e abre a janela (ou devolve false). Os pumps de 60/62/63/64/65/66 agora só enfileiram. Eventos pendentes num save voltam a abrir (antes ficavam presos). Novidades: `UI.NEWS` (v20, v21, v22, v24) e `UI.whatsNew()` abrem UMA janela com seções recolhíveis só das versões não vistas (`S.tut.seen.v24`; jogo novo já nasce com tudo visto). Calendário de jogo novo espera 150 s. Avisos: máx. 3, repetidos viram ×N, ancorados abaixo do HUD (`--hudb`) e acima do painel.
- Poder da peça (2C.3): cada inscrição tem agora dois pesos em `G.INS[id]`: `sc` (o antigo, usado por `G.itemScore` e pela IA dos heróis para escolher peças — comportamento intocado) e `pw` (peso de exibição, calibrado pela elasticidade do poder do herói; comentário em 3B). `G.piecePower(it)` = atributos-base + inscrições por `pw`; `G.pieceCmp(a, b)` → `{ pct, ins, same }` (igual = menos de 1%). A Reforja mostra "Poder da peça" e "só as inscrições"; o presente do trono mostra +N%/−N%.
- Códex (2C.4): `S.codex = { ins, gear, ms, fresh, back }`; `G.codexNote/Sync/Check/Next`; 14 marcos em `G.CODEX_MS` com prêmio (Núcleos, Selos, Pó de Reforja). Registra forja, presentes, cartas e reforja aceita; em saves sem Códex registra o que já existe em silêncio (sem prêmio). Aba Mais › Códex e atalho na Forja.
- Próxima recompensa (2C.5): `G.nextReward()` devolve `{ best, all }`; a linha `#nrw` fica acima da barra da Jornada (variável `--qh`), atualiza a ~1 Hz e só mexe no DOM quando o item muda. Prontos (calendário, contrato, conquista, promoção) vencem; depois a maior fração.
- HUD (2C.6): chips com área de toque ≥ 40 px (pseudo-elemento vertical), duelo com nome sob a barra de vida e números sobre o retrato, palco sem cortar a 4ª coluna em 360 px. `G.arenaOffers()` ganhou `G.arenaOffersStep()`/`G.arenaOffersReady()` (um rival por passo, ≈25–60 ms) e a interface espalha o cálculo com `UI.arenaWarm()`: abrir a Arena passou de 102 ms bloqueados para 6 ms, sem tarefas longas; o simulador chama a versão síncrona e o resultado é idêntico.

### Depois do ciclo 2
- [x] Avaliação do líder e notas novas em `AVALIACAO.md` → **Diversão 8,7 · Viciante 9,2**

### Lote 3-A — Colosso da Semana (`PLANO-CICLO-3.md`)
- [x] 3A.1 Colosso semanal com vida persistente
- [x] 3A.2 Ranking de dano, marcos e baú/relíquia
- [x] 3A.3 Funciona sem tela + fila de janelas

Notas técnicas do lote 3-A:
- Código novo: `3C-colosso.js` (simulação, sem DOM) e `68-ui-colosso.js` (arte, desenho, HUD, aba, cerimônias), antes de `90-main.js`. Ferramenta nova `ferramentas/modulo.js` (`get`/`put` de um módulo inteiro do aurora.html para editar em arquivo comum; `AURORA_FILE=` aponta outra cópia) e `ed.js`/`modulo.js` aceitam `AURORA_FILE`; `teste-lib.js` ganhou `open({init, initArg})` e `fakeClock` (troca `Date.now` para testar quinta/sexta/domingo/segunda).
- Relógio: o mesmo da Arena (`G.arenaNow`, que o simulador troca por um virtual de 1 dia de jogo = 1 dia real, começando numa segunda). Semana segunda–domingo: seg–qua descanso, quinta aviso (`G.colossoWin().phase` 'warn'), sexta 00:00 a domingo 23:59 'on'. O tipo gira por `semana % 3` (Grão-Casco, Cristalão, Nevoeirão; `G.COLOSSI`). Estado em `S.colosso` (`G.colosso()` preguiçoso): `wk, id, hpMax, hp, dmg, bonus, mk (marcos já pagos), win, fl (quedas), mode (0 Livre, 1 Convocar, 2 Dispensar), hero/hn (dano por herói), pend (cerimônias), hist (8 semanas), tot, pr, y (rendimento da caçada)`. A vida (`hpMax`) é calibrada na 1ª vez que o jogador o vê na semana: `G.colossoPower()` (dano/s estimado da equipe) × `G.COLOSSO.budgetMin` (48 min). Medido no simulador (`--clab`): todos convocados levam ~65 min de luta para derrubar, no modo Livre ~90 min.
- Monstro: entra em `G.mons` como boss com `m.colosso = 1`, `m.nodraw = 1` (o render pula; desenho próprio em 68), `state 'colosso'`, parado em `G.COLOSSO.at`; vida do monstro é a autoridade durante a sessão e `S.colosso.hp` a copia a cada tick (nada o cura). Ataque/defesa acompanham os 5 melhores heróis (`hitK`, `defK`). Golpes telegrafados (`warn` fx) de 3 tipos: pisão (círculo no herói), chuva (círculos nos heróis) e tremor (anel de 6,6 tiles em volta); os heróis se esquivam depois de ~0,3–0,8 s.
- Heróis: estado novo `'colosso'` (ganchos mínimos em 30-heroes: `updateHero` e `leaveTown` chama `G.colossoPick(h)`; `findTarget` ignora `m.colosso`). Modo Livre: a cada decisão metade dos aptos (vida ≥ 85%, fome ≥ 40, energia ≥ 35, ordem automática) vai; Convocar manda todos (e recolhe quem caça); Dispensar ninguém. Aurora entrega poções do estoque. Queda diante do Colosso é honrosa (espólio, moedas e XP preservados, falls não contam). Soldo: `y` mede por segundo-herói de caçada o XP e as moedas (em frações do nível de quem abateu, para o mais fraco não receber o que o mais forte ganha), os materiais por tipo e o renome dos abates comuns, e `payHero` paga isso (×1,0) a quem luta, a cada 2 s. Medido no simulador com 6 sementes de 170 min e 2 de 360 min: o Colosso não piora o ritmo (Livre ≈ neutro aos 170 min; aos 360 min o Poder do Reino ficou 16–46% acima de uma partida sem Colosso, sobretudo pelos prêmios; Convocar, que o robô usa 3/7 do tempo de jogo, 19–92% acima). Vigiar no lote 3-C: Núcleos, Selos e Pó de Reforja vindos do Colosso (≈ 8 Núcleos + 7 Selos + 56 Pó por semana no modo Livre, ≈ 20 + 15 + 110 derrubando o Colosso).
- Ranking: `G.colossoStanding()` = 40 reinos da Arena (força fixa por rank de `r0`/`act`, `rivF` de ~8% a ~108% da vida, curva diária 26/40/34% de sex a dom) + jogador; derrubar cedo dá bônus de abate (até +25% da vida contado no ranking). Prêmios: `G.colossoMarkPrize(i)` (5 marcos: 8, 20, 40, 65, 85% da vida), `G.colossoChest()` + relíquia exclusiva (`r_col_casco`, `r_col_cristal`, `r_col_nevoa`; `cosCan` diz de onde vêm) e `G.colossoRankPrize(pos)` na virada da semana (`settle`, também ao abrir o jogo dias depois). Cerimônias (`S.colosso.pend`, 'win' e 'rank') abrem pela fila `UI.queueModal(PRIO.cerimonia)`.
- Ganchos no código antigo: `G.nextReward` (marco do Colosso), `#bossbar` ignora o Colosso, status do herói ('Contra o Colosso'), `UI.arenaEmblem`/`UI.arenaAUR` exportados de 65 (o ranking usa os mesmos brasões). Simulador: `--cmode=0|1|2`, `--cbudget=` (padrão 8 no sim, 48 no jogo), `--clab=MIN` (congela a semana num sábado para medir o abate) e a linha "Colosso" no relatório.

- 3A.3 (sem tela, fila, robustez): o relatório do `sim.js` tem a linha "Colosso" (semanas, dano, posição, derrotado, marcos, baús, prêmios, lutadores, quedas honrosas por herói-minuto). 360 min, sementes 1 e 2, modo Convocar: 9 semanas cada, derrotado 8/9 e 7/9, posições 2º–6º (14º nas semanas fracas), zero erros; modo Livre: ~65–80% do dano da semana, posições 5º–19º, nenhum abate (como esperado: o robô joga só 15 min por fim de semana). Navegador (Chromium, `fakeClock`): quinta (aviso: toast, faixa e chip), sexta (despertar, heróis marchando e lutando, barra grande), domingo derrotado (baú e relíquia pela fila), segunda ao abrir o jogo (retorno → prêmio do ranking → marco de poder → calendário, nessa ordem), save da base v22 sem erros (412×860 e 360×640), Maré e Fenda durante o Colosso, toque no Colosso abre o inspetor, trocar o modo pela aba. Desempenho (Chromium sem GPU, 60 fps nos três casos): v24 sem Colosso, tempo de desenho 0,46 ms/quadro e laço 0,155 ms/quadro; v25 com o Colosso em cena e 8 heróis lutando, 0,79 ms e 0,178 ms (a 3×: 1,06 ms e 0,276 ms contra 0,62 ms e 0,299 ms sem ele).

### Lote 3-B — Nêmesis, visitantes e laços
- [x] 3B.1 Nêmesis e revanche (+ notícia no retorno)
- [x] 3B.2 Visitantes rivais na cidade
- [x] 3B.3 Laços entre heróis

### Lote 3-C — Renascimento que dá vontade
- [x] 3C.1 Pontos de Renascimento e traços
- [x] 3C.2 Prévia e cerimônia
- [x] 3C.3 Ritmo do primeiro renascimento (6–10 h)

### Lote 3-D — Último atrito
- [x] 3D.1 Guia completo e pré-requisitos visíveis
- [x] 3D.2 HUD 360×640
- [x] 3D.3 Quedas raras e dramáticas
- [x] 3D.4 Peças inscritas de elites/chefes + proteção no +N
- [x] 3D.5 Vibração/tremor e sugestão de Obras; versão 25.0

### Depois do ciclo 3
- [x] Avaliação do líder e notas novas em `AVALIACAO.md` → **Diversão 9,5 · Viciante 9,9**

### Lote 4-A — Pedidos dos moradores e vida na cidade (`PLANO-CICLO-4.md`, um agente por vez)
- [x] 4A.1 Pedidos dos moradores (maior vazio ≤ 180 s)
- [x] 4A.2 Cenas da cidade

Notas técnicas do lote 4-A (4A.1):
- Código novo: `3G-cidade.js` (simulação, sem DOM) e `6C-ui-cidade.js` (balão, cartão, avisos), antes de `90-main.js`. Estado em `S.pedidos` (`G.pedidos()`, preguiçoso): `{ nA, nB, last, list, n, x, seq, hist, disc, who }`; cada pedido `{ id, m (modelo), who, lane, t0, dl, dln (nome do prazo), a (parâmetros), n, p (progresso), rw (prêmio), q (fala), fin? }`. Tudo em segundos do relógio do jogo (`S.t`), então respeita a velocidade.
- Equilíbrio num só lugar: `G.PEDIDOS` (primeiro pedido depois de 150 s e 2 missões da Jornada; `cadA` 100–155 s, `cadB` 220–340 s, `chainB`, `gap` 35 s, desconto 25% por 600 s). Duas "pistas": A = entrega do Armazém (cumpre-se na hora; nunca pede mais de 25% do estoque nem de coisa que falta) e B = demorados (um por vez). Máximo 2 ativos; vencer não pune. É essa estrutura que garante o vazio máximo: toda entrega da pista A é um momento que o robô cumpre em segundos, e a pista A nasce a cada 100–155 s.
- 17 modelos em `G.PEDIDO_MODELS` (`def(id, { kind: res|cnt|time, w, mk, title, quote, hit, ev|stat })`): entrega, mat, rara (Armazém); forja_rar, forja_n, abate, elite, chefe, refeicoes, pocoes, vendas, nivel, contrato, ouro, arena, colosso, obra (contagem por `G.questEvent` envolvido, evento `duelo`, estatística ou dano ao Colosso) e cuidado (prazo cumprido; uma queda antes do prazo cancela sem castigo). Prêmio: moedas + extra sorteado (Pó de Reforja, ânimo da cidade, desconto de obras no prédio do morador, Núcleo, Pergaminho de Proteção, Selo). Falas de agradecimento por morador em `G.THANKS`.
- Conquista nova `pedidos` ("Vizinho de todos") em `G.ACH`. `G.bCost` envolvido (desconto). `G.nextReward` envolvido: item "Pedido" (pronto → toque entrega direto, `pedidoent:ID`; senão abre o cartão, `pedido:ID`). Evento `'pedido' { t: novo|entregue|expirou|falhou, r, ... }` (o simulador marca a entrega como momento). Aba Missões › Contratos ganhou a lista "Pedidos da cidade" (wrapper de `UI.SHEETS.missoes.render`).
- UI: balão "!" dourado (verde com ✓ quando cumprido) sobre o morador ou sobre o letreiro do prédio dele, se estiver dentro (`R.dynMore`/`R.pick`/`R.nightMore` envolvidos); tocar abre o cartão; entregar mostra o agradecimento no balão de fala, texto flutuante, brilho e dois avisos.
- Simulador: robô entrega o que estiver pronto e agora também conserta prédios danificados (sem isso uma Hospedaria quebrada travava o reino em algumas sementes); linhas novas `Maiores vazios:` e `Pedidos:`. 180 min, código final: maior vazio sementes 1–4: 353/403/302/488 s → 146/151/156/156 s; sementes 9–12: 551/332/483/295 s → 151/151/141/141 s. Ritmo (sementes 9–12, mesmo robô nos dois): abates 5.681 → 5.605 (−1,3%), Nível de Reino 15,0 → 14,8; sementes 1–4: abates 5.610 → 5.264, mas a variação entre sementes do robô é de ±8%. Cerca de 120 pedidos por 3 h (≈0,7/min), 90% entregues.

Notas técnicas do lote 4-A (4A.2):
- Cenas só existem com tela (`G.HEADLESS` sai cedo) e não são salvas: `G.scenes = { fire, tav, train }` (cada uma `{ k, x, y, seats: [{ x, y, dir, sit, e }], q, cdT }`), `G.scenesInfo()` para teste. Equilíbrio em `G.SCENE` (3G): permanência 14–26 s, recarga 150 s, chance 25% por visita (sorteio no máximo a cada 25 s), no máximo 3 heróis em cenas ao mesmo tempo.
- Fogueira na praça (44; 57,55) acesa quando `G.darkness >= 0,3` (≈19:15–06:15): 6 lugares em volta (nunca um bem na frente, para o fogo aparecer), até 3 heróis + 3 moradores de folga (19:15–22:00) e, de madrugada, um vigia (Úrsula, Rui, Heitor…) que sai de casa. A cova apagada fica na praça o dia todo. Mesa da Taverna (pátio em frente à porta): almoço (11:30–13:30) e noite (17:30–01:30), 4 bancos, 2 heróis + 2 moradores. Treino amistoso: de dia (07:00–18:24) dois heróis (ou um herói e o Vasco, depois de 7 s sozinho) entram pela porta e treinam dentro do pátio cercado: golpes de leve alternados, sem dano.
- Quem entra: heróis em estado 'idle' (sem zona segura, toque de recolher) entram direto; os de rotina entram pelo wrapper de `G.heroDecide` (só se `bagN = 0`, vida ≥ 70%, fome ≥ 40, energia ≥ 35, e se estão cansados ou desanimados: energia < 80 ou ânimo < 85). Sentados recebem +0,9 ânimo/s e +0,6 energia/s (fogueira). O visitante rival ganha uma parada extra no plano dele (fogueira ou taverna). Medição no navegador (velocidade 3, noite inteira, 3 execuções cada): 79 abates com cenas × 76 sem cenas (ruído); com 60% de chance por decisão e sem limite o custo chegava a −26%, daí as travas acima.
- Falas: laços (`G.laco`), títulos (`G.titleOf`, "Brindemos ao Vingador, X!"), feitos recentes (`h.feitos.tl`) e Nêmesis (`G.nemesis`, com artigo certo por `G.rivArt/rivArtDe`); moradores têm falas por nome (`NPC_L`) e conversam entre si em 2–3 trocas (`CHAT` por par de nomes + `CHAT_ANY`) quando dois ficam parados a menos de 3,3 casas.
- Ganchos em código existente: 32-town `G.updateNpcs` (`if (!n._sc)`) e 50-render `drawChar` (`e._sit` desce 2,4 px×zoom). Campos novos nos heróis/moradores só com `_` (não vão para o save): `_sc, _seat, _sit, _scEnd, _scCd, _scT, _vig`. Wrappers: `G.heroDecide`, `G.tick`, `R.dynMore`, `R.nightMore`. Os heróis do treino são desenhados 2,2 casas "mais à frente" (`d.y += 2,2` em `R.dynMore`) porque o pátio não é andável no mapa e a cerca do prédio os esconderia.

### Lote 4-B — Sinergias
- [x] 4B.1 Ressonância de inscrições
- [x] 4B.2 Formação × classes

Notas técnicas do lote 4-B:
- Código novo: `3H-sinergias.js` (simulação, sem DOM) e `6D-ui-sinergias.js` (telas), antes de `90-main.js`. **Nenhum estado novo é salvo**: tudo é derivado das peças equipadas, das classes e das posições; campos novos nos heróis só com `_` (`_rc` contagens por família, `_rt` níveis para o aviso, `_cs` sinergia do grupo do Colosso, `_swD` dia do Segundo Fôlego). Saves v22/v24/v25 abrem sem migração. `G.VERSION`/`G.BUILD` intocados (a 26.0 é do 4C.3).
- 4B.1 (ressonância): `G.RES_FAMS` = 6 famílias (Fúria: Fúria/Ruína/Algoz · Baluarte: Colosso/Muralha/Espinhos · Vento: Vendaval/Falcão/Névoa · Vida: Fonte/Sanguessuga · Fortuna: Mercador/Garimpo · Saber: Sábio/Mestria/Peregrino), cada uma com 3 níveis (`G.RES_TIERS = [2, 3, 4]` inscrições, contadas por inscrição em todas as peças equipadas) e efeitos pequenos e cumulativos (`fx`). API: `G.insFam(id)`, `G.resTier(n)`, `G.resOf(h)` (contagens, cache atrelado ao `_dirty` de `G.heroStats`: nada por quadro), `G.resList(c)`, `G.resWith(h, kind, ins)` (contagens com a peça de um espaço trocada), `G.resHelp(it)` (quais heróis sobem de nível com a peça), `G.resGain` (IA). Os bônus de atributo entram por um wrapper de `G.heroStats` (depois das inscrições de 37, só no recálculo). Efeitos de campo: Sangria (Fúria 4: críticos deixam `m.dot` de 12% do golpe/s por 3 s; gancho em `G.dmgToMon` → `G.bleedHit`), moeda dupla 12% (Fortuna 4) e XP dobrado 10% (Saber 4) por wrappers de `G.killMon`/`G.giveXp` (só em abates), Segundo Fôlego (Vida 4: wrapper de `G.heroFall`, 1×/dia, volta com 15% da vida e recua como a Graça do Santuário). Evento `'resonancia' {h, f, t}` (+ log e aviso) quando um herói sobe de nível; a primeira leitura é silenciosa (carregar save não avisa).
- IA dos heróis: `G.wantItem` soma `G.resGain(h, it, cur)` = 4% do valor da peça por nível de ressonância que a troca sobe (peso pequeno; a regra dos 6% de histerese continua).
- Telas (6D): ficha do herói ganhou o cartão "Ressonância" (famílias com ≥ 1 inscrição, barra de 4 casas com os marcos 2/3/4, efeitos ativos e o próximo bônus; entra como complemento de `UI.insHero`); toda linha de inscrição ganhou o ícone da família (gancho em `insRow` de 63, via `UI.famTag`); ficha da peça (`UI.itemModal` envolvido) mostra as famílias da peça e o que ela faz pelo herói que a veste ("Fúria 3/4, faltam 1 para Sangria") ou, no estoque, "Ajudaria Mira: Fúria 1 → 2"; a reforja (`UI.reforgeModal` envolvido) mostra o antes/depois da ressonância de quem veste a peça; Mais › Códex lista as 6 famílias com as inscrições já descobertas (wrapper de `UI.SHEETS.mais.render`).
- 4B.2 (formação): `G.SYN` = 13 combinações nomeadas (Muralha Arcana, Luz Compartilhada, Sombras Gêmeas, Chuva Cruzada, Gume Duplo, Escudo da Fé, Fogo Cruzado, Sombra do Escudo, Lâmina Abençoada, Flecha sob o Escudo, Tempestade Dupla, Companhia Variada e Companhia Completa), declaradas por papéis (`need: [{ cls, row, n, fx }]`, `others`, `distinct`). `G.synFind(membros[{cls,row}], { off, col })` devolve as ativas e os efeitos por membro; `G.synValue` pesa a formação; `G.synTeam(equipe)`; `G.synSuggest(equipe)` acha a melhor troca simples (mudar um herói de posição ou chamar alguém do banco, com penalidade pela perda de poder) que ativa uma combinação nova. Pesos medidos: cada combinação vale cerca de 6–10 pontos de chance de vitória num duelo equilibrado (os duelos são muito sensíveis: +4% em ataque, defesa e vida valia 19 pontos, por isso os valores foram reduzidos até ficar nessa faixa).
- Arena: `G.arenaSim` envolvido; aplica os efeitos às "plantas" (cópias) de cada lado antes de simular (determinístico, rivais incluídos) e devolve `sim.syn = [lado A, lado B]` (`{ id, who, names }`); `o.noSyn` e `o.synOff = { 0: [ids], 1: [ids] }` desligam combinações (testes e combinação decisiva). Os rivais escolhem a posição pela formação (`G.arenaRivalBps` envolvido: entre as divisões com a mesma quantidade na frente, vence a de maior `synValue`, empate pelos mais parrudos) e a equipe automática do jogador também (`G.arenaAutoRows` envolvido: o botão Sugerir, o duelo sem posições e o robô), então a calibração Fácil/Justo/Difícil segue simétrica. `G.arenaDuel` envolvido: `res.syn = { me, rv, dec }`; a **combinação decisiva** é a do lado vencedor cuja ausência vira o mesmo duelo (mesma semente) e que, em 10 outras sementes, tira pelo menos 12 pontos da chance do vencedor (luta equilibrada vira com qualquer pitada de sorte e isso não é mérito de combinação).
- Colosso: o grupo em estado `'colosso'` (a caminho ou lutando) forma combinações pelo alcance da classe (corpo a corpo na frente; arqueiros e magos atrás; "Sombra do Escudo" não vale lá). A cada 1 s `colUpdate` vê se o grupo mudou e põe `h._cs` (+ `_dirty`) nos membros; os efeitos entram pelo fluxo normal de atributos (`G.SYN_COL = 0,6`: o grupo tem até 10 heróis e empilha várias, então lá os bônus valem 60%). `G.colSyn` (grupo de agora) e `G.colSynAll()` (se todos fossem) alimentam o cartão "Formação do grupo" da aba do Colosso (wrapper de `UI.SHEETS.missoes.render`).
- Telas da Arena (6D, ganchos mínimos em 65): topo da lista da tela de equipe mostra a "Formação" (combinações ativas com quem participa, dica "Troque Tobo para o fundo e ative Muralha Arcana" com botão Aplicar, combinações do rival, e o livro das 13 combinações); o duelo mostra as combinações de cada lado (tracejadas = rival) acima do palco; o resultado mostra a combinação decisiva com a chance com/sem ela. Ganchos em 65: `tmList` (`UI.synTeam`), `duelModal` (`UI.synDuel`), `showResult` (`UI.synResult`) e `UI.arenaTm/arenaTmRedraw`.
- Medições (simulador 180 min, sem erros em 8 sementes, antes = base 4-A nas mesmas sementes): **taxa de vitória da Arena** 57,4% (52,1–63,0; sementes 1–8: 61,5/55,7/52,1/63,0/52,9/62,1/56,4/55,7) contra 60,4% antes (52,9–65,7); chance estimada média 59–62% nos dois. Calibração coerente (40 dias virtuais num save de 150 min, 3 ofertas, 200 sementes cada, estimada → empírica): Fácil 80 → 83, Justo 57 → 58, Difícil 24 → 31 (antes: 80 → 82, 51 → 57, 25 → 39). **Ritmo** (abates · Nível de Reino): 5.349 · 14,1 contra 5.490 · 14,3 antes (−2,6%, dentro da variação de ±8% entre sementes). **Maiores vazios**: ≤ 156 s em todas as sementes (antes: ≤ 156 s). Colosso derrotado em 62% das semanas (antes: 69%). Resonância ao fim de 180 min: de 9–11 heróis, 0–1 sem nenhuma família ativa, 3–6 com nível 2 e 1–5 com nível 3. Combinações: nosso lado tem ao menos uma em 88–100% dos duelos (as mais vistas: Luz Compartilhada, Flecha sob o Escudo, Escudo da Fé, Gume Duplo), a decisiva aparece em 17–39% dos duelos. Custo de `G.arenaDuel` com a decisiva: 12 ms em média, 45 ms no pior caso.
- Ganchos em código existente (lista exata): 30-heroes `G.dmgToMon` (`if (crit && st.bleed) G.bleedHit(...)`), 30-heroes `G.wantItem` (`+ G.resGain(...)`), 63 `insRow` (`UI.famTag`), 65 `tmList`, `duelModal`, `showResult`, e a exposição de `UI.arenaTm`/`UI.arenaTmRedraw`. `ferramentas/sim.js` (só acréscimos): linhas "Formação:" e "Ressonância:" no relatório.

### Lote 4-C — Clareza progressiva e polimento
- [ ] 4C.1 Sistemas aparecem quando liberados
- [ ] 4C.2 Livro do Reino
- [ ] 4C.3 Desempenho para celular modesto; versão 26.0

### Depois do ciclo 4
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
| 2026-11-11 | 2 | Lote 2-C concluído (v24.0): tutorial que aponta, fila única de janelas, Poder da peça, Códex, próxima recompensa, HUD (módulos `3B-clareza` e `67-ui-clareza`) | Capturas em `capturas/ciclo2-c/`; primeira decisão em ~13 s (ritmo humano simulado); retorno → novidades → calendário sem sobreposição; simulador sem erros |
| 2026-11-11 | 2 | Lote 2-C concluído (v24.0); avaliação do ciclo 2; robô do simulador segue a Jornada | Diversão 8,7 · Viciante 9,2 |
| 2026-11-12 | 3 | Lote 3-A concluído: Colosso da Semana (módulos `3C-colosso` e `68-ui-colosso`) | Capturas em `capturas/ciclo3-a/`; simulador 360 min sem erros em 2 sementes; 60 fps com o Colosso em cena |
| 2026-11-12 | 3 | Lotes 3-A a 3-D concluídos em paralelo e juntados na principal (`ferramentas/juntar-lotes.py`); versão 25.0 "O Mundo Reage" | Simulador e navegador sem erros; saves v22/v24 abrem |
| 2026-11-12 | 3 | Avaliação do ciclo 3 | Diversão 9,5 · Viciante 9,9 |
