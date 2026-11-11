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
- [ ] 2A.3 Tíquetes e temporada semanal com ligas
- [ ] 2A.4 Loja de Insígnias + sumidouro de moedas
- [ ] 2A.5 Acesso, passo da Jornada e eventos de duelo
- [ ] 2A.6 Robô do simulador duela; taxa de vitória 55–70%

### Lote 2-B — Lendas pessoais e Poder do Reino
- [ ] 2B.1 Livro de Feitos
- [ ] 2B.2 Títulos
- [ ] 2B.3 Herói do Dia
- [ ] 2B.4 Poder do Reino, recordes e marcos

### Lote 2-C — Clareza, coleção e próxima recompensa
- [ ] 2C.1 Tutorial que aponta
- [ ] 2C.2 Fila única de janelas
- [ ] 2C.3 Poder da peça correto
- [ ] 2C.4 Códex de Inscrições
- [ ] 2C.5 Próxima recompensa no HUD
- [ ] 2C.6 HUD mais limpo

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
