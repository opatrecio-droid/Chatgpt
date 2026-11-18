# Modo 3D/2D — estado do plano

Acompanha o documento *Aurora — Plano do modo 3D/2D* (18/11/2026). Aqui ficam o que já está pronto, o que foi medido e as correções que o código real impôs ao plano.

## Fases

| Fase | Estado | Aceite |
|---|---|---|
| 0 — Preparar a base | **pronta** | Estado do jogo, textos e erros idênticos em 365 capturas; `G.debugBot` com hashes idênticos em 6 cenários × 30 dias |
| 1 — Protótipo 3D estático | **pronta** | A 90° o 3D põe cada ponto do mundo no **mesmo pixel** do 2D (erro 0,00 px) |
| 2 — Entidades em pé | a fazer | heróis, monstros, NPCs, portal e efeitos ainda só aparecem no 2D |
| 3 — Ícone e transição | parcial | o ícone existe e a descida/subida da câmera (0,5 s) funciona; falta a arte definitiva |
| 4 — Toque e interface no 3D | parcial | toque, arrasto e pinça já acertam o tile certo; faltam rótulos e números de dano |
| 5 — Acabamento | a fazer | transparência de objetos altos, névoa, ciclo noturno fiel |
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

## Medidas

| Métrica | Meta do plano | Medido |
|---|---|---|
| Fidelidade a 90° | mesmas posições | **0,00 px** de erro |
| Ida e volta tela→mundo→tela | — | **0,000 px** |
| Troca 2D→3D (primeira vez) | até 1,5 s | **~0,5 s** (PC, inclui ler e executar o Three.js) |
| Aumento do APK | até +1 MB | **+0,13 MB** (Three.js: 525 KB de texto, comprimido no APK) |
| HTML | alerta acima de 9 MB | 8,26 → **8,79 MB** |
| Chamadas de desenho | — | 119 (chão + 118 grupos para 1.486 sprites) |

**Não medido:** quadros por segundo em aparelho real e memória com o 3D ativo. O ambiente de build não tem GPU — o número que sai aqui (14 fps) vem do renderizador por software e **não** serve de estimativa para um celular.

## Próximos passos

- [x] Protótipo da Fase 1 (chão 3D) — feito, com a textura corrigida
- [ ] **Testar o APK num celular e escolher a inclinação** (Ajustes → Gráficos → Inclinação da vista 3D: 45°, 55°, 60° ou De cima)
- [x] Lugar do botão 3D/2D — `#fabs-l`; falta a arte definitiva do ícone
- [x] Fase 0 no código-fonte
- [ ] Fase 2: heróis, monstros, NPCs e portal como sprites em pé
