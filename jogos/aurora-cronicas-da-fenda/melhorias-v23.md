# Aurora — Crônicas da Fenda · v23 "Ofícios"

Traz os painéis de prédio do vídeo de referência: cada construção abre um painel próprio com serviço,
heróis lá dentro, lotação e a prévia do próximo nível; Taverna, Hospedaria e Enfermaria ganham cardápios
em quatro degraus; reerguer passa a custar conforme a dificuldade; o Mercado aceita encomendas de
material; e um registro mostra as falas dos heróis. Saves da v19 à v22 abrem direto.

## Painel do prédio
Tocar numa construção no mapa (ou no ⓘ em Reino › Prédios) abre "Nv X · Nome" com:
- **Serviço** (ou **Produção** na Fazenda, Lenharia, Pedreira e Padaria): o que o prédio oferece, taxas,
  estoque, teto e quem trabalha lá.
- **Heróis**: lotação "n / capacidade", quem está dentro e quanto falta, quem está a caminho ou esperando.
- Faixa **"No nível N+1"** com o efeito, o requisito (verde se cumprido) e o custo; botões Melhorar ou
  Construir, Consertar, Ver no mapa e Fechar. Vale para os 16 prédios. O mapa continua fixo, então não
  há "Mover".

## Cardápios
Degraus liberados nos níveis 1, 3, 6 e 9 do prédio. A taxa é o preço de antes vezes o multiplicador.

| Degrau | Taverna | Hospedaria | Enfermaria |
|---|---|---|---|
| 1 | Caldo da Casa (×1) | Catre do Viajante (×1) | Atadura e Unguento (×1) |
| 2 | Ensopado do Caçador (×2,2): bem alimentado 3 min, +4% ataque | Quarto da Lareira (×2,2): vigor ×1,35, descansado 4 min, −15% cansaço | Compressa de Ervas (×2): cura ×1,4, tira veneno e queimadura |
| 3 | Assado na Brasa (×4, 2 refeições): 4 min, +6% ataque, +5% experiência | Aposento do Vigia (×4): ×1,7, 5 min, −25% cansaço | Sutura de Prata (×3,5): ×1,85, também tira o ferimento |
| 4 | Banquete das Duas Luas (×7, 3 refeições): 6 min, +9% ataque, +10% experiência | Suíte das Duas Luas (×7): ×2,1, 6 min, −35% cansaço, +10 ânimo | Elixir da Fonte (×6): ×2,4, tudo do 3 e +30 de vigor |

- Cada herói pede o melhor degrau que paga com as próprias moedas. Sem moedas, recebe o degrau 1, como
  antes — ninguém fica sem atendimento.
- No painel você escolhe até qual degrau o prédio serve (padrão: o melhor liberado).

## Lotação
Taverna, Hospedaria e Enfermaria atendem 3 + nível heróis por vez, o mesmo que a Hospedaria abriga.
Cheio, o herói espera alguns segundos na porta (no máximo duas vezes) e depois entra assim mesmo; vida
abaixo de 30% e saciedade zerada passam na frente. Nas campanhas de teste ninguém precisou esperar.

## Reerguer com custo por dificuldade
"Reerguer agora" custa ×0,5 no Fácil, ×1 no Normal (igual a antes), ×1,75 no Difícil e ×3 no Pesadelo.
O herói volta com 60% da vida sem Enfermaria; com ela, 57% + 3% por nível, até 85%.

## Encomendas no Mercado
- Materiais comuns e raros das zonas abertas (não vale para emblemas, Tomos, Cristais de Alma e Pó Estelar).
- Preço: valor-base ×4,5 (comum) ou ×12 (raro), com 2% de desconto por nível do Mercado, até 20%.
- Quantidade com −10 / +10 / +100; paga na hora, a caravana entrega na alvorada seguinte no Armazém.
- Encomendas simultâneas: 1 + nível ÷ 3. Por pedido: até 100 × nível comuns ou 10 × nível raros.
- Cancelar devolve 75%. Encomendas em aberto ficam salvas.

## Vozes da cidade
Botão de balão acima do botão do mapa: as últimas falas dos heróis com nome e hora. Tocar numa fala leva
a câmera ao herói. Fechado por padrão no celular; não cobre botões nem a faixa da jornada.

## Campanha de teste (60 dias, jogador automático, média de 12 sementes, v22 → v23)

| | v22 | v23 |
|---|---|---|
| Nível de Reino | 23,6 | 24,6 (+4%) |
| Nível médio dos heróis | 45,4 | 44,1 (−3%) |
| Quedas | 272,8 | 253,5 (−7%) |
| Chefes | 75,5 | 78,7 (+4%) |
| Renda de serviços aos heróis | — | +66% |
| Tempo da simulação | 14,6 s | 15,0 s |

Zero erros em todas as campanhas, incluindo 30 dias no Difícil em três sementes.

## Limites conhecidos
- O equilíbrio vem de jogador automático, e a variação entre sementes é alta.
- A taxa mostrada no painel é a de um herói de nível médio; a real depende do herói.
- As falas não são salvas, e recarregar durante um serviço perde o efeito daquele serviço (a taxa já foi paga).
- Sem teste em aparelho físico nem de som.

## Verificação
`sh fontes-v23/testar.sh` remonta a v23 a partir da v22, confere o HTML e roda as 228 verificações das
quatro versões e a campanha. Resultados em [verificacao-v23.json](verificacao-v23.json).
