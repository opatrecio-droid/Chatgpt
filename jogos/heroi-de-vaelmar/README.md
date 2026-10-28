# Herói de Vaelmar (Aethric offline)

Reconstrução offline e independente de **Hero of Aethric**, da Northern Forge Studios. Não tem afiliação oficial. O estado atual e as diferenças em relação ao original estão em [AUDITORIA-FIDELIDADE.md](AUDITORIA-FIDELIDADE.md).

## Estrutura

| Pasta | Conteúdo | No git |
|---|---|---|
| `src/` | HTML, CSS e JavaScript do jogo. `jogo.js` é o motor herdado; `batalha`, `classes`, `classes-detalhe`, `textos-habilidades`, `mundo`, `vilas`, `hud`, `regras`, `mapa` e `opcoes` (`.js`/`.css`) são as camadas da versão 5; `manifesto.json` dá a ordem de montagem | sim |
| `dados/` | Catálogo do Codex (`aethric-data.js`) e as imagens/fontes que o jogo embute (`assets/`) | não |
| `tools/` | `extrair.py`, `montar.py` e `empacotar-apk.py` | sim |
| `tests/` | Capturas de tela e testes no Chromium | sim |
| `dist/` | `game.html` montado (~25 MB, arquivo único e offline) e o APK | não |

`dados/` fica fora do git porque são imagens e textos do Codex da Northern Forge. Eles saem do APK que você já tem.

## Como trabalhar

```bash
# 1. Uma vez: separar o APK 4.4.0 em código (src/) e dados (dados/)
python3 tools/extrair.py Heroi-de-Vaelmar-Offline-4.4.0.apk

# 2. Montar o jogo (dist/game.html)
python3 tools/montar.py

# 3. Testes (Chromium sem rede). Capturas ficam em tests/saida/
export NODE_PATH=$(npm root -g)
node tests/capturas.js minha-versao        # todas as telas principais
node tests/combate-vitoria.js              # partida completa até a vitória
node tests/classes-caminhos.js             # os três caminhos de classe
node tests/classes-detalhe.js              # modal da classe, páginas e desbloqueio segurando
node tests/mundo-regras.js                 # avisos do mundo e obstáculos
node tests/migracao.js game-antigo.html    # save da versão antiga abre na nova

# 4. APK (usa o 4.4.0 como base; instala ao lado dele, com outro pacote)
python3 tools/empacotar-apk.py Heroi-de-Vaelmar-Offline-4.4.0.apk --docs ATUALIZACAO-v5.1.md
```

A extração só termina se o HTML remontado for idêntico, byte a byte, ao original. Depois dela, edite apenas `src/`.

## Documentos

- [ATUALIZACAO-v5.1.md](ATUALIZACAO-v5.1.md) e [ATUALIZACAO-v5.0.md](ATUALIZACAO-v5.0.md): o que mudou, o que continua diferente, como instalar.
- [ESPECIFICACAO-TELAS.md](ESPECIFICACAO-TELAS.md): cada tela do original, como aparece no vídeo de referência.
- [AUDITORIA-FIDELIDADE.md](AUDITORIA-FIDELIDADE.md): comparação com o original, com o nível de certeza de cada linha.

## Requisitos

Python 3, Node com Playwright e Chromium (testes), Java com `javac` e `keytool` (APK).
