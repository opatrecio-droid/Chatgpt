# Polyforge — entrega reunida em uma pasta

Atualização de 23/10/2026. O pacote reúne os modelos e artes já entregues, os estúdios HTML e a nova biblioteca com **10.000 arquivos de áudio** categorizados. Os alvos de 10.000 artes por dimensão ainda não foram concluídos.

## Baixar tudo

O pacote tem **2.553.215.083 bytes (2,55 GB)**. Ele está dividido em duas partes para distribuição no GitHub. São pedaços do mesmo ZIP: extraí-los individualmente não funciona.

- [Parte 1 — 1,89 GB](https://media.githubusercontent.com/media/opatrecio-droid/Chatgpt/polyforge-download-2026-10-23/downloads/Polyforge-Completo/polyforge-atualizacao-2026-10-23.part00)
- [Parte 2 — 666 MB](https://media.githubusercontent.com/media/opatrecio-droid/Chatgpt/polyforge-download-2026-10-23/downloads/Polyforge-Completo/polyforge-atualizacao-2026-10-23.part01)
- [Instalador em Python — baixar, verificar e extrair automaticamente](https://raw.githubusercontent.com/opatrecio-droid/Chatgpt/polyforge-download-2026-10-23/downloads/Polyforge-Completo/baixar-polyforge.py)
- [Hashes SHA-256](SHA256SUMS.txt)

### Opção automática

Baixe `baixar-polyforge.py`. Com Python 3.9 ou mais recente instalado, execute:

```sh
python baixar-polyforge.py
```

No Windows também pode usar `py -3 baixar-polyforge.py`; no macOS/Linux, `python3 baixar-polyforge.py`. O programa baixa as duas partes, verifica seus hashes e extrai tudo em **uma única pasta `Polyforge/`**, ao lado do instalador. Reserve 5,3 GB livres durante a instalação. As partes baixadas pelo instalador são removidas depois da extração. Partes já baixadas na mesma pasta do instalador são reaproveitadas e preservadas.

### Opção manual

Baixe as duas partes na mesma pasta. Una-as em um ZIP:

Windows — Prompt de Comando:

```bat
copy /b polyforge-atualizacao-2026-10-23.part00+polyforge-atualizacao-2026-10-23.part01 polyforge-atualizacao-2026-10-23.zip
```

macOS/Linux:

```sh
cat polyforge-atualizacao-2026-10-23.part00 polyforge-atualizacao-2026-10-23.part01 > polyforge-atualizacao-2026-10-23.zip
```

Extraia o ZIP **dentro de uma pasta chamada `Polyforge`**. Não use o botão “Code → Download ZIP” do repositório: esta entrega usa Git LFS e os links acima são os arquivos completos.

## Abrir os estúdios

- `Polyforge/index.html` — estúdio 3D.
- `Polyforge/artes-animadas.html` — galeria de artes animadas.
- `Polyforge/audio/index.html` — testar sons. Carregue `audio/catalog.json` e selecione `audio/assets/` quando solicitado.
- `Polyforge/modelos-3d/` — modelos GLB originais.
- `Polyforge/artes-2d/` e `Polyforge/artes-2.5d/` — artes e metadados.

Os modelos e as artes são a coleção já entregue anteriormente: 3.035 GLBs, 3.035 sprites 2.5D estáticos, 1.977 bases animadas 2D e 1.764 bases animadas 2.5D. Animações procedurais e renderizações do mesmo modelo não devem ser somadas como novos modelos únicos. A auditoria perceptual final de todo o lote 2.5D permanece pendente, conforme os documentos internos.

Os 10.000 áudios foram decodificados e verificados: não há duplicatas exatas por SHA-256 dos arquivos nem do PCM normalizado. Isso não garante ausência de versões editadas ou sonoramente parecidas. A categoria de música contém sobretudo trechos de instrumentos e jingles. Fontes, autores, licenças e atribuições estão nos catálogos e em `audio/ATRIBUICOES.csv`; os itens CC BY exigem crédito.

SHA-256 do ZIP após juntar as partes:

`ae249454235e2ec5c7e68f7d20b37554152634b47b8a8f6ec2244afae3d53932`
