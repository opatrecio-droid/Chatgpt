# Aurora — Crônicas da Fenda (PC + Android)

O mesmo jogo em **um só HTML**, agora com um menu inicial novo e empacotado como **APK**. O **PC é a base**: nada do que o jogo faz no computador foi removido, e as plataformas futuras (iOS, desktop, console) herdam essa base.

| Quero… | Faça isto |
|---|---|
| Jogar no PC | Abra `www/index.html` no Chrome/Edge/Firefox (duplo clique) |
| Instalar no Android | Baixe `apk/aurora-cronicas-da-fenda-v30.7.0-android.apk`, abra no celular e permita "instalar apps desconhecidos" |
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

O jogo em si **não foi alterado**: `fonte/` guarda o HTML original e `ferramentas/montar.mjs` apenas acrescenta, no fim, o menu e a camada de plataforma.

## PC como base, plataformas como herança

Tudo que muda entre plataformas fica em dois JSONs, nunca espalhado no código do jogo:

- `config/pc-controles.json` — **fonte da verdade dos controles de PC**: teclado (Espaço, 1·2·3, M, Esc, Tab, Enter, F), mouse (arrastar, roda, clique, segurar para repetir melhoria), toque e controle.
- `config/plataformas.json` — perfis `pc` (base) → `android` (ativo) · `ios`, `desktop`, `console` (planejados). Cada perfil usa `"extends": "pc"` e declara só o que muda; por isso o Android continua aceitando teclado Bluetooth, mouse e controle.

O módulo `modulos/plataforma.js` lê esses arquivos, detecta o perfil (`?perfil=android` força um perfil para testes no PC), guarda as preferências do jogador (`aurora.config.v1`) e as aplica em `G.S.opts` ao iniciar um jogo. Mudanças feitas **dentro** do jogo, em Opções, são espelhadas de volta.

**Para criar uma plataforma nova** (ex.: iOS): (1) acrescente/ajuste o perfil em `config/plataformas.json`; (2) `npx cap add ios && npx cap sync ios`; (3) só se precisar de algo nativo, acrescente um método em `PlataformaPlugin` (Android) ou o equivalente no novo alvo e chame por `Capacitor.Plugins.Plataforma`. Desktop: empacote `www/` com Electron ou Tauri; o perfil `desktop` já é detectado.

## Estrutura

```
fonte/                original intocado (aurora-046-animacoes.html)
modulos/              menu-inicial.{js,css} · plataforma.js
config/               plataformas.json · pc-controles.json · icone.svg
ferramentas/          montar.mjs · gerar-apk.sh · gerar-icones.cjs
www/index.html        build final (PC e base do app). Gerado, mas versionado
android/              projeto Capacitor (ícones, splash, modo imersivo, plugin "Plataforma")
apk/                  APK compilado
assinatura/           chave de assinatura — NÃO vai para o git
```

## Gerar o APK

```bash
export ANDROID_HOME=/caminho/do/android-sdk      # cmdline-tools + platforms;android-36 + build-tools
npm ci
npm run apk                                       # → apk/aurora-cronicas-da-fenda-v30.7.0-android.apk
```

`npm run verificar` confere se `www/index.html` está em dia com `fonte/` e `modulos/`.
Há também o workflow manual **"Aurora para Android (APK)"** no GitHub Actions (cadastre os segredos descritos no próprio arquivo para um APK assinado com a sua chave).

### Assinatura (importante)

O repositório é público, então a chave **não** está nele. O Android só atualiza um app por cima se o novo APK tiver a **mesma chave** do instalado. Guarde `assinatura/aurora-release.jks` e `assinatura/keystore.properties` em local privado. Se perdê-los, é preciso desinstalar e reinstalar (exporte a jornada antes: *Menu → Jornada*). A cada APK novo, aumente `versionCode` em `android/app/build.gradle`. Sem chave, o build usa a chave de debug.

## O que foi testado — e o que não foi

Testado no Chromium (Playwright): menu em PC, celular em paisagem e retrato; salvamento e cartão "Continuar"; todas as abas de Ajustes; remapeamento de teclas dentro do jogo; ponte de opções (aplica ao jogo e espelha de volta); controle nos menus; tela de recuperação de save corrompido; caminhos nativos com um bridge Capacitor **simulado** (voltar, sair, compartilhar a jornada, tela ligada, salvar ao ir para segundo plano).

APK verificado de forma estática (assinatura v2, alinhamento 16 KB, manifesto, conteúdo idêntico ao `www/`).

**Não foi executado em aparelho ou emulador Android** (o ambiente de build não tem aceleração por hardware). Ficam sem confirmação em campo: o modo imersivo com o notch, o desempenho do jogo no WebView do seu aparelho e a folha de compartilhar do Android.
