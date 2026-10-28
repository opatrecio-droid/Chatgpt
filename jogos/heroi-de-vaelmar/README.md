# Herói de Vaelmar (Aethric offline)

Reconstrução offline e independente de **Hero of Aethric**, da Northern Forge Studios. Não tem afiliação oficial. O estado atual e as diferenças em relação ao original estão em [AUDITORIA-FIDELIDADE.md](AUDITORIA-FIDELIDADE.md).

## Estrutura

| Pasta | Conteúdo | No git |
|---|---|---|
| `src/` | HTML, CSS e JavaScript do jogo (`jogo.js` é o motor; `style-*.css` são os estilos; `manifesto.json` dá a ordem de montagem) | sim |
| `dados/` | Catálogo do Codex (`aethric-data.js`) e as imagens/fontes que o jogo embute (`assets/`) | não |
| `tools/` | `extrair.py` e `montar.py` | sim |
| `tests/` | Capturas de tela e testes no Chromium | sim |
| `dist/` | `game.html` montado (~25 MB, arquivo único e offline) | não |

`dados/` fica fora do git porque são imagens e textos do Codex da Northern Forge. Eles saem do APK que você já tem.

## Como trabalhar

```bash
# 1. Uma vez: separar o APK 4.4.0 em código (src/) e dados (dados/)
python3 tools/extrair.py Heroi-de-Vaelmar-Offline-4.4.0.apk

# 2. Montar o jogo (dist/game.html)
python3 tools/montar.py

# 3. Capturas de todas as telas principais, em tests/saida/
node tests/capturas.js minha-versao
```

A extração só termina se o HTML remontado for idêntico, byte a byte, ao original. Depois dela, edite apenas `src/`.

## Requisitos

Python 3, Node com Playwright e Chromium (para as capturas).
