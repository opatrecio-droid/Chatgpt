# Modo 3D/2D — estado do plano

Acompanha o documento *Aurora — Plano do modo 3D/2D* (18/11/2026). Aqui ficam o que já está pronto, o que foi medido e as correções que o código real impôs ao plano.

## Fases

| Fase | Estado | Aceite |
|---|---|---|
| 0 — Preparar a base | **pronta** | Estado do jogo, textos e erros idênticos em 365 capturas; `G.debugBot` com hashes idênticos em 6 cenários × 30 dias |
| 1 — Protótipo 3D estático | **pronta** | A 90° o 3D põe cada ponto do mundo no **mesmo pixel** do 2D (erro 0,00 px) |
| 2 — Entidades em pé | **pronta** | 14 minutos de jogo rodados inteiros no 3D, sem erro; heróis, NPCs, guardas, monstros e portal no lugar |
| 3 — Ícone e transição | parcial | o ícone existe e a descida/subida da câmera (0,5 s) funciona; falta a arte definitiva |
| 4 — Toque e interface no 3D | parcial | toque, arrasto e pinça já acertam o tile certo; faltam rótulos e números de dano |
| 5 — Acabamento | a fazer | falta a camada de luz (lampiões), o círculo rúnico do chão, transparência de objetos altos e névoa |
| 6 — Desempenho e lançamento | a fazer | falta medir em aparelho real |

## Correções ao plano

Três pontos do diagnóstico não batiam com o código:

1. **O chão não pode vir de `R.mapCanvas`.** Esse canvas é o **minimapa**: 4 px por tile (352×432), feito com suavização para a janela do mapa. Usá-lo como textura deixaria o chão 4× mais borrado que o 2D. A textura certa é **`R.terrainPreview`** (1408×1728, 16 px por tile), que é exatamente o que o 2D desenha. É ela que o modo 3D usa.
2. **`#av-camera` não existe.** Sobrou só o CSS dele no arquivo; nenhum código cria esse elemento. O botão 3D/2D entrou em **`#fabs-l`**, a coluna de atalhos que existe de verdade, ao lado de Mapa e Cidade.
3. **Mover o 2D para dentro de um `Renderer2D` seria arriscado.** Há cerca de seis scripts que encadeiam `R.dynMore`, mais outros que envolvem `R.fxMore`, `R.groundMore` e `R.init`. Em vez de mover código, a Fase 0 **registra o `G.R` atual como o renderizador "2d"** e desvia apenas três pontos de entrada (`R.frame`, `R.screenToWorld`, `R.worldToScreen`), todos buscados dinamicamente em `R`. O resultado tem a mesma interface que o plano pede, sem tocar em uma linha do desenho — por isso o modo 2D é idêntico por construção.

## Como o 3D funciona

- **Um estado, dois pintores.** `G.RENDER` guarda os modos; só um pinta por vez. Nenhum campo novo no save, nenhuma regra tocada.
- **Escala.** 1 tile = 1 unidade. A moldura da câmera ortográfica é `largura_do_canvas / (zoom × 16)` tiles — a mesma conta do 2D, por isso a 90° o enquadramento coincide no pixel.
- **Sprites virados para a câmera.** Cada sprite é um quadrilátero com o pé no chão, girado em `-θ` no eixo X. A 90° ele deita no chão e reproduz o 2D; a 45–60° fica em pé, com a altura na tela preservada.
- **Ordem de pintura.** Cada sprite é empurrado na direção da câmera por `posição_na_fila × 0,002`. Em projeção ortográfica isso **não muda nada na tela**, só a profundidade — então o 3D herda a ordem exata do 2D e ainda ganha o z-buffer.
- **Carregado sob demanda.** Three.js e o renderizador ficam num `<script type="text/plain">`: o navegador não lê nem executa nada deles até o jogador tocar no ícone.
- **O toque continua no canvas 2D.** O canvas 3D é `pointer-events: none`, então arrasto, pinça e roda seguem indo para quem já os escutava; como `R.screenToWorld` aponta para o renderizador ativo, a seleção acerta o tile certo (erro medido: 0,0000 tile).

## O que a Fase 2 acrescentou

- **Heróis, NPCs, guardas e monstros** como sprites em pé, com a mesma folha de arte do 2D (`A.charSheet` / `A.monSheet`), o mesmo quadro de animação (`A.visualPose` / `A.charFrame`), a mesma âncora, o mesmo espelhamento por direção e o brilho de dano. Nada de arte nova.
- **Sombras** no chão, como quadriláteros deitados.
- **Profundidade pelo y do mundo:** cada sprite é empurrado na direção da câmera por `y × 0,02`. Em projeção ortográfica isso não muda nada na tela, só a ordem — então cenário e entidades se intercalam exatamente na ordem de pintura do 2D, que também é por y.
- **Ponte para itens 2D avulsos:** módulos registram itens dinâmicos do tipo `'x'` (o portal, a criatura da sorte) como funções que pintam num contexto 2D. Em vez de reescrevê-las, elas pintam numa camada transparente por cima do 3D, usando a projeção da câmera 3D. Qualquer item desse tipo, hoje ou no futuro, aparece sem código novo — e é onde os rótulos e números de dano da Fase 4 vão entrar.

### Limites conhecidos desta fase

- A camada de itens avulsos fica **sempre na frente**: não se mistura na profundidade com os sprites 3D. Para o portal isso não incomoda; para efeitos no meio da multidão vai incomodar.
- O **círculo rúnico do chão** (gancho `groundDecor`) não é desenhado. Pintá-lo na camada de cima o deixaria por cima dos personagens que pisam nele, que é pior do que faltar. O jeito certo é um quadrilátero deitado no chão — fica para a Fase 5.
- A **camada de luz da noite** (lampiões, fogueiras) não existe no 3D. O 2D monta um mapa de luz em baixa resolução e compõe por cima; o 3D hoje só escurece as cores. É a maior diferença visual que sobra.
- **Rótulos, números de dano e ícones de status** continuam só no 2D (Fase 4).

## Correções depois do primeiro teste em celular (30.7.4)

O primeiro teste real voltou com dois problemas: **lento aos trancos** e **"NPCs viram monstros"**. O 2D continuou normal, e sair do 3D devolvia o jogo ao normal.

- **Sprite com a arte de outra entidade (corrigido).** Os sprites das entidades eram reaproveitados por *posição na lista*. Quando um NPC entra num prédio ou um monstro morre, a lista encurta e os índices escorregam — o slot troca de dono e podia manter a textura já desenhada. Agora cada sprite é amarrado à **entidade**, e um teste força 40 rodadas de entra-e-sai conferindo que nenhum sprite fica com a arte de outro.
- **Trabalhadores com a aparência trocada (corrigido).** O 2D desenha NPCs em serviço por um caminho próprio (`R.npcDraw`, com a aparência guardada em `_wlook`). O 3D usava `A.npcLook` e trocava a pessoa. Agora respeita `_wlook`, e um quadro de animação que não exista na folha cai para a pose parada em vez de sumir com o NPC.
- **Desperdício de desenho (corrigido).** Os 1.486 sprites do mapa inteiro iam para a GPU a cada quadro: eu tinha desligado o descarte por campo de visão, que o 2D faz. Agora só entram os que estão na janela da câmera, e grupos sem nada à vista não chegam a virar chamada de desenho. Medido no perfil de celular: o tempo de `render` caiu de **33 ms para 22 ms** por quadro.
- **Rede de segurança (nova).** Se o 3D ficar engasgando (quadros acima de 120 ms por cerca de 45 vezes), ele volta sozinho para o 2D e avisa, em vez de deixar o jogador preso.
  Ela mede o tempo entre desenhos, não o custo do 3D: num aparelho em que até o 2D passa de 120 ms por quadro, volta ao 2D sem ganho. Uma janela aberta, sozinha, não a dispara — o jogo pula desenhos com janela aberta, mas os quadros pulados ficam leves (testado: 24 s de janela aberta, no máximo 3 engasgos de 45).
- **Qualidade econômica (nova).** Em *Ajustes → Gráficos*, "Econômica" ou a economia de bateria fazem o 3D desenhar com metade da largura e altura — um quarto dos pixels.

Honestamente: as melhorias são reais e medidas, mas **o teste aqui não tem GPU**, então não dá para afirmar que agora roda liso no aparelho. É por isso que a rede de segurança existe.

## Medidas

| Métrica | Meta do plano | Medido |
|---|---|---|
| Fidelidade a 90° | mesmas posições | **0,00 px** de erro |
| Ida e volta tela→mundo→tela | — | **0,000 px** |
| Troca 2D→3D (primeira vez) | até 1,5 s | **~0,5 s** (PC, inclui ler e executar o Three.js) |
| Aumento do APK | até +1 MB | **+0,13 MB** (Three.js: 525 KB de texto, comprimido no APK) |
| HTML | alerta acima de 9 MB | 8,26 → **8,79 MB** |
| Chamadas de desenho | — | 119 (chão + 118 grupos para 1.486 sprites) |
| Celular simulado (390×844, tela 3×, CPU 6× mais lenta, sem GPU) | — | 2D **7 fps**, 3D **5 fps**; `gpu` 17,9 ms por quadro — só para comparar versões |

**Não medido:** quadros por segundo em aparelho real e memória com o 3D ativo. O ambiente de build não tem GPU — o número que sai aqui (14 fps) vem do renderizador por software e **não** serve de estimativa para um celular.

## Próximos passos

Em ordem. Cada passo termina num APK que o dono testa no celular antes do próximo.

1. **Confirmar a 30.7.4 no aparelho.** O sprite trocado sumiu? O 3D ficou jogável, ao menos na qualidade Econômica? Qual inclinação o dono prefere (Ajustes → Gráficos → Inclinação da vista 3D: 45°, 55°, 60° ou De cima)? Se continuar lento, o passo 2 vem antes de tudo.
2. **Se ainda estiver lento, cortar custo** — medindo com `verificacao/desempenho-3d.cjs` e `G.R3D.medir(true)` antes e depois de cada mudança:
   - juntar os 118 grupos de cenário num atlas único e num só `InstancedMesh`, com o recorte de UV por instância;
   - trocar as texturas por entidade por um atlas atualizado por quadro;
   - testar se a textura do chão pode cair para 8 px por tile sem perda visível.
   Aceite: 30 fps ou mais na cidade, num Android intermediário.
3. **Fase 4 — rótulos e números de dano** na camada `#view3d-ui`, com `G.R3D.worldToScreen`. `R.statusIcons(e, x, y)` é público e pinta em `R.ctx`: troque `R.ctx` pela camada, como já é feito com os itens `'x'`. Os rótulos do 2D vivem em closures privadas (`over.push` dentro de `drawChar` e `drawMon`) e precisam ser refeitos com dados públicos, como `e.name` e `G.RANK_COLOR[e.rank]`. Aceite: seleção, construção, decretos e bandeiras funcionam igual nos dois modos.
4. **Fase 5 — luz da noite e chão.** O 2D monta a luz num canvas de 1/4 da resolução (`lcv` e `lctx`, dentro do `R.frame`); reproduzir como textura sobre o chão ou como passagem aditiva. O círculo rúnico entra como quadrilátero deitado, com o gancho `groundDecor` pintando numa textura. Depois, transparência de objetos altos na frente de heróis e névoa (`R.drawEdgeFog`). Aceite: nenhum herói escondido atrás de árvores ou torres, e a noite parecida com a do 2D lado a lado.
5. **Fase 3 — arte do ícone.** Hoje é um SVG provisório em `modulos/render-modos.js`; a arte é escolha do dono.
6. **Fase 6 — lançamento.** Presets de qualidade e versão 30.8.0, com a mesma chave. Aceite: as metas do plano original — 30 fps, troca em até 1,5 s, até +150 MB de memória e até +1 MB de APK.

Decisões que esperam o dono: a inclinação padrão (hoje 55°, por palpite) e a arte do ícone.

## Para quem continuar

- **O 2D não pode mudar.** Antes de mexer, gere a referência com `harness.cjs` e `bot.cjs`; depois, compare: zero diferenças de estado, texto, erros e rótulos (`verificacao/LEIA-ME.md`).
- **A fidelidade a 90° fica em 0,00 px** (`verificacao/teste-3d.cjs`). É o que prova que o 3D não tirou nada do lugar.
- **Não mova código do 2D.** O 3D mora em `modulos/render3d.js` e `modulos/render-modos.js`; `fonte/` só muda para consertar o jogo, nunca por causa do 3D.
- **Sempre `npm run montar`, depois `npm run verificar`.** O `www/index.html` é versionado e vai no commit.
- **Cada APK novo sobe a versão:** `versionCode` e `versionName` em `android/app/build.gradle`, `version` no `package.json` e o nome do APK no `README.md`. Sem subir o `versionCode`, o Android não atualiza por cima.
- **A chave de assinatura nunca vai para o Git** (o repositório é público). Para gerar um APK que atualize o instalado, ela precisa estar em `assinatura/`, que está no `.gitignore`.
- **Não prometa desempenho sem aparelho.** O ambiente de build roda WebGL por software: as medidas servem para comparar versões.
- **Instalar o Android SDK exige aceitar a licença do Google:** peça a autorização do dono antes.
- **Tudo em português do Brasil**, inclusive os textos do jogo, os comentários e as mensagens de commit.

### Comandos do console úteis

| Comando | Para quê |
|---|---|
| `G.UI.act('vista3d')` | o mesmo que tocar no ícone; na primeira vez, carrega o 3D |
| `G.R3D.estado()` | ângulo, tamanho do canvas 3D, grupos e sprites |
| `G.R3D.definirAngulo(45)` | muda a inclinação na hora |
| `G.R3D.medir(true)`, depois `G.R3D.medida()` | tempo médio por quadro de cada etapa: `vivos`, `extras`, `noite`, `camera`, `gpu` |
| `G.R3D.slots()` | dono e arte de cada sprite de entidade em uso |
| `G.R3D.engasgos()` | o contador da rede de segurança (volta ao 2D em 45) |
