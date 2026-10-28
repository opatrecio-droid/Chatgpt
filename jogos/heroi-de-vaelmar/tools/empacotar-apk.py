#!/usr/bin/env python3
"""Gera o APK do Herói de Vaelmar a partir do dist/game.html e de um APK base.

O APK base (o 4.4.0 que você já tem) fornece o código nativo (classes.dex), os recursos e o
manifesto. Este script troca assets/game.html, atualiza versão, nome do app e identificador do
pacote (para instalar AO LADO da versão antiga, sem desinstalar nem perder o progresso) e assina
com v1+v2+v3. A chave de assinatura 4.4.0 não é conhecida, então a assinatura é nova.

  python3 tools/empacotar-apk.py Heroi-de-Vaelmar-Offline-4.4.0.apk --versao 5.4.0 --codigo 50400

Requer Java (javac) e baixa o apksig do Google Maven na primeira execução.
"""
import argparse, io, re, shutil, struct, subprocess, sys, urllib.request, zipfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
JAVA = RAIZ / 'tools' / 'java'
APKSIG = JAVA / 'apksig.jar'
APKSIG_URL = 'https://dl.google.com/dl/android/maven2/com/android/tools/build/apksig/8.5.0/apksig-8.5.0.jar'
CHAVE = RAIZ / 'tools' / 'chave-debug' / 'vaelmar-debug.jks'
UTF8 = 0x100


# ---------- pool de strings (manifesto binário e resources.arsc) ----------
def ler_pool(d: bytes, off: int):
    tipo, hs, size, n, ns, flags, s0, st0 = struct.unpack_from('<HHIIIIII', d, off)
    assert tipo == 1 and ns == 0, 'pool com estilos não suportado'
    offs = struct.unpack_from(f'<{n}I', d, off + hs)
    out = []
    for o in offs:
        p = off + s0 + o
        if flags & UTF8:
            l = d[p]; p += 1
            if l & 0x80: p += 1
            l2 = d[p]; p += 1
            if l2 & 0x80: l2 = ((l2 & 0x7f) << 8) | d[p]; p += 1
            out.append(d[p:p + l2].decode('utf-8'))
        else:
            l = struct.unpack_from('<H', d, p)[0]; p += 2
            out.append(d[p:p + l * 2].decode('utf-16le'))
    return out, flags, size


def escrever_pool(strs, flags) -> bytes:
    dados = bytearray(); offs = []
    for s in strs:
        offs.append(len(dados))
        if flags & UTF8:
            b = s.encode('utf-8'); ul = len(s.encode('utf-16le')) // 2
            dados += (bytes([ul]) if ul < 128 else bytes([0x80 | (ul >> 8), ul & 255]))
            dados += (bytes([len(b)]) if len(b) < 128 else bytes([0x80 | (len(b) >> 8), len(b) & 255]))
            dados += b + b'\0'
        else:
            u = s.encode('utf-16le'); dados += struct.pack('<H', len(s)) + u + b'\0\0'
    while len(dados) % 4: dados += b'\0'
    hs = 28; s0 = hs + 4 * len(strs)
    cab = struct.pack('<HHIIIIII', 1, hs, s0 + len(dados), len(strs), 0, flags, s0, 0)
    return cab + b''.join(struct.pack('<I', o) for o in offs) + bytes(dados)


def trocar_strings(d: bytes, off: int, mapa: dict[str, str]) -> bytes:
    strs, flags, size = ler_pool(d, off)
    novos = [mapa.get(s, s) for s in strs]
    assert any(a != b for a, b in zip(strs, novos)), f'nenhuma string trocada em {mapa}'
    return d[:off] + escrever_pool(novos, flags) + d[off + size:]


def patch_manifesto(d: bytes, pacote_novo: str, pacote_velho: str, versao: str, versao_velha: str, codigo: int, codigo_velho: int) -> bytes:
    d = trocar_strings(d, 8, {pacote_velho: pacote_novo, '.MainActivity': pacote_velho + '.MainActivity', versao_velha: versao})
    alvo = struct.pack('<I', codigo_velho)
    assert d.count(alvo) == 1, 'versionCode não encontrado de forma única'
    d = d.replace(alvo, struct.pack('<I', codigo))
    return d[:4] + struct.pack('<I', len(d)) + d[8:]


def patch_arsc(d: bytes, nome_velho: str, nome_novo: str, pacote_velho: str, pacote_novo: str) -> bytes:
    d = trocar_strings(d, 12, {nome_velho: nome_novo})
    campo = pacote_velho.encode('utf-16le'); novo = pacote_novo.encode('utf-16le')
    i = d.find(campo); assert i > 0, 'nome do pacote não encontrado no arsc'
    assert d[i + len(campo):i + len(novo)] == b'\0' * (len(novo) - len(campo)), 'campo do pacote sem espaço livre'
    d = d[:i] + novo + d[i + len(novo):]  # o campo tem tamanho fixo (128 caracteres): sobrescreve sem deslocar nada
    return d[:4] + struct.pack('<I', len(d)) + d[8:]


# ---------- zip alinhado ----------
def zip_alinhado(destino: Path, itens: list[tuple[str, bytes, bool]]):
    """itens: (nome, bytes, armazenar_sem_compressao). Entradas sem compressão ficam alinhadas em 4 bytes."""
    with zipfile.ZipFile(destino, 'w') as z:
        for nome, dados, guardar in itens:
            zi = zipfile.ZipInfo(nome, (1980, 1, 1, 0, 0, 0)); zi.external_attr = 0o600 << 16
            if guardar:
                zi.compress_type = zipfile.ZIP_STORED
                resto = (-(z.fp.tell() + 30 + len(nome.encode()))) % 4
                if resto:  # campo extra (id 0xD935, como o zipalign) com 4 bytes de cabeçalho + preenchimento
                    zi.extra = struct.pack('<HH', 0xD935, resto) + b'\0' * resto
            else:
                zi.compress_type = zipfile.ZIP_DEFLATED
            z.writestr(zi, dados)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('base', type=Path, help='APK base (4.4.0)')
    ap.add_argument('--html', type=Path, default=RAIZ / 'dist' / 'game.html')
    ap.add_argument('--versao', default='5.4.0'); ap.add_argument('--codigo', type=int, default=50400)
    ap.add_argument('--pacote', default='com.vaelmar.offline5'); ap.add_argument('--nome', default='Herói de Vaelmar 5')
    ap.add_argument('--saida', type=Path, default=RAIZ / 'dist' / 'Heroi-de-Vaelmar-Offline-5.4.0.apk')
    ap.add_argument('--chave', type=Path, default=CHAVE); ap.add_argument('--senha', default='vaelmar')
    ap.add_argument('--docs', nargs='*', type=Path, default=[])
    a = ap.parse_args()

    base = zipfile.ZipFile(a.base)
    manifesto = base.read('AndroidManifest.xml'); arsc = base.read('resources.arsc')
    strs, _, _ = ler_pool(manifesto, 8)
    velho = 'com.vaelmar.offline'; assert velho in strs
    versao_velha = next(s for s in strs if re.fullmatch(r'\d+\.\d+\.\d+', s))
    cod_velho = struct.unpack('<I', manifesto[manifesto.index(struct.pack('<I', 40400)):][:4])[0] if struct.pack('<I', 40400) in manifesto else None
    assert cod_velho, 'versionCode 40400 esperado no APK base'
    nome_velho = next(s for s in ler_pool(arsc, 12)[0] if s.endswith('de Vaelmar'))
    manifesto = patch_manifesto(manifesto, a.pacote, velho, a.versao, versao_velha, a.codigo, cod_velho)
    arsc = patch_arsc(arsc, nome_velho, a.nome, velho, a.pacote)

    itens = [('AndroidManifest.xml', manifesto, False), ('resources.arsc', arsc, True), ('res/drawable/ic_launcher.xml', base.read('res/drawable/ic_launcher.xml'), False),
             ('assets/game.html', a.html.read_bytes(), False)]
    for d in a.docs: itens.append(('assets/' + d.name, d.read_bytes(), False))
    itens.append(('classes.dex', base.read('classes.dex'), False))

    a.saida.parent.mkdir(parents=True, exist_ok=True)
    nao_assinado = a.saida.with_suffix('.nao-assinado.apk'); zip_alinhado(nao_assinado, itens)

    if not APKSIG.exists():
        print('baixando apksig…'); APKSIG.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(APKSIG_URL, APKSIG)
    if not (JAVA / 'Assinar.class').exists(): subprocess.run(['javac', '-cp', str(APKSIG), str(JAVA / 'Assinar.java')], check=True)
    if not a.chave.exists():
        a.chave.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(['keytool', '-genkeypair', '-keystore', str(a.chave), '-storepass', a.senha, '-keypass', a.senha, '-alias', 'vaelmar', '-keyalg', 'RSA', '-keysize', '2048',
                        '-validity', '36500', '-dname', 'CN=Heroi de Vaelmar (chave de teste), O=Offline, C=BR'], check=True)
    cp = f'{APKSIG}:{JAVA}'
    subprocess.run(['java', '-cp', cp, 'Assinar', 'assinar', str(nao_assinado), str(a.saida), str(a.chave), a.senha, 'vaelmar'], check=True)
    subprocess.run(['java', '-cp', cp, 'Assinar', 'verificar', str(a.saida)], check=True)
    nao_assinado.unlink()
    print(f'{a.saida} ({a.saida.stat().st_size:,} bytes) · pacote {a.pacote} · versão {a.versao} ({a.codigo})')


if __name__ == '__main__':
    main()
