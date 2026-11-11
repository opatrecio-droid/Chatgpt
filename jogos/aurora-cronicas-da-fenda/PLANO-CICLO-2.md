# Ciclo 2 — "Rivalidade e lendas pessoais"

Rascunho do líder escrito enquanto o ciclo 1 roda; será ajustado depois da avaliação do ciclo 1.

## Visão
Depois da loteria (ciclo 1), o que falta é **com quem se comparar** e **por quem torcer**:
- V8 (competição) é a maior lacuna da rubrica: o Aurora não tem rival nenhum.
- D5 (apego) e V10 (números subindo) pedem que cada herói tenha uma história própria e que o reino tenha
  um número de poder que sobe e recordes que se quebram.

## Lote 2-A — Arena das Duas Luas (competição offline)
- **Prédio novo** "Arena das Duas Luas" (abre com Cidadela 3; terreno livre a ser escolhido no mapa, sem
  mexer no resto) ou, se não couber, acesso pela aba Missões com arte própria na janela.
- **Reinos rivais simulados**: 40 reinos com nome, brasão (cor + símbolo), líder e uma equipe de 3–5
  heróis gerados com as mesmas classes/raridades/traços do jogo. O poder dos rivais acompanha o do jogador
  (faixa de 70% a 140%) e cresce ao longo da temporada.
- **Duelo**: o jogador escolhe 3 a 5 heróis (formação: frente/fundo) e um de 3 adversários sorteados perto do
  seu poder (mais forte = mais pontos). A luta é uma janela animada de 20–40 s, automática: retratos com barras de
  vida, números de dano, críticos, habilidades de classe, mascotes; resultado calculado a partir de
  `heroStats` reais (determinístico por semente, para ser justo e testável no simulador). Pular a animação mostra o resultado.
- **Tíquetes**: 5 por dia real; extras com Núcleos (custo crescente).
- **Temporada semanal** (semana ISO real): pontos → ligas Bronze, Prata, Ouro, Platina, Diamante, Lenda das
  Luas; ranking ao vivo dos 40 rivais + jogador; no fim da semana, baú da liga (Selos, Núcleos, Pó de Reforja,
  Insígnias) e título/traje exclusivo para Diamante+.
- **Loja de Insígnias**: troca por itens que não se acham em outro lugar (traje/asa exclusiva, ovo de mascote,
  contrato de recruta Épico, Pó de Reforja, Tomo).
- Vitórias e derrotas viram feitos dos heróis (lote 2-B).

## Lote 2-B — Lendas pessoais e poder do reino
- **Livro de Feitos** na ficha do herói: dias a serviço, abates, chefes, maior golpe, quedas, relíquias,
  duelos vencidos; **títulos** desbloqueados por feitos ("Matador de Hidras", "Sobrevivente", "Mão de Ouro"…)
  com pequeno bônus e exibidos sob o nome.
- **Herói do Dia** no relatório diário (quem mais abateu/ganhou), com fala própria.
- **Poder do Reino**: número no HUD (soma ponderada do poder dos heróis + construções + bênçãos) que anima
  quando sobe; **Recordes** (maior golpe, mais ouro em um dia, andar da Fenda, maior sequência de duelos) com aviso
  "Novo recorde!".
- **Marcos comemorados**: a cada salto de poder (1k, 5k, 10k…) uma pequena cerimônia e um prêmio.

## Critérios de aceite
Os mesmos do ciclo 1, mais: o duelo precisa ser resolvível no modo sem tela (para o simulador medir a
taxa de vitória ao longo de 6 h simuladas: alvo 55–70%).
