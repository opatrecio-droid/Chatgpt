# Aurora — Crônicas da Fenda · v22 "Companheiros"

Espólio que cai no chão, mascotes que acompanham cada herói e recolhem o que sobra, e Incursões difíceis
como fonte de mascotes raros. Saves da v19, v20 e v21 abrem direto; os mascotes comprados na v21 são
convertidos e continuam com seus donos.

## Espólio no chão

- Quando um monstro morre, **metade** dos materiais da zona e do Pó Estelar vai na hora para a bolsa do
  herói e **metade cai no chão**. Emblemas, Tomos e Cristais de Alma continuam indo inteiros para o herói.
- O que cai some em 75 segundos (pisca nos últimos 10).
- **Tocar** em um item manda ele e os vizinhos direto para o Armazém.
- Os monstros soltam 1,9× o que soltavam, de modo que um herói sozinho fica com cerca de 86% do que
  recebia por abate na v21, e com mascote passa de 130%.

## Mascotes

Cada mascote é um indivíduo com **raridade**. Ele segue o dono, busca itens no chão em volta, volta e
entrega a carga na Guilda junto com o herói. Se o dono cai, o mascote não perde o que carrega.

| Raridade | Comum | Incomum | Raro | Épico | Lendário | Mítico |
|---|---|---|---|---|---|---|
| Carga | 6 | 9 | 13 | 18 | 24 | 32 |
| Força do bônus e do papel | ×1 | ×1,2 | ×1,45 | ×1,75 | ×2,1 | ×2,6 |

Quinze espécies em quatro papéis:

| Papel | O que faz | Espécies |
|---|---|---|
| Faro | busca mais longe e corre 35% mais | Gato, Coruja, Morceguinho |
| Carga | leva 1,5× mais | Jabuti, Golenzinho, Raposa |
| Fraqueza | a cada 9 s enfraquece o alvo do dono: ataque e defesa caem 14% × força por 5 s (chefes resistem à metade) | Sapo, Lobinho, Olho Errante, Draquinho |
| Vigor | +5% × força de vida máxima e cura 3,5% × força a cada 7 s em combate | Brotinho, Ursinho, Fadinha, Medusa, Fenixzinha |

- **Viveiro:** cabem 8 mascotes + 2 por nível do Estábulo. Fica em Armazém › Ateliê.
- **Fusão:** três mascotes livres da mesma raridade viram um da raridade seguinte.
- **Como conseguir:** um Gato Comum pelo Caminho "Adote o primeiro mascote" (25 abates); ovos Comuns ou
  Incomuns às vezes no Mascate; e as Incursões. O Ateliê não vende mais mascotes.

## Incursões

Abrem no Nível de Reino 6, em Missões › Incursões. Uma por zona, em Graus de I a X; vencer um Grau abre
o seguinte. Até cinco heróis marcham ao covil, enfrentam duas ondas de elites e depois o **Alfa**, uma
versão mais forte do chefe da zona (nível-base da zona + 6 + 4 × Grau). Ninguém recua; o combate tem
4 minutos. Uma tentativa grátis por dia, extras por 3 Núcleos.

A vitória choca um ovo na hora. A raridade depende do Grau:

| Grau | Comum | Incomum | Raro | Épico | Lendário | Mítico |
|---|---|---|---|---|---|---|
| I | 72% | 25% | 3% | — | — | — |
| III | 40% | 40% | 16% | 4% | — | — |
| V | 16% | 35% | 32% | 14% | 3% | — |
| VII | 3% | 18% | 34% | 31% | 13% | 1% |
| X | — | — | 14% | 44% | 37% | 5% |

Cada zona tem duas espécies nativas, seis vezes mais prováveis ali. Vêm junto materiais da zona, Tomos e
experiência. Com o Viveiro cheio, o ovo vira Pó Estelar e Cristal de Alma.

## Campanha de teste (60 dias, jogador automático, semente 21)

| | v21 | v22 com mascotes | v22 sem mascotes |
|---|---|---|---|
| Nível de Reino | 21 | 22 | 22 |
| Nível médio dos heróis | 42,5 | 45,4 | 37,6 |
| Chefes derrotados | 68 | 67 | 68 |
| Quedas | 246 | 243 | 349 |
| Materiais de zona recebidos | 24.651 | 34.965 (142%) | 18.445 (75%) |

Na média de 12 sementes: com mascotes, 145% dos materiais da v21; sem mascotes, 75% no total e 86% por
abate. Com mascotes, as Incursões terminaram em 42 vitórias e 7 derrotas.

## Limites conhecidos

- Sem nenhum mascote e sem tocar no chão, a renda total de materiais fica em 75% da v21, abaixo da meta
  de 80% que eu tinha fixado. Na prática todo reino ganha o primeiro mascote com 25 abates.
- As Incursões perdidas aumentam as quedas (+9% na média com mascotes).
- Recarregar o jogo durante uma Incursão a cancela e a tentativa do dia fica gasta.
- Equilíbrio medido com jogador automático; os sons novos e aparelhos físicos não foram testados.
- Os painéis dos prédios e os pedidos de compra do vídeo de referência ficam para a etapa seguinte.

## Verificação

`sh fontes-v22/testar.sh` remonta a v22 a partir da v21, confere o HTML e roda os testes das três
versões e as campanhas. Resultados em [verificacao-v22.json](verificacao-v22.json).
