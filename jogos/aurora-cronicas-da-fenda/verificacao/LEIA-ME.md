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
