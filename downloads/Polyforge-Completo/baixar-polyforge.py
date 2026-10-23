#!/usr/bin/env python3
"""Baixa, verifica e extrai a entrega Polyforge em uma unica pasta (Python 3.9+)."""
import argparse
import hashlib
import io
import os
from pathlib import Path, PurePosixPath
import shutil
import stat
import sys
import time
import urllib.request
import zipfile

BASE_URL = "https://media.githubusercontent.com/media/opatrecio-droid/Chatgpt/polyforge-download-2026-10-23/downloads/Polyforge-Completo/"
PARTS = (
    ("polyforge-atualizacao-2026-10-23.part00", 1887436800, "3b1ccb03f5ad918d3eb284ef8c02a7366b692f15ab38ba063299690304bc0118"),
    ("polyforge-atualizacao-2026-10-23.part01", 665778283, "87e63f031d359d4e6e5ddc0c421572e3c7c0af1b8f066893f5cf61bfd56e7c3c"),
)
ZIP_SHA256 = "ae249454235e2ec5c7e68f7d20b37554152634b47b8a8f6ec2244afae3d53932"
CHUNK = 4 * 1024 * 1024


def digest(path):
    result = hashlib.sha256()
    with path.open("rb") as source:
        for data in iter(lambda: source.read(CHUNK), b""):
            result.update(data)
    return result.hexdigest()


def download(name, size, expected, cache):
    destination = cache / name
    if destination.exists():
        if destination.stat().st_size == size and digest(destination) == expected:
            print("Parte ja verificada:", name, flush=True)
            return destination
        raise ValueError("Parte incorreta; remova e tente novamente: " + str(destination))
    partial = destination.with_suffix(destination.suffix + ".incompleto")
    for attempt in range(3):
        try:
            offset = partial.stat().st_size if partial.exists() else 0
            if offset == size:
                if digest(partial) == expected:
                    partial.replace(destination)
                    return destination
                partial.unlink()
                offset = 0
            elif offset > size:
                partial.unlink()
                offset = 0
            request = urllib.request.Request(BASE_URL + name, headers={"User-Agent": "Polyforge-downloader/1.0"})
            if offset:
                request.add_header("Range", "bytes=%d-" % offset)
            with urllib.request.urlopen(request, timeout=90) as response:
                resumed = response.status == 206 and response.headers.get("Content-Range", "").startswith("bytes %d-" % offset)
                if response.status == 206 and not resumed:
                    raise ValueError("Servidor retornou um intervalo inesperado.")
                if not resumed:
                    offset = 0
                with partial.open("ab" if resumed else "wb") as target:
                    last_print = 0.0
                    while True:
                        data = response.read(CHUNK)
                        if not data:
                            break
                        target.write(data)
                        offset += len(data)
                        if offset > size:
                            raise ValueError("Download maior que o tamanho esperado.")
                        if time.monotonic() - last_print > 5:
                            print("%s: %.1f%%" % (name, 100 * offset / size), flush=True)
                            last_print = time.monotonic()
            if partial.stat().st_size != size or digest(partial) != expected:
                if partial.stat().st_size >= size:
                    partial.unlink()
                raise ValueError("Download incompleto ou SHA-256 incorreto: " + name)
            partial.replace(destination)
            return destination
        except (OSError, ValueError) as error:
            if attempt == 2:
                raise
            print("Retomando download:", error, flush=True)
    raise RuntimeError("Download nao concluido.")


class JoinedParts(io.RawIOBase):
    def __init__(self, paths):
        super().__init__()
        self.files = [path.open("rb") for path in paths]
        self.sizes = [path.stat().st_size for path in paths]
        self.length = sum(self.sizes)
        self.position = 0

    def readable(self):
        return True

    def seekable(self):
        return True

    def tell(self):
        return self.position

    def seek(self, offset, whence=os.SEEK_SET):
        position = offset if whence == os.SEEK_SET else self.position + offset if whence == os.SEEK_CUR else self.length + offset if whence == os.SEEK_END else -1
        if position < 0:
            raise ValueError("Posicao invalida no ZIP.")
        self.position = position
        return position

    def read(self, size=-1):
        remaining = max(0, self.length - self.position)
        size = remaining if size is None or size < 0 else min(size, remaining)
        chunks = []
        offset = self.position
        for source, length in zip(self.files, self.sizes):
            if offset >= length:
                offset -= length
                continue
            source.seek(offset)
            data = source.read(min(size, length - offset))
            chunks.append(data)
            size -= len(data)
            self.position += len(data)
            offset = 0
            if not size:
                break
        return b"".join(chunks)

    def close(self):
        for source in self.files:
            source.close()
        super().close()


def extract(paths, destination):
    with JoinedParts(paths) as source, zipfile.ZipFile(source) as archive:
        entries = archive.infolist()
        root = destination.resolve()
        for entry in entries:
            name = PurePosixPath(entry.filename.replace("\\", "/"))
            target = (root / str(name)).resolve()
            if name.is_absolute() or ".." in name.parts or root not in target.parents:
                raise ValueError("Caminho invalido no ZIP: " + entry.filename)
            if stat.S_ISLNK(entry.external_attr >> 16):
                raise ValueError("Link simbolico inesperado: " + entry.filename)
        required = sum(entry.file_size for entry in entries)
        if shutil.disk_usage(root).free < required + 100 * 1024 * 1024:
            raise OSError("Espaco insuficiente para extrair: reserve mais 2,7 GB.")
        for count, entry in enumerate(entries, 1):
            archive.extract(entry, root)
            if count % 1000 == 0:
                print("Extraindo: %d/%d arquivos" % (count, len(entries)), flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--destino", type=Path, default=Path(__file__).resolve().parent / "Polyforge")
    parser.add_argument("--partes", type=Path, help="Pasta onde voce ja baixou as duas partes (opcional)")
    args = parser.parse_args()
    destination = args.destino.resolve()
    if any((destination / name).exists() for name in ("index.html", "audio", "modelos-3d")):
        raise FileExistsError("Destino ja contem uma entrega. Escolha outra pasta com --destino.")
    destination.mkdir(parents=True, exist_ok=True)
    cache = destination / ".download"
    cache.mkdir(exist_ok=True)
    paths = []
    combined = hashlib.sha256()
    for name, size, expected in PARTS:
        candidate = args.partes / name if args.partes else Path(__file__).resolve().parent / name
        if candidate.exists():
            if candidate.stat().st_size != size or digest(candidate) != expected:
                raise ValueError("Parte local incorreta: " + str(candidate))
            path = candidate
        else:
            path = download(name, size, expected, cache)
        with path.open("rb") as source:
            for data in iter(lambda: source.read(CHUNK), b""):
                combined.update(data)
        paths.append(path)
    if combined.hexdigest() != ZIP_SHA256:
        raise ValueError("SHA-256 do pacote completo incorreto.")
    print("Pacote verificado. Extraindo...", flush=True)
    extract(paths, destination)
    shutil.rmtree(cache)
    print("Pronto! Tudo esta em:", destination)
    print("Estudio 3D: index.html | Galeria: artes-animadas.html | Sons: audio/index.html")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, zipfile.BadZipFile) as error:
        sys.exit("Falha: " + str(error))
