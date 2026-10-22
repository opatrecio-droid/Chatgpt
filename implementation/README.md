# Código do PolyForge

`src/web-models.js` e `src/biome-worlds.js` implementam o estúdio offline. `scripts/build-web-studio.py` constrói um HTML autossuficiente a partir de um catálogo de GLBs. `scripts/extract-portable-assets.py` recupera os GLBs do HTML e confere SHA-256; execute `python scripts/extract-portable-assets.py --help` para o uso.

O manifesto do lote 001 está em `assets/scale-deliveries/lote-001.catalog.json`. Os GLBs brutos não são armazenados neste repositório; os bytes dos modelos ficam incorporados no HTML distribuído.
