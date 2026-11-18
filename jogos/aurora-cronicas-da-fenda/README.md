# Aurora — Crônicas da Fenda (PC + Android)

O mesmo jogo em **um só HTML**, agora com um menu inicial novo e empacotado como **APK**. O **PC é a base**: nada do que o jogo faz no computador foi removido, e as plataformas futuras (iOS, desktop, console) herdam essa base.

| Quero… | Faça isto |
|---|---|
| Jogar no PC | Abra `www/index.html` no Chrome/Edge/Firefox (duplo clique) |
| Instalar no Android | Baixe `apk/aurora-cronicas-da-fenda-v30.7.2-android.apk`, abra no celular e permita "instalar apps desconhecidos" |
| Gerar o APK de novo | `npm ci && npm run apk` (precisa de Node 22, JDK 21 e Android SDK; veja abaixo) |
| Trocar a versão do jogo | Substitua `fonte/aurora-046-animacoes.html`, rode `npm run montar` e `npm run apk` |

## O que tem no menu inicial

- **Continuar jornada** com resumo do salvamento (nível do reino, dia, heróis, "salvo há…"); a cidade do jogador aparece ao fundo.
- **Iniciar / Nova jornada** (pede confirmação antes de apagar), **Ambiente de testes** (mundo e salvamento separados).
- **Ajustes**: Áudio · Gráficos (qualidade, nitidez, reduzir movimento, economia de bateria, manter tela ligada) · **Controles** (teclas remapeáveis) · Acessibilidade · Plataforma.
- **Jornada**: importar, compartilhar/baixar arquivo e copiar código do salvamento.
- **Como jogar** (mostra as teclas atuais, inclusive as remapeadas) e **Sair** (só no app).
- Fundo em pixel-art animado (aurora boreal, duas luas, a Fenda no horizonte, vagalumes). Respeita "reduzir movimento" e economia de bateria.
- Navegação por teclado (↑ ↓ Enter), toque e **controle** (D-pad/analógico, A confirma, B volta).

`fonte/` é o jogo (já sem o código morto, ver abaixo) e `ferramentas/montar.mjs` apenas acrescenta, no fim, o menu e a camada de plataforma. O HTML exatamente como foi enviado está no histórico do Git (commit `04dea36`).

## PC como base, plataformas como herança

Tudo que muda entre plataformas fica em dois JSONs, nunca espalhado no código do jogo:

- `config/pc-controles.json` — **fonte da verdade dos controles de PC**: teclado (Espaço, 1·2·3, M, Esc, Tab, Enter, F), mouse (arrastar, roda, clique, segurar para repetir melhoria), toque e controle.
- `config/plataformas.json` — perfis `pc` (base) → `android` (ativo) · `ios`, `desktop`, `console` (planejados). Cada perfil usa `"extends": "pc"` e declara só o que muda; por isso o Android continua aceitando teclado Bluetooth, mouse e controle.

O módulo `modulos/plataforma.js` lê esses arquivos, detecta o perfil (`?perfil=android` força um perfil para testes no PC), guarda as preferências do jogador (`aurora.config.v1`) e as aplica em `G.S.opts` ao iniciar um jogo. Mudanças feitas **dentro** do jogo, em Opções, são espelhadas de volta.

**Para criar uma plataforma nova** (ex.: iOS): (1) acrescente/ajuste o perfil em `config/plataformas.json`; (2) `npx cap add ios && npx cap sync ios`; (3) só se precisar de algo nativo, acrescente um método em `PlataformaPlugin` (Android) ou o equivalente no novo alvo e chame por `Capacitor.Plugins.Plataforma`. Desktop: empacote `www/` com Electron ou Tauri; o perfil `desktop` já é detectado.

## Estrutura

```
fonte/                o jogo (aurora-046-animacoes.html), sem código morto
modulos/              menu-inicial.{js,css} · plataforma.js · render-modos.js · render3d.js
config/               plataformas.json · pc-controles.json · icone.svg
ferramentas/          montar.mjs · gerar-apk.sh · gerar-icones.cjs · gerar-three.mjs
vendor/three.min.js   Three.js tree-shaken, usado só pela vista 3D
verificacao/          harness, robô de simulação e comparador (provas de que nada mudou)
www/index.html        build final (PC e base do app). Gerado, mas versionado
android/              projeto Capacitor (ícones, splash, modo imersivo, plugin "Plataforma")
apk/                  APK compilado
assinatura/           chave de assinatura — NÃO vai para o git
```

## Gerar o APK

```bash
export ANDROID_HOME=/caminho/do/android-sdk      # cmdline-tools + platforms;android-36 + build-tools
npm ci
npm run apk                                       # → apk/aurora-cronicas-da-fenda-v30.7.2-android.apk
```

`npm run verificar` confere se `www/index.html` está em dia com `fonte/` e `modulos/`.
Há também o workflow manual **"Aurora para Android (APK)"** no GitHub Actions (cadastre os segredos descritos no próprio arquivo para um APK assinado com a sua chave).

### Assinatura (importante)

O repositório é público, então a chave **não** está nele. O Android só atualiza um app por cima se o novo APK tiver a **mesma chave** do instalado. Guarde `assinatura/aurora-release.jks` e `assinatura/keystore.properties` em local privado. Se perdê-los, é preciso desinstalar e reinstalar (exporte a jornada antes: *Menu → Jornada*). A cada APK novo, aumente `versionCode` em `android/app/build.gradle`. Sem chave, o build usa a chave de debug.

## Vista 3D (prévia)

Dentro do jogo, o ícone na coluna da esquerda troca entre a vista clássica e uma vista 3D do mesmo mapa — mesmo save, mesmas regras, mesma cidade de outro ângulo. O 2D continua sendo o padrão.

Hoje a prévia desenha **chão, cenário, muralha, casas e prédios** em 3D; heróis, monstros e NPCs ainda são a próxima fase. A inclinação (45°, 55°, 60° ou "De cima") fica em *Ajustes → Gráficos*. Com a câmera "De cima" o 3D põe cada ponto no mesmo pixel do 2D — é assim que os testes provam que o mapa não saiu do lugar.

O Three.js (525 KB) só é lido quando alguém toca no ícone: antes disso ele fica no arquivo como texto, sem custo. Se o aparelho não tiver WebGL, o ícone não aparece. Detalhes, medidas e o que falta: **[PLANO-3D.md](PLANO-3D.md)**.

## Limpeza de código morto

Só saiu o que a análise de escopo (ESLint/acorn) ou a busca por referências provou **sem nenhum uso**:

- variáveis, funções e desestruturações locais que ninguém lê; sobras como `void 0;`, `;` solto, `return;` inútil no fim de função e hooks cujo corpo não faz nada (restos do padrão antigo `const tk0 = G.tick;`);
- o paginador de colunas das folhas (desativado por um `return;` logo no início) com seu CSS, e duas condições `|| true`;
- 49 atribuições `G.x = …`/`UI.x = …` que nenhum código lia, 13 regras CSS idênticas repetidas e 2 fontes embutidas que nenhum CSS usa (22 KB);
- no projeto Android: testes de exemplo do template, dependências de teste, o plugin Haptics (a permissão `VIBRATE`, que a vibração do jogo precisa, foi declarada direto no manifesto), configs que repetiam o valor padrão do Capacitor, linhas duplicadas do `.gitignore`;
- nos módulos novos: API de plataforma que ninguém chamava, variáveis CSS sem uso e a regra que escondia a dica de atalhos por plataforma (agora é `interface.mostrarAtalhos` da config).

**De propósito, ficaram:** ferramentas de diagnóstico e teste do jogo (`*Stats`, `*Test`, `debugBot`, Laboratório), ações `data-a` (podem ser montadas por concatenação de texto), toda a configuração dos perfis de plataforma (inclusive chaves ainda não lidas por código, que valem para plataformas futuras) e o bloco "CADASTRE NOVOS ITENS AQUI" (modelo comentado para criar equipamentos).

Resultado: o jogo ficou 41 KB menor (a maior parte do arquivo é arte embutida); o ganho real é menos ruído e menos trabalho desperdiçado por quadro.

**Como se provou que nada quebrou** (`verificacao/`): 365 capturas determinísticas (relógio virtual + `Math.random` com semente) em PC, celular em paisagem e retrato, com **estado completo do jogo, textos e erros idênticos**; robô de simulação do próprio jogo, 6 cenários × 30 dias, **hashes idênticos**; e **34.203 elementos × 69 telas** com **zero diferença** em todas as propriedades CSS computadas. O próprio jogo original tem uma pequena corrida na geração do retrato dos heróis (1 caractere no PNG, de execução para execução); isso não vem da limpeza.

## O que foi testado — e o que não foi

Testado no Chromium (Playwright): menu em PC, celular em paisagem e retrato; salvamento e cartão "Continuar"; todas as abas de Ajustes; remapeamento de teclas dentro do jogo; ponte de opções (aplica ao jogo e espelha de volta); controle nos menus; tela de recuperação de save corrompido; caminhos nativos com um bridge Capacitor **simulado** (voltar, sair, compartilhar a jornada, tela ligada, salvar ao ir para segundo plano).

APK verificado de forma estática (assinatura v2, alinhamento 16 KB, manifesto, conteúdo idêntico ao `www/`).

**Não foi executado em aparelho ou emulador Android** (o ambiente de build não tem aceleração por hardware). Ficam sem confirmação em campo: o modo imersivo com o notch, o desempenho do jogo no WebView do seu aparelho e a folha de compartilhar do Android.
