# Verificação de regressão

Provas de que uma mudança no jogo não alterou o comportamento. Precisam de Node 22 e Playwright (`npm i -D playwright`).

```bash
# 1) antes de mexer: gere a referência
node verificacao/harness.cjs file://$PWD/www/index.html antes.json completo
node verificacao/bot.cjs     file://$PWD/www/index.html bot-antes.json 30
# 2) mexa, rode `npm run montar`, e repita com outros nomes
node verificacao/harness.cjs file://$PWD/www/index.html depois.json completo
node verificacao/bot.cjs     file://$PWD/www/index.html bot-depois.json 30
# 3) compare
node verificacao/compara.cjs antes.json depois.json      # estado, texto, erros e layout idênticos?
```

- **harness.cjs** roda o jogo com um relógio virtual (`vclock.js`: timers, `requestAnimationFrame`, `Date`, `performance.now` e `Math.random` controlados), de modo que duas execuções do mesmo build dão exatamente o mesmo estado. Percorre o menu, uma partida nova, todas as folhas do jogo, todas as ações da interface (`UI.ACT`), salvar/recarregar/continuar, em PC, celular em paisagem e em retrato (~366 capturas, ~10 min).
- **bot.cjs** usa o robô de ensaio do próprio jogo para simular 30 dias em 6 cenários e compara o resultado (menos o campo `elapsedMs`).
- Diferenças só de pixel (`shot`) ou cor (`fpc`) são "leves": dependem de decodificação de imagem e animações CSS em tempo real. Mudanças de estado, texto, erros ou layout são "duras".

## Testes do 3D e da plataforma

Rodam sobre `www/index.html` por padrão (ou passe outro `file://…` como primeiro argumento) e saem com código 1 se algum teste falhar.

```bash
node verificacao/teste-3d.cjs          # 17 testes, ~30 s: carga sob demanda, fidelidade a 90° (0,00 px), toque, sprites por entidade, qualidade Econômica, volta ao 2D
node verificacao/teste-menu.cjs        # 14 testes: menu inicial, Ajustes, teclas remapeadas, ponte de opções, Continuar (capturas em /tmp/aurora-teste-menu)
node verificacao/teste-nativo.cjs      # 15 testes: caminhos do Android com um Capacitor simulado (voltar, sair, compartilhar, tela ligada)
node verificacao/teste-controle.cjs    # 6 testes: controle nos menus
node verificacao/desempenho-3d.cjs     # ~1 min: fps do 2D e do 3D num celular simulado e o tempo de cada etapa do 3D
```

- **desempenho-3d.cjs** emula um celular (390×844, tela 3×, CPU 6× mais lenta). Sem GPU, o WebGL roda por software: use o resultado para comparar antes e depois de uma mudança, nunca como estimativa do aparelho. A rede de segurança do 3D fica desligada durante a medida, porque neste perfil lento ela voltaria ao 2D no meio.
