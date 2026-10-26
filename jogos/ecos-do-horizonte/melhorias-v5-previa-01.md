# Ecos do Horizonte · v5 · Prévia 01 de construções

Primeira fatia jogável do plano v5. Entrega em um HTML de aproximadamente 3 MB, com imagens, animações e sons incorporados. A campanha, mapa, itens no chão e notificações da versão 4.1 continuam disponíveis.

## Implementado

- Dois orçamentos independentes por herói: 24 pontos de técnica e 30 de talento até o nível 60. Pontos recebidos seguem a tabela do plano, sem concessão duplicada por salvar/carregar ou trocar herói.
- Seis técnicas por classe, com ranks 1–3: cinco normais à escolha para três botões e uma suprema no quarto. As duas novas normais chegam nos níveis 16/28; as originais conservam 1/2/4/6. Apenas a inicial tem primeiro rank gratuito.
- Três perfis de forma exclusivos por técnica, com dois ranks: Amplitude, Potência e Cadência alteram força, alcance/área/duração, custo e recarga com desvantagens explícitas. Sua arte e identidade autoral ainda serão ampliadas.
- Três ramos de talentos por classe: quatro nós de três ranks e um talento final de dois ranks por ramo. Apenas um talento final pode receber pontos; requer nível 40 e dez pontos no ramo.
- Afinidade gratuita no nível 20. Talentos antigos sem efeito completo foram substituídos por modificadores usados pelo combate; Sangria aplica sangramento no final do combo e Ressonância escala a força da repetição.
- Menus de construção com saldo, requisitos, rank atual/próximo, equipar técnicas, retirada parcial, desfazer e redistribuição gratuita na Âncora ou treino pausado.
- Recargas guardadas por identidade de técnica, recursos preservados em trocas/respec e trava de edição em combate ou morte. Treino preserva os recursos e recargas originais ao sair ou exportar.
- Migração para schema 4 e chave v5, mantendo o salvamento v4 original e uma cópia anterior à conversão. Talentos antigos são reembolsados no novo orçamento; Amplitude/Potência antigas viram formas. Excesso herdado é explicado como déficit amortizado pelos pontos futuros.
- Namespace explícito de itens: esta prévia conserva Comum/Raro/Épico, permitindo uma migração futura segura para seis raridades.

## Conferido

240 combinações herói/nível; compra e dependências; cem ciclos de respec/salvar/carregar; orçamento integral de 24/30 nas quatro classes; conjuração das 24 técnicas e efeito crescente de seus ranks; configuração das 72 opções de forma; regressões de saques/notificações; 15 combinações de tamanho/perfil de controle; movimento e habilidades com dois dedos; importação/exportação e inicialização offline. Menus também medidos em seis tamanhos de tela, de 320 px a 1440 px.

Um agente auditor independente encontrou quatro falhas, corrigidas e retestadas: recarga transferida pela vaga, exportação dos recursos temporários do treino, edição com vida zero e timers após renascimento. O relatório distingue seus testes dos testes do executor. Não houve teste humano formal em celular físico.

## Próximas etapas do plano

Itemização ampliada, seis raridades, bestiário/códice, monstros táticos, novas missões, mapas e campanha de seis atos. A meta de 24 horas, a economia final, a arte final de todas as habilidades e a diversão das construções ainda exigem implementação e sessões reais. O checklist global de 116 critérios permanece como referência; esta prévia comprova uma parte dele.

## Como conferir

Toque no retrato superior. Abra **Habilidades** para aprender, melhorar, escolher formas e equipar técnicas. Abra **Evolução** para distribuir talentos e afinidade. Edite perto da Âncora ou no treino sem golpes ativos. Para trazer a jornada de outro arquivo/aparelho, use **Pausa → Salvar e importar** e o arquivo `.json` exportado da versão anterior.
