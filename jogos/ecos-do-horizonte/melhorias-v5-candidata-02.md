# Ecos do Horizonte — candidata 2

[Baixar diretamente o HTML](https://github.com/opatrecio-droid/Chatgpt/releases/download/ecos-do-horizonte-v5.0.0-candidate.2/ecos-do-horizonte-v5-candidata-02.html) · [Jogar no navegador](https://ecos-horizonte-mobile.patrecio.chatgpt.site)

Versão `5.0.0-candidata.2`, 7,343,065 bytes. SHA-256: `d401c5b44e85d8253dff54f9fc3b9e1f88f30354b94423c77f0a9d41c0eb36f6`. Mantém todos os recursos em um único HTML: imagens, sons, código e dados. A candidata 1 permanece disponível no link anterior.

## Mudanças aplicadas

- As 72 escolhas de forma agora possuem definições específicas, em vez de dependerem dos três perfis genéricos de área, potência e recarga. Há disparos sequenciais, retorno de projéteis, áreas móveis, investidas em linha, armadilhas independentes, vínculos que rompem pela distância, proteção espacial e invocações com comportamentos diferentes. As formas reutilizam primitivas de combate e conservam seus identificadores e emblemas.
- As 30 assinaturas de lendários e relíquias receberam efeitos específicos. Exemplos: aparo prepara um acerto fortalecido; esquiva deixa abrigo; um projétil devolve energia somente ao ser recolhido; abate deixa uma lembrança para coletar. Intervalos por item e proteção contra ativações recursivas limitam combinações. O treino também executa os efeitos, permitindo compará-los.
- Campos de habilidade têm desenhos associados à função: fissuras, raízes, bastião, vórtice, chuva, vínculo e área de explosão atrasada. O alcance da mira e a validação de conjuração usam a mesma referência.
- As recompensas das missões principais passaram de 15% para 20% do orçamento regional por missão. Secundárias mantêm seus valores. A viagem continua exigindo história concluída, sem exigir todas as secundárias nem nível mínimo.
- Corrigidos dano de área criado através de paredes, vínculo que gastava energia fora do alcance, proteção fraca prolongando indevidamente a forte, investimento sem efeito em duração defensiva, invocações de eco com força integral e devolução extra de energia em flechas repetidas pelo eco.
- Efeitos temporários deixam de atravessar a troca de herói, cena e construção. A pausa congela os disparos atrasados. Chefes recebem desaceleração das raízes, sem serem enraizados continuamente.

## Verificação

A implementação pesada e as medições complementares foram delegadas ao **GPT-6.1 Terra com raciocínio extra alto**, conforme solicitado. O agente principal revisou o resultado, repetiu os cenários críticos e verificou a entrega. Um auditor separado identificou problemas na revisão inicial; seus cenários foram repetidos pelo agente principal no hash final.

No HTML final, passaram 144 conjurações (72 formas nos ranks de técnica 1 e 3), acionamentos individuais das 30 assinaturas, 24 conjurações por toque cobrindo as técnicas dos quatro heróis, migração/orçamentos de pontos, 48 encerramentos de missões com produtores reais, 200 expedições de teste, 40 mil configurações legais e 400 ciclos de construção/salvamento. Esses números descrevem fixtures automatizadas, com atalhos de configuração; não são partidas humanas.

O HTML final iniciou em contexto sem rede, trocou os quatro heróis e requisitou **zero recursos externos**. O teste serviu o documento local por interceptação HTTP, pois a política do Chromium gerenciado bloqueia `file://`. A abertura diretamente no visualizador de arquivos do celular permanece sem comprovação física.

Na revisão imediatamente anterior, também passaram 60 combinações de menu e tamanho de tela, 18 cenários de toque e recuperação de saves por localStorage/IndexedDB. Depois desses testes, o jogo recebeu apenas os ajustes de XP principal e de energia do eco. Os relatórios preservam o hash real de cada revisão, sem atribuir testes antigos a um arquivo novo.

[Relatório completo de verificação](https://github.com/opatrecio-droid/Chatgpt/blob/ChatGPT/jogos/ecos-do-horizonte/verificacao-v5-candidata-02.json)

## Progressão e equilíbrio: resultados e limites

Três cenários contábeis foram executados com a função de experiência. O perfil moderado, que inclui duas secundárias, exploração, combate e um chefe opcional por ato, chega aos níveis 12/22/32/42/52/60. O perfil focado na principal termina no 56; o amplo chega ao 60 e inicia Legado. São contagens hipotéticas, especialmente aproximadas no primeiro ato, que possui estrutura própria. Não demonstram duração nem exigem repetição obrigatória.

Foram medidas 252 rotações de 60 segundos em alvo parado, mais 48 com alvo móvel ou três alvos. A diferença entre construções ofensivas e defensivas ainda é relevante: com equipamento intermediário, máximo/mínimo ficou em 1,41–1,75 no alvo parado, 1,69/1,47 no móvel aos níveis 40/60 e 3,68/3,13 no dano somado contra três alvos. Dano de área, posição e sobrevivência precisam ser avaliados juntos; esses números não significam equilíbrio final aprovado.

## Ainda pendente

A campanha **não tem 24 horas comprovadas**, e o checklist global não está integralmente concluído. Permanecem a avaliação humana de diversão e ritmo, variedade de missões e masmorras, equilíbrio de grupos/sobrevivência e testes em Android/iPhone físicos, incluindo suspensão, armazenamento, FPS e memória total.

Para levar a jornada para outro arquivo, navegador ou aparelho: **Pausa → Salvar e importar → Baixar jornada .json**, depois importe a cópia no destino. Saves da candidata 1 mantêm IDs de itens e formas; a migração anterior continua disponível.

Artes originais geradas com ferramentas OpenAI e incorporadas em atlas. Áudio: [Kenney RPG Audio](https://kenney.nl/assets/rpg-audio), [CC0](https://creativecommons.org/publicdomain/zero/1.0/), mais sino sintetizado. O Site conserva o público anterior.
